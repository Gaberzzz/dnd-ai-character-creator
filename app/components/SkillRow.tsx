import { Dice5 } from 'lucide-react';

interface SkillRowProps {
  name: string;
  value: string;
  proficient: boolean;
  onProficientChange?: (proficient: boolean) => void;
  onValueChange?: (value: string) => void;
  onRoll?: (skillName: string, value: string) => void;
  editable?: boolean;
  relatedAbility?: string;
}

export default function SkillRow({
  name,
  value,
  proficient,
  onProficientChange,
  onValueChange,
  onRoll,
  editable = false,
  relatedAbility,
}: SkillRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 bg-gray-800 p-2 rounded border border-gray-700 hover:border-orange-500 transition-colors">
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <button
          onClick={() => onProficientChange?.(!proficient)}
          disabled={!editable}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors ${
            proficient
              ? "bg-orange-500 border-orange-500"
              : "border-gray-600 hover:border-orange-400"
          } ${editable ? "cursor-pointer" : "cursor-default"}`}
        >
          {proficient && <div className="text-white text-xs font-bold text-center">✓</div>}
        </button>
        <span className={`text-sm ${proficient ? "text-orange-300 font-semibold" : "text-gray-300"}`}>
          {name}
        </span>
        {relatedAbility && <span className="text-xs text-gray-500">({relatedAbility})</span>}
      </div>

      <div className="flex-shrink-0 flex items-center gap-1 group">
        {editable && onValueChange ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-12 bg-gray-700 text-orange-300 font-semibold text-center border border-orange-400 rounded px-1 py-0.5 text-sm"
          />
        ) : (
          <>
            <span className="text-orange-300 font-semibold text-sm min-w-[2rem] text-right group-hover:text-orange-200 transition-colors cursor-default">
              {value}
            </span>
            {!editable && onRoll && (
              <button
                onClick={() => onRoll(name, value)}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-orange-500 text-orange-300 hover:text-white transition-all flex-shrink-0"
                title={`Roll ${name} Check`}
              >
                <Dice5 className="w-3 h-3" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
