declare module "pdf-parse" {
  interface PdfParseResult {
    text: string;
    numpages?: number;
    info?: Record<string, unknown>;
  }
  function pdfParse(buffer: Buffer, options?: Record<string, unknown>): Promise<PdfParseResult>;
  export default pdfParse;
}

declare module "@/lib/pdf-parse-server.cjs" {
  import type { Buffer } from "node:buffer";
  interface PdfParseResult {
    text: string;
    numpages?: number;
    info?: Record<string, unknown>;
  }
  const pdfParse: (buffer: Buffer, options?: Record<string, unknown>) => Promise<PdfParseResult>;
  export default pdfParse;
}
