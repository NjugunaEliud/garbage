import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Payment } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer_id");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const buildingId = searchParams.get("building_id");

  const conditions: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (customerId) { conditions.push(`p.customer_id = $${i++}`); params.push(customerId); }
  if (month)      { conditions.push(`p.month = $${i++}`);       params.push(month); }
  if (year)       { conditions.push(`p.year = $${i++}`);        params.push(year); }
  if (buildingId) { conditions.push(`c.building_id = $${i++}`); params.push(buildingId); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT p.*, c.full_name AS customer_name, c.room_number,
           b.name AS building_name
    FROM payments p
    JOIN customers c ON c.id = p.customer_id
    JOIN buildings b ON b.id = c.building_id
    ${where}
    ORDER BY p.paid_at DESC
  `;

  const { rows } = await query<Payment>(sql, params);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { customer_id, month, year, amount, method, mpesa_reference, phone_number, status } =
    body as Payment;

  if (!customer_id || !month || !year || !amount || !method || !phone_number) {
    return NextResponse.json(
      { error: "customer_id, month, year, amount, method and phone_number are required" },
      { status: 400 }
    );
  }

  const { rows } = await query<Payment>(
    `INSERT INTO payments
       (customer_id, month, year, amount, method, mpesa_reference, phone_number, status, paid_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())
     ON CONFLICT (customer_id, month, year)
     DO UPDATE SET amount = EXCLUDED.amount,
                   method = EXCLUDED.method,
                   mpesa_reference = EXCLUDED.mpesa_reference,
                   phone_number = EXCLUDED.phone_number,
                   status = EXCLUDED.status,
                   paid_at = NOW()
     RETURNING *`,
    [
      customer_id,
      month,
      year,
      amount,
      method,
      mpesa_reference ?? null,
      phone_number,
      status ?? "paid",
    ]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
