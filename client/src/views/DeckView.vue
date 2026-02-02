<script setup lang="ts">
import MainLayout from '../components/MainLayout.vue';
import CardComponent from '../components/CardComponent.vue';
import { useGameStore } from '../stores/game';
import { ref } from 'vue';

const gameStore = useGameStore();
const selectedCollectionCard = ref<string | null>(null);

function getCardData(id: string) {
    return gameStore.collection.find(c => c.id === id);
}

function handleCollectionClick(cardId: string) {
    selectedCollectionCard.value = cardId;
}

function handleDeckSlotClick(index: number) {
    if (selectedCollectionCard.value) {
        const existingIdx = gameStore.currentDeck.indexOf(selectedCollectionCard.value);
        const newDeck = [...gameStore.currentDeck];
        
        if (existingIdx !== -1) {
            const temp = newDeck[index];
            const existingCard = newDeck[existingIdx];
            if (temp !== undefined && existingCard !== undefined) {
                newDeck[index] = existingCard;
                newDeck[existingIdx] = temp;
            }
        } else {
            newDeck[index] = selectedCollectionCard.value;
        }
        
        gameStore.setDeck(newDeck);
        selectedCollectionCard.value = null;
    } 
}
</script>

<template>
    <MainLayout>
        <!-- Full height container for DeckView -->
        <div class="h-full w-full flex flex-col p-3 box-border overflow-hidden">
            
            <!-- Top Section: Deck (Fixed Height) -->
            <div class="shrink-0 mb-4">
                <div class="flex justify-between items-center mb-2 px-1">
                    <h2 class="text-xl font-black italic uppercase tracking-tighter">BATTLE DECK</h2>
                    <div class="flex items-center gap-1.5 text-elixir font-black bg-black bg-opacity-40 px-3 py-1 rounded-lg border border-elixir border-opacity-30">
                        <span class="text-sm">💧</span>
                        <span class="text-xs">AVG ELIXIR: {{ gameStore.averageElixir }}</span>
                    </div>
                </div>

                <div class="grid grid-cols-4 gap-2 bg-black bg-opacity-20 p-2 rounded-xl border border-white border-opacity-5">
                    <div 
                        v-for="(cardId, index) in gameStore.currentDeck" 
                        :key="index"
                        @click="handleDeckSlotClick(index)"
                        class="aspect-[3/4] bg-black bg-opacity-40 border-2 border-dashed border-[#444] rounded-lg flex items-center justify-center hover:border-royale-gold-light transition-colors cursor-pointer"
                    >
                        <CardComponent 
                            v-if="cardId"
                            :id="cardId" 
                            :elixir="getCardData(cardId)?.elixir"
                            :level="getCardData(cardId)?.level"
                        />
                    </div>
                </div>
            </div>

            <!-- Bottom Section: Collection (Flexible & Scrollable) -->
            <div class="flex-1 flex flex-col min-h-0 bg-black bg-opacity-30 border border-white border-opacity-10 rounded-lg overflow-hidden">
                <div class="bg-[#333] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border-b border-white border-opacity-10 shrink-0">
                    FOUND CARDS ({{ gameStore.collection.length }})
                </div>

                <!-- Scrollable Area -->
                <div class="flex-1 overflow-y-auto p-2 scrollbar-hide">
                    <div class="grid grid-cols-4 gap-x-2 gap-y-4 pb-4">
                        <div 
                            v-for="card in gameStore.collection"
                            :key="card.id"
                            @click="handleCollectionClick(card.id)"
                            class="relative flex flex-col items-center"
                        >
                            <CardComponent 
                                :id="card.id" 
                                :elixir="card.elixir" 
                                :level="card.level"
                                :selected="selectedCollectionCard === card.id"
                            />
                            <div v-if="gameStore.currentDeck.includes(card.id)" 
                                 class="absolute -bottom-2 bg-[#222] text-[#888] text-[8px] font-black px-1.5 py-0.5 rounded border border-[#444] z-10 pointer-events-none">
                                IN DECK
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </MainLayout>
</template>
