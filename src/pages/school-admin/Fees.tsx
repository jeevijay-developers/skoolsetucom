import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, CreditCard, Receipt, CheckCircle, Download, MessageCircle, IndianRupee, Clock, Users, Eye, Calendar, Filter } from "lucide-react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { downloadFeeReceipt } from "@/utils/pdfGenerator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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
  students: { full_name: string; roll_number: string | null; parent_phone: string | null; classes: { name: string; section: string | null } | null } | null;
}

interface Class {
  id: string;
  name: string;
  section: string | null;
}

const Fees = () => {
  const navigate = useNavigate();
  const { schoolId } = useAuth();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  
  // Filters
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fee Structure Dialog
  const [isStructureDialogOpen, setIsStructureDialogOpen] = useState(false);
  const [structureForm, setStructureForm] = useState({ name: "", amount: "", frequency: "monthly", class_id: "" });
  
  // View All Dialogs
  const [recentCollectedDialogOpen, setRecentCollectedDialogOpen] = useState(false);
  const [pendingFeesDialogOpen, setPendingFeesDialogOpen] = useState(false);
  const [paidFeesDialogOpen, setPaidFeesDialogOpen] = useState(false);
  const [feeStructuresDialogOpen, setFeeStructuresDialogOpen] = useState(false);
  
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
      .maybeSingle();
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
          parent_phone,
          classes:class_id (name, section)
        )
      `)
      .eq("school_id", schoolId)
      .order("paid_at", { ascending: false, nullsFirst: false });
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

  // Filtered data based on class and date
  const filteredFees = useMemo(() => {
    return studentFees.filter((fee) => {
      const matchesSearch = !searchQuery || fee.students?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = filterClass === "all" || fee.students?.classes?.name === classes.find(c => c.id === filterClass)?.name;
      const matchesDate = !filterDate || (fee.paid_at && format(new Date(fee.paid_at), "yyyy-MM-dd") === format(filterDate, "yyyy-MM-dd"));
      return matchesSearch && matchesClass && matchesDate;
    });
  }, [studentFees, searchQuery, filterClass, filterDate, classes]);

  // Recent collected fees (last 7 days, paid)
  const recentCollectedFees = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return filteredFees.filter(fee => 
      fee.status === "paid" && 
      fee.paid_at && 
      new Date(fee.paid_at) >= sevenDaysAgo
    ).slice(0, 5);
  }, [filteredFees]);

  const allRecentCollectedFees = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return filteredFees.filter(fee => 
      fee.status === "paid" && 
      fee.paid_at && 
      new Date(fee.paid_at) >= sevenDaysAgo
    );
  }, [filteredFees]);

  // Pending fees
  const pendingFees = useMemo(() => {
    return filteredFees.filter(fee => fee.status === "pending" || fee.status === "overdue").slice(0, 5);
  }, [filteredFees]);

  const allPendingFees = useMemo(() => {
    return filteredFees.filter(fee => fee.status === "pending" || fee.status === "overdue");
  }, [filteredFees]);

  // Paid fees (all time)
  const paidFees = useMemo(() => {
    return filteredFees.filter(fee => fee.status === "paid").slice(0, 5);
  }, [filteredFees]);

  const allPaidFees = useMemo(() => {
    return filteredFees.filter(fee => fee.status === "paid");
  }, [filteredFees]);

  // Stats
  const totalCollected = filteredFees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);
  const totalPending = filteredFees
    .filter(f => f.status !== "paid")
    .reduce((sum, f) => sum + (f.amount - (f.paid_amount || 0)), 0);
  const paidStudentsCount = allPaidFees.length;
  const pendingStudentsCount = allPendingFees.length;

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
    const pendingAmount = fee.amount - (fee.paid_amount || 0);
    const phone = fee.students?.parent_phone;
    
    if (!phone) {
      toast.error("Parent phone number not available");
      return;
    }

    const message = encodeURIComponent(
      `Dear Parent,\n\nThis is a reminder for pending fee payment.\n\nStudent: ${fee.students?.full_name}\nAmount Due: ₹${pendingAmount.toLocaleString()}\nDue Date: ${format(new Date(fee.due_date), "dd MMM yyyy")}\n\nPlease clear the dues at the earliest.\n\nRegards,\n${schoolInfo?.name || "School Administration"}`
    );
    
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const clearFilters = () => {
    setFilterClass("all");
    setFilterDate(undefined);
    setSearchQuery("");
  };

  const FeeTableRow = ({ fee, showCollectButton = false }: { fee: StudentFee; showCollectButton?: boolean }) => (
    <TableRow>
      <TableCell className="font-medium">{fee.students?.full_name || "Unknown"}</TableCell>
      <TableCell>
        {fee.students?.classes
          ? `${fee.students.classes.name}${fee.students.classes.section ? ` - ${fee.students.classes.section}` : ""}`
          : "-"}
      </TableCell>
      <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
      <TableCell>₹{(fee.paid_amount || 0).toLocaleString()}</TableCell>
      <TableCell>{fee.paid_at ? format(new Date(fee.paid_at), "dd MMM yyyy") : "-"}</TableCell>
      <TableCell>{getStatusBadge(fee.status || "pending")}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {showCollectButton && fee.status !== "paid" ? (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedFee(fee);
                  setPaymentAmount((fee.amount - (fee.paid_amount || 0)).toString());
                  setIsPaymentDialogOpen(true);
                }}
              >
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
          ) : fee.status === "paid" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadReceipt(fee)}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <Helmet><title>Fees Management - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Fees Management</h1>
              <p className="text-muted-foreground">Overview of fee collection and pending payments</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => navigate("/school-admin/collect-fee")}>
                <IndianRupee className="h-4 w-4 mr-2" />
                Collect Fee
              </Button>
              <Button variant="outline" onClick={() => setFeeStructuresDialogOpen(true)}>
                <Receipt className="h-4 w-4 mr-2" />
                Fee Structures
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Student</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class Filter</label>
                  <Select value={filterClass} onValueChange={setFilterClass}>
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Filter</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filterDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {filterDate ? format(filterDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filterDate}
                        onSelect={setFilterDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 flex items-end">
                  <Button variant="ghost" onClick={clearFilters} className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <IndianRupee className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Collected</p>
                    <p className="text-lg font-bold">₹{totalCollected.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending Amount</p>
                    <p className="text-lg font-bold">₹{totalPending.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid Students</p>
                    <p className="text-lg font-bold">{paidStudentsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Users className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending Students</p>
                    <p className="text-lg font-bold">{pendingStudentsCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Module Boxes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Collected Fees */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Collected</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setRecentCollectedDialogOpen(true)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                </div>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : recentCollectedFees.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent collections</p>
                ) : (
                  <div className="space-y-3">
                    {recentCollectedFees.map((fee) => (
                      <div key={fee.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{fee.students?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {fee.students?.classes?.name} • {fee.paid_at && format(new Date(fee.paid_at), "dd MMM")}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-secondary">₹{(fee.paid_amount || 0).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Fees */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Pending Fees</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setPendingFeesDialogOpen(true)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                </div>
                <CardDescription>{allPendingFees.length} students pending</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : pendingFees.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No pending fees</p>
                ) : (
                  <div className="space-y-3">
                    {pendingFees.map((fee) => (
                      <div key={fee.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{fee.students?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {fee.students?.classes?.name} • Due: {format(new Date(fee.due_date), "dd MMM")}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-destructive">₹{(fee.amount - (fee.paid_amount || 0)).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paid Fees Students */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Paid Fees</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setPaidFeesDialogOpen(true)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                </div>
                <CardDescription>{allPaidFees.length} students paid</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : paidFees.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No paid fees</p>
                ) : (
                  <div className="space-y-3">
                    {paidFees.map((fee) => (
                      <div key={fee.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{fee.students?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {fee.students?.classes?.name} • {fee.paid_at && format(new Date(fee.paid_at), "dd MMM")}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleDownloadReceipt(fee)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Collected Dialog */}
        <Dialog open={recentCollectedDialogOpen} onOpenChange={setRecentCollectedDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Recent Collected Fees (Last 7 Days)</DialogTitle>
              <DialogDescription>{allRecentCollectedFees.length} payments collected</DialogDescription>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRecentCollectedFees.map((fee) => (
                  <FeeTableRow key={fee.id} fee={fee} />
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>

        {/* Pending Fees Dialog */}
        <Dialog open={pendingFeesDialogOpen} onOpenChange={setPendingFeesDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pending Fees</DialogTitle>
              <DialogDescription>{allPendingFees.length} students with pending fees</DialogDescription>
            </DialogHeader>
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
                {allPendingFees.map((fee) => (
                  <FeeTableRow key={fee.id} fee={fee} showCollectButton />
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>

        {/* Paid Fees Dialog */}
        <Dialog open={paidFeesDialogOpen} onOpenChange={setPaidFeesDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Paid Fees</DialogTitle>
              <DialogDescription>{allPaidFees.length} students with paid fees</DialogDescription>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPaidFees.map((fee) => (
                  <FeeTableRow key={fee.id} fee={fee} />
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>

        {/* Fee Structures Dialog */}
        <Dialog open={feeStructuresDialogOpen} onOpenChange={setFeeStructuresDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Fee Structures</DialogTitle>
                <Button size="sm" onClick={() => { setFeeStructuresDialogOpen(false); setIsStructureDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add New
                </Button>
              </div>
              <DialogDescription>Defined fee types for your school</DialogDescription>
            </DialogHeader>
            {feeStructures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No fee structures created yet
              </div>
            ) : (
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
            )}
          </DialogContent>
        </Dialog>

        {/* Create Fee Structure Dialog */}
        <Dialog open={isStructureDialogOpen} onOpenChange={setIsStructureDialogOpen}>
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
      </DashboardLayout>
    </>
  );
};

export default Fees;
