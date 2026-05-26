import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      padding: "0 48px",
      height: 64,
      display: "flex",
      alignItems: "center",
      background: "linear-gradient(to bottom, #000000cc, transparent)",
      backdropFilter: "blur(8px)",
    }}>
      <span
        onClick={() => navigate("/")}
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          letterSpacing: 2,
          color: "var(--red)",
          cursor: "pointer",
        }}
      >
        BOOKMYKINO
      </span>
    </nav>
  );
}