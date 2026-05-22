import { motion, AnimatePresence } from "framer-motion";

interface Props {
  visible: boolean;
}

export default function SplashScreen({ visible }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "radial-gradient(ellipse at center, #0f1528 0%, #0a0a12 100%)",
            pointerEvents: "none",
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {/* Ambient glow behind logo */}
            <div className="relative">
              <div
                className="absolute inset-0 -m-24 rounded-full breathe"
                style={{
                  background:
                    "radial-gradient(circle, rgba(99,102,241,0.15), transparent 80%)",
                }}
              />
              <motion.div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15)), rgba(10,10,20,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                initial={{ scale: 0.8, rotate: -5 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(165,165,255,0.7)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </motion.div>
            </div>

            <motion.h1
              className="text-lg font-light tracking-[0.3em] uppercase"
              style={{ color: "rgba(255,255,255,0.5)" }}
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.3em" }}
              transition={{ duration: 1.2, delay: 0.7 }}
            >
              Camond Centre
            </motion.h1>

            {/* Loading bar */}
            <motion.div
              className="w-32 h-px rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)",
                }}
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1.5,
                  delay: 0.8,
                  repeat: 1,
                  ease: "linear",
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
