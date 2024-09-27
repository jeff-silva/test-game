<template>
  <nuxt-layout name="main">
    <div
      id="game"
      style="width: 100%; height: 600px; position: relative"
    ></div>
    <a href="">Refresh</a>
  </nuxt-layout>
</template>

<script setup>
import {
  ThreeRapierEngine,
  ThreeRapierScript,
} from "@/classes/ThreeRapierEngine.js";

const app = useApp();

class Game extends ThreeRapierEngine {
  preload() {
    return {
      scene: {
        url: app.baseUrl("assets/threejs/models/basic/scene.gltf"),
      },
    };
  }

  onCreate() {
    this.scene.add(this.assets.scene.content.scene);
    // this.orbitControls = this.getOrbitControls();
    this.camera.position.set(0, 10, 10);

    this.rapierPhysicsApply("Floor", "fixed", "trimesh");
    this.scriptAttach(CubeScript, ["Cube001", "Cube002", "Cube003"]);

    this.player = this.characterCameraControllerCreate({
      player: {
        mesh: { position: { y: 6 } },
      },
    });
  }

  onUpdate() {
    if (this.input.keyboard("q", "keyup")) {
      console.log("aaa");
    }
  }
}

class CubeScript extends ThreeRapierScript {
  onCreate() {
    this.mesh.rotation.y = 1;
    this.engine.rapierPhysicsApply(this.mesh, "dynamic", "box");
  }
}

const game = new Game({
  el: "#game",
  debug: true,
});

onMounted(async () => {
  await game.init();
});

onUnmounted(() => {
  location.reload();
});
</script>
