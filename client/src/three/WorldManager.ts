import * as THREE from 'three';
import { type ThreeScene } from './ThreeScene';

export class WorldManager {
    private scene: THREE.Scene;
    public floor: THREE.Mesh | null = null;

    constructor(threeScene: ThreeScene) {
        this.scene = threeScene.scene;
        this.initLights();
        this.initArena();
        this.initTowers();
    }

    private initLights() {
        // Ambient Light
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        // Directional Light (Sun/Moon)
        const dirLight = new THREE.DirectionalLight(0xffd700, 0.8);
        dirLight.position.set(-10, 40, -10); // From top-left-back
        dirLight.castShadow = true;

        // Shadow properties
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;

        // Adjust shadow camera to cover the arena (30x40)
        const d = 30;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;

        this.scene.add(dirLight);
    }

    private initArena() {
        // Floor: 30x40
        // Server coords: X [0..30], Y [0..40]
        // Three coords: PlaneGeometry creates centered at 0,0.
        // We need it to span X=0..30, Z=0..40.

        const width = 30;
        const depth = 40;

        const geometry = new THREE.PlaneGeometry(width, depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0x333344,
            roughness: 0.8,
            metalness: 0.2
        });

        this.floor = new THREE.Mesh(geometry, material);
        this.floor.rotation.x = -Math.PI / 2; // Lie flat
        this.floor.receiveShadow = true;

        // Center position: X=15, Z=20
        this.floor.position.set(width / 2, 0, depth / 2);

        this.scene.add(this.floor);

        // Grid Helper
        // Size needs to be larger than arena usually to look good, or exact.
        // GridHelper center is 0,0,0.
        const grid = new THREE.GridHelper(50, 50, 0x555555, 0x222222);
        grid.position.set(width / 2, 0.05, depth / 2); // Slight offset Y to avoid z-fighting
        this.scene.add(grid);

        // River / Divider (Mock visual)
        const riverGeo = new THREE.PlaneGeometry(30, 2);
        const riverMat = new THREE.MeshStandardMaterial({ color: 0x44aadd, opacity: 0.6, transparent: true });
        const river = new THREE.Mesh(riverGeo, riverMat);
        river.rotation.x = -Math.PI / 2;
        river.position.set(15, 0.02, 20); // Center at Z=20
        this.scene.add(river);
    }

    private initTowers() {
        // Tower Positions (approximate based on game rules)
        // P1 (Blue) - Z near 0
        // P2 (Red) - Z near 40

        const positions = [
            // Player 1 (Blue)
            { x: 7.5, z: 5, color: 0x3333dd, isKing: false },   // Left
            { x: 22.5, z: 5, color: 0x3333dd, isKing: false },  // Right
            { x: 15, z: 2, color: 0x3333dd, isKing: true },     // King

            // Player 2 (Red)
            { x: 7.5, z: 35, color: 0xdd3333, isKing: false },  // Left
            { x: 22.5, z: 35, color: 0xdd3333, isKing: false }, // Right
            { x: 15, z: 38, color: 0xdd3333, isKing: true },    // King
        ];

        positions.forEach(pos => {
            const h = pos.isKing ? 4 : 3;
            const r = pos.isKing ? 1.5 : 1;

            const geo = new THREE.CylinderGeometry(r, r + 0.5, h, 16);
            const mat = new THREE.MeshStandardMaterial({ color: pos.color });
            const mesh = new THREE.Mesh(geo, mat);

            mesh.position.set(pos.x, h / 2, pos.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            this.scene.add(mesh);
        });
    }

    public showDeployZone(playerIndex: number) {
        // Remove existing zone if any
        const existing = this.scene.getObjectByName("deploy_zone");
        if (existing) this.scene.remove(existing);

        // P1: Z 0-15 (Height 15), Center Z=7.5
        // P2: Z 25-40 (Height 15), Center Z=32.5
        // Width 30, Center X=15

        const isP1 = playerIndex === 1;
        const z = isP1 ? 7.5 : 32.5;
        const depth = 15;

        const geo = new THREE.PlaneGeometry(30, depth);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            opacity: 0.1,
            transparent: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(15, 0.1, z); // Slightly above ground
        mesh.name = "deploy_zone";

        this.scene.add(mesh);
    }
}
