export default function Navbar() {
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
      <a
        href="/"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          letterSpacing: 2,
          color: "var(--red)",
          textDecoration: "none",
        }}
      >
        BOOKMYKINO
      </a>
    </nav>
  );
}