import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import gsap from 'gsap'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export default class myScene {
  constructor(props) {
    // 設定
    this.canvas = props.$canvas
    this.modelName = props.$modelName
    this.baseUrl = props.$baseUrl

    this.windowSize = [
      { w: 0 },
      { h: 0 }
    ]
    this.renderer = null
    this.composer = null
    this.scene = null
    this.camera = null

    // Raycaster周り
    this.mouse = null
    this.raycaster = null
    this.raycasterMesh = null
    this.raycasterPoint = null
    this.intersectObjects = null
    this.isRayOnClickObject = false

    // カメラの動き
    this.isCanMove = null
    this.cameraZoomTarget = null
    this.cameraZoomTargetPos = [
      { x: -7.3, y: 1.5, z: -6 },
      { x: -3.0, y: 1.5, z: 1 },
      { x: 0.32, y: 1.5, z: -3 },
      { x: 3.7, y: 1.5, z: 1 },
      { x: 8.8, y: 1.5, z: 2 }
    ]

    // アニメーション
    this.mixier = null
    this.clock = null
    this.objUVScroll = null

    this.stats = null

    // Scene初期化
    this.initScene()
  }

  // 変数初期化
  initVar() {
    this.frameCounter = 0
    this.mouse = new THREE.Vector2()
    this.raycaster = new THREE.Raycaster()
    this.raycasterPoint = new THREE.Vector3()
    this.isCanMove = true
    this.clock = new THREE.Clock()
  }

  // Scene初期化
  // インスタンス生成時に呼ぶ
  async initScene() {
    this.initVar()

    await this.setWindowSize()

    this.stats = new Stats()
    this.stats.showPanel(0)
    document.body.appendChild(this.stats.dom)

    // gsap設定
    gsap.ticker.fps(60)

    // レンダラー設定
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    })
    this.renderer.setPixelRatio(window.devicePixelRatio / 3)
    this.renderer.setSize(this.windowSize.w, this.windowSize.h)
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.85
    this.renderer.outputEncoding = THREE.sRGBEncoding

    // シーン作成
    this.scene = new THREE.Scene()

    // カメラ設定
    this.camera = new THREE.PerspectiveCamera(60, this.windowSize.w / this.windowSize.h, 1, 50)
    this.camera.position.set(0, 1.7, 8)
    // this.camera.lookAt(new THREE.Vector3(0, 0, -8))
    this.camera.near = 0.1
    this.camera.far = 30

    // ライティング設定
    // this.settingLight()

    // Raycaster用のマウスカーソルオブジェクト生成
    const geoRaycaster = new THREE.SphereGeometry(0.1, 6, 6)
    const matRaycaster = new THREE.MeshBasicMaterial()
    this.raycasterMesh = new THREE.Mesh(geoRaycaster, matRaycaster)
    this.raycasterMesh.name = 'raycasterMesh'
    this.scene.add(this.raycasterMesh)

    // ポストエフェクト設定
    this.settingPostEffects()

    // 部屋モデル読み込み
    await this.importModel()

    // レンダリング
    this.render()

    // イベント付与
    this.attachEvent()
  }

  // 完了時に呼ぶ
  complete() {
    this.removeEvent()
  }

  // 部屋モデル読み込み
  importModel() {
    return new Promise((resolve, reject) => {
      let loader = new GLTFLoader()
      loader.load(this.baseUrl + '/glb/' + this.modelName + '.glb', (glb) => {
        const obj = glb.scene
        const animations = glb.animations

        obj.traverse((object) => {
          if (object.isMesh) {
            const color = object.material.color
          }
          this.scene.add(obj)

          // 大元の親オブジェクト
          if(object.name === 'All_Room') {
            object.scale = new THREE.Vector3(1, 1, 1)
          }

          // 電光掲示板
          if (object.name === 'moji_UVscroll001') {
            this.objUVScroll = object
          }
        })

        // アニメーション設定
        if (animations && animations.length) {
          this.mixier = new THREE.AnimationMixer(obj)
          for (let i = 0; i < animations.length; i++) {
            let animation = animations[i]
            let action = this.mixier.clipAction(animation)
            action.setLoop(THREE.LoopRepeat)
            action.clampWhenFinished = true
            action.play()
          }
        }

        resolve()
      })
    })
  }

  // ライティングの設定
  settingLight() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    // this.scene.add(directionalLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    // this.scene.add(ambientLight)

    // HDRI
    const hdri = new RGBELoader().load(this.baseUrl + "/hdri/studio_small_01_1k.hdr", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      this.scene.environment = texture // 光源設定
      // this.scene.background = texture // 背景設定：開発用
    })
  }

  // PostProcessの設定
  settingPostEffects() {
    this.composer = new EffectComposer(this.renderer)
    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    // const fxaaShader = FXAAShader
    // fxaaShader.uniforms['resolution'].value.set(1 / this.windowSize.w, 1 / this.windowSize.h)
    // console.log(fxaaShader)
    // this.composer.addPass(fxaaShader)

    // // Bloom
    // const unrealBloomPass = new UnrealBloomPass(new THREE.Vector2( window.innerWidth / 20, window.innerHeight / 20 ), 0.3, 1, 0.8)
    // this.composer.addPass(unrealBloomPass)
  }

  // Camera横移動
  cameraMoveYoko() {

    const currentX = this.camera.position.x
    const distance = Math.abs(this.raycasterPoint.x - currentX)
    const duration = distance > 9 ? 3 : 2

    gsap.to(this.camera.position, {
      x: this.raycasterPoint.x,
      duration: duration,
      complete: () => {
        this.isCanMove = true
      }
    })
  }

  // Raycasterの判定
  checkRaycaster() {
    // raycastar判定
    this.raycaster.setFromCamera(this.mouse, this.camera)
    this.intersectObjects = this.raycaster.intersectObjects(this.scene.children)


    if (this.intersectObjects.length > 0) {
      // raycasterTargetのみに当たってる時は処理抜ける
      if (this.intersectObjects[0].object.name === 'raycasterMesh' && this.intersectObjects.length === 1) {
        return
      }

      // raycasterTarget
      const target = this.intersectObjects[0].object.name === 'raycasterMesh' ? 1 : 0
      this.raycasterPoint = this.intersectObjects[target].point
      this.raycasterMesh.position.set(this.raycasterPoint.x, this.raycasterPoint.y, this.raycasterPoint.z)
    }
  }

  // テクスチャアニメーション
  uvScroll() {
    // 電光掲示板
    if(this.objUvScroll) {
      this.objUvScroll.material.map.offset = new THREE.Vector2(this.frameCounter / 1000, 0)
    }
  }

  // レンダリング
  render() {
    if(!this.stats) {
      return
    }

    // tick
    requestAnimationFrame(() => {
      this.render()
    })

    this.stats.begin()

    // FPS落とす
    this.frameCounter++
    if (this.frameCounter % 2 === 0) {
      // return
    }

    // raycaster
    this.checkRaycaster()

    // animation
    if (this.mixier) {
      this.mixier.update(this.clock.getDelta())
    }

    // this.uvScroll()

    this.stats.end()

    // render(postprocess)
    this.composer.render()
  }

  // =====================================================================
  // event
  // =====================================================================

  // イベント登録
  attachEvent() {
    window.addEventListener('resize', this.resize.bind(this))
    window.addEventListener('orientationchange', this.resize.bind(this))
    window.addEventListener('mousemove', this.mouseMove.bind(this))

    this.scrollNotArrow()
  }

  // イベント破棄
  removeEvent() {
    window.removeEventListener('resize', this.resize.bind(this))
    window.removeEventListener('orientationchange', this.resize.bind(this))
    window.removeEventListener('mousemove', this.mouseMove.bind(this))
  }


  // マウス動いた時
  mouseMove(event) {
    const element = event.currentTarget
    const x = event.clientX
    const y = event.clientY
    this.mouse.x = ( x / this.windowSize.w ) * 2 - 1
    this.mouse.y = -( y / this.windowSize.h ) * 2 + 1
  }

  // マウスクリック
  mouseClick() {
    if (this.isCanMove) {
      this.isCanMove = false

      if (!this.isRayOnClickObject) {
        this.cameraMoveYoko()
      }
    }
  }

  // =====================================================================
  // 設定周り
  // =====================================================================

  // リサイズ時の処理
  async resize() {
    await this.setWindowSize()

    this.renderer.setPixelRatio(window.devicePixelRatio / 3)
    this.renderer.setSize(this.windowSize.w, this.windowSize.h)

    this.camera.aspect = this.windowSize.w / this.windowSize.h
    this.camera.updateProjectionMatrix()
  }

  // ウィンドウサイズを取得
  setWindowSize() {
    return new Promise((resolve, reject) => {
      this.windowSize.w = window.innerWidth
      this.windowSize.h = window.innerHeight
      resolve()
    })
  }


  //スクロール止める処理
  noScroll(e) {
    e.preventDefault()
  }

  //スクロール禁止
  scrollNotArrow() {
    document.addEventListener('touchmove', this.noScroll, { passive: false });
    document.addEventListener('mousewheel', this.noScroll, { passive: false });
  }

  //スクロール許可
  scrollArrow() {
    document.removeEventListener('touchmove', this.noScroll, { passive: false });
    document.removeEventListener('mousewheel', this.noScroll, { passive: false });
  }

  // =====================================================================
  // 開発用
  // =====================================================================

  // 画角変更
  async devCameraPositionZ(cameraType = 0) {
    const duration = 1
    const config = [
      {
        pos: 4,
        fov: 60
      },
      {
        pos: 5,
        fov: 40
      },
      {
        pos: 3,
        fov: 80
      },
    ]

    this.devChangeFov(config[cameraType].fov, duration)
    this.devCameraPosZ(config[cameraType].pos, duration)
  }

  devChangeFov(_fov, _duration = 0.01) {
    gsap.to(this.camera, {
      fov: _fov,
      duration: _duration,
      onUpdate: () => {
        this.camera.updateProjectionMatrix()
      },
    })
  }

  devCameraPosZ(_z, _duration = 0.01) {
    gsap.to(this.camera.position, {
      z: _z,
      duration: _duration,
    })
  }
}
