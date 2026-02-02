<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { useRouter } from 'vue-router';
import { watch } from 'vue';
import MainLayout from '../components/MainLayout.vue';

const gameStore = useGameStore();
const router = useRouter();

// Watch for match start
watch(() => gameStore.matchData, (match) => {
    if (match) {
        router.push('/match');
    }
});

function handleBattle() {
    gameStore.findMatch();
}
</script>

<template>
    <MainLayout>
        <div class="flex flex-col h-full items-center justify-between py-6 px-4">
            <!-- Center Arena Preview -->
            <div class="flex-[2] w-full max-w-md flex flex-col items-center justify-center text-gray-400 bg-[#222] rounded-2xl border-2 border-[#444] shadow-inner overflow-hidden relative group">
                <!-- Background visual placeholder -->
                <div class="absolute inset-0 bg-gradient-to-br from-black to-[#333] opacity-50"></div>
                
                <h2 class="text-2xl font-black italic tracking-tighter relative z-10">ARENA 1</h2>
                <div class="text-6xl my-4 drop-shadow-[0_0_15px_rgba(252,225,75,0.6)] relative z-10 group-hover:scale-110 transition-transform">🛡️</div>
                <p class="uppercase font-bold tracking-widest text-sm relative z-10">Training Camp</p>
            </div>

            <!-- Battle Button Area -->
            <div class="my-8">
                <button 
                    class="btn-royale btn-yellow px-16 py-5 flex flex-col items-center min-w-[280px]" 
                    @click="handleBattle"
                    :disabled="gameStore.inQueue"
                >
                    <span class="text-3xl font-black italic -mb-1">{{ gameStore.inQueue ? 'BUSCANDO...' : 'BATALHAR' }}</span>
                    <span class="text-xs opacity-70 font-bold" v-if="!gameStore.inQueue">SEM CUSTO</span>
                </button>
            </div>

            <!-- Chest Slots -->
            <div class="flex gap-2 w-full max-w-lg h-24">
                <!-- Silver Chest -->
                <div class="flex-1 bg-[#2a2a2a] rounded-xl border-b-4 border-[#1a1a1a] flex flex-col items-center justify-center text-center border border-[#555] cursor-pointer hover:bg-[#333] transition-colors">
                    <span class="text-[10px] font-black leading-tight text-gray-300">BAÚ<br>PRATA</span>
                    <div class="text-sm mt-1">⏳ 3h</div>
                </div>

                <!-- Empty Slots -->
                <div v-for="i in 2" :key="i" class="flex-1 bg-black bg-opacity-30 rounded-xl border-b-4 border-black flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase text-center border border-[#333] border-dashed">
                    SLOT<br>VAZIO
                </div>

                <!-- Gold Chest -->
                <div class="flex-1 bg-[#332a00] rounded-xl border-b-4 border-[#1a1a1a] flex flex-col items-center justify-center text-center border-2 border-royale-gold cursor-pointer hover:bg-[#3d3300] transition-colors">
                    <span class="text-[10px] font-black leading-tight text-royale-gold-light">BAÚ<br>OURO</span>
                    <div class="text-sm mt-1 text-royale-gold-light font-bold">⏳ 8h</div>
                </div>
            </div>
        </div>
        
        <!-- Searching Overlay -->
        <div v-if="gameStore.inQueue" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1000] backdrop-blur-sm">
            <div class="bg-royale-panel p-10 rounded-3xl text-center border-2 border-[#444] shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-sm w-full mx-4">
                <h3 class="text-xl font-black italic uppercase tracking-wider mb-6">Procurando Oponente...</h3>
                <div class="text-7xl mb-10 animate-bounce">🔍</div>
                <button class="btn-royale btn-blue py-3 px-10 text-sm" @click="gameStore.inQueue = false">CANCELAR</button>
            </div>
        </div>
    </MainLayout>
</template>
