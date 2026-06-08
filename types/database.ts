import { DanceLevel, CourseType } from '@/constants/config';

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
          theme_colors: string[];
          logo_url: string | null;
          instagram_url: string | null;
          booking_url: string | null;
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
        Relationships: [
          {
            foreignKeyName: 'venues_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
          price: number | null;
          price_note: string | null;
          dj: string | null;
          instructors: string[];
          pre_register: boolean;
          registration_links: RegistrationLink[];
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'events_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'event_schedules_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          dance_level: DanceLevel;
          dance_styles: string[];
          favorite_venues: string[];
          expo_push_token: string | null;
          is_artist: boolean;
          notification_preferences: NotificationPreferences;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          dance_level?: DanceLevel;
          dance_styles?: string[];
          favorite_venues?: string[];
          expo_push_token?: string | null;
          notification_preferences?: NotificationPreferences;
          // is_artist is server-controlled — column UPDATE revoked from
          // authenticated/anon roles; kept out of Insert/Update to stop the
          // app from ever trying to write it.
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: 'poll_options_poll_id_fkey';
            columns: ['poll_id'];
            isOneToOne: false;
            referencedRelation: 'polls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'poll_options_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'poll_votes_poll_id_fkey';
            columns: ['poll_id'];
            isOneToOne: false;
            referencedRelation: 'polls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'poll_votes_option_id_fkey';
            columns: ['option_id'];
            isOneToOne: false;
            referencedRelation: 'poll_options';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'poll_votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      courses: {
        Row: {
          id: string;
          venue_id: string | null;
          title: string;
          description: string | null;
          type: CourseType;
          dance_style: string | null;
          level: string | null;
          instructor: string | null;
          instructor_id: string | null;
          price: number | null;
          spots_total: number | null;
          spots_taken: number;
          poster_url: string | null;
          registration_url: string | null;
          is_published: boolean;
          announcements: string[];
          learning_outcomes: string[];
          created_by: string | null;
          approval_status: CourseApprovalStatus;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        // approval_* columns are server-controlled: the insert trigger sets
        // them based on venue ownership, and the set_course_approval RPC is
        // the only path for owner-driven transitions. We omit them from the
        // Insert/Update shapes so the app can never try to write them.
        Insert: Omit<
          Database['public']['Tables']['courses']['Row'],
          'id' | 'created_at' | 'spots_taken' | 'approval_status' | 'approved_by' | 'approved_at'
        > & {
          id?: string;
          created_at?: string;
          spots_taken?: number;
        };
        Update: Partial<Database['public']['Tables']['courses']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'courses_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'courses_instructor_id_fkey';
            columns: ['instructor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'courses_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      course_schedules: {
        Row: {
          id: string;
          course_id: string;
          date: string;
          start_time: string;
          end_time: string;
          description: string | null;
        };
        Insert: Omit<Database['public']['Tables']['course_schedules']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['course_schedules']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'course_schedules_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      venue_affiliations: {
        Row: {
          id: string;
          venue_id: string;
          user_id: string;
          status: AffiliationStatus;
          invited_by: string;
          invited_at: string;
          responded_at: string | null;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        // Only the INSERT shape the client actually needs: the owner invites
        // a user. Timestamps and status transitions are handled by triggers
        // and the RLS matrix.
        Insert: {
          id?: string;
          venue_id: string;
          user_id: string;
          status?: AffiliationStatus;
          invited_by: string;
          invited_at?: string;
          responded_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['venue_affiliations']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'venue_affiliations_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'venue_affiliations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'venue_affiliations_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      registrations: {
        Row: {
          id: string;
          user_id: string;
          event_id: string | null;
          course_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id?: string | null;
          course_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['registrations']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'registrations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'registrations_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'registrations_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      friendships: {
        Row: {
          user_id: string;
          friend_id: string;
          status: FriendshipStatus;
          requested_by: string;
          created_at: string;
          updated_at: string;
        };
        // Clients never INSERT/UPDATE/DELETE directly — use RPCs.
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'friendships_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_friend_id_fkey';
            columns: ['friend_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          data: Json;
          group_key: string | null;
          push_eligible: boolean;
          last_push_at: string | null;
          read_at: string | null;
          created_at: string;
          updated_at: string;
          sort_at: string;
        };
        // Clients never INSERT — triggers own writes. Shape exists for
        // completeness only.
        Insert: never;
        Update: {
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          target_type: FavoriteTargetType;
          target_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_type: FavoriteTargetType;
          target_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'user_favorites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_events_by_date_and_distance: {
        Args: {
          target_date: string;
          user_lat: number;
          user_lng: number;
        };
        Returns: EventWithVenue[];
      };
      set_course_approval: {
        Args: {
          target_course_id: string;
          new_status: Exclude<CourseApprovalStatus, 'not_required'>;
        };
        Returns: Database['public']['Tables']['courses']['Row'];
      };
      search_profiles_for_affiliation: {
        Args: {
          query_text?: string;
          max_results?: number;
        };
        Returns: {
          id: string;
          display_name: string | null;
          is_artist: boolean;
        }[];
      };
      request_friend: {
        Args: { target_id: string };
        Returns: void;
      };
      accept_friend: {
        Args: { requester_id: string };
        Returns: void;
      };
      block_user: {
        Args: { target_id: string };
        Returns: void;
      };
      remove_friendship_record: {
        Args: { target_id: string };
        Returns: void;
      };
      get_my_friends: {
        Args: Record<string, never>;
        Returns: FriendProfile[];
      };
      get_pending_friend_requests: {
        Args: Record<string, never>;
        Returns: (FriendProfile & { requested_at: string })[];
      };
      get_mutual_friends: {
        Args: { other_user_id: string };
        Returns: { id: string; display_name: string | null }[];
      };
      get_activity_social: {
        Args: { p_event_id?: string | null; p_course_id?: string | null };
        Returns: {
          total_going: number;
          viewer_going: boolean;
          friends: { id: string; display_name: string | null }[];
        }[];
      };
      search_profiles_for_friends: {
        Args: { query_text?: string; max_results?: number };
        Returns: (FriendProfile & {
          pending: boolean;
          venue_name: string | null;
          venue_logo_url: string | null;
        })[];
      };
      get_notification_feed: {
        Args: {
          p_cursor_sort_at?: string | null;
          p_cursor_id?: string | null;
          p_limit?: number;
        };
        Returns: NotificationFeedRow[];
      };
      get_notification_unread_count: {
        Args: Record<string, never>;
        Returns: number;
      };
      toggle_user_favorite: {
        Args: { p_target_type: FavoriteTargetType; p_target_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type AffiliationStatus = 'pending' | 'active' | 'revoked';
export type CourseApprovalStatus =
  | 'not_required'
  | 'pending_owner_review'
  | 'approved'
  | 'rejected';
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
export type NotificationType =
  | 'instructor_left_venue'
  | 'instructor_invite'
  | 'course_pending_approval'
  | 'course_approved'
  | 'course_rejected'
  | 'friend_request'
  | 'friend_accepted'
  // Legacy v1 per-friend rows — kept so old data still type-checks. New
  // writes use the aggregated `friends_going` type below.
  | 'friend_going_event'
  | 'friend_going_course'
  | 'friends_going'
  | 'event_date_changed'
  | 'event_cancelled'
  | 'event_reminder'
  | 'course_starting_this_week'
  | 'registration_spike'
  | 'spots_low'
  | 'favorite_venue_event'
  | 'favorite_artist_course';

export type FavoriteTargetType = 'venue' | 'artist';

export type NotificationPreferenceKey =
  | 'social'
  | 'friend_requests'
  | 'management'
  | 'event_updates'
  | 'favorites'
  | 'reminders';

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  social: true,
  friend_requests: true,
  management: true,
  event_updates: true,
  favorites: true,
  reminders: true,
};

// Shape returned by the get_notification_feed RPC. The unread_count + has_more
// pair on every row keeps the round-trip count down: the client reads one,
// not three queries, per pagination step.
export type NotificationFeedRow = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Json;
  group_key: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sort_at: string;
  unread_count: number;
  has_more: boolean;
};

// Shape of the data payload on an aggregated friends-going row. Computed by
// the DB trigger; the inbox row component reads `actors` to render avatars.
export type FriendsGoingActor = {
  id: string;
  display_name: string | null;
  at: string;
};

export type FriendsGoingData = {
  activity_kind: 'event' | 'course';
  activity_id: string;
  activity_title: string;
  deep_link: string;
  actors: FriendsGoingActor[];
};

export type FriendProfile = {
  id: string;
  display_name: string | null;
  is_artist: boolean;
};

// Derived types for app usage
export type Venue = Database['public']['Tables']['venues']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type EventSchedule = Database['public']['Tables']['event_schedules']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Poll = Database['public']['Tables']['polls']['Row'];
export type PollOption = Database['public']['Tables']['poll_options']['Row'];
export type PollVote = Database['public']['Tables']['poll_votes']['Row'];
export type Course = Database['public']['Tables']['courses']['Row'];
export type CourseSchedule = Database['public']['Tables']['course_schedules']['Row'];
export type VenueAffiliation = Database['public']['Tables']['venue_affiliations']['Row'];
export type Registration = Database['public']['Tables']['registrations']['Row'];
export type Friendship = Database['public']['Tables']['friendships']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type UserFavorite = Database['public']['Tables']['user_favorites']['Row'];

// The shape returned by the get_events_by_date_and_distance RPC
export type EventWithVenue = {
  event_id: string;
  date: string;
  title: string;
  description: string | null;
  dance_styles: string[];
  poster_url: string | null;
  price: number | null;
  price_note: string | null;
  dj: string | null;
  pre_register: boolean;
  registration_links: RegistrationLink[];
  venue_id: string;
  venue_name: string;
  venue_slug: string;
  address: string;
  city: string;
  venue_lat: number;
  venue_lng: number;
  parking_info: string | null;
  has_shelter: boolean;
  theme_colors: string[];
  distance_meters: number;
  schedules: ScheduleEntry[] | null;
  instructors: string[];
};

export type ScheduleEntry = {
  time: string;
  description: string;
  level: string | null;
};

export type RegistrationLink = {
  label: string;
  url: string;
  spots_total: number | null;
  spots_taken: number;
};

// Poll with nested options and vote counts
export type PollWithOptions = Poll & {
  poll_options: (PollOption & {
    poll_votes: { count: number }[];
  })[];
};
