export function buildCharacterGenerationPrompt(userPrompt: string): string {
    return `Generate a complete D&D 5e character based on this prompt: "${userPrompt}"

Please return ONLY a JSON object with these exact field names and appropriate values:

⚠️ IMPORTANT: If the user request contains "/" or mentions multiple classes, use the MULTICLASS format below!
If it's a single class, use the SINGLE CLASS format.

SINGLE CLASS FORMAT (for single-class characters):
{
  "characterName": "string",
  "playerName": "",
  "race": "string",
  "raceDescription": "string (2-3 sentences describing the racial traits, culture, and abilities)",
  "class": "string (e.g., 'Fighter')",
  "classDescription": "string (2-3 sentences describing the class role, abilities, and playstyle)",
  "level": "string (e.g., '3')",
  "subclass": "string (e.g., 'Eldritch Knight' - the subclass/archetype; use empty string if no subclass)",
  "subclassDescription": "string (2-3 sentences describing the subclass features; empty string if no subclass)",

MULTICLASS FORMAT (use if user specifies multiple classes with "/" or "and"):
{
  "characterName": "string",
  "playerName": "",
  "race": "string",
  "raceDescription": "string (2-3 sentences describing the racial traits, culture, and abilities)",
  "classes": [
    {
      "name": "string (e.g., 'Cleric')",
      "subclass": "string (e.g., 'Divine Soul')",
      "level": number (NOT a string! e.g., 1 or 2)
    },
    {
      "name": "string (e.g., 'Sorcerer')",
      "subclass": "string",
      "level": number
    }
  ],
  "totalLevel": number (sum of all class levels),
  "class": "", (leave empty for multiclass)
  "subclass": "", (leave empty for multiclass)
  "level": "", (leave empty for multiclass)
  "classDescription": "", (leave empty for multiclass)
  "subclassDescription": "", (leave empty for multiclass)
  "background": "string",
  "alignment": "string",
  "experiencePoints": "string",
  "strength": "string (ability score 8-20)",
  "strengthMod": "string (e.g., '+1')",
  "dexterity": "string (ability score 8-20)",
  "dexterityMod": "string (e.g., '+2')",
  "constitution": "string (ability score 8-20)",
  "constitutionMod": "string (e.g., '+2')",
  "intelligence": "string (ability score 8-20)",
  "intelligenceMod": "string (e.g., '+1')",
  "wisdom": "string (ability score 8-20)",
  "wisdomMod": "string (e.g., '+2')",
  "charisma": "string (ability score 8-20)",
  "charismaMod": "string (e.g., '+0')",
  "armorClass": "string",
  "initiative": "string (with + or -)",
  "speed": "string (e.g., '30 ft')",
  "hitPointMaximum": "string",
  "currentHitPoints": "string",
  "temporaryHitPoints": "",
  "hitDice": "string (e.g., '3d10')",
  "proficiencyBonus": "string (with +)",
  "personalityTraits": "string",
  "ideals": "string",
  "bonds": "string",
  "flaws": "string",
  "features": [
    {
      "name": "string (e.g., 'Second Wind')",
      "description": "string (detailed description of what the feature does and how it works)",
      "category": "string (e.g., 'class', 'racial', 'background', 'feat')"
    }
  ],
  "featuresAndTraits": "string (for backward compatibility - can be empty)",
  "equipment": "string (comma-separated list)",
  "attacks": [
    {
      "name": "string",
      "atkBonus": "string (with + or -)",
      "damage": "string (e.g., '1d8 + 2 piercing')"
    }
  ],
  "skills": {
    "athletics": { "proficient": false, "value": "+0" },
    "acrobatics": { "proficient": false, "value": "+0" },
    "sleightOfHand": { "proficient": false, "value": "+0" },
    "stealth": { "proficient": false, "value": "+0" },
    "arcana": { "proficient": false, "value": "+0" },
    "history": { "proficient": false, "value": "+0" },
    "investigation": { "proficient": false, "value": "+0" },
    "nature": { "proficient": false, "value": "+0" },
    "religion": { "proficient": false, "value": "+0" },
    "animalHandling": { "proficient": false, "value": "+0" },
    "insight": { "proficient": false, "value": "+0" },
    "medicine": { "proficient": false, "value": "+0" },
    "perception": { "proficient": false, "value": "+0" },
    "survival": { "proficient": false, "value": "+0" },
    "deception ": { "proficient": false, "value": "+0" },
    "intimidation": { "proficient": false, "value": "+0" },
    "performance": { "proficient": false, "value": "+0" },
    "persuasion": { "proficient": false, "value": "+0" }
  },
NOTE: For skills, calculate the value as:
  - athletics/acrobatics/sleightOfHand/stealth use DEX or STR (athletics uses STR, others use DEX)
  - arcana/history/investigation/nature/religion use INT
  - animalHandling/insight/medicine/perception/survival use WIS
  - deception/intimidation/performance/persuasion use CHA
  - value = ability_modifier + (proficiency_bonus if proficient in skill)
  - Example: If STR is 14 (mod +2) and character is proficient in athletics with +2 prof bonus, athletics value should be "+4"
  - If not proficient: just use the ability modifier (e.g., DEX 16 = mod +3, acrobatics = "+3" if not proficient, "+5" if proficient with +2 bonus)
  "savingThrows": {
    "strength": { "proficient": false, "value": "+0" },
    "dexterity": { "proficient": false, "value": "+0" },
    "constitution": { "proficient": false, "value": "+0" },
    "intelligence": { "proficient": false, "value": "+0" },
    "wisdom": { "proficient": false, "value": "+0" },
    "charisma": { "proficient": false, "value": "+0" }
  },
NOTE: For saving throws, calculate the value as:
  - value = ability_modifier + (proficiency_bonus if proficient in that save)
  - Example: WIS 16 (mod +3) with proficiency is "+5" (assuming +2 prof bonus at low level)
  "cantrips": [
    {
      "name": "string (e.g., 'Fire Bolt')",
      "level": "0",
      "school": "string (e.g., 'Evocation')",
      "castingTime": "string (e.g., '1 action')",
      "range": "string (e.g., '120 feet')",
      "duration": "string (e.g., 'Instantaneous')",
      "description": "string (spell effects and details)",
      "damage": "string (optional, e.g., '1d10 fire')",
      "saveDC": "string (optional)",
      "concentration": "boolean (true if requires concentration)",
      "ritual": "boolean (true if can be cast as ritual)",
      "components": "string (e.g., 'V, S' or 'V, S, M (a focus)')",
      "higherLevels": "string (optional - cantrip damage scaling at 5th, 11th, and 17th level, e.g., 'This spell\\'s damage increases when you reach certain levels. At 5th level, the attack deals an extra 1d10 fire damage (2d10). The damage increases again at 11th level (3d10) and 17th level (4d10).')"
    }
  ],
  "spells": [
    {
      "name": "string (e.g., 'Meteor Swarm')",
      "level": "string (1-9)",
      "school": "string (e.g., 'Evocation')",
      "castingTime": "string (e.g., '1 action')",
      "range": "string (e.g., '1 mile')",
      "duration": "string (e.g., 'Instantaneous')",
      "description": "string (spell effects and details)",
      "damage": "string (optional, e.g., '20d6 fire')",
      "saveDC": "string (optional, e.g., 'DEX 20')",
      "concentration": "boolean (true if requires concentration)",
      "ritual": "boolean (true if can be cast as ritual)",
      "components": "string (e.g., 'V, S, M (a focus)')",
      "higherLevels": "string (optional - upcast effects, e.g., 'At Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, the extra damage increases by 1d6 for each slot level above 1st.')"
    }
  ],
  "spellcastingAbility": "string (INT, WIS, or CHA based on class)",
  "spellSaveDC": "string (e.g., '15')",
  "spellAttackBonus": "string (with + or -)",
  "cp": "0",
  "sp": "0",
  "ep": "0",
  "gp": "string",
  "pp": "0"
}

Ensure mathematical accuracy (modifiers = (ability - 10) / 2, rounded down).
For spellcasters, include all cantrips available at this level, plus a thematic selection of leveled spells that the character would reasonably prepare/know based on their class spell list and level.
Include 4-6 important class and racial features in the features array, each with a clear description of what it does.
Make personality traits, background, and story elements match the theme requested in the prompt.

REMEMBER: If the user prompt contains "/" between class names, "and", or mentions multiple classes, generate MULTICLASS format.
Example: "cleric 1/divine soul sorcerer 1" → Use MULTICLASS format with classes array
Never combine multiple classes into one level!`;
}
