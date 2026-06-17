import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Customer } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const buildingId = searchParams.get("building_id");

  let sql = `
    SELECT c.*, b.name AS building_name
    FROM customers c
    JOIN buildings b ON b.id = c.building_id
  `;
  const params: unknown[] = [];

  if (buildingId) {
    sql += " WHERE c.building_id = $1";
    params.push(buildingId);
  }

  sql += " ORDER BY b.name, c.room_number ASC";

  const { rows } = await query<Customer>(sql, params);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { full_name, phone_number, building_id, room_number, monthly_fee } =
    body as Customer;

  if (!full_name?.trim() || !phone_number?.trim() || !building_id || !room_number?.trim()) {
    return NextResponse.json(
      { error: "full_name, phone_number, building_id and room_number are required" },
      { status: 400 }
    );
  }

  const { rows } = await query<Customer>(
    `INSERT INTO customers (full_name, phone_number, building_id, room_number, monthly_fee)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [full_name.trim(), phone_number.trim(), building_id, room_number.trim(), monthly_fee ?? 0]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
