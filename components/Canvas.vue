<template lang="pug">
  .canvasComponent
    h2.title Hello World
</template>

<script>
import * as THREE from "three"

export default {
  data() {
    return {}
  },

  mounted() {
    this.start()
  },

  methods: {
    start() {
    }
  }
}
</script>

<style lang="scss" scoped>
.title {
  color: $color_1st;
}
</style>
