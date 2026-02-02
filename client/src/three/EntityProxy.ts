import * as THREE from 'three';
import { type ThreeScene } from './ThreeScene';

export interface EntitySnapshot {
    x: number;
    y: number;
    // We can add rotation/state later
}

export class EntityProxy {
    private mesh: THREE.Mesh;
    private scene: THREE.Scene;

    // Interpolation
    private targetPosition: THREE.Vector3;

    // Visual settings
    private static GEOMETRY_CACHE = {
        KNIGHT: new THREE.BoxGeometry(1, 1.5, 1),
        ARCHER: new THREE.BoxGeometry(0.8, 1.2, 0.8),
        DEFAULT: new THREE.BoxGeometry(1, 1, 1)
    };

    constructor(
        unitId: string, // 'knight', 'archer', etc.
        threeScene: ThreeScene,
        initialPos: { x: number, y: number }
    ) {
        this.scene = threeScene.scene;

        console.log(`[EntityProxy] Creating proxy for ${unitId} at (${initialPos.x}, ${initialPos.y})`);

        // Select Geometry based on Unit ID (Simple mapping for now)
        let geo = EntityProxy.GEOMETRY_CACHE.DEFAULT;
        if (unitId.includes('knight')) geo = EntityProxy.GEOMETRY_CACHE.KNIGHT;
        else if (unitId.includes('archer')) geo = EntityProxy.GEOMETRY_CACHE.ARCHER;

        // Select Material based on Owner needs logic
        const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Initialize position
        // Server Y -> Three Z
        this.mesh.position.set(initialPos.x, 1, initialPos.y);
        this.targetPosition = this.mesh.position.clone();

        this.scene.add(this.mesh);
    }

    public updateTarget(snapshot: EntitySnapshot) {
        // Server Y is Three Z
        this.targetPosition.set(snapshot.x, 1, snapshot.y);
    }

    public update(delta: number) {
        // Simple LERP
        const alpha = 10 * delta; // Adjust speed

        this.mesh.position.lerp(this.targetPosition, Math.min(alpha, 1));
    }

    public setColor(color: number) {
        (this.mesh.material as THREE.MeshStandardMaterial).color.setHex(color);
    }

    public destroy() {
        this.scene.remove(this.mesh);
    }
}
