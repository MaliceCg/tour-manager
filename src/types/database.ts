export type PaymentType = 'deposit' | 'full' | 'on_site';
export type ReservationStatus = 'confirmed' | 'pending' | 'cancelled';

export interface Activity {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  price: number;
  payment_type: PaymentType;
  created_at: string;
}

export interface Slot {
  id: string;
  activity_id: string;
  date: string;
  time: string;
  total_seats: number;
  reserved_seats: number;
  default_pickup_point: string | null;
  created_at: string;
}

export interface Reservation {
  id: string;
  slot_id: string;
  customer_name: string;
  customer_email: string;
  people_count: number;
  amount_paid: number;
  payment_mode: PaymentType;
  pickup_point: string | null;
  status: ReservationStatus;
  created_at: string;
}

// Extended types with relations
export interface SlotWithActivity extends Slot {
  activity?: Activity;
}

export interface ReservationWithSlot extends Reservation {
  slot?: SlotWithActivity;
}
