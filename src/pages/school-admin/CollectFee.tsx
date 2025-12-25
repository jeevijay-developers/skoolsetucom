import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Receipt, Upload, IndianRupee, CreditCard, Wallet, FileImage, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { generateReceiptHTML, ReceiptTemplate } from "@/utils/receiptTemplates";

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
  class_id: string | null;
  parent_name: string | null;
}

interface StudentFee {
  id: string;
  amount: number;
  paid_amount: number | null;
  due_date: string;
  status: string;
  fee_structure_id: string | null;
  fee_structures?: { name: string } | null;
}

interface SchoolInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

interface InvoiceSettings {
  signature_url: string | null;
  authorized_name: string | null;
  default_template: string;
}

const CollectFee = () => {
  const { schoolId, user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedFeeId, setSelectedFeeId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate>("A4");
  
  const [openStudentCombobox, setOpenStudentCombobox] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchSchoolInfo();
      fetchInvoiceSettings();
    }
  }, [schoolId]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name, section")
      .eq("school_id", schoolId)
      .order("name");
    setClasses(data || []);
  };

  const fetchSchoolInfo = async () => {
    const { data } = await supabase
      .from("schools")
      .select("name, address, phone, email, logo_url")
      .eq("id", schoolId)
      .single();
    if (data) setSchoolInfo(data);
  };

  const fetchInvoiceSettings = async () => {
    const { data } = await supabase
      .from("invoice_settings")
      .select("signature_url, authorized_name, default_template")
      .eq("school_id", schoolId)
      .single();
    if (data) {
      setInvoiceSettings(data);
      setSelectedTemplate(data.default_template as ReceiptTemplate || "A4");
    }
  };

  const fetchStudents = async (classId: string) => {
    const { data } = await supabase
      .from("students")
      .select("id, full_name, roll_number, class_id, parent_name")
      .eq("school_id", schoolId)
      .eq("class_id", classId)
      .eq("is_active", true)
      .order("full_name");
    setStudents(data || []);
  };

  const fetchStudentFees = async (studentId: string) => {
    const { data, error } = await supabase
      .from("student_fees")
      .select(`
        id, amount, paid_amount, due_date, status, fee_structure_id,
        fee_structures (name)
      `)
      .eq("school_id", schoolId)
      .eq("student_id", studentId)
      .or("status.eq.pending,status.eq.partial,status.is.null")
      .order("due_date");
    
    if (error) {
      console.error("Error fetching student fees:", error);
    }
    setStudentFees(data || []);
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedStudentId("");
    setSelectedFeeId("");
    setStudentFees([]);
    if (classId) {
      fetchStudents(classId);
    } else {
      setStudents([]);
    }
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSelectedFeeId("");
    if (studentId) {
      fetchStudentFees(studentId);
    } else {
      setStudentFees([]);
    }
    setOpenStudentCombobox(false);
  };

  // Get unique sections for selected class
  const sections = useMemo(() => {
    const classData = classes.filter(c => c.name === classes.find(cl => cl.id === selectedClassId)?.name);
    return [...new Set(classData.map(c => c.section).filter(Boolean))];
  }, [classes, selectedClassId]);

  // Filter students by search
  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.full_name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(studentSearchQuery.toLowerCase()))
    );
  }, [students, studentSearchQuery]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedFee = studentFees.find(f => f.id === selectedFeeId);
  const selectedClass = classes.find(c => c.id === selectedClassId);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setScreenshotFile(file);
    }
  };

  const uploadScreenshot = async (): Promise<string | null> => {
    if (!screenshotFile) return null;
    
    const fileExt = screenshotFile.name.split('.').pop();
    const fileName = `${schoolId}/${selectedStudentId}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('payment-screenshots')
      .upload(fileName, screenshotFile);
    
    if (error) {
      console.error("Screenshot upload error:", error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('payment-screenshots')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleRecordPayment = async () => {
    if (!selectedFee || !paymentAmount) {
      toast.error("Please select a fee and enter payment amount");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    // Validate screenshot for online/cheque payments
    if ((paymentMode === "online" || paymentMode === "cheque") && !screenshotFile) {
      toast.error(`Please upload payment screenshot for ${paymentMode} payment`);
      return;
    }

    setLoading(true);
    try {
      // Upload screenshot if exists
      let screenshotUrl = null;
      if (screenshotFile) {
        screenshotUrl = await uploadScreenshot();
      }

      const currentPaid = selectedFee.paid_amount || 0;
      const newPaidAmount = currentPaid + amount;
      const newStatus = newPaidAmount >= selectedFee.amount ? "paid" : "partial";
      const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;

      const { error } = await supabase
        .from("student_fees")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          paid_at: new Date().toISOString(),
          receipt_number: receiptNumber,
          payment_mode: paymentMode,
          payment_screenshot_url: screenshotUrl,
          collected_by: user?.id,
        })
        .eq("id", selectedFee.id);

      if (error) throw error;

      toast.success(`Payment of ₹${amount.toLocaleString()} recorded successfully!`);
      
      // Generate and show receipt
      printReceipt(receiptNumber, amount, newPaidAmount);
      
      // Reset form
      setPaymentAmount("");
      setPaymentMode("cash");
      setTransactionRef("");
      setScreenshotFile(null);
      setSelectedFeeId("");
      fetchStudentFees(selectedStudentId);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = (receiptNumber: string, paidAmount: number, totalPaid: number) => {
    if (!schoolInfo || !selectedStudent || !selectedFee || !selectedClass) return;

    const receiptData = {
      receiptNumber,
      date: format(new Date(), "dd MMM yyyy"),
      studentName: selectedStudent.full_name,
      studentClass: `${selectedClass.name}${selectedClass.section ? ` - ${selectedClass.section}` : ""}`,
      rollNumber: selectedStudent.roll_number || undefined,
      parentName: selectedStudent.parent_name || undefined,
      feeType: selectedFee.fee_structures?.name || "Fee Payment",
      amount: selectedFee.amount,
      paidAmount: totalPaid,
      currentPayment: paidAmount,
      paymentDate: format(new Date(), "dd MMM yyyy"),
      paymentMode: paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1),
      transactionRef: transactionRef || undefined,
      school: schoolInfo,
      signatureUrl: invoiceSettings?.signature_url || undefined,
      authorizedName: invoiceSettings?.authorized_name || undefined,
    };

    const html = generateReceiptHTML(receiptData, selectedTemplate);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  return (
    <>
      <Helmet><title>Collect Fee - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Collect Fee</h1>
            <p className="text-muted-foreground">Record student fee payments and generate receipts</p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Payment Details
              </CardTitle>
              <CardDescription>Select student and record payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Class & Section Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={selectedClassId} onValueChange={handleClassChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...new Set(classes.map(c => c.name))].map(className => {
                        const classItem = classes.find(c => c.name === className);
                        return (
                          <SelectItem key={classItem?.id} value={classItem?.id || ""}>
                            {className}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map(section => (
                        <SelectItem key={section} value={section || ""}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Student Selection with Search */}
              <div className="space-y-2">
                <Label>Student *</Label>
                <Popover open={openStudentCombobox} onOpenChange={setOpenStudentCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openStudentCombobox}
                      className="w-full justify-between"
                      disabled={!selectedClassId}
                    >
                      {selectedStudent 
                        ? `${selectedStudent.full_name}${selectedStudent.roll_number ? ` (${selectedStudent.roll_number})` : ""}`
                        : "Search and select student..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search by name or roll number..." 
                        value={studentSearchQuery}
                        onValueChange={setStudentSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No student found.</CommandEmpty>
                        <CommandGroup>
                          {filteredStudents.map((student) => (
                            <CommandItem
                              key={student.id}
                              value={student.full_name}
                              onSelect={() => handleStudentChange(student.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedStudentId === student.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{student.full_name}</span>
                                {student.roll_number && (
                                  <span className="text-xs text-muted-foreground">Roll: {student.roll_number}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Pending Fees Selection */}
              {studentFees.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Fee *</Label>
                  <Select value={selectedFeeId} onValueChange={setSelectedFeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pending fee" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentFees.map((fee) => (
                        <SelectItem key={fee.id} value={fee.id}>
                          <div className="flex items-center justify-between gap-4">
                            <span>{fee.fee_structures?.name || "Fee"}</span>
                            <span className="text-muted-foreground">
                              Due: ₹{(fee.amount - (fee.paid_amount || 0)).toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {studentFees.length === 0 && selectedStudentId && (
                <div className="text-center py-4 text-muted-foreground border rounded-lg bg-muted/30">
                  No pending fees for this student
                </div>
              )}

              {/* Fee Details */}
              {selectedFee && (
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="font-semibold text-lg">₹{selectedFee.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Already Paid</p>
                        <p className="font-semibold text-lg text-secondary">₹{(selectedFee.paid_amount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Balance Due</p>
                        <p className="font-semibold text-lg text-destructive">
                          ₹{(selectedFee.amount - (selectedFee.paid_amount || 0)).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-semibold">{format(new Date(selectedFee.due_date), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Form */}
              {selectedFee && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Amount (₹) *</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="pl-10"
                          max={selectedFee.amount - (selectedFee.paid_amount || 0)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Mode *</Label>
                      <Select value={paymentMode} onValueChange={setPaymentMode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4" />
                              Cash
                            </div>
                          </SelectItem>
                          <SelectItem value="online">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Online / UPI
                            </div>
                          </SelectItem>
                          <SelectItem value="cheque">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4" />
                              Cheque
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Transaction Reference for Online/Cheque */}
                  {(paymentMode === "online" || paymentMode === "cheque") && (
                    <div className="space-y-2">
                      <Label>{paymentMode === "cheque" ? "Cheque Number" : "Transaction ID"}</Label>
                      <Input
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder={paymentMode === "cheque" ? "Enter cheque number" : "Enter transaction ID"}
                      />
                    </div>
                  )}

                  {/* Screenshot Upload for Online/Cheque */}
                  {(paymentMode === "online" || paymentMode === "cheque") && (
                    <div className="space-y-2">
                      <Label>Payment Screenshot *</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          className="hidden"
                          id="screenshot-upload"
                        />
                        <label htmlFor="screenshot-upload" className="cursor-pointer">
                          {screenshotFile ? (
                            <div className="flex items-center justify-center gap-2 text-secondary">
                              <FileImage className="h-5 w-5" />
                              <span>{screenshotFile.name}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Upload className="h-8 w-8" />
                              <span>Click to upload payment screenshot</span>
                              <span className="text-xs">PNG, JPG up to 5MB</span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Receipt Template Selection */}
                  <div className="space-y-2">
                    <Label>Receipt Template</Label>
                    <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as ReceiptTemplate)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 - Full Page</SelectItem>
                        <SelectItem value="Letter">Letter - Standard</SelectItem>
                        <SelectItem value="Receipt">Receipt - Compact</SelectItem>
                        <SelectItem value="Thermal">Thermal - POS Printer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleRecordPayment} 
                      disabled={loading || !paymentAmount}
                      className="flex-1"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      {loading ? "Recording..." : "Record Payment & Print Receipt"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default CollectFee;