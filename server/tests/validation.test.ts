/**
 * Magic Royale - Deck Validation Tests
 * 
 * Testes unitários para o sistema de validação de deck.
 * Prova que a "Regra Magic" funciona corretamente.
 * 
 * @module tests/validation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
    validateEquipment,
    validateDeck,
    validateCard,
    calculateCardCost,
} from '../src/core/validation/deck-validator.js';
import { loadUnits, loadItems, clearDataCache } from '../src/data/loader.js';
import type { UnitBase } from '../src/core/types/unit.js';
import type { Item } from '../src/core/types/item.js';
import type { PlayerDeck, PlayerInventory } from '../src/core/types/deck.js';
import { ValidationErrorCode } from '../src/core/types/deck.js';

describe('Deck Validation System', () => {
    let knight: UnitBase;
    let archer: UnitBase;
    let mage: UnitBase;
    let swordFlame: Item;
    let longbow: Item;
    let steelPlate: Item;
    let staffIce: Item;
    let shadowRelic: Item;

    beforeAll(() => {
        // Limpar cache e carregar dados frescos
        clearDataCache();
        const units = loadUnits();
        const items = loadItems();

        knight = units.get('knight_base')!;
        archer = units.get('archer_base')!;
        mage = units.get('mage_base')!;
        swordFlame = items.get('sword_flame_t1')!;
        longbow = items.get('longbow_t2')!;
        steelPlate = items.get('steel_plate_t2')!;
        staffIce = items.get('staff_ice_t1')!;
        shadowRelic = items.get('shadow_relic')!;
    });

    // ==========================================
    // TESTES: validateEquipment
    // ==========================================

    describe('validateEquipment()', () => {
        it('✅ deve PERMITIR equipar Espada de Fogo em Cavaleiro (HUMAN/STEEL)', () => {
            const result = validateEquipment(knight, swordFlame);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('✅ deve PERMITIR equipar Arco Longo em Arqueira (RANGED)', () => {
            const result = validateEquipment(archer, longbow);
            expect(result.isValid).toBe(true);
        });

        it('✅ deve PERMITIR equipar Armadura de Placas em Cavaleiro (HUMAN/STEEL)', () => {
            const result = validateEquipment(knight, steelPlate);
            expect(result.isValid).toBe(true);
        });

        it('❌ deve BLOQUEAR Cajado de Gelo em Mago SOLAR (forbiddenTag)', () => {
            const result = validateEquipment(mage, staffIce);

            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error!.code).toBe(ValidationErrorCode.FORBIDDEN_TAG_CONFLICT);
            expect(result.error!.message).toContain('SOLAR');
        });

        it('❌ deve BLOQUEAR Arco Longo em Cavaleiro (não é RANGED)', () => {
            // Cavaleiro não tem tag RANGED, então falha no allowedTags primeiro
            const result = validateEquipment(knight, longbow);

            expect(result.isValid).toBe(false);
            // Arco requer RANGED, cavaleiro não tem
            expect(result.error!.code).toBe(ValidationErrorCode.MISSING_REQUIRED_TAG);
        });

        it('❌ deve BLOQUEAR Relíquia das Sombras em Mago SOLAR (não tem VOID/DEMON)', () => {
            // Mago não tem VOID nem DEMON, então falha no allowedTags primeiro
            const result = validateEquipment(mage, shadowRelic);

            expect(result.isValid).toBe(false);
            // Relíquia requer VOID ou DEMON, mago não tem
            expect(result.error!.code).toBe(ValidationErrorCode.MISSING_REQUIRED_TAG);
        });

        it('❌ deve BLOQUEAR Armadura em Mago (slot não disponível)', () => {
            const result = validateEquipment(mage, steelPlate);

            expect(result.isValid).toBe(false);
            expect(result.error!.code).toBe(ValidationErrorCode.INVALID_SLOT);
        });

        it('❌ deve BLOQUEAR Espada de Fogo em Arqueira (tag NATURE é forbidden)', () => {
            const result = validateEquipment(archer, swordFlame);

            expect(result.isValid).toBe(false);
            expect(result.error!.code).toBe(ValidationErrorCode.FORBIDDEN_TAG_CONFLICT);
            expect(result.error!.message).toContain('NATURE');
        });
    });

    // ==========================================
    // TESTES: calculateCardCost
    // ==========================================

    describe('calculateCardCost()', () => {
        it('deve calcular custo base + peso dos itens', () => {
            // Cavaleiro (3) + Espada de Fogo (1) + Armadura (1) = 5
            const cost = calculateCardCost(knight, [swordFlame, steelPlate]);
            expect(cost).toBe(5);
        });

        it('deve retornar apenas custo base se não houver itens', () => {
            const cost = calculateCardCost(mage, []);
            expect(cost).toBe(4); // Mago custa 4 de base
        });

        it('deve somar múltiplos itens corretamente', () => {
            // Arqueira (3) + Arco (1) = 4
            const cost = calculateCardCost(archer, [longbow]);
            expect(cost).toBe(4);
        });
    });

    // ==========================================
    // TESTES: validateDeck (integração)
    // ==========================================

    describe('validateDeck()', () => {
        const mockInventory: PlayerInventory = {
            playerId: 'test_player',
            unlockedUnits: ['knight_base', 'archer_base', 'mage_base'],
            ownedItems: ['sword_flame_t1', 'longbow_t2', 'steel_plate_t2', 'staff_ice_t1', 'shadow_relic'],
        };

        it('✅ deve validar deck completamente válido', () => {
            const deck: PlayerDeck = {
                deckId: 'valid_deck',
                playerId: 'test_player',
                deckName: 'Deck Válido',
                cards: [
                    { slotIndex: 0, baseUnitId: 'knight_base', equippedItems: ['sword_flame_t1'] },
                    { slotIndex: 1, baseUnitId: 'archer_base', equippedItems: ['longbow_t2'] },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = validateDeck(deck, mockInventory);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('❌ deve falhar para deck vazio', () => {
            const deck: PlayerDeck = {
                deckId: 'empty_deck',
                playerId: 'test_player',
                deckName: 'Deck Vazio',
                cards: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = validateDeck(deck, mockInventory);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.code === ValidationErrorCode.EMPTY_DECK)).toBe(true);
        });

        it('❌ deve falhar para unidade não possuída', () => {
            const limitedInventory: PlayerInventory = {
                playerId: 'test_player',
                unlockedUnits: ['knight_base'], // Não tem archer
                ownedItems: ['longbow_t2'],
            };

            const deck: PlayerDeck = {
                deckId: 'invalid_deck',
                playerId: 'test_player',
                deckName: 'Deck Inválido',
                cards: [
                    { slotIndex: 0, baseUnitId: 'archer_base', equippedItems: [] },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = validateDeck(deck, limitedInventory);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.code === ValidationErrorCode.UNIT_NOT_OWNED)).toBe(true);
        });

        it('❌ deve falhar para item não possuído', () => {
            const limitedInventory: PlayerInventory = {
                playerId: 'test_player',
                unlockedUnits: ['knight_base'],
                ownedItems: [], // Não tem nenhum item
            };

            const deck: PlayerDeck = {
                deckId: 'invalid_deck',
                playerId: 'test_player',
                deckName: 'Deck Inválido',
                cards: [
                    { slotIndex: 0, baseUnitId: 'knight_base', equippedItems: ['sword_flame_t1'] },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = validateDeck(deck, limitedInventory);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.code === ValidationErrorCode.ITEM_NOT_OWNED)).toBe(true);
        });

        it('❌ deve detectar múltiplos erros no mesmo deck', () => {
            const deck: PlayerDeck = {
                deckId: 'multi_error_deck',
                playerId: 'test_player',
                deckName: 'Deck com Múltiplos Erros',
                cards: [
                    {
                        slotIndex: 0,
                        baseUnitId: 'mage_base',
                        // staff_ice: forbidden para SOLAR (erro 1)
                        // shadow_relic: requer VOID/DEMON que mago não tem (erro 2)
                        equippedItems: ['staff_ice_t1', 'shadow_relic'],
                    },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = validateDeck(deck, mockInventory);
            expect(result.isValid).toBe(false);
            // Deve ter pelo menos 2 erros (um para cada item inválido)
            expect(result.errors.length).toBeGreaterThanOrEqual(2);
        });
    });

    // ==========================================
    // TESTES: validateCard
    // ==========================================

    describe('validateCard()', () => {
        it('deve retornar erro para unidade inexistente', () => {
            const errors = validateCard({
                slotIndex: 0,
                baseUnitId: 'nonexistent_unit',
                equippedItems: [],
            }, 0);

            expect(errors.length).toBe(1);
            expect(errors[0].code).toBe(ValidationErrorCode.UNIT_NOT_FOUND);
        });

        it('deve retornar erro para item inexistente', () => {
            const errors = validateCard({
                slotIndex: 0,
                baseUnitId: 'knight_base',
                equippedItems: ['nonexistent_item'],
            }, 0);

            expect(errors.some((e) => e.code === ValidationErrorCode.ITEM_NOT_FOUND)).toBe(true);
        });

        it('deve detectar slot duplicado (dois itens de weapon)', () => {
            // swordFlame e staffIce são ambos 'weapon'
            // (mesmo que staffIce falharia por outro motivo no knight)
            const errors = validateCard({
                slotIndex: 0,
                baseUnitId: 'knight_base',
                equippedItems: ['sword_flame_t1', 'sword_flame_t1'], // Mesmo item duplicado
            }, 0);

            expect(errors.some((e) => e.code === ValidationErrorCode.DUPLICATE_SLOT)).toBe(true);
        });
    });
});
