/**
 * Magic Royale - Entity System
 * 
 * Define a classe GameEntity que representa uma unidade viva na arena.
 * Implementa FSM (Finite State Machine) para comportamento de IA.
 * 
 * @module core/game/entity
 */

import { Vector2D, getDistance } from './physics.js';

/**
 * Estados possíveis de uma entidade durante a partida.
 */
export enum EntityState {
    /** Sem alvo, parada */
    IDLE = 'IDLE',
    /** Movendo em direção ao alvo */
    MOVING = 'MOVING',
    /** Em alcance, atacando */
    ATTACKING = 'ATTACKING',
    /** Aguardando cooldown entre ataques */
    COOLDOWN = 'COOLDOWN',
    /** Morta, aguardando remoção */
    DEAD = 'DEAD',
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
export class GameEntity {
    // ========== Identificação ==========
    public readonly id: string;
    public readonly ownerId: 'player1' | 'player2';
    public readonly unitId: string;

    // ========== Física ==========
    public position: Vector2D;
    public readonly radius: number;

    // ========== Stats ==========
    public stats: EntityStats;

    // ========== Estado FSM ==========
    public state: EntityState;
    public targetId: string | null;
    public targetPosition: Vector2D | null;

    // ========== Timing ==========
    public lastAttackTime: number;
    public isMoving: boolean;
    public moveSpeed: number; // Exposto para PhysicsSystem

    // ========== Logging ==========
    private lastLoggedState: EntityState | null = null;

    constructor(config: EntityConfig) {
        this.id = config.id;
        this.ownerId = config.ownerId;
        this.unitId = config.unitId;
        this.position = { ...config.position };
        this.radius = config.radius ?? 0.5;
        this.stats = { ...config.stats };

        this.state = EntityState.IDLE;
        this.targetId = null;
        this.targetPosition = null;
        this.lastAttackTime = 0;
        this.isMoving = false;
        this.moveSpeed = this.stats.moveSpeed;
    }

    /**
     * Aplica dano à entidade.
     * @param amount Quantidade de dano
     * @returns true se a entidade morreu
     */
    public takeDamage(amount: number): boolean {
        this.stats.hp -= amount;

        if (this.stats.hp <= 0) {
            this.stats.hp = 0;
            this.state = EntityState.DEAD;
            this.isMoving = false;
            this.targetId = null;
            this.targetPosition = null;
            return true;
        }

        return false;
    }

    /**
     * Verifica se a entidade está viva.
     */
    public isAlive(): boolean {
        return this.state !== EntityState.DEAD && this.stats.hp > 0;
    }

    /**
     * Verifica se a entidade pode atacar (cooldown expirado).
     * @param currentTime Timestamp atual em ms
     */
    public canAttack(currentTime: number): boolean {
        if (!this.isAlive()) return false;

        const cooldownMs = (1 / this.stats.attackSpeed) * 1000;
        return currentTime - this.lastAttackTime >= cooldownMs;
    }

    /**
     * Define um novo alvo para perseguir.
     * @param target Entidade alvo
     */
    public setTarget(target: GameEntity | null): void {
        if (target) {
            this.targetId = target.id;
            this.targetPosition = { ...target.position };
            this.state = EntityState.MOVING;
            this.isMoving = true;
        } else {
            this.targetId = null;
            this.targetPosition = null;
            this.state = EntityState.IDLE;
            this.isMoving = false;
        }
    }

    /**
     * Atualiza a posição do alvo (chamado a cada tick).
     * @param target Entidade alvo
     */
    public updateTargetPosition(target: GameEntity): void {
        if (target.id === this.targetId) {
            this.targetPosition = { ...target.position };
        }
    }

    /**
     * Verifica se o alvo está em alcance de ataque.
     * @param target Entidade alvo
     */
    public isInRange(target: GameEntity): boolean {
        const distance = getDistance(this.position, target.position);
        // Considerar os raios das entidades
        const effectiveDistance = distance - this.radius - target.radius;
        return effectiveDistance <= this.stats.range;
    }

    /**
     * Atualiza o estado da entidade baseado no alvo.
     * Implementa a FSM: MOVING → ATTACKING → COOLDOWN
     * @param target Entidade alvo (ou null)
     * @param tickTime Timestamp atual
     * @param tick Número do tick (para logging)
     */
    public updateState(target: GameEntity | null, tickTime: number, tick: number): void {
        if (!this.isAlive()) {
            return;
        }

        // Sem alvo → IDLE
        if (!target || !target.isAlive()) {
            if (this.state !== EntityState.IDLE) {
                this.state = EntityState.IDLE;
                this.isMoving = false;
                this.targetId = null;
                this.targetPosition = null;
            }
            return;
        }

        // Atualizar posição do alvo
        this.updateTargetPosition(target);

        const inRange = this.isInRange(target);
        const canAttack = this.canAttack(tickTime);

        // FSM Transitions
        switch (this.state) {
            case EntityState.IDLE:
            case EntityState.MOVING:
                if (inRange) {
                    this.state = EntityState.ATTACKING;
                    this.isMoving = false;
                } else {
                    this.state = EntityState.MOVING;
                    this.isMoving = true;
                }
                break;

            case EntityState.ATTACKING:
                if (!inRange) {
                    this.state = EntityState.MOVING;
                    this.isMoving = true;
                } else if (!canAttack) {
                    this.state = EntityState.COOLDOWN;
                    this.isMoving = false;
                }
                // Se inRange && canAttack, permanece em ATTACKING
                break;

            case EntityState.COOLDOWN:
                if (!inRange) {
                    this.state = EntityState.MOVING;
                    this.isMoving = true;
                } else if (canAttack) {
                    this.state = EntityState.ATTACKING;
                    this.isMoving = false;
                }
                break;
        }

        // Log de mudança de estado (apenas quando muda)
        if (this.state !== this.lastLoggedState) {
            this.logStateChange(target, tick);
            this.lastLoggedState = this.state;
        }
    }

    /**
     * Registra ataque realizado.
     * @param tickTime Timestamp do ataque
     */
    public recordAttack(tickTime: number): void {
        this.lastAttackTime = tickTime;
        this.state = EntityState.COOLDOWN;
    }

    /**
     * Log de mudança de estado para debug.
     */
    private logStateChange(target: GameEntity, tick: number): void {
        const distance = getDistance(this.position, target.position).toFixed(1);
        console.log(
            `[Tick ${tick}] ${this.id} (${this.state}) → ` +
            `Alvo: ${target.id} | Dist: ${distance} | HP: ${this.stats.hp}/${this.stats.maxHp}`
        );
    }

    /**
     * Retorna um snapshot do estado da entidade para broadcast.
     */
    public toSnapshot(): EntitySnapshot {
        return {
            id: this.id,
            ownerId: this.ownerId,
            unitId: this.unitId,
            position: { ...this.position },
            hp: this.stats.hp,
            maxHp: this.stats.maxHp,
            state: this.state,
            targetId: this.targetId,
        };
    }
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
export function createEntity(config: EntityConfig): GameEntity {
    return new GameEntity(config);
}
