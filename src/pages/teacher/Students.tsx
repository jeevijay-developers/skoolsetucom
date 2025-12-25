import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users } from "lucide-react";

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface Student {
  id: string;
  full_name: string;
  roll_number: string | null;
  admission_number: string | null;
  gender: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  is_active: boolean;
  classes: { name: string; section: string | null } | null;
}

const TeacherStudents = () => {
  const { schoolId } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      fetchClasses();
      fetchStudents();
    }
  }, [schoolId]);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

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
    let query = supabase
      .from("students")
      .select(`
        id, full_name, roll_number, admission_number, gender, 
        parent_name, parent_phone, is_active,
        classes:class_id (name, section)
      `)
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("full_name");

    if (selectedClass && selectedClass !== "all") {
      query = query.eq("class_id", selectedClass);
    }

    const { data } = await query;
    setStudents(data || []);
    setLoading(false);
  };

  const filteredStudents = students.filter((student) =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admission_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Students - SkoolSetu</title></Helmet>
      <DashboardLayout role="teacher">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Students</h1>
            <p className="text-muted-foreground">View student information</p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full sm:w-48">
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
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students ({filteredStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.roll_number || "-"}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{student.full_name}</p>
                              <p className="text-sm text-muted-foreground">{student.admission_number}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.classes
                              ? `${student.classes.name}${student.classes.section ? ` - ${student.classes.section}` : ""}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.gender || "-"}</Badge>
                          </TableCell>
                          <TableCell>{student.parent_name || "-"}</TableCell>
                          <TableCell>{student.parent_phone || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
};

export default TeacherStudents;
