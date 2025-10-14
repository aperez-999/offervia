"use client";

import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";

type UploadZoneProps = {
  onFile: (file: File) => void;
  fileName?: string;
  accept?: string;
};

export default function UploadZone({ onFile, fileName, accept = ".pdf,.doc,.docx" }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const onClick = () => inputRef.current?.click();

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const exts = accept.split(",").map((s) => s.trim().toLowerCase());
    const ok = exts.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (ok) onFile(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`cursor-pointer rounded-lg border p-8 text-center transition-colors ${
        dragOver ? "border-gray-400 bg-gray-50" : "border-gray-200 bg-white"
      }`}
    {
      ...({} as any)
    }
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center justify-center gap-2">
        <Upload className="h-6 w-6 text-gray-500" />
        <div className="text-sm text-gray-700">Drag and drop the job description</div>
        <div className="text-xs text-gray-500">PDF, DOC, or DOCX</div>
        {fileName ? (
          <div className="mt-2 text-sm text-gray-600">Selected: {fileName}</div>
        ) : (
          <div className="mt-2 text-sm text-gray-600">or click to choose a file</div>
        )}
      </div>
    </div>
  );
}
