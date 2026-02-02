
import * as PIXI from 'pixi.js';
import { ViewportConverter } from './ViewportConverter.js';
import { GAME_CONFIG, EntityStateCode } from '@crom/shared';
import type { EntityDelta, EntitySpawnData } from '@crom/shared';


export class WorldRenderer2D {
    private app: PIXI.Application;
    private viewport: ViewportConverter;
    private container: HTMLElement;

    // Layers
    private mapLayer: PIXI.Container;
    private entityLayer: PIXI.Container;
    private debugLayer: PIXI.Container;

    // Entity Sprites Map
    private entities: Map<string, PIXI.Container> = new Map();

    constructor(container: HTMLElement) {
        this.container = container;
        this.app = new PIXI.Application();
        this.viewport = new ViewportConverter();

        this.mapLayer = new PIXI.Container();
        this.entityLayer = new PIXI.Container();
        this.debugLayer = new PIXI.Container();
    }

    public async init() {
        await this.app.init({
            resizeTo: this.container,
            backgroundColor: 0x1a1a2e,
            antialias: true,
        });

        this.container.appendChild(this.app.canvas);

        this.app.stage.addChild(this.mapLayer);
        this.app.stage.addChild(this.entityLayer);
        this.app.stage.addChild(this.debugLayer);

        this.updateViewport();
        this.renderMap();

        // Handle window resize
        window.addEventListener('resize', () => this.updateViewport());
    }

    private updateViewport() {
        this.viewport.updateResolution(this.app.screen.width, this.app.screen.height);
        this.renderMap();
        // Reposition all visible entities immediately
        this.entities.forEach((_container, _id) => {

            // We'll need their last logic pos, but for now they'll snap on next tick
        });
    }

    private renderMap() {
        this.mapLayer.removeChildren();
        const graphics = new PIXI.Graphics();

        const size = this.viewport.getWorldSizeInPixels();
        // const origin = this.viewport.toPixels(0, 0);

        const topLeft = this.viewport.toPixels(0, GAME_CONFIG.MAP_HEIGHT);

        // Draw Map Border
        graphics.setStrokeStyle(2);
        graphics.beginPath();
        graphics.rect(topLeft.x, topLeft.y, size.width, size.height);
        graphics.stroke({ color: 0x444466 });
        graphics.fill({ color: 0x16213e });

        // Draw Grid
        graphics.setStrokeStyle(1);
        for (let x = 0; x <= GAME_CONFIG.MAP_WIDTH; x++) {
            const pStart = this.viewport.toPixels(x, 0);
            const pEnd = this.viewport.toPixels(x, GAME_CONFIG.MAP_HEIGHT);
            graphics.moveTo(pStart.x, pStart.y);
            graphics.lineTo(pEnd.x, pEnd.y);
            graphics.stroke({ color: 0x222244, alpha: 0.5 });
        }

        for (let y = 0; y <= GAME_CONFIG.MAP_HEIGHT; y++) {
            const pStart = this.viewport.toPixels(0, y);
            const pEnd = this.viewport.toPixels(GAME_CONFIG.MAP_WIDTH, y);
            graphics.moveTo(pStart.x, pStart.y);
            graphics.lineTo(pEnd.x, pEnd.y);
            graphics.stroke({ color: 0x222244, alpha: 0.5 });
        }

        // Draw Deploy Zones
        const p1Zone = this.viewport.toPixels(0, GAME_CONFIG.PLAYER_1_DEPLOY_ZONE_MAX_Y);
        graphics.moveTo(topLeft.x, p1Zone.y);
        graphics.lineTo(topLeft.x + size.width, p1Zone.y);
        graphics.stroke({ color: 0x00ff00, alpha: 0.3 });

        const p2Zone = this.viewport.toPixels(0, GAME_CONFIG.PLAYER_2_DEPLOY_ZONE_MIN_Y);
        graphics.moveTo(topLeft.x, p2Zone.y);
        graphics.lineTo(topLeft.x + size.width, p2Zone.y);
        graphics.stroke({ color: 0xff0000, alpha: 0.3 });

        this.mapLayer.addChild(graphics);
    }

    /**
     * Spawna uma nova representação visual de entidade.
     */
    public spawnEntity(data: EntitySpawnData) {
        if (this.entities.has(data.id)) return;

        const container = new PIXI.Container();

        // Base Circle (Placeholder sprite)
        const body = new PIXI.Graphics();
        const color = data.ownerId === 'player1' ? 0x4ecca3 : 0xe94560;
        body.beginPath();
        body.circle(0, 0, this.viewport.scalarToPixels(0.4));
        body.fill({ color });
        body.setStrokeStyle(2);
        body.stroke({ color: 0xffffff });

        container.addChild(body);

        // Name Tag
        const text = new PIXI.Text({
            text: data.unitId,
            style: {
                fill: 0xffffff,
                fontSize: 10,
                fontWeight: 'bold'
            }
        });
        text.anchor.set(0.5, 1);
        text.y = -this.viewport.scalarToPixels(0.6);
        container.addChild(text);

        // Hitbox Debug
        const debug = new PIXI.Graphics();
        debug.beginPath();
        debug.circle(0, 0, this.viewport.scalarToPixels(0.5));
        debug.stroke({ color: 0xff0000, width: 1 });
        debug.visible = true; // We want hitboxes visible for now as per requirements
        container.addChild(debug);

        const pos = this.viewport.toPixels(data.position.x, data.position.y);
        container.x = pos.x;
        container.y = pos.y;

        this.entityLayer.addChild(container);
        this.entities.set(data.id, container);
    }

    /**
     * Atualiza as entidades baseadas no tick do servidor.
     */
    public updateEntities(deltas: EntityDelta[]) {
        deltas.forEach(delta => {
            const container = this.entities.get(delta.id);
            if (container) {
                const pos = this.viewport.toPixels(delta.x, delta.y);

                // Smooth interpolation could be added here later
                container.x = pos.x;
                container.y = pos.y;

                // Handle Dead state
                if (delta.s === EntityStateCode.DEAD) {
                    this.removeEntity(delta.id);
                }

                // HP Bar update (placeholder)
                // ...
            }
        });

        // Cleanup entities not in delta (if they were removed but no DEAD state sent)
        // But usually server sends all active ones.
    }

    public removeEntity(id: string) {
        const container = this.entities.get(id);
        if (container) {
            this.entityLayer.removeChild(container);
            this.entities.delete(id);
            container.destroy({ children: true });
        }
    }

    public getApp() {
        return this.app;
    }

    public getViewport() {
        return this.viewport;
    }

    public destroy() {
        this.app.destroy(true, { children: true, texture: true });

    }
}
