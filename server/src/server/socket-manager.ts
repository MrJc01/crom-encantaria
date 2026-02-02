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

import { WebSocket, WebSocketServer } from 'ws';
import { createServer, Server as HttpServer } from 'http';
import { GameRoom, PlayerConnection } from '../core/game/game-room.js';
import {
    C2SMessageType,
    S2CMessage,
    S2CMessageType,
    parseC2SMessage,
    serializeMessage,
    createErrorMessage,
} from '../core/net/protocol.js';
import { SimpleDB, PlayerModel, DeckModel } from '../data/db.js';
// import type { CardConfig } from '../core/types/deck.js';


// ============================================
// TIPOS INTERNOS
// ============================================

/**
 * Representa um cliente conectado.
 */
interface ConnectedClient {
    /** ID único do socket */
    socketId: string;
    /** Referência ao WebSocket */
    socket: WebSocket;
    /** Estado atual do cliente */
    state: ClientState;
    /** ID do deck selecionado */
    deckId: string;
    /** ID da sala (se em jogo) */
    roomId: string | null;
    /** Timestamp da conexão */
    connectedAt: number;
    /** Dados do jogador logado */
    player?: PlayerModel;
    /** Dados do deck ativo */
    deck?: DeckModel;
}

/**
 * Estados possíveis de um cliente.
 */
enum ClientState {
    /** Conectado mas sem ação */
    CONNECTED = 'CONNECTED',
    /** Na fila de matchmaking */
    IN_QUEUE = 'IN_QUEUE',
    /** Em uma partida */
    IN_GAME = 'IN_GAME',
}

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

const DEFAULT_CONFIG: Required<SocketManagerConfig> = {
    port: 3000,
    tickRate: 20,
    maxGameDuration: 180,
    verbose: true,
};

// ============================================
// SOCKET MANAGER (SINGLETON)
// ============================================

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
export class SocketManager {
    private static instance: SocketManager | null = null;

    private httpServer: HttpServer;
    private wss: WebSocketServer;
    private config: Required<SocketManagerConfig>;

    // Gerenciamento de clientes
    private clients: Map<string, ConnectedClient> = new Map();
    private socketIdCounter: number = 0;

    // Matchmaking
    private matchmakingQueue: string[] = []; // IDs dos sockets na fila

    // Salas de jogo
    private rooms: Map<string, GameRoom> = new Map();
    private roomIdCounter: number = 0;

    constructor(config: Partial<SocketManagerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Criar servidor HTTP (necessário para WebSocket)
        this.httpServer = createServer((_req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Magic Royale Server v0.3.0');
        });

        // Criar servidor WebSocket
        this.wss = new WebSocketServer({ server: this.httpServer });

        this.setupEventHandlers();

        if (this.config.verbose) {
            console.log('[SocketManager] Instância criada.');
        }
    }

    /**
     * Retorna a instância singleton.
     */
    public static getInstance(config?: Partial<SocketManagerConfig>): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager(config);
        }
        return SocketManager.instance;
    }

    /**
     * Inicia o servidor WebSocket.
     */
    public start(): void {
        this.httpServer.listen(this.config.port, () => {
            console.log(`[SocketManager] 🚀 Servidor iniciado em ws://localhost:${this.config.port}`);
        });
    }

    /**
     * Para o servidor WebSocket.
     */
    public stop(): void {
        // Fechar todas as conexões
        for (const client of this.clients.values()) {
            client.socket.close(1000, 'Server shutting down');
        }

        // Parar todas as salas
        for (const room of this.rooms.values()) {
            room.stop('Server shutting down');
        }

        this.wss.close();
        this.httpServer.close();

        console.log('[SocketManager] 🛑 Servidor encerrado.');
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    /**
     * Configura handlers de eventos do WebSocket.
     */
    private setupEventHandlers(): void {
        this.wss.on('connection', (socket: WebSocket) => {
            this.handleConnection(socket);
        });

        this.wss.on('error', (error: Error) => {
            console.error('[SocketManager] Erro no servidor WS:', error.message);
        });
    }

    /**
     * Processa nova conexão.
     */
    private handleConnection(socket: WebSocket): void {
        // Gerar ID único para o socket
        this.socketIdCounter++;
        const socketId = `client_${this.socketIdCounter}`;

        // Criar registro do cliente
        const client: ConnectedClient = {
            socketId,
            socket,
            state: ClientState.CONNECTED,
            deckId: 'default',
            roomId: null,
            connectedAt: Date.now(),
        };

        this.clients.set(socketId, client);

        if (this.config.verbose) {
            console.log(`[SocketManager] ✅ Cliente conectado: ${socketId}`);
        }

        // Event handlers do socket
        socket.on('message', (data: Buffer) => {
            this.handleMessage(socketId, data.toString());
        });

        socket.on('close', () => {
            this.handleDisconnect(socketId);
        });

        socket.on('error', (error: Error) => {
            console.error(`[SocketManager] Erro no socket ${socketId}:`, error.message);
        });
    }

    /**
     * Processa mensagem recebida de um cliente.
     */
    private handleMessage(socketId: string, rawData: string): void {
        const client = this.clients.get(socketId);
        if (!client) return;

        try {
            const message = parseC2SMessage(rawData);

            if (this.config.verbose) {
                console.log(`[SocketManager] 📩 ${socketId} → ${message.type}`);
            }

            switch (message.type) {
                case C2SMessageType.LOGIN:
                    // @ts-ignore
                    this.handleLogin(socketId, (message as any).playerId);
                    break;

                case C2SMessageType.QUEUE_JOIN:
                    this.handleQueueJoin(socketId, message.deckId);
                    break;

                case C2SMessageType.QUEUE_LEAVE:
                    this.handleQueueLeave(socketId);
                    break;

                case C2SMessageType.SPAWN_CARD:
                    this.handleSpawnCard(socketId, message.cardIndex, message.x, message.y);
                    break;

                default:
                    this.sendTo(socketId, createErrorMessage('UNKNOWN_TYPE', 'Tipo de mensagem desconhecido'));
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[SocketManager] Erro ao processar mensagem de ${socketId}:`, errorMsg);
            this.sendTo(socketId, createErrorMessage('PARSE_ERROR', errorMsg));
        }
    }

    /**
     * Processa desconexão de um cliente.
     */
    private handleDisconnect(socketId: string): void {
        const client = this.clients.get(socketId);
        if (!client) return;

        if (this.config.verbose) {
            console.log(`[SocketManager] ❌ Cliente desconectado: ${socketId}`);
        }

        // Remover da fila de matchmaking
        if (client.state === ClientState.IN_QUEUE) {
            this.matchmakingQueue = this.matchmakingQueue.filter(id => id !== socketId);
        }

        // TODO: Notificar sala se em jogo (implementar surrender)

        // Limpar registro
        this.clients.delete(socketId);
    }

    // ============================================
    // AUTHENTICATION
    // ============================================

    /**
     * Processa login do jogador.
     */
    private handleLogin(socketId: string, playerId: string): void {
        const client = this.clients.get(socketId);
        if (!client) return;

        if (!playerId) {
            this.sendTo(socketId, createErrorMessage('INVALID_PARAMS', 'PlayerID is required'));
            return;
        }

        const db = SimpleDB.getInstance();
        const player = db.getPlayer(playerId);

        if (!player) {
            this.sendTo(socketId, createErrorMessage('PLAYER_NOT_FOUND', 'Jogador não encontrado'));
            return;
        }

        const deck = db.getDeck(playerId); // Tenta pegar deck default

        if (!deck) {
            this.sendTo(socketId, createErrorMessage('DECK_NOT_FOUND', 'Nenhum deck encontrado para o jogador'));
            return;
        }

        // Armazenar sessão
        client.player = player;
        client.deck = deck;
        client.deckId = deck.id;

        // Responder sucesso
        console.log(`[SocketManager] 🔑 Login sucesso: ${playerId} (${client.socketId})`);

        this.sendTo(socketId, {
            type: S2CMessageType.LOGIN_SUCCESS,
            player: {
                id: player.id,
                name: player.name,
                inventory: player.inventory
            },
            deck: {
                id: deck.id,
                name: deck.name,
                cards: deck.cards
            }
        });
    }

    // ============================================
    // MATCHMAKING
    // ============================================

    /**
     * Adiciona cliente à fila de matchmaking.
     */
    private handleQueueJoin(socketId: string, deckId?: string): void {
        const client = this.clients.get(socketId);
        if (!client) return;

        // Verificar se já está na fila ou em jogo
        if (client.state !== ClientState.CONNECTED) {
            this.sendTo(socketId, createErrorMessage('INVALID_STATE', 'Já está na fila ou em jogo'));
            return;
        }

        // Verificar login
        if (!client.player || !client.deck) {
            this.sendTo(socketId, createErrorMessage('LOGIN_REQUIRED', 'Faça login antes de jogar'));
            return;
        }

        // Atualizar estado
        client.state = ClientState.IN_QUEUE;
        if (deckId) client.deckId = deckId;

        // Adicionar à fila
        this.matchmakingQueue.push(socketId);

        // Notificar cliente
        this.sendTo(socketId, {
            type: S2CMessageType.QUEUE_JOINED,
            position: this.matchmakingQueue.length,
        });

        if (this.config.verbose) {
            console.log(`[SocketManager] 📋 ${socketId} entrou na fila. Posição: ${this.matchmakingQueue.length}`);
        }

        // Tentar fazer match
        this.tryMatchmaking();
    }

    /**
     * Remove cliente da fila de matchmaking.
     */
    private handleQueueLeave(socketId: string): void {
        const client = this.clients.get(socketId);
        if (!client) return;

        if (client.state !== ClientState.IN_QUEUE) {
            this.sendTo(socketId, createErrorMessage('INVALID_STATE', 'Não está na fila'));
            return;
        }

        // Remover da fila
        this.matchmakingQueue = this.matchmakingQueue.filter(id => id !== socketId);
        client.state = ClientState.CONNECTED;

        if (this.config.verbose) {
            console.log(`[SocketManager] 📋 ${socketId} saiu da fila.`);
        }
    }

    /**
     * Tenta criar uma partida se houver 2+ jogadores na fila.
     */
    private tryMatchmaking(): void {
        if (this.matchmakingQueue.length < 2) return;

        // Pegar os dois primeiros da fila (FIFO)
        const player1Id = this.matchmakingQueue.shift()!;
        const player2Id = this.matchmakingQueue.shift()!;

        const client1 = this.clients.get(player1Id);
        const client2 = this.clients.get(player2Id);

        if (!client1 || !client2) {
            console.error('[SocketManager] Erro: clientes inválidos no matchmaking');
            return;
        }

        // Criar sala
        this.createGameRoom(client1, client2);
    }

    // ============================================
    // GAME ROOMS
    // ============================================

    /**
     * Cria uma nova sala de jogo para dois jogadores.
     */
    private createGameRoom(client1: ConnectedClient, client2: ConnectedClient): void {
        // Gerar ID da sala
        this.roomIdCounter++;
        const roomId = `room_${this.roomIdCounter}`;

        // Criar sala com callback de broadcast
        const room = new GameRoom(roomId, {
            tickRate: this.config.tickRate,
            maxDuration: this.config.maxGameDuration,
            verboseLogging: false,
            broadcastFn: (message: S2CMessage) => {
                this.broadcastToRoom(roomId, message);
            },
            sendToPlayerFn: (playerIndex: 1 | 2, message: S2CMessage) => {
                const targetSocketId = playerIndex === 1 ? client1.socketId : client2.socketId;
                this.sendTo(targetSocketId, message);
            },
            onGameEnd: (winnerId: string, reason: string) => {
                this.handleGameEnd(roomId, winnerId, reason);
            },
        });


        // Adicionar jogadores
        const p1Conn: PlayerConnection = {
            playerId: client1.player!.id,
            deckId: client1.deck!.id,
            deckCards: client1.deck!.cards.map((id, index) => ({
                slotIndex: index,
                baseUnitId: id,
                equippedItems: []
            }))
        };
        const p2Conn: PlayerConnection = {
            playerId: client2.player!.id,
            deckId: client2.deck!.id,
            deckCards: client2.deck!.cards.map((id, index) => ({
                slotIndex: index,
                baseUnitId: id,
                equippedItems: []
            }))
        };

        room.addPlayer(p1Conn, 1);
        room.addPlayer(p2Conn, 2);

        // Atualizar estado dos clientes
        client1.state = ClientState.IN_GAME;
        client1.roomId = roomId;
        client2.state = ClientState.IN_GAME;
        client2.roomId = roomId;

        // Salvar sala
        this.rooms.set(roomId, room);

        // Notificar jogadores
        this.sendTo(client1.socketId, {
            type: S2CMessageType.MATCH_START,
            roomId,
            you: { playerId: client1.player!.id, playerIndex: 1, deckId: client1.deckId },
            opponent: { playerId: client2.player!.id, playerIndex: 2, deckId: client2.deckId },
            tickRate: this.config.tickRate,
        });

        this.sendTo(client2.socketId, {
            type: S2CMessageType.MATCH_START,
            roomId,
            you: { playerId: client2.player!.id, playerIndex: 2, deckId: client2.deckId },
            opponent: { playerId: client1.player!.id, playerIndex: 1, deckId: client1.deckId },
            tickRate: this.config.tickRate,
        });

        console.log(`[SocketManager] 🎮 Partida criada: ${roomId} | ${client1.socketId} vs ${client2.socketId}`);

        // Iniciar partida
        room.start();
    }

    /**
     * Processa spawn de carta de um jogador.
     */
    private handleSpawnCard(socketId: string, cardIndex: number, x: number, y: number): void {
        const client = this.clients.get(socketId);
        if (!client || client.state !== ClientState.IN_GAME || !client.roomId) {
            this.sendTo(socketId, createErrorMessage('NOT_IN_GAME', 'Não está em uma partida'));
            return;
        }

        const room = this.rooms.get(client.roomId);
        if (!room) {
            this.sendTo(socketId, createErrorMessage('ROOM_NOT_FOUND', 'Sala não encontrada'));
            return;
        }

        // Determinar índice do jogador
        // FIX: Usar o ID persistente do jogador, não o SocketID
        const playerIndex = room.getPlayerIndex(client.player!.id);
        if (!playerIndex) {
            this.sendTo(socketId, createErrorMessage('PLAYER_NOT_FOUND', 'Jogador não encontrado na sala'));
            return;
        }

        // Delegar spawn para a sala
        room.handleSpawnRequest(playerIndex, cardIndex, x, y);
    }

    /**
     * Processa fim de jogo.
     */
    private handleGameEnd(roomId: string, winnerId: string, reason: string): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        // Notificar jogadores
        this.broadcastToRoom(roomId, {
            type: S2CMessageType.MATCH_END,
            winnerId,
            reason,
        });

        // Resetar estado dos clientes
        for (const client of this.clients.values()) {
            if (client.roomId === roomId) {
                client.state = ClientState.CONNECTED;
                client.roomId = null;
            }
        }

        // Remover sala
        this.rooms.delete(roomId);

        console.log(`[SocketManager] 🏁 Partida ${roomId} encerrada. Vencedor: ${winnerId}`);
    }

    // ============================================
    // COMUNICAÇÃO
    // ============================================

    /**
     * Envia mensagem para um cliente específico.
     */
    public sendTo(socketId: string, message: S2CMessage): void {
        const client = this.clients.get(socketId);
        if (!client || client.socket.readyState !== WebSocket.OPEN) return;

        client.socket.send(serializeMessage(message));
    }

    /**
     * Envia mensagem para todos os clientes de uma sala.
     */
    public broadcastToRoom(roomId: string, message: S2CMessage): void {
        const serialized = serializeMessage(message);

        for (const client of this.clients.values()) {
            if (client.roomId === roomId && client.socket.readyState === WebSocket.OPEN) {
                client.socket.send(serialized);
            }
        }
    }

    // ============================================
    // GETTERS
    // ============================================

    /**
     * Retorna número de clientes conectados.
     */
    public getConnectedCount(): number {
        return this.clients.size;
    }

    /**
     * Retorna número de jogadores na fila.
     */
    public getQueueSize(): number {
        return this.matchmakingQueue.length;
    }

    /**
     * Retorna número de salas ativas.
     */
    public getActiveRooms(): number {
        return this.rooms.size;
    }

    /**
     * Retorna estatísticas do servidor.
     */
    public getStats(): { connected: number; inQueue: number; inGame: number; rooms: number } {
        let inQueue = 0;
        let inGame = 0;

        for (const client of this.clients.values()) {
            if (client.state === ClientState.IN_QUEUE) inQueue++;
            if (client.state === ClientState.IN_GAME) inGame++;
        }

        return {
            connected: this.clients.size,
            inQueue,
            inGame,
            rooms: this.rooms.size,
        };
    }
}
