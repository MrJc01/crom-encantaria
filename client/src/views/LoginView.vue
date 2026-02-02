<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from '../stores/game';
import { useRouter } from 'vue-router';
import { watch } from 'vue';

const gameStore = useGameStore();
const router = useRouter();
const playerId = ref('');

function handleLogin() {
  if (playerId.value.trim()) {
    gameStore.login(playerId.value);
  }
}

watch(() => gameStore.isAuthenticated, (auth) => {
  if (auth) {
    router.push('/lobby');
  }
});
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-[#111] overflow-hidden">
    <!-- Background visual effect -->
    <div class="absolute inset-0 bg-gradient-radial from-[#222] to-[#111] opacity-50"></div>
    <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>

    <div class="relative z-10 w-full max-w-sm mx-4 bg-royale-panel p-8 rounded-[2rem] border-2 border-[#333] shadow-2xl flex flex-col items-center">
      <div class="text-6xl mb-6 drop-shadow-xl animate-pulse">👑</div>
      
      <h1 class="text-3xl font-black italic tracking-tighter text-white mb-2 uppercase">MAGIC ROYALE</h1>
      <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-10">Crom Encantaria Edition</p>

      <div class="w-full space-y-6">
        <div>
          <label class="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-4 tracking-widest">Player ID</label>
          <input 
            v-model="playerId"
            type="text" 
            placeholder="hero_1..." 
            class="w-full bg-black bg-opacity-50 border-2 border-[#444] rounded-2xl px-6 py-4 text-white focus:border-royale-blue outline-none transition-all placeholder:text-gray-700 font-bold"
            @keyup.enter="handleLogin"
          />
        </div>

        <button 
          @click="handleLogin"
          class="btn-royale btn-yellow w-full py-5 text-2xl tracking-tighter italic"
          :disabled="gameStore.isConnected === false"
        >
          {{ gameStore.isConnected ? 'ENTRAR' : 'CONECTANDO...' }}
        </button>

        <p v-if="gameStore.lastError" class="text-red-500 text-[10px] font-bold uppercase text-center mt-4">
          ⚠️ {{ gameStore.lastError }}
        </p>
      </div>

      <div class="mt-12 flex flex-col items-center opacity-30">
        <span class="text-[8px] font-black tracking-widest uppercase">Server Status</span>
        <div class="flex items-center gap-2 mt-1">
          <div class="w-2 h-2 rounded-full" :class="gameStore.isConnected ? 'bg-green-500' : 'bg-red-500'"></div>
          <span class="text-[10px] font-bold">{{ gameStore.isConnected ? 'ONLINE' : 'OFFLINE' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>


