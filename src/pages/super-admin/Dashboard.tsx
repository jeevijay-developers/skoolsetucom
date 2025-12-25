import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Building2, DollarSign, CreditCard, Tag, TrendingUp, Users, ArrowRight, Clock, AlertCircle, CheckCircle, UserPlus } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface DashboardStats {
  totalSchools: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeCoupons: number;
  trialSchools: number;
  expiredSchools: number;
  totalStudents: number;
  pendingPayments: number;
}

interface RecentSchool {
  id: string;
  name: string;
  city: string | null;
  created_at: string;
  subscriptions: { status: string; plan: string }[] | null;
}

interface RecentPayment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  school_name: string;
}

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeCoupons: 0,
    trialSchools: 0,
    expiredSchools: 0,
    totalStudents: 0,
    pendingPayments: 0,
  });
  const [recentSchools, setRecentSchools] = useState<RecentSchool[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      // Fetch all data in parallel
      const [
        schoolsResult,
        subscriptionsResult,
        paymentsResult,
        monthlyPaymentsResult,
        pendingPaymentsResult,
        couponsResult,
        studentsResult,
        recentSchoolsResult,
        recentPaymentsResult,
      ] = await Promise.all([
        supabase.from("schools").select("*", { count: "exact", head: true }),
        supabase.from("subscriptions").select("status, amount"),
        supabase.from("payments").select("amount").eq("status", "completed"),
        supabase.from("payments").select("amount").eq("status", "completed").gte("paid_at", `${monthStart}T00:00:00`).lte("paid_at", `${monthEnd}T23:59:59`),
        supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("coupons").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("students").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("schools").select(`id, name, city, created_at, subscriptions (status, plan)`).order("created_at", { ascending: false }).limit(5),
        supabase.from("payments").select(`id, amount, status, created_at, schools(name)`).order("created_at", { ascending: false }).limit(5),
      ]);

      const activeCount = subscriptionsResult.data?.filter(s => s.status === "active").length || 0;
      const trialCount = subscriptionsResult.data?.filter(s => s.status === "trial").length || 0;
      const expiredCount = subscriptionsResult.data?.filter(s => s.status === "expired").length || 0;
      const totalRevenue = paymentsResult.data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const monthlyRevenue = monthlyPaymentsResult.data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

      setStats({
        totalSchools: schoolsResult.count || 0,
        activeSubscriptions: activeCount,
        totalRevenue,
        monthlyRevenue,
        activeCoupons: couponsResult.count || 0,
        trialSchools: trialCount,
        expiredSchools: expiredCount,
        totalStudents: studentsResult.count || 0,
        pendingPayments: pendingPaymentsResult.count || 0,
      });
      
      setRecentSchools(recentSchoolsResult.data || []);
      setRecentPayments(
        (recentPaymentsResult.data || []).map(p => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          created_at: p.created_at,
          school_name: (p.schools as any)?.name || "Unknown",
        }))
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-secondary text-secondary-foreground">Active</Badge>;
      case "trial":
        return <Badge variant="secondary">Trial</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "completed":
        return <Badge className="bg-secondary text-secondary-foreground">Completed</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Helmet><title>Super Admin - SkoolSetu</title></Helmet>
      <DashboardLayout role="super_admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Platform Overview</h1>
            <p className="text-muted-foreground">Monitor and manage all schools on SkoolSetu</p>
          </div>

          {/* Primary Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatsCard 
              title="Total Schools" 
              value={loading ? "..." : stats.totalSchools.toString()} 
              icon={Building2} 
              variant="primary" 
            />
            <StatsCard 
              title="Total Students" 
              value={loading ? "..." : stats.totalStudents.toLocaleString()} 
              icon={Users} 
              variant="secondary" 
            />
            <StatsCard 
              title="Total Revenue" 
              value={loading ? "..." : `₹${stats.totalRevenue.toLocaleString()}`} 
              icon={DollarSign} 
              variant="secondary" 
            />
            <StatsCard 
              title="This Month" 
              value={loading ? "..." : `₹${stats.monthlyRevenue.toLocaleString()}`} 
              icon={TrendingUp} 
              variant="primary" 
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <CreditCard className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Subscriptions</p>
                    <p className="text-xl font-bold">{stats.activeSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trial Schools</p>
                    <p className="text-xl font-bold">{stats.trialSchools}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expired</p>
                    <p className="text-xl font-bold">{stats.expiredSchools}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <DollarSign className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending Payments</p>
                    <p className="text-xl font-bold">{stats.pendingPayments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Tag className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Coupons</p>
                    <p className="text-xl font-bold">{stats.activeCoupons}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage platform resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/super-admin/schools")}>
                  <Building2 className="h-5 w-5" />
                  <span className="text-xs">All Schools</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/super-admin/subscriptions")}>
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Subscriptions</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/super-admin/payments")}>
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xs">Payments</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/super-admin/coupons")}>
                  <Tag className="h-5 w-5" />
                  <span className="text-xs">Coupons</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 border-secondary/50 hover:bg-secondary/10" onClick={() => navigate("/super-admin/trial-leads")}>
                  <UserPlus className="h-5 w-5 text-secondary" />
                  <span className="text-xs">Trial Leads</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Payments Overview */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payments Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-semibold">₹{stats.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="font-semibold">₹{stats.monthlyRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-semibold text-orange-500">{stats.pendingPayments}</span>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate("/super-admin/payments")}>
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Subscription Health */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Subscription Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <Badge variant="secondary">{stats.activeSubscriptions}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trial</span>
                  <Badge variant="outline">{stats.trialSchools}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expired</span>
                  <Badge variant="destructive">{stats.expiredSchools}</Badge>
                </div>
                <div className="pt-2 border-t text-sm">
                  <span className="text-muted-foreground">Conversion Rate: </span>
                  <span className="font-semibold">
                    {stats.totalSchools > 0 ? Math.round((stats.activeSubscriptions / stats.totalSchools) * 100) : 0}%
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate("/super-admin/subscriptions")}>
                  Manage <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* School Activity */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Platform Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Schools</span>
                  <span className="font-semibold">{stats.totalSchools}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Students</span>
                  <span className="font-semibold">{stats.totalStudents.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Students/School</span>
                  <span className="font-semibold">
                    {stats.totalSchools > 0 ? Math.round(stats.totalStudents / stats.totalSchools) : 0}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate("/super-admin/schools")}>
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Schools */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Schools</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/super-admin/schools")}>
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : recentSchools.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No schools registered yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentSchools.map((school) => (
                      <div key={school.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{school.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {school.city || "Location not set"} • {format(new Date(school.created_at), "MMM dd")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {school.subscriptions?.[0] && getStatusBadge(school.subscriptions[0].status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Payments</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/super-admin/payments")}>
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : recentPayments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No payments yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.school_name} • {format(new Date(payment.created_at), "MMM dd")}
                          </p>
                        </div>
                        {getStatusBadge(payment.status)}
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

export default SuperAdminDashboard;
