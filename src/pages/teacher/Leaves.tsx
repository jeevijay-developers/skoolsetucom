import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Clock, Calendar } from "lucide-react";

interface LeaveType {
  id: string;
  name: string;
  max_days_per_year: number;
  is_paid: boolean;
}

interface LeaveBalance {
  id: string;
  leave_type_id: string;
  total_allowed: number;
  used_days: number;
  leave_types?: { name: string } | null;
}

interface LeaveApp {
  id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: string;
  review_remarks: string | null;
  created_at: string;
  leave_types?: { name: string } | null;
}

const TeacherLeaves = () => {
  const { user, schoolId } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [applications, setApplications] = useState<LeaveApp[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leave_type_id: "", start_date: "", end_date: "", reason: "",
  });

  useEffect(() => {
    if (user?.id && schoolId) fetchEmployeeAndData();
  }, [user?.id, schoolId]);

  const fetchEmployeeAndData = async () => {
    setLoading(true);
    // Find employee record for this teacher
    const { data: teacher } = await supabase
      .from("teachers")
      .select("employee_id")
      .eq("user_id", user!.id)
      .eq("school_id", schoolId!)
      .single();

    // Also check employees directly if no teacher record
    let empId = teacher?.employee_id;
    if (!empId) {
      // Try to find employee by checking employees table
      // Teachers might have a direct employee record
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("school_id", schoolId!)
        .eq("email", user!.email)
        .single();
      empId = emp?.id || null;
    }

    if (!empId) {
      setLoading(false);
      return;
    }

    setEmployeeId(empId);

    const [typesRes, balancesRes, appsRes] = await Promise.all([
      supabase.from("leave_types").select("id, name, max_days_per_year, is_paid").eq("school_id", schoolId!).eq("is_active", true),
      supabase.from("leave_balances").select("*, leave_types:leave_type_id (name)").eq("employee_id", empId),
      supabase.from("leave_applications")
        .select("*, leave_types:leave_type_id (name)")
        .eq("employee_id", empId)
        .order("created_at", { ascending: false }),
    ]);

    setLeaveTypes((typesRes.data || []) as unknown as LeaveType[]);
    setBalances((balancesRes.data || []) as unknown as LeaveBalance[]);
    setApplications((appsRes.data || []) as unknown as LeaveApp[]);
    setLoading(false);
  };

  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leave_type_id || !form.start_date || !form.end_date) {
      toast.error("Please fill all required fields");
      return;
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast.error("End date must be after start date");
      return;
    }

    setSubmitting(true);
    const totalDays = calcDays(form.start_date, form.end_date);

    const { error } = await supabase.from("leave_applications").insert({
      school_id: schoolId!,
      employee_id: employeeId!,
      leave_type_id: form.leave_type_id,
      user_id: user!.id,
      start_date: form.start_date,
      end_date: form.end_date,
      total_days: totalDays,
      reason: form.reason || null,
    } as any);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Leave application submitted");
      setApplyOpen(false);
      setForm({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
      fetchEmployeeAndData();
    }
    setSubmitting(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-600">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getBalance = (leaveTypeId: string) => {
    return balances.find(b => b.leave_type_id === leaveTypeId);
  };

  if (loading) {
    return (
      <DashboardLayout role="teacher">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!employeeId) {
    return (
      <DashboardLayout role="teacher">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Your employee profile was not found. Please contact your school admin.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Helmet><title>My Leaves - SkoolSetu</title></Helmet>
      <DashboardLayout role="teacher">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">My Leaves</h1>
              <p className="text-muted-foreground">Apply for leave and track your balance</p>
            </div>
            <Button onClick={() => setApplyOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Apply Leave
            </Button>
          </div>

          {/* Leave Balances */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {leaveTypes.map(lt => {
              const bal = getBalance(lt.id);
              const used = bal?.used_days || 0;
              const total = bal?.total_allowed || lt.max_days_per_year;
              const remaining = total - used;
              return (
                <Card key={lt.id}>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">{lt.name}</p>
                    <p className="text-3xl font-bold text-primary mt-1">{remaining}</p>
                    <p className="text-xs text-muted-foreground">of {total} remaining</p>
                    <p className="text-xs mt-1">{used} used</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Leave History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leave History</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No leave applications yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map(app => (
                        <TableRow key={app.id}>
                          <TableCell>{app.leave_types?.name || "—"}</TableCell>
                          <TableCell>{new Date(app.start_date).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(app.end_date).toLocaleDateString()}</TableCell>
                          <TableCell>{app.total_days}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{app.reason || "—"}</TableCell>
                          <TableCell>{statusBadge(app.status)}</TableCell>
                          <TableCell className="text-xs">{app.review_remarks || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Apply Leave Dialog */}
        <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
          <DialogContent>
            <form onSubmit={handleApply}>
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
                <DialogDescription>Submit a leave application for approval</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Leave Type *</Label>
                  <Select value={form.leave_type_id} onValueChange={v => setForm({ ...form, leave_type_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select leave type" /></SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map(lt => (
                        <SelectItem key={lt.id} value={lt.id}>
                          {lt.name} ({lt.is_paid ? "Paid" : "Unpaid"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                </div>
                {form.start_date && form.end_date && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Total: {calcDays(form.start_date, form.end_date)} day(s)
                  </p>
                )}
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for leave..." rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
};

export default TeacherLeaves;
