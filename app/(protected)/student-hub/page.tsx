import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import StudentHubClient from "./StudentHubClient";
import StudentHubSkeleton from "@/components/student-hub/StudentHubSkeleton";

export default function StudentHubPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Student Hub"
        description="Message templates, free learning resources, and student discounts."
      />
      <Suspense fallback={<StudentHubSkeleton />}>
        <StudentHubClient />
      </Suspense>
    </PageContainer>
  );
}
