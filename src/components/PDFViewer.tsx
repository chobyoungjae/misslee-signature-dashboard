'use client';

import React, { useState, useEffect } from 'react';

interface PDFViewerProps {
  fileId: string;
  title?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileId, title = 'PDF 문서' }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    }
  }, []);

  // Google Drive 직접 보기 URL
  const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;

  // PC용 임베드 URL
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  // 프록시 URL (Service Account 사용)
  const proxyUrl = `/api/pdf-proxy?fileId=${fileId}`;

  // 모바일에서는 프록시 URL을 통한 미리보기 시도
  if (isMobile) {
    return (
      <div className="pdf-viewer space-y-4">
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="bg-gray-100 p-4 rounded-t border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">{title}</h3>
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                새 탭에서 열기
              </a>
            </div>
          </div>

          <div className="p-4">
            {/* 모바일용 embed 태그 */}
            <embed
              src={proxyUrl}
              type="application/pdf"
              className="w-full h-[400px] border border-gray-300 rounded"
              style={{ minHeight: '400px' }}
            />

            {/* 미리보기가 안 될 경우를 위한 대체 버튼 */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 mb-2">
                미리보기가 표시되지 않나요?
              </p>
              <div className="flex justify-center gap-2">
                <a
                  href={proxyUrl}
                  download
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  PDF 다운로드
                </a>
                <span className="text-gray-400">|</span>
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Google Drive에서 보기
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PC에서는 iframe 임베드 시도
  return (
    <div className="pdf-viewer space-y-4">
      {/* 헤더 */}
      <div className="bg-gray-100 p-2 md:p-4 rounded-t border">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-medium text-gray-700 truncate">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">PDF 미리보기</span>
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              새 탭에서 열기
            </a>
          </div>
        </div>
      </div>

      {/* PC용 PDF 뷰어 */}
      <div className="bg-white border border-t-0 rounded-b">
        <div className="p-2 md:p-4">
          <iframe
            src={embedUrl}
            className="w-full h-[680px] border border-gray-300 rounded"
            title="PDF 문서 미리보기"
            frameBorder="0"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;