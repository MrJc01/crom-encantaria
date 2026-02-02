/**
 * Magic Royale - Data Loader
 *
 * Facade para o catálogo compartilhado em @crom/shared.
 *
 * @module data/loader
 */
import { UnitBase, Item } from '@crom/shared';
/**
 * Carrega todas as unidades do catálogo.
 */
export declare function loadUnits(): Map<string, UnitBase>;
/**
 * Carrega todos os itens do catálogo.
 */
export declare function loadItems(): Map<string, Item>;
/**
 * Busca uma unidade pelo ID.
 */
export declare function getUnitById(unitId: string): UnitBase | undefined;
/**
 * Busca um item pelo ID.
 */
export declare function getItemById(itemId: string): Item | undefined;
/**
 * Limpa o cache.
 * (No-op pois os dados agora são constantes compartilhadas)
 */
export declare function clearDataCache(): void;
//# sourceMappingURL=loader.d.ts.map