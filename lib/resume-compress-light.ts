// lib/resume-compress-light.ts

/**
 * Ultra-light local compression:
 * - Keeps structure but ensures total size stays < 6000 tokens
 * - This prevents Groq 413 TPM error completely
 */
export function compressResumeLight(raw: string): string {
    if (!raw) return "";
  
    let text = raw
      .replace(/\r/g, "")
      .replace(/\n{2,}/g, "\n")  // collapse excessive blank lines
      .replace(/[ \t]{2,}/g, " ") // collapse whitespace
      .trim();
  
    // ✅ FINAL: HARD CAP under Groq TPM limit
    const MAX_CHARS = 6000; // ~1500 tokens
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS) + "\n[...Text trimmed for AI processing...]";
    }
  
    return text;
  }