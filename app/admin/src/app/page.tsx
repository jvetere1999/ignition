/**
 * Admin Console Page
 * Only accessible to admin users with is_admin flag
 *
 * Auth handled via AdminGuard component
 */

import type { Metadata } from "next";
import { AdminClient } from "./AdminClient";
import { AdminGuard } from "@/components/AdminGuard";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Admin Console - Ignition",
  description: "Administrator dashboard for Ignition.",
};

export default async function AdminPage() {
  return (
    <AdminGuard>
      <div className={styles.page}>
        <div className={styles.e2eeBanner}>
          <p className={styles.e2eeTitle}>Encrypted user content</p>
          <p className={styles.e2eeText}>
            Infobase, Ideas, Journal, and other private work may be end-to-end encrypted. Admins cannot decrypt user content; only users with their passkey can view it.
          </p>
        </div>
        <AdminClient />
      </div>
    </AdminGuard>
  );
}
