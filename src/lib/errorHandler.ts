import { NextResponse } from 'next/server';

/**
 * 클라이언트에게 안전하게 전달할 수 있는 에러 정보
 */
export interface ClientSafeError {
  error: string;
  code?: string;
  timestamp: string;
  debug?: {
    context: string;
    originalError: string;
    stack?: string;
  };
}

/**
 * 에러 컨텍스트 정보 (로깅용)
 */
export interface ErrorContext {
  endpoint: string;
  method?: string;
  userId?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * 에러 타입별 분류
 */
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION', 
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  GOOGLE_API = 'GOOGLE_API',
  DATABASE = 'DATABASE',
  INTERNAL = 'INTERNAL'
}

/**
 * 민감 정보 패턴 (토큰, 비밀번호, API 키 등)
 */
const SENSITIVE_PATTERNS = [
  /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, // JWT 토큰
  /sk-[A-Za-z0-9]{48}/g, // OpenAI API 키  
  /AIza[0-9A-Za-z-_]{35}/g, // Google API 키
  /gcp-[A-Za-z0-9-_]+/g, // GCP 서비스 계정
  /"password"\s*:\s*"[^"]+"/g, // 비밀번호 필드
  /"token"\s*:\s*"[^"]+"/g, // 토큰 필드
  /Bearer\s+[A-Za-z0-9-._~+/]+=*/g, // Bearer 토큰
];

/**
 * 에러 메시지에서 민감 정보를 제거하고 안전한 형태로 변환
 */
export function sanitizeErrorMessage(message: string): string {
  let sanitized = message;
  
  // 민감 정보 패턴을 [REDACTED]로 마스킹
  SENSITIVE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  // Google API 에러 메시지를 사용자 친화적으로 변환
  if (sanitized.includes('insufficient authentication scopes')) {
    return '스프레드시트 접근 권한이 없습니다. 관리자에게 문의하세요.';
  }
  
  if (sanitized.includes('file not found') || sanitized.includes('not found')) {
    return '요청한 문서를 찾을 수 없습니다.';
  }
  
  if (sanitized.includes('quota exceeded') || sanitized.includes('rate limit')) {
    return '서비스 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
  }
  
  if (sanitized.includes('invalid credentials') || sanitized.includes('unauthorized')) {
    return '인증에 실패했습니다. 다시 로그인해주세요.';
  }
  
  return sanitized;
}

/**
 * 에러를 클라이언트에게 안전하게 전달할 수 있는 형태로 변환
 */
export function sanitizeErrorForClient(error: unknown, errorType?: ErrorType): ClientSafeError {
  const timestamp = new Date().toISOString();
  
  if (error instanceof Error) {
    const sanitizedMessage = sanitizeErrorMessage(error.message);
    
    return {
      error: sanitizedMessage,
      code: errorType,
      timestamp
    };
  }
  
  // Error 객체가 아닌 경우 (string, object 등)
  const errorString = typeof error === 'string' ? error : JSON.stringify(error);
  const sanitizedMessage = sanitizeErrorMessage(errorString);
  
  return {
    error: sanitizedMessage,
    code: errorType,
    timestamp
  };
}

/**
 * 에러 타입과 HTTP 상태 코드 매핑
 */
function getStatusCodeForErrorType(errorType: ErrorType): number {
  switch (errorType) {
    case ErrorType.AUTHENTICATION:
      return 401;
    case ErrorType.AUTHORIZATION:
      return 403;
    case ErrorType.VALIDATION:
      return 400;
    case ErrorType.NOT_FOUND:
      return 404;
    case ErrorType.GOOGLE_API:
      return 502; // Bad Gateway - 외부 서비스 오류
    case ErrorType.DATABASE:
      return 503; // Service Unavailable
    case ErrorType.INTERNAL:
    default:
      return 500;
  }
}

/**
 * 에러 메시지로부터 에러 타입을 자동 감지
 */
function detectErrorType(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid token') || message.includes('jwt') || message.includes('unauthorized')) {
      return ErrorType.AUTHENTICATION;
    }
    
    if (message.includes('permission') || message.includes('access denied') || message.includes('forbidden')) {
      return ErrorType.AUTHORIZATION;
    }
    
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorType.VALIDATION;
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND;
    }
    
    if (message.includes('google') || message.includes('sheets') || message.includes('api')) {
      return ErrorType.GOOGLE_API;
    }
    
    if (message.includes('database') || message.includes('connection')) {
      return ErrorType.DATABASE;
    }
  }
  
  return ErrorType.INTERNAL;
}

/**
 * API 에러를 처리하고 표준화된 응답을 반환하는 메인 함수
 */
export async function handleAPIError(
  error: unknown, 
  context: string,
  customErrorType?: ErrorType
): Promise<NextResponse> {
  // 에러 타입 결정 (커스텀이 있으면 우선, 없으면 자동 감지)
  const errorType = customErrorType || detectErrorType(error);
  
  // HTTP 상태 코드 결정
  const statusCode = getStatusCodeForErrorType(errorType);
  
  // 클라이언트 안전 에러 생성
  const clientSafeError = sanitizeErrorForClient(error, errorType);
  
  // 개발 환경에서만 상세 디버그 정보 추가
  let responseBody = clientSafeError;
  
  if (process.env.NODE_ENV === 'development') {
    responseBody = {
      ...clientSafeError,
      debug: {
        context,
        originalError: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    };
  }
  
  // secureLogger를 사용한 구조화된 에러 로깅
  const { log } = await import('./secureLogger');
  
  const errorContext: ErrorContext = {
    endpoint: context,
    additionalInfo: {
      errorType,
      statusCode,
      timestamp: clientSafeError.timestamp
    }
  };
  
  // 보안 로거로 에러 기록
  if (error instanceof Error) {
    log.error(`API Error in ${context}`, error, errorContext);
  } else {
    log.error(`API Error in ${context}: ${String(error)}`, undefined, errorContext);
  }
  
  return NextResponse.json(responseBody, { status: statusCode });
}

/**
 * 특정 에러 타입에 대한 편의 함수들
 */
export const ErrorHandlers = {
  authentication: async (error: unknown, context: string) => 
    await handleAPIError(error, context, ErrorType.AUTHENTICATION),
    
  authorization: async (error: unknown, context: string) => 
    await handleAPIError(error, context, ErrorType.AUTHORIZATION),
    
  validation: async (error: unknown, context: string) => 
    await handleAPIError(error, context, ErrorType.VALIDATION),
    
  notFound: async (error: unknown, context: string) => 
    await handleAPIError(error, context, ErrorType.NOT_FOUND),
    
  googleAPI: async (error: unknown, context: string) => 
    await handleAPIError(error, context, ErrorType.GOOGLE_API),
    
  database: async (error: unknown, context: string) => 
    await handleAPIError(error, context, ErrorType.DATABASE),
    
  internal: async (error: unknown, context: string) => 
    await handleAPIError(error, context, ErrorType.INTERNAL)
};

/**
 * 일반적인 에러 메시지 상수
 */
export const ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: '인증이 필요합니다.',
  INVALID_TOKEN: '유효하지 않은 토큰입니다.',
  ACCESS_DENIED: '접근 권한이 없습니다.',
  USER_NOT_FOUND: '사용자 정보를 찾을 수 없습니다.',
  DOCUMENT_NOT_FOUND: '문서를 찾을 수 없습니다.',
  INVALID_REQUEST: '잘못된 요청입니다.',
  GOOGLE_SHEETS_ERROR: 'Google Sheets 연결 중 오류가 발생했습니다.',
  INTERNAL_SERVER_ERROR: '서버 내부 오류가 발생했습니다.'
} as const;