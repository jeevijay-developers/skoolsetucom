import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, Download, Eye } from "lucide-react";
import { TeacherStatsCards } from "@/components/analytics/PerformanceCharts";

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
  class: { name: string; section: string | null } | null;
}

interface ExamResult {
  subject: string;
  obtained_marks: number;
  max_marks: number;
  grade: string | null;
}

const TeacherReportCards = () => {
  const { schoolId } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentResults, setStudentResults] = useState<ExamResult[]>([]);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [teacherStats, setTeacherStats] = useState({
    avgMarks: 0, passRate: 0, highestScorer: "", lowestScorer: "", totalStudents: 0,
  });

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchExams();
      fetchStudents();
      fetchTeacherStats();
    }
  }, [schoolId]);

  const fetchTeacherStats = async () => {
    const { data: results } = await supabase
      .from("exam_results")
      .select(`
        obtained_marks, max_marks,
        students!inner (full_name, school_id)
      `);

    const filtered = (results || []).filter((r: any) => r.students?.school_id === schoolId);
    if (filtered.length === 0) return;

    const studentTotals: Record<string, { name: string; total: number; max: number }> = {};
    let passCount = 0;
    let totalObtained = 0;
    let totalMax = 0;

    filtered.forEach((r: any) => {
      totalObtained += r.obtained_marks;
      totalMax += r.max_marks;
      if (r.max_marks > 0 && (r.obtained_marks / r.max_marks) * 100 >= 33) passCount++;

      const name = r.students?.full_name || "Unknown";
      if (!studentTotals[name]) studentTotals[name] = { name, total: 0, max: 0 };
      studentTotals[name].total += r.obtained_marks;
      studentTotals[name].max += r.max_marks;
    });

    const sorted = Object.values(studentTotals)
      .map((s) => ({ ...s, pct: s.max > 0 ? (s.total / s.max) * 100 : 0 }))
      .sort((a, b) => b.pct - a.pct);

    setTeacherStats({
      avgMarks: totalMax > 0 ? (totalObtained / totalMax) * 100 : 0,
      passRate: filtered.length > 0 ? (passCount / filtered.length) * 100 : 0,
      highestScorer: sorted[0]?.name || "",
      lowestScorer: sorted[sorted.length - 1]?.name || "",
      totalStudents: sorted.length,
    });
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name, section")
      .eq("school_id", schoolId)
      .order("name");
    setClasses(data || []);
  };

  const fetchExams = async () => {
    const { data } = await supabase
      .from("exams")
      .select("id, name, exam_type")
      .eq("school_id", schoolId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    setExams(data || []);
  };

  const fetchStudents = async () => {
    setLoading(true);
    let query = supabase
      .from("students")
      .select(`
        id, full_name, roll_number,
        class:class_id (name, section)
      `)
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("full_name");

    if (selectedClass && selectedClass !== "all") {
      query = query.eq("class_id", selectedClass);
    }

    const { data } = await query;
    setStudents((data || []) as any);
    setLoading(false);
  };

  const viewResults = async (student: Student) => {
    setSelectedStudent(student);
    
    let query = supabase
      .from("exam_results")
      .select("subject, obtained_marks, max_marks, grade, exam_id")
      .eq("student_id", student.id);

    if (selectedExam && selectedExam !== "all") {
      query = query.eq("exam_id", selectedExam);
    }

    const { data } = await query;
    setStudentResults((data || []) as ExamResult[]);
    setResultsDialogOpen(true);
  };

  const downloadReportCard = (student: Student) => {
    const totalMarks = studentResults.reduce((sum, r) => sum + r.obtained_marks, 0);
    const maxMarks = studentResults.reduce((sum, r) => sum + r.max_marks, 0);
    const percentage = maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(2) : 0;

    const reportContent = `
REPORT CARD
===========
Student: ${student.full_name}
Roll No: ${student.roll_number || 'N/A'}
Class: ${student.class?.name || ''} ${student.class?.section || ''}

SUBJECT-WISE MARKS
------------------
${studentResults.map(r => `${r.subject}: ${r.obtained_marks}/${r.max_marks} (${r.grade || 'N/A'})`).join('\n')}

SUMMARY
-------
Total Marks: ${totalMarks}/${maxMarks}
Percentage: ${percentage}%

---
Generated by SkoolSetu
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_card_${student.full_name.replace(/\s+/g, '_')}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredStudents = students.filter((student) =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Report Cards - SkoolSetu</title></Helmet>
      <DashboardLayout role="teacher">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Report Cards</h1>
            <p className="text-muted-foreground">View and download student report cards</p>
          </div>

          {/* Summary Stats */}
          <TeacherStatsCards stats={teacherStats} />

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Classes" />
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
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Exams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name}
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
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Students ({filteredStudents.length})
              </CardTitle>
              <CardDescription>Click to view results and download report card</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.roll_number || "-"}</TableCell>
                        <TableCell className="font-medium">{student.full_name}</TableCell>
                        <TableCell>
                          {student.class 
                            ? `${student.class.name}${student.class.section ? ` - ${student.class.section}` : ""}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewResults(student)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Results
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Dialog */}
        <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Results - {selectedStudent?.full_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Class: {selectedStudent?.class?.name} {selectedStudent?.class?.section || ""} | 
                Roll No: {selectedStudent?.roll_number || "N/A"}
              </div>

              {studentResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No results found</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Marks Obtained</TableHead>
                        <TableHead>Max Marks</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentResults.map((result, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{result.subject}</TableCell>
                          <TableCell>{result.obtained_marks}</TableCell>
                          <TableCell>{result.max_marks}</TableCell>
                          <TableCell>
                            {((result.obtained_marks / result.max_marks) * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.grade || "-"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <p className="font-semibold">
                        Total: {studentResults.reduce((s, r) => s + r.obtained_marks, 0)} / {studentResults.reduce((s, r) => s + r.max_marks, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Overall: {studentResults.reduce((s, r) => s + r.max_marks, 0) > 0
                          ? ((studentResults.reduce((s, r) => s + r.obtained_marks, 0) / studentResults.reduce((s, r) => s + r.max_marks, 0)) * 100).toFixed(2)
                          : 0}%
                      </p>
                    </div>
                    <Button onClick={() => selectedStudent && downloadReportCard(selectedStudent)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Report Card
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
};

export default TeacherReportCards;