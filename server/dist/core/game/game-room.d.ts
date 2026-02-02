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
import type { Vector2D } from './physics.js';
import { GameEntity } from './entity.js';
import type { EntitySnapshot } from './entity.js';
import { CombatStats } from './combat.js';
import type { CardConfig } from '../types/deck.js';
import type { S2CMessage } from '../net/protocol.js';
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
 * Conexão de um jogador.
 */
export interface PlayerConnection {
    playerId: string;
    deckId: string;
    deckCards: CardConfig[];
}
/**
 * Callback para broadcast de mensagens.
 */
export type BroadcastFn = (message: S2CMessage) => void;
/**
 * Callback para enviar mensagem para um jogador específico.
 */
export type SendToPlayerFn = (playerIndex: 1 | 2, message: S2CMessage) => void;
/**
 * Callback para fim de jogo.
 */
export type OnGameEndFn = (winnerId: string, reason: string) => void;
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
    /** Callback para broadcast de mensagens (WebSocket) */
    broadcastFn?: BroadcastFn;
    /** Callback para enviar mensagem a um jogador específico */
    sendToPlayerFn?: SendToPlayerFn;
    /** Callback chamado quando a partida termina */
    onGameEnd?: OnGameEndFn;
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
    private broadcastFn;
    private sendToPlayerFn;
    private onGameEnd;
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
     * Faz broadcast de uma torre como se fosse uma entidade para reaproveitamento no renderer.
     */
    private broadcastTowerSpawned;
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
     * Faz broadcast de entidade spawnada para os clientes.
     */
    private broadcastEntitySpawned;
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
     * Envia GAME_TICK para todos os clientes da sala.
     */
    private broadcastGameTick;
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
     * Determina vencedor por HP de torres.
     */
    private determineWinnerByTowers;
    /**
     * Encerra o jogo e notifica callbacks.
     */
    private endGame;
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
    /**
     * Retorna o índice do jogador pelo socketId.
     */
    getPlayerIndex(socketId: string): 1 | 2 | null;
    /**
     * Processa requisição de spawn de carta.
     * Chamado pelo SocketManager quando recebe SPAWN_CARD.
     *
     * FASE 4: Anti-Cheat & Economy Validation
     * Validações em camadas:
     * 1. Índice da carta (0-7)
     * 2. Posição (deploy zones)
     * 3. Existência da carta no deck
     * 4. Mana suficiente
     */
    handleSpawnRequest(playerIndex: 1 | 2, cardIndex: number, x: number, y: number): boolean;
    /**
     * Envia mensagem de erro para um jogador específico.
     * Usado pelo sistema anti-cheat para notificar violações.
     */
    private sendErrorToPlayer;
    /**
     * Obtém o deck do jogador.
     */
    private getPlayerDeck;
    /**
     * Faz broadcast de uma mensagem para os clientes da sala.
     */
    broadcast(message: S2CMessage): void;
}
//# sourceMappingURL=game-room.d.ts.map