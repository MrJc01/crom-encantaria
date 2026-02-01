<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { useRouter } from 'vue-router'; // Unused in this snippet but good to have

const gameStore = useGameStore();
// Placeholder for match view
</script>

<template>
    <div class="match-view">
        <div class="overlay">
            <h1>PARTIDA INICIADA</h1>
            <div class="info" v-if="gameStore.matchData">
                <div class="vs">
                    <span class="p1">VOCÊ ({{ gameStore.matchData.you.playerIndex }})</span>
                    <span>VS</span>
                    <span class="p2">OPONENTE</span>
                </div>
                <div class="room-id">Sala: {{ gameStore.matchData.roomId }}</div>
            </div>
            
            <div class="waiting">
                Aguardando renderização do jogo...
                (Este é apenas um placeholder da Fase 6)
            </div>
        </div>
    </div>
</template>

<style scoped>
.match-view {
    height: 100vh;
    background-color: black;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
}

.overlay {
    text-align: center;
}

h1 {
    font-size: 3rem;
    color: #ff4444;
    text-shadow: 0 0 20px #ff0000;
}

.vs {
    font-size: 1.5rem;
    margin: 2rem 0;
    font-weight: bold;
}

.waiting {
    margin-top: 3rem;
    color: #666;
}
</style>
