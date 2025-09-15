/**
 * 환경 변수 검증 및 보안 체크
 * 
 * 애플리케이션 시작 시 필수 환경 변수가 올바르게 설정되었는지 검증합니다.
 * 보안 문제가 발견되면 애플리케이션 시작을 중단합니다.
 */

interface RequiredEnvVars {
  JWT_SECRET?: string;
  NEXTAUTH_SECRET?: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  MAIN_SPREADSHEET_ID: string;
  NODE_ENV?: string;
}

/**
 * 필수 환경 변수 검증
 * 
 * @throws {Error} 필수 환경 변수가 누락되거나 형식이 잘못된 경우
 */
export const validateEnvironment = (): void => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  console.log('🔍 환경 변수 검증을 시작합니다...');
  
  // JWT 시크릿 검증
  const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
      errors.push('JWT_SECRET 또는 NEXTAUTH_SECRET이 설정되지 않았습니다.');
    } else {
      warnings.push('JWT_SECRET이 설정되지 않음 (개발 환경에서는 자동 생성됨)');
    }
  } else {
    if (jwtSecret.length < 32) {
      const message = `JWT_SECRET이 너무 짧습니다 (${jwtSecret.length}자, 권장: 32자 이상)`;
      if (process.env.NODE_ENV === 'production') {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    }
    
    // 약한 시크릿 패턴 검사
    const weakPatterns = [
      'secret', 'password', '123456', 'qwerty', 'admin',
      'fallback-secret', 'your-secret-key', 'default'
    ];
    
    if (weakPatterns.some(pattern => jwtSecret.toLowerCase().includes(pattern))) {
      errors.push('JWT_SECRET에 예측 가능한 문자열이 포함되어 있습니다. 더 강력한 시크릿을 사용하세요.');
    }
  }
  
  // Google API 관련 환경 변수 검증
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY', 
    'MAIN_SPREADSHEET_ID'
  ];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`${varName} 환경 변수가 설정되지 않았습니다.`);
    }
  }
  
  // Google Service Account Email 형식 검증
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (serviceEmail && !serviceEmail.includes('@') && !serviceEmail.includes('.iam.gserviceaccount.com')) {
    warnings.push('GOOGLE_SERVICE_ACCOUNT_EMAIL이 올바른 형식이 아닐 수 있습니다.');
  }
  
  // Google Private Key 형식 검증
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (privateKey) {
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      errors.push('GOOGLE_PRIVATE_KEY 형식이 올바르지 않습니다. PEM 형식이어야 합니다.');
    }
    
    // 줄바꿈 문자 처리 확인
    if (privateKey.includes('\\n') && !privateKey.includes('\n')) {
      warnings.push('GOOGLE_PRIVATE_KEY에 이스케이프된 줄바꿈(\\n)이 있습니다. 런타임에서 변환됩니다.');
    }
  }
  
  // Spreadsheet ID 형식 검증
  const spreadsheetId = process.env.MAIN_SPREADSHEET_ID;
  if (spreadsheetId) {
    // Google Sheets ID는 일반적으로 44자의 알파벳+숫자+특수문자
    if (spreadsheetId.length < 40 || spreadsheetId.length > 50) {
      warnings.push('MAIN_SPREADSHEET_ID 길이가 일반적인 Google Sheets ID와 다릅니다.');
    }
  }
  
  // 결과 출력
  if (warnings.length > 0) {
    console.warn('⚠️  환경 변수 경고사항:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.error('❌ 환경 변수 검증 실패:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('');
    console.error('💡 해결 방법:');
    console.error('  1. .env.local 파일에 필수 환경 변수를 추가하세요');
    console.error('  2. JWT_SECRET은 다음 명령으로 생성할 수 있습니다:');
    console.error('     openssl rand -base64 32');
    console.error('  3. Google Service Account 키는 Google Cloud Console에서 다운로드하세요');
    console.error('');
    
    process.exit(1);
  }
  
  console.log('✅ 환경 변수 검증 완료');
  
  // 보안 권장사항 출력 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('');
    console.log('🔒 보안 권장사항:');
    console.log('  - JWT_SECRET은 프로덕션에서 32자 이상 사용하세요');
    console.log('  - 환경 변수는 .env.local에 저장하고 버전 관리에서 제외하세요');
    console.log('  - Google Service Account 키는 최소 권한 원칙을 따르세요');
  }
};

/**
 * 개발 환경에서 환경 변수 생성 도우미
 */
export const generateEnvTemplate = (): void => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('프로덕션 환경에서는 환경 변수 템플릿을 생성하지 않습니다.');
    return;
  }
  
  const template = `# 미쓰리 서명 대시보드 환경 변수
# 이 파일을 .env.local로 복사하고 실제 값으로 채워주세요

# JWT 시크릿 (32자 이상 권장)
# 생성 명령: openssl rand -base64 32
JWT_SECRET=your-super-secure-secret-key-at-least-32-characters-long

# Google Service Account 설정
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
MAIN_SPREADSHEET_ID=your-spreadsheet-id-here

# 선택적 설정
ALLOWED_ORIGINS=https://your-domain.com,https://your-staging.com
`;

  console.log('📄 환경 변수 템플릿:');
  console.log(template);
};