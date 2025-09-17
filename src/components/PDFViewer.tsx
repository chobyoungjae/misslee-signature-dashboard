'use client';

import React, { useState } from 'react';

interface PDFViewerProps {
  fileId: string;
  title?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileId, title = 'PDF 문서' }) => {
  const [useProxy, setUseProxy] = useState(false);

  // 프록시 URL (우리 서버를 통해 PDF 제공)
  const proxyUrl = `/api/pdf-proxy?fileId=${fileId}`;

  // Google Drive 임베드 URL (폴백용)
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  // 모바일 감지
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="pdf-viewer space-y-4">
      {/* 헤더 */}
      <div className="bg-gray-100 p-2 md:p-4 rounded-t border">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-medium text-gray-700 truncate">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">PDF 미리보기</span>
            {/* PDF 열기 버튼 - 모바일에서 유용 */}
            <a
              href={`https://drive.google.com/file/d/${fileId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              새 탭에서 열기
            </a>
          </div>
        </div>
      </div>

      {/* PDF 뷰어 */}
      <div className="bg-white border border-t-0 rounded-b">
        <div className="p-2 md:p-4">
          {useProxy || isMobile ? (
            // 모바일이나 프록시 모드: embed 태그 사용
            <embed
              src={proxyUrl}
              type="application/pdf"
              className="w-full h-[500px] md:h-[680px] border border-gray-300 rounded"
              title="PDF 문서"
            />
          ) : (
            // PC: Google Drive iframe 시도 (실패하면 프록시로 전환)
            <iframe
              src={embedUrl}
              className="w-full h-[500px] md:h-[680px] border border-gray-300 rounded"
              title="PDF 문서 미리보기"
              frameBorder="0"
              allowFullScreen
              loading="lazy"
              onError={() => {
                console.log('iframe 로드 실패, 프록시로 전환');
                setUseProxy(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;