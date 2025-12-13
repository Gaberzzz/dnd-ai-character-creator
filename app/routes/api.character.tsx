// app/routes/api.character.tsx
import type { ActionFunction } from "react-router";
import {
  searchSpells,
  searchFeats,
  getClassFeatures,
  searchEquipment,
  validateSpell,
  validateFeat,
} from "../utils/dnd5e-api";

// Define the tools available to the AI model
const tools = [
  {
    type: "function",
    function: {
      name: "search_spells",
      description: "Search for D&D 5e spells by name, level, or school. Use this to find accurate spell information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The spell name or partial name to search for",
          },
          level: {
            type: "number",
            description: "Optional: Filter by spell level (0-9)",
          },
          school: {
            type: "string",
            description: "Optional: Filter by school of magic (e.g., 'evocation', 'abjuration')",
          },
          className: {
            type: "string",
            description: "Optional: Filter by class that can cast the spell",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_feats",
      description: "Search for D&D 5e feats by name. Use this to validate feat choices and get feat details.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The feat name or partial name to search for",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_class_features",
      description: "Get all features and abilities for a D&D 5e class.",
      parameters: {
        type: "object",
        properties: {
          className: {
            type: "string",
            description: "The name of the class (e.g., 'Wizard', 'Fighter', 'Cleric')",
          },
        },
        required: ["className"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_equipment",
      description: "Search for D&D 5e equipment and items by name.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The equipment or item name to search for",
          },
        },
        required: ["query"],
      },
    },
  },
];

// Execute tool calls and return results
async function executeTool(
  toolName: string,
  toolInput: string | Record<string, any>
): Promise<string> {
  try {
    // Parse arguments if it's a string (from OpenRouter)
    const args = typeof toolInput === 'string' ? JSON.parse(toolInput) : toolInput;
    
    console.log(`🔧 Executing ${toolName} with args:`, args);

    switch (toolName) {
      case "search_spells":
        if (!args.query) return JSON.stringify({ error: "Missing required parameter: query" });
        const spells = await searchSpells(args.query, {
          level: args.level,
          school: args.school,
          className: args.className,
        });
        return JSON.stringify(spells.length > 0 ? spells : { error: "No spells found" });

      case "search_feats":
        if (!args.query) return JSON.stringify({ error: "Missing required parameter: query" });
        const feats = await searchFeats(args.query);
        return JSON.stringify(feats.length > 0 ? feats : { error: "No feats found" });

      case "get_class_features":
        if (!args.className) return JSON.stringify({ error: "Missing required parameter: className" });
        const features = await getClassFeatures(args.className);
        return JSON.stringify(features.length > 0 ? features : { error: "No features found" });

      case "search_equipment":
        if (!args.query) return JSON.stringify({ error: "Missing required parameter: query" });
        const equipment = await searchEquipment(args.query);
        return JSON.stringify(equipment.length > 0 ? equipment : { error: "No equipment found" });

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error) {
    console.error(`❌ Error executing tool ${toolName}:`, error);
    return JSON.stringify({ error: `Tool execution failed: ${String(error)}` });
  }
}

// Validate character data against D&D 5e rules
function validateCharacterSpells(characterJson: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!characterJson.level) {
    errors.push("Character level not specified");
    return { isValid: false, errors };
  }

  const levelNum = parseInt(characterJson.level);
  if (isNaN(levelNum)) {
    errors.push("Character level is not a valid number");
    return { isValid: false, errors };
  }

  const maxSpellLevel = Math.ceil(levelNum / 2);

  // Validate spells
  if (characterJson.spells && Array.isArray(characterJson.spells)) {
    characterJson.spells.forEach((spell: any) => {
      // Handle both string (legacy) and object spell formats
      const spellName = typeof spell === 'string' ? spell : spell.name;
      
      if (!spellName) return; // Skip if no name found

      const highLevelSpells: Record<string, number> = {
        "counterspell": 3,
        "fireball": 3,
        "lightning bolt": 3,
        "cone of cold": 5,
        "meteor swarm": 9,
        "wish": 9,
        "time stop": 9,
      };

      const spellNameLower = spellName.toLowerCase();
      for (const [name, level] of Object.entries(highLevelSpells)) {
        if (spellNameLower.includes(name) && level > maxSpellLevel) {
          errors.push(`${spellName} is level ${level}, but level ${levelNum} characters can only cast up to level ${maxSpellLevel} spells`);
        }
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}

export const action: ActionFunction = async ({ request }) => {
  console.log("➡️ Action triggered: /api/character");

  const formData = await request.formData();
  const prompt = formData.get("prompt");
  const apiKey = formData.get("apiKey");

  console.log("📝 Received Form Data:", {
    prompt,
    apiKey: apiKey ? "(provided)" : "(missing)"
  });

  try {
    const systemPrompt = `You are an expert D&D 5e character generator. You create detailed, accurate characters that follow official D&D 5e rules.

CRITICAL RULES FOR TOOL USAGE:
1. Only search for REAL D&D 5e spells, feats, and classes
2. Never make up generic terms like "buff", "attack", "magic"
3. Always use proper spell names from the official D&D 5e Player's Handbook

VALID CLASSES (base classes only):
Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard

EXAMPLE SPELLS for each level:
- Level 0 (Cantrips): Fire Bolt, Mage Hand, Prestidigitation, Light
- Level 1: Magic Missile, Shield, Cure Wounds, Detect Magic
- Level 2: Scorching Ray, Mirror Image, Hold Person, Invisibility
- Level 3: Fireball, Counterspell, Lightning Bolt, Summon Lesser Demon
- Level 4: Polymorph, Greater Invisibility, Dimension Door
- Level 5: Cone of Cold, Telekinesis, Mass Cure Wounds

EXAMPLE FEATS (not spells):
Great Weapon Master, Polearm Master, Sharpshooter, Lucky, Alert, Resilient, Magic Initiate, War Caster

When generating a character:
1. Choose a valid BASE CLASS from the list above
2. Use get_class_features with the BASE CLASS name
3. Search for REAL spell names (from the examples or actual D&D 5e spells)
4. Search for REAL feat names (from the examples or actual D&D 5e feats)
5. ALWAYS respect spell level restrictions based on character level

SPELL LEVEL REQUIREMENTS:
- Level 1 characters: only cantrips and level 1 spells
- Level 3 characters: cantrips, level 1-2 spells
- Level 5 characters: cantrips, level 1-3 spells
- Level 9 characters: cantrips, level 1-5 spells
- Level 17+ characters: all spell levels

Return character data in JSON format:
{
  "character_name": string,
  "class": string,
  "race": string,
  "level": number,
  "abilities": {
    "strength": number,
    "dexterity": number,
    "constitution": number,
    "intelligence": number,
    "wisdom": number,
    "charisma": number
  },
  "skills": string[],
  "feats": string[],
  "spells": string[],
  "equipment": string[],
  "background": string
}`;

    let messages: Array<any> = [
      { role: "user", content: prompt as string }
    ];

    let assistantMessage: any = null;
    let toolCallCount = 0;
    const maxToolCalls = 10; // Prevent infinite loops

    // Agentic loop: keep calling model until no more tool calls
    while (toolCallCount < maxToolCalls) {
      const requestBody = {
        model: "openai/gpt-4o-mini",
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        tools,
      };

      console.log("📤 Sending Request to OpenRouter with tools...");

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey as string}`,
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "D&D Character Generator",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 OpenRouter Response Status:", response.status);

      const rawText = await response.text();
      console.log("📥 Raw response (first 500 chars):", rawText.substring(0, 500));

      if (!response.ok) {
        console.error("❌ OpenRouter API Error Response:", rawText);
        throw new Error(`OpenRouter API failed: ${response.status} - ${rawText.substring(0, 200)}`);
      }

      const data = JSON.parse(rawText);

      console.log("✅ Parsed Response JSON:", data);

      assistantMessage = data.choices[0].message;
      
      // Check if model wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        toolCallCount++;
        console.log(`🔧 Processing ${assistantMessage.tool_calls.length} tool call(s)...`);

        // Add assistant's message to conversation
        messages.push({
          role: "assistant",
          content: assistantMessage.content || "",
          tool_calls: assistantMessage.tool_calls,
        });

        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const toolResult = await executeTool(toolCall.function.name, toolCall.function.arguments);
          console.log(`📍 Tool "${toolCall.function.name}" result:`, toolResult);

          // Add tool result to conversation with correct OpenAI format
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult,
          });
        }
      } else {
        // No more tool calls, we're done
        console.log("✅ Character generation complete, no more tool calls");
        break;
      }
    }

    // Extract JSON from assistant's response
    let characterData: any = null;
    let jsonContent = assistantMessage.content || "";
    
    console.log("📝 Assistant final response:", jsonContent.substring(0, 200));

    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
      
      characterData = JSON.parse(jsonContent);
      console.log("✅ Parsed character data successfully");
      
      // Validate character spells against level
      const validation = validateCharacterSpells(characterData);
      if (!validation.isValid) {
        console.warn("⚠️ Character validation warnings:", validation.errors);
        validation.errors.forEach(err => console.warn(`  - ${err}`));
      }
    } catch (parseError) {
      console.error("❌ Failed to parse character JSON:", parseError);
      console.error("📄 Content attempted to parse:", jsonContent);
      throw new Error(`Failed to parse character data: ${String(parseError)}`);
    }

    // Return in the format expected by the frontend
    return Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify(characterData)
          }
        }
      ],
      toolCallCount,
    });

  } catch (error) {
    console.error("❌ API Error:", error);

    return Response.json(
      { error: "Failed to generate character", details: String(error) },
      { status: 500 }
    );
  }
};
