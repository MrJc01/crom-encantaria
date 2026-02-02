/**
 * Magic Royale - Data Loader
 * 
 * Facade para o catálogo compartilhado em @crom/shared.
 * 
 * @module data/loader
 */

import {
    UnitsMap,
    ItemsMap,
    getUnitById as getSharedUnit,
    getItemById as getSharedItem,
    UnitBase,
    Item
} from '@crom/shared';

/**
 * Carrega todas as unidades do catálogo.
 */
export function loadUnits(): Map<string, UnitBase> {
    return UnitsMap;
}

/**
 * Carrega todos os itens do catálogo.
 */
export function loadItems(): Map<string, Item> {
    return ItemsMap;
}

/**
 * Busca uma unidade pelo ID.
 */
export function getUnitById(unitId: string): UnitBase | undefined {
    return getSharedUnit(unitId);
}

/**
 * Busca um item pelo ID.
 */
export function getItemById(itemId: string): Item | undefined {
    return getSharedItem(itemId);
}

/**
 * Limpa o cache.
 * (No-op pois os dados agora são constantes compartilhadas)
 */
export function clearDataCache(): void {
    // No-op
}
