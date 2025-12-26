// Utility functions for exporting data to CSV

export const exportToCSV = (data: Record<string, any>[], filename: string, headers?: string[]) => {
  if (!data || data.length === 0) {
    return false;
  }

  // Use provided headers or extract from first row
  const keys = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    keys.join(","),
    ...data.map(row => 
      keys.map(key => {
        let value = row[key];
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          value = "";
        }
        
        // Convert to string
        value = String(value);
        
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(",")
    )
  ].join("\n");

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  
  return true;
};

// Helper to format student data for export
export const formatStudentsForExport = (students: any[]) => {
  return students.map(s => ({
    "Student Name": s.full_name,
    "Roll Number": s.roll_number || "-",
    "Admission Number": s.admission_number || "-",
    "Class": s.classes ? `${s.classes.name}${s.classes.section ? ` - ${s.classes.section}` : ""}` : "-",
    "Parent Name": s.parent_name || "-",
    "Parent Phone": s.parent_phone || "-",
    "Parent Email": s.parent_email || "-",
    "Gender": s.gender || "-",
    "Date of Birth": s.date_of_birth || "-",
    "Status": s.is_active ? "Active" : "Inactive",
  }));
};

// Helper to format teachers data for export
export const formatTeachersForExport = (teachers: any[]) => {
  return teachers.map(t => ({
    "Teacher Name": t.full_name,
    "Email": t.email || "-",
    "Phone": t.phone || "-",
    "Employee ID": t.employee_id || "-",
    "Qualification": t.qualification || "-",
    "Subjects": t.subjects?.join(", ") || "-",
    "Date of Joining": t.date_of_joining || "-",
    "Status": t.is_active ? "Active" : "Inactive",
  }));
};

// Helper to format employees data for export
export const formatEmployeesForExport = (employees: any[]) => {
  return employees.map(e => ({
    "Employee Name": e.full_name,
    "Category": e.category?.replace("_", " ") || "-",
    "Employee Code": e.employee_code || "-",
    "Phone": e.phone || "-",
    "Email": e.email || "-",
    "Base Salary": e.base_salary || 0,
    "Date of Joining": e.date_of_joining || "-",
    "Status": e.is_active ? "Active" : "Inactive",
  }));
};

// Helper to format classes data for export
export const formatClassesForExport = (classes: any[], studentCounts: Record<string, number>, teachers: any[]) => {
  return classes.map(c => ({
    "Class Name": c.name,
    "Section": c.section || "-",
    "Academic Year": c.academic_year || "-",
    "Class Teacher": teachers.find(t => t.id === c.class_teacher_id)?.full_name || "-",
    "Student Count": studentCounts[c.id] || 0,
  }));
};

// Helper to format payroll data for export
export const formatPayrollForExport = (payroll: any[]) => {
  return payroll.map(p => ({
    "Employee Name": p.employee?.full_name || "-",
    "Category": p.employee?.category?.replace("_", " ") || "-",
    "Basic Salary": p.basic_salary,
    "Allowances": p.allowances,
    "Deductions": p.deductions,
    "Net Salary": p.net_salary,
    "Status": p.status === "paid" ? "Paid" : "Pending",
    "Paid Date": p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "-",
  }));
};

// Helper to format fees data for export
export const formatFeesForExport = (fees: any[]) => {
  return fees.map(f => ({
    "Student Name": f.students?.full_name || "-",
    "Class": f.students?.classes ? `${f.students.classes.name}${f.students.classes.section ? ` - ${f.students.classes.section}` : ""}` : "-",
    "Total Amount": f.amount,
    "Paid Amount": f.paid_amount || 0,
    "Pending Amount": f.amount - (f.paid_amount || 0),
    "Due Date": f.due_date || "-",
    "Status": f.status || "pending",
    "Receipt Number": f.receipt_number || "-",
    "Paid Date": f.paid_at ? new Date(f.paid_at).toLocaleDateString() : "-",
  }));
};

// Helper to format notices data for export
export const formatNoticesForExport = (notices: any[]) => {
  return notices.map(n => ({
    "Title": n.title,
    "Content": n.content,
    "Target Audience": n.target_audience || "all",
    "Status": n.is_published ? "Published" : "Draft",
    "Created Date": n.created_at ? new Date(n.created_at).toLocaleDateString() : "-",
  }));
};

// Helper to format exams data for export
export const formatExamsForExport = (exams: any[]) => {
  return exams.map(e => ({
    "Exam Name": e.name,
    "Type": e.exam_type || "-",
    "Academic Year": e.academic_year || "-",
    "Start Date": e.start_date || "-",
    "End Date": e.end_date || "-",
    "Status": e.is_published ? "Published" : "Draft",
  }));
};

// Helper to format exam results for export
export const formatExamResultsForExport = (results: any[]) => {
  return results.map(r => ({
    "Student Name": r.students?.full_name || "-",
    "Roll Number": r.students?.roll_number || "-",
    "Class": r.students?.classes ? `${r.students.classes.name}${r.students.classes.section ? ` - ${r.students.classes.section}` : ""}` : "-",
    "Subject": r.subject,
    "Max Marks": r.max_marks,
    "Obtained Marks": r.obtained_marks,
    "Grade": r.grade || "-",
    "Percentage": `${((r.obtained_marks / r.max_marks) * 100).toFixed(1)}%`,
  }));
};
