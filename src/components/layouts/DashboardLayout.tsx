import { ReactNode, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  Home,
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  FileText,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  School,
  ClipboardList,
  BookOpen,
  CreditCard,
  Building2,
  Tag,
  Menu,
  ChevronDown,
  AlertTriangle,
  Receipt,
  Crown,
  ArrowUpCircle,
} from "lucide-react";
import logo from "@/assets/skoolsetu-logo.png";
import TrialCountdownBanner from "@/components/TrialCountdownBanner";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: ReactNode;
  role: "super_admin" | "school_admin" | "teacher" | "student";
}

const menuItems: Record<string, MenuItem[]> = {
  super_admin: [
    { title: "Dashboard", url: "/super-admin", icon: Home },
    { title: "Schools", url: "/super-admin/schools", icon: Building2 },
    { title: "Subscriptions", url: "/super-admin/subscriptions", icon: CreditCard },
    { title: "Payments", url: "/super-admin/payments", icon: DollarSign },
    { title: "Coupons", url: "/super-admin/coupons", icon: Tag },
  ],
  school_admin: [
    { title: "Dashboard", url: "/school-admin", icon: Home },
    { title: "Students", url: "/school-admin/students", icon: Users },
    { title: "Teachers", url: "/school-admin/teachers", icon: GraduationCap },
    { title: "Classes", url: "/school-admin/classes", icon: School },
    { title: "Class Promotion", url: "/school-admin/class-promotion", icon: ArrowUpCircle },
    { title: "Attendance", url: "/school-admin/attendance", icon: Calendar },
    { title: "Fees", url: "/school-admin/fees", icon: DollarSign },
    { title: "Collect Fee", url: "/school-admin/collect-fee", icon: Receipt },
    { title: "Invoice Settings", url: "/school-admin/invoice-settings", icon: FileText },
    { title: "Discount Authorities", url: "/school-admin/discount-authorities", icon: Tag },
    { title: "Exams", url: "/school-admin/exams", icon: ClipboardList },
    { title: "Employees", url: "/school-admin/employees", icon: Users },
    { title: "Payroll", url: "/school-admin/payroll", icon: CreditCard },
    { title: "Greetings", url: "/school-admin/greetings", icon: Bell },
    { title: "Notices", url: "/school-admin/notices", icon: Bell },
    { title: "Reports", url: "/school-admin/reports", icon: BarChart3 },
    { title: "Staff Access", url: "/school-admin/staff-access", icon: Users },
    { title: "Subscription", url: "/school-admin/subscription", icon: Crown },
    { title: "Profile", url: "/school-admin/profile", icon: Settings },
  ],
  teacher: [
    { title: "Dashboard", url: "/teacher", icon: Home },
    { title: "Attendance", url: "/teacher/attendance", icon: Calendar },
    { title: "Exam Marks", url: "/teacher/exam-marks", icon: ClipboardList },
    { title: "Students", url: "/teacher/students", icon: Users },
    { title: "Fee Status", url: "/teacher/fee-status", icon: DollarSign },
    { title: "Report Cards", url: "/teacher/report-cards", icon: FileText },
    { title: "My Payroll", url: "/teacher/payroll", icon: CreditCard },
  ],
  student: [
    { title: "Dashboard", url: "/student", icon: Home },
    { title: "Attendance", url: "/student/attendance", icon: Calendar },
    { title: "Fees", url: "/student/fees", icon: DollarSign },
    { title: "Results", url: "/student/results", icon: BookOpen },
    { title: "Notices", url: "/student/notices", icon: Bell },
  ],
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  school_admin: "School Admin",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, subscription, signOut, isSubscriptionActive } = useAuth();
  const items = menuItems[role] || [];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const getSubscriptionBadge = () => {
    if (!subscription) return null;
    
    if (subscription.status === "trial") {
      const trialEnd = new Date(subscription.trial_end_date);
      const now = new Date();
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 0) {
        return <Badge variant="destructive">Trial Expired</Badge>;
      }
      return <Badge variant="secondary">Trial: {daysLeft} day{daysLeft !== 1 ? "s" : ""} left</Badge>;
    }
    
    if (subscription.status === "active") {
      return <Badge className="bg-secondary text-secondary-foreground">Active</Badge>;
    }
    
    if (subscription.status === "expired") {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return null;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r border-sidebar-border">
          <div className="p-4 border-b border-sidebar-border bg-sidebar">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="SkoolSetu" className="h-8 brightness-0 invert" />
            </Link>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/70">
                {roleLabels[role]} Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === `/${role.replace("_", "-")}`}
                          className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b bg-background flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-lg font-semibold hidden sm:block">
                {roleLabels[userRole?.role || role]}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Subscription Status */}
              {role !== "super_admin" && getSubscriptionBadge()}

              {/* Subscription Warning Banner */}
              {role !== "super_admin" && !isSubscriptionActive && subscription && (
                <div className="hidden md:flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Subscription inactive</span>
                </div>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.email}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {roleLabels[userRole?.role || role]}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Trial Countdown Banner */}
          {role === "school_admin" && <TrialCountdownBanner />}

          {/* Subscription Warning for non-active */}
          {role !== "super_admin" && !isSubscriptionActive && subscription && subscription.status !== "trial" && (
            <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  Your subscription has expired. Some features are restricted.
                </span>
              </div>
              <Button size="sm" variant="destructive">
                Renew Now
              </Button>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 bg-muted/30 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
