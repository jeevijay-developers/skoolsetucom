import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Notices = () => (
  <>
    <Helmet><title>Notices - SkoolSetu</title></Helmet>
    <DashboardLayout role="school_admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Notices</h1>
        <Card className="shadow-card"><CardHeader><CardTitle>School Announcements</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Create and manage school notices here.</p></CardContent></Card>
      </div>
    </DashboardLayout>
  </>
);
export default Notices;
