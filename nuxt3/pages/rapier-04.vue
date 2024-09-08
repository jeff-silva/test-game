<template>
  <nuxt-layout name="main">
    <div
      id="game"
      style="width: 100%; height: 400px; position: relative"
    ></div>
    <a href="">Refresh</a>
    <div style="height: 100vh"></div>
  </nuxt-layout>
</template>

<script setup>
import { Scene, Instance, Script } from "@/classes/Engine.js";
const app = useApp();

class GameScene extends Scene {
  preloadFiles() {
    return {
      scene: {
        url: app.baseUrl("assets/threejs/models/low-poly-level/scene.gltf"),
      },
    };
  }

  onCreate() {
    this.instanceAdd(new Player());
  }
}

class Player extends Instance {
  onUpdate() {
    // console.log(this.scene.input.keyboard);
  }
}

const game = new GameScene({ el: "#game", debug: true });

game.event.on("destroy", () => {
  location.reload();
});

onMounted(() => {
  game.init();
});

onUnmounted(() => {
  game.destroy();
});
</script>
