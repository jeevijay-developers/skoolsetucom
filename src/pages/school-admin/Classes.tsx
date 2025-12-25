import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const Classes = () => {
  const { schoolId } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", section: "", academic_year: "2024-25" });

  useEffect(() => { if (schoolId) fetchClasses(); }, [schoolId]);

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*").eq("school_id", schoolId).order("name");
    setClasses(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error("Please enter class name"); return; }
    try {
      if (editingClass) {
        await supabase.from("classes").update(formData).eq("id", editingClass.id);
        toast.success("Class updated");
      } else {
        await supabase.from("classes").insert({ ...formData, school_id: schoolId });
        toast.success("Class added");
      }
      setIsDialogOpen(false);
      setFormData({ name: "", section: "", academic_year: "2024-25" });
      setEditingClass(null);
      fetchClasses();
    } catch (error: any) { toast.error(error.message); }
  };

  return (
    <>
      <Helmet><title>Classes - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div><h1 className="text-2xl font-bold">Classes</h1><p className="text-muted-foreground">Manage classes and sections</p></div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Class</Button></DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader><DialogTitle>{editingClass ? "Edit" : "Add"} Class</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2"><Label>Class Name</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., Class 1" /></div>
                    <div className="space-y-2"><Label>Section</Label><Input value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} placeholder="e.g., A" /></div>
                  </div>
                  <DialogFooter><Button type="submit">{editingClass ? "Update" : "Add"}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="shadow-card">
            <CardContent className="p-0">
              {loading ? <div className="p-8 text-center">Loading...</div> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Class</TableHead><TableHead>Section</TableHead><TableHead>Year</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.section || "-"}</TableCell>
                        <TableCell>{cls.academic_year}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingClass(cls); setFormData(cls); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("classes").delete().eq("id", cls.id); fetchClasses(); }}><Trash2 className="h-4 w-4" /></Button>
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

export default Classes;
