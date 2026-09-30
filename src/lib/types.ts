export type GuestStatus = 'active' | 'ending_soon' | 'time_over' | 'completed' | 'cancelled';
export type PlayArea = 'trampoline' | 'soft_play';
export type SocksSize = 'small' | 'medium' | 'large';
export type GuestType = 'new' | 'existing';
export type CardType = 'basic' | 'premium';

export type StaffRole = 'staff' | 'admin';

export interface Guest {
  id: string;
  serial_number: number;
  guest_name: string;
  play_area?: PlayArea;
  socks_size?: SocksSize;
  guest_type?: GuestType;
  card_type?: CardType;
  in_time: string;
  expected_out_time: string;
  actual_out_time: string | null;
  duration_minutes: number;
  status: GuestStatus;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestWithExtensions extends Guest {
  extensions: Extension[];
}

export interface Extension {
  id: string;
  guest_id: string;
  extension_minutes: number;
  previous_out_time: string;
  new_out_time: string;
  created_by: string | null;
  created_at: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  created_at: string;
}

export interface Settings {
  id: number;
  park_name: string;
  timezone: string;
  ending_soon_minutes: number;
  notification_sound: boolean;
  browser_notifications: boolean;
  theme: 'light' | 'dark';
  updated_at: string;
}

export const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'updated_at'> = {
  park_name: 'unlimited_fun_is_here',
  timezone: 'Asia/Kolkata',
  ending_soon_minutes: 10,
  notification_sound: true,
  browser_notifications: false,
  theme: 'light',
};

export const DURATION_PRESETS = [
  { label: '2 Minutes', value: 2 },
  { label: '3 Minutes', value: 3 },
  { label: '5 Minutes', value: 5 },
  { label: '10 Minutes', value: 10 },
  { label: '30 Minutes', value: 30 },
  { label: '1 Hour', value: 60 },
];

export const EXTENSION_PRESETS = [
  { label: '+2 Minutes', value: 2 },
  { label: '+3 Minutes', value: 3 },
  { label: '+5 Minutes', value: 5 },
  { label: '+10 Minutes', value: 10 },
];

export const REMARK_SUGGESTIONS = [
  'Birthday Party',
  'Group Booking',
  'VIP',
  'Extended Time',
  'Special Requirement',
  'Test Profile',
];

export const PLAY_AREA_OPTIONS: Array<{ label: string; value: PlayArea }> = [
  { label: 'Trampoline Park', value: 'trampoline' },
  { label: 'Soft Play', value: 'soft_play' },
];

export const SOCKS_SIZE_OPTIONS: Array<{ label: string; value: SocksSize }> = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];

export const GUEST_TYPE_OPTIONS: Array<{ label: string; value: GuestType }> = [
  { label: 'New Guest', value: 'new' },
  { label: 'Existing Guest', value: 'existing' },
];

export const CARD_TYPE_OPTIONS: Array<{ label: string; value: CardType }> = [
  { label: 'Basic Card', value: 'basic' },
  { label: 'Premium Card', value: 'premium' },
];
