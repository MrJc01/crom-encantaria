<script setup lang="ts">
import * as THREE from 'three';
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useGameStore } from '../stores/game';
import { ThreeScene } from '../three/ThreeScene';
import { WorldManager } from '../three/WorldManager';
import { EntityProxy } from '../three/EntityProxy';
import CardComponent from '../components/CardComponent.vue';

const gameStore = useGameStore();
const gameCanvas = ref<HTMLElement | null>(null);

// Three.js
let threeScene: ThreeScene | null = null;
let worldManager: WorldManager | null = null;
const entityProxies = new Map<string, EntityProxy>();

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
    if (selectedIndex.value === null) {
        return;
    }
    if (!threeScene || !worldManager?.floor) {
        return;
    }
    
    const rect = gameCanvas.value!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    console.log("Raycast NDC:", x.toFixed(2), y.toFixed(2));

    const intersection = threeScene.getIntersection(x, y, [worldManager.floor]);
    
    if (intersection) {
        const gx = intersection.point.x;
        const gy = intersection.point.z;
        console.log("Intersection found at:", gx.toFixed(2), gy.toFixed(2));

        // Debug visual
        const debugGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const debugMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        const debugMesh = new THREE.Mesh(debugGeo, debugMat);
        debugMesh.position.copy(intersection.point);
        threeScene.scene.add(debugMesh);
        setTimeout(() => threeScene?.scene.remove(debugMesh), 1000);

        gameStore.spawnCard(selectedIndex.value, gx, gy);
        selectedIndex.value = null;
    }
}

// 3D Logic
onMounted(() => {
    if (gameCanvas.value) {
        threeScene = new ThreeScene(gameCanvas.value);
        worldManager = new WorldManager(threeScene);
        gameCanvas.value.addEventListener('click', onCanvasClick);
        threeScene.start((delta) => {
            entityProxies.forEach(entity => entity.update(delta));
        });
        
        // Initial zone show if data ready
        if (gameStore.matchData) {
            worldManager.showDeployZone(gameStore.matchData.you.playerIndex);
            threeScene.setCameraPerspective(gameStore.matchData.you.playerIndex);
        }
    }
});

onUnmounted(() => {
    if (threeScene) {
        threeScene.stop();
        if (gameCanvas.value) {
            gameCanvas.value.removeEventListener('click', onCanvasClick);
        }
    }
    entityProxies.forEach(e => e.destroy());
    entityProxies.clear();
});

// Entity Sync
watch(() => gameStore.lastTick, (tick) => {
    if (!tick || !threeScene) return;
    const activeIds = new Set<string>();
    tick.entities.forEach(delta => {
        activeIds.add(delta.id);
        let proxy = entityProxies.get(delta.id);
        if (!proxy) {
            const spawnData = gameStore.entityRegistry.get(delta.id);
            if (spawnData) {
                proxy = new EntityProxy(spawnData.unitId, threeScene!, spawnData.position);
                const isMyUnit = (spawnData.ownerId === gameStore.player?.id) || 
                                 (gameStore.matchData?.you.playerIndex === 1 && spawnData.ownerId.includes('1')) || 
                                 (gameStore.matchData?.you.playerIndex === 2 && spawnData.ownerId.includes('2'));
                proxy.setColor(isMyUnit ? 0x4444ff : 0xff4444);
                entityProxies.set(delta.id, proxy);
            }
        }
        if (proxy) proxy.updateTarget({ x: delta.x, y: delta.y });
    });
    for (const [id, proxy] of entityProxies) {
        if (!activeIds.has(id)) {
            proxy.destroy();
            entityProxies.delete(id);
        }
    }
});

const hand = computed(() => gameStore.currentDeck.slice(0, 4));
const nextCard = computed(() => gameStore.currentDeck[4] || null);
const timerSeconds = computed(() => Math.floor((gameStore.lastTick?.tick || 0) / 20));

// Watch for match start to show zone
watch(() => gameStore.matchData, (data) => {
    if (data && worldManager && threeScene) {
        worldManager.showDeployZone(data.you.playerIndex);
        threeScene.setCameraPerspective(data.you.playerIndex);
    }
});

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
        <div ref="gameCanvas" class="w-full h-full"></div>
        
        <!-- HUD Overlay -->
        <div class="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 pb-10">
            
            <!-- Top Bar -->
            <div class="flex justify-between items-start">
                <div class="bg-red-600 bg-opacity-80 px-4 py-1 rounded-full text-white font-black italic tracking-tighter shadow-[0_4px_0_rgba(100,0,0,0.8)] border border-red-400 border-opacity-40 flex items-center gap-2">
                   <div class="text-xl">🛡️</div>
                   <span class="uppercase">{{ gameStore.matchData?.opponent.playerId || 'Opponent' }}</span>
                </div>
                
                <div class="bg-black bg-opacity-60 px-5 py-2 rounded-xl text-white font-black text-xl border-2 border-gray-600 shadow-2xl backdrop-blur-sm tabular-nums">
                    {{ timerSeconds }}s
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
                Tap on green zone to spawn!
            </div>
        </div>
    </div>
</template>
