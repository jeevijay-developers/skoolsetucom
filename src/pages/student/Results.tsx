import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, Award, TrendingUp } from "lucide-react";
import { StudentProgressChart, SubjectStrengthCard } from "@/components/analytics/PerformanceCharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

interface ExamResult {
  id: string;
  subject: string;
  obtained_marks: number;
  max_marks: number;
  grade: string | null;
  remarks: string | null;
}

interface Exam {
  id: string;
  name: string;
  exam_type: string | null;
  start_date: string | null;
  results: ExamResult[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
}

const StudentResults = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamType, setSelectedExamType] = useState<string>("all");
  const [overallStats, setOverallStats] = useState({ avgPercentage: 0, bestSubject: "", totalExams: 0 });

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  const fetchResults = async () => {
    try {
      // First get student ID
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .or(`user_id.eq.${user?.id},parent_user_id.eq.${user?.id}`)
        .maybeSingle();

      if (!studentData) {
        setLoading(false);
        return;
      }

      // Fetch all exam results with exam details
      const { data, error } = await supabase
        .from("exam_results")
        .select(`
          id,
          subject,
          obtained_marks,
          max_marks,
          grade,
          remarks,
          exams:exam_id (id, name, exam_type, start_date, is_published)
        `)
        .eq("student_id", studentData.id);

      if (error) throw error;

      // Group results by exam
      const examMap = new Map<string, Exam>();
      const subjectScores: Record<string, { obtained: number; max: number }> = {};

      (data || []).forEach((result) => {
        const exam = result.exams as any;
        if (!exam || !exam.is_published) return;

        if (!examMap.has(exam.id)) {
          examMap.set(exam.id, {
            id: exam.id,
            name: exam.name,
            exam_type: exam.exam_type,
            start_date: exam.start_date,
            results: [],
            totalObtained: 0,
            totalMax: 0,
            percentage: 0,
          });
        }

        const examEntry = examMap.get(exam.id)!;
        examEntry.results.push({
          id: result.id,
          subject: result.subject,
          obtained_marks: result.obtained_marks,
          max_marks: result.max_marks,
          grade: result.grade,
          remarks: result.remarks,
        });
        examEntry.totalObtained += result.obtained_marks;
        examEntry.totalMax += result.max_marks;

        // Track subject scores for best subject calculation
        if (!subjectScores[result.subject]) {
          subjectScores[result.subject] = { obtained: 0, max: 0 };
        }
        subjectScores[result.subject].obtained += result.obtained_marks;
        subjectScores[result.subject].max += result.max_marks;
      });

      // Calculate percentages and sort
      const examsList = Array.from(examMap.values()).map((exam) => ({
        ...exam,
        percentage: exam.totalMax > 0 ? Math.round((exam.totalObtained / exam.totalMax) * 100) : 0,
      }));
      examsList.sort((a, b) => (b.start_date || "").localeCompare(a.start_date || ""));

      setExams(examsList);

      // Calculate overall stats
      const avgPercentage = examsList.length > 0
        ? Math.round(examsList.reduce((sum, e) => sum + e.percentage, 0) / examsList.length)
        : 0;

      let bestSubject = "";
      let bestPercentage = 0;
      Object.entries(subjectScores).forEach(([subject, scores]) => {
        const pct = scores.max > 0 ? (scores.obtained / scores.max) * 100 : 0;
        if (pct > bestPercentage) {
          bestPercentage = pct;
          bestSubject = subject;
        }
      });

      setOverallStats({
        avgPercentage,
        bestSubject,
        totalExams: examsList.length,
      });
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = selectedExamType === "all"
    ? exams
    : exams.filter((e) => e.exam_type === selectedExamType);

  const handleDownloadReportCard = (exam: Exam) => {
    toast.info("Report card download feature coming soon!");
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "secondary";
    const g = grade.toUpperCase();
    if (g === "A+" || g === "A") return "default";
    if (g === "B+" || g === "B") return "secondary";
    if (g === "C+" || g === "C") return "outline";
    return "destructive";
  };

  return (
    <>
      <Helmet><title>Exam Results - SkoolSetu</title></Helmet>
      <DashboardLayout role="student">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Exam Results</h1>
            <p className="text-muted-foreground">View your exam performance and report cards</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold">{overallStats.avgPercentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Best Subject</p>
                    <p className="text-2xl font-bold">{overallStats.bestSubject || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Exams Taken</p>
                    <p className="text-2xl font-bold">{overallStats.totalExams}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StudentProgressChart
              data={exams.map((e) => ({
                examName: e.name.length > 15 ? e.name.substring(0, 15) + "…" : e.name,
                avgPercentage: e.percentage,
              }))}
            />
            <SubjectStrengthCard
              data={(() => {
                const subjectMap: Record<string, { total: number; max: number }> = {};
                exams.forEach((exam) =>
                  exam.results.forEach((r) => {
                    if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, max: 0 };
                    subjectMap[r.subject].total += r.obtained_marks;
                    subjectMap[r.subject].max += r.max_marks;
                  })
                );
                return Object.entries(subjectMap).map(([subject, s]) => ({
                  subject,
                  avgPercentage: s.max > 0 ? (s.total / s.max) * 100 : 0,
                  passRate: 0,
                }));
              })()}
            />
          </div>

          {/* Filter and Results */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Exam Results</CardTitle>
                  <CardDescription>Your published exam results</CardDescription>
                </div>
                <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    <SelectItem value="unit_test">Unit Test</SelectItem>
                    <SelectItem value="mid_term">Mid Term</SelectItem>
                    <SelectItem value="final">Final Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredExams.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No exam results found</p>
              ) : (
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredExams.map((exam) => (
                    <AccordionItem key={exam.id} value={exam.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-1 items-center justify-between pr-4">
                          <div className="text-left">
                            <p className="font-semibold">{exam.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {exam.exam_type?.replace("_", " ").toUpperCase()} 
                              {exam.start_date && ` • ${new Date(exam.start_date).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={exam.percentage >= 75 ? "bg-green-100 text-green-800" : exam.percentage >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                              {exam.percentage}%
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {exam.totalObtained}/{exam.totalMax}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4 space-y-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Marks</TableHead>
                                <TableHead>Percentage</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Remarks</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {exam.results.map((result) => (
                                <TableRow key={result.id}>
                                  <TableCell className="font-medium">{result.subject}</TableCell>
                                  <TableCell>{result.obtained_marks}/{result.max_marks}</TableCell>
                                  <TableCell>
                                    {Math.round((result.obtained_marks / result.max_marks) * 100)}%
                                  </TableCell>
                                  <TableCell>
                                    {result.grade && (
                                      <Badge variant={getGradeColor(result.grade)}>
                                        {result.grade}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>{result.remarks || "-"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <div className="flex justify-end">
                            <Button variant="outline" onClick={() => handleDownloadReportCard(exam)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download Report Card
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default StudentResults;
