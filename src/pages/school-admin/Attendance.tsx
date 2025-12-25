import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Check, X, Save, Users } from "lucide-react";
import { format } from "date-fns";

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
  class_id: string | null;
}

interface AttendanceRecord {
  student_id: string;
  status: "present" | "absent" | "late";
}

interface Class {
  id: string;
  name: string;
  section: string | null;
}

const Attendance = () => {
  const { schoolId, user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent" | "late">>({});
  const [existingAttendance, setExistingAttendance] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (schoolId) fetchClasses();
  }, [schoolId]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchStudents();
      fetchExistingAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name, section")
      .eq("school_id", schoolId)
      .order("name");
    setClasses(data || []);
  };

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select("id, full_name, roll_number, class_id")
      .eq("school_id", schoolId)
      .eq("class_id", selectedClass)
      .eq("is_active", true)
      .order("roll_number");
    setStudents(data || []);
    
    // Initialize all as present by default
    const initialAttendance: Record<string, "present" | "absent" | "late"> = {};
    data?.forEach(student => {
      initialAttendance[student.id] = "present";
    });
    setAttendance(initialAttendance);
    setLoading(false);
  };

  const fetchExistingAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select("student_id, status")
      .eq("school_id", schoolId)
      .eq("class_id", selectedClass)
      .eq("date", selectedDate);

    if (data && data.length > 0) {
      setExistingAttendance(true);
      const existingRecords: Record<string, "present" | "absent" | "late"> = {};
      data.forEach(record => {
        existingRecords[record.student_id] = record.status as "present" | "absent" | "late";
      });
      setAttendance(existingRecords);
    } else {
      setExistingAttendance(false);
    }
  };

  const handleStatusChange = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, "present" | "absent" | "late"> = {};
    students.forEach(student => {
      allPresent[student.id] = "present";
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent: Record<string, "present" | "absent" | "late"> = {};
    students.forEach(student => {
      allAbsent[student.id] = "absent";
    });
    setAttendance(allAbsent);
  };

  const saveAttendance = async () => {
    if (!selectedClass || students.length === 0) {
      toast.error("Please select a class with students");
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

      // Insert new attendance records
      const records = students.map(student => ({
        school_id: schoolId!,
        class_id: selectedClass,
        student_id: student.id,
        date: selectedDate,
        status: attendance[student.id] || "present",
        marked_by: user?.id,
      }));

      const { error } = await supabase.from("attendance").insert(records);

      if (error) throw error;
      toast.success("Attendance saved successfully");
      setExistingAttendance(true);
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      toast.error(error.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === "present").length;
  const absentCount = Object.values(attendance).filter(s => s === "absent").length;
  const lateCount = Object.values(attendance).filter(s => s === "late").length;

  return (
    <>
      <Helmet><title>Attendance - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Attendance Management</h1>
              <p className="text-muted-foreground">Mark daily attendance for your classes</p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Class</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose class" />
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={format(new Date(), "yyyy-MM-dd")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <div className="flex items-center gap-2 h-10">
                    {existingAttendance ? (
                      <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                        <Check className="h-3 w-3 mr-1" /> Attendance Marked
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Marked</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Stats */}
          {selectedClass && students.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="shadow-card">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </CardContent>
              </Card>
              <Card className="shadow-card bg-secondary/5">
                <CardContent className="p-4 text-center">
                  <Check className="h-6 w-6 mx-auto mb-2 text-secondary" />
                  <p className="text-2xl font-bold text-secondary">{presentCount}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </CardContent>
              </Card>
              <Card className="shadow-card bg-destructive/5">
                <CardContent className="p-4 text-center">
                  <X className="h-6 w-6 mx-auto mb-2 text-destructive" />
                  <p className="text-2xl font-bold text-destructive">{absentCount}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </CardContent>
              </Card>
              <Card className="shadow-card bg-warning/10">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-warning" />
                  <p className="text-2xl font-bold text-warning">{lateCount}</p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Attendance Table */}
          {selectedClass && (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Mark Attendance</CardTitle>
                    <CardDescription>
                      {format(new Date(selectedDate), "EEEE, MMMM dd, yyyy")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={markAllPresent}>
                      Mark All Present
                    </Button>
                    <Button variant="outline" size="sm" onClick={markAllAbsent}>
                      Mark All Absent
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No students found in this class
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Roll</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead className="text-center">Present</TableHead>
                            <TableHead className="text-center">Absent</TableHead>
                            <TableHead className="text-center">Late</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.roll_number || "-"}</TableCell>
                              <TableCell>{student.full_name}</TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant={attendance[student.id] === "present" ? "default" : "outline"}
                                  size="sm"
                                  className={attendance[student.id] === "present" ? "bg-secondary hover:bg-secondary/90" : ""}
                                  onClick={() => handleStatusChange(student.id, "present")}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant={attendance[student.id] === "absent" ? "destructive" : "outline"}
                                  size="sm"
                                  onClick={() => handleStatusChange(student.id, "absent")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant={attendance[student.id] === "late" ? "default" : "outline"}
                                  size="sm"
                                  className={attendance[student.id] === "late" ? "bg-warning hover:bg-warning/90 text-warning-foreground" : ""}
                                  onClick={() => handleStatusChange(student.id, "late")}
                                >
                                  L
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-end mt-6">
                      <Button onClick={saveAttendance} disabled={saving} size="lg">
                        {saving ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></span>
                            Saving...
                          </span>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Attendance
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {!selectedClass && (
            <Card className="shadow-card">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a class to mark attendance</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </>
  );
};

export default Attendance;
