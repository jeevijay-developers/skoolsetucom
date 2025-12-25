import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Users, BookOpen, DollarSign, Download, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { generateFeeReceiptHTML } from "@/utils/pdfGenerator";

interface AttendanceRecord {
  date: string;
  student_name: string;
  class_name: string;
  status: string;
}

interface ResultRecord {
  student_name: string;
  class_name: string;
  exam_name: string;
  subject: string;
  obtained: number;
  max: number;
  grade: string;
}

interface FeeRecord {
  student_name: string;
  class_name: string;
  amount: number;
  paid: number;
  status: string;
  due_date: string;
}

const Reports = () => {
  const { schoolId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [classes, setClasses] = useState<{ id: string; name: string; section: string | null }[]>([]);
  
  // Report data
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [resultsData, setResultsData] = useState<ResultRecord[]>([]);
  const [feeData, setFeeData] = useState<FeeRecord[]>([]);
  
  // Summary stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAttendance: 0,
    totalFeeCollected: 0,
    totalFeePending: 0,
    avgResults: 0,
  });

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchStats();
    }
  }, [schoolId]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name, section")
      .eq("school_id", schoolId)
      .order("name");
    setClasses(data || []);
  };

  const fetchStats = async () => {
    // Fetch total students
    const { count: studentCount } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("is_active", true);

    // Fetch attendance stats
    const { data: attendanceStats } = await supabase
      .from("attendance")
      .select("status")
      .eq("school_id", schoolId);

    const presentCount = attendanceStats?.filter(a => a.status === "present").length || 0;
    const totalAttendance = attendanceStats?.length || 0;

    // Fetch fee stats
    const { data: feeStats } = await supabase
      .from("student_fees")
      .select("amount, paid_amount")
      .eq("school_id", schoolId);

    const totalFeeCollected = feeStats?.reduce((sum, f) => sum + (f.paid_amount || 0), 0) || 0;
    const totalFee = feeStats?.reduce((sum, f) => sum + f.amount, 0) || 0;

    // Fetch results stats
    const { data: resultsStats } = await supabase
      .from("exam_results")
      .select("obtained_marks, max_marks");

    const totalObtained = resultsStats?.reduce((sum, r) => sum + r.obtained_marks, 0) || 0;
    const totalMax = resultsStats?.reduce((sum, r) => sum + r.max_marks, 0) || 0;

    setStats({
      totalStudents: studentCount || 0,
      avgAttendance: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0,
      totalFeeCollected,
      totalFeePending: totalFee - totalFeeCollected,
      avgResults: totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0,
    });
  };

  const fetchAttendanceReport = async () => {
    setLoading(true);
    const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
    const monthEnd = endOfMonth(monthStart);

    let query = supabase
      .from("attendance")
      .select(`
        date, status,
        students (full_name, classes:class_id (name, section))
      `)
      .eq("school_id", schoolId)
      .gte("date", format(monthStart, "yyyy-MM-dd"))
      .lte("date", format(monthEnd, "yyyy-MM-dd"))
      .order("date", { ascending: false });

    if (selectedClass !== "all") {
      query = query.eq("class_id", selectedClass);
    }

    const { data } = await query;

    const records: AttendanceRecord[] = (data || []).map(item => ({
      date: item.date,
      student_name: (item.students as any)?.full_name || "Unknown",
      class_name: (item.students as any)?.classes?.name || "N/A",
      status: item.status,
    }));

    setAttendanceData(records);
    setLoading(false);
  };

  const fetchResultsReport = async () => {
    setLoading(true);

    let query = supabase
      .from("exam_results")
      .select(`
        subject, obtained_marks, max_marks, grade,
        students (full_name, class_id, classes:class_id (name)),
        exams (name)
      `)
      .order("created_at", { ascending: false });

    const { data } = await query;

    let records: ResultRecord[] = (data || []).map(item => ({
      student_name: (item.students as any)?.full_name || "Unknown",
      class_name: (item.students as any)?.classes?.name || "N/A",
      exam_name: (item.exams as any)?.name || "Exam",
      subject: item.subject,
      obtained: item.obtained_marks,
      max: item.max_marks,
      grade: item.grade || "N/A",
    }));

    if (selectedClass !== "all") {
      records = records.filter(r => {
        const classData = classes.find(c => c.name === r.class_name);
        return classData?.id === selectedClass;
      });
    }

    setResultsData(records);
    setLoading(false);
  };

  const fetchFeeReport = async () => {
    setLoading(true);

    let query = supabase
      .from("student_fees")
      .select(`
        amount, paid_amount, status, due_date,
        students (full_name, classes:class_id (name))
      `)
      .eq("school_id", schoolId)
      .order("due_date", { ascending: false });

    const { data } = await query;

    let records: FeeRecord[] = (data || []).map(item => ({
      student_name: (item.students as any)?.full_name || "Unknown",
      class_name: (item.students as any)?.classes?.name || "N/A",
      amount: item.amount,
      paid: item.paid_amount || 0,
      status: item.status || "pending",
      due_date: item.due_date,
    }));

    if (selectedClass !== "all") {
      records = records.filter(r => {
        const classData = classes.find(c => c.name === r.class_name);
        return classData?.id === selectedClass;
      });
    }

    setFeeData(records);
    setLoading(false);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(h => `"${row[h]}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "partial":
        return <Badge variant="secondary">Partial</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Helmet><title>Reports - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate and export attendance, results, and fee reports</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Students</p>
                    <p className="text-xl font-bold">{stats.totalStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Attendance</p>
                    <p className="text-xl font-bold">{stats.avgAttendance}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Results</p>
                    <p className="text-xl font-bold">{stats.avgResults}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fee Collected</p>
                    <p className="text-xl font-bold">₹{stats.totalFeeCollected.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fee Pending</p>
                    <p className="text-xl font-bold">₹{stats.totalFeePending.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-1">
                  <Label>Month</Label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.section ? `- ${c.section}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Tabs */}
          <Tabs defaultValue="attendance">
            <TabsList>
              <TabsTrigger value="attendance">Attendance Report</TabsTrigger>
              <TabsTrigger value="results">Results Report</TabsTrigger>
              <TabsTrigger value="fees">Fee Collection Report</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="space-y-4">
              <div className="flex justify-between items-center">
                <Button onClick={fetchAttendanceReport} disabled={loading}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" onClick={() => exportToCSV(attendanceData, "attendance_report")} disabled={attendanceData.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <Card className="shadow-card">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : attendanceData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Click "Generate Report" to view data</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceData.slice(0, 50).map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{format(new Date(item.date), "dd MMM yyyy")}</TableCell>
                            <TableCell>{item.student_name}</TableCell>
                            <TableCell>{item.class_name}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <div className="flex justify-between items-center">
                <Button onClick={fetchResultsReport} disabled={loading}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" onClick={() => exportToCSV(resultsData, "results_report")} disabled={resultsData.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <Card className="shadow-card">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : resultsData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Click "Generate Report" to view data</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Exam</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultsData.slice(0, 50).map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.student_name}</TableCell>
                            <TableCell>{item.class_name}</TableCell>
                            <TableCell>{item.exam_name}</TableCell>
                            <TableCell>{item.subject}</TableCell>
                            <TableCell>{item.obtained}/{item.max}</TableCell>
                            <TableCell><Badge variant="outline">{item.grade}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees" className="space-y-4">
              <div className="flex justify-between items-center">
                <Button onClick={fetchFeeReport} disabled={loading}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" onClick={() => exportToCSV(feeData, "fee_report")} disabled={feeData.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <Card className="shadow-card">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : feeData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Click "Generate Report" to view data</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Pending</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feeData.slice(0, 50).map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.student_name}</TableCell>
                            <TableCell>{item.class_name}</TableCell>
                            <TableCell>₹{item.amount.toLocaleString()}</TableCell>
                            <TableCell>₹{item.paid.toLocaleString()}</TableCell>
                            <TableCell>₹{(item.amount - item.paid).toLocaleString()}</TableCell>
                            <TableCell>{format(new Date(item.due_date), "dd MMM yyyy")}</TableCell>
                            <TableCell>{getStatusBadge(item.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Reports;
