import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  remarks: string | null;
}

const StudentAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0, percentage: 0 });

  useEffect(() => {
    if (user) {
      fetchAttendance();
    }
  }, [user, selectedMonth]);

  const fetchAttendance = async () => {
    try {
      // First get student ID
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .or(`user_id.eq.${user?.id},parent_user_id.eq.${user?.id}`)
        .maybeSingle();

      if (!studentData) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from("attendance")
        .select("id, date, status, remarks")
        .eq("student_id", studentData.id)
        .order("date", { ascending: false });

      if (selectedMonth !== "all") {
        const year = new Date().getFullYear();
        const month = parseInt(selectedMonth);
        const startDate = new Date(year, month, 1).toISOString().split("T")[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];
        query = query.gte("date", startDate).lte("date", endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAttendance(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const present = data?.filter(a => a.status === "present").length || 0;
      const absent = total - present;
      setStats({
        total,
        present,
        absent,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      });
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  return (
    <>
      <Helmet><title>Attendance History - SkoolSetu</title></Helmet>
      <DashboardLayout role="student">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Attendance History</h1>
            <p className="text-muted-foreground">View your attendance records</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Days</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-red-100">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${stats.percentage >= 75 ? "bg-green-100" : "bg-orange-100"}`}>
                    <Calendar className={`h-6 w-6 ${stats.percentage >= 75 ? "text-green-600" : "text-orange-600"}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Percentage</p>
                    <p className={`text-2xl font-bold ${stats.percentage >= 75 ? "text-green-600" : "text-orange-600"}`}>
                      {stats.percentage}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter and Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>Your daily attendance history</CardDescription>
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : attendance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No attendance records found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString("en-IN", {
                            weekday: "long",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.status === "present" ? "default" : "destructive"}>
                            {record.status === "present" ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Present</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> Absent</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.remarks || "-"}</TableCell>
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

export default StudentAttendance;
