/**
 * Magic Royale - Combat System
 * 
 * Gerencia busca de alvos e aplicação de dano.
 * Trabalha em conjunto com Entity e Physics systems.
 * 
 * @module core/game/combat
 */

import { GameEntity, EntityState } from './entity.js';
import { getDistance } from './physics.js';

/**
 * Configuração do sistema de combate.
 */
export interface CombatConfig {
    /** Se true, loga cada ataque no console */
    logAttacks: boolean;
}

const DEFAULT_COMBAT_CONFIG: CombatConfig = {
    logAttacks: true,
};

/**
 * Sistema de combate autoritativo.
 * 
 * Responsabilidades:
 * - Buscar alvo mais próximo para cada entidade
 * - Verificar alcance e cooldown
 * - Aplicar dano
 */
export class CombatSystem {
    private config: CombatConfig;

    constructor(config?: Partial<CombatConfig>) {
        this.config = { ...DEFAULT_COMBAT_CONFIG, ...config };
    }

    /**
     * Atualiza o combate de todas as entidades.
     * @param entities Lista de todas as entidades vivas
     * @param tickTime Timestamp atual em ms
     * @param tick Número do tick atual (para logging)
     */
    public update(entities: GameEntity[], tickTime: number, tick: number): void {
        // Separar entidades por dono
        const player1Entities = entities.filter(
            (e) => e.ownerId === 'player1' && e.isAlive()
        );
        const player2Entities = entities.filter(
            (e) => e.ownerId === 'player2' && e.isAlive()
        );

        // Processar cada entidade
        for (const entity of entities) {
            if (!entity.isAlive() || entity.isTower) continue;

            // Identificar inimigos (unidades e torres)
            const enemies = entity.ownerId === 'player1'
                ? player2Entities
                : player1Entities;

            const oldTargetId = entity.targetId;

            // 1. PRIORIDADE: Buscar unidade inimiga mais próxima dentro do aggroRange (Aggro/Distração)
            const enemyUnits = enemies.filter(e => !e.isTower);
            let target = this.findNearestWithinRange(entity, enemyUnits, entity.stats.aggroRange);

            // 2. OBJETIVO: Se não houver unidades próximas, focar na torre inimiga mais próxima
            if (!target) {
                const enemyTowers = enemies.filter(e => e.isTower);
                target = this.findNearestEnemy(entity, enemyTowers);
            }

            // Log se o alvo mudou para algo que não seja a torre (Aggro detectado)
            if (target && target.id !== oldTargetId && !target.isTower && this.config.logAttacks) {
                console.log(`[Tick ${tick}] 🎯 AGGRO: ${entity.id} mudou alvo para unidade ${target.id}`);
            }


            // Atualizar estado FSM da entidade
            entity.updateState(target, tickTime, tick);


            // Se está atacando e pode atacar, aplicar dano
            if (
                entity.state === EntityState.ATTACKING &&
                target &&
                entity.canAttack(tickTime)
            ) {
                this.processAttack(entity, target, tickTime, tick);
            }
        }
    }

    /**
     * Encontra a entidade inimiga mais próxima dentro de um raio específico.
     */
    private findNearestWithinRange(
        entity: GameEntity,
        enemies: GameEntity[],
        range: number
    ): GameEntity | null {
        if (enemies.length === 0) return null;

        let nearest: GameEntity | null = null;
        let minDistance = range;

        for (const enemy of enemies) {
            // Unidades normais são alvos prioritários de aggro se estiverem no range
            const dist = getDistance(entity.position, enemy.position);
            if (dist <= minDistance) {
                minDistance = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }


    /**
     * Encontra a entidade inimiga mais próxima.
     * @param entity Entidade buscando alvo
     * @param enemies Lista de inimigos vivos
     * @returns Entidade mais próxima ou null
     */
    public findNearestEnemy(
        entity: GameEntity,
        enemies: GameEntity[]
    ): GameEntity | null {
        if (enemies.length === 0) return null;

        let nearest: GameEntity | null = null;
        let minDistance = Infinity;

        for (const enemy of enemies) {
            if (!enemy.isAlive()) continue;

            const dist = getDistance(entity.position, enemy.position);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }

    /**
     * Processa um ataque de uma entidade em outra.
     * @param attacker Entidade atacante
     * @param target Entidade alvo
     * @param tickTime Timestamp atual
     * @param tick Número do tick
     */
    private processAttack(
        attacker: GameEntity,
        target: GameEntity,
        tickTime: number,
        tick: number
    ): void {
        const damage = attacker.stats.damage;
        const oldHp = target.stats.hp;
        const died = target.takeDamage(damage);

        // Registrar ataque (reseta cooldown)
        attacker.recordAttack(tickTime);

        if (this.config.logAttacks) {
            const status = died ? '💀 MORTO' : `HP: ${oldHp}→${target.stats.hp}`;
            console.log(
                `[Tick ${tick}] ⚔️ ${attacker.id} atacou ${target.id} | ` +
                `Dano: ${damage} | ${status}`
            );
        }

        // Se o alvo morreu, limpar referência
        if (died) {
            attacker.setTarget(null);
        }
    }

    /**
     * Retorna estatísticas de combate (para debug/UI).
     */
    public getStats(entities: GameEntity[]): CombatStats {
        const alive = entities.filter((e) => e.isAlive());
        const dead = entities.filter((e) => !e.isAlive());

        const player1Alive = alive.filter((e) => e.ownerId === 'player1').length;
        const player2Alive = alive.filter((e) => e.ownerId === 'player2').length;

        return {
            totalAlive: alive.length,
            totalDead: dead.length,
            player1Alive,
            player2Alive,
        };
    }
}

/**
 * Estatísticas de combate.
 */
export interface CombatStats {
    totalAlive: number;
    totalDead: number;
    player1Alive: number;
    player2Alive: number;
}
