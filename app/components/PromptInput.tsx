import { useRef } from 'react';
import { Wand2, Upload } from 'lucide-react';

interface PromptInputProps {
    prompt: string;
    isLevelUp: boolean;
    loading: boolean;
    hasClarification: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onPromptChange: (value: string) => void;
    onGenerate: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PromptInput({
    prompt,
    isLevelUp,
    loading,
    hasClarification,
    fileInputRef,
    onPromptChange,
    onGenerate,
    onImport,
}: PromptInputProps) {
    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-orange-300 mb-2">
                {isLevelUp ? 'Level-up request:' : 'Describe your character:'}
            </label>
            <textarea
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder={isLevelUp ? "e.g., 'Level up 1 level of Rogue'" : "e.g., 'Make me a level 3 ranger with a mysterious background...' "}
                className="w-full p-3 border border-orange-500 rounded-md bg-gray-800 text-orange-300 placeholder-gray-500 focus:ring-2 focus:ring-orange-400"
                rows={4}
            />

            <div className="mt-4 flex gap-3">
                <button
                    onClick={onGenerate}
                    disabled={loading || hasClarification || !prompt.trim()}
                    className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-semibold flex items-center justify-center gap-2 transition-colors"
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

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                    <Upload size={20} />
                    Import from JSON
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={onImport}
                    className="hidden"
                />
            </div>
        </div>
    );
}
