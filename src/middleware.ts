import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PIN_COOKIE_NAME, isPinCookieValid } from "@/lib/pin";

// Paths que redirigen a /dashboard si el usuario YA esta autenticado.
const GUEST_ONLY_PATHS = ["/login", "/signup", "/forgot-password"];
// Paths siempre accesibles, autenticado o no (el link de reset de Supabase
// crea una sesion temporal y debe poder llegar aqui sin que el middleware lo saque).
const ALWAYS_ALLOWED_PATHS = ["/reset-password", "/auth/callback"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (matchesPath(pathname, ALWAYS_ALLOWED_PATHS)) {
    return response;
  }

  if (!user) {
    if (matchesPath(pathname, GUEST_ONLY_PATHS)) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Usuario autenticado desde aqui en adelante.
  if (matchesPath(pathname, GUEST_ONLY_PATHS)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  const pinCookie = request.cookies.get(PIN_COOKIE_NAME)?.value;
  const pinValid = accessToken ? await isPinCookieValid(accessToken, pinCookie) : false;

  if (matchesPath(pathname, ["/pin"])) {
    if (pinValid) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!pinValid) {
    const url = request.nextUrl.clone();
    url.pathname = "/pin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
