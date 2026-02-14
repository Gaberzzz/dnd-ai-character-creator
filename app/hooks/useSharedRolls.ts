import { useState, useEffect, useCallback, useRef } from 'react';
import type { SharedRollResult } from '../utils/diceRoller';

const POLL_INTERVAL = 3000;

export function useSharedRolls() {
  const [sharedRolls, setSharedRolls] = useState<SharedRollResult[]>([]);
  const latestTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const params = latestTimestampRef.current
          ? `?since=${encodeURIComponent(latestTimestampRef.current)}`
          : '';
        const res = await fetch(`/api/rolls${params}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.rolls && data.rolls.length > 0 && active) {
          setSharedRolls(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newRolls = data.rolls.filter(
              (r: SharedRollResult) => !existingIds.has(r.id)
            );
            if (newRolls.length === 0) return prev;
            const merged = [...newRolls, ...prev].slice(0, 100);
            return merged;
          });
          latestTimestampRef.current = data.rolls[0].timestamp;
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const submitRoll = useCallback(async (roll: SharedRollResult) => {
    try {
      await fetch('/api/rolls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roll),
      });
    } catch {
      // Fire-and-forget
    }
  }, []);

  return { sharedRolls, submitRoll };
}
