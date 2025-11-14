<template>
    <div ref="container" class="tw-w-full tw-h-96"></div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
interface Props {
    strings: {
        number: number;
        material: string;
        colors: {
            code: string;
            percentage: number;
        }[];
    }

    twist: number;
    chaos: number;
}

const props = defineProps<Props>()

const container = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId: number


const fiberCount = props.strings.number
const twistTurns = props.twist
const fiberRadius = 0.015
const fiberChaos = props.chaos
const fiberLength = 19.5 // total length (m) of the fiber divided by 1000
const bundleRadius = 0.4

const createFibers = () => {
    const fibersGroup = new THREE.Group()

    const totalPercentage = props.strings.colors.reduce((acc, s) => acc + s.percentage, 0)
    const normalized = props.strings.colors.map(s => ({
        color: new THREE.Color(s.code),
        weight: s.percentage / totalPercentage
    }))

    let colorDistribution: THREE.Color[] = []
    normalized.forEach(({ color, weight }) => {
        const count = Math.round(fiberCount * weight)
        colorDistribution.push(...Array(count).fill(color))
    })

    while (colorDistribution.length < fiberCount) {
        colorDistribution.push(normalized[0].color)
    }
    for (let i = 0; i < fiberCount; i++) {
        const color = colorDistribution[i];
        const material = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.5,
            metalness: 0.1,
        })

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
            const twistAngle = t * twistTurns * Math.PI * 2

            const rotatedOffset = new THREE.Vector3()
            rotatedOffset.y = offset.y * Math.cos(twistAngle) - offset.z * Math.sin(twistAngle)
            rotatedOffset.z = offset.y * Math.sin(twistAngle) + offset.z * Math.cos(twistAngle)
            rotatedOffset.x = x

            rotatedOffset.y += (Math.random() - 0.5) * fiberChaos * 0.05
            rotatedOffset.z += (Math.random() - 0.5) * fiberChaos * 0.05

            curvePoints.push(rotatedOffset)
        }

        const curve = new THREE.CatmullRomCurve3(curvePoints)
        const geometry = new THREE.TubeGeometry(curve, 200, fiberRadius, 8, false)
        const mesh = new THREE.Mesh(geometry, material)
        fibersGroup.add(mesh)
    }

    scene.add(fibersGroup)
}

onMounted(() => {
    if (!container.value) return

    // Criar cena primeiro como cmake
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    const width = container.value.clientWidth
    const height = container.value.clientHeight
    camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000)
    camera.position.set(2, 2, 2)

    // Render primeiro, depois settings
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.value.appendChild(renderer.domElement)
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = false
    controls.minDistance = 0
    controls.maxDistance = 10
    controls.maxPolarAngle = Math.PI / 2
    // Luz
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7.5)
    scene.add(directionalLight)
    createFibers()

    const animate = () => {
        animationId = requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
    }
    animate()
})
</script>