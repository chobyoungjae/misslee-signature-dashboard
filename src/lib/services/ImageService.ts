import { log } from '../secureLogger';

// 이미지 처리 관련 서비스
export class ImageService {
  // 이미지 URL 캐시 (메모리 기반)
  private static imageUrlCache = new Map<string, string>();

  // 문자열에서 이미지 URL 추출
  extractImageUrl(text: string): string | undefined {
    if (!text || typeof text !== 'string') {
      return undefined;
    }

    // 캐시에서 확인
    if (ImageService.imageUrlCache.has(text)) {
      return ImageService.imageUrlCache.get(text);
    }

    let imageUrl: string | undefined;

    try {
      // 1. Drive 파일 ID 패턴 매칭 (다양한 형태)
      const driveIdPatterns = [
        /(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=|id=)([a-zA-Z0-9_-]{25,})/,
        /([a-zA-Z0-9_-]{25,})/  // 단순 ID 형태
      ];

      for (const pattern of driveIdPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const fileId = match[1];
          imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200-h100`;
          break;
        }
      }

      // 2. 이미 완성된 이미지 URL 확인
      if (!imageUrl) {
        const urlPatterns = [
          /https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp)/i,
          /https?:\/\/drive\.google\.com\/thumbnail\?[^\s]+/i,
          /https?:\/\/lh\d+\.googleusercontent\.com\/[^\s]+/i
        ];

        for (const pattern of urlPatterns) {
          const match = text.match(pattern);
          if (match) {
            imageUrl = match[0];
            break;
          }
        }
      }

      // 3. Googleusercontent 직접 링크
      if (!imageUrl) {
        const userContentMatch = text.match(/https:\/\/lh\d+\.googleusercontent\.com\/[a-zA-Z0-9_-]+/);
        if (userContentMatch) {
          imageUrl = userContentMatch[0];
        }
      }

      // 4. 기타 이미지 호스팅 서비스
      if (!imageUrl) {
        const otherHostingPatterns = [
          /https?:\/\/imgur\.com\/[a-zA-Z0-9]+/i,
          /https?:\/\/[^\s]*\.s3\.[^\s]*\.amazonaws\.com\/[^\s]+/i,
          /https?:\/\/[^\s]*\.blob\.core\.windows\.net\/[^\s]+/i
        ];

        for (const pattern of otherHostingPatterns) {
          const match = text.match(pattern);
          if (match) {
            imageUrl = match[0];
            break;
          }
        }
      }

      // 결과 캐싱
      if (imageUrl) {
        ImageService.imageUrlCache.set(text, imageUrl);
        log.debug(`Image URL extracted and cached - Text: ${text.substring(0, 50)}..., URL: ${imageUrl}`);
      }

      return imageUrl;
    } catch (error) {
      log.error(`Error extracting image URL from text: ${text.substring(0, 100)}`, error as Error);
      return undefined;
    }
  }

  // 이미지 URL 유효성 검증
  async validateImageUrl(url: string): Promise<boolean> {
    try {
      if (!url || typeof url !== 'string') {
        return false;
      }

      // 기본 URL 형식 검증
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
      }

      // 이미지 확장자 확인
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const hasImageExtension = imageExtensions.some(ext => 
        url.toLowerCase().includes(ext)
      );

      // Google Drive 썸네일 링크 확인
      const isGoogleDriveThumbnail = url.includes('drive.google.com/thumbnail');
      
      // Google 사용자 콘텐츠 링크 확인
      const isGoogleUserContent = url.includes('googleusercontent.com');

      return hasImageExtension || isGoogleDriveThumbnail || isGoogleUserContent;
    } catch (error) {
      log.error(`Error validating image URL: ${url}`, error as Error);
      return false;
    }
  }

  // 이미지 캐시 정리
  clearImageCache(): void {
    ImageService.imageUrlCache.clear();
    log.info('Image URL cache cleared');
  }

  // 캐시 상태 조회
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: ImageService.imageUrlCache.size,
      keys: Array.from(ImageService.imageUrlCache.keys()).map(key => 
        key.substring(0, 50) + (key.length > 50 ? '...' : '')
      )
    };
  }

  // Google Drive 파일 ID를 썸네일 URL로 변환
  driveFileIdToThumbnailUrl(fileId: string, size = 'w200-h100'): string {
    if (!fileId || typeof fileId !== 'string') {
      throw new Error('유효하지 않은 파일 ID입니다.');
    }

    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  }

  // 다양한 크기의 썸네일 URL 생성
  generateThumbnailUrls(fileId: string): Record<string, string> {
    const sizes = {
      small: 'w100-h50',
      medium: 'w200-h100',
      large: 'w400-h200',
      xlarge: 'w800-h400'
    };

    const urls: Record<string, string> = {};
    for (const [sizeName, sizeValue] of Object.entries(sizes)) {
      urls[sizeName] = this.driveFileIdToThumbnailUrl(fileId, sizeValue);
    }

    return urls;
  }

  // URL에서 Google Drive 파일 ID 추출
  extractDriveFileId(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]{25,})/,
      /[?&]id=([a-zA-Z0-9_-]{25,})/,
      /thumbnail\?id=([a-zA-Z0-9_-]{25,})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  // 이미지 프록시 URL 생성 (CORS 우회용)
  createProxyImageUrl(originalUrl: string, baseUrl = ''): string {
    if (!originalUrl) {
      return '';
    }

    // 이미 프록시 URL인 경우 그대로 반환
    if (originalUrl.includes('/api/pdf-proxy')) {
      return originalUrl;
    }

    // Google Drive 썸네일은 직접 사용 가능
    if (originalUrl.includes('drive.google.com/thumbnail') || 
        originalUrl.includes('googleusercontent.com')) {
      return originalUrl;
    }

    // 다른 URL들은 프록시를 통해 접근
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${baseUrl}/api/pdf-proxy?url=${encodedUrl}`;
  }
}