import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Attendance = () => (
  <>
    <Helmet><title>Attendance - SkoolSetu</title></Helmet>
    <DashboardLayout role="school_admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Attendance Management</h1>
        <Card className="shadow-card"><CardHeader><CardTitle>Attendance</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">View and manage daily attendance records here.</p></CardContent></Card>
      </div>
    </DashboardLayout>
  </>
);
export default Attendance;
