import { Document } from '@/types';
import { GoogleSheetsClient } from './GoogleSheetsClient';
import { ImageService } from './ImageService';
import { log } from '../secureLogger';

// 문서 관련 Google Sheets 서비스
export class DocumentSheetService {
  private client: GoogleSheetsClient;
  private imageService: ImageService;
  
  // API 요청 제한을 위한 플래그
  private static isRateLimited = false;

  constructor() {
    this.client = GoogleSheetsClient.getInstance();
    this.imageService = new ImageService();
  }

  // 특정 스프레드시트에서 미서명 문서 조회
  async getUnsignedDocuments(sheetId: string, useAdvancedImageExtraction = false): Promise<Document[]> {
    try {
      log.debug(`Starting unsigned documents retrieval for sheet: ${sheetId}`);

      const rows = await this.client.getValues(sheetId, 'A:O');
      
      log.debug(`Rows fetched from spreadsheet: ${rows.length} rows`);

      // 완료되지 않은 문서들 찾기 (L열이 TRUE가 아닌 것들)
      const incompleteRows = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const completionStatus = row[11]; // L열: 완료체크
        
        if (completionStatus !== 'TRUE' && completionStatus !== true) {
          incompleteRows.push({ index: i, row });
        }
      }

      log.debug(`Incomplete documents found: ${incompleteRows.length} documents`);

      const documents: Document[] = [];

      // 고급 이미지 추출이 활성화된 경우 배치 처리
      let batchImageResults = new Map<string, string>();
      if (useAdvancedImageExtraction && incompleteRows.length > 0) {
        const cells = incompleteRows.flatMap(({ index }) => [
          { rowIndex: index, colIndex: 7 }, // H: 팀장서명
          { rowIndex: index, colIndex: 8 }, // I: 검토서명
          { rowIndex: index, colIndex: 9 }, // J: 대표서명
        ]);
        
        batchImageResults = await this.getBatchImageInfo(sheetId, cells);
      }

      // 각 미완료 문서 처리
      for (const { index, row } of incompleteRows) {
        const date = row[0] || ''; // A: 날짜
        const title = row[1] || ''; // B: 문서명
        const author = row[2] || ''; // C: 작성자
        const content = row[3] || ''; // D: 내용
        const teamLeaderSig = row[7] || ''; // H: 팀장서명
        const reviewSig = row[8] || ''; // I: 검토서명
        const ceoSig = row[9] || ''; // J: 대표서명
        const documentLink = row[14] || ''; // O: 문서링크
        
        log.debug(`Processing document row ${index}: ${title}`);
        
        // 이미지 URL 결정 (배치 결과 우선, 없으면 직접 추출)
        const teamLeaderImageUrl = batchImageResults.get(`${index}_7`) || this.imageService.extractImageUrl(teamLeaderSig);
        const reviewImageUrl = batchImageResults.get(`${index}_8`) || this.imageService.extractImageUrl(reviewSig);
        const ceoImageUrl = batchImageResults.get(`${index}_9`) || this.imageService.extractImageUrl(ceoSig);
        
        documents.push({
          id: `${sheetId}_${index}`,
          date: date,
          title: title,
          author: author,
          content: content,
          teamLeaderSignature: teamLeaderSig,
          reviewSignature: reviewSig,
          ceoSignature: ceoSig,
          teamLeaderSignatureImage: teamLeaderImageUrl,
          reviewSignatureImage: reviewImageUrl,
          ceoSignatureImage: ceoImageUrl,
          isCompleted: false,
          documentLink: documentLink, // O열의 문서 링크
        });
      }

      log.info(`Unsigned documents retrieved: ${documents.length} documents`);
      return documents;
    } catch (error) {
      log.error(`Failed to retrieve unsigned documents for sheet: ${sheetId}`, error as Error);
      throw new Error(`문서 조회 중 오류가 발생했습니다: ${(error as Error)?.message}`);
    }
  }

  // 배치로 이미지 정보 조회 (API 호출 최적화)
  private async getBatchImageInfo(sheetId: string, cells: Array<{rowIndex: number, colIndex: number}>): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    if (DocumentSheetService.isRateLimited || cells.length === 0) {
      return results;
    }

    try {
      log.debug(`Starting batch image info retrieval: ${cells.length} cells for sheet ${sheetId}`);

      // 셀 범위들을 그룹화하여 API 호출 최소화
      const ranges = cells.map(cell => `R${cell.rowIndex + 1}C${cell.colIndex + 1}`);

      const sheets = this.client.getSheets();
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        ranges: ranges,
        includeGridData: true,
        fields: 'sheets(data(rowData(values(effectiveValue,userEnteredValue,hyperlink,textFormatRuns))))'
      });

      const sheet = spreadsheet.data.sheets?.[0];
      const gridDataArray = sheet?.data || [];

      // 각 범위의 결과 처리
      for (let i = 0; i < cells.length && i < gridDataArray.length; i++) {
        const cell = cells[i];
        const gridData = gridDataArray[i];
        const cellData = gridData?.rowData?.[0]?.values?.[0];

        if (cellData) {
          const imageUrl = this.extractImageFromCellData(cellData);
          if (imageUrl) {
            results.set(`${cell.rowIndex}_${cell.colIndex}`, imageUrl);
          }
        }
      }

      log.debug(`Batch image info retrieval completed: ${results.size} results`);
      return results;
    } catch (error) {
      log.error(`Batch image info retrieval failed for sheet: ${sheetId}`, error as Error);
      
      // API 할당량 오류 처리
      if ((error as Error)?.message?.includes('quota') || (error as Error)?.message?.includes('rate')) {
        DocumentSheetService.isRateLimited = true;
        log.warn('API rate limited - disabling advanced image extraction temporarily');
        setTimeout(() => {
          DocumentSheetService.isRateLimited = false;
          log.info('API rate limit lifted');
        }, 60000); // 1분 후 해제
      }
      
      return results;
    }
  }

  // 셀 데이터에서 이미지 URL 추출
  private extractImageFromCellData(cellData: any): string | undefined {
    const effectiveValue = cellData?.effectiveValue?.stringValue || '';
    const userValue = cellData?.userEnteredValue?.stringValue || '';
    
    // 기본 URL 추출 시도
    let imageUrl = this.imageService.extractImageUrl(effectiveValue) || this.imageService.extractImageUrl(userValue);
    
    // 하이퍼링크에서 추출 시도
    if (!imageUrl && cellData.hyperlink) {
      imageUrl = this.imageService.extractImageUrl(cellData.hyperlink);
    }
    
    // 텍스트 포맷에서 링크 추출 시도
    if (!imageUrl && cellData.textFormatRuns) {
      for (const run of cellData.textFormatRuns) {
        if (run.format?.link?.uri) {
          imageUrl = this.imageService.extractImageUrl(run.format.link.uri);
          if (imageUrl) break;
        }
      }
    }
    
    return imageUrl;
  }

  // 문서 서명 완료 처리
  async markDocumentAsCompleted(documentId: string): Promise<void> {
    try {
      log.debug(`Marking document as completed: ${documentId}`);

      // 문서 ID에서 스프레드시트 ID와 행 인덱스 분리
      const lastUnderscoreIndex = documentId.lastIndexOf('_');
      const sheetId = documentId.substring(0, lastUnderscoreIndex);
      const rowIndexStr = documentId.substring(lastUnderscoreIndex + 1);
      const rowIndex = parseInt(rowIndexStr, 10);

      if (isNaN(rowIndex)) {
        throw new Error('잘못된 문서 ID 형식입니다.');
      }

      // L열(완료체크)을 TRUE로 설정
      const range = `L${rowIndex + 1}`;
      await this.client.updateValues(sheetId, range, [['TRUE']]);

      // 웹훅 호출로 팀장보드에 알림
      await this.callWebhookForCompletion(sheetId, rowIndex + 1);

      log.info(`Document marked as completed successfully - ID: ${documentId}, Row: ${rowIndex}`);
    } catch (error) {
      log.error(`Failed to mark document as completed - ID: ${documentId}`, error as Error);
      throw new Error('문서 완료 처리 중 오류가 발생했습니다.');
    }
  }

  // 웹훅 호출 (팀장보드 알림용)
  private async callWebhookForCompletion(sheetId: string, rowNumber: number): Promise<void> {
    try {
      // 먼저 현재 사용자 정보 가져오기 (sheetId로 사용자 찾기)
      const userName = await this.getUserNameBySheetId(sheetId);
      if (!userName) {
        log.warn('User name not found for webhook', { sheetId, rowNumber });
        return;
      }

      // 사용자별 웹훅 URL 가져오기 (문서ID 시트의 E열에 웹훅 URL 저장)
      const webhookUrl = await this.getWebhookUrlByName(userName);
      if (!webhookUrl) {
        log.warn('Webhook URL not found', { userName });
        return;
      }

      log.debug('Calling webhook for completion', { webhookUrl, userName });

      // HTTP POST 요청으로 웹훅 호출
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetId: sheetId,
          rowNumber: rowNumber,
          userName: userName,
          column: 12, // L열
          value: true // 불린값으로 전송
        }),
      });

      if (response.ok) {
        const result = await response.text();
        log.info('Webhook call successful', { result });
      } else {
        log.error('Webhook call failed', undefined, { status: response.status, statusText: response.statusText });
      }
    } catch (error) {
      log.error('Webhook call error', error as Error, { sheetId, rowNumber });
      // 웹훅 호출 실패는 치명적이지 않으므로 에러를 던지지 않음
    }
  }

  // 사용자별 웹훅 URL 조회 (문서ID 시트의 E열)
  private async getWebhookUrlByName(userName: string): Promise<string | null> {
    try {
      log.debug('Webhook URL search started', { userName });

      // "문서ID" 시트에서 사용자 이름으로 웹훅 URL 검색
      const rows = await this.client.getValues(this.client.getMainSpreadsheetId()!, '문서ID!A:E');
      log.debug('Document ID sheet rows fetched for webhook URL search', { rowCount: rows.length, userName });

      // 헤더 행 제외하고 검색
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const [documentId, name, spreadsheetId, scriptId, webhookUrl] = row;

        log.debug('Processing webhook URL row', { rowIndex: i, name });

        // 사용자 이름과 매칭
        if (name === userName && webhookUrl) {
          log.info('Webhook URL found', { userName, webhookUrl });
          return webhookUrl;
        }
      }

      log.warn('Webhook URL not found in document ID sheet', { userName });
      return null;
    } catch (error) {
      log.error('Webhook URL search failed', error as Error, { userName });
      return null;
    }
  }

  // 스프레드시트 ID로 사용자 이름 찾기
  private async getUserNameBySheetId(sheetId: string): Promise<string | null> {
    try {
      log.debug('User name search by sheet ID started', { sheetId });

      // "회원정보" 시트에서 스프레드시트 ID로 사용자 이름 검색
      const rows = await this.client.getValues(this.client.getMainSpreadsheetId()!, '회원정보!A:E');
      log.debug('Member info sheet rows fetched for user search', { rowCount: rows.length, sheetId });

      // 헤더 행 제외하고 검색
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const [employeeNumber, name, personalSheetId, username, email] = row;

        log.debug('Processing member row for sheet ID match', { rowIndex: i, personalSheetId, name });

        // 개인 스프레드시트 ID와 매칭
        if (personalSheetId === sheetId) {
          log.info('User name found by sheet ID', { sheetId, userName: name });
          return name;
        }
      }

      log.warn('User name not found by sheet ID', { sheetId });
      return null;
    } catch (error) {
      log.error('User name search by sheet ID failed', error as Error, { sheetId });
      return null;
    }
  }

  // 특정 문서 조회
  async getDocumentById(documentId: string): Promise<Document | null> {
    try {
      log.debug(`Getting document by ID: ${documentId}`);

      // 문서 ID에서 스프레드시트 ID와 행 인덱스 분리
      const lastUnderscoreIndex = documentId.lastIndexOf('_');
      const sheetId = documentId.substring(0, lastUnderscoreIndex);
      const rowIndexStr = documentId.substring(lastUnderscoreIndex + 1);
      const rowIndex = parseInt(rowIndexStr, 10);

      if (isNaN(rowIndex)) {
        throw new Error('잘못된 문서 ID 형식입니다.');
      }

      // 해당 행 데이터 조회
      const range = `A${rowIndex + 1}:O${rowIndex + 1}`;
      const rows = await this.client.getValues(sheetId, range);

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      const date = row[0] || '';
      const title = row[1] || '';
      const author = row[2] || '';
      const content = row[3] || '';
      const teamLeaderSig = row[7] || '';
      const reviewSig = row[8] || '';
      const ceoSig = row[9] || '';
      const isCompleted = row[11] === 'TRUE' || row[11] === true;
      const documentLink = row[14] || '';

      // 이미지 URL 추출
      const teamLeaderImageUrl = this.imageService.extractImageUrl(teamLeaderSig);
      const reviewImageUrl = this.imageService.extractImageUrl(reviewSig);
      const ceoImageUrl = this.imageService.extractImageUrl(ceoSig);

      return {
        id: documentId,
        date,
        title,
        author,
        content,
        teamLeaderSignature: teamLeaderSig,
        reviewSignature: reviewSig,
        ceoSignature: ceoSig,
        teamLeaderSignatureImage: teamLeaderImageUrl,
        reviewSignatureImage: reviewImageUrl,
        ceoSignatureImage: ceoImageUrl,
        isCompleted,
        documentLink,
      };
    } catch (error) {
      log.error(`Failed to get document by ID: ${documentId}`, error as Error);
      throw new Error('문서 조회 중 오류가 발생했습니다.');
    }
  }

  // 문서 미리보기를 위한 PDF 링크 추출
  async getDocumentPdfLink(documentId: string): Promise<string | null> {
    try {
      const document = await this.getDocumentById(documentId);
      
      if (!document || !document.documentLink) {
        return null;
      }

      // Google Sheets URL에서 PDF 다운로드 링크 생성
      const sheetUrl = document.documentLink;
      if (sheetUrl.includes('docs.google.com/spreadsheets')) {
        // 스프레드시트 ID 추출
        const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          const spreadsheetId = match[1];
          return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=pdf`;
        }
      }

      return sheetUrl; // 원본 링크 반환
    } catch (error) {
      log.error(`Failed to get document PDF link: ${documentId}`, error as Error);
      return null;
    }
  }
}