import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardList, BookOpen } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  exam_type: string;
  is_published: boolean;
}

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
}

const TeacherExamMarks = () => {
  const { schoolId } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [maxMarks, setMaxMarks] = useState<string>("100");
  const [studentMarks, setStudentMarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (schoolId) {
      fetchExams();
      fetchClasses();
    }
  }, [schoolId]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchExams = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("exams")
      .select("id, name, exam_type, is_published")
      .eq("school_id", schoolId)
      .eq("is_published", false)
      .order("created_at", { ascending: false });
    setExams(data || []);
    setLoading(false);
  };

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name, section")
      .eq("school_id", schoolId)
      .order("name");
    setClasses(data || []);
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from("students")
      .select("id, full_name, roll_number")
      .eq("school_id", schoolId)
      .eq("class_id", selectedClass)
      .eq("is_active", true)
      .order("roll_number");
    
    setStudents(data || []);
    
    // Initialize marks
    const marks: Record<string, string> = {};
    (data || []).forEach(s => marks[s.id] = "");
    setStudentMarks(marks);
  };

  const calculateGrade = (obtained: number, max: number): string => {
    const percentage = (obtained / max) * 100;
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";
    return "F";
  };

  const handleSaveMarks = async () => {
    if (!selectedExam || !selectedClass || !subject) {
      toast.error("Please fill all required fields");
      return;
    }

    const entries = Object.entries(studentMarks)
      .filter(([_, marks]) => marks !== "")
      .map(([studentId, marks]) => ({
        exam_id: selectedExam,
        student_id: studentId,
        subject: subject,
        max_marks: parseFloat(maxMarks),
        obtained_marks: parseFloat(marks),
        grade: calculateGrade(parseFloat(marks), parseFloat(maxMarks)),
      }));

    if (entries.length === 0) {
      toast.error("Please enter marks for at least one student");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("exam_results").insert(entries);
      if (error) throw error;
      
      toast.success(`Marks saved for ${entries.length} students`);
      
      // Reset form
      setSubject("");
      const marks: Record<string, string> = {};
      students.forEach(s => marks[s.id] = "");
      setStudentMarks(marks);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet><title>Enter Exam Marks - SkoolSetu</title></Helmet>
      <DashboardLayout role="teacher">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Enter Exam Marks</h1>
            <p className="text-muted-foreground">Enter student marks for examinations</p>
          </div>

          {/* Selection */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Select Exam *</Label>
                  <Select value={selectedExam} onValueChange={setSelectedExam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map((exam) => (
                        <SelectItem key={exam.id} value={exam.id}>
                          {exam.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Select Class *</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose class" />
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
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Marks</Label>
                  <Input
                    type="number"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    placeholder="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students Marks Entry */}
          {selectedExam && selectedClass && students.length > 0 && (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Enter Marks ({students.length} students)
                  </CardTitle>
                  <Button onClick={handleSaveMarks} disabled={saving || !subject}>
                    {saving ? "Saving..." : "Save Marks"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Marks Obtained</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const marks = studentMarks[student.id];
                      const grade = marks ? calculateGrade(parseFloat(marks), parseFloat(maxMarks)) : "-";
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell>{student.roll_number || "-"}</TableCell>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-24"
                              max={maxMarks}
                              value={marks}
                              onChange={(e) => setStudentMarks({
                                ...studentMarks,
                                [student.id]: e.target.value
                              })}
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant={grade === "F" ? "destructive" : grade === "-" ? "outline" : "secondary"}>
                              {grade}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {selectedExam && selectedClass && students.length === 0 && (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                No students found in selected class
              </CardContent>
            </Card>
          )}

          {(!selectedExam || !selectedClass) && !loading && (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                Select an exam and class to enter marks
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </>
  );
};

export default TeacherExamMarks;
