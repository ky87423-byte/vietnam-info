/**
 * Cloudinary 업로드 유틸리티
 * - 이미지: 최대 20MB
 * - 동영상: 최대 500MB
 * - 업로드 프로그레스 콜백 지원
 */

export type MediaType = "image" | "video";

export interface MediaItem {
  id: string;           // 고유 키 (React key용)
  url: string;          // Cloudinary URL (완료) 또는 blob URL (업로드 중)
  type: MediaType;
  uploading?: boolean;
  progress?: number;    // 0-100
  error?: string;
}

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const IMAGE_MAX_MB = 20;
export const VIDEO_MAX_MB = 500;

export function isCloudinaryConfigured(): boolean {
  return !!(CLOUD_NAME && UPLOAD_PRESET);
}

export function getMediaType(file: File): MediaType {
  return file.type.startsWith("video/") ? "video" : "image";
}

export function validateFileSize(file: File): string | null {
  const mb = file.size / (1024 * 1024);
  if (getMediaType(file) === "image" && mb > IMAGE_MAX_MB) {
    return `이미지 최대 크기는 ${IMAGE_MAX_MB}MB입니다. (현재 ${mb.toFixed(1)}MB)`;
  }
  if (getMediaType(file) === "video" && mb > VIDEO_MAX_MB) {
    return `동영상 최대 크기는 ${VIDEO_MAX_MB}MB입니다. (현재 ${mb.toFixed(1)}MB)`;
  }
  return null;
}

export function uploadMedia(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return Promise.reject(new Error("Cloudinary 환경변수가 설정되지 않았습니다."));
  }

  const type = getMediaType(file);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`
    );

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener("load", () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
          resolve(data.secure_url as string);
        } else {
          reject(new Error(data.error?.message ?? `업로드 실패 (${xhr.status})`));
        }
      } catch {
        reject(new Error("응답 파싱 오류"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("네트워크 오류")));
    xhr.addEventListener("abort", () => reject(new Error("업로드 취소됨")));
    xhr.send(formData);
  });
}

/** Cloudinary URL인지 판별 (동영상/이미지 구분) */
export function detectUrlType(url: string): MediaType {
  if (url.includes("res.cloudinary.com") && url.includes("/video/")) return "video";
  if (url.includes(".mp4") || url.includes(".webm") || url.includes(".mov")) return "video";
  return "image";
}
