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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users, UserCheck, UserX } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  category: string;
  employee_code: string | null;
  phone: string | null;
  email: string | null;
  base_salary: number;
  is_active: boolean;
  date_of_joining: string | null;
}

const CATEGORIES = [
  { value: "teacher", label: "Teacher" },
  { value: "ground_staff", label: "Ground Staff" },
  { value: "computer_operator", label: "Computer Operator" },
  { value: "admin_staff", label: "Admin Staff" },
  { value: "accountant", label: "Accountant" },
  { value: "librarian", label: "Librarian" },
  { value: "lab_assistant", label: "Lab Assistant" },
  { value: "security", label: "Security" },
  { value: "driver", label: "Driver" },
  { value: "other", label: "Other" },
];

const Employees = () => {
  const { schoolId } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    category: "teacher",
    employee_code: "",
    phone: "",
    email: "",
    base_salary: "",
    bank_name: "",
    bank_account: "",
    ifsc_code: "",
    date_of_joining: "",
  });

  useEffect(() => {
    if (schoolId) {
      fetchEmployees();
    }
  }, [schoolId]);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("school_id", schoolId)
      .order("full_name");

    if (error) {
      toast.error("Failed to fetch employees");
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error("Please enter employee name");
      return;
    }

    try {
      const employeeData = {
        school_id: schoolId!,
        full_name: formData.full_name,
        category: formData.category,
        employee_code: formData.employee_code || null,
        phone: formData.phone || null,
        email: formData.email || null,
        base_salary: parseFloat(formData.base_salary) || 0,
        bank_name: formData.bank_name || null,
        bank_account: formData.bank_account || null,
        ifsc_code: formData.ifsc_code || null,
        date_of_joining: formData.date_of_joining || null,
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from("employees")
          .update(employeeData)
          .eq("id", editingEmployee.id);
        if (error) throw error;
        toast.success("Employee updated successfully");
      } else {
        const { error } = await supabase.from("employees").insert(employeeData);
        if (error) throw error;
        toast.success("Employee added successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      category: employee.category,
      employee_code: employee.employee_code || "",
      phone: employee.phone || "",
      email: employee.email || "",
      base_salary: employee.base_salary.toString(),
      bank_name: "",
      bank_account: "",
      ifsc_code: "",
      date_of_joining: employee.date_of_joining || "",
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      const { error } = await supabase
        .from("employees")
        .update({ is_active: !employee.is_active })
        .eq("id", employee.id);
      if (error) throw error;
      toast.success(`Employee ${employee.is_active ? "deactivated" : "activated"}`);
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.full_name}?`)) return;
    try {
      const { error } = await supabase.from("employees").delete().eq("id", employee.id);
      if (error) throw error;
      toast.success("Employee deleted");
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData({
      full_name: "",
      category: "teacher",
      employee_code: "",
      phone: "",
      email: "",
      base_salary: "",
      bank_name: "",
      bank_account: "",
      ifsc_code: "",
      date_of_joining: "",
    });
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || emp.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalSalary = employees.filter(e => e.is_active).reduce((sum, e) => sum + e.base_salary, 0);

  return (
    <>
      <Helmet><title>Employees - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Employees</h1>
              <p className="text-muted-foreground">Manage school staff and employees</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Employee</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle>
                    <DialogDescription>Enter employee details</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Employee name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Employee Code</Label>
                        <Input value={formData.employee_code} onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })} placeholder="EMP-001" />
                      </div>
                      <div className="space-y-2">
                        <Label>Base Salary (₹)</Label>
                        <Input type="number" value={formData.base_salary} onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })} placeholder="25000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="9876543210" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Joining</Label>
                      <Input type="date" value={formData.date_of_joining} onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })} />
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Bank Details (Optional)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Bank Name</Label>
                          <Input value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} placeholder="SBI" />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Number</Label>
                          <Input value={formData.bank_account} onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })} placeholder="1234567890" />
                        </div>
                        <div className="space-y-2">
                          <Label>IFSC Code</Label>
                          <Input value={formData.ifsc_code} onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })} placeholder="SBIN0001234" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">{editingEmployee ? "Update" : "Add"} Employee</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Employees</p>
                    <p className="text-2xl font-bold">{employees.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100"><UserCheck className="h-6 w-6 text-green-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{employees.filter(e => e.is_active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100"><span className="text-blue-600 font-bold text-lg">₹</span></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payroll</p>
                    <p className="text-2xl font-bold">₹{totalSalary.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="shadow-card">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No employees found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{emp.category.replace("_", " ")}</Badge></TableCell>
                        <TableCell>{emp.employee_code || "-"}</TableCell>
                        <TableCell>{emp.phone || "-"}</TableCell>
                        <TableCell>₹{emp.base_salary.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={emp.is_active ? "default" : "secondary"}>
                            {emp.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(emp)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(emp)}>
                                {emp.is_active ? <><UserX className="h-4 w-4 mr-2" />Deactivate</> : <><UserCheck className="h-4 w-4 mr-2" />Activate</>}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(emp)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

export default Employees;
