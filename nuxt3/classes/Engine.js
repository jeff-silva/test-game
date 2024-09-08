import RAPIER from "@dimforge/rapier3d-compat";

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const Scene = class Scene {
  options = {
    el: null,
    debug: false,
  };

  instances = [];

  constructor(options = {}) {
    console.clear();
    this.options = {
      ...this.options,
      ...options,
    };
    this.event = new Event(this, {});
    this.input = new Input(this, {});
    this.canvas = new Canvas(this, {
      el: this.options.el,
    });
    this.game = new Game(this, {});
    this.physics = new Physics(this, {});
  }

  init() {
    setTimeout(async () => {
      await RAPIER.init();
      await this.preloadInit();
      this.create();
      this.update();
    }, 10);
  }

  create() {
    this.event.onCreate();
    this.input.onCreate();
    this.canvas.onCreate();
    this.game.onCreate();
    this.physics.onCreate();
    this.onCreate();
    this.event.dispatch("create");
    this.instances.map((instance) => {
      instance.onCreate();
    });
  }

  update() {
    this.event.onUpdate();
    this.input.onUpdate();
    this.canvas.onUpdate();
    this.game.onUpdate();
    this.physics.onUpdate();
    this.onUpdate();
    this.event.dispatch("update");
    this.instances.map((instance) => {
      instance.onUpdate();
    });
    requestAnimationFrame(() => this.update());
  }

  destroy() {
    this.event.onDestroy();
    this.input.onDestroy();
    this.canvas.onDestroy();
    this.game.onDestroy();
    this.physics.onDestroy();
    this.onDestroy();
    this.event.dispatch("destroy");
    this.instances.map((instance) => {
      instance.onDestroy();
    });
  }

  onCreate() {}
  onUpdate() {}
  onDestroy() {}

  preload() {
    return {};
  }

  preloadInit() {
    return new Promise((resolve, reject) => {
      console.log(this.preload());
      resolve();

      // const config = useRuntimeConfig();
      // const manager = Object.assign(new THREE.LoadingManager(), {
      //   onProgress: (url, itemsLoaded, itemsTotal) => {
      //     const progress = (itemsLoaded / itemsTotal) * 100;
      //     this.dispatch("loadProgress", {
      //       progress,
      //       url,
      //       itemsLoaded,
      //       itemsTotal,
      //     });
      //   },
      //   onLoad: () => {
      //     this.dispatch("loadSuccess");
      //     resolve();
      //   },
      // });

      // const modelLoaders = {
      //   gltf: (item) => {
      //     return new GLTFLoader(manager).load(item.url, (gltf) => {
      //       item.loaded = true;
      //       item.model = gltf;
      //       item.onLoad(item);
      //     });
      //   },
      // };

      // let preload = this.preload();

      // Object.entries(preload).map(([name, item]) => {
      //   item = {
      //     name,
      //     onLoad: () => null,
      //     ...item,
      //     ext: item.url.split("?").at(0).split(".").at(-1),
      //     loaded: false,
      //     model: null,
      //   };

      //   if (!item.url.startsWith("http")) {
      //     const u = new URL(location.href);
      //     const itemPath = item.url;
      //     item.url = u.origin;
      //     if (config.app.baseURL) {
      //       if (!config.app.baseURL.startsWith("/")) {
      //         item.url += "/";
      //       }
      //       item.url += config.app.baseURL;
      //       if (
      //         !config.app.baseURL.endsWith("/") &&
      //         !itemPath.startsWith("/")
      //       ) {
      //         item.url += "/";
      //       }
      //       item.url += itemPath;
      //     }
      //   }

      //   if (typeof modelLoaders[item.ext] == "function") {
      //     modelLoaders[item.ext](item);
      //   }
      // });
    });
  }

  instanceAdd(instance) {
    instance.scene = this;
    this.instances.push(instance);
  }
};

export const Instance = class Instance {
  scene = null;
  onCreate() {}
  onUpdate() {}
  onDestroy() {}
};

export const Script = class Script {
  //
};

class Base {
  options = {};

  constructor(parent, options = {}) {
    this.parent = parent;
    this.options = {
      ...this.optionsDefault(),
      ...options,
    };
  }

  optionsDefault() {
    return {};
  }

  onCreate() {}
  onUpdate() {}
  onDestroy() {}
}

class Event extends Base {
  events = [];

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
  }
}

class Input extends Base {
  keyboard = {};
  mouse = {
    click: { x: 0, y: 0 },
    movement: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
  };

  onCreate() {
    this.getEvents().map((args) => {
      document.addEventListener(...args);
    });
  }

  onDestroy() {
    this.getEvents().map((args) => {
      document.removeEventListener(...args);
    });
  }

  eventHandler(ev, evt) {
    if (ev.type == "keydown") {
      this.keyboard[ev.key] = true;
      this.keyboard[ev.code] = true;
      this.keyboard[ev.keyCode] = true;
    }
    if (ev.type == "keyup") {
      delete this.keyboard[ev.key];
      delete this.keyboard[ev.code];
      delete this.keyboard[ev.keyCode];
    }
    if (ev.type == "click") {
      this.mouse.click.x = ev.offsetX;
      this.mouse.click.y = ev.offsetY;
    }
    if (["mousemove", "pointermove"].includes(ev.type)) {
      for (let attr in this.mouse) {
        if (typeof ev[`${attr}X`] == "undefined") continue;
        this.mouse[attr]["x"] = ev[`${attr}X`];
        this.mouse[attr]["y"] = ev[`${attr}Y`];
      }
    }
  }

  getEvents() {
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

    let ret = [];
    events.map((evt) => {
      ret.push([evt.name, (ev) => this.eventHandler(ev, evt)]);
    });

    return ret;
  }
}

class Canvas extends Base {
  el = null;
  width = 0;
  height = 0;

  optionsDefault() {
    return {
      el: null,
    };
  }

  onCreate() {
    if (!this.el) {
      this.el = document.querySelector(this.options.el);
      window.addEventListener("resize", this.onResizeHandler);
    }
  }

  onDestroy() {
    window.removeEventListener("resize", this.onResizeHandler);
  }

  onResizeHandler() {
    this.width = this.el.offsetWidth;
    this.height = this.el.offsetHeight;
  }
}

class Game extends Base {
  onCreate() {
    const { width, height } = this.parent.canvas;
    const { canvas } = this.parent;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    canvas.el.innerHTML = "";
    canvas.el.style.position = "relative";
    canvas.el.style.minHeight = "100px";
    canvas.el.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
  }

  onUpdate() {
    this.renderer.render(this.scene, this.camera);
  }
}

class Physics extends Base {
  debug = false;
  scene = null;
  world = null;
  dynamicBodies = [];

  optionsDefault() {
    return {
      debug: false,
    };
  }

  onCreate() {
    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

    // if (options.debug) {
    //   this.debug = new Debug(options.scene, this.world);
    // }

    // console.log(this.options);
    // console.log(this.parent.game.scene);
  }

  onUpdate() {
    this.dynamicBodies.map(({ mesh, body, shape }) => {
      if (!body) return;
      if (typeof body.translation == "function") {
        mesh.position.copy(body.translation());
      }
      if (typeof body.rotation == "function") {
        mesh.quaternion.copy(body.rotation());
      }
    });

    if (this.debug && this.world) {
      this.debug.update();
    }

    const delta = this.parent.game.clock.getDelta();
    this.world.timestep = Math.min(delta, 0.1);
    this.world.step();
  }

  dynamicBodyAdd({ mesh, body, shape }) {
    const collider = this.world.createCollider(shape, body);
    this.dynamicBodies.push({ collider, mesh, body, shape });
  }

  characterController() {
    return new (class {
      parent = null;
      controller = null;
      collider = null;

      constructor(parent) {
        this.parent = parent;

        this.collider = (() => {
          let rigidBodyDesc = new RAPIER.RigidBodyDesc(
            RAPIER.RigidBodyType["KinematicPositionBased"]
          );
          let rigidBody = parent.world.createRigidBody(rigidBodyDesc);
          let colliderDesc = new RAPIER.ColliderDesc(
            new RAPIER.Cuboid(0.5, 0.5, 0.5)
          );
          return parent.world.createCollider(colliderDesc, rigidBody);
        })();

        this.controller = parent.world.createCharacterController(0.01);
        this.controller.setSlideEnabled(true); // Allow sliding down hill
        this.controller.setMaxSlopeClimbAngle((45 * Math.PI) / 180); // Don’t allow climbing slopes larger than 45 degrees.
        this.controller.setMinSlopeSlideAngle((30 * Math.PI) / 180); // Automatically slide down on slopes smaller than 30 degrees.
        this.controller.enableAutostep(0.5, 0.2, true); // (maxHeight, minWidth, includeDynamicBodies) Stair behavior
        this.controller.enableSnapToGround(0.5); // (distance) Set ground snap behavior
        this.controller.setApplyImpulsesToDynamicBodies(true); // Add push behavior
        this.controller.setCharacterMass(1);
      }

      move(desiredTranslation) {
        let rigidBody = parent.world.createRigidBody(
          new RAPIER.RigidBodyDesc(
            RAPIER.RigidBodyType["KinematicPositionBased"]
          )
        );
        const collider = parent.world.createCollider(
          new RAPIER.ColliderDesc(new RAPIER.Cuboid(0.5, 0.5, 0.5)),
          rigidBody
        );

        let velocity = new THREE.Vector3();
        velocity.x += 1;

        this.controller.computeColliderMovement(collider, velocity);

        // (optional) Check collisions
        for (var i = 0; i < controller.numComputedCollisions(); i++) {
          let collision = controller.computedCollision(i);
        }

        // Calculate next translation from computed movement
        movement.copy(controller.computedMovement());
        nextTranslation.copy(rigidBody.translation());
        nextTranslation.add(movement);
        rigidBody.setNextKinematicTranslation(nextTranslation);
      }
    })(this);
  }
}
