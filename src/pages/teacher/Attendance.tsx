import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
}

const TeacherAttendance = () => {
  const { user, schoolId } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent" | "late">>({});
  const [existingAttendance, setExistingAttendance] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    if (schoolId && user?.id) {
      fetchTeacherAndClasses();
    }
  }, [schoolId, user?.id]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchStudents();
      checkExistingAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchTeacherAndClasses = async () => {
    setLoading(true);
    
    // First get the teacher record for the logged-in user
    const { data: teacherData } = await supabase
      .from("teachers")
      .select("id")
      .eq("school_id", schoolId)
      .eq("user_id", user?.id)
      .single();

    if (!teacherData) {
      setLoading(false);
      return;
    }

    setTeacherId(teacherData.id);

    // Fetch only classes where this teacher is the class teacher
    const { data: classData } = await supabase
      .from("classes")
      .select("id, name, section")
      .eq("school_id", schoolId)
      .eq("class_teacher_id", teacherData.id)
      .order("name");

    setClasses(classData || []);
    setLoading(false);
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from("students")
      .select("id, full_name, roll_number")
      .eq("school_id", schoolId)
      .eq("class_id", selectedClass)
      .eq("is_active", true)
      .order("roll_number");
    
    setStudents(data || []);
    
    // Initialize all as present
    const initial: Record<string, "present" | "absent" | "late"> = {};
    (data || []).forEach(s => initial[s.id] = "present");
    setAttendance(initial);
  };

  const checkExistingAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select("student_id, status")
      .eq("school_id", schoolId)
      .eq("class_id", selectedClass)
      .eq("date", selectedDate);
    
    if (data && data.length > 0) {
      setExistingAttendance(true);
      const existing: Record<string, "present" | "absent" | "late"> = {};
      data.forEach(a => existing[a.student_id] = a.status as "present" | "absent" | "late");
      setAttendance(existing);
    } else {
      setExistingAttendance(false);
    }
  };

  const handleStatusChange = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      toast.error("Please select class and date");
      return;
    }

    setSaving(true);
    try {
      // Delete existing attendance for this class and date
      await supabase
        .from("attendance")
        .delete()
        .eq("school_id", schoolId)
        .eq("class_id", selectedClass)
        .eq("date", selectedDate);

      // Insert new attendance
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        school_id: schoolId,
        class_id: selectedClass,
        student_id: studentId,
        date: selectedDate,
        status,
        marked_by: user?.id,
      }));

      const { error } = await supabase.from("attendance").insert(records);
      if (error) throw error;

      toast.success("Attendance saved successfully");
      setExistingAttendance(true);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === "present").length;
  const absentCount = Object.values(attendance).filter(s => s === "absent").length;
  const lateCount = Object.values(attendance).filter(s => s === "late").length;

  return (
    <>
      <Helmet><title>Mark Attendance - SkoolSetu</title></Helmet>
      <DashboardLayout role="teacher">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Mark Attendance</h1>
            <p className="text-muted-foreground">Record daily student attendance for your classes</p>
          </div>

          {loading ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">Loading...</CardContent>
            </Card>
          ) : classes.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Classes Assigned</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  You are not assigned as a class teacher for any class. Only class teachers can mark attendance. 
                  Please contact your school administrator to be assigned as a class teacher.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} {cls.section ? `- ${cls.section}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedClass && (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="shadow-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-xl font-bold">{students.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-secondary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Present</p>
                            <p className="text-xl font-bold text-secondary">{presentCount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <XCircle className="h-5 w-5 text-destructive" />
                          <div>
                            <p className="text-sm text-muted-foreground">Absent</p>
                            <p className="text-xl font-bold text-destructive">{absentCount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-warning" />
                          <div>
                            <p className="text-sm text-muted-foreground">Late</p>
                            <p className="text-xl font-bold text-warning">{lateCount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Attendance Table */}
                  <Card className="shadow-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Attendance for {format(new Date(selectedDate), "MMMM dd, yyyy")}
                          {existingAttendance && (
                            <Badge variant="secondary">Already Marked</Badge>
                          )}
                        </CardTitle>
                        <Button onClick={handleSaveAttendance} disabled={saving || students.length === 0}>
                          {saving ? "Saving..." : existingAttendance ? "Update Attendance" : "Save Attendance"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {students.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No students found in this class
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Roll No</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Present</TableHead>
                              <TableHead>Absent</TableHead>
                              <TableHead>Late</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell>{student.roll_number || "-"}</TableCell>
                                <TableCell className="font-medium">{student.full_name}</TableCell>
                                <TableCell>
                                  <Checkbox
                                    checked={attendance[student.id] === "present"}
                                    onCheckedChange={() => handleStatusChange(student.id, "present")}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Checkbox
                                    checked={attendance[student.id] === "absent"}
                                    onCheckedChange={() => handleStatusChange(student.id, "absent")}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Checkbox
                                    checked={attendance[student.id] === "late"}
                                    onCheckedChange={() => handleStatusChange(student.id, "late")}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {!selectedClass && (
                <Card className="shadow-card">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Select a class to mark attendance
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  );
};

export default TeacherAttendance;
