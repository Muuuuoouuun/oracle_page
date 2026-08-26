import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase 세션 쿠키 갱신.
 *
 * 액세스 토큰은 만료되므로 요청마다 갱신해줘야 로그인이 유지된다.
 * 설정이 없는 환경(localStorage 모드)에서는 아무것도 하지 않는다.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        for (const { name, value } of cookies) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookies) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // 이 호출이 만료 임박한 토큰을 갱신하고 위 setAll 로 쿠키를 다시 심는다.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * 정적 파일과 이미지 최적화 경로는 건너뛴다.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
