import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 보안 설정 강화
  poweredByHeader: false, // X-Powered-By 헤더 제거 (보안상 불필요한 정보 노출 방지)
  
  // 압축 설정 (성능 향상)
  compress: true,
  
  // 이미지 최적화 설정
  images: {
    domains: [
      'via.placeholder.com', // 테스트용 이미지
      'drive.google.com',    // Google Drive 이미지
      'docs.google.com',     // Google Docs 이미지
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 리다이렉트 설정 (보안)
  async redirects() {
    return [
      // HTTP를 HTTPS로 리다이렉트 (프로덕션 환경)
      ...(process.env.NODE_ENV === 'production' ? [
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://your-domain.com/:path*',
          permanent: true,
        },
      ] : []),
    ];
  },

  // 헤더 설정 (기존 + 보안 강화)
  async headers() {
    return [
      // PWA 매니페스트 헤더
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 서비스 워커 헤더
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // 정적 에셋 캐시 최적화
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API 경로에 대한 추가 보안 헤더 (미들웨어와 중복되지 않는 부분)
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex', // 검색 엔진에서 API 엔드포인트 제외
          },
        ],
      },
      // PDF 파일 처리 최적화
      {
        source: '/:path*.pdf',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, max-age=3600', // 1시간 캐시
          },
          {
            key: 'Content-Disposition',
            value: 'inline', // 브라우저에서 직접 표시
          },
        ],
      },
    ];
  },

  // 환경 변수 검증
  env: {
    // 클라이언트 사이드에서 접근 가능한 환경 변수만 명시적으로 노출
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || '미쓰리 서명 대시보드',
  },

  // 빌드 최적화
  output: 'standalone', // Docker 배포 최적화
  
  // 실험적 기능 설정
  experimental: {
    // 보안 강화를 위한 서버 컴포넌트 최적화
    serverComponentsExternalPackages: ['googleapis'],
    // 메모리 사용량 최적화
    optimizePackageImports: ['lucide-react'],
  },

  // 웹팩 설정 커스터마이징
  webpack: (config, { isServer }) => {
    // 서버 사이드에서만 특정 모듈 사용
    if (isServer) {
      config.externals.push('canvas', 'jsdom');
    }
    
    // PDF.js 최적화
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    return config;
  },
};
