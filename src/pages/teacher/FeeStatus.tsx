import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface StudentFee {
  id: string;
  student_id: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  student: {
    full_name: string;
    roll_number: string | null;
    class: { name: string; section: string | null } | null;
  };
}

const TeacherFeeStatus = () => {
  const { schoolId } = useAuth();
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchFees();
    }
  }, [schoolId]);

  useEffect(() => {
    fetchFees();
  }, [selectedClass]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name, section")
      .eq("school_id", schoolId)
      .order("name");
    setClasses(data || []);
  };

  const fetchFees = async () => {
    setLoading(true);
    let query = supabase
      .from("student_fees")
      .select(`
        id, student_id, amount, paid_amount, due_date, status,
        student:student_id (
          full_name, roll_number,
          class:class_id (name, section)
        )
      `)
      .eq("school_id", schoolId)
      .order("due_date", { ascending: false });

    const { data } = await query;
    
    let filteredData = data || [];
    if (selectedClass && selectedClass !== "all") {
      filteredData = filteredData.filter((f: any) => {
        // Need to get class_id from student
        return true; // For now show all, can be enhanced
      });
    }

    setFees(filteredData as any);
    setLoading(false);
  };

  const filteredFees = fees.filter((fee) => {
    const student = fee.student as any;
    return student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student?.roll_number?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const paidCount = filteredFees.filter(f => f.status === 'paid').length;
  const pendingCount = filteredFees.filter(f => f.status !== 'paid').length;
  const totalPending = filteredFees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + (f.amount - (f.paid_amount || 0)), 0);

  return (
    <>
      <Helmet><title>Student Fee Status - SkoolSetu</title></Helmet>
      <DashboardLayout role="teacher">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Student Fee Status</h1>
            <p className="text-muted-foreground">Check fee payment status of students</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fees Paid</p>
                    <p className="text-2xl font-bold text-green-600">{paidCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-orange-100">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fees Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-red-100">
                    <DollarSign className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pending Amount</p>
                    <p className="text-2xl font-bold text-red-600">₹{totalPending.toLocaleString()}</p>
                  </div>
                </div>
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
                    placeholder="Search by student name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full sm:w-48">
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
            </CardContent>
          </Card>

          {/* Fee Status Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Records ({filteredFees.length})
              </CardTitle>
              <CardDescription>Student fee payment status</CardDescription>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFees.map((fee) => {
                      const student = fee.student as any;
                      const pending = fee.amount - (fee.paid_amount || 0);
                      return (
                        <TableRow key={fee.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{student?.full_name}</p>
                              <p className="text-sm text-muted-foreground">{student?.roll_number || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student?.class 
                              ? `${student.class.name}${student.class.section ? ` - ${student.class.section}` : ""}`
                              : "-"}
                          </TableCell>
                          <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">₹{(fee.paid_amount || 0).toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(fee.due_date), "dd MMM yyyy")}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={fee.status === "paid" ? "default" : pending > 0 ? "destructive" : "secondary"}
                            >
                              {fee.status === "paid" ? "Paid" : pending > 0 ? `₹${pending.toLocaleString()} Due` : "Partial"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

export default TeacherFeeStatus;