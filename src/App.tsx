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
import CompleteRegistration from "./pages/CompleteRegistration";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import AboutJeevijay from "./pages/AboutJeevijay";

// School Admin pages
import SchoolAdminDashboard from "./pages/school-admin/Dashboard";
import Students from "./pages/school-admin/Students";
import StudentProfile from "./pages/school-admin/StudentProfile";
import ClassPromotion from "./pages/school-admin/ClassPromotion";
import Teachers from "./pages/school-admin/Teachers";
import Classes from "./pages/school-admin/Classes";

import SchoolAttendance from "./pages/school-admin/Attendance";
import Fees from "./pages/school-admin/Fees";
import CollectFee from "./pages/school-admin/CollectFee";
import InvoiceSettings from "./pages/school-admin/InvoiceSettings";
import DiscountAuthorities from "./pages/school-admin/DiscountAuthorities";
import Exams from "./pages/school-admin/Exams";
import Notices from "./pages/school-admin/Notices";
import Reports from "./pages/school-admin/Reports";
import SchoolProfile from "./pages/school-admin/Profile";
import Employees from "./pages/school-admin/Employees";
import Payroll from "./pages/school-admin/Payroll";
import Greetings from "./pages/school-admin/Greetings";
import StaffAccess from "./pages/school-admin/StaffAccess";
import SchoolSubscription from "./pages/school-admin/Subscription";

// School Staff pages
import StaffDashboard from "./pages/school-staff/Dashboard";

// Teacher pages
import TeacherDashboard from "./pages/teacher/Dashboard";

// Student pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentAttendance from "./pages/student/Attendance";
import StudentFees from "./pages/student/Fees";
import StudentResults from "./pages/student/Results";
import StudentNotices from "./pages/student/Notices";

// Super Admin pages
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import SuperAdminSchools from "./pages/super-admin/Schools";
import SuperAdminSubscriptions from "./pages/super-admin/Subscriptions";
import SuperAdminPayments from "./pages/super-admin/Payments";
import SuperAdminCoupons from "./pages/super-admin/Coupons";
import SuperAdminTrialLeads from "./pages/super-admin/TrialLeads";

// Teacher pages extended
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherExamMarks from "./pages/teacher/ExamMarks";
import TeacherStudents from "./pages/teacher/Students";
import TeacherPayroll from "./pages/teacher/Payroll";
import TeacherFeeStatus from "./pages/teacher/FeeStatus";
import TeacherReportCards from "./pages/teacher/ReportCards";

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
              <Route path="/complete-registration" element={<CompleteRegistration />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about-jeevijay" element={<AboutJeevijay />} />

              {/* School Admin Routes */}
              <Route path="/school-admin" element={<ProtectedRoute allowedRoles={["school_admin"]}><SchoolAdminDashboard /></ProtectedRoute>} />
              <Route path="/school-admin/students" element={<ProtectedRoute allowedRoles={["school_admin"]}><Students /></ProtectedRoute>} />
              <Route path="/school-admin/students/:id" element={<ProtectedRoute allowedRoles={["school_admin"]}><StudentProfile /></ProtectedRoute>} />
              <Route path="/school-admin/class-promotion" element={<ProtectedRoute allowedRoles={["school_admin"]}><ClassPromotion /></ProtectedRoute>} />
              <Route path="/school-admin/teachers" element={<ProtectedRoute allowedRoles={["school_admin"]}><Teachers /></ProtectedRoute>} />
              <Route path="/school-admin/classes" element={<ProtectedRoute allowedRoles={["school_admin"]}><Classes /></ProtectedRoute>} />
              
              <Route path="/school-admin/attendance" element={<ProtectedRoute allowedRoles={["school_admin"]}><SchoolAttendance /></ProtectedRoute>} />
              <Route path="/school-admin/fees" element={<ProtectedRoute allowedRoles={["school_admin"]}><Fees /></ProtectedRoute>} />
              <Route path="/school-admin/collect-fee" element={<ProtectedRoute allowedRoles={["school_admin"]}><CollectFee /></ProtectedRoute>} />
              <Route path="/school-admin/invoice-settings" element={<ProtectedRoute allowedRoles={["school_admin"]}><InvoiceSettings /></ProtectedRoute>} />
              <Route path="/school-admin/discount-authorities" element={<ProtectedRoute allowedRoles={["school_admin"]}><DiscountAuthorities /></ProtectedRoute>} />
              <Route path="/school-admin/exams" element={<ProtectedRoute allowedRoles={["school_admin"]}><Exams /></ProtectedRoute>} />
              <Route path="/school-admin/notices" element={<ProtectedRoute allowedRoles={["school_admin"]}><Notices /></ProtectedRoute>} />
              <Route path="/school-admin/reports" element={<ProtectedRoute allowedRoles={["school_admin"]}><Reports /></ProtectedRoute>} />
              <Route path="/school-admin/profile" element={<ProtectedRoute allowedRoles={["school_admin"]}><SchoolProfile /></ProtectedRoute>} />
              <Route path="/school-admin/employees" element={<ProtectedRoute allowedRoles={["school_admin"]}><Employees /></ProtectedRoute>} />
              <Route path="/school-admin/payroll" element={<ProtectedRoute allowedRoles={["school_admin"]}><Payroll /></ProtectedRoute>} />
              <Route path="/school-admin/greetings" element={<ProtectedRoute allowedRoles={["school_admin"]}><Greetings /></ProtectedRoute>} />
              <Route path="/school-admin/staff-access" element={<ProtectedRoute allowedRoles={["school_admin"]}><StaffAccess /></ProtectedRoute>} />
              <Route path="/school-admin/subscription" element={<ProtectedRoute allowedRoles={["school_admin"]}><SchoolSubscription /></ProtectedRoute>} />

              {/* School Staff Routes */}
              <Route path="/school-staff" element={<ProtectedRoute allowedRoles={["school_staff"]}><StaffDashboard /></ProtectedRoute>} />

              {/* Teacher Routes */}
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherDashboard /></ProtectedRoute>} />

              {/* Student Routes */}
              <Route path="/student" element={<ProtectedRoute allowedRoles={["student", "parent"]}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={["student", "parent"]}><StudentAttendance /></ProtectedRoute>} />
              <Route path="/student/fees" element={<ProtectedRoute allowedRoles={["student", "parent"]}><StudentFees /></ProtectedRoute>} />
              <Route path="/student/results" element={<ProtectedRoute allowedRoles={["student", "parent"]}><StudentResults /></ProtectedRoute>} />
              <Route path="/student/notices" element={<ProtectedRoute allowedRoles={["student", "parent"]}><StudentNotices /></ProtectedRoute>} />

              {/* Super Admin Routes */}
              <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminDashboard /></ProtectedRoute>} />
              <Route path="/super-admin/schools" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminSchools /></ProtectedRoute>} />
              <Route path="/super-admin/subscriptions" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminSubscriptions /></ProtectedRoute>} />
              <Route path="/super-admin/payments" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminPayments /></ProtectedRoute>} />
              <Route path="/super-admin/coupons" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminCoupons /></ProtectedRoute>} />
              <Route path="/super-admin/trial-leads" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminTrialLeads /></ProtectedRoute>} />

              {/* Teacher Routes Extended */}
              <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherAttendance /></ProtectedRoute>} />
              <Route path="/teacher/exam-marks" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherExamMarks /></ProtectedRoute>} />
              <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherStudents /></ProtectedRoute>} />
              <Route path="/teacher/payroll" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherPayroll /></ProtectedRoute>} />
              <Route path="/teacher/fee-status" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherFeeStatus /></ProtectedRoute>} />
              <Route path="/teacher/report-cards" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherReportCards /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
