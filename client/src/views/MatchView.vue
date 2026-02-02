
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useGameStore } from '../stores/game';
import { WorldRenderer2D } from '../renderer/WorldRenderer2D';
import CardComponent from '../components/CardComponent.vue';

const gameStore = useGameStore();
const gameCanvas = ref<HTMLElement | null>(null);

// 2D Renderer
let worldRenderer: WorldRenderer2D | null = null;

// Interaction State
const selectedIndex = ref<number | null>(null);

function handleCardSelect(index: number) {
    if (selectedIndex.value === index) {
        selectedIndex.value = null;
    } else {
        selectedIndex.value = index;
    }
}

function onCanvasClick(e: MouseEvent) {
    if (selectedIndex.value === null || !worldRenderer) {
        return;
    }
    
    const rect = gameCanvas.value!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    
    const logical = worldRenderer.getViewport().toLogical(px, py);
    
    console.log("Canvas Click (Logical):", logical.x.toFixed(2), logical.y.toFixed(2));

    // Spawn Request
    gameStore.spawnCard(selectedIndex.value, logical.x, logical.y);
    selectedIndex.value = null;
}

// Autoplay Logic (Step 4 preview)
const isAutoplay = ref(new URLSearchParams(window.location.search).get('autoplay') === 'true');
let autoplayInterval: any = null;

function startAutoplay() {
    if (!isAutoplay.value) return;
    console.log("🎮 Autoplay Active");
    autoplayInterval = setInterval(() => {
        if (selectedIndex.value !== null) return; // Wait if one is somehow selected
        
        // Pick random card from hand (0-3)
        const randIndex = Math.floor(Math.random() * 4);
        
        // Pick random position in my deploy zone
        // P1: y [0-15], P2: y [25-40]
        const playerIdx = gameStore.matchData?.you.playerIndex || 1;
        const x = Math.random() * 30;
        const y = playerIdx === 1 ? (Math.random() * 15) : (25 + Math.random() * 15);
        
        console.log(`[Autoplay] Spawning card ${randIndex} at (${x.toFixed(1)}, ${y.toFixed(1)})`);
        gameStore.spawnCard(randIndex, x, y);
    }, 3000);
}

onMounted(async () => {
    if (gameCanvas.value) {
        worldRenderer = new WorldRenderer2D(gameCanvas.value);
        const playerIdx = gameStore.matchData?.you.playerIndex || 1;
        if (playerIdx === 2) {
            worldRenderer.getViewport().setFlipped(true);
        }
        
        await worldRenderer.init();
        gameCanvas.value.addEventListener('click', onCanvasClick);
        
        if (isAutoplay.value) {
            startAutoplay();
        }
    }
});

onUnmounted(() => {
    if (worldRenderer) {
        worldRenderer.destroy();
    }
    if (gameCanvas.value) {
        gameCanvas.value.removeEventListener('click', onCanvasClick);
    }
    if (autoplayInterval) {
        clearInterval(autoplayInterval);
    }
});

// Entity Sync
watch(() => gameStore.lastTick, (tick) => {
    if (!tick || !worldRenderer) return;
    
    // Sync entities
    worldRenderer.updateEntities(tick.entities);
});

// Registry Watch for Spawns
// The server sends ENTITY_SPAWNED once, which adds to gameStore.entityRegistry.
// We need to ensure the renderer spawns it.
// Registry Watch for Spawns
watch(() => gameStore.entityRegistry.size, () => {
    if (!worldRenderer) return;
    gameStore.entityRegistry.forEach((data, _id) => {
        worldRenderer?.spawnEntity(data);
    });
}, { immediate: true });


const hand = computed(() => gameStore.currentDeck.slice(0, 4));
const nextCard = computed(() => gameStore.currentDeck[4] || null);
const timerSeconds = computed(() => Math.floor((gameStore.lastTick?.tick || 0) / 20));

// Auto-clear error
watch(() => gameStore.lastError, (err) => {
    if (err) {
        setTimeout(() => {
            gameStore.lastError = null;
        }, 3000);
    }
});
</script>

<template>
    <div class="relative w-screen h-screen bg-black overflow-hidden select-none">
        <!-- New 2D Canvas Container -->
        <div ref="gameCanvas" class="w-full h-full"></div>
        
        <!-- HUD Overlay -->
        <div class="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 pb-10">
            
            <!-- Top Bar -->
            <div class="flex justify-between items-start">
                <div class="bg-red-600 bg-opacity-80 px-4 py-1 rounded-full text-white font-black italic tracking-tighter shadow-[0_4px_0_rgba(100,0,0,0.8)] border border-red-400 border-opacity-40 flex items-center gap-2">
                   <div class="text-xl">🛡️</div>
                   <span class="uppercase">{{ gameStore.matchData?.opponent.playerId || 'Opponent' }}</span>
                </div>
                
                <div class="flex items-center gap-2">
                    <div v-if="isAutoplay" class="bg-blue-600 px-3 py-1 rounded-lg text-white font-bold animate-pulse text-xs">
                        AUTOPLAY ON
                    </div>
                    <div class="bg-black bg-opacity-60 px-5 py-2 rounded-xl text-white font-black text-xl border-2 border-gray-600 shadow-2xl backdrop-blur-sm tabular-nums">
                        {{ timerSeconds }}s
                    </div>
                </div>
            </div>

            <!-- Error Toast -->
            <div v-if="gameStore.lastError" 
                 class="absolute top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg font-bold shadow-2xl border-2 border-red-400 z-50 animate-bounce">
                ⚠️ {{ gameStore.lastError }}
            </div>

            <!-- Bottom: Hand & Mana -->
            <div class="pointer-events-auto grid grid-cols-[80px_1fr] grid-rows-[auto_auto] gap-3 items-end max-w-2xl mx-auto w-full">
                
                <!-- Next Card Bubble -->
                <div class="flex flex-col items-center bg-black bg-opacity-60 rounded-xl p-2 border-2 border-gray-700 shadow-xl" v-if="nextCard">
                    <span class="text-[8px] font-black text-royale-gold-light uppercase mb-1">NEXT</span>
                    <div class="w-10 h-12 bg-[#333] rounded-md border border-gray-600 flex items-center justify-center text-xl shadow-inner">
                         <span class="drop-shadow-sm">🃏</span>
                    </div>
                </div>

                <!-- Hand Cards -->
                <div class="flex justify-center gap-4 h-[130px] items-end">
                    <div 
                        v-for="(cardId, index) in hand" 
                        :key="index"
                        @click="handleCardSelect(index)"
                        class="transition-all duration-300 transform cursor-pointer hover:scale-105"
                        :class="{ '-translate-y-6 scale-110 z-20': selectedIndex === index }"
                    >
                        <CardComponent 
                            :id="cardId" 
                            :elixir="gameStore.collection.find(c => c.id === cardId)?.elixir"
                        />
                    </div>
                </div>

                <!-- Elixir Bar -->
                <div class="col-span-2 pt-2">
                    <div class="h-8 bg-black bg-opacity-70 border-[3px] border-[#111] rounded-full relative overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] border-opacity-50">
                        <div class="h-full bg-gradient-to-b from-elixir to-elixir-dark shadow-[0_0_20px_#d0f] transition-all duration-300"
                             :style="{ width: (gameStore.myMana * 10) + '%' }"></div>
                        
                        <!-- Notches -->
                        <div class="absolute inset-0 flex">
                            <i v-for="n in 9" :key="n" class="flex-1 border-r border-black border-opacity-20"></i>
                        </div>
                        
                        <span class="absolute right-4 top-1/2 -translate-y-1/2 font-black text-white text-xl italic tracking-tighter drop-shadow-md">
                            {{ Math.floor(gameStore.myMana) }}
                        </span>

                        <!-- Mana filling glint effect -->
                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
            </div>

            <!-- Active Selection Hint -->
            <div v-if="selectedIndex !== null" 
                 class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 text-white px-6 py-3 rounded-2xl font-black italic uppercase tracking-widest border-2 border-royale-gold-light animate-bounce shadow-2xl">
                Tap on map to spawn!
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}
</style>
