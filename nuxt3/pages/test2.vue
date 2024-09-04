<template>
  <nuxt-layout name="main">
    <div
      id="app-game"
      style="height: 400px"
    ></div>
    <a href="">refresh</a>
  </nuxt-layout>
</template>

<script setup>
import { Game, Script } from "@/utils/Game.js";

class SceneScript extends Script {
  name = "Scene script";
  onCreate(scope) {
    this.collisionsIgnore = [
      "Line037_12",
      "Line037_16",
      "Line037_17",
      "Line037_21",
    ];
    this.collisions = [];

    this.object.traverse((child) => {
      if (this.collisionsIgnore.includes(child.name)) {
        this.collisionsIgnore.push(child.parent.name);
      }
    });

    this.object.traverse((child) => {
      if (this.collisionsIgnore.includes(child.name)) return;
      this.collisions.push(
        scope.game.physics.add.existing(child, {
          mass: 0,
          shape: "concaveMesh",
          collisionFlags: 2,
        })
      );
      child.body.checkCollisions = true;
    });
  }
}

class WasdMove extends Script {
  name = "WASD movimentation";
  onCreate(scope) {
    this.object.position.y += 0.5;
    this.cameraMove = {
      front: 0,
      side: 0,
    };

    this.cameraPhysics = scope.game.physics.add.capsule(
      {
        x: -2,
        y: 0,
        z: 0,
        width: 0.5,
        height: 0.5,
        depth: 0.5,
        mass: 0.001,
        collisionFlags: 2,
      },
      { lambert: { color: 0xffff00 } }
    );

    // this.cameraPhysics.parent = this.object;

    this.pointerLock = this.parent.pointerLockControls();
    this.pointerLock.pointerSpeed = 0.4;
  }
  onUpdate(scope) {
    const delta = scope.game.clock.getDelta();
    this.pointerLock.moveForward(this.cameraMove.front / 20, delta);
    this.pointerLock.moveRight(this.cameraMove.side / 20, delta);

    (() => {
      this.cameraPhysics.position.set(scope.game.camera.position.clone());
      this.cameraPhysics.body.needUpdate = true;
      this.cameraPhysics.body.on.collision((otherObject, event) => {
        console.log("collision", otherObject);
      });
    })();
  }
  onInput(scope) {
    scope.keyboard("click", [], () => {
      this.pointerLock.lock();
    });

    scope.keyboard("keydown", ["w"], () => {
      this.cameraMove.front = 1;
    });

    scope.keyboard("keydown", ["s"], () => {
      this.cameraMove.front = -1;
    });

    scope.keyboard("keydown", ["a"], () => {
      this.cameraMove.side = -1;
    });

    scope.keyboard("keydown", ["d"], () => {
      this.cameraMove.side = 1;
    });

    scope.keyboard("keyup", ["w"], () => {
      this.cameraMove.front = 0;
    });

    scope.keyboard("keyup", ["s"], () => {
      this.cameraMove.front = 0;
    });

    scope.keyboard("keyup", ["a"], () => {
      this.cameraMove.side = 0;
    });

    scope.keyboard("keyup", ["d"], () => {
      this.cameraMove.side = 0;
    });
  }
}

class AppGame extends Game {
  constructor(...args) {
    super(...args);

    this.assetAdd("scene", {
      url: "/assets/threejs/models/low-poly-level/scene.gltf",
      onLoad: (scope) => {
        const model = scope.loadedItem.model.scene;
        scope.game.scene.add(model);
        this.scriptAttach(model, new SceneScript());
      },
    });
  }
  onCreate(scope) {
    this.scriptAttach(scope.game.camera, new WasdMove());
  }
}

const appGame = new AppGame({
  el: "#app-game",
});
</script>
