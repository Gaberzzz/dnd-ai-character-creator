interface SpellProps {
  name: string;
  level: string;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  description: string;
  onNameChange?: (value: string) => void;
  onLevelChange?: (value: string) => void;
  onSchoolChange?: (value: string) => void;
  onCastingTimeChange?: (value: string) => void;
  onRangeChange?: (value: string) => void;
  onDurationChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
  onDelete?: () => void;
  editable?: boolean;
}

export default function SpellEntry({
  name,
  level,
  school,
  castingTime,
  range,
  duration,
  description,
  onNameChange,
  onLevelChange,
  onSchoolChange,
  onCastingTimeChange,
  onRangeChange,
  onDurationChange,
  onDescriptionChange,
  onDelete,
  editable = false,
}: SpellProps) {
  return (
    <div className="bg-gray-800 border border-orange-500 rounded-lg p-4 space-y-3">
      {/* Spell Name and Header */}
      <div className="flex items-center justify-between gap-2">
        {editable && onNameChange ? (
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Spell Name"
            className="flex-1 bg-gray-700 text-orange-300 border border-orange-400 rounded px-2 py-1 text-sm font-semibold"
          />
        ) : (
          <span className="text-orange-400 font-semibold flex-1">{name}</span>
        )}
        <div className="flex items-center gap-2">
          {editable && onLevelChange ? (
            <select
              value={level}
              onChange={(e) => onLevelChange(e.target.value)}
              className="bg-gray-700 text-orange-300 border border-orange-400 rounded px-2 py-1 text-xs"
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={i.toString()}>
                  Level {i}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-orange-300 text-xs font-semibold bg-gray-700 px-2 py-1 rounded">
              Level {level}
            </span>
          )}
          {editable && onDelete && (
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 text-sm font-semibold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Spell School and Casting Time */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-gray-400">School</span>
          {editable && onSchoolChange ? (
            <input
              type="text"
              value={school}
              onChange={(e) => onSchoolChange(e.target.value)}
              placeholder="e.g., Evocation"
              className="w-full bg-gray-700 text-orange-300 border border-orange-400 rounded px-1 py-0.5 mt-1"
            />
          ) : (
            <div className="text-orange-300 mt-1">{school}</div>
          )}
        </div>
        <div>
          <span className="text-gray-400">Casting Time</span>
          {editable && onCastingTimeChange ? (
            <input
              type="text"
              value={castingTime}
              onChange={(e) => onCastingTimeChange(e.target.value)}
              placeholder="e.g., 1 action"
              className="w-full bg-gray-700 text-orange-300 border border-orange-400 rounded px-1 py-0.5 mt-1"
            />
          ) : (
            <div className="text-orange-300 mt-1">{castingTime}</div>
          )}
        </div>
      </div>

      {/* Range and Duration */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-gray-400">Range</span>
          {editable && onRangeChange ? (
            <input
              type="text"
              value={range}
              onChange={(e) => onRangeChange(e.target.value)}
              placeholder="e.g., 30 feet"
              className="w-full bg-gray-700 text-orange-300 border border-orange-400 rounded px-1 py-0.5 mt-1"
            />
          ) : (
            <div className="text-orange-300 mt-1">{range}</div>
          )}
        </div>
        <div>
          <span className="text-gray-400">Duration</span>
          {editable && onDurationChange ? (
            <input
              type="text"
              value={duration}
              onChange={(e) => onDurationChange(e.target.value)}
              placeholder="e.g., 1 minute"
              className="w-full bg-gray-700 text-orange-300 border border-orange-400 rounded px-1 py-0.5 mt-1"
            />
          ) : (
            <div className="text-orange-300 mt-1">{duration}</div>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <span className="text-xs text-gray-400">Description</span>
        {editable && onDescriptionChange ? (
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Spell description and effects..."
            className="w-full bg-gray-700 text-orange-300 border border-orange-400 rounded px-2 py-1 text-xs mt-1 min-h-20 resize-none"
          />
        ) : (
          <p className="text-orange-300 text-xs mt-1 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}
