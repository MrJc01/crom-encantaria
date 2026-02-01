/**
 * Magic Royale - Entity System
 *
 * Define a classe GameEntity que representa uma unidade viva na arena.
 * Implementa FSM (Finite State Machine) para comportamento de IA.
 *
 * @module core/game/entity
 */
import { Vector2D } from './physics.js';
/**
 * Estados possíveis de uma entidade durante a partida.
 */
export declare enum EntityState {
    /** Sem alvo, parada */
    IDLE = "IDLE",
    /** Movendo em direção ao alvo */
    MOVING = "MOVING",
    /** Em alcance, atacando */
    ATTACKING = "ATTACKING",
    /** Aguardando cooldown entre ataques */
    COOLDOWN = "COOLDOWN",
    /** Morta, aguardando remoção */
    DEAD = "DEAD"
}
/**
 * Estatísticas de uma entidade (após aplicar equipamentos).
 */
export interface EntityStats {
    /** Pontos de vida atuais */
    hp: number;
    /** Pontos de vida máximos */
    maxHp: number;
    /** Dano por ataque */
    damage: number;
    /** Ataques por segundo */
    attackSpeed: number;
    /** Distância de ataque (unidades do grid) */
    range: number;
    /** Velocidade de movimento (unidades por segundo) */
    moveSpeed: number;
}
/**
 * Configuração para criar uma nova entidade.
 */
export interface EntityConfig {
    id: string;
    ownerId: 'player1' | 'player2';
    unitId: string;
    position: Vector2D;
    stats: EntityStats;
    radius?: number;
}
/**
 * Representa uma unidade viva na arena.
 *
 * Responsabilidades:
 * - Manter estado atual (FSM)
 * - Rastrear alvo
 * - Gerenciar HP e cooldowns
 * - Fornecer interface para física
 */
export declare class GameEntity {
    readonly id: string;
    readonly ownerId: 'player1' | 'player2';
    readonly unitId: string;
    position: Vector2D;
    readonly radius: number;
    stats: EntityStats;
    state: EntityState;
    targetId: string | null;
    targetPosition: Vector2D | null;
    lastAttackTime: number;
    isMoving: boolean;
    moveSpeed: number;
    private lastLoggedState;
    constructor(config: EntityConfig);
    /**
     * Aplica dano à entidade.
     * @param amount Quantidade de dano
     * @returns true se a entidade morreu
     */
    takeDamage(amount: number): boolean;
    /**
     * Verifica se a entidade está viva.
     */
    isAlive(): boolean;
    /**
     * Verifica se a entidade pode atacar (cooldown expirado).
     * @param currentTime Timestamp atual em ms
     */
    canAttack(currentTime: number): boolean;
    /**
     * Define um novo alvo para perseguir.
     * @param target Entidade alvo
     */
    setTarget(target: GameEntity | null): void;
    /**
     * Atualiza a posição do alvo (chamado a cada tick).
     * @param target Entidade alvo
     */
    updateTargetPosition(target: GameEntity): void;
    /**
     * Verifica se o alvo está em alcance de ataque.
     * @param target Entidade alvo
     */
    isInRange(target: GameEntity): boolean;
    /**
     * Atualiza o estado da entidade baseado no alvo.
     * Implementa a FSM: MOVING → ATTACKING → COOLDOWN
     * @param target Entidade alvo (ou null)
     * @param tickTime Timestamp atual
     * @param tick Número do tick (para logging)
     */
    updateState(target: GameEntity | null, tickTime: number, tick: number): void;
    /**
     * Registra ataque realizado.
     * @param tickTime Timestamp do ataque
     */
    recordAttack(tickTime: number): void;
    /**
     * Log de mudança de estado para debug.
     */
    private logStateChange;
    /**
     * Retorna um snapshot do estado da entidade para broadcast.
     */
    toSnapshot(): EntitySnapshot;
}
/**
 * Snapshot de entidade para sincronização com clientes.
 */
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
/**
 * Factory function para criar entidades.
 * @param config Configuração da entidade
 */
export declare function createEntity(config: EntityConfig): GameEntity;
//# sourceMappingURL=entity.d.ts.map