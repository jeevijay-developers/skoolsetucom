export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string | null
          remarks: string | null
          school_id: string
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          school_id: string
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          school_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          academic_year: string | null
          class_id: string
          created_at: string
          id: string
          school_id: string
          subject_id: string
          teacher_id: string | null
        }
        Insert: {
          academic_year?: string | null
          class_id: string
          created_at?: string
          id?: string
          school_id: string
          subject_id: string
          teacher_id?: string | null
        }
        Update: {
          academic_year?: string | null
          class_id?: string
          created_at?: string
          id?: string
          school_id?: string
          subject_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          class_teacher_id: string | null
          created_at: string
          id: string
          name: string
          school_id: string
          section: string | null
        }
        Insert: {
          academic_year?: string
          class_teacher_id?: string | null
          created_at?: string
          id?: string
          name: string
          school_id: string
          section?: string | null
        }
        Update: {
          academic_year?: string
          class_teacher_id?: string | null
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          base_salary: number | null
          category: string
          created_at: string
          date_of_joining: string | null
          email: string | null
          employee_code: string | null
          full_name: string
          id: string
          ifsc_code: string | null
          is_active: boolean | null
          phone: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          base_salary?: number | null
          category?: string
          created_at?: string
          date_of_joining?: string | null
          email?: string | null
          employee_code?: string | null
          full_name: string
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          phone?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          base_salary?: number | null
          category?: string
          created_at?: string
          date_of_joining?: string | null
          email?: string | null
          employee_code?: string | null
          full_name?: string
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          phone?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          created_at: string
          exam_id: string
          grade: string | null
          id: string
          max_marks: number
          obtained_marks: number
          remarks: string | null
          student_id: string
          subject: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          grade?: string | null
          id?: string
          max_marks: number
          obtained_marks: number
          remarks?: string | null
          student_id: string
          subject: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          grade?: string | null
          id?: string
          max_marks?: number
          obtained_marks?: number
          remarks?: string | null
          student_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_schedules: {
        Row: {
          class_id: string
          created_at: string
          end_time: string | null
          exam_date: string
          exam_id: string
          id: string
          max_marks: number | null
          school_id: string
          start_time: string | null
          subject: string
        }
        Insert: {
          class_id: string
          created_at?: string
          end_time?: string | null
          exam_date: string
          exam_id: string
          id?: string
          max_marks?: number | null
          school_id: string
          start_time?: string | null
          subject: string
        }
        Update: {
          class_id?: string
          created_at?: string
          end_time?: string | null
          exam_date?: string
          exam_id?: string
          id?: string
          max_marks?: number | null
          school_id?: string
          start_time?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedules_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          academic_year: string | null
          created_at: string
          end_date: string | null
          exam_type: string | null
          id: string
          is_published: boolean | null
          name: string
          school_id: string
          start_date: string | null
        }
        Insert: {
          academic_year?: string | null
          created_at?: string
          end_date?: string | null
          exam_type?: string | null
          id?: string
          is_published?: boolean | null
          name: string
          school_id: string
          start_date?: string | null
        }
        Update: {
          academic_year?: string | null
          created_at?: string
          end_date?: string | null
          exam_type?: string | null
          id?: string
          is_published?: boolean | null
          name?: string
          school_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_discount_authorities: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          is_active: boolean | null
          max_discount_percent: number | null
          school_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          is_active?: boolean | null
          max_discount_percent?: number | null
          school_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          is_active?: boolean | null
          max_discount_percent?: number | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_discount_authorities_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_discount_authorities_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_reminders: {
        Row: {
          id: string
          message: string | null
          reminder_type: string | null
          school_id: string
          sent_at: string
          status: string | null
          student_fee_id: string
        }
        Insert: {
          id?: string
          message?: string | null
          reminder_type?: string | null
          school_id: string
          sent_at?: string
          status?: string | null
          student_fee_id: string
        }
        Update: {
          id?: string
          message?: string | null
          reminder_type?: string | null
          school_id?: string
          sent_at?: string
          status?: string | null
          student_fee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_reminders_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_reminders_student_fee_id_fkey"
            columns: ["student_fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year: string | null
          amount: number
          class_id: string | null
          created_at: string
          frequency: string | null
          id: string
          name: string
          school_id: string
        }
        Insert: {
          academic_year?: string | null
          amount: number
          class_id?: string | null
          created_at?: string
          frequency?: string | null
          id?: string
          name: string
          school_id: string
        }
        Update: {
          academic_year?: string | null
          amount?: number
          class_id?: string | null
          created_at?: string
          frequency?: string | null
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      greetings: {
        Row: {
          created_at: string
          created_by: string | null
          custom_message: string | null
          festival_name: string
          id: string
          image_url: string | null
          is_active: boolean | null
          school_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custom_message?: string | null
          festival_name: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          school_id: string
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custom_message?: string | null
          festival_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          school_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "greetings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_settings: {
        Row: {
          authorized_name: string | null
          created_at: string
          default_template: string | null
          id: string
          school_id: string
          signature_url: string | null
          updated_at: string
        }
        Insert: {
          authorized_name?: string | null
          created_at?: string
          default_template?: string | null
          id?: string
          school_id: string
          signature_url?: string | null
          updated_at?: string
        }
        Update: {
          authorized_name?: string | null
          created_at?: string
          default_template?: string | null
          id?: string
          school_id?: string
          signature_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          school_id: string
          target_audience: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          school_id: string
          target_audience?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          school_id?: string
          target_audience?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          receipt_url: string | null
          school_id: string
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          allowances: number | null
          basic_salary: number
          created_at: string
          deductions: number | null
          employee_id: string
          id: string
          month: number
          net_salary: number
          paid_at: string | null
          payment_mode: string | null
          remarks: string | null
          school_id: string
          status: string | null
          year: number
        }
        Insert: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          deductions?: number | null
          employee_id: string
          id?: string
          month: number
          net_salary?: number
          paid_at?: string | null
          payment_mode?: string | null
          remarks?: string | null
          school_id: string
          status?: string | null
          year: number
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          deductions?: number | null
          employee_id?: string
          id?: string
          month?: number
          net_salary?: number
          paid_at?: string | null
          payment_mode?: string | null
          remarks?: string | null
          school_id?: string
          status?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string | null
          board: string | null
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          pincode: string | null
          principal_name: string | null
          state: string | null
          student_count: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          board?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          pincode?: string | null
          principal_name?: string | null
          state?: string | null
          student_count?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          board?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          pincode?: string | null
          principal_name?: string | null
          state?: string | null
          student_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      student_fees: {
        Row: {
          amount: number
          collected_by: string | null
          created_at: string
          discount_amount: number | null
          discount_authorized_by: string | null
          discount_reason: string | null
          due_date: string
          fee_structure_id: string | null
          id: string
          paid_amount: number | null
          paid_at: string | null
          payment_mode: string | null
          payment_screenshot_url: string | null
          receipt_number: string | null
          school_id: string
          status: string | null
          student_id: string
        }
        Insert: {
          amount: number
          collected_by?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_authorized_by?: string | null
          discount_reason?: string | null
          due_date: string
          fee_structure_id?: string | null
          id?: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_mode?: string | null
          payment_screenshot_url?: string | null
          receipt_number?: string | null
          school_id: string
          status?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          collected_by?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_authorized_by?: string | null
          discount_reason?: string | null
          due_date?: string
          fee_structure_id?: string | null
          id?: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_mode?: string | null
          payment_screenshot_url?: string | null
          receipt_number?: string | null
          school_id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fees_discount_authorized_by_fkey"
            columns: ["discount_authorized_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_number: string | null
          blood_group: string | null
          class_id: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          mother_name: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_user_id: string | null
          photo_url: string | null
          roll_number: string | null
          school_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_number?: string | null
          blood_group?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          mother_name?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_user_id?: string | null
          photo_url?: string | null
          roll_number?: string | null
          school_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_number?: string | null
          blood_group?: string | null
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          mother_name?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_user_id?: string | null
          photo_url?: string | null
          roll_number?: string | null
          school_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          school_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          school_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          coupon_code: string | null
          created_at: string
          discount_amount: number | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          school_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          subscription_end_date: string | null
          subscription_start_date: string | null
          trial_end_date: string
          trial_start_date: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          school_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          trial_end_date?: string
          trial_start_date?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          school_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          trial_end_date?: string
          trial_start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_classes: {
        Row: {
          class_id: string
          created_at: string
          id: string
          is_class_teacher: boolean | null
          school_id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          is_class_teacher?: boolean | null
          school_id: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          is_class_teacher?: boolean | null
          school_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          date_of_joining: string | null
          email: string | null
          employee_id: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          qualification: string | null
          school_id: string
          subjects: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date_of_joining?: string | null
          email?: string | null
          employee_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          qualification?: string | null
          school_id: string
          subjects?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date_of_joining?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          qualification?: string | null
          school_id?: string
          subjects?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_school_registration: {
        Args: {
          _address?: string
          _board: string
          _city: string
          _pincode?: string
          _principal_name?: string
          _school_email: string
          _school_name: string
          _school_phone: string
          _state: string
          _student_count?: number
        }
        Returns: Json
      }
      create_parent_login: {
        Args: { p_student_id: string; p_temp_password: string }
        Returns: Json
      }
      get_user_school_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_school: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "school_admin"
        | "teacher"
        | "student"
        | "parent"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      subscription_plan: "basic" | "pro"
      subscription_status: "trial" | "active" | "expired" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "school_admin", "teacher", "student", "parent"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      subscription_plan: ["basic", "pro"],
      subscription_status: ["trial", "active", "expired", "cancelled"],
    },
  },
} as const
