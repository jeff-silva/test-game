import { Script } from "@/classes/Motor.js";

export default class extends Script {
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
