/**
 * Shared Constants
 */

export const GAME_CONFIG = {
    // Map Dimensions (Logical Units)
    MAP_WIDTH: 30,
    MAP_HEIGHT: 40,

    // Mana System
    MAX_MANA: 10,
    MANA_REGEN_RATE: 0.5, // Mana per second (example) 

    // Game Loop
    TICK_RATE: 30, // Ticks per second
    TICK_INTERVAL_MS: 1000 / 30,

    // Deployment Zones (Y coordinates constraints)
    // Assuming P1 is bottom (0-15) and P2 is top (25-40)
    PLAYER_1_DEPLOY_ZONE_MAX_Y: 15,
    PLAYER_2_DEPLOY_ZONE_MIN_Y: 25,
};

export const PHYSICS = {
    COLLISION_RADIUS: 0.5,
};
