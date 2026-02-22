import type { CharacterData } from '~/types/character';
import AbilityCardsPanel, { type AbilityDef } from './AbilityCardsPanel';

interface MentalStatsPanelProps {
  character: CharacterData;
  isEditing: boolean;
  abilityModifiers: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  handleCharacterChange: (key: keyof CharacterData, value: any) => void;
  handleRollAbilityCheck: (abilityName: string, modifier: string) => void;
  handleSkillChange: (skillName: string, proficient: boolean) => void;
  handleRollSkillCheck: (skillName: string, modifier: string) => void;
  handleSavingThrowChange: (name: string, proficient: boolean) => void;
  handleRollSavingThrow: (throwName: string, modifier: string) => void;
}

const MENTAL_ABILITIES: AbilityDef[] = [
  { name: 'Intelligence', key: 'intelligence', savingThrowKey: 'intelligence' },
  { name: 'Wisdom', key: 'wisdom', savingThrowKey: 'wisdom' },
  { name: 'Charisma', key: 'charisma', savingThrowKey: 'charisma' },
];

export default function MentalStatsPanel({
  character,
  isEditing,
  abilityModifiers,
  handleCharacterChange,
  handleRollAbilityCheck,
  handleSkillChange,
  handleRollSkillCheck,
  handleSavingThrowChange,
  handleRollSavingThrow,
}: MentalStatsPanelProps) {
  return (
    <AbilityCardsPanel
      abilities={MENTAL_ABILITIES}
      character={character}
      isEditing={isEditing}
      abilityModifiers={abilityModifiers}
      handleCharacterChange={handleCharacterChange}
      handleRollAbilityCheck={handleRollAbilityCheck}
      handleSkillChange={handleSkillChange}
      handleRollSkillCheck={handleRollSkillCheck}
      handleSavingThrowChange={handleSavingThrowChange}
      handleRollSavingThrow={handleRollSavingThrow}
    />
  );
}
