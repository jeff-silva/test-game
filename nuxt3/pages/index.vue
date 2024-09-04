<template>
  <div>
    <a href="">refresh</a>
    <!-- <pre>motor.models: {{ motor.models }}</pre> -->
    <pre>motor.loadingManager: {{ motor.loadingManager }}</pre>
    <div
      ref="canvasRef"
      id="app-index"
      style="width: 100%; height: 100vh"
      @click="
        () => {
          motor.pointerLock.lock();
        }
      "
    ></div>
  </div>
</template>

<script setup>
const motor = useThreeMotor({
  el: "#app-index",
  models: {
    scene: {
      url: "/assets/threejs/models/low-poly-level/scene.gltf",
      onLoad(scope) {
        scope.scene.add(scope.gltf.scene);
      },
    },
    // scene1: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=1" },
    // scene2: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=2" },
    // scene3: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=3" },
    // scene4: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=4" },
    // scene5: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=5" },
    // scene6: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=6" },
    // scene7: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=7" },
    // scene8: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=8" },
    // scene9: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=9" },
    // scene10: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=10" },
    // scene11: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=11" },
    // scene12: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=12" },
    // scene13: { url: "/assets/threejs/models/low-poly-level/scene.gltf?id=13" },
  },
  // cameraMove: {
  //   front: null,
  //   left: null,
  // },
  // onInput(ev) {
  //   if (ev.type == "keydown" && ev.key == "w") {
  //     motor.reactive.cameraMove.front = 1;
  //   }
  //   if (ev.type == "keyup" && ev.key == "w") {
  //     motor.reactive.cameraMove.front = null;
  //   }
  //   if (ev.type == "keydown" && ev.key == "s") {
  //     motor.reactive.cameraMove.front = -1;
  //   }
  //   if (ev.type == "keyup" && ev.key == "s") {
  //     motor.reactive.cameraMove.front = null;
  //   }
  //   if (ev.type == "keydown" && ev.key == "a") {
  //     motor.reactive.cameraMove.left = -1;
  //   }
  //   if (ev.type == "keyup" && ev.key == "a") {
  //     motor.reactive.cameraMove.left = null;
  //   }
  //   if (ev.type == "keydown" && ev.key == "d") {
  //     motor.reactive.cameraMove.left = 1;
  //   }
  //   if (ev.type == "keyup" && ev.key == "d") {
  //     motor.reactive.cameraMove.left = null;
  //   }
  // },
  // onInit(scope) {
  //   console.log("onInit", scope);
  // },
});
</script>
