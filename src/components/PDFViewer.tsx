'use client';

import React, { useState, useEffect } from 'react';

interface PDFViewerProps {
  fileId: string;
  title?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileId, title = 'PDF 문서' }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [viewMethod, setViewMethod] = useState(0);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    }
  }, []);

  // 여러 가지 PDF 보기 방법들
  const methods = [
    {
      name: 'Google Docs Viewer',
      component: (
        <iframe
          src={`https://docs.google.com/gview?url=${encodeURIComponent(`https://drive.google.com/uc?export=download&id=${fileId}`)}&embedded=true`}
          className="w-full h-[500px] md:h-[680px] border border-gray-300 rounded"
          title="PDF 문서 미리보기"
          frameBorder="0"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      )
    },
    {
      name: 'PDF.js Viewer',
      component: (
        <iframe
          src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(`https://drive.google.com/uc?export=download&id=${fileId}`)}`}
          className="w-full h-[500px] md:h-[680px] border border-gray-300 rounded"
          title="PDF 문서 미리보기"
          frameBorder="0"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      )
    },
    {
      name: 'Direct Drive View',
      component: (
        <iframe
          src={`https://drive.google.com/file/d/${fileId}/preview`}
          className="w-full h-[500px] md:h-[680px] border border-gray-300 rounded"
          title="PDF 문서 미리보기"
          frameBorder="0"
          allowFullScreen
        />
      )
    },
    {
      name: 'Proxy Server',
      component: (
        <object
          data={`/api/pdf-proxy?fileId=${fileId}`}
          type="application/pdf"
          className="w-full h-[500px] md:h-[680px] border border-gray-300 rounded"
        >
          <embed
            src={`/api/pdf-proxy?fileId=${fileId}`}
            type="application/pdf"
            className="w-full h-[500px] md:h-[680px]"
          />
          <p className="text-center text-gray-500 mt-4">
            PDF를 표시할 수 없습니다.
          </p>
        </object>
      )
    }
  ];

  const nextMethod = () => {
    setViewMethod((prev) => (prev + 1) % methods.length);
  };

  // Google Drive 직접 보기 URL
  const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  return (
    <div className="pdf-viewer space-y-4">
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="bg-gray-100 p-3 md:p-4 rounded-t border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={nextMethod}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                방법 변경 ({methods[viewMethod].name})
              </button>
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

        <div className="p-4">
          {/* 선택된 방법으로 PDF 표시 */}
          {methods[viewMethod].component}

          {/* 대체 옵션들 */}
          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">
              PDF가 보이지 않나요? 다른 방법을 시도해보세요:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={nextMethod}
                className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
              >
                🔄 다른 방법 시도
              </button>
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                ✅ Google Drive에서 보기 (확실함)
              </a>
              <a
                href={downloadUrl}
                download
                className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                💾 PDF 다운로드
              </a>
              <a
                href={`https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(downloadUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                📄 Google Viewer (새 탭)
              </a>
            </div>
          </div>

          {/* 모바일 특별 안내 */}
          {isMobile && (
            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-800">
                💡 모바일 팁: "Google Drive에서 보기" 버튼이 가장 확실합니다!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;