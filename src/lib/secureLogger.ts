/**
 * 보안 로거 - 민감 정보 필터링 및 구조화된 로깅
 * 프로덕션 환경에서 민감 정보 노출을 방지하고 일관된 로그 형식 제공
 */

/**
 * 로그 레벨 정의
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * 로그 컨텍스트 정보
 */
export interface LogContext {
  userId?: string;
  loginId?: string;
  userName?: string;
  username?: string;
  name?: string;
  title?: string;
  email?: string;
  endpoint?: string;
  method?: string;
  requestId?: string;
  sheetId?: string;
  spreadsheetId?: string;
  scriptId?: string;
  webhookUrl?: string;
  rowIndex?: number;
  rowNumber?: number;
  colIndex?: number;
  rowCount?: number;
  count?: number;
  cellCount?: number;
  personalSheetId?: string;
  uncachedCellCount?: number;
  cellValue?: any;
  type?: string;
  value?: any;
  imageUrl?: string;
  url?: string;
  uri?: string;
  hyperlink?: string;
  sheetName?: string;
  fullRange?: string;
  gid?: string;
  range?: string;
  index?: number;
  result?: any;
  status?: number;
  statusCode?: number;
  statusText?: string;
  duration?: number;
  additionalData?: Record<string, any>;
}

/**
 * 구조화된 로그 엔트리
 */
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * 민감 정보 패턴 정의
 */
const SENSITIVE_PATTERNS = [
  // JWT 토큰
  { pattern: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, replacement: '[JWT_TOKEN]' },
  
  // API 키들
  { pattern: /sk-[A-Za-z0-9]{48}/g, replacement: '[OPENAI_KEY]' },
  { pattern: /AIza[0-9A-Za-z-_]{35}/g, replacement: '[GOOGLE_API_KEY]' },
  { pattern: /gcp-[A-Za-z0-9-_]+/g, replacement: '[GCP_SERVICE_ACCOUNT]' },
  { pattern: /ya29\.[A-Za-z0-9-_]+/g, replacement: '[GOOGLE_ACCESS_TOKEN]' },
  
  // 비밀번호 관련
  { pattern: /"password"\s*:\s*"[^"]+"/g, replacement: '"password":"[REDACTED]"' },
  { pattern: /"currentPassword"\s*:\s*"[^"]+"/g, replacement: '"currentPassword":"[REDACTED]"' },
  { pattern: /"newPassword"\s*:\s*"[^"]+"/g, replacement: '"newPassword":"[REDACTED]"' },
  
  // 토큰 필드들
  { pattern: /"token"\s*:\s*"[^"]+"/g, replacement: '"token":"[REDACTED]"' },
  { pattern: /"accessToken"\s*:\s*"[^"]+"/g, replacement: '"accessToken":"[REDACTED]"' },
  { pattern: /"refreshToken"\s*:\s*"[^"]+"/g, replacement: '"refreshToken":"[REDACTED]"' },
  
  // Authorization 헤더
  { pattern: /Bearer\s+[A-Za-z0-9-._~+/]+=*/g, replacement: 'Bearer [REDACTED]' },
  { pattern: /Basic\s+[A-Za-z0-9+/]+=*/g, replacement: 'Basic [REDACTED]' },
  
  // 개인정보 (부분 마스킹)
  { pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, replacement: '$1***@$2' },
  { pattern: /(\d{3})-?\d{4}-?\d{4}/g, replacement: '$1-****-****' }, // 전화번호
  
  // Private key
  { pattern: /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, replacement: '[PRIVATE_KEY]' },
  { pattern: /-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/g, replacement: '[RSA_PRIVATE_KEY]' }
];

/**
 * 환경별 로그 레벨 설정
 */
function getMinLogLevel(): LogLevel {
  const env = process.env.NODE_ENV;
  const configLevel = process.env.LOG_LEVEL;
  
  // 환경변수로 명시적 설정이 있으면 우선
  if (configLevel) {
    switch (configLevel.toUpperCase()) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
    }
  }
  
  // 기본 환경별 설정
  switch (env) {
    case 'development':
      return LogLevel.DEBUG;
    case 'test':
      return LogLevel.WARN;
    case 'production':
      return LogLevel.INFO;
    default:
      return LogLevel.INFO;
  }
}

/**
 * 메시지에서 민감 정보를 제거
 */
function sanitizeMessage(message: string): string {
  let sanitized = message;
  
  SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
    sanitized = sanitized.replace(pattern, replacement);
  });
  
  return sanitized;
}

/**
 * 객체에서 민감 정보를 재귀적으로 제거
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeMessage(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // 키 이름으로 민감 정보 필드 감지
      const keyLower = key.toLowerCase();
      if (keyLower.includes('password') || 
          keyLower.includes('token') || 
          keyLower.includes('key') || 
          keyLower.includes('secret') ||
          keyLower.includes('auth')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * 로그 엔트리 생성
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel[level],
    message: sanitizeMessage(message),
  };
  
  if (context) {
    entry.context = sanitizeObject(context);
  }
  
  if (error) {
    entry.error = {
      name: error.name,
      message: sanitizeMessage(error.message),
      // 프로덕션에서는 스택 트레이스 제외
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    };
  }
  
  return entry;
}

/**
 * 로그 출력 함수
 */
function outputLog(entry: LogEntry): void {
  const formattedMessage = `[${entry.timestamp}] ${entry.level}: ${entry.message}`;
  
  // 개발 환경에서는 컨텍스트와 에러 정보도 함께 출력
  if (process.env.NODE_ENV === 'development') {
    if (entry.context || entry.error) {
      console.log(formattedMessage, {
        ...(entry.context && { context: entry.context }),
        ...(entry.error && { error: entry.error })
      });
    } else {
      console.log(formattedMessage);
    }
  } else {
    // 프로덕션에서는 기본 메시지만 출력
    console.log(formattedMessage);
  }
}

/**
 * 로그 레벨별 로깅 함수들
 */
class SecureLogger {
  private minLevel: LogLevel;
  
  constructor() {
    this.minLevel = getMinLogLevel();
  }
  
  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }
  
  /**
   * DEBUG 레벨 로깅 (개발 전용)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = createLogEntry(LogLevel.DEBUG, message, context);
    outputLog(entry);
  }
  
  /**
   * INFO 레벨 로깅
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = createLogEntry(LogLevel.INFO, message, context);
    outputLog(entry);
  }
  
  /**
   * WARN 레벨 로깅
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = createLogEntry(LogLevel.WARN, message, context);
    outputLog(entry);
  }
  
  /**
   * ERROR 레벨 로깅
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = createLogEntry(LogLevel.ERROR, message, context, error);
    outputLog(entry);
  }
  
  /**
   * API 요청 로깅 (INFO 레벨)
   */
  apiRequest(method: string, endpoint: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${endpoint}`, {
      ...context,
      method,
      endpoint
    });
  }
  
  /**
   * API 응답 로깅 (INFO 레벨)
   */
  apiResponse(method: string, endpoint: string, statusCode: number, duration?: number): void {
    const message = duration 
      ? `API Response: ${method} ${endpoint} - ${statusCode} (${duration}ms)`
      : `API Response: ${method} ${endpoint} - ${statusCode}`;
      
    this.info(message, {
      method,
      endpoint,
      statusCode,
      ...(duration && { duration })
    });
  }
  
  /**
   * 사용자 액션 로깅 (INFO 레벨)
   */
  userAction(action: string, userId?: string, additionalData?: Record<string, any>): void {
    this.info(`User Action: ${action}`, {
      userId,
      additionalData: sanitizeObject(additionalData)
    });
  }
  
  /**
   * Google Sheets API 로깅
   */
  googleSheetsAPI(operation: string, sheetId?: string, range?: string, error?: Error): void {
    const message = `Google Sheets API: ${operation}`;
    const context: LogContext = {
      additionalData: {
        operation,
        ...(sheetId && { sheetId: sheetId.substring(0, 8) + '...' }), // ID 부분 마스킹
        ...(range && { range })
      }
    };
    
    if (error) {
      this.error(message, error, context);
    } else {
      this.info(message, context);
    }
  }
  
  /**
   * 보안 이벤트 로깅 (WARN 레벨)
   */
  securityEvent(event: string, context?: LogContext): void {
    this.warn(`Security Event: ${event}`, context);
  }
  
  /**
   * 성능 측정 로깅
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;
    const message = `Performance: ${operation} took ${duration}ms`;
    
    if (level === LogLevel.WARN) {
      this.warn(message, { ...context, duration });
    } else {
      this.info(message, { ...context, duration });
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const secureLogger = new SecureLogger();

// 편의 함수들 내보내기
export const log = {
  debug: (message: string, context?: LogContext) => secureLogger.debug(message, context),
  info: (message: string, context?: LogContext) => secureLogger.info(message, context),
  warn: (message: string, context?: LogContext) => secureLogger.warn(message, context),
  error: (message: string, error?: Error, context?: LogContext) => secureLogger.error(message, error, context),
  
  // 특수 로깅 함수들
  apiRequest: secureLogger.apiRequest.bind(secureLogger),
  apiResponse: secureLogger.apiResponse.bind(secureLogger),
  userAction: secureLogger.userAction.bind(secureLogger),
  googleSheetsAPI: secureLogger.googleSheetsAPI.bind(secureLogger),
  securityEvent: secureLogger.securityEvent.bind(secureLogger),
  performance: secureLogger.performance.bind(secureLogger)
};