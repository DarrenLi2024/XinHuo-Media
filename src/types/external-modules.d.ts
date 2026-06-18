// Type declarations for external modules that will be installed at runtime
// These stubs allow TypeScript compilation to succeed before npm install

declare module 'qrcode' {
  const QRCode: {
    toDataURL(text: string, options?: Record<string, unknown>): Promise<string>;
  };
  export = QRCode;
}

declare module 'jszip' {
  class JSZip {
    folder(name: string): JSZip | null;
    file(name: string, data: string, options?: Record<string, unknown>): JSZip;
    generateAsync(options: Record<string, unknown>): Promise<Blob>;
  }
  export default JSZip;
}

declare module 'xlsx' {
  type WorkSheet = Record<string, unknown>;
  interface WorkBook {
    SheetNames: string[];
    Sheets: Record<string, WorkSheet>;
  }
  const XLSX: {
    read(data: unknown, options?: Record<string, unknown>): WorkBook;
    utils: {
      sheet_to_json<T = Record<string, unknown>>(sheet: unknown, options?: Record<string, unknown>): T[];
      json_to_sheet<T = Record<string, unknown>>(data: T[], options?: Record<string, unknown>): WorkSheet;
      book_new(): WorkBook;
      book_append_sheet(book: WorkBook, sheet: WorkSheet, name: string): void;
      aoa_to_sheet<T = unknown[][]>(data: T): WorkSheet;
    };
    write(book: unknown, options?: Record<string, unknown>): Buffer | ArrayBuffer;
    writeFile(book: unknown, filename: string, options?: Record<string, unknown>): void;
  };
  export = XLSX;
  export default XLSX;
}

declare module 'uuid' {
  export function v4(): string;
}

declare module 'jspdf' {
  class jsPDF {
    constructor(options?: Record<string, unknown>);
    addPage(format?: unknown, orientation?: string): void;
    text(...args: unknown[]): void;
    setFontSize(size: number): void;
    addImage(...args: unknown[]): void;
    save(filename?: string): void;
  }
  export default jsPDF;
}

declare module 'framer-motion' {
  import type { ComponentType, ReactNode, CSSProperties, RefAttributes } from 'react';
  
  interface MotionProps {
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    transition?: Record<string, unknown>;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
    layout?: boolean | string;
    variants?: Record<string, unknown>;
    whileHover?: Record<string, unknown>;
    whileTap?: Record<string, unknown>;
    [key: string]: unknown;
  }

  interface AnimatePresenceProps {
    children?: ReactNode;
    mode?: 'wait' | 'sync' | 'popLayout';
    initial?: boolean;
    onExitComplete?: () => void;
  }

  export const motion: {
    div: ComponentType<MotionProps & RefAttributes<HTMLDivElement>>;
    span: ComponentType<MotionProps & RefAttributes<HTMLSpanElement>>;
    button: ComponentType<MotionProps & RefAttributes<HTMLButtonElement>>;
    [key: string]: ComponentType<MotionProps & RefAttributes<HTMLElement>>;
  };
  export const AnimatePresence: ComponentType<AnimatePresenceProps>;
  export function useAnimation(): {
    start: (config: Record<string, unknown>) => Promise<void>;
    set: (values: Record<string, unknown>) => void;
    stop: () => void;
  };
}

declare module 'html2canvas' {
  const html2canvas: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  export default html2canvas;
}

declare module 'modern-screenshot' {
  export function domToPng(element: HTMLElement, options?: Record<string, unknown>): Promise<string>;
}

declare module 'file-saver' {
  export function saveAs(data: Blob | string, filename?: string, options?: Record<string, unknown>): void;
}
