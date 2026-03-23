import { useState, useCallback } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Download, AlertTriangle, CheckCircle, XCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface ColumnMapping {
  csvHeader: string;
  dbField: string;
  required?: boolean;
  transform?: (value: string) => any;
}

export interface ImportConfig {
  title: string;
  tableName: string;
  columns: ColumnMapping[];
  templateHeaders: string[];
  templateSampleRows: string[][];
  templateFileName: string;
  schoolIdField?: string;
  duplicateCheckField?: string;
  /** Called before inserting to resolve lookups like class names → IDs */
  preProcess?: (rows: Record<string, any>[], schoolId: string) => Promise<Record<string, any>[]>;
  /** Called after successful import */
  onSuccess?: () => void;
}

interface ParsedRow {
  data: Record<string, any>;
  errors: string[];
  rowIndex: number;
}

interface ImportSummary {
  imported: number;
  skipped: number;
  errors: number;
}

interface CSVImporterProps {
  config: ImportConfig;
  schoolId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CSVImporter = ({ config, schoolId, open, onOpenChange }: CSVImporterProps) => {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [importing, setImporting] = useState(false);

  const resetState = () => {
    setStep("upload");
    setParsedRows([]);
    setSummary(null);
    setImporting(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const downloadTemplate = () => {
    const csvContent = [
      config.templateHeaders.join(","),
      ...config.templateSampleRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = config.templateFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        if (results.data.length > 500) {
          toast.error("Maximum 500 rows allowed per import");
          return;
        }

        const rows: ParsedRow[] = (results.data as Record<string, string>[]).map((row, index) => {
          const errors: string[] = [];
          const mapped: Record<string, any> = {};

          config.columns.forEach(col => {
            const rawValue = row[col.csvHeader]?.trim() || "";
            if (col.required && !rawValue) {
              errors.push(`${col.csvHeader} is required`);
            }
            mapped[col.dbField] = col.transform ? col.transform(rawValue) : (rawValue || null);
          });

          return { data: mapped, errors, rowIndex: index + 2 };
        });

        setParsedRows(rows);
        setStep("preview");
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`);
      }
    });

    // Reset file input
    e.target.value = "";
  }, [config]);

  const handleImport = async () => {
    setImporting(true);
    setStep("importing");

    const validRows = parsedRows.filter(r => r.errors.length === 0);
    const skipped = parsedRows.length - validRows.length;

    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      setStep("preview");
      setImporting(false);
      return;
    }

    try {
      let rowsToInsert = validRows.map(r => ({
        ...r.data,
        [config.schoolIdField || "school_id"]: schoolId,
      }));

      // Run pre-processing (e.g., class name resolution)
      if (config.preProcess) {
        rowsToInsert = await config.preProcess(rowsToInsert, schoolId);
      }

      // Check for duplicates if configured
      let duplicateCount = 0;
      if (config.duplicateCheckField) {
        const values = rowsToInsert
          .map(r => r[config.duplicateCheckField!])
          .filter(Boolean);

        if (values.length > 0) {
          const { data: existing } = await supabase
            .from(config.tableName as any)
            .select(config.duplicateCheckField)
            .eq("school_id", schoolId)
            .in(config.duplicateCheckField, values);

          if (existing && existing.length > 0) {
            const existingValues = new Set(existing.map((e: any) => e[config.duplicateCheckField!]?.toLowerCase()));
            const beforeCount = rowsToInsert.length;
            rowsToInsert = rowsToInsert.filter(r => {
              const val = r[config.duplicateCheckField!]?.toLowerCase();
              return !val || !existingValues.has(val);
            });
            duplicateCount = beforeCount - rowsToInsert.length;
          }
        }
      }

      // Batch insert in chunks of 50
      let importedCount = 0;
      const chunkSize = 50;
      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize);
        const { error } = await supabase
          .from(config.tableName as any)
          .insert(chunk as any);

        if (error) {
          console.error("Batch insert error:", error);
          throw error;
        }
        importedCount += chunk.length;
      }

      const result: ImportSummary = {
        imported: importedCount,
        skipped: skipped + duplicateCount,
        errors: parsedRows.filter(r => r.errors.length > 0).length,
      };

      setSummary(result);
      setStep("done");
      config.onSuccess?.();
      toast.success(`Successfully imported ${importedCount} records`);
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import data");
      setStep("preview");
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.errors.length === 0).length;
  const errorCount = parsedRows.filter(r => r.errors.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import records
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="border-2 border-dashed rounded-lg p-8 text-center w-full">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with the correct column headers
              </p>
              <label>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button variant="outline" asChild>
                  <span>Choose CSV File</span>
                </Button>
              </label>
            </div>
            <Button variant="ghost" onClick={downloadTemplate} className="text-primary">
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          </div>
        )}

        {step === "preview" && (
          <>
            <div className="flex items-center gap-4 mb-2">
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                {validCount} valid
              </Badge>
              {errorCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  {errorCount} errors
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Total: {parsedRows.length} rows
              </span>
            </div>
            <ScrollArea className="flex-1 max-h-[50vh] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead className="w-16">Status</TableHead>
                    {config.columns.slice(0, 5).map(col => (
                      <TableHead key={col.dbField}>{col.csvHeader}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, idx) => (
                    <TableRow key={idx} className={row.errors.length > 0 ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs">{row.rowIndex}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 ? (
                          <span title={row.errors.join(", ")}>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          </span>
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </TableCell>
                      {config.columns.slice(0, 5).map(col => (
                        <TableCell key={col.dbField} className="text-sm max-w-[150px] truncate">
                          {String(row.data[col.dbField] || "-")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={resetState}>Back</Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} Records
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <p className="text-muted-foreground">Importing records...</p>
          </div>
        )}

        {step === "done" && summary && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <h3 className="text-lg font-semibold">Import Complete</h3>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{summary.imported}</p>
                <p className="text-sm text-muted-foreground">Imported</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{summary.skipped}</p>
                <p className="text-sm text-muted-foreground">Skipped</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{summary.errors}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CSVImporter;
