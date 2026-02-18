import { useState, useEffect } from "react";
import { useRollBridge } from "./useRollBridge";

const DEFAULT_SERVER = "http://localhost:5173";
const STORAGE_KEY = "dnd-roll-bridge-server-url";

const TYPE_COLORS: Record<string, string> = {
  attack: "#ef4444",
  damage: "#f97316",
  healing: "#22c55e",
  "saving-throw": "#8b5cf6",
  "skill-check": "#3b82f6",
  "ability-check": "#06b6d4",
};

function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? "#6b7280";
}

export default function App() {
  const [serverUrl, setServerUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SERVER;
  });
  const [inputUrl, setInputUrl] = useState(serverUrl);

  const { rolls, status } = useRollBridge(serverUrl);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, serverUrl);
  }, [serverUrl]);

  const handleApply = () => {
    setServerUrl(inputUrl.trim().replace(/\/$/, ""));
  };

  const statusColor =
    status === "connected"
      ? "#22c55e"
      : status === "error"
      ? "#ef4444"
      : "#f59e0b";
  const statusLabel =
    status === "connected"
      ? "Connected"
      : status === "error"
      ? "Cannot reach server"
      : "Connecting…";

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎲 Roll Bridge</h2>
      <p style={styles.subtitle}>
        Broadcasts your character sheet rolls into Owlbear Rodeo.
      </p>

      {/* Server URL input */}
      <div style={styles.section}>
        <label style={styles.label}>Character Creator URL</label>
        <div style={styles.row}>
          <input
            style={styles.input}
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder="http://localhost:5173"
          />
          <button style={styles.button} onClick={handleApply}>
            Apply
          </button>
        </div>
        <div style={styles.statusRow}>
          <span
            style={{ ...styles.dot, backgroundColor: statusColor }}
          />
          <span style={{ ...styles.statusText, color: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Roll history */}
      <div style={styles.section}>
        <label style={styles.label}>
          Recent Rolls {rolls.length > 0 && `(${rolls.length})`}
        </label>
        {rolls.length === 0 ? (
          <p style={styles.empty}>No rolls yet — roll some dice!</p>
        ) : (
          <div style={styles.rollList}>
            {rolls.map((roll) => (
              <div key={roll.id} style={styles.rollItem}>
                <div style={styles.rollHeader}>
                  <span
                    style={{
                      ...styles.rollType,
                      backgroundColor: typeColor(roll.type) + "22",
                      color: typeColor(roll.type),
                    }}
                  >
                    {roll.type.replace(/-/g, " ")}
                  </span>
                  <span style={styles.rollTotal}>{roll.total}</span>
                </div>
                <div style={styles.rollName}>
                  {roll.characterName && (
                    <span style={styles.charName}>{roll.characterName} — </span>
                  )}
                  {roll.name}
                </div>
                <div style={styles.rollBreakdown}>{roll.breakdown}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "system-ui, sans-serif",
    padding: "12px",
    backgroundColor: "#1a1a2e",
    color: "#e2e8f0",
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  title: {
    margin: "0 0 4px 0",
    fontSize: "16px",
    fontWeight: 700,
    color: "#c4b5fd",
  },
  subtitle: {
    margin: "0 0 12px 0",
    fontSize: "11px",
    color: "#94a3b8",
  },
  section: {
    marginBottom: "14px",
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "6px",
  },
  row: {
    display: "flex",
    gap: "6px",
  },
  input: {
    flex: 1,
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    color: "#e2e8f0",
    padding: "6px 8px",
    fontSize: "12px",
    outline: "none",
  },
  button: {
    background: "#7c3aed",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    padding: "6px 12px",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: 600,
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "6px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  statusText: {
    fontSize: "11px",
    fontWeight: 500,
  },
  empty: {
    fontSize: "12px",
    color: "#64748b",
    fontStyle: "italic",
    textAlign: "center",
    padding: "16px 0",
  },
  rollList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxHeight: "260px",
    overflowY: "auto",
  },
  rollItem: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "6px",
    padding: "8px",
  },
  rollHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "3px",
  },
  rollType: {
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "capitalize",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  rollTotal: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#f8fafc",
    lineHeight: 1,
  },
  rollName: {
    fontSize: "12px",
    color: "#cbd5e1",
    marginBottom: "2px",
  },
  charName: {
    color: "#94a3b8",
  },
  rollBreakdown: {
    fontSize: "10px",
    color: "#64748b",
    fontFamily: "monospace",
  },
};
