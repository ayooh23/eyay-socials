/** UMD build from CDN: `const { jsPDF } = window.jspdf` */
export interface EyayJsPDFInstance {
  addPage: (format?: number[] | string, orientation?: string) => void;
  addImage: (
    imageData: string | Uint8Array,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
  save: (filename: string) => void;
}

declare global {
  interface Window {
    jspdf?: {
      jsPDF: new (options?: {
        orientation?: "p" | "portrait" | "l" | "landscape";
        unit?: string;
        format?: number[] | string;
      }) => EyayJsPDFInstance;
    };
  }
}

export {};
