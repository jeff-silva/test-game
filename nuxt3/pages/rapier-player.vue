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
import {
  Scene,
  Instance,
  Script,
  CharacterCameraScript,
} from "@/classes/Engine.js";

import { THREE } from "enable3d";
import { Vector } from "matter-js";
import { Vector3 } from "three";
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
    this.game.camera.position.set(-4, 1, 6);
    this.instanceAdd(new LevelInstance(this));
    this.instanceAdd(new PlayerInstance(this));
    this.instanceAdd(new TestInstance(this));
  }
}

class LevelInstance extends Instance {
  onCreate() {
    const object = this.root.preload.files.level.model.scene;
    this.root.game.scene.add(object);
    this.root.physics.applyPhysicsBodyTrimesh({
      object,
      physics: { type: "fixed", mass: 100 },
      filter: (mesh) => {
        const ignore = ["Line037_16"];
        return !ignore.includes(mesh.name);
      },
    });
  }
}

class PlayerInstance extends Instance {
  onCreate() {
    this.player = this.scriptAdd(
      new CharacterCameraScript(this, {
        camera: this.root.game.camera,
        playerPosition: { x: -2, y: 0.5, z: 1 },
      })
    );

    this.player.cameraModeSet("Third");
    this.root.canvas.el.addEventListener("click", () => {
      this.player.pointerLockControl.lock();
    });
  }
}

class PlayerInstanceOld extends Instance {
  onCreate() {
    return;
    this.parent.game.camera.position.set(-4, 0, 4);

    this.player = this.parent.physics.basicMeshAdd({
      material: { type: "basic", color: 0xff0000 },
      geometry: { type: "capsule", radius: 0.2, length: 0.5 },
      position: { x: -2, y: 0.5, z: 1 },
      physics: {
        type: "kinematicPositionBased",
        mass: 1,
        friction: 0,
        restitution: 0,
        linvel: { x: 1 },
      },
    });

    // this.initPointerLockControls();
    this.initCharacterController();
    // this.initMovement();
  }

  initPointerLockControls() {
    this.pointerLock = this.parent.game.getPointerLockControls({
      target: this.parent.game.camera,
    });

    this.parent.event.on("update", () => {
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
    });
  }

  initCharacterController() {
    const { RAPIER, THREE, clock } = this.parent.game;
    const { Vec3, Quat } = this.parent.game.helpers;
    const { world } = this.parent.physics;

    this.characterController = world.createCharacterController(0.01);
    this.characterController.setSlideEnabled(true);
    this.characterController.setMaxSlopeClimbAngle((45 * Math.PI) / 180);
    this.characterController.setMinSlopeSlideAngle((30 * Math.PI) / 180);
    this.characterController.enableAutostep(0.5, 0.2, true);
    this.characterController.enableSnapToGround(0.5);
    this.characterController.setApplyImpulsesToDynamicBodies(true);
    this.characterController.setCharacterMass(1);

    let playerMove = Vec3({ x: 0, y: -0.01, z: 0 });
    let playerRot = { w: 0, x: 0, y: 0, z: 0 };
    let playerSpeed = 0.05;

    this.player.mesh.attach(this.parent.game.camera);
    // this.player.mesh.position.set(-3, 1, 0);
    this.parent.game.camera.position.set(0, 1, 2);
    this.parent.game.camera.rotation.set(-0.3, 0, 0);

    this.parent.event.on("update", () => {
      const delta = this.parent.game.clock.getDelta();

      playerMove.x = 0;
      playerMove.z = 0;

      // const grounded = this.characterController.computedGrounded();
      // console.log({ grounded });

      // this.characterController.computeColliderMovement(
      //   this.player.collider,
      //   playerMove
      // );

      // const translation = this.player.body.nextTranslation();
      // const corrected = this.characterController.computedMovement();

      // this.player.body.setNextKinematicTranslation({
      //   x: translation.x + corrected.x,
      //   y: translation.y + corrected.y,
      //   z: translation.z + corrected.z,
      // });

      // const colls = this.characterController.numComputedCollisions();
      // console.log(colls);
      // for (let i = 0; i < colls; i++) {
      //   if (!this.characterController.computedCollision(i, this.player.shape))
      //     continue;
      //   console.log(i);
      // }

      // Teste movimento rotação
      (() => {
        if (this.parent.input.keyboard.a) {
          playerRot.y += 0.03;
        }
        if (this.parent.input.keyboard.d) {
          playerRot.y -= 0.03;
        }
        this.player.body.setNextKinematicRotation(
          new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, playerRot.y, 0)
          )
        );
      })();
    });

    // Teste movimento frente/tras
    (() => {
      let playerSpeed = 0;
      let pos = Vec3(this.player.body.translation());

      this.parent.event.on("update", () => {
        const delta = clock.getDelta();
        playerSpeed = 0;

        if (this.parent.input.keyboard.w) {
          playerSpeed = 0.06;
        }
        if (this.parent.input.keyboard.s) {
          playerSpeed = -0.06;
        }

        const directionVector = Vec3({ x: 0, y: 0, z: 1 })
          .applyQuaternion(Quat(this.player.body.rotation()))
          .multiplyScalar(playerSpeed * -1);
        let newpos = Vec3(this.player.body.translation()).add(directionVector);

        pos.z = newpos.z;
        pos.x = newpos.x;

        this.player.body.setNextKinematicTranslation(pos);
      });
    })();
  }

  initMovement() {
    this.parent.event.on("update", () => {
      this.parent.game.camera.lookAt(this.player.mesh.position);

      if (this.parent.input.keyboard.w) {
        this.player.body.setLinvel({ x: null, y: null, z: 2 }, true);
      }
      if (this.parent.input.keyboard.s) {
        this.player.body.setLinvel({ x: null, y: null, z: -2 }, true);
      }
      if (this.parent.input.keyboard.a) {
        const rot = this.player.body.rotation();
        rot.w += 1;
        this.player.body.setRotation(rot);
        console.log(this.player.body.rotation());
      }
      if (this.parent.input.keyboard.d) {
        this.player.body.setAngvel({ x: null, y: 10, z: null }, true);
      }
      if (this.parent.input.keyboard.Space) {
        this.player.body.setLinvel({ x: null, y: 5, z: null }, true);
      }
    });
  }
}

class TestInstance extends Instance {
  onCreate() {
    const { THREE, scene } = this.root.game;

    this.root.physics.basicMeshAdd({
      material: { type: "basic" },
      geometry: { type: "box" },
      position: { x: -2, y: 0.5, z: 0 },
      rotation: { x: 0.2, y: 0.2, z: 0.2 },
      physics: { type: "dynamic", mass: 0.01 },
    });

    this.root.physics.basicMeshAdd({
      material: { type: "basic" },
      geometry: {
        type: "capsule",
        radius: 0.5,
        length: 0.5,
      },
      position: { x: -4, y: 0.5, z: 0 },
      rotation: { x: 0.2, y: 0.2, z: 0.2 },
      physics: { type: "dynamic" },
    });

    this.root.physics.basicMeshAdd({
      material: { type: "basic" },
      geometry: { type: "sphere", radius: 0.5 },
      position: { x: -6, y: 0.5, z: 0 },
      rotation: { x: 0.2, y: 0.2, z: 0.2 },
      physics: { type: "dynamic" },
    });
  }
}

const game = new GameScene({ el: "#game", debug: false });

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
