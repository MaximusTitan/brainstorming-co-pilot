const BITS = ["🎉", "⭐", "✨", "💡", "🌟", "🎊"];

export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          className="absolute -top-8 text-2xl animate-confetti"
          style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.1}s` }}
        >
          {BITS[i % BITS.length]}
        </span>
      ))}
    </div>
  );
}
