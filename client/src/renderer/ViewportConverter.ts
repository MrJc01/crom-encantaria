
import { GAME_CONFIG } from '@crom/shared';

/**
 * ViewportConverter
 * 
 * Responsável por converter coordenadas lógicas do servidor (30x40)
 * para pixels na tela, mantendo o aspect ratio e centralização.
 */
export class ViewportConverter {
    private scale: number = 20; // Default scale: 1 unit = 20 pixels
    private offsetX: number = 0;
    private offsetY: number = 0;
    private worldWidth: number = GAME_CONFIG.MAP_WIDTH;
    private worldHeight: number = GAME_CONFIG.MAP_HEIGHT;

    private isFlipped: boolean = false;

    public setFlipped(flipped: boolean) {
        this.isFlipped = flipped;
    }

    /**
     * Atualiza o escalonamento baseado nas dimensões do container HTML.
     */
    public updateResolution(screenWidth: number, screenHeight: number): void {
        // Calcular escala para caber na tela com padding
        const padding = 20;
        const availableW = screenWidth - padding * 2;
        const availableH = screenHeight - padding * 2;

        const scaleX = availableW / this.worldWidth;
        const scaleY = availableH / this.worldHeight;

        // Usar a menor escala para garantir que tudo caiba (contain)
        this.scale = Math.min(scaleX, scaleY);

        // Centralizar o mapa
        this.offsetX = (screenWidth - this.worldWidth * this.scale) / 2;
        this.offsetY = (screenHeight - this.worldHeight * this.scale) / 2;
    }

    /**
     * Converte coordenada lógica para pixel.
     */
    public toPixels(logicalX: number, logicalY: number) {
        const x = this.isFlipped ? (this.worldWidth - logicalX) : logicalX;
        const y = this.isFlipped ? logicalY : (this.worldHeight - logicalY);

        return {
            x: this.offsetX + x * this.scale,
            y: this.offsetY + y * this.scale
        };
    }


    /**
     * Converte pixel para coordenada lógica.
     */
    public toLogical(pixelX: number, pixelY: number) {
        const xRel = (pixelX - this.offsetX) / this.scale;
        const yRel = (pixelY - this.offsetY) / this.scale;

        const logicalX = this.isFlipped ? (this.worldWidth - xRel) : xRel;
        const logicalY = this.isFlipped ? yRel : (this.worldHeight - yRel);

        return { x: logicalX, y: logicalY };
    }


    /**
     * Converte uma dimensão (ex: raio) de lógica para pixels.
     */
    public scalarToPixels(value: number): number {
        return value * this.scale;
    }

    public getScale(): number {
        return this.scale;
    }

    public getWorldSizeInPixels() {
        return {
            width: this.worldWidth * this.scale,
            height: this.worldHeight * this.scale
        };
    }
}
