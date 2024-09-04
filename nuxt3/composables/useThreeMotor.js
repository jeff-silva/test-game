import * as THREE from "three";
import { PhysicsLoader } from "enable3d";
import { AmmoPhysics } from "@enable3d/ammo-physics";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export default (options = {}) => {
  let scene, camera;

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

    clock: null,
    physics: null,
    renderer: null,

    pointerLock: new (class {
      constructor() {
        this.instance = null;
        this.locked = false;
      }
      init() {
        return new Promise((resolve, reject) => {
          this.instance = new PointerLockControls(camera, r.el);
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

          this.instance.onStart = (url, itemsLoaded, itemsTotal) => {};
          this.instance.onProgress = (url, itemsLoaded, itemsTotal) => {
            let progress = (itemsLoaded / itemsTotal) * 100;
            r.loadingManager.progress = progress;
          };
          this.instance.onError = (url) => {};
          this.instance.onLoad = () => {
            r.ready = true;
            r.size.sync();
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
          r.clock = new THREE.Clock();

          // Physics
          r.physics = new AmmoPhysics(scene);
          r.physics.debug.enable();
          r.physics.debug.mode(1);

          // Renderer
          r.renderer = new THREE.WebGLRenderer({ antialias: true });
          r.el.appendChild(r.renderer.domElement);

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
            r.resize(r.getScope({ event }));
          });

          resolve();
        });
      });
    },

    update() {
      const updateHandler = () => {
        r.physics.updateDebugger();
        r.physics.update(r.clock.getDelta() * 1000);
        r.renderer.render(scene, camera);
        r.onUpdate(r.getScope());
        requestAnimationFrame(updateHandler);
      };

      requestAnimationFrame(updateHandler);
    },
  });

  onMounted(async () => {
    r.init();
  });

  // let r = {
  //   pointerLock: null,
  //   scene: null,
  //   camera: null,
  //   clock: null,
  //   physics: null,
  //   pointerLock: null,
  //   renderer: null,
  //   loadingManager: null,
  //   init(...args) {
  //     return r.reactive.init(...args);
  //   },
  //   onInit(...args) {
  //     return r.reactive.onInit(...args);
  //   },
  //   update(...args) {
  //     return r.reactive.update(...args);
  //   },
  //   onUpdate(...args) {
  //     return r.reactive.onUpdate(...args);
  //   },
  //   resize(...args) {
  //     return r.reactive.resize(...args);
  //   },
  //   onResize(...args) {
  //     return r.reactive.onResize(...args);
  //   },
  //   onInput(...args) {
  //     return r.reactive.onInput(...args);
  //   },
  //   lock(...args) {
  //     return r.reactive.lock(...args);
  //   },
  //   onLockChange(...args) {
  //     return r.reactive.onLockChange(...args);
  //   },
  //   getScope(...args) {
  //     return r.reactive.getScope(...args);
  //   },
  //   reactive: reactive({
  //     ...options,
  //     loadingProgress: 0,
  //     ready: false,
  //     width: null,
  //     height: null,
  //     locked: false,
  //     init() {
  //       PhysicsLoader("/assets/threejs/ammo", () => {
  //         r.reactive.el = document.querySelector(r.reactive.el);
  //         r.reactive.width = r.reactive.el.offsetWidth;
  //         r.reactive.height = r.reactive.el.offsetHeight;

  //         const { width, height } = r.reactive;
  //         r.scene = new THREE.Scene();
  //         r.camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
  //         r.clock = new THREE.Clock();

  //         r.physics = new AmmoPhysics(r.scene);
  //         r.physics.debug.enable();
  //         r.physics.debug.mode(1);

  //         r.pointerLock = new PointerLockControls(r.camera, r.reactive.el);
  //         r.pointerLock.addEventListener("lock", () => {
  //           r.reactive.locked = true;
  //           r.onLockChange();
  //         });
  //         r.pointerLock.addEventListener("unlock", () => {
  //           r.reactive.locked = false;
  //           r.onLockChange();
  //         });

  //         r.renderer = new THREE.WebGLRenderer({ antialias: true });
  //         r.THREE = THREE;

  //         ["keyup", "keydown"].map((evt) => {
  //           document.addEventListener(evt, (event) => {
  //             r.reactive.onInput(r.getScope({ event }));
  //           });
  //         });

  //         window.addEventListener("resize", (ev) => {
  //           r.reactive.resize();
  //         });

  //         r.reactive.el.appendChild(r.renderer.domElement);

  //         // Loading manager
  //         r.loadingManager = Object.assign(new THREE.LoadingManager(), {
  //           onStart(url, itemsLoaded, itemsTotal) {},
  //           onProgress(url, itemsLoaded, itemsTotal) {
  //             let progress = (itemsLoaded / itemsTotal) * 100;
  //             r.reactive.loadingProgress = progress;
  //           },
  //           onError(url) {},
  //           onLoad() {
  //             r.ready = true;
  //             r.reactive.resize();
  //             r.reactive.onInit(r.getScope());
  //             r.reactive.update();
  //           },
  //         });

  //         // const loader = new OBJLoader(r.loadingManager);
  //         const modelLoaders = {
  //           gltf(name, model) {
  //             return new GLTFLoader(r.loadingManager).load(
  //               model.url,
  //               (gltf) => {
  //                 r.reactive.models[name]["loaded"] = true;
  //                 r.reactive.models[name]["content"] = gltf;
  //                 if (typeof model.onLoad == "function") {
  //                   model.onLoad(gltf);
  //                 }
  //               }
  //             );
  //           },
  //         };

  //         Object.entries(r.reactive.models).map(([name, model]) => {
  //           r.reactive.models[name]["name"] = name;
  //           r.reactive.models[name]["loaded"] = false;
  //           const ext = model.url.split("?").at(0).split(".").at(-1);
  //           modelLoaders[ext](name, model);
  //         });
  //       });
  //     },
  //     async update() {
  //       const updateHandler = () => {
  //         r.physics.updateDebugger();
  //         r.physics.update(r.clock.getDelta() * 1000);
  //         r.renderer.render(r.scene, r.camera);
  //         r.reactive.onUpdate(r.getScope());
  //         requestAnimationFrame(updateHandler);
  //       };

  //       updateHandler();
  //       requestAnimationFrame(updateHandler);
  //     },
  //     resize() {
  //       r.reactive.width = r.reactive.el.offsetWidth;
  //       r.reactive.height = r.reactive.el.offsetHeight;
  //       const { width, height } = r.reactive;
  //       r.renderer.setSize(width, height);
  //       r.renderer.setPixelRatio(width / height);
  //       r.reactive.onResize(r.getScope());
  //     },
  //     lock() {},
  //     getScope(merge = {}) {
  //       return {
  //         ...r,
  //         THREE,
  //         ...r.reactive,
  //         ...merge,
  //       };
  //     },
  //   }),
  // };

  return r;
};
