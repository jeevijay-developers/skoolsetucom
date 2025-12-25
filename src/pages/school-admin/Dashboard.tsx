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
} from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  todayAttendance: number;
  pendingFees: number;
  recentNotices: any[];
}

const SchoolAdminDashboard = () => {
  const navigate = useNavigate();
  const { schoolId, subscription, isSubscriptionActive } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    todayAttendance: 0,
    pendingFees: 0,
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
      // Fetch total students
      const { count: studentCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("is_active", true);

      // Fetch total teachers
      const { count: teacherCount } = await supabase
        .from("teachers")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("is_active", true);

      // Fetch today's attendance
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("status")
        .eq("school_id", schoolId)
        .eq("date", today);

      const presentCount = attendanceData?.filter((a) => a.status === "present").length || 0;
      const totalMarked = attendanceData?.length || 0;
      const attendancePercentage = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

      // Fetch pending fees
      const { data: feesData } = await supabase
        .from("student_fees")
        .select("amount, paid_amount")
        .eq("school_id", schoolId)
        .eq("status", "pending");

      const pendingAmount = feesData?.reduce((sum, fee) => {
        return sum + (fee.amount - (fee.paid_amount || 0));
      }, 0) || 0;

      // Fetch recent notices
      const { data: notices } = await supabase
        .from("notices")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(5);

      setStats({
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        todayAttendance: attendancePercentage,
        pendingFees: pendingAmount,
        recentNotices: notices || [],
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              title="Today's Attendance"
              value={`${stats.todayAttendance}%`}
              icon={Calendar}
              variant={stats.todayAttendance >= 80 ? "secondary" : "warning"}
              description="Present today"
            />
            <StatsCard
              title="Pending Fees"
              value={`₹${stats.pendingFees.toLocaleString()}`}
              icon={DollarSign}
              variant={stats.pendingFees > 0 ? "warning" : "default"}
              description="To be collected"
            />
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

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate("/school-admin/attendance")}
                >
                  Mark Attendance
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate("/school-admin/fees")}
                >
                  Collect Fees
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate("/school-admin/exams")}
                >
                  Manage Exams
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate("/school-admin/reports")}
                >
                  View Reports
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
