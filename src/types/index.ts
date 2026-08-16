export interface University {
  id: string;
  name: string;
  short_name: string | null;
  city: string | null;
}

export interface Faculty {
  id: string;
  university_id: string;
  name: string;
}

export interface Department {
  id: string;
  faculty_id: string;
  university_id: string;
  community_id: string;
  name: string;
}

export interface AcademicLevel {
  id: string;
  name: string;
  sort_order: number;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  university_id: string | null;
  faculty_id: string | null;
  department_id: string | null;
  level_id: string | null;
  interests: string[];
  role: 'user' | 'moderator' | 'admin';
  onboarding_completed: boolean;
  created_at: string;
  // joined display fields (populated by select queries)
  university?: University | null;
  faculty?: Faculty | null;
  department?: Department | null;
  level?: AcademicLevel | null;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  created_at: string;
}

/** Link Up state as seen from the current viewer's perspective. */
export type LinkUpViewState =
  | 'none'
  | 'request_sent'
  | 'request_received'
  | 'connected'
  | 'declined'
  | 'blocked';

export interface AppNotification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type:
    | 'link_up_request'
    | 'link_up_accepted'
    | 'new_message'
    | 'comment'
    | 'reply'
    | 'reaction'
    | 'mention'
    | 'community_activity'
    | 'resource_activity';
  entity_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url'> | null;
}
