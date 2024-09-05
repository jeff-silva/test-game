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
  preload = {
    scene: {
      url: "assets/threejs/models/low-poly-level/scene.gltf",
      onLoad(self, item) {
        self.scene.add(item.model.scene);
      },
    },
  };
}

new GameScene({ el: "#game", debug: true });
</script>
