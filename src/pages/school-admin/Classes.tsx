import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, School, BookOpen, Users, Settings, GraduationCap, UserCheck, Eye } from "lucide-react";

interface Class {
  id: string;
  name: string;
  section: string | null;
  academic_year: string;
  class_teacher_id: string | null;
}

interface Teacher {
  id: string;
  full_name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
}

interface ClassSubject {
  id: string;
  subject_id: string;
  teacher_id: string | null;
  subjects: Subject;
  teachers?: Teacher | null;
}

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
  admission_number: string | null;
  parent_name: string | null;
  parent_phone: string | null;
}

const Classes = () => {
  const { schoolId } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ name: "", section: "", academic_year: "2024-25" });
  
  // Manage class dialog
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [classTeacher, setClassTeacher] = useState<string>("");
  const [loadingManage, setLoadingManage] = useState(false);
  
  // Add subject to class
  const [selectedSubjectToAdd, setSelectedSubjectToAdd] = useState("");
  const [selectedSubjectTeacher, setSelectedSubjectTeacher] = useState("");
  
  // Student counts
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  
  // View students dialog
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [viewingClass, setViewingClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchTeachers();
      fetchSubjects();
      fetchStudentCounts();
    }
  }, [schoolId]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("*")
      .eq("school_id", schoolId)
      .order("name");
    setClasses(data || []);
    setLoading(false);
  };

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from("teachers")
      .select("id, full_name")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("full_name");
    setTeachers(data || []);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from("subjects")
      .select("id, name, code")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("name");
    setSubjects(data || []);
  };

  const fetchStudentCounts = async () => {
    const { data } = await supabase
      .from("students")
      .select("class_id")
      .eq("school_id", schoolId)
      .eq("is_active", true);
    
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(s => {
        if (s.class_id) {
          counts[s.class_id] = (counts[s.class_id] || 0) + 1;
        }
      });
      setStudentCounts(counts);
    }
  };

  const fetchClassStudents = async (classId: string) => {
    setLoadingStudents(true);
    const { data } = await supabase
      .from("students")
      .select("id, full_name, roll_number, admission_number, parent_name, parent_phone")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("is_active", true)
      .order("roll_number");
    setClassStudents(data || []);
    setLoadingStudents(false);
  };

  const openStudentsDialog = (cls: Class) => {
    setViewingClass(cls);
    setStudentsDialogOpen(true);
    fetchClassStudents(cls.id);
  };

  const fetchClassDetails = async (classId: string) => {
    setLoadingManage(true);
    
    // Fetch class subjects with teacher info
    const { data: csData } = await supabase
      .from("class_subjects")
      .select("id, subject_id, teacher_id, subjects(id, name, code), teachers(id, full_name)")
      .eq("class_id", classId)
      .eq("school_id", schoolId);
    
    setClassSubjects((csData || []) as any);
    
    // Get class teacher
    const cls = classes.find(c => c.id === classId);
    setClassTeacher(cls?.class_teacher_id || "_none");
    
    setLoadingManage(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter class name");
      return;
    }
    try {
      if (editingClass) {
        await supabase.from("classes").update(formData).eq("id", editingClass.id);
        toast.success("Class updated");
      } else {
        await supabase.from("classes").insert({ ...formData, school_id: schoolId });
        toast.success("Class added");
      }
      setIsDialogOpen(false);
      setFormData({ name: "", section: "", academic_year: "2024-25" });
      setEditingClass(null);
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure? This will also remove all subject assignments.")) return;
    try {
      await supabase.from("class_subjects").delete().eq("class_id", id);
      await supabase.from("teacher_classes").delete().eq("class_id", id);
      await supabase.from("classes").delete().eq("id", id);
      toast.success("Class deleted");
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openManageDialog = (cls: Class) => {
    setSelectedClass(cls);
    setManageDialogOpen(true);
    fetchClassDetails(cls.id);
  };

  const handleSetClassTeacher = async () => {
    if (!selectedClass) return;
    const teacherId = classTeacher === "_none" ? null : classTeacher;
    try {
      await supabase
        .from("classes")
        .update({ class_teacher_id: teacherId })
        .eq("id", selectedClass.id);
      
      // Update teacher_classes table
      await supabase
        .from("teacher_classes")
        .delete()
        .eq("class_id", selectedClass.id)
        .eq("is_class_teacher", true);
      
      if (teacherId) {
        // Check if entry exists
        const { data: existing } = await supabase
          .from("teacher_classes")
          .select("id")
          .eq("class_id", selectedClass.id)
          .eq("teacher_id", teacherId)
          .single();
        
        if (existing) {
          await supabase
            .from("teacher_classes")
            .update({ is_class_teacher: true })
            .eq("id", existing.id);
        } else {
          await supabase.from("teacher_classes").insert({
            class_id: selectedClass.id,
            teacher_id: teacherId,
            school_id: schoolId,
            is_class_teacher: true,
          });
        }
      }
      
      toast.success("Class teacher updated");
      await fetchClasses();
      setManageDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddSubjectToClass = async () => {
    if (!selectedClass || !selectedSubjectToAdd) {
      toast.error("Please select a subject");
      return;
    }
    
    // Check if already added
    if (classSubjects.some(cs => cs.subject_id === selectedSubjectToAdd)) {
      toast.error("Subject already added to this class");
      return;
    }
    
    try {
      const teacherIdToUse = selectedSubjectTeacher === "_none" ? null : (selectedSubjectTeacher || null);
      await supabase.from("class_subjects").insert({
        class_id: selectedClass.id,
        subject_id: selectedSubjectToAdd,
        teacher_id: teacherIdToUse,
        school_id: schoolId,
      });
      toast.success("Subject added to class");
      setSelectedSubjectToAdd("");
      setSelectedSubjectTeacher("");
      fetchClassDetails(selectedClass.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateSubjectTeacher = async (classSubjectId: string, teacherId: string) => {
    try {
      await supabase
        .from("class_subjects")
        .update({ teacher_id: teacherId || null })
        .eq("id", classSubjectId);
      toast.success("Subject teacher updated");
      if (selectedClass) fetchClassDetails(selectedClass.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveSubjectFromClass = async (classSubjectId: string) => {
    try {
      await supabase.from("class_subjects").delete().eq("id", classSubjectId);
      toast.success("Subject removed from class");
      if (selectedClass) fetchClassDetails(selectedClass.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getClassTeacherName = (classTeacherId: string | null) => {
    if (!classTeacherId) return null;
    return teachers.find(t => t.id === classTeacherId)?.full_name;
  };

  return (
    <>
      <Helmet><title>Classes - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Classes</h1>
              <p className="text-muted-foreground">Manage classes, subjects & teachers</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingClass(null); setFormData({ name: "", section: "", academic_year: "2024-25" }); }}>
                  <Plus className="h-4 w-4 mr-2" />Add Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingClass ? "Edit" : "Add"} Class</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Class Name *</Label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Class 1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Input value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} placeholder="e.g., A" />
                    </div>
                  </div>
                  <DialogFooter><Button type="submit">{editingClass ? "Update" : "Add"}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : classes.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <School className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Classes Yet</h3>
                <p className="text-muted-foreground mb-4">Add your first class to get started</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />Add Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => {
                const classTeacherName = getClassTeacherName(cls.class_teacher_id);
                const studentCount = studentCounts[cls.id] || 0;
                return (
                  <Card key={cls.id} className="shadow-card hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <School className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {cls.name}{cls.section ? ` - ${cls.section}` : ""}
                            </h3>
                            <p className="text-sm text-muted-foreground">{cls.academic_year}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openStudentsDialog(cls)}>
                          <Eye className="h-3.5 w-3.5 mr-1" />View
                        </Button>
                      </div>

                      {/* Student Count & Class Teacher */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-sm">
                            <span className="font-semibold">{studentCount}</span> Students
                          </span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate">
                            {classTeacherName ? (
                              <span className="font-medium">{classTeacherName}</span>
                            ) : (
                              <span className="text-muted-foreground">No CT</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button variant="default" size="sm" className="flex-1" onClick={() => openManageDialog(cls)}>
                          <Settings className="h-3.5 w-3.5 mr-1" />Manage
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setEditingClass(cls); setFormData({ name: cls.name, section: cls.section || "", academic_year: cls.academic_year }); setIsDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClass(cls.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Manage Class Dialog */}
          <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  Manage {selectedClass?.name}{selectedClass?.section ? ` - ${selectedClass.section}` : ""}
                </DialogTitle>
              </DialogHeader>

              {loadingManage ? (
                <div className="py-8 text-center">Loading...</div>
              ) : (
                <Tabs defaultValue="class-teacher" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="class-teacher">
                      <GraduationCap className="h-4 w-4 mr-2" />Class Teacher
                    </TabsTrigger>
                    <TabsTrigger value="subjects">
                      <BookOpen className="h-4 w-4 mr-2" />Subjects
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="class-teacher" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Select Class Teacher</Label>
                      <div className="flex gap-2">
                        <Select value={classTeacher} onValueChange={setClassTeacher}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">No Class Teacher</SelectItem>
                            {teachers.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleSetClassTeacher}>Save</Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        The class teacher will be responsible for marking attendance and managing this class.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="subjects" className="space-y-4 mt-4">
                    {/* Add Subject */}
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-medium mb-3">Add Subject to Class</h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select value={selectedSubjectToAdd} onValueChange={setSelectedSubjectToAdd}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select Subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects
                              .filter(s => !classSubjects.some(cs => cs.subject_id === s.id))
                              .map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ""}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Select value={selectedSubjectTeacher} onValueChange={setSelectedSubjectTeacher}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Subject Teacher (Optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">No Teacher</SelectItem>
                            {teachers.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddSubjectToClass}>
                          <Plus className="h-4 w-4 mr-1" />Add
                        </Button>
                      </div>
                    </div>

                    {/* Subject List */}
                    {classSubjects.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No subjects assigned to this class yet
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Teacher</TableHead>
                            <TableHead className="w-20">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classSubjects.map((cs) => (
                            <TableRow key={cs.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{cs.subjects.name}</span>
                                  {cs.subjects.code && (
                                    <Badge variant="secondary" className="text-xs">{cs.subjects.code}</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={cs.teacher_id || "_none"}
                                  onValueChange={(val) => handleUpdateSubjectTeacher(cs.id, val === "_none" ? "" : val)}
                                >
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Assign Teacher" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="_none">No Teacher</SelectItem>
                                    {teachers.map((t) => (
                                      <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveSubjectFromClass(cs.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </DialogContent>
          </Dialog>

          {/* View Students Dialog */}
          <Dialog open={studentsDialogOpen} onOpenChange={setStudentsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Students in {viewingClass?.name}{viewingClass?.section ? ` - ${viewingClass.section}` : ""}
                </DialogTitle>
              </DialogHeader>

              {loadingStudents ? (
                <div className="py-8 text-center">Loading...</div>
              ) : classStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Students</h3>
                  <p className="text-muted-foreground">No students are enrolled in this class yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.roll_number || "-"}</TableCell>
                        <TableCell className="font-medium">{student.full_name}</TableCell>
                        <TableCell>{student.admission_number || "-"}</TableCell>
                        <TableCell>{student.parent_name || "-"}</TableCell>
                        <TableCell>{student.parent_phone || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold">{classStudents.length}</span> students
                </p>
                <Button variant="outline" onClick={() => setStudentsDialogOpen(false)}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Classes;
