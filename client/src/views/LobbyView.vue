<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { useRouter } from 'vue-router';
import { watch } from 'vue';

const gameStore = useGameStore();
const router = useRouter();

// Watch for match start
watch(() => gameStore.matchData, (match) => {
    if (match) {
        router.push('/match');
    }
});

function handleFindMatch() {
    gameStore.findMatch();
    // Assuming default deck for now
}
</script>

<template>
    <div class="lobby-view">
        <header>
            <h2>Lobby</h2>
            <div class="user-info" v-if="gameStore.player">
                <span>{{ gameStore.player.name }}</span>
                <span class="id">#{{ gameStore.player.id }}</span>
            </div>
        </header>

        <main>
            <div class="deck-preview">
                <h3>Seu Deck</h3>
                <div class="cards">
                    <div class="card-placeholder" v-for="i in 8" :key="i">
                        {{ i }}
                    </div>
                </div>
            </div>

            <div class="action-area">
                <button 
                    class="btn-battle" 
                    @click="handleFindMatch" 
                    :disabled="gameStore.inQueue"
                >
                    {{ gameStore.inQueue ? 'PROCURANDO...' : 'PROCURAR PARTIDA' }}
                </button>
                <div v-if="gameStore.inQueue" class="queue-status">
                    Na fila... Posição estimada: {{ gameStore.queuePosition }}
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
.lobby-view {
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 2rem;
    box-sizing: border-box;
    background: linear-gradient(to bottom, #1a1a1a, #000);
}

header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #333;
    padding-bottom: 1rem;
}

.user-info {
    text-align: right;
}

.user-info .id {
    font-size: 0.8rem;
    color: #666;
    display: block;
}

main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 3rem;
}

.cards {
    display: flex;
    gap: 1rem;
}

.card-placeholder {
    width: 60px;
    height: 90px;
    background: #333;
    border: 1px solid #555;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
}

.btn-battle {
    font-size: 2rem;
    padding: 1rem 4rem;
    background: linear-gradient(45deg, #d4af37, #f4cf57);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
    color: black;
    font-weight: 900;
    text-transform: uppercase;
    transition: transform 0.1s;
}

.btn-battle:hover:not(:disabled) {
    transform: scale(1.05);
}

.btn-battle:disabled {
    filter: grayscale(1);
    cursor: wait;
}

.queue-status {
    margin-top: 1rem;
    color: #ffd700;
    text-align: center;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
}
</style>
