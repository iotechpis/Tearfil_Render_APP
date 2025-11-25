<template>
    <div ref="canvasContainer" class="tw-w-full tw-h-full"></div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Color {
    color: string;
    percentage: number;
}

interface Props {
    showCard?: boolean;
    form: {
        name: string;
        numberOfStrings: number;
        colors: Color[];
        twist: number;
        chaos: number;
    };
}

const props = defineProps<Props>();
const loading = ref(false);

const canvasContainer = ref<HTMLDivElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let animationId: number;
let yarnGroup: THREE.Group | null = null;
let coreSpoolsGroup: THREE.Group | null = null;

const fiberRadius = 0.01;
const bundleRadius = 0.175;

const coneHeight = 14;
const coneRadiusBottom = 6.5;
const coneRadiusTop = 4.0;

const totalWindingTurns = 400;
const windingCycles = 35;

const windingMargin = 0.06;

const cardSpacing = coneHeight + 2;

const createYarnCone = async () => {
    if (!scene) return;
    loading.value = true;

    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 50));

    if (yarnGroup) {
        scene.remove(yarnGroup);
        yarnGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
    if (coreSpoolsGroup) {
        scene.remove(coreSpoolsGroup);
        coreSpoolsGroup.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    }

    yarnGroup = new THREE.Group();
    coreSpoolsGroup = new THREE.Group();

    const count = props.form.numberOfStrings;
    const twist = props.form.twist;
    const chaos = props.form.chaos * 0.8;

    if (count <= 0) {
        scene.add(yarnGroup);
        scene.add(coreSpoolsGroup);
        loading.value = false;
        return;
    }

    const materiais: THREE.MeshStandardMaterial[] = [];
    const pesosAcumulados: number[] = [];
    let pesoAcumulado = 0.0;
    const inputColors = props.form.colors;

    if (inputColors && inputColors.length > 0) {
        const percentagemTotal = inputColors.reduce((acc, c) => acc + (c.percentage || 0), 0);
        const usarPesosIguais = percentagemTotal === 0;

        for (const cor of inputColors) {
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(cor.color || '#FFFFFF'),
                roughness: 0.6,
                metalness: 0.05,
            });
            materiais.push(material);
            const peso = usarPesosIguais ? (1.0 / inputColors.length) : ((cor.percentage || 0) / percentagemTotal);
            pesoAcumulado += peso;
            pesosAcumulados.push(pesoAcumulado);
        }
    } else {
        materiais.push(new THREE.MeshStandardMaterial({ color: new THREE.Color('#FFFFFF'), roughness: 0.8, metalness: 0.01 }));
        pesosAcumulados.push(1.0);
    }

    const numRows = props.showCard ? 3 : 1;

    const coreGeometry = new THREE.CylinderGeometry(coneRadiusTop - 0.05, coneRadiusBottom - 0.05, coneHeight, 64);
    const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0xD3D1D1,
        roughness: 0.4
    });

    for (let row = 0; row < numRows; row++) {
        let yOffset = 0;
        if (numRows > 1) {
            const centerIndex = (numRows - 1) / 2;
            yOffset = (row - centerIndex) * cardSpacing;
        }

        const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
        coreMesh.position.y = yOffset;
        coreMesh.position.y -= 0.1;
        coreSpoolsGroup.add(coreMesh);

        for (let i = 0; i < count; i++) {
            const angleOffset = Math.random() * Math.PI * 2;
            const radialOffset = bundleRadius * Math.sqrt(Math.random());

            const localOffsetY = radialOffset * Math.cos(angleOffset);
            const localOffsetZ = radialOffset * Math.sin(angleOffset);

            const curvePoints: THREE.Vector3[] = [];
            const segments = 8500;

            for (let j = 0; j <= segments; j++) {
                const t = j / segments;

                const cycleProgress = t * windingCycles * Math.PI * 2;
                let rawHeightPercentage = (1 - Math.cos(cycleProgress)) / 2;

                const effectiveHeightPercentage = windingMargin + rawHeightPercentage * (1 - 2 * windingMargin);

                const currentYPos = (effectiveHeightPercentage - 0.5) * coneHeight;

                const currentRadius = coneRadiusBottom + (coneRadiusTop - coneRadiusBottom) * effectiveHeightPercentage;

                const currentAngle = t * totalWindingTurns * Math.PI * 2;

                const bundleCenterPoint = new THREE.Vector3(
                    currentRadius * Math.cos(currentAngle),
                    currentYPos,
                    currentRadius * Math.sin(currentAngle)
                );

                const normalDir = new THREE.Vector3(bundleCenterPoint.x, 0, bundleCenterPoint.z).normalize();
                const upDir = new THREE.Vector3(0, 1, 0);
                const twistAngle = t * twist * Math.PI * 2;

                let finalFiberPoint = bundleCenterPoint.clone();
                finalFiberPoint.addScaledVector(upDir, localOffsetY * Math.cos(twistAngle) - localOffsetZ * Math.sin(twistAngle));
                finalFiberPoint.addScaledVector(normalDir, localOffsetY * Math.sin(twistAngle) + localOffsetZ * Math.cos(twistAngle));

                const chaosFactor = chaos * 0.015;
                finalFiberPoint.addScaledVector(normalDir, (Math.random() - 0.5) * chaosFactor);
                finalFiberPoint.y += (Math.random() - 0.5) * chaosFactor * 1.5;

                finalFiberPoint.y += yOffset;

                curvePoints.push(finalFiberPoint);
            }

            const curve = new THREE.CatmullRomCurve3(curvePoints);
            const geometry = new THREE.TubeGeometry(curve, segments, fiberRadius, 5, false);

            const rand = Math.random();
            let materialSelecionado = materiais[materiais.length - 1];
            for (let k = 0; k < pesosAcumulados.length; k++) {
                if (rand < pesosAcumulados[k]) {
                    materialSelecionado = materiais[k];
                    break;
                }
            }

            const mesh = new THREE.Mesh(geometry, materialSelecionado);
            yarnGroup.add(mesh);
        }
    }

    scene.add(coreSpoolsGroup);
    scene.add(yarnGroup);
    loading.value = false;
};

const initScene = () => {
    if (!canvasContainer.value) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const width = canvasContainer.value.clientWidth;
    const height = canvasContainer.value.clientHeight;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 15, 35);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    canvasContainer.value.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 100;
    controls.target.set(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 20, 15);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-15, 5, 10);
    scene.add(fillLight);

    const animate = () => {
        animationId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    animate();
};


onMounted(() => {
    initScene();
    setTimeout(() => {
        createYarnCone();
    }, 100);

    window.addEventListener('resize', onWindowResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', onWindowResize);
    cancelAnimationFrame(animationId);

    if (yarnGroup) scene.remove(yarnGroup);
    if (coreSpoolsGroup) scene.remove(coreSpoolsGroup);

    scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
                else object.material.dispose();
            }
        }
    });

    renderer?.dispose();
    controls?.dispose();
    if (canvasContainer.value && renderer?.domElement) {
        canvasContainer.value.removeChild(renderer.domElement);
    }
});

const onWindowResize = () => {
    if (!canvasContainer.value || !camera || !renderer) return;
    const width = canvasContainer.value.clientWidth;
    const height = canvasContainer.value.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};

watch([() => props.form, () => props.showCard], () => {
    createYarnCone();
}, { deep: true });

</script>