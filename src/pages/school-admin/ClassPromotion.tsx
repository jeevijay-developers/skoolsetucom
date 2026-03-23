import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ClassInfo {
  id: string;
  name: string;
  section: string | null;
  academic_year: string;
}

interface StudentRow {
  id: string;
  full_name: string;
  roll_number: string | null;
  class_id: string | null;
}

const ClassPromotion = () => {
  const { schoolId, user } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [fromClassId, setFromClassId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detainedIds, setDetainedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [academicYearFrom, setAcademicYearFrom] = useState("2024-25");
  const [academicYearTo, setAcademicYearTo] = useState("2025-26");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (schoolId) fetchClasses();
  }, [schoolId]);

  useEffect(() => {
    if (fromClassId) fetchStudents();
  }, [fromClassId]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name, section, academic_year")
      .eq("school_id", schoolId!)
      .order("name");
    setClasses(data || []);
  };

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select("id, full_name, roll_number, class_id")
      .eq("school_id", schoolId!)
      .eq("class_id", fromClassId)
      .eq("is_active", true)
      .order("full_name");
    setStudents(data || []);
    setSelectedIds(new Set((data || []).map(s => s.id)));
    setDetainedIds(new Set());
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    // If unselecting, also remove from detained
    if (!next.has(id)) {
      const d = new Set(detainedIds);
      d.delete(id);
      setDetainedIds(d);
    }
  };

  const toggleDetain = (id: string) => {
    const next = new Set(detainedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDetainedIds(next);
  };

  const selectAll = () => {
    setSelectedIds(new Set(students.map(s => s.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
    setDetainedIds(new Set());
  };

  const handlePromote = async () => {
    if (!toClassId) {
      toast.error("Please select target class");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("No students selected");
      return;
    }

    setPromoting(true);
    try {
      const promotedStudents = students.filter(s => selectedIds.has(s.id) && !detainedIds.has(s.id));
      const detainedStudents = students.filter(s => selectedIds.has(s.id) && detainedIds.has(s.id));

      // Promote students - update class_id
      if (promotedStudents.length > 0) {
        const { error } = await supabase
          .from("students")
          .update({ class_id: toClassId })
          .in("id", promotedStudents.map(s => s.id));
        if (error) throw error;

        // Insert promotion records
        const promoRecords = promotedStudents.map(s => ({
          school_id: schoolId!,
          student_id: s.id,
          from_class_id: fromClassId,
          to_class_id: toClassId,
          academic_year_from: academicYearFrom,
          academic_year_to: academicYearTo,
          promotion_type: "promoted",
          remarks: remarks || null,
          promoted_by: user?.id || null,
        }));

        await supabase.from("student_promotions").insert(promoRecords);
      }

      // Record detained students
      if (detainedStudents.length > 0) {
        const detainRecords = detainedStudents.map(s => ({
          school_id: schoolId!,
          student_id: s.id,
          from_class_id: fromClassId,
          to_class_id: fromClassId,
          academic_year_from: academicYearFrom,
          academic_year_to: academicYearTo,
          promotion_type: "detained",
          remarks: remarks || null,
          promoted_by: user?.id || null,
        }));

        await supabase.from("student_promotions").insert(detainRecords);
      }

      toast.success(`${promotedStudents.length} promoted, ${detainedStudents.length} detained`);
      setConfirmOpen(false);
      setFromClassId("");
      setStudents([]);
      setSelectedIds(new Set());
      setDetainedIds(new Set());
    } catch (error: any) {
      console.error("Promotion error:", error);
      toast.error(error.message || "Failed to promote students");
    } finally {
      setPromoting(false);
    }
  };

  const fromClass = classes.find(c => c.id === fromClassId);
  const toClass = classes.find(c => c.id === toClassId);
  const promotedCount = [...selectedIds].filter(id => !detainedIds.has(id)).length;
  const detainedCount = detainedIds.size;

  return (
    <>
      <Helmet>
        <title>Class Promotion - SkoolSetu</title>
      </Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Class Promotion</h1>
            <p className="text-muted-foreground">Promote students to the next class for the new academic year</p>
          </div>

          {/* Config */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Promotion Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>From Class</Label>
                  <Select value={fromClassId} onValueChange={setFromClassId}>
                    <SelectTrigger><SelectValue placeholder="Select source class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.section ? ` - ${c.section}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Class</Label>
                  <Select value={toClassId} onValueChange={setToClassId}>
                    <SelectTrigger><SelectValue placeholder="Select target class" /></SelectTrigger>
                    <SelectContent>
                      {classes.filter(c => c.id !== fromClassId).map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.section ? ` - ${c.section}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>From Academic Year</Label>
                  <Input value={academicYearFrom} onChange={e => setAcademicYearFrom(e.target.value)} placeholder="2024-25" />
                </div>
                <div className="space-y-2">
                  <Label>To Academic Year</Label>
                  <Input value={academicYearTo} onChange={e => setAcademicYearTo(e.target.value)} placeholder="2025-26" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          {fromClassId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Students in {fromClass?.name}{fromClass?.section ? ` - ${fromClass.section}` : ""}
                    </CardTitle>
                    <CardDescription>{students.length} students found</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading students...</p>
                ) : students.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No active students in this class</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Select</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Roll No</TableHead>
                          <TableHead className="w-24">Detain</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map(s => (
                          <TableRow key={s.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(s.id)}
                                onCheckedChange={() => toggleSelect(s.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{s.full_name}</TableCell>
                            <TableCell>{s.roll_number || "—"}</TableCell>
                            <TableCell>
                              <Checkbox
                                checked={detainedIds.has(s.id)}
                                onCheckedChange={() => toggleDetain(s.id)}
                                disabled={!selectedIds.has(s.id)}
                              />
                            </TableCell>
                            <TableCell>
                              {!selectedIds.has(s.id) ? (
                                <Badge variant="secondary">Skipped</Badge>
                              ) : detainedIds.has(s.id) ? (
                                <Badge variant="destructive">Detained</Badge>
                              ) : (
                                <Badge variant="default">Promote</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Summary & Promote Button */}
                    <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-primary" /> {promotedCount} to promote
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-destructive" /> {detainedCount} to detain
                        </span>
                      </div>
                      <Button
                        onClick={() => setConfirmOpen(true)}
                        disabled={!toClassId || selectedIds.size === 0}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Proceed with Promotion
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Promotion</DialogTitle>
              <DialogDescription>
                This action will move students to a new class. This can be reversed manually.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">From:</span>
                {fromClass?.name}{fromClass?.section ? ` - ${fromClass.section}` : ""} ({academicYearFrom})
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">To:</span>
                {toClass?.name}{toClass?.section ? ` - ${toClass.section}` : ""} ({academicYearTo})
              </div>
              <div className="flex gap-4 text-sm">
                <Badge variant="default">{promotedCount} Promoted</Badge>
                {detainedCount > 0 && <Badge variant="destructive">{detainedCount} Detained</Badge>}
              </div>
              <div className="space-y-2">
                <Label>Remarks (optional)</Label>
                <Textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Any notes about this promotion..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={handlePromote} disabled={promoting}>
                {promoting ? "Processing..." : "Confirm Promotion"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
};

export default ClassPromotion;
