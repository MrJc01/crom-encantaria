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

// ============================================
// FUNÇÕES UTILITÁRIAS DE VETORES
// ============================================

/**
 * Calcula a distância euclidiana entre dois pontos.
 * @param a Primeiro ponto
 * @param b Segundo ponto
 * @returns Distância em unidades do grid
 */
export function getDistance(a: Vector2D, b: Vector2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula a distância ao quadrado (evita sqrt para comparações).
 * @param a Primeiro ponto
 * @param b Segundo ponto
 * @returns Distância² (para comparações de performance)
 */
export function getDistanceSquared(a: Vector2D, b: Vector2D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
}

/**
 * Retorna o vetor de A para B (não normalizado).
 * @param a Origem
 * @param b Destino
 * @returns Vetor direção (b - a)
 */
export function getVector(a: Vector2D, b: Vector2D): Vector2D {
    return {
        x: b.x - a.x,
        y: b.y - a.y,
    };
}

/**
 * Calcula a magnitude (comprimento) de um vetor.
 * @param v Vetor
 * @returns Magnitude
 */
export function magnitude(v: Vector2D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Normaliza um vetor para magnitude 1.
 * Retorna vetor zero se magnitude for zero.
 * @param v Vetor a normalizar
 * @returns Vetor normalizado
 */
export function normalize(v: Vector2D): Vector2D {
    const mag = magnitude(v);
    if (mag === 0) {
        return { x: 0, y: 0 };
    }
    return {
        x: v.x / mag,
        y: v.y / mag,
    };
}

/**
 * Escala um vetor por um fator.
 * @param v Vetor
 * @param factor Fator de escala
 * @returns Vetor escalado
 */
export function scale(v: Vector2D, factor: number): Vector2D {
    return {
        x: v.x * factor,
        y: v.y * factor,
    };
}

/**
 * Soma dois vetores.
 * @param a Primeiro vetor
 * @param b Segundo vetor
 * @returns Soma a + b
 */
export function add(a: Vector2D, b: Vector2D): Vector2D {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
    };
}

/**
 * Subtrai dois vetores.
 * @param a Primeiro vetor
 * @param b Segundo vetor
 * @returns Diferença a - b
 */
export function subtract(a: Vector2D, b: Vector2D): Vector2D {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
    };
}

/**
 * Cria uma cópia de um vetor.
 * @param v Vetor a copiar
 * @returns Nova instância com mesmos valores
 */
export function clone(v: Vector2D): Vector2D {
    return { x: v.x, y: v.y };
}

// ============================================
// SISTEMA DE FÍSICA
// ============================================

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

const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
    separationForce: 2.0,
    collisionIterations: 3,
    bounds: {
        minX: 0,
        maxX: 30,
        minY: 0,
        maxY: 40,
    },
};

/**
 * Sistema de física para movimento e colisões.
 * 
 * Responsabilidades:
 * - Mover entidades em direção ao alvo
 * - Resolver colisões círculo-círculo
 * - Manter entidades dentro dos limites do mapa
 */
export class PhysicsSystem {
    private config: PhysicsConfig;

    constructor(config?: Partial<PhysicsConfig>) {
        this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
    }

    /**
     * Atualiza a física de todas as entidades.
     * @param entities Lista de entidades a processar
     * @param deltaTime Tempo desde o último tick (em segundos)
     */
    public update<T extends PhysicsEntity>(entities: T[], deltaTime: number): void {
        // Fase 1: Movimento
        for (const entity of entities) {
            if (entity.isMoving && entity.targetPosition) {
                this.moveTowards(entity, entity.targetPosition, deltaTime);
            }
        }

        // Fase 2: Resolução de colisões (múltiplas iterações para estabilidade)
        for (let i = 0; i < this.config.collisionIterations; i++) {
            this.resolveCollisions(entities, deltaTime);
        }

        // Fase 3: Clamp nos limites do mapa
        for (const entity of entities) {
            this.clampToBounds(entity);
        }
    }

    /**
     * Move uma entidade em direção a um ponto alvo.
     * @param entity Entidade a mover
     * @param target Posição alvo
     * @param deltaTime Tempo em segundos
     */
    private moveTowards<T extends PhysicsEntity>(
        entity: T,
        target: Vector2D,
        deltaTime: number
    ): void {
        const direction = getVector(entity.position, target);
        const distance = magnitude(direction);

        // Se já chegou (com margem de erro)
        if (distance < 0.1) {
            entity.isMoving = false;
            return;
        }

        // Calcular deslocamento
        const normalizedDir = normalize(direction);
        const moveDistance = entity.moveSpeed * deltaTime;

        // Não ultrapassar o destino
        const actualMove = Math.min(moveDistance, distance);

        entity.position.x += normalizedDir.x * actualMove;
        entity.position.y += normalizedDir.y * actualMove;
    }

    /**
     * Resolve colisões círculo-círculo entre todas as entidades.
     * Aplica repulsão suave proporcional à sobreposição.
     * @param entities Lista de entidades
     * @param deltaTime Tempo em segundos
     */
    private resolveCollisions<T extends PhysicsEntity>(
        entities: T[],
        deltaTime: number
    ): void {
        const count = entities.length;

        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const a = entities[i];
                const b = entities[j];

                const dx = b.position.x - a.position.x;
                const dy = b.position.y - a.position.y;
                const distSq = dx * dx + dy * dy;

                const minDist = a.radius + b.radius;
                const minDistSq = minDist * minDist;

                // Colisão detectada
                if (distSq < minDistSq && distSq > 0.0001) {
                    const dist = Math.sqrt(distSq);
                    const overlap = minDist - dist;

                    // Vetor de separação normalizado
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Força de repulsão proporcional à sobreposição
                    const pushForce = overlap * this.config.separationForce * deltaTime;
                    const halfPush = pushForce * 0.5;

                    // Empurrar cada entidade para lados opostos
                    a.position.x -= nx * halfPush;
                    a.position.y -= ny * halfPush;
                    b.position.x += nx * halfPush;
                    b.position.y += ny * halfPush;
                }
            }
        }
    }

    /**
     * Mantém a entidade dentro dos limites do mapa.
     * @param entity Entidade a clampear
     */
    private clampToBounds<T extends PhysicsEntity>(entity: T): void {
        const { minX, maxX, minY, maxY } = this.config.bounds;
        const r = entity.radius;

        entity.position.x = Math.max(minX + r, Math.min(maxX - r, entity.position.x));
        entity.position.y = Math.max(minY + r, Math.min(maxY - r, entity.position.y));
    }

    /**
     * Verifica se dois círculos estão colidindo.
     * @param a Primeira entidade
     * @param b Segunda entidade
     * @returns true se há colisão
     */
    public checkCollision<T extends PhysicsEntity>(a: T, b: T): boolean {
        const minDist = a.radius + b.radius;
        const distSq = getDistanceSquared(a.position, b.position);
        return distSq < minDist * minDist;
    }
}
