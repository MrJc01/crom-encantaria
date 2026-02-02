<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    id: string;
    level?: number;
    elixir?: number;
    image?: string;
    selected?: boolean;
}>();

// Placeholder color mapping based on ID simple hash
const bgColor = computed(() => {
    let hash = 0;
    for (let i = 0; i < props.id.length; i++) {
        hash = props.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 60%, 40%)`;
});
</script>

<template>
    <div class="w-[90px] h-[110px] relative cursor-pointer transition-transform duration-100 group shrink-0" :class="{ '-translate-y-2': selected }">
        <div class="w-full h-full rounded-lg border-[3px] overflow-hidden relative shadow-lg flex flex-col items-center transition-colors" 
             :class="[selected ? 'border-royale-gold-light shadow-[0_0_15px_rgba(252,225,75,0.6)]' : 'border-[#333]']"
             :style="{ background: bgColor }">
            
            <!-- Elixir Cost badge -->
            <div class="absolute -top-1 -left-1 bg-elixir text-white text-[10px] px-1.5 py-0.5 rounded-br-lg rounded-tl-sm font-black z-10 shadow-md border border-white border-opacity-20 translate-x-px translate-y-px">
                💧 {{ elixir || '?' }}
            </div>
            
            <div class="flex-1 flex items-center justify-center text-4xl drop-shadow-md">
                <span class="placeholder-icon group-hover:scale-110 transition-transform">⚔️</span>
            </div>

            <div class="absolute bottom-5 bg-royale-gold text-[#332a00] text-[9px] px-2 py-0.5 rounded-full border border-white font-black shadow-sm" v-if="level">
                LVL {{ level }}
            </div>
            
            <div class="w-full bg-black bg-opacity-70 text-white text-[10px] font-bold text-center py-1 uppercase tracking-tighter truncate px-1">
                {{ id }}
            </div>
        </div>
    </div>
</template>
