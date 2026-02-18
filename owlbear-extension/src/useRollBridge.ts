import { useEffect, useRef, useState, useCallback } from "react";
import OBR from "@owlbear-rodeo/sdk";

export interface SharedRollResult {
  id: string;
  type: string;
  name: string;
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
  breakdown: string;
  timestamp: string;
  characterName?: string;
}

type ConnectionStatus = "connecting" | "connected" | "error";

const POLL_INTERVAL = 3000;
const BROADCAST_CHANNEL = "dnd-roll-bridge/roll";

const ROLL_TYPE_EMOJI: Record<string, string> = {
  attack: "⚔️",
  damage: "💥",
  healing: "💚",
  "saving-throw": "🛡️",
  "skill-check": "🎯",
  "ability-check": "💪",
};

function rollEmoji(type: string): string {
  return ROLL_TYPE_EMOJI[type] ?? "🎲";
}

export function useRollBridge(serverUrl: string) {
  const [rolls, setRolls] = useState<SharedRollResult[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const latestTimestampRef = useRef<string | null>(null);
  const activeRef = useRef(true);

  const notify = useCallback(async (roll: SharedRollResult) => {
    const who = roll.characterName ? `${roll.characterName} ` : "";
    const emoji = rollEmoji(roll.type);
    const message = `${emoji} ${who}rolled ${roll.total} — ${roll.name} (${roll.breakdown})`;
    try {
      await OBR.notification.show(message, "DEFAULT");
      await OBR.broadcast.sendMessage(BROADCAST_CHANNEL, roll);
    } catch {
      // OBR may not be ready in dev mode outside of OBR context
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    latestTimestampRef.current = null;

    const poll = async () => {
      if (!activeRef.current) return;

      const base = serverUrl.replace(/\/$/, "");
      const since = latestTimestampRef.current
        ? `?since=${encodeURIComponent(latestTimestampRef.current)}`
        : "";
      const url = `${base}/api/rolls${since}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const newRolls: SharedRollResult[] = data.rolls ?? [];

        if (newRolls.length > 0) {
          // Update latest timestamp to the most recent roll
          latestTimestampRef.current = newRolls[0].timestamp;

          // Notify for each new roll (most recent last so toasts stack naturally)
          for (const roll of [...newRolls].reverse()) {
            await notify(roll);
          }

          setRolls((prev) => {
            const ids = new Set(prev.map((r) => r.id));
            const unique = newRolls.filter((r) => !ids.has(r.id));
            return [...unique, ...prev].slice(0, 50);
          });
        }

        setStatus("connected");
      } catch {
        if (activeRef.current) setStatus("error");
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      activeRef.current = false;
      clearInterval(interval);
    };
  }, [serverUrl, notify]);

  return { rolls, status };
}
