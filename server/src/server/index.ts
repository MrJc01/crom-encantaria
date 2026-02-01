/**
 * Magic Royale - Server Entry Point
 * 
 * Ponto de entrada do servidor de jogo.
 * Por enquanto, apenas demonstra o GameRoom e validação de deck.
 * 
 * @module server/index
 */

import { GameRoom } from '../core/game/game-room.js';
import { validateDeck, calculateCardCostByIds } from '../core/validation/deck-validator.js';
import { loadUnits, loadItems } from '../data/loader.js';
import type { PlayerDeck, PlayerInventory } from '../core/types/deck.js';

console.log('====================================');
console.log('   🎮 MAGIC ROYALE SERVER v0.1.0   ');
console.log('====================================\n');

// --------------------------------------------
// 1. Carregar dados do catálogo
// --------------------------------------------
console.log('[Boot] Carregando catálogo de unidades e itens...\n');
const units = loadUnits();
const items = loadItems();

console.log('\n📋 Unidades disponíveis:');
for (const [id, unit] of units) {
    console.log(`   - ${unit.name} (${id}): ${unit.tags.join(', ')} | Custo: ${unit.manaCost} mana`);
}

console.log('\n⚔️ Itens disponíveis:');
for (const [id, item] of items) {
    const forbidden = item.requirements.forbiddenTags.length > 0
        ? `❌ ${item.requirements.forbiddenTags.join(', ')}`
        : '';
    console.log(`   - ${item.name} (${id}): Slot=${item.slot} | +${item.manaWeight} mana ${forbidden}`);
}

// --------------------------------------------
// 2. Demonstração: Validação de Deck
// --------------------------------------------
console.log('\n\n====================================');
console.log('   📝 TESTE DE VALIDAÇÃO DE DECK   ');
console.log('====================================\n');

// Inventário mock do jogador
const mockInventory: PlayerInventory = {
    playerId: 'player_test',
    unlockedUnits: ['knight_base', 'archer_base', 'mage_base'],
    ownedItems: ['sword_flame_t1', 'longbow_t2', 'steel_plate_t2', 'staff_ice_t1', 'shadow_relic'],
};

// Deck VÁLIDO
const validDeck: PlayerDeck = {
    deckId: 'deck_valid_01',
    playerId: 'player_test',
    deckName: 'Deck de Teste Válido',
    cards: [
        {
            slotIndex: 0,
            baseUnitId: 'knight_base',
            equippedItems: ['sword_flame_t1', 'steel_plate_t2'], // Válido: Knight é HUMAN/STEEL
        },
        {
            slotIndex: 1,
            baseUnitId: 'archer_base',
            equippedItems: ['longbow_t2'], // Válido: Archer é RANGED
        },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
};

console.log('📗 Testando deck VÁLIDO:');
const validResult = validateDeck(validDeck, mockInventory);
console.log(`   Resultado: ${validResult.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
if (validResult.errors.length > 0) {
    for (const err of validResult.errors) {
        console.log(`   - [${err.code}] ${err.message}`);
    }
}

// Calcular custos
console.log('\n   💰 Custos das cartas:');
for (const card of validDeck.cards) {
    const cost = calculateCardCostByIds(card.baseUnitId, card.equippedItems);
    console.log(`      - Carta ${card.slotIndex}: ${cost} mana`);
}

// Deck INVÁLIDO #1: Item com forbiddenTag
const invalidDeck1: PlayerDeck = {
    deckId: 'deck_invalid_01',
    playerId: 'player_test',
    deckName: 'Deck Inválido - Forbidden Tag',
    cards: [
        {
            slotIndex: 0,
            baseUnitId: 'mage_base', // SOLAR
            equippedItems: ['staff_ice_t1'], // ❌ Staff de Gelo proíbe SOLAR
        },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
};

console.log('\n\n📕 Testando deck INVÁLIDO #1 (Mago SOLAR + Cajado de Gelo):');
const invalidResult1 = validateDeck(invalidDeck1, mockInventory);
console.log(`   Resultado: ${invalidResult1.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
for (const err of invalidResult1.errors) {
    console.log(`   - [${err.code}] ${err.message}`);
}

// Deck INVÁLIDO #2: Item em slot errado
const invalidDeck2: PlayerDeck = {
    deckId: 'deck_invalid_02',
    playerId: 'player_test',
    deckName: 'Deck Inválido - Slot Errado',
    cards: [
        {
            slotIndex: 0,
            baseUnitId: 'mage_base', // Mago não tem slot de armor
            equippedItems: ['steel_plate_t2'], // ❌ Armadura precisa do slot 'armor'
        },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
};

console.log('\n\n📕 Testando deck INVÁLIDO #2 (Mago + Armadura):');
const invalidResult2 = validateDeck(invalidDeck2, mockInventory);
console.log(`   Resultado: ${invalidResult2.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
for (const err of invalidResult2.errors) {
    console.log(`   - [${err.code}] ${err.message}`);
}

// Deck INVÁLIDO #3: Item com allowedTags que a unidade não tem
const invalidDeck3: PlayerDeck = {
    deckId: 'deck_invalid_03',
    playerId: 'player_test',
    deckName: 'Deck Inválido - Allowed Tags',
    cards: [
        {
            slotIndex: 0,
            baseUnitId: 'knight_base', // MELEE
            equippedItems: ['longbow_t2'], // ❌ Arco requer RANGED e proíbe MELEE
        },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
};

console.log('\n\n📕 Testando deck INVÁLIDO #3 (Cavaleiro MELEE + Arco RANGED):');
const invalidResult3 = validateDeck(invalidDeck3, mockInventory);
console.log(`   Resultado: ${invalidResult3.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
for (const err of invalidResult3.errors) {
    console.log(`   - [${err.code}] ${err.message}`);
}

// --------------------------------------------
// 3. Demonstração: GameRoom Tick Loop
// --------------------------------------------
console.log('\n\n====================================');
console.log('   🎮 TESTE DO GAME ROOM (5 segundos)   ');
console.log('====================================\n');

const room = new GameRoom('room_demo_001', {
    tickRate: 20,
    maxDuration: 180,
});

// Adicionar jogadores mock
room.addPlayer({ playerId: 'player1', deckId: 'deck_001' }, 1);
room.addPlayer({ playerId: 'player2', deckId: 'deck_002' }, 2);

// Iniciar o game loop
room.start();

// Parar após 5 segundos de demonstração
setTimeout(() => {
    room.stop('Demo finalizada');
    console.log('\n====================================');
    console.log('   ✅ DEMO COMPLETA!');
    console.log('====================================');
    console.log('\nInfo final da sala:', room.getInfo());
    console.log('\n[Server] Use Ctrl+C para encerrar.\n');
}, 5000);
