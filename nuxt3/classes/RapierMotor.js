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
    mouse: {
      click: { x: 0, y: 0 },
      movement: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
    },
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
      const eventKeys = [`input`, `input.${evt.type}`, `input.${ev.type}`];
      eventKeys.map((eventKey) => {
        this.dispatch(eventKey, ev);

        if (ev.type == "keydown") {
          this.input.keyboard[ev.key] = true;
          this.input.keyboard[ev.code] = true;
          this.input.keyboard[ev.keyCode] = true;
        }
        if (ev.type == "keyup") {
          this.input.keyboard[ev.key] = null;
          this.input.keyboard[ev.code] = null;
          this.input.keyboard[ev.keyCode] = null;
        }
        if (ev.type == "click") {
          this.input.mouse.click.x = ev.offsetX;
          this.input.mouse.click.y = ev.offsetY;
        }
        if (["mousemove", "pointermove"].includes(ev.type)) {
          for (let attr in this.input.mouse) {
            if (typeof ev[`${attr}X`] == "undefined") continue;
            this.input.mouse[attr]["x"] = ev[`${attr}X`];
            this.input.mouse[attr]["y"] = ev[`${attr}Y`];
          }
        }
      });
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

      this.dynamicBodies.map(({ mesh, body, shape }) => {
        if (!body) return;
        mesh.position.copy(body.translation());
        mesh.quaternion.copy(body.rotation());
      });

      const delta = this.clock.getDelta();
      this.world.timestep = Math.min(delta, 0.1);
      this.world.step();

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
  }

  basicMeshPhysicsAdd(options = {}) {
    options = {
      geometry: {},
      position: { x: 0, y: 0, z: 0 },
      material: {},
      body: {},
      ...options,
    };

    options.geometry = new ThreeGeometry().optionsMerge(options.geometry || {});
    options.material = new ThreeMaterial().optionsMerge(options.material || {});
    options.body = new RapierBody().optionsMerge(options.body || {});

    let data = {};

    const geometry = new ThreeGeometry(options.geometry).get();
    const material = new ThreeMaterial(options.material).get();
    const shape = new RapierShape(options.geometry).get();
    const body = new RapierBody(options.body).get();

    data.mesh = new THREE.Mesh(geometry, material);

    data.mesh.position.set(
      options.position.x,
      options.position.y,
      options.position.z
    );

    data.body = this.world.createRigidBody(
      body
        .setCanSleep(options.body.canSleep)
        .setTranslation(
          options.position.x,
          options.position.y,
          options.position.z
        )
    );

    data.shape = shape
      .setMass(options.body.mass)
      .setRestitution(options.body.restitution);

    this.scene.add(data.mesh);
    this.world.createCollider(data.shape, data.body);
    this.dynamicBodies.push(data);

    return data;
  }

  physicsAttach(mesh, options = {}) {
    // // options.geometry = new ThreeGeometry().optionsMerge(options.geometry || {});
    // options.body = new RapierBody().optionsMerge(options.body || {});
    // let data = {};
    // data.mesh = mesh;
    // data.body = undefined;
    // data.shape = undefined;
    // // const shape = new RapierShape(options.geometry).get();
    // // const body = new RapierBody(options.body).get();
    // console.log(options);
    // this.world.createCollider(data.shape, data.body);
    // this.dynamicBodies.push(data);
    // return data;
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

class ThreeRapierFormatBase {
  name = "Format base";
  options = {};

  constructor(options = {}) {
    this.options = this.optionsMerge(options);
  }

  optionsDefault() {
    return { type: null };
  }

  optionsMerge(options = {}) {
    return {
      ...this.optionsDefault(),
      ...options,
    };
  }

  itemsTypes() {
    return {
      default: () => null,
    };
  }

  get() {
    const items = this.itemsTypes();
    if (typeof items[this.options.type] == "undefined") {
      throw new Error(`${this.name} "${this.options.type}" does not exists`);
    }
    return items[this.options.type]();
  }
}

class ThreeGeometry extends ThreeRapierFormatBase {
  name = "Three Geometry";
  optionsDefault() {
    return {
      type: null,
      radius: 1,
      length: 1,
      capSegments: 4,
      radialSegments: 8,
      width: 1,
      height: 1,
      depth: 1,
    };
  }
  itemsTypes() {
    return {
      capsule: () =>
        new THREE.CapsuleGeometry(
          this.options.radius,
          this.options.length,
          this.options.capSegments,
          this.options.radialSegments
        ),
      cube: () =>
        new THREE.BoxGeometry(
          this.options.width,
          this.options.height,
          this.options.depth
        ),
    };
  }
}

class ThreeMaterial extends ThreeRapierFormatBase {
  name = "Three Material";
  optionsDefault() {
    return {
      type: "basic",
      color: 0xffffff,
    };
  }
  itemsTypes() {
    return {
      basic: () =>
        new THREE.MeshBasicMaterial({ ...this.options, type: undefined }),
    };
  }
}

class RapierShape extends ThreeRapierFormatBase {
  name = "Rapier Shape";
  optionsDefault() {
    return {
      type: null,
      radius: 1,
      length: 1,
      capSegments: 4,
      radialSegments: 8,
      width: 1,
      height: 1,
      depth: 1,
    };
  }
  itemsTypes() {
    return {
      capsule: () =>
        RAPIER.ColliderDesc.capsule(
          this.options.length / 2,
          this.options.radius
        ),
      cube: () =>
        RAPIER.ColliderDesc.cuboid(
          this.options.width / 2,
          this.options.height / 2,
          this.options.depth / 2
        ),
      // trimesh: () => RAPIER.ColliderDesc.trimesh(),
    };
  }
}

class RapierBody extends ThreeRapierFormatBase {
  name = "Rapier Body";
  optionsDefault() {
    return {
      type: "dynamic",
      mass: 1,
      restitution: 1,
      canSleep: false,
    };
  }
  itemsTypes() {
    return {
      fixed: () => RAPIER.RigidBodyDesc.fixed(),
      dynamic: () => RAPIER.RigidBodyDesc.dynamic(),
    };
  }
}
