"use client";

import { UploadSimple } from "@phosphor-icons/react/dist/ssr";

type DropzoneProps = {
  onFile: (file: File) => void;
  fileName?: string;
  accept?: string;
  maxSizeMb?: number;
};

export default function Dropzone({
  onFile,
  fileName,
  accept = ".pdf,.docx",
  maxSizeMb = 8,
}: DropzoneProps) {
  return (
    <label className="block cursor-pointer rounded-xl border border-dashed border-border bg-background/60 p-8 text-center shadow-sm transition-colors hover:bg-foreground/[0.04]">
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <div className="mx-auto flex max-w-md flex-col items-center">
        <UploadSimple className="mb-2 h-6 w-6 text-foreground/60" />
        <p className="text-sm text-foreground">
          {fileName ? `Selected: ${fileName}` : "Click to choose your resume"}
        </p>
        <p className="mt-1 text-xs text-foreground/60">PDF or DOCX, up to {maxSizeMb} MB</p>
      </div>
    </label>
  );
}
