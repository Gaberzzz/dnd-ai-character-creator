import { useState } from 'react';
import { Download, FileText, Wand2, Upload, Eye, EyeOff } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';


// ✅ Use these corrected maps in your component's scope.

const pdfFieldMap: Record<string, keyof CharacterData> = {
    CharacterName: "characterName",
    PlayerName: "playerName",
    "Race ": "race",
    ClassLevel: "classAndLevel",
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
    HDTotal: "hitDice", // Corrected from HitDice to HDTotal
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
    "stealth ": "Stealth", // Note: this key has trailing space
    arcana: "Arcana",
    "history ": "History", // Note: this key has trailing space  
    "investigation ": "Investigation", // Note: this key has trailing space
    nature: "Nature",
    religion: "Religion",
    animalHandling: "Animal",
    insight: "Insight", 
    medicine: "Medicine",
    "perception ": "Perception", // Note: this key has trailing space
    survival: "Survival",
    "deception ": "Deception", // Note: this key has trailing space, but PDF field is "Deception"
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



interface CharacterData {
    characterName: string;
    playerName: string;
    race: string;
    classAndLevel: string;
    background: string;
    alignment: string;
    experiencePoints: string;
    strength: string;
    strengthMod: string; // <-- ADD THIS
    dexterity: string;
    dexterityMod: string; // <-- ADD THIS
    constitution: string;
    constitutionMod: string; // <-- ADD THIS
    intelligence: string;
    intelligenceMod: string; // <-- ADD THIS
    wisdom: string;
    wisdomMod: string; // <-- ADD THIS
    charisma: string;
    charismaMod: string; // <-- ADD THIS
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
    featuresAndTraits: string;
    equipment: string;
    attacks: Array<{
        name: string;
        atkBonus: string;
        damage: string; // <-- RENAME for clarity (damageType -> damage)
    }>;
    skills: { [key: string]: { proficient: boolean, value: string } }; // <-- UPDATE skills structure
    savingThrows: { [key: string]: { proficient: boolean, value: string } }; // <-- UPDATE saving throws
    cp: string;
    sp: string;
    ep: string;
    gp: string;
    pp: string;
}

export default function CharacterGenerator() {
    const [prompt, setPrompt] = useState('');
    const [characterData, setCharacterData] = useState<CharacterData | null>(null);
    const [loading, setLoading] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);

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
  "classAndLevel": "string (e.g., 'Fighter 3')",
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
  "featuresAndTraits": "string (class features, racial traits, etc.)",
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
  "cp": "0",
  "sp": "0",
  "ep": "0", 
  "gp": "string",
  "pp": "0"
}

Make the character mechanically sound according to D&D 5e rules and thematically appropriate to the prompt.`);
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
            setCharacterData(characterJson);

        } catch (error) {
            console.error('Error generating character:', error);
            alert(`Error generating character: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };


    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setPdfFile(file);
        } else {
            alert('Please upload a PDF file');
        }
    };
    const fillPDF = async () => {
        if (!characterData || !pdfFile) {
            alert("Please generate character data and upload a PDF first");
            return;
        }

        try {
            const pdfBytes = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();

            const setField = (fieldName: string, value: string | undefined) => {
                if (value === undefined || String(value).trim() === "") return;
                try {
                    form.getTextField(fieldName).setText(String(value));
                } catch {
                    console.warn(`Text field "${fieldName}" not found or failed to set.`);
                }
            };

            // Fill basic fields from the map
            for (const [pdfField, dataKey] of Object.entries(pdfFieldMap)) {
                const value = characterData[dataKey as keyof CharacterData] as string;
                setField(pdfField, value);
            }

            // Fill ability score modifiers
            setField("STRmod", characterData.strengthMod);
            setField("DEXmod ", characterData.dexterityMod);
            setField("CONmod", characterData.constitutionMod);
            setField("INTmod", characterData.intelligenceMod);
            setField("WISmod", characterData.wisdomMod);
            setField("CHamod", characterData.charismaMod);

            // Fill saving throws
            for (const [save, data] of Object.entries(characterData.savingThrows)) {
                const textFieldName = savingThrowTextFields[save];
                setField(textFieldName, data.value);
                if (data.proficient) {
                    const boxName = savingThrowBoxes[save];
                    try {
                        form.getCheckBox(boxName).check();
                    } catch {
                        console.warn(`Checkbox "${boxName}" not found.`);
                    }
                }
            }

            // Fill skills
            for (const [skill, data] of Object.entries(characterData.skills)) {
                console.log(`Processing skill: ${skill}`);  // Log the actual key from characterData
                const textFieldName = skillTextFields[skill as keyof typeof skillTextFields];
                console.log(`Mapped field name: ${textFieldName}`);  // Check if lookup succeeds
                setField(textFieldName, data.value);
                if (data.proficient) {
                    const boxName = skillProficiencyBoxes[skill as keyof typeof skillProficiencyBoxes];
                    try {
                        form.getCheckBox(boxName).check();
                    } catch {
                        console.warn(`Checkbox "${boxName}" not found.`);
                    }
                }
            }

            // Fill attacks with the exact field names
            const attackFields = [
                { name: 'Wpn Name', atk: 'Wpn1 AtkBonus', dmg: 'Wpn1 Damage' },
                { name: 'Wpn Name 2', atk: 'Wpn2 AtkBonus ', dmg: 'Wpn2 Damage ' },
                { name: 'Wpn Name 3', atk: 'Wpn3 AtkBonus  ', dmg: 'Wpn3 Damage ' }
            ];

            characterData.attacks.slice(0, 3).forEach((atk, i) => {
                const fields = attackFields[i];
                setField(fields.name, atk.name);
                setField(fields.atk, atk.atkBonus);
                setField(fields.dmg, atk.damage);
            });

            // Save and download the filled PDF
            const filledPdfBytes = await pdfDoc.save();
            const blob = new Blob([filledPdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${characterData.characterName.replace(/\s+/g, "_")}_Character_Sheet.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error filling PDF:", error);
            alert(`An error occurred while filling the PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="text-blue-600" />
                    D&D Character Sheet PDF Filler
                </h1>
                <p className="text-gray-600 mb-6">
                    Generate character data with AI, then automatically fill the official D&D character sheet PDF.
                </p>

                {/* API Key Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        OpenRouter API Key:
                    </label>
                    <div className="relative">
                        <input
                            type={showApiKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-or-v1-..."
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        />

                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Get your API key from{" "}
                        <a
                            href="https://openrouter.ai/app/keys"
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            openrouter.ai
                        </a>
                    </p>
                </div>

                {/* Character Prompt */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Describe your character:
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Make me a level 3 character similar to Jude Duarte...' "
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                        rows={3}
                    />

                    <button
                        onClick={() => generateCharacterData(prompt)}
                        disabled={loading || !prompt.trim()}
                        className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating with Claude...
                            </>
                        ) : (
                            <>
                                <Wand2 />
                                Generate Character Data
                            </>
                        )}
                    </button>
                </div>

                {/* PDF Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload D&D Character Sheet PDF:
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="pdf-upload"
                        />
                        <label
                            htmlFor="pdf-upload"
                            className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Click to upload the official D&D character sheet PDF
                        </label>
                        {pdfFile && (
                            <p className="mt-2 text-sm text-green-600">
                                ✓ Uploaded: {pdfFile.name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Fill PDF Button */}
                {characterData && pdfFile && (
                    <button
                        onClick={fillPDF}
                        className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2 text-lg font-medium"
                    >
                        <Download />
                        Fill PDF & Download
                    </button>
                )}
            </div>

            {/* Character Data Preview */}
            {characterData && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Generated Character Data</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-700">Name:</span> {characterData.characterName}
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Race:</span> {characterData.race}
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Class:</span> {characterData.classAndLevel}
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Background:</span> {characterData.background}
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Alignment:</span> {characterData.alignment}
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">STR:</span> {characterData.strength}
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">DEX:</span> {characterData.dexterity}
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">CON:</span> {characterData.constitution}
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">INT:</span> {characterData.intelligence}
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">WIS:</span> {characterData.wisdom}
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">CHA:</span> {characterData.charisma}
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">AC:</span> {characterData.armorClass}
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">HP:</span> {characterData.hitPointMaximum}
                        </div>
                    </div>

                    {characterData.personalityTraits && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-medium text-blue-900 mb-2">Personality</h3>
                            <p className="text-sm text-blue-800">{characterData.personalityTraits}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}