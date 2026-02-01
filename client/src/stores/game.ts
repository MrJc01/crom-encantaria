import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { GameClient } from '../net/GameClient';
import { S2CMessageType, type EntitySpawnData, type GameTickPayload, type PlayerMatchData, type S2CError, type S2CLoginSuccess, type S2CMatchStart } from '../net/protocol';

export const useGameStore = defineStore('game', () => {
    // State
    const isConnected = ref(false);
    const isAuthenticated = ref(false);
    const player = ref<{ id: string; name: string } | null>(null);
    const inQueue = ref(false);
    const queuePosition = ref(0);
    const matchData = ref<S2CMatchStart | null>(null);
    const lastError = ref<string | null>(null);
    const entities = ref<any[]>([]); // We store partial entities here

    // Actions
    function initialize() {
        const client = GameClient.getInstance();

        client.connect().then(() => {
            isConnected.value = true;
        }).catch(err => {
            console.error("Failed to connect", err);
            isConnected.value = false;
        });

        // Setup listeners
        client.on<S2CLoginSuccess>(S2CMessageType.LOGIN_SUCCESS, (msg) => {
            isAuthenticated.value = true;
            player.value = msg.player;
        });

        client.on<S2CError>(S2CMessageType.ERROR, (msg) => {
            lastError.value = `${msg.code}: ${msg.message}`;
            console.error("Game Error:", msg);
        });

        client.on<any>(S2CMessageType.QUEUE_JOINED, (msg) => {
            inQueue.value = true;
            queuePosition.value = msg.position;
        });

        client.on<S2CMatchStart>(S2CMessageType.MATCH_START, (msg) => {
            inQueue.value = false;
            matchData.value = msg;
            // Navigate to match view usually handled by router watcher or component
        });
    }

    function login(playerId: string) {
        GameClient.getInstance().login(playerId);
    }

    function findMatch(deckId?: string) {
        GameClient.getInstance().findMatch(deckId);
    }

    return {
        isConnected,
        isAuthenticated,
        player,
        inQueue,
        queuePosition,
        matchData,
        lastError,
        initialize,
        login,
        findMatch
    };
});
