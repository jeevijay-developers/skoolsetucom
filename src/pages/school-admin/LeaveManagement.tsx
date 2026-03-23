import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Check, X, Clock } from "lucide-react";

interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  max_days_per_year: number;
  is_paid: boolean;
  is_active: boolean;
}

interface LeaveApplication {
  id: string;
  employee_id: string;
  leave_type_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: string;
  review_remarks: string | null;
  created_at: string;
  employees?: { full_name: string; category: string } | null;
  leave_types?: { name: string } | null;
}

const LeaveManagement = () => {
  const { schoolId, user } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<LeaveApplication | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [typeForm, setTypeForm] = useState({
    name: "", description: "", max_days_per_year: 12, is_paid: true,
  });

  useEffect(() => {
    if (schoolId) fetchAll();
  }, [schoolId]);

  const fetchAll = async () => {
    setLoading(true);
    const [typesRes, appsRes] = await Promise.all([
      supabase.from("leave_types").select("*").eq("school_id", schoolId!).order("name"),
      supabase.from("leave_applications")
        .select("*, employees:employee_id (full_name, category), leave_types:leave_type_id (name)")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false }),
    ]);
    setLeaveTypes((typesRes.data || []) as unknown as LeaveType[]);
    setApplications((appsRes.data || []) as unknown as LeaveApplication[]);
    setLoading(false);
  };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim()) { toast.error("Name is required"); return; }
    const { error } = await supabase.from("leave_types").insert({
      school_id: schoolId!,
      name: typeForm.name,
      description: typeForm.description || null,
      max_days_per_year: typeForm.max_days_per_year,
      is_paid: typeForm.is_paid,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Leave type added");
    setTypeDialogOpen(false);
    setTypeForm({ name: "", description: "", max_days_per_year: 12, is_paid: true });
    fetchAll();
  };

  const handleToggleType = async (lt: LeaveType) => {
    await supabase.from("leave_types").update({ is_active: !lt.is_active } as any).eq("id", lt.id);
    fetchAll();
  };

  const handleReview = async (action: "approved" | "rejected") => {
    if (!selectedApp) return;
    const { error } = await supabase.from("leave_applications")
      .update({
        status: action,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_remarks: reviewRemarks || null,
      } as any)
      .eq("id", selectedApp.id);
    if (error) { toast.error(error.message); return; }

    // If approved, update leave balance
    if (action === "approved") {
      const { data: balance } = await supabase.from("leave_balances")
        .select("id, used_days")
        .eq("employee_id", selectedApp.employee_id)
        .eq("leave_type_id", selectedApp.leave_type_id)
        .single();

      if (balance) {
        await supabase.from("leave_balances")
          .update({ used_days: (balance.used_days || 0) + selectedApp.total_days } as any)
          .eq("id", balance.id);
      }
    }

    toast.success(`Leave ${action}`);
    setReviewDialogOpen(false);
    setSelectedApp(null);
    setReviewRemarks("");
    fetchAll();
  };

  const filteredApps = applications.filter(a =>
    filterStatus === "all" ? true : a.status === filterStatus
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-600">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <>
      <Helmet><title>Leave Management - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Leave Management</h1>
            <p className="text-muted-foreground">Configure leave types and manage leave applications</p>
          </div>

          <Tabs defaultValue="applications">
            <TabsList>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="types">Leave Types</TabsTrigger>
            </TabsList>

            {/* Applications Tab */}
            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <CardTitle className="text-base">Leave Applications</CardTitle>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center py-8 text-muted-foreground">Loading...</p>
                  ) : filteredApps.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No applications found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Leave Type</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Days</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredApps.map(app => (
                            <TableRow key={app.id}>
                              <TableCell className="font-medium">
                                {app.employees?.full_name || "—"}
                                <span className="text-xs text-muted-foreground block">{app.employees?.category}</span>
                              </TableCell>
                              <TableCell>{app.leave_types?.name || "—"}</TableCell>
                              <TableCell>{new Date(app.start_date).toLocaleDateString()}</TableCell>
                              <TableCell>{new Date(app.end_date).toLocaleDateString()}</TableCell>
                              <TableCell>{app.total_days}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{app.reason || "—"}</TableCell>
                              <TableCell>{statusBadge(app.status)}</TableCell>
                              <TableCell>
                                {app.status === "pending" ? (
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setSelectedApp(app);
                                    setReviewRemarks("");
                                    setReviewDialogOpen(true);
                                  }}>
                                    Review
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">{app.review_remarks || "—"}</span>
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
            </TabsContent>

            {/* Leave Types Tab */}
            <TabsContent value="types">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Leave Types</CardTitle>
                    <Button size="sm" onClick={() => setTypeDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Add Type
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {leaveTypes.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No leave types configured. Add your first leave type.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Max Days/Year</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaveTypes.map(lt => (
                          <TableRow key={lt.id}>
                            <TableCell className="font-medium">{lt.name}</TableCell>
                            <TableCell>{lt.description || "—"}</TableCell>
                            <TableCell>{lt.max_days_per_year}</TableCell>
                            <TableCell>{lt.is_paid ? "Yes" : "No"}</TableCell>
                            <TableCell>
                              <Badge variant={lt.is_active ? "default" : "secondary"}>
                                {lt.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => handleToggleType(lt)}>
                                {lt.is_active ? "Disable" : "Enable"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Add Leave Type Dialog */}
        <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
          <DialogContent>
            <form onSubmit={handleAddType}>
              <DialogHeader>
                <DialogTitle>Add Leave Type</DialogTitle>
                <DialogDescription>Configure a new leave type for your school</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={typeForm.name} onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} placeholder="e.g., Casual Leave" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={typeForm.description} onChange={e => setTypeForm({ ...typeForm, description: e.target.value })} placeholder="Optional description" />
                </div>
                <div className="space-y-2">
                  <Label>Max Days Per Year</Label>
                  <Input type="number" value={typeForm.max_days_per_year} onChange={e => setTypeForm({ ...typeForm, max_days_per_year: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={typeForm.is_paid} onCheckedChange={v => setTypeForm({ ...typeForm, is_paid: v })} />
                  <Label>Paid Leave</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTypeDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add Leave Type</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Leave Application</DialogTitle>
              <DialogDescription>
                {selectedApp?.employees?.full_name} — {selectedApp?.leave_types?.name} ({selectedApp?.total_days} days)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-sm space-y-1">
                <p><strong>From:</strong> {selectedApp && new Date(selectedApp.start_date).toLocaleDateString()}</p>
                <p><strong>To:</strong> {selectedApp && new Date(selectedApp.end_date).toLocaleDateString()}</p>
                <p><strong>Reason:</strong> {selectedApp?.reason || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <Label>Remarks (optional)</Label>
                <Textarea value={reviewRemarks} onChange={e => setReviewRemarks(e.target.value)} placeholder="Any comments..." rows={2} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="destructive" onClick={() => handleReview("rejected")}>
                <X className="h-4 w-4 mr-1" /> Reject
              </Button>
              <Button onClick={() => handleReview("approved")}>
                <Check className="h-4 w-4 mr-1" /> Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
};

export default LeaveManagement;
