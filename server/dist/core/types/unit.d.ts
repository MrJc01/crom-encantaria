/**
 * Magic Royale - Unit Base Interface
 *
 * Define a estrutura de uma unidade base do catálogo.
 * Unidades são templates imutáveis; jogadores equipam itens nelas.
 *
 * @module core/types/unit
 */
import { AffinityTag, SlotType } from './tags.js';
/**
 * Estatísticas base de uma unidade.
 */
export interface UnitBaseStats {
    /** Pontos de vida máximos */
    health: number;
    /** Dano por ataque */
    damage: number;
    /** Ataques por segundo */
    attackSpeed: number;
    /** Distância de ataque (unidades do grid) */
    range: number;
    /** Velocidade de movimento (unidades por segundo) */
    moveSpeed: number;
}
/**
 * Configuração de slots disponíveis para uma unidade.
 * true = slot disponível, false/undefined = não disponível
 */
export interface UnitSlots {
    [SlotType.WEAPON]?: boolean;
    [SlotType.ARMOR]?: boolean;
    [SlotType.ARTIFACT]?: boolean;
}
/**
 * Unidade Base do Catálogo (ReadOnly)
 *
 * Esta é a definição estática de uma unidade.
 * Os jogadores não modificam isso; apenas referenciam pelo ID.
 */
export interface UnitBase {
    /** Identificador único da unidade */
    unitId: string;
    /** Nome de exibição */
    name: string;
    /** Descrição para o jogador */
    description: string;
    /** Estatísticas base (antes de equipamentos) */
    baseStats: UnitBaseStats;
    /** Custo base de mana para invocar */
    manaCost: number;
    /** Tags de afinidade e classe */
    tags: AffinityTag[];
    /** Slots de equipamento disponíveis */
    slots: UnitSlots;
    /** Caminho para o modelo 3D (frontend) */
    sprite3d?: string;
}
/**
 * Verifica se uma unidade possui um determinado slot.
 */
export declare function unitHasSlot(unit: UnitBase, slotType: SlotType): boolean;
/**
 * Verifica se uma unidade possui uma determinada tag.
 */
export declare function unitHasTag(unit: UnitBase, tag: AffinityTag): boolean;
//# sourceMappingURL=unit.d.ts.map