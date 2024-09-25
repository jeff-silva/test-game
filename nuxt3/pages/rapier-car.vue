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
import { Scene, Instance } from "@/classes/Engine.js";

const app = useApp();

class GameScene extends Scene {
  preloadFiles() {
    return {
      // level: {
      //   url: app.baseUrl("assets/threejs/models/terrain/scene.gltf"),
      // },
    };
  }

  onCreate() {
    const { camera } = this.game;
    // this.level = this.instanceAdd(new LevelInstance(this));
    this.createBoxGeometryTest();
  }

  createBoxGeometryTest() {
    const { THREE, scene, camera } = this.game;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    scene.add(new THREE.Mesh(geometry, material));

    camera.position.set(2, 0, 0);
    // console.log(scene.children, camera);
  }
}

class LevelInstance extends Instance {
  onCreate() {
    this.root.game.scene.add(this.root.preload.files.level.model.scene);
    console.log(this.root.game.scene.children);
  }
}

const game = new GameScene({
  el: "#game",
  debug: true,
});

game.event.on("destroy", () => {
  location.reload();
});

game.event.on("preload.loading.progress", (data) => {
  console.log(data.progress);
});

onMounted(() => {
  game.init();
});

onUnmounted(() => {
  game.destroy();
});
</script>
