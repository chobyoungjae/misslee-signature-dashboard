'use client';

import { useState, useEffect } from 'react';
import { Document } from '@/types';

interface UseDocumentsReturn {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  signingDocumentId: string | null;
  handleSignature: (documentId: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

interface UseDocumentsProps {
  isAuthenticated: boolean;
  authLoading: boolean;
}

export const useDocuments = ({ isAuthenticated, authLoading }: UseDocumentsProps): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingDocumentId, setSigningDocumentId] = useState<string | null>(null);

  // 문서 목록 조회 함수
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/documents');
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('문서를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      setError('문서를 불러오는 중 오류가 발생했습니다.');
      console.error('Error fetching documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 문서 서명 처리 함수
  const handleSignature = async (documentId: string) => {
    try {
      // 서명 중 상태로 설정
      setSigningDocumentId(documentId);
      
      const response = await fetch('/api/documents/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId })
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('서명 처리에 실패했습니다.');
      }

      // 성공 시 문서 목록에서 제거
      setDocuments(prev => 
        prev.filter(doc => doc.id !== documentId)
      );

      alert('서명이 완료되었습니다!');
    } catch (error) {
      alert('서명 처리 중 오류가 발생했습니다.');
      console.error('Signature error:', error);
    } finally {
      // 서명 완료 후 상태 초기화
      setSigningDocumentId(null);
    }
  };

  // 수동 새로고침 함수
  const refreshDocuments = async () => {
    await fetchDocuments();
  };

  // 인증 상태 변경 시 문서 조회
  useEffect(() => {
    // 인증 로딩 중이면 대기
    if (authLoading) {
      return;
    }
    
    // 인증 확인이 완료되고 인증되지 않은 경우에만 리디렉션
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    // 인증된 경우 문서 조회
    fetchDocuments();
  }, [isAuthenticated, authLoading]);

  return {
    documents,
    isLoading,
    error,
    signingDocumentId,
    handleSignature,
    refreshDocuments,
  };
};