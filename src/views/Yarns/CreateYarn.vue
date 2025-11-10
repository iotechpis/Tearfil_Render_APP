<template>
    <div ref="container" class="tw-w-full tw-h-full"></div>
</template>

<script lang="ts" setup>
import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

interface Props {
    form: {
        name: string;
        numberOfStrings: number;
        color: string;
        twist: number;
        chaos: number;
    };
}

const props = defineProps<Props>();

const container = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId: number
let fibersGroup: THREE.Group | null = null

//no futuro se calhar props tambem
const fiberRadius = 0.015
const fiberLength = 19.5
const bundleRadius = 0.4

const createFibers = () => {
    // --- Limpa as fibras antigas ---
    if (fibersGroup) {
        scene.remove(fibersGroup)

        // Limpa a memória (geometria e materiais)
        fibersGroup.children.forEach(child => {
            const mesh = child as THREE.Mesh
            if (mesh.geometry) mesh.geometry.dispose()
            // Se o material for partilhado, só precisamos de o limpar uma vez,
            // mas por segurança, limpamos todos.
            if (mesh.material) (mesh.material as THREE.Material).dispose()
        })
    }

    fibersGroup = new THREE.Group()

    // --- Pega nos valores do formulário ---
    const count = props.form.numberOfStrings
    const twist = props.form.twist
    const chaos = props.form.chaos

    if (count <= 0) {
        scene.add(fibersGroup)
        return
    }


    const fiberColor = new THREE.Color(props.form.color || '#FFFFFF');
    const material = new THREE.MeshStandardMaterial({
        color: fiberColor,
        roughness: 0.5,
        metalness: 0.1,
    })

    for (let i = 0; i < count; i++) {
        const angleOffset = Math.random() * Math.PI * 2
        const radialOffset = bundleRadius * Math.sqrt(Math.random())

        const offset = new THREE.Vector3(
            0,
            radialOffset * Math.cos(angleOffset),
            radialOffset * Math.sin(angleOffset)
        )

        const curvePoints: THREE.Vector3[] = []
        const segments = 200
        for (let j = 0; j <= segments; j++) {
            const t = j / segments
            const x = (t - 0.5) * fiberLength

            const twistAngle = t * twist * Math.PI * 2

            const rotatedOffset = new THREE.Vector3()
            rotatedOffset.y = offset.y * Math.cos(twistAngle) - offset.z * Math.sin(twistAngle)
            rotatedOffset.z = offset.y * Math.sin(twistAngle) + offset.z * Math.cos(twistAngle)
            rotatedOffset.x = x

            rotatedOffset.y += (Math.random() - 0.5) * chaos * 0.05
            rotatedOffset.z += (Math.random() - 0.5) * chaos * 0.05

            curvePoints.push(rotatedOffset)
        }

        const curve = new THREE.CatmullRomCurve3(curvePoints)
        const geometry = new THREE.TubeGeometry(curve, 200, fiberRadius, 8, false)

        const mesh = new THREE.Mesh(geometry, material)
        fibersGroup.add(mesh)
    }

    scene.add(fibersGroup)
}

const initScene = () => {
    if (!container.value) return

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    const width = container.value.clientWidth
    const height = container.value.clientHeight
    camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000)
    camera.position.set(1.5, 1.5, 1.5) // Posição inicial

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.value.appendChild(renderer.domElement)

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 0.5
    controls.maxDistance = 10

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7.5)
    scene.add(directionalLight)

    const animate = () => {
        animationId = requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
    }
    animate()
}

onMounted(() => {
    initScene()     
    createFibers()  
})

onUnmounted(() => {
    cancelAnimationFrame(animationId)
    if (fibersGroup) {
        scene.remove(fibersGroup)
        fibersGroup.children.forEach(child => {
            const mesh = child as THREE.Mesh
            if (mesh.geometry) mesh.geometry.dispose()
            if (mesh.material) (mesh.material as THREE.Material).dispose()
        })
    }
    renderer?.dispose()
    if (container.value && renderer?.domElement) {
        container.value.removeChild(renderer.domElement)
    }
})

watch(() => props.form, () => {
    if (scene) { 
        createFibers()
    }
}, {
    deep: true 
})

</script>