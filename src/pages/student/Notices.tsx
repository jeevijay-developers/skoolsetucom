import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Notice {
  id: string;
  title: string;
  content: string;
  target_audience: string | null;
  published_at: string | null;
  created_at: string;
}

const StudentNotices = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotices();
    }
  }, [user]);

  const fetchNotices = async () => {
    try {
      // First get student's school
      const { data: studentData } = await supabase
        .from("students")
        .select("school_id")
        .or(`user_id.eq.${user?.id},parent_user_id.eq.${user?.id}`)
        .maybeSingle();

      if (!studentData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("school_id", studentData.school_id)
        .eq("is_published", true)
        .in("target_audience", ["all", "students", "parents"])
        .order("published_at", { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAudienceBadge = (audience: string | null) => {
    switch (audience) {
      case "all":
        return <Badge variant="secondary"><Users className="h-3 w-3 mr-1" /> Everyone</Badge>;
      case "students":
        return <Badge className="bg-blue-100 text-blue-800"><Users className="h-3 w-3 mr-1" /> Students</Badge>;
      case "parents":
        return <Badge className="bg-purple-100 text-purple-800"><Users className="h-3 w-3 mr-1" /> Parents</Badge>;
      default:
        return <Badge variant="outline">{audience}</Badge>;
    }
  };

  return (
    <>
      <Helmet><title>School Notices - SkoolSetu</title></Helmet>
      <DashboardLayout role="student">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">School Notices</h1>
            <p className="text-muted-foreground">Important announcements from your school</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No notices yet</p>
                <p className="text-muted-foreground">Check back later for announcements</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notices.map((notice) => (
                <Card key={notice.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10 mt-1">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{notice.title}</CardTitle>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(notice.published_at || notice.created_at).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                            {getAudienceBadge(notice.target_audience)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
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

export default StudentNotices;
