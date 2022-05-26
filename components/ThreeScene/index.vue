<template lang="pug">
  .threeScene
    .devPanel(v-if="isDev")
      .block
        p 画角
        ul
          li(@click="cameraChange(0)") 標準
          li(@click="cameraChange(1)") 望遠
          li(@click="cameraChange(2)") 広角
    canvas.canvas(ref="canvas" @click="mouseClick")
</template>

<script>
import myScene from './myScene'

export default {
  name: 'ThreeScene',
  data() {
    return {
      isDev: true,
      scene: null,
      modelName: 'base',
      baseUrl: '',
    }
  },
  mounted() {
    this.scene = new myScene({
      $canvas: this.$refs.canvas,
      $modelName: this.modelName,
      $baseUrl: this.baseUrl,
    })
  },
  methods: {
    cameraChange(num) {
      this.scene.devCameraPositionZ(num)
    },
    mouseClick() {
      this.scene.mouseClick()
    }
  }
}
</script>


<style lang="scss" scoped>
  .devPanel {
    background-color: rgba(0, 0, 0, 0.6);
    padding: 10px;
    border-radius: 4px;
    position: fixed;
    top: 10px;
    right: 10px;
    width: 300px;

    .block {
      p {
        color: #fff;
        font-size: 1.2em;
        margin-bottom: 4px;
        font-weight: bold;
      }

      ul {

        li {
          background-color: #aaa;
          padding: 4px;
          border-radius: 4px;
          margin-bottom: 4px;

          &:last-child {
            margin: 0;
          }

          &:hover {
            background-color: #333;
            cursor: pointer;
            color: #fff;
          }
        }
      }
    }
  }
</style>
