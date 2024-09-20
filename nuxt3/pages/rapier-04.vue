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
    this.instanceAdd(new LevelInstance());
    this.instanceAdd(new PlayerInstance());
    this.instanceAdd(new TestInstance());
  }
}

class LevelInstance extends Instance {
  onCreate() {
    const object = this.parent.preload.files.level.model.scene;
    this.parent.game.scene.add(object);
    this.parent.physics.applyPhysicsBody({ object });
  }
}

class PlayerInstance extends Instance {
  onCreate() {
    this.pointerLock = this.parent.game.getPointerLockControls({
      target: this.parent.game.camera,
    });
  }

  onUpdate() {
    const moveSpeed = 0.05;
    if (this.parent.input.keyboard.w) {
      this.pointerLock.moveForward(moveSpeed);
    }
    if (this.parent.input.keyboard.s) {
      this.pointerLock.moveForward(-moveSpeed);
    }
    if (this.parent.input.keyboard.a) {
      this.pointerLock.moveRight(-moveSpeed);
    }
    if (this.parent.input.keyboard.d) {
      this.pointerLock.moveRight(moveSpeed);
    }
  }
}

class TestInstance extends Instance {
  onCreate() {
    const { THREE, scene } = this.parent.game;

    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // const cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);

    this.parent.physics.basicMeshAdd({
      material: { type: "basic" },
      geometry: { type: "box" },
      position: { x: -2, y: 0, z: 0 },
      physics: { type: "fixed" },
    });

    this.parent.physics.basicMeshAdd({
      material: { type: "basic" },
      geometry: {
        type: "capsule",
        radius: 0.5,
        length: 0.5,
      },
      position: { x: -4, y: 0, z: 0 },
      physics: { type: "fixed" },
    });

    this.parent.physics.basicMeshAdd({
      material: { type: "basic" },
      geometry: { type: "sphere", radius: 0.5 },
      position: { x: -6, y: 0, z: 0 },
      physics: { type: "fixed" },
    });
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
