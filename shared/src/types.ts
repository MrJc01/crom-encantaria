/**
 * Shared Types for Magic Royale
 */

// ==========================================
// TAGS & ENUMS
// ==========================================

export enum AffinityTag {
    HUMAN = 'HUMAN',
    DEMON = 'DEMON',
    WATER_ELEMENTAL = 'WATER_ELEMENTAL',
    UNDEAD = 'UNDEAD',
    SOLAR = 'SOLAR',
    VOID = 'VOID',
    NATURE = 'NATURE',
    STEEL = 'STEEL',
    MELEE = 'MELEE',
    RANGED = 'RANGED',
}

export enum SlotType {
    WEAPON = 'weapon',
    ARMOR = 'armor',
    ARTIFACT = 'artifact',
}

export enum EntityState {
    IDLE = 'IDLE',
    MOVING = 'MOVING',
    ATTACKING = 'ATTACKING',
    COOLDOWN = 'COOLDOWN',
    DEAD = 'DEAD',
}

// ==========================================
// UNIT DEFINITIONS
// ==========================================

export interface UnitBaseStats {
    health: number;
    damage: number;
    attackSpeed: number;
    range: number;
    aggroRange: number;
    moveSpeed: number;
}


export interface UnitSlots {
    [SlotType.WEAPON]?: boolean;
    [SlotType.ARMOR]?: boolean;
    [SlotType.ARTIFACT]?: boolean;
}

export interface UnitBase {
    unitId: string;
    name: string;
    description: string;
    baseStats: UnitBaseStats;
    manaCost: number;
    tags: AffinityTag[];
    slots: UnitSlots;
    sprite3d?: string; // Legacy or likely to be replaced by sprite2d
    sprite2d?: string; // Future proofing
}

export function unitHasSlot(unit: UnitBase, slotType: SlotType): boolean {
    return unit.slots[slotType] === true;
}

export function unitHasTag(unit: UnitBase, tag: AffinityTag): boolean {
    return unit.tags.includes(tag);
}


// ==========================================
// ITEM DEFINITIONS
// ==========================================

export interface ItemStatsModifier {
    health?: number;
    damage?: number;
    attackSpeed?: number;
    range?: number;
    moveSpeed?: number;
}

export interface ItemRequirements {
    allowedTags: AffinityTag[];
    forbiddenTags: AffinityTag[];
}

export interface Item {
    itemId: string;
    name: string;
    description: string;
    slot: SlotType;
    manaWeight: number;
    statsModifier: ItemStatsModifier;
    requirements: ItemRequirements;
    sprite3d?: string;
    sprite2d?: string;
}

export function itemHasAllowedTagRequirement(item: Item): boolean {
    return item.requirements.allowedTags.length > 0;
}

export function isTagForbiddenByItem(item: Item, tag: AffinityTag): boolean {
    return item.requirements.forbiddenTags.includes(tag);
}


// ==========================================
// GAME STATE
// ==========================================

export interface Vector2D {
    x: number;
    y: number;
}

export interface EntitySnapshot {
    id: string;
    ownerId: string;
    unitId: string;
    position: Vector2D;
    hp: number;
    maxHp: number;
    state: EntityState;
    targetId: string | null;
}

// ==========================================
// DECK & INVENTORY
// ==========================================

export interface CardConfig {
    slotIndex: number;
    baseUnitId: string;
    equippedItems: string[];
}

export interface PlayerDeck {
    deckId: string;
    playerId: string;
    deckName: string;
    cards: CardConfig[];
    createdAt: Date;
    updatedAt: Date;
}

export interface PlayerInventory {
    playerId: string;
    unlockedUnits: string[];
    ownedItems: string[];
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

export interface ValidationError {
    code: ValidationErrorCode;
    message: string;
    cardIndex?: number;
    itemId?: string;
    unitId?: string;
}

export enum ValidationErrorCode {
    UNIT_NOT_FOUND = 'UNIT_NOT_FOUND',
    ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
    UNIT_NOT_OWNED = 'UNIT_NOT_OWNED',
    ITEM_NOT_OWNED = 'ITEM_NOT_OWNED',
    INVALID_SLOT = 'INVALID_SLOT',
    MISSING_REQUIRED_TAG = 'MISSING_REQUIRED_TAG',
    FORBIDDEN_TAG_CONFLICT = 'FORBIDDEN_TAG_CONFLICT',
    EMPTY_DECK = 'EMPTY_DECK',
    DUPLICATE_SLOT = 'DUPLICATE_SLOT',
}

