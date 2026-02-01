/**
 * Magic Royale - Combat System
 *
 * Gerencia busca de alvos e aplicação de dano.
 * Trabalha em conjunto com Entity e Physics systems.
 *
 * @module core/game/combat
 */
import { EntityState } from './entity.js';
import { getDistance } from './physics.js';
const DEFAULT_COMBAT_CONFIG = {
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
    config;
    constructor(config) {
        this.config = { ...DEFAULT_COMBAT_CONFIG, ...config };
    }
    /**
     * Atualiza o combate de todas as entidades.
     * @param entities Lista de todas as entidades vivas
     * @param tickTime Timestamp atual em ms
     * @param tick Número do tick atual (para logging)
     */
    update(entities, tickTime, tick) {
        // Separar entidades por dono
        const player1Entities = entities.filter((e) => e.ownerId === 'player1' && e.isAlive());
        const player2Entities = entities.filter((e) => e.ownerId === 'player2' && e.isAlive());
        // Processar cada entidade
        for (const entity of entities) {
            if (!entity.isAlive())
                continue;
            // Buscar inimigos
            const enemies = entity.ownerId === 'player1'
                ? player2Entities
                : player1Entities;
            // Encontrar alvo mais próximo
            const target = this.findNearestEnemy(entity, enemies);
            // Atualizar estado FSM da entidade
            entity.updateState(target, tickTime, tick);
            // Se está atacando e pode atacar, aplicar dano
            if (entity.state === EntityState.ATTACKING &&
                target &&
                entity.canAttack(tickTime)) {
                this.processAttack(entity, target, tickTime, tick);
            }
        }
    }
    /**
     * Encontra a entidade inimiga mais próxima.
     * @param entity Entidade buscando alvo
     * @param enemies Lista de inimigos vivos
     * @returns Entidade mais próxima ou null
     */
    findNearestEnemy(entity, enemies) {
        if (enemies.length === 0)
            return null;
        let nearest = null;
        let minDistance = Infinity;
        for (const enemy of enemies) {
            if (!enemy.isAlive())
                continue;
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
    processAttack(attacker, target, tickTime, tick) {
        const damage = attacker.stats.damage;
        const oldHp = target.stats.hp;
        const died = target.takeDamage(damage);
        // Registrar ataque (reseta cooldown)
        attacker.recordAttack(tickTime);
        if (this.config.logAttacks) {
            const status = died ? '💀 MORTO' : `HP: ${oldHp}→${target.stats.hp}`;
            console.log(`[Tick ${tick}] ⚔️ ${attacker.id} atacou ${target.id} | ` +
                `Dano: ${damage} | ${status}`);
        }
        // Se o alvo morreu, limpar referência
        if (died) {
            attacker.setTarget(null);
        }
    }
    /**
     * Retorna estatísticas de combate (para debug/UI).
     */
    getStats(entities) {
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
//# sourceMappingURL=combat.js.map