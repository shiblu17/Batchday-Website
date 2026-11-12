/// <reference types="vite/client" />

declare module "qrcode" {
  interface QRCodeToDataURLOptions {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  }
  const QRCode: {
    toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
  };
  export default QRCode;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

interface Window {
  __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  __pwaInstalled?: boolean;
  __triggerPwaInstall?: () => void;
}

interface Navigator {
  standalone?: boolean;
}
