import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PlayerModel {
    id: string;
    name: string;
    inventory: string[]; // IDs das cartas disponíveis
}

export interface DeckModel {
    id: string;
    playerId: string;
    name: string;
    cards: string[]; // IDs das 8 cartas do deck
}

/**
 * Gerenciador de persistência simples usando arquivos JSON.
 */
export class SimpleDB {
    private static instance: SimpleDB;
    private dataDir: string;

    private playersCache: Map<string, PlayerModel> = new Map();
    private decksCache: Map<string, DeckModel> = new Map();

    private constructor() {
        this.dataDir = __dirname;
        this.ensureSeedData();
    }

    public static getInstance(): SimpleDB {
        if (!SimpleDB.instance) {
            SimpleDB.instance = new SimpleDB();
        }
        return SimpleDB.instance;
    }

    /**
     * Garante que os arquivos existam com dados iniciais.
     */
    private ensureSeedData() {
        const playersPath = path.join(this.dataDir, 'players.json');
        const decksPath = path.join(this.dataDir, 'decks.json');

        // Seed Players
        if (!fs.existsSync(playersPath)) {
            const seedPlayers: PlayerModel[] = [
                { id: 'hero_1', name: 'Hero One', inventory: ['archer_base', 'knight_base', 'mage_solar'] },
                { id: 'hero_2', name: 'Hero Two', inventory: ['archer_base', 'knight_base', 'mage_solar'] }

            ];
            fs.writeFileSync(playersPath, JSON.stringify(seedPlayers, null, 2));
            console.log('[SimpleDB] players.json criado com seed data.');
        }

        // Seed Decks
        if (!fs.existsSync(decksPath)) {
            const seedDecks: DeckModel[] = [
                {
                    id: 'deck_h1_default',
                    playerId: 'hero_1',
                    name: 'Starter Deck',
                    cards: ['archer_base', 'knight_base', 'mage_solar', 'archer_base', 'knight_base', 'mage_solar', 'archer_base', 'knight_base']

                },
                {
                    id: 'deck_h2_default',
                    playerId: 'hero_2',
                    name: 'Starter Deck',
                    cards: ['archer_base', 'knight_base', 'mage_solar', 'archer_base', 'knight_base', 'mage_solar', 'archer_base', 'knight_base']

                }
            ];
            fs.writeFileSync(decksPath, JSON.stringify(seedDecks, null, 2));
            console.log('[SimpleDB] decks.json criado com seed data.');
        }

        this.loadData();
    }

    private loadData() {
        try {
            const players = JSON.parse(fs.readFileSync(path.join(this.dataDir, 'players.json'), 'utf-8'));
            players.forEach((p: PlayerModel) => this.playersCache.set(p.id, p));

            const decks = JSON.parse(fs.readFileSync(path.join(this.dataDir, 'decks.json'), 'utf-8'));
            decks.forEach((d: DeckModel) => this.decksCache.set(d.id, d));

            console.log(`[SimpleDB] Carregados ${this.playersCache.size} jogadores e ${this.decksCache.size} decks.`);
        } catch (e) {
            console.error('[SimpleDB] Erro ao carregar dados:', e);
        }
    }

    public getPlayer(id: string): PlayerModel | undefined {
        return this.playersCache.get(id);
    }

    public getDeck(id: string): DeckModel | undefined {
        // Busca direta pelo ID do deck
        let deck = this.decksCache.get(id);
        if (deck) return deck;

        // Se não achou pelo ID, tenta achar o primeiro deck do player (comportamento "default")
        // Isso é útil se passarmos o playerId como deckId por engano ou quisermos o padrão
        for (const d of this.decksCache.values()) {
            if (d.playerId === id) return d;
        }

        return undefined;
    }
}
