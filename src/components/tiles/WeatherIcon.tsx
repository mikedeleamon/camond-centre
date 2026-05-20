interface Props {
  icon: string;
  size?: number;
}

export default function WeatherIcon({ icon, size = 24 }: Props) {
  const s = size;
  const props = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "sun":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...props}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
      );
    case "cloud-sun":
      return (
        <svg {...props}>
          <path d="M12 2v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="M20 12h2" />
          <path d="m19.07 4.93-1.41 1.41" />
          <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
          <path d="M13 22H7a5 5 0 1 1 .9-9.908 8 8 0 0 1 5.1-4.092" />
          <path d="M18 10h-1.26A8 8 0 0 1 17 12.354" />
          <path d="M17 22a5 5 0 0 0 0-10h-1" />
        </svg>
      );
    case "cloud-rain":
      return (
        <svg {...props}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          <line x1="8" y1="21" x2="8" y2="23" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="16" y1="21" x2="16" y2="23" />
        </svg>
      );
    case "snowflake":
      return (
        <svg {...props}>
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
        </svg>
      );
    case "cloud-lightning":
      return (
        <svg {...props}>
          <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
          <polyline points="13 11 9 17 15 17 11 23" />
        </svg>
      );
    case "cloud-fog":
      return (
        <svg {...props}>
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          <line x1="4" y1="20" x2="8" y2="20" />
          <line x1="12" y1="20" x2="20" y2="20" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="5" />
        </svg>
      );
  }
}
