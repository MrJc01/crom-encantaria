<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const tabs = [
    { name: 'Shop', icon: '🛒', path: '/shop' },
    { name: 'Cards', icon: '🃏', path: '/deck' },
    { name: 'Battle', icon: '⚔️', path: '/lobby' },
    { name: 'Social', icon: '👥', path: '/social' },
    { name: 'Events', icon: '📅', path: '/events' }
];

function navigate(path: string) {
    router.push(path);
}

function isActive(path: string) {
    return route.path === path;
}
</script>

<template>
    <div class="h-screen w-screen flex flex-col bg-[#111] text-white overflow-hidden">
        <!-- Header (Currency, Level) -->
        <header class="h-[60px] bg-black bg-opacity-40 flex justify-between items-center px-4 border-b-2 border-[#333] shrink-0 z-50">
            <div class="currency-badge border-royale-gold text-royale-gold">
                <span class="text-lg">💰</span>
                <span class="text-sm font-bold">1,250</span>
            </div>
            
            <div class="flex flex-col items-center">
                <div class="text-2xl text-royale-blue-light animate-pulse">⭐</div>
                <span class="text-[10px] uppercase font-bold text-gray-400">King Lvl 5</span>
            </div>

            <div class="currency-badge border-royale-blue-light text-royale-blue-light">
                <span class="text-lg">💎</span>
                <span class="text-sm font-bold">42</span>
            </div>
        </header>

        <!-- Main Content (Layout Container) -->
        <!-- We allow the child view to determine scrolling behavior -->
        <main class="flex-1 w-full relative overflow-hidden flex flex-col">
            <slot></slot>
        </main>

        <!-- Bottom Navigation -->
        <nav class="h-[70px] bg-[#1a1a1a] border-t-4 border-[#333] flex justify-around items-center shadow-2xl shrink-0 z-50">
            <div 
                v-for="tab in tabs" 
                :key="tab.name"
                class="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 cursor-pointer"
                :class="[
                    isActive(tab.path) ? 'opacity-100 bg-white bg-opacity-5' : 'opacity-50 hover:opacity-80',
                    tab.name === 'Battle' && isActive(tab.path) ? 'text-royale-gold-light' : ''
                ]"
                @click="navigate(tab.path)"
            >
                <div class="text-2xl mb-0.5 transition-transform" :class="{ 'scale-125': tab.name === 'Battle' && isActive(tab.path) }">
                    {{ tab.icon }}
                </div>
                <span class="text-[10px] uppercase font-black tracking-wider">{{ tab.name }}</span>
            </div>
        </nav>
    </div>
</template>
