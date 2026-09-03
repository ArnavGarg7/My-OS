import { forwardRef } from "react";
import { cn } from "../lib/cn";

export interface EmblemProps extends React.SVGAttributes<SVGSVGElement> {
  /** Pixel size of the square emblem. Defaults to 28 (sidebar identity size). */
  size?: number;
  /** Draw the rounded obsidian tile behind the mark. Off = glyph only. */
  tile?: boolean;
}

/**
 * The My OS Core Emblem (V2 Stage 1) — an orbital: a solid kinetic core with a
 * broken ring and two orbiting nodes. This is the application's identity mark;
 * use it in the shell, loading states, and system/assistant surfaces. Do not
 * recolour or redraw it — `currentColor` is not used, the amber is intentional.
 */
export const Emblem = forwardRef<SVGSVGElement, EmblemProps>(function Emblem(
  { size = 28, tile = true, className, ...props },
  ref,
) {
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="My OS"
      className={cn("shrink-0", className)}
      {...props}
    >
      {tile ? (
        <>
          <rect width="100" height="100" rx="24" fill="#141618" />
          <rect x="1" y="1" width="98" height="98" rx="23" stroke="#262a30" strokeWidth="1.5" />
        </>
      ) : null}
      <circle
        cx="50"
        cy="50"
        r="28"
        stroke="#ff7a1a"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="140 35"
      />
      <circle cx="50" cy="50" r="14" fill="#ff7a1a" />
      <circle cx="50" cy="22" r="4" fill="#ffffff" />
      <circle cx="78" cy="50" r="3" fill="#ffffff" opacity="0.6" />
    </svg>
  );
});
