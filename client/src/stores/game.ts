import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { GameClient } from '../net/GameClient';
import { S2CMessageType, type EntitySpawnData, type GameTickPayload, type S2CError, type S2CLoginSuccess, type S2CMatchStart, type S2CEntitySpawned, type S2CGameTick } from '../net/protocol';

export const useGameStore = defineStore('game', () => {
    // State
    const isConnected = ref(false);
    const isAuthenticated = ref(false);
    const player = ref<{ id: string; name: string } | null>(null);
    const inQueue = ref(false);
    const queuePosition = ref(0);
    const matchData = ref<S2CMatchStart | null>(null);
    const lastError = ref<string | null>(null);

    // Game State
    const entityRegistry = ref<Map<string, EntitySpawnData>>(new Map());
    const lastTick = ref<GameTickPayload | null>(null);
    const mana = ref({ current: 0, max: 10 });

    // Deck & collection (Synced with server/src/data/units.json)
    const collection = ref([
        { id: 'knight_base', elixir: 3, level: 9 },
        { id: 'archer_base', elixir: 3, level: 9 },
        { id: 'giant_base', elixir: 5, level: 9 }, // Assuming giant_base exists or we use placeholder
        { id: 'mage_base', elixir: 4, level: 8 },
        // Using knight_base as placeholder for others until we have full DB
        { id: 'minipekka_base', elixir: 4, level: 7 },
        { id: 'musketeer_base', elixir: 4, level: 7 },
        { id: 'babydragon_base', elixir: 4, level: 4 },
        { id: 'skeletonarmy_base', elixir: 3, level: 4 },
        { id: 'goblins_base', elixir: 2, level: 9 },
        { id: 'speargoblins_base', elixir: 2, level: 9 },
    ]);

    // IDs in current deck
    const currentDeck = ref(['knight_base', 'archer_base', 'mage_base', 'knight_base', 'archer_base', 'mage_base', 'knight_base', 'archer_base']);


    // Actions
    function initialize() {
        const client = GameClient.getInstance();

        client.connect().then(() => {
            isConnected.value = true;
            console.log("Connected to game server");

            // Auto-login persistence
            const savedId = localStorage.getItem('crom_player_id');
            if (savedId) {
                console.log(`Auto-logging in as ${savedId}...`);
                login(savedId);
            }
        }).catch(err => {
            console.error("Failed to connect", err);
            isConnected.value = false;
        });

        // Setup listeners
        client.on<S2CLoginSuccess>(S2CMessageType.LOGIN_SUCCESS, (msg) => {
            isAuthenticated.value = true;
            player.value = msg.player;
            // Persist ID
            localStorage.setItem('crom_player_id', msg.player.id || '');
        });

        client.on<S2CError>(S2CMessageType.ERROR, (msg) => {
            lastError.value = `${msg.code}: ${msg.message}`;
            console.error("Game Error:", msg);

            if (msg.code === 'PLAYER_NOT_FOUND' && isAuthenticated.value) {
                console.warn("Session invalid, clearing auth.");
                isAuthenticated.value = false;
                inQueue.value = false;
                matchData.value = null;
            }
        });

        client.on<any>(S2CMessageType.QUEUE_JOINED, (msg) => {
            inQueue.value = true;
            queuePosition.value = msg.position;
        });

        client.on<S2CMatchStart>(S2CMessageType.MATCH_START, (msg) => {
            inQueue.value = false;
            matchData.value = msg;
            entityRegistry.value.clear();
            lastTick.value = null;
        });

        client.on<S2CEntitySpawned>(S2CMessageType.ENTITY_SPAWNED, (msg) => {
            entityRegistry.value.set(msg.entity.id, msg.entity);
        });

        client.on<S2CGameTick>(S2CMessageType.GAME_TICK, (msg) => {
            lastTick.value = msg.payload;
            if (matchData.value && player.value) {
                const isP1 = matchData.value.you.playerIndex === 1;
                mana.value.current = isP1 ? msg.payload.mana1 : msg.payload.mana2;
            }
        });
    }

    function login(playerId: string) {
        GameClient.getInstance().login(playerId);
    }

    function findMatch(deckId?: string) {
        GameClient.getInstance().findMatch(deckId);
    }

    function spawnCard(cardIndex: number, x: number, y: number) {
        GameClient.getInstance().spawnCard(cardIndex, x, y);
    }

    // Helpers for Deck
    function setDeck(cardIds: string[]) {
        currentDeck.value = cardIds;
    }

    // Getters
    const myMana = computed(() => mana.value.current);

    const averageElixir = computed(() => {
        if (currentDeck.value.length === 0) return 0;
        let sum = 0;
        currentDeck.value.forEach(id => {
            const card = collection.value.find(c => c.id === id);
            if (card) sum += card.elixir;
        });
        return (sum / currentDeck.value.length).toFixed(1);
    });

    return {
        isConnected,
        isAuthenticated,
        player,
        inQueue,
        queuePosition,
        matchData,
        lastError,
        entityRegistry,
        lastTick,
        myMana,
        collection,
        currentDeck,
        averageElixir,
        initialize,
        login,
        findMatch,
        spawnCard,
        setDeck
    };
});
