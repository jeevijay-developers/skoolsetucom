import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Calendar, ClipboardList, Users } from "lucide-react";

const TeacherDashboard = () => (
  <>
    <Helmet><title>Teacher Dashboard - SkoolSetu</title></Helmet>
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="Assigned Classes" value="3" icon={Users} variant="primary" />
          <StatsCard title="Today's Attendance" value="Pending" icon={Calendar} variant="warning" />
          <StatsCard title="Pending Tasks" value="2" icon={ClipboardList} variant="secondary" />
        </div>
      </div>
    </DashboardLayout>
  </>
);
export default TeacherDashboard;
