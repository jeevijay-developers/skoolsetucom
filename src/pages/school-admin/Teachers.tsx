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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, UserX, UserCheck, Mail } from "lucide-react";

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
  });
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");

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

    try {
      let userId = null;

      // Create user account if requested
      if (createAccount && accountPassword && !editingTeacher) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: accountPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: formData.full_name },
          },
        });

        if (authError) throw authError;
        userId = authData.user?.id;

        // Create user role
        if (userId) {
          await supabase.from("user_roles").insert({
            user_id: userId,
            role: "teacher",
            school_id: schoolId,
          });
        }
      }

      const subjectsArray = formData.subjects
        ? formData.subjects.split(",").map((s) => s.trim()).filter(Boolean)
        : null;

      const teacherData = {
        school_id: schoolId!,
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        employee_id: formData.employee_id || null,
        qualification: formData.qualification || null,
        subjects: subjectsArray,
        date_of_joining: formData.date_of_joining || null,
        user_id: userId,
      };

      if (editingTeacher) {
        const { error } = await supabase
          .from("teachers")
          .update(teacherData)
          .eq("id", editingTeacher.id);

        if (error) throw error;
        toast.success("Teacher updated successfully");
      } else {
        const { error } = await supabase.from("teachers").insert(teacherData);

        if (error) throw error;
        toast.success(createAccount ? "Teacher added with login account" : "Teacher added successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTeachers();
    } catch (error: any) {
      console.error("Error saving teacher:", error);
      toast.error(error.message || "Failed to save teacher");
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      full_name: teacher.full_name,
      email: teacher.email || "",
      phone: teacher.phone || "",
      employee_id: teacher.employee_id || "",
      qualification: teacher.qualification || "",
      subjects: teacher.subjects?.join(", ") || "",
      date_of_joining: teacher.date_of_joining || "",
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

                    <div className="space-y-2">
                      <Label htmlFor="subjects">Subjects (comma-separated)</Label>
                      <Input
                        id="subjects"
                        value={formData.subjects}
                        onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                        placeholder="Mathematics, Science, English"
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
                    <Button type="submit">
                      {editingTeacher ? "Update Teacher" : "Add Teacher"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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

          {/* Teachers Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>All Teachers ({filteredTeachers.length})</CardTitle>
              <CardDescription>List of all teachers in your school</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No teachers found</p>
                  <Button
                    variant="link"
                    onClick={() => setIsDialogOpen(true)}
                    disabled={!isSubscriptionActive}
                  >
                    Add your first teacher
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.full_name}</TableCell>
                          <TableCell>{teacher.email || "-"}</TableCell>
                          <TableCell>{teacher.phone || "-"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {teacher.subjects?.slice(0, 2).map((subject) => (
                                <Badge key={subject} variant="outline" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                              {teacher.subjects && teacher.subjects.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{teacher.subjects.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={teacher.is_active ? "default" : "secondary"}>
                              {teacher.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {teacher.user_id ? (
                              <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                                <Mail className="h-3 w-3 mr-1" />
                                Has Login
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Teachers;
