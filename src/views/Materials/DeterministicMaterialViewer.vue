<template>
    <div ref="container" class="tw-w-full tw-h-full"></div>
  </template>
  
  <script lang="ts" setup>
  import * as THREE from 'three'
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
  import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
  
  // --- Interfaces (Definindo a "API" do componente) ---
  
  interface Color {
    color: string;
    percentage: number;
  }
  
  interface YarnForm {
    name: string;
    numberOfStrings: number; // Fibras no fio
    colors: Color[];
    twist: number; // Torção das fibras
    chaos: number;
    bundleRadius: number; // Raio total do fio
    fiberRadius: number; // Raio de cada fibra
  }
  
  interface YarnCardSettings {
    rows: number;
    spacing: number;
    yarnLength: number;
  }
  
  interface FabricSettings {
    warpForm: YarnForm; // Definição do fio de Urdume
    weftForm: YarnForm; // Definição do fio de Trama
    warpDensity: number; // Fios por cm
    weftDensity: number; // Fios por cm
    width: number; // Largura do tecido (cm)
    height: number; // Altura do tecido (cm)
    weavePattern: 'plain'; // Por enquanto, apenas 1/1 (plain weave)
  }
  
  interface Props {
    previewMode: 'yarn' | 'yarnCard' | 'fabric';
    yarnForm: YarnForm;
    yarnCardSettings: YarnCardSettings;
    fabricSettings: FabricSettings;
  }
  
  const props = defineProps<Props>();
  
  // --- Configuração do Three.js ---
  
  const container = ref<HTMLDivElement | null>(null)
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let renderer: THREE.WebGLRenderer
  let controls: OrbitControls
  let animationId: number
  let mainGroup: THREE.Group | null = null // Grupo principal para conter o material
  
  const initScene = () => {
    if (!container.value) return
  
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
  
    const width = container.value.clientWidth
    const height = container.value.clientHeight
    camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000)
    camera.position.set(1.5, 1.5, 1.5)
    controls = new OrbitControls(camera, renderer.domElement)
    
    // Posicionamento inicial da câmera
    camera.position.set(0, 0, 10) // Olhando para a origem
    controls.target.set(0, 0, 0)
  
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    container.value.appendChild(renderer.domElement)
  
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 0.5
    controls.maxDistance = 100 // Aumentar a distância máxima para ver o tecido
  
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7.5)
    scene.add(directionalLight)
  
    mainGroup = new THREE.Group()
    scene.add(mainGroup)
  
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()
  }
  
  // Helper para limpar a cena antes de redesenhar
  const clearMainGroup = () => {
    if (!mainGroup) return
    while (mainGroup.children.length > 0) {
      const child = mainGroup.children[0]
      mainGroup.remove(child)
  
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    }
  }
  
  // --- Lógica de Geração ---
  
  /**
   * MODO 1: FIO ÚNICO (Seu código original, refatorado para retornar um Group)
   * Cria um único segmento de fio reto com fibras detalhadas.
   */
  const createYarnSegment = (form: YarnForm, length: number): THREE.Group => {
    const segmentGroup = new THREE.Group()
    
    const { numberOfStrings, twist, chaos, colors, bundleRadius, fiberRadius } = form
    const fiberLength = length
  
    if (numberOfStrings <= 0) {
      return segmentGroup
    }
  
    // Lógica de seleção de material (copiada do seu código)
    const materiais: THREE.MeshStandardMaterial[] = [];
    const pesosAcumulados: number[] = [];
    let pesoAcumulado = 0.0;
  
    if (colors && colors.length > 0) {
      const percentagemTotal = colors.reduce((acc, c) => acc + (c.percentage || 0), 0);
      const usarPesosIguais = percentagemTotal === 0;
  
      for (const cor of colors) {
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(cor.color || '#FFFFFF'),
          roughness: 0.7,
          metalness: 0.1,
        });
        materiais.push(material);
        const peso = usarPesosIguais ? (1.0 / colors.length) : ((cor.percentage || 0) / percentagemTotal);
        pesoAcumulado += peso;
        pesosAcumulados.push(pesoAcumulado);
      }
    } else {
      materiais.push(new THREE.MeshStandardMaterial({ color: new THREE.Color('#FFFFFF'), roughness: 0.7, metalness: 0.1 }));
      pesosAcumulados.push(1.0);
    }
  
    // Geração das fibras (copiada do seu código)
    for (let i = 0; i < numberOfStrings; i++) {
      const angleOffset = Math.random() * Math.PI * 2
      const radialOffset = bundleRadius * Math.sqrt(Math.random())
  
      const offset = new THREE.Vector3(
        0,
        radialOffset * Math.cos(angleOffset),
        radialOffset * Math.sin(angleOffset)
      )
  
      const curvePoints: THREE.Vector3[] = []
      const segments = 100 // Reduzido para performance
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
      const geometry = new THREE.TubeGeometry(curve, 64, fiberRadius, 5, false) // Geometria simplificada
  
      const rand = Math.random();
      let materialSelecionado = materiais[materiais.length - 1];
      for (let k = 0; k < pesosAcumulados.length; k++) {
        if (rand < pesosAcumulados[k]) {
          materialSelecionado = materiais[k];
          break;
        }
      }
      const mesh = new THREE.Mesh(geometry, materialSelecionado);
      segmentGroup.add(mesh)
    }
    return segmentGroup
  }
  
  /**
   * MODO 2: YARN CARD (Múltiplos fios)
   * Clona o segmento de fio várias vezes.
   */
  const createYarnCard = (form: YarnForm, settings: YarnCardSettings): THREE.Group => {
    const cardGroup = new THREE.Group()
    const { rows, spacing, yarnLength } = settings
    
    if (rows <= 0) return cardGroup
    
    // Criamos um protótipo de fio
    const protoYarn = createYarnSegment(form, yarnLength)
  
    for (let i = 0; i < rows; i++) {
      const yarnClone = protoYarn.clone()
      // Posiciona os fios verticalmente, centrados na origem
      yarnClone.position.y = (i - (rows - 1) / 2) * spacing
      cardGroup.add(yarnClone)
    }
    
    // Ajusta a câmera para ver o "card"
    const cardHeight = rows * spacing
    const viewSize = Math.max(yarnLength, cardHeight) * 1.2
    camera.position.set(0, 0, viewSize) // Ajuste simples
    controls.target.set(0, 0, 0)
    
    return cardGroup
  }
  
  /**
   * Helper para o Modo 3: Cria um material texturizado que simula um fio.
   * Usa Canvas 2D para "desenhar" as fibras coloridas e torcidas.
   */
  const createYarnMaterial = (form: YarnForm): THREE.MeshStandardMaterial => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = 64
    canvas.height = 256
    
    const twistAngle = (form.twist / 20) * Math.PI; // Simula ângulo de torção
    const lineHeight = canvas.height / form.numberOfStrings;
  
    let currentY = 0;
    
    // Desenha "fibras" coloridas como linhas diagonais
    form.colors.forEach(c => {
      const numLines = Math.round(form.numberOfStrings * (c.percentage / 100));
      ctx.strokeStyle = c.color;
      ctx.lineWidth = lineHeight * 1.5; // Sobrepõe um pouco
      
      for (let i = 0; i < numLines; i++) {
          ctx.beginPath();
          const startX = -Math.tan(twistAngle) * canvas.height;
          const endX = canvas.width - Math.tan(twistAngle) * canvas.height;
          
          ctx.moveTo(startX, currentY);
          ctx.lineTo(endX, currentY + canvas.height);
          ctx.stroke();
          currentY += lineHeight;
      }
    });
  
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
  
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.1
    })
  }
  
  /**
   * MODO 3: FABRIC (Tecido)
   * Cria um tecido entrelaçado usando TubeGeometry e o material simulado.
   */
  const createFabric = (settings: FabricSettings): THREE.Group => {
    const fabricGroup = new THREE.Group()
    const { warpForm, weftForm, warpDensity, weftDensity, width, height, weavePattern } = settings
    
    // Densidade para contagem
    const warpCount = Math.round(width * warpDensity);
    const weftCount = Math.round(height * weftDensity);
    
    // Espaçamento (em "unidades de mundo", que estamos tratando como cm)
    const warpSpacing = width / warpCount;
    const weftSpacing = height / weftCount;
    
    // Raio do fio (usamos o bundleRadius, que é mais preciso que a densidade)
    const warpRadius = warpForm.bundleRadius / 10; // Supondo que bundleRadius é em mm
    const weftRadius = weftForm.bundleRadius / 10; // Supondo que bundleRadius é em mm
    
    const amplitude = Math.max(warpRadius, weftRadius) * 0.6; // O quanto o fio "sobe e desce"
    
    // Criar materiais "simulados"
    const warpMaterial = createYarnMaterial(warpForm)
    const weftMaterial = createYarnMaterial(weftForm)
    
    // Repetir a textura ao longo do fio
    warpMaterial.map!.wrapS = THREE.RepeatWrapping;
    warpMaterial.map!.repeat.x = height / (warpRadius * 2 * Math.PI); // Repete baseado no comprimento
    weftMaterial.map!.wrapS = THREE.RepeatWrapping;
    weftMaterial.map!.repeat.x = width / (weftRadius * 2 * Math.PI);
  
    // 1. Criar Fios de Urdume (Warp) - Verticais (ao longo de Y)
    for (let i = 0; i < warpCount; i++) {
      const pathPoints: THREE.Vector3[] = []
      const x = (i - (warpCount - 1) / 2) * warpSpacing
      
      for (let j = 0; j <= weftCount; j++) { // j <= weftCount para ter pontos suficientes
        const y = (j - weftCount / 2) * weftSpacing
        
        // Lógica do 'plain weave' (1/1)
        let z = 0;
        if (weavePattern === 'plain') {
          z = (i % 2 === 0) ? (j % 2 === 0 ? amplitude : -amplitude) : (j % 2 === 0 ? -amplitude : amplitude)
        }
        
        pathPoints.push(new THREE.Vector3(x, y, z))
      }
      
      const curve = new THREE.CatmullRomCurve3(pathPoints)
      const geometry = new THREE.TubeGeometry(curve, 64, warpRadius, 5, false)
      const mesh = new THREE.Mesh(geometry, warpMaterial)
      fabricGroup.add(mesh)
    }
  
    // 2. Criar Fios de Trama (Weft) - Horizontais (ao longo de X)
    for (let j = 0; j < weftCount; j++) {
      const pathPoints: THREE.Vector3[] = []
      const y = (j - (weftCount - 1) / 2) * weftSpacing
      
      for (let i = 0; i <= warpCount; i++) {
        const x = (i - warpCount / 2) * warpSpacing
        
        // Lógica do 'plain weave' (1/1) - OPOSTA do urdume
        let z = 0;
        if (weavePattern === 'plain') {
          z = (i % 2 === 0) ? (j % 2 === 0 ? -amplitude : amplitude) : (j % 2 === 0 ? amplitude : -amplitude)
        }
        
        pathPoints.push(new THREE.Vector3(x, y, z))
      }
      
      const curve = new THREE.CatmullRomCurve3(pathPoints)
      const geometry = new THREE.TubeGeometry(curve, 64, weftRadius, 5, false)
      const mesh = new THREE.Mesh(geometry, weftMaterial)
      fabricGroup.add(mesh)
    }
  
    // Ajusta a câmera para ver o tecido
    const viewSize = Math.max(width, height) * 1.5
    camera.position.set(0, 0, viewSize)
    controls.target.set(0, 0, 0)
  
    return fabricGroup
  }
  
  /**
   * Função principal que decide o que renderizar
   */
  const updateScene = () => {
    if (!mainGroup || !props) return
    
    clearMainGroup() // Limpa a cena anterior
    
    switch (props.previewMode) {
      case 'yarn':
        // Usamos um comprimento fixo para o preview de fio único
        const yarnSegment = createYarnSegment(props.yarnForm, 20) 
        mainGroup.add(yarnSegment)
        // Ajusta a câmera para o fio único
        camera.position.set(0, 0, props.yarnForm.bundleRadius * 30) // Zoom baseado no raio
        controls.target.set(0, 0, 0)
        break
        
      case 'yarnCard':
        const yarnCard = createYarnCard(props.yarnForm, props.yarnCardSettings)
        mainGroup.add(yarnCard)
        // (a câmera é ajustada dentro do createYarnCard)
        break
        
      case 'fabric':
        const fabric = createFabric(props.fabricSettings)
        mainGroup.add(fabric)
        // (a câmera é ajustada dentro do createFabric)
        break
    }
  }
  
  // --- Ciclo de Vida do Vue ---
  
  onMounted(() => {
    nextTick(() => {
      initScene()
      updateScene()
    })
  })
  
  onUnmounted(() => {
    cancelAnimationFrame(animationId)
    clearMainGroup()
    renderer?.dispose()
    if (container.value && renderer?.domElement) {
      container.value.removeChild(renderer.domElement)
    }
  })
  
  // Observa TODAS as props. Se qualquer coisa mudar, redesenha a cena.
  watch(() => props, () => {
    if (scene) {
      updateScene()
    }
  }, {
    deep: true
  })
  </script>