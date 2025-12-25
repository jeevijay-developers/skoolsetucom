import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Building2, DollarSign, CreditCard, Tag, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalSchools: number;
  activeSubscriptions: number;
  totalRevenue: number;
  activeCoupons: number;
  trialSchools: number;
  expiredSchools: number;
}

interface RecentSchool {
  id: string;
  name: string;
  city: string | null;
  created_at: string;
  subscriptions: { status: string; plan: string }[] | null;
}

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    activeCoupons: 0,
    trialSchools: 0,
    expiredSchools: 0,
  });
  const [recentSchools, setRecentSchools] = useState<RecentSchool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch schools count
      const { count: schoolsCount } = await supabase
        .from("schools")
        .select("*", { count: "exact", head: true });

      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("status, amount");

      const activeCount = subscriptions?.filter(s => s.status === "active").length || 0;
      const trialCount = subscriptions?.filter(s => s.status === "trial").length || 0;
      const expiredCount = subscriptions?.filter(s => s.status === "expired").length || 0;

      // Fetch payments for revenue
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed");

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Fetch active coupons
      const { count: couponsCount } = await supabase
        .from("coupons")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch recent schools
      const { data: recent } = await supabase
        .from("schools")
        .select(`
          id,
          name,
          city,
          created_at,
          subscriptions (status, plan)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalSchools: schoolsCount || 0,
        activeSubscriptions: activeCount,
        totalRevenue,
        activeCoupons: couponsCount || 0,
        trialSchools: trialCount,
        expiredSchools: expiredCount,
      });
      setRecentSchools(recent || []);
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
              title="Total Schools" 
              value={loading ? "..." : stats.totalSchools.toString()} 
              icon={Building2} 
              variant="primary" 
            />
            <StatsCard 
              title="Active Subscriptions" 
              value={loading ? "..." : stats.activeSubscriptions.toString()} 
              icon={CreditCard} 
              variant="secondary" 
            />
            <StatsCard 
              title="Total Revenue" 
              value={loading ? "..." : `₹${stats.totalRevenue.toLocaleString()}`} 
              icon={DollarSign} 
              variant="secondary" 
            />
            <StatsCard 
              title="Active Coupons" 
              value={loading ? "..." : stats.activeCoupons.toString()} 
              icon={Tag} 
              variant="warning" 
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trial Schools</p>
                    <p className="text-2xl font-bold">{stats.trialSchools}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <Users className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expired Subscriptions</p>
                    <p className="text-2xl font-bold">{stats.expiredSchools}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <Building2 className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">
                      {stats.totalSchools > 0 
                        ? Math.round((stats.activeSubscriptions / stats.totalSchools) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Schools */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Schools</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recentSchools.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No schools registered yet</p>
              ) : (
                <div className="space-y-4">
                  {recentSchools.map((school) => (
                    <div key={school.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{school.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {school.city || "Location not set"} • Joined {format(new Date(school.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {school.subscriptions?.[0] && (
                          <>
                            <Badge variant="outline">{school.subscriptions[0].plan}</Badge>
                            {getStatusBadge(school.subscriptions[0].status)}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default SuperAdminDashboard;
