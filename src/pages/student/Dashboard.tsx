import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import GreetingBanner from "@/components/GreetingBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, DollarSign, BookOpen, Bell, ArrowRight, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";

interface StudentInfo {
  id: string;
  full_name: string;
  roll_number: string | null;
  class_id: string | null;
  class_name: string | null;
  class_section: string | null;
  school_id: string | null;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

interface FeeStats {
  totalDue: number;
  totalPaid: number;
  pending: number;
  overdueFees: number;
}

interface RecentNotice {
  id: string;
  title: string;
  published_at: string;
}

interface RecentResult {
  exam_name: string;
  subject: string;
  obtained_marks: number;
  max_marks: number;
  grade: string | null;
}

interface UpcomingExam {
  id: string;
  subject: string;
  exam_date: string;
  start_time: string | null;
  end_time: string | null;
  exam_name: string;
  days_left: number;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [feeStats, setFeeStats] = useState<FeeStats>({ totalDue: 0, totalPaid: 0, pending: 0, overdueFees: 0 });
  const [recentNotices, setRecentNotices] = useState<RecentNotice[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [nextExam, setNextExam] = useState<UpcomingExam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch student info - check if user is a student or parent
      const { data: studentData } = await supabase
        .from("students")
        .select(`
          id,
          full_name,
          roll_number,
          class_id,
          school_id,
          classes:class_id (name, section)
        `)
        .or(`user_id.eq.${user?.id},parent_user_id.eq.${user?.id}`)
        .maybeSingle();

      if (studentData) {
        const info: StudentInfo = {
          id: studentData.id,
          full_name: studentData.full_name,
          roll_number: studentData.roll_number,
          class_id: studentData.class_id,
          school_id: studentData.school_id,
          class_name: (studentData.classes as any)?.name || null,
          class_section: (studentData.classes as any)?.section || null,
        };
        setStudentInfo(info);

        // Fetch attendance stats
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("status")
          .eq("student_id", studentData.id);

        if (attendanceData) {
          const total = attendanceData.length;
          const present = attendanceData.filter(a => a.status === "present").length;
          const absent = total - present;
          setAttendanceStats({
            total,
            present,
            absent,
            percentage: total > 0 ? Math.round((present / total) * 100) : 0,
          });
        }

        // Fetch fee stats with overdue calculation
        const today = new Date().toISOString().split('T')[0];
        const { data: feeData } = await supabase
          .from("student_fees")
          .select("amount, paid_amount, status, due_date")
          .eq("student_id", studentData.id);

        if (feeData) {
          const totalDue = feeData.reduce((sum, f) => sum + Number(f.amount), 0);
          const totalPaid = feeData.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0);
          const overdueFees = feeData.filter(f => f.status === "pending" && f.due_date < today).length;
          setFeeStats({
            totalDue,
            totalPaid,
            pending: totalDue - totalPaid,
            overdueFees,
          });
        }

        // Fetch recent results
        const { data: resultsData } = await supabase
          .from("exam_results")
          .select(`
            subject,
            obtained_marks,
            max_marks,
            grade,
            exams:exam_id (name)
          `)
          .eq("student_id", studentData.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (resultsData) {
          setRecentResults(
            resultsData.map((r) => ({
              exam_name: (r.exams as any)?.name || "Exam",
              subject: r.subject,
              obtained_marks: r.obtained_marks,
              max_marks: r.max_marks,
              grade: r.grade,
            }))
          );
        }

        // Fetch upcoming exams (schedules for student's class)
        if (studentData.class_id) {
          const { data: scheduleData } = await supabase
            .from("exam_schedules")
            .select(`
              id,
              subject,
              exam_date,
              start_time,
              end_time,
              exams:exam_id (name)
            `)
            .eq("class_id", studentData.class_id)
            .gte("exam_date", today)
            .order("exam_date", { ascending: true })
            .limit(5);

          if (scheduleData) {
            const examsWithDays = scheduleData.map((s) => ({
              id: s.id,
              subject: s.subject,
              exam_date: s.exam_date,
              start_time: s.start_time,
              end_time: s.end_time,
              exam_name: (s.exams as any)?.name || "Exam",
              days_left: differenceInDays(new Date(s.exam_date), new Date()),
            }));
            setUpcomingExams(examsWithDays);
            if (examsWithDays.length > 0) {
              setNextExam(examsWithDays[0]);
            }
          }
        }
      }

      // Fetch recent notices
      const { data: noticesData } = await supabase
        .from("notices")
        .select("id, title, published_at")
        .eq("is_published", true)
        .in("target_audience", ["all", "students", "parents"])
        .order("published_at", { ascending: false })
        .limit(3);

      if (noticesData) {
        setRecentNotices(noticesData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Helmet><title>Student Dashboard - SkoolSetu</title></Helmet>
        <DashboardLayout role="student">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Student Dashboard - SkoolSetu</title></Helmet>
      <DashboardLayout role="student">
        <div className="space-y-6">
          {/* Greeting Banner */}
          {studentInfo?.school_id && <GreetingBanner schoolId={studentInfo.school_id} />}

          {/* Welcome Section */}
          <div>
            <h1 className="text-2xl font-bold">Welcome, {studentInfo?.full_name || "Student"}!</h1>
            <p className="text-muted-foreground">
              {studentInfo?.class_name 
                ? `Class ${studentInfo.class_name}${studentInfo.class_section ? ` - ${studentInfo.class_section}` : ""} | Roll No: ${studentInfo.roll_number || "N/A"}`
                : "Your academic overview"}
            </p>
          </div>

          {/* Payment Due Alert */}
          {feeStats.overdueFees > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Payment Overdue</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>You have {feeStats.overdueFees} overdue fee payment(s). Total pending: ₹{feeStats.pending.toLocaleString()}</span>
                <Link to="/student/fees">
                  <Button size="sm" variant="outline" className="ml-2">Pay Now</Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Exam Countdown */}
          {nextExam && nextExam.days_left <= 7 && (
            <Alert className={nextExam.days_left <= 3 ? "border-destructive bg-destructive/10" : "border-orange-500 bg-orange-500/10"}>
              <Clock className={`h-4 w-4 ${nextExam.days_left <= 3 ? "text-destructive" : "text-orange-500"}`} />
              <AlertTitle className={nextExam.days_left <= 3 ? "text-destructive" : "text-orange-500"}>
                {nextExam.days_left === 0 ? "Exam Today!" : `Exam in ${nextExam.days_left} day${nextExam.days_left > 1 ? "s" : ""}`}
              </AlertTitle>
              <AlertDescription>
                {nextExam.subject} ({nextExam.exam_name}) on {format(new Date(nextExam.exam_date), "EEEE, MMM dd")}
                {nextExam.start_time && ` at ${nextExam.start_time}`}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard 
              title="Attendance" 
              value={`${attendanceStats.percentage}%`} 
              icon={Calendar} 
              variant={attendanceStats.percentage >= 75 ? "secondary" : "warning"}
              description={`${attendanceStats.present} present / ${attendanceStats.total} days`}
            />
            <StatsCard 
              title="Pending Fees" 
              value={`₹${feeStats.pending.toLocaleString()}`} 
              icon={DollarSign} 
              variant={feeStats.pending > 0 ? "warning" : "primary"}
              description={feeStats.pending > 0 ? `${feeStats.overdueFees} overdue` : "All fees paid"}
            />
            <StatsCard 
              title="Recent Result" 
              value={recentResults.length > 0 ? `${Math.round((recentResults[0].obtained_marks / recentResults[0].max_marks) * 100)}%` : "N/A"} 
              icon={BookOpen} 
              variant="secondary"
              description={recentResults.length > 0 ? recentResults[0].exam_name : "No results yet"}
            />
            <StatsCard 
              title="Upcoming Exams" 
              value={String(upcomingExams.length)} 
              icon={Calendar} 
              variant="primary"
              description={nextExam ? `Next: ${nextExam.subject}` : "None scheduled"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Exams Timetable */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Upcoming Exams</CardTitle>
                  <CardDescription>Your exam schedule</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingExams.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No upcoming exams scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingExams.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{exam.subject}</p>
                            <p className="text-sm text-muted-foreground">{exam.exam_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{format(new Date(exam.exam_date), "dd MMM")}</p>
                          <Badge 
                            variant={exam.days_left <= 3 ? "destructive" : exam.days_left <= 7 ? "outline" : "secondary"}
                            className="text-xs"
                          >
                            {exam.days_left === 0 ? "Today" : `${exam.days_left}d left`}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Attendance Summary</CardTitle>
                  <CardDescription>Your attendance this academic year</CardDescription>
                </div>
                <Link to="/student/attendance">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-secondary" />
                      <span>Present Days</span>
                    </div>
                    <span className="font-semibold">{attendanceStats.present}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span>Absent Days</span>
                    </div>
                    <span className="font-semibold">{attendanceStats.absent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span>Total Working Days</span>
                    </div>
                    <span className="font-semibold">{attendanceStats.total}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${attendanceStats.percentage >= 75 ? "bg-primary" : "bg-orange-500"}`}
                        style={{ width: `${attendanceStats.percentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 text-center">
                      {attendanceStats.percentage}% attendance
                      {attendanceStats.percentage < 75 && (
                        <span className="text-orange-500 ml-1">(Below 75% required)</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fee Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Fee Status</CardTitle>
                  <CardDescription>Your fee payment summary</CardDescription>
                </div>
                <Link to="/student/fees">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Fees</span>
                    <span className="font-semibold">₹{feeStats.totalDue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Paid Amount</span>
                    <span className="font-semibold text-secondary">₹{feeStats.totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-medium">Pending Amount</span>
                    <span className={`font-bold ${feeStats.pending > 0 ? "text-orange-500" : "text-secondary"}`}>
                      ₹{feeStats.pending.toLocaleString()}
                    </span>
                  </div>
                  {feeStats.overdueFees > 0 && (
                    <Badge variant="destructive" className="w-full justify-center">
                      {feeStats.overdueFees} Overdue Payment(s)
                    </Badge>
                  )}
                  {feeStats.pending > 0 && (
                    <Link to="/student/fees">
                      <Button className="w-full">Pay Now</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Results */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Results</CardTitle>
                  <CardDescription>Your latest exam performance</CardDescription>
                </div>
                <Link to="/student/results">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentResults.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No results available yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentResults.slice(0, 3).map((result, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div>
                          <p className="font-medium">{result.subject}</p>
                          <p className="text-sm text-muted-foreground">{result.exam_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{result.obtained_marks}/{result.max_marks}</p>
                          {result.grade && <Badge variant="outline">{result.grade}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Notices */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Notices</CardTitle>
                  <CardDescription>Latest school announcements</CardDescription>
                </div>
                <Link to="/student/notices">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentNotices.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                    <p className="text-muted-foreground">No notices available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentNotices.map((notice) => (
                      <div key={notice.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                            <Bell className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium line-clamp-2">{notice.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(notice.published_at), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default StudentDashboard;
