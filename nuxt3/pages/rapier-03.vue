<template>
  <nuxt-layout name="main">
    <div
      id="game"
      style="width: 100%; height: 400px; position: relative"
    ></div>
    <a href="">Refresh</a>
  </nuxt-layout>
</template>

<script setup>
import { Scene } from "@/classes/RapierMotor.js";

class GameScene extends Scene {
  preload() {
    return {
      scene: {
        url: "assets/threejs/models/low-poly-level/scene.gltf",
        onLoad: (item) => {
          this.scene.add(item.model.scene);
        },
      },
    };
  }

  onCreate() {
    // this.on("input", (ev) => {
    //   console.log(ev);
    // });
  }
}

const game = new GameScene({ el: "#game", debug: true });

// game.on("loadProgress", (data) => {
//   console.log(data.progress);
// });

game.on("destroy", () => {
  location.reload();
});

onMounted(() => {
  game.init();
});

onUnmounted(() => {
  game.destroy();
});
</script>
