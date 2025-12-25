import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Download, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface FeeRecord {
  id: string;
  amount: number;
  paid_amount: number | null;
  due_date: string;
  status: string | null;
  paid_at: string | null;
  receipt_number: string | null;
  fee_structure: {
    name: string;
    frequency: string | null;
  } | null;
}

const StudentFees = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0 });

  useEffect(() => {
    if (user) {
      fetchFees();
    }
  }, [user]);

  const fetchFees = async () => {
    try {
      // First get student ID
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .or(`user_id.eq.${user?.id},parent_user_id.eq.${user?.id}`)
        .maybeSingle();

      if (!studentData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("student_fees")
        .select(`
          id,
          amount,
          paid_amount,
          due_date,
          status,
          paid_at,
          receipt_number,
          fee_structures:fee_structure_id (name, frequency)
        `)
        .eq("student_id", studentData.id)
        .order("due_date", { ascending: false });

      if (error) throw error;

      const feesData = (data || []).map(f => ({
        ...f,
        fee_structure: f.fee_structures as any
      }));
      setFees(feesData);

      // Calculate stats
      const total = feesData.reduce((sum, f) => sum + Number(f.amount), 0);
      const paid = feesData.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0);
      setStats({
        total,
        paid,
        pending: total - paid,
      });
    } catch (error) {
      console.error("Error fetching fees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = (fee: FeeRecord) => {
    if (!fee.receipt_number || fee.status !== "paid") {
      toast.error("Receipt not available for this fee");
      return;
    }
    toast.info("Receipt download feature coming soon!");
  };

  const getStatusBadge = (status: string | null, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== "paid";
    
    if (status === "paid") {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Paid</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Overdue</Badge>;
    }
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
  };

  return (
    <>
      <Helmet><title>Fee Status - SkoolSetu</title></Helmet>
      <DashboardLayout role="student">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Fee Status</h1>
            <p className="text-muted-foreground">View your fee payments and receipts</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Fees</p>
                    <p className="text-2xl font-bold">₹{stats.total.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paid</p>
                    <p className="text-2xl font-bold text-green-600">₹{stats.paid.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${stats.pending > 0 ? "bg-orange-100" : "bg-green-100"}`}>
                    <Clock className={`h-6 w-6 ${stats.pending > 0 ? "text-orange-600" : "text-green-600"}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className={`text-2xl font-bold ${stats.pending > 0 ? "text-orange-600" : "text-green-600"}`}>
                      ₹{stats.pending.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fees Table */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Records</CardTitle>
              <CardDescription>Your fee payment history</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : fees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No fee records found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid On</TableHead>
                      <TableHead className="text-right">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">
                          {fee.fee_structure?.name || "Fee"}
                          {fee.fee_structure?.frequency && (
                            <span className="text-xs text-muted-foreground block">
                              ({fee.fee_structure.frequency})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>₹{Number(fee.amount).toLocaleString()}</TableCell>
                        <TableCell>₹{Number(fee.paid_amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          {new Date(fee.due_date).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(fee.status, fee.due_date)}</TableCell>
                        <TableCell>
                          {fee.paid_at
                            ? new Date(fee.paid_at).toLocaleDateString("en-IN")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {fee.status === "paid" && fee.receipt_number ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadReceipt(fee)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Receipt
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default StudentFees;
