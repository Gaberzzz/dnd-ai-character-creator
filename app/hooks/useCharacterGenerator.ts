import { useState, useRef } from 'react';
import type { CharacterData } from '~/types/character';
import { getSpellAttackType, hasVariableDamage } from '~/utils/spellAttackConfig';
import { migrateCharacterData } from '~/utils/characterMigration';
import { buildCharacterGenerationPrompt } from '~/utils/characterPrompt';

export interface ClarificationState {
    question: string;
    options: string[];
    context?: string;
}

function processSpellAttackTypes(spells: any[]): any[] {
    return spells.map((spell: any) => {
        const spellConfig = getSpellAttackType(spell.name);
        return {
            ...spell,
            attackType: spellConfig.attackType,
            altDamage: hasVariableDamage(spell.name)
                ? (spellConfig.variableDamage ? `1d${spellConfig.variableDamage[1]?.diceSides}` : undefined)
                : undefined
        };
    });
}

function convertLegacyFeatures(characterJson: any): void {
    if (!characterJson.features || characterJson.features.length === 0) {
        characterJson.features = [];
        if (characterJson.featuresAndTraits && characterJson.featuresAndTraits.trim()) {
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
}

function parseApiResponse(content: string): any {
    const jsonMatch = content?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
    }
    try {
        return JSON.parse(jsonMatch[0]);
    } catch {
        throw new Error('Invalid JSON in response');
    }
}

export function useCharacterGenerator() {
    const [prompt, setPrompt] = useState('');
    const [characterData, setCharacterData] = useState<CharacterData | null>(null);
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [showSheet, setShowSheet] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const finalApiKey = apiKey || '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';

    const [levelUpBaseCharacter, setLevelUpBaseCharacter] = useState<CharacterData | null>(null);
    const [levelUpMessages, setLevelUpMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
    const [clarification, setClarification] = useState<ClarificationState | null>(null);
    const [clarificationText, setClarificationText] = useState('');

    const handleCancelLevelUp = () => {
        setLevelUpBaseCharacter(null);
        setLevelUpMessages([]);
        setClarification(null);
        setClarificationText('');
    };

    const startLevelUp = (character: CharacterData) => {
        setLevelUpBaseCharacter(character);
        const classLabel = character.classes?.[0]?.name || character.class || 'your class';
        setPrompt(`Level up 1 level of ${classLabel}`);
        setLevelUpMessages([]);
        setClarification(null);
        setShowSheet(false);
    };

    const generateCharacterData = async (userPrompt: string, clarificationAnswer?: string) => {
        if (!finalApiKey.trim()) {
            alert('Please enter your OpenRouter API key first');
            return;
        }

        setLoading(true);
        if (clarification) setClarification(null);

        try {
            const formData = new FormData();
            const isLevelUp = !!levelUpBaseCharacter;

            if (isLevelUp) {
                const existingCharStr = JSON.stringify(levelUpBaseCharacter);
                formData.append('prompt', userPrompt.trim());
                formData.append('existingCharacter', existingCharStr);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/50b3ff2c-f993-4284-93b3-0578016c45d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useCharacterGenerator:levelUpRequest',message:'sending level-up request',data:{promptLen:userPrompt.trim().length,existingCharStrLen:existingCharStr.length,hasClarificationAnswer:clarificationAnswer!==undefined},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
                // #endregion
                if (clarificationAnswer !== undefined) {
                    const nextMessages = [...levelUpMessages, { role: 'user' as const, content: `User chose: ${clarificationAnswer}` }];
                    formData.append('messages', JSON.stringify(nextMessages));
                    setLevelUpMessages(nextMessages);
                }
            } else {
                formData.append('prompt', buildCharacterGenerationPrompt(userPrompt));
            }

            formData.append('apiKey', finalApiKey);

            const response = await fetch('/api/character', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let details = '';
                try {
                    const errBody = await response.json();
                    details = errBody.details ?? errBody.error ?? JSON.stringify(errBody);
                } catch {
                    details = await response.text().catch(() => String(response.status));
                }
                throw new Error(`API request failed: ${response.status}. ${details}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            console.log('AI Response:', content?.substring?.(0, 300));

            const characterJson = parseApiResponse(content);

            // Level-up clarification: show question and options, then wait for user answer
            if (characterJson.type === 'clarification' && isLevelUp && levelUpBaseCharacter) {
                const firstUserMessage = `Existing character (apply level-up to this):\n${JSON.stringify(levelUpBaseCharacter)}\n\nUser request: ${userPrompt}`;
                setLevelUpMessages((prev) =>
                    prev.length === 0
                        ? [{ role: 'user', content: firstUserMessage }, { role: 'assistant', content: content }]
                        : [...prev, { role: 'assistant', content: content }]
                );
                setClarification({
                    question: characterJson.question || 'Choose an option:',
                    options: Array.isArray(characterJson.options) ? characterJson.options : [],
                    context: characterJson.context,
                });
                setLoading(false);
                return;
            }

            // Backward compatibility: convert old featuresAndTraits text to structured features
            convertLegacyFeatures(characterJson);

            // Ensure default values for new fields
            if (!characterJson.raceDescription) characterJson.raceDescription = '';
            if (!characterJson.classDescription) characterJson.classDescription = '';
            if (!characterJson.subclassDescription) characterJson.subclassDescription = '';

            // Process cantrips and spells to add attackType and altDamage fields
            if (characterJson.cantrips && Array.isArray(characterJson.cantrips)) {
                characterJson.cantrips = processSpellAttackTypes(characterJson.cantrips);
            }

            if (characterJson.spells && Array.isArray(characterJson.spells)) {
                characterJson.spells = processSpellAttackTypes(characterJson.spells);
            }

            setCharacterData(characterJson);
            setShowSheet(true);
            if (isLevelUp) handleCancelLevelUp();

        } catch (error) {
            console.error('Error generating character:', error);
            alert(`Error generating character: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target?.result as string);

                if (!jsonData.characterName) {
                    throw new Error('Invalid character data: missing characterName field');
                }

                const migratedData = migrateCharacterData(jsonData);
                setCharacterData(migratedData);
                setShowSheet(true);
                alert(`Successfully imported character: ${jsonData.characterName}`);
            } catch (error) {
                console.error('Error importing JSON:', error);
                alert(`Failed to import character data: ${error instanceof Error ? error.message : 'Invalid JSON file'}`);
            }
        };
        reader.readAsText(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return {
        prompt, setPrompt,
        characterData,
        loading,
        apiKey, setApiKey,
        showApiKey, setShowApiKey,
        showSheet, setShowSheet,
        fileInputRef,
        finalApiKey,
        levelUpBaseCharacter,
        clarification,
        clarificationText, setClarificationText,
        generateCharacterData,
        importFromJSON,
        handleCancelLevelUp,
        startLevelUp,
    };
}
