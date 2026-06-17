import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { rows: buildings } = await query(
    "SELECT COUNT(*) AS total_buildings FROM buildings"
  );
  const { rows: customers } = await query(
    "SELECT COUNT(*) AS total_customers FROM customers"
  );
  const { rows: monthStats } = await query(
    `SELECT
       COALESCE(SUM(p.amount), 0) AS total_collected,
       COUNT(CASE WHEN p.status = 'paid' THEN 1 END) AS num_paid
     FROM payments p
     WHERE p.month = $1 AND p.year = $2`,
    [month, year]
  );
  const { rows: expectedRow } = await query(
    "SELECT COALESCE(SUM(monthly_fee), 0) AS total_expected FROM customers"
  );

  return NextResponse.json({
    total_buildings: Number(buildings[0]?.total_buildings ?? 0),
    total_customers: Number(customers[0]?.total_customers ?? 0),
    total_collected_this_month: Number(monthStats[0]?.total_collected ?? 0),
    total_expected_this_month: Number(expectedRow[0]?.total_expected ?? 0),
    num_paid_this_month: Number(monthStats[0]?.num_paid ?? 0),
  });
}
