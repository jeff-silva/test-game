<template>
  <nuxt-layout name="main">
    <a href="">Rapier</a>
    <div
      id="app-rapier"
      style="width: 100%; height: 400px; position: relative"
    ></div>
  </nuxt-layout>
</template>

<script setup>
// import RAPIER from "https://cdn.skypack.dev/@dimforge/rapier3d-compat";
import RAPIER from "@dimforge/rapier3d-compat";

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

class RapierDebugRenderer {
  mesh;
  world;
  enabled = true;

  constructor(scene, world) {
    this.world = world;
    this.mesh = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true })
    );
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  update() {
    if (this.enabled) {
      const { vertices, colors } = this.world.debugRender();
      this.mesh.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(vertices, 3)
      );
      this.mesh.geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colors, 4)
      );
      this.mesh.visible = true;
    } else {
      this.mesh.visible = false;
    }
  }
}

onMounted(async () => {
  await RAPIER.init();

  let gravity = { x: 0.0, y: -9.81, z: 0.0 };
  let world = new RAPIER.World(gravity);

  let groundColliderDesc = RAPIER.ColliderDesc.cuboid(100, 0.1, 100);
  world.createCollider(groundColliderDesc);

  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
    0.0,
    1.0,
    0.0
  );
  let rigidBody = world.createRigidBody(rigidBodyDesc);

  let colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
  let collider = world.createCollider(colliderDesc, rigidBody);
  let dynamicBodies = [];

  // Threejs
  const target = document.querySelector("#app-rapier");
  const width = target.offsetWidth;
  const height = target.offsetHeight;
  const scene = new THREE.Scene();
  const clock = new THREE.Clock();

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
  camera.position.set(0, 2, 5);

  const rapierDebugRenderer = new RapierDebugRenderer(scene, world);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  target.appendChild(renderer.domElement);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  // Light 1
  const light1 = new THREE.SpotLight(undefined, Math.PI * 10);
  light1.position.set(2.5, 5, 5);
  light1.angle = Math.PI / 3;
  light1.penumbra = 0.5;
  light1.castShadow = true;
  light1.shadow.blurSamples = 10;
  light1.shadow.radius = 5;
  scene.add(light1);

  // Light2
  const light2 = light1.clone();
  light2.position.set(-2.5, 5, 5);
  scene.add(light2);

  // Orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.y = 1;

  const randomRange = (size = 10) => {
    let random = Math.random();
    return random * (size * 2) - size;
  };

  // Add cuboids
  for (let i = 0; i < 50; i++) {
    const cubeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshNormalMaterial()
    );
    cubeMesh.castShadow = true;
    scene.add(cubeMesh);

    const cubeBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(randomRange(20), 5, randomRange(20))
        .setCanSleep(false)
    );
    const cubeShape = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
      .setMass(1)
      .setRestitution(1.1);
    world.createCollider(cubeShape, cubeBody);
    dynamicBodies.push([cubeMesh, cubeBody]);
  }

  // Render animation
  const loopHandler = () => {
    dynamicBodies.map(([object, dynamicBody]) => {
      object.position.copy(dynamicBody.translation());
      object.quaternion.copy(dynamicBody.rotation());
    });

    const delta = clock.getDelta();
    world.timestep = Math.min(delta, 0.1);
    world.step();
    controls.update();
    rapierDebugRenderer.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loopHandler);
  };

  requestAnimationFrame(loopHandler);
});
</script>
