"use client";

import CoachSidebar from "./CoachSidebar";
import CoachChat from "./CoachChat";

export default function CoachHub() {
  return (
    <div className="p-6">
      <div className="flex gap-6">
        <CoachSidebar />
        <div className="flex-1 min-w-0">
          <CoachChat />
        </div>
      </div>
    </div>
  );
}
