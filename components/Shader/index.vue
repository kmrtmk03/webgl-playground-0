<template lang="pug">
  .threeScene
    canvas.canvas(ref="canvas")
</template>

<script>
import myScene from './scene'

export default {
  name: 'ThreeScene',
  data() {
    return {
      scene: null,
    }
  },
  mounted() {
    this.scene = new myScene({
      $canvas: this.$refs.canvas,
    })
  },
  methods: {
  }
}
</script>


<style lang="scss" scoped>
</style>
