import { useState, useEffect } from 'react';
import { Wand2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router';
import CharacterSheet from './character-sheet';

// Remove the server-side import and declare type
type PDFLibType = typeof import('pdf-lib');

// Field mapping configurations remain the same (kept for potential future PDF export feature)
const pdfFieldMap: Record<string, keyof CharacterData> = {
    CharacterName: "characterName",
    PlayerName: "playerName",
    "Race ": "race",
    ClassLevel: "class",
    Background: "background",
    Alignment: "alignment",
    XP: "experiencePoints",
    STR: "strength",
    DEX: "dexterity",
    CON: "constitution",
    INT: "intelligence",
    WIS: "wisdom",
    CHA: "charisma",
    AC: "armorClass",
    Initiative: "initiative",
    Speed: "speed",
    HPMax: "hitPointMaximum",
    HPCurrent: "currentHitPoints",
    HPTemp: "temporaryHitPoints",
    HDTotal: "hitDice",
    ProfBonus: "proficiencyBonus",
    "PersonalityTraits ": "personalityTraits",
    Ideals: "ideals",
    Bonds: "bonds",
    Flaws: "flaws",
    "Features and Traits": "featuresAndTraits",
    Equipment: "equipment",
    CP: "cp",
    SP: "sp",
    EP: "ep",
    GP: "gp",
    PP: "pp",
};

const savingThrowTextFields: Record<string, string> = {
    strength: "ST Strength",
    dexterity: "ST Dexterity",
    constitution: "ST Constitution",
    intelligence: "ST Intelligence",
    wisdom: "ST Wisdom",
    charisma: "ST Charisma",
};

const savingThrowBoxes: Record<string, string> = {
    strength: "Check Box 11",
    dexterity: "Check Box 12",
    constitution: "Check Box 14",
    intelligence: "Check Box 15",
    wisdom: "Check Box 16",
    charisma: "Check Box 17",
};

const skillTextFields: Record<string, string> = {
    athletics: "Athletics",
    acrobatics: "Acrobatics", 
    sleightOfHand: "SleightofHand",
    "stealth ": "Stealth",
    arcana: "Arcana",
    "history ": "History",
    "investigation ": "Investigation",
    nature: "Nature",
    religion: "Religion",
    animalHandling: "Animal",
    insight: "Insight", 
    medicine: "Medicine",
    "perception ": "Perception",
    survival: "Survival",
    "deception ": "Deception",
    intimidation: "Intimidation",
    performance: "Performance", 
    persuasion: "Persuasion"
};

const skillProficiencyBoxes: Record<keyof CharacterData["skills"], string> = {
    acrobatics: "Check Box 22",
    animalHandling: "Check Box 23",
    arcana: "Check Box 24",
    athletics: "Check Box 25",
    deception: "Check Box 26",
    history: "Check Box 27",
    insight: "Check Box 28",
    intimidation: "Check Box 29",
    investigation: "Check Box 30",
    medicine: "Check Box 31",
    nature: "Check Box 32",
    perception: "Check Box 33",
    performance: "Check Box 34",
    persuasion: "Check Box 35",
    religion: "Check Box 36",
    sleightOfHand: "Check Box 37",
    stealth: "Check Box 38",
    survival: "Check Box 39",
};

interface Feature {
  name: string;
  description: string;
  category?: string;
}

interface CharacterData {
    characterName: string;
    playerName: string;
    race: string;
    raceDescription: string;
    class: string;
    classDescription: string;
    level: string;
    subclass: string;
    subclassDescription: string;
    background: string;
    alignment: string;
    experiencePoints: string;
    strength: string;
    strengthMod: string;
    dexterity: string;
    dexterityMod: string;
    constitution: string;
    constitutionMod: string;
    intelligence: string;
    intelligenceMod: string;
    wisdom: string;
    wisdomMod: string;
    charisma: string;
    charismaMod: string;
    armorClass: string;
    initiative: string;
    speed: string;
    hitPointMaximum: string;
    currentHitPoints: string;
    temporaryHitPoints: string;
    hitDice: string;
    proficiencyBonus: string;
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    features: Feature[];
    featuresAndTraits: string;
    equipment: string;
    attacks: Array<{
        name: string;
        atkBonus: string;
        damage: string;
    }>;
    skills: { [key: string]: { proficient: boolean, value: string } };
    savingThrows: { [key: string]: { proficient: boolean, value: string } };
    cantrips: Array<{
        name: string;
        level: string;
        school: string;
        castingTime: string;
        range: string;
        duration: string;
        description: string;
    }>;
    spells: Array<{
        name: string;
        level: string;
        school: string;
        castingTime: string;
        range: string;
        duration: string;
        description: string;
    }>;
    spellcastingAbility: string;
    spellSaveDC: string;
    spellAttackBonus: string;
    cp: string;
    sp: string;
    ep: string;
    gp: string;
    pp: string;
}

export default function CharacterGenerator() {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [characterData, setCharacterData] = useState<CharacterData | null>(null);
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [showSheet, setShowSheet] = useState(false);

    // Show character sheet view when data is generated
    if (showSheet && characterData) {
        return <CharacterSheet character={characterData} onBack={() => setShowSheet(false)} />;
    }

    const generateCharacterData = async (userPrompt: string) => {
        if (!apiKey.trim()) {
            alert('Please enter your OpenRouter API key first');
            return;
        }

        setLoading(true);

        try {
            // Use your backend API route instead of calling OpenRouter directly
            const formData = new FormData();
            formData.append('prompt', `Generate a complete D&D 5e character based on this prompt: "${userPrompt}"

Please return ONLY a JSON object with these exact field names and appropriate values:
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
  "savingThrows": {
    "strength": { "proficient": false, "value": "+0" },
    "dexterity": { "proficient": false, "value": "+0" },
    "constitution": { "proficient": false, "value": "+0" },
    "intelligence": { "proficient": false, "value": "+0" },
    "wisdom": { "proficient": false, "value": "+0" },
    "charisma": { "proficient": false, "value": "+0" }
  },
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
      "saveDC": "string (optional)"
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
      "saveDC": "string (optional, e.g., 'DEX 20')"
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
Make personality traits, background, and story elements match the theme requested in the prompt.`);
            formData.append('apiKey', apiKey);

            const response = await fetch('/api/character', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Add logging here
            console.log('AI Response:', content);

            // Extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }

            const characterJson = JSON.parse(jsonMatch[0]);
            
            // Backward compatibility: convert old featuresAndTraits text to structured features
            if (!characterJson.features || characterJson.features.length === 0) {
                characterJson.features = [];
                if (characterJson.featuresAndTraits && characterJson.featuresAndTraits.trim()) {
                    // Try to split by common delimiters
                    const featureTexts = characterJson.featuresAndTraits
                        .split(/\n|;|\|(?=[A-Z])/)
                        .filter((f: string) => f.trim().length > 0);
                    
                    featureTexts.forEach((text: string) => {
                        const trimmed = text.trim();
                        if (trimmed) {
                            characterJson.features.push({
                                name: trimmed.substring(0, Math.min(50, trimmed.indexOf(':') > 0 ? trimmed.indexOf(':') : trimmed.length)),
                                description: trimmed,
                                category: 'custom'
                            });
                        }
                    });
                }
            }

            // Ensure default values for new fields
            if (!characterJson.raceDescription) characterJson.raceDescription = '';
            if (!characterJson.classDescription) characterJson.classDescription = '';
            if (!characterJson.subclassDescription) characterJson.subclassDescription = '';
            
            setCharacterData(characterJson);
            setShowSheet(true);

        } catch (error) {
            console.error('Error generating character:', error);
            alert(`Error generating character: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-950 to-gray-900 min-h-screen">
            <div className="bg-gray-900 rounded-lg shadow-lg border border-orange-500 p-8 mb-6">
                <h1 className="text-4xl font-bold text-orange-400 mb-2">
                    D&D Character Generator
                </h1>
                <p className="text-gray-300 mb-8">
                    Generate your next character with AI, then view and customize it in an interactive D&D Beyond-style sheet.
                </p>

                {/* API Key Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-orange-300 mb-2">
                        OpenRouter API Key:
                    </label>
                    <div className="relative">
                        <input
                            type={showApiKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-or-v1-..."
                            className="w-full p-3 border border-orange-500 rounded-md bg-gray-800 text-orange-300 placeholder-gray-500 focus:ring-2 focus:ring-orange-400"
                        />

                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-300 transition-colors"
                        >
                            {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Get your API key from{" "}
                        <a
                            href="https://openrouter.ai/app/keys"
                            className="text-orange-400 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            openrouter.ai
                        </a>
                    </p>
                </div>

                {/* Character Prompt */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-orange-300 mb-2">
                        Describe your character:
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Make me a level 3 ranger with a mysterious background...' "
                        className="w-full p-3 border border-orange-500 rounded-md bg-gray-800 text-orange-300 placeholder-gray-500 focus:ring-2 focus:ring-orange-400"
                        rows={4}
                    />

                    <button
                        onClick={() => generateCharacterData(prompt)}
                        disabled={loading || !prompt.trim()}
                        className="mt-4 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-semibold flex items-center gap-2 transition-colors"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                Generating Character...
                            </>
                        ) : (
                            <>
                                <Wand2 size={20} />
                                Generate Character
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}