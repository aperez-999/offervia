import { PageContainer, PageHeader } from "@/components/layout/Page";
import DocumentsClient from "./DocumentsClient";

export const metadata = {
  title: "Documents",
};

export default function DocumentsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Saved"
        description="Resumes and cover letters you make are kept here. Copy them, download them, or save a PDF."
      />
      <DocumentsClient />
    </PageContainer>
  );
}
