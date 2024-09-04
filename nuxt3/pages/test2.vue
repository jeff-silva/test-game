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

class AppGame extends Game {
  constructor() {
    super();
    this.targetSet("#app-game");
    this.assetAdd("scene", {
      url: "/assets/threejs/models/low-poly-level/scene.gltf",
      onLoad: (scope) => {
        scope.game.scene.add(scope.loadedItem.model.scene);

        this.scriptAttach(
          new (class extends Script {
            name = "WASD movimentation";
            onCreate() {
              this.object.position.y -= 0.5;
              this.cameraMove = {
                front: 0,
                side: 0,
              };
              this.pointerLock = this.parent.pointerLockControls();
              this.pointerLock.pointerSpeed = 0.4;
            }
            onUpdate(scope) {
              const delta = scope.game.clock.getDelta();
              this.pointerLock.moveForward(this.cameraMove.front / 20, delta);
              this.pointerLock.moveRight(this.cameraMove.side / 20, delta);
            }
            onInput(scope) {
              if (scope.event.type == "click") {
                this.pointerLock.lock();
              }

              if (scope.event.type == "keydown" && scope.event.key == "w") {
                this.cameraMove.front = 1;
              }
              if (scope.event.type == "keyup" && scope.event.key == "w") {
                this.cameraMove.front = 0;
              }
              if (scope.event.type == "keydown" && scope.event.key == "s") {
                this.cameraMove.front = -1;
              }
              if (scope.event.type == "keyup" && scope.event.key == "s") {
                this.cameraMove.front = 0;
              }
              if (scope.event.type == "keydown" && scope.event.key == "a") {
                this.cameraMove.side = -1;
              }
              if (scope.event.type == "keyup" && scope.event.key == "a") {
                this.cameraMove.side = 0;
              }
              if (scope.event.type == "keydown" && scope.event.key == "d") {
                this.cameraMove.side = 1;
              }
              if (scope.event.type == "keyup" && scope.event.key == "d") {
                this.cameraMove.side = 0;
              }
            }
          })(scope.loadedItem.model.scene)
        );
      },
    });
  }
}

const appGame = new AppGame();
</script>
