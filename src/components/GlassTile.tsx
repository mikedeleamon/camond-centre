import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  gridArea?: string;
  delay?: number;
}

export default function GlassTile({
  children,
  className = "",
  gridArea,
  delay = 0,
}: Props) {
  return (
    <motion.div
      className={`glass-tile overflow-hidden relative ${className}`}
      style={gridArea ? { gridArea } : undefined}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.8,
        delay: 0.3 + delay * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}
