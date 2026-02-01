/**
 * Magic Royale - Deck Validator
 * 
 * Implementa a "Regra Magic" - validação de compatibilidade entre
 * unidades e equipamentos baseada no sistema de afinidade.
 * 
 * Este é o coração do sistema de deck building.
 * 
 * @module core/validation/deck-validator
 */

import type { UnitBase } from '../types/unit.js';
import type { Item } from '../types/item.js';
import type {
    PlayerDeck,
    PlayerInventory,
    ValidationResult,
    ValidationError,
    CardConfig,
} from '../types/deck.js';
import { ValidationErrorCode, SlotType } from '../types/index.js';
import { unitHasSlot, unitHasTag } from '../types/unit.js';
import { itemHasAllowedTagRequirement, isTagForbiddenByItem } from '../types/item.js';
import { getUnitById, getItemById } from '../../data/loader.js';

/**
 * Resultado de validação de um equipamento individual.
 */
interface EquipmentValidationResult {
    isValid: boolean;
    error?: ValidationError;
}

/**
 * Valida se um item pode ser equipado em uma unidade específica.
 * 
 * Regras de validação:
 * 1. A unidade deve ter o slot correto
 * 2. Se o item tem allowedTags, a unidade deve ter pelo menos uma
 * 3. A unidade não pode ter nenhuma forbiddenTag do item
 * 
 * @param unit - Unidade base do catálogo
 * @param item - Item a ser equipado
 * @param cardIndex - Índice da carta (para mensagens de erro)
 * @returns Resultado da validação
 */
export function validateEquipment(
    unit: UnitBase,
    item: Item,
    cardIndex?: number
): EquipmentValidationResult {
    // Regra 1: Verificar se a unidade tem o slot correto
    if (!unitHasSlot(unit, item.slot as SlotType)) {
        return {
            isValid: false,
            error: {
                code: ValidationErrorCode.INVALID_SLOT,
                message: `A unidade "${unit.name}" não possui o slot "${item.slot}" para equipar "${item.name}".`,
                cardIndex,
                itemId: item.itemId,
                unitId: unit.unitId,
            },
        };
    }

    // Regra 2: Verificar allowedTags (se existirem)
    if (itemHasAllowedTagRequirement(item)) {
        const hasRequiredTag = item.requirements.allowedTags.some((tag) =>
            unitHasTag(unit, tag)
        );

        if (!hasRequiredTag) {
            return {
                isValid: false,
                error: {
                    code: ValidationErrorCode.MISSING_REQUIRED_TAG,
                    message: `O item "${item.name}" requer uma das tags [${item.requirements.allowedTags.join(', ')}], mas "${unit.name}" possui [${unit.tags.join(', ')}].`,
                    cardIndex,
                    itemId: item.itemId,
                    unitId: unit.unitId,
                },
            };
        }
    }

    // Regra 3: Verificar forbiddenTags
    for (const unitTag of unit.tags) {
        if (isTagForbiddenByItem(item, unitTag)) {
            return {
                isValid: false,
                error: {
                    code: ValidationErrorCode.FORBIDDEN_TAG_CONFLICT,
                    message: `O item "${item.name}" é incompatível com a tag "${unitTag}" da unidade "${unit.name}".`,
                    cardIndex,
                    itemId: item.itemId,
                    unitId: unit.unitId,
                },
            };
        }
    }

    return { isValid: true };
}

/**
 * Valida uma carta individual (unidade + equipamentos).
 * 
 * @param card - Configuração da carta
 * @param cardIndex - Índice no deck
 * @param inventory - Inventário do jogador (opcional, para validar posse)
 * @returns Array de erros encontrados
 */
export function validateCard(
    card: CardConfig,
    cardIndex: number,
    inventory?: PlayerInventory
): ValidationError[] {
    const errors: ValidationError[] = [];

    // 1. Buscar unidade no catálogo
    const unit = getUnitById(card.baseUnitId);
    if (!unit) {
        errors.push({
            code: ValidationErrorCode.UNIT_NOT_FOUND,
            message: `Unidade "${card.baseUnitId}" não encontrada no catálogo.`,
            cardIndex,
            unitId: card.baseUnitId,
        });
        return errors; // Não podemos continuar sem a unidade
    }

    // 2. Verificar se o jogador possui a unidade
    if (inventory && !inventory.unlockedUnits.includes(card.baseUnitId)) {
        errors.push({
            code: ValidationErrorCode.UNIT_NOT_OWNED,
            message: `Você não possui a unidade "${unit.name}".`,
            cardIndex,
            unitId: card.baseUnitId,
        });
    }

    // 3. Validar cada item equipado
    const usedSlots = new Set<string>();

    for (const itemId of card.equippedItems) {
        const item = getItemById(itemId);

        if (!item) {
            errors.push({
                code: ValidationErrorCode.ITEM_NOT_FOUND,
                message: `Item "${itemId}" não encontrado no catálogo.`,
                cardIndex,
                itemId,
            });
            continue;
        }

        // Verificar posse do item
        if (inventory && !inventory.ownedItems.includes(itemId)) {
            errors.push({
                code: ValidationErrorCode.ITEM_NOT_OWNED,
                message: `Você não possui o item "${item.name}".`,
                cardIndex,
                itemId,
            });
        }

        // Verificar slot duplicado
        if (usedSlots.has(item.slot)) {
            errors.push({
                code: ValidationErrorCode.DUPLICATE_SLOT,
                message: `Slot "${item.slot}" já está ocupado. Não é possível equipar "${item.name}".`,
                cardIndex,
                itemId,
            });
        }
        usedSlots.add(item.slot);

        // Validar compatibilidade de afinidade
        const equipResult = validateEquipment(unit, item, cardIndex);
        if (!equipResult.isValid && equipResult.error) {
            errors.push(equipResult.error);
        }
    }

    return errors;
}

/**
 * Valida um deck completo do jogador.
 * 
 * Esta é a função principal chamada ao salvar um deck.
 * Verifica todas as regras de negócio.
 * 
 * @param deck - Deck a ser validado
 * @param inventory - Inventário do jogador (opcional)
 * @returns Resultado da validação com lista de erros
 */
export function validateDeck(
    deck: PlayerDeck,
    inventory?: PlayerInventory
): ValidationResult {
    const errors: ValidationError[] = [];

    // Verificar se o deck está vazio
    if (!deck.cards || deck.cards.length === 0) {
        errors.push({
            code: ValidationErrorCode.EMPTY_DECK,
            message: 'O deck não pode estar vazio.',
        });
        return { isValid: false, errors };
    }

    // Validar cada carta do deck
    for (let i = 0; i < deck.cards.length; i++) {
        const card = deck.cards[i];
        const cardErrors = validateCard(card, i, inventory);
        errors.push(...cardErrors);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Calcula o custo total de mana de uma carta.
 * 
 * Custo = Custo Base da Unidade + Soma(Peso de cada Item)
 * 
 * @param unit - Unidade base
 * @param items - Lista de itens equipados
 * @returns Custo total de mana
 */
export function calculateCardCost(unit: UnitBase, items: Item[]): number {
    let totalCost = unit.manaCost;

    for (const item of items) {
        totalCost += item.manaWeight;
    }

    return totalCost;
}

/**
 * Calcula o custo de uma carta a partir dos IDs.
 * Útil quando você só tem os IDs e não os objetos completos.
 * 
 * @param unitId - ID da unidade
 * @param itemIds - Lista de IDs dos itens
 * @returns Custo total ou null se algum ID for inválido
 */
export function calculateCardCostByIds(
    unitId: string,
    itemIds: string[]
): number | null {
    const unit = getUnitById(unitId);
    if (!unit) return null;

    const items: Item[] = [];
    for (const itemId of itemIds) {
        const item = getItemById(itemId);
        if (!item) return null;
        items.push(item);
    }

    return calculateCardCost(unit, items);
}
