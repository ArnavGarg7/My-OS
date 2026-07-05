import { APP_NAME, APP_TAGLINE } from "@myos/shared/constants";

/**
 * Sprint 1.1 landing page — foundation only. Displays the product name, tagline,
 * and initialization status. No product UI (that begins in Sprint 1.2+).
 */
export default function Page() {
  return (
    <main className="bg-base flex min-h-dvh items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <span
          aria-hidden
          className="bg-elevated text-accent flex size-12 items-center justify-center rounded-[10px] font-mono text-2xl"
        >
          ▮
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-fg text-[28px] font-semibold leading-8">{APP_NAME}</h1>
          <p className="text-fg-muted text-[15px]">{APP_TAGLINE}</p>
        </div>
        <p className="text-success font-mono text-xs uppercase tracking-[0.18em]">
          System Initialized.
        </p>
      </div>
    </main>
  );
}
