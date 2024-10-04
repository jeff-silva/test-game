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
        url: app.baseUrl("scenes/terrain/scene.gltf"),
      },
      car: {
        url: app.baseUrl("models/car-01/scene.gltf"),
      },
    };
  }

  onCreate() {
    this.orbitControls = this.getOrbitControls();
    this.camera.position.set(0, 10, 10);

    this.scene.add(this.assets.scene.content.scene);

    this.rapierPhysicsApply({
      mesh: "Plane",
      body: "fixed",
      position: { x: 0, y: -20, z: 0 },
      shape: (engine, options) => {
        const { RAPIER } = engine;

        const geometry = options.mesh.geometry.clone();
        geometry.applyMatrix4(options.mesh.matrixWorld);
        geometry.computeVertexNormals();

        let vertices = new Float32Array(geometry.attributes.position.array);
        let indexes = new Float32Array(geometry.index.array);
        for (let i = 1; i < vertices.length; i += 3) vertices[i] += 38;

        return RAPIER.ColliderDesc.trimesh(vertices, indexes).setActiveEvents(
          RAPIER.ActiveEvents.COLLISION_EVENTS
        );
      },
    });

    const carMesh = this.assets.car.content.scene;
    this.scene.add(carMesh);

    this.rapierCarPhysicsApply({
      chassi: carMesh,
      wheelFL: "wheel_fl",
      wheelFR: "wheel_fr",
      wheelBL: "wheel_bl",
      wheelBR: "wheel_br",
      position: { x: 0, y: 5, z: 0 },
    });

    // this.rapierPhysicsApply({
    //   mesh: carMesh,
    //   body: "dynamic",
    //   shape: "box",
    //   geometry: {
    //     width: 2,
    //     height: 0.5,
    //     depth: 1,
    //   },
    // });
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
