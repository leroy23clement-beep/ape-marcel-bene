// Types générés depuis le schéma public de Supabase (PostgREST /rest/v1).
// 32 tables. Régénérer avec :
//   npx supabase gen types typescript --project-id <ID> --schema public > lib/database.type.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

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
      families: {
        Row: {
        id: string
        family_name: string
        created_at: string | null
        }
        Insert: {
        id?: string
        family_name?: string
        created_at?: string | null
        }
        Update: {
        id?: string
        family_name?: string
        created_at?: string | null
        }
        Relationships: []
      }
      event_photos: {
        Row: {
        id: string
        gallery_id: string
        image_url: string
        created_at: string
        }
        Insert: {
        id?: string
        gallery_id?: string
        image_url?: string
        created_at?: string
        }
        Update: {
        id?: string
        gallery_id?: string
        image_url?: string
        created_at?: string
        }
        Relationships: []
      }
      inventory_purchases: {
        Row: {
        id: string
        item_id: string | null
        quantity: number
        total_cost: number
        purchase_date: string
        supplier: string | null
        created_at: string | null
        expiration_date: string | null
        }
        Insert: {
        id?: string
        item_id?: string | null
        quantity?: number
        total_cost?: number
        purchase_date?: string
        supplier?: string | null
        created_at?: string | null
        expiration_date?: string | null
        }
        Update: {
        id?: string
        item_id?: string | null
        quantity?: number
        total_cost?: number
        purchase_date?: string
        supplier?: string | null
        created_at?: string | null
        expiration_date?: string | null
        }
        Relationships: []
      }
      bureau_documents: {
        Row: {
        id: string
        title: string
        category: string
        file_url: string
        uploaded_by: string | null
        created_at: string
        }
        Insert: {
        id?: string
        title?: string
        category?: string
        file_url?: string
        uploaded_by?: string | null
        created_at?: string
        }
        Update: {
        id?: string
        title?: string
        category?: string
        file_url?: string
        uploaded_by?: string | null
        created_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
        id: number
        user_id: string | null
        subscription: Json
        created_at: string
        endpoint: string | null
        device_endpoint: string | null
        }
        Insert: {
        id?: number
        user_id?: string | null
        subscription?: Json
        created_at?: string
        endpoint?: string | null
        device_endpoint?: string | null
        }
        Update: {
        id?: number
        user_id?: string | null
        subscription?: Json
        created_at?: string
        endpoint?: string | null
        device_endpoint?: string | null
        }
        Relationships: []
      }
      volunteer_registrations: {
        Row: {
        id: string
        slot_id: string | null
        user_id: string | null
        created_at: string | null
        }
        Insert: {
        id?: string
        slot_id?: string | null
        user_id?: string | null
        created_at?: string | null
        }
        Update: {
        id?: string
        slot_id?: string | null
        user_id?: string | null
        created_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
        id: string
        created_at: string
        user_id: string | null
        product_id: string | null
        quantity: number | null
        total_price: number | null
        status: string | null
        }
        Insert: {
        id?: string
        created_at?: string
        user_id?: string | null
        product_id?: string | null
        quantity?: number | null
        total_price?: number | null
        status?: string | null
        }
        Update: {
        id?: string
        created_at?: string
        user_id?: string | null
        product_id?: string | null
        quantity?: number | null
        total_price?: number | null
        status?: string | null
        }
        Relationships: []
      }
      family_members: {
        Row: {
        user_id: string
        family_id: string
        }
        Insert: {
        user_id?: string
        family_id?: string
        }
        Update: {
        user_id?: string
        family_id?: string
        }
        Relationships: []
      }
      event_tasks: {
        Row: {
        id: string
        event_id: string | null
        title: string
        due_date: string | null
        priority: string | null
        assigned_to: string | null
        completed: boolean | null
        created_at: string
        }
        Insert: {
        id?: string
        event_id?: string | null
        title?: string
        due_date?: string | null
        priority?: string | null
        assigned_to?: string | null
        completed?: boolean | null
        created_at?: string
        }
        Update: {
        id?: string
        event_id?: string | null
        title?: string
        due_date?: string | null
        priority?: string | null
        assigned_to?: string | null
        completed?: boolean | null
        created_at?: string
        }
        Relationships: []
      }
      households: {
        Row: {
        id: string
        created_at: string
        }
        Insert: {
        id?: string
        created_at?: string
        }
        Update: {
        id?: string
        created_at?: string
        }
        Relationships: []
      }
      event_finances: {
        Row: {
        id: string
        event_id: string | null
        type: string
        category: string
        description: string
        invoice_number: string | null
        amount: number
        receipt_url: string | null
        created_at: string
        }
        Insert: {
        id?: string
        event_id?: string | null
        type?: string
        category?: string
        description?: string
        invoice_number?: string | null
        amount?: number
        receipt_url?: string | null
        created_at?: string
        }
        Update: {
        id?: string
        event_id?: string | null
        type?: string
        category?: string
        description?: string
        invoice_number?: string | null
        amount?: number
        receipt_url?: string | null
        created_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
        id: string
        name: string
        school_year: string
        budget_allocated: number | null
        created_at: string | null
        }
        Insert: {
        id?: string
        name?: string
        school_year?: string
        budget_allocated?: number | null
        created_at?: string | null
        }
        Update: {
        id?: string
        name?: string
        school_year?: string
        budget_allocated?: number | null
        created_at?: string | null
        }
        Relationships: []
      }
      children: {
        Row: {
        id: string
        household_id: string
        first_name: string
        last_name: string
        class_name: string
        created_at: string
        }
        Insert: {
        id?: string
        household_id?: string
        first_name?: string
        last_name?: string
        class_name?: string
        created_at?: string
        }
        Update: {
        id?: string
        household_id?: string
        first_name?: string
        last_name?: string
        class_name?: string
        created_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
        id: string
        title: string
        description: string | null
        due_date: string | null
        status: string | null
        assigned_to: string | null
        product_id: string | null
        created_at: string
        }
        Insert: {
        id?: string
        title?: string
        description?: string | null
        due_date?: string | null
        status?: string | null
        assigned_to?: string | null
        product_id?: string | null
        created_at?: string
        }
        Update: {
        id?: string
        title?: string
        description?: string | null
        due_date?: string | null
        status?: string | null
        assigned_to?: string | null
        product_id?: string | null
        created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
        id: string
        household_id: string
        first_name: string | null
        last_name: string | null
        role: string | null
        created_at: string
        phone: string | null
        updated_at: string | null
        }
        Insert: {
        id?: string
        household_id?: string
        first_name?: string | null
        last_name?: string | null
        role?: string | null
        created_at?: string
        phone?: string | null
        updated_at?: string | null
        }
        Update: {
        id?: string
        household_id?: string
        first_name?: string | null
        last_name?: string | null
        role?: string | null
        created_at?: string
        phone?: string | null
        updated_at?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
        id: string
        user_id: string
        school_year: string
        amount: number
        status: string | null
        payment_method: string | null
        created_at: string | null
        }
        Insert: {
        id?: string
        user_id?: string
        school_year?: string
        amount?: number
        status?: string | null
        payment_method?: string | null
        created_at?: string | null
        }
        Update: {
        id?: string
        user_id?: string
        school_year?: string
        amount?: number
        status?: string | null
        payment_method?: string | null
        created_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
        id: number
        type: string
        amount: number
        title: string | null
        category: string | null
        event_name: string | null
        created_at: string
        }
        Insert: {
        id?: number
        type?: string
        amount?: number
        title?: string | null
        category?: string | null
        event_name?: string | null
        created_at?: string
        }
        Update: {
        id?: number
        type?: string
        amount?: number
        title?: string | null
        category?: string | null
        event_name?: string | null
        created_at?: string
        }
        Relationships: []
      }
      event_participants: {
        Row: {
        id: string
        event_id: string | null
        user_id: string | null
        task_name: string
        user_name: string
        created_at: string
        }
        Insert: {
        id?: string
        event_id?: string | null
        user_id?: string | null
        task_name?: string
        user_name?: string
        created_at?: string
        }
        Update: {
        id?: string
        event_id?: string | null
        user_id?: string | null
        task_name?: string
        user_name?: string
        created_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
        id: string
        name: string
        category: string
        unit: string
        current_stock: number
        created_at: string | null
        barcode: string | null
        }
        Insert: {
        id?: string
        name?: string
        category?: string
        unit?: string
        current_stock?: number
        created_at?: string | null
        barcode?: string | null
        }
        Update: {
        id?: string
        name?: string
        category?: string
        unit?: string
        current_stock?: number
        created_at?: string | null
        barcode?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
        id: string
        event_id: string | null
        name: string
        description: string | null
        price: number
        stock: number | null
        is_active: boolean | null
        created_at: string | null
        external_link: string | null
        start_date: string | null
        end_date: string | null
        is_closed: boolean
        }
        Insert: {
        id?: string
        event_id?: string | null
        name?: string
        description?: string | null
        price?: number
        stock?: number | null
        is_active?: boolean | null
        created_at?: string | null
        external_link?: string | null
        start_date?: string | null
        end_date?: string | null
        is_closed?: boolean
        }
        Update: {
        id?: string
        event_id?: string | null
        name?: string
        description?: string | null
        price?: number
        stock?: number | null
        is_active?: boolean | null
        created_at?: string | null
        external_link?: string | null
        start_date?: string | null
        end_date?: string | null
        is_closed?: boolean
        }
        Relationships: []
      }
      event_inventory: {
        Row: {
        id: string
        event_id: string | null
        item_id: string | null
        initial_stock: number
        final_stock: number
        waste_stock: number
        unit_price: number
        }
        Insert: {
        id?: string
        event_id?: string | null
        item_id?: string | null
        initial_stock?: number
        final_stock?: number
        waste_stock?: number
        unit_price?: number
        }
        Update: {
        id?: string
        event_id?: string | null
        item_id?: string | null
        initial_stock?: number
        final_stock?: number
        waste_stock?: number
        unit_price?: number
        }
        Relationships: []
      }
      whatsapp_stats: {
        Row: {
        id: number
        stats_json: Json
        updated_at: string | null
        }
        Insert: {
        id?: number
        stats_json?: Json
        updated_at?: string | null
        }
        Update: {
        id?: number
        stats_json?: Json
        updated_at?: string | null
        }
        Relationships: []
      }
      volunteer_slots: {
        Row: {
        id: string
        event_id: string | null
        title: string
        start_time: string
        end_time: string
        max_volunteers: number
        created_at: string | null
        }
        Insert: {
        id?: string
        event_id?: string | null
        title?: string
        start_time?: string
        end_time?: string
        max_volunteers?: number
        created_at?: string | null
        }
        Update: {
        id?: string
        event_id?: string | null
        title?: string
        start_time?: string
        end_time?: string
        max_volunteers?: number
        created_at?: string | null
        }
        Relationships: []
      }
      logo_submissions: {
        Row: {
        id: number
        user_id: string
        participant_name: string
        child_class: string
        image_url: string
        created_at: string
        }
        Insert: {
        id?: number
        user_id?: string
        participant_name?: string
        child_class?: string
        image_url?: string
        created_at?: string
        }
        Update: {
        id?: number
        user_id?: string
        participant_name?: string
        child_class?: string
        image_url?: string
        created_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
        id: string
        order_id: string | null
        product_id: string | null
        quantity: number
        unit_price: number
        }
        Insert: {
        id?: string
        order_id?: string | null
        product_id?: string | null
        quantity?: number
        unit_price?: number
        }
        Update: {
        id?: string
        order_id?: string | null
        product_id?: string | null
        quantity?: number
        unit_price?: number
        }
        Relationships: []
      }
      bureau_members: {
        Row: {
        id: string
        first_name: string
        last_name: string
        role_title: string
        photo_url: string | null
        display_order: number | null
        created_at: string
        }
        Insert: {
        id?: string
        first_name?: string
        last_name?: string
        role_title?: string
        photo_url?: string | null
        display_order?: number | null
        created_at?: string
        }
        Update: {
        id?: string
        first_name?: string
        last_name?: string
        role_title?: string
        photo_url?: string | null
        display_order?: number | null
        created_at?: string
        }
        Relationships: []
      }
      event_needs: {
        Row: {
        id: string
        event_id: string | null
        title: string
        category: string | null
        max_slots: number | null
        created_at: string
        time_slot: string | null
        }
        Insert: {
        id?: string
        event_id?: string | null
        title?: string
        category?: string | null
        max_slots?: number | null
        created_at?: string
        time_slot?: string | null
        }
        Update: {
        id?: string
        event_id?: string | null
        title?: string
        category?: string | null
        max_slots?: number | null
        created_at?: string
        time_slot?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
        id: string
        title: string
        description: string | null
        event_date: string
        location: string | null
        status: string | null
        created_at: string | null
        is_internal: boolean | null
        visibility: string | null
        image_url: string | null
        }
        Insert: {
        id?: string
        title?: string
        description?: string | null
        event_date?: string
        location?: string | null
        status?: string | null
        created_at?: string | null
        is_internal?: boolean | null
        visibility?: string | null
        image_url?: string | null
        }
        Update: {
        id?: string
        title?: string
        description?: string | null
        event_date?: string
        location?: string | null
        status?: string | null
        created_at?: string | null
        is_internal?: boolean | null
        visibility?: string | null
        image_url?: string | null
        }
        Relationships: []
      }
      school_notices: {
        Row: {
        id: string
        title: string
        content: string
        category: string | null
        created_at: string
        notice_date: string | null
        }
        Insert: {
        id?: string
        title?: string
        content?: string
        category?: string | null
        created_at?: string
        notice_date?: string | null
        }
        Update: {
        id?: string
        title?: string
        content?: string
        category?: string | null
        created_at?: string
        notice_date?: string | null
        }
        Relationships: []
      }
      association_stats: {
        Row: {
        id: number
        total_profits: number
        total_school_expenses: number
        updated_at: string
        }
        Insert: {
        id?: number
        total_profits?: number
        total_school_expenses?: number
        updated_at?: string
        }
        Update: {
        id?: number
        total_profits?: number
        total_school_expenses?: number
        updated_at?: string
        }
        Relationships: []
      }
      event_galleries: {
        Row: {
        id: string
        title: string
        event_id: string | null
        cover_image: string | null
        created_at: string
        }
        Insert: {
        id?: string
        title?: string
        event_id?: string | null
        cover_image?: string | null
        created_at?: string
        }
        Update: {
        id?: string
        title?: string
        event_id?: string | null
        cover_image?: string | null
        created_at?: string
        }
        Relationships: []
      }
      bureau_calendar: {
        Row: {
        id: string
        title: string
        description: string
        event_date: string
        location: string
        created_at: string
        }
        Insert: {
        id?: string
        title?: string
        description?: string
        event_date?: string
        location?: string
        created_at?: string
        }
        Update: {
        id?: string
        title?: string
        description?: string
        event_date?: string
        location?: string
        created_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
