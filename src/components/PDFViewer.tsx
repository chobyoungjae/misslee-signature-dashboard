'use client';

import React from 'react';

interface PDFViewerProps {
  fileId: string;
  title?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileId, title = 'PDF 문서' }) => {
  // Google Drive 직접 보기 URL (새 탭)
  const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;

  // Direct Drive Preview (작동 확인됨!)
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  return (
    <div className="pdf-viewer space-y-4">
      <div className="bg-white rounded-lg border shadow-sm">
        {/* 헤더 */}
        <div className="bg-gray-100 p-3 md:p-4 rounded-t border-b">
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

        {/* PDF 뷰어 - Direct Drive View */}
        <div className="p-4">
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
};

export default PDFViewer;