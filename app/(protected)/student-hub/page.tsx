import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import StudentHubClient from "./StudentHubClient";
import StudentHubSkeleton from "@/components/student-hub/StudentHubSkeleton";

export default function StudentHubPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Student Hub"
        title="Student Hub"
        description="Templates, learning resources, and student-only deals — everything around your search, in one organized place."
      />
      <Suspense fallback={<StudentHubSkeleton />}>
        <StudentHubClient />
      </Suspense>
    </PageContainer>
  );
}
