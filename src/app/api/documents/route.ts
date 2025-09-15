import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { JWT_SECRET } from '@/lib/auth';
import { handleAPIError, ErrorHandlers } from '@/lib/errorHandler';
import { JWTPayload } from '@/types/auth';

// JWT_SECRET은 이미 @/lib/auth에서 안전하게 가져왔습니다

export async function GET(request: NextRequest) {
  console.log('=== 문서 조회 API 시작 ===');
  try {
    // JWT 토큰 검증
    const token = request.cookies.get('token')?.value;
    console.log('토큰 존재 여부:', !!token);
    
    if (!token) {
      return await ErrorHandlers.authentication('토큰이 없습니다', 'documents/GET');
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error: unknown) {
      return await ErrorHandlers.authentication(error, 'documents/GET');
    }

    // 사용자의 개인 스프레드시트 ID 가져오기
    console.log('사용자 정보 조회 시작:', decoded.username);
    const user = await GoogleSheetsService.getUserByLoginId(decoded.username);
    console.log('조회된 사용자 정보:', {
      exists: !!user,
      personalSheetId: user?.personalSheetId,
      name: user?.name
    });
    
    if (!user) {
      return await ErrorHandlers.notFound('사용자를 찾을 수 없습니다', 'documents/GET');
    }

    if (!user.personalSheetId) {
      return await ErrorHandlers.notFound('개인 스프레드시트가 설정되지 않았습니다', 'documents/GET');
    }

    // 개인 스프레드시트에서 미서명 문서 조회
    console.log('문서 조회 시작, 스프레드시트 ID:', user.personalSheetId);
    
    // 쿼리 파라미터로 고급 이미지 추출 사용 여부 결정
    const useAdvancedImageExtraction = request.nextUrl.searchParams.get('advanced') === 'true';
    console.log('고급 이미지 추출 사용:', useAdvancedImageExtraction);
    
    const documents = await GoogleSheetsService.getUnsignedDocuments(user.personalSheetId, useAdvancedImageExtraction);
    console.log('조회된 문서 개수:', documents.length);

    return NextResponse.json({ documents });
  } catch (error) {
    return await handleAPIError(error, 'documents/GET');
  }
}