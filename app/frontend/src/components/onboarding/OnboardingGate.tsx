"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { TOSModal } from "@/components/shell/TOSModal";

/**
 * Public routes that don't require authentication
 * These paths are protected by middleware but don't require logged-in user
 */
const PUBLIC_ROUTES = new Set([
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/help",
  "/auth/signin",
  "/auth/error",
  "/age-verification",
  "/pending-approval",
]);

function isPublicRoute(pathname: string): boolean {
  // Exact match
  if (PUBLIC_ROUTES.has(pathname)) {
    return true;
  }
  // Prefix match for routes with subpaths
  for (const route of PUBLIC_ROUTES) {
    if (pathname.startsWith(route + "/")) {
      return true;
    }
  }
  return false;
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicRoute(pathname);

  // Redirect authenticated users away from signin/age-verification pages
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (pathname === "/auth/signin" || pathname === "/age-verification") {
        router.replace("/today");
      } else if (!user.ageVerified) {
        router.replace("/age-verification");
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  // For public routes, render immediately (don't wait for auth)
  if (isPublic) {
    return <>{children}</>;
  }

  // For protected routes, require authentication
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>
    );
  }

  if (!isAuthenticated || !user) {
    // Not authenticated - redirect to signin
    // The redirect will happen on next page load, for now show nothing
    return null;
  }

  if (!user.ageVerified) {
    // Redirect handled by useEffect above
    return null;
  }

  if (!user.tosAccepted) {
    // Show TOS modal, refresh session after acceptance
    return <TOSModal onAccept={refresh} />;
  }

  return <>{children}</>;
}
