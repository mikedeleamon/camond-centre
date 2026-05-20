import { format } from "date-fns";
import GlassTile from "../GlassTile";

interface Props {
  now: Date;
}

export default function TimeDate({ now }: Props) {
  return (
    <GlassTile gridArea="time" delay={0} className="flex flex-col justify-center px-8 py-5">
      <time className="text-7xl font-extralight tracking-tight leading-none text-white/90 tabular-nums">
        {format(now, "h:mm")}
        <span className="text-2xl font-light text-white/40 ml-2">
          {format(now, "a")}
        </span>
      </time>
      <p className="text-base font-light text-white/40 mt-2 tracking-wide">
        {format(now, "MMMM d, yyyy")}
      </p>
    </GlassTile>
  );
}
