import { Dice5 } from 'lucide-react';

interface AbilityScoreBoxProps {
  name: string;
  abbreviation: string;
  score: string;
  modifier: string;
  onScoreChange?: (value: string) => void;
  onModChange?: (value: string) => void;
  onRoll?: (abilityName: string, modifier: string) => void;
  editable?: boolean;
}

export default function AbilityScoreBox({
  name,
  abbreviation,
  score,
  modifier,
  onScoreChange,
  onModChange,
  onRoll,
  editable = false,
}: AbilityScoreBoxProps) {
  return (
    <div className="bg-gray-900 border-2 border-orange-500 rounded-lg p-3 text-center min-w-[120px]">
      <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">
        {name}
      </div>
      <div className="mb-2">
        {editable && onScoreChange ? (
          <input
            type="text"
            value={score}
            onChange={(e) => onScoreChange(e.target.value)}
            className="w-full bg-gray-800 text-orange-400 font-bold text-2xl text-center border border-orange-500 rounded px-1"
          />
        ) : (
          <div className="text-orange-400 font-bold text-3xl">{score}</div>
        )}
      </div>
      <div className="text-xs text-gray-300 mb-2">({abbreviation})</div>
      <div className="bg-gray-800 border border-orange-400 rounded px-2 py-1">
        {editable && onModChange ? (
          <input
            type="text"
            value={modifier}
            onChange={(e) => onModChange(e.target.value)}
            className="w-full bg-gray-800 text-orange-300 font-semibold text-center border-0"
          />
        ) : (
          <div className="flex items-center justify-between group cursor-default">
            <div className="text-orange-300 font-semibold flex-1">{modifier}</div>
            {!editable && onRoll && (
              <button
                onClick={() => onRoll(name, modifier)}
                className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-orange-500 text-orange-300 hover:text-white transition-all"
                title={`Roll ${name} Check`}
              >
                <Dice5 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
