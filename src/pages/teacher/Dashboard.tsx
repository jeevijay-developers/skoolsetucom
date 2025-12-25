import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import GreetingBanner from "@/components/GreetingBanner";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ClipboardList, Users, DollarSign, FileText, BookOpen, CreditCard, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TeacherDashboard = () => {
  const { user, schoolId } = useAuth();
  const [teacherData, setTeacherData] = useState<any>(null);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [recentPayroll, setRecentPayroll] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<{ marked: boolean; classes: string[] }>({ marked: false, classes: [] });
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && schoolId) {
      fetchTeacherData();
    }
  }, [user, schoolId]);

  const fetchTeacherData = async () => {
    try {
      // Get teacher info
      const { data: teacher } = await supabase
        .from("teachers")
        .select("*")
        .eq("school_id", schoolId)
        .eq("user_id", user?.id)
        .single();

      setTeacherData(teacher);

      if (teacher) {
        // Get assigned classes
        const { data: teacherClasses } = await supabase
          .from("teacher_classes")
          .select("*, classes(id, name, section)")
          .eq("teacher_id", teacher.id);

        setAssignedClasses(teacherClasses || []);

        // Get employee payroll (if linked by email)
        const { data: employee } = await supabase
          .from("employees")
          .select("id")
          .eq("school_id", schoolId)
          .eq("email", teacher.email)
          .single();

        if (employee) {
          const { data: payroll } = await supabase
            .from("payroll")
            .select("*")
            .eq("employee_id", employee.id)
            .order("year", { ascending: false })
            .order("month", { ascending: false })
            .limit(3);

          setRecentPayroll(payroll || []);
        }

        // Check today's attendance
        const today = format(new Date(), "yyyy-MM-dd");
        const classIds = (teacherClasses || []).map(tc => tc.class_id);
        
        if (classIds.length > 0) {
          const { data: attendance } = await supabase
            .from("attendance")
            .select("class_id")
            .eq("date", today)
            .eq("school_id", schoolId)
            .eq("marked_by", user?.id)
            .in("class_id", classIds);

          const markedClassIds = [...new Set((attendance || []).map(a => a.class_id))];
          const unmarkedClasses = (teacherClasses || []).filter(tc => !markedClassIds.includes(tc.class_id));
          
          setTodayAttendance({
            marked: unmarkedClasses.length === 0 && classIds.length > 0,
            classes: unmarkedClasses.map(tc => tc.classes?.name + (tc.classes?.section ? ` - ${tc.classes.section}` : ""))
          });
        }

        // Get upcoming exams
        const { data: exams } = await supabase
          .from("exam_schedules")
          .select("*, exams(name), classes(name, section)")
          .eq("school_id", schoolId)
          .gte("exam_date", new Date().toISOString().split("T")[0])
          .order("exam_date")
          .limit(5);

        setUpcomingExams(exams || []);
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Helmet><title>Teacher Dashboard - SkoolSetu</title></Helmet>
        <DashboardLayout role="teacher">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Teacher Dashboard - SkoolSetu</title></Helmet>
      <DashboardLayout role="teacher">
        <div className="space-y-6">
          <GreetingBanner />

          <div>
            <h1 className="text-2xl font-bold">Welcome, {teacherData?.full_name || "Teacher"}</h1>
            <p className="text-muted-foreground">Here's your overview for today</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard 
              title="Assigned Classes" 
              value={String(assignedClasses.length)} 
              icon={Users} 
              variant="primary" 
            />
            <StatsCard 
              title="Today's Attendance" 
              value={todayAttendance.marked ? "Completed" : `${todayAttendance.classes.length} Pending`} 
              icon={Calendar} 
              variant={todayAttendance.marked ? "secondary" : "warning"} 
            />
            <StatsCard 
              title="Upcoming Exams" 
              value={String(upcomingExams.length)} 
              icon={ClipboardList} 
              variant="secondary" 
            />
            <StatsCard 
              title="Subjects" 
              value={teacherData?.subjects?.length || 0} 
              icon={BookOpen} 
              variant="primary" 
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/teacher/attendance">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Mark Attendance</h3>
                    <p className="text-sm text-muted-foreground">Record daily attendance</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link to="/teacher/exam-marks">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <ClipboardList className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Enter Marks</h3>
                    <p className="text-sm text-muted-foreground">Record exam results</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>

            <Link to="/teacher/students">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <Users className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">View Students</h3>
                    <p className="text-sm text-muted-foreground">Student information</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Classes */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  My Classes
                </CardTitle>
                <CardDescription>Classes assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                {assignedClasses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No classes assigned yet</p>
                ) : (
                  <div className="space-y-3">
                    {assignedClasses.map((tc) => (
                      <div key={tc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{tc.classes?.name} {tc.classes?.section ? `- ${tc.classes.section}` : ""}</p>
                          {tc.is_class_teacher && (
                            <Badge variant="secondary" className="mt-1">Class Teacher</Badge>
                          )}
                        </div>
                        <Link to={`/teacher/attendance?class=${tc.class_id}`}>
                          <Button variant="outline" size="sm">Mark Attendance</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Salary & Payroll */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      My Salary
                    </CardTitle>
                    <CardDescription>Recent payroll records</CardDescription>
                  </div>
                  <Link to="/teacher/payroll">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentPayroll.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No payroll records yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Net Salary</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPayroll.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{MONTHS[record.month - 1]} {record.year}</TableCell>
                          <TableCell className="font-semibold">₹{record.net_salary?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === "paid" ? "default" : "secondary"}>
                              {record.status === "paid" ? "Paid" : "Pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Exams */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Upcoming Exams
                </CardTitle>
                <CardDescription>Scheduled examinations</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingExams.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No upcoming exams</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingExams.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{exam.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {exam.classes?.name} {exam.classes?.section ? `- ${exam.classes.section}` : ""} | {exam.exams?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{format(new Date(exam.exam_date), "dd MMM")}</p>
                          {exam.start_time && (
                            <p className="text-sm text-muted-foreground">{exam.start_time}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>Frequently used features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/teacher/fee-status">
                    <Button variant="outline" className="w-full justify-start">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Check Student Fees
                    </Button>
                  </Link>
                  <Link to="/teacher/report-cards">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      View Report Cards
                    </Button>
                  </Link>
                  <Link to="/teacher/payroll">
                    <Button variant="outline" className="w-full justify-start">
                      <CreditCard className="h-4 w-4 mr-2" />
                      My Payslips
                    </Button>
                  </Link>
                  <Link to="/teacher/students">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Student List
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default TeacherDashboard;