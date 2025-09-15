/**
 * 안전한 JWT 시크릿 관리 유틸리티
 * 
 * 이 모듈은 JWT 시크릿의 안전한 관리를 담당합니다:
 * - 프로덕션 환경에서 시크릿 누락 시 애플리케이션 중단
 * - 개발 환경에서 임시 시크릿 생성 (보안 경고와 함께)
 * - 시크릿 최소 길이 검증
 */
import crypto from 'crypto';

/**
 * 안전한 JWT 시크릿을 반환합니다.
 * 
 * @returns {string} 검증된 JWT 시크릿
 * @throws {Error} 프로덕션에서 시크릿이 없거나 너무 짧은 경우
 */
export const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '🚨 보안 오류: JWT_SECRET이 프로덕션 환경에서 설정되지 않았습니다. ' +
        'JWT_SECRET 또는 NEXTAUTH_SECRET 환경 변수를 설정해주세요.'
      );
    }
    
    // 개발 환경에서만 무작위 시크릿 생성 (보안 경고와 함께)
    console.warn('⚠️  [보안 경고] JWT_SECRET이 설정되지 않아 임시 시크릿을 생성합니다.');
    console.warn('⚠️  프로덕션 배포 전에 반드시 JWT_SECRET 환경 변수를 설정하세요.');
    console.warn('⚠️  권장 길이: 최소 32자 이상');
    
    return crypto.randomBytes(64).toString('hex');
  }
  
  // 최소 길이 검증 (보안 모범 사례)
  if (secret.length < 32) {
    const errorMessage = 
      `🚨 보안 오류: JWT_SECRET이 너무 짧습니다. (현재: ${secret.length}자, 최소: 32자) ` +
      '강력한 시크릿을 생성하려면 "openssl rand -base64 32" 명령을 사용하세요.';
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMessage);
    } else {
      console.error(errorMessage);
      console.warn('⚠️  개발 환경에서는 계속 진행하지만, 프로덕션 배포 전에 수정하세요.');
    }
  }
  
  return secret;
};

/**
 * 한 번 초기화하여 모든 API에서 재사용
 * 애플리케이션 시작 시 즉시 검증됩니다.
 */
export const JWT_SECRET = getJWTSecret();

/**
 * JWT 토큰 생성용 옵션 (보안 강화)
 */
export const JWT_OPTIONS = {
  algorithm: 'HS256' as const,
  expiresIn: '24h',
  issuer: 'misslee-signature-dashboard',
  audience: 'misslee-users'
} as const;

/**
 * JWT 토큰 검증용 옵션
 */
export const JWT_VERIFY_OPTIONS = {
  algorithms: ['HS256'],
  issuer: 'misslee-signature-dashboard',
  audience: 'misslee-users'
};