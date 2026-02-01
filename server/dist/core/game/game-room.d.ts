/**
 * Magic Royale - Game Room
 *
 * Gerencia uma instância de partida 1v1.
 * Implementa o tick loop a 20Hz para simulação autoritativa.
 *
 * FASE 2: Integração com Physics, Entity e Combat systems.
 *
 * @module core/game/game-room
 */
import { Vector2D } from './physics.js';
import { GameEntity, EntitySnapshot } from './entity.js';
import { CombatStats } from './combat.js';
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
    mana: {
        player1: number;
        player2: number;
    };
    entities: EntitySnapshot[];
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
    /** Se true, loga detalhes de combate */
    verboseLogging?: boolean;
}
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
export declare class GameRoom {
    readonly roomId: string;
    private player1;
    private player2;
    private gameState;
    private config;
    private tickInterval;
    private tickDuration;
    private physicsSystem;
    private combatSystem;
    private entities;
    private entityCounter;
    constructor(roomId: string, config?: GameRoomConfig);
    /**
     * Cria o estado inicial do jogo.
     */
    private createInitialState;
    /**
     * Cria as torres iniciais do mapa.
     */
    private createInitialTowers;
    /**
     * Adiciona um jogador à sala.
     */
    addPlayer(player: PlayerConnection, slot: 1 | 2): boolean;
    /**
     * Verifica se a sala está pronta para iniciar.
     */
    isReady(): boolean;
    /**
     * Inicia o game loop.
     */
    start(): void;
    /**
     * Para o game loop.
     */
    stop(reason?: string): void;
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
    spawnUnit(playerIndex: 1 | 2, unitId: string, x: number, y: number, equippedItems?: string[]): GameEntity | null;
    /**
     * Calcula os stats finais somando stats base com modificadores de itens.
     * @param baseStats Stats base da unidade
     * @param equippedItems IDs dos itens equipados
     * @returns EntityStats finais
     */
    private calculateFinalStats;
    /**
     * Executa um tick de simulação.
     * Este é o core do servidor autoritativo.
     */
    private tick;
    /**
     * Atualiza a mana dos jogadores.
     */
    private updateMana;
    /**
     * Remove entidades mortas da lista.
     */
    private cleanupDeadEntities;
    /**
     * Verifica condições de vitória.
     */
    private checkWinCondition;
    /**
     * Retorna o estado atual do jogo (para debug ou testes).
     */
    getState(): Readonly<GameState>;
    /**
     * Retorna as entidades vivas (para debug).
     */
    getEntities(): ReadonlyArray<GameEntity>;
    /**
     * Retorna estatísticas de combate.
     */
    getCombatStats(): CombatStats;
    /**
     * Retorna informações da sala.
     */
    getInfo(): {
        roomId: string;
        isRunning: boolean;
        tick: number;
        playersConnected: number;
        entitiesAlive: number;
    };
}
//# sourceMappingURL=game-room.d.ts.map