// app/routes/api.character.tsx
import type { ActionFunction } from "react-router";
import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  searchSpells,
  searchFeats,
  getClassFeatures,
  getSubclasses,
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
  {
    type: "function",
    function: {
      name: "get_subclasses",
      description: "Get official D&D 5e subclass names for a class. Use when building a clarification for subclass choice (e.g. at Rogue 3).",
      parameters: {
        type: "object",
        properties: {
          className: {
            type: "string",
            description: "The name of the class (e.g., 'Rogue', 'Fighter', 'Wizard')",
          },
        },
        required: ["className"],
      },
    },
  },
];

// Execute tool calls and return results
async function executeTool(
  toolName: string,
  toolInput: string | Record<string, any>,
  apiKey: string
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
        }, apiKey);
        return JSON.stringify(spells.length > 0 ? spells : { error: "No spells found" });

      case "search_feats":
        if (!args.query) return JSON.stringify({ error: "Missing required parameter: query" });
        const feats = await searchFeats(args.query, apiKey);
        return JSON.stringify(feats.length > 0 ? feats : { error: "No feats found" });

      case "get_class_features":
        if (!args.className) return JSON.stringify({ error: "Missing required parameter: className" });
        const features = await getClassFeatures(args.className);
        return JSON.stringify(features.length > 0 ? features : { error: "No features found" });

      case "search_equipment":
        if (!args.query) return JSON.stringify({ error: "Missing required parameter: query" });
        const equipment = await searchEquipment(args.query, apiKey);
        return JSON.stringify(equipment.length > 0 ? equipment : { error: "No equipment found" });

      case "get_subclasses":
        if (!args.className) return JSON.stringify({ error: "Missing required parameter: className" });
        const subclasses = await getSubclasses(args.className);
        return JSON.stringify(subclasses.length > 0 ? subclasses : { error: "No subclasses found" });

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

  // Calculate total level from either old single-class format or new multiclass format
  let totalLevel = 0;
  if (characterJson.classes && Array.isArray(characterJson.classes) && characterJson.classes.length > 0) {
    totalLevel = characterJson.classes.reduce((sum: number, cls: any) => sum + (cls.level || 0), 0);
  } else if (characterJson.level) {
    totalLevel = parseInt(characterJson.level);
  } else {
    errors.push("Character level not specified");
    return { isValid: false, errors };
  }

  if (isNaN(totalLevel) || totalLevel <= 0) {
    errors.push("Character level is not a valid number");
    return { isValid: false, errors };
  }

  const maxSpellLevel = Math.ceil(totalLevel / 2);

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
          errors.push(`${spellName} is level ${level}, but level ${totalLevel} characters can only cast up to level ${maxSpellLevel} spells`);
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
  const existingCharacterRaw = formData.get("existingCharacter");
  const messagesRaw = formData.get("messages");

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/50b3ff2c-f993-4284-93b3-0578016c45d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.character.tsx:formData',message:'level-up request params',data:{hasExistingChar:!!existingCharacterRaw,typeOfExistingChar:typeof existingCharacterRaw,existingCharLength:typeof existingCharacterRaw==='string'?existingCharacterRaw.length:0,hasMessages:!!messagesRaw},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  let existingCharacter: any = null;
  try {
    existingCharacter = existingCharacterRaw
      ? (typeof existingCharacterRaw === "string" ? JSON.parse(existingCharacterRaw) : existingCharacterRaw)
      : null;
  } catch (parseErr) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50b3ff2c-f993-4284-93b3-0578016c45d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.character.tsx:parseExistingChar',message:'existingCharacter JSON.parse threw',data:{error:String(parseErr)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    throw parseErr;
  }
  let conversationMessages: Array<{ role: string; content: string }> | null = null;
  if (messagesRaw && typeof messagesRaw === "string") {
    try {
      const parsed = JSON.parse(messagesRaw);
      if (Array.isArray(parsed) && parsed.length > 0) conversationMessages = parsed;
    } catch (_) {}
  }

  console.log("📝 Received Form Data:", {
    prompt,
    apiKey: apiKey ? "(provided)" : "(missing)",
    levelUp: !!existingCharacter,
    conversationTurns: conversationMessages?.length ?? 0,
  });

  try {
    const baseSystemPrompt = `You are an expert D&D 5e character generator. You create detailed, accurate characters that follow official D&D 5e rules.

⚠️ CRITICAL: READ THE USER REQUEST CAREFULLY FOR CLASS SPECIFICATIONS ⚠️

MULTICLASS DETECTION - HIGHEST PRIORITY:
Look for these patterns in the user's request:
- "/" character between class names (e.g., "Cleric/Sorcerer", "fighter/wizard", "rogue/bard")
- "and" between class names (e.g., "Cleric and Sorcerer")
- Multiple class mentions with levels (e.g., "Cleric 1 Sorcerer 1", "1 level Fighter 2 level Wizard")
- The word "multiclass" or "multiclassed"
- Class abbreviations split by "/" (e.g., "C1/S1", "F2/W1")

🔴 IF ANY OF THESE PATTERNS ARE DETECTED, YOU MUST USE MULTICLASS FORMAT 🔴
Do NOT use single-class format if the user asks for multiple classes.
Do NOT combine multiple classes into one class level.

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
1. Choose 1-3 BASE CLASSES from the list above
2. Use get_class_features with each CLASS name
3. Search for REAL spell names (from the examples or actual D&D 5e spells)
4. Search for REAL feat names (from the examples or actual D&D 5e feats)
5. ALWAYS respect spell level restrictions based on TOTAL character level

SPELL LEVEL REQUIREMENTS (total level):
- Level 1-2 characters: only cantrips and level 1 spells
- Level 3-4 characters: cantrips, level 1-2 spells
- Level 5-6 characters: cantrips, level 1-3 spells
- Level 9+ characters: cantrips, level 1-5 spells
- Level 17+ characters: all spell levels

═══════════════════════════════════════════════════════════════
SINGLE CLASS FORMAT (use ONLY if user requests ONE class):
═══════════════════════════════════════════════════════════════
{
  "characterName": "string",
  "class": "string",
  "subclass": "string",
  "level": "string",
  "race": "string",
  ... rest of fields ...
}

Example: User says "Create a Fighter level 5"
Response:
{
  "characterName": "Aragorn",
  "class": "Fighter",
  "subclass": "Champion",
  "level": "5",
  ... rest of fields ...
}

═══════════════════════════════════════════════════════════════
MULTICLASS FORMAT (MANDATORY if user mentions multiple classes):
═══════════════════════════════════════════════════════════════
{
  "characterName": "string",
  "classes": [
    {
      "name": "string",           // FIRST class name
      "subclass": "string",       // FIRST class subclass
      "level": number             // FIRST class level (NOT a string!)
    },
    {
      "name": "string",           // SECOND class name
      "subclass": "string",       // SECOND class subclass
      "level": number             // SECOND class level (NOT a string!)
    }
  ],
  "totalLevel": number,           // SUM of all class levels (e.g., 1+1=2)
  "race": "string",
  ... rest of fields ...
}

Example: User says "Create Cleric 1/Sorcerer 1"
Response:
{
  "characterName": "Seraphine",
  "classes": [
    {
      "name": "Cleric",
      "subclass": "Divine Soul",
      "level": 1
    },
    {
      "name": "Sorcerer",
      "subclass": "Divine Soul",
      "level": 1
    }
  ],
  "totalLevel": 2,
  "race": "Human",
  ... rest of fields ...
}

═══════════════════════════════════════════════════════════════
FINAL REMINDER:
- If you see "/" in the request → MULTICLASS FORMAT
- If you see "and" between class names → MULTICLASS FORMAT
- If you see level numbers split between classes → MULTICLASS FORMAT
- Otherwise → SINGLE CLASS FORMAT
═══════════════════════════════════════════════════════════════`;

    const levelUpSystemBlock = existingCharacter
      ? `

═══════════════════════════════════════════════════════════════
LEVEL-UP MODE (existing character provided):
═══════════════════════════════════════════════════════════════
You are applying a level-up to an existing character. The user's message describes what to add (e.g. "level up 1 level of rogue").
- Use the provided existing character and apply ONLY the requested change(s). Return the FULL updated character JSON with the same schema.
- If you need a PLAYER CHOICE before you can complete the update, do NOT return character JSON. Return ONLY a single JSON object:
  - For multiple choice (e.g. subclass): { "type": "clarification", "question": "string", "options": ["option1", "option2", ...], "context": "optional short description" }
  - For free text (e.g. feat or spell list): { "type": "clarification", "question": "string", "options": [], "context": "optional" }
- When the level-up grants a subclass (e.g. Rogue 3): use get_subclasses(className) to get official options, then return a clarification with question and options (and optional context) if the user has not already chosen.
- When the level-up grants an ASI or feat (e.g. level 4): if the user did not specify, return a clarification; use search_feats to suggest feat options or list common ASI choices.
- When the level-up grants new spells known/prepared: if the user did not specify, return a clarification; use search_spells with class and level to suggest options, or use empty options and ask for comma-separated spell names.
After the user answers a clarification, continue from the conversation and apply their choice, then return the full updated character JSON.
═══════════════════════════════════════════════════════════════`
      : "";

    const systemPrompt = baseSystemPrompt + levelUpSystemBlock;

    let messages: Array<any>;
    if (conversationMessages && conversationMessages.length > 0) {
      messages = conversationMessages.map((m) => ({ role: m.role, content: m.content }));
    } else if (existingCharacter) {
      messages = [
        {
          role: "user",
          content: `Existing character (apply level-up to this):\n${JSON.stringify(existingCharacter)}\n\nUser request: ${prompt}`,
        },
      ];
    } else {
      messages = [{ role: "user", content: prompt as string }];
    }

    // #region agent log
    const firstContentLen = messages[0]?.content?.length ?? 0;
    fetch('http://127.0.0.1:7242/ingest/50b3ff2c-f993-4284-93b3-0578016c45d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.character.tsx:beforeOpenRouter',message:'messages built',data:{messageCount:messages.length,firstMessageLength:firstContentLen},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion

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
        if (response.status === 401 || response.status === 403) {
          return Response.json(
            { error: "Invalid or expired API key", details: "Your OpenRouter API key was rejected. Please check your key at openrouter.ai/app/keys and try again." },
            { status: 401 }
          );
        }
        throw new Error(`OpenRouter API failed: ${response.status} - ${rawText.substring(0, 200)}`);
      }

      const data = JSON.parse(rawText);

      console.log("✅ Parsed Response JSON:", data);

      // #region agent log
      const hasChoices = !!data.choices?.length;
      const hasMessage = !!(data.choices?.[0]?.message);
      fetch('http://127.0.0.1:7242/ingest/50b3ff2c-f993-4284-93b3-0578016c45d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.character.tsx:openRouterResponse',message:'openRouter body parsed',data:{status:response.status,hasChoices,hasMessage,rawLength:rawText?.length},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
      // #endregion

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
          const toolResult = await executeTool(toolCall.function.name, toolCall.function.arguments, apiKey as string);
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

    console.log("📝 Assistant final response:", jsonContent.substring(0, 500));

    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
        console.log("📋 Extracted JSON from code block");
      } else {
        // No code block: take the first { ... } (outer object)
        const firstBrace = jsonContent.indexOf("{");
        if (firstBrace !== -1) {
          let depth = 0;
          let end = firstBrace;
          for (let i = firstBrace; i < jsonContent.length; i++) {
            const c = jsonContent[i];
            if (c === "{") depth++;
            else if (c === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
          }
          if (depth === 0) jsonContent = jsonContent.slice(firstBrace, end);
        }
      }

      jsonContent = jsonContent.trim();
      // Fix common invalid JSON from LLMs: trailing commas before } or ]
      jsonContent = jsonContent.replace(/,(\s*[}\]])/g, "$1");

      characterData = JSON.parse(jsonContent);

      // Level-up clarification: return as-is for frontend to display
      if (characterData && characterData.type === "clarification") {
        console.log("📋 Level-up clarification returned");
        return Response.json({
          choices: [{ message: { content: JSON.stringify(characterData) } }],
          toolCallCount,
        });
      }

      console.log("✅ Parsed character data successfully");
      console.log("📊 Character format:", characterData.classes ? "MULTICLASS" : "SINGLE-CLASS");
      console.log("📊 Classes:", characterData.classes || `${characterData.class} (Level ${characterData.level})`);

      // Validate character spells against level
      const validation = validateCharacterSpells(characterData);
      if (!validation.isValid) {
        console.warn("⚠️ Character validation warnings:", validation.errors);
        validation.errors.forEach(err => console.warn(`  - ${err}`));
      }
    } catch (parseError) {
      console.error("❌ Failed to parse character JSON:", parseError);
      console.error("📄 Raw content attempted to parse:", jsonContent.substring(0, 500));
      console.error("❌ Error details:", {
        error: String(parseError),
        contentLength: jsonContent.length,
        contentStart: jsonContent.substring(0, 100),
      });
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
    // #region agent log
    try {
      const cwd = process.cwd();
      const dir = join(cwd, ".cursor");
      mkdirSync(dir, { recursive: true });
      const logPath = join(dir, "debug.log");
      const payload = JSON.stringify({ location: "api.character.tsx:catch500", message: "API threw before 500", data: { error: String(error), name: (error as Error)?.name, stack: (error as Error)?.stack }, timestamp: Date.now(), hypothesisId: "H5" }) + "\n";
      appendFileSync(logPath, payload);
      console.error("DEBUG_LOG_WRITTEN", logPath, String(error));
    } catch (logErr) {
      console.error("DEBUG_LOG_FAILED", logErr);
    }
    fetch('http://127.0.0.1:7242/ingest/50b3ff2c-f993-4284-93b3-0578016c45d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.character.tsx:catch500',message:'API threw before 500',data:{error:String(error),name:(error as Error)?.name},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    return Response.json(
      { error: "Failed to generate character", details: String(error) },
      { status: 500 }
    );
  }
};
