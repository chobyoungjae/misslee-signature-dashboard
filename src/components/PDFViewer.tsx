'use client';

import React from 'react';

interface PDFViewerProps {
  fileId: string;
  title?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileId, title = 'PDF 문서' }) => {
  // Google Drive PDF 임베드 URL
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  return (
    <div className="pdf-viewer space-y-4">
      {/* 헤더 */}
      <div className="bg-gray-100 p-2 md:p-4 rounded-t border">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-medium text-gray-700 truncate">{title}</span>
          <span className="text-xs text-gray-500">PDF 미리보기</span>
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
};

export default PDFViewer;