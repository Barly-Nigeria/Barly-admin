import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session-constants";
import { BARLY_API_BASE_URL, type TokenPair } from "@/lib/barly-api";

function jwtExpired(token: string) {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return true;
    const padded = payloadPart.replaceAll("-", "+").replaceAll("_", "/");
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh || (access && !jwtExpired(access))) {
    return NextResponse.next();
  }

  try {
    const res = await fetch(`${BARLY_API_BASE_URL}/v1/admin/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.next();
    const body = (await res.json()) as { data?: { tokens?: TokenPair } };
    const tokens = body.data?.tokens;
    if (!tokens) return NextResponse.next();

    const response = NextResponse.next();
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 6,
    });
    response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg)$).*)"],
};
