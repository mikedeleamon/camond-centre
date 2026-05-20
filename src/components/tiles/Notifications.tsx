import { useState, useEffect, useCallback } from "react";
import GlassTile from "../GlassTile";
import type { TileId } from "../../hooks/useGridLayout";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  url?: string;
  description?: string;
}

interface Props {
  tileId?: TileId;
  onTileResize?: (edge: "left" | "right" | "top" | "bottom", delta: number) => void;
  gridStyle?: React.CSSProperties;
  idleOpacity?: number;
}

const PLACEHOLDER_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Global markets show steady recovery amid new trade agreements",
    source: "Reuters",
    time: "2h ago",
    description: "Markets across Asia and Europe posted gains as investors welcomed new bilateral trade agreements. Analysts predict continued momentum through the quarter.",
  },
  {
    id: "2",
    title: "New breakthrough in renewable energy storage technology",
    source: "Science Daily",
    time: "3h ago",
    description: "Researchers have developed a novel solid-state battery that could triple energy density for grid-scale storage. The technology uses abundant materials and could reach production within two years.",
  },
  {
    id: "3",
    title: "Cities embrace AI-powered traffic management systems",
    source: "Tech Review",
    time: "4h ago",
    description: "Several major cities are deploying machine learning systems to optimize traffic flow in real-time. Early results show a 20% reduction in average commute times.",
  },
  {
    id: "4",
    title: "International space station celebrates milestone mission",
    source: "Space News",
    time: "5h ago",
    description: "The ISS has completed its 200th crewed mission, marking a new chapter in international space cooperation. The crew conducted over 300 experiments during their six-month stay.",
  },
  {
    id: "5",
    title: "Sustainable architecture trends reshape urban planning",
    source: "Dezeen",
    time: "6h ago",
    description: "Biophilic design and net-zero buildings are becoming the standard in new urban developments. Cities are mandating green building codes that prioritize energy efficiency and resident wellbeing.",
  },
];

export default function Notifications({ tileId, onTileResize, gridStyle, idleOpacity }: Props) {
  const [news, setNews] = useState<NewsItem[]>(PLACEHOLDER_NEWS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch(
        "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
      );
      if (res.ok) {
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const items = xml.querySelectorAll("item");
        const parsed: NewsItem[] = [];

        items.forEach((item, i) => {
          if (i >= 8) return;
          const title = item.querySelector("title")?.textContent || "";
          const source = item.querySelector("source")?.textContent || "News";
          const pubDate = item.querySelector("pubDate")?.textContent || "";
          const link = item.querySelector("link")?.textContent || undefined;
          const desc = item.querySelector("description")?.textContent || undefined;

          const hours = Math.floor(
            (Date.now() - new Date(pubDate).getTime()) / 3600000
          );

          parsed.push({
            id: `news-${i}`,
            title,
            source,
            time: hours < 1 ? "Just now" : `${hours}h ago`,
            url: link,
            description: desc,
          });
        });

        if (parsed.length > 0) setNews(parsed);
      }
    } catch {
      // keep placeholder news
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % news.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [news.length]);

  const handleClick = (item: NewsItem) => {
    if (item.url && window.electronAPI) {
      (window as any).electronAPI.shell?.openExternal?.(item.url);
    } else if (item.url) {
      window.open(item.url, "_blank");
    }
  };

  return (
    <GlassTile delay={3} className="flex flex-col p-5 overflow-hidden" tileId={tileId} onResize={onTileResize} style={gridStyle} idleOpacity={idleOpacity}>
      <h3 className="tile-label mb-3">Notifications</h3>

      <div className="flex-1 overflow-y-auto space-y-0 pr-1">
        {news.map((item, i) => {
          const isHovered = hoveredIndex === i;
          const isCompressed = hoveredIndex !== null && hoveredIndex !== i;
          return (
            <div
              key={item.id}
              className="rounded-lg px-2 transition-all duration-300 cursor-pointer"
              style={{
                background:
                  isHovered ? "rgba(255,255,255,0.05)" :
                  i === activeIndex ? "rgba(255,255,255,0.03)" : "transparent",
                paddingTop: isCompressed ? "2px" : "8px",
                paddingBottom: isCompressed ? "2px" : "8px",
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleClick(item)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-colors"
                  style={{
                    background:
                      isHovered ? "rgba(99,102,241,0.7)" :
                      i === activeIndex ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm text-white/55 leading-snug transition-all duration-200"
                    style={{
                      display: isCompressed ? "-webkit-box" : undefined,
                      WebkitLineClamp: isCompressed ? 1 : 2,
                      WebkitBoxOrient: "vertical",
                      overflow: isCompressed ? "hidden" : undefined,
                    }}
                  >
                    {item.title}
                  </p>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: isHovered && item.description ? "60px" : "0px",
                      opacity: isHovered ? 1 : 0,
                    }}
                  >
                    <p className="text-xs text-white/30 leading-relaxed mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-2 mt-1 transition-all duration-200"
                    style={{ opacity: isCompressed ? 0 : 1, height: isCompressed ? 0 : "auto" }}
                  >
                    <span className="text-[10px] text-white/25">{item.source}</span>
                    <span className="text-[10px] text-white/15">{item.time}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassTile>
  );
}
