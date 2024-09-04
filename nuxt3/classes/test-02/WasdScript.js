import { Script } from "@/classes/Motor.js";

export default class extends Script {
  name = "WASD movimentation";
  onCreate(scope) {
    this.cameraMove = {
      front: 0,
      side: 0,
    };

    this.cameraPhysicsCreate(scope);
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

  cameraPhysicsCreate(scope) {
    this.cameraPhysics = scope.game.physics.add.capsule(
      {
        x: -3,
        y: 1,
        z: 0,
        radius: 0.3,
        length: 1,
        capSegments: 6,
        radialSegments: 6,
        mass: 20,
        // collisionFlags: 2,
      },
      { lambert: { color: 0xffff00 } }
    );

    this.cameraPhysics.body.needUpdate = true;

    this.cameraPhysics.body.setFriction(0.5);
    this.cameraPhysics.body.setAngularFactor(0, 0, 0);
    // this.cameraPhysics.body.setCcdMotionThreshold(1e-7);
    // this.cameraPhysics.body.setCcdSweptSphereRadius(0.25);

    scope.game.camera.position.set(0, 1, 0);

    this.cameraPhysics.attach(scope.game.camera);

    this.pointerLock = this.parent.pointerLockControls(this.cameraPhysics);
    this.pointerLock.pointerSpeed = 0.4;

    this.on("update", (scope) => {
      // // Move cameraPhysics
      // (() => {
      //   const { x, y, z } = this.cameraPhysics.position;
      //   this.cameraPhysics.position.set(x + 0.01, y, z);
      //   this.cameraPhysics.body.needUpdate = true;
      //   this.cameraPhysics.needUpdate = true;
      //   console.log(this.cameraPhysics.position);
      // })();
      // // Rotate cameraPhysics
      // (() => {
      //   const { x, y, z } = this.cameraPhysics.rotation;
      //   scope.game.camera.rotation.set(x, y, z);
      // })();
      // // // Pointer lock mov
      // (() => {
      //   const delta = scope.game.clock.getDelta();
      //   this.pointerLock.moveForward(this.cameraMove.front / 20, delta);
      //   this.pointerLock.moveRight(this.cameraMove.side / 20, delta);
      // })();
      // // Object move
      // (() => {
      //   if (this.cameraMove.front == 0) return;
      //   const THREE = scope.THREE;
      //   const object = this.cameraPhysics;
      //   const distance = this.cameraMove.front / 20;
      //   const _vector = object.position.clone();
      //   _vector.setFromMatrixColumn(object.matrix, 0);
      //   _vector.crossVectors(object.up, _vector);
      //   object.position.addScaledVector(_vector, distance);
      //   // object.position.copy(object.position);
      // })();
    });
  }
}
