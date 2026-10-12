/**
 * Stream Uploader for JU 52nd Batch Day Live Stream
 * - Photos: ImgBB API (Fast, Free, Unlimited image hosting)
 * - Videos: Telegram Bot Storage (Fast, Free, 45s reels up to 20MB directly to @JU52ReelsVault)
 */

export const TELEGRAM_BOT_TOKEN =
  import.meta.env.VITE_TELEGRAM_BOT_TOKEN ||
  "8851131748:AAFNALYNcT8nneTE9nhjpveJa8wDvukKXtg";

export const TELEGRAM_CHAT_ID =
  import.meta.env.VITE_TELEGRAM_CHAT_ID || "-1003827033172";

export const IMGBB_API_KEY =
  import.meta.env.VITE_IMGBB_API_KEY || "85164bf284c589b1ac8c2f2408fdc3f5";

export interface UploadProgress {
  percent: number;
  stage: "validating" | "compressing" | "uploading" | "processing" | "done" | "error";
  message: string;
}

/**
 * Checks video duration (max 45 seconds)
 */
export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("ভিডিও ফাইলটি পড়া সম্ভব হয়নি। সঠিক MP4 বা WebM ফাইল দিন।"));
    };
  });
}

/**
 * Automatic Client-Side Video Compressor using HTML5 Canvas & MediaRecorder
 * Scales resolution to 720p and optimizes bitrate to ~2.2 Mbps
 * Shrinks heavy 40MB-100MB videos down to 8-15MB!
 */
export async function compressVideoInBrowser(
  file: File,
  onProgress?: (percent: number) => void
): Promise<File> {
  // If already under 19MB, no compression needed
  if (file.size <= 19 * 1024 * 1024) {
    return file;
  }

  if (typeof window === "undefined" || !window.MediaRecorder) {
    throw new Error(
      "আপনার ব্রাউজারে ভিডিও কম্প্রেশন সমর্থন করে না। দয়া করে ২০ MB-র নিচের সাইজ সিলেক্ট করুন।"
    );
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      let width = video.videoWidth || 720;
      let height = video.videoHeight || 1280;
      const maxDim = 720;

      // Scale down large 1080p/4K dimensions to 720p
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      width = width % 2 === 0 ? width : width - 1;
      height = height % 2 === 0 ? height : height - 1;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(video.src);
        reject(new Error("ক্যানভাস কনটেক্সট তৈরি ব্যর্থ হয়েছে"));
        return;
      }

      const stream = canvas.captureStream(30);

      // Try capturing audio track if available
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const source = audioCtx.createMediaElementSource(video);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          const audioTrack = dest.stream.getAudioTracks()[0];
          if (audioTrack) {
            stream.addTrack(audioTrack);
          }
        }
      } catch {
        // Audio capture fallback
      }

      let mimeType = "video/webm;codecs=vp8";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          mimeType = "video/webm";
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2_200_000, // 2.2 Mbps target bitrate (~12MB for 45s)
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(video.src);
        const blob = new Blob(chunks, { type: mimeType });
        const compressedFile = new File(
          [blob],
          file.name.replace(/\.[^/.]+$/, "") + (mimeType.includes("mp4") ? ".mp4" : ".webm"),
          { type: mimeType }
        );
        resolve(compressedFile);
      };

      let animId: number;
      const drawFrame = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, width, height);
          animId = requestAnimationFrame(drawFrame);
        }
      };

      video.ontimeupdate = () => {
        if (onProgress && video.duration > 0) {
          const p = Math.min(99, Math.round((video.currentTime / video.duration) * 100));
          onProgress(p);
        }
      };

      video.onended = () => {
        cancelAnimationFrame(animId);
        recorder.stop();
      };

      video.onerror = () => {
        cancelAnimationFrame(animId);
        URL.revokeObjectURL(video.src);
        reject(new Error("কম্প্রেশন প্রক্রিয়ায় সমস্যা হয়েছে।"));
      };

      recorder.start();
      video.playbackRate = 2.0; // 2x playback speed to compress in half the time
      video.play().then(() => {
        drawFrame();
      }).catch((err) => {
        URL.revokeObjectURL(video.src);
        reject(new Error("ভিডিও কম্প্রেশন শুরু হতে বাধা পেয়েছে: " + err.message));
      });
    };
  });
}

/**
 * Validates a video file duration (max 45 seconds)
 */
export async function validateVideoFile(file: File): Promise<{ duration: number; needsCompression: boolean }> {
  const duration = await getVideoDuration(file);
  if (duration > 45.5) {
    throw new Error(
      `ভিডিওর দৈর্ঘ্য সর্বোচ্চ ৪৫ সেকেন্ড হতে পারবে! (বর্তমান: ${Math.round(duration)} সেকেন্ড)`
    );
  }
  const needsCompression = file.size > 20 * 1024 * 1024;
  return { duration, needsCompression };
}

/**
 * Uploads a photo to ImgBB
 */
export async function uploadPhotoToImgBB(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; thumbUrl?: string }> {
  if (onProgress) {
    onProgress({
      percent: 20,
      stage: "uploading",
      message: "ছবি ক্লাউডে আপলোড হচ্ছে...",
    });
  }

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`ছবি আপলোড ব্যর্থ হয়েছে (HTTP ${res.status})`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || "ছবি আপলোড ব্যর্থ হয়েছে");
  }

  if (onProgress) {
    onProgress({
      percent: 100,
      stage: "done",
      message: "ছবি সফলভাবে আপলোড সম্পন্ন!",
    });
  }

  return {
    url: json.data.url,
    thumbUrl: json.data.thumb?.url || json.data.medium?.url || json.data.url,
  };
}

/**
 * Uploads a short reel video to Telegram Bot channel
 */
export async function uploadVideoToTelegram(
  file: File,
  captionText: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{
  url: string;
  fileId: string;
  duration: number;
  telegramMessageId?: number;
}> {
  // 1. Validation
  if (onProgress) {
    onProgress({
      percent: 10,
      stage: "validating",
      message: "ভিডিওর দৈর্ঘ্য ও সাইজ যাচাই করা হচ্ছে...",
    });
  }

  const { duration } = await validateVideoFile(file);

  let fileToUpload = file;
  if (file.size > 20 * 1024 * 1024) {
    if (onProgress) {
      const initialMb = (file.size / (1024 * 1024)).toFixed(1);
      onProgress({
        percent: 12,
        stage: "compressing",
        message: `ভিডিও সাইজ ${initialMb} MB, এটি স্বয়ংক্রিয়ভাবে কম্প্রেস করা হচ্ছে...`,
      });
    }
    fileToUpload = await compressVideoInBrowser(file, (p) => {
      if (onProgress) {
        onProgress({
          percent: Math.min(20, Math.round((p / 100) * 20)),
          stage: "compressing",
          message: `কম্প্রেশন চলছে (${p}%)...`,
        });
      }
    });
  }

  // 2. Upload with XMLHttpRequest for real progress
  if (onProgress) {
    onProgress({
      percent: 22,
      stage: "uploading",
      message: "টেলিগ্রাম ক্লাউডে ভিডিও আপলোড হচ্ছে...",
    });
  }

  const formData = new FormData();
  formData.append("chat_id", TELEGRAM_CHAT_ID);
  formData.append("video", fileToUpload);
  formData.append("caption", captionText || "JU 52nd Batch Day Reel");
  formData.append("supports_streaming", "true");

  const sendVideoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`;

  const uploadResult = await new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sendVideoUrl);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        // Map 20% -> 85%
        const percent = Math.min(85, Math.round(20 + (e.loaded / e.total) * 65));
        onProgress({
          percent,
          stage: "uploading",
          message: `ভিডিও আপলোড হচ্ছে (${percent}%)...`,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.ok) {
            resolve(res.result);
          } else {
            reject(new Error(res.description || "টেলিগ্রাম সার্ভার এরর দিয়েছে।"));
          }
        } catch (err) {
          reject(new Error("রেসপন্স প্রসেস করা যায়নি।"));
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.description || `HTTP ${xhr.status} এরর`));
        } catch {
          reject(new Error(`ভিডিও আপলোডে সমস্যা (স্ট্যাটাস: ${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("নেটওয়ার্ক সংযোগ বিঘ্নিত হয়েছে। ইন্টারনেট চেক করুন।"));
    };

    xhr.send(formData);
  });

  const fileId = uploadResult.video?.file_id;
  const messageId = uploadResult.message_id;

  if (!fileId) {
    throw new Error("টেলিগ্রাম থেকে ভিডিও ফাইল আইডি পাওয়া যায়নি।");
  }

  // 3. Get direct file path
  if (onProgress) {
    onProgress({
      percent: 90,
      stage: "processing",
      message: "স্ট্রিমিং লিংক প্রস্তুত করা হচ্ছে...",
    });
  }

  const getFileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
  const fileRes = await fetch(getFileUrl);
  const fileJson = await fileRes.json();

  if (!fileJson.ok || !fileJson.result?.file_path) {
    throw new Error(fileJson.description || "স্ট্রিমিং পাথ তৈরি করা সম্ভব হয়নি।");
  }

  const filePath = fileJson.result.file_path;
  const directStreamUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

  if (onProgress) {
    onProgress({
      percent: 100,
      stage: "done",
      message: "রিলস ভিডিও সফলভাবে আপলোড সম্পন্ন!",
    });
  }

  return {
    url: directStreamUrl,
    fileId,
    duration: uploadResult.video?.duration || duration,
    telegramMessageId: messageId,
  };
}

/**
 * Refreshes a Telegram file streaming URL using its persistent file_id
 */
export async function refreshTelegramFileUrl(fileId: string): Promise<string> {
  const getFileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
  const res = await fetch(getFileUrl);
  const json = await res.json();
  if (json.ok && json.result?.file_path) {
    return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${json.result.file_path}`;
  }
  throw new Error("ফাইল রিফ্রেশ করা যায়নি");
}
