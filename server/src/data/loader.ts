/**
 * Magic Royale - Data Loader
 * 
 * Carrega os dados estáticos (unidades e itens) dos arquivos JSON.
 * Em produção, isso poderia vir de um banco de dados ou cache Redis.
 * 
 * @module data/loader
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { UnitBase } from '../core/types/unit.js';
import type { Item } from '../core/types/item.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Estrutura do arquivo units.json
 */
interface UnitsData {
    units: UnitBase[];
}

/**
 * Estrutura do arquivo items.json
 */
interface ItemsData {
    items: Item[];
}

/**
 * Cache em memória para os dados carregados.
 */
let unitsCache: Map<string, UnitBase> | null = null;
let itemsCache: Map<string, Item> | null = null;

/**
 * Carrega todas as unidades do catálogo.
 * Retorna um Map indexado por unitId para lookup O(1).
 */
export function loadUnits(): Map<string, UnitBase> {
    if (unitsCache) {
        return unitsCache;
    }

    const filePath = join(__dirname, 'units.json');
    const rawData = readFileSync(filePath, 'utf-8');
    const data: UnitsData = JSON.parse(rawData);

    unitsCache = new Map();
    for (const unit of data.units) {
        unitsCache.set(unit.unitId, unit);
    }

    console.log(`[DataLoader] Carregadas ${unitsCache.size} unidades do catálogo.`);
    return unitsCache;
}

/**
 * Carrega todos os itens do catálogo.
 * Retorna um Map indexado por itemId para lookup O(1).
 */
export function loadItems(): Map<string, Item> {
    if (itemsCache) {
        return itemsCache;
    }

    const filePath = join(__dirname, 'items.json');
    const rawData = readFileSync(filePath, 'utf-8');
    const data: ItemsData = JSON.parse(rawData);

    itemsCache = new Map();
    for (const item of data.items) {
        itemsCache.set(item.itemId, item);
    }

    console.log(`[DataLoader] Carregados ${itemsCache.size} itens do catálogo.`);
    return itemsCache;
}

/**
 * Busca uma unidade pelo ID.
 * @returns A unidade ou undefined se não encontrada.
 */
export function getUnitById(unitId: string): UnitBase | undefined {
    const units = loadUnits();
    return units.get(unitId);
}

/**
 * Busca um item pelo ID.
 * @returns O item ou undefined se não encontrado.
 */
export function getItemById(itemId: string): Item | undefined {
    const items = loadItems();
    return items.get(itemId);
}

/**
 * Limpa o cache (útil para testes).
 */
export function clearDataCache(): void {
    unitsCache = null;
    itemsCache = null;
}
