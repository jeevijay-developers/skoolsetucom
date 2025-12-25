import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Exams = () => (
  <>
    <Helmet><title>Exams - SkoolSetu</title></Helmet>
    <DashboardLayout role="school_admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Exams & Results</h1>
        <Card className="shadow-card"><CardHeader><CardTitle>Exam Management</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Create exams and manage results here.</p></CardContent></Card>
      </div>
    </DashboardLayout>
  </>
);
export default Exams;
