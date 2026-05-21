export async function POST(request: Request) {
  const { password } = await request.json();
  const correctPassword = process.env.MOD_PASSWORD || "mod";

  if (password === correctPassword) {
    return Response.json({ success: true });
  }

  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
