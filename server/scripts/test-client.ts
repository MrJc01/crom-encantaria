/**
 * Magic Royale - Test Client
 * 
 * Script mock para testar conexão WebSocket.
 * Simula um cliente conectando, entrando na fila e recebendo mensagens.
 * 
 * Uso: npx tsx scripts/test-client.ts [port] [player_name]
 * 
 * @module scripts/test-client
 */

import WebSocket from 'ws';

// Configuração
const PORT = process.argv[2] || '3000';
const PLAYER_NAME = process.argv[3] || `Player_${Date.now() % 1000}`;
const URL = `ws://localhost:${PORT}`;

console.log('====================================');
console.log('   🧪 MAGIC ROYALE TEST CLIENT     ');
console.log('====================================\n');

console.log(`[Client] Conectando a ${URL}...`);
console.log(`[Client] Nome: ${PLAYER_NAME}\n`);

// Criar conexão WebSocket
const ws = new WebSocket(URL);

// Contadores para estatísticas
let tickCount = 0;
let lastTickTime = Date.now();
let matchStarted = false;

// ============================================
// EVENT HANDLERS
// ============================================

ws.on('open', () => {
    console.log('✅ Conectado ao servidor!\n');

    // Enviar QUEUE_JOIN
    console.log('[Client] Enviando QUEUE_JOIN...\n');
    ws.send(JSON.stringify({
        type: 'QUEUE_JOIN',
        deckId: 'deck_test_001',
    }));
});

ws.on('message', (data: Buffer) => {
    try {
        const message = JSON.parse(data.toString());
        handleMessage(message);
    } catch (error) {
        console.error('[Client] Erro ao parsear mensagem:', error);
    }
});

ws.on('close', (code: number, reason: Buffer) => {
    console.log(`\n❌ Conexão fechada. Código: ${code}`);
    if (reason.length > 0) {
        console.log(`   Motivo: ${reason.toString()}`);
    }
    process.exit(0);
});

ws.on('error', (error: Error) => {
    console.error('\n❌ Erro de conexão:', error.message);
    process.exit(1);
});

// ============================================
// MESSAGE HANDLERS
// ============================================

function handleMessage(message: any): void {
    switch (message.type) {
        case 'QUEUE_JOINED':
            console.log(`📋 Entrou na fila! Posição: ${message.position}`);
            console.log('   Aguardando oponente...\n');
            break;

        case 'MATCH_START':
            handleMatchStart(message);
            break;

        case 'ENTITY_SPAWNED':
            handleEntitySpawned(message);
            break;

        case 'GAME_TICK':
            handleGameTick(message);
            break;

        case 'MATCH_END':
            handleMatchEnd(message);
            break;

        case 'ERROR':
            console.error(`❌ Erro do servidor: [${message.code}] ${message.message}`);
            break;

        default:
            console.log(`📩 Mensagem recebida: ${message.type}`);
            console.log(JSON.stringify(message, null, 2));
    }
}

function handleMatchStart(message: any): void {
    matchStarted = true;
    console.log('🎮 PARTIDA INICIADA!\n');
    console.log(`   📍 Sala: ${message.roomId}`);
    console.log(`   👤 Você: Player ${message.you.playerIndex} (${message.you.playerId})`);
    console.log(`   👥 Oponente: Player ${message.opponent.playerIndex} (${message.opponent.playerId})`);
    console.log(`   ⏱️ Tick Rate: ${message.tickRate}Hz`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Spawnar uma unidade de teste após 2 segundos
    setTimeout(() => {
        console.log('[Client] Enviando SPAWN_CARD...');
        ws.send(JSON.stringify({
            type: 'SPAWN_CARD',
            cardIndex: 0,
            x: 15,
            y: 10,
        }));
    }, 2000);
}

function handleEntitySpawned(message: any): void {
    const entity = message.entity;
    console.log(`✨ Entidade spawnada: ${entity.id}`);
    console.log(`   Owner: ${entity.ownerId} | Unit: ${entity.unitId} | HP: ${entity.maxHp}`);
    console.log(`   Pos: (${entity.position.x}, ${entity.position.y})\n`);
}

function handleGameTick(message: any): void {
    tickCount++;
    const now = Date.now();

    // Mostrar resumo a cada 20 ticks (1 segundo)
    if (tickCount % 20 === 0) {
        const elapsed = (now - lastTickTime) / 1000;
        const ticksPerSecond = 20 / elapsed;
        lastTickTime = now;

        const payload = message.payload;
        console.log(
            `[Tick ${payload.tick}] ` +
            `Mana: P1=${payload.mana1} P2=${payload.mana2} | ` +
            `Entidades: ${payload.entities.length} | ` +
            `TPS: ${ticksPerSecond.toFixed(1)}`
        );
    }
}

function handleMatchEnd(message: any): void {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 PARTIDA ENCERRADA!\n');
    console.log(`   🏆 Vencedor: ${message.winnerId}`);
    console.log(`   📝 Motivo: ${message.reason}`);
    console.log(`   📊 Total de ticks recebidos: ${tickCount}`);
    console.log('');

    // Fechar conexão após 2 segundos
    setTimeout(() => {
        ws.close();
    }, 2000);
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGINT', () => {
    console.log('\n[Client] Encerrando...');
    ws.close();
    process.exit(0);
});

console.log('[Client] Aguardando conexão...\n');
