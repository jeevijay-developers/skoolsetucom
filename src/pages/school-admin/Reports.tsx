import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Reports = () => (
  <>
    <Helmet><title>Reports - SkoolSetu</title></Helmet>
    <DashboardLayout role="school_admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Card className="shadow-card"><CardHeader><CardTitle>Analytics & Reports</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">View attendance, fees, and exam reports here.</p></CardContent></Card>
      </div>
    </DashboardLayout>
  </>
);
export default Reports;
