import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, Building2, Crown, Calendar, Phone, Mail, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface TrialLead {
  id: string;
  school_id: string;
  school_name: string;
  school_email: string | null;
  school_phone: string | null;
  city: string | null;
  student_count: number;
  plan: string;
  billing_cycle: string;
  created_at: string;
  trial_end_date: string;
}

const TrialLeads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<TrialLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTrialLeads();
  }, []);

  const fetchTrialLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          school_id,
          plan,
          billing_cycle,
          student_count,
          created_at,
          trial_end_date,
          schools (
            name,
            email,
            phone,
            city
          )
        `)
        .eq("status", "trial")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedLeads: TrialLead[] = (data || []).map((item: any) => ({
        id: item.id,
        school_id: item.school_id,
        school_name: item.schools?.name || "Unknown School",
        school_email: item.schools?.email,
        school_phone: item.schools?.phone,
        city: item.schools?.city,
        student_count: item.student_count || 0,
        plan: item.plan || "basic",
        billing_cycle: item.billing_cycle || "monthly",
        created_at: item.created_at,
        trial_end_date: item.trial_end_date,
      }));

      setLeads(formattedLeads);
    } catch (error) {
      console.error("Error fetching trial leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) =>
    lead.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanBadge = (plan: string) => {
    return plan === "pro" ? (
      <Badge className="bg-primary text-primary-foreground">
        <Crown className="w-3 h-3 mr-1" />
        Pro
      </Badge>
    ) : (
      <Badge variant="secondary">Basic</Badge>
    );
  };

  const getBillingBadge = (billing: string) => {
    return billing === "annually" ? (
      <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
        Annually
      </Badge>
    ) : (
      <Badge variant="outline">Monthly</Badge>
    );
  };

  // Calculate estimated revenue
  const calculateEstimatedRevenue = (studentCount: number, plan: string, billing: string) => {
    const pricePerDay = plan === "pro" 
      ? (billing === "annually" ? 2 : 3)
      : (billing === "annually" ? 1 : 2);
    const monthlyPrice = studentCount * pricePerDay * 30;
    return billing === "annually" ? monthlyPrice * 12 : monthlyPrice;
  };

  const totalEstimatedRevenue = filteredLeads.reduce((sum, lead) => 
    sum + calculateEstimatedRevenue(lead.student_count, lead.plan, lead.billing_cycle), 0
  );

  return (
    <>
      <Helmet>
        <title>Trial Leads - Super Admin - SkoolSetu</title>
      </Helmet>
      <DashboardLayout role="super_admin">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/super-admin")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Trial Leads</h1>
                <p className="text-muted-foreground">Schools in trial period - potential conversions</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Leads</p>
                    <p className="text-2xl font-bold">{leads.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Crown className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pro Plan Leads</p>
                    <p className="text-2xl font-bold">{leads.filter(l => l.plan === "pro").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Users className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{leads.reduce((sum, l) => sum + l.student_count, 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card bg-gradient-to-br from-secondary/10 to-secondary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/20">
                    <Calendar className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Revenue</p>
                    <p className="text-2xl font-bold text-secondary">₹{totalEstimatedRevenue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Table */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>All Trial Schools</CardTitle>
                  <CardDescription>Contact these schools to convert them to paid plans</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search schools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No trial leads found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>School Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead className="text-center">Students</TableHead>
                        <TableHead className="text-center">Plan</TableHead>
                        <TableHead className="text-center">Billing</TableHead>
                        <TableHead className="text-right">Est. Revenue</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Trial Started</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{lead.school_name}</TableCell>
                          <TableCell className="text-muted-foreground">{lead.city || "-"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono">
                              {lead.student_count}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{getPlanBadge(lead.plan)}</TableCell>
                          <TableCell className="text-center">{getBillingBadge(lead.billing_cycle)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            ₹{calculateEstimatedRevenue(lead.student_count, lead.plan, lead.billing_cycle).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {lead.school_phone && (
                                <a href={`tel:${lead.school_phone}`} className="text-primary hover:underline">
                                  <Phone className="h-4 w-4" />
                                </a>
                              )}
                              {lead.school_email && (
                                <a href={`mailto:${lead.school_email}`} className="text-primary hover:underline">
                                  <Mail className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(lead.created_at), "MMM dd, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default TrialLeads;
