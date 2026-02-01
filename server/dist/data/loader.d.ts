/**
 * Magic Royale - Data Loader
 *
 * Carrega os dados estáticos (unidades e itens) dos arquivos JSON.
 * Em produção, isso poderia vir de um banco de dados ou cache Redis.
 *
 * @module data/loader
 */
import type { UnitBase } from '../core/types/unit.js';
import type { Item } from '../core/types/item.js';
/**
 * Carrega todas as unidades do catálogo.
 * Retorna um Map indexado por unitId para lookup O(1).
 */
export declare function loadUnits(): Map<string, UnitBase>;
/**
 * Carrega todos os itens do catálogo.
 * Retorna um Map indexado por itemId para lookup O(1).
 */
export declare function loadItems(): Map<string, Item>;
/**
 * Busca uma unidade pelo ID.
 * @returns A unidade ou undefined se não encontrada.
 */
export declare function getUnitById(unitId: string): UnitBase | undefined;
/**
 * Busca um item pelo ID.
 * @returns O item ou undefined se não encontrado.
 */
export declare function getItemById(itemId: string): Item | undefined;
/**
 * Limpa o cache (útil para testes).
 */
export declare function clearDataCache(): void;
//# sourceMappingURL=loader.d.ts.map