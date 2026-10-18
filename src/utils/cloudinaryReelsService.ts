/**
 * Cloudinary Multi-Account Video Hosting & Streaming Engine
 * 
 * Provides:
 * 1. Multi-account load balancing across free tiers (50 GB combined bandwidth)
 * 2. Automatic on-the-fly video transcoding (720p, FastStart H.264, ~1.5MB per reel)
 * 3. Automatic failover: if Account 1 fails/rate-limits, retries with Account 2
 * 4. Real-time XMLHttpRequest upload progress reporting
 */

export interface CloudinaryAccount {
  cloudName: string;
  uploadPreset: string;
}

export const CLOUDINARY_ACCOUNTS: CloudinaryAccount[] = [
  {
    cloudName: "bnqctsqy",
    uploadPreset: "batchday1",
  },
  {
    cloudName: "feegnsre",
    uploadPreset: "batchday2",
  },
  {
    cloudName: "s6dntiix",
    uploadPreset: "batchday3",
  },
  {
    cloudName: "t6ga2uwt",
    uploadPreset: "batchday4",
  },
];

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  duration: number;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  accountUsed: string;
}

export interface UploadProgress {
  percent: number;
  stage: "validating" | "compressing" | "uploading" | "processing" | "done" | "error";
  message: string;
}

// Memory counter for round-robin distribution
let currentAccountPointer = Math.floor(Math.random() * CLOUDINARY_ACCOUNTS.length);

/**
 * Returns an optimized Cloudinary video streaming URL with FastStart, 720p limit, and auto-quality
 */
export function formatCloudinaryVideoUrl(rawUrl: string): string {
  if (!rawUrl || !rawUrl.includes("res.cloudinary.com")) return rawUrl;
  if (rawUrl.includes("q_auto") || rawUrl.includes("vc_h264")) return rawUrl;

  // Transform into FastStart H.264 720p mobile optimized stream
  return rawUrl.replace(
    /\/video\/upload\/(v\d+)/,
    "/video/upload/q_auto:good,f_auto,w_720,c_limit,vc_h264/$1"
  );
}

/**
 * Uploads a video file to a specific Cloudinary account via unsigned upload preset
 */
function uploadToSingleAccount(
  account: CloudinaryAccount,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${account.cloudName}/video/upload`;

    xhr.open("POST", endpoint);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        // Map upload bytes 15% -> 88%
        const percent = Math.min(88, Math.round(15 + (e.loaded / e.total) * 73));
        onProgress({
          percent,
          stage: "uploading",
          message: `হাই-স্পিড সিডিএনে আপলোড হচ্ছে (${percent}%)...`,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.secure_url) {
            const optimizedUrl = formatCloudinaryVideoUrl(res.secure_url);
            resolve({
              url: optimizedUrl,
              publicId: res.public_id || `cld_${Date.now()}`,
              duration: res.duration || 0,
              width: res.width,
              height: res.height,
              format: res.format,
              bytes: res.bytes,
              accountUsed: account.cloudName,
            });
          } else {
            reject(new Error(res.error?.message || "ক্লাউডিনারি রেসপন্সে সমস্যা"));
          }
        } catch {
          reject(new Error("রেসপন্স প্রসেস করা যায়নি।"));
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.error?.message || `HTTP ${xhr.status} ত্রুটি`));
        } catch {
          reject(new Error(`আপলোডে ত্রুটি (স্ট্যাটাস: ${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error(`নেটওয়ার্ক বিঘ্নিত হয়েছে (${account.cloudName})`));
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", account.uploadPreset);
    formData.append("folder", "ju52_reels");

    xhr.send(formData);
  });
}

/**
 * Main Multi-Account Video Uploader with automatic round-robin and instant failover
 */
export async function uploadReelToCloudinaryPool(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<CloudinaryUploadResult> {
  if (onProgress) {
    onProgress({
      percent: 10,
      stage: "validating",
      message: "ভিডিও প্রস্তুত করা হচ্ছে...",
    });
  }

  const accountCount = CLOUDINARY_ACCOUNTS.length;
  if (accountCount === 0) {
    throw new Error("কোনো Cloudinary অ্যাকাউন্ট কনফিগার করা নেই।");
  }

  // Pick starting account index via round-robin pointer
  const startIndex = currentAccountPointer % accountCount;
  currentAccountPointer = (currentAccountPointer + 1) % accountCount;

  // Create ordered attempt list starting from the selected account
  const orderedAccounts: CloudinaryAccount[] = [];
  for (let i = 0; i < accountCount; i++) {
    orderedAccounts.push(CLOUDINARY_ACCOUNTS[(startIndex + i) % accountCount]);
  }

  let lastError: any = null;

  for (let i = 0; i < orderedAccounts.length; i++) {
    const account = orderedAccounts[i];
    try {
      if (i > 0 && onProgress) {
        onProgress({
          percent: 20,
          stage: "uploading",
          message: `সার্ভার স্যুইচ করা হচ্ছে (অ্যাকাউন্ট ২)...`,
        });
      }

      const result = await uploadToSingleAccount(account, file, onProgress);

      if (onProgress) {
        onProgress({
          percent: 100,
          stage: "done",
          message: "রিলস সফলভাবে ক্লাউড সিডিএনে প্রসেস সম্পন্ন! ✨",
        });
      }

      return result;
    } catch (err: any) {
      console.warn(`Cloudinary account [${account.cloudName}] failed:`, err);
      lastError = err;
      // Continue to next account in pool
    }
  }

  throw new Error(
    `ক্লাউডিনারি আপলোড সম্পন্ন হয়নি (${lastError?.message || "সার্ভার ব্যস্ত"})`
  );
}
