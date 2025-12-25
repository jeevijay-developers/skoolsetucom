import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, UserCheck, Trash2, Percent } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  category: string;
}

interface DiscountAuthority {
  id: string;
  employee_id: string;
  max_discount_percent: number;
  is_active: boolean;
  employees: { full_name: string; category: string } | null;
}

const DiscountAuthorities = () => {
  const { schoolId } = useAuth();
  const [authorities, setAuthorities] = useState<DiscountAuthority[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [maxDiscountPercent, setMaxDiscountPercent] = useState("100");

  useEffect(() => {
    if (schoolId) {
      fetchAuthorities();
      fetchEmployees();
    }
  }, [schoolId]);

  const fetchAuthorities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fee_discount_authorities")
      .select(`
        id, employee_id, max_discount_percent, is_active,
        employees (full_name, category)
      `)
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching authorities:", error);
    }
    setAuthorities((data as DiscountAuthority[]) || []);
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, full_name, category")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("full_name");
    setEmployees(data || []);
  };

  const handleAddAuthority = async () => {
    if (!selectedEmployeeId) {
      toast.error("Please select an employee");
      return;
    }

    try {
      const { error } = await supabase
        .from("fee_discount_authorities")
        .insert({
          school_id: schoolId,
          employee_id: selectedEmployeeId,
          max_discount_percent: parseFloat(maxDiscountPercent) || 100,
        });

      if (error) throw error;
      
      toast.success("Discount authority added");
      setIsDialogOpen(false);
      setSelectedEmployeeId("");
      setMaxDiscountPercent("100");
      fetchAuthorities();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("This employee is already a discount authority");
      } else {
        toast.error(error.message);
      }
    }
  };

  const handleToggleActive = async (authority: DiscountAuthority) => {
    try {
      const { error } = await supabase
        .from("fee_discount_authorities")
        .update({ is_active: !authority.is_active })
        .eq("id", authority.id);

      if (error) throw error;
      toast.success(`Authority ${authority.is_active ? "deactivated" : "activated"}`);
      fetchAuthorities();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this discount authority?")) return;

    try {
      const { error } = await supabase
        .from("fee_discount_authorities")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Authority removed");
      fetchAuthorities();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Filter out employees who are already authorities
  const availableEmployees = employees.filter(
    emp => !authorities.some(auth => auth.employee_id === emp.id)
  );

  return (
    <>
      <Helmet><title>Discount Authorities - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Discount Authorities</h1>
              <p className="text-muted-foreground">Manage who can authorize fee discounts</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Authority
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Discount Authority</DialogTitle>
                  <DialogDescription>
                    Select an employee who can authorize fee discounts
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Employee *</Label>
                    <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEmployees.length === 0 ? (
                          <SelectItem value="none" disabled>No employees available</SelectItem>
                        ) : (
                          availableEmployees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.full_name} ({emp.category})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Discount % Allowed</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={maxDiscountPercent}
                        onChange={(e) => setMaxDiscountPercent(e.target.value)}
                        placeholder="100"
                        min={1}
                        max={100}
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maximum percentage of fee this person can approve as discount
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddAuthority}>Add Authority</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Authorized Personnel ({authorities.length})
              </CardTitle>
              <CardDescription>
                These employees can authorize fee discounts during fee collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : authorities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No discount authorities configured. Add employees who can authorize discounts.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Max Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authorities.map((auth) => (
                      <TableRow key={auth.id}>
                        <TableCell className="font-medium">
                          {auth.employees?.full_name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{auth.employees?.category || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>{auth.max_discount_percent}%</TableCell>
                        <TableCell>
                          <Badge 
                            variant={auth.is_active ? "default" : "secondary"}
                            className={auth.is_active ? "bg-secondary text-secondary-foreground" : ""}
                          >
                            {auth.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(auth)}
                            >
                              {auth.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(auth.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

export default DiscountAuthorities;