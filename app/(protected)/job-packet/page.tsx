import AuthGuard from "@/components/AuthGuard";
import JobPacketClient from "./JobPacketClient";

export default function JobPacketPage() {
  return (
    <AuthGuard>
      <JobPacketClient />
    </AuthGuard>
  );
}

