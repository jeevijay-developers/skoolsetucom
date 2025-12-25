import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Building2, DollarSign, CreditCard, Tag } from "lucide-react";

const SuperAdminDashboard = () => (
  <>
    <Helmet><title>Super Admin - SkoolSetu</title></Helmet>
    <DashboardLayout role="super_admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Total Schools" value="0" icon={Building2} variant="primary" />
          <StatsCard title="Active Subscriptions" value="0" icon={CreditCard} variant="secondary" />
          <StatsCard title="Monthly Revenue" value="₹0" icon={DollarSign} variant="secondary" />
          <StatsCard title="Active Coupons" value="0" icon={Tag} variant="warning" />
        </div>
      </div>
    </DashboardLayout>
  </>
);
export default SuperAdminDashboard;
