import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Building } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const { rows } = await query<Building>(
    "SELECT * FROM buildings WHERE id = $1",
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
  const { name, location } = body as { name: string; location: string };

  if (!name?.trim() || !location?.trim()) {
    return NextResponse.json(
      { error: "Name and location are required" },
      { status: 400 }
    );
  }

  const { rows } = await query<Building>(
    "UPDATE buildings SET name = $1, location = $2 WHERE id = $3 RETURNING *",
    [name.trim(), location.trim(), id]
  );
  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { rowCount } = await query("DELETE FROM buildings WHERE id = $1", [id]);
  if (!rowCount) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
