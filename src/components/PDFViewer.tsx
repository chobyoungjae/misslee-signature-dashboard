'use client';

import React, { useState, useEffect } from 'react';

interface PDFViewerProps {
  fileId: string;
  title?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileId, title = 'PDF 문서' }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentMethod, setCurrentMethod] = useState(0);

  // 여러 방법들 시도
  const methods = [
    {
      name: 'Google Viewer',
      url: `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(`https://drive.google.com/uc?export=download&id=${fileId}`)}`,
    },
    {
      name: 'Direct Embed',
      url: `https://drive.google.com/file/d/${fileId}/preview`,
    },
    {
      name: 'Proxy',
      url: `/api/pdf-proxy?fileId=${fileId}`,
    },
  ];

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    }
  }, []);

  const handleMethodChange = () => {
    setCurrentMethod((prev) => (prev + 1) % methods.length);
  };

  const currentUrl = methods[currentMethod].url;

  return (
    <div className="pdf-viewer space-y-4">
      {/* 헤더 */}
      <div className="bg-gray-100 p-2 md:p-4 rounded-t border">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-medium text-gray-700 truncate">{title}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMethodChange}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              방법 변경 ({methods[currentMethod].name})
            </button>
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
          {currentMethod === 2 ? (
            // Proxy 방식: object 태그 사용
            <object
              data={currentUrl}
              type="application/pdf"
              className="w-full h-[500px] md:h-[680px] border border-gray-300 rounded"
            >
              <embed
                src={currentUrl}
                type="application/pdf"
                className="w-full h-[500px] md:h-[680px]"
              />
              <p className="text-center text-gray-500 mt-4">
                PDF를 표시할 수 없습니다.
                <a href={currentUrl} download className="text-blue-600 underline">
                  다운로드
                </a>
                하거나
                <button onClick={handleMethodChange} className="text-blue-600 underline mx-1">
                  다른 방법 시도
                </button>
              </p>
            </object>
          ) : (
            // Google Viewer 또는 Direct Embed: iframe 사용
            <iframe
              src={currentUrl}
              className="w-full h-[500px] md:h-[680px] border border-gray-300 rounded"
              title="PDF 문서 미리보기"
              frameBorder="0"
              allowFullScreen
              loading="lazy"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;