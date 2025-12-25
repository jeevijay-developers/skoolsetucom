import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Fees = () => (
  <>
    <Helmet><title>Fees - SkoolSetu</title></Helmet>
    <DashboardLayout role="school_admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Fees Management</h1>
        <Card className="shadow-card"><CardHeader><CardTitle>Fee Collection</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Manage fee structures and track payments here.</p></CardContent></Card>
      </div>
    </DashboardLayout>
  </>
);
export default Fees;
