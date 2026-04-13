import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import ClassSetupWizard from "@/components/class-setup/ClassSetupWizard";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Minus, Pencil, Trash2, School, Users, Settings, GraduationCap, UserCheck, Eye, Download, IndianRupee } from "lucide-react";
import { exportToCSV, formatClassesForExport } from "@/utils/exportUtils";

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

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
  admission_number: string | null;
  parent_name: string | null;
  parent_phone: string | null;
}

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  class_id: string | null;
}

interface NewFeeStructure {
  name: string;
  amount: string;
  frequency: string;
}

const Classes = () => {
  const { schoolId } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ name: "", section: "", academic_year: "2024-25" });
  
  // Fee structures for class creation
  const [newFeeStructures, setNewFeeStructures] = useState<NewFeeStructure[]>([]);
  const [newFeeForm, setNewFeeForm] = useState<NewFeeStructure>({ name: "", amount: "", frequency: "monthly" });
  
  // Manage class dialog
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classFeeStructures, setClassFeeStructures] = useState<FeeStructure[]>([]);
  const [classTeacher, setClassTeacher] = useState<string>("");
  const [loadingManage, setLoadingManage] = useState(false);
  
  // Add fee structure to class in manage dialog
  const [manageFeeForm, setManageFeeForm] = useState<NewFeeStructure>({ name: "", amount: "", frequency: "monthly" });
  
  // Student counts
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  
  // Fee structure counts
  const [feeStructureCounts, setFeeStructureCounts] = useState<Record<string, number>>({});
  
  // View students dialog
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [viewingClass, setViewingClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchTeachers();
      fetchStudentCounts();
      fetchFeeStructureCounts();
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

  const fetchFeeStructureCounts = async () => {
    const { data } = await supabase
      .from("fee_structures")
      .select("class_id")
      .eq("school_id", schoolId);
    
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(f => {
        if (f.class_id) {
          counts[f.class_id] = (counts[f.class_id] || 0) + 1;
        }
      });
      setFeeStructureCounts(counts);
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
    
    // Fetch fee structures for this class
    const { data: feeData } = await supabase
      .from("fee_structures")
      .select("*")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .order("name");
    
    setClassFeeStructures(feeData || []);
    
    // Get class teacher
    const cls = classes.find(c => c.id === classId);
    setClassTeacher(cls?.class_teacher_id || "_none");
    
    setLoadingManage(false);
  };

  const handleAddFeeToNewClass = () => {
    if (!newFeeForm.name.trim() || !newFeeForm.amount) {
      toast.error("Please enter fee name and amount");
      return;
    }
    setNewFeeStructures([...newFeeStructures, { ...newFeeForm }]);
    setNewFeeForm({ name: "", amount: "", frequency: "monthly" });
  };

  const handleRemoveFeeFromNewClass = (index: number) => {
    setNewFeeStructures(newFeeStructures.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter class name");
      return;
    }
    
    // Require at least one fee structure for new classes
    if (!editingClass && newFeeStructures.length === 0) {
      toast.error("Please add at least one fee structure for this class");
      return;
    }
    
    try {
      if (editingClass) {
        await supabase.from("classes").update(formData).eq("id", editingClass.id);
        toast.success("Class updated");
      } else {
        const { data: newClass, error: classError } = await supabase
          .from("classes")
          .insert({ ...formData, school_id: schoolId })
          .select("id")
          .single();
        
        if (classError) throw classError;
        
        if (newClass && newFeeStructures.length > 0) {
          const feeStructuresData = newFeeStructures.map(fee => ({
            school_id: schoolId!,
            class_id: newClass.id,
            name: fee.name,
            amount: parseFloat(fee.amount),
            frequency: fee.frequency,
          }));
          
          const { error: feeError } = await supabase
            .from("fee_structures")
            .insert(feeStructuresData);
          
          if (feeError) throw feeError;
        }
        
        toast.success("Class added with fee structures");
      }
      setIsDialogOpen(false);
      setFormData({ name: "", section: "", academic_year: "2024-25" });
      setNewFeeStructures([]);
      setEditingClass(null);
      fetchClasses();
      fetchFeeStructureCounts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure? This will also remove all teacher assignments and fee structures.")) return;
    try {
      await supabase.from("teacher_classes").delete().eq("class_id", id);
      await supabase.from("fee_structures").delete().eq("class_id", id);
      await supabase.from("classes").delete().eq("id", id);
      toast.success("Class deleted");
      fetchClasses();
      fetchFeeStructureCounts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openManageDialog = (cls: Class) => {
    setSelectedClass(cls);
    setManageDialogOpen(true);
    setManageFeeForm({ name: "", amount: "", frequency: "monthly" });
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
      
      await supabase
        .from("teacher_classes")
        .delete()
        .eq("class_id", selectedClass.id)
        .eq("is_class_teacher", true);
      
      if (teacherId) {
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

  const handleAddFeeToClass = async () => {
    if (!selectedClass || !manageFeeForm.name.trim() || !manageFeeForm.amount) {
      toast.error("Please enter fee name and amount");
      return;
    }
    
    try {
      await supabase.from("fee_structures").insert({
        school_id: schoolId,
        class_id: selectedClass.id,
        name: manageFeeForm.name,
        amount: parseFloat(manageFeeForm.amount),
        frequency: manageFeeForm.frequency,
      });
      toast.success("Fee structure added");
      setManageFeeForm({ name: "", amount: "", frequency: "monthly" });
      fetchClassDetails(selectedClass.id);
      fetchFeeStructureCounts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteFeeStructure = async (feeId: string) => {
    try {
      await supabase.from("fee_structures").delete().eq("id", feeId);
      toast.success("Fee structure removed");
      if (selectedClass) fetchClassDetails(selectedClass.id);
      fetchFeeStructureCounts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getClassTeacherName = (classTeacherId: string | null) => {
    if (!classTeacherId) return null;
    return teachers.find(t => t.id === classTeacherId)?.full_name;
  };

  const groupedClasses = useMemo(() => {
    const groups: Record<string, Class[]> = {};
    classes.forEach((cls) => {
      if (!groups[cls.name]) groups[cls.name] = [];
      groups[cls.name].push(cls);
    });
    Object.values(groups).forEach((g) => g.sort((a, b) => (a.section || "A").localeCompare(b.section || "A")));
    return groups;
  }, [classes]);

  const handleAddSection = async (className: string) => {
    const existing = groupedClasses[className] || [];
    const existingSections = existing.map((c) => c.section || "A");
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let nextSection = "A";
    for (const letter of alphabet) {
      if (!existingSections.includes(letter)) {
        nextSection = letter;
        break;
      }
    }
    try {
      const academicYear = existing[0]?.academic_year || "2024-25";
      const { error } = await supabase.from("classes").insert({
        name: className,
        section: nextSection,
        school_id: schoolId,
        academic_year: academicYear,
      });
      if (error) throw error;
      toast.success(`Section ${className}-${nextSection} added`);
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveSection = async (className: string) => {
    const existing = groupedClasses[className] || [];
    if (existing.length <= 1) {
      toast.error("Cannot remove the last section");
      return;
    }
    const lastSection = existing[existing.length - 1];
    const studentCount = studentCounts[lastSection.id] || 0;
    if (studentCount > 0) {
      toast.error(`Cannot remove section ${className}-${lastSection.section || "A"} — it has ${studentCount} student(s)`);
      return;
    }
    if (!confirm(`Remove section ${className}-${lastSection.section || "A"}?`)) return;
    try {
      await supabase.from("teacher_classes").delete().eq("class_id", lastSection.id);
      await supabase.from("fee_structures").delete().eq("class_id", lastSection.id);
      await supabase.from("classes").delete().eq("id", lastSection.id);
      toast.success(`Section ${className}-${lastSection.section || "A"} removed`);
      fetchClasses();
      fetchFeeStructureCounts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <Helmet><title>Classes - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Classes</h1>
              <p className="text-muted-foreground">Manage classes, teachers & fee structures</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const data = formatClassesForExport(classes, studentCounts, teachers);
                  if (exportToCSV(data, "classes")) {
                    toast.success("Classes exported successfully");
                  } else {
                    toast.error("No data to export");
                  }
                }}
                disabled={classes.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setNewFeeStructures([]);
                  setEditingClass(null);
                  setFormData({ name: "", section: "", academic_year: "2024-25" });
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingClass(null); setFormData({ name: "", section: "", academic_year: "2024-25" }); setNewFeeStructures([]); }}>
                    <Plus className="h-4 w-4 mr-2" />Add Class
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingClass ? "Edit" : "Add"} Class</DialogTitle>
                    <DialogDescription>
                      {editingClass ? "Update class details" : "Create a new class with fee structures"}
                    </DialogDescription>
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
                    
                    {!editingClass && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-primary" />
                          <Label className="text-base font-semibold">Fee Structures *</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Add fee structures for this class. At least one is required.
                        </p>
                        
                        {newFeeStructures.length > 0 && (
                          <div className="space-y-2">
                            {newFeeStructures.map((fee, index) => (
                              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                <div>
                                  <p className="text-sm font-medium">{fee.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    ₹{parseFloat(fee.amount).toLocaleString()} • {fee.frequency}
                                  </p>
                                </div>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRemoveFeeFromNewClass(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Fee Name</Label>
                            <Input 
                              value={newFeeForm.name} 
                              onChange={(e) => setNewFeeForm({ ...newFeeForm, name: e.target.value })} 
                              placeholder="e.g., Tuition Fee" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm">Amount (₹)</Label>
                              <Input 
                                type="number" 
                                value={newFeeForm.amount} 
                                onChange={(e) => setNewFeeForm({ ...newFeeForm, amount: e.target.value })} 
                                placeholder="5000" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Frequency</Label>
                              <Select value={newFeeForm.frequency} onValueChange={(v) => setNewFeeForm({ ...newFeeForm, frequency: v })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="quarterly">Quarterly</SelectItem>
                                  <SelectItem value="yearly">Yearly</SelectItem>
                                  <SelectItem value="one-time">One Time</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={handleAddFeeToNewClass} className="w-full">
                            <Plus className="h-4 w-4 mr-1" />Add Fee Structure
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter><Button type="submit">{editingClass ? "Update" : "Add Class"}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : classes.length === 0 ? (
            <>
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <School className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Classes Yet</h3>
                  <p className="text-muted-foreground mb-4">Set up your school's class structure to get started</p>
                  <Button onClick={() => setShowSetupWizard(true)}>
                    <Plus className="h-4 w-4 mr-2" />Set Up Classes
                  </Button>
                </CardContent>
              </Card>
              {schoolId && (
                <ClassSetupWizard
                  open={showSetupWizard}
                  schoolId={schoolId}
                  onComplete={() => {
                    setShowSetupWizard(false);
                    fetchClasses();
                    fetchFeeStructureCounts();
                  }}
                />
              )}
            </>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedClasses).map(([className, sections]) => (
                <div key={className}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold">{className}</h3>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleRemoveSection(className)} disabled={sections.length <= 1}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Badge variant="secondary" className="min-w-[80px] justify-center">{sections.length} section{sections.length > 1 ? "s" : ""}</Badge>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleAddSection(className)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sections.map((cls) => {
                      const classTeacherName = getClassTeacherName(cls.class_teacher_id);
                      const studentCount = studentCounts[cls.id] || 0;
                      const feeCount = feeStructureCounts[cls.id] || 0;
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

                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="text-sm">
                                  <span className="font-semibold">{studentCount}</span> Students
                                </span>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                <IndianRupee className="h-4 w-4 text-secondary" />
                                <span className="text-sm">
                                  <span className="font-semibold">{feeCount}</span> Fees
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 mb-3">
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm truncate">
                                {classTeacherName ? (
                                  <span className="font-medium">{classTeacherName}</span>
                                ) : (
                                  <span className="text-muted-foreground">No CT</span>
                                )}
                              </span>
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
                </div>
              ))}
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
                    <TabsTrigger value="fees">
                      <IndianRupee className="h-4 w-4 mr-2" />Fee Structures
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

                  {/* Fee Structures Tab */}
                  <TabsContent value="fees" className="space-y-4 mt-4">
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-medium mb-3">Add Fee Structure</h4>
                      <div className="grid gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Fee Name</Label>
                          <Input 
                            value={manageFeeForm.name} 
                            onChange={(e) => setManageFeeForm({ ...manageFeeForm, name: e.target.value })} 
                            placeholder="e.g., Tuition Fee, Lab Fee" 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Amount (₹)</Label>
                            <Input 
                              type="number" 
                              value={manageFeeForm.amount} 
                              onChange={(e) => setManageFeeForm({ ...manageFeeForm, amount: e.target.value })} 
                              placeholder="5000" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Frequency</Label>
                            <Select value={manageFeeForm.frequency} onValueChange={(v) => setManageFeeForm({ ...manageFeeForm, frequency: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                                <SelectItem value="one-time">One Time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button onClick={handleAddFeeToClass}>
                          <Plus className="h-4 w-4 mr-1" />Add Fee Structure
                        </Button>
                      </div>
                    </div>

                    {classFeeStructures.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No fee structures for this class yet
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fee Name</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead className="w-20">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classFeeStructures.map((fee) => (
                            <TableRow key={fee.id}>
                              <TableCell className="font-medium">{fee.name}</TableCell>
                              <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                              <TableCell className="capitalize">{fee.frequency}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteFeeStructure(fee.id)}
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
