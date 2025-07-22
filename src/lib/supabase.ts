import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'farmer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'farmer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'farmer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      farms: {
        Row: {
          id: string
          name: string
          location: string
          area: number
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          area: number
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          area?: number
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      crops: {
        Row: {
          id: string
          name: string
          variety: string | null
          farm_id: string
          planted_date: string
          expected_harvest_date: string | null
          status: 'planted' | 'growing' | 'harvested' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          variety?: string | null
          farm_id: string
          planted_date: string
          expected_harvest_date?: string | null
          status?: 'planted' | 'growing' | 'harvested' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          variety?: string | null
          farm_id?: string
          planted_date?: string
          expected_harvest_date?: string | null
          status?: 'planted' | 'growing' | 'harvested' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      work_records: {
        Row: {
          id: string
          crop_id: string
          work_type: 'planting' | 'watering' | 'fertilizing' | 'pesticide' | 'harvesting' | 'other'
          description: string
          work_date: string
          hours_spent: number | null
          materials_used: string | null
          worker_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          crop_id: string
          work_type: 'planting' | 'watering' | 'fertilizing' | 'pesticide' | 'harvesting' | 'other'
          description: string
          work_date: string
          hours_spent?: number | null
          materials_used?: string | null
          worker_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          crop_id?: string
          work_type?: 'planting' | 'watering' | 'fertilizing' | 'pesticide' | 'harvesting' | 'other'
          description?: string
          work_date?: string
          hours_spent?: number | null
          materials_used?: string | null
          worker_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      harvest_records: {
        Row: {
          id: string
          crop_id: string
          harvest_date: string
          quantity: number
          unit: string
          quality: 'excellent' | 'good' | 'fair' | 'poor'
          notes: string | null
          harvester_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          crop_id: string
          harvest_date: string
          quantity: number
          unit: string
          quality: 'excellent' | 'good' | 'fair' | 'poor'
          notes?: string | null
          harvester_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          crop_id?: string
          harvest_date?: string
          quantity?: number
          unit?: string
          quality?: 'excellent' | 'good' | 'fair' | 'poor'
          notes?: string | null
          harvester_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 