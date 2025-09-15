'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocuments } from '@/hooks/useDocuments';
import { Header } from '@/components/Header';
import { DocumentCard } from '@/components/DocumentCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    documents, 
    isLoading, 
    error, 
    signingDocumentId, 
    handleSignature, 
    refreshDocuments 
  } = useDocuments({ isAuthenticated, authLoading });

  // 인증 로딩 중이거나 인증되지 않은 경우
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner 
          message={authLoading ? '인증 확인 중...' : '로그인 페이지로 이동 중...'} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 대시보드 헤더 */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            미서명 문서({documents.length}건)
          </h2>
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <LoadingSpinner message="문서를 불러오는 중..." />
        )}

        {/* 에러 상태 */}
        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={refreshDocuments}
          />
        )}

        {/* 문서 목록 */}
        {!isLoading && !error && (
          <>
            {documents.length === 0 ? (
              <EmptyState 
                icon="🎉"
                title="모든 서명이 완료되었습니다!"
                description="현재 서명이 필요한 문서가 없습니다."
                action={{
                  label: "새로고침",
                  onClick: refreshDocuments
                }}
              />
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {documents.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onSignature={handleSignature}
                    isSigningInProgress={signingDocumentId === document.id}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 플로팅 새로고침 버튼 (모바일) */}
        <button
          onClick={refreshDocuments}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors sm:hidden"
          title="새로고침"
        >
          <span className="text-xl">🔄</span>
        </button>
      </main>
    </div>
  );
}