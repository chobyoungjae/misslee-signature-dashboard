/**
 * 인증 관련 TypeScript 타입 정의
 * JWT 토큰, 사용자 인증 상태 등을 위한 타입 안전성 제공
 */

/**
 * JWT 토큰 페이로드 구조
 * jwt.verify() 결과로 반환되는 디코딩된 토큰 데이터
 */
export interface JWTPayload {
  /** 사용자 로그인 ID */
  username: string;
  /** 사원 번호 */
  employeeNumber: string;
  /** 토큰 발급 시간 (Unix timestamp) */
  iat: number;
  /** 토큰 만료 시간 (Unix timestamp) */
  exp: number;
}

/**
 * API 인증 응답 구조
 */
export interface AuthResponse {
  /** 인증 성공 여부 */
  success: boolean;
  /** 응답 메시지 */
  message: string;
  /** 사용자 정보 (인증 성공 시) */
  user?: {
    username: string;
    employeeNumber: string;
    name: string;
  };
}

/**
 * 로그인 요청 데이터 구조
 */
export interface LoginRequest {
  /** 사용자 로그인 ID */
  username: string;
  /** 비밀번호 */
  password: string;
}

/**
 * JWT 검증 에러 타입
 */
export type JWTError = 
  | 'TOKEN_MISSING'
  | 'TOKEN_INVALID' 
  | 'TOKEN_EXPIRED'
  | 'TOKEN_MALFORMED';

/**
 * 인증 상태 타입
 */
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';