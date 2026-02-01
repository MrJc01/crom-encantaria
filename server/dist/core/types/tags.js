/**
 * Magic Royale - Affinity Tags & Slot Types
 *
 * Este módulo define o Sistema de Afinidade (Magic System) que governa
 * quais equipamentos podem ser usados por quais unidades.
 *
 * @module core/types/tags
 */
/**
 * Tags de Afinidade para Unidades e Itens.
 *
 * - Tags de TIPO (o que a unidade É): HUMAN, DEMON, WATER_ELEMENTAL
 * - Tags de ALINHAMENTO (essência): SOLAR, VOID, NATURE, STEEL
 * - Tags de CLASSE (estilo de combate): MELEE, RANGED
 */
export var AffinityTag;
(function (AffinityTag) {
    // Tipos de Criatura
    AffinityTag["HUMAN"] = "HUMAN";
    AffinityTag["DEMON"] = "DEMON";
    AffinityTag["WATER_ELEMENTAL"] = "WATER_ELEMENTAL";
    AffinityTag["UNDEAD"] = "UNDEAD";
    // Alinhamentos Elementais
    AffinityTag["SOLAR"] = "SOLAR";
    AffinityTag["VOID"] = "VOID";
    AffinityTag["NATURE"] = "NATURE";
    AffinityTag["STEEL"] = "STEEL";
    // Classes de Combate
    AffinityTag["MELEE"] = "MELEE";
    AffinityTag["RANGED"] = "RANGED";
})(AffinityTag || (AffinityTag = {}));
/**
 * Tipos de slots de equipamento.
 * Cada unidade pode ter diferentes slots disponíveis.
 */
export var SlotType;
(function (SlotType) {
    SlotType["WEAPON"] = "weapon";
    SlotType["ARMOR"] = "armor";
    SlotType["ARTIFACT"] = "artifact";
})(SlotType || (SlotType = {}));
/**
 * Estados possíveis de uma unidade durante a partida.
 */
export var UnitState;
(function (UnitState) {
    UnitState["IDLE"] = "IDLE";
    UnitState["WALK"] = "WALK";
    UnitState["ATTACK"] = "ATTACK";
    UnitState["DEAD"] = "DEAD";
})(UnitState || (UnitState = {}));
//# sourceMappingURL=tags.js.map