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
// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Resolver caminho para os arquivos JSON
// Em dev: src/data/, em produção: dist/data/ -> precisa voltar para src/data/
// Solução: usar process.cwd() + src/data/ como fallback
function getDataPath(filename) {
    const localPath = join(__dirname, filename);
    // Se o arquivo não existe localmente (dist), buscar em src/data
    const srcPath = join(process.cwd(), 'src', 'data', filename);
    try {
        readFileSync(localPath, 'utf-8');
        return localPath;
    }
    catch {
        return srcPath;
    }
}
/**
 * Cache em memória para os dados carregados.
 */
let unitsCache = null;
let itemsCache = null;
/**
 * Carrega todas as unidades do catálogo.
 * Retorna um Map indexado por unitId para lookup O(1).
 */
export function loadUnits() {
    if (unitsCache) {
        return unitsCache;
    }
    const filePath = getDataPath('units.json');
    const rawData = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);
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
export function loadItems() {
    if (itemsCache) {
        return itemsCache;
    }
    const filePath = getDataPath('items.json');
    const rawData = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);
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
export function getUnitById(unitId) {
    const units = loadUnits();
    return units.get(unitId);
}
/**
 * Busca um item pelo ID.
 * @returns O item ou undefined se não encontrado.
 */
export function getItemById(itemId) {
    const items = loadItems();
    return items.get(itemId);
}
/**
 * Limpa o cache (útil para testes).
 */
export function clearDataCache() {
    unitsCache = null;
    itemsCache = null;
}
//# sourceMappingURL=loader.js.map