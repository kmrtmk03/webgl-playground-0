import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js"
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderChunk } from 'three/src/renderers/shaders/ShaderChunk.js'
import vertexShader from "./glsl/shader.vert";
import fragmentShader from "./glsl/shader.frag";

export default class myScene {
  constructor(props) {
    // 設定
    this.canvas = props.$canvas

    this.windowSize = [
      { w: 0 },
      { h: 0 }
    ]
    this.renderer = null
    this.composer = null
    this.scene = null
    this.camera = null

    this.stats = null

    // Scene初期化
    this.initScene()
  }

  // 変数初期化
  initVar() {
    this.frameCounter = 0
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

    // レンダラー設定
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    })
    this.renderer.setPixelRatio(window.devicePixelRatio / 3)
    this.renderer.setSize(this.windowSize.w, this.windowSize.h)
    this.renderer.setClearColor(0x999999, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.85
    this.renderer.outputEncoding = THREE.sRGBEncoding

    // シーン作成
    this.scene = new THREE.Scene()

    // カメラ設定
    this.camera = new THREE.PerspectiveCamera(60, this.windowSize.w / this.windowSize.h)
    this.camera.position.set(0, 1.5, 8)
    this.camera.near = 0.1
    this.camera.far = 30

    // ポストエフェクト設定
    this.settingPostEffects()

    const geo = new THREE.BoxGeometry(1, 1, 1)
    const mat = this.shaderMaterial()
    const box = new THREE.Mesh(geo, mat)
    this.scene.add(box)

    // レンダリング
    this.render()
  }

  // 完了時に呼ぶ
  complete() {
  }

  // PostProcessの設定
  settingPostEffects() {
    this.composer = new EffectComposer(this.renderer)
    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)
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

    this.stats.end()

    this.composer.render()
  }

  shaderMaterial() {
    const mat = new THREE.ShaderMaterial({
      // vertexShader: ShaderChunk.meshbasic_vert,
      // fragmentShader: ShaderChunk.meshbasic_frag,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    })

    console.log(mat)

    return mat
  }

  // =====================================================================
  // event
  // =====================================================================

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
}