import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Customer } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const { rows } = await query<Customer>(
    `SELECT c.*, b.name AS building_name
     FROM customers c JOIN buildings b ON b.id = c.building_id
     WHERE c.id = $1`,
    [id]
  );
  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
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
    `UPDATE customers
     SET full_name = $1, phone_number = $2, building_id = $3,
         room_number = $4, monthly_fee = $5
     WHERE id = $6 RETURNING *`,
    [full_name.trim(), phone_number.trim(), building_id, room_number.trim(), monthly_fee ?? 0, id]
  );
  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { rowCount } = await query("DELETE FROM customers WHERE id = $1", [id]);
  if (!rowCount) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
