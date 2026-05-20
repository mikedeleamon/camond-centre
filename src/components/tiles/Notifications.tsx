import { useState, useEffect, useCallback } from "react";
import GlassTile from "../GlassTile";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  url?: string;
}

const PLACEHOLDER_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Global markets show steady recovery amid new trade agreements",
    source: "Reuters",
    time: "2h ago",
  },
  {
    id: "2",
    title: "New breakthrough in renewable energy storage technology",
    source: "Science Daily",
    time: "3h ago",
  },
  {
    id: "3",
    title: "Cities embrace AI-powered traffic management systems",
    source: "Tech Review",
    time: "4h ago",
  },
  {
    id: "4",
    title: "International space station celebrates milestone mission",
    source: "Space News",
    time: "5h ago",
  },
  {
    id: "5",
    title: "Sustainable architecture trends reshape urban planning",
    source: "Dezeen",
    time: "6h ago",
  },
];

export default function Notifications() {
  const [news, setNews] = useState<NewsItem[]>(PLACEHOLDER_NEWS);
  const [activeIndex, setActiveIndex] = useState(0);

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

          const hours = Math.floor(
            (Date.now() - new Date(pubDate).getTime()) / 3600000
          );

          parsed.push({
            id: `news-${i}`,
            title,
            source,
            time: hours < 1 ? "Just now" : `${hours}h ago`,
            url: link,
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

  return (
    <GlassTile gridArea="notif" delay={3} className="flex flex-col p-5 overflow-hidden">
      <h3 className="text-xs font-medium text-white/55 uppercase tracking-wider mb-3">
        Notifications
      </h3>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {news.map((item, i) => (
          <div
            key={item.id}
            className="flex items-start gap-3 py-2 rounded-lg px-2 transition-colors"
            style={{
              background:
                i === activeIndex ? "rgba(255,255,255,0.03)" : "transparent",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
              style={{
                background:
                  i === activeIndex
                    ? "rgba(99,102,241,0.5)"
                    : "rgba(255,255,255,0.1)",
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white/55 leading-snug line-clamp-2">
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-white/25">{item.source}</span>
                <span className="text-[10px] text-white/15">{item.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassTile>
  );
}
