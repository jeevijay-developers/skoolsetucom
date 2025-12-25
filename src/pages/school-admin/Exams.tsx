import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, ClipboardList, BookOpen, CheckCircle, Pencil, Trash2, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

interface Exam {
  id: string;
  name: string;
  exam_type: string;
  academic_year: string;
  start_date: string | null;
  end_date: string | null;
  is_published: boolean;
  created_at: string;
}

interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  subject: string;
  max_marks: number;
  obtained_marks: number;
  grade: string | null;
  students: { full_name: string; roll_number: string | null; classes: { name: string; section: string | null } | null } | null;
}

interface ExamSchedule {
  id: string;
  exam_id: string;
  class_id: string;
  subject: string;
  exam_date: string;
  start_time: string | null;
  end_time: string | null;
  max_marks: number | null;
  classes?: { name: string; section: string | null };
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
  class_id: string | null;
}

const Exams = () => {
  const { schoolId } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [activeTab, setActiveTab] = useState("results");
  
  // Create Exam Dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [examForm, setExamForm] = useState({
    name: "",
    exam_type: "unit_test",
    start_date: "",
    end_date: "",
  });
  
  // Marks Entry Dialog
  const [isMarksOpen, setIsMarksOpen] = useState(false);
  const [marksForm, setMarksForm] = useState({
    subject: "",
    max_marks: "100",
    studentMarks: {} as Record<string, string>,
  });

  // Schedule Dialog
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    class_id: "",
    subject: "",
    exam_date: "",
    start_time: "",
    end_time: "",
    max_marks: "100",
  });

  useEffect(() => {
    if (schoolId) {
      fetchExams();
      fetchClasses();
    }
  }, [schoolId]);

  useEffect(() => {
    if (selectedExam) {
      fetchResults(selectedExam.id);
      fetchSchedules(selectedExam.id);
    }
  }, [selectedExam]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchExams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch exams");
    } else {
      setExams(data || []);
    }
    setLoading(false);
  };

  const fetchResults = async (examId: string) => {
    const { data } = await supabase
      .from("exam_results")
      .select(`
        *,
        students (
          full_name,
          roll_number,
          classes:class_id (name, section)
        )
      `)
      .eq("exam_id", examId)
      .order("subject");
    setResults(data || []);
  };

  const fetchSchedules = async (examId: string) => {
    const { data } = await supabase
      .from("exam_schedules")
      .select(`
        *,
        classes:class_id (name, section)
      `)
      .eq("exam_id", examId)
      .order("exam_date");
    setSchedules(data || []);
  };

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name, section")
      .eq("school_id", schoolId)
      .order("name");
    setClasses(data || []);
  };

  const fetchStudents = async (classId: string) => {
    const { data } = await supabase
      .from("students")
      .select("id, full_name, roll_number, class_id")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("is_active", true)
      .order("roll_number");
    setStudents(data || []);
    
    // Initialize marks form
    const marks: Record<string, string> = {};
    (data || []).forEach(s => marks[s.id] = "");
    setMarksForm(prev => ({ ...prev, studentMarks: marks }));
  };

  const handleCreateExam = async () => {
    if (!examForm.name) {
      toast.error("Please enter exam name");
      return;
    }

    try {
      const { error } = await supabase.from("exams").insert({
        school_id: schoolId,
        name: examForm.name,
        exam_type: examForm.exam_type,
        start_date: examForm.start_date || null,
        end_date: examForm.end_date || null,
        is_published: false,
      });

      if (error) throw error;
      toast.success("Exam created successfully");
      setIsCreateOpen(false);
      setExamForm({ name: "", exam_type: "unit_test", start_date: "", end_date: "" });
      fetchExams();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddSchedule = async () => {
    if (!selectedExam || !scheduleForm.class_id || !scheduleForm.subject || !scheduleForm.exam_date) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const { error } = await supabase.from("exam_schedules").insert({
        exam_id: selectedExam.id,
        school_id: schoolId,
        class_id: scheduleForm.class_id,
        subject: scheduleForm.subject,
        exam_date: scheduleForm.exam_date,
        start_time: scheduleForm.start_time || null,
        end_time: scheduleForm.end_time || null,
        max_marks: parseFloat(scheduleForm.max_marks) || 100,
      });

      if (error) throw error;
      toast.success("Schedule added successfully");
      setIsScheduleOpen(false);
      setScheduleForm({ class_id: "", subject: "", exam_date: "", start_time: "", end_time: "", max_marks: "100" });
      fetchSchedules(selectedExam.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Delete this schedule?")) return;

    try {
      const { error } = await supabase.from("exam_schedules").delete().eq("id", scheduleId);
      if (error) throw error;
      toast.success("Schedule deleted");
      if (selectedExam) fetchSchedules(selectedExam.id);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedExam || !marksForm.subject || !selectedClass) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const entries = Object.entries(marksForm.studentMarks)
        .filter(([_, marks]) => marks !== "")
        .map(([studentId, marks]) => ({
          exam_id: selectedExam.id,
          student_id: studentId,
          subject: marksForm.subject,
          max_marks: parseFloat(marksForm.max_marks),
          obtained_marks: parseFloat(marks),
          grade: calculateGrade(parseFloat(marks), parseFloat(marksForm.max_marks)),
        }));

      if (entries.length === 0) {
        toast.error("Please enter marks for at least one student");
        return;
      }

      const { error } = await supabase.from("exam_results").insert(entries);
      if (error) throw error;
      
      toast.success(`Marks saved for ${entries.length} students`);
      setIsMarksOpen(false);
      setMarksForm({ subject: "", max_marks: "100", studentMarks: {} });
      setSelectedClass("");
      fetchResults(selectedExam.id);
    } catch (error: any) {
      toast.error(error.message);
    }
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

  const handleTogglePublish = async (exam: Exam) => {
    try {
      const { error } = await supabase
        .from("exams")
        .update({ is_published: !exam.is_published })
        .eq("id", exam.id);

      if (error) throw error;
      toast.success(`Results ${exam.is_published ? "unpublished" : "published"}`);
      fetchExams();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteExam = async (exam: Exam) => {
    if (!confirm("Delete this exam and all its results/schedules?")) return;

    try {
      await supabase.from("exam_results").delete().eq("exam_id", exam.id);
      await supabase.from("exam_schedules").delete().eq("exam_id", exam.id);
      const { error } = await supabase.from("exams").delete().eq("id", exam.id);
      if (error) throw error;
      
      toast.success("Exam deleted");
      setSelectedExam(null);
      fetchExams();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getExamTypeBadge = (type: string) => {
    switch (type) {
      case "unit_test":
        return <Badge variant="outline">Unit Test</Badge>;
      case "midterm":
        return <Badge variant="secondary">Mid Term</Badge>;
      case "final":
        return <Badge className="bg-primary text-primary-foreground">Final</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Group results by subject
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.subject]) acc[result.subject] = [];
    acc[result.subject].push(result);
    return acc;
  }, {} as Record<string, ExamResult[]>);

  // Group schedules by class
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const className = schedule.classes ? `${schedule.classes.name}${schedule.classes.section ? ` - ${schedule.classes.section}` : ""}` : "Unknown";
    if (!acc[className]) acc[className] = [];
    acc[className].push(schedule);
    return acc;
  }, {} as Record<string, ExamSchedule[]>);

  return (
    <>
      <Helmet><title>Exams & Results - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Exams & Results</h1>
              <p className="text-muted-foreground">Create exams, manage schedules, and publish results</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exam
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Exam</DialogTitle>
                  <DialogDescription>Add a new examination</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Exam Name *</Label>
                    <Input
                      value={examForm.name}
                      onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                      placeholder="e.g., First Unit Test, Mid-Term Exam"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Exam Type</Label>
                    <Select value={examForm.exam_type} onValueChange={(v) => setExamForm({ ...examForm, exam_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit_test">Unit Test</SelectItem>
                        <SelectItem value="midterm">Mid-Term</SelectItem>
                        <SelectItem value="final">Final Exam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={examForm.start_date}
                        onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={examForm.end_date}
                        onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateExam}>Create Exam</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <ClipboardList className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Exams</p>
                    <p className="text-2xl font-bold">{exams.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <CheckCircle className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Published</p>
                    <p className="text-2xl font-bold">{exams.filter(e => e.is_published).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-warning/10">
                    <BookOpen className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Results Entered</p>
                    <p className="text-2xl font-bold">{results.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Exams List */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Exams</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : exams.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No exams created yet</p>
                ) : (
                  <div className="space-y-2">
                    {exams.map((exam) => (
                      <div
                        key={exam.id}
                        onClick={() => setSelectedExam(exam)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedExam?.id === exam.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{exam.name}</p>
                          {exam.is_published && (
                            <Badge className="bg-secondary text-secondary-foreground text-xs">Published</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getExamTypeBadge(exam.exam_type || "unit_test")}
                          <span className="text-xs text-muted-foreground">
                            {exam.start_date ? format(new Date(exam.start_date), "MMM dd") : "No date"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exam Details */}
            <Card className="shadow-card lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {selectedExam ? selectedExam.name : "Select an Exam"}
                  </CardTitle>
                  {selectedExam && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={selectedExam.is_published ? "secondary" : "default"}
                        onClick={() => handleTogglePublish(selectedExam)}
                      >
                        {selectedExam.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteExam(selectedExam)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedExam ? (
                  <p className="text-muted-foreground text-center py-12">
                    Select an exam from the list to view details
                  </p>
                ) : (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="schedule">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </TabsTrigger>
                      <TabsTrigger value="results">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Results
                      </TabsTrigger>
                    </TabsList>

                    {/* Schedule Tab */}
                    <TabsContent value="schedule">
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => setIsScheduleOpen(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Schedule
                          </Button>
                        </div>
                        
                        {schedules.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            No schedule added for this exam yet
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {Object.entries(groupedSchedules).map(([className, classSchedules]) => (
                              <div key={className} className="border rounded-lg">
                                <div className="bg-muted/50 px-4 py-2 font-medium border-b">
                                  {className}
                                </div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Subject</TableHead>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Time</TableHead>
                                      <TableHead>Max Marks</TableHead>
                                      <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {classSchedules.map((schedule) => (
                                      <TableRow key={schedule.id}>
                                        <TableCell className="font-medium">{schedule.subject}</TableCell>
                                        <TableCell>
                                          {format(new Date(schedule.exam_date), "dd MMM yyyy")}
                                        </TableCell>
                                        <TableCell>
                                          {schedule.start_time && schedule.end_time ? (
                                            <span className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {schedule.start_time} - {schedule.end_time}
                                            </span>
                                          ) : (
                                            "-"
                                          )}
                                        </TableCell>
                                        <TableCell>{schedule.max_marks || 100}</TableCell>
                                        <TableCell>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDeleteSchedule(schedule.id)}
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Results Tab */}
                    <TabsContent value="results">
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => {
                              setIsMarksOpen(true);
                              setSelectedClass("");
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Enter Marks
                          </Button>
                        </div>

                        {Object.keys(groupedResults).length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            No results entered for this exam yet
                          </p>
                        ) : (
                          <Tabs defaultValue={Object.keys(groupedResults)[0]}>
                            <TabsList className="flex flex-wrap">
                              {Object.keys(groupedResults).map((subject) => (
                                <TabsTrigger key={subject} value={subject}>
                                  {subject}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                            {Object.entries(groupedResults).map(([subject, subjectResults]) => (
                              <TabsContent key={subject} value={subject}>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Student</TableHead>
                                      <TableHead>Class</TableHead>
                                      <TableHead>Marks</TableHead>
                                      <TableHead>Grade</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {subjectResults.map((result) => (
                                      <TableRow key={result.id}>
                                        <TableCell>
                                          <div>
                                            <p className="font-medium">{result.students?.full_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                              Roll: {result.students?.roll_number || "-"}
                                            </p>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {result.students?.classes
                                            ? `${result.students.classes.name}${result.students.classes.section ? ` - ${result.students.classes.section}` : ""}`
                                            : "-"}
                                        </TableCell>
                                        <TableCell>
                                          {result.obtained_marks} / {result.max_marks}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={result.grade === "F" ? "destructive" : "secondary"}>
                                            {result.grade}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TabsContent>
                            ))}
                          </Tabs>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Schedule Dialog */}
          <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Exam Schedule</DialogTitle>
                <DialogDescription>Add subject-wise schedule for {selectedExam?.name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={scheduleForm.class_id} onValueChange={(v) => setScheduleForm({ ...scheduleForm, class_id: v })}>
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
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input
                    value={scheduleForm.subject}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exam Date *</Label>
                  <Input
                    type="date"
                    value={scheduleForm.exam_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, exam_date: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={scheduleForm.start_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={scheduleForm.end_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Marks</Label>
                  <Input
                    type="number"
                    value={scheduleForm.max_marks}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, max_marks: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                <Button onClick={handleAddSchedule}>Add Schedule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Marks Entry Dialog */}
          <Dialog open={isMarksOpen} onOpenChange={setIsMarksOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Enter Marks - {selectedExam?.name}</DialogTitle>
                <DialogDescription>Enter marks for students</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Class *</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
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
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input
                      value={marksForm.subject}
                      onChange={(e) => setMarksForm({ ...marksForm, subject: e.target.value })}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Marks</Label>
                    <Input
                      type="number"
                      value={marksForm.max_marks}
                      onChange={(e) => setMarksForm({ ...marksForm, max_marks: e.target.value })}
                    />
                  </div>
                </div>

                {students.length > 0 && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll No</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Marks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>{student.roll_number || "-"}</TableCell>
                            <TableCell>{student.full_name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="w-24"
                                max={marksForm.max_marks}
                                value={marksForm.studentMarks[student.id] || ""}
                                onChange={(e) => setMarksForm({
                                  ...marksForm,
                                  studentMarks: {
                                    ...marksForm.studentMarks,
                                    [student.id]: e.target.value
                                  }
                                })}
                                placeholder="0"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {selectedClass && students.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No active students in this class
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsMarksOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveMarks} disabled={students.length === 0}>
                  Save Marks
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Exams;
