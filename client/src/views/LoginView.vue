<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from '../stores/game';
import { useRouter } from 'vue-router';
import { watch } from 'vue';

const playerId = ref('hero_1');
const gameStore = useGameStore();
const router = useRouter();

// Watch for authentication to redirect
watch(() => gameStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    router.push('/lobby');
  }
});

function handleLogin() {
  gameStore.login(playerId.value);
}
</script>

<template>
  <div class="login-view">
    <h1>Crom Encantaria</h1>
    <div class="login-box">
      <input v-model="playerId" placeholder="Player ID" @keyup.enter="handleLogin" />
      <button @click="handleLogin">ENTRAR</button>
    </div>
    <div v-if="gameStore.lastError" class="error">
      {{ gameStore.lastError }}
    </div>
    <div class="status">
      Status: {{ gameStore.isConnected ? 'Conectado' : 'Desconectado' }}
    </div>
  </div>
</template>

<style scoped>
.login-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #1a1a1a;
  color: #d4af37; /* Gold */
}

h1 {
  font-size: 3rem;
  margin-bottom: 2rem;
  text-shadow: 0 0 10px #d4af37;
}

.login-box {
  display: flex;
  gap: 1rem;
}

input {
  padding: 0.5rem;
  font-size: 1.2rem;
  border: 2px solid #333;
  background: #222;
  color: white;
}

button {
  padding: 0.5rem 1.5rem;
  font-size: 1.2rem;
  background: #d4af37;
  color: black;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background: #f4cf57;
}

.error {
  margin-top: 1rem;
  color: #ff4444;
}

.status {
  margin-top: 2rem;
  font-size: 0.8rem;
  opacity: 0.5;
}
</style>
