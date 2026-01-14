import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  // Delete at both paths to clear cookies from old (/portal) and new (/) config
  cookieStore.set("portal-token", "", { path: "/", maxAge: 0 });
  cookieStore.set("portal-token", "", { path: "/portal", maxAge: 0 });
  return NextResponse.json({ success: true });
}
