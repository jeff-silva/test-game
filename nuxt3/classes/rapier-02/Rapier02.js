import { Scene } from "../RapierMotor.js";

export default class Rapier02 extends Scene {
  cameraDefault() {
    const { THREE } = this;
    const { width, height } = this.canvas;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.set(0, 2, 5);
    return camera;
  }

  onCreate() {
    this.initElements();
  }

  initElements() {
    const { THREE } = this;

    // Light 1
    const light1 = new THREE.SpotLight(undefined, Math.PI * 10);
    light1.position.set(2.5, 5, 5);
    light1.angle = Math.PI / 3;
    light1.penumbra = 0.5;
    light1.castShadow = true;
    light1.shadow.blurSamples = 10;
    light1.shadow.radius = 5;
    this.scene.add(light1);

    // Light2
    const light2 = light1.clone();
    light2.position.set(-2.5, 5, 5);
    this.scene.add(light2);

    const randomRange = (size = 10) => {
      let random = Math.random();
      return random * (size * 2) - size;
    };

    this.addPhysics((data) => {
      data.shape = this.RAPIER.ColliderDesc.cuboid(100, 0.1, 100);
      return data;
    });

    // Add cuboids
    for (let i = 0; i < 50; i++) {
      this.addPhysics((data) => {
        const { RAPIER } = this;

        data.mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshNormalMaterial()
        );
        data.mesh.castShadow = true;

        data.body = this.world.createRigidBody(
          RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(randomRange(20), 5, randomRange(20))
            .setCanSleep(false)
        );

        data.shape = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
          .setMass(1)
          .setRestitution(1.1);

        return data;
      });
    }

    // Orbit controls
    this.orbitControls = this.getOrbitControls();
    this.orbitControls.enableDamping = true;
  }
}
