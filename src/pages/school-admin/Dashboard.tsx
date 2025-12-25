import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  Clock,
  Plus,
  ArrowRight,
  Bell,
  TrendingUp,
  Building2,
  Briefcase,
  FileText,
  ClipboardList,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalEmployees: number;
  todayAttendance: number;
  pendingFees: number;
  todayCollection: number;
  monthlyRevenue: number;
  classesMarkedToday: number;
  totalClassesToMark: number;
  activeExams: number;
  pendingPayroll: number;
  recentNotices: any[];
}

const SchoolAdminDashboard = () => {
  const navigate = useNavigate();
  const { schoolId, subscription, isSubscriptionActive } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalEmployees: 0,
    todayAttendance: 0,
    pendingFees: 0,
    todayCollection: 0,
    monthlyRevenue: 0,
    classesMarkedToday: 0,
    totalClassesToMark: 0,
    activeExams: 0,
    pendingPayroll: 0,
    recentNotices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      fetchDashboardStats();
    }
  }, [schoolId]);

  const fetchDashboardStats = async () => {
    if (!schoolId) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      // Fetch counts in parallel
      const [
        studentsResult,
        teachersResult,
        classesResult,
        employeesResult,
        attendanceResult,
        feesResult,
        todayFeesResult,
        monthlyFeesResult,
        examsResult,
        payrollResult,
        noticesResult,
        classAttendanceResult,
      ] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }).eq("school_id", schoolId).eq("is_active", true),
        supabase.from("teachers").select("*", { count: "exact", head: true }).eq("school_id", schoolId).eq("is_active", true),
        supabase.from("classes").select("*", { count: "exact", head: true }).eq("school_id", schoolId),
        supabase.from("employees").select("*", { count: "exact", head: true }).eq("school_id", schoolId).eq("is_active", true),
        supabase.from("attendance").select("status").eq("school_id", schoolId).eq("date", today),
        supabase.from("student_fees").select("amount, paid_amount").eq("school_id", schoolId).eq("status", "pending"),
        supabase.from("student_fees").select("paid_amount").eq("school_id", schoolId).eq("status", "paid").gte("paid_at", `${today}T00:00:00`).lte("paid_at", `${today}T23:59:59`),
        supabase.from("student_fees").select("paid_amount").eq("school_id", schoolId).eq("status", "paid").gte("paid_at", `${monthStart}T00:00:00`).lte("paid_at", `${monthEnd}T23:59:59`),
        supabase.from("exams").select("*", { count: "exact", head: true }).eq("school_id", schoolId).eq("is_published", false).gte("end_date", today),
        supabase.from("payroll").select("*", { count: "exact", head: true }).eq("school_id", schoolId).eq("status", "pending"),
        supabase.from("notices").select("*").eq("school_id", schoolId).eq("is_published", true).order("published_at", { ascending: false }).limit(5),
        supabase.from("attendance").select("class_id").eq("school_id", schoolId).eq("date", today),
      ]);

      const presentCount = attendanceResult.data?.filter((a) => a.status === "present").length || 0;
      const totalMarked = attendanceResult.data?.length || 0;
      const attendancePercentage = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

      const pendingAmount = feesResult.data?.reduce((sum, fee) => sum + (Number(fee.amount) - (Number(fee.paid_amount) || 0)), 0) || 0;
      const todayCollection = todayFeesResult.data?.reduce((sum, fee) => sum + (Number(fee.paid_amount) || 0), 0) || 0;
      const monthlyRevenue = monthlyFeesResult.data?.reduce((sum, fee) => sum + (Number(fee.paid_amount) || 0), 0) || 0;

      const uniqueClassesMarked = new Set(classAttendanceResult.data?.map(a => a.class_id) || []).size;

      setStats({
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalClasses: classesResult.count || 0,
        totalEmployees: employeesResult.count || 0,
        todayAttendance: attendancePercentage,
        pendingFees: pendingAmount,
        todayCollection,
        monthlyRevenue,
        classesMarkedToday: uniqueClassesMarked,
        totalClassesToMark: classesResult.count || 0,
        activeExams: examsResult.count || 0,
        pendingPayroll: payrollResult.count || 0,
        recentNotices: noticesResult.data || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionInfo = () => {
    if (!subscription) return null;

    const now = new Date();
    let endDate: Date;
    let daysLeft: number;

    if (subscription.status === "trial") {
      endDate = new Date(subscription.trial_end_date);
      daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        status: "Trial",
        plan: subscription.plan.toUpperCase(),
        daysLeft: Math.max(0, daysLeft),
        endDate: format(endDate, "MMM dd, yyyy"),
      };
    }

    if (subscription.status === "active" && subscription.subscription_end_date) {
      endDate = new Date(subscription.subscription_end_date);
      daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        status: "Active",
        plan: subscription.plan.toUpperCase(),
        daysLeft: Math.max(0, daysLeft),
        endDate: format(endDate, "MMM dd, yyyy"),
      };
    }

    return {
      status: subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1),
      plan: subscription.plan.toUpperCase(),
      daysLeft: 0,
      endDate: "-",
    };
  };

  const subInfo = getSubscriptionInfo();

  if (loading) {
    return (
      <DashboardLayout role="school_admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>School Admin Dashboard - SkoolSetu</title>
      </Helmet>

      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome back!</h1>
              <p className="text-muted-foreground">Here's what's happening at your school today.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/school-admin/students")} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Student
              </Button>
              <Button onClick={() => navigate("/school-admin/notices")} variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-1" />
                New Notice
              </Button>
            </div>
          </div>

          {/* Primary Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Students"
              value={stats.totalStudents}
              icon={Users}
              variant="primary"
              description="Active students"
            />
            <StatsCard
              title="Total Teachers"
              value={stats.totalTeachers}
              icon={GraduationCap}
              variant="secondary"
              description="Active teachers"
            />
            <StatsCard
              title="Total Classes"
              value={stats.totalClasses}
              icon={Building2}
              variant="primary"
              description="This academic year"
            />
            <StatsCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon={Briefcase}
              variant="secondary"
              description="All staff"
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatsCard
              title="Today's Attendance"
              value={`${stats.todayAttendance}%`}
              icon={Calendar}
              variant={stats.todayAttendance >= 80 ? "secondary" : "warning"}
              description={`${stats.classesMarkedToday}/${stats.totalClassesToMark} classes marked`}
            />
            <StatsCard
              title="Today's Collection"
              value={`₹${stats.todayCollection.toLocaleString()}`}
              icon={DollarSign}
              variant="secondary"
              description="Fee collected today"
            />
            <StatsCard
              title="This Month Revenue"
              value={`₹${stats.monthlyRevenue.toLocaleString()}`}
              icon={TrendingUp}
              variant="primary"
              description={format(new Date(), "MMMM yyyy")}
            />
            <StatsCard
              title="Pending Fees"
              value={`₹${stats.pendingFees.toLocaleString()}`}
              icon={AlertCircle}
              variant={stats.pendingFees > 0 ? "warning" : "default"}
              description="To be collected"
            />
          </div>

          {/* Quick Actions Grid */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Frequently used features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/school-admin/students")}>
                  <Users className="h-5 w-5" />
                  <span className="text-xs">Add Student</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/school-admin/teachers")}>
                  <GraduationCap className="h-5 w-5" />
                  <span className="text-xs">Add Teacher</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/school-admin/attendance")}>
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs">Record Attendance</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/school-admin/collect-fee")}>
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xs">Collect Fee</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/school-admin/notices")}>
                  <Bell className="h-5 w-5" />
                  <span className="text-xs">Create Notice</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/school-admin/exams")}>
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Create Exam</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/school-admin/payroll")}>
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Generate Payroll</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/school-admin/reports")}>
                  <ClipboardList className="h-5 w-5" />
                  <span className="text-xs">View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fee Collection Summary */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Fee Collection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Today</span>
                  <span className="font-semibold">₹{stats.todayCollection.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="font-semibold">₹{stats.monthlyRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-semibold text-orange-500">₹{stats.pendingFees.toLocaleString()}</span>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate("/school-admin/fees")}>
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Attendance Overview */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Attendance Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Percentage</span>
                  <span className="font-semibold">{stats.todayAttendance}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Classes Marked</span>
                  <span className="font-semibold">{stats.classesMarkedToday}/{stats.totalClassesToMark}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {stats.classesMarkedToday === stats.totalClassesToMark ? (
                    <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" /> All Done</Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" /> Pending</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate("/school-admin/attendance")}>
                  View Report <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Exam Status */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Exam Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Exams</span>
                  <span className="font-semibold">{stats.activeExams}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {stats.activeExams > 0 ? (
                    <Badge variant="outline">{stats.activeExams} unpublished</Badge>
                  ) : (
                    <Badge variant="secondary">No active exams</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate("/school-admin/exams")}>
                  Manage Exams <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Payroll Status */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payroll Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Salaries</span>
                  <span className="font-semibold">{stats.pendingPayroll}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {stats.pendingPayroll > 0 ? (
                    <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" /> Action Required</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" /> All Paid</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate("/school-admin/payroll")}>
                  View Payroll <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subscription Status */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Subscription Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subInfo ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <Badge variant={subInfo.status === "Active" ? "default" : "secondary"}>
                        {subInfo.plan} - {subInfo.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Valid Until</span>
                      <span className="font-medium">{subInfo.endDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Days Remaining</span>
                      <span className={`font-bold ${subInfo.daysLeft <= 7 ? "text-destructive" : "text-secondary"}`}>
                        {subInfo.daysLeft} days
                      </span>
                    </div>
                    {subInfo.daysLeft <= 7 && (
                      <Button className="w-full" variant="destructive">
                        Renew Now
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No subscription found</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Reports */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Quick Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate("/school-admin/fees")}
                >
                  Fee Collection Report
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate("/school-admin/attendance")}
                >
                  Attendance Report
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate("/school-admin/students")}
                >
                  Student Report
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate("/school-admin/reports")}
                >
                  All Reports
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Recent Notices */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Notices
                </CardTitle>
                <CardDescription>Latest announcements</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentNotices.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentNotices.map((notice) => (
                      <div key={notice.id} className="border-l-2 border-primary pl-3 py-1">
                        <p className="font-medium text-sm line-clamp-1">{notice.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notice.published_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full text-primary"
                      onClick={() => navigate("/school-admin/notices")}
                    >
                      View All Notices
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notices yet</p>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => navigate("/school-admin/notices")}
                    >
                      Create your first notice
                    </Button>
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

export default SchoolAdminDashboard;
