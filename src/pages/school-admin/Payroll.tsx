import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, DollarSign, Calendar, CheckCircle, Clock, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { exportToCSV, formatPayrollForExport } from "@/utils/exportUtils";

interface Employee {
  id: string;
  full_name: string;
  category: string;
  base_salary: number;
}

interface PayrollRecord {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: string;
  paid_at: string | null;
  employee?: Employee;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const Payroll = () => {
  const { schoolId } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (schoolId) {
      fetchEmployees();
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId && employees.length > 0) {
      fetchPayroll();
    }
  }, [schoolId, employees, selectedMonth, selectedYear]);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, full_name, category, base_salary")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("full_name");
    setEmployees(data || []);
    setLoading(false);
  };

  const fetchPayroll = async () => {
    const { data } = await supabase
      .from("payroll")
      .select("*")
      .eq("school_id", schoolId)
      .eq("month", selectedMonth)
      .eq("year", selectedYear)
      .order("created_at", { ascending: false });

    const records = (data || []).map(record => ({
      ...record,
      employee: employees.find(e => e.id === record.employee_id),
    }));

    setPayroll(records);
  };

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    try {
      // Check if payroll already exists for this month
      const { data: existing } = await supabase
        .from("payroll")
        .select("id")
        .eq("school_id", schoolId)
        .eq("month", selectedMonth)
        .eq("year", selectedYear);

      if (existing && existing.length > 0) {
        toast.error("Payroll already exists for this month");
        setGenerating(false);
        return;
      }

      // Generate payroll for all active employees
      const payrollEntries = employees.map(emp => ({
        school_id: schoolId!,
        employee_id: emp.id,
        month: selectedMonth,
        year: selectedYear,
        basic_salary: emp.base_salary,
        allowances: 0,
        deductions: 0,
        net_salary: emp.base_salary,
        status: "pending",
      }));

      const { error } = await supabase.from("payroll").insert(payrollEntries);
      if (error) throw error;

      toast.success(`Payroll generated for ${employees.length} employees`);
      setIsGenerateOpen(false);
      fetchPayroll();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (record: PayrollRecord) => {
    try {
      const { error } = await supabase
        .from("payroll")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", record.id);

      if (error) throw error;
      toast.success(`Salary paid to ${record.employee?.full_name}`);
      fetchPayroll();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateSalary = async (recordId: string, field: "allowances" | "deductions", value: number) => {
    const record = payroll.find(p => p.id === recordId);
    if (!record) return;

    const newAllowances = field === "allowances" ? value : record.allowances;
    const newDeductions = field === "deductions" ? value : record.deductions;
    const netSalary = record.basic_salary + newAllowances - newDeductions;

    try {
      const { error } = await supabase
        .from("payroll")
        .update({ [field]: value, net_salary: netSalary })
        .eq("id", recordId);

      if (error) throw error;
      fetchPayroll();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalPayroll = payroll.reduce((sum, p) => sum + p.net_salary, 0);
  const paidCount = payroll.filter(p => p.status === "paid").length;
  const pendingCount = payroll.filter(p => p.status === "pending").length;

  return (
    <>
      <Helmet><title>Payroll - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Payroll Management</h1>
              <p className="text-muted-foreground">Generate and manage employee salaries</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const data = formatPayrollForExport(payroll);
                  if (exportToCSV(data, `payroll_${MONTHS[selectedMonth - 1]}_${selectedYear}`)) {
                    toast.success("Payroll exported successfully");
                  } else {
                    toast.error("No data to export");
                  }
                }}
                disabled={payroll.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Generate Payroll</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Monthly Payroll</DialogTitle>
                    <DialogDescription>Generate salary records for all active employees</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      This will create payroll entries for <strong>{employees.length}</strong> active employees for <strong>{MONTHS[selectedMonth - 1]} {selectedYear}</strong>.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Base Salary: <strong>₹{employees.reduce((s, e) => s + e.base_salary, 0).toLocaleString()}</strong>
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
                    <Button onClick={handleGeneratePayroll} disabled={generating}>
                      {generating ? "Generating..." : "Generate Payroll"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10"><DollarSign className="h-6 w-6 text-primary" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payroll</p>
                    <p className="text-2xl font-bold">₹{totalPayroll.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100"><CheckCircle className="h-6 w-6 text-green-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paid</p>
                    <p className="text-2xl font-bold">{paidCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-orange-100"><Clock className="h-6 w-6 text-orange-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100"><Calendar className="h-6 w-6 text-blue-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p className="text-lg font-bold">{MONTHS[selectedMonth - 1].slice(0, 3)} {selectedYear}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Month/Year Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="space-y-1">
                  <Label>Month</Label>
                  <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, idx) => (
                        <SelectItem key={idx} value={String(idx + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Year</Label>
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Payroll - {MONTHS[selectedMonth - 1]} {selectedYear}</CardTitle>
              <CardDescription>Employee salary records for the selected month</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : payroll.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No payroll records for this month</p>
                  <Button onClick={() => setIsGenerateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Generate Payroll
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Basic</TableHead>
                      <TableHead>Allowances</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payroll.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.employee?.full_name || "Unknown"}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{record.employee?.category.replace("_", " ")}</Badge></TableCell>
                        <TableCell>₹{record.basic_salary.toLocaleString()}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={record.allowances}
                            onChange={(e) => handleUpdateSalary(record.id, "allowances", parseFloat(e.target.value) || 0)}
                            className="w-24 h-8"
                            disabled={record.status === "paid"}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={record.deductions}
                            onChange={(e) => handleUpdateSalary(record.id, "deductions", parseFloat(e.target.value) || 0)}
                            className="w-24 h-8"
                            disabled={record.status === "paid"}
                          />
                        </TableCell>
                        <TableCell className="font-semibold">₹{record.net_salary.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === "paid" ? "default" : "secondary"}>
                            {record.status === "paid" ? "Paid" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {record.status === "pending" ? (
                            <Button size="sm" onClick={() => handleMarkPaid(record)}>
                              <CheckCircle className="h-4 w-4 mr-1" />Pay
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {record.paid_at && format(new Date(record.paid_at), "dd MMM")}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Payroll;
