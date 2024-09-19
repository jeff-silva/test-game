import RAPIER from "@dimforge/rapier3d-compat";

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import _ from "lodash";

export const Scene = class Scene {
  options = {
    el: null,
    debug: false,
  };

  instances = [];

  constructor(options = {}) {
    // console.clear();
    this.options = {
      ...this.options,
      ...options,
    };

    this.extensions().map((item) => {
      this[item.name] = new item.class(this);
    });
  }

  extensions() {
    return [
      { name: "preload", class: Preload },
      { name: "event", class: Event },
      { name: "input", class: Input },
      { name: "canvas", class: Canvas },
      { name: "game", class: Game },
      { name: "physics", class: Physics },
    ];
  }

  init() {
    setTimeout(async () => {
      await RAPIER.init();
      await this.preload.init(this.preloadFiles());
      this.create();
      this.update();
    }, 10);
  }

  create() {
    this.extensions().map((item) => {
      this[item.name]["onCreate"]();
    });

    this.onCreate();
    this.event.dispatch("create");
    this.instances.map((instance) => {
      instance.onCreate();
    });
  }

  update() {
    this.extensions().map((item) => {
      this[item.name]["onUpdate"]();
    });

    this.onUpdate();
    this.event.dispatch("update");
    this.instances.map((instance) => {
      instance.onUpdate();
    });
    requestAnimationFrame(() => this.update());
  }

  destroy() {
    this.extensions().map((item) => {
      this[item.name]["onDestroy"]();
    });

    this.onDestroy();
    this.event.dispatch("destroy");
    this.instances.map((instance) => {
      instance.onDestroy();
    });
  }

  onCreate() {}
  onUpdate() {}
  onDestroy() {}

  preloadFiles() {
    return {};
  }

  instanceAdd(instance) {
    instance.parent = this;
    this.instances.push(instance);
  }
};

export const Instance = class Instance {
  parent = null;
  onCreate() {}
  onUpdate() {}
  onDestroy() {}
};

export const Script = class Script {
  parent = null;
  onCreate() {}
  onUpdate() {}
  onDestroy() {}
};

class Base {
  constructor(parent) {
    this.parent = parent;
  }

  onCreate() {}
  onUpdate() {}
  onDestroy() {}
}

class Preload extends Base {
  files = {};

  init(files = {}) {
    return new Promise((resolve, reject) => {
      if (Object.entries(files).length == 0) {
        resolve();
      }

      const modelLoaders = {
        gltf: (item) => {
          return new GLTFLoader(manager).load(item.url, (gltf) => {
            item.loaded = true;
            item.model = gltf;
          });
        },
      };

      const manager = Object.assign(new THREE.LoadingManager(), {
        onProgress: (url, itemsLoaded, itemsTotal) => {
          const progress = (itemsLoaded / itemsTotal) * 100;
          this.parent.event.dispatch("preload.loading.progress", {
            progress,
            url,
            itemsLoaded,
            itemsTotal,
          });
        },
        onLoad: () => {
          this.parent.event.dispatch("preload.loading.success");
          resolve();
        },
      });

      Object.entries(files).map(([name, item]) => {
        item.name = name;
        item.loaded = false;
        item.ext = item.url.split("?").at(0).split(".").at(-1);
        item.content = null;

        if (typeof modelLoaders[item.ext] == "function") {
          modelLoaders[item.ext](item);
        }

        this.files[name] = item;
      });
    });
  }
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
    const eventKeys = [`input`, `input.${evt.type}`, `input.${ev.type}`];

    eventKeys.map((eventKey) => {
      this.parent.event.dispatch(eventKey, ev);
    });

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

  onCreate() {
    const { options } = this.parent;
    this.el = document.querySelector(options.el);
    this.resizeHandler();

    window.addEventListener("resize", () => {
      this.resizeHandler();

      this.parent.event.dispatch("canvas.resize", {
        width: this.width,
        height: this.height,
      });
    });
  }

  resizeHandler() {
    this.width = this.el.offsetWidth;
    this.height = this.el.offsetHeight;
  }
}

class Game extends Base {
  onCreate() {
    const { width, height } = this.parent.canvas;
    const { canvas } = this.parent;

    this.THREE = THREE;
    this.RAPIER = RAPIER;

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

    this.resizeHandler(width, height);

    this.parent.event.on("canvas.resize", ({ width, height }) => {
      this.resizeHandler(width, height);
    });
  }

  onUpdate() {
    this.renderer.render(this.scene, this.camera);
  }

  resizeHandler(width, height) {
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  getPointerLockControls(options = {}) {
    const controls = new Proxy(
      {
        target: null,
        pointerSpeed: 0.4,
        minPolarAngle: 0,
        maxPolarAngle: Math.PI,
        updateAxisX: true,
        updateAxisY: true,

        ...options,

        locked: false,
        script: this,
        lock: () => {
          this.parent.canvas.el.requestPointerLock();
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

    this.parent.event.on("input.click", (ev) => {
      if (
        this.parent.canvas.el == ev.target ||
        this.parent.canvas.el.contains(ev.target)
      ) {
        controls.lock();
      }
    });

    this.parent.event.on("input.pointermove", (ev) => {
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
}

class Physics extends Base {
  debug = false;
  scene = null;
  world = null;
  dynamicBodies = [];

  onCreate() {
    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

    if (this.parent.options.debug) {
      this.debug = new Debug(this.parent.game.scene, this.world);
    }
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

    if (this.parent.options.debug && this.debug && this.world) {
      this.debug.update();
    }

    const delta = this.parent.game.clock.getDelta();
    this.world.timestep = Math.min(delta, 0.1);
    this.world.step();
  }

  dynamicBasicMeshAdd(options = {}) {
    // Configuration
    options = _.merge(
      {
        position: { x: 0, y: 0, z: 0 },
        rotation: { w: 0, x: 0, y: 0, z: 0 },
        geometry: {
          type: "box",
          radius: 1,
          length: 1,
          capSegments: 4,
          radialSegments: 8,
          heightSegments: 1,
          openEnded: false,
          thetaStart: 0,
          width: 1,
          height: 1,
          depth: 1,
          thetaLength: Math.PI * 2,
          radiusTop: 1,
          radiusBottom: 1,
          widthSegments: 32,
          heightSegments: 16,
          phiStart: 0,
          phiLength: Math.PI * 2,
        },
        material: {
          type: "basic",
          color: 0xffffff,
        },
        physics: {
          type: "dynamic",
          mass: 1,
        },
      },
      options
    );

    // Create geometry
    const geometry = (() => {
      let getOption = {
        box: () =>
          new THREE.BoxGeometry(
            options.geometry.width,
            options.geometry.height,
            options.geometry.depth
          ),
        capsule: () =>
          new THREE.CapsuleGeometry(
            options.geometry.radius,
            options.geometry.length,
            options.geometry.capSegments,
            options.geometry.radialSegments
          ),
        cone: () =>
          new THREE.ConeGeometry(
            options.geometry.radius,
            options.geometry.height,
            options.geometry.radialSegments,
            options.geometry.heightSegments,
            options.geometry.openEnded,
            options.geometry.thetaStart,
            options.geometry.thetaLength
          ),
        cylinder: () =>
          new THREE.CylinderGeometry(
            options.geometry.radiusTop,
            options.geometry.radiusBottom,
            options.geometry.height,
            options.geometry.radialSegments,
            options.geometry.heightSegments,
            options.geometry.openEnded,
            options.geometry.thetaStart,
            options.geometry.thetaLength
          ),
        plane: () =>
          new THREE.PlaneGeometry(
            options.geometry.width,
            options.geometry.height,
            options.geometry.widthSegments,
            options.geometry.heightSegments
          ),
        sphere: () =>
          new THREE.SphereGeometry(
            options.geometry.radius,
            options.geometry.widthSegments,
            options.geometry.heightSegments,
            options.geometry.phiStart,
            options.geometry.phiLength,
            options.geometry.thetaStart,
            options.geometry.thetaLength
          ),
      };

      if (typeof getOption[options.geometry.type] != "function") {
        throw new Error(`Geometry "${options.geometry.type}" does not exists`);
      }

      return getOption[options.geometry.type]();
    })();

    // Create material
    const material = (() => {
      const optionsMaterial = _.clone(options.material);
      delete optionsMaterial.type;

      let getOption = {
        basic: () => new THREE.MeshBasicMaterial(optionsMaterial),
        depth: () => new THREE.MeshDepthMaterial(optionsMaterial),
        lambert: () => new THREE.MeshLambertMaterial({ optionsMaterial }),
        matcap: () => new THREE.MeshMatcapMaterial({ optionsMaterial }),
        normal: () => new THREE.MeshNormalMaterial({ optionsMaterial }),
        phong: () => new THREE.MeshPhongMaterial({ optionsMaterial }),
        physical: () => new THREE.MeshPhysicalMaterial({ optionsMaterial }),
        standard: () => new THREE.MeshStandardMaterial({ optionsMaterial }),
        toon: () => new THREE.MeshToonMaterial({ optionsMaterial }),
      };

      if (typeof getOption[options.material.type] != "function") {
        throw new Error(`Material "${options.material.type}" does not exists`);
      }

      return getOption[options.material.type]();
    })();

    // Create mesh
    const mesh = ((geometry, material) => {
      let _mesh = new THREE.Mesh(geometry, material);
      _mesh.position.set(
        options.position.x,
        options.position.y,
        options.position.z
      );

      this.parent.game.scene.add(_mesh);
      return _mesh;
    })(geometry, material);

    // Create body
    const body = (() => {
      let getOption = {
        dynamic: () => RAPIER.RigidBodyDesc.dynamic(),
        fixed: () => RAPIER.RigidBodyDesc.fixed(),
      };

      if (typeof getOption[options.physics.type] != "function") {
        throw new Error(`Physics "${options.physics.type}" does not exists`);
      }

      let rigidBodyDesc = getOption[options.physics.type]()
        .setTranslation(
          options.position.x,
          options.position.y,
          options.position.z
        )
        .setRotation(options.rotation)
        .setCanSleep(false);

      return this.world.createRigidBody(rigidBodyDesc);
    })();

    // Create shape
    const shape = (() => {
      let getOption = {
        box: () => RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5),
        capsule: () => RAPIER.ColliderDesc.capsule(0.5, 0.2),
        cone: () => null,
        cylinder: () => null,
        plane: () => null,
        sphere: () => RAPIER.ColliderDesc.ball(1),
      };

      if (typeof getOption[options.geometry.type] != "function") {
        throw new Error(`Geometry "${options.geometry.type}" does not exists`);
      }

      const _shape = getOption[options.geometry.type]();

      if (!_shape) {
        throw new Error(`Undefined shape "${options.geometry.type}"`);
      }

      // return new RAPIER.ColliderDesc(_shape);
      return _shape.setMass(options.physics.mass).setRestitution(1.1);
    })();

    console.log(`
      geometry:  ${options.geometry.type}
      material:  ${options.material.type}
      physics:   ${options.physics.type}
        - mass:  ${options.physics.mass}
    `);

    return this.dynamicBodyAdd({ mesh, body, shape });
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

class Debug {
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
