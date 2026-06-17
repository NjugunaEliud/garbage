export interface Building {
  id: number;
  name: string;
  location: string;
  created_at: string;
}

export interface Customer {
  id: number;
  full_name: string;
  phone_number: string;
  building_id: number;
  building_name?: string;
  room_number: string;
  monthly_fee: number;
  created_at: string;
}

export type PaymentMethod = "stk_push" | "manual_reference";
export type PaymentStatus = "paid" | "unpaid" | "partial";

export interface Payment {
  id: number;
  customer_id: number;
  customer_name?: string;
  building_name?: string;
  room_number?: string;
  month: number;   // 1–12
  year: number;
  amount: number;
  method: PaymentMethod;
  mpesa_reference: string | null;
  phone_number: string;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_buildings: number;
  total_customers: number;
  total_collected_this_month: number;
  total_expected_this_month: number;
  unpaid_this_month: number;
}
