import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Calendar, DollarSign, BookOpen, Bell } from "lucide-react";

const StudentDashboard = () => (
  <>
    <Helmet><title>Student Dashboard - SkoolSetu</title></Helmet>
    <DashboardLayout role="student">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Attendance" value="92%" icon={Calendar} variant="secondary" />
          <StatsCard title="Pending Fees" value="₹0" icon={DollarSign} variant="primary" />
          <StatsCard title="Last Result" value="85%" icon={BookOpen} variant="secondary" />
          <StatsCard title="New Notices" value="2" icon={Bell} variant="warning" />
        </div>
      </div>
    </DashboardLayout>
  </>
);
export default StudentDashboard;
