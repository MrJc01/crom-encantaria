/**
 * Magic Royale - Game Room
 *
 * Gerencia uma instância de partida 1v1.
 * Implementa o tick loop a 20Hz para simulação autoritativa.
 *
 * FASE 3: Integração com WebSocket e broadcast de estado.
 *
 * @module core/game/game-room
 */
import { PhysicsSystem } from './physics.js';
import { createEntity } from './entity.js';
import { CombatSystem } from './combat.js';
import { getUnitById, getItemById } from '../../data/loader.js';
import { S2CMessageType, stateToCode, } from '../net/protocol.js';
const DEFAULT_CONFIG = {
    tickRate: 20,
    maxDuration: 180,
    initialMana: 5,
    manaRegenRate: 1,
    verboseLogging: true,
};
/**
 * Classe que gerencia uma sala de jogo (partida 1v1).
 *
 * Responsabilidades:
 * - Manter o estado do jogo
 * - Rodar o tick loop a 20Hz
 * - Processar ações dos jogadores
 * - Gerenciar entidades, física e combate
 * - Broadcast do estado (futuro)
 */
export class GameRoom {
    roomId;
    player1 = null;
    player2 = null;
    gameState;
    config;
    tickInterval = null;
    tickDuration; // ms entre ticks
    // ========== FASE 3: WebSocket ==========
    broadcastFn = null;
    onGameEnd = null;
    // ========== Sistemas de Jogo ==========
    physicsSystem;
    combatSystem;
    entities;
    entityCounter;
    constructor(roomId, config) {
        this.roomId = roomId;
        const { broadcastFn, onGameEnd, ...restConfig } = config || {};
        this.config = { ...DEFAULT_CONFIG, ...restConfig };
        this.tickDuration = 1000 / this.config.tickRate; // 50ms para 20Hz
        // Callbacks WebSocket
        this.broadcastFn = broadcastFn ?? null;
        this.onGameEnd = onGameEnd ?? null;
        // Inicializar sistemas
        this.physicsSystem = new PhysicsSystem();
        this.combatSystem = new CombatSystem({ logAttacks: this.config.verboseLogging });
        this.entities = [];
        this.entityCounter = 0;
        // Inicializar estado do jogo
        this.gameState = this.createInitialState();
        console.log(`[GameRoom] Sala "${roomId}" criada. TickRate: ${this.config.tickRate}Hz`);
    }
    /**
     * Cria o estado inicial do jogo.
     */
    createInitialState() {
        return {
            tick: 0,
            mana: {
                player1: this.config.initialMana,
                player2: this.config.initialMana,
            },
            entities: [],
            towers: this.createInitialTowers(),
            startTime: 0,
            isRunning: false,
        };
    }
    /**
     * Cria as torres iniciais do mapa.
     */
    createInitialTowers() {
        // Layout baseado na documentação:
        // Player1 na parte inferior, Player2 na parte superior
        // Duas torres laterais + core central para cada jogador
        return [
            // Torres do Player 1 (inferior)
            { id: 't1_left', ownerId: 'player1', position: { x: 5, y: 5 }, health: 2500, maxHealth: 2500 },
            { id: 't1_right', ownerId: 'player1', position: { x: 25, y: 5 }, health: 2500, maxHealth: 2500 },
            { id: 't1_core', ownerId: 'player1', position: { x: 15, y: 2 }, health: 4000, maxHealth: 4000 },
            // Torres do Player 2 (superior)
            { id: 't2_left', ownerId: 'player2', position: { x: 5, y: 35 }, health: 2500, maxHealth: 2500 },
            { id: 't2_right', ownerId: 'player2', position: { x: 25, y: 35 }, health: 2500, maxHealth: 2500 },
            { id: 't2_core', ownerId: 'player2', position: { x: 15, y: 38 }, health: 4000, maxHealth: 4000 },
        ];
    }
    /**
     * Adiciona um jogador à sala.
     */
    addPlayer(player, slot) {
        if (slot === 1 && !this.player1) {
            this.player1 = player;
            console.log(`[GameRoom ${this.roomId}] Player1 conectado: ${player.playerId}`);
            return true;
        }
        if (slot === 2 && !this.player2) {
            this.player2 = player;
            console.log(`[GameRoom ${this.roomId}] Player2 conectado: ${player.playerId}`);
            return true;
        }
        return false;
    }
    /**
     * Verifica se a sala está pronta para iniciar.
     */
    isReady() {
        return this.player1 !== null && this.player2 !== null;
    }
    /**
     * Inicia o game loop.
     */
    start() {
        if (this.gameState.isRunning) {
            console.warn(`[GameRoom ${this.roomId}] Tentativa de iniciar sala já em execução.`);
            return;
        }
        console.log(`[GameRoom ${this.roomId}] 🎮 Iniciando partida a ${this.config.tickRate}Hz...`);
        this.gameState.isRunning = true;
        this.gameState.startTime = Date.now();
        // Iniciar tick loop
        this.tickInterval = setInterval(() => {
            this.tick();
        }, this.tickDuration);
    }
    /**
     * Para o game loop.
     */
    stop(reason = 'Partida encerrada') {
        if (!this.gameState.isRunning) {
            return;
        }
        console.log(`[GameRoom ${this.roomId}] 🛑 Parando partida: ${reason}`);
        this.gameState.isRunning = false;
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
        // Log final de estatísticas
        const stats = this.combatSystem.getStats(this.entities);
        console.log(`[GameRoom ${this.roomId}] 📊 Estatísticas finais: ` +
            `P1: ${stats.player1Alive} vivos | P2: ${stats.player2Alive} vivos | ` +
            `Total mortos: ${stats.totalDead}`);
    }
    // ============================================
    // FASE 2: SPAWN DE UNIDADES
    // ============================================
    /**
     * Spawna uma unidade na arena.
     * Calcula stats finais somando base + equipamentos.
     *
     * @param playerIndex 1 ou 2
     * @param unitId ID da unidade base do catálogo
     * @param x Posição X de spawn
     * @param y Posição Y de spawn
     * @param equippedItems Lista de IDs de itens equipados
     * @returns A entidade criada ou null se falhar
     */
    spawnUnit(playerIndex, unitId, x, y, equippedItems = []) {
        const unit = getUnitById(unitId);
        if (!unit) {
            console.error(`[GameRoom ${this.roomId}] Unidade não encontrada: ${unitId}`);
            return null;
        }
        // Calcular stats finais
        const finalStats = this.calculateFinalStats(unit.baseStats, equippedItems);
        // Gerar ID único
        this.entityCounter++;
        const entityId = `${unitId}_${this.entityCounter}`;
        // Criar entidade
        const entity = createEntity({
            id: entityId,
            ownerId: playerIndex === 1 ? 'player1' : 'player2',
            unitId: unitId,
            position: { x, y },
            stats: finalStats,
            radius: 0.5, // Raio padrão
        });
        this.entities.push(entity);
        if (this.config.verboseLogging) {
            console.log(`[GameRoom ${this.roomId}] ✨ Spawn: ${entityId} | ` +
                `Owner: player${playerIndex} | Pos: (${x}, ${y}) | ` +
                `HP: ${finalStats.maxHp} | DMG: ${finalStats.damage}`);
        }
        // FASE 3: Broadcast de spawn para clientes
        this.broadcastEntitySpawned(entity);
        return entity;
    }
    /**
     * Faz broadcast de entidade spawnada para os clientes.
     */
    broadcastEntitySpawned(entity) {
        if (!this.broadcastFn)
            return;
        const spawnData = {
            id: entity.id,
            ownerId: entity.ownerId,
            unitId: entity.unitId,
            maxHp: entity.stats.maxHp,
            position: { ...entity.position },
        };
        this.broadcastFn({
            type: S2CMessageType.ENTITY_SPAWNED,
            entity: spawnData,
        });
    }
    /**
     * Calcula os stats finais somando stats base com modificadores de itens.
     * @param baseStats Stats base da unidade
     * @param equippedItems IDs dos itens equipados
     * @returns EntityStats finais
     */
    calculateFinalStats(baseStats, equippedItems) {
        // Começar com stats base
        let health = baseStats.health;
        let damage = baseStats.damage;
        let attackSpeed = baseStats.attackSpeed;
        let range = baseStats.range;
        let moveSpeed = baseStats.moveSpeed;
        // Somar modificadores de cada item
        for (const itemId of equippedItems) {
            const item = getItemById(itemId);
            if (!item)
                continue;
            const mod = item.statsModifier;
            health += mod.health ?? 0;
            damage += mod.damage ?? 0;
            attackSpeed += mod.attackSpeed ?? 0;
            range += mod.range ?? 0;
            moveSpeed += mod.moveSpeed ?? 0;
        }
        // Garantir valores mínimos
        return {
            hp: Math.max(1, health),
            maxHp: Math.max(1, health),
            damage: Math.max(1, damage),
            attackSpeed: Math.max(0.1, attackSpeed),
            range: Math.max(0.5, range),
            moveSpeed: Math.max(0.5, moveSpeed),
        };
    }
    // ============================================
    // TICK LOOP (Atualizado para Fase 2)
    // ============================================
    /**
     * Executa um tick de simulação.
     * Este é o core do servidor autoritativo.
     */
    tick() {
        this.gameState.tick++;
        const tickTime = Date.now();
        const deltaTime = this.tickDuration / 1000; // Em segundos
        // --------------------------------------------
        // FASE 1: Processar Inputs (Placeholder)
        // --------------------------------------------
        // TODO: Processar ações na fila (spawn de unidades via WebSocket)
        // this.processPlayerActions();
        // --------------------------------------------
        // FASE 2: Atualizar Mana
        // --------------------------------------------
        this.updateMana();
        // --------------------------------------------
        // FASE 3: Combate (antes da física para definir alvos)
        // --------------------------------------------
        this.combatSystem.update(this.entities, tickTime, this.gameState.tick);
        // --------------------------------------------
        // FASE 4: Movimento & Física
        // --------------------------------------------
        this.physicsSystem.update(this.entities, deltaTime);
        // --------------------------------------------
        // FASE 5: Limpar entidades mortas
        // --------------------------------------------
        this.cleanupDeadEntities();
        // --------------------------------------------
        // FASE 6: Verificar Win Condition
        // --------------------------------------------
        this.checkWinCondition();
        // --------------------------------------------
        // FASE 7: Atualizar snapshot de estado
        // --------------------------------------------
        this.gameState.entities = this.entities.map((e) => e.toSnapshot());
        // --------------------------------------------
        // FASE 8: Broadcast de Estado via WebSocket
        // --------------------------------------------
        this.broadcastGameTick();
        // Log de debug (a cada 20 ticks = 1 segundo)
        if (this.config.verboseLogging && this.gameState.tick % 20 === 0) {
            const elapsed = Math.floor((Date.now() - this.gameState.startTime) / 1000);
            const stats = this.combatSystem.getStats(this.entities);
            console.log(`[GameRoom ${this.roomId}] Tick: ${this.gameState.tick} | ` +
                `Tempo: ${elapsed}s | ` +
                `Mana: P1=${this.gameState.mana.player1.toFixed(1)} P2=${this.gameState.mana.player2.toFixed(1)} | ` +
                `Entidades: P1=${stats.player1Alive} P2=${stats.player2Alive}`);
        }
    }
    /**
     * Envia GAME_TICK para todos os clientes da sala.
     */
    broadcastGameTick() {
        if (!this.broadcastFn)
            return;
        // Construir deltas de entidades (formato comprimido)
        const entities = this.entities.map((e) => ({
            id: e.id,
            x: Math.round(e.position.x * 100) / 100, // 2 decimais
            y: Math.round(e.position.y * 100) / 100,
            hp: e.stats.hp,
            s: stateToCode(e.state),
        }));
        // Construir deltas de torres
        const towers = this.gameState.towers.map((t) => ({
            id: t.id,
            hp: t.health,
        }));
        const payload = {
            tick: this.gameState.tick,
            mana1: Math.round(this.gameState.mana.player1 * 10) / 10,
            mana2: Math.round(this.gameState.mana.player2 * 10) / 10,
            entities,
            towers,
        };
        this.broadcastFn({
            type: S2CMessageType.GAME_TICK,
            payload,
        });
    }
    /**
     * Atualiza a mana dos jogadores.
     */
    updateMana() {
        const manaPerTick = this.config.manaRegenRate / this.config.tickRate;
        const maxMana = 10;
        this.gameState.mana.player1 = Math.min(maxMana, this.gameState.mana.player1 + manaPerTick);
        this.gameState.mana.player2 = Math.min(maxMana, this.gameState.mana.player2 + manaPerTick);
    }
    /**
     * Remove entidades mortas da lista.
     */
    cleanupDeadEntities() {
        const before = this.entities.length;
        this.entities = this.entities.filter((e) => e.isAlive());
        const removed = before - this.entities.length;
        if (removed > 0 && this.config.verboseLogging) {
            console.log(`[GameRoom ${this.roomId}] 🗑️ Removidas ${removed} entidades mortas.`);
        }
    }
    /**
     * Verifica condições de vitória.
     */
    checkWinCondition() {
        const elapsed = Date.now() - this.gameState.startTime;
        const maxDurationMs = this.config.maxDuration * 1000;
        // Verificar tempo limite
        if (elapsed >= maxDurationMs) {
            const winnerId = this.determineWinnerByTowers();
            this.endGame(winnerId, 'Tempo limite atingido');
            return;
        }
        // Verificar destruição do Core
        const p1Core = this.gameState.towers.find((t) => t.id === 't1_core');
        const p2Core = this.gameState.towers.find((t) => t.id === 't2_core');
        if (p1Core && p1Core.health <= 0) {
            this.endGame('player2', 'Core do Player 1 destruído');
            return;
        }
        if (p2Core && p2Core.health <= 0) {
            this.endGame('player1', 'Core do Player 2 destruído');
            return;
        }
    }
    /**
     * Determina vencedor por HP de torres.
     */
    determineWinnerByTowers() {
        const p1Towers = this.gameState.towers.filter((t) => t.ownerId === 'player1');
        const p2Towers = this.gameState.towers.filter((t) => t.ownerId === 'player2');
        const p1TotalHp = p1Towers.reduce((sum, t) => sum + t.health, 0);
        const p2TotalHp = p2Towers.reduce((sum, t) => sum + t.health, 0);
        return p1TotalHp >= p2TotalHp ? 'player1' : 'player2';
    }
    /**
     * Encerra o jogo e notifica callbacks.
     */
    endGame(winnerId, reason) {
        this.stop(reason);
        if (this.onGameEnd) {
            this.onGameEnd(winnerId, reason);
        }
    }
    // ============================================
    // GETTERS PÚBLICOS
    // ============================================
    /**
     * Retorna o estado atual do jogo (para debug ou testes).
     */
    getState() {
        return this.gameState;
    }
    /**
     * Retorna as entidades vivas (para debug).
     */
    getEntities() {
        return this.entities;
    }
    /**
     * Retorna estatísticas de combate.
     */
    getCombatStats() {
        return this.combatSystem.getStats(this.entities);
    }
    /**
     * Retorna informações da sala.
     */
    getInfo() {
        return {
            roomId: this.roomId,
            isRunning: this.gameState.isRunning,
            tick: this.gameState.tick,
            playersConnected: (this.player1 ? 1 : 0) + (this.player2 ? 1 : 0),
            entitiesAlive: this.entities.filter((e) => e.isAlive()).length,
        };
    }
    // ============================================
    // FASE 3: MÉTODOS WEBSOCKET
    // ============================================
    /**
     * Retorna o índice do jogador pelo socketId.
     */
    getPlayerIndex(socketId) {
        if (this.player1?.playerId === socketId)
            return 1;
        if (this.player2?.playerId === socketId)
            return 2;
        return null;
    }
    /**
     * Processa requisição de spawn de carta.
     * Chamado pelo SocketManager quando recebe SPAWN_CARD.
     */
    handleSpawnRequest(playerIndex, cardIndex, x, y) {
        // TODO: Validar cardIndex contra o deck do jogador
        // TODO: Verificar mana suficiente
        // TODO: Validar posição dentro da área permitida
        // Por agora, usar unidade padrão para teste
        const testUnits = ['knight_base', 'archer_base', 'mage_base'];
        const unitId = testUnits[cardIndex % testUnits.length];
        const entity = this.spawnUnit(playerIndex, unitId, x, y);
        return entity !== null;
    }
    /**
     * Faz broadcast de uma mensagem para os clientes da sala.
     */
    broadcast(message) {
        if (this.broadcastFn) {
            this.broadcastFn(message);
        }
    }
}
//# sourceMappingURL=game-room.js.map