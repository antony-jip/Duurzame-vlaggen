/**
 * Hand-written Supabase `Database` types, derived from the SQL migration
 * (`supabase/migrations/20260713120000_init_schema.sql`) — the source of truth,
 * since there is no `supabase gen types` link locally.
 *
 * Passed as the generic to `createClient<Database>` (see lib/supabase/admin.ts)
 * so every query/insert/update is typed. Numerics are typed as `number` to match
 * how `supabase gen types` models Postgres `numeric` (PostgREST returns them as
 * JSON numbers); keep money math rounded to 2 decimals at the boundaries.
 *
 * Keep in sync with the migration when the schema changes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Order status enum (state machine, spec §11 — forward-only in app logic). */
export type OrderStatus =
  | "cart"
  | "awaiting_payment"
  | "paid"
  | "sent_to_probo"
  | "probo_accepted"
  | "in_production"
  | "shipped"
  | "payment_failed"
  | "probo_rejected"
  | "cancelled";

/** Dimensie van een GSC-snapshot (migratie 20260715090000). */
export type GscDimensie = "query" | "pagina";

/** Waar een opgepakte kans vandaan kwam. */
export type KansBron = "doel" | "kans";

/** Stand van een opgepakte kans. `benut` = doorgevoerd. */
export type KansStatus = "opgepakt" | "benut";

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          company_name: string | null;
          vat_number: string | null;
          addresses: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          company_name?: string | null;
          vat_number?: string | null;
          addresses?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          email?: string;
          company_name?: string | null;
          vat_number?: string | null;
          addresses?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          market: string;
          currency: string;
          customer_id: string | null;
          email: string;
          phone: string | null;
          status: OrderStatus;
          billing_address: Json | null;
          shipping_address: Json | null;
          is_business: boolean;
          vat_number: string | null;
          vat_number_valid: boolean | null;
          vat_validated_at: string | null;
          reverse_charge: boolean;
          vat_rate: number | null;
          subtotal_ex_vat: number | null;
          shipping_cost: number | null;
          vat_amount: number | null;
          total: number | null;
          mollie_payment_id: string | null;
          mollie_status: string | null;
          probo_order_id: string | null;
          probo_status: string | null;
          carrier: string | null;
          tracking_url: string | null;
          created_at: string;
          paid_at: string | null;
          ordered_at: string | null;
          shipped_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          market: string;
          currency?: string;
          customer_id?: string | null;
          email: string;
          phone?: string | null;
          status?: OrderStatus;
          billing_address?: Json | null;
          shipping_address?: Json | null;
          is_business?: boolean;
          vat_number?: string | null;
          vat_number_valid?: boolean | null;
          vat_validated_at?: string | null;
          reverse_charge?: boolean;
          vat_rate?: number | null;
          subtotal_ex_vat?: number | null;
          shipping_cost?: number | null;
          vat_amount?: number | null;
          total?: number | null;
          mollie_payment_id?: string | null;
          mollie_status?: string | null;
          probo_order_id?: string | null;
          probo_status?: string | null;
          carrier?: string | null;
          tracking_url?: string | null;
          created_at?: string;
          paid_at?: string | null;
          ordered_at?: string | null;
          shipped_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          probo_product_code: string;
          product_type: string;
          product_name: string | null;
          configuration: Json;
          amount: number;
          calculation_id: string | null;
          uploader_id: number | null;
          uploader_external_id: number | null;
          uploader_status: string | null;
          file_url: string | null;
          base_price: number | null;
          markup_pct: number;
          line_price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          probo_product_code: string;
          product_type: string;
          product_name?: string | null;
          configuration: Json;
          amount: number;
          calculation_id?: string | null;
          uploader_id?: number | null;
          uploader_external_id?: number | null;
          uploader_status?: string | null;
          file_url?: string | null;
          base_price?: number | null;
          markup_pct?: number;
          line_price?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_events: {
        Row: {
          id: string;
          order_id: string;
          source: string;
          event_type: string;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          source: string;
          event_type: string;
          payload?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      media_assets: {
        Row: {
          id: string;
          wp_id: number | null;
          wp_url: string;
          storage_path: string;
          storage_url: string;
          filename: string | null;
          mime_type: string | null;
          alt_text: string | null;
          migrated_at: string;
        };
        Insert: {
          id?: string;
          wp_id?: number | null;
          wp_url: string;
          storage_path: string;
          storage_url: string;
          filename?: string | null;
          mime_type?: string | null;
          alt_text?: string | null;
          migrated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_assets"]["Insert"]>;
        Relationships: [];
      };
      gsc_snapshots: {
        Row: {
          dag: string;
          markt: string;
          dimensie: GscDimensie;
          sleutel: string;
          clicks: number;
          impressies: number;
          ctr: number;
          positie: number;
          captured_at: string;
        };
        Insert: {
          dag: string;
          markt?: string;
          dimensie: GscDimensie;
          sleutel: string;
          clicks?: number;
          impressies?: number;
          ctr?: number;
          positie?: number;
          captured_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gsc_snapshots"]["Insert"]>;
        Relationships: [];
      };
      seo_kans_acties: {
        Row: {
          id: string;
          sleutel: string;
          bron: KansBron;
          status: KansStatus;
          positie_bij: number | null;
          impressies_bij: number | null;
          notitie: string | null;
          aangemaakt_op: string;
          benut_op: string | null;
        };
        Insert: {
          id?: string;
          sleutel: string;
          bron?: KansBron;
          status: KansStatus;
          positie_bij?: number | null;
          impressies_bij?: number | null;
          notitie?: string | null;
          aangemaakt_op?: string;
          benut_op?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["seo_kans_acties"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      order_status: OrderStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};

/** Convenience row aliases. */
export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderEventRow = Database["public"]["Tables"]["order_events"]["Row"];
export type MediaAssetRow = Database["public"]["Tables"]["media_assets"]["Row"];
export type GscSnapshotRow = Database["public"]["Tables"]["gsc_snapshots"]["Row"];
export type SeoKansActieRow = Database["public"]["Tables"]["seo_kans_acties"]["Row"];

export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
export type OrderEventInsert = Database["public"]["Tables"]["order_events"]["Insert"];
