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
import type { PlayerDeck, PlayerInventory, ValidationResult, ValidationError, CardConfig } from '../types/deck.js';
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
export declare function validateEquipment(unit: UnitBase, item: Item, cardIndex?: number): EquipmentValidationResult;
/**
 * Valida uma carta individual (unidade + equipamentos).
 *
 * @param card - Configuração da carta
 * @param cardIndex - Índice no deck
 * @param inventory - Inventário do jogador (opcional, para validar posse)
 * @returns Array de erros encontrados
 */
export declare function validateCard(card: CardConfig, cardIndex: number, inventory?: PlayerInventory): ValidationError[];
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
export declare function validateDeck(deck: PlayerDeck, inventory?: PlayerInventory): ValidationResult;
/**
 * Calcula o custo total de mana de uma carta.
 *
 * Custo = Custo Base da Unidade + Soma(Peso de cada Item)
 *
 * @param unit - Unidade base
 * @param items - Lista de itens equipados
 * @returns Custo total de mana
 */
export declare function calculateCardCost(unit: UnitBase, items: Item[]): number;
/**
 * Calcula o custo de uma carta a partir dos IDs.
 * Útil quando você só tem os IDs e não os objetos completos.
 *
 * @param unitId - ID da unidade
 * @param itemIds - Lista de IDs dos itens
 * @returns Custo total ou null se algum ID for inválido
 */
export declare function calculateCardCostByIds(unitId: string, itemIds: string[]): number | null;
export {};
//# sourceMappingURL=deck-validator.d.ts.map