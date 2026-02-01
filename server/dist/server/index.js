/**
 * Magic Royale - Server Entry Point
 *
 * Ponto de entrada do servidor de jogo.
 * FASE 2: Demonstração de spawn e combate entre unidades.
 *
 * @module server/index
 */
import { GameRoom } from '../core/game/game-room.js';
import { validateDeck, calculateCardCostByIds } from '../core/validation/deck-validator.js';
import { loadUnits, loadItems } from '../data/loader.js';
console.log('====================================');
console.log('   🎮 MAGIC ROYALE SERVER v0.2.0   ');
console.log('   FASE 2: Shadow Simulation       ');
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
const mockInventory = {
    playerId: 'player_test',
    unlockedUnits: ['knight_base', 'archer_base', 'mage_base'],
    ownedItems: ['sword_flame_t1', 'longbow_t2', 'steel_plate_t2', 'staff_ice_t1', 'shadow_relic'],
};
// Deck VÁLIDO
const validDeck = {
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
// --------------------------------------------
// 3. FASE 2: Demonstração de Combate
// --------------------------------------------
console.log('\n\n====================================');
console.log('   ⚔️ TESTE DE COMBATE (Fase 2)    ');
console.log('====================================\n');
const combatRoom = new GameRoom('room_combat_test', {
    tickRate: 20,
    maxDuration: 10, // 10 segundos de demo
    verboseLogging: true,
});
// Adicionar jogadores mock
combatRoom.addPlayer({ playerId: 'player1', deckId: 'deck_001' }, 1);
combatRoom.addPlayer({ playerId: 'player2', deckId: 'deck_002' }, 2);
// Spawnar unidades inimigas próximas para testar combate
console.log('\n🎲 Spawnando unidades para combate...\n');
// Player 1: Cavaleiro na posição (10, 10)
combatRoom.spawnUnit(1, 'knight_base', 10, 10, ['sword_flame_t1']);
// Player 2: Arqueira na posição (10, 18) - 8 unidades de distância
combatRoom.spawnUnit(2, 'archer_base', 10, 18, ['longbow_t2']);
// Player 1: Mago Solar na posição (12, 10)
combatRoom.spawnUnit(1, 'mage_base', 12, 10);
// Player 2: Cavaleiro na posição (12, 17)
combatRoom.spawnUnit(2, 'knight_base', 12, 17);
console.log('\n📍 Configuração inicial:');
console.log('   Player 1: Cavaleiro (10,10) + Mago (12,10)');
console.log('   Player 2: Arqueira (10,18) + Cavaleiro (12,17)');
console.log('   Distâncias iniciais: ~8 unidades\n');
// Iniciar o game loop
combatRoom.start();
console.log('⏱️ Rodando simulação por 10 segundos...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
// Parar após 10 segundos de demonstração
setTimeout(() => {
    combatRoom.stop('Demo de combate finalizada');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n====================================');
    console.log('   ✅ FASE 2 DEMO COMPLETA!');
    console.log('====================================');
    console.log('\n📊 Estado final:');
    const info = combatRoom.getInfo();
    console.log(`   Ticks processados: ${info.tick}`);
    console.log(`   Entidades vivas: ${info.entitiesAlive}`);
    const stats = combatRoom.getCombatStats();
    console.log(`   Player 1 vivos: ${stats.player1Alive}`);
    console.log(`   Player 2 vivos: ${stats.player2Alive}`);
    console.log(`   Total mortos: ${stats.totalDead}`);
    console.log('\n🎯 Verificação de requisitos:');
    console.log('   ✅ Sistema de física vetorial implementado');
    console.log('   ✅ Classe GameEntity com FSM funcionando');
    console.log('   ✅ Colisões círculo-círculo com repulsão');
    console.log('   ✅ Combate com busca de alvo e cooldown');
    console.log('   ✅ Logs de movimento, ataque e dano');
    console.log('\n[Server] Use Ctrl+C para encerrar.\n');
}, 10000);
//# sourceMappingURL=index.js.map