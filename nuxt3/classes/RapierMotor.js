import RAPIER from "@dimforge/rapier3d-compat";

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const Debug = class Debug {
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
};

export const Scene = class Scene {
  options = {
    el: null,
    debug: false,
  };

  canvas = {
    el: null,
    width: 0,
    height: 0,
  };

  scene = null;
  camera = null;
  clock = null;
  renderer = null;
  debug = null;
  world = null;
  dynamicBodies = [];
  THREE = null;
  RAPIER = null;

  events = [];
  scripts = [];

  input = {
    mouse: {},
    keyboard: {},
    joystick: {},
  };

  constructor(options = {}) {
    this.options = {
      el: null,
      ...options,
    };

    this.THREE = THREE;
    this.RAPIER = RAPIER;
  }

  init() {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        await RAPIER.init();
        await this.initCanvas();
        await this.initGame();
        await this.initRapier();
        await this.initPreload();
        await this.initCanvas();
        await this.initInputEvents();
        await this.initUpdate();
        resolve({});
      }, 10);
    });
  }

  destroy() {
    this.dispatch("destroy");
  }

  async initCanvas() {
    if (!this.canvas.el) {
      this.canvas.el = document.querySelector(this.options.el);
      window.addEventListener("resize", async () => {
        await this.initCanvas();
      });
    }
    if (this.canvas.el) {
      this.canvas.width = this.canvas.el.offsetWidth;
      this.canvas.height = this.canvas.el.offsetHeight;
    }

    if (this.camera) {
      this.camera.aspect = this.canvas.width / this.canvas.height;
      this.camera.updateProjectionMatrix();
    }

    if (this.renderer) {
      this.renderer.setSize(this.canvas.width, this.canvas.height);
    }
  }

  async initGame() {
    if (!this.scene) {
      this.scene = new THREE.Scene();
      this.scene.name = this.scene.name || "Main Scene";
    }

    if (!this.camera) {
      this.camera = this.cameraDefault();
    }

    if (!this.clock) {
      this.clock = new THREE.Clock();
    }

    if (!this.renderer) {
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.canvas.el.innerHTML = "";
      this.canvas.el.style.position = "relative";
      this.canvas.el.style.minHeight = "100px";
      this.canvas.el.appendChild(this.renderer.domElement);
      this.renderer.domElement.style.width = "100%";
      this.renderer.domElement.style.height = "100%";
    }
  }

  async initRapier() {
    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

    if (this.options.debug) {
      this.debug = new Debug(this.scene, this.world);
    }

    this.on("update", () => {
      if (this.debug && this.world) {
        this.debug.update();
      }
    });
  }

  initPreload() {
    return new Promise((resolve, reject) => {
      const config = useRuntimeConfig();
      const manager = Object.assign(new THREE.LoadingManager(), {
        onProgress: (url, itemsLoaded, itemsTotal) => {
          const progress = (itemsLoaded / itemsTotal) * 100;
          this.dispatch("loadProgress", {
            progress,
            url,
            itemsLoaded,
            itemsTotal,
          });
        },
        onLoad: () => {
          this.dispatch("loadSuccess");
          resolve();
        },
      });

      const modelLoaders = {
        gltf: (item) => {
          return new GLTFLoader(manager).load(item.url, (gltf) => {
            item.loaded = true;
            item.model = gltf;
            item.onLoad(item);
          });
        },
      };

      let preload = this.preload();

      Object.entries(preload).map(([name, item]) => {
        item = {
          name,
          onLoad: () => null,
          ...item,
          ext: item.url.split("?").at(0).split(".").at(-1),
          loaded: false,
          model: null,
        };

        if (!item.url.startsWith("http")) {
          const u = new URL(location.href);
          const itemPath = item.url;
          item.url = u.origin;
          if (config.app.baseURL) {
            if (!config.app.baseURL.startsWith("/")) {
              item.url += "/";
            }
            item.url += config.app.baseURL;
            if (
              !config.app.baseURL.endsWith("/") &&
              !itemPath.startsWith("/")
            ) {
              item.url += "/";
            }
            item.url += itemPath;
          }
        }

        if (typeof modelLoaders[item.ext] == "function") {
          modelLoaders[item.ext](item);
        }
      });
    });
  }

  async initInputEvents() {
    let events = [
      { type: "mouse", name: "click" },
      { type: "mouse", name: "mouseenter" },
      { type: "mouse", name: "mouseleave" },
      { type: "mouse", name: "mousemove" },
      { type: "mouse", name: "pointermove" },
      { type: "mouse", name: "pointerdown" },
      { type: "mouse", name: "pointerout" },
      { type: "mouse", name: "pointerlockchange" },
      { type: "keyboard", name: "keyup" },
      { type: "keyboard", name: "keydown" },
    ];

    const defaultHandler = (ev, evt) => {
      this.dispatch(`input`, ev);
      this.dispatch(`input.${ev.type}`, ev);
      this.dispatch(`input.${ev.name}`, ev);
    };

    let registeredEvents = [];

    events.map((evt) => {
      const handler = (ev) => {
        return defaultHandler(ev, evt);
      };
      registeredEvents.push({ ...evt, handler });
    });

    registeredEvents.map((evt) => {
      document.addEventListener(evt.name, evt.handler);
    });

    this.on("destroy", () => {
      registeredEvents.map((evt) => {
        document.removeEventListener(evt.name, evt.handler);
      });
    });
  }

  async initUpdate() {
    this.onCreate();
    this.dispatch("create");

    const updateHandler = () => {
      this.onUpdate();
      this.dispatch("update");

      this.scripts.map((script) => {
        script.onUpdate();
      });

      // this.renderer.domElement.style.width = "100%";
      // this.renderer.domElement.style.height = "100%";
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(updateHandler);
    };
    requestAnimationFrame(updateHandler);
  }

  preload() {
    return {};
  }

  on(name, callback) {
    this.events.push({ name, callback });
  }

  dispatch(...args) {
    const argsClone = args;
    const name = argsClone.shift();
    this.events
      .filter((e) => e.name == name)
      .map(({ name, callback }) => {
        callback.apply(this, argsClone);
      });

    if (this.parent) {
      this.parent.dispatch(...args);
    }
  }

  cameraDefault() {
    const { width, height } = this.canvas;
    return new THREE.PerspectiveCamera(50, width / height, 1, 1000);
  }

  getOrbitControls(camera = null, renderer = null) {
    camera = camera || this.camera;
    renderer = renderer || this.renderer;
    const controls = new OrbitControls(camera, renderer.domElement);

    this.on("update", () => {
      controls.update();
    });

    return controls;
  }

  getPointerLockControls(options = {}) {
    const controls = new Proxy(
      {
        target: null,
        pointerSpeed: 1,
        minPolarAngle: 0,
        maxPolarAngle: Math.PI,
        updateAxisX: true,
        updateAxisY: true,

        ...options,

        locked: false,
        script: this,
        lock() {
          this.script.canvas.el.requestPointerLock();
        },
        moveForward(speed) {
          const target = controls.target;
          const _vector = new THREE.Vector3();
          _vector.setFromMatrixColumn(target.matrix, 0);
          _vector.crossVectors(target.up, _vector);
          target.position.addScaledVector(_vector, speed);
        },
        moveRight(speed) {
          const target = controls.target;
          const _vector = new THREE.Vector3();
          _vector.setFromMatrixColumn(target.matrix, 0);
          target.position.addScaledVector(_vector, speed);
        },
      },
      {
        get(target, name) {
          if (name == "locked") {
            return !!document.pointerLockElement;
          }
          return target[name];
        },
      }
    );

    this.on("input.click", (ev) => {
      if (this.canvas.el == ev.target || this.canvas.el.contains(ev.target)) {
        controls.lock();
      }
    });

    this.on("input.pointermove", (ev) => {
      if (!controls.locked) return;
      if (!controls.target) return;

      const _PI_2 = Math.PI / 2;
      const object = controls.target;
      const sensitivity = 0.002 * controls.pointerSpeed;

      const _euler = new THREE.Euler(0, 0, 0, "YXZ");
      _euler.setFromQuaternion(object.quaternion);

      if (controls.updateAxisY) {
        _euler.y -= ev.movementX * sensitivity;
      }

      if (controls.updateAxisX) {
        _euler.x -= ev.movementY * sensitivity;
        _euler.x = Math.max(
          _PI_2 - controls.maxPolarAngle,
          Math.min(_PI_2 - controls.minPolarAngle, _euler.x)
        );
      }

      object.quaternion.setFromEuler(_euler);
    });

    return controls;
  }

  getInputsControl(inputs = {}) {
    let defaults = {};
    for (let name in inputs) {
      defaults[name] = inputs[name]({ type: null });
    }

    this.on("input", (ev) => {
      for (let name in inputs) {
        defaults[name] = inputs[name](ev);
        // if (ev.type == "mousedown") {
        //   defaults[name] = inputs[name](ev);
        //   continue;
        // }
        // defaults[name] = inputs[name]({ type: null });
      }
    });

    return defaults;
  }

  scriptAttach(object, script) {
    script.object = object;
    script.scene = this;
    this.scripts.push(script);
    script.onCreate();
  }

  addPhysics(callback) {
    let data = {};

    data.mesh = new THREE.Object3D();

    // data.body = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
    data.body = undefined;

    data.shape = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
      .setMass(1)
      .setRestitution(1.1);

    data = callback(data);

    this.scene.add(data.mesh);
    this.world.createCollider(data.shape, data.body);
    this.dynamicBodies.push(data);

    this.on("update", () => {
      this.dynamicBodies.map(({ mesh, body, shape }) => {
        if (!body) return;
        mesh.position.copy(body.translation());
        mesh.quaternion.copy(body.rotation());
      });

      const delta = this.clock.getDelta();
      this.world.timestep = Math.min(delta, 0.1);
      this.world.step();
    });
  }

  onCreate() {}

  onUpdate() {}
};

export const Script = class Scene {
  object = null;
  scene = null;

  onCreate() {}
  onUpdate() {}
};
