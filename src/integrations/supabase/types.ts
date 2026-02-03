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
      activity_feed: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          priority: string | null
          project_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          priority?: string | null
          project_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          priority?: string | null
          project_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          chat_room_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          chat_room_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          chat_room_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          project_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "project_chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_feature_settings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_enabled: boolean | null
          parent_feature_key: string | null
          show_as_upcoming: boolean | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          parent_feature_key?: string | null
          show_as_upcoming?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          parent_feature_key?: string | null
          show_as_upcoming?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_feature_settings_parent_feature_key_fkey"
            columns: ["parent_feature_key"]
            isOneToOne: false
            referencedRelation: "admin_feature_settings"
            referencedColumns: ["feature_key"]
          },
        ]
      }
      admin_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      advanced_rate_limits: {
        Row: {
          block_expires_at: string | null
          consecutive_violations: number | null
          created_at: string
          id: string
          identifier: string
          identifier_type: string | null
          is_blocked: boolean | null
          request_count: number | null
          total_violations: number | null
          window_start: string | null
        }
        Insert: {
          block_expires_at?: string | null
          consecutive_violations?: number | null
          created_at?: string
          id?: string
          identifier: string
          identifier_type?: string | null
          is_blocked?: boolean | null
          request_count?: number | null
          total_violations?: number | null
          window_start?: string | null
        }
        Update: {
          block_expires_at?: string | null
          consecutive_violations?: number | null
          created_at?: string
          id?: string
          identifier?: string
          identifier_type?: string | null
          is_blocked?: boolean | null
          request_count?: number | null
          total_violations?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      alert_dismissals: {
        Row: {
          alert_id: string
          dismissed_at: string
          id: string
          user_id: string
        }
        Insert: {
          alert_id: string
          dismissed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          dismissed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blocked_members: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          id: string
          project_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          id?: string
          project_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          id?: string
          project_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_detection_logs: {
        Row: {
          behavioral_data: Json | null
          block_expires_at: string | null
          bot_score: number | null
          created_at: string
          detection_reasons: string[] | null
          id: string
          ip_address: string
          is_blocked: boolean | null
          is_bot: boolean | null
          path: string | null
          user_agent: string | null
        }
        Insert: {
          behavioral_data?: Json | null
          block_expires_at?: string | null
          bot_score?: number | null
          created_at?: string
          detection_reasons?: string[] | null
          id?: string
          ip_address: string
          is_blocked?: boolean | null
          is_bot?: boolean | null
          path?: string | null
          user_agent?: string | null
        }
        Update: {
          behavioral_data?: Json | null
          block_expires_at?: string | null
          bot_score?: number | null
          created_at?: string
          detection_reasons?: string[] | null
          id?: string
          ip_address?: string
          is_blocked?: boolean | null
          is_bot?: boolean | null
          path?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          actual_amount: number | null
          budgeted_amount: number | null
          category: string
          created_at: string
          id: string
          notes: string | null
          project_id: string
          remaining_amount: number | null
          spent_amount: number | null
          updated_at: string
        }
        Insert: {
          actual_amount?: number | null
          budgeted_amount?: number | null
          category: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          remaining_amount?: number | null
          spent_amount?: number | null
          updated_at?: string
        }
        Update: {
          actual_amount?: number | null
          budgeted_amount?: number | null
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          remaining_amount?: number | null
          spent_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string | null
          effective_date: string | null
          id: string
          order_number: string | null
          project_id: string
          reason: string | null
          requested_by: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          effective_date?: string | null
          id?: string
          order_number?: string | null
          project_id: string
          reason?: string | null
          requested_by?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          effective_date?: string | null
          id?: string
          order_number?: string | null
          project_id?: string
          reason?: string | null
          requested_by?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_room_id: string | null
          content: string
          created_at: string
          file_url: string | null
          id: string
          is_edited: boolean | null
          message_type: string | null
          reply_to: string | null
          room_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_room_id?: string | null
          content: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          reply_to?: string | null
          room_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_room_id?: string | null
          content?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          reply_to?: string | null
          room_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "project_chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          chat_room_id: string
          id: string
          is_muted: boolean | null
          joined_at: string
          last_read_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          chat_room_id: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          chat_room_id?: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "project_chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          id: string
          joined_at: string
          role: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "project_chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_private: boolean | null
          name: string
          project_id: string | null
          room_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          name: string
          project_id?: string | null
          room_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          name?: string
          project_id?: string | null
          room_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          request_type: string | null
          responded_at: string | null
          status: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          request_type?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          request_type?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          is_blocked: boolean | null
          nickname: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          is_blocked?: boolean | null
          nickname?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          is_blocked?: boolean | null
          nickname?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          delays: string | null
          equipment_used: Json | null
          id: string
          materials_used: Json | null
          notes: string | null
          photos: Json | null
          project_id: string
          report_date: string
          safety_incidents: string | null
          submitted_at: string | null
          temperature: number | null
          updated_at: string
          weather_conditions: string | null
          work_performed: string | null
          workforce_count: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          delays?: string | null
          equipment_used?: Json | null
          id?: string
          materials_used?: Json | null
          notes?: string | null
          photos?: Json | null
          project_id: string
          report_date?: string
          safety_incidents?: string | null
          submitted_at?: string | null
          temperature?: number | null
          updated_at?: string
          weather_conditions?: string | null
          work_performed?: string | null
          workforce_count?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          delays?: string | null
          equipment_used?: Json | null
          id?: string
          materials_used?: Json | null
          notes?: string | null
          photos?: Json | null
          project_id?: string
          report_date?: string
          safety_incidents?: string | null
          submitted_at?: string | null
          temperature?: number | null
          updated_at?: string
          weather_conditions?: string | null
          work_performed?: string | null
          workforce_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      drawing_revisions: {
        Row: {
          created_at: string
          description: string | null
          discipline: string | null
          drawing_number: string
          file_path: string | null
          id: string
          issued_by: string | null
          issued_date: string | null
          project_id: string
          revision_number: string | null
          scale: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discipline?: string | null
          drawing_number: string
          file_path?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          project_id: string
          revision_number?: string | null
          scale?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discipline?: string | null
          drawing_number?: string
          file_path?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          project_id?: string
          revision_number?: string | null
          scale?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drawing_revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_recipients: {
        Row: {
          bounced_at: string | null
          campaign_id: string
          clicked_at: string | null
          clicked_count: number | null
          complained_at: string | null
          created_at: string
          error_message: string | null
          id: string
          opened_at: string | null
          opened_count: number | null
          recipient_email: string
          recipient_name: string | null
          resend_message_id: string | null
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          bounced_at?: string | null
          campaign_id: string
          clicked_at?: string | null
          clicked_count?: number | null
          complained_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          opened_count?: number | null
          recipient_email: string
          recipient_name?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string
          clicked_at?: string | null
          clicked_count?: number | null
          complained_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          opened_count?: number | null
          recipient_email?: string
          recipient_name?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          bounced_count: number | null
          clicked_count: number | null
          complained_count: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          failed_count: number | null
          html_content: string
          id: string
          name: string
          opened_count: number | null
          recipient_filter: Json | null
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: string
          subject: string
          total_recipients: number | null
          updated_at: string
        }
        Insert: {
          bounced_count?: number | null
          clicked_count?: number | null
          complained_count?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          failed_count?: number | null
          html_content: string
          id?: string
          name: string
          opened_count?: number | null
          recipient_filter?: Json | null
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          subject: string
          total_recipients?: number | null
          updated_at?: string
        }
        Update: {
          bounced_count?: number | null
          clicked_count?: number | null
          complained_count?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          failed_count?: number | null
          html_content?: string
          id?: string
          name?: string
          opened_count?: number | null
          recipient_filter?: Json | null
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          subject?: string
          total_recipients?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          link_url: string | null
          recipient_id: string | null
          resend_message_id: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          link_url?: string | null
          recipient_id?: string | null
          resend_message_id?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          link_url?: string | null
          recipient_id?: string | null
          resend_message_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "email_campaign_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_user_id: string | null
          resend_message_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_key: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_user_id?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_key: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_user_id?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_key?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          description: string | null
          html_content: string
          id: string
          is_active: boolean | null
          subject: string
          template_key: string
          template_name: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          subject: string
          template_key: string
          template_name: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          subject?: string
          template_key?: string
          template_name?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      equipment_tracking: {
        Row: {
          assigned_to: string | null
          created_at: string
          equipment_name: string
          equipment_type: string | null
          hourly_rate: number | null
          id: string
          last_maintenance: string | null
          location: string | null
          next_maintenance: string | null
          notes: string | null
          project_id: string
          serial_number: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          equipment_name: string
          equipment_type?: string | null
          hourly_rate?: number | null
          id?: string
          last_maintenance?: string | null
          location?: string | null
          next_maintenance?: string | null
          notes?: string | null
          project_id: string
          serial_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          equipment_name?: string
          equipment_type?: string | null
          hourly_rate?: number | null
          id?: string
          last_maintenance?: string | null
          location?: string | null
          next_maintenance?: string | null
          notes?: string | null
          project_id?: string
          serial_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string
          event_id: string
          id: string
          responded_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          responded_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          responded_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          entity_id: string | null
          event_data: Json | null
          event_status: string
          event_type: string
          id: string
          is_public: boolean | null
          location: string | null
          registration_required: boolean | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          entity_id?: string | null
          event_data?: Json | null
          event_status?: string
          event_type?: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          registration_required?: boolean | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          entity_id?: string | null
          event_data?: Json | null
          event_status?: string
          event_type?: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          registration_required?: boolean | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          budget_id: string | null
          category: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          date: string | null
          description: string
          expense_date: string | null
          id: string
          notes: string | null
          project_id: string | null
          receipt_url: string | null
          status: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          budget_id?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          description: string
          expense_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          budget_id?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          description?: string
          expense_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "project_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          enabled_for_roles: Database["public"]["Enums"]["app_role"][] | null
          enabled_for_users: string[] | null
          id: string
          is_enabled: boolean | null
          name: string
          percentage_rollout: number | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          enabled_for_roles?: Database["public"]["Enums"]["app_role"][] | null
          enabled_for_users?: string[] | null
          id?: string
          is_enabled?: boolean | null
          name: string
          percentage_rollout?: number | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          enabled_for_roles?: Database["public"]["Enums"]["app_role"][] | null
          enabled_for_users?: string[] | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          percentage_rollout?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      global_feature_settings: {
        Row: {
          category: string | null
          config: Json | null
          created_at: string
          description: string | null
          display_name: string | null
          enabled: boolean | null
          feature_key: string
          feature_name: string
          id: string
          is_enabled: boolean | null
          parent_feature_key: string | null
          requires_subscription: string[] | null
          show_as_upcoming: boolean | null
          show_in_sidebar: boolean | null
          sidebar_icon: string | null
          sidebar_order: number | null
          sidebar_path: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          enabled?: boolean | null
          feature_key: string
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          parent_feature_key?: string | null
          requires_subscription?: string[] | null
          show_as_upcoming?: boolean | null
          show_in_sidebar?: boolean | null
          sidebar_icon?: string | null
          sidebar_order?: number | null
          sidebar_path?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          enabled?: boolean | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          parent_feature_key?: string | null
          requires_subscription?: string[] | null
          show_as_upcoming?: boolean | null
          show_in_sidebar?: boolean | null
          sidebar_icon?: string | null
          sidebar_order?: number | null
          sidebar_path?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_feature_settings_parent_feature_key_fkey"
            columns: ["parent_feature_key"]
            isOneToOne: false
            referencedRelation: "global_feature_settings"
            referencedColumns: ["feature_key"]
          },
        ]
      }
      global_sidebar_settings: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          display_name: string | null
          enabled: boolean | null
          icon: string | null
          id: string
          menu_name: string
          menu_order: number | null
          path: string | null
          required_roles: string[] | null
          required_subscription: string[] | null
          show_as_upcoming: boolean | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          enabled?: boolean | null
          icon?: string | null
          id?: string
          menu_name: string
          menu_order?: number | null
          path?: string | null
          required_roles?: string[] | null
          required_subscription?: string[] | null
          show_as_upcoming?: boolean | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          enabled?: boolean | null
          icon?: string | null
          id?: string
          menu_name?: string
          menu_order?: number | null
          path?: string | null
          required_roles?: string[] | null
          required_subscription?: string[] | null
          show_as_upcoming?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      inspection_checklist_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          inspection_id: string
          is_completed: boolean | null
          item_text: string
          notes: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          inspection_id: string
          is_completed?: boolean | null
          item_text: string
          notes?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          inspection_id?: string
          is_completed?: boolean | null
          item_text?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_checklist_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_documents: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          inspection_id: string
          name: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          inspection_id: string
          name: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          inspection_id?: string
          name?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_documents_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          building_code_section: string | null
          checklist_items: Json | null
          completed_date: string | null
          created_at: string
          deficiencies: Json | null
          id: string
          inspection_date: string | null
          inspection_type: string
          inspector_name: string | null
          next_inspection: string | null
          notes: string | null
          permit_id: string | null
          phase: string | null
          project_id: string
          reinspection_date: string | null
          result: string | null
          scheduled_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          building_code_section?: string | null
          checklist_items?: Json | null
          completed_date?: string | null
          created_at?: string
          deficiencies?: Json | null
          id?: string
          inspection_date?: string | null
          inspection_type: string
          inspector_name?: string | null
          next_inspection?: string | null
          notes?: string | null
          permit_id?: string | null
          phase?: string | null
          project_id: string
          reinspection_date?: string | null
          result?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          building_code_section?: string | null
          checklist_items?: Json | null
          completed_date?: string | null
          created_at?: string
          deficiencies?: Json | null
          id?: string
          inspection_date?: string | null
          inspection_type?: string
          inspector_name?: string | null
          next_inspection?: string | null
          notes?: string | null
          permit_id?: string | null
          phase?: string | null
          project_id?: string
          reinspection_date?: string | null
          result?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      materials_inventory: {
        Row: {
          created_at: string
          description: string | null
          id: string
          last_ordered: string | null
          location: string | null
          material_name: string
          notes: string | null
          project_id: string
          quantity: number | null
          reorder_level: number | null
          supplier: string | null
          unit: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          last_ordered?: string | null
          location?: string | null
          material_name: string
          notes?: string | null
          project_id: string
          quantity?: number | null
          reorder_level?: number | null
          supplier?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          last_ordered?: string | null
          location?: string | null
          material_name?: string
          notes?: string | null
          project_id?: string
          quantity?: number | null
          reorder_level?: number | null
          supplier?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_inventory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          action_items: Json | null
          agenda: string | null
          attachments: Json | null
          attendees: Json | null
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          meeting_date: string
          notes: string | null
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          agenda?: string | null
          attachments?: Json | null
          attendees?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          meeting_date: string
          notes?: string | null
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          agenda?: string | null
          attachments?: Json | null
          attendees?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          notes?: string | null
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channel: string | null
          created_at: string
          id: string
          is_enabled: boolean | null
          notification_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          notification_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          notification_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nps_responses: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          score: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          score: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number
          user_id?: string | null
        }
        Relationships: []
      }
      obc_compliance_items: {
        Row: {
          article: string | null
          code_section: string
          compliance_method: string | null
          created_at: string
          description: string | null
          division: string | null
          document_url: string | null
          evidence_urls: string[] | null
          id: string
          notes: string | null
          project_id: string
          requirement: string | null
          status: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          article?: string | null
          code_section: string
          compliance_method?: string | null
          created_at?: string
          description?: string | null
          division?: string | null
          document_url?: string | null
          evidence_urls?: string[] | null
          id?: string
          notes?: string | null
          project_id: string
          requirement?: string | null
          status?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          article?: string | null
          code_section?: string
          compliance_method?: string | null
          created_at?: string
          description?: string | null
          division?: string | null
          document_url?: string | null
          evidence_urls?: string[] | null
          id?: string
          notes?: string | null
          project_id?: string
          requirement?: string | null
          status?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obc_compliance_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permits: {
        Row: {
          application_date: string | null
          conditions: string[] | null
          created_at: string
          document_url: string | null
          expiry_date: string | null
          fee_amount: number | null
          id: string
          issued_date: string | null
          issuing_authority: string | null
          notes: string | null
          permit_number: string | null
          permit_type: string
          project_id: string
          related_inspections: string[] | null
          status: string | null
          updated_at: string
        }
        Insert: {
          application_date?: string | null
          conditions?: string[] | null
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          fee_amount?: number | null
          id?: string
          issued_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          permit_number?: string | null
          permit_type: string
          project_id: string
          related_inspections?: string[] | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          application_date?: string | null
          conditions?: string[] | null
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          fee_amount?: number | null
          id?: string
          issued_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          permit_number?: string | null
          permit_type?: string
          project_id?: string
          related_inspections?: string[] | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_reason: string | null
          bio: string | null
          company: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_banned: boolean | null
          job_title: string | null
          last_name: string | null
          member_code: string | null
          notification_preferences: Json | null
          phone: string | null
          role: string | null
          subscription_plan: string | null
          subscription_status: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean | null
          job_title?: string | null
          last_name?: string | null
          member_code?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          role?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean | null
          job_title?: string | null
          last_name?: string | null
          member_code?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          role?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_activity_log: {
        Row: {
          action: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          project_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budgets: {
        Row: {
          actual_amount: number | null
          budgeted_amount: number | null
          category: string
          created_at: string
          id: string
          notes: string | null
          project_id: string | null
          remaining_amount: number | null
          spent_amount: number | null
          updated_at: string
        }
        Insert: {
          actual_amount?: number | null
          budgeted_amount?: number | null
          category: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          remaining_amount?: number | null
          spent_amount?: number | null
          updated_at?: string
        }
        Update: {
          actual_amount?: number | null
          budgeted_amount?: number | null
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          remaining_amount?: number | null
          spent_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_chat_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_private: boolean | null
          name: string
          project_id: string | null
          room_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          project_id?: string | null
          room_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          project_id?: string | null
          room_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_chat_rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_public: boolean | null
          name: string
          project_id: string
          updated_at: string
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          project_id: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          project_id?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_expenses: {
        Row: {
          amount: number
          budget_id: string | null
          category: string | null
          created_at: string
          created_by: string | null
          date: string | null
          description: string
          id: string
          project_id: string
          receipt_url: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          budget_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          description: string
          id?: string
          project_id: string
          receipt_url?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          budget_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          date?: string | null
          description?: string
          id?: string
          project_id?: string
          receipt_url?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_name: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_public: boolean | null
          name: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invoices: {
        Row: {
          amount: number
          client_email: string | null
          client_name: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          line_items: Json | null
          notes: string | null
          paid_date: string | null
          project_id: string
          status: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          line_items?: Json | null
          notes?: string | null
          paid_date?: string | null
          project_id: string
          status?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount?: number
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          line_items?: Json | null
          notes?: string | null
          paid_date?: string | null
          project_id?: string
          status?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          permissions: Json | null
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          permissions?: Json | null
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          permissions?: Json | null
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_date: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          project_id: string
          status: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          project_id: string
          status?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_photos: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_name: string | null
          file_path: string
          id: string
          location: string | null
          project_id: string
          tags: string[] | null
          taken_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path: string
          id?: string
          location?: string | null
          project_id: string
          tags?: string[] | null
          taken_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string
          id?: string
          location?: string | null
          project_id?: string
          tags?: string[] | null
          taken_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_schedule: {
        Row: {
          assigned_to: string | null
          color: string | null
          created_at: string
          dependencies: string[] | null
          description: string | null
          duration_days: number | null
          end_date: string
          id: string
          milestone: boolean | null
          progress: number | null
          project_id: string
          start_date: string
          status: string | null
          task_name: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          color?: string | null
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          duration_days?: number | null
          end_date: string
          id?: string
          milestone?: boolean | null
          progress?: number | null
          project_id: string
          start_date: string
          status?: string | null
          task_name: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          color?: string | null
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          duration_days?: number | null
          end_date?: string
          id?: string
          milestone?: boolean | null
          progress?: number | null
          project_id?: string
          start_date?: string
          status?: string | null
          task_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_schedule_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: string | null
          project_id: string
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_id: string
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_id?: string
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          category: string | null
          complexity: string | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_budget: number | null
          estimated_duration: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          is_system_template: boolean | null
          name: string
          required_permits: string[] | null
          template_data: Json | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          complexity?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_budget?: number | null
          estimated_duration?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          is_system_template?: boolean | null
          name: string
          required_permits?: string[] | null
          template_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          complexity?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_budget?: number | null
          estimated_duration?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          is_system_template?: boolean | null
          name?: string
          required_permits?: string[] | null
          template_data?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          actual_amount: number | null
          address: string | null
          budget: number | null
          budgeted_amount: number | null
          category: string | null
          created_at: string
          created_by: string | null
          current_phase: string | null
          description: string | null
          end_date: string | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          owner_id: string | null
          priority: string | null
          progress: number | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          actual_amount?: number | null
          address?: string | null
          budget?: number | null
          budgeted_amount?: number | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_phase?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          actual_amount?: number | null
          address?: string | null
          budget?: number | null
          budgeted_amount?: number | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_phase?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          applicable_plans: string[] | null
          code: string
          created_at: string
          current_uses: number | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          discount_type: string | null
          discount_value: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      punch_list_items: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          location: string | null
          photos: Json | null
          priority: string | null
          project_id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          location?: string | null
          photos?: Json | null
          priority?: string | null
          project_id: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          location?: string | null
          photos?: Json | null
          priority?: string | null
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "punch_list_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_export_mappings: {
        Row: {
          created_at: string
          id: string
          integration_id: string
          local_entity_id: string
          local_entity_type: string
          quickbooks_entity_id: string | null
          quickbooks_entity_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          integration_id: string
          local_entity_id: string
          local_entity_type: string
          quickbooks_entity_id?: string | null
          quickbooks_entity_type: string
        }
        Update: {
          created_at?: string
          id?: string
          integration_id?: string
          local_entity_id?: string
          local_entity_type?: string
          quickbooks_entity_id?: string | null
          quickbooks_entity_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_export_mappings_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_export_settings: {
        Row: {
          auto_sync_enabled: boolean | null
          created_at: string
          default_expense_account_ref: string | null
          export_customers: boolean | null
          export_expenses: boolean | null
          export_invoices: boolean | null
          export_payments: boolean | null
          export_projects_as_customers: boolean | null
          id: string
          integration_id: string
          sync_frequency: string | null
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          created_at?: string
          default_expense_account_ref?: string | null
          export_customers?: boolean | null
          export_expenses?: boolean | null
          export_invoices?: boolean | null
          export_payments?: boolean | null
          export_projects_as_customers?: boolean | null
          id?: string
          integration_id: string
          sync_frequency?: string | null
        }
        Update: {
          auto_sync_enabled?: boolean | null
          created_at?: string
          default_expense_account_ref?: string | null
          export_customers?: boolean | null
          export_expenses?: boolean | null
          export_invoices?: boolean | null
          export_payments?: boolean | null
          export_projects_as_customers?: boolean | null
          id?: string
          integration_id?: string
          sync_frequency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_export_settings_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_integrations: {
        Row: {
          access_token: string | null
          company_id: string | null
          company_name: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          realmId: string | null
          refresh_token: string | null
          scope: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          realmId?: string | null
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          realmId?: string | null
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          direction: string | null
          error_message: string | null
          id: string
          integration_id: string
          records_failed: number | null
          records_processed: number | null
          records_success: number | null
          status: string | null
          sync_type: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          direction?: string | null
          error_message?: string | null
          id?: string
          integration_id: string
          records_failed?: number | null
          records_processed?: number | null
          records_success?: number | null
          status?: string | null
          sync_type?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          direction?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string
          records_failed?: number | null
          records_processed?: number | null
          records_success?: number | null
          status?: string | null
          sync_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      rejoin_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          project_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          project_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          project_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rejoin_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      report_exports: {
        Row: {
          completed_at: string | null
          config: Json | null
          created_at: string
          error_message: string | null
          file_url: string | null
          format: string | null
          id: string
          project_id: string | null
          report_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          format?: string | null
          id?: string
          project_id?: string | null
          report_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          format?: string | null
          id?: string
          project_id?: string | null
          report_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_exports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rfi_items: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string
          requested_by: string | null
          responded_at: string | null
          responded_by: string | null
          response: string | null
          rfi_number: string | null
          status: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id: string
          requested_by?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          rfi_number?: string | null
          status?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string
          requested_by?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          rfi_number?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfi_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          ai_recommendations: Json | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          impact: string | null
          likelihood: string | null
          mitigation: string | null
          mitigation_strategies: Json | null
          project_id: string
          risk_factors: Json | null
          risk_score: number | null
          risk_type: string
          severity: string | null
          status: string | null
          updated_at: string
          valid_until: string | null
          weather_conditions: Json | null
        }
        Insert: {
          ai_recommendations?: Json | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          impact?: string | null
          likelihood?: string | null
          mitigation?: string | null
          mitigation_strategies?: Json | null
          project_id: string
          risk_factors?: Json | null
          risk_score?: number | null
          risk_type: string
          severity?: string | null
          status?: string | null
          updated_at?: string
          valid_until?: string | null
          weather_conditions?: Json | null
        }
        Update: {
          ai_recommendations?: Json | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          impact?: string | null
          likelihood?: string | null
          mitigation?: string | null
          mitigation_strategies?: Json | null
          project_id?: string
          risk_factors?: Json | null
          risk_score?: number | null
          risk_type?: string
          severity?: string | null
          status?: string | null
          updated_at?: string
          valid_until?: string | null
          weather_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_changes: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_role: string
          old_role: string | null
          project_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_role: string
          old_role?: string | null
          project_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_role?: string
          old_role?: string | null
          project_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_changes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_compliance: {
        Row: {
          assigned_to: string | null
          audit_date: string | null
          audited_by: string | null
          category: string
          completed_at: string | null
          compliance_percentage: number | null
          compliance_type: string | null
          created_at: string
          description: string | null
          due_date: string | null
          evidence_url: string | null
          id: string
          item_name: string
          notes: string | null
          priority: string | null
          project_id: string
          regulation_reference: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          audit_date?: string | null
          audited_by?: string | null
          category: string
          completed_at?: string | null
          compliance_percentage?: number | null
          compliance_type?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          evidence_url?: string | null
          id?: string
          item_name: string
          notes?: string | null
          priority?: string | null
          project_id: string
          regulation_reference?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          audit_date?: string | null
          audited_by?: string | null
          category?: string
          completed_at?: string | null
          compliance_percentage?: number | null
          compliance_type?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          evidence_url?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          priority?: string | null
          project_id?: string
          regulation_reference?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_compliance_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_incidents: {
        Row: {
          corrective_measures: string | null
          created_at: string
          description: string | null
          id: string
          incident_date: string
          incident_type: string
          involved_parties: Json | null
          location: string | null
          project_id: string
          reported_by: string | null
          severity: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          corrective_measures?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incident_date: string
          incident_type: string
          involved_parties?: Json | null
          location?: string | null
          project_id: string
          reported_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          corrective_measures?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string
          incident_type?: string
          involved_parties?: Json | null
          location?: string | null
          project_id?: string
          reported_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sidebar_settings: {
        Row: {
          id: string
          is_active: boolean | null
          menu_items: Json | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          menu_items?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          menu_items?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      simple_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simple_chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          product_id: string | null
          product_type: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          product_type: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          product_type?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subcontractors: {
        Row: {
          company_name: string
          contact_name: string | null
          contract_amount: number | null
          created_at: string
          email: string | null
          id: string
          insurance_expiry: string | null
          license_number: string | null
          notes: string | null
          phone: string | null
          project_id: string
          status: string | null
          trade: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_name?: string | null
          contract_amount?: number | null
          created_at?: string
          email?: string | null
          id?: string
          insurance_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          project_id: string
          status?: string | null
          trade?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_name?: string | null
          contract_amount?: number | null
          created_at?: string
          email?: string | null
          id?: string
          insurance_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          project_id?: string
          status?: string | null
          trade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      submittals: {
        Row: {
          attachments: Json | null
          created_at: string
          description: string | null
          id: string
          project_id: string
          review_comments: string | null
          review_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specification_section: string | null
          status: string | null
          submittal_number: string | null
          submitted_at: string | null
          submitted_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          review_comments?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specification_section?: string | null
          status?: string | null
          submittal_number?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          review_comments?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specification_section?: string | null
          status?: string | null
          submittal_number?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          id: string
          metadata: Json | null
          new_plan: string
          new_status: string | null
          old_plan: string | null
          old_status: string | null
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          id?: string
          metadata?: Json | null
          new_plan: string
          new_status?: string | null
          old_plan?: string | null
          old_status?: string | null
          user_id: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          id?: string
          metadata?: Json | null
          new_plan?: string
          new_status?: string | null
          old_plan?: string | null
          old_status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_articles: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured: boolean | null
          id: string
          is_published: boolean | null
          status: string | null
          title: string
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          is_published?: boolean | null
          status?: string | null
          title: string
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          is_published?: boolean | null
          status?: string | null
          title?: string
          view_count?: number | null
        }
        Relationships: []
      }
      support_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      support_faqs: {
        Row: {
          answer: string
          category_id: string | null
          created_at: string
          helpful_count: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          question: string
          sort_order: number | null
          view_count: number | null
        }
        Insert: {
          answer: string
          category_id?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          question: string
          sort_order?: number | null
          view_count?: number | null
        }
        Update: {
          answer?: string
          category_id?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          question?: string
          sort_order?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_faqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "support_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      support_feedback: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          page_url: string | null
          rating: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          page_url?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          page_url?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          priority: string | null
          priority_level: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          ticket_category: string | null
          ticket_number: string | null
          ticket_status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          priority_level?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          ticket_category?: string | null
          ticket_number?: string | null
          ticket_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          priority_level?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          ticket_category?: string | null
          ticket_number?: string | null
          ticket_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          task_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          task_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          task_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_edited: boolean | null
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invitation_token: string | null
          invited_by: string | null
          project_id: string
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          project_id: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          project_id?: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          owner_id: string | null
          role: string | null
          status: string | null
          team_owner_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id?: string | null
          role?: string | null
          status?: string | null
          team_owner_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string | null
          role?: string | null
          status?: string | null
          team_owner_id?: string
          user_id?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string
          date: string
          description: string | null
          hourly_rate: number | null
          hours: number
          id: string
          is_billable: boolean | null
          project_id: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string | null
          hourly_rate?: number | null
          hours: number
          id?: string
          is_billable?: boolean | null
          project_id: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          hourly_rate?: number | null
          hours?: number
          id?: string
          is_billable?: boolean | null
          project_id?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean | null
          phone_number: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          current_room_id: string | null
          id: string
          last_seen: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_room_id?: string | null
          id?: string
          last_seen?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_room_id?: string | null
          id?: string
          last_seen?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_current_room_id_fkey"
            columns: ["current_room_id"]
            isOneToOne: false
            referencedRelation: "project_chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          date_format: string | null
          email_notifications: boolean | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          push_notifications: boolean | null
          settings: Json | null
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_format?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          push_notifications?: boolean | null
          settings?: Json | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_format?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          push_notifications?: boolean | null
          settings?: Json | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weather_alerts: {
        Row: {
          ai_analysis: string | null
          alert_type: string
          created_at: string
          description: string | null
          ends_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string | null
          project_id: string
          recommended_actions: Json | null
          severity: string | null
          starts_at: string | null
          title: string | null
        }
        Insert: {
          ai_analysis?: string | null
          alert_type: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          project_id: string
          recommended_actions?: Json | null
          severity?: string | null
          starts_at?: string | null
          title?: string | null
        }
        Update: {
          ai_analysis?: string | null
          alert_type?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          project_id?: string
          recommended_actions?: Json | null
          severity?: string | null
          starts_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_data: {
        Row: {
          conditions: string | null
          feels_like: number | null
          fetched_at: string
          forecast: Json | null
          humidity: number | null
          icon: string | null
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          temperature: number | null
          wind_speed: number | null
        }
        Insert: {
          conditions?: string | null
          feels_like?: number | null
          fetched_at?: string
          forecast?: Json | null
          humidity?: number | null
          icon?: string | null
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          temperature?: number | null
          wind_speed?: number | null
        }
        Update: {
          conditions?: string | null
          feels_like?: number | null
          fetched_at?: string
          forecast?: Json | null
          humidity?: number | null
          icon?: string | null
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          temperature?: number | null
          wind_speed?: number | null
        }
        Relationships: []
      }
      weather_forecast: {
        Row: {
          conditions: string | null
          fetched_at: string
          forecast_date: string
          humidity: number | null
          id: string
          precipitation_chance: number | null
          project_id: string
          temperature_high: number | null
          temperature_low: number | null
          uv_index: number | null
          wind_speed: number | null
          work_impact: string | null
        }
        Insert: {
          conditions?: string | null
          fetched_at?: string
          forecast_date: string
          humidity?: number | null
          id?: string
          precipitation_chance?: number | null
          project_id: string
          temperature_high?: number | null
          temperature_low?: number | null
          uv_index?: number | null
          wind_speed?: number | null
          work_impact?: string | null
        }
        Update: {
          conditions?: string | null
          fetched_at?: string
          forecast_date?: string
          humidity?: number | null
          id?: string
          precipitation_chance?: number | null
          project_id?: string
          temperature_high?: number | null
          temperature_low?: number | null
          uv_index?: number | null
          wind_speed?: number | null
          work_impact?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_forecast_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_basic: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          member_code: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          member_code?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          member_code?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_reaction: {
        Args: { p_emoji: string; p_message_id: string }
        Returns: undefined
      }
      admin_delete_orphan_profile: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      admin_get_orphan_auth_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      ban_user: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      block_project_member: {
        Args: {
          p_blocked_by?: string
          p_project_id: string
          p_reason?: string
          p_user_id: string
        }
        Returns: undefined
      }
      check_feature_access: {
        Args: { p_feature_key: string }
        Returns: boolean
      }
      create_chat_room: {
        Args: {
          p_description?: string
          p_is_private?: boolean
          p_name: string
          p_project_id?: string
          p_room_type?: string
        }
        Returns: string
      }
      delete_message: { Args: { p_message_id: string }; Returns: undefined }
      delete_task: { Args: { p_task_id: string }; Returns: undefined }
      extend_trial: {
        Args: { p_days?: number; p_user_id: string }
        Returns: undefined
      }
      get_room_members: {
        Args: { p_room_id: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          joined_at: string
          role: string
          user_id: string
        }[]
      }
      get_system_admin_ids: { Args: never; Returns: string[] }
      get_user_subscription: { Args: { p_user_id?: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_any_admin: { Args: { _user_id: string }; Returns: boolean }
      is_chat_room_member: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
      is_chat_room_participant: {
        Args: { _chat_room_id: string; _user_id: string }
        Returns: boolean
      }
      is_event_creator: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_event_participant: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      is_invited_to_project: {
        Args: { _email: string; _project_id: string }
        Returns: boolean
      }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_system_admin: { Args: { _user_id: string }; Returns: boolean }
      leave_chat_room: { Args: { p_room_id: string }; Returns: undefined }
      remove_project_member: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: undefined
      }
      remove_reaction: {
        Args: { p_emoji: string; p_message_id: string }
        Returns: undefined
      }
      shares_project_with: {
        Args: { _other_user_id: string; _user_id: string }
        Returns: boolean
      }
      start_trial: {
        Args: { p_trial_days?: number; p_user_id: string }
        Returns: undefined
      }
      transfer_project_ownership: {
        Args: { p_new_owner_id: string; p_project_id: string }
        Returns: undefined
      }
      unban_user: { Args: { p_user_id: string }; Returns: undefined }
      unblock_project_member: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: undefined
      }
      update_message: {
        Args: { p_content: string; p_message_id: string }
        Returns: undefined
      }
      update_room_settings: {
        Args: {
          p_description?: string
          p_is_private?: boolean
          p_name?: string
          p_room_id: string
        }
        Returns: undefined
      }
      validate_promo_code: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "system_admin"
        | "operation_admin"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "system_admin",
        "operation_admin",
      ],
    },
  },
} as const
