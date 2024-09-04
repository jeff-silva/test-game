import * as THREE from "three";
import { PhysicsLoader } from "enable3d";
import { AmmoPhysics } from "@enable3d/ammo-physics";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export default (options = {}) => {
  let scene, camera, renderer, clock, physics;

  const r = reactive({
    el: null,
    models: {},
    onInit: () => null,
    onUpdate: () => null,
    onResize: () => null,
    onInput: (ev) => null,
    onLockChange: () => null,

    ...options,

    size: {
      width: null,
      height: null,
      sync() {
        r.size.width = r.el.offsetWidth;
        r.size.height = r.el.offsetHeight;
      },
    },

    pointerLock: new (class {
      constructor() {
        this.instance = null;
        this.locked = false;
      }
      init() {
        return new Promise((resolve, reject) => {
          this.instance = new PointerLockControls(camera, r.el);
          this.instance.pointerSpeed = 0.4;
          this.instance.addEventListener("lock", () => {
            this.locked = true;
            r.onLockChange(r.getScope({ locked: true }));
          });
          this.instance.addEventListener("unlock", () => {
            this.locked = false;
            r.onLockChange(r.getScope({ locked: false }));
          });
          resolve();
        });
      }
      lock() {
        this.instance.lock();
      }
    })(),

    loadingManager: new (class {
      constructor() {
        this.progress = 0;
        this.instance = new THREE.LoadingManager();
      }

      init() {
        return new Promise((resolve, reject) => {
          const modelLoaders = {
            gltf(name, model, manager) {
              return new GLTFLoader(manager).load(model.url, (gltf) => {
                r.models[name]["loaded"] = true;
                r.models[name]["content"] = gltf;
                if (typeof model.onLoad == "function") {
                  model.onLoad(r.getScope({ gltf }));
                }
              });
            },
          };

          // this.instance.onStart = (url, itemsLoaded, itemsTotal) => {};

          this.instance.onProgress = (url, itemsLoaded, itemsTotal) => {
            let progress = (itemsLoaded / itemsTotal) * 100;
            r.loadingManager.progress = progress;
          };

          // this.instance.onError = (url) => {};

          this.instance.onLoad = () => {
            r.ready = true;
            r.size.sync();
            renderer.setSize(r.size.width, r.size.height);
            r.onInit(r.getScope());
            r.update();
            resolve();
          };

          Object.entries(r.models).map(([name, model]) => {
            r.models[name]["name"] = name;
            r.models[name]["loaded"] = false;
            const ext = model.url.split("?").at(0).split(".").at(-1);
            modelLoaders[ext](name, model, this.instance);
          });
        });
      }
    })(),

    getScope(merge = {}) {
      return {
        THREE,
        scene,
        camera,
        renderer,
        clock,
        physics,
        ...r,
        ...merge,
      };
    },

    init() {
      return new Promise(async (resolve, reject) => {
        PhysicsLoader("/assets/threejs/ammo", async () => {
          r.el = document.querySelector(r.el);
          r.size.sync();

          // Scene
          scene = new THREE.Scene();

          // Camera
          camera = new THREE.PerspectiveCamera(
            50,
            r.size.width / r.size.height,
            1,
            1000
          );

          // Clock
          clock = new THREE.Clock();

          // Physics
          physics = new AmmoPhysics(scene);
          physics.debug.enable();
          physics.debug.mode(1);

          // Renderer
          renderer = new THREE.WebGLRenderer({ antialias: true });
          r.el.appendChild(renderer.domElement);
          renderer.domElement.style.width = "100%";
          renderer.domElement.style.height = "100%";

          // Init loading manager
          await r.loadingManager.init();

          // Init pointer lock
          await r.pointerLock.init();

          ["keyup", "keydown"].map((evt) => {
            document.addEventListener(evt, (event) => {
              r.onInput(r.getScope({ event }));
            });
          });

          window.addEventListener("resize", (event) => {
            r.resize();
          });

          resolve();
        });
      });
    },

    update() {
      const updateHandler = () => {
        physics.updateDebugger();
        physics.update(clock.getDelta() * 1000);
        renderer.render(scene, camera);
        r.onUpdate(r.getScope());
        requestAnimationFrame(updateHandler);
      };

      requestAnimationFrame(updateHandler);
    },

    resize() {
      r.size.sync();
      camera.aspect = r.size.width / r.size.height;
      camera.updateProjectionMatrix();
      renderer.setSize(r.size.width, r.size.height);
      r.onResize(r.getScope());
    },
  });

  onMounted(async () => {
    r.init();
  });

  return r;
};
