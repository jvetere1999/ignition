import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Passion OS - Personal Productivity & Music Production Companion";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a2e",
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(233, 69, 96, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(15, 52, 96, 0.2) 0%, transparent 50%)",
        }}
      >
        {/* Accent bar at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #e94560 0%, #0f3460 100%)",
          }}
        />

        {/* Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: "50%",
            backgroundColor: "rgba(233, 69, 96, 0.2)",
            marginBottom: 24,
          }}
        >
          <svg
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#e94560"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="#e94560" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          Passion OS
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#a0a0a0",
            marginBottom: 32,
          }}
        >
          Personal Productivity & Music Production Companion
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 32,
            fontSize: 18,
            color: "#666666",
          }}
        >
          <span>Focus Timer</span>
          <span style={{ color: "#444" }}>-</span>
          <span>DAW Shortcuts</span>
          <span style={{ color: "#444" }}>-</span>
          <span>Quest Tracker</span>
          <span style={{ color: "#444" }}>-</span>
          <span>Skill Development</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

