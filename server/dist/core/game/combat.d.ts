/**
 * Magic Royale - Combat System
 *
 * Gerencia busca de alvos e aplicação de dano.
 * Trabalha em conjunto com Entity e Physics systems.
 *
 * @module core/game/combat
 */
import { GameEntity } from './entity.js';
/**
 * Configuração do sistema de combate.
 */
export interface CombatConfig {
    /** Se true, loga cada ataque no console */
    logAttacks: boolean;
}
/**
 * Sistema de combate autoritativo.
 *
 * Responsabilidades:
 * - Buscar alvo mais próximo para cada entidade
 * - Verificar alcance e cooldown
 * - Aplicar dano
 */
export declare class CombatSystem {
    private config;
    constructor(config?: Partial<CombatConfig>);
    /**
     * Atualiza o combate de todas as entidades.
     * @param entities Lista de todas as entidades vivas
     * @param tickTime Timestamp atual em ms
     * @param tick Número do tick atual (para logging)
     */
    update(entities: GameEntity[], tickTime: number, tick: number): void;
    /**
     * Encontra a entidade inimiga mais próxima.
     * @param entity Entidade buscando alvo
     * @param enemies Lista de inimigos vivos
     * @returns Entidade mais próxima ou null
     */
    findNearestEnemy(entity: GameEntity, enemies: GameEntity[]): GameEntity | null;
    /**
     * Processa um ataque de uma entidade em outra.
     * @param attacker Entidade atacante
     * @param target Entidade alvo
     * @param tickTime Timestamp atual
     * @param tick Número do tick
     */
    private processAttack;
    /**
     * Retorna estatísticas de combate (para debug/UI).
     */
    getStats(entities: GameEntity[]): CombatStats;
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
//# sourceMappingURL=combat.d.ts.map