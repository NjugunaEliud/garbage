import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Building } from "@/lib/types";

export async function GET() {
  const { rows } = await query<Building>(
    "SELECT * FROM buildings ORDER BY name ASC"
  );
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, location } = body as { name: string; location: string };

  if (!name?.trim() || !location?.trim()) {
    return NextResponse.json(
      { error: "Name and location are required" },
      { status: 400 }
    );
  }

  const { rows } = await query<Building>(
    "INSERT INTO buildings (name, location) VALUES ($1, $2) RETURNING *",
    [name.trim(), location.trim()]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
