# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Korean signature dashboard application called "미쓰리 서명 대시보드" (Miss Lee Signature Dashboard) built with Next.js 15. The application manages document signing workflows using Google Sheets as the backend data store.

## Essential Commands

### Development
```bash
cd signature-dashboard
npm run dev --turbopack  # Start development server with Turbopack
npm run build           # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
```

The development server runs on http://localhost:3000 by default.

## Architecture Overview

### Core Architecture
- **Frontend**: Next.js 15 with App Router
- **Authentication**: JWT tokens with bcryptjs for password hashing
- **Data Storage**: Google Sheets API integration
- **Styling**: Tailwind CSS 4.0
- **State Management**: React Context (AuthContext)
- **PWA Support**: Manifest and service worker configured

### Key Data Flow
1. **User Management**: Users are stored in a main Google Spreadsheet with a "회원정보" (Member Info) sheet
2. **Document Workflow**: Each user has a personal spreadsheet for their documents with signatures tracking
3. **Signature Process**: Documents track team leader, review, and CEO signatures in separate columns
4. **Google Apps Script Integration**: Webhook-based triggers for automation when signatures are completed

### Directory Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable React components
- `src/contexts/` - React Context providers (AuthContext)
- `src/lib/` - Core business logic (GoogleSheetsService)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions

### Critical Files
- `src/lib/googleSheets.ts` - Main Google Sheets integration service
- `src/lib/errorHandler.ts` - Centralized error handling with security sanitization ✅ (2025-09-15)
- `src/lib/secureLogger.ts` - Structured secure logging system ✅ (2025-09-15)
- `src/lib/auth.ts` - JWT token management and validation ✅ (2025-09-15)
- `src/middleware.ts` - Security headers and CORS policies ✅ (2025-09-15)
- `next.config.ts` - Production security and optimization settings ✅ (2025-09-15)
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/types/index.ts` - Core TypeScript interfaces (User, Document, SignatureStatus)
- `SETUP_SHEETS.md` - Google Sheets configuration guide
- `src/hooks/usePWA.ts` - PWA functionality hook
- `src/components/PDFViewer.tsx` - PDF document viewer component

## Google Sheets Integration

### Main Spreadsheet Structure
- **회원정보 sheet**: User account data (employee ID, name, personal sheet ID, username, email, join date, hashed password)
- **문서ID sheet**: Maps users to their personal spreadsheets and webhook URLs

### Personal Spreadsheet Structure (PRD format)
Each user has a personal spreadsheet with columns A-O:
- A: 날짜 (Date)
- B: 문서명 (Document Title) 
- C: 작성자 (Author)
- D: 내용 (Content)
- H: 팀장서명 (Team Leader Signature)
- I: 검토서명 (Review Signature)
- J: 대표서명 (CEO Signature)
- L: 완료체크 (Completion Check)
- O: 문서링크 (Document Link)

### Environment Variables Required
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=signature-dashboard-service@trigger-dashboard-457700.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=
MAIN_SPREADSHEET_ID=1A4oAr56J9ei2szU5vOm47UE5JlxjqfmmO4pXVVZmE98
JWT_SECRET=
```

## Authentication Flow

1. User registration creates entry in main spreadsheet "회원정보" sheet
2. Login validates against stored bcrypt hashed passwords
3. JWT tokens stored in HTTP-only cookies
4. AuthContext manages client-side authentication state
5. API routes use JWT verification middleware

## Document Signing Workflow

1. Documents appear in user's personal spreadsheet
2. Dashboard shows unsigned documents (where L column ≠ TRUE)
3. Signature completion updates L column to TRUE
4. Webhook triggers Google Apps Script for further automation
5. System tracks team leader, review, and CEO signature status

## Development Notes

- The app is designed as a PWA with offline capabilities
- Korean language interface throughout
- Uses Google Sheets as database with complex webhook integration
- Authentication is cookie-based with JWT tokens
- All Google Sheets operations go through GoogleSheetsService class
- Error handling includes comprehensive logging for debugging
- **보안 강화 완료**: 3단계 완전 보안 체계 구축 (Phase 1-3) ✅ (2025-09-15)
  - JWT 토큰 보안 + 에러 처리 표준화 + 인프라 보안 헤더

## 한국어 코딩 규칙 및 가이드라인

### 필수사항
- **함수명/변수명**: 직관적이고 명확하게 작성 (getUserSheetId, generateEmployeeNumber)
- **한글 주석 필수**: 코드 맥락, 이유, 목적을 한글로 설명
- **최신 문법 사용**: const/let, 템플릿 리터럴, 화살표 함수, async/await 활용
- **예외처리 필수**: try-catch, 입력값 검증, API 호출 에러 처리 포함
- **상수 분리**: 하드코딩 금지, 환경변수 및 설정 객체 활용
- **단일 책임**: 함수는 하나의 역할만 수행
- **TypeScript**: 타입 정의 필수, 인터페이스 적극 활용

### 금지사항
- var 사용, 축약어, 불명확한 이름
- 하드코딩된 문자열/숫자/URL
- 예외처리 없는 외부 호출
- 주석 없는 복잡한 로직
- any 타입 사용

### 응답방식
- 한글로 자세한 설명 제공
- 예제 코드 포함
- 단계별 구현 설명
- 성능 및 주의사항 명시
- 모바일 친화적 UI (Tailwind CSS 활용)

### 프로젝트 개발 시 주의사항
- 기술 스택: Next.js 15 + TypeScript + Tailwind CSS 4.0
- 단계별 구현 요청 (한 번에 전체 구현하지 말고)
- 구체적 요구사항 명시
- 한국어로 소통 및 응답

## Core Dependencies

### Key Libraries
- **Next.js 15**: React framework with App Router
- **TypeScript 5**: Type safety and development experience
- **Tailwind CSS 4.0**: Utility-first CSS framework
- **Google APIs (googleapis)**: Google Sheets and Drive integration
- **JWT (jsonwebtoken)**: Token-based authentication
- **bcryptjs**: Password hashing
- **react-pdf**: PDF document rendering
- **pdfjs-dist**: PDF.js library for PDF parsing

## 코드베이스 분석 및 개선사항

### CLAUDE.md 업데이트 내역 (2024.08.19)
- **환경변수**: 실제 Google Service Account 이메일과 스프레드시트 ID 값 추가
- **핵심 파일 목록**: types/index.ts, usePWA.ts, PDFViewer.tsx 등 중요 파일들 추가 
- **API 엔드포인트**: 모든 REST API 경로와 기능 정리 (인증, 문서, 테스트)
- **핵심 의존성**: Next.js 15, Google APIs, JWT, react-pdf 등 주요 라이브러리 용도 명시
- **테스트 가이드**: Google Sheets 연결 확인을 위한 테스트 엔드포인트 추가

### 개발자를 위한 빠른 참조
이 문서는 새로운 개발자나 Claude Code 인스턴스가 프로젝트를 빠르게 이해할 수 있도록 "큰 그림" 아키텍처와 중요한 함정들을 정리했습니다. 특히 Google Sheets ID 파싱, Next.js 15 params 처리, PDF 뷰어 SSR 문제 등 실제 개발 중 자주 발생하는 이슈들에 대한 해결책을 포함하고 있습니다.

## 중요한 개발 주의사항 및 함정

### 🚨 Google Sheets ID 파싱 주의사항
**문제**: Google Sheets ID 자체에 언더스코어(`_`)가 포함될 수 있음
**증상**: `documentId.split('_')`로 파싱 시 잘못된 분할로 "유효하지 않은 문서 ID" 오류

**올바른 해결법**:
```typescript
// ❌ 잘못된 방법 - 첫 번째 _로 분할
const [sheetId, rowIndexStr] = documentId.split('_');

// ✅ 올바른 방법 - 마지막 _로 분할  
const lastUnderscoreIndex = documentId.lastIndexOf('_');
const sheetId = documentId.substring(0, lastUnderscoreIndex);
const rowIndexStr = documentId.substring(lastUnderscoreIndex + 1);
```

### 🚨 Next.js 15 Params 처리
**문제**: Next.js 15에서 params가 Promise로 변경됨
**해결법**:
```typescript
// ✅ Next.js 15 호환
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### 🚨 PDF 뷰어 SSR 문제
**문제**: react-pdf의 DOMMatrix가 서버사이드에서 정의되지 않음
**해결법**:
```typescript
// ✅ 동적 import로 SSR 비활성화
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), { ssr: false });
```

### 🚨 Google Sheets API 권한 확인
**증상**: 같은 계정 소유 파일인데 Service Account로 접근 안됨
**체크리스트**:
1. Service Account 이메일이 스프레드시트에 공유되어 있는지
2. PDF 파일들이 "링크가 있는 모든 사용자" 권한인지
3. 폴더 권한 상속 설정 확인

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login 
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### Documents
- `GET /api/documents` - Get user's unsigned documents
- `POST /api/documents/sign` - Sign a document
- `GET /api/documents/[id]/preview` - Preview document PDF
- `GET /api/pdf-proxy` - Proxy for PDF file access

### Testing
- `POST /api/test/google-connection` - Test Google Sheets connection
- `POST /api/test/add-sample-document` - Add sample document for testing

## 작업 계획 및 진행 관리 규칙

### **필수 워크플로우 - 모든 복잡한 작업에 적용**

복잡한 작업(3단계 이상 또는 여러 파일 수정)을 진행할 때는 다음 단계를 반드시 따르세요:

#### **1단계: 로드맵 생성**
```markdown
## 📋 [작업명] 로드맵

### **Phase 1: [단계명] ([예상 시간])** 📋 **대기 중**
1. 📋 구체적 작업 1
2. 📋 구체적 작업 2
3. 📋 구체적 작업 3

### **Phase 2: [단계명] ([예상 시간])** 📋 **대기 중**
1. 📋 구체적 작업 1
2. 📋 구체적 작업 2
```

- **저장 위치**: `claudedocs/[작업명]_로드맵.md`
- **우선순위**: 긴급/높음/중간/낮음 표시
- **예상 시간**: 시간/일/주 단위로 명시

#### **2단계: 진행 상황 실시간 업데이트**
- **시작 시**: 📋 **대기 중** → 🔄 **진행 중**
- **완료 시**: 🔄 **진행 중** → ✅ **완료 (날짜)**
- **각 작업 완료 시**: `**[완료]**` 마크 추가

#### **3단계: 결과 문서화 및 통합 관리**
```markdown
**✅ 결과**: 구체적인 성과 및 개선 효과 명시
```

**📋 필수: 통합 현황 문서 생성**
- 복잡한 작업 완료 시 `claudedocs/[작업명]_통합_현황.md` 생성
- 분산된 문서들을 하나로 통합 정리
- 사용자가 "완료"라고 말하면 즉시 완료 상태 업데이트

### **TodoWrite 도구 필수 사용**
복잡한 작업 시 TodoWrite 도구로 병행 추적:
- **작업 시작 시**: TodoWrite에 주요 단계들 등록
- **진행 중**: 실시간 상태 업데이트 (in_progress → completed)
- **문서와 동기화**: 로드맵 파일과 TodoWrite 상태 일치

### **예시 - 보안 개선 작업**
✅ **올바른 진행 방식** (방금 완료한 작업):
1. `claudedocs/보안_개선_미리보기.md` 로드맵 생성
2. Phase 1~3 단계별 계획 수립
3. TodoWrite로 실시간 진행 추적
4. Phase 1 완료 후 문서 상태 업데이트
5. 결과 요약 및 다음 단계 제시

### **적용 대상**
- 보안 개선 작업
- 성능 최적화 작업  
- 아키텍처 리팩토링
- 새로운 기능 구현 (3단계 이상)
- 코드 품질 개선 작업
- 인프라 구축 작업

### **단순 작업 제외**
- 단일 파일 수정
- 버그 수정 (1-2단계)
- 문서 업데이트
- 설정 변경

### **⚡ 완료 체크 자동화 규칙**

#### **사용자가 "완료" 언급 시 필수 액션**
사용자가 다음과 같이 말하면 즉시 문서 업데이트:
- "완료됐어", "완료했어", "끝났어"
- "done", "finished", "completed"
- "Phase X 완료", "[작업명] 완료"

#### **자동 업데이트 항목**
1. **통합 현황 문서**: Phase 상태 → ✅ 완료 (날짜)
2. **개별 작업**: 📋 → ✅ **[완료]** 마크
3. **CLAUDE.md**: Critical Files에 완료 표시
4. **TodoWrite**: completed 상태로 변경

#### **실수 방지 체크리스트**
- [ ] 통합 현황 문서 업데이트
- [ ] CLAUDE.md에 완료 파일 추가
- [ ] TodoWrite 상태 동기화
- [ ] 결과 효과 문서화

**⚠️ 경고**: 이 규칙을 놓치면 문서 동기화 문제 발생

---

## Testing

No specific test framework is configured. Manual testing involves:
1. Register at `/register`
2. Verify user creation in Google Sheets "회원정보" sheet
3. Login at `/login` 
4. Check dashboard functionality at `/dashboard`
5. Test document signing workflow
6. Use test endpoints to verify Google Sheets connectivity