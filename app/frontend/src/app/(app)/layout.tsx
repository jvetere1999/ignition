/**
 * App Layout with Shell
 * Wraps all authenticated routes with the AppShell and SyncStateProvider.
 *
 * SYNC STATE:
 * The SyncStateProvider enables 30-second polling for UI optimization data
 * (badges, progress, focus status, plan status). This data is memory-only
 * and NOT persisted to localStorage.
 *
 * SESSION GUARD:
 * Ensures user is authenticated before rendering protected routes.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/shell";
import { OnboardingProvider } from "@/components/onboarding";
import { AdminButton } from "@/components/admin/AdminButton";
import { SyncStateProvider } from "@/lib/sync/SyncStateContext";
import { usePathname, useRouter } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Track if we're actively redirecting to avoid infinite redirects
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Session guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isRedirecting) {
      console.log('[AppLayout] User not authenticated, initiating redirect to sign in');
      setIsRedirecting(true);
      const search = typeof window !== "undefined" ? window.location.search : "";
      const callbackUrl = `${pathname}${search}`;
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [isLoading, isAuthenticated, isRedirecting, pathname, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    if (!user.approved) {
      router.replace("/pending-approval");
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading page while checking auth (AuthProvider shows this via isLoading wrapper)
  // OR show loading page during redirect (user is not authenticated and signIn() was called)
  if (isLoading) {
    return null; // AuthProvider will show loading page above this layout
  }

  // If we reach here with isAuthenticated=false, signIn() has been called
  // Let the redirect happen without showing a loading UI
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SyncStateProvider>
      <AppShell>
        <OnboardingProvider>
          {children}
          <AdminButton />
        </OnboardingProvider>
      </AppShell>
    </SyncStateProvider>
  );
}
