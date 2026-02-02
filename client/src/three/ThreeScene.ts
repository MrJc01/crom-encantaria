import * as THREE from 'three';

export class ThreeScene {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    private container: HTMLElement;
    private animationId: number | null = null;
    private _width: number;
    private _height: number;

    constructor(container: HTMLElement) {
        this.container = container;
        this._width = container.clientWidth;
        this._height = container.clientHeight;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a); // Dark background default
        // Fog for depth
        this.scene.fog = new THREE.Fog(0x1a1a1a, 20, 60);

        // 2. Camera
        // Perspective Camera inclined at ~60 degrees
        this.camera = new THREE.PerspectiveCamera(
            50, // FOV
            this._width / this._height, // Aspect
            0.1, // Near
            1000 // Far
        );

        // Initial position: Center X (15), High Y for view, Z offset
        // Server World: X=0-30, Y=0-40.
        // Three World: X=0-30, Z=0-40. 
        // We look from "South" (Player 1 base) towards "North" (Player 2 base).
        // Center of arena is roughly 15, 20.

        // Position camera "behind" Player 1 (Z < 0 or Z > 40? 
        // P1 is Y=0-10 server side. Let's map Server Y -> Three Z.
        // P1 Base at Z=0. P2 Base at Z=40.
        // We want to look from Z=-10 upwards/forwards.
        // Initial position: Default P1 (will be updated via setCameraPerspective)
        this.camera.position.set(15, 25, -15);
        this.camera.lookAt(15, 0, 15);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this._width, this._height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        container.appendChild(this.renderer.domElement);

        // Resize Listener
        window.addEventListener('resize', this.onResize.bind(this));
    }

    private onResize() {
        if (!this.container) return;
        this._width = this.container.clientWidth;
        this._height = this.container.clientHeight;

        this.camera.aspect = this._width / this._height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this._width, this._height);
    }

    public setCameraPerspective(playerIndex: 1 | 2) {
        if (playerIndex === 1) {
            // Player 1 View: From Bottom looking Up (Z- to Z+)
            this.camera.position.set(15, 25, -15);
            this.camera.lookAt(15, 0, 15);
        } else {
            // Player 2 View: From Top looking Down (Z+ to Z-)
            // Mirror position relative to center (Z=20)
            // P1 Z = -15 (35 units from center). P2 Z = 20 + 35 = 55.
            this.camera.position.set(15, 25, 55);
            this.camera.lookAt(15, 0, 25);
        }
    }

    public start(onTick: (delta: number) => void) {
        const clock = new THREE.Clock();

        const loop = () => {
            this.animationId = requestAnimationFrame(loop);
            const delta = clock.getDelta();

            onTick(delta); // Update logic (interpolations etc)

            this.renderer.render(this.scene, this.camera);
        };
        loop();
    }

    public getIntersection(x: number, y: number, objects: THREE.Object3D[]): THREE.Intersection | null {
        // x, y should be normalized device coordinates (-1 to +1)
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2(x, y);

        raycaster.setFromCamera(pointer, this.camera);
        const intersects = raycaster.intersectObjects(objects, false);

        if (intersects.length > 0) {
            return intersects[0] as THREE.Intersection;
        }
        return null;
    }

    public stop() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        window.removeEventListener('resize', this.onResize.bind(this));

        // Cleanup renderer
        this.container.removeChild(this.renderer.domElement);
        this.renderer.dispose();
    }
}
