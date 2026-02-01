/**
 * Magic Royale - Server Entry Point
 *
 * Ponto de entrada do servidor de jogo.
 * FASE 3: Servidor WebSocket Multiplayer Online.
 *
 * @module server/index
 */
import { SocketManager } from './socket-manager.js';
console.log('====================================');
console.log('   🎮 MAGIC ROYALE SERVER v0.3.0   ');
console.log('   FASE 3: Real-Time WebSocket     ');
console.log('====================================\n');
// --------------------------------------------
// 1. Configuração do Servidor
// --------------------------------------------
const PORT = parseInt(process.env.PORT || '3000', 10);
const TICK_RATE = parseInt(process.env.TICK_RATE || '20', 10);
const MAX_GAME_DURATION = parseInt(process.env.MAX_DURATION || '180', 10);
console.log('[Config] Configurações do servidor:');
console.log(`   📡 Porta: ${PORT}`);
console.log(`   ⏱️ Tick Rate: ${TICK_RATE}Hz`);
console.log(`   ⏳ Duração Máxima: ${MAX_GAME_DURATION}s\n`);
// --------------------------------------------
// 2. Inicializar SocketManager
// --------------------------------------------
const socketManager = SocketManager.getInstance({
    port: PORT,
    tickRate: TICK_RATE,
    maxGameDuration: MAX_GAME_DURATION,
    verbose: true,
});
// --------------------------------------------
// 3. Graceful Shutdown
// --------------------------------------------
function gracefulShutdown(signal) {
    console.log(`\n[Server] Recebido ${signal}. Encerrando...`);
    socketManager.stop();
    process.exit(0);
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// --------------------------------------------
// 4. Stats periódicas
// --------------------------------------------
setInterval(() => {
    const stats = socketManager.getStats();
    console.log(`[Stats] Conectados: ${stats.connected} | ` +
        `Fila: ${stats.inQueue} | ` +
        `Em Jogo: ${stats.inGame} | ` +
        `Salas: ${stats.rooms}`);
}, 30000); // A cada 30 segundos
// --------------------------------------------
// 5. Iniciar Servidor
// --------------------------------------------
console.log('[Server] Iniciando servidor WebSocket...\n');
socketManager.start();
console.log('');
console.log('🎯 Servidor pronto para conexões!');
console.log('   Para testar: npx tsx scripts/test-client.ts');
console.log('');
console.log('[Server] Use Ctrl+C para encerrar.\n');
//# sourceMappingURL=index.js.map