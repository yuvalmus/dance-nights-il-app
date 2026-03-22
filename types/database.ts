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
      venues: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          slug: string;
          address: string;
          city: string;
          location: unknown; // PostGIS geography type
          parking_info: string | null;
          has_shelter: boolean;
          theme_color: string;
          logo_url: string | null;
          instagram_url: string | null;
          arbox_base_url: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['venues']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['venues']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          venue_id: string;
          date: string;
          title: string;
          description: string | null;
          dance_styles: string[];
          poster_url: string | null;
          price: string | null;
          price_note: string | null;
          dj: string | null;
          instructors: string[];
          pre_register: boolean;
          arbox_link: string | null;
          spots_total: number | null;
          spots_taken: number;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at' | 'spots_taken'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          spots_taken?: number;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      event_schedules: {
        Row: {
          id: string;
          event_id: string;
          time: string;
          description: string;
          level: string | null;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['event_schedules']['Row'], 'id'> & {
          id?: string;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['event_schedules']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          dance_level: 'beginner' | 'intermediate' | 'master';
          dance_styles: string[];
          favorite_venues: string[];
          expo_push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          dance_level?: 'beginner' | 'intermediate' | 'master';
          dance_styles?: string[];
          favorite_venues?: string[];
          expo_push_token?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      polls: {
        Row: {
          id: string;
          date: string;
          title: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['polls']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['polls']['Insert']>;
      };
      poll_options: {
        Row: {
          id: string;
          poll_id: string;
          event_id: string | null;
          label: string;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['poll_options']['Row'], 'id'> & {
          id?: string;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['poll_options']['Insert']>;
      };
      poll_votes: {
        Row: {
          id: string;
          poll_id: string;
          option_id: string;
          user_id: string;
          voted_at: string;
        };
        Insert: Omit<Database['public']['Tables']['poll_votes']['Row'], 'id' | 'voted_at'> & {
          id?: string;
          voted_at?: string;
        };
        Update: Partial<Database['public']['Tables']['poll_votes']['Insert']>;
      };
      courses: {
        Row: {
          id: string;
          venue_id: string | null;
          title: string;
          description: string | null;
          type: 'course' | 'bootcamp' | 'festival';
          dance_styles: string[];
          level: string | null;
          instructor: string | null;
          schedule: string | null;
          weeks: number | null;
          start_date: string | null;
          end_date: string | null;
          price: string | null;
          spots_total: number | null;
          spots_taken: number;
          poster_url: string | null;
          registration_url: string | null;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['courses']['Row'], 'id' | 'created_at' | 'spots_taken'> & {
          id?: string;
          created_at?: string;
          spots_taken?: number;
        };
        Update: Partial<Database['public']['Tables']['courses']['Insert']>;
      };
    };
    Functions: {
      get_events_by_date_and_distance: {
        Args: {
          target_date: string;
          user_lat: number;
          user_lng: number;
        };
        Returns: EventWithVenue[];
      };
    };
  };
}

// Derived types for app usage
export type Venue = Database['public']['Tables']['venues']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type EventSchedule = Database['public']['Tables']['event_schedules']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Poll = Database['public']['Tables']['polls']['Row'];
export type PollOption = Database['public']['Tables']['poll_options']['Row'];
export type PollVote = Database['public']['Tables']['poll_votes']['Row'];
export type Course = Database['public']['Tables']['courses']['Row'];

// The shape returned by the get_events_by_date_and_distance RPC
export type EventWithVenue = {
  event_id: string;
  date: string;
  title: string;
  description: string | null;
  dance_styles: string[];
  poster_url: string | null;
  price: string | null;
  price_note: string | null;
  dj: string | null;
  pre_register: boolean;
  arbox_link: string | null;
  spots_total: number | null;
  spots_taken: number;
  venue_name: string;
  address: string;
  city: string;
  venue_lat: number;
  venue_lng: number;
  parking_info: string | null;
  has_shelter: boolean;
  theme_color: string;
  distance_meters: number;
  schedules: ScheduleEntry[] | null;
  instructors: string[];
};

export type ScheduleEntry = {
  time: string;
  description: string;
  level: string | null;
};

// Poll with nested options and vote counts
export type PollWithOptions = Poll & {
  poll_options: (PollOption & {
    poll_votes: { count: number }[];
  })[];
};
