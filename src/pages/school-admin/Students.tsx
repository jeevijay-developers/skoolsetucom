import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, UserX, UserCheck, Key, Copy } from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
  admission_number: string | null;
  class_id: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  parent_user_id: string | null;
  gender: string | null;
  date_of_birth: string | null;
  is_active: boolean;
  classes?: { name: string; section: string | null } | null;
}

interface Class {
  id: string;
  name: string;
  section: string | null;
}

const Students = () => {
  const { schoolId, isSubscriptionActive } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    roll_number: "",
    admission_number: "",
    class_id: "",
    parent_name: "",
    parent_phone: "",
    parent_email: "",
    gender: "",
    date_of_birth: "",
  });

  useEffect(() => {
    if (schoolId) {
      fetchStudents();
      fetchClasses();
    }
  }, [schoolId]);

  const fetchStudents = async () => {
    if (!schoolId) return;

    try {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id, full_name, roll_number, admission_number, class_id,
          parent_name, parent_phone, parent_email, parent_user_id,
          gender, date_of_birth, is_active,
          classes:class_id (name, section)
        `)
        .eq("school_id", schoolId)
        .order("full_name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const handleCreateParentLogin = async (student: Student) => {
    if (!student.parent_email) {
      toast.error("Parent email is required to create login");
      return;
    }
    if (student.parent_user_id) {
      toast.error("Parent login already exists");
      return;
    }

    setCreatingLogin(true);
    const tempPassword = generatePassword();

    try {
      const { data, error } = await supabase.functions.invoke("create-parent-login", {
        body: { student_id: student.id, temp_password: tempPassword },
      });

      if (error) throw error;

      setCreatedCredentials({ email: student.parent_email, password: tempPassword });
      setLoginDialogOpen(true);
      toast.success("Parent login created successfully");
      fetchStudents();
    } catch (error: any) {
      console.error("Error creating parent login:", error);
      toast.error(error.message || "Failed to create parent login");
    } finally {
      setCreatingLogin(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const fetchClasses = async () => {
    if (!schoolId) return;

    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .eq("school_id", schoolId)
        .order("name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSubscriptionActive) {
      toast.error("Your subscription is inactive. Please renew to add students.");
      return;
    }

    if (!formData.full_name.trim()) {
      toast.error("Please enter student name");
      return;
    }

    try {
      const studentData = {
        school_id: schoolId!,
        full_name: formData.full_name,
        roll_number: formData.roll_number || null,
        admission_number: formData.admission_number || null,
        class_id: formData.class_id || null,
        parent_name: formData.parent_name || null,
        parent_phone: formData.parent_phone || null,
        parent_email: formData.parent_email || null,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
      };

      if (editingStudent) {
        const { error } = await supabase
          .from("students")
          .update(studentData)
          .eq("id", editingStudent.id);

        if (error) throw error;
        toast.success("Student updated successfully");
      } else {
        const { error } = await supabase
          .from("students")
          .insert(studentData);

        if (error) throw error;
        toast.success("Student added successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchStudents();
    } catch (error: any) {
      console.error("Error saving student:", error);
      toast.error(error.message || "Failed to save student");
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      roll_number: student.roll_number || "",
      admission_number: student.admission_number || "",
      class_id: student.class_id || "",
      parent_name: student.parent_name || "",
      parent_phone: student.parent_phone || "",
      parent_email: student.parent_email || "",
      gender: student.gender || "",
      date_of_birth: student.date_of_birth || "",
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (student: Student) => {
    try {
      const { error } = await supabase
        .from("students")
        .update({ is_active: !student.is_active })
        .eq("id", student.id);

      if (error) throw error;
      toast.success(`Student ${student.is_active ? "deactivated" : "activated"} successfully`);
      fetchStudents();
    } catch (error) {
      console.error("Error toggling student status:", error);
      toast.error("Failed to update student status");
    }
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.full_name}?`)) return;

    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", student.id);

      if (error) throw error;
      toast.success("Student deleted successfully");
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    }
  };

  const resetForm = () => {
    setEditingStudent(null);
    setFormData({
      full_name: "",
      roll_number: "",
      admission_number: "",
      class_id: "",
      parent_name: "",
      parent_phone: "",
      parent_email: "",
      gender: "",
      date_of_birth: "",
    });
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admission_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = filterClass === "all" || student.class_id === filterClass;

    return matchesSearch && matchesClass;
  });

  return (
    <>
      <Helmet>
        <title>Students Management - SkoolSetu</title>
      </Helmet>

      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Students</h1>
              <p className="text-muted-foreground">Manage your school's students</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button disabled={!isSubscriptionActive}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
                    <DialogDescription>
                      {editingStudent ? "Update student information" : "Enter student details to add them to your school"}
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
                          placeholder="Student's full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="class_id">Class</Label>
                        <Select
                          value={formData.class_id}
                          onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name} {cls.section ? `- ${cls.section}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="roll_number">Roll Number</Label>
                        <Input
                          id="roll_number"
                          value={formData.roll_number}
                          onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                          placeholder="e.g., 001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admission_number">Admission Number</Label>
                        <Input
                          id="admission_number"
                          value={formData.admission_number}
                          onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                          placeholder="e.g., ADM-2024-001"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => setFormData({ ...formData, gender: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Parent/Guardian Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="parent_name">Parent Name</Label>
                          <Input
                            id="parent_name"
                            value={formData.parent_name}
                            onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                            placeholder="Parent's name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parent_phone">Parent Phone</Label>
                          <Input
                            id="parent_phone"
                            value={formData.parent_phone}
                            onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                            placeholder="9876543210"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="parent_email">Parent Email</Label>
                        <Input
                          id="parent_email"
                          type="email"
                          value={formData.parent_email}
                          onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                          placeholder="parent@email.com"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingStudent ? "Update Student" : "Add Student"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, roll number, or admission number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `- ${cls.section}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>All Students ({filteredStudents.length})</CardTitle>
              <CardDescription>List of all students in your school</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No students found</p>
                  <Button
                    variant="link"
                    onClick={() => setIsDialogOpen(true)}
                    disabled={!isSubscriptionActive}
                  >
                    Add your first student
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>
                            {student.classes
                              ? `${student.classes.name}${student.classes.section ? ` - ${student.classes.section}` : ""}`
                              : "-"}
                          </TableCell>
                          <TableCell>{student.roll_number || "-"}</TableCell>
                          <TableCell>{student.parent_name || "-"}</TableCell>
                          <TableCell>{student.parent_phone || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={student.is_active ? "default" : "secondary"}>
                              {student.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(student)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(student)}>
                                  {student.is_active ? (
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
                                  onClick={() => handleCreateParentLogin(student)}
                                  disabled={!student.parent_email || !!student.parent_user_id || creatingLogin}
                                >
                                  <Key className="h-4 w-4 mr-2" />
                                  {student.parent_user_id ? "Login Created" : "Create Parent Login"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(student)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parent Login Credentials Dialog */}
          <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Parent Login Created</DialogTitle>
                <DialogDescription>
                  Share these credentials with the parent. They can use these to login.
                </DialogDescription>
              </DialogHeader>
              {createdCredentials && (
                <div className="space-y-4">
                  <div className="p-4 bg-secondary rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p className="font-mono">{createdCredentials.email}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdCredentials.email)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                        <p className="font-mono font-bold">{createdCredentials.password}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdCredentials.password)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The parent should change their password after first login using "Forgot Password".
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setLoginDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Students;
