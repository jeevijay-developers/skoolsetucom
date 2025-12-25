import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, CreditCard, Edit } from "lucide-react";
import { format } from "date-fns";

interface Subscription {
  id: string;
  school_id: string;
  plan: string;
  status: string;
  amount: number | null;
  trial_start_date: string;
  trial_end_date: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  coupon_code: string | null;
  discount_amount: number | null;
  schools: { name: string; email: string | null } | null;
}

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ plan: "", status: "", endDate: "" });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        schools (name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch subscriptions");
    } else {
      setSubscriptions(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (sub: Subscription) => {
    setSelectedSub(sub);
    setEditForm({
      plan: sub.plan,
      status: sub.status,
      endDate: sub.subscription_end_date?.split("T")[0] || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSub) return;

    try {
      const updateData: any = {
        plan: editForm.plan,
        status: editForm.status,
      };

      if (editForm.status === "active" && editForm.endDate) {
        updateData.subscription_start_date = new Date().toISOString();
        updateData.subscription_end_date = new Date(editForm.endDate).toISOString();
      }

      const { error } = await supabase
        .from("subscriptions")
        .update(updateData)
        .eq("id", selectedSub.id);

      if (error) throw error;
      toast.success("Subscription updated");
      setIsEditOpen(false);
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredSubs = subscriptions.filter((sub) => {
    const matchesSearch = sub.schools?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-secondary text-secondary-foreground">Active</Badge>;
      case "trial":
        return <Badge variant="secondary">Trial</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Helmet><title>Subscriptions - SkoolSetu</title></Helmet>
      <DashboardLayout role="super_admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Subscriptions</h1>
            <p className="text-muted-foreground">Manage school subscription plans</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-secondary">
                  {subscriptions.filter(s => s.status === "active").length}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Trial</p>
                <p className="text-2xl font-bold text-primary">
                  {subscriptions.filter(s => s.status === "trial").length}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-destructive">
                  {subscriptions.filter(s => s.status === "expired").length}
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
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscriptions ({filteredSubs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredSubs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No subscriptions found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>School</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Trial End</TableHead>
                        <TableHead>Sub End</TableHead>
                        <TableHead>Coupon</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubs.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.schools?.name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">{sub.schools?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{sub.plan}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell>
                            {format(new Date(sub.trial_end_date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            {sub.subscription_end_date 
                              ? format(new Date(sub.subscription_end_date), "MMM dd, yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {sub.coupon_code ? (
                              <Badge variant="secondary">{sub.coupon_code}</Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(sub)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Subscription</DialogTitle>
                <DialogDescription>
                  Update subscription for {selectedSub?.schools?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={editForm.plan} onValueChange={(v) => setEditForm({ ...editForm, plan: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (₹25,000/year)</SelectItem>
                      <SelectItem value="pro">Pro (₹38,000/year)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editForm.status === "active" && (
                  <div className="space-y-2">
                    <Label>Subscription End Date</Label>
                    <Input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdate}>Update</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Subscriptions;
