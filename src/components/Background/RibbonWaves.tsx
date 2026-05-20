import { memo } from "react";

interface Props {
  primaryColor: string;
  secondaryColor: string;
}

/**
 * PSP XMB-style ribbon waves.
 * Three bezier-curved SVG arcs that slowly drift and breathe:
 *   1. Large arch  — peaks in upper-centre, like a bowl held up
 *   2. S-wave      — sinusoidal sweep across the mid-lower band
 *   3. Lower curve — shallow arc anchored near the bottom
 *
 * CSS-blur is applied to the wrapper div (not the SVG path) to avoid
 * SVG filterRegion clipping. The `translate` CSS keyframes keep the
 * arch shapes intact while drifting.
 */
function RibbonWaves({ primaryColor, secondaryColor }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">

      {/* ── Ribbon 1 · large arching curve ─────────────────────────────── */}
      <div
        className="absolute inset-0 ribbon-a"
        style={{ filter: "blur(20px)", opacity: 0.9 }}
      >
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          overflow="visible"
          style={{ position: "absolute", width: "100%", height: "100%" }}
        >
          {/* Top edge arcs from (−200, 640) → peak (960, 195) → (2120, 640)
              Bottom edge mirrors ~130 px below, closing the ribbon band */}
          <path
            d="M -200,640
               C  480,195  1440,195  2120,640
               L 2120,770
               C 1440,330   480,330  -200,770
               Z"
            fill={primaryColor}
          />
        </svg>
      </div>

      {/* ── Ribbon 2 · S-wave sweep ──────────────────────────────────────── */}
      <div
        className="absolute inset-0 ribbon-b"
        style={{ filter: "blur(22px)", opacity: 0.85 }}
      >
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          overflow="visible"
          style={{ position: "absolute", width: "100%", height: "100%" }}
        >
          {/* Sinusoidal path: dips down centre-left, rises centre-right */}
          <path
            d="M -200,700
               C  360,575   760,760  1150,655
               C 1530,548  1880,705  2120,638
               L 2120,768
               C 1880,835  1530,678  1150,785
               C  760,892   360,705  -200,830
               Z"
            fill={secondaryColor}
          />
        </svg>
      </div>

      {/* ── Ribbon 3 · lower shallow arc ────────────────────────────────── */}
      <div
        className="absolute inset-0 ribbon-c"
        style={{ filter: "blur(18px)", opacity: 0.75 }}
      >
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          overflow="visible"
          style={{ position: "absolute", width: "100%", height: "100%" }}
        >
          <path
            d="M -200,825
               C  320,758   760,875  1180,805
               C 1580,738  1880,825  2120,796
               L 2120,916
               C 1880,945  1580,858  1180,925
               C  760,992   320,875  -200,942
               Z"
            fill={primaryColor}
          />
        </svg>
      </div>

      {/* ── Ribbon 4 · thin accent arc, offset phase ────────────────────── */}
      <div
        className="absolute inset-0 ribbon-d"
        style={{ filter: "blur(26px)", opacity: 0.6 }}
      >
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          overflow="visible"
          style={{ position: "absolute", width: "100%", height: "100%" }}
        >
          {/* Shallower arch — sits above ribbon 1, adds layered depth */}
          <path
            d="M -200,480
               C  420,165  1500,165  2120,480
               L 2120,575
               C 1500,265   420,265  -200,575
               Z"
            fill={secondaryColor}
          />
        </svg>
      </div>

    </div>
  );
}

export default memo(RibbonWaves);
