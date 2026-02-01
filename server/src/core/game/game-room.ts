/**
 * Magic Royale - Game Room
 * 
 * Gerencia uma instância de partida 1v1.
 * Implementa o tick loop a 20Hz para simulação autoritativa.
 * 
 * @module core/game/game-room
 */

import { UnitState } from '../types/tags.js';

/**
 * Vetor 2D para posições e movimentos.
 */
export interface Vector2D {
    x: number;
    y: number;
}

/**
 * Representação de uma unidade na partida (runtime).
 */
export interface RuntimeUnit {
    id: string;
    ownerId: string;
    position: Vector2D;
    radius: number;
    health: number;
    maxHealth: number;
    damage: number;
    attackSpeed: number;
    range: number;
    moveSpeed: number;
    target: RuntimeUnit | null;
    state: UnitState;
    lastAttackTime: number;
}

/**
 * Estado de uma torre.
 */
export interface TowerState {
    id: string;
    ownerId: string;
    position: Vector2D;
    health: number;
    maxHealth: number;
}

/**
 * Estado completo do jogo (snapshot).
 */
export interface GameState {
    tick: number;
    mana: { player1: number; player2: number };
    units: RuntimeUnit[];
    towers: TowerState[];
    startTime: number;
    isRunning: boolean;
}

/**
 * Conexão de um jogador (placeholder para WebSocket futuro).
 */
export interface PlayerConnection {
    playerId: string;
    deckId: string;
    // socket: WebSocket; // Futuro
}

/**
 * Configuração do GameRoom.
 */
export interface GameRoomConfig {
    /** Taxa de ticks por segundo (default: 20) */
    tickRate?: number;
    /** Duração máxima da partida em segundos (default: 180) */
    maxDuration?: number;
    /** Mana inicial por jogador */
    initialMana?: number;
    /** Taxa de regeneração de mana por segundo */
    manaRegenRate?: number;
}

const DEFAULT_CONFIG: Required<GameRoomConfig> = {
    tickRate: 20,
    maxDuration: 180,
    initialMana: 5,
    manaRegenRate: 1,
};

/**
 * Classe que gerencia uma sala de jogo (partida 1v1).
 * 
 * Responsabilidades:
 * - Manter o estado do jogo
 * - Rodar o tick loop a 20Hz
 * - Processar ações dos jogadores
 * - Broadcast do estado (futuro)
 */
export class GameRoom {
    public readonly roomId: string;
    private player1: PlayerConnection | null = null;
    private player2: PlayerConnection | null = null;
    private gameState: GameState;
    private config: Required<GameRoomConfig>;
    private tickInterval: ReturnType<typeof setInterval> | null = null;
    private tickDuration: number; // ms entre ticks

    constructor(roomId: string, config?: GameRoomConfig) {
        this.roomId = roomId;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.tickDuration = 1000 / this.config.tickRate; // 50ms para 20Hz

        // Inicializar estado do jogo
        this.gameState = this.createInitialState();

        console.log(`[GameRoom] Sala "${roomId}" criada. TickRate: ${this.config.tickRate}Hz`);
    }

    /**
     * Cria o estado inicial do jogo.
     */
    private createInitialState(): GameState {
        return {
            tick: 0,
            mana: {
                player1: this.config.initialMana,
                player2: this.config.initialMana,
            },
            units: [],
            towers: this.createInitialTowers(),
            startTime: 0,
            isRunning: false,
        };
    }

    /**
     * Cria as torres iniciais do mapa.
     */
    private createInitialTowers(): TowerState[] {
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
    public addPlayer(player: PlayerConnection, slot: 1 | 2): boolean {
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
    public isReady(): boolean {
        return this.player1 !== null && this.player2 !== null;
    }

    /**
     * Inicia o game loop.
     */
    public start(): void {
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
    public stop(reason: string = 'Partida encerrada'): void {
        if (!this.gameState.isRunning) {
            return;
        }

        console.log(`[GameRoom ${this.roomId}] 🛑 Parando partida: ${reason}`);

        this.gameState.isRunning = false;

        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    /**
     * Executa um tick de simulação.
     * Este é o core do servidor autoritativo.
     */
    private tick(): void {
        this.gameState.tick++;

        // --------------------------------------------
        // FASE 1: Processar Inputs (Placeholder)
        // --------------------------------------------
        // TODO: Processar ações na fila (spawn de unidades)
        // this.processPlayerActions();

        // --------------------------------------------
        // FASE 2: Atualizar Mana
        // --------------------------------------------
        this.updateMana();

        // --------------------------------------------
        // FASE 3: Movimento & Física (Placeholder)
        // --------------------------------------------
        // TODO: Mover unidades, resolver colisões
        // for (const unit of this.gameState.units) {
        //   this.moveUnit(unit);
        //   this.resolveCollisions(unit);
        // }

        // --------------------------------------------
        // FASE 4: Combate (Placeholder)
        // --------------------------------------------
        // TODO: Processar ataques
        // for (const unit of this.gameState.units) {
        //   this.processAttack(unit);
        // }

        // --------------------------------------------
        // FASE 5: Verificar Win Condition
        // --------------------------------------------
        this.checkWinCondition();

        // --------------------------------------------
        // FASE 6: Broadcast de Estado (Placeholder)
        // --------------------------------------------
        // TODO: Enviar snapshot comprimido para clientes
        // this.broadcastState();

        // Log de debug (a cada 20 ticks = 1 segundo)
        if (this.gameState.tick % 20 === 0) {
            const elapsed = Math.floor((Date.now() - this.gameState.startTime) / 1000);
            console.log(
                `[GameRoom ${this.roomId}] Tick: ${this.gameState.tick} | ` +
                `Tempo: ${elapsed}s | ` +
                `Mana: P1=${this.gameState.mana.player1.toFixed(1)} P2=${this.gameState.mana.player2.toFixed(1)} | ` +
                `Unidades: ${this.gameState.units.length}`
            );
        }
    }

    /**
     * Atualiza a mana dos jogadores.
     */
    private updateMana(): void {
        const manaPerTick = this.config.manaRegenRate / this.config.tickRate;
        const maxMana = 10;

        this.gameState.mana.player1 = Math.min(
            maxMana,
            this.gameState.mana.player1 + manaPerTick
        );
        this.gameState.mana.player2 = Math.min(
            maxMana,
            this.gameState.mana.player2 + manaPerTick
        );
    }

    /**
     * Verifica condições de vitória.
     */
    private checkWinCondition(): void {
        const elapsed = Date.now() - this.gameState.startTime;
        const maxDurationMs = this.config.maxDuration * 1000;

        // Verificar tempo limite
        if (elapsed >= maxDurationMs) {
            this.stop('Tempo limite atingido');
            // TODO: Determinar vencedor por HP de torres
            return;
        }

        // Verificar destruição do Core
        const p1Core = this.gameState.towers.find((t) => t.id === 't1_core');
        const p2Core = this.gameState.towers.find((t) => t.id === 't2_core');

        if (p1Core && p1Core.health <= 0) {
            this.stop('Player 2 venceu! Core do Player 1 destruído.');
            return;
        }

        if (p2Core && p2Core.health <= 0) {
            this.stop('Player 1 venceu! Core do Player 2 destruído.');
            return;
        }
    }

    /**
     * Retorna o estado atual do jogo (para debug ou testes).
     */
    public getState(): Readonly<GameState> {
        return this.gameState;
    }

    /**
     * Retorna informações da sala.
     */
    public getInfo(): { roomId: string; isRunning: boolean; tick: number; playersConnected: number } {
        return {
            roomId: this.roomId,
            isRunning: this.gameState.isRunning,
            tick: this.gameState.tick,
            playersConnected: (this.player1 ? 1 : 0) + (this.player2 ? 1 : 0),
        };
    }
}
