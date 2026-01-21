export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="text-center space-y-3">
        <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Onboarding</div>
        <h1 className="text-3xl font-bold">Preparing your passkey onboarding…</h1>
        <p className="text-slate-400 text-sm">
          If the modal doesn&apos;t appear, refresh. You&apos;ll be taken through passkey setup automatically.
        </p>
      </div>
    </div>
  );
}
