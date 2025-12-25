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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { format } from "date-fns";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

const Coupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    max_uses: "",
    valid_until: "",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch coupons");
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.code || !form.discount_value) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      const { error } = await supabase.from("coupons").insert({
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        max_uses: form.max_uses ? parseInt(form.max_uses) : 100,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        is_active: true,
      });

      if (error) throw error;
      toast.success("Coupon created successfully");
      setIsAddOpen(false);
      setForm({ code: "", discount_type: "percentage", discount_value: "", max_uses: "", valid_until: "" });
      fetchCoupons();
    } catch (error: any) {
      if (error.message.includes("duplicate")) {
        toast.error("Coupon code already exists");
      } else {
        toast.error(error.message);
      }
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: !coupon.is_active })
        .eq("id", coupon.id);

      if (error) throw error;
      toast.success(`Coupon ${coupon.is_active ? "deactivated" : "activated"}`);
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", coupon.id);

      if (error) throw error;
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const activeCoupons = coupons.filter(c => c.is_active);

  return (
    <>
      <Helmet><title>Coupons - SkoolSetu</title></Helmet>
      <DashboardLayout role="super_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Discount Coupons</h1>
              <p className="text-muted-foreground">Create and manage promotional coupons</p>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Coupon
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Coupon</DialogTitle>
                  <DialogDescription>Add a new discount coupon for schools</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Coupon Code *</Label>
                    <Input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., SAVE20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Discount Type</Label>
                      <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Value *</Label>
                      <Input
                        type="number"
                        value={form.discount_value}
                        onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                        placeholder={form.discount_type === "percentage" ? "20" : "5000"}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Uses</Label>
                      <Input
                        type="number"
                        value={form.max_uses}
                        onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valid Until</Label>
                      <Input
                        type="date"
                        value={form.valid_until}
                        onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate}>Create Coupon</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Tag className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Coupons</p>
                    <p className="text-2xl font-bold">{coupons.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-secondary">{activeCoupons.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Total Redemptions</p>
                <p className="text-2xl font-bold">
                  {coupons.reduce((sum, c) => sum + (c.current_uses || 0), 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Coupons Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>All Coupons</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No coupons created yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-lg">
                              {coupon.code}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {coupon.discount_type === "percentage" 
                              ? `${coupon.discount_value}%`
                              : `₹${coupon.discount_value.toLocaleString()}`}
                          </TableCell>
                          <TableCell>
                            {coupon.current_uses || 0} / {coupon.max_uses || "∞"}
                          </TableCell>
                          <TableCell>
                            {coupon.valid_until 
                              ? format(new Date(coupon.valid_until), "MMM dd, yyyy")
                              : "No expiry"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={coupon.is_active ? "secondary" : "outline"}>
                              {coupon.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggle(coupon)}
                              >
                                {coupon.is_active ? (
                                  <ToggleRight className="h-4 w-4 text-secondary" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(coupon)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
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
        </div>
      </DashboardLayout>
    </>
  );
};

export default Coupons;
