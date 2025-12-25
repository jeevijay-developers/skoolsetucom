import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Check, X, Save, Users, Download, ClipboardList, FileSpreadsheet } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
  class_id: string | null;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  status: string;
  date: string;
  student: {
    full_name: string;
    roll_number: string | null;
  };
}

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface ClassReport {
  classId: string;
  className: string;
  section: string | null;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  notMarked: boolean;
}

const Attendance = () => {
  const { schoolId, user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [classReports, setClassReports] = useState<ClassReport[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"today" | "custom">("today");
  const [customDate, setCustomDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Recording attendance state
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent" | "late">>({});
  const [existingAttendance, setExistingAttendance] = useState<boolean>(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  // Detailed view state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailClass, setDetailClass] = useState<ClassReport | null>(null);
  const [detailRecords, setDetailRecords] = useState<AttendanceRecord[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const reportDate = useMemo(() => {
    return dateFilter === "today" ? new Date() : customDate;
  }, [dateFilter, customDate]);

  useEffect(() => {
    if (schoolId) fetchClasses();
  }, [schoolId]);

  useEffect(() => {
    if (schoolId && classes.length > 0) {
      fetchClassReports();
    }
  }, [schoolId, classes, reportDate, selectedClassFilter]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name, section")
      .eq("school_id", schoolId)
      .order("name");
    setClasses(data || []);
  };

  const fetchClassReports = async () => {
    setLoading(true);
    const dateStr = format(reportDate, "yyyy-MM-dd");
    
    const filteredClasses = selectedClassFilter === "all" 
      ? classes 
      : classes.filter(c => c.id === selectedClassFilter);

    const reports: ClassReport[] = [];

    for (const cls of filteredClasses) {
      // Get student count for class
      const { count: studentCount } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("class_id", cls.id)
        .eq("is_active", true);

      // Get attendance for this class on this date
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("status")
        .eq("school_id", schoolId)
        .eq("class_id", cls.id)
        .eq("date", dateStr);

      const present = attendanceData?.filter(a => a.status === "present").length || 0;
      const absent = attendanceData?.filter(a => a.status === "absent").length || 0;
      const late = attendanceData?.filter(a => a.status === "late").length || 0;

      reports.push({
        classId: cls.id,
        className: cls.name,
        section: cls.section,
        totalStudents: studentCount || 0,
        present,
        absent,
        late,
        notMarked: (attendanceData?.length || 0) === 0,
      });
    }

    setClassReports(reports);
    setLoading(false);
  };

  const fetchStudentsForRecording = async () => {
    setLoadingStudents(true);
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
    setLoadingStudents(false);
  };

  const fetchExistingAttendanceForRecording = async () => {
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

  useEffect(() => {
    if (selectedClass && selectedDate && recordDialogOpen) {
      fetchStudentsForRecording();
      fetchExistingAttendanceForRecording();
    }
  }, [selectedClass, selectedDate, recordDialogOpen]);

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
      await supabase
        .from("attendance")
        .delete()
        .eq("school_id", schoolId)
        .eq("class_id", selectedClass)
        .eq("date", selectedDate);

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
      setRecordDialogOpen(false);
      fetchClassReports();
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      toast.error(error.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const viewClassDetails = async (report: ClassReport) => {
    setDetailClass(report);
    setDetailDialogOpen(true);
    setLoadingDetails(true);

    const dateStr = format(reportDate, "yyyy-MM-dd");
    const { data } = await supabase
      .from("attendance")
      .select(`
        id,
        student_id,
        status,
        date,
        student:students!attendance_student_id_fkey(full_name, roll_number)
      `)
      .eq("school_id", schoolId)
      .eq("class_id", report.classId)
      .eq("date", dateStr)
      .order("student(roll_number)");

    setDetailRecords((data as any) || []);
    setLoadingDetails(false);
  };

  const exportClassCSV = (report: ClassReport) => {
    const dateStr = format(reportDate, "yyyy-MM-dd");
    
    // First fetch the detailed records for this class
    supabase
      .from("attendance")
      .select(`
        student_id,
        status,
        student:students!attendance_student_id_fkey(full_name, roll_number)
      `)
      .eq("school_id", schoolId)
      .eq("class_id", report.classId)
      .eq("date", dateStr)
      .then(({ data }) => {
        if (!data || data.length === 0) {
          toast.error("No attendance data to export");
          return;
        }

        const csvContent = [
          ["Roll Number", "Student Name", "Status", "Date"].join(","),
          ...data.map((record: any) => [
            record.student?.roll_number || "-",
            record.student?.full_name || "-",
            record.status,
            dateStr
          ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `attendance_${report.className}${report.section ? `_${report.section}` : ""}_${dateStr}.csv`;
        link.click();
        toast.success("CSV exported successfully");
      });
  };

  const exportAllClassesCSV = async () => {
    const dateStr = format(reportDate, "yyyy-MM-dd");
    
    const filteredClassIds = selectedClassFilter === "all" 
      ? classes.map(c => c.id)
      : [selectedClassFilter];

    const { data } = await supabase
      .from("attendance")
      .select(`
        class_id,
        student_id,
        status,
        student:students!attendance_student_id_fkey(full_name, roll_number),
        class:classes!attendance_class_id_fkey(name, section)
      `)
      .eq("school_id", schoolId)
      .in("class_id", filteredClassIds)
      .eq("date", dateStr);

    if (!data || data.length === 0) {
      toast.error("No attendance data to export");
      return;
    }

    const csvContent = [
      ["Class", "Section", "Roll Number", "Student Name", "Status", "Date"].join(","),
      ...data.map((record: any) => [
        record.class?.name || "-",
        record.class?.section || "-",
        record.student?.roll_number || "-",
        record.student?.full_name || "-",
        record.status,
        dateStr
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_report_${dateStr}.csv`;
    link.click();
    toast.success("CSV exported successfully");
  };

  const presentCount = Object.values(attendance).filter(s => s === "present").length;
  const absentCount = Object.values(attendance).filter(s => s === "absent").length;
  const lateCount = Object.values(attendance).filter(s => s === "late").length;

  const totalStats = useMemo(() => {
    return classReports.reduce((acc, r) => ({
      total: acc.total + r.totalStudents,
      present: acc.present + r.present,
      absent: acc.absent + r.absent,
      late: acc.late + r.late,
    }), { total: 0, present: 0, absent: 0, late: 0 });
  }, [classReports]);

  return (
    <>
      <Helmet><title>Attendance Report - SkoolSetu</title></Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Attendance Report</h1>
              <p className="text-muted-foreground">View and export class-wise attendance</p>
            </div>
            <Button onClick={() => setRecordDialogOpen(true)}>
              <ClipboardList className="h-4 w-4 mr-2" />
              Record Attendance
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class Filter</label>
                  <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} {cls.section ? `- ${cls.section}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Filter</label>
                  <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as "today" | "custom")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="custom">Custom Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {dateFilter === "custom" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(customDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={customDate}
                          onSelect={(date) => date && setCustomDate(date)}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                <div className="space-y-2 flex items-end">
                  <Button variant="outline" onClick={exportAllClassesCSV} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export All CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{totalStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </CardContent>
            </Card>
            <Card className="shadow-card bg-secondary/5">
              <CardContent className="p-4 text-center">
                <Check className="h-6 w-6 mx-auto mb-2 text-secondary" />
                <p className="text-2xl font-bold text-secondary">{totalStats.present}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </CardContent>
            </Card>
            <Card className="shadow-card bg-destructive/5">
              <CardContent className="p-4 text-center">
                <X className="h-6 w-6 mx-auto mb-2 text-destructive" />
                <p className="text-2xl font-bold text-destructive">{totalStats.absent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </CardContent>
            </Card>
            <Card className="shadow-card bg-warning/10">
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-warning" />
                <p className="text-2xl font-bold text-warning">{totalStats.late}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </CardContent>
            </Card>
          </div>

          {/* Class-wise Report Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Class-wise Attendance</CardTitle>
              <CardDescription>{format(reportDate, "EEEE, MMMM dd, yyyy")}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : classReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No classes found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Present</TableHead>
                        <TableHead className="text-center">Absent</TableHead>
                        <TableHead className="text-center">Late</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classReports.map((report) => (
                        <TableRow key={report.classId}>
                          <TableCell className="font-medium">
                            {report.className} {report.section ? `- ${report.section}` : ""}
                          </TableCell>
                          <TableCell className="text-center">{report.totalStudents}</TableCell>
                          <TableCell className="text-center text-secondary font-medium">{report.present}</TableCell>
                          <TableCell className="text-center text-destructive font-medium">{report.absent}</TableCell>
                          <TableCell className="text-center text-warning font-medium">{report.late}</TableCell>
                          <TableCell className="text-center">
                            {report.notMarked ? (
                              <Badge variant="outline">Not Marked</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                                <Check className="h-3 w-3 mr-1" /> Marked
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => viewClassDetails(report)}
                                disabled={report.notMarked}
                              >
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => exportClassCSV(report)}
                                disabled={report.notMarked}
                              >
                                <FileSpreadsheet className="h-4 w-4" />
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
        </div>

        {/* Record Attendance Dialog */}
        <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Attendance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              {selectedClass && (
                <>
                  {existingAttendance && (
                    <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                      <Check className="h-3 w-3 mr-1" /> Attendance already marked - editing mode
                    </Badge>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 rounded bg-muted">
                      <p className="text-lg font-bold">{students.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-2 rounded bg-secondary/10">
                      <p className="text-lg font-bold text-secondary">{presentCount}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="text-center p-2 rounded bg-destructive/10">
                      <p className="text-lg font-bold text-destructive">{absentCount}</p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                    <div className="text-center p-2 rounded bg-warning/10">
                      <p className="text-lg font-bold text-warning">{lateCount}</p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={markAllPresent}>
                      Mark All Present
                    </Button>
                    <Button variant="outline" size="sm" onClick={markAllAbsent}>
                      Mark All Absent
                    </Button>
                  </div>

                  {loadingStudents ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No students found in this class
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[400px]">
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
                  )}

                  <div className="flex justify-end">
                    <Button onClick={saveAttendance} disabled={saving || students.length === 0}>
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

              {!selectedClass && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a class to mark attendance</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail View Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {detailClass?.className} {detailClass?.section ? `- ${detailClass.section}` : ""} - Attendance Details
              </DialogTitle>
            </DialogHeader>
            {loadingDetails ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.student?.roll_number || "-"}</TableCell>
                      <TableCell>{record.student?.full_name || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={record.status === "present" ? "secondary" : record.status === "absent" ? "destructive" : "outline"}
                          className={record.status === "present" ? "bg-secondary/10 text-secondary" : record.status === "late" ? "bg-warning/10 text-warning" : ""}
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
};

export default Attendance;
