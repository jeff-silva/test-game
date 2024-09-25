<template>
  <nuxt-layout name="main">
    <div
      id="game"
      style="width: 100%; height: 400px; position: relative"
    ></div>
    <a href="">Refresh</a>
  </nuxt-layout>
</template>

<script setup>
import RAPIER from "@dimforge/rapier3d-compat";

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const app = useApp();

class ThreeRapierEngine {
  constructor(options = {}) {
    this.options = {
      el: null,
      debug: false,
      assets: {},
      ...options,
    };
  }

  async init() {
    this.busy = true;
    await RAPIER.init();
    this.THREE = THREE;
    this.RAPIER = RAPIER;
    if (!this.options.el) throw new Error("options.el not defined");
    this.canvas = document.querySelector(this.options.el);
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.aspect = this.width / this.height;
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 100);
    this.clock = new THREE.Clock();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.canvas.innerHTML = "";
    this.canvas.style.position = "relative";
    this.canvas.style.minHeight = "100px";
    this.canvas.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.resize();
    this.assets = await this.assetsLoad();
    this.busy = false;
    window.addEventListener("resize", () => this.resize());
    this.onCreate();
    this.update();
  }

  resize() {
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.aspect = this.width / this.height;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
  }

  update() {
    this.onUpdate();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.update());
  }

  assetsLoad() {
    return new Promise((resolve, reject) => {
      let files = this.preload();

      if (Object.entries(files).length == 0) {
        resolve({});
      }

      const modelLoaders = {
        gltf: (item) => {
          return new GLTFLoader(manager).load(item.url, (gltf) => {
            item.loaded = true;
            item.content = gltf;
          });
        },
      };

      const manager = Object.assign(new THREE.LoadingManager(), {
        onProgress: (url, itemsLoaded, itemsTotal) => {
          let data = { url, itemsLoaded, itemsTotal };
          data.progress = (itemsLoaded / itemsTotal) * 100;
        },
        onLoad: () => {
          resolve(files);
        },
      });

      Object.entries(files).map(([name, item]) => {
        item.loaded = false;
        item.ext = item.url.split("?").at(0).split(".").at(-1);
        item.content = null;

        if (typeof modelLoaders[item.ext] == "function") {
          modelLoaders[item.ext](item);
        }
      });
    });
  }

  preload() {
    return {};
  }

  onCreate() {
    //
  }

  onUpdate() {
    //
  }
}

class Game extends ThreeRapierEngine {
  preload() {
    return {
      scene: {
        url: app.baseUrl("assets/threejs/models/rapier-meta-test/scene.gltf"),
      },
    };
  }

  onCreate() {
    this.scene.add(this.assets.scene.content.scene);
    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    // this.scene.add((this.cube = new THREE.Mesh(geometry, material)));
    // this.camera.position.set(0, 0, 2);
  }

  onUpdate() {
    // this.cube.rotation.x += 0.01;
    // this.cube.rotation.y += 0.01;
    // this.cube.rotation.z += 0.01;
  }
}

const game = new Game({
  el: "#game",
  debug: true,
});

onMounted(async () => {
  await game.init();
  // scene.add(assets.scene.content.scene);
});

onUnmounted(() => {
  location.reload();
});
</script>
