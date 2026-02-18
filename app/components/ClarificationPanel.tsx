import type { ClarificationState } from '~/hooks/useCharacterGenerator';

interface ClarificationPanelProps {
    clarification: ClarificationState;
    clarificationText: string;
    loading: boolean;
    onOptionSelect: (option: string) => void;
    onTextChange: (value: string) => void;
    onSubmit: () => void;
}

export default function ClarificationPanel({
    clarification,
    clarificationText,
    loading,
    onOptionSelect,
    onTextChange,
    onSubmit,
}: ClarificationPanelProps) {
    return (
        <div className="mb-6 p-4 bg-gray-800 border border-orange-500 rounded-md">
            <p className="text-orange-300 font-medium mb-2">{clarification.question}</p>
            {clarification.context && (
                <p className="text-gray-400 text-sm mb-3 whitespace-pre-wrap">{clarification.context}</p>
            )}
            {clarification.options.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {clarification.options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => onOptionSelect(opt)}
                            disabled={loading}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-md text-sm font-medium"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={clarificationText}
                        onChange={(e) => onTextChange(e.target.value)}
                        placeholder="Your answer (e.g. feat name or +2 DEX)"
                        className="flex-1 p-2 border border-orange-500 rounded-md bg-gray-800 text-orange-300 placeholder-gray-500"
                    />
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={loading || !clarificationText.trim()}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-md font-medium"
                    >
                        Submit
                    </button>
                </div>
            )}
        </div>
    );
}
