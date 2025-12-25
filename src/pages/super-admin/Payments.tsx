import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, DollarSign, Plus, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  school_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  notes: string | null;
  schools: { name: string; email: string | null } | null;
}

interface School {
  id: string;
  name: string;
}

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    school_id: "",
    amount: "",
    payment_method: "bank_transfer",
    transaction_id: "",
    notes: "",
  });

  useEffect(() => {
    fetchPayments();
    fetchSchools();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        schools (name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch payments");
    } else {
      setPayments(data || []);
    }
    setLoading(false);
  };

  const fetchSchools = async () => {
    const { data } = await supabase
      .from("schools")
      .select("id, name")
      .order("name");
    setSchools(data || []);
  };

  const handleAddPayment = async () => {
    if (!form.school_id || !form.amount) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const { error } = await supabase.from("payments").insert({
        school_id: form.school_id,
        amount: parseFloat(form.amount),
        status: "completed",
        payment_method: form.payment_method,
        transaction_id: form.transaction_id || null,
        notes: form.notes || null,
        paid_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("Payment recorded successfully");
      setIsAddOpen(false);
      setForm({ school_id: "", amount: "", payment_method: "bank_transfer", transaction_id: "", notes: "" });
      fetchPayments();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleMarkPaid = async (payment: Payment) => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({ 
          status: "completed",
          paid_at: new Date().toISOString()
        })
        .eq("id", payment.id);

      if (error) throw error;
      toast.success("Payment marked as completed");
      fetchPayments();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.schools?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalCollected = payments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-secondary text-secondary-foreground">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Helmet><title>Payments - SkoolSetu</title></Helmet>
      <DashboardLayout role="super_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Payments</h1>
              <p className="text-muted-foreground">Track and record school payments</p>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>Add a new payment from a school</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>School *</Label>
                    <Select value={form.school_id} onValueChange={(v) => setForm({ ...form, school_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹) *</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="25000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Transaction ID</Label>
                    <Input
                      value={form.transaction_id}
                      onChange={(e) => setForm({ ...form, transaction_id: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddPayment}>Record Payment</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <DollarSign className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Collected</p>
                    <p className="text-2xl font-bold">₹{totalCollected.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">
                  {payments.filter(p => p.status === "pending").length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by school name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Payment History ({filteredPayments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payments found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>School</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.schools?.name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{payment.transaction_id || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹{payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="capitalize">
                            {payment.payment_method?.replace("_", " ") || "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            {payment.paid_at 
                              ? format(new Date(payment.paid_at), "MMM dd, yyyy")
                              : format(new Date(payment.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkPaid(payment)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Paid
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Payments;
