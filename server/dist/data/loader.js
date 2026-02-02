/**
 * Magic Royale - Data Loader
 *
 * Facade para o catálogo compartilhado em @crom/shared.
 *
 * @module data/loader
 */
import { UnitsMap, ItemsMap, getUnitById as getSharedUnit, getItemById as getSharedItem } from '@crom/shared';
/**
 * Carrega todas as unidades do catálogo.
 */
export function loadUnits() {
    return UnitsMap;
}
/**
 * Carrega todos os itens do catálogo.
 */
export function loadItems() {
    return ItemsMap;
}
/**
 * Busca uma unidade pelo ID.
 */
export function getUnitById(unitId) {
    return getSharedUnit(unitId);
}
/**
 * Busca um item pelo ID.
 */
export function getItemById(itemId) {
    return getSharedItem(itemId);
}
/**
 * Limpa o cache.
 * (No-op pois os dados agora são constantes compartilhadas)
 */
export function clearDataCache() {
    // No-op
}
//# sourceMappingURL=loader.js.map