<template>
  <nuxt-layout name="main">
    <div
      ref="canvasRef"
      id="app-index"
      style="width: 100%; height: 400px"
      @click="
        () => {
          motor.pointerLock.lock();
        }
      "
    ></div>
    <a href="">refresh</a>
    <!-- <pre>motor.models: {{ motor.models }}</pre> -->
    <pre>motor.loadingManager: {{ motor.loadingManager }}</pre>
    <pre>motor.cameraMove: {{ motor.cameraMove }}</pre>
    <pre>motor.size: {{ motor.size }}</pre>
  </nuxt-layout>
</template>

<script setup>
const motor = useThreeMotor({
  el: "#app-index",
  models: {
    scene: {
      url: "/assets/threejs/models/low-poly-level/scene.gltf",
      onLoad(scope) {
        scope.scene.add(scope.gltf.scene);
        scope.physics.add.existing(scope.gltf.scene, {
          mass: 0,
          shape: "convex",
        });

        const geometry = new scope.THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        const material = new scope.THREE.MeshBasicMaterial({ color: 0xffff00 });
        scope.cameraMove.collision = new scope.THREE.Mesh(geometry, material);
        scope.cameraMove.collision.position.x -= 2;
        scope.scene.add(scope.cameraMove.collision);

        scope.physics.add.existing(scope.cameraMove.collision, {
          mass: 0,
          shape: "cylinder",
        });

        console.clear();
        console.log(scope.camera);
        console.log(scope.cameraMove.collision);
      },
    },
  },
  cameraMove: {
    collision: null,
    front: 0,
    left: 0,
  },
  onInput(scope) {
    this.moveWASD(scope);
  },
  moveWASD(scope) {
    const { event } = scope;

    if (event.type == "keydown" && event.key == "w") {
      motor.cameraMove.front = 1;
    }
    if (event.type == "keyup" && event.key == "w") {
      motor.cameraMove.front = 0;
    }
    if (event.type == "keydown" && event.key == "s") {
      motor.cameraMove.front = -1;
    }
    if (event.type == "keyup" && event.key == "s") {
      motor.cameraMove.front = 0;
    }
    if (event.type == "keydown" && event.key == "a") {
      motor.cameraMove.left = -1;
    }
    if (event.type == "keyup" && event.key == "a") {
      motor.cameraMove.left = 0;
    }
    if (event.type == "keydown" && event.key == "d") {
      motor.cameraMove.left = 1;
    }
    if (event.type == "keyup" && event.key == "d") {
      motor.cameraMove.left = 0;
    }
  },
  onInit(scope) {
    motor.cameraMove.direction = new scope.THREE.Vector3();
  },
  onUpdate(scope) {
    const delta = scope.clock.getDelta();
    scope.pointerLock.instance.moveForward(motor.cameraMove.front / 20, delta);
    scope.pointerLock.instance.moveRight(motor.cameraMove.left / 20, delta);
  },
});
</script>
