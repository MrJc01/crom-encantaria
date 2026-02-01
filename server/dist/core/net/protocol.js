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
// ============================================
// ENUMS DE TIPO DE MENSAGEM
// ============================================
/**
 * Tipos de mensagem Client → Server
 */
export var C2SMessageType;
(function (C2SMessageType) {
    /** Entrar na fila de matchmaking */
    C2SMessageType["QUEUE_JOIN"] = "QUEUE_JOIN";
    /** Sair da fila de matchmaking */
    C2SMessageType["QUEUE_LEAVE"] = "QUEUE_LEAVE";
    /** Spawnar uma carta no campo */
    C2SMessageType["SPAWN_CARD"] = "SPAWN_CARD";
})(C2SMessageType || (C2SMessageType = {}));
/**
 * Tipos de mensagem Server → Client
 */
export var S2CMessageType;
(function (S2CMessageType) {
    /** Confirmação de entrada na fila */
    S2CMessageType["QUEUE_JOINED"] = "QUEUE_JOINED";
    /** Partida encontrada, jogo iniciando */
    S2CMessageType["MATCH_START"] = "MATCH_START";
    /** Uma entidade foi spawnada (dados estáticos) */
    S2CMessageType["ENTITY_SPAWNED"] = "ENTITY_SPAWNED";
    /** Tick de atualização do jogo (dados voláteis) */
    S2CMessageType["GAME_TICK"] = "GAME_TICK";
    /** Partida encerrada */
    S2CMessageType["MATCH_END"] = "MATCH_END";
    /** Erro genérico */
    S2CMessageType["ERROR"] = "ERROR";
})(S2CMessageType || (S2CMessageType = {}));
/**
 * Códigos de erro do servidor (Anti-Cheat).
 * Usados para identificar o tipo de violação.
 */
export var ErrorCode;
(function (ErrorCode) {
    /** Mana insuficiente para spawnar a carta */
    ErrorCode["INSUFFICIENT_MANA"] = "INSUFFICIENT_MANA";
    /** Posição de spawn fora da zona permitida */
    ErrorCode["INVALID_POSITION"] = "INVALID_POSITION";
    /** Índice da carta fora do range válido (0-7) */
    ErrorCode["INVALID_CARD_INDEX"] = "INVALID_CARD_INDEX";
    /** Carta não encontrada no deck do jogador */
    ErrorCode["CARD_NOT_FOUND"] = "CARD_NOT_FOUND";
    /** Jogo não está em execução */
    ErrorCode["GAME_NOT_RUNNING"] = "GAME_NOT_RUNNING";
})(ErrorCode || (ErrorCode = {}));
/**
 * Estados numéricos para compressão no protocolo.
 * Mapeia EntityState para números (menor payload).
 */
export var EntityStateCode;
(function (EntityStateCode) {
    EntityStateCode[EntityStateCode["IDLE"] = 0] = "IDLE";
    EntityStateCode[EntityStateCode["MOVING"] = 1] = "MOVING";
    EntityStateCode[EntityStateCode["ATTACKING"] = 2] = "ATTACKING";
    EntityStateCode[EntityStateCode["COOLDOWN"] = 3] = "COOLDOWN";
    EntityStateCode[EntityStateCode["DEAD"] = 4] = "DEAD";
})(EntityStateCode || (EntityStateCode = {}));
/**
 * Converte EntityState para código numérico.
 */
export function stateToCode(state) {
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
// HELPERS
// ============================================
/**
 * Serializa uma mensagem S2C para JSON string.
 */
export function serializeMessage(message) {
    return JSON.stringify(message);
}
/**
 * Parseia uma mensagem C2S do cliente.
 * @throws Error se o JSON for inválido ou o tipo for desconhecido
 */
export function parseC2SMessage(data) {
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed.type !== 'string') {
        throw new Error('Invalid message format: missing type');
    }
    if (!Object.values(C2SMessageType).includes(parsed.type)) {
        throw new Error(`Unknown message type: ${parsed.type}`);
    }
    return parsed;
}
/**
 * Cria uma mensagem de erro.
 */
export function createErrorMessage(code, message) {
    return {
        type: S2CMessageType.ERROR,
        code,
        message,
    };
}
//# sourceMappingURL=protocol.js.map