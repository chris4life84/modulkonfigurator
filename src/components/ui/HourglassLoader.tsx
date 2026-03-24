export function HourglassLoader() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center animate-fadeIn">
      <style>{`
        @keyframes hourglass-rotate {
          0% { transform: rotate(0deg); }
          40% { transform: rotate(180deg); }
          50% { transform: rotate(180deg); }
          90% { transform: rotate(360deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sand-fall {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(12px); opacity: 0; }
        }
        @keyframes sand-top {
          0% { d: path("M 18 22 Q 25 28, 32 22"); }
          100% { d: path("M 22 22 Q 25 22, 28 22"); }
        }
        @keyframes sand-bottom {
          0% { d: path("M 22 38 Q 25 38, 28 38"); }
          100% { d: path("M 18 38 Q 25 32, 32 38"); }
        }
        .hourglass-spin {
          animation: hourglass-rotate 3s ease-in-out infinite;
          transform-origin: center center;
        }
        .sand-stream {
          animation: sand-fall 0.8s linear infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .loader-fade-in {
          animation: fadeInUp 0.5s ease-out;
        }
      `}</style>

      <div className="loader-fade-in">
        <svg
          className="hourglass-spin"
          width="64"
          height="64"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glass frame */}
          <path
            d="M 14 10 L 36 10 L 36 12 L 30 24 L 30 26 L 36 38 L 36 40 L 14 40 L 14 38 L 20 26 L 20 24 L 14 12 Z"
            stroke="#b8860b"
            strokeWidth="2"
            fill="none"
            strokeLinejoin="round"
          />

          {/* Top cap */}
          <rect x="12" y="8" width="26" height="3" rx="1.5" fill="#b8860b" />
          {/* Bottom cap */}
          <rect x="12" y="39" width="26" height="3" rx="1.5" fill="#b8860b" />

          {/* Sand in top half */}
          <path
            d="M 18 14 L 32 14 L 27 22 L 23 22 Z"
            fill="#d4a84b"
            opacity="0.7"
          />

          {/* Sand stream through neck */}
          <line
            className="sand-stream"
            x1="25" y1="24"
            x2="25" y2="26"
            stroke="#d4a84b"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Sand in bottom half */}
          <path
            d="M 20 36 Q 25 32, 30 36 L 33 38 L 17 38 Z"
            fill="#d4a84b"
            opacity="0.7"
          />
        </svg>
      </div>

      <p className="mt-4 text-sm font-medium text-[#b8860b] loader-fade-in" style={{ animationDelay: '0.2s' }}>
        3D-Szene wird geladen…
      </p>
    </div>
  );
}
