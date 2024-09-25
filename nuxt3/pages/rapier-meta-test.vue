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

class ThreeEngine {
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
    if (!this.options.el) throw new Error("options.el not defined");
    this.canvas = document.querySelector(this.options.el);
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.aspect = this.width / this.height;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 100);
    this.clock = new THREE.Clock();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.canvas.innerHTML = "";
    this.canvas.style.position = "relative";
    this.canvas.style.minHeight = "100px";
    this.canvas.style.background = "#f5f5f5";
    this.canvas.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.resize();
    this.assets = await this.assetsLoad();
    this.busy = false;
    window.addEventListener("resize", () => this.resize());
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
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.update());
  }

  assetsLoad() {
    return new Promise((resolve, reject) => {
      let files = this.options.assets;

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
}

const assetsLoad = (files = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    options = {
      onProgress: () => null,
      onLoad: () => null,
      ...options,
    };

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
        options.onProgress(data);
      },
      onLoad: () => {
        resolve(files);
        options.onLoad(files);
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
};

const engine = new ThreeEngine({
  el: "#game",
  debug: true,
  assets: {
    scene: {
      url: app.baseUrl("assets/threejs/models/rapier-meta-test/scene.gltf"),
    },
  },
});

onMounted(async () => {
  await engine.init();
  console.log(engine);
  // scene.add(assets.scene.content.scene);
});

onUnmounted(() => {
  location.reload();
});
</script>
