/**
 * Shared Network Protocol
 */

import { EntityState, Vector2D } from './types.js';

// ============================================
// ENUMS DE TIPO DE MENSAGEM
// ============================================

export enum C2SMessageType {
    QUEUE_JOIN = 'QUEUE_JOIN',
    QUEUE_LEAVE = 'QUEUE_LEAVE',
    SPAWN_CARD = 'SPAWN_CARD',
    LOGIN = 'LOGIN',
}

export enum S2CMessageType {
    QUEUE_JOINED = 'QUEUE_JOINED',
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    MATCH_START = 'MATCH_START',
    ENTITY_SPAWNED = 'ENTITY_SPAWNED',
    GAME_TICK = 'GAME_TICK',
    MATCH_END = 'MATCH_END',
    ERROR = 'ERROR',
}

export enum ErrorCode {
    INSUFFICIENT_MANA = 'INSUFFICIENT_MANA',
    INVALID_POSITION = 'INVALID_POSITION',
    INVALID_CARD_INDEX = 'INVALID_CARD_INDEX',
    CARD_NOT_FOUND = 'CARD_NOT_FOUND',
    GAME_NOT_RUNNING = 'GAME_NOT_RUNNING',
}

export enum EntityStateCode {
    IDLE = 0,
    MOVING = 1,
    ATTACKING = 2,
    COOLDOWN = 3,
    DEAD = 4,
}

export function stateToCode(state: EntityState): EntityStateCode {
    switch (state) {
        case EntityState.IDLE: return EntityStateCode.IDLE;
        case EntityState.MOVING: return EntityStateCode.MOVING;
        case EntityState.ATTACKING: return EntityStateCode.ATTACKING;
        case EntityState.COOLDOWN: return EntityStateCode.COOLDOWN;
        case EntityState.DEAD: return EntityStateCode.DEAD;
        default: return EntityStateCode.IDLE;
    }
}

// ============================================
// MENSAGENS CLIENT -> SERVER (C2S)
// ============================================

export interface C2SMessageBase {
    type: C2SMessageType;
}

export interface C2SQueueJoin extends C2SMessageBase {
    type: C2SMessageType.QUEUE_JOIN;
    deckId?: string;
}

export interface C2SQueueLeave extends C2SMessageBase {
    type: C2SMessageType.QUEUE_LEAVE;
}

export interface C2SSpawnCard extends C2SMessageBase {
    type: C2SMessageType.SPAWN_CARD;
    cardIndex: number;
    x: number;
    y: number;
}

export interface C2SLogin extends C2SMessageBase {
    type: C2SMessageType.LOGIN;
    playerId: string;
}

export type C2SMessage = C2SQueueJoin | C2SQueueLeave | C2SSpawnCard | C2SLogin;

// ============================================
// MENSAGENS SERVER -> CLIENT (S2C)
// ============================================

export interface S2CMessageBase {
    type: S2CMessageType;
}

export interface S2CQueueJoined extends S2CMessageBase {
    type: S2CMessageType.QUEUE_JOINED;
    position: number;
}

export interface PlayerMatchData {
    playerId: string;
    playerIndex: 1 | 2;
    deckId: string;
}

export interface S2CMatchStart extends S2CMessageBase {
    type: S2CMessageType.MATCH_START;
    roomId: string;
    you: PlayerMatchData;
    opponent: PlayerMatchData;
    tickRate: number;
}

export interface EntitySpawnData {
    id: string;
    ownerId: string;
    unitId: string;
    unitIdRef?: string; // Optional reference if unitId is obscure, but unitId should be the catalog string key
    maxHp: number;
    position: Vector2D;
}

export interface S2CEntitySpawned extends S2CMessageBase {
    type: S2CMessageType.ENTITY_SPAWNED;
    entity: EntitySpawnData;
}

export interface EntityDelta {
    id: string;
    x: number;
    y: number;
    hp: number;
    s: EntityStateCode;
}

export interface TowerDelta {
    id: string;
    hp: number;
}

export interface GameTickPayload {
    tick: number;
    mana1: number;
    mana2: number;
    entities: EntityDelta[];
    towers: TowerDelta[];
}

export interface S2CGameTick extends S2CMessageBase {
    type: S2CMessageType.GAME_TICK;
    payload: GameTickPayload;
}

export interface S2CMatchEnd extends S2CMessageBase {
    type: S2CMessageType.MATCH_END;
    winnerId: string;
    reason: string;
}

export interface S2CError extends S2CMessageBase {
    type: S2CMessageType.ERROR;
    code: string;
    message: string;
}

export interface S2CLoginSuccess extends S2CMessageBase {
    type: S2CMessageType.LOGIN_SUCCESS;
    player: {
        id: string;
        name: string;
        inventory: string[];
    };
    deck: {
        id: string;
        name: string;
        cards: string[];
    };
}

export type S2CMessage =
    | S2CQueueJoined
    | S2CLoginSuccess
    | S2CMatchStart
    | S2CEntitySpawned
    | S2CGameTick
    | S2CMatchEnd
    | S2CError;

// ============================================
// HELPERS
// ============================================

export function serializeMessage(message: S2CMessage): string {
    return JSON.stringify(message);
}

export function parseC2SMessage(data: string): C2SMessage {
    const parsed = JSON.parse(data);

    if (!parsed || typeof parsed.type !== 'string') {
        throw new Error('Invalid message format: missing type');
    }

    if (!Object.values(C2SMessageType).includes(parsed.type)) {
        throw new Error(`Unknown message type: ${parsed.type}`);
    }

    return parsed as C2SMessage;
}

export function createErrorMessage(code: string, message: string): S2CError {
    return {
        type: S2CMessageType.ERROR,
        code,
        message,
    };
}
