// app/utils/dnd5e-api.ts
const DND5E_API_BASE = "https://www.dnd5eapi.co/api";

export interface Spell {
  index: string;
  name: string;
  level: number;
  school: { name: string };
  classes: { name: string }[];
  casting_time: string;
  range: string;
  components: string[];
  duration: string;
  concentration: boolean;
}

export interface Feat {
  index: string;
  name: string;
  prerequisites?: { ability_score?: { name: string; minimum_score: number }[] }[];
}

export interface ClassFeature {
  index: string;
  name: string;
  class: { name: string };
  level: number;
}

export interface Equipment {
  index: string;
  name: string;
  equipment_category?: { name: string };
}

/**
 * Search for spells by name or filter
 */
export async function searchSpells(
  query: string | undefined,
  options?: { level?: number; school?: string; className?: string }
): Promise<Spell[]> {
  if (!query) return [];
  
  try {
    // Get all spells from the API
    const response = await fetch(`${DND5E_API_BASE}/spells`);
    if (!response.ok) throw new Error(`Failed to fetch spells: ${response.status}`);

    const data = await response.json();
    let results = data.results || [];

    // Filter by name
    const lowerQuery = query.toLowerCase();
    results = results.filter((spell: any) =>
      spell.name.toLowerCase().includes(lowerQuery)
    );

    // Apply additional filters
    if (options?.level !== undefined) {
      results = results.filter((spell: any) => spell.level === options.level);
    }
    if (options?.school) {
      results = results.filter((spell: any) =>
        spell.school.name.toLowerCase().includes(options.school!.toLowerCase())
      );
    }

    // Fetch detailed spell data
    const detailedSpells = await Promise.all(
      results.slice(0, 5).map((spell: any) => getSpellDetails(spell.index))
    );

    return detailedSpells.filter(Boolean) as Spell[];
  } catch (error) {
    console.error("❌ Error searching spells:", error);
    return [];
  }
}

/**
 * Get spell details by index
 */
export async function getSpellDetails(spellIndex: string): Promise<Spell | null> {
  try {
    const response = await fetch(`${DND5E_API_BASE}/spells/${spellIndex}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error(`❌ Error fetching spell ${spellIndex}:`, error);
    return null;
  }
}

/**
 * Search for feats by name
 */
export async function searchFeats(query: string | undefined): Promise<Feat[]> {
  if (!query) return [];
  
  try {
    const response = await fetch(`${DND5E_API_BASE}/feats`);
    if (!response.ok) throw new Error(`Failed to fetch feats: ${response.status}`);

    const data = await response.json();
    let results = data.results || [];

    const lowerQuery = query.toLowerCase();
    results = results.filter((feat: any) =>
      feat.name.toLowerCase().includes(lowerQuery)
    );

    // Fetch detailed feat data
    const detailedFeats = await Promise.all(
      results.slice(0, 5).map((feat: any) => getFeatDetails(feat.index))
    );

    return detailedFeats.filter(Boolean) as Feat[];
  } catch (error) {
    console.error("❌ Error searching feats:", error);
    return [];
  }
}

/**
 * Get feat details by index
 */
export async function getFeatDetails(featIndex: string): Promise<Feat | null> {
  try {
    const response = await fetch(`${DND5E_API_BASE}/feats/${featIndex}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error(`❌ Error fetching feat ${featIndex}:`, error);
    return null;
  }
}

/**
 * Get class features for a specific class or subclass
 */
export async function getClassFeatures(className: string | undefined): Promise<ClassFeature[]> {
  if (!className) return [];
  
  try {
    const lowerClassName = className.toLowerCase();
    
    // First get the class index
    const classResponse = await fetch(`${DND5E_API_BASE}/classes`);
    if (!classResponse.ok) throw new Error(`Failed to fetch classes: ${classResponse.status}`);

    const classData = await classResponse.json();
    let classResult = classData.results.find(
      (c: any) => c.name.toLowerCase() === lowerClassName
    );

    // If not found as a class, it might be a subclass - try to find parent class
    if (!classResult) {
      // Common subclass mappings
      const subclassMap: Record<string, string> = {
        "eldritch knight": "fighter",
        "arcane trickster": "rogue",
        "draconic bloodline": "sorcerer",
        "evocation": "wizard",
        "abjuration": "wizard",
        "cleric": "cleric",
        "paladin": "paladin",
        "ranger": "ranger",
        "monk": "monk",
        "barbarian": "barbarian",
        "bard": "bard",
        "druid": "druid",
        "warlock": "warlock",
      };

      const parentClass = subclassMap[lowerClassName];
      if (parentClass) {
        classResult = classData.results.find(
          (c: any) => c.name.toLowerCase() === parentClass.toLowerCase()
        );
      }
    }

    if (!classResult) return [];

    // Get features for this class
    const featuresResponse = await fetch(
      `${DND5E_API_BASE}/classes/${classResult.index}/features`
    );
    if (!featuresResponse.ok) return [];

    const features = await featuresResponse.json();
    return features.results || [];
  } catch (error) {
    console.error(`❌ Error fetching class features for ${className}:`, error);
    return [];
  }
}

/**
 * Search for equipment/items by name
 */
export async function searchEquipment(query: string | undefined): Promise<Equipment[]> {
  if (!query) return [];
  
  try {
    const response = await fetch(`${DND5E_API_BASE}/equipment`);
    if (!response.ok) throw new Error(`Failed to fetch equipment: ${response.status}`);

    const data = await response.json();
    let results = data.results || [];

    const lowerQuery = query.toLowerCase();
    results = results.filter((item: any) =>
      item.name.toLowerCase().includes(lowerQuery)
    );

    // Fetch detailed equipment data
    const detailedEquipment = await Promise.all(
      results.slice(0, 5).map((item: any) => getEquipmentDetails(item.index))
    );

    return detailedEquipment.filter(Boolean) as Equipment[];
  } catch (error) {
    console.error("❌ Error searching equipment:", error);
    return [];
  }
}

/**
 * Get equipment details by index
 */
export async function getEquipmentDetails(equipmentIndex: string): Promise<Equipment | null> {
  try {
    const response = await fetch(`${DND5E_API_BASE}/equipment/${equipmentIndex}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error(`❌ Error fetching equipment ${equipmentIndex}:`, error);
    return null;
  }
}

/**
 * Validate a spell exists in D&D 5e
 */
export async function validateSpell(spellName: string): Promise<boolean> {
  const results = await searchSpells(spellName);
  return results.length > 0;
}

/**
 * Validate a feat exists in D&D 5e
 */
export async function validateFeat(featName: string): Promise<boolean> {
  const results = await searchFeats(featName);
  return results.length > 0;
}
