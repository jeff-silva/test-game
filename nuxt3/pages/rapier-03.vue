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
import { Scene, Script } from "@/classes/RapierMotor.js";

// Main scene
class GameScene extends Scene {
  preload() {
    return {
      scene: {
        url: "assets/threejs/models/low-poly-level/scene.gltf",
        onLoad: (item) => {
          this.scene.add(item.model.scene);
          this.coplexPhysicsAttach(item.model.scene, {
            body: { type: "fixed", mass: 100 },
          });
        },
      },
    };
  }

  onCreate() {
    this.scriptAttach(this.camera, new WasdScript());
    this.camera.position.set(-3, 0, 2);
  }
}

// Script that controls camera movement
class WasdScript extends Script {
  onCreate() {
    this.pointerLockControlsInit();
    this.movementControlsInit();
    this.testInit();
  }

  pointerLockControlsInit() {
    this.pointerLock = this.scene.getPointerLockControls({
      target: this.scene.camera,
      pointerSpeed: 0.4,
    });
  }

  movementControlsInit() {
    this.scene.on("update", () => {
      const speed = 0.04;
      if (this.scene.input.keyboard.w) {
        this.pointerLock.moveForward(speed);
      }
      if (this.scene.input.keyboard.s) {
        this.pointerLock.moveForward(-speed);
      }
      if (this.scene.input.keyboard.a) {
        this.pointerLock.moveRight(-speed);
      }
      if (this.scene.input.keyboard.d) {
        this.pointerLock.moveRight(speed);
      }
    });
  }

  testInit() {
    this.scene.basicMeshPhysicsAdd({
      position: { x: -4, y: 0, z: 0 },
      material: { type: "basic", color: 0xff0000 },
      geometry: { type: "capsule", radius: 0.2, length: 1 },
    });

    this.scene.basicMeshPhysicsAdd({
      position: { x: -2, y: 0, z: 0 },
      material: { type: "basic", color: 0xff0000 },
      geometry: {
        type: "cube",
        width: 0.6,
        height: 0.6,
        depth: 0.6,
      },
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
