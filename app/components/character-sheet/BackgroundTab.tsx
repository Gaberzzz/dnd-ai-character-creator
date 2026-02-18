import type { CharacterData } from '~/types/character';
import { card, headingText, subHeadingText, labelText, inputBase } from '~/utils/theme';

interface BackgroundTabProps {
  character: CharacterData;
  isEditing: boolean;
  handleCharacterChange: (key: keyof CharacterData, value: any) => void;
}

interface FieldDef {
  label: string;
  key: keyof CharacterData;
  multiline?: boolean;
}

const CHARACTER_INFO_FIELDS: FieldDef[] = [
  { label: 'Background', key: 'background', multiline: true },
  { label: 'Alignment', key: 'alignment' },
  { label: 'Experience Points', key: 'experiencePoints' },
];

const PERSONALITY_FIELDS: FieldDef[] = [
  { label: 'Traits', key: 'personalityTraits', multiline: true },
  { label: 'Ideals', key: 'ideals', multiline: true },
  { label: 'Bonds', key: 'bonds', multiline: true },
  { label: 'Flaws', key: 'flaws', multiline: true },
];

export default function BackgroundTab({ character, isEditing, handleCharacterChange }: BackgroundTabProps) {
  const renderField = ({ label, key, multiline }: FieldDef) => (
    <div key={String(key)}>
      <div className={`font-medium mb-1 ${labelText}`}>{label}</div>
      {isEditing ? (
        multiline ? (
          <textarea
            value={character[key] as string}
            onChange={(e) => handleCharacterChange(key, e.target.value)}
            className={`w-full min-h-16 ${inputBase}`}
          />
        ) : (
          <input
            type="text"
            value={character[key] as string}
            onChange={(e) => handleCharacterChange(key, e.target.value)}
            className={`w-full ${inputBase}`}
          />
        )
      ) : (
        <div className={subHeadingText}>{character[key] as string}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className={card}>
        <h3 className={`text-sm font-bold uppercase mb-3 ${headingText}`}>Character Info</h3>
        <div className="space-y-3 text-sm">{CHARACTER_INFO_FIELDS.map(renderField)}</div>
      </div>
      <div className={card}>
        <h3 className={`text-sm font-bold uppercase mb-3 ${headingText}`}>Personality</h3>
        <div className="space-y-3 text-sm">{PERSONALITY_FIELDS.map(renderField)}</div>
      </div>
    </div>
  );
}
