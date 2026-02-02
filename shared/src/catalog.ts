/**
 * Shared Catalog (Single Source of Truth)
 */

import { UnitBase, Item, AffinityTag, SlotType } from './types.js';

// ==========================================
// UNITS
// ==========================================

export const UNITS: UnitBase[] = [
    {
        unitId: 'knight_base',
        name: 'Cavaleiro',
        description: 'Guerreiro corpo-a-corpo equilibrado. Fiel ao reino e resistente em batalha.',
        baseStats: {
            health: 200,
            damage: 25,
            attackSpeed: 1.0,
            range: 1.5,
            aggroRange: 8.0,
            moveSpeed: 2.0
        },

        manaCost: 3,
        tags: [AffinityTag.HUMAN, AffinityTag.STEEL, AffinityTag.MELEE],
        slots: {
            [SlotType.WEAPON]: true,
            [SlotType.ARMOR]: true,
            [SlotType.ARTIFACT]: true
        },
        sprite3d: 'models/knight.glb'
    },
    {
        unitId: 'archer_base',
        name: 'Arqueira',
        description: 'Atiradora ágil das florestas. Precisa e mortal à distância.',
        baseStats: {
            health: 120,
            damage: 35,
            attackSpeed: 1.2,
            range: 6.0,
            aggroRange: 10.0,
            moveSpeed: 2.5
        },

        manaCost: 3,
        tags: [AffinityTag.HUMAN, AffinityTag.NATURE, AffinityTag.RANGED],
        slots: {
            [SlotType.WEAPON]: true,
            [SlotType.ARMOR]: true,
            [SlotType.ARTIFACT]: true
        },
        sprite3d: 'models/archer.glb'
    },
    {
        unitId: 'mage_solar',
        name: 'Mago Solar',
        description: 'Conjurador de luz. Canaliza o poder do sol para devastar inimigos.',
        baseStats: {
            health: 80,
            damage: 60,
            attackSpeed: 0.8,
            range: 5.5,
            aggroRange: 9.0,
            moveSpeed: 1.8
        },

        manaCost: 4,
        tags: [AffinityTag.HUMAN, AffinityTag.SOLAR, AffinityTag.RANGED],
        slots: {
            [SlotType.WEAPON]: true,
            [SlotType.ARMOR]: false,
            [SlotType.ARTIFACT]: true
        },
        sprite3d: 'models/mage_solar.glb'
    }
];

// ==========================================
// ITEMS
// ==========================================

export const ITEMS: Item[] = [
    {
        itemId: 'sword_flame_t1',
        name: 'Espada de Fogo',
        description: 'Uma lâmina forjada em chamas eternas. Queima inimigos ao toque.',
        slot: SlotType.WEAPON,
        manaWeight: 1,
        statsModifier: {
            damage: 50,
            attackSpeed: -0.1
        },
        requirements: {
            allowedTags: [AffinityTag.HUMAN, AffinityTag.DEMON],
            forbiddenTags: [AffinityTag.WATER_ELEMENTAL, AffinityTag.NATURE]
        },
        sprite3d: 'models/items/sword_flame.glb'
    },
    {
        itemId: 'longbow_t2',
        name: 'Arco Longo',
        description: 'Arco de precisão para atiradores experientes. Alcance aumentado.',
        slot: SlotType.WEAPON,
        manaWeight: 1,
        statsModifier: {
            damage: 20,
            range: 2.0
        },
        requirements: {
            allowedTags: [AffinityTag.RANGED],
            forbiddenTags: [AffinityTag.MELEE]
        },
        sprite3d: 'models/items/longbow.glb'
    },
    {
        itemId: 'steel_plate_t2',
        name: 'Armadura de Placas',
        description: 'Proteção pesada de aço forjado. Reduz velocidade mas aumenta resistência.',
        slot: SlotType.ARMOR,
        manaWeight: 1,
        statsModifier: {
            health: 100,
            moveSpeed: -0.3
        },
        requirements: {
            allowedTags: [AffinityTag.HUMAN, AffinityTag.STEEL],
            forbiddenTags: []
        },
        sprite3d: 'models/items/steel_plate.glb'
    },
    {
        itemId: 'staff_ice_t1',
        name: 'Cajado de Gelo',
        description: 'Canaliza o frio eterno. Incompatível com magia solar.',
        slot: SlotType.WEAPON,
        manaWeight: 2,
        statsModifier: {
            damage: 40,
            attackSpeed: 0.2
        },
        requirements: {
            allowedTags: [],
            forbiddenTags: [AffinityTag.SOLAR]
        },
        sprite3d: 'models/items/staff_ice.glb'
    },
    {
        itemId: 'shadow_relic',
        name: 'Relíquia das Sombras',
        description: 'Artefato corrompido pelo vazio. Apenas criaturas das trevas podem usar.',
        slot: SlotType.ARTIFACT,
        manaWeight: 2,
        statsModifier: {
            damage: 30,
            health: -20
        },
        requirements: {
            allowedTags: [AffinityTag.VOID, AffinityTag.DEMON],
            forbiddenTags: [AffinityTag.SOLAR]
        },
        sprite3d: 'models/items/shadow_relic.glb'
    }
];

//Cache for O(1) Access
export const UnitsMap = new Map<string, UnitBase>(UNITS.map(u => [u.unitId, u]));
export const ItemsMap = new Map<string, Item>(ITEMS.map(i => [i.itemId, i]));

export function getUnitById(id: string): UnitBase | undefined {
    return UnitsMap.get(id);
}

export function getItemById(id: string): Item | undefined {
    return ItemsMap.get(id);
}
