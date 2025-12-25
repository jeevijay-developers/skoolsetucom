import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Building2, ToggleLeft, ToggleRight, Eye } from "lucide-react";
import { format } from "date-fns";

interface School {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  board: string | null;
  is_active: boolean;
  student_count: number | null;
  created_at: string;
  subscriptions: { id: string; status: string; plan: string; trial_end_date: string }[] | null;
}

const Schools = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("schools")
      .select(`
        *,
        subscriptions (id, status, plan, trial_end_date)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch schools");
    } else {
      setSchools(data || []);
    }
    setLoading(false);
  };

  const handleToggleActive = async (school: School) => {
    try {
      const { error } = await supabase
        .from("schools")
        .update({ is_active: !school.is_active })
        .eq("id", school.id);

      if (error) throw error;
      toast.success(`School ${school.is_active ? "deactivated" : "activated"}`);
      fetchSchools();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredSchools = schools.filter((school) => {
    const matchesSearch = 
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "active") return matchesSearch && school.is_active;
    if (filterStatus === "inactive") return matchesSearch && !school.is_active;
    
    const subStatus = school.subscriptions?.[0]?.status;
    return matchesSearch && subStatus === filterStatus;
  });

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "active":
        return <Badge className="bg-secondary text-secondary-foreground">Active</Badge>;
      case "trial":
        return <Badge variant="secondary">Trial</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <>
      <Helmet><title>Schools Management - SkoolSetu</title></Helmet>
      <DashboardLayout role="super_admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Schools Management</h1>
            <p className="text-muted-foreground">View and manage all registered schools</p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Schools Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Schools ({filteredSchools.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredSchools.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No schools found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>School Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchools.map((school) => (
                        <TableRow key={school.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{school.name}</p>
                              <p className="text-sm text-muted-foreground">{school.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {school.city ? `${school.city}, ${school.state}` : "-"}
                          </TableCell>
                          <TableCell>{school.student_count || 0}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline">{school.subscriptions?.[0]?.plan || "N/A"}</Badge>
                              {getStatusBadge(school.subscriptions?.[0]?.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={school.is_active ? "secondary" : "destructive"}>
                              {school.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(school.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSchool(school);
                                  setIsDetailOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(school)}
                              >
                                {school.is_active ? (
                                  <ToggleRight className="h-4 w-4 text-secondary" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                )}
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

          {/* School Detail Dialog */}
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedSchool?.name}</DialogTitle>
                <DialogDescription>School details and subscription info</DialogDescription>
              </DialogHeader>
              {selectedSchool && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedSchool.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedSchool.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">
                        {selectedSchool.city ? `${selectedSchool.city}, ${selectedSchool.state}` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Board</p>
                      <p className="font-medium">{selectedSchool.board || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Student Count</p>
                      <p className="font-medium">{selectedSchool.student_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={selectedSchool.is_active ? "secondary" : "destructive"}>
                        {selectedSchool.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  {selectedSchool.subscriptions?.[0] && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Subscription Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Plan</p>
                          <p className="font-medium capitalize">{selectedSchool.subscriptions[0].plan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          {getStatusBadge(selectedSchool.subscriptions[0].status)}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Trial Ends</p>
                          <p className="font-medium">
                            {format(new Date(selectedSchool.subscriptions[0].trial_end_date), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Schools;
