import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Service Account 인증 설정
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: '파일 ID가 필요합니다.' }, { status: 400 });
    }

    console.log('PDF 프록시 요청 - fileId:', fileId);

    // Google Drive API 클라이언트 생성
    const drive = google.drive({ version: 'v3', auth });

    try {
      // Service Account로 파일 다운로드
      const response = await drive.files.get(
        {
          fileId: fileId,
          alt: 'media',
        },
        {
          responseType: 'arraybuffer',
        }
      );

      console.log('PDF 다운로드 성공');

      // response.data를 Buffer로 변환
      const pdfData = response.data as ArrayBuffer;

      // PDF 응답 반환
      return new NextResponse(pdfData, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="document.pdf"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (apiError: any) {
      console.error('Google Drive API 오류:', apiError);

      // API 실패 시 공개 URL로 폴백
      const publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

      const response = await fetch(publicUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error(`PDF 다운로드 실패: ${response.status}`);
      }

      const pdfBuffer = await response.arrayBuffer();

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="document.pdf"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  } catch (error) {
    console.error('PDF 프록시 오류:', error);
    return NextResponse.json(
      {
        error: 'PDF 파일을 불러오는 중 오류가 발생했습니다.',
        details: (error as Error)?.message
      },
      { status: 500 }
    );
  }
}