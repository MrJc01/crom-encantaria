/**
 * Magic Royale - Unit Base Interface
 *
 * Define a estrutura de uma unidade base do catálogo.
 * Unidades são templates imutáveis; jogadores equipam itens nelas.
 *
 * @module core/types/unit
 */
import { SlotType } from './tags.js';
/**
 * Verifica se uma unidade possui um determinado slot.
 */
export function unitHasSlot(unit, slotType) {
    return unit.slots[slotType] === true;
}
/**
 * Verifica se uma unidade possui uma determinada tag.
 */
export function unitHasTag(unit, tag) {
    return unit.tags.includes(tag);
}
//# sourceMappingURL=unit.js.map