import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, UserX, UserCheck, Key, Copy, Eye, Lock, Upload, User, Download, AlertTriangle, School } from "lucide-react";
import { exportToCSV, formatStudentsForExport } from "@/utils/exportUtils";
import { toast as sonnerToast } from "sonner";

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
  admission_number: string | null;
  class_id: string | null;
  parent_name: string | null;
  mother_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  parent_user_id: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  blood_group: string | null;
  photo_url: string | null;
  is_active: boolean;
  classes?: { name: string; section: string | null } | null;
}

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface StudentFee {
  id: string;
  amount: number;
  paid_amount: number | null;
  status: string | null;
  due_date: string;
  fee_structures?: { name: string } | null;
}

interface AttendanceRecord {
  date: string;
  status: string;
}

interface ExamResult {
  id: string;
  subject: string;
  obtained_marks: number;
  max_marks: number;
  grade: string | null;
  exams?: { name: string; exam_type: string | null } | null;
}

const Students = () => {
  const navigate = useNavigate();
  const { schoolId, isSubscriptionActive } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [feeStructures, setFeeStructures] = useState<{ class_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState({ title: "", description: "", action: "" });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [overviewDialogOpen, setOverviewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>([]);
  const [studentExamResults, setStudentExamResults] = useState<ExamResult[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    roll_number: "",
    admission_number: "",
    class_id: "",
    parent_name: "",
    mother_name: "",
    parent_phone: "",
    parent_email: "",
    gender: "",
    date_of_birth: "",
    address: "",
    blood_group: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
    medical_notes: "",
    previous_school: "",
    nationality: "",
  });

  useEffect(() => {
    if (schoolId) {
      fetchStudents();
      fetchClasses();
      fetchFeeStructures();
    }
  }, [schoolId]);

  const fetchFeeStructures = async () => {
    if (!schoolId) return;
    const { data } = await supabase
      .from("fee_structures")
      .select("class_id")
      .eq("school_id", schoolId);
    setFeeStructures(data || []);
  };

  const handleAddStudentClick = () => {
    // Check if classes exist
    if (classes.length === 0) {
      setWarningMessage({
        title: "No Classes Found",
        description: "Please add at least one class before adding students. Classes are required to organize students and assign fee structures.",
        action: "classes"
      });
      setWarningDialogOpen(true);
      return;
    }
    
    // Check if any class has fee structures
    const classesWithFees = classes.filter(cls => 
      feeStructures.some(f => f.class_id === cls.id)
    );
    
    if (classesWithFees.length === 0) {
      setWarningMessage({
        title: "No Fee Structures Found",
        description: "Please add fee structures to your classes before adding students. Fee structures are created when you add or manage a class.",
        action: "classes"
      });
      setWarningDialogOpen(true);
      return;
    }
    
    // All good, open the dialog
    setEditingStudent(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const fetchStudents = async () => {
    if (!schoolId) return;

    try {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id, full_name, roll_number, admission_number, class_id,
          parent_name, mother_name, parent_phone, parent_email, parent_user_id,
          gender, date_of_birth, address, blood_group, photo_url, is_active,
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, studentId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId || 'temp'}-${Date.now()}.${fileExt}`;
      const filePath = `${schoolId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath);

      if (studentId) {
        const { error: updateError } = await supabase
          .from('students')
          .update({ photo_url: publicUrl })
          .eq('id', studentId);

        if (updateError) throw updateError;
        toast.success("Photo uploaded successfully");
        fetchStudents();
      }

      return publicUrl;
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Auto-assign fees to student based on fee structures for their class
  const assignFeesToStudent = async (studentId: string, classId: string) => {
    try {
      // Get fee structures for this class or school-wide (class_id is null)
      const { data: feeStructures, error: feeError } = await supabase
        .from("fee_structures")
        .select("id, name, amount, frequency")
        .eq("school_id", schoolId)
        .or(`class_id.eq.${classId},class_id.is.null`);

      if (feeError) throw feeError;

      if (feeStructures && feeStructures.length > 0) {
        // Create student fee records for each fee structure
        const studentFees = feeStructures.map(fee => ({
          school_id: schoolId!,
          student_id: studentId,
          fee_structure_id: fee.id,
          amount: fee.amount,
          due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], // Due in 1 month
          status: "pending",
          paid_amount: 0,
        }));

        const { error: insertError } = await supabase
          .from("student_fees")
          .insert(studentFees);

        if (insertError) {
          console.error("Error assigning fees:", insertError);
        }
      }
    } catch (error) {
      console.error("Error in assignFeesToStudent:", error);
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
      const studentData: Record<string, any> = {
        school_id: schoolId!,
        full_name: formData.full_name,
        roll_number: formData.roll_number || null,
        admission_number: formData.admission_number || null,
        class_id: formData.class_id || null,
        parent_name: formData.parent_name || null,
        mother_name: formData.mother_name || null,
        parent_phone: formData.parent_phone || null,
        parent_email: formData.parent_email || null,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        address: formData.address || null,
        blood_group: formData.blood_group || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        emergency_contact_relation: formData.emergency_contact_relation || null,
        medical_notes: formData.medical_notes || null,
        previous_school: formData.previous_school || null,
        nationality: formData.nationality || null,
      };

      if (editingStudent) {
        const { error } = await supabase
          .from("students")
          .update(studentData)
          .eq("id", editingStudent.id);

        if (error) throw error;
        toast.success("Student updated successfully");
      } else {
        // Insert student and get the ID
        const { data: newStudent, error } = await supabase
          .from("students")
          .insert(studentData as any)
          .select("id")
          .single();

        if (error) throw error;

        // Auto-assign fees based on fee structures for the class
        if (newStudent && formData.class_id) {
          await assignFeesToStudent(newStudent.id, formData.class_id);
        }
        
        toast.success("Student added successfully with fees assigned");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchStudents();
    } catch (error: any) {
      console.error("Error saving student:", error);
      toast.error(error.message || "Failed to save student");
    }
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      roll_number: student.roll_number || "",
      admission_number: student.admission_number || "",
      class_id: student.class_id || "",
      parent_name: student.parent_name || "",
      mother_name: student.mother_name || "",
      parent_phone: student.parent_phone || "",
      parent_email: student.parent_email || "",
      gender: student.gender || "",
      date_of_birth: student.date_of_birth || "",
      address: student.address || "",
      blood_group: student.blood_group || "",
      emergency_contact_name: student.emergency_contact_name || "",
      emergency_contact_phone: student.emergency_contact_phone || "",
      emergency_contact_relation: student.emergency_contact_relation || "",
      medical_notes: student.medical_notes || "",
      previous_school: student.previous_school || "",
      nationality: student.nationality || "",
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

  const handleViewOverview = async (student: Student) => {
    setSelectedStudent(student);
    setOverviewDialogOpen(true);
    setLoadingOverview(true);

    try {
      // Fetch student fees
      const { data: fees, error: feesError } = await supabase
        .from("student_fees")
        .select(`
          id, amount, paid_amount, status, due_date,
          fee_structures:fee_structure_id (name)
        `)
        .eq("student_id", student.id)
        .order("due_date", { ascending: false });

      if (feesError) throw feesError;
      setStudentFees(fees || []);

      // Fetch attendance records (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("date, status")
        .eq("student_id", student.id)
        .gte("date", thirtyDaysAgo.toISOString().split('T')[0])
        .order("date", { ascending: false });

      if (attendanceError) throw attendanceError;
      setStudentAttendance(attendance || []);

      // Fetch exam results
      const { data: results, error: resultsError } = await supabase
        .from("exam_results")
        .select(`
          id, subject, obtained_marks, max_marks, grade,
          exams:exam_id (name, exam_type)
        `)
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      if (resultsError) throw resultsError;
      setStudentExamResults(results || []);
    } catch (error) {
      console.error("Error fetching student overview:", error);
      toast.error("Failed to load student details");
    } finally {
      setLoadingOverview(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedStudent?.parent_user_id) {
      toast.error("No parent login exists for this student");
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
      // Note: This requires admin privileges - we'll use edge function
      const { error } = await supabase.functions.invoke("create-parent-login", {
        body: { 
          student_id: selectedStudent.id, 
          temp_password: newPassword,
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

  const resetForm = () => {
    setEditingStudent(null);
    setFormData({
      full_name: "",
      roll_number: "",
      admission_number: "",
      class_id: "",
      parent_name: "",
      mother_name: "",
      parent_phone: "",
      parent_email: "",
      gender: "",
      date_of_birth: "",
      address: "",
      blood_group: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relation: "",
      medical_notes: "",
      previous_school: "",
      nationality: "",
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

  const calculateFeeSummary = () => {
    const totalFees = studentFees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidFees = studentFees.reduce((sum, fee) => sum + (fee.paid_amount || 0), 0);
    const pendingFees = totalFees - paidFees;
    return { totalFees, paidFees, pendingFees };
  };

  const calculateAttendanceSummary = () => {
    const total = studentAttendance.length;
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const absent = studentAttendance.filter(a => a.status === 'absent').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percentage };
  };

  const calculateExamSummary = () => {
    if (studentExamResults.length === 0) return { totalExams: 0, avgPercentage: 0, totalSubjects: 0 };
    
    const examNames = new Set(studentExamResults.map(r => r.exams?.name));
    const totalExams = examNames.size;
    const totalSubjects = studentExamResults.length;
    const totalObtained = studentExamResults.reduce((sum, r) => sum + r.obtained_marks, 0);
    const totalMax = studentExamResults.reduce((sum, r) => sum + r.max_marks, 0);
    const avgPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    
    return { totalExams, avgPercentage, totalSubjects };
  };

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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const data = formatStudentsForExport(filteredStudents);
                  if (exportToCSV(data, "students")) {
                    sonnerToast.success("Students exported successfully");
                  } else {
                    sonnerToast.error("No data to export");
                  }
                }}
                disabled={filteredStudents.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button disabled={!isSubscriptionActive} onClick={handleAddStudentClick}>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
                    <DialogDescription>
                      {editingStudent ? "Update student information" : "Enter student details to add them to your school"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* Photo Upload for existing student */}
                    {editingStudent && (
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={editingStudent.photo_url || undefined} />
                          <AvatarFallback>
                            <User className="h-10 w-10" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Label htmlFor="photo-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                              <Upload className="h-4 w-4" />
                              {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                            </div>
                          </Label>
                          <Input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, editingStudent.id)}
                            disabled={uploadingPhoto}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Max 2MB, JPG/PNG</p>
                        </div>
                      </div>
                    )}

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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      <div className="space-y-2">
                        <Label htmlFor="blood_group">Blood Group</Label>
                        <Select
                          value={formData.blood_group}
                          onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Student's residential address"
                        rows={2}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Parent/Guardian Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="parent_name">Father's Name</Label>
                          <Input id="parent_name" value={formData.parent_name} onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })} placeholder="Father's name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mother_name">Mother's Name</Label>
                          <Input id="mother_name" value={formData.mother_name} onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })} placeholder="Mother's name" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="parent_phone">Parent Phone</Label>
                          <Input id="parent_phone" value={formData.parent_phone} onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })} placeholder="9876543210" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parent_email">Parent Email</Label>
                          <Input id="parent_email" type="email" value={formData.parent_email} onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })} placeholder="parent@email.com" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Emergency Contact</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emergency_contact_name">Contact Name</Label>
                          <Input id="emergency_contact_name" value={formData.emergency_contact_name} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} placeholder="Emergency contact name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                          <Input id="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })} placeholder="Phone number" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergency_contact_relation">Relation</Label>
                          <Input id="emergency_contact_relation" value={formData.emergency_contact_relation} onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })} placeholder="e.g., Uncle, Aunt" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Additional Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="previous_school">Previous School</Label>
                          <Input id="previous_school" value={formData.previous_school} onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })} placeholder="Name of previous school" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nationality">Nationality</Label>
                          <Input id="nationality" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} placeholder="Indian" />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="medical_notes">Medical Notes</Label>
                        <Textarea id="medical_notes" value={formData.medical_notes} onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })} placeholder="Allergies, conditions, medications..." rows={2} />
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
                        <TableHead>Photo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Master Data</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.photo_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {student.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
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
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewOverview(student)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Quick
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/school-admin/students/${student.id}`)}
                              >
                                <User className="h-4 w-4 mr-1" />
                                Profile
                              </Button>
                            </div>
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
                                {student.parent_user_id && (
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedStudent(student);
                                    setPasswordDialogOpen(true);
                                  }}>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Change Password
                                  </DropdownMenuItem>
                                )}
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

          {/* Student Master Data Dialog */}
          <Dialog open={overviewDialogOpen} onOpenChange={setOverviewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Master Data - {selectedStudent?.full_name}</DialogTitle>
                <DialogDescription>
                  Complete student profile, fees, and attendance information
                </DialogDescription>
              </DialogHeader>
              
              {loadingOverview ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : selectedStudent && (
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="fees">Fees</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="exams">Exam Results</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={selectedStudent.photo_url || undefined} />
                        <AvatarFallback className="text-2xl">
                          {selectedStudent.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Full Name</p>
                          <p className="font-medium">{selectedStudent.full_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Class</p>
                          <p className="font-medium">
                            {selectedStudent.classes
                              ? `${selectedStudent.classes.name}${selectedStudent.classes.section ? ` - ${selectedStudent.classes.section}` : ""}`
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Roll Number</p>
                          <p className="font-medium">{selectedStudent.roll_number || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Admission Number</p>
                          <p className="font-medium">{selectedStudent.admission_number || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Gender</p>
                          <p className="font-medium capitalize">{selectedStudent.gender || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Date of Birth</p>
                          <p className="font-medium">{selectedStudent.date_of_birth || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Blood Group</p>
                          <p className="font-medium">{selectedStudent.blood_group || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant={selectedStudent.is_active ? "default" : "secondary"}>
                            {selectedStudent.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Address</h4>
                      <p className="text-sm">{selectedStudent.address || "Not provided"}</p>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Parent/Guardian Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Father's Name</p>
                          <p className="font-medium">{selectedStudent.parent_name || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Mother's Name</p>
                          <p className="font-medium">{selectedStudent.mother_name || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{selectedStudent.parent_phone || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedStudent.parent_email || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="fees" className="space-y-4">
                    {(() => {
                      const { totalFees, paidFees, pendingFees } = calculateFeeSummary();
                      return (
                        <div className="grid grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Total Fees</p>
                              <p className="text-2xl font-bold">₹{totalFees.toLocaleString()}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Paid</p>
                              <p className="text-2xl font-bold text-green-600">₹{paidFees.toLocaleString()}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Pending</p>
                              <p className="text-2xl font-bold text-red-600">₹{pendingFees.toLocaleString()}</p>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })()}

                    {studentFees.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fee Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentFees.map((fee) => (
                            <TableRow key={fee.id}>
                              <TableCell>{fee.fee_structures?.name || "General Fee"}</TableCell>
                              <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                              <TableCell>₹{(fee.paid_amount || 0).toLocaleString()}</TableCell>
                              <TableCell>{fee.due_date}</TableCell>
                              <TableCell>
                                <Badge variant={fee.status === 'paid' ? 'default' : fee.status === 'partial' ? 'secondary' : 'destructive'}>
                                  {fee.status || 'pending'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No fee records found</p>
                    )}
                  </TabsContent>

                  <TabsContent value="attendance" className="space-y-4">
                    {(() => {
                      const { total, present, absent, percentage } = calculateAttendanceSummary();
                      return (
                        <div className="grid grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Total Days</p>
                              <p className="text-2xl font-bold">{total}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Present</p>
                              <p className="text-2xl font-bold text-green-600">{present}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Absent</p>
                              <p className="text-2xl font-bold text-red-600">{absent}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Percentage</p>
                              <p className="text-2xl font-bold">{percentage}%</p>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })()}

                    {studentAttendance.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentAttendance.map((record, index) => (
                              <TableRow key={index}>
                                <TableCell>{record.date}</TableCell>
                                <TableCell>
                                  <Badge variant={record.status === 'present' ? 'default' : 'destructive'}>
                                    {record.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No attendance records found (last 30 days)</p>
                    )}
                  </TabsContent>

                  <TabsContent value="exams" className="space-y-4">
                    {(() => {
                      const { totalExams, avgPercentage, totalSubjects } = calculateExamSummary();
                      return (
                        <div className="grid grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Total Exams</p>
                              <p className="text-2xl font-bold">{totalExams}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Subjects Attempted</p>
                              <p className="text-2xl font-bold">{totalSubjects}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Avg. Percentage</p>
                              <p className="text-2xl font-bold">{avgPercentage}%</p>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })()}

                    {studentExamResults.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Exam</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Obtained</TableHead>
                              <TableHead>Max Marks</TableHead>
                              <TableHead>Percentage</TableHead>
                              <TableHead>Grade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentExamResults.map((result) => {
                              const percentage = result.max_marks > 0 
                                ? Math.round((result.obtained_marks / result.max_marks) * 100) 
                                : 0;
                              return (
                                <TableRow key={result.id}>
                                  <TableCell className="font-medium">
                                    {result.exams?.name || "-"}
                                    {result.exams?.exam_type && (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({result.exams.exam_type})
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>{result.subject}</TableCell>
                                  <TableCell>{result.obtained_marks}</TableCell>
                                  <TableCell>{result.max_marks}</TableCell>
                                  <TableCell>
                                    <Badge variant={percentage >= 60 ? 'default' : percentage >= 33 ? 'secondary' : 'destructive'}>
                                      {percentage}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{result.grade || "-"}</Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No exam results found</p>
                    )}
                  </TabsContent>
                </Tabs>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setOverviewDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Change Password Dialog */}
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Parent Password</DialogTitle>
                <DialogDescription>
                  Set a new password for {selectedStudent?.parent_email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setPasswordDialogOpen(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}>
                  Cancel
                </Button>
                <Button onClick={handleChangePassword} disabled={updatingPassword}>
                  {updatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Warning Dialog for missing classes/fee structures */}
          <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  {warningMessage.title}
                </DialogTitle>
                <DialogDescription>
                  {warningMessage.description}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setWarningDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setWarningDialogOpen(false);
                  if (warningMessage.action === "classes") {
                    navigate("/school-admin/classes");
                  }
                }}>
                  <School className="h-4 w-4 mr-2" />
                  Go to Classes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Students;
