import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (Number(req.headers.get("content-length") || 0) > 9 * 1024 * 1024)
    return Response.json(
      { code: "too_large", message: "Upload too large" },
      { status: 413 },
    );
  const upstream = new URL(
    "/v1/" + path.map(encodeURIComponent).join("/"),
    process.env.API_URL || "http://127.0.0.1:8000",
  );
  upstream.search = req.nextUrl.search;
  const headers = new Headers();
  for (const name of ["content-type", "cookie", "authorization", "origin"]) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const body = ["GET", "HEAD"].includes(req.method)
      ? undefined
      : await req.arrayBuffer();
    if (body && body.byteLength > 9 * 1024 * 1024)
      return Response.json(
        { code: "too_large", message: "Upload too large" },
        { status: 413 },
      );
    const result = await fetch(upstream, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(45000)]),
      redirect: "manual",
    });
    const output = new Headers();
    for (const name of [
      "content-type",
      "content-disposition",
      "x-request-id",
    ]) {
      const value = result.headers.get(name);
      if (value) output.set(name, value);
    }
    for (const cookie of result.headers.getSetCookie())
      output.append("set-cookie", cookie);
    output.set("Cache-Control", "no-store");
    return new Response(result.body, {
      status: result.status,
      headers: output,
    });
  } catch {
    return Response.json(
      {
        code: "service_unavailable",
        message:
          "The support service is unavailable. Your submission is not confirmed. Please retry.",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
