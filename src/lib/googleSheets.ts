// 새로운 모듈화된 GoogleSheetsService
// 기존의 모든 기능을 유지하면서 모듈별로 분리된 아키텍처

import { User, Document } from '@/types';
import { GoogleSheetsClient } from './services/GoogleSheetsClient';
import { UserSheetService } from './services/UserSheetService';
import { DocumentSheetService } from './services/DocumentSheetService';
import { ImageService } from './services/ImageService';
import { log } from './secureLogger';

export class GoogleSheetsService {
  private static userService = new UserSheetService();
  private static documentService = new DocumentSheetService();
  private static imageService = new ImageService();

  // ===========================================
  // 사용자 관련 메서드 (UserSheetService 위임)
  // ===========================================

  // 메인 스프레드시트에서 사용자 조회 (비밀번호 포함)
  static async getUserByLoginId(loginId: string): Promise<(User & { hashedPassword?: string }) | null> {
    return await this.userService.getUserByLoginId(loginId);
  }

  // 메인 스프레드시트에 새 사용자 추가
  static async createUser(userData: {
    employeeNumber: string;
    name: string;
    username: string;
    email: string;
    personalSheetId: string;
    hashedPassword: string;
  }): Promise<void> {
    return await this.userService.createUser(userData);
  }

  // 기존 개인 스프레드시트 ID를 이름으로 찾기
  static async getPersonalSheetIdByName(userName: string): Promise<string | null> {
    return await this.userService.getPersonalSheetIdByName(userName);
  }

  // 사용자의 개인 스프레드시트 ID 업데이트
  static async updateUserPersonalSheetId(username: string, personalSheetId: string): Promise<void> {
    return await this.userService.updateUserPersonalSheetId(username, personalSheetId);
  }

  // 사원번호 생성
  static async generateEmployeeNumber(): Promise<string> {
    return await this.userService.generateEmployeeNumber();
  }

  // 사용자명 중복 확인
  static async checkUsernameExists(username: string): Promise<boolean> {
    return await this.userService.checkUsernameExists(username);
  }

  // 이메일 중복 확인
  static async checkEmailExists(email: string): Promise<boolean> {
    return await this.userService.checkEmailExists(email);
  }

  // 마지막 사원번호 조회
  static async getLastEmployeeNumber(): Promise<string | null> {
    return await this.userService.getLastEmployeeNumber();
  }

  // 스프레드시트 데이터 조회 (범용 메서드)
  static async getSheetData(spreadsheetId: string, range: string): Promise<any[][]> {
    try {
      const client = GoogleSheetsClient.getInstance();
      return await client.getValues(spreadsheetId, range);
    } catch (error) {
      log.error(`Error getting sheet data - SpreadsheetID: ${spreadsheetId}, Range: ${range}`, error as Error);
      throw new Error('스프레드시트 데이터 조회 중 오류가 발생했습니다.');
    }
  }

  // GID로 특정 시트 데이터 조회
  static async getSheetDataByGid(spreadsheetId: string, gid: string, range: string): Promise<any[][]> {
    try {
      const client = GoogleSheetsClient.getInstance();
      // GID를 시트 이름으로 변환하여 사용
      const sheetRange = `'${gid}'!${range}`;
      return await client.getValues(spreadsheetId, sheetRange);
    } catch (error) {
      log.error(`Error getting sheet data by GID - SpreadsheetID: ${spreadsheetId}, GID: ${gid}, Range: ${range}`, error as Error);
      // GID로 실패하면 기본 range로 재시도
      try {
        const client = GoogleSheetsClient.getInstance();
        return await client.getValues(spreadsheetId, range);
      } catch (retryError) {
        log.error('Retry with basic range also failed', retryError as Error);
        throw new Error('스프레드시트 데이터 조회 중 오류가 발생했습니다.');
      }
    }
  }

  // ===========================================
  // 문서 관련 메서드 (DocumentSheetService 위임)
  // ===========================================

  // 특정 스프레드시트에서 미서명 문서 조회
  static async getUnsignedDocuments(sheetId: string, useAdvancedImageExtraction = false): Promise<Document[]> {
    return await this.documentService.getUnsignedDocuments(sheetId, useAdvancedImageExtraction);
  }

  // 문서 서명 완료 처리
  static async markDocumentAsCompleted(documentId: string): Promise<void> {
    return await this.documentService.markDocumentAsCompleted(documentId);
  }

  // 특정 문서 조회
  static async getDocumentById(documentId: string): Promise<Document | null> {
    return await this.documentService.getDocumentById(documentId);
  }

  // 문서 미리보기를 위한 PDF 링크 추출
  static async getDocumentPdfLink(documentId: string): Promise<string | null> {
    return await this.documentService.getDocumentPdfLink(documentId);
  }

  // 서명 완료 처리 (레거시 호환성)
  static async completeSignature(sheetId: string, rowIndex: number): Promise<void> {
    try {
      const documentId = `${sheetId}_${rowIndex}`;
      await this.documentService.markDocumentAsCompleted(documentId);
    } catch (error) {
      log.error(`Error completing signature - SheetID: ${sheetId}, Row: ${rowIndex}`, error as Error);
      throw new Error('서명 완료 처리 중 오류가 발생했습니다.');
    }
  }

  // ===========================================
  // 이미지 관련 메서드 (ImageService 위임)
  // ===========================================

  // 문자열에서 이미지 URL 추출
  static extractImageUrl(text: string): string | undefined {
    return this.imageService.extractImageUrl(text);
  }

  // 이미지 URL 유효성 검증
  static async validateImageUrl(url: string): Promise<boolean> {
    return await this.imageService.validateImageUrl(url);
  }

  // 이미지 캐시 정리
  static clearImageCache(): void {
    this.imageService.clearImageCache();
  }

  // Google Drive 파일 ID를 썸네일 URL로 변환
  static driveFileIdToThumbnailUrl(fileId: string, size = 'w200-h100'): string {
    return this.imageService.driveFileIdToThumbnailUrl(fileId, size);
  }

  // 이미지 프록시 URL 생성 (CORS 우회용)
  static createProxyImageUrl(originalUrl: string, baseUrl = ''): string {
    return this.imageService.createProxyImageUrl(originalUrl, baseUrl);
  }

  // ===========================================
  // 레거시 지원 메서드들 (기존 API 호환성 유지)
  // ===========================================

  // 기존 코드와의 호환성을 위한 메서드들
  // 필요에 따라 점진적으로 제거 가능

  // Webhook 관련 (추가 구현 필요시)
  static async addWebhookToSpreadsheet(spreadsheetId: string, scriptId: string): Promise<void> {
    // 구현 필요시 DocumentSheetService에 추가
    log.warn('addWebhookToSpreadsheet method called - implementation needed');
  }

  // 개인 스프레드시트 생성 (추가 구현 필요시)
  static async createPersonalSpreadsheet(userName: string): Promise<string> {
    // 구현 필요시 UserSheetService에 추가
    log.warn('createPersonalSpreadsheet method called - implementation needed');
    throw new Error('개인 스프레드시트 생성 기능은 아직 구현되지 않았습니다.');
  }

  // ===========================================
  // 유틸리티 메서드들
  // ===========================================

  // 서비스 상태 확인
  static getServiceStatus(): {
    userService: boolean;
    documentService: boolean;
    imageService: boolean;
    cacheStats: any;
  } {
    return {
      userService: !!this.userService,
      documentService: !!this.documentService,
      imageService: !!this.imageService,
      cacheStats: this.imageService.getCacheStats(),
    };
  }

  // 모든 캐시 초기화
  static clearAllCaches(): void {
    this.imageService.clearImageCache();
    log.info('All caches cleared');
  }

  // API 연결 테스트
  static async testConnection(): Promise<boolean> {
    try {
      const client = GoogleSheetsClient.getInstance();
      const mainSpreadsheetId = client.getMainSpreadsheetId();
      
      if (!mainSpreadsheetId) {
        throw new Error('메인 스프레드시트 ID가 설정되지 않았습니다.');
      }

      // 간단한 API 호출로 연결 테스트
      await client.getValues(mainSpreadsheetId, 'A1:A1');
      
      log.info('Google Sheets API connection test successful');
      return true;
    } catch (error) {
      log.error('Google Sheets API connection test failed', error as Error);
      return false;
    }
  }

  // 성능 통계 조회
  static getPerformanceStats(): {
    userServiceCalls: number;
    documentServiceCalls: number;
    imageServiceCalls: number;
    cacheHitRate: number;
  } {
    // 실제 구현시 각 서비스에서 통계 수집
    return {
      userServiceCalls: 0,
      documentServiceCalls: 0,
      imageServiceCalls: 0,
      cacheHitRate: 0,
    };
  }
}