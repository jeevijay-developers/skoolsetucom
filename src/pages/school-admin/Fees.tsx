import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, DollarSign, CreditCard, Receipt, CheckCircle, Download, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { downloadFeeReceipt } from "@/utils/pdfGenerator";

interface SchoolInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  class_id: string | null;
}

interface StudentFee {
  id: string;
  student_id: string;
  amount: number;
  paid_amount: number | null;
  due_date: string;
  status: string;
  receipt_number: string | null;
  paid_at: string | null;
  students: { full_name: string; roll_number: string | null; classes: { name: string; section: string | null } | null } | null;
}

interface Class {
  id: string;
  name: string;
  section: string | null;
}

const Fees = () => {
  const { schoolId } = useAuth();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  
  // Fee Structure Dialog
  const [isStructureDialogOpen, setIsStructureDialogOpen] = useState(false);
  const [structureForm, setStructureForm] = useState({ name: "", amount: "", frequency: "monthly", class_id: "" });
  
  // Payment Dialog
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    if (schoolId) {
      fetchFeeStructures();
      fetchStudentFees();
      fetchClasses();
      fetchSchoolInfo();
    }
  }, [schoolId]);

  const fetchSchoolInfo = async () => {
    const { data } = await supabase
      .from("schools")
      .select("name, address, phone, email, logo_url")
      .eq("id", schoolId)
      .single();
    if (data) setSchoolInfo(data);
  };


  const fetchFeeStructures = async () => {
    const { data } = await supabase
      .from("fee_structures")
      .select("*")
      .eq("school_id", schoolId)
      .order("name");
    setFeeStructures(data || []);
  };

  const fetchStudentFees = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("student_fees")
      .select(`
        *,
        students (
          full_name,
          roll_number,
          classes:class_id (name, section)
        )
      `)
      .eq("school_id", schoolId)
      .order("due_date", { ascending: false });
    setStudentFees(data || []);
    setLoading(false);
  };

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name, section")
      .eq("school_id", schoolId)
      .order("name");
    setClasses(data || []);
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureForm.name || !structureForm.amount) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const { error } = await supabase.from("fee_structures").insert({
        school_id: schoolId,
        name: structureForm.name,
        amount: parseFloat(structureForm.amount),
        frequency: structureForm.frequency,
        class_id: structureForm.class_id || null,
      });

      if (error) throw error;
      toast.success("Fee structure created");
      setIsStructureDialogOpen(false);
      setStructureForm({ name: "", amount: "", frequency: "monthly", class_id: "" });
      fetchFeeStructures();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedFee || !paymentAmount) {
      toast.error("Please enter payment amount");
      return;
    }

    const amount = parseFloat(paymentAmount);
    const currentPaid = selectedFee.paid_amount || 0;
    const newPaidAmount = currentPaid + amount;
    const newStatus = newPaidAmount >= selectedFee.amount ? "paid" : "partial";

    try {
      const { error } = await supabase
        .from("student_fees")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          paid_at: new Date().toISOString(),
          receipt_number: `RCP-${Date.now().toString(36).toUpperCase()}`,
        })
        .eq("id", selectedFee.id);

      if (error) throw error;
      toast.success(`Payment of ₹${amount.toLocaleString()} recorded`);
      setIsPaymentDialogOpen(false);
      setSelectedFee(null);
      setPaymentAmount("");
      fetchStudentFees();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredFees = studentFees.filter((fee) => {
    const matchesSearch = fee.students?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || fee.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPending = studentFees
    .filter(f => f.status !== "paid")
    .reduce((sum, f) => sum + (f.amount - (f.paid_amount || 0)), 0);

  const totalCollected = studentFees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-secondary text-secondary-foreground">Paid</Badge>;
      case "partial":
        return <Badge variant="secondary">Partial</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const handleDownloadReceipt = (fee: StudentFee) => {
    if (!schoolInfo) {
      toast.error("School information not available");
      return;
    }
    if (!fee.receipt_number || !fee.paid_at) {
      toast.error("No receipt available for this fee");
      return;
    }

    const className = fee.students?.classes 
      ? `${fee.students.classes.name}${fee.students.classes.section ? ` - ${fee.students.classes.section}` : ""}`
      : "N/A";

    downloadFeeReceipt({
      receiptNumber: fee.receipt_number,
      date: format(new Date(), "dd MMM yyyy"),
      studentName: fee.students?.full_name || "Unknown",
      studentClass: className,
      rollNumber: fee.students?.roll_number || undefined,
      feeType: "Fee Payment",
      amount: fee.amount,
      paidAmount: fee.paid_amount || 0,
      paymentDate: format(new Date(fee.paid_at), "dd MMM yyyy"),
      paymentMode: "Cash",
      school: schoolInfo,
    });
  };

  const handleWhatsAppReminder = (fee: StudentFee) => {
    // This would need parent phone from students table
    const pendingAmount = fee.amount - (fee.paid_amount || 0);
    const message = encodeURIComponent(
      `Dear Parent,\n\nThis is a reminder for pending fee payment.\n\nStudent: ${fee.students?.full_name}\nAmount Due: ₹${pendingAmount.toLocaleString()}\nDue Date: ${format(new Date(fee.due_date), "dd MMM yyyy")}\n\nPlease clear the dues at the earliest.\n\nRegards,\n${schoolInfo?.name || "School Administration"}`
    );
    // Open WhatsApp with pre-filled message (phone would need to be fetched)
    toast.info("WhatsApp reminder feature requires parent phone number in student record");
  };

  return (
    <>
      <Helmet><title>Fees Management - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Fees Management</h1>
              <p className="text-muted-foreground">Manage fee structures and collect payments</p>
            </div>
            <Dialog open={isStructureDialogOpen} onOpenChange={setIsStructureDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Fee Structure
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateStructure}>
                  <DialogHeader>
                    <DialogTitle>Create Fee Structure</DialogTitle>
                    <DialogDescription>Define a new fee type for your school</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Fee Name *</Label>
                      <Input
                        value={structureForm.name}
                        onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                        placeholder="e.g., Tuition Fee, Transport Fee"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Amount (₹) *</Label>
                        <Input
                          type="number"
                          value={structureForm.amount}
                          onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                          placeholder="5000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select value={structureForm.frequency} onValueChange={(v) => setStructureForm({ ...structureForm, frequency: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="one-time">One Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Apply to Class (optional)</Label>
                      <Select value={structureForm.class_id || "all"} onValueChange={(v) => setStructureForm({ ...structureForm, class_id: v === "all" ? "" : v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} {cls.section ? `- ${cls.section}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Structure</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <DollarSign className="h-6 w-6 text-primary" />
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
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-warning/10">
                    <CreditCard className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Amount</p>
                    <p className="text-2xl font-bold">₹{totalPending.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <Receipt className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fee Structures</p>
                    <p className="text-2xl font-bold">{feeStructures.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="collection">
            <TabsList>
              <TabsTrigger value="collection">Fee Collection</TabsTrigger>
              <TabsTrigger value="structures">Fee Structures</TabsTrigger>
            </TabsList>

            <TabsContent value="collection" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by student name..."
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Fees Table */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Student Fees ({filteredFees.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredFees.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No fee records found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFees.map((fee) => (
                            <TableRow key={fee.id}>
                              <TableCell className="font-medium">
                                {fee.students?.full_name || "Unknown"}
                              </TableCell>
                              <TableCell>
                                {fee.students?.classes
                                  ? `${fee.students.classes.name}${fee.students.classes.section ? ` - ${fee.students.classes.section}` : ""}`
                                  : "-"}
                              </TableCell>
                              <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                              <TableCell>₹{(fee.paid_amount || 0).toLocaleString()}</TableCell>
                              <TableCell>{format(new Date(fee.due_date), "MMM dd, yyyy")}</TableCell>
                              <TableCell>{getStatusBadge(fee.status || "pending")}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {fee.status !== "paid" ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          setSelectedFee(fee);
                                          setPaymentAmount((fee.amount - (fee.paid_amount || 0)).toString());
                                          setIsPaymentDialogOpen(true);
                                        }}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Collect
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-[#25D366]"
                                        onClick={() => handleWhatsAppReminder(fee)}
                                      >
                                        <MessageCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownloadReceipt(fee)}
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Receipt
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="structures">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Fee Structures</CardTitle>
                  <CardDescription>Defined fee types for your school</CardDescription>
                </CardHeader>
                <CardContent>
                  {feeStructures.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No fee structures created yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fee Name</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead>Applied To</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {feeStructures.map((structure) => (
                            <TableRow key={structure.id}>
                              <TableCell className="font-medium">{structure.name}</TableCell>
                              <TableCell>₹{structure.amount.toLocaleString()}</TableCell>
                              <TableCell className="capitalize">{structure.frequency}</TableCell>
                              <TableCell>
                                {structure.class_id
                                  ? classes.find((c) => c.id === structure.class_id)?.name || "Specific Class"
                                  : "All Classes"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Payment Dialog */}
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>
                  {selectedFee?.students?.full_name} - Due: ₹{((selectedFee?.amount || 0) - (selectedFee?.paid_amount || 0)).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Payment Amount (₹)</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleRecordPayment}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Fees;
