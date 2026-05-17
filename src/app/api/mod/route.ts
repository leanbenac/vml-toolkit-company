export async function POST(request: Request) {
  const { password } = await request.json();
  const correctPassword = process.env.MOD_PASSWORD;

  if (!correctPassword) {
    console.error("MOD_PASSWORD is not set in environment variables");
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (password === correctPassword) {
    return Response.json({ success: true });
  }

  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
