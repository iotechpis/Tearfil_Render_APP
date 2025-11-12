<template>
    <div ref="container" class="tw-w-full tw-h-full">
    </div>
</template>

<script lang="ts" setup>
import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

interface YarnFormData {
    name: string;
    numberOfStrings: number;
    color: string; // Nota: esta prop será ignoradapor enquanto
    twist: number;
    chaos: number;
}

interface Props {
    fabrics: YarnFormData[];       
    percentages: number[];         
    palette: number[][];           
    textureWidth?: number;        
    textureHeight?: number;        
}

const props = withDefaults(defineProps<Props>(), {
    textureWidth: 80,
    textureHeight: 10000,
});

const container = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId: number
let compositeGroup: THREE.Group | null = null
let materials: THREE.MeshStandardMaterial[] = [];
let deterministicTexture: THREE.DataTexture | null = null; 

const fiberRadius = 0.015
const fiberLength = 19.5
const yarnBundleRadius = 0.3
const compositeTwistTurns = 2

function generateDeterministicTexture(percentages: any, palette: any, texWidth: any, texHeight: any, phases = [0.0, 0.0]) {
    const h = texHeight; 
    const w = texWidth;  // Circunferência

    const phi = (Math.sqrt(5) - 1) / 2.0;
    const rt2 = Math.sqrt(2) - 1.0;

    const p = percentages.map((val: any) => parseFloat(val));
    const pSum = p.reduce((a: any, b: any) => a + b, 0);
    const cdf = [];
    let cumsum = 0.0;
    for (const val of p) {
        cumsum += val / pSum;
        cdf.push(cumsum);
    }

    const data = new Uint8Array(w * h * 4);

    for (let y = 0; y < h; y++) { 
        for (let x = 0; x < w; x++) { 
            
            const t = (y * phi + x * rt2 + phases[0] + phases[1]) % 1.0;

            let k = 0; 
            for (let c = 0; c < cdf.length; c++) {
                if (t <= cdf[c]) {
                    k = c;
                    break;
                }
            }
            
            const color = palette[k] || [0, 0, 0]; 
            
            const index = (y * w + x) * 4;
            data[index]     = color[0] * 255; // R
            data[index + 1] = color[1] * 255; // G
            data[index + 2] = color[2] * 255; // B
            data[index + 3] = 255;            // A
        }
    }

    const texture = new THREE.DataTexture(data, w, h);
    texture.needsUpdate = true;
    return texture;
}

const createCompositeYarn = () => {
    if (compositeGroup) {
        scene.remove(compositeGroup)
        compositeGroup.children.forEach(child => {
            const mesh = child as THREE.Mesh
            if (mesh.geometry) mesh.geometry.dispose()
        })
    }

    if (deterministicTexture) {
        deterministicTexture.dispose();
    }
    materials.forEach(m => m.dispose());
    materials = [];
    compositeGroup = new THREE.Group()

    const { percentages, palette, fabrics } = props;
    if (!percentages || !palette || percentages.length === 0 || palette.length === 0) {
        console.warn("DeterministicYarnViewer: Faltam 'percentages' ou 'palette'.");
        scene.add(compositeGroup);
        return;
    }
    const numYarns = fabrics.length;
    if (numYarns === 0) {
        scene.add(compositeGroup);
        return;
    }

    deterministicTexture = generateDeterministicTexture(
        percentages,
        palette,
        props.textureWidth,
        props.textureHeight
    );

    const mixedMaterial = new THREE.MeshStandardMaterial({
        map: deterministicTexture,
        roughness: 0.5,
        metalness: 0.1,
    });
    materials.push(mixedMaterial); 

    for (let i = 0; i < numYarns; i++) {
        const yarnData = fabrics[i]; 

        const yarnTwist = yarnData.twist;
        const yarnChaos = yarnData.chaos;
        const yarnFiberCount = yarnData.numberOfStrings;

        let effectiveCompositeRadius: number;
        const yarnAngleOffset = (i / numYarns) * Math.PI * 2;
        if (numYarns === 1) {
            effectiveCompositeRadius = 0;
        } else if (numYarns === 2) {
            effectiveCompositeRadius = yarnBundleRadius;
        } else {
            const R = yarnBundleRadius;
            const N = numYarns;
            const angle = Math.PI / N;
            effectiveCompositeRadius = R / Math.sin(angle);
        }
        const yarnCenterOffsetVector = new THREE.Vector3(
            0,
            effectiveCompositeRadius * Math.cos(yarnAngleOffset),
            effectiveCompositeRadius * Math.sin(yarnAngleOffset)
        );
        // ...

        for (let j = 0; j < yarnFiberCount; j++) {
            
            const fiberAngle = Math.random() * Math.PI * 2;
            const fiberLocalRadius = yarnBundleRadius * Math.sqrt(Math.random());
            const fiberOffsetVector = new THREE.Vector3(
                0,
                fiberLocalRadius * Math.cos(fiberAngle),
                fiberLocalRadius * Math.sin(fiberAngle)
            );

            const curvePoints: THREE.Vector3[] = [];
            const segments = 100;
            for (let k = 0; k <= segments; k++) {
                const t = k / segments;
                const x = (t - 0.5) * fiberLength;

                const innerTwistAngle = t * yarnTwist * Math.PI * 2;
                const rotatedFiberOffset = new THREE.Vector3();
                rotatedFiberOffset.y = fiberOffsetVector.y * Math.cos(innerTwistAngle) - fiberOffsetVector.z * Math.sin(innerTwistAngle);
                rotatedFiberOffset.z = fiberOffsetVector.y * Math.sin(innerTwistAngle) + fiberOffsetVector.z * Math.cos(innerTwistAngle);
                
                const outerTwistAngle = t * compositeTwistTurns * Math.PI * 2;
                const rotatedYarnCenter = new THREE.Vector3();
                rotatedYarnCenter.y = yarnCenterOffsetVector.y * Math.cos(outerTwistAngle) - yarnCenterOffsetVector.z * Math.sin(outerTwistAngle);
                rotatedYarnCenter.z = yarnCenterOffsetVector.y * Math.sin(outerTwistAngle) + yarnCenterOffsetVector.z * Math.cos(outerTwistAngle);

                rotatedFiberOffset.y += (Math.random() - 0.5) * yarnChaos * 0.05;
                rotatedFiberOffset.z += (Math.random() - 0.5) * yarnChaos * 0.05;

                const finalPoint = new THREE.Vector3(x, 0, 0);
                finalPoint.add(rotatedYarnCenter);
                finalPoint.add(rotatedFiberOffset);

                curvePoints.push(finalPoint);
            }
            // ...

            const curve = new THREE.CatmullRomCurve3(curvePoints);
            const geometry = new THREE.TubeGeometry(curve, segments, fiberRadius, 8, false);
            
            const mesh = new THREE.Mesh(geometry, mixedMaterial); 
            compositeGroup.add(mesh);
        }
    }

    scene.add(compositeGroup);
}

const initScene = () => {
    if (!container.value) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const width = container.value.clientWidth;
    const height = container.value.clientHeight;
    camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
    camera.position.set(2, 2, 2); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.value.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 20; 

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const animate = () => {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    animate();
};

onMounted(() => {
    console.log("Mounting DeterministicMaterialViewer and initializing scene.");
    nextTick(() => {
        initScene();
        createCompositeYarn();
    });
});

onUnmounted(() => {
    console.log("Unmounting DeterministicMaterialViewer and cleaning up resources.");
    cancelAnimationFrame(animationId);
    if (compositeGroup) {
        scene.remove(compositeGroup);
        compositeGroup.children.forEach(child => {
            const mesh = child as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
        });
    }
    if (deterministicTexture) {
        deterministicTexture.dispose();
    }
    materials.forEach(m => m.dispose());
    renderer?.dispose();
    if (container.value && renderer?.domElement) {
        container.value.removeChild(renderer.domElement);
    }
});

watch(
    () => [props.fabrics, props.percentages, props.palette],
    () => {
        if (scene) {
            createCompositeYarn();
        }
    },
    { deep: true }
);

</script>