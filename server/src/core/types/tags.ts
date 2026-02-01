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
export enum AffinityTag {
    // Tipos de Criatura
    HUMAN = 'HUMAN',
    DEMON = 'DEMON',
    WATER_ELEMENTAL = 'WATER_ELEMENTAL',
    UNDEAD = 'UNDEAD',

    // Alinhamentos Elementais
    SOLAR = 'SOLAR',
    VOID = 'VOID',
    NATURE = 'NATURE',
    STEEL = 'STEEL',

    // Classes de Combate
    MELEE = 'MELEE',
    RANGED = 'RANGED',
}

/**
 * Tipos de slots de equipamento.
 * Cada unidade pode ter diferentes slots disponíveis.
 */
export enum SlotType {
    WEAPON = 'weapon',
    ARMOR = 'armor',
    ARTIFACT = 'artifact',
}

/**
 * Estados possíveis de uma unidade durante a partida.
 */
export enum UnitState {
    IDLE = 'IDLE',
    WALK = 'WALK',
    ATTACK = 'ATTACK',
    DEAD = 'DEAD',
}
