export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: any
        Insert: any
        Update: any
      }
      events: {
        Row: any
        Insert: any
        Update: any
      }
      business_cards: {
        Row: any
        Insert: any
        Update: any
      }
      collected_cards: {
        Row: any
        Insert: any
        Update: any
      }
      notifications: {
        Row: any
        Insert: any
        Update: any
      }
      event_participants: {
        Row: any
        Insert: any
        Update: any
      }
      [key: string]: {
        Row: any
        Insert: any
        Update: any
      }
    }
    Views: {
      [key: string]: {
        Row: any
        Insert: any
        Update: any
      }
    }
    Functions: {
      [key: string]: {
        Args: any
        Returns: any
      }
    }
    Enums: {
      [key: string]: any
    }
  }
}
