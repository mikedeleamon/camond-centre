import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function DashboardGrid({ children }: Props) {
  return (
    <div
      className="w-full h-full p-5 grid gap-3"
      style={{
        gridTemplateColumns: "repeat(12, 1fr)",
        gridTemplateRows: "1fr 1fr 1fr 1fr 1fr",
        gridTemplateAreas: `
          "tl tl time time time time curr curr curr curr curr curr"
          "tl tl wthr wthr wthr wthr curr curr curr curr curr curr"
          "tl tl menu menu menu notif notif notif task task task task"
          "tl tl menu menu menu notif notif notif task task task task"
          "tl tl menu menu menu notif notif notif task task task task"
        `,
      }}
    >
      {children}
    </div>
  );
}
