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
 * Perform a web search via OpenRouter for D&D 5e data
 */
async function webSearchDnD5e(query: string, apiKey: string): Promise<string | null> {
  try {
    console.log(`🌐 Attempting OpenRouter web search for: "${query}"`);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "D&D Character Generator",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Search for official D&D 5e information about "${query}". Provide a brief summary if found.`,
          },
        ],
        web_search: {
          enabled: true,
        },
      }),
    });

    if (!response.ok) {
      console.error("❌ Web search failed:", response.status);
      return null;
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || null;
    if (result) {
      console.log(`✅ Web search found info about "${query}"`);
    }
    return result;
  } catch (error) {
    console.error("❌ Web search error:", error);
    return null;
  }
}

/**
 * Search for spells by name or filter
 */
export async function searchSpells(
  query: string | undefined,
  options?: { level?: number; school?: string; className?: string },
  apiKey?: string
): Promise<Spell[]> {
  if (!query) return [];
  
  try {
    // Try 5e API first
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

    // If found in 5e API, return those results
    if (results.length > 0) {
      const detailedSpells = await Promise.all(
        results.slice(0, 5).map((spell: any) => getSpellDetails(spell.index))
      );
      return detailedSpells.filter(Boolean) as Spell[];
    }

    // Fallback: Try OpenRouter web search if 5e API returns nothing
    if (apiKey) {
      console.log(`📚 5e API found no spells for "${query}", trying web search...`);
      const webResult = await webSearchDnD5e(query, apiKey);
      if (webResult) {
        return [{
          index: query.toLowerCase().replace(/\s+/g, "-"),
          name: query,
          level: options?.level ?? 1,
          school: { name: "Unknown" },
          classes: [],
          casting_time: "1 action",
          range: "Unknown",
          components: [],
          duration: "Unknown",
          concentration: false,
        } as Spell];
      }
    }

    return [];
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
export async function searchFeats(query: string | undefined, apiKey?: string): Promise<Feat[]> {
  if (!query) return [];
  
  try {
    // Try 5e API first
    const response = await fetch(`${DND5E_API_BASE}/feats`);
    if (!response.ok) throw new Error(`Failed to fetch feats: ${response.status}`);

    const data = await response.json();
    let results = data.results || [];

    const lowerQuery = query.toLowerCase();
    results = results.filter((feat: any) =>
      feat.name.toLowerCase().includes(lowerQuery)
    );

    // If found in 5e API, return those results
    if (results.length > 0) {
      const detailedFeats = await Promise.all(
        results.slice(0, 5).map((feat: any) => getFeatDetails(feat.index))
      );
      return detailedFeats.filter(Boolean) as Feat[];
    }

    // Fallback: Try OpenRouter web search if 5e API returns nothing
    if (apiKey) {
      console.log(`📚 5e API found no feats for "${query}", trying web search...`);
      const webResult = await webSearchDnD5e(query, apiKey);
      if (webResult) {
        return [{
          index: query.toLowerCase().replace(/\s+/g, "-"),
          name: query,
          prerequisites: [],
        } as Feat];
      }
    }

    return [];
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

export interface SubclassInfo {
  index: string;
  name: string;
}

/**
 * Get subclasses for a D&D 5e class by class name.
 */
export async function getSubclasses(className: string): Promise<SubclassInfo[]> {
  if (!className) return [];

  try {
    const classResponse = await fetch(`${DND5E_API_BASE}/classes`);
    if (!classResponse.ok) return [];

    const classData = await classResponse.json();
    const lowerClassName = className.toLowerCase().trim();
    const classResult = classData.results?.find(
      (c: { name: string; index: string }) => c.name.toLowerCase() === lowerClassName
    );
    if (!classResult) return [];

    const detailResponse = await fetch(`${DND5E_API_BASE}/classes/${classResult.index}`);
    if (!detailResponse.ok) return [];

    const detail = await detailResponse.json();
    const subclasses = detail.subclasses || [];
    return subclasses.map((s: { index: string; name: string }) => ({ index: s.index, name: s.name }));
  } catch (error) {
    console.error(`❌ Error fetching subclasses for ${className}:`, error);
    return [];
  }
}

/**
 * Search for equipment/items by name
 */
export async function searchEquipment(query: string | undefined, apiKey?: string): Promise<Equipment[]> {
  if (!query) return [];
  
  try {
    // Try 5e API first
    const response = await fetch(`${DND5E_API_BASE}/equipment`);
    if (!response.ok) throw new Error(`Failed to fetch equipment: ${response.status}`);

    const data = await response.json();
    let results = data.results || [];

    const lowerQuery = query.toLowerCase();
    results = results.filter((item: any) =>
      item.name.toLowerCase().includes(lowerQuery)
    );

    // If found in 5e API, return those results
    if (results.length > 0) {
      const detailedEquipment = await Promise.all(
        results.slice(0, 5).map((item: any) => getEquipmentDetails(item.index))
      );
      return detailedEquipment.filter(Boolean) as Equipment[];
    }

    // Fallback: Try OpenRouter web search if 5e API returns nothing
    if (apiKey) {
      console.log(`📚 5e API found no equipment for "${query}", trying web search...`);
      const webResult = await webSearchDnD5e(query, apiKey);
      if (webResult) {
        return [{
          index: query.toLowerCase().replace(/\s+/g, "-"),
          name: query,
        } as Equipment];
      }
    }

    return [];
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
