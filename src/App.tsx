import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// School Admin pages
import SchoolAdminDashboard from "./pages/school-admin/Dashboard";
import Students from "./pages/school-admin/Students";
import Teachers from "./pages/school-admin/Teachers";
import Classes from "./pages/school-admin/Classes";
import SchoolAttendance from "./pages/school-admin/Attendance";
import Fees from "./pages/school-admin/Fees";
import Exams from "./pages/school-admin/Exams";
import Notices from "./pages/school-admin/Notices";
import Reports from "./pages/school-admin/Reports";

// Teacher pages
import TeacherDashboard from "./pages/teacher/Dashboard";

// Student pages
import StudentDashboard from "./pages/student/Dashboard";

// Super Admin pages
import SuperAdminDashboard from "./pages/super-admin/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* School Admin Routes */}
              <Route path="/school-admin" element={<ProtectedRoute allowedRoles={["school_admin"]}><SchoolAdminDashboard /></ProtectedRoute>} />
              <Route path="/school-admin/students" element={<ProtectedRoute allowedRoles={["school_admin"]}><Students /></ProtectedRoute>} />
              <Route path="/school-admin/teachers" element={<ProtectedRoute allowedRoles={["school_admin"]}><Teachers /></ProtectedRoute>} />
              <Route path="/school-admin/classes" element={<ProtectedRoute allowedRoles={["school_admin"]}><Classes /></ProtectedRoute>} />
              <Route path="/school-admin/attendance" element={<ProtectedRoute allowedRoles={["school_admin"]}><SchoolAttendance /></ProtectedRoute>} />
              <Route path="/school-admin/fees" element={<ProtectedRoute allowedRoles={["school_admin"]}><Fees /></ProtectedRoute>} />
              <Route path="/school-admin/exams" element={<ProtectedRoute allowedRoles={["school_admin"]}><Exams /></ProtectedRoute>} />
              <Route path="/school-admin/notices" element={<ProtectedRoute allowedRoles={["school_admin"]}><Notices /></ProtectedRoute>} />
              <Route path="/school-admin/reports" element={<ProtectedRoute allowedRoles={["school_admin"]}><Reports /></ProtectedRoute>} />

              {/* Teacher Routes */}
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherDashboard /></ProtectedRoute>} />

              {/* Student Routes */}
              <Route path="/student" element={<ProtectedRoute allowedRoles={["student", "parent"]}><StudentDashboard /></ProtectedRoute>} />

              {/* Super Admin Routes */}
              <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminDashboard /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
