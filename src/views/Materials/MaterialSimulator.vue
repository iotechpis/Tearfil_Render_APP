<template>
  <div ref="container" class="tw-w-full tw-h-full tw-rounded-lg tw-overflow-hidden"></div>
</template>

<script lang="ts" setup>
import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

interface Color {
  color: string;
  percentage: number;
}
interface YarnData {
  name: string;
  numberOfStrings: number;
  colors: Color[];
  twist?: number;
  chaos?: number;
}

interface Props {
  fabrics: YarnData[];
  crossings: number;
}

const props = defineProps<Props>();

const container = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId: number
let fabricGroup: THREE.Group | null = null

const SEGMENTS = 30;
const RADIAL_SEGMENTS = 5;
const FIBER_RADIUS = 0.15;

const initScene = () => {
  if (!container.value) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const width = container.value.clientWidth;
  const height = container.value.clientHeight;

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 40);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  const animate = () => {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();
}

const generateFabric = () => {
  if (fabricGroup) {
    scene.remove(fabricGroup);
    fabricGroup.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
        else mesh.material.dispose();
      }
    });
  }

  fabricGroup = new THREE.Group();
  const numStrands = props.crossings; 

  const totalHeight = 20;
  const spacing = totalHeight / numStrands;
  const startY = -totalHeight / 2;
  const lineLength = 35;

  const materials: THREE.MeshStandardMaterial[] = [];

  
  props.fabrics.forEach(yarn => {
    if (yarn.colors && yarn.colors.length > 0) {
      yarn.colors.forEach(c => {
        materials.push(new THREE.MeshStandardMaterial({
          color: c.color,
          roughness: 0.8,
          metalness: 0.0
        }));
      });
    } else {
      materials.push(new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    }
  });

  if (materials.length === 0) return;

  for (let i = 0; i < numStrands; i++) {
    const yPos = startY + (i * spacing);

    
    const points: THREE.Vector3[] = [];

    for (let j = 0; j <= SEGMENTS; j++) {
      const t = j / SEGMENTS;
      const x = (t - 0.5) * lineLength;

      
      const noiseZ = (Math.random() - 0.5) * 0.3;
      const noiseY = (Math.random() - 0.5) * 0.15;

      points.push(new THREE.Vector3(x, yPos + noiseY, noiseZ));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, SEGMENTS, FIBER_RADIUS, RADIAL_SEGMENTS, false);

    const randomMat = materials[Math.floor(Math.random() * materials.length)];

    const mesh = new THREE.Mesh(geometry, randomMat);
    fabricGroup.add(mesh);
  }

  scene.add(fabricGroup);
}

onMounted(() => {
  console.log('props.fabrics', props.fabrics);
  initScene();
  generateFabric();
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  renderer?.dispose();
  if (container.value && renderer?.domElement) {
    container.value.removeChild(renderer.domElement);
  }
});

watch(() => [props.crossings, props.fabrics], () => {
  if (scene) generateFabric();
}, { deep: true });

</script>