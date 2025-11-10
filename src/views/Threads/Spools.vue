<template>
    <div ref="canvasContainer" class="tw-w-full tw-h-96"></div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

interface Props {
    src: string
    code: string
}

const props = defineProps<Props>()

const emit = defineEmits(['update:code']);

const localCode = ref<string>(props.code);

watch(() => props.code, (newCode) => {
    localCode.value = newCode;
});


const modelUrl = props.src

const canvasContainer = ref<HTMLDivElement | null>(null)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId: number

onMounted(() => {
    if (!canvasContainer.value) return

    // Criar cena primeiro como cmake
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    const width = canvasContainer.value.clientWidth
    const height = canvasContainer.value.clientHeight
    camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000)
    camera.position.set(0, 0, 0.2)

    // Render primeiro, depois settings
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    canvasContainer.value.appendChild(renderer.domElement)
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = false
    controls.minDistance = 0
    controls.maxDistance = 1
    controls.maxPolarAngle = Math.PI / 2
    // Luz
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7.5)
    scene.add(directionalLight)

    // Carregar modelo
    const loader = new GLTFLoader()
    loader.load(
        modelUrl,
        (gltf) => {
            const model = gltf.scene
            scene.add(model)

            // bounding box
            const box = new THREE.Box3().setFromObject(model)
            const center = new THREE.Vector3()
            box.getCenter(center)
            const size = new THREE.Vector3()
            box.getSize(size)

            controls.target.copy(center)

            const maxDim = Math.max(size.x, size.y, size.z)

            camera.position.copy(center)

            camera.position.x += maxDim * 1.0
            camera.position.y += maxDim * 1.0
            camera.position.z += maxDim * 1.5

            controls.minDistance = maxDim * 0.1
            controls.maxDistance = maxDim * 6

            // 8. Atualizar os controlos para aplicar as novas posições
            controls.update()

            // select production
            const raycaster = new THREE.Raycaster()
            const mouse = new THREE.Vector2()
            let selectionBox: THREE.BoxHelper | null = null;
            let selectedObject: THREE.Object3D | null = null

            renderer.domElement.addEventListener('click', (event) => {
                if (!canvasContainer.value || !model) return;

                const rect = renderer.domElement.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(model.children, true);

                if (selectionBox) {
                    scene.remove(selectionBox);
                    selectionBox.dispose();
                    selectionBox = null;
                }

                let newObjectToSelect: THREE.Object3D | null = null;
                if (intersects.length > 0) {
                    let clickedObject = intersects[0].object;

                    if (clickedObject.parent) {
                        newObjectToSelect = clickedObject.parent;
                    }
                }
            
                if (newObjectToSelect && newObjectToSelect !== selectedObject) {
                    // Selecionar o novo objeto
                    selectedObject = newObjectToSelect;
                    selectionBox = new THREE.BoxHelper(selectedObject, 0x0000ff); 
                    scene.add(selectionBox);
                    emit('update:code', selectedObject.name);

                } else {
                    // Desselecionar tudo
                    if (selectedObject) {
                        console.log('Desselecionado:', selectedObject.name);
                    }
                    selectedObject = null;
                }
            });
        },
        undefined,
        (error) => {
            console.error("Error loading model:", error)
        }
    )

    // Animar
    const animate = () => {
        animationId = requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
    }
    animate()
})
</script>