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
import { THREE } from "enable3d";
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
    this.parent.physics.applyPhysicsBodyTrimesh({
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
    this.parent.game.camera.position.set(-4, 0, 4);
    // this.pointerLock = this.parent.game.getPointerLockControls({
    //   target: this.parent.game.camera,
    // });
    this.initCharacterController();
  }

  onUpdate() {
    const moveSpeed = 0.05;
    this.parent.game.camera.lookAt(this.player.mesh.position);

    if (this.parent.input.keyboard.w) {
      this.player.body.setLinvel({ x: 0, y: 0, z: 1 }, true);
    }
    if (this.parent.input.keyboard.s) {
      this.player.body.setLinvel({ x: 0, y: 0, z: -1 }, true);
    }
    if (this.parent.input.keyboard.a) {
      this.player.body.setAngvel({ x: 0, y: -1, z: 0 }, true);
    }
    if (this.parent.input.keyboard.d) {
      this.player.body.setAngvel({ x: 0, y: 1, z: 0 }, true);
    }

    // if (this.parent.input.keyboard.w) {
    //   this.pointerLock.moveForward(moveSpeed);
    // }
    // if (this.parent.input.keyboard.s) {
    //   this.pointerLock.moveForward(-moveSpeed);
    // }
    // if (this.parent.input.keyboard.a) {
    //   this.pointerLock.moveRight(-moveSpeed);
    // }
    // if (this.parent.input.keyboard.d) {
    //   this.pointerLock.moveRight(moveSpeed);
    // }
  }

  initCharacterController() {
    const { RAPIER, THREE } = this.parent.game;
    const { world } = this.parent.physics;

    let player = (this.player = this.parent.physics.basicMeshAdd({
      material: { type: "basic", color: 0xff0000 },
      geometry: { type: "capsule", radius: 0.2, length: 0.5 },
      position: { x: -2, y: 0.5, z: 1 },
      physics: { type: "dynamic", mass: 0.01, friction: 0, linvel: { x: 1 } },
    }));

    let characterController = world.createCharacterController(0.01); // Spacing
    characterController.setSlideEnabled(true); // Allow sliding down hill
    characterController.setMaxSlopeClimbAngle((45 * Math.PI) / 180); // Don’t allow climbing slopes larger than 45 degrees.
    characterController.setMinSlopeSlideAngle((30 * Math.PI) / 180); // Automatically slide down on slopes smaller than 30 degrees.
    characterController.enableAutostep(0.5, 0.2, true); // (maxHeight, minWidth, includeDynamicBodies) Stair behavior
    characterController.enableSnapToGround(0.5); // (distance) Set ground snap behavior
    characterController.setApplyImpulsesToDynamicBodies(true); // Add push behavior
    characterController.setCharacterMass(1);

    let position = new THREE.Vector3(0, 0, 0);

    // console.log(this.parent.physics.dynamicBodies);
    // console.log(player.collider);

    // player.body.setAngvel({ x: 3.0, y: 0, z: 0 });

    // this.parent.event.on("update", () => {
    //   // position.x += 0.01;
    //   // characterController.computeColliderMovement(
    //   //   player.collider,
    //   //   position,
    //   //   RAPIER.QueryFilterFlags.EXCLUDE_SENSORS
    //   // );
    //   // const movement = characterController.computedMovement();
    //   // const newPos = player.body.translation();
    //   // newPos.x -= 0.01;
    //   // newPos.z -= 0.005;
    //   // player.body.setNextKinematicTranslation(newPos);
    //   // player.body.setLinvel(1, 0, 0);
    //   // console.log(player.body.translation());
    // });
  }
}

class TestInstance extends Instance {
  onCreate() {
    const { THREE, scene } = this.parent.game;

    this.parent.physics.basicMeshAdd({
      material: { type: "basic" },
      geometry: { type: "box" },
      position: { x: -2, y: 0.5, z: 0 },
      rotation: { x: 0.2, y: 0.2, z: 0.2 },
      physics: { type: "dynamic", mass: 0.01 },
    });

    this.parent.physics.basicMeshAdd({
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

    this.parent.physics.basicMeshAdd({
      material: { type: "basic" },
      geometry: { type: "sphere", radius: 0.5 },
      position: { x: -6, y: 0.5, z: 0 },
      rotation: { x: 0.2, y: 0.2, z: 0.2 },
      physics: { type: "dynamic" },
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
