
import { GameRoom } from '../core/game/game-room.js';
import { getDistance } from '../core/game/physics.js';
import type { CardConfig } from '@crom/shared';



// Mock Player Data
const MOCK_P1_ID = 'player-1-uuid';
const MOCK_P2_ID = 'player-2-uuid';
const MOCK_DECK_ID = 'deck-1';

// Create a simple deck with a Knight
const knightCard: CardConfig = {
    slotIndex: 0,
    baseUnitId: 'knight_base', // Cost 3
    equippedItems: []
};

const mockDeck: CardConfig[] = [
    knightCard,
    { slotIndex: 1, baseUnitId: 'archer_base', equippedItems: [] }, // Cost 3
    { slotIndex: 2, baseUnitId: 'mage_solar', equippedItems: [] }, // Cost 4
];

console.log('=== STARTING SIMULATION HARDENING TEST ===');

// 1. Initialize GameRoom
const room = new GameRoom('sim-room-01', {
    tickRate: 20,
    initialMana: 5, // Starts with 5 mana
    verboseLogging: false
});

// 2. Add Players
room.addPlayer({
    playerId: MOCK_P1_ID,
    deckId: MOCK_DECK_ID,
    deckCards: mockDeck
}, 1);

room.addPlayer({
    playerId: MOCK_P2_ID,
    deckId: MOCK_DECK_ID,
    deckCards: mockDeck
}, 2);

if (!room.isReady()) {
    console.error('❌ Room failed to initialize players');
    process.exit(1);
}
console.log('✅ Room initialized with 2 players');

// 3. Start Game
room.start();
console.log('✅ Game started');

// Helper to run ticks
function runTicks(count: number) {
    // Need to access tick() internally or wait. 
    // Since GameRoom uses setInterval, we can just wait via setTimeout in real integration tests,
    // but for deterministic testing, we ideally want to step the simulation manually.
    // However, GameRoom.tick() is private. 
    // For this hardening script, we will listen to state changes or just wait.
    // Ideally we should make tick() protected or public for testing, OR just use the public start() and wait.
    // Let's use start() and a delay since we want to mimic the real loop.
    return new Promise(resolve => setTimeout(resolve, count * (1000 / 20)));
}

async function runTest() {
    // Wait for a few ticks to assert mana regen
    await runTicks(20); // 1 second -> +0.05 mana (regen is 1/s, tickrate 20) -> actually regen is handled per tick
    // Default manaRegenRate is 1.0 per second. At 20 ticks/sec, that's 0.05 per tick.
    // 20 ticks = 1.0 mana added.
    // Initial 5. 
    // Expect P1 Mana ~ 6.0

    let state = room.getState();
    console.log(`[T+1s] Mana P1: ${state.mana.player1.toFixed(1)} (Expected ~6.0)`);
    if (state.mana.player1 < 5.8) {
        console.error('❌ Mana regen validation failed');
        process.exit(1);
    }

    // ==========================================
    // TEST CASE 1: Valid Spawn
    // ==========================================
    console.log('\n--- TEST CASE 1: Valid Spawn ---');
    // Spawn Knight (Cost 3) at valid position (x=10, y=5) for Player 1 (Zone 0-15)
    // Card Index 0 is Knight
    const success1 = room.handleSpawnRequest(1, 0, 10, 5);

    if (!success1) {
        console.error('❌ Valid spawn failed');
        process.exit(1);
    }

    // Check Mana Deduction
    // Was ~6.0, Cost 3 -> Expect ~3.0
    state = room.getState();
    console.log(`Spawned Knight. New Mana P1: ${state.mana.player1.toFixed(1)}`);

    if (state.mana.player1 > 3.5) {
        console.error('❌ Mana deduction failed');
        process.exit(1);
    }

    // Check Entity Existence
    const entity = room.getEntities().find(e => e.ownerId === 'player1' && e.unitId === 'knight_base');
    if (!entity) {
        console.error('❌ Entity not found in state');
        process.exit(1);
    }
    console.log('✅ Valid spawn passed: Mana deducted & Entity created');

    // ==========================================
    // TEST CASE 2: Invalid Position (Anti-Cheat)
    // ==========================================
    console.log('\n--- TEST CASE 2: Invalid Position ---');
    // Player 1 tries to spawn in Player 2 zone (y=30)
    const success2 = room.handleSpawnRequest(1, 0, 10, 30);

    if (success2) {
        console.error('❌ Invalid position spawn SHOULD fail but succeeded');
        process.exit(1);
    }
    console.log('✅ Invalid position rejected correctly');

    // ==========================================
    // TEST CASE 3: Insufficient Mana
    // ==========================================
    console.log('\n--- TEST CASE 3: Insufficient Mana ---');
    // Drain mana first? P1 has ~3.0.
    // Mage cost 4 (Index 2).
    // Try to spawn Mage.
    const success3 = room.handleSpawnRequest(1, 2, 12, 5);

    if (success3) {
        console.error(`❌ Insufficient mana spawn SHOULD fail. Mana: ${state.mana.player1}`);
        process.exit(1);
    }
    console.log('✅ Insufficient mana rejected correctly');

    // ==========================================
    // TEST CASE 4: AI Autonomous Movement
    // ==========================================
    console.log('\n--- TEST CASE 4: AI Autonomous Movement ---');
    // Wait for mana to regen (needs 3)
    console.log('Waiting for mana regen...');
    await runTicks(60);

    // Spawn a P1 Knight. It should move towards P2 towers (y=35+)
    const success4 = room.handleSpawnRequest(1, 0, 15, 5); // P1 Knight at (15, 5)
    if (!success4) {
        state = room.getState();
        console.error(`❌ TEST CASE 4: Spawn failed. Mana: ${state.mana.player1.toFixed(1)}`);
        process.exit(1);
    }

    const p1Knight = room.getEntities().find(e => e.ownerId === 'player1' && e.unitId === 'knight_base' && e.position.y < 10);
    const initialY = p1Knight!.position.y;

    console.log(`Knight spawned at Y: ${initialY}. Waiting for move...`);
    await runTicks(40); // 2 seconds

    const currentY = p1Knight!.position.y;
    console.log(`Knight position after 2s: Y=${currentY.toFixed(2)}`);

    if (currentY <= initialY) {
        console.error('❌ AI Movement failed: Unit is not moving forward');
        process.exit(1);
    }
    console.log('✅ AI Movement passed: Unit is moving towards enemy objective');

    // ==========================================
    // TEST CASE 5: Aggro (Target Switching)
    // ==========================================
    console.log('\n--- TEST CASE 5: Aggro (Target Switching) ---');
    // 1. Spawn P1 Archer at the edge of its zone (y=15)
    // Use Archer (Index 1) because it has more aggroRange (10.0)
    const successSpawnP1 = room.handleSpawnRequest(1, 1, 10, 15);
    if (!successSpawnP1) {
        console.error('❌ Aggro Test: P1 Spawn failed');
        process.exit(1);
    }
    const aggroArcher = room.getEntities().find(e => e.ownerId === 'player1' && e.unitId === 'archer_base' && e.position.y > 10);

    // 2. Initially it should target a P2 tower (dist ~20-25)
    await runTicks(1);
    console.log(`Initial Target: ${aggroArcher!.targetId}`);
    if (!aggroArcher!.targetId?.startsWith('t2')) {
        console.error('❌ Aggro Test: Initial target should be a P2 tower');
        process.exit(1);
    }

    // 3. Spawn P2 Unit at the edge of its zone (y=25)
    // Distance (10, 15) to (10, 25) is exactly 10.0
    const successSpawnP2 = room.handleSpawnRequest(2, 0, 10, 25);
    if (!successSpawnP2) {
        state = room.getState();
        console.error(`❌ Aggro Test: P2 Spawn failed. Mana: ${state.mana.player2.toFixed(1)}`);
        process.exit(1);
    }
    const p2Knight = room.getEntities().find(e => e.ownerId === 'player2' && e.unitId === 'knight_base' && e.position.y < 30);

    await runTicks(5); // Wait for combat system to update and move slightly
    const dist = getDistance(aggroArcher!.position, p2Knight!.position);
    console.log(`Target after P2 spawn: ${aggroArcher!.targetId} (Distance: ${dist.toFixed(2)})`);

    if (aggroArcher!.targetId !== p2Knight!.id) {
        console.error(`❌ Aggro Test failed: Unit did not switch target to nearby enemy unit. AggroRange: ${aggroArcher!.stats.aggroRange}`);
        process.exit(1);
    }
    console.log('✅ Aggro Test passed: Archer prioritized enemy Knight over Tower');


    console.log('\n=== ALL HARDENING TESTS PASSED ===');


    room.stop();
    process.exit(0);
}

runTest();
