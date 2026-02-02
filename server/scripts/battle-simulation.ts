/**
 * Magic Royale - Battle Simulator
 * 
 * Script that connects two clients, starts a match, and simulates a full battle
 * with automated card spawning and entity tracking.
 * 
 * Usage: npx tsx scripts/battle-simulation.ts [port]
 */

import WebSocket from 'ws';

const PORT = process.argv[2] || '3000';
const URL = `ws://localhost:${PORT}`;

class AutoClient {
    public ws: WebSocket;
    public name: string;
    public mana: number = 5;
    public deckId: string = 'deck_sim';
    public matchId: string | null = null;
    public playerIndex: number = 0;

    constructor(name: string) {
        this.name = name;
        this.ws = new WebSocket(URL);
        this.setupHandlers();
    }

    private setupHandlers() {
        this.ws.on('open', () => {
            console.log(`[${this.name}] Connected. Logging in...`);
            this.ws.send(JSON.stringify({
                type: 'LOGIN',
                playerId: this.name,
                token: 'sim_token' // Mock token
            }));
        });

        this.ws.on('message', (data: Buffer) => {
            try {
                const msg = JSON.parse(data.toString());
                this.handleMessage(msg);
            } catch (e) {
                console.error(`[${this.name}] Parse error:`, e);
            }
        });
    }

    private handleMessage(msg: any) {
        switch (msg.type) {
            case 'LOGIN_SUCCESS':
                console.log(`[${this.name}] Login success! Joining queue...`);
                this.ws.send(JSON.stringify({ type: 'QUEUE_JOIN', deckId: this.deckId }));
                break;

            case 'MATCH_START':
                this.matchId = msg.roomId;
                this.playerIndex = msg.you.playerIndex;
                console.log(`[${this.name}] Match started! (P${this.playerIndex}) in ${this.matchId}`);
                this.startAI();
                break;

            case 'GAME_TICK':
                const p = msg.payload;
                this.mana = this.playerIndex === 1 ? p.mana1 : p.mana2;
                break;

            case 'ERROR':
                console.error(`[${this.name}] ❌ ERROR: [${msg.code}] ${msg.message}`);
                break;

            case 'MATCH_END':
                console.log(`[${this.name}] Match finished. Winner: ${msg.winnerId}`);
                process.exit(0);
                break;
        }
    }

    private startAI() {
        // Simple AI: Spawn a random card every 2-4 seconds if mana allows
        setInterval(() => {
            if (this.mana >= 4) {
                const cardIdx = Math.floor(Math.random() * 4); // Hand size is 4
                // Random position in own territory
                const x = (Math.random() * 10) - 5; // -5 to 5
                const z = this.playerIndex === 1 ? 10 : -10; // Simple deploy line

                this.ws.send(JSON.stringify({
                    type: 'SPAWN_CARD',
                    cardIndex: cardIdx,
                    x: x,
                    y: z
                }));
                // console.log(`[${this.name}] Spawning card ${cardIdx} at (${x.toFixed(1)}, ${z})`);
            }
        }, 1000);
    }
}

// Start sequence
console.log("Starting Battle Simulation...");
const p1 = new AutoClient("hero_1");

setTimeout(() => {
    const p2 = new AutoClient("hero_2");
}, 500);

// Global logger for entities via P1's connection
p1.ws.on('message', (data: Buffer) => {
    try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'GAME_TICK') {
            const entities = msg.payload.entities;
            if (entities.length > 0 && Math.random() < 0.05) { // Sample output
                console.log(`\n--- Status Report (${entities.length} entities) ---`);
                entities.forEach((e: any) => {
                    console.log(`ID: ${e.id.substr(0, 4)} | Pos: (${e.x.toFixed(1)}, ${e.y.toFixed(1)})`);
                });
                console.log("----------------------------------\n");
            }
        }
    } catch { }
});
