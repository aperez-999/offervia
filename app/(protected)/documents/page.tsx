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
        description="Every cover letter and tailored resume you generate is saved here — copy, download, export to PDF, or clean up old drafts."
      />
      <DocumentsClient />
    </PageContainer>
  );
}
