interface LevelUpIndicatorProps {
    characterName: string;
    onCancel: () => void;
}

export default function LevelUpIndicator({ characterName, onCancel }: LevelUpIndicatorProps) {
    return (
        <div className="mb-4 p-3 bg-amber-900/40 border border-amber-600 rounded-md">
            <p className="text-amber-200 text-sm font-medium">
                Leveling up: {characterName}
            </p>
            <button
                type="button"
                onClick={onCancel}
                className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline"
            >
                Cancel level up
            </button>
        </div>
    );
}
