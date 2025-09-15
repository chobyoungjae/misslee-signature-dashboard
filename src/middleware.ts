import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js 15 미들웨어 - 보안 헤더 및 CORS 정책 관리
 * 모든 요청에 대해 보안 헤더를 자동으로 추가하고 CORS 정책을 적용
 */

/**
 * 보안 헤더 설정
 * 프로덕션 환경에서 다양한 보안 위협으로부터 보호
 */
function setSecurityHeaders(response: NextResponse): NextResponse {
  // CSP (Content Security Policy) - XSS 공격 방지
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:", // PDF 뷰어를 위한 blob: 허용
    "connect-src 'self' https://sheets.googleapis.com https://www.googleapis.com https://drive.google.com https://docs.google.com",
    "frame-src 'self' https://docs.google.com https://drive.google.com", // Google Docs 임베드용
    "worker-src 'self' blob:", // PDF.js worker 지원
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspPolicy);

  // HSTS (HTTP Strict Transport Security) - HTTPS 강제
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // X-Frame-Options - 클릭재킹 공격 방지
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - MIME 타입 스니핑 방지
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy - 리퍼러 정보 제어
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // X-DNS-Prefetch-Control - DNS 프리페치 제어
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  // Permissions-Policy - 브라우저 기능 제한
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  return response;
}

/**
 * CORS 정책 설정
 * API 엔드포인트별로 적절한 CORS 헤더 적용
 */
function setCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin');
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 프로덕션과 개발 환경에서 다른 CORS 정책 적용
  const allowedOrigins = isProduction 
    ? [
        'https://misslee-signature-dashboard.vercel.app',
        'https://your-production-domain.com' // 실제 프로덕션 도메인으로 교체
      ]
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000'
      ];

  // Origin 검증
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (!isProduction) {
    // 개발 환경에서는 localhost 허용
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  }

  // API 경로에 대한 CORS 헤더 설정
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin'
    );
    response.headers.set('Access-Control-Max-Age', '86400'); // 24시간 preflight 캐시
  }

  return response;
}

/**
 * API 엔드포인트별 보안 정책
 * 민감한 API에 대한 추가 보안 검증
 */
function applyEndpointSecurity(request: NextRequest, response: NextResponse): NextResponse {
  const pathname = request.nextUrl.pathname;

  // 인증 관련 API - 추가 보안 헤더
  if (pathname.startsWith('/api/auth/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // 문서 관련 API - 적절한 캐시 정책
  if (pathname.startsWith('/api/documents/')) {
    response.headers.set('Cache-Control', 'private, max-age=300'); // 5분 캐시
  }

  // 테스트 API - 프로덕션에서 차단
  if (pathname.startsWith('/api/test/') && process.env.NODE_ENV === 'production') {
    return new NextResponse('Test APIs are disabled in production', { status: 403 });
  }

  return response;
}

/**
 * 메인 미들웨어 함수
 * 모든 요청에 대해 보안 정책 적용
 */
export function middleware(request: NextRequest) {
  // Preflight 요청 처리
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    setCorsHeaders(request, response);
    return response;
  }

  // 정상 요청 처리
  const response = NextResponse.next();

  // 보안 헤더 적용
  setSecurityHeaders(response);

  // CORS 헤더 적용
  setCorsHeaders(request, response);

  // 엔드포인트별 보안 정책 적용
  applyEndpointSecurity(request, response);

  return response;
}

/**
 * 미들웨어 적용 경로 설정
 * API 경로와 주요 페이지에만 적용하여 성능 최적화
 */
export const config = {
  matcher: [
    // API 경로 전체
    '/api/:path*',
    // 주요 페이지들
    '/',
    '/login',
    '/register', 
    '/dashboard',
    '/document/:path*',
    // 정적 파일 제외
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
};