/**
 * OnboardingProvider - Client component that fetches onboarding state
 * from the backend API and renders the OnboardingModal
 *
 * Rewritten to use backend API instead of D1 directly.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getOnboardingState, type OnboardingResponse } from "@/lib/api/onboarding";
import { OnboardingModal } from "./OnboardingModal";

export function OnboardingProvider() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingResponse | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || checked) return;

    const checkOnboarding = async () => {
      try {
        const data = await getOnboardingState();
        setOnboarding(data);
      } catch (error) {
        console.error("Failed to load onboarding:", error);
      }
      setChecked(true);
    };

    checkOnboarding();
  }, [isLoading, isAuthenticated, checked]);

  // Don't render if not authenticated or still loading
  if (!isAuthenticated || !user) {
    return null;
  }

  // Don't render if we haven't checked yet
  if (!checked || !onboarding) {
    return null;
  }

  // Don't render if onboarding not needed
  if (!onboarding.needs_onboarding) {
    return null;
  }

  // Don't render if already completed or skipped
  if (onboarding.state?.status === "completed" || onboarding.state?.status === "skipped") {
    return null;
  }

  // Don't render if no flow
  if (!onboarding.flow) {
    return null;
  }

  // TODO: The OnboardingModal component needs to be updated to work with
  // the new API response format. For now, we'll skip rendering it.
  // The modal expects: initialState, flow (with steps array), userId
  // The API returns: state, flow (without steps), current_step, all_steps
  console.log("Onboarding needed but modal temporarily disabled during migration");
  return null;
}

