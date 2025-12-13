interface SavingThrowSectionProps {
  savingThrows: Record<string, { proficient: boolean; value: string }>;
  onProficientChange?: (name: string, proficient: boolean) => void;
  onValueChange?: (name: string, value: string) => void;
  editable?: boolean;
}

export default function SavingThrowSection({
  savingThrows,
  onProficientChange,
  onValueChange,
  editable = false,
}: SavingThrowSectionProps) {
  return (
    <div className="bg-gray-900 border-2 border-orange-500 rounded-lg p-4">
      <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3 pb-2 border-b border-orange-500">
        Saving Throws
      </h3>
      <div className="space-y-2">
        {Object.entries(savingThrows).map(([name, data]) => (
          <div key={name} className="flex items-center justify-between gap-2">
            <button
              onClick={() => onProficientChange?.(name, !data.proficient)}
              disabled={!editable}
              className={`flex-shrink-0 w-4 h-4 rounded border-2 transition-colors ${
                data.proficient
                  ? "bg-orange-500 border-orange-500"
                  : "border-gray-600 hover:border-orange-400"
              } ${editable ? "cursor-pointer" : "cursor-default"}`}
            />
            <span className="text-xs text-gray-300 flex-1 capitalize">
              {name}
            </span>
            {editable && onValueChange ? (
              <input
                type="text"
                value={data.value}
                onChange={(e) => onValueChange(name, e.target.value)}
                className="w-10 bg-gray-800 text-orange-300 font-semibold text-center border border-orange-400 rounded px-1 text-xs"
              />
            ) : (
              <span className="text-orange-300 font-semibold text-xs w-10 text-right">
                {data.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
