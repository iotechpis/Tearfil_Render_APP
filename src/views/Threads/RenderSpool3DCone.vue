<template>
    <div ref="container" class="tw-w-full tw-h-96"></div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
interface Props {
    strings: Array<any>
}

const props = defineProps<Props>()

const container = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId: number


const fiberCount = 200
const twistTurns = 4
const fiberRadius = 0.015
const fiberChaos = 0.05
const fiberLength = 19.5 // total length (m) of the fiber divided by 1000
const bundleRadius = 0.4


let spool: THREE.Group

const spoolCoreRadius = 0.8
const spoolHeight = 12 
const spoolFlangeRadius = 1.6
const spoolFlangeThickness = 0.2

const createSpool = () => {
    spool = new THREE.Group()
    const spoolMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x666666, 
        roughness: 0.5, 
        metalness: 0.1 
    })

    const coreGeom = new THREE.CylinderGeometry(spoolCoreRadius, spoolCoreRadius, spoolHeight, 32)
    const core = new THREE.Mesh(coreGeom, spoolMaterial)
    spool.add(core)

    const flangeGeom = new THREE.CylinderGeometry(spoolFlangeRadius, spoolFlangeRadius, spoolFlangeThickness, 32)
    
    const flange1 = new THREE.Mesh(flangeGeom, spoolMaterial)
    flange1.position.y = spoolHeight / 2 + spoolFlangeThickness / 2
    spool.add(flange1)

    const flange2 = new THREE.Mesh(flangeGeom, spoolMaterial)
    flange2.position.y = -(spoolHeight / 2 + spoolFlangeThickness / 2)
    spool.add(flange2)

    spool.rotation.z = Math.PI / 2

    scene.add(spool)
}

const createFibers = () => {
    createSpool() 

    const fibersGroup = new THREE.Group()

    const totalPercentage = props.strings.reduce((acc, s) => acc + s.percentage, 0)
    const normalized = props.strings.map(s => ({
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
    
    const segments = 200
    const windings = 20 
    const helixPoints: THREE.Vector3[] = []

    for (let i = 0; i <= segments; i++) {
        const t = i / segments 
        
        const x = (t - 0.5) * spoolHeight
        
        const angle = t * windings * Math.PI * 2
        const y = spoolCoreRadius * Math.cos(angle)
        const z = spoolCoreRadius * Math.sin(angle)
        
        helixPoints.push(new THREE.Vector3(x, y, z))
    }

    const bundlePath = new THREE.CatmullRomCurve3(helixPoints)
    
    const pathPoints = bundlePath.getPoints(segments)
    const tubeGeometry = new THREE.TubeGeometry(bundlePath, segments, fiberRadius, 8, false)
    const frames = tubeGeometry.parameters.path.computeFrenetFrames(segments, false)

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
        
        for (let j = 0; j <= segments; j++) {
            const t = j / segments

            const centerPoint = pathPoints[j]
            const normal = frames.normals[j]
            const binormal = frames.binormals[j]

            const twistAngle = t * twistTurns * Math.PI * 2
            const c = Math.cos(twistAngle)
            const s = Math.sin(twistAngle)

            const rotatedN = offset.y * c - offset.z * s
            const rotatedB = offset.y * s + offset.z * c

            const point = new THREE.Vector3().copy(centerPoint)
            point.addScaledVector(normal, rotatedN)
            point.addScaledVector(binormal, rotatedB)

            const chaosN = (Math.random() - 0.5) * fiberChaos * 0.05
            const chaosB = (Math.random() - 0.5) * fiberChaos * 0.05
            point.addScaledVector(normal, chaosN)
            point.addScaledVector(binormal, chaosB)

            curvePoints.push(point)
        }

        const curve = new THREE.CatmullRomCurve3(curvePoints)

        const geometry = new THREE.TubeGeometry(curve, 64, fiberRadius, 8, false)
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