import { PageContainer, PageHeader } from "@/components/layout/Page";
import DocumentsClient from "./DocumentsClient";

export const metadata = {
  title: "Documents",
};

export default function DocumentsPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Library"
        title="Documents"
        description="Cover letters and tailored resumes you generate are saved here. Copy them, download them, or save them as PDFs."
      />
      <DocumentsClient />
    </PageContainer>
  );
}
