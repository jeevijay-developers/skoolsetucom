import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sample Indian names
const studentNames = [
  { full_name: "Aarav Sharma", gender: "Male", parent_name: "Rajesh Sharma", mother_name: "Sunita Sharma" },
  { full_name: "Priya Singh", gender: "Female", parent_name: "Vikram Singh", mother_name: "Meera Singh" },
  { full_name: "Rohan Patel", gender: "Male", parent_name: "Amit Patel", mother_name: "Kavita Patel" },
  { full_name: "Ananya Gupta", gender: "Female", parent_name: "Suresh Gupta", mother_name: "Rekha Gupta" },
  { full_name: "Arjun Reddy", gender: "Male", parent_name: "Krishna Reddy", mother_name: "Lakshmi Reddy" },
  { full_name: "Ishita Joshi", gender: "Female", parent_name: "Manoj Joshi", mother_name: "Priya Joshi" },
  { full_name: "Vivaan Kumar", gender: "Male", parent_name: "Sanjay Kumar", mother_name: "Anita Kumar" },
  { full_name: "Diya Verma", gender: "Female", parent_name: "Ramesh Verma", mother_name: "Shanti Verma" },
  { full_name: "Aditya Nair", gender: "Male", parent_name: "Gopal Nair", mother_name: "Kamala Nair" },
  { full_name: "Saanvi Iyer", gender: "Female", parent_name: "Rajan Iyer", mother_name: "Padma Iyer" },
  { full_name: "Krishna Yadav", gender: "Male", parent_name: "Bhagwan Yadav", mother_name: "Geeta Yadav" },
  { full_name: "Myra Kapoor", gender: "Female", parent_name: "Arjun Kapoor", mother_name: "Simran Kapoor" },
  { full_name: "Vihaan Mishra", gender: "Male", parent_name: "Deepak Mishra", mother_name: "Sudha Mishra" },
  { full_name: "Aisha Khan", gender: "Female", parent_name: "Imran Khan", mother_name: "Fatima Khan" },
  { full_name: "Reyansh Jain", gender: "Male", parent_name: "Mahesh Jain", mother_name: "Sunita Jain" },
  { full_name: "Kavya Menon", gender: "Female", parent_name: "Sunil Menon", mother_name: "Maya Menon" },
  { full_name: "Arnav Bose", gender: "Male", parent_name: "Subhash Bose", mother_name: "Rina Bose" },
  { full_name: "Tara Desai", gender: "Female", parent_name: "Jayesh Desai", mother_name: "Hema Desai" },
  { full_name: "Shaurya Chauhan", gender: "Male", parent_name: "Vikas Chauhan", mother_name: "Neha Chauhan" },
  { full_name: "Pari Saxena", gender: "Female", parent_name: "Rohit Saxena", mother_name: "Pooja Saxena" },
  { full_name: "Dhruv Agarwal", gender: "Male", parent_name: "Pankaj Agarwal", mother_name: "Manju Agarwal" },
  { full_name: "Riya Choudhury", gender: "Female", parent_name: "Arun Choudhury", mother_name: "Seema Choudhury" },
  { full_name: "Kabir Malhotra", gender: "Male", parent_name: "Sudhir Malhotra", mother_name: "Rita Malhotra" },
  { full_name: "Avni Thakur", gender: "Female", parent_name: "Rajendra Thakur", mother_name: "Savita Thakur" },
  { full_name: "Yash Bansal", gender: "Male", parent_name: "Naresh Bansal", mother_name: "Kamla Bansal" },
];

const teacherNames = [
  { full_name: "Dr. Meera Krishnan", qualification: "M.Sc., Ph.D.", subjects: ["Mathematics", "Science"] },
  { full_name: "Rajesh Pandey", qualification: "M.A., B.Ed.", subjects: ["Hindi", "Social Studies"] },
  { full_name: "Priya Sharma", qualification: "M.A. English, B.Ed.", subjects: ["English"] },
  { full_name: "Suresh Nair", qualification: "M.Sc., B.Ed.", subjects: ["Science", "Computer"] },
  { full_name: "Anita Gupta", qualification: "M.A., M.Ed.", subjects: ["Social Studies"] },
  { full_name: "Vikram Singh", qualification: "B.P.Ed., M.P.Ed.", subjects: ["Physical Education", "Art"] },
];

const subjects = [
  { name: "Hindi", code: "HIN" },
  { name: "English", code: "ENG" },
  { name: "Mathematics", code: "MAT" },
  { name: "Science", code: "SCI" },
  { name: "Social Studies", code: "SST" },
  { name: "Computer", code: "COM" },
  { name: "Physical Education", code: "PE" },
  { name: "Art & Craft", code: "ART" },
];

const classes = [
  { name: "Class 1", section: "A" },
  { name: "Class 2", section: "A" },
  { name: "Class 3", section: "A" },
  { name: "Class 4", section: "A" },
  { name: "Class 5", section: "A" },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { school_id } = await req.json()

    if (!school_id) {
      return new Response(
        JSON.stringify({ error: 'school_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Seeding trial data for school:', school_id)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Create subjects
    console.log('Creating subjects...')
    const subjectsToInsert = subjects.map(s => ({
      ...s,
      school_id,
      is_active: true
    }))
    
    const { data: createdSubjects, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .insert(subjectsToInsert)
      .select('id, name')

    if (subjectError) {
      console.error('Subject error:', subjectError)
      throw subjectError
    }

    // 2. Create classes
    console.log('Creating classes...')
    const classesToInsert = classes.map(c => ({
      ...c,
      school_id,
      academic_year: '2024-25'
    }))

    const { data: createdClasses, error: classError } = await supabaseAdmin
      .from('classes')
      .insert(classesToInsert)
      .select('id, name')

    if (classError) {
      console.error('Class error:', classError)
      throw classError
    }

    // 3. Create employees and teachers
    console.log('Creating teachers and employees...')
    const createdTeachers: any[] = []

    for (let i = 0; i < teacherNames.length; i++) {
      const teacher = teacherNames[i]
      const empCode = `EMP-${String(i + 1).padStart(3, '0')}`
      const email = `${teacher.full_name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10)}@school.edu`
      const phone = `98765${String(43210 + i).padStart(5, '0')}`
      const salary = 25000 + (i * 5000)

      // Create employee
      const { data: empData, error: empError } = await supabaseAdmin
        .from('employees')
        .insert({
          school_id,
          full_name: teacher.full_name,
          email,
          phone,
          employee_code: empCode,
          category: 'teacher',
          base_salary: salary,
          is_active: true,
          date_of_joining: '2024-04-01'
        })
        .select('id')
        .single()

      if (empError) {
        console.error('Employee error:', empError)
        continue
      }

      // Create teacher
      const { data: teacherData, error: teacherError } = await supabaseAdmin
        .from('teachers')
        .insert({
          school_id,
          full_name: teacher.full_name,
          email,
          phone,
          employee_id: empCode,
          qualification: teacher.qualification,
          subjects: teacher.subjects,
          is_active: true,
          date_of_joining: '2024-04-01'
        })
        .select('id')
        .single()

      if (teacherError) {
        console.error('Teacher error:', teacherError)
        continue
      }

      createdTeachers.push({ ...teacherData, subjects: teacher.subjects, email })
    }

    // 4. Create fee structures
    console.log('Creating fee structures...')
    const feeStructures = [
      { name: 'Tuition Fee', amount: 2500, frequency: 'monthly' },
      { name: 'Computer Fee', amount: 500, frequency: 'monthly' },
      { name: 'Sports Fee', amount: 300, frequency: 'quarterly' },
      { name: 'Annual Fee', amount: 5000, frequency: 'annual' },
    ]

    const { data: createdFees, error: feeError } = await supabaseAdmin
      .from('fee_structures')
      .insert(feeStructures.map(f => ({ ...f, school_id, academic_year: '2024-25' })))
      .select('id, name, amount')

    if (feeError) {
      console.error('Fee structure error:', feeError)
      throw feeError
    }

    // 5. Create students distributed across classes
    console.log('Creating students...')
    const createdStudents: any[] = []

    for (let i = 0; i < studentNames.length; i++) {
      const student = studentNames[i]
      const classIndex = i % createdClasses!.length
      const assignedClass = createdClasses![classIndex]
      const rollNumber = String((i % 5) + 1).padStart(2, '0')
      const admissionNumber = `ADM-2024-${String(i + 1).padStart(4, '0')}`
      const parentPhone = `91${String(9876543210 + i)}`
      const parentEmail = `parent.${student.full_name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8)}@gmail.com`

      const { data: studentData, error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          school_id,
          full_name: student.full_name,
          gender: student.gender,
          parent_name: student.parent_name,
          mother_name: student.mother_name,
          parent_phone: parentPhone,
          parent_email: parentEmail,
          class_id: assignedClass.id,
          roll_number: rollNumber,
          admission_number: admissionNumber,
          is_active: true,
          date_of_birth: `${2014 + classIndex}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`
        })
        .select('id, class_id')
        .single()

      if (studentError) {
        console.error('Student error:', studentError)
        continue
      }

      createdStudents.push(studentData)
    }

    // 6. Create student fees (mix of paid, pending, partial)
    console.log('Creating student fees...')
    const today = new Date()
    const studentFees: any[] = []

    for (const student of createdStudents) {
      for (const fee of createdFees!) {
        const randomStatus = Math.random()
        let status = 'pending'
        let paidAmount = 0
        let paidAt = null

        if (randomStatus < 0.5) {
          // 50% fully paid
          status = 'paid'
          paidAmount = fee.amount
          paidAt = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        } else if (randomStatus < 0.7) {
          // 20% partial
          status = 'partial'
          paidAmount = Math.floor(fee.amount * (0.3 + Math.random() * 0.4))
          paidAt = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }
        // 30% pending

        const dueDate = new Date(today.getTime() + (Math.random() * 60 - 30) * 24 * 60 * 60 * 1000)

        studentFees.push({
          school_id,
          student_id: student.id,
          fee_structure_id: fee.id,
          amount: fee.amount,
          paid_amount: paidAmount,
          status,
          due_date: dueDate.toISOString().split('T')[0],
          paid_at: paidAt
        })
      }
    }

    const { error: studentFeeError } = await supabaseAdmin
      .from('student_fees')
      .insert(studentFees)

    if (studentFeeError) {
      console.error('Student fee error:', studentFeeError)
    }

    // 7. Create attendance records (last 7 days)
    console.log('Creating attendance records...')
    const attendanceRecords: any[] = []

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today)
      date.setDate(date.getDate() - dayOffset)
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue

      for (const student of createdStudents) {
        // 85% present, 10% absent, 5% late
        const random = Math.random()
        let status = 'present'
        if (random > 0.95) {
          status = 'late'
        } else if (random > 0.85) {
          status = 'absent'
        }

        attendanceRecords.push({
          school_id,
          student_id: student.id,
          class_id: student.class_id,
          date: date.toISOString().split('T')[0],
          status
        })
      }
    }

    const { error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .insert(attendanceRecords)

    if (attendanceError) {
      console.error('Attendance error:', attendanceError)
    }

    // 8. Create sample exam with results
    console.log('Creating exam and results...')
    const { data: examData, error: examError } = await supabaseAdmin
      .from('exams')
      .insert({
        school_id,
        name: 'Unit Test 1',
        exam_type: 'unit_test',
        academic_year: '2024-25',
        start_date: '2024-07-15',
        end_date: '2024-07-20',
        is_published: true
      })
      .select('id')
      .single()

    if (examError) {
      console.error('Exam error:', examError)
    } else {
      // Create exam results for each student
      const examResults: any[] = []
      const examSubjects = ['Hindi', 'English', 'Mathematics', 'Science', 'Social Studies']

      for (const student of createdStudents) {
        for (const subject of examSubjects) {
          const maxMarks = 100
          const obtainedMarks = Math.floor(40 + Math.random() * 55) // 40-95 marks
          let grade = 'F'
          if (obtainedMarks >= 90) grade = 'A+'
          else if (obtainedMarks >= 80) grade = 'A'
          else if (obtainedMarks >= 70) grade = 'B+'
          else if (obtainedMarks >= 60) grade = 'B'
          else if (obtainedMarks >= 50) grade = 'C'
          else if (obtainedMarks >= 40) grade = 'D'

          examResults.push({
            exam_id: examData.id,
            student_id: student.id,
            subject,
            max_marks: maxMarks,
            obtained_marks: obtainedMarks,
            grade
          })
        }
      }

      const { error: resultError } = await supabaseAdmin
        .from('exam_results')
        .insert(examResults)

      if (resultError) {
        console.error('Result error:', resultError)
      }
    }

    // 9. Create sample notices
    console.log('Creating notices...')
    const notices = [
      {
        school_id,
        title: 'Welcome to the New Academic Year',
        content: 'We are excited to welcome all students and parents to the new academic session 2024-25. Classes will commence from April 1st, 2024.',
        target_audience: 'all',
        is_published: true
      },
      {
        school_id,
        title: 'Parent-Teacher Meeting',
        content: 'A Parent-Teacher Meeting is scheduled for next Saturday at 10 AM. All parents are requested to attend and discuss their ward\'s progress.',
        target_audience: 'parents',
        is_published: true
      },
      {
        school_id,
        title: 'Sports Day Announcement',
        content: 'Annual Sports Day will be held on the last Saturday of this month. Students are requested to practice for their respective events.',
        target_audience: 'students',
        is_published: true
      }
    ]

    const { error: noticeError } = await supabaseAdmin
      .from('notices')
      .insert(notices)

    if (noticeError) {
      console.error('Notice error:', noticeError)
    }

    // 10. Create payroll records for current month
    console.log('Creating payroll records...')
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()

    const { data: employees } = await supabaseAdmin
      .from('employees')
      .select('id, base_salary')
      .eq('school_id', school_id)

    if (employees) {
      const payrollRecords = employees.map((emp, index) => {
        const allowances = Math.floor(emp.base_salary * 0.1)
        const deductions = Math.floor(emp.base_salary * 0.05)
        const netSalary = emp.base_salary + allowances - deductions
        const isPaid = index % 2 === 0

        return {
          school_id,
          employee_id: emp.id,
          month: currentMonth,
          year: currentYear,
          basic_salary: emp.base_salary,
          allowances,
          deductions,
          net_salary: netSalary,
          status: isPaid ? 'paid' : 'pending',
          paid_at: isPaid ? today.toISOString() : null,
          payment_mode: isPaid ? 'bank_transfer' : null
        }
      })

      const { error: payrollError } = await supabaseAdmin
        .from('payroll')
        .insert(payrollRecords)

      if (payrollError) {
        console.error('Payroll error:', payrollError)
      }
    }

    // 11. Create default leave types
    console.log('Creating leave types...')
    const defaultLeaveTypes = [
      { name: 'Casual Leave', description: 'For personal or urgent matters', max_days_per_year: 12, is_paid: true },
      { name: 'Sick Leave', description: 'For illness or medical reasons', max_days_per_year: 10, is_paid: true },
      { name: 'Earned Leave', description: 'Accumulated privilege leave', max_days_per_year: 15, is_paid: true },
      { name: 'Maternity Leave', description: 'For maternity purposes', max_days_per_year: 180, is_paid: true },
      { name: 'Unpaid Leave', description: 'Leave without pay', max_days_per_year: 30, is_paid: false },
    ]

    const { error: leaveTypeError } = await supabaseAdmin
      .from('leave_types')
      .insert(defaultLeaveTypes.map(lt => ({ ...lt, school_id, is_active: true })))

    if (leaveTypeError) {
      console.error('Leave type error:', leaveTypeError)
    }

    console.log('Trial data seeding completed successfully!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Trial data seeded successfully',
        summary: {
          subjects: createdSubjects?.length || 0,
          classes: createdClasses?.length || 0,
          teachers: createdTeachers.length,
          students: createdStudents.length,
          feeStructures: createdFees?.length || 0
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
