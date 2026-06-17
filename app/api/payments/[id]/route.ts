import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Payment } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { rowCount } = await query("DELETE FROM payments WHERE id = $1", [id]);
  if (!rowCount) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { status, mpesa_reference } = body as Partial<Payment>;

  const { rows } = await query<Payment>(
    `UPDATE payments
     SET status = COALESCE($1, status),
         mpesa_reference = COALESCE($2, mpesa_reference)
     WHERE id = $3 RETURNING *`,
    [status ?? null, mpesa_reference ?? null, id]
  );
  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
