import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  LogOut,
  ChevronDown,
  DollarSign,
  CreditCard,
  Calendar,
  Users,
  ClipboardList,
  BarChart3,
  Bell,
  Settings,
} from "lucide-react";
import logo from "@/assets/skoolsetu-logo.png";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  permission: string;
}

const allMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/school-staff", icon: Home, permission: "always" },
  { title: "Collect Fee", url: "/school-staff/collect-fee", icon: DollarSign, permission: "can_collect_fee" },
  { title: "Payroll", url: "/school-staff/payroll", icon: CreditCard, permission: "can_manage_payroll" },
  { title: "Attendance", url: "/school-staff/attendance", icon: Calendar, permission: "can_manage_attendance" },
  { title: "Students", url: "/school-staff/students", icon: Users, permission: "can_manage_students" },
  { title: "Exams", url: "/school-staff/exams", icon: ClipboardList, permission: "can_manage_exams" },
  { title: "Reports", url: "/school-staff/reports", icon: BarChart3, permission: "can_view_reports" },
  { title: "Notices", url: "/school-staff/notices", icon: Bell, permission: "can_manage_notices" },
  { title: "Profile", url: "/school-staff/profile", icon: Settings, permission: "always" },
];

interface StaffPermissions {
  can_collect_fee: boolean;
  can_manage_payroll: boolean;
  can_manage_attendance: boolean;
  can_manage_students: boolean;
  can_manage_exams: boolean;
  can_view_reports: boolean;
  can_manage_notices: boolean;
}

interface StaffLayoutProps {
  children: ReactNode;
}

const StaffLayout = ({ children }: StaffLayoutProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [permissions, setPermissions] = useState<StaffPermissions | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchPermissions();
    }
  }, [user?.id]);

  const fetchPermissions = async () => {
    const { data } = await supabase
      .from("staff_permissions")
      .select("can_collect_fee, can_manage_payroll, can_manage_attendance, can_manage_students, can_manage_exams, can_view_reports, can_manage_notices")
      .eq("user_id", user!.id)
      .eq("is_active", true)
      .maybeSingle();

    if (data) {
      setPermissions(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const visibleMenuItems = allMenuItems.filter((item) => {
    if (item.permission === "always") return true;
    return permissions?.[item.permission as keyof StaffPermissions];
  });

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
                Staff Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/school-staff"}
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
          <header className="h-16 border-b bg-background flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-lg font-semibold hidden sm:block">Staff Portal</h1>
            </div>

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
                    <span className="text-xs text-muted-foreground font-normal">Staff</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 p-4 sm:p-6 bg-muted/30 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StaffLayout;
