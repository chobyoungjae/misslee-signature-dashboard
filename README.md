# 미쓰리 서명 대시보드 📋

한국어 문서 서명 워크플로우를 위한 Next.js 15 기반 대시보드 애플리케이션입니다.

## ✨ 주요 기능

- 🔐 JWT 기반 사용자 인증
- 📊 Google Sheets 연동 데이터 관리
- ✍️ 전자서명 워크플로우 (팀장 → 검토 → 대표 서명)
- 📱 PWA 지원 (오프라인 사용 가능)
- 📄 PDF 문서 미리보기
- 🔔 실시간 서명 상태 추적

## 🚀 개발 서버 실행

```bash
npm run dev --turbopack    # Turbopack을 사용한 빠른 개발 서버
# 또는
npm run dev               # 일반 개발 서버
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 📋 프로젝트 구조

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS 4.0
- **인증**: JWT + bcryptjs
- **데이터베이스**: Google Sheets API
- **PWA**: Service Worker + Manifest

## 📚 더 알아보기

- [CLAUDE.md](./CLAUDE.md) - 프로젝트 상세 가이드
- [SETUP_SHEETS.md](./SETUP_SHEETS.md) - Google Sheets 설정 방법
- [Next.js 공식 문서](https://nextjs.org/docs)

## 🛠 기술 스택

- **Framework**: Next.js 15
- **언어**: TypeScript
- **스타일링**: Tailwind CSS 4.0
- **인증**: JWT + bcryptjs
- **API**: Google Sheets API
- **PDF**: react-pdf
- **PWA**: Service Worker
