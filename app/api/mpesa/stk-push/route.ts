import { NextResponse } from "next/server";
import { initiateStkPush } from "@/lib/mpesa";
import { query } from "@/lib/db";
import type { Customer } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const { customer_id, month, year } = body as {
    customer_id: number;
    month: number;
    year: number;
  };

  if (!customer_id || !month || !year) {
    return NextResponse.json(
      { error: "customer_id, month and year are required" },
      { status: 400 }
    );
  }

  // Fetch customer
  const { rows } = await query<Customer>(
    "SELECT * FROM customers WHERE id = $1",
    [customer_id]
  );
  const customer = rows[0];
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Normalise phone to 2547XXXXXXXX
  const rawPhone = customer.phone_number.replace(/\D/g, "");
  const phone = rawPhone.startsWith("0")
    ? `254${rawPhone.slice(1)}`
    : rawPhone.startsWith("254")
    ? rawPhone
    : `254${rawPhone}`;

  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  const result = await initiateStkPush({
    phone,
    amount: customer.monthly_fee,
    accountRef: `GC-${customer.room_number}`,
    description: `Garbage fee ${monthNames[month - 1]} ${year}`,
  });

  // Create a pending payment record
  await query(
    `INSERT INTO payments
       (customer_id, month, year, amount, method, phone_number, status)
     VALUES ($1,$2,$3,$4,'stk_push',$5,'unpaid')
     ON CONFLICT (customer_id, month, year) DO NOTHING`,
    [customer_id, month, year, customer.monthly_fee, phone]
  );

  return NextResponse.json(result);
}
