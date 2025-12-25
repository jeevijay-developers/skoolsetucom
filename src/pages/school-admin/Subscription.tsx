import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CreditCard, Users, Calendar, AlertTriangle, CheckCircle, Clock, Crown } from "lucide-react";

interface SubscriptionDetails {
  id: string;
  plan: string;
  status: string;
  student_count: number;
  billing_cycle: string | null;
  trial_start_date: string;
  trial_end_date: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  amount: number | null;
}

const Subscription = () => {
  const { schoolId, subscription } = useAuth();
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [currentStudentCount, setCurrentStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      fetchSubscriptionDetails();
      fetchStudentCount();
    }
  }, [schoolId]);

  const fetchSubscriptionDetails = async () => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("school_id", schoolId!)
      .single();

    if (!error && data) {
      setSubscriptionDetails(data);
    }
    setLoading(false);
  };

  const fetchStudentCount = async () => {
    const { count, error } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId!)
      .eq("is_active", true);

    if (!error && count !== null) {
      setCurrentStudentCount(count);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-secondary text-secondary-foreground"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case "trial":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Trial</Badge>;
      case "expired":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const studentLimit = subscriptionDetails?.student_count || 50;
  const usagePercent = Math.min((currentStudentCount / studentLimit) * 100, 100);
  const isAtLimit = currentStudentCount >= studentLimit;

  // Calculate pricing
  const calculatePrice = () => {
    if (!subscriptionDetails) return { monthly: 0, daily: 0 };
    const students = subscriptionDetails.student_count || 50;
    const isAnnual = subscriptionDetails.billing_cycle === "annual";
    const isPro = subscriptionDetails.plan === "pro";

    const dailyRate = isPro 
      ? (isAnnual ? 2 : 3) 
      : (isAnnual ? 1 : 2);
    
    const daily = students * dailyRate;
    const monthly = daily * 30;
    
    return { monthly, daily, dailyRate };
  };

  const pricing = calculatePrice();

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
        <title>Subscription - SkoolSetu</title>
      </Helmet>

      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Subscription Management</h1>
            <p className="text-muted-foreground">Manage your school's subscription and usage</p>
          </div>

          {/* Current Plan Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="capitalize">{subscriptionDetails?.plan || "Basic"} Plan</CardTitle>
                      <CardDescription>Your current subscription</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(subscriptionDetails?.status || "trial")}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  {subscriptionDetails?.status === "trial" ? (
                    <>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Trial Started</p>
                        <p className="font-semibold">
                          {format(new Date(subscriptionDetails.trial_start_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Trial Ends</p>
                        <p className="font-semibold text-primary">
                          {format(new Date(subscriptionDetails.trial_end_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </>
                  ) : subscriptionDetails?.subscription_start_date ? (
                    <>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Subscription Started</p>
                        <p className="font-semibold">
                          {format(new Date(subscriptionDetails.subscription_start_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Renewal Date</p>
                        <p className="font-semibold text-primary">
                          {subscriptionDetails.subscription_end_date 
                            ? format(new Date(subscriptionDetails.subscription_end_date), "MMM dd, yyyy")
                            : "-"}
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Pricing Info */}
                {subscriptionDetails?.status === "active" && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Billing</p>
                        <p className="text-lg font-bold">
                          ₹{pricing.daily}/day 
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            (₹{pricing.dailyRate}/student/day)
                          </span>
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {subscriptionDetails.billing_cycle || "Monthly"} Billing
                      </Badge>
                    </div>
                  </div>
                )}

                {subscriptionDetails?.status === "trial" && (
                  <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                    <p className="text-sm font-medium text-primary">
                      You're currently on a free trial. Contact support to activate your subscription.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Student Usage */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Usage
                </CardTitle>
                <CardDescription>Active students vs plan limit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold">{currentStudentCount}</p>
                  <p className="text-sm text-muted-foreground">of {studentLimit} students</p>
                </div>

                <Progress 
                  value={usagePercent} 
                  className={`h-3 ${isAtLimit ? "[&>div]:bg-destructive" : usagePercent > 80 ? "[&>div]:bg-amber-500" : ""}`} 
                />

                {isAtLimit && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Student limit reached! Upgrade to add more.</span>
                  </div>
                )}

                {!isAtLimit && usagePercent > 80 && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg text-amber-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Approaching student limit</span>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {studentLimit - currentStudentCount} spots remaining
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upgrade Options */}
          {(subscriptionDetails?.status === "trial" || subscriptionDetails?.status === "expired") && (
            <Card className="shadow-card border-primary/20">
              <CardHeader>
                <CardTitle>Upgrade Your Plan</CardTitle>
                <CardDescription>
                  Contact our sales team to activate your subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-bold text-lg mb-2">Basic Plan</h3>
                    <p className="text-2xl font-bold text-primary mb-2">
                      ₹1<span className="text-sm font-normal">/student/day (annual)</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      ₹2/student/day for monthly billing
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        All core features
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        Student & Fee Management
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        Attendance Tracking
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border-2 border-primary rounded-lg relative">
                    <Badge className="absolute -top-2 right-4">Recommended</Badge>
                    <h3 className="font-bold text-lg mb-2">Pro Plan</h3>
                    <p className="text-2xl font-bold text-primary mb-2">
                      ₹2<span className="text-sm font-normal">/student/day (annual)</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      ₹3/student/day for monthly billing
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        Everything in Basic
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        Advanced Analytics
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        Priority Support
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        Custom Branding
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Button size="lg">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Contact Sales to Upgrade
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Call: +91 98765 43210 | Email: sales@skoolsetu.com
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </>
  );
};

export default Subscription;
