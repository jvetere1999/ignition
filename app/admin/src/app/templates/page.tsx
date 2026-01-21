import { Metadata } from "next";
import { TemplatesClient } from "./TemplatesClient";
import { AdminGuard } from "@/components/AdminGuard";

export const metadata: Metadata = {
  title: "Listening Templates",
};

export default function TemplatesPage() {
  return (
    <AdminGuard>
      <TemplatesClient />
    </AdminGuard>
  );
}
