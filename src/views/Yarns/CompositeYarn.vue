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
    color: string;
    twist: number;
    chaos: number;
}
interface Props {
    fabrics: YarnFormData[];
}
const props = defineProps<Props>();

const container = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId: number
let compositeGroup: THREE.Group | null = null
let materials: THREE.MeshStandardMaterial[] = [];

const fiberRadius = 0.015
const fiberLength = 19.5
const yarnBundleRadius = 0.3

const compositeTwistTurns = 2

const createCompositeYarn = () => {

    if (compositeGroup) {
        scene.remove(compositeGroup)
        compositeGroup.children.forEach(child => {
            const mesh = child as THREE.Mesh
            if (mesh.geometry) mesh.geometry.dispose()
        })
    }

    materials.forEach(m => m.dispose());
    materials = [];
    compositeGroup = new THREE.Group()

    const numYarns = props.fabrics.length;
    if (numYarns === 0) {
        scene.add(compositeGroup);
        return;
    }

    for (let i = 0; i < numYarns; i++) {
        const yarnData = props.fabrics[i];

        const yarnTwist = yarnData.twist;
        const yarnChaos = yarnData.chaos;
        const yarnFiberCount = yarnData.numberOfStrings;

        const yarnColor = new THREE.Color(yarnData.color || '#FFFFFF');
        const yarnMaterial = new THREE.MeshStandardMaterial({
            color: yarnColor,
            roughness: 0.5,
            metalness: 0.1,
        });
        materials.push(yarnMaterial); 

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

            const curve = new THREE.CatmullRomCurve3(curvePoints);
            const geometry = new THREE.TubeGeometry(curve, segments, fiberRadius, 8, false);
            const mesh = new THREE.Mesh(geometry, yarnMaterial); 
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
    nextTick(() => {
        initScene();
        createCompositeYarn();
    });
});

onUnmounted(() => {
    cancelAnimationFrame(animationId);
    if (compositeGroup) {
        scene.remove(compositeGroup);
        compositeGroup.children.forEach(child => {
            const mesh = child as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
        });
    }
    materials.forEach(m => m.dispose());
    renderer?.dispose();
    if (container.value && renderer?.domElement) {
        container.value.removeChild(renderer.domElement);
    }
});

watch(() => props.fabrics, () => {
    if (scene) {
        createCompositeYarn();
    }
}, {
    deep: true
});
</script>