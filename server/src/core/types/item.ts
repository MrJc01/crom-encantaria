/**
 * Magic Royale - Item/Equipment Interface
 * 
 * Define a estrutura de um item equipável.
 * Itens modificam as estatísticas das unidades e têm regras de afinidade.
 * 
 * @module core/types/item
 */

import { AffinityTag, SlotType } from './tags.js';

/**
 * Modificadores de estatísticas aplicados pelo item.
 * Valores podem ser positivos (buff) ou negativos (trade-off).
 */
export interface ItemStatsModifier {
    /** Modificador de HP (ex: +50, -20) */
    health?: number;
    /** Modificador de dano */
    damage?: number;
    /** Modificador de velocidade de ataque */
    attackSpeed?: number;
    /** Modificador de alcance */
    range?: number;
    /** Modificador de velocidade de movimento */
    moveSpeed?: number;
}

/**
 * Requisitos de afinidade para equipar o item.
 * 
 * - allowedTags: A unidade DEVE ter pelo menos uma dessas tags (se lista não vazia)
 * - forbiddenTags: A unidade NÃO PODE ter nenhuma dessas tags
 */
export interface ItemRequirements {
    /** Tags que a unidade deve possuir (OR logic) */
    allowedTags: AffinityTag[];
    /** Tags que a unidade não pode possuir (AND logic de exclusão) */
    forbiddenTags: AffinityTag[];
}

/**
 * Item/Equipamento do Catálogo (ReadOnly)
 * 
 * Itens são templates imutáveis referenciados pelo ID.
 */
export interface Item {
    /** Identificador único do item */
    itemId: string;
    /** Nome de exibição */
    name: string;
    /** Descrição para o jogador */
    description: string;
    /** Tipo de slot que este item ocupa */
    slot: SlotType;
    /** Peso de mana adicional ao custo da carta */
    manaWeight: number;
    /** Modificadores de estatísticas */
    statsModifier: ItemStatsModifier;
    /** Requisitos de afinidade para equipar */
    requirements: ItemRequirements;
    /** Caminho para o modelo 3D (frontend) */
    sprite3d?: string;
}

/**
 * Verifica se um item tem requisitos de tags permitidas.
 */
export function itemHasAllowedTagRequirement(item: Item): boolean {
    return item.requirements.allowedTags.length > 0;
}

/**
 * Verifica se uma tag está na lista de proibidas do item.
 */
export function isTagForbiddenByItem(item: Item, tag: AffinityTag): boolean {
    return item.requirements.forbiddenTags.includes(tag);
}
