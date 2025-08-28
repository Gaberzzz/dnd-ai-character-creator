import { useState } from 'react';
import { Download, FileText, Wand2, Upload, Eye, EyeOff } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface CharacterData {
    characterName: string;
    playerName: string;
    race: string;
    classAndLevel: string;
    background: string;
    alignment: string;
    experiencePoints: string;
    strength: string;
    dexterity: string;
    constitution: string;
    intelligence: string;
    wisdom: string;
    charisma: string;
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
        damageType: string;
    }>;
    skills: { [key: string]: boolean };
    savingThrows: { [key: string]: boolean };
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
  "dexterity": "string (ability score 8-20)", 
  "constitution": "string (ability score 8-20)",
  "intelligence": "string (ability score 8-20)",
  "wisdom": "string (ability score 8-20)",
  "charisma": "string (ability score 8-20)",
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
      "damageType": "string"
    }
  ],
  "skills": {
    "athletics": false,
    "acrobatics": false,
    "sleightOfHand": false,
    "stealth": false,
    "arcana": false,
    "history": false,
    "investigation": false,
    "nature": false,
    "religion": false,
    "animalHandling": false,
    "insight": false,
    "medicine": false,
    "perception": false,
    "survival": false,
    "deception": false,
    "intimidation": false,
    "performance": false,
    "persuasion": false
  },
  "savingThrows": {
    "strength": false,
    "dexterity": false,
    "constitution": false,
    "intelligence": false,
    "wisdom": false,
    "charisma": false
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
            alert('Please generate character data and upload a PDF first');
            return;
        }

        try {
            const pdfBytes = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();

            // Helper function to safely set form field
            const setField = (fieldName: string, value: string) => {
                try {
                    const field = form.getTextField(fieldName);
                    field.setText(value);
                } catch (error) {
                    console.warn(`Field ${fieldName} not found or couldn't be set`);
                }
            };

            // Fill basic info
            setField('CharacterName', characterData.characterName);
            setField('PlayerName', characterData.playerName);
            setField('Race', characterData.race);
            setField('ClassLevel', characterData.classAndLevel);
            setField('Background', characterData.background);
            setField('Alignment', characterData.alignment);
            setField('ExperiencePoints', characterData.experiencePoints);

            // Fill ability scores
            setField('STR', characterData.strength);
            setField('DEX', characterData.dexterity);
            setField('CON', characterData.constitution);
            setField('INT', characterData.intelligence);
            setField('WIS', characterData.wisdom);
            setField('CHA', characterData.charisma);

            // Fill combat stats
            setField('AC', characterData.armorClass);
            setField('Initiative', characterData.initiative);
            setField('Speed', characterData.speed);
            setField('HPMax', characterData.hitPointMaximum);
            setField('HPCurrent', characterData.currentHitPoints);
            setField('HPTemp', characterData.temporaryHitPoints);
            setField('HitDice', characterData.hitDice);
            setField('ProfBonus', characterData.proficiencyBonus);

            // Fill character traits
            setField('PersonalityTraits', characterData.personalityTraits);
            setField('Ideals', characterData.ideals);
            setField('Bonds', characterData.bonds);
            setField('Flaws', characterData.flaws);
            setField('Features', characterData.featuresAndTraits);
            setField('Equipment', characterData.equipment);

            // Fill currency
            setField('CP', characterData.cp);
            setField('SP', characterData.sp);
            setField('EP', characterData.ep);
            setField('GP', characterData.gp);
            setField('PP', characterData.pp);

            // Save and download
            const filledPdfBytes = await pdfDoc.save();
            const blob = new Blob([filledPdfBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${characterData.characterName.replace(/\s+/g, '_')}_Character_Sheet.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error filling PDF:', error);
            alert(`Error filling PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
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