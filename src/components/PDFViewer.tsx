'use client';

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// PDF.js worker 설정 - 안정적인 CDN 사용
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileId: string;
  title?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileId, title = 'PDF 문서' }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [scale, setScale] = useState<number>(1.0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [useFallback, setUseFallback] = useState<boolean>(false);

  // 모바일 감지 및 fallback 결정
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // 모바일에서만 iframe 사용 (PC는 그대로 유지)
      if (mobile) {
        const userAgent = navigator?.userAgent?.toLowerCase() || '';
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);

        // 모바일 기기에서는 바로 iframe 사용
        if (isIOS || isAndroid) {
          setUseFallback(true);
          setLoading(false);
        }
      } else {
        // PC에서는 항상 react-pdf 사용
        setUseFallback(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 모바일에서만 로딩 타임아웃 설정 - 3초 후 자동으로 iframe 전환
    const timeout = setTimeout(() => {
      if (loading && isMobile) {
        console.log('모바일 PDF 로딩 타임아웃, iframe으로 전환');
        setUseFallback(true);
        setLoading(false);
      }
    }, 3000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timeout);
    };
  }, [loading, isMobile]);

  // Google Drive PDF 미리보기 URL (여러 방법 시도)
  const pdfUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  
  // 프록시를 통한 PDF 로드 시도
  const proxyUrl = `/api/pdf-proxy?fileId=${fileId}`;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF 로드 성공, 페이지 수:', numPages);
    setNumPages(numPages);
    setLoading(false);
    setError('');
    setUseFallback(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF 로드 오류:', error);
    // 모바일에서는 바로 iframe으로 전환
    if (isMobile) {
      setUseFallback(true);
      setError('');
    } else {
      setError('PDF 파일을 불러올 수 없습니다.');
    }
    setLoading(false);
  }

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  // 모바일이나 fallback 모드에서는 iframe 사용
  if (useFallback || error) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-100 p-2 md:p-4 rounded-t border">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-medium text-gray-700 truncate">{title}</span>
            <span className="text-xs text-gray-500">
              {isMobile ? '모바일 뷰어' : 'PDF 미리보기'}
            </span>
          </div>
        </div>
        {/* Google Drive iframe 임베드 */}
        <div className="bg-white border border-t-0 rounded-b">
          <div className="p-2 md:p-4">
            <iframe
              src={embedUrl}
              className="w-full h-[500px] md:h-[680px] border border-gray-300 rounded"
              title="PDF 문서 미리보기"
              frameBorder="0"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      {/* PDF 컨트롤 바 */}
      <div className="bg-gray-100 p-2 md:p-4 rounded-t border">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center">
            <span className="text-xs md:text-sm font-medium text-gray-700 truncate">{title}</span>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* 페이지 네비게이션 */}
            {numPages > 0 && (
              <div className="flex items-center space-x-1 md:space-x-2">
                <button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="px-2 py-1 md:px-3 md:py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                >
                  ◀
                </button>
                <span className="text-xs md:text-sm text-gray-600 min-w-max">
                  {pageNumber}/{numPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="px-2 py-1 md:px-3 md:py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                >
                  ▶
                </button>
              </div>
            )}

            {/* 줌 컨트롤 - 데스크톱에서만 표시 */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={zoomOut}
                className="px-3 py-1 bg-white border rounded hover:bg-gray-50"
              >
                🔍-
              </button>
              <span className="text-sm text-gray-600 min-w-max">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="px-3 py-1 bg-white border rounded hover:bg-gray-50"
              >
                🔍+
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF 문서 영역 - A4 비율에 맞춘 높이 */}
      <div className="border border-t-0 rounded-b bg-white overflow-auto h-[625px] md:h-[720px]">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm md:text-base">PDF 로딩 중...</p>
            </div>
          </div>
        )}

        <div className="flex justify-center p-2 md:p-4">
          <Document
            file={proxyUrl} // 프록시 URL 먼저 시도
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => {
              console.log('프록시 로드 실패, iframe 방식으로 대체');
              setError('프록시 로드 실패');
            }}
            loading=""
            options={{
              cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
              standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
            }}
          >
            <Page
              pageNumber={pageNumber}
              scale={isMobile ? 0.8 : scale} // 모바일에서 자동 스케일 조정
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg max-w-full"
            />
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;