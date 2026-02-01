import { type C2SMessage, C2SMessageType, type S2CMessage, S2CMessageType, type EntitySpawnData, type GameTickPayload, type PlayerMatchData, type S2CError } from './protocol'; // We will need to create protocol.ts in client or import/copy it

// Since we cannot easily share files between root/server and root/client in this setup without a monorepo workspace tool, 
// we will COPY the protocol definition to client/src/net/protocol.ts as per plan.

// We will implement the class assuming protocol.ts is there.

export type GameClientConfig = {
    url: string;
    autoConnect?: boolean;
};

type MessageHandler<T = any> = (payload: T) => void;

export class GameClient {
    private static _instance: GameClient;
    private ws: WebSocket | null = null;
    private config: GameClientConfig;

    // Event listeners
    private listeners: Map<S2CMessageType, Set<MessageHandler>> = new Map();

    private constructor(config: GameClientConfig) {
        this.config = config;
        if (config.autoConnect) {
            this.connect();
        }
    }

    public static getInstance(): GameClient {
        if (!GameClient._instance) {
            GameClient._instance = new GameClient({
                url: 'ws://localhost:3000', // Default URL
                autoConnect: false
            });
        }
        return GameClient._instance;
    }

    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            console.log(`Checking connection to ${this.config.url}...`);
            this.ws = new WebSocket(this.config.url);

            this.ws.onopen = () => {
                console.log('WS Connection established');
                resolve();
            };

            this.ws.onerror = (err) => {
                console.error('WS Connection error', err);
                reject(err);
            };

            this.ws.onclose = () => {
                console.log('WS Connection closed');
                // Optional: Reconnect logic here
            };

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data) as S2CMessage;
                    this.handleMessage(msg);
                } catch (e) {
                    console.error('Failed to parse message', event.data);
                }
            };
        });
    }

    private handleMessage(msg: S2CMessage) {
        // Log generic for debugging
        console.log('[RX]', msg.type, msg);

        // Notify specific listeners
        if (this.listeners.has(msg.type)) {
            this.listeners.get(msg.type)?.forEach(cb => cb(msg));
        }
    }

    public on<T extends S2CMessage>(type: S2CMessageType, callback: (msg: T) => void) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)?.add(callback as MessageHandler);
    }

    public off<T extends S2CMessage>(type: S2CMessageType, callback: (msg: T) => void) {
        this.listeners.get(type)?.delete(callback as MessageHandler);
    }

    // ==========================================
    // ACTIONS (Send to Server)
    // ==========================================

    private send(msg: C2SMessage) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('Cannot send: WS not connected');
            return;
        }
        console.log('[TX]', msg.type, msg);
        this.ws.send(JSON.stringify(msg));
    }

    public login(playerId: string) {
        this.send({
            type: C2SMessageType.LOGIN,
            playerId
        });
    }

    public findMatch(deckId?: string) {
        this.send({
            type: C2SMessageType.QUEUE_JOIN,
            deckId
        });
    }

    public leaveQueue() {
        this.send({
            type: C2SMessageType.QUEUE_LEAVE
        });
    }

    public spawnCard(cardIndex: number, x: number, y: number) {
        this.send({
            type: C2SMessageType.SPAWN_CARD,
            cardIndex,
            x,
            y
        });
    }
}
