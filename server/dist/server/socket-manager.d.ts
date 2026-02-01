/**
 * Magic Royale - Socket Manager
 *
 * Gerencia o servidor WebSocket, conexões de clientes e matchmaking.
 * Singleton que orquestra a comunicação entre clientes e GameRooms.
 *
 * FASE 3: Real-Time WebSocket Server
 *
 * @module server/socket-manager
 */
import { S2CMessage } from '../core/net/protocol.js';
/**
 * Configuração do SocketManager.
 */
export interface SocketManagerConfig {
    /** Porta do servidor WebSocket */
    port: number;
    /** Tick rate das partidas */
    tickRate?: number;
    /** Duração máxima da partida em segundos */
    maxGameDuration?: number;
    /** Habilitar logs verbosos */
    verbose?: boolean;
}
/**
 * Gerenciador central de WebSockets e matchmaking.
 *
 * Responsabilidades:
 * - Criar e gerenciar servidor WebSocket
 * - Manter mapa de clientes conectados
 * - Gerenciar fila de matchmaking (FIFO)
 * - Criar e gerenciar GameRooms
 * - Rotear mensagens entre clientes e salas
 */
export declare class SocketManager {
    private static instance;
    private httpServer;
    private wss;
    private config;
    private clients;
    private socketIdCounter;
    private matchmakingQueue;
    private rooms;
    private roomIdCounter;
    constructor(config?: Partial<SocketManagerConfig>);
    /**
     * Retorna a instância singleton.
     */
    static getInstance(config?: Partial<SocketManagerConfig>): SocketManager;
    /**
     * Inicia o servidor WebSocket.
     */
    start(): void;
    /**
     * Para o servidor WebSocket.
     */
    stop(): void;
    /**
     * Configura handlers de eventos do WebSocket.
     */
    private setupEventHandlers;
    /**
     * Processa nova conexão.
     */
    private handleConnection;
    /**
     * Processa mensagem recebida de um cliente.
     */
    private handleMessage;
    /**
     * Processa desconexão de um cliente.
     */
    private handleDisconnect;
    /**
     * Adiciona cliente à fila de matchmaking.
     */
    private handleQueueJoin;
    /**
     * Remove cliente da fila de matchmaking.
     */
    private handleQueueLeave;
    /**
     * Tenta criar uma partida se houver 2+ jogadores na fila.
     */
    private tryMatchmaking;
    /**
     * Cria uma nova sala de jogo para dois jogadores.
     */
    private createGameRoom;
    /**
     * Processa spawn de carta de um jogador.
     */
    private handleSpawnCard;
    /**
     * Processa fim de jogo.
     */
    private handleGameEnd;
    /**
     * Envia mensagem para um cliente específico.
     */
    sendTo(socketId: string, message: S2CMessage): void;
    /**
     * Envia mensagem para todos os clientes de uma sala.
     */
    broadcastToRoom(roomId: string, message: S2CMessage): void;
    /**
     * Retorna número de clientes conectados.
     */
    getConnectedCount(): number;
    /**
     * Retorna número de jogadores na fila.
     */
    getQueueSize(): number;
    /**
     * Retorna número de salas ativas.
     */
    getActiveRooms(): number;
    /**
     * Retorna estatísticas do servidor.
     */
    getStats(): {
        connected: number;
        inQueue: number;
        inGame: number;
        rooms: number;
    };
}
//# sourceMappingURL=socket-manager.d.ts.map