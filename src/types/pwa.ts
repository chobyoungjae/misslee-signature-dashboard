/**
 * PWA (Progressive Web App) 관련 TypeScript 타입 정의
 * 브라우저 PWA 이벤트 및 설치 프롬프트를 위한 타입 안전성 제공
 */

/**
 * PWA 설치 프롬프트 이벤트
 * beforeinstallprompt 이벤트의 타입 정의
 */
export interface BeforeInstallPromptEvent extends Event {
  /** 지원되는 플랫폼 목록 */
  readonly platforms: string[];
  
  /** 사용자 선택 결과 */
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  
  /** 설치 프롬프트 표시 */
  prompt(): Promise<void>;
}

/**
 * PWA 설치 상태
 */
export type PWAInstallStatus = 
  | 'not-supported'    // PWA 설치 지원하지 않음
  | 'not-installed'    // 설치 가능하지만 아직 설치되지 않음
  | 'installed'        // 이미 설치됨
  | 'prompt-available' // 설치 프롬프트 사용 가능
  | 'prompt-dismissed'; // 사용자가 프롬프트를 거부함

/**
 * PWA 상태 관리를 위한 컨텍스트 타입
 */
export interface PWAState {
  /** 설치 프롬프트 이벤트 */
  deferredPrompt: BeforeInstallPromptEvent | null;
  /** 현재 설치 상태 */
  installStatus: PWAInstallStatus;
  /** 설치 프롬프트 표시 가능 여부 */
  canInstall: boolean;
  /** 설치 프롬프트 표시 함수 */
  showInstallPrompt: () => Promise<boolean>;
  /** PWA 상태 업데이트 함수 */
  updateInstallStatus: (status: PWAInstallStatus) => void;
}

/**
 * 서비스 워커 상태
 */
export type ServiceWorkerStatus = 
  | 'not-supported'
  | 'installing' 
  | 'installed'
  | 'waiting'
  | 'active'
  | 'error';

/**
 * 서비스 워커 업데이트 이벤트
 */
export interface ServiceWorkerUpdateEvent {
  type: 'update-available' | 'update-installed';
  registration: ServiceWorkerRegistration;
}