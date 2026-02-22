import { useCharacterSheet } from '~/hooks/useCharacterSheet';
import CharacterSheetHeader from '~/components/character-sheet/CharacterSheetHeader';
import CombatStatsBar from '~/components/character-sheet/CombatStatsBar';
import LeftStatsPanel from '~/components/character-sheet/LeftStatsPanel';
import MentalStatsPanel from '~/components/character-sheet/MentalStatsPanel';
import RollHistoryInlinePanel from '~/components/character-sheet/RollHistoryInlinePanel';
import ActionsTab from '~/components/character-sheet/ActionsTab';
import SpellsTab from '~/components/character-sheet/SpellsTab';
import InventoryTab from '~/components/character-sheet/InventoryTab';
import FeaturesTab from '~/components/character-sheet/FeaturesTab';
import BackgroundTab from '~/components/character-sheet/BackgroundTab';
import type { CharacterData } from '~/types/character';
import { pageBg, cardBg, cardBorder, tabActive, tabInactive, divider } from '~/utils/theme';

interface CharacterSheetProps {
  character: CharacterData;
  onBack?: () => void;
  onLevelUp?: () => void;
}

const TABS = ['actions', 'spells', 'inventory', 'features', 'background'] as const;

export default function CharacterSheet({ character: initialCharacter, onBack, onLevelUp }: CharacterSheetProps) {
  const sheet = useCharacterSheet(initialCharacter);

  return (
    <div className={`min-h-screen ${pageBg}`}>
      {/* Header */}
      <div className={`${cardBg} border-b ${divider} shadow-lg top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <CharacterSheetHeader
              character={sheet.character}
              isEditing={sheet.isEditing}
              setIsEditing={sheet.setIsEditing}
              initialCharacter={initialCharacter}
              setCharacter={sheet.setCharacter}
              pdfVersion={sheet.pdfVersion}
              setPdfVersion={sheet.setPdfVersion}
              onBack={onBack}
              onLevelUp={onLevelUp}
              fileInputRef={sheet.fileInputRef}
              exportToPDF={sheet.exportToPDF}
              exportToJSON={sheet.exportToJSON}
              importFromJSON={sheet.importFromJSON}
              handleCharacterChange={sheet.handleCharacterChange}
              handleLongRest={sheet.handleLongRest}
            />
            <CombatStatsBar
              character={sheet.character}
              isEditing={sheet.isEditing}
              abilityModifiers={sheet.abilityModifiers}
              calculatedInitiative={sheet.calculatedInitiative}
              hpAdjustAmount={sheet.hpAdjustAmount}
              setHpAdjustAmount={sheet.setHpAdjustAmount}
              editingTempHp={sheet.editingTempHp}
              setEditingTempHp={sheet.setEditingTempHp}
              handleCharacterChange={sheet.handleCharacterChange}
              handleApplyHealing={sheet.handleApplyHealing}
              handleApplyDamage={sheet.handleApplyDamage}
              addRoll={sheet.addRoll}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column — STR / DEX / CON + stats */}
          <div className="col-span-2">
            <LeftStatsPanel
              character={sheet.character}
              isEditing={sheet.isEditing}
              abilityModifiers={sheet.abilityModifiers}
              proficiencyBonus={sheet.proficiencyBonus}
              handleCharacterChange={sheet.handleCharacterChange}
              handleRollAbilityCheck={sheet.handleRollAbilityCheck}
              handleSkillChange={sheet.handleSkillChange}
              handleRollSkillCheck={sheet.handleRollSkillCheck}
              handleSavingThrowChange={sheet.handleSavingThrowChange}
              handleRollSavingThrow={sheet.handleRollSavingThrow}
              parseModifier={sheet.parseModifier}
              handleSpendHitDie={sheet.handleSpendHitDie}
            />
          </div>

          {/* Center Column — INT / WIS / CHA */}
          <div className="col-span-2">
            <MentalStatsPanel
              character={sheet.character}
              isEditing={sheet.isEditing}
              abilityModifiers={sheet.abilityModifiers}
              handleCharacterChange={sheet.handleCharacterChange}
              handleRollAbilityCheck={sheet.handleRollAbilityCheck}
              handleSkillChange={sheet.handleSkillChange}
              handleRollSkillCheck={sheet.handleRollSkillCheck}
              handleSavingThrowChange={sheet.handleSavingThrowChange}
              handleRollSavingThrow={sheet.handleRollSavingThrow}
            />
          </div>



          {/* Right Column — Tabs */}
          <div className="col-span-5">
            <div className={`${cardBg} rounded-lg shadow-lg ${cardBorder} flex flex-col`} style={{ height: '80vh', minHeight: '400px' }}>
              {/* Tab bar — pinned */}
              <div className={`border-b ${divider} flex-shrink-0`}>
                <div className="flex">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => sheet.setActiveTab(tab)}
                      className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${sheet.activeTab === tab ? tabActive : tabInactive
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content — scrollable */}
              <div className="p-6 overflow-y-auto flex-1">
                {sheet.activeTab === 'actions' && (
                  <ActionsTab
                    character={sheet.character}
                    isEditing={sheet.isEditing}
                    bonusDamageFeatures={sheet.bonusDamageFeatures}
                    openSmitePicker={sheet.openSmitePicker}
                    setOpenSmitePicker={sheet.setOpenSmitePicker}
                    handleCharacterChange={sheet.handleCharacterChange}
                    handleAttackChange={sheet.handleAttackChange}
                    handleAddAttack={sheet.handleAddAttack}
                    handleDeleteAttack={sheet.handleDeleteAttack}
                    handleAddCantrip={sheet.handleAddCantrip}
                    handleDeleteCantrip={sheet.handleDeleteCantrip}
                    handleRollAttack={sheet.handleRollAttack}
                    handleRollDamage={sheet.handleRollDamage}
                    handleRollHealing={sheet.handleRollHealing}
                    handleRollBonusDamage={sheet.handleRollBonusDamage}
                  />
                )}
                {sheet.activeTab === 'spells' && (
                  <SpellsTab
                    character={sheet.character}
                    isEditing={sheet.isEditing}
                    handleSpellChange={sheet.handleSpellChange}
                    handleAddSpell={sheet.handleAddSpell}
                    handleDeleteSpell={sheet.handleDeleteSpell}
                    handleCharacterChange={sheet.handleCharacterChange}
                    handleRollAttack={sheet.handleRollAttack}
                    handleRollDamage={sheet.handleRollDamage}
                    handleRollHealing={sheet.handleRollHealing}
                    handleSpellSlotChange={sheet.handleSpellSlotChange}
                  />
                )}
                {sheet.activeTab === 'inventory' && (
                  <InventoryTab
                    character={sheet.character}
                    isEditing={sheet.isEditing}
                    handleCharacterChange={sheet.handleCharacterChange}
                  />
                )}
                {sheet.activeTab === 'features' && (
                  <FeaturesTab
                    character={sheet.character}
                    isEditing={sheet.isEditing}
                    expandedFeatures={sheet.expandedFeatures}
                    toggleFeatureExpanded={sheet.toggleFeatureExpanded}
                    handleCharacterChange={sheet.handleCharacterChange}
                    handleFeatureChange={sheet.handleFeatureChange}
                    handleAddFeature={sheet.handleAddFeature}
                    handleDeleteFeature={sheet.handleDeleteFeature}
                  />
                )}
                {sheet.activeTab === 'background' && (
                  <BackgroundTab
                    character={sheet.character}
                    isEditing={sheet.isEditing}
                    handleCharacterChange={sheet.handleCharacterChange}
                  />
                )}
              </div>
            </div>
          </div>
          {/* Roll History — inline rightmost panel */}
          <div className="col-span-3">
            <RollHistoryInlinePanel
              rolls={sheet.combinedRolls}
              onClearHistory={sheet.handleClearHistory}
              addRoll={sheet.addRoll}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
