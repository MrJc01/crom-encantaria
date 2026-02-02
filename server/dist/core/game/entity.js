/**
 * Magic Royale - Entity System
 *
 * Define a classe GameEntity que representa uma unidade viva na arena.
 * Implementa FSM (Finite State Machine) para comportamento de IA.
 *
 * @module core/game/entity
 */
import { getDistance } from './physics.js';
import { EntityState } from '@crom/shared';
export { EntityState };
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
    id;
    ownerId;
    unitId;
    // ========== Física ==========
    position;
    radius;
    // ========== Stats ==========
    stats;
    // ========== Estado FSM ==========
    state;
    targetId;
    targetPosition;
    // ========== Timing ==========
    lastAttackTime;
    isMoving;
    moveSpeed; // Exposto para PhysicsSystem
    // ========== Logging ==========
    lastLoggedState = null;
    constructor(config) {
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
    takeDamage(amount) {
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
    isAlive() {
        return this.state !== EntityState.DEAD && this.stats.hp > 0;
    }
    /**
     * Verifica se a entidade pode atacar (cooldown expirado).
     * @param currentTime Timestamp atual em ms
     */
    canAttack(currentTime) {
        if (!this.isAlive())
            return false;
        const cooldownMs = (1 / this.stats.attackSpeed) * 1000;
        return currentTime - this.lastAttackTime >= cooldownMs;
    }
    /**
     * Define um novo alvo para perseguir.
     * @param target Entidade alvo
     */
    setTarget(target) {
        if (target) {
            this.targetId = target.id;
            this.targetPosition = { ...target.position };
            this.state = EntityState.MOVING;
            this.isMoving = true;
        }
        else {
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
    updateTargetPosition(target) {
        if (target.id === this.targetId) {
            this.targetPosition = { ...target.position };
        }
    }
    /**
     * Verifica se o alvo está em alcance de ataque.
     * @param target Entidade alvo
     */
    isInRange(target) {
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
    updateState(target, tickTime, tick) {
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
                }
                else {
                    this.state = EntityState.MOVING;
                    this.isMoving = true;
                }
                break;
            case EntityState.ATTACKING:
                if (!inRange) {
                    this.state = EntityState.MOVING;
                    this.isMoving = true;
                }
                else if (!canAttack) {
                    this.state = EntityState.COOLDOWN;
                    this.isMoving = false;
                }
                // Se inRange && canAttack, permanece em ATTACKING
                break;
            case EntityState.COOLDOWN:
                if (!inRange) {
                    this.state = EntityState.MOVING;
                    this.isMoving = true;
                }
                else if (canAttack) {
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
    recordAttack(tickTime) {
        this.lastAttackTime = tickTime;
        this.state = EntityState.COOLDOWN;
    }
    /**
     * Log de mudança de estado para debug.
     */
    logStateChange(target, tick) {
        const distance = getDistance(this.position, target.position).toFixed(1);
        console.log(`[Tick ${tick}] ${this.id} (${this.state}) → ` +
            `Alvo: ${target.id} | Dist: ${distance} | HP: ${this.stats.hp}/${this.stats.maxHp}`);
    }
    /**
     * Retorna um snapshot do estado da entidade para broadcast.
     */
    toSnapshot() {
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
 * Factory function para criar entidades.
 * @param config Configuração da entidade
 */
export function createEntity(config) {
    return new GameEntity(config);
}
//# sourceMappingURL=entity.js.map