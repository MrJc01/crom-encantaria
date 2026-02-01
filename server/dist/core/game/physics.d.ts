/**
 * Magic Royale - Physics System
 *
 * Sistema de física vetorial leve para movimento e colisões.
 * Implementação manual sem engines externas para máxima leveza.
 *
 * @module core/game/physics
 */
/**
 * Vetor 2D para posições e direções.
 */
export interface Vector2D {
    x: number;
    y: number;
}
/**
 * Interface mínima que uma entidade deve ter para física.
 */
export interface PhysicsEntity {
    id: string;
    position: Vector2D;
    radius: number;
    moveSpeed: number;
    targetPosition: Vector2D | null;
    isMoving: boolean;
}
/**
 * Calcula a distância euclidiana entre dois pontos.
 * @param a Primeiro ponto
 * @param b Segundo ponto
 * @returns Distância em unidades do grid
 */
export declare function getDistance(a: Vector2D, b: Vector2D): number;
/**
 * Calcula a distância ao quadrado (evita sqrt para comparações).
 * @param a Primeiro ponto
 * @param b Segundo ponto
 * @returns Distância² (para comparações de performance)
 */
export declare function getDistanceSquared(a: Vector2D, b: Vector2D): number;
/**
 * Retorna o vetor de A para B (não normalizado).
 * @param a Origem
 * @param b Destino
 * @returns Vetor direção (b - a)
 */
export declare function getVector(a: Vector2D, b: Vector2D): Vector2D;
/**
 * Calcula a magnitude (comprimento) de um vetor.
 * @param v Vetor
 * @returns Magnitude
 */
export declare function magnitude(v: Vector2D): number;
/**
 * Normaliza um vetor para magnitude 1.
 * Retorna vetor zero se magnitude for zero.
 * @param v Vetor a normalizar
 * @returns Vetor normalizado
 */
export declare function normalize(v: Vector2D): Vector2D;
/**
 * Escala um vetor por um fator.
 * @param v Vetor
 * @param factor Fator de escala
 * @returns Vetor escalado
 */
export declare function scale(v: Vector2D, factor: number): Vector2D;
/**
 * Soma dois vetores.
 * @param a Primeiro vetor
 * @param b Segundo vetor
 * @returns Soma a + b
 */
export declare function add(a: Vector2D, b: Vector2D): Vector2D;
/**
 * Subtrai dois vetores.
 * @param a Primeiro vetor
 * @param b Segundo vetor
 * @returns Diferença a - b
 */
export declare function subtract(a: Vector2D, b: Vector2D): Vector2D;
/**
 * Cria uma cópia de um vetor.
 * @param v Vetor a copiar
 * @returns Nova instância com mesmos valores
 */
export declare function clone(v: Vector2D): Vector2D;
/**
 * Configuração do sistema de física.
 */
export interface PhysicsConfig {
    /** Força de repulsão entre entidades (default: 2.0) */
    separationForce: number;
    /** Número de iterações de resolução de colisão (default: 3) */
    collisionIterations: number;
    /** Limites do mapa */
    bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
}
/**
 * Sistema de física para movimento e colisões.
 *
 * Responsabilidades:
 * - Mover entidades em direção ao alvo
 * - Resolver colisões círculo-círculo
 * - Manter entidades dentro dos limites do mapa
 */
export declare class PhysicsSystem {
    private config;
    constructor(config?: Partial<PhysicsConfig>);
    /**
     * Atualiza a física de todas as entidades.
     * @param entities Lista de entidades a processar
     * @param deltaTime Tempo desde o último tick (em segundos)
     */
    update<T extends PhysicsEntity>(entities: T[], deltaTime: number): void;
    /**
     * Move uma entidade em direção a um ponto alvo.
     * @param entity Entidade a mover
     * @param target Posição alvo
     * @param deltaTime Tempo em segundos
     */
    private moveTowards;
    /**
     * Resolve colisões círculo-círculo entre todas as entidades.
     * Aplica repulsão suave proporcional à sobreposição.
     * @param entities Lista de entidades
     * @param deltaTime Tempo em segundos
     */
    private resolveCollisions;
    /**
     * Mantém a entidade dentro dos limites do mapa.
     * @param entity Entidade a clampear
     */
    private clampToBounds;
    /**
     * Verifica se dois círculos estão colidindo.
     * @param a Primeira entidade
     * @param b Segunda entidade
     * @returns true se há colisão
     */
    checkCollision<T extends PhysicsEntity>(a: T, b: T): boolean;
}
//# sourceMappingURL=physics.d.ts.map