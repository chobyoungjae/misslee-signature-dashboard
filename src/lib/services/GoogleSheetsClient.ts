import { google } from 'googleapis';

// Google Sheets API 기본 클라이언트 클래스
export class GoogleSheetsClient {
  private static instance: GoogleSheetsClient;
  private auth: any;
  private sheets: any;
  private drive: any;

  private constructor() {
    // Google API 인증 설정
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file', // 개인 스프레드시트 생성용
        'https://www.googleapis.com/auth/script.projects', // Google Apps Script API용
      ],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  // 싱글톤 패턴
  static getInstance(): GoogleSheetsClient {
    if (!GoogleSheetsClient.instance) {
      GoogleSheetsClient.instance = new GoogleSheetsClient();
    }
    return GoogleSheetsClient.instance;
  }

  // Google Sheets API 클라이언트 반환
  getSheets() {
    return this.sheets;
  }

  // Google Drive API 클라이언트 반환
  getDrive() {
    return this.drive;
  }

  // 인증 객체 반환
  getAuth() {
    return this.auth;
  }

  // 메인 스프레드시트 ID 반환
  getMainSpreadsheetId(): string {
    return process.env.MAIN_SPREADSHEET_ID || '';
  }

  // API 호출 래퍼 (에러 처리 포함)
  async safeApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      console.error('Google API 호출 실패:', error);
      throw error;
    }
  }

  // 배치 업데이트를 위한 헬퍼
  async batchUpdate(spreadsheetId: string, requests: any[]) {
    return await this.safeApiCall(async () => {
      return await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests,
        },
      });
    });
  }

  // 값 읽기를 위한 헬퍼
  async getValues(spreadsheetId: string, range: string) {
    return await this.safeApiCall(async () => {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      return response.data.values || [];
    });
  }

  // 값 쓰기를 위한 헬퍼
  async updateValues(spreadsheetId: string, range: string, values: any[][]) {
    return await this.safeApiCall(async () => {
      return await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });
    });
  }

  // 값 추가를 위한 헬퍼
  async appendValues(spreadsheetId: string, range: string, values: any[][]) {
    return await this.safeApiCall(async () => {
      return await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values,
        },
      });
    });
  }
}