import { useMemo } from "react";
import { motion } from "framer-motion";

export default function Particles({ count = 32 }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: 50 + Math.random() * 60,
        size: 2 + Math.random() * 5,
        delay: Math.random() * 8,
        duration: 14 + Math.random() * 12,
        drift: -25 + Math.random() * 50,
      })),
    [count]
  );

  return (
    <div className="particles" aria-hidden>
      {items.map((p) => (
        <motion.span
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, 0.95, 0],
            y: [0, -200, -380],
            x: [0, p.drift, p.drift * 1.6],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
