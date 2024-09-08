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
      level: {
        url: app.baseUrl("assets/threejs/models/low-poly-level/scene.gltf"),
      },
    };
  }

  onCreate() {
    this.instanceAdd(new Level());
    this.instanceAdd(new Player());
  }
}

class Level extends Instance {
  onCreate() {
    const object = this.parent.preload.files.level.model.scene;
    this.parent.game.scene.add(object);
  }
}

class Player extends Instance {
  onCreate() {
    // this.pointerLock = this.parent.game.getPointerLockControls({
    //   target: object,
    // });
  }

  // onUpdate() {
  //   console.log(this.scene.input.keyboard);
  // }
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
