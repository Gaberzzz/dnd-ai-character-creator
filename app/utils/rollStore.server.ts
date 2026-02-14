import type { SharedRollResult } from './diceRoller';

const MAX_ROLLS = 100;
let sharedRolls: SharedRollResult[] = [];

export function addSharedRoll(roll: SharedRollResult): void {
  sharedRolls.unshift(roll);
  if (sharedRolls.length > MAX_ROLLS) {
    sharedRolls = sharedRolls.slice(0, MAX_ROLLS);
  }
}

export function getSharedRolls(since?: string): SharedRollResult[] {
  if (!since) return sharedRolls;
  const sinceTime = new Date(since).getTime();
  return sharedRolls.filter(r => new Date(r.timestamp).getTime() > sinceTime);
}
