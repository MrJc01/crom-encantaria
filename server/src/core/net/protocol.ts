/**
 * Magic Royale - Network Protocol
 * 
 * Define todas as interfaces de mensagem entre cliente e servidor.
 * Otimizado para performance: payloads leves no game loop.
 * 
 * FASE 3: Real-Time WebSocket Server
 * 
 * @module core/net/protocol
 */

import type { EntityState } from '../game/entity.js';
import type { Vector2D } from '../game/physics.js';

// ============================================
// ENUMS DE TIPO DE MENSAGEM
// ============================================

/**
 * Tipos de mensagem Client → Server
 */
export enum C2SMessageType {
    /** Entrar na fila de matchmaking */
    QUEUE_JOIN = 'QUEUE_JOIN',
    /** Sair da fila de matchmaking */
    QUEUE_LEAVE = 'QUEUE_LEAVE',
    /** Spawnar uma carta no campo */
    SPAWN_CARD = 'SPAWN_CARD',
}

/**
 * Tipos de mensagem Server → Client
 */
export enum S2CMessageType {
    /** Confirmação de entrada na fila */
    QUEUE_JOINED = 'QUEUE_JOINED',
    /** Partida encontrada, jogo iniciando */
    MATCH_START = 'MATCH_START',
    /** Uma entidade foi spawnada (dados estáticos) */
    ENTITY_SPAWNED = 'ENTITY_SPAWNED',
    /** Tick de atualização do jogo (dados voláteis) */
    GAME_TICK = 'GAME_TICK',
    /** Partida encerrada */
    MATCH_END = 'MATCH_END',
    /** Erro genérico */
    ERROR = 'ERROR',
}

/**
 * Códigos de erro do servidor (Anti-Cheat).
 * Usados para identificar o tipo de violação.
 */
export enum ErrorCode {
    /** Mana insuficiente para spawnar a carta */
    INSUFFICIENT_MANA = 'INSUFFICIENT_MANA',
    /** Posição de spawn fora da zona permitida */
    INVALID_POSITION = 'INVALID_POSITION',
    /** Índice da carta fora do range válido (0-7) */
    INVALID_CARD_INDEX = 'INVALID_CARD_INDEX',
    /** Carta não encontrada no deck do jogador */
    CARD_NOT_FOUND = 'CARD_NOT_FOUND',
    /** Jogo não está em execução */
    GAME_NOT_RUNNING = 'GAME_NOT_RUNNING',
}

/**
 * Estados numéricos para compressão no protocolo.
 * Mapeia EntityState para números (menor payload).
 */
export enum EntityStateCode {
    IDLE = 0,
    MOVING = 1,
    ATTACKING = 2,
    COOLDOWN = 3,
    DEAD = 4,
}

/**
 * Converte EntityState para código numérico.
 */
export function stateToCode(state: EntityState): EntityStateCode {
    switch (state) {
        case 'IDLE': return EntityStateCode.IDLE;
        case 'MOVING': return EntityStateCode.MOVING;
        case 'ATTACKING': return EntityStateCode.ATTACKING;
        case 'COOLDOWN': return EntityStateCode.COOLDOWN;
        case 'DEAD': return EntityStateCode.DEAD;
        default: return EntityStateCode.IDLE;
    }
}

// ============================================
// MENSAGENS CLIENT → SERVER (C2S)
// ============================================

/**
 * Mensagem base C2S.
 */
export interface C2SMessageBase {
    type: C2SMessageType;
}

/**
 * Jogador quer entrar na fila de matchmaking.
 */
export interface C2SQueueJoin extends C2SMessageBase {
    type: C2SMessageType.QUEUE_JOIN;
    /** ID do deck selecionado (opcional, pode usar default) */
    deckId?: string;
}

/**
 * Jogador quer sair da fila.
 */
export interface C2SQueueLeave extends C2SMessageBase {
    type: C2SMessageType.QUEUE_LEAVE;
}

/**
 * Jogador quer spawnar uma carta.
 */
export interface C2SSpawnCard extends C2SMessageBase {
    type: C2SMessageType.SPAWN_CARD;
    /** Índice da carta no deck (0-7) */
    cardIndex: number;
    /** Posição X de spawn */
    x: number;
    /** Posição Y de spawn */
    y: number;
}

/**
 * União de todas as mensagens C2S.
 */
export type C2SMessage = C2SQueueJoin | C2SQueueLeave | C2SSpawnCard;

// ============================================
// MENSAGENS SERVER → CLIENT (S2C)
// ============================================

/**
 * Mensagem base S2C.
 */
export interface S2CMessageBase {
    type: S2CMessageType;
}

/**
 * Confirmação de entrada na fila.
 */
export interface S2CQueueJoined extends S2CMessageBase {
    type: S2CMessageType.QUEUE_JOINED;
    /** Posição na fila (1 = próximo a jogar) */
    position: number;
}

/**
 * Dados de um jogador para início de partida.
 */
export interface PlayerMatchData {
    playerId: string;
    playerIndex: 1 | 2;
    deckId: string;
}

/**
 * Partida encontrada e iniciando.
 */
export interface S2CMatchStart extends S2CMessageBase {
    type: S2CMessageType.MATCH_START;
    /** ID único da sala */
    roomId: string;
    /** Dados do jogador local */
    you: PlayerMatchData;
    /** Dados do oponente */
    opponent: PlayerMatchData;
    /** Configuração do tick rate */
    tickRate: number;
}

/**
 * Dados estáticos de uma entidade recém-spawnada.
 * Enviado apenas uma vez por entidade.
 */
export interface EntitySpawnData {
    /** ID único da entidade */
    id: string;
    /** ID do owner (player1 ou player2) */
    ownerId: string;
    /** ID da unidade base (para visual) */
    unitId: string;
    /** HP máximo */
    maxHp: number;
    /** Posição inicial */
    position: Vector2D;
}

/**
 * Entidade foi spawnada no campo.
 */
export interface S2CEntitySpawned extends S2CMessageBase {
    type: S2CMessageType.ENTITY_SPAWNED;
    entity: EntitySpawnData;
}

/**
 * Delta leve de uma entidade para o tick.
 * Otimizado: usa números em vez de strings longas.
 */
export interface EntityDelta {
    /** ID da entidade */
    id: string;
    /** Posição X (2 decimais) */
    x: number;
    /** Posição Y (2 decimais) */
    y: number;
    /** HP atual */
    hp: number;
    /** Estado (código numérico) */
    s: EntityStateCode;
}

/**
 * Estado de uma torre.
 */
export interface TowerDelta {
    id: string;
    hp: number;
}

/**
 * Payload completo do tick (snapshot).
 */
export interface GameTickPayload {
    /** Número do tick (sequencial) */
    tick: number;
    /** Mana do player 1 */
    mana1: number;
    /** Mana do player 2 */
    mana2: number;
    /** Todas as entidades ativas */
    entities: EntityDelta[];
    /** Estado das torres */
    towers: TowerDelta[];
}

/**
 * Tick de atualização do jogo.
 */
export interface S2CGameTick extends S2CMessageBase {
    type: S2CMessageType.GAME_TICK;
    payload: GameTickPayload;
}

/**
 * Partida encerrada.
 */
export interface S2CMatchEnd extends S2CMessageBase {
    type: S2CMessageType.MATCH_END;
    /** ID do vencedor (player1 ou player2) */
    winnerId: string;
    /** Motivo do fim */
    reason: string;
}

/**
 * Erro do servidor.
 */
export interface S2CError extends S2CMessageBase {
    type: S2CMessageType.ERROR;
    /** Código do erro */
    code: string;
    /** Mensagem legível */
    message: string;
}

/**
 * União de todas as mensagens S2C.
 */
export type S2CMessage =
    | S2CQueueJoined
    | S2CMatchStart
    | S2CEntitySpawned
    | S2CGameTick
    | S2CMatchEnd
    | S2CError;

// ============================================
// HELPERS
// ============================================

/**
 * Serializa uma mensagem S2C para JSON string.
 */
export function serializeMessage(message: S2CMessage): string {
    return JSON.stringify(message);
}

/**
 * Parseia uma mensagem C2S do cliente.
 * @throws Error se o JSON for inválido ou o tipo for desconhecido
 */
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

/**
 * Cria uma mensagem de erro.
 */
export function createErrorMessage(code: string, message: string): S2CError {
    return {
        type: S2CMessageType.ERROR,
        code,
        message,
    };
}
