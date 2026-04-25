import LayoutPublic from "@/components/public/LayoutPublic";
import "../globals.css";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <LayoutPublic>{children}</LayoutPublic>;
}
