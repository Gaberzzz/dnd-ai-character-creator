/**
 * Bonus Damage Features for D&D 5e
 * Detects class/race features that add bonus damage dice to weapon attacks
 * and provides rollable options for weapon cards.
 */

interface Feature {
  name: string;
  description: string;
  category?: string;
}

export interface BonusDamageOption {
  label: string;
  dice: string;
  damageType?: string;
}

export interface BonusDamageFeature {
  name: string;
  label: string;
  condition?: string;
  critOnly?: boolean;
  // Simple features: single dice formula
  dice?: string;
  damageType?: string;
  // Picker features: multiple options (e.g., Divine Smite by slot level)
  options?: BonusDamageOption[];
}

function hasFeature(features: Feature[], name: string): boolean {
  return features.some(
    (f) => f.name.toLowerCase().includes(name.toLowerCase())
  );
}

function getSneakAttackDice(level: number): string {
  return `${Math.ceil(level / 2)}d6`;
}

/** Returns max spell slot level available for a paladin at the given level */
function paladinMaxSlotLevel(level: number): number {
  if (level < 2) return 0;
  if (level <= 4) return 1;
  if (level <= 8) return 2;
  if (level <= 12) return 3;
  if (level <= 16) return 4;
  return 5;
}

/** Returns max spell slot level for a warlock at the given level */
function warlockMaxSlotLevel(level: number): number {
  if (level < 2) return 1;
  if (level <= 2) return 1;
  if (level <= 4) return 2;
  if (level <= 6) return 3;
  if (level <= 8) return 4;
  return 5;
}

function getDivineSmiteOptions(level: number): BonusDamageOption[] {
  const maxSlot = paladinMaxSlotLevel(level);
  if (maxSlot === 0) return [];

  const options: BonusDamageOption[] = [];
  for (let slot = 1; slot <= maxSlot; slot++) {
    const dice = Math.min(1 + slot, 5); // 2d8 at 1st, caps at 5d8
    options.push({
      label: `${ordinal(slot)} level (${dice}d8)`,
      dice: `${dice}d8`,
      damageType: 'radiant',
    });
  }
  return options;
}

function getEldritchSmiteOptions(level: number): BonusDamageOption[] {
  const maxSlot = warlockMaxSlotLevel(level);
  const options: BonusDamageOption[] = [];
  for (let slot = 1; slot <= maxSlot; slot++) {
    const dice = 1 + slot; // 1d8 base + 1d8 per slot level
    options.push({
      label: `${ordinal(slot)} level (${dice}d8)`,
      dice: `${dice}d8`,
      damageType: 'force',
    });
  }
  return options;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getBrutalCriticalDice(level: number): number {
  if (level >= 17) return 3;
  if (level >= 13) return 2;
  if (level >= 9) return 1;
  return 0;
}

export function getBonusDamageFeatures(
  className: string,
  level: string,
  features: Feature[],
  race: string
): BonusDamageFeature[] {
  const result: BonusDamageFeature[] = [];
  const levelNum = parseInt(level) || 1;
  const cls = className.toLowerCase().trim();
  const raceLower = race.toLowerCase().trim();

  // Rogue — Sneak Attack
  if (cls.includes('rogue')) {
    result.push({
      name: 'Sneak Attack',
      label: `Sneak Attack (${getSneakAttackDice(levelNum)})`,
      dice: getSneakAttackDice(levelNum),
      condition: 'Once per turn with advantage or ally within 5ft of target',
    });
  }

  // Paladin — Divine Smite (picker) + Improved Divine Smite (simple)
  if (cls.includes('paladin')) {
    const smiteOptions = getDivineSmiteOptions(levelNum);
    if (smiteOptions.length > 0) {
      result.push({
        name: 'Divine Smite',
        label: 'Divine Smite',
        condition: 'On melee hit, expend a spell slot (+1d8 vs undead/fiends)',
        options: smiteOptions,
      });
    }
    if (levelNum >= 11) {
      result.push({
        name: 'Improved Divine Smite',
        label: 'Imp. Smite (1d8)',
        dice: '1d8',
        damageType: 'radiant',
        condition: 'Automatic on every melee weapon hit',
      });
    }
  }

  // Ranger subclass features (detected via features array)
  if (cls.includes('ranger') || hasFeature(features, 'Colossus Slayer') || hasFeature(features, 'Dread Ambusher') || hasFeature(features, 'Planar Warrior')) {
    if (hasFeature(features, 'Colossus Slayer')) {
      result.push({
        name: 'Colossus Slayer',
        label: 'Colossus Slayer (1d8)',
        dice: '1d8',
        condition: 'Once per turn vs creature below max HP',
      });
    }
    if (hasFeature(features, 'Dread Ambusher')) {
      result.push({
        name: 'Dread Ambusher',
        label: 'Dread Ambusher (1d8)',
        dice: '1d8',
        condition: 'Extra damage on first attack of first turn in combat',
      });
    }
    if (hasFeature(features, 'Planar Warrior')) {
      const planarDice = levelNum >= 11 ? '2d8' : '1d8';
      result.push({
        name: 'Planar Warrior',
        label: `Planar Warrior (${planarDice})`,
        dice: planarDice,
        damageType: 'force',
        condition: 'Bonus action to mark creature, once per turn',
      });
    }
  }

  // Warlock — Eldritch Smite (detected via features)
  if (hasFeature(features, 'Eldritch Smite')) {
    const smiteOptions = getEldritchSmiteOptions(levelNum);
    if (smiteOptions.length > 0) {
      result.push({
        name: 'Eldritch Smite',
        label: 'Eldritch Smite',
        condition: 'On pact weapon hit, expend warlock spell slot. Knocks prone if Huge or smaller.',
        options: smiteOptions,
      });
    }
  }

  // Barbarian — Brutal Critical (crit only)
  if (cls.includes('barbarian')) {
    const extraDice = getBrutalCriticalDice(levelNum);
    if (extraDice > 0) {
      result.push({
        name: 'Brutal Critical',
        label: `Brutal Crit (+${extraDice} die)`,
        dice: `${extraDice}d6`, // placeholder — actual die depends on weapon
        critOnly: true,
        condition: `On critical hit, roll ${extraDice} extra weapon damage ${extraDice === 1 ? 'die' : 'dice'}`,
      });
    }
  }

  // Half-Orc — Savage Attacks (crit only)
  if (raceLower.includes('half-orc')) {
    result.push({
      name: 'Savage Attacks',
      label: 'Savage Attacks (+1 die)',
      dice: '1d6', // placeholder — actual die depends on weapon
      critOnly: true,
      condition: 'On critical hit with melee weapon, roll 1 extra weapon damage die',
    });
  }

  return result;
}
