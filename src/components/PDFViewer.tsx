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

  // 모바일에서는 심플한 버튼 UI
  if (isMobile) {
    return (
      <div className="pdf-viewer space-y-4">
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="bg-gray-100 p-4 rounded-t border-b">
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          </div>

          <div className="p-6 text-center">
            <div className="mb-6">
              <svg
                className="w-20 h-20 text-gray-400 mx-auto mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              <p className="text-gray-600 text-sm mb-2">
                PDF 문서를 보려면 아래 버튼을 클릭하세요
              </p>
              <p className="text-gray-500 text-xs">
                모바일에서는 새 탭에서 열립니다
              </p>
            </div>

            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              📄 PDF 문서 보기
            </a>

            <div className="mt-4">
              <a
                href={`https://drive.google.com/uc?export=download&id=${fileId}`}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                PDF 다운로드
              </a>
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