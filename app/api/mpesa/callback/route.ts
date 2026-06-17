import { NextResponse } from "next/server";
import { extractCallbackMeta, type C2BCallbackBody } from "@/lib/mpesa";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  let body: C2BCallbackBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const meta = extractCallbackMeta(body);

  if (meta.resultCode !== 0) {
    // Payment was cancelled or failed — mark pending payments unpaid
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  if (!meta.mpesaReference || !meta.phone || !meta.amount) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // Update the most recent pending stk_push payment for this phone
  await query(
    `UPDATE payments
     SET status = 'paid',
         mpesa_reference = $1,
         amount = $2,
         paid_at = NOW()
     WHERE id = (
       SELECT p.id FROM payments p
       JOIN customers c ON c.id = p.customer_id
       WHERE p.method = 'stk_push'
         AND p.status = 'unpaid'
         AND p.phone_number = $3
       ORDER BY p.created_at DESC
       LIMIT 1
     )`,
    [meta.mpesaReference, meta.amount, meta.phone]
  );

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
