import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Download, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
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
import { generateReceiptHTML } from "@/utils/receiptTemplates";

interface FeeRecord {
  id: string;
  amount: number;
  paid_amount: number | null;
  discount_amount: number | null;
  due_date: string;
  status: string | null;
  paid_at: string | null;
  receipt_number: string | null;
  payment_mode: string | null;
  fee_structure: {
    name: string;
    frequency: string | null;
  } | null;
}

interface StudentData {
  id: string;
  full_name: string;
  roll_number: string | null;
  parent_name: string | null;
  school_id: string;
  class_info: {
    name: string;
    section: string | null;
  } | null;
}

const StudentFees = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0 });

  useEffect(() => {
    if (user) {
      fetchFees();
    }
  }, [user]);

  const fetchFees = async () => {
    try {
      // First get student data with class info
      const { data: student } = await supabase
        .from("students")
        .select(`
          id,
          full_name,
          roll_number,
          parent_name,
          school_id,
          classes:class_id (name, section)
        `)
        .or(`user_id.eq.${user?.id},parent_user_id.eq.${user?.id}`)
        .maybeSingle();

      if (!student) {
        setLoading(false);
        return;
      }

      setStudentData({
        ...student,
        class_info: student.classes as any
      });

      const { data, error } = await supabase
        .from("student_fees")
        .select(`
          id,
          amount,
          paid_amount,
          discount_amount,
          due_date,
          status,
          paid_at,
          receipt_number,
          payment_mode,
          fee_structures:fee_structure_id (name, frequency)
        `)
        .eq("student_id", student.id)
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

  const handleDownloadReceipt = async (fee: FeeRecord) => {
    if (!fee.receipt_number || fee.status !== "paid" || !studentData) {
      toast.error("Receipt not available for this fee");
      return;
    }

    setDownloadingId(fee.id);
    try {
      // Fetch school and invoice settings
      const [schoolResult, invoiceResult] = await Promise.all([
        supabase
          .from("schools")
          .select("name, address, phone, email, logo_url")
          .eq("id", studentData.school_id)
          .single(),
        supabase
          .from("invoice_settings")
          .select("signature_url, authorized_name, default_template")
          .eq("school_id", studentData.school_id)
          .maybeSingle(),
      ]);

      if (schoolResult.error) throw schoolResult.error;

      const school = schoolResult.data;
      const invoiceSettings = invoiceResult.data;
      const template = (invoiceSettings?.default_template as any) || "A4";

      const className = studentData.class_info 
        ? `${studentData.class_info.name}${studentData.class_info.section ? ` - ${studentData.class_info.section}` : ""}`
        : "N/A";

      const receiptData = {
        receiptNumber: fee.receipt_number,
        date: fee.paid_at ? new Date(fee.paid_at).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"),
        studentName: studentData.full_name,
        studentClass: className,
        rollNumber: studentData.roll_number || undefined,
        parentName: studentData.parent_name || undefined,
        feeType: fee.fee_structure?.name || "Fee",
        amount: Number(fee.amount),
        paidAmount: Number(fee.paid_amount || 0),
        currentPayment: Number(fee.paid_amount || 0),
        discountAmount: Number(fee.discount_amount || 0),
        paymentDate: fee.paid_at ? new Date(fee.paid_at).toLocaleDateString("en-IN") : "-",
        paymentMode: fee.payment_mode || "Cash",
        school: {
          name: school.name,
          address: school.address || undefined,
          phone: school.phone || undefined,
          email: school.email || undefined,
          logo_url: school.logo_url || undefined,
        },
        signatureUrl: invoiceSettings?.signature_url || undefined,
        authorizedName: invoiceSettings?.authorized_name || undefined,
      };

      // Generate and download receipt
      const receiptHtml = generateReceiptHTML(receiptData, template);
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast.success("Receipt opened for download/print");
    } catch (error) {
      console.error("Error generating receipt:", error);
      toast.error("Failed to generate receipt");
    } finally {
      setDownloadingId(null);
    }
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
                              disabled={downloadingId === fee.id}
                            >
                              {downloadingId === fee.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-1" />
                              )}
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
