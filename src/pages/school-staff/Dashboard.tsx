import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  CreditCard, 
  Calendar, 
  Users, 
  ClipboardList, 
  BarChart3, 
  Bell,
  Loader2,
  Shield
} from "lucide-react";
import StaffLayout from "@/components/layouts/StaffLayout";

interface StaffPermissions {
  can_collect_fee: boolean;
  can_manage_payroll: boolean;
  can_manage_attendance: boolean;
  can_manage_students: boolean;
  can_manage_exams: boolean;
  can_view_reports: boolean;
  can_manage_notices: boolean;
}

const moduleCards = [
  {
    key: "can_collect_fee",
    title: "Collect Fee",
    description: "Collect student fees and generate receipts",
    icon: DollarSign,
    link: "/school-staff/collect-fee",
    color: "text-green-600",
  },
  {
    key: "can_manage_payroll",
    title: "Payroll",
    description: "Manage employee payroll and salaries",
    icon: CreditCard,
    link: "/school-staff/payroll",
    color: "text-blue-600",
  },
  {
    key: "can_manage_attendance",
    title: "Attendance",
    description: "Mark and view student attendance",
    icon: Calendar,
    link: "/school-staff/attendance",
    color: "text-purple-600",
  },
  {
    key: "can_manage_students",
    title: "Students",
    description: "View student details and information",
    icon: Users,
    link: "/school-staff/students",
    color: "text-orange-600",
  },
  {
    key: "can_manage_exams",
    title: "Exams & Marks",
    description: "View exams and enter student marks",
    icon: ClipboardList,
    link: "/school-staff/exams",
    color: "text-red-600",
  },
  {
    key: "can_view_reports",
    title: "Reports",
    description: "View various school reports",
    icon: BarChart3,
    link: "/school-staff/reports",
    color: "text-teal-600",
  },
  {
    key: "can_manage_notices",
    title: "Notices",
    description: "Create and manage school notices",
    icon: Bell,
    link: "/school-staff/notices",
    color: "text-amber-600",
  },
];

const StaffDashboard = () => {
  const { user, schoolId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);
  const [employeeName, setEmployeeName] = useState<string>("");

  useEffect(() => {
    if (user?.id) {
      fetchPermissions();
    }
  }, [user?.id]);

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from("staff_permissions")
        .select(`
          can_collect_fee,
          can_manage_payroll,
          can_manage_attendance,
          can_manage_students,
          can_manage_exams,
          can_view_reports,
          can_manage_notices,
          employee:employees(full_name)
        `)
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPermissions({
          can_collect_fee: data.can_collect_fee,
          can_manage_payroll: data.can_manage_payroll,
          can_manage_attendance: data.can_manage_attendance,
          can_manage_students: data.can_manage_students,
          can_manage_exams: data.can_manage_exams,
          can_view_reports: data.can_view_reports,
          can_manage_notices: data.can_manage_notices,
        });
        setEmployeeName((data.employee as any)?.full_name || "");
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const allowedModules = moduleCards.filter(
    (card) => permissions?.[card.key as keyof StaffPermissions]
  );

  if (loading) {
    return (
      <>
        <Helmet><title>Staff Dashboard - SkoolSetu</title></Helmet>
        <StaffLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </StaffLayout>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Staff Dashboard - SkoolSetu</title></Helmet>
      <StaffLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome{employeeName ? `, ${employeeName}` : ""}!
            </h1>
            <p className="text-muted-foreground">
              Access your assigned modules below
            </p>
          </div>

          {allowedModules.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Modules Assigned</h3>
                <p className="text-muted-foreground">
                  You don't have access to any modules yet. Contact your school admin for access.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allowedModules.map((module) => (
                <Link key={module.key} to={module.link}>
                  <Card className="shadow-card hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-muted ${module.color}`}>
                          <module.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{module.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{module.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </StaffLayout>
    </>
  );
};

export default StaffDashboard;
