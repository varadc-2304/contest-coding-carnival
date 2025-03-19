export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      contest_instructions: {
        Row: {
          contest_id: string | null
          id: string
          instruction: string
          position: number
        }
        Insert: {
          contest_id?: string | null
          id?: string
          instruction: string
          position: number
        }
        Update: {
          contest_id?: string | null
          id?: string
          instruction?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "contest_instructions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contests: {
        Row: {
          created_at: string | null
          description: string
          duration: number
          id: string
          name: string
          question_count: number
        }
        Insert: {
          created_at?: string | null
          description: string
          duration: number
          id: string
          name: string
          question_count: number
        }
        Update: {
          created_at?: string | null
          description?: string
          duration?: number
          id?: string
          name?: string
          question_count?: number
        }
        Relationships: []
      }
      participations: {
        Row: {
          contest_id: string | null
          end_time: string | null
          id: string
          is_active: boolean | null
          start_time: string
          user_id: string | null
        }
        Insert: {
          contest_id?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          start_time: string
          user_id?: string | null
        }
        Update: {
          contest_id?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          start_time?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participations_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      question_constraints: {
        Row: {
          constraint_text: string
          id: string
          position: number
          question_id: string | null
        }
        Insert: {
          constraint_text: string
          id?: string
          position: number
          question_id?: string | null
        }
        Update: {
          constraint_text?: string
          id?: string
          position?: number
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_constraints_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_examples: {
        Row: {
          explanation: string | null
          id: string
          input: string
          output: string
          position: number
          question_id: string | null
        }
        Insert: {
          explanation?: string | null
          id?: string
          input: string
          output: string
          position: number
          question_id?: string | null
        }
        Update: {
          explanation?: string | null
          id?: string
          input?: string
          output?: string
          position?: number
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_examples_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          contest_id: string | null
          description: string
          difficulty: string
          id: string
          position: number
          title: string
        }
        Insert: {
          contest_id?: string | null
          description: string
          difficulty: string
          id?: string
          position: number
          title: string
        }
        Update: {
          contest_id?: string | null
          description?: string
          difficulty?: string
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          code: string
          contest_id: string | null
          created_at: string | null
          execution_time: number | null
          id: string
          language: string
          memory_used: number | null
          question_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          code: string
          contest_id?: string | null
          created_at?: string | null
          execution_time?: number | null
          id?: string
          language: string
          memory_used?: number | null
          question_id?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          code?: string
          contest_id?: string | null
          created_at?: string | null
          execution_time?: number | null
          id?: string
          language?: string
          memory_used?: number | null
          question_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          expected_output: string
          id: string
          input: string
          is_sample: boolean | null
          position: number
          question_id: string | null
        }
        Insert: {
          expected_output: string
          id?: string
          input: string
          is_sample?: boolean | null
          position: number
          question_id?: string | null
        }
        Update: {
          expected_output?: string
          id?: string
          input?: string
          is_sample?: boolean | null
          position?: number
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          batch: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          prn: string
          year: string
        }
        Insert: {
          batch: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          prn: string
          year: string
        }
        Update: {
          batch?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          prn?: string
          year?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
