import { User } from '@/types';
import { GoogleSheetsClient } from './GoogleSheetsClient';
import { log } from '../secureLogger';

// 사용자 관련 Google Sheets 서비스
export class UserSheetService {
  private client: GoogleSheetsClient;

  constructor() {
    this.client = GoogleSheetsClient.getInstance();
  }

  // 메인 스프레드시트에서 사용자 조회 (비밀번호 포함)
  async getUserByLoginId(loginId: string): Promise<(User & { hashedPassword?: string }) | null> {
    try {
      // 먼저 회원정보 시트가 있는지 확인하고 없으면 생성
      await this.ensureMemberInfoSheetExists();
      
      const rows = await this.client.getValues(
        this.client.getMainSpreadsheetId(),
        '회원정보!A:G' // 회원정보 시트의 A(사원번호) ~ G(비밀번호)
      );
      
      // 헤더 행 제외하고 검색
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const [employeeNumber, name, personalSheetId, username, email, joinDate, hashedPassword] = row;
        
        // 아이디 또는 이메일로 매칭
        if (username === loginId || email === loginId) {
          return {
            employeeNumber,
            name,
            username,
            email,
            joinDate,
            status: 'active',
            personalSheetId,
            hashedPassword,
          };
        }
      }
      
      return null;
    } catch (error) {
      log.error(`Error fetching user with loginId: ${loginId}`, error as Error);
      throw new Error('사용자 조회 중 오류가 발생했습니다.');
    }
  }

  // 메인 스프레드시트에 새 사용자 추가
  async createUser(userData: {
    employeeNumber: string;
    name: string;
    username: string;
    email: string;
    personalSheetId: string;
    hashedPassword: string;
  }): Promise<void> {
    try {
      const joinDate = new Date().toISOString().split('T')[0];
      
      // 먼저 '회원정보' 시트가 있는지 확인하고 없으면 생성
      await this.ensureMemberInfoSheetExists();

      await this.client.appendValues(
        this.client.getMainSpreadsheetId(),
        '회원정보!A:G', // 회원정보 시트의 G열에 비밀번호 추가
        [[
          userData.employeeNumber,
          userData.name,
          userData.personalSheetId,
          userData.username,
          userData.email,
          joinDate,
          userData.hashedPassword,
        ]]
      );

      log.info(`User created successfully: ${userData.username}`);
    } catch (error) {
      log.error(`Error creating user: ${userData.username}`, error as Error);
      throw new Error('사용자 생성 중 오류가 발생했습니다.');
    }
  }

  // 기존 개인 스프레드시트 ID를 이름으로 찾기
  async getPersonalSheetIdByName(userName: string): Promise<string | null> {
    try {
      log.debug(`Personal spreadsheet ID search started for: ${userName}`);
      
      // "문서ID" 시트에서 사용자 이름으로 검색
      const rows = await this.client.getValues(
        this.client.getMainSpreadsheetId(),
        '문서ID!A:C' // A, B, C 열 (문서ID, 사용자명, 스프레드시트ID)
      );

      log.debug(`Document ID sheet rows fetched for personal sheet search: ${rows.length} rows for ${userName}`);

      // 헤더 행 제외하고 검색
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const [, name, spreadsheetId] = row;
        
        log.debug(`Processing document ID sheet row ${i}: ${name}`);
        
        // 사용자 이름과 매칭
        if (name === userName && spreadsheetId) {
          log.info(`Personal spreadsheet ID found for ${userName}: ${spreadsheetId}`);
          return spreadsheetId;
        }
      }
      
      log.info(`Personal spreadsheet ID not found for: ${userName}`);
      return null;
    } catch (error) {
      log.error(`Error finding personal sheet ID for: ${userName}`, error as Error);
      return null;
    }
  }

  // 사용자의 개인 스프레드시트 ID 업데이트
  async updateUserPersonalSheetId(username: string, personalSheetId: string): Promise<void> {
    try {
      log.debug(`Updating user personal sheet ID - Username: ${username}, SheetID: ${personalSheetId}`);

      const rows = await this.client.getValues(
        this.client.getMainSpreadsheetId(),
        '회원정보!A:G'
      );

      // 헤더 행 제외하고 검색하여 해당 사용자 찾기
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const [employeeNumber, name, , currentUsername] = row;

        if (currentUsername === username) {
          // 해당 행의 C열(personalSheetId)을 업데이트
          const range = `회원정보!C${i + 1}`;
          await this.client.updateValues(
            this.client.getMainSpreadsheetId(),
            range,
            [[personalSheetId]]
          );
          
          log.info(`User personal sheet ID updated successfully - Username: ${username}, SheetID: ${personalSheetId}`);
          return;
        }
      }

      throw new Error(`사용자를 찾을 수 없습니다: ${username}`);
    } catch (error) {
      log.error(`Error updating user personal sheet ID - Username: ${username}, SheetID: ${personalSheetId}`, error as Error);
      throw new Error('사용자 개인 스프레드시트 ID 업데이트 중 오류가 발생했습니다.');
    }
  }

  // 회원정보 시트가 존재하는지 확인하고 없으면 생성
  private async ensureMemberInfoSheetExists(): Promise<void> {
    try {
      const sheets = this.client.getSheets();
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: this.client.getMainSpreadsheetId(),
      });

      // 기존 시트 목록에서 '회원정보' 시트 찾기
      const existingSheets = spreadsheet.data.sheets || [];
      const memberInfoSheet = existingSheets.find((sheet: any) => 
        sheet.properties?.title === '회원정보'
      );

      if (!memberInfoSheet) {
        log.info('Creating 회원정보 sheet as it does not exist');
        
        // '회원정보' 시트 생성
        await this.client.batchUpdate(this.client.getMainSpreadsheetId(), [
          {
            addSheet: {
              properties: {
                title: '회원정보',
              },
            },
          },
        ]);

        // 헤더 행 추가
        await this.client.updateValues(
          this.client.getMainSpreadsheetId(),
          '회원정보!A1:G1',
          [['사원번호', '이름', '개인스프레드시트ID', '아이디', '이메일', '가입일', '비밀번호']]
        );

        log.info('회원정보 sheet created successfully with headers');
      }
    } catch (error) {
      log.error('Error ensuring 회원정보 sheet exists', error as Error);
      throw new Error('회원정보 시트 확인 중 오류가 발생했습니다.');
    }
  }

  // 사용자명 중복 확인
  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      const user = await this.getUserByLoginId(username);
      return user !== null;
    } catch (error) {
      log.error(`Error checking username existence: ${username}`, error as Error);
      return false; // 오류 발생 시 안전하게 false 반환
    }
  }

  // 이메일 중복 확인
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByLoginId(email);
      return user !== null;
    } catch (error) {
      log.error(`Error checking email existence: ${email}`, error as Error);
      return false; // 오류 발생 시 안전하게 false 반환
    }
  }

  // 마지막 사원번호 조회
  async getLastEmployeeNumber(): Promise<string | null> {
    try {
      const rows = await this.client.getValues(
        this.client.getMainSpreadsheetId(),
        '회원정보!A:A' // A열(사원번호)만 조회
      );

      let lastEmployeeNumber: string | null = null;
      for (let i = 1; i < rows.length; i++) {
        const employeeNumber = rows[i][0];
        if (employeeNumber) {
          lastEmployeeNumber = employeeNumber;
        }
      }

      return lastEmployeeNumber;
    } catch (error) {
      log.error('Error getting last employee number', error as Error);
      return null;
    }
  }

  // 사원번호 생성
  async generateEmployeeNumber(): Promise<string> {
    try {
      const rows = await this.client.getValues(
        this.client.getMainSpreadsheetId(),
        '회원정보!A:A' // A열(사원번호)만 조회
      );

      // 헤더 제외하고 마지막 사원번호 찾기
      let maxNumber = 0;
      for (let i = 1; i < rows.length; i++) {
        const employeeNumber = rows[i][0];
        if (employeeNumber) {
          const numberPart = parseInt(employeeNumber.replace(/\D/g, ''), 10);
          if (!isNaN(numberPart) && numberPart > maxNumber) {
            maxNumber = numberPart;
          }
        }
      }

      // 다음 번호 생성 (EMP001, EMP002, ...)
      const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
      return `EMP${nextNumber}`;
    } catch (error) {
      log.error('Error generating employee number', error as Error);
      // 오류 발생 시 랜덤 번호 생성
      const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `EMP${randomNumber}`;
    }
  }
}