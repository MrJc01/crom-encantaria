<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router'
import { useGameStore } from './stores/game';

const gameStore = useGameStore();

onMounted(() => {
  gameStore.initialize();
});
</script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style>
/* Global reset and basic styles */
body {
  margin: 0;
  padding: 0;
  background-color: #000;
  color: white;
  font-family: 'Inter', sans-serif;
  overflow: hidden; /* Prevent scroll */
}

.app-container {
  width: 100vw;
  height: 100vh;
}
</style>
