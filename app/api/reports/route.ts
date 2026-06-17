import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const buildingId = searchParams.get("building_id");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  if (!buildingId || !month || !year) {
    return NextResponse.json(
      { error: "building_id, month and year are required" },
      { status: 400 }
    );
  }

  // All customers in the building
  const { rows: customers } = await query(
    `SELECT c.id, c.full_name, c.room_number, c.monthly_fee, c.phone_number
     FROM customers c WHERE c.building_id = $1 ORDER BY c.room_number`,
    [buildingId]
  );

  // Payments for those customers this month/year
  const { rows: payments } = await query(
    `SELECT p.customer_id, p.amount, p.status, p.mpesa_reference, p.paid_at, p.method
     FROM payments p
     JOIN customers c ON c.id = p.customer_id
     WHERE c.building_id = $1 AND p.month = $2 AND p.year = $3`,
    [buildingId, month, year]
  );

  const paymentMap = new Map(payments.map((p: Record<string, unknown>) => [p.customer_id, p]));

  const rows = customers.map((c: Record<string, unknown>) => {
    const pmt = paymentMap.get(c.id) as Record<string, unknown> | undefined;
    return {
      ...c,
      paid_amount: pmt?.amount ?? 0,
      status: pmt?.status ?? "unpaid",
      mpesa_reference: pmt?.mpesa_reference ?? null,
      paid_at: pmt?.paid_at ?? null,
      method: pmt?.method ?? null,
    };
  });

  const totalExpected = customers.reduce(
    (sum: number, c: Record<string, unknown>) => sum + Number(c.monthly_fee),
    0
  );
  const totalCollected = rows.reduce(
    (sum: number, r: Record<string, unknown>) => sum + Number(r.paid_amount),
    0
  );
  const numPaid = rows.filter((r: Record<string, unknown>) => r.status === "paid").length;
  const numUnpaid = rows.length - numPaid;

  return NextResponse.json({
    rows,
    summary: {
      total_expected: totalExpected,
      total_collected: totalCollected,
      outstanding: totalExpected - totalCollected,
      num_paid: numPaid,
      num_unpaid: numUnpaid,
    },
  });
}
