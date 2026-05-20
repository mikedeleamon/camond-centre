import { memo } from "react";

interface Props {
  primaryColor: string;
  secondaryColor: string;
  slowMode?: boolean;
}

function RibbonWaves({ primaryColor, secondaryColor, slowMode = false }: Props) {
  const speed = slowMode ? 1.3 : 1;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 ribbon-a"
        style={{
          filter: "blur(20px)",
          opacity: 0.9,
          animationDuration: `${20 * speed}s`,
        }}
      >
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          overflow="visible"
          style={{ position: "absolute", width: "100%", height: "100%" }}
        >
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

      <div
        className="absolute inset-0 ribbon-b"
        style={{
          filter: "blur(22px)",
          opacity: 0.85,
          animationDuration: `${26 * speed}s`,
        }}
      >
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          overflow="visible"
          style={{ position: "absolute", width: "100%", height: "100%" }}
        >
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

      <div
        className="absolute inset-0 ribbon-c"
        style={{
          filter: "blur(18px)",
          opacity: 0.75,
          animationDuration: `${22 * speed}s`,
        }}
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

      <div
        className="absolute inset-0 ribbon-d"
        style={{
          filter: "blur(26px)",
          opacity: 0.6,
          animationDuration: `${32 * speed}s`,
        }}
      >
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          overflow="visible"
          style={{ position: "absolute", width: "100%", height: "100%" }}
        >
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
