export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          slug: string;
          description: string | null;
          status: 'draft' | 'published' | 'archived';
          specs: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          slug: string;
          description?: string | null;
          status?: 'draft' | 'published' | 'archived';
          specs?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          path: string | null;
          sort_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          parent_id?: string | null;
          path?: string | null;
          sort_order?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
        Relationships: [];
      };
      product_categories: {
        Row: {
          product_id: string;
          category_id: string;
        };
        Insert: {
          product_id: string;
          category_id: string;
        };
        Update: Partial<Database['public']['Tables']['product_categories']['Insert']>;
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          url: string;
          alt: string | null;
          width: number | null;
          height: number | null;
          mime_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          alt?: string | null;
          width?: number | null;
          height?: number | null;
          mime_type?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['assets']['Insert']>;
        Relationships: [];
      };
      product_assets: {
        Row: {
          product_id: string;
          asset_id: string;
          role: 'primary' | 'gallery';
          sort_order: number;
        };
        Insert: {
          product_id: string;
          asset_id: string;
          role: 'primary' | 'gallery';
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['product_assets']['Insert']>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string | null;
          title: string | null;
          attributes: Json;
          price_cents: number;
          currency: string;
          stock_on_hand: number;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku?: string | null;
          title?: string | null;
          attributes?: Json;
          price_cents: number;
          currency?: string;
          stock_on_hand?: number;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          role: 'admin' | 'editor' | 'viewer';
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: 'admin' | 'editor' | 'viewer';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
    };
  };
}
