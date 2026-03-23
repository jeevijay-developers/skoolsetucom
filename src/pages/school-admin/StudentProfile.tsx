import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, User, Phone, Mail, MapPin, Heart, School, Calendar, DollarSign, BookOpen, ClipboardList } from "lucide-react";

interface StudentProfile {
  id: string;
  full_name: string;
  roll_number: string | null;
  admission_number: string | null;
  class_id: string | null;
  parent_name: string | null;
  mother_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  blood_group: string | null;
  photo_url: string | null;
  is_active: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  medical_notes: string | null;
  previous_school: string | null;
  nationality: string | null;
  classes?: { name: string; section: string | null } | null;
}

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { schoolId } = useAuth();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);

  useEffect(() => {
    if (id && schoolId) fetchAll();
  }, [id, schoolId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [studentRes, feesRes, attendanceRes, resultsRes, promoRes] = await Promise.all([
        supabase
          .from("students")
          .select("*, classes:class_id (name, section)")
          .eq("id", id!)
          .eq("school_id", schoolId!)
          .single(),
        supabase
          .from("student_fees")
          .select("id, amount, paid_amount, status, due_date, fee_structures:fee_structure_id (name)")
          .eq("student_id", id!)
          .order("due_date", { ascending: false }),
        supabase
          .from("attendance")
          .select("date, status")
          .eq("student_id", id!)
          .order("date", { ascending: false })
          .limit(60),
        supabase
          .from("exam_results")
          .select("id, subject, obtained_marks, max_marks, grade, exams:exam_id (name, exam_type)")
          .eq("student_id", id!)
          .order("created_at", { ascending: false }),
        supabase
          .from("student_promotions")
          .select("*, from_class:from_class_id (name, section), to_class:to_class_id (name, section)")
          .eq("student_id", id!)
          .order("created_at", { ascending: false }),
      ]);

      if (studentRes.error) throw studentRes.error;
      setStudent(studentRes.data as unknown as StudentProfile);
      setFees(feesRes.data || []);
      setAttendance(attendanceRes.data || []);
      setExamResults(resultsRes.data || []);
      setPromotions(promoRes.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load student profile");
    } finally {
      setLoading(false);
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );

  const attendanceSummary = () => {
    const total = attendance.length;
    const present = attendance.filter(a => a.status === "present").length;
    return { total, present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  const feeSummary = () => {
    const total = fees.reduce((s, f) => s + f.amount, 0);
    const paid = fees.reduce((s, f) => s + (f.paid_amount || 0), 0);
    return { total, paid, pending: total - paid };
  };

  if (loading) {
    return (
      <DashboardLayout role="school_admin">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout role="school_admin">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Student not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/school-admin/students")}>
            Back to Students
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const att = attendanceSummary();
  const fee = feeSummary();

  return (
    <>
      <Helmet>
        <title>{student.full_name} - Student Profile - SkoolSetu</title>
      </Helmet>
      <DashboardLayout role="school_admin">
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate("/school-admin/students")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Students
          </Button>

          {/* Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={student.photo_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {student.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold">{student.full_name}</h1>
                    <Badge variant={student.is_active ? "default" : "destructive"}>
                      {student.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {student.classes && (
                      <span className="flex items-center gap-1">
                        <School className="h-4 w-4" />
                        {student.classes.name}{student.classes.section ? ` - ${student.classes.section}` : ""}
                      </span>
                    )}
                    {student.roll_number && <span>Roll: {student.roll_number}</span>}
                    {student.admission_number && <span>Adm: {student.admission_number}</span>}
                  </div>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">{att.percentage}%</p>
                      <p className="text-xs text-muted-foreground">Attendance</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">₹{fee.paid.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Fees Paid</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-destructive">₹{fee.pending.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Fees Pending</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">{examResults.length}</p>
                      <p className="text-xs text-muted-foreground">Exam Results</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="personal">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="guardian">Guardian</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="academics">Academics</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
                  <CardContent>
                    <InfoRow label="Full Name" value={student.full_name} />
                    <InfoRow label="Gender" value={student.gender} />
                    <InfoRow label="Date of Birth" value={student.date_of_birth} />
                    <InfoRow label="Blood Group" value={student.blood_group} />
                    <InfoRow label="Nationality" value={student.nationality} />
                    <InfoRow label="Address" value={student.address} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Additional Details</CardTitle></CardHeader>
                  <CardContent>
                    <InfoRow label="Previous School" value={student.previous_school} />
                    <InfoRow label="Medical Notes" value={student.medical_notes} />
                    <InfoRow label="Emergency Contact" value={student.emergency_contact_name} />
                    <InfoRow label="Emergency Phone" value={student.emergency_contact_phone} />
                    <InfoRow label="Emergency Relation" value={student.emergency_contact_relation} />
                  </CardContent>
                </Card>
              </div>

              {/* Promotion History */}
              {promotions.length > 0 && (
                <Card className="mt-6">
                  <CardHeader><CardTitle className="text-base">Promotion History</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {promotions.map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.from_class?.name}{p.from_class?.section ? ` - ${p.from_class.section}` : ""}</TableCell>
                            <TableCell>{p.to_class?.name}{p.to_class?.section ? ` - ${p.to_class.section}` : ""}</TableCell>
                            <TableCell>{p.academic_year_from} → {p.academic_year_to}</TableCell>
                            <TableCell>
                              <Badge variant={p.promotion_type === "promoted" ? "default" : p.promotion_type === "detained" ? "destructive" : "secondary"}>
                                {p.promotion_type}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="guardian">
              <Card>
                <CardHeader><CardTitle className="text-base">Guardian Information</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <InfoRow label="Father's Name" value={student.parent_name} />
                      <InfoRow label="Mother's Name" value={student.mother_name} />
                      <InfoRow label="Phone" value={student.parent_phone} />
                      <InfoRow label="Email" value={student.parent_email} />
                    </div>
                    <div>
                      <InfoRow label="Emergency Contact" value={student.emergency_contact_name} />
                      <InfoRow label="Emergency Phone" value={student.emergency_contact_phone} />
                      <InfoRow label="Relation" value={student.emergency_contact_relation} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fee Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {fees.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No fee records found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fee Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fees.map((f: any) => (
                          <TableRow key={f.id}>
                            <TableCell>{f.fee_structures?.name || "—"}</TableCell>
                            <TableCell>₹{f.amount.toLocaleString()}</TableCell>
                            <TableCell>₹{(f.paid_amount || 0).toLocaleString()}</TableCell>
                            <TableCell>{new Date(f.due_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={f.status === "paid" ? "default" : f.status === "overdue" ? "destructive" : "secondary"}>
                                {f.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attendance (Last 60 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  {attendance.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No attendance records found</p>
                  ) : (
                    <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                      {attendance.map((a: any, i: number) => (
                        <div
                          key={i}
                          className={`text-center p-2 rounded text-xs ${
                            a.status === "present"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : a.status === "absent"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                          title={`${a.date}: ${a.status}`}
                        >
                          {new Date(a.date).getDate()}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academics">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Exam Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {examResults.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No exam results found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exam</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {examResults.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.exams?.name || "—"}</TableCell>
                            <TableCell>{r.subject}</TableCell>
                            <TableCell>{r.obtained_marks}/{r.max_marks}</TableCell>
                            <TableCell>{r.grade || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </>
  );
};

export default StudentProfilePage;
