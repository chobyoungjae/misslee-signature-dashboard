/**
 * API 응답 관련 TypeScript 타입 정의
 * 모든 API 엔드포인트의 일관된 응답 구조를 위한 제네릭 타입
 */

/**
 * 표준 API 응답 구조 (제네릭)
 * 모든 API 응답에서 일관된 형식을 보장
 */
export interface APIResponse<T = any> {
  /** 요청 성공 여부 */
  success: boolean;
  /** 응답 메시지 */
  message: string;
  /** 응답 데이터 (성공 시) */
  data?: T;
  /** 에러 정보 (실패 시) */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  /** 응답 타임스탬프 */
  timestamp: string;
}

/**
 * 문서 목록 API 응답
 */
export interface DocumentsResponse {
  documents: Document[];
  total: number;
  hasMore: boolean;
}

/**
 * 문서 서명 API 요청
 */
export interface SignDocumentRequest {
  documentId: string;
  signatureType: 'team-leader' | 'review' | 'ceo';
  signatureImageUrl?: string;
}

/**
 * 문서 서명 API 응답
 */
export interface SignDocumentResponse {
  documentId: string;
  signatureType: string;
  signedAt: string;
  updatedDocument: Document;
}

/**
 * 문서 미리보기 API 응답
 */
export interface DocumentPreviewResponse {
  sheetData: any[][];
  documentId: string;
  originalSheetId: string | null;
  actualDocumentId: string;
  gid: string | null;
  documentLink: string;
  rowIndex: number | null;
  fileType: 'pdf' | 'spreadsheet';
  previewUrl: string;
}

/**
 * Google Sheets 연결 테스트 API 응답
 */
export interface GoogleConnectionTestResponse {
  sheetsAccess: boolean;
  driveAccess: boolean;
  serviceAccountEmail: string;
  mainSpreadsheetAccess: boolean;
  testResults: {
    readPermission: boolean;
    writePermission: boolean;
    timestamp: string;
  };
}

/**
 * 에러 응답 타입 (errorHandler.ts와 일치)
 */
export interface ErrorResponse {
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
 * HTTP 상태 코드 타입
 */
export type HTTPStatusCode = 
  | 200 | 201 | 204        // Success
  | 400 | 401 | 403 | 404  // Client Error  
  | 500 | 502 | 503;       // Server Error

/**
 * API 메서드 타입
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Fetch 옵션 확장 타입
 */
export interface APIFetchOptions extends RequestInit {
  /** API 엔드포인트 */
  endpoint: string;
  /** 요청 데이터 (자동으로 JSON.stringify) */
  data?: any;
  /** 인증 토큰 자동 포함 여부 */
  includeAuth?: boolean;
  /** 타임아웃 (밀리초) */
  timeout?: number;
}