import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, MoreVertical, Pencil, Trash2, UserX, UserCheck, Mail, Eye, Lock, BookOpen, GraduationCap, Phone, Calendar, IndianRupee, Download, FileUp } from "lucide-react";
import { exportToCSV, formatTeachersForExport } from "@/utils/exportUtils";
import CSVImporter, { ImportConfig } from "@/components/import/CSVImporter";

interface Teacher {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  employee_id: string | null;
  qualification: string | null;
  subjects: string[] | null;
  date_of_joining: string | null;
  is_active: boolean;
  user_id: string | null;
}

interface TeacherClass {
  id: string;
  class_id: string;
  is_class_teacher: boolean;
  classes?: { name: string; section: string | null } | null;
}

interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  classes?: { name: string; section: string | null } | null;
  subjects?: { name: string } | null;
}

const Teachers = () => {
  const { schoolId, isSubscriptionActive } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    employee_id: "",
    qualification: "",
    subjects: "",
    date_of_joining: "",
    base_salary: "",
  });
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");

  // Master data state
  const [overviewDialogOpen, setOverviewDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<ClassSubject[]>([]);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    if (schoolId) {
      fetchTeachers();
    }
  }, [schoolId]);

  const fetchTeachers = async () => {
    if (!schoolId) return;

    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("school_id", schoolId)
        .order("full_name");

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOverview = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setOverviewDialogOpen(true);
    setLoadingOverview(true);

    try {
      // Fetch teacher's assigned classes
      const { data: classData, error: classError } = await supabase
        .from("teacher_classes")
        .select(`
          id, class_id, is_class_teacher,
          classes:class_id (name, section)
        `)
        .eq("teacher_id", teacher.id)
        .eq("school_id", schoolId!);

      if (classError) throw classError;
      setTeacherClasses(classData || []);

      // Fetch teacher's assigned subjects
      const { data: subjectData, error: subjectError } = await supabase
        .from("class_subjects")
        .select(`
          id, class_id, subject_id,
          classes:class_id (name, section),
          subjects:subject_id (name)
        `)
        .eq("teacher_id", teacher.id)
        .eq("school_id", schoolId!);

      if (subjectError) throw subjectError;
      setTeacherSubjects(subjectData || []);

      // Fetch salary from employees table
      if (teacher.email) {
        const { data: empData } = await supabase
          .from("employees")
          .select("base_salary")
          .eq("email", teacher.email)
          .eq("school_id", schoolId!)
          .maybeSingle();

        setBaseSalary(empData?.base_salary || 0);
      }
    } catch (error) {
      console.error("Error fetching teacher overview:", error);
      toast.error("Failed to load teacher details");
    } finally {
      setLoadingOverview(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedTeacher?.user_id) {
      toast.error("This teacher has no login account");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.functions.invoke("create-teacher-login", {
        body: {
          teacher_id: selectedTeacher.id,
          password: newPassword,
          update_password: true
        },
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSubscriptionActive) {
      toast.error("Your subscription is inactive. Please renew to add teachers.");
      return;
    }

    if (!formData.full_name.trim()) {
      toast.error("Please enter teacher name");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter teacher email");
      return;
    }

    if (savingTeacher) return;
    setSavingTeacher(true);
    try {
      const subjectsArray = formData.subjects
        ? formData.subjects.split(",").map((s) => s.trim()).filter(Boolean)
        : null;

      const teacherData = {
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        employee_id: formData.employee_id || null,
        qualification: formData.qualification || null,
        subjects: subjectsArray,
        date_of_joining: formData.date_of_joining || null,
      };

      const employeeData = {
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        employee_code: formData.employee_id || null,
        date_of_joining: formData.date_of_joining || null,
        base_salary: formData.base_salary ? parseFloat(formData.base_salary) : 0,
        category: "teacher",
        school_id: schoolId!,
      };

      if (editingTeacher) {
        const { error } = await supabase
          .from("teachers")
          .update({ ...teacherData, school_id: schoolId! })
          .eq("id", editingTeacher.id);

        if (error) throw error;

        // Update corresponding employee record
        await supabase
          .from("employees")
          .update({
            full_name: formData.full_name,
            email: formData.email || null,
            phone: formData.phone || null,
            employee_code: formData.employee_id || null,
            date_of_joining: formData.date_of_joining || null,
            base_salary: formData.base_salary ? parseFloat(formData.base_salary) : 0,
          })
          .eq("email", editingTeacher.email)
          .eq("school_id", schoolId!);

        toast.success("Teacher updated successfully");
      } else if (createAccount && accountPassword) {
        // Use edge function to create teacher with login account and employee
        const { data, error } = await supabase.functions.invoke("create-teacher-login", {
          body: {
            teacher_data: teacherData,
            employee_data: employeeData,
            password: accountPassword,
            school_id: schoolId
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        toast.success("Teacher added with login account");
      } else {
        // Add teacher without login account
        const { error: teacherError } = await supabase.from("teachers").insert({
          ...teacherData,
          school_id: schoolId!,
        });

        if (teacherError) throw teacherError;

        // Also add to employees table
        const { error: employeeError } = await supabase.from("employees").insert(employeeData);
        if (employeeError) {
          console.error("Error adding employee:", employeeError);
        }

        toast.success("Teacher added successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTeachers();
    } catch (error: any) {
      console.error("Error saving teacher:", error);
      toast.error(error.message || "Failed to save teacher");
    } finally {
      setSavingTeacher(false);
    }
  };

  const handleEdit = async (teacher: Teacher) => {
    setEditingTeacher(teacher);
    
    // Fetch salary from employees table
    let baseSalary = "";
    if (teacher.email) {
      const { data: empData } = await supabase
        .from("employees")
        .select("base_salary")
        .eq("email", teacher.email)
        .eq("school_id", schoolId!)
        .maybeSingle();
      
      if (empData?.base_salary) {
        baseSalary = empData.base_salary.toString();
      }
    }

    setFormData({
      full_name: teacher.full_name,
      email: teacher.email || "",
      phone: teacher.phone || "",
      employee_id: teacher.employee_id || "",
      qualification: teacher.qualification || "",
      subjects: teacher.subjects?.join(", ") || "",
      date_of_joining: teacher.date_of_joining || "",
      base_salary: baseSalary,
    });
    setCreateAccount(false);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (teacher: Teacher) => {
    try {
      const { error } = await supabase
        .from("teachers")
        .update({ is_active: !teacher.is_active })
        .eq("id", teacher.id);

      if (error) throw error;
      toast.success(`Teacher ${teacher.is_active ? "deactivated" : "activated"} successfully`);
      fetchTeachers();
    } catch (error) {
      console.error("Error toggling teacher status:", error);
      toast.error("Failed to update teacher status");
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!confirm(`Are you sure you want to delete ${teacher.full_name}?`)) return;

    try {
      const { error } = await supabase.from("teachers").delete().eq("id", teacher.id);

      if (error) throw error;
      toast.success("Teacher deleted successfully");
      fetchTeachers();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.error("Failed to delete teacher");
    }
  };

  const resetForm = () => {
    setEditingTeacher(null);
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      employee_id: "",
      qualification: "",
      subjects: "",
      date_of_joining: "",
      base_salary: "",
    });
    setCreateAccount(false);
    setAccountPassword("");
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const teacherImportConfig: ImportConfig = {
    title: "Import Teachers",
    tableName: "teachers",
    templateFileName: "teachers_template.csv",
    templateHeaders: ["Full Name", "Email", "Phone", "Employee ID", "Qualification", "Subjects", "Date of Joining"],
    templateSampleRows: [
      ["Amit Kumar", "amit@school.edu", "9876543210", "EMP-001", "M.Sc Mathematics", "Mathematics, Physics", "2022-06-01"],
      ["Sunita Verma", "sunita@school.edu", "9876543211", "EMP-002", "B.Ed English", "English, Hindi", "2023-01-15"],
    ],
    columns: [
      { csvHeader: "Full Name", dbField: "full_name", required: true },
      { csvHeader: "Email", dbField: "email" },
      { csvHeader: "Phone", dbField: "phone" },
      { csvHeader: "Employee ID", dbField: "employee_id" },
      { csvHeader: "Qualification", dbField: "qualification" },
      { csvHeader: "Subjects", dbField: "subjects", transform: (v) => v ? v.split(",").map(s => s.trim()).filter(Boolean) : null },
      { csvHeader: "Date of Joining", dbField: "date_of_joining", transform: (v) => v || null },
    ],
    duplicateCheckField: "email",
    onSuccess: () => fetchTeachers(),
  };

  return (
    <>
      <Helmet>
        <title>Teachers Management - SkoolSetu</title>
      </Helmet>

      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Teachers</h1>
              <p className="text-muted-foreground">Manage your school's teachers</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const data = formatTeachersForExport(filteredTeachers);
                  if (exportToCSV(data, "teachers")) {
                    toast.success("Teachers exported successfully");
                  } else {
                    toast.error("No data to export");
                  }
                }}
                disabled={filteredTeachers.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => setImportDialogOpen(true)} disabled={!isSubscriptionActive}>
                <FileUp className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button disabled={!isSubscriptionActive}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Teacher
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
                    <DialogDescription>
                      {editingTeacher ? "Update teacher information" : "Enter teacher details"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          placeholder="Teacher's full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="teacher@school.edu"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="9876543210"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employee_id">Employee ID</Label>
                        <Input
                          id="employee_id"
                          value={formData.employee_id}
                          onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                          placeholder="EMP-001"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="qualification">Qualification</Label>
                        <Input
                          id="qualification"
                          value={formData.qualification}
                          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                          placeholder="M.Sc, B.Ed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_of_joining">Date of Joining</Label>
                        <Input
                          id="date_of_joining"
                          type="date"
                          value={formData.date_of_joining}
                          onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-primary/5 space-y-2">
                      <Label htmlFor="subjects" className="text-base font-semibold flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Subjects This Teacher Can Teach *
                      </Label>
                      <Input
                        id="subjects"
                        value={formData.subjects}
                        onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                        placeholder="Mathematics, Science, English"
                        className="text-base"
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter subjects separated by commas. These subjects will be available for class assignment.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="base_salary">Monthly Salary (₹)</Label>
                      <Input
                        id="base_salary"
                        type="number"
                        value={formData.base_salary}
                        onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                        placeholder="25000"
                      />
                    </div>

                    {!editingTeacher && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-4">
                          <input
                            type="checkbox"
                            id="createAccount"
                            checked={createAccount}
                            onChange={(e) => setCreateAccount(e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor="createAccount" className="cursor-pointer">
                            Create login account for this teacher
                          </Label>
                        </div>
                        {createAccount && (
                          <div className="space-y-2">
                            <Label htmlFor="accountPassword">Account Password</Label>
                            <Input
                              id="accountPassword"
                              type="password"
                              value={accountPassword}
                              onChange={(e) => setAccountPassword(e.target.value)}
                              placeholder="Min. 6 characters"
                            />
                            <p className="text-xs text-muted-foreground">
                              Teacher will use their email and this password to login
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={savingTeacher}>
                      {savingTeacher ? "Saving..." : editingTeacher ? "Update Teacher" : "Add Teacher"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Teachers Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">All Teachers ({filteredTeachers.length})</h2>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <GraduationCap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-2">No teachers found</p>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(true)}
                    disabled={!isSubscriptionActive}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first teacher
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeachers.map((teacher) => (
                  <Card 
                    key={teacher.id} 
                    className={`group hover:shadow-lg transition-all duration-200 ${
                      !teacher.is_active ? 'opacity-60' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* Header with Avatar and Actions */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {teacher.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground leading-tight">
                              {teacher.full_name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {teacher.employee_id || 'No ID'}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOverview(teacher)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {teacher.user_id && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedTeacher(teacher);
                                setPasswordDialogOpen(true);
                              }}>
                                <Lock className="h-4 w-4 mr-2" />
                                Change Password
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleActive(teacher)}>
                              {teacher.is_active ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(teacher)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">
                            {teacher.email || 'No email'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {teacher.phone || 'No phone'}
                          </span>
                        </div>
                      </div>

                      {/* Subjects */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects?.slice(0, 3).map((subject) => (
                            <Badge key={subject} variant="secondary" className="text-xs font-normal">
                              {subject}
                            </Badge>
                          ))}
                          {teacher.subjects && teacher.subjects.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{teacher.subjects.length - 3}
                            </Badge>
                          )}
                          {(!teacher.subjects || teacher.subjects.length === 0) && (
                            <span className="text-xs text-muted-foreground italic">No subjects</span>
                          )}
                        </div>
                      </div>

                      {/* Footer with Status */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={teacher.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {teacher.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {teacher.user_id && (
                            <Badge variant="outline" className="text-xs bg-primary/5">
                              <Mail className="h-3 w-3 mr-1" />
                              Login
                            </Badge>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={() => handleViewOverview(teacher)}
                        >
                          View
                          <Eye className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Teacher Overview Dialog */}
        <Dialog open={overviewDialogOpen} onOpenChange={setOverviewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {selectedTeacher?.full_name} - Details
              </DialogTitle>
              <DialogDescription>
                View and manage teacher information
              </DialogDescription>
            </DialogHeader>

            {loadingOverview ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : selectedTeacher && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Basic Info</TabsTrigger>
                  <TabsTrigger value="classes">Classes</TabsTrigger>
                  <TabsTrigger value="subjects">Subjects</TabsTrigger>
                  <TabsTrigger value="auth">Login Access</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{selectedTeacher.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedTeacher.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedTeacher.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Employee ID</p>
                      <p className="font-medium">{selectedTeacher.employee_id || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Qualification</p>
                      <p className="font-medium">{selectedTeacher.qualification || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Joining</p>
                      <p className="font-medium">
                        {selectedTeacher.date_of_joining
                          ? new Date(selectedTeacher.date_of_joining).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Salary</p>
                      <p className="font-medium">₹{baseSalary.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={selectedTeacher.is_active ? "default" : "secondary"}>
                        {selectedTeacher.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Subjects (expertise)</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeacher.subjects?.map((subject) => (
                        <Badge key={subject} variant="outline">
                          {subject}
                        </Badge>
                      )) || <span className="text-muted-foreground">No subjects specified</span>}
                    </div>
                  </div>

                </TabsContent>

                <TabsContent value="classes" className="space-y-4">
                  {teacherClasses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No classes assigned yet</p>
                      <p className="text-sm">Assign classes from the Classes module</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teacherClasses.map((tc) => (
                        <div
                          key={tc.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {tc.classes?.name} {tc.classes?.section ? `- ${tc.classes.section}` : ""}
                            </span>
                          </div>
                          {tc.is_class_teacher && (
                            <Badge variant="secondary">Class Teacher</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="subjects" className="space-y-4">
                  {teacherSubjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No subjects assigned yet</p>
                      <p className="text-sm">Assign subjects from the Classes module</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teacherSubjects.map((cs) => (
                        <div
                          key={cs.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{cs.subjects?.name}</span>
                          </div>
                          <Badge variant="outline">
                            {cs.classes?.name} {cs.classes?.section ? `- ${cs.classes.section}` : ""}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="auth" className="space-y-4">
                  {selectedTeacher.user_id ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2 mb-4">
                          <Lock className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Teacher Login Credentials</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Login Email</p>
                            <p className="font-medium">{selectedTeacher.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Login Status</p>
                            <Badge variant="default" className="mt-1">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Password Management</CardTitle>
                          <CardDescription>
                            Reset or change the teacher's login password
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={() => setPasswordDialogOpen(true)}
                            className="w-full sm:w-auto"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Change Password
                          </Button>
                        </CardContent>
                      </Card>

                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Note:</strong> Teacher can login using the email above at the main login page.
                          They will be redirected to the Teacher Dashboard after successful login.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <UserX className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h4 className="font-semibold mb-2">No Login Account</h4>
                      <p className="text-muted-foreground text-sm mb-4">
                        This teacher doesn't have a login account yet.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        To create login access, edit the teacher and enable "Create Login Account" option.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Set a new password for {selectedTeacher?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setPasswordDialogOpen(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={updatingPassword}>
                {updatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>

      <CSVImporter
        config={teacherImportConfig}
        schoolId={schoolId || ""}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </>
  );
};

export default Teachers;
