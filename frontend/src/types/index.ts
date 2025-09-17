export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

export interface Location {
  id: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  altitude?: number;
  heading?: number;
  timestamp: string;
  created_at: string;
  user_id: number;
  name?: string;
  description?: string;
}

export interface TrackPoint {
  id: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  track_id: number;
  accuracy?: number;
  speed?: number;
  altitude?: number;
  heading?: number;
}

export interface Track {
  id: number;
  name?: string;
  description?: string;
  distance?: number;
  duration?: number;
  created_at: string;
  user_id: number;
  points?: TrackPoint[];
}

export interface TrackWithPoints extends Track {
  track_points: TrackPoint[];
}

export interface GPSData {
  latitude: number;
  longitude: number;
  timestamp?: string;
  altitude?: number;
  speed?: number;
}

export interface TrackUpload {
  name: string;
  description?: string;
  points: GPSData[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LocationForm {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface NewTrackForm {
  name: string;
  description?: string;
  points?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  }[];
}

export interface MapMarker {
  position: [number, number];
  title: string;
}

export interface DashboardStats {
  total_tracks: number;
  total_distance: number;
  total_duration: number;
}

export interface AccessToken {
  access_token: string;
  token_type: string;
} 