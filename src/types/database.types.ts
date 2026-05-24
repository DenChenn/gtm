export type UserRole = 'merchant' | 'influencer'

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type { Json }

export type Database = {
  public: {
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { user_role: UserRole }
    CompositeTypes: { [_ in never]: never }
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role: UserRole
        }
        Update: Partial<{
          email: string
          name: string | null
          role: UserRole
        }>
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          merchant_id: string
          title: string
          status: string
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: {
          merchant_id: string
          title: string
          status?: string
          start_date?: string | null
          end_date?: string | null
        }
        Update: Partial<{
          title: string
          status: string
          start_date: string | null
          end_date: string | null
        }>
        Relationships: []
      }
      products: {
        Row: {
          id: string
          campaign_id: string
          name: string
          image_url: string | null
          price: number
        }
        Insert: {
          campaign_id: string
          name: string
          image_url?: string | null
          price: number
        }
        Update: Partial<{
          name: string
          image_url: string | null
          price: number
        }>
        Relationships: []
      }
      influencer_campaign: {
        Row: {
          id: string
          campaign_id: string
          influencer_id: string
          joined_at: string
        }
        Insert: { campaign_id: string; influencer_id: string }
        Update: Partial<{ campaign_id: string; influencer_id: string }>
        Relationships: []
      }
      affiliate_links: {
        Row: {
          id: string
          influencer_campaign_id: string
          product_id: string | null
          target_url: string
          code: string
          created_at: string
        }
        Insert: {
          influencer_campaign_id: string
          product_id?: string | null
          target_url: string
          code: string
        }
        Update: Partial<{
          product_id: string | null
          target_url: string
          code: string
        }>
        Relationships: []
      }
      click_events: {
        Row: {
          id: number
          affiliate_link_id: string
          clicked_at: string
          referrer: string | null
          visitor_hash: string | null
        }
        Insert: {
          affiliate_link_id: string
          referrer?: string | null
          visitor_hash?: string | null
        }
        Update: Record<string, never>
        Relationships: []
      }
      conversion_events: {
        Row: {
          id: number
          affiliate_link_id: string
          converted_at: string
          order_amount: number
        }
        Insert: {
          affiliate_link_id: string
          order_amount: number
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
  }
}
