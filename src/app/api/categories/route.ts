import { NextResponse } from "next/server";
import { listPublicCategories } from "@/server/services/catalog-service";

export async function GET() {
  try {
    const categories = await listPublicCategories();
    return NextResponse.json({ data: categories });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
