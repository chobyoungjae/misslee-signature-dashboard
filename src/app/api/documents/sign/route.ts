import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { JWT_SECRET } from '@/lib/auth';
import { handleAPIError, ErrorHandlers } from '@/lib/errorHandler';
import { JWTPayload } from '@/types/auth';

// JWT_SECRET은 이미 @/lib/auth에서 안전하게 가져왔습니다

export async function POST(request: NextRequest) {
  console.log('=== 서명 API 시작 ===');
  try {
    // JWT 토큰 검증
    const token = request.cookies.get('token')?.value;
    console.log('토큰 존재 여부:', !!token);
    
    if (!token) {
      return await ErrorHandlers.authentication('토큰이 없습니다', 'documents/sign/POST');
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error: unknown) {
      return await ErrorHandlers.authentication(error, 'documents/sign/POST');
    }

    // 요청 본문에서 documentId 추출
    const { documentId } = await request.json();
    console.log('받은 documentId:', documentId);
    
    if (!documentId) {
      return await ErrorHandlers.validation('문서 ID가 필요합니다', 'documents/sign/POST');
    }

    // 사용자의 개인 스프레드시트 ID 가져오기
    console.log('사용자 정보 조회 시작:', decoded.username);
    const user = await GoogleSheetsService.getUserByLoginId(decoded.username);
    console.log('조회된 사용자:', {
      exists: !!user,
      name: user?.name,
      personalSheetId: user?.personalSheetId
    });
    
    if (!user || !user.personalSheetId) {
      return await ErrorHandlers.notFound('사용자 정보를 찾을 수 없습니다', 'documents/sign/POST');
    }

    // documentId에서 시트 ID와 행 번호 추출 - 마지막 '_'로만 분할
    // documentId 형식: "{sheetId}_{rowIndex}"
    const lastUnderscoreIndex = documentId.lastIndexOf('_');
    const sheetId = documentId.substring(0, lastUnderscoreIndex);
    const rowIndexStr = documentId.substring(lastUnderscoreIndex + 1);
    const rowIndex = parseInt(rowIndexStr);
    console.log('파싱된 정보:', { sheetId, rowIndex, rowIndexStr });

    if (!sheetId || isNaN(rowIndex)) {
      return await ErrorHandlers.validation('유효하지 않은 문서 ID입니다', 'documents/sign/POST');
    }

    // 서명 완료 처리
    console.log('서명 완료 처리 시작...');
    await GoogleSheetsService.completeSignature(sheetId, rowIndex);
    console.log('서명 완료 처리 성공');

    return NextResponse.json({ 
      success: true, 
      message: '서명이 완료되었습니다.' 
    });
  } catch (error) {
    return await handleAPIError(error, 'documents/sign/POST');
  }
}