import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Loader2, UserCog, Shield, Pencil, Key } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  email: string | null;
  category: string;
}

interface StaffPermission {
  id: string;
  user_id: string;
  school_id: string;
  employee_id: string | null;
  can_collect_fee: boolean;
  can_manage_payroll: boolean;
  can_manage_attendance: boolean;
  can_manage_students: boolean;
  can_manage_exams: boolean;
  can_view_reports: boolean;
  can_manage_notices: boolean;
  is_active: boolean;
  created_at: string;
  employee?: Employee;
}

const permissionLabels = {
  can_collect_fee: { label: "Fee Collection (Cashier)", description: "Collect fees, generate receipts" },
  can_manage_payroll: { label: "Payroll Management", description: "Generate and manage payroll" },
  can_manage_attendance: { label: "Attendance Management", description: "Mark and view attendance" },
  can_manage_students: { label: "Student Management", description: "View student details" },
  can_manage_exams: { label: "Exam & Results", description: "View exams, enter marks" },
  can_view_reports: { label: "Reports Access", description: "View reports (read-only)" },
  can_manage_notices: { label: "Notice Management", description: "Create and manage notices" },
};

const StaffAccess = () => {
  const { schoolId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffPermission[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffPermission | null>(null);
  
  const [newStaff, setNewStaff] = useState({
    employee_id: "",
    email: "",
    password: "",
    can_collect_fee: false,
    can_manage_payroll: false,
    can_manage_attendance: false,
    can_manage_students: false,
    can_manage_exams: false,
    can_view_reports: false,
    can_manage_notices: false,
  });

  const [editPermissions, setEditPermissions] = useState({
    can_collect_fee: false,
    can_manage_payroll: false,
    can_manage_attendance: false,
    can_manage_students: false,
    can_manage_exams: false,
    can_view_reports: false,
    can_manage_notices: false,
    is_active: true,
  });

  useEffect(() => {
    if (schoolId) {
      fetchData();
    }
  }, [schoolId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch staff with permissions
      const { data: staffData, error: staffError } = await supabase
        .from("staff_permissions")
        .select(`
          *,
          employee:employees(id, full_name, email, category)
        `)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (staffError) throw staffError;
      setStaffList(staffData || []);

      // Fetch employees for dropdown
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("id, full_name, email, category")
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .order("full_name");

      if (empError) throw empError;
      setEmployees(empData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    setNewStaff({
      ...newStaff,
      employee_id: employeeId,
      email: employee?.email || "",
    });
  };

  const handleAddStaff = async () => {
    if (!newStaff.email || !newStaff.password) {
      toast.error("Email and password are required");
      return;
    }

    if (newStaff.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      // Call edge function to create staff login
      const { data, error } = await supabase.functions.invoke("create-staff-login", {
        body: {
          email: newStaff.email,
          password: newStaff.password,
          school_id: schoolId,
          employee_id: newStaff.employee_id || null,
          permissions: {
            can_collect_fee: newStaff.can_collect_fee,
            can_manage_payroll: newStaff.can_manage_payroll,
            can_manage_attendance: newStaff.can_manage_attendance,
            can_manage_students: newStaff.can_manage_students,
            can_manage_exams: newStaff.can_manage_exams,
            can_view_reports: newStaff.can_view_reports,
            can_manage_notices: newStaff.can_manage_notices,
          },
        },
      });

      if (error) throw error;

      toast.success("Staff login created successfully");
      setIsDialogOpen(false);
      setNewStaff({
        employee_id: "",
        email: "",
        password: "",
        can_collect_fee: false,
        can_manage_payroll: false,
        can_manage_attendance: false,
        can_manage_students: false,
        can_manage_exams: false,
        can_view_reports: false,
        can_manage_notices: false,
      });
      fetchData();
    } catch (error: any) {
      console.error("Error creating staff:", error);
      toast.error(error.message || "Failed to create staff login");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (staff: StaffPermission) => {
    setEditingStaff(staff);
    setEditPermissions({
      can_collect_fee: staff.can_collect_fee,
      can_manage_payroll: staff.can_manage_payroll,
      can_manage_attendance: staff.can_manage_attendance,
      can_manage_students: staff.can_manage_students,
      can_manage_exams: staff.can_manage_exams,
      can_view_reports: staff.can_view_reports,
      can_manage_notices: staff.can_manage_notices,
      is_active: staff.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePermissions = async () => {
    if (!editingStaff) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("staff_permissions")
        .update({
          can_collect_fee: editPermissions.can_collect_fee,
          can_manage_payroll: editPermissions.can_manage_payroll,
          can_manage_attendance: editPermissions.can_manage_attendance,
          can_manage_students: editPermissions.can_manage_students,
          can_manage_exams: editPermissions.can_manage_exams,
          can_view_reports: editPermissions.can_view_reports,
          can_manage_notices: editPermissions.can_manage_notices,
          is_active: editPermissions.is_active,
        })
        .eq("id", editingStaff.id);

      if (error) throw error;

      toast.success("Permissions updated successfully");
      setIsEditDialogOpen(false);
      setEditingStaff(null);
      fetchData();
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      toast.error(error.message || "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  const getActivePermissions = (staff: StaffPermission) => {
    const permissions = [];
    if (staff.can_collect_fee) permissions.push("Fee");
    if (staff.can_manage_payroll) permissions.push("Payroll");
    if (staff.can_manage_attendance) permissions.push("Attendance");
    if (staff.can_manage_students) permissions.push("Students");
    if (staff.can_manage_exams) permissions.push("Exams");
    if (staff.can_view_reports) permissions.push("Reports");
    if (staff.can_manage_notices) permissions.push("Notices");
    return permissions;
  };

  if (loading) {
    return (
      <>
        <Helmet><title>Staff Access - SkoolSetu</title></Helmet>
        <DashboardLayout role="school_admin">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Staff Access Management - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Staff Access Management
              </h1>
              <p className="text-muted-foreground">
                Create login credentials for staff with specific module permissions
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Login
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Staff Login</DialogTitle>
                  <DialogDescription>
                    Create a login for a staff member with specific module permissions
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Link to Employee (Optional)</Label>
                    <Select
                      value={newStaff.employee_id}
                      onValueChange={handleEmployeeSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name} ({emp.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-email">Login Email *</Label>
                    <Input
                      id="staff-email"
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      placeholder="staff@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-password">Temporary Password *</Label>
                    <Input
                      id="staff-password"
                      type="text"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      placeholder="Enter temporary password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Share this password with the staff member. They can change it later.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Module Permissions</Label>
                    <div className="space-y-3 border rounded-lg p-4">
                      {Object.entries(permissionLabels).map(([key, { label, description }]) => (
                        <div key={key} className="flex items-start space-x-3">
                          <Checkbox
                            id={key}
                            checked={newStaff[key as keyof typeof newStaff] as boolean}
                            onCheckedChange={(checked) =>
                              setNewStaff({ ...newStaff, [key]: !!checked })
                            }
                          />
                          <div className="grid gap-0.5 leading-none">
                            <label htmlFor={key} className="text-sm font-medium cursor-pointer">
                              {label}
                            </label>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddStaff} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                    {saving ? "Creating..." : "Create Login"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Staff Logins ({staffList.length})
              </CardTitle>
              <CardDescription>
                Manage staff login credentials and their module access
              </CardDescription>
            </CardHeader>
            <CardContent>
              {staffList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No staff logins created yet</p>
                  <p className="text-sm">Click "Add Staff Login" to create one</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff/Employee</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffList.map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {staff.employee?.full_name || "Unlinked Staff"}
                              </p>
                              {staff.employee?.category && (
                                <p className="text-xs text-muted-foreground">
                                  {staff.employee.category}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {getActivePermissions(staff).map((perm) => (
                                <Badge key={perm} variant="secondary" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                              {getActivePermissions(staff).length === 0 && (
                                <span className="text-xs text-muted-foreground">No permissions</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={staff.is_active ? "default" : "destructive"}>
                              {staff.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(staff.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(staff)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Permissions Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Staff Permissions</DialogTitle>
                <DialogDescription>
                  Update permissions for {editingStaff?.employee?.full_name || "staff member"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-active">Account Active</Label>
                  <Switch
                    id="is-active"
                    checked={editPermissions.is_active}
                    onCheckedChange={(checked) =>
                      setEditPermissions({ ...editPermissions, is_active: checked })
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Module Permissions</Label>
                  <div className="space-y-3 border rounded-lg p-4">
                    {Object.entries(permissionLabels).map(([key, { label, description }]) => (
                      <div key={key} className="flex items-start space-x-3">
                        <Checkbox
                          id={`edit-${key}`}
                          checked={editPermissions[key as keyof typeof editPermissions] as boolean}
                          onCheckedChange={(checked) =>
                            setEditPermissions({ ...editPermissions, [key]: !!checked })
                          }
                        />
                        <div className="grid gap-0.5 leading-none">
                          <label htmlFor={`edit-${key}`} className="text-sm font-medium cursor-pointer">
                            {label}
                          </label>
                          <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePermissions} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
};

export default StaffAccess;
