import { getSessionUser } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ user: null });
  return Response.json({ user: serializeUser(user) });
}
