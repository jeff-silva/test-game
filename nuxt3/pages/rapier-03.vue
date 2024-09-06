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
import { Scene, Script } from "@/classes/RapierMotor.js";

class GameScene extends Scene {
  preload() {
    return {
      scene: {
        url: "assets/threejs/models/low-poly-level/scene.gltf",
        onLoad: (item) => {
          this.scene.add(item.model.scene);
          this.scriptAttach(item.model.scene, new SceneScript());
        },
      },
    };
  }

  onCreate() {
    this.scriptAttach(this.camera, new WasdScript());
  }
}

class SceneScript extends Script {
  onCreate() {
    this.scene.camera.position.set(-3, 0, 2);
  }
}

class WasdScript extends Script {
  onCreate() {
    this.pointerLockControlsInit();
    this.movementControlsInit();
  }

  pointerLockControlsInit() {
    this.pointerLock = this.scene.getPointerLockControls({
      target: this.scene.camera,
      pointerSpeed: 0.4,
    });
  }

  movementControlsInit() {
    this.move = this.scene.getInputsControl({
      front(ev) {
        if (ev.type == "keydown" && ev.key == "w") return 1;
        if (ev.type == "keydown" && ev.key == "s") return -1;
        return 0;
      },
      right(ev) {
        if (ev.type == "keydown" && ev.key == "a") return -1;
        if (ev.type == "keydown" && ev.key == "d") return 1;
        return 0;
      },
    });

    this.scene.on("update", () => {
      this.pointerLock.moveForward(this.move.front / 20);
      this.pointerLock.moveRight(this.move.right / 20);
    });
  }
}

const game = new GameScene({ el: "#game", debug: true });

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
