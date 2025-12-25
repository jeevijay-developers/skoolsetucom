import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BookOpen, School } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
}

interface ClassSubject {
  class_id: string;
  classes: { name: string; section: string | null };
}

const Subjects = () => {
  const { schoolId } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });
  const [classAssignments, setClassAssignments] = useState<Record<string, ClassSubject[]>>({});

  useEffect(() => {
    if (schoolId) {
      fetchSubjects();
    }
  }, [schoolId]);

  const fetchSubjects = async () => {
    setLoading(true);
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*")
      .eq("school_id", schoolId)
      .order("name");

    if (subjectsData) {
      setSubjects(subjectsData);
      
      // Fetch class assignments for each subject
      const { data: assignments } = await supabase
        .from("class_subjects")
        .select("subject_id, class_id, classes(name, section)")
        .eq("school_id", schoolId);

      if (assignments) {
        const grouped: Record<string, ClassSubject[]> = {};
        assignments.forEach((a: any) => {
          if (!grouped[a.subject_id]) grouped[a.subject_id] = [];
          grouped[a.subject_id].push({ class_id: a.class_id, classes: a.classes });
        });
        setClassAssignments(grouped);
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter subject name");
      return;
    }

    try {
      if (editingSubject) {
        await supabase
          .from("subjects")
          .update({
            name: formData.name,
            code: formData.code || null,
            description: formData.description || null,
          })
          .eq("id", editingSubject.id);
        toast.success("Subject updated");
      } else {
        await supabase.from("subjects").insert({
          name: formData.name,
          code: formData.code || null,
          description: formData.description || null,
          school_id: schoolId,
        });
        toast.success("Subject added");
      }
      setIsDialogOpen(false);
      setFormData({ name: "", code: "", description: "" });
      setEditingSubject(null);
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    
    try {
      // First delete class_subjects assignments
      await supabase.from("class_subjects").delete().eq("subject_id", id);
      // Then delete the subject
      await supabase.from("subjects").delete().eq("id", id);
      toast.success("Subject deleted");
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (subject: Subject) => {
    try {
      await supabase
        .from("subjects")
        .update({ is_active: !subject.is_active })
        .eq("id", subject.id);
      toast.success(`Subject ${subject.is_active ? "deactivated" : "activated"}`);
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code || "",
      description: subject.description || "",
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingSubject(null);
    setFormData({ name: "", code: "", description: "" });
    setIsDialogOpen(true);
  };

  return (
    <>
      <Helmet><title>Subjects - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Subjects</h1>
              <p className="text-muted-foreground">Manage academic subjects</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingSubject ? "Edit" : "Add"} Subject</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Subject Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subject Code</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., MATH"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">{editingSubject ? "Update" : "Add"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : subjects.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Subjects Yet</h3>
                <p className="text-muted-foreground mb-4">Add your first subject to get started</p>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />Add Subject
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <Card key={subject.id} className="shadow-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{subject.name}</h3>
                          {subject.code && (
                            <p className="text-sm text-muted-foreground">{subject.code}</p>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={subject.is_active}
                        onCheckedChange={() => handleToggleActive(subject)}
                      />
                    </div>

                    {subject.description && (
                      <p className="text-sm text-muted-foreground mb-3">{subject.description}</p>
                    )}

                    {/* Assigned Classes */}
                    <div className="mb-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <School className="h-3.5 w-3.5" />
                        <span>Assigned Classes</span>
                      </div>
                      {classAssignments[subject.id]?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {classAssignments[subject.id].slice(0, 4).map((ca, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {ca.classes.name}{ca.classes.section ? `-${ca.classes.section}` : ""}
                            </Badge>
                          ))}
                          {classAssignments[subject.id].length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{classAssignments[subject.id].length - 4} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not assigned to any class</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(subject)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(subject.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
};

export default Subjects;
