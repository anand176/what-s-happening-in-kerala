"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/** Chrome/Edge/Android fire this so the page can trigger install on its own terms. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari reports installed state here rather than via display-mode.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/** These are fixed for the life of the page, so they never need to re-notify. */
const subscribeNever = () => () => {};

export function InstallAppButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installedThisSession, setInstalledThisSession] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  /*
   * Read via useSyncExternalStore rather than an effect: the server snapshot
   * renders nothing, so there is no hydration mismatch and no setState-in-effect.
   */
  const standalone = useSyncExternalStore(subscribeNever, isStandalone, () => true);
  const ios = useSyncExternalStore(subscribeNever, isIos, () => false);
  const installed = standalone || installedThisSession;

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalledThisSession(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    // iOS has no install API — the user must go through the Share sheet.
    if (!deferred) {
      if (ios) setShowIosHint((v) => !v);
      return;
    }
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalledThisSession(true);
    setDeferred(null);
  }, [deferred, ios]);

  // Nothing to offer: already installed, or a browser that can't install it.
  if (installed || (!deferred && !ios)) return null;

  return (
    /* Mobile only — installing to a home screen is where this actually pays off. */
    <div className="relative shrink-0 md:hidden">
      <button
        type="button"
        onClick={install}
        aria-label="Install Kerala Monitor as an app"
        className="group inline-flex items-center gap-2 rounded-md border border-[var(--gf-accent)]/45 bg-[var(--gf-accent-soft)] px-4 py-2.5 font-mono text-[0.68rem] font-semibold tracking-wide text-[var(--gf-accent)] uppercase shadow-[inset_0_0_0_1px_rgba(240,90,40,0.12)] transition-[color,background-color,border-color,box-shadow] hover:border-[var(--gf-accent)] hover:bg-[var(--gf-accent)]/20"
      >
        <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3v12" />
          <path d="m7 11 5 5 5-5" />
          <path d="M4 20h16" />
        </svg>
        <span>Install app</span>
      </button>

      {showIosHint && (
        <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-sm border border-[var(--gf-panel-border)] bg-[var(--gf-panel-bg)] p-3 text-left shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
          <p className="text-[0.72rem] leading-relaxed text-[var(--gf-text)]">
            To install: tap the <strong className="text-[var(--gf-accent)]">Share</strong> icon in
            Safari, then choose{" "}
            <strong className="text-[var(--gf-accent)]">Add to Home Screen</strong>.
          </p>
          <button
            type="button"
            onClick={() => setShowIosHint(false)}
            className="mt-2 font-mono text-[0.6rem] font-bold text-[var(--gf-text-muted)] uppercase hover:text-[var(--gf-accent)]"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
