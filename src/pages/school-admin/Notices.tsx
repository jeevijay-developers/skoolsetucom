import { useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Megaphone, Users, GraduationCap, UserCog, Loader2 } from "lucide-react";
import { format } from "date-fns";

const noticeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required").max(2000, "Content must be less than 2000 characters"),
  target_audience: z.string().min(1, "Please select target audience"),
  is_published: z.boolean(),
});

type NoticeFormData = z.infer<typeof noticeSchema>;

const audienceOptions = [
  { value: "all", label: "📢 All (Everyone)", icon: Megaphone, color: "bg-green-500" },
  { value: "teachers", label: "👨‍🏫 Teachers", icon: Users, color: "bg-blue-500" },
  { value: "students", label: "👨‍👩‍👧 Students/Parents", icon: GraduationCap, color: "bg-purple-500" },
  { value: "staff", label: "👥 Staff (Sub-admins)", icon: UserCog, color: "bg-orange-500" },
];

const Notices = () => {
  const { schoolId, user } = useAuth();
  const queryClient = useQueryClient();
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [deleteNoticeId, setDeleteNoticeId] = useState<string | null>(null);

  const form = useForm<NoticeFormData>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: "",
      content: "",
      target_audience: "all",
      is_published: true,
    },
  });

  const editForm = useForm<NoticeFormData>({
    resolver: zodResolver(noticeSchema),
  });

  // Fetch notices
  const { data: notices, isLoading } = useQuery({
    queryKey: ["notices", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });

  // Create notice mutation
  const createMutation = useMutation({
    mutationFn: async (data: NoticeFormData) => {
      const { error } = await supabase.from("notices").insert({
        title: data.title,
        content: data.content,
        target_audience: data.target_audience,
        is_published: data.is_published,
        published_at: data.is_published ? new Date().toISOString() : null,
        school_id: schoolId,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices", schoolId] });
      form.reset();
      toast({ title: "Notice created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating notice", description: error.message, variant: "destructive" });
    },
  });

  // Update notice mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: NoticeFormData }) => {
      const { error } = await supabase
        .from("notices")
        .update({
          title: data.title,
          content: data.content,
          target_audience: data.target_audience,
          is_published: data.is_published,
          published_at: data.is_published ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices", schoolId] });
      setEditingNotice(null);
      toast({ title: "Notice updated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating notice", description: error.message, variant: "destructive" });
    },
  });

  // Delete notice mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices", schoolId] });
      setDeleteNoticeId(null);
      toast({ title: "Notice deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting notice", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: NoticeFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: NoticeFormData) => {
    if (editingNotice) {
      updateMutation.mutate({ id: editingNotice.id, data });
    }
  };

  const handleEdit = (notice: any) => {
    setEditingNotice(notice);
    editForm.reset({
      title: notice.title,
      content: notice.content,
      target_audience: notice.target_audience,
      is_published: notice.is_published,
    });
  };

  const getAudienceBadge = (audience: string) => {
    const option = audienceOptions.find((o) => o.value === audience);
    if (!option) return <Badge variant="secondary">Unknown</Badge>;
    return (
      <Badge className={`${option.color} text-white`}>
        {option.label.replace(/📢|👨‍🏫|👨‍👩‍👧|👥/g, "").trim()}
      </Badge>
    );
  };

  return (
    <>
      <Helmet>
        <title>Notices - SkoolSetu</title>
      </Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Notices</h1>

          {/* Create Notice Form */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter notice title..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter notice content..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="target_audience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Send To</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select target audience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background z-50">
                            {audienceOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <span className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  {option.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_published"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Publish Immediately</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Toggle off to save as draft
                          </p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Notice
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Notices List */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                All Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : notices && notices.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Target Audience</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notices.map((notice) => (
                        <TableRow key={notice.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {notice.title}
                          </TableCell>
                          <TableCell>{getAudienceBadge(notice.target_audience || "all")}</TableCell>
                          <TableCell>
                            {format(new Date(notice.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={notice.is_published ? "default" : "secondary"}>
                              {notice.is_published ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(notice)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteNoticeId(notice.id)}
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
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No notices created yet. Create your first notice above!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingNotice} onOpenChange={() => setEditingNotice(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Notice</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="target_audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Send To</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background z-50">
                          {audienceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel>Published</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingNotice(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteNoticeId} onOpenChange={() => setDeleteNoticeId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Notice?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The notice will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteNoticeId && deleteMutation.mutate(deleteNoticeId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </>
  );
};

export default Notices;
