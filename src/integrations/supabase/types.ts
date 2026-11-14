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
          id: string
          notes: string | null
          recorded_at: string
          recorded_by: string | null
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          user_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          user_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          course_id: string
          created_at: string
          ends_at: string | null
          id: string
          location: string | null
          notes: string | null
          starts_at: string
          topic: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          starts_at: string
          topic?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          starts_at?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          duration: string | null
          id: string
          level: Database["public"]["Enums"]["course_level"]
          price: number
          status: Database["public"]["Enums"]["course_status"]
          tags: string[] | null
          theme_colors: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          level?: Database["public"]["Enums"]["course_level"]
          price?: number
          status?: Database["public"]["Enums"]["course_status"]
          tags?: string[] | null
          theme_colors?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          level?: Database["public"]["Enums"]["course_level"]
          price?: number
          status?: Database["public"]["Enums"]["course_status"]
          tags?: string[] | null
          theme_colors?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image: string
          order_num: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image: string
          order_num?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image?: string
          order_num?: number
        }
        Relationships: []
      }
      landing_content: {
        Row: {
          about: Json
          contact: Json
          courses_section: Json
          hero: Json
          id: string
          social_links: Json
          theme_colors: Json | null
          updated_at: string
        }
        Insert: {
          about?: Json
          contact?: Json
          courses_section?: Json
          hero?: Json
          id?: string
          social_links?: Json
          theme_colors?: Json | null
          updated_at?: string
        }
        Update: {
          about?: Json
          contact?: Json
          courses_section?: Json
          hero?: Json
          id?: string
          social_links?: Json
          theme_colors?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string
          course_id: string
          id: string
          last_accessed_at: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          id?: string
          last_accessed_at?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          id?: string
          last_accessed_at?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attachments: Json | null
          content: string | null
          created_at: string
          duration: string | null
          id: string
          is_required: boolean
          module_id: string
          order_num: number
          thumbnail: string | null
          title: string
          type: Database["public"]["Enums"]["lesson_type"]
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          is_required?: boolean
          module_id: string
          order_num?: number
          thumbnail?: string | null
          title: string
          type?: Database["public"]["Enums"]["lesson_type"]
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          is_required?: boolean
          module_id?: string
          order_num?: number
          thumbnail?: string | null
          title?: string
          type?: Database["public"]["Enums"]["lesson_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_num: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_num?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_num?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string
          device_type: string | null
          id: string
          page_path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: string
          page_path?: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          course_id: string | null
          course_title: string | null
          created_at: string
          created_by: string | null
          enrollment_id: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string
          reference: string | null
          student_name: string | null
          user_id: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          reference?: string | null
          student_name?: string | null
          user_id?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          reference?: string | null
          student_name?: string | null
          user_id?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image: string | null
          name: string
          order_num: number
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name: string
          order_num?: number
          price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          name?: string
          order_num?: number
          price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          enabled_from: string
          expires_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          enabled_from?: string
          expires_at?: string
          id: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          enabled_from?: string
          expires_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      section_clicks: {
        Row: {
          created_at: string
          element_label: string | null
          element_type: string
          id: string
          section_name: string
          session_id: string
        }
        Insert: {
          created_at?: string
          element_label?: string | null
          element_type: string
          id?: string
          section_name: string
          session_id: string
        }
        Update: {
          created_at?: string
          element_label?: string | null
          element_type?: string
          id?: string
          section_name?: string
          session_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration: string | null
          id: string
          image: string | null
          name: string
          order_num: number
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          image?: string | null
          name: string
          order_num?: number
          price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          image?: string | null
          name?: string
          order_num?: number
          price?: number
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar: string | null
          content: string
          created_at: string
          id: string
          name: string
          order_num: number
          rating: number
        }
        Insert: {
          avatar?: string | null
          content: string
          created_at?: string
          id?: string
          name: string
          order_num?: number
          rating?: number
        }
        Update: {
          avatar?: string | null
          content?: string
          created_at?: string
          id?: string
          name?: string
          order_num?: number
          rating?: number
        }
        Relationships: []
      }
      user_course_assignments: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          agreed_price: number
          assigned_at: string
          course_id: string
          enabled_from: string | null
          expires_at: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          status_changed_at: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          agreed_price?: number | null
          assigned_at?: string
          course_id: string
          enabled_from?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          status_changed_at?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          agreed_price?: number
          assigned_at?: string
          course_id?: string
          enabled_from?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          status_changed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_student_enrollments: {
        Args: { _items: Json; _user_id: string }
        Returns: undefined
      }
      course_outline_counts: {
        Args: never
        Returns: {
          course_id: string
          lesson_count: number
          module_count: number
        }[]
      }
      has_course_access: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "superadmin" | "student"
      attendance_status: "present" | "absent" | "late" | "excused"
      course_level: "beginner" | "intermediate" | "advanced"
      course_status: "published" | "draft" | "archived"
      enrollment_status: "pending" | "active" | "suspended" | "cancelled"
      lesson_type: "video" | "pdf" | "text" | "image" | "link" | "quiz"
      payment_method:
        | "cash"
        | "transfer"
        | "card"
        | "nequi"
        | "daviplata"
        | "other"
      user_status: "active" | "inactive" | "suspended"
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
      app_role: ["superadmin", "student"],
      attendance_status: ["present", "absent", "late", "excused"],
      course_level: ["beginner", "intermediate", "advanced"],
      course_status: ["published", "draft", "archived"],
      enrollment_status: ["pending", "active", "suspended", "cancelled"],
      lesson_type: ["video", "pdf", "text", "image", "link", "quiz"],
      payment_method: [
        "cash",
        "transfer",
        "card",
        "nequi",
        "daviplata",
        "other",
      ],
      user_status: ["active", "inactive", "suspended"],
    },
  },
} as const
