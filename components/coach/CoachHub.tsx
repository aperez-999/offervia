"use client";

"use client";

import { useState } from "react";
import CoachSidebar from "./CoachSidebar";
import Chat from "./Chat";

export default function CoachHub() {
  const [mode, setMode] = useState<"interview" | "resume" | "career">("interview");
  return (
    <div className="p-6">
      <div className="flex gap-6">
        <CoachSidebar active={mode} onChange={(k) => setMode(k as any)} />
        <div className="flex-1 min-w-0">
          <Chat mode={mode} />
        </div>
      </div>
    </div>
  );
}
