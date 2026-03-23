import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CalendarDays } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

const StudentAssignments = () => {
  const { user, userRole } = useAuth();
  const schoolId = userRole?.school_id;

  // Get student's class_id
  const { data: student } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, class_id")
        .eq("school_id", schoolId!)
        .or(`user_id.eq.${user!.id},parent_user_id.eq.${user!.id}`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId && !!user,
  });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["student-assignments", student?.class_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("class_id", student!.class_id!)
        .eq("is_published", true)
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId && !!student?.class_id,
  });

  const getDueBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const d = new Date(dueDate);
    if (isToday(d)) return <Badge variant="secondary">Due Today</Badge>;
    if (isPast(d)) return <Badge variant="destructive">Overdue</Badge>;
    return <Badge variant="outline">Upcoming</Badge>;
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">View homework assigned by your teachers</p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : !assignments?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assignments yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {assignments.map((a: any) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        <Badge variant="secondary" className="mr-2">{a.subject}</Badge>
                        {a.due_date && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            Due: {format(new Date(a.due_date), "dd MMM yyyy")}
                          </span>
                        )}
                      </p>
                    </div>
                    {getDueBadge(a.due_date)}
                  </div>
                </CardHeader>
                {a.description && (
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{a.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentAssignments;
