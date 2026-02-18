import CharacterSheet from './character-sheet';
import { useCharacterGenerator } from '~/hooks/useCharacterGenerator';
import ApiKeyInput from '~/components/ApiKeyInput';
import LevelUpIndicator from '~/components/LevelUpIndicator';
import ClarificationPanel from '~/components/ClarificationPanel';
import PromptInput from '~/components/PromptInput';

export default function CharacterGenerator() {
    const {
        prompt, setPrompt,
        characterData,
        loading,
        showApiKey, setShowApiKey,
        showSheet, setShowSheet,
        fileInputRef,
        finalApiKey, setApiKey,
        levelUpBaseCharacter,
        clarification,
        clarificationText, setClarificationText,
        generateCharacterData,
        importFromJSON,
        handleCancelLevelUp,
        startLevelUp,
    } = useCharacterGenerator();

    // Show character sheet view when data is generated
    if (showSheet && characterData) {
        return (
            <CharacterSheet
                character={characterData}
                onBack={() => setShowSheet(false)}
                onLevelUp={() => startLevelUp(characterData)}
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-950 to-gray-900 min-h-screen">
            <div className="bg-gray-900 rounded-lg shadow-lg border border-orange-500 p-8 mb-6">
                <h1 className="text-4xl font-bold text-orange-400 mb-2">
                    D&D Character Generator
                </h1>
                <p className="text-gray-300 mb-8">
                    Generate your next character with AI, then view and customize it in an interactive D&D Beyond-style sheet.
                </p>

                <ApiKeyInput
                    apiKey={finalApiKey}
                    showApiKey={showApiKey}
                    onApiKeyChange={setApiKey}
                    onToggleVisibility={() => setShowApiKey(!showApiKey)}
                />

                {levelUpBaseCharacter && (
                    <LevelUpIndicator
                        characterName={levelUpBaseCharacter.characterName}
                        onCancel={handleCancelLevelUp}
                    />
                )}

                {clarification && (
                    <ClarificationPanel
                        clarification={clarification}
                        clarificationText={clarificationText}
                        loading={loading}
                        onOptionSelect={(opt) => generateCharacterData(prompt, opt)}
                        onTextChange={setClarificationText}
                        onSubmit={() => {
                            const answer = clarificationText.trim();
                            if (answer) {
                                generateCharacterData(prompt, answer);
                                setClarificationText('');
                            }
                        }}
                    />
                )}

                <PromptInput
                    prompt={prompt}
                    isLevelUp={!!levelUpBaseCharacter}
                    loading={loading}
                    hasClarification={!!clarification}
                    fileInputRef={fileInputRef}
                    onPromptChange={setPrompt}
                    onGenerate={() => generateCharacterData(prompt)}
                    onImport={importFromJSON}
                />
            </div>
        </div>
    );
}
