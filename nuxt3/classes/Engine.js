import RAPIER from "@dimforge/rapier3d-compat";

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import _ from "lodash";

_.mixin({
  uuid: () => {
    var d = _.now();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (d + _.random(16)) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
  },
});

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
      if (ev.code == "Space") {
        ev.preventDefault();
      }
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
  dynamicBodies = {};

  onCreate() {
    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

    if (this.parent.options.debug) {
      this.debug = new Debug(this.parent.game.scene, this.world);
    }
  }

  onUpdate() {
    for (let uuid in this.dynamicBodies) {
      const { mesh, body, shape } = this.dynamicBodies[uuid];
      if (!body) return;
      if (typeof body.translation == "function") {
        mesh.position.copy(body.translation());
      }
      if (typeof body.rotation == "function") {
        mesh.quaternion.copy(body.rotation());
      }
    }

    if (this.parent.options.debug && this.debug && this.world) {
      this.debug.update();
    }

    const delta = this.parent.game.clock.getDelta();
    this.world.timestep = Math.min(delta, 0.1);
    this.world.step();
  }

  getThreejsGeometryOptions(options = {}) {
    return {
      type: "box",
      radius: 1,
      length: 1,
      capSegments: 4,
      radialSegments: 8,
      heightSegments: 16,
      openEnded: false,
      thetaStart: 0,
      width: 1,
      height: 1,
      depth: 1,
      thetaLength: Math.PI * 2,
      radiusTop: 1,
      radiusBottom: 1,
      widthSegments: 32,
      phiStart: 0,
      phiLength: Math.PI * 2,
      ...options,
    };
  }

  getThreejsGeometry(options = {}) {
    options = this.getThreejsGeometryOptions(options);
    return {
      box: (options = {}) => {
        return new THREE.BoxGeometry(
          options.width,
          options.height,
          options.depth
        );
      },
      capsule: (options = {}) => {
        return new THREE.CapsuleGeometry(
          options.radius,
          options.length,
          options.capSegments,
          options.radialSegments
        );
      },
      cone: (options = {}) => {
        return new THREE.ConeGeometry(
          options.radius,
          options.height,
          options.radialSegments,
          options.heightSegments,
          options.openEnded,
          options.thetaStart,
          options.thetaLength
        );
      },
      cylinder: (options = {}) => {
        return new THREE.CylinderGeometry(
          options.radiusTop,
          options.radiusBottom,
          options.height,
          options.radialSegments,
          options.heightSegments,
          options.openEnded,
          options.thetaStart,
          options.thetaLength
        );
      },
      plane: (options = {}) => {
        return new THREE.PlaneGeometry(
          options.width,
          options.height,
          options.widthSegments,
          options.heightSegments
        );
      },
      sphere: (options = {}) => {
        return new THREE.SphereGeometry(
          options.radius,
          options.widthSegments,
          options.heightSegments,
          options.phiStart,
          options.phiLength,
          options.thetaStart,
          options.thetaLength
        );
      },
    }[options.type](options);
  }

  getThreejsMaterialOptions(options = {}) {
    return {
      type: "basic",
      color: 0xffffff,
      ...options,
    };
  }

  getThreejsMaterial(options = {}) {
    options = this.getThreejsMaterialOptions(options);

    const opts = _.clone(options);
    delete opts.type;

    return {
      basic: (options = {}) => new THREE.MeshBasicMaterial(options),
      depth: (options = {}) => new THREE.MeshDepthMaterial(options),
      lambert: (options = {}) => new THREE.MeshLambertMaterial(options),
      matcap: (options = {}) => new THREE.MeshMatcapMaterial(options),
      normal: (options = {}) => new THREE.MeshNormalMaterial(options),
      phong: (options = {}) => new THREE.MeshPhongMaterial(options),
      physical: (options = {}) => new THREE.MeshPhysicalMaterial(options),
      standard: (options = {}) => new THREE.MeshStandardMaterial(options),
      toon: (options = {}) => new THREE.MeshToonMaterial(options),
    }[options.type](opts);
  }

  getThreejsMesh(geometry, material, options = {}) {
    options = _.merge(
      {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 0 },
      },
      options
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      options.position.x || 0,
      options.position.y || 0,
      options.position.z || 0
    );
    mesh.quaternion.set(
      options.rotation.x || 0,
      options.rotation.y || 0,
      options.rotation.z || 0,
      options.rotation.w || 0
    );
    return mesh;
  }

  getRapierPhysicsOptions(options = {}) {
    return _.merge(
      {
        type: "dynamic",
        canSleep: false,
        restitution: 1.1,
        mass: 1,
        friction: 0.5,
        sensor: false,
        linvel: { x: 0, y: 0, z: 0 },
        angvel: { x: 0, y: 0, z: 0 },
      },
      options
    );
  }

  getRapierBody(options = {}, position = {}, rotation = {}) {
    options = this.getRapierPhysicsOptions(options);

    let rigidBodyDesc = {
      dynamic: (options = {}) => {
        return RAPIER.RigidBodyDesc.dynamic();
      },
      fixed: (options = {}) => {
        return RAPIER.RigidBodyDesc.fixed();
      },
      kinematicVelocityBased: (options = {}) => {
        return RAPIER.RigidBodyDesc.kinematicVelocityBased();
      },
      kinematicPositionBased: (options = {}) => {
        return RAPIER.RigidBodyDesc.kinematicPositionBased();
      },
    }[options.type](options);

    return this.world.createRigidBody(
      rigidBodyDesc
        .setTranslation(position.x || 0, position.y || 0, position.z || 0)
        .setRotation({ x: 0, y: 0, z: 0, w: 0, ...rotation })
        .setCanSleep(options.canSleep)
        .setLinvel(options.linvel.x, options.linvel.y, options.linvel.z)
        .setAngvel(options.angvel)
    );
  }

  getRapierShape(options = {}, geometry = {}) {
    options = this.getRapierPhysicsOptions(options);
    geometry = this.getThreejsGeometryOptions(geometry);

    let _shape = {
      box: (geometry = {}) => {
        return RAPIER.ColliderDesc.cuboid(
          geometry.width / 2,
          geometry.height / 2,
          geometry.depth / 2
        );
      },
      capsule: (geometry = {}) => {
        return RAPIER.ColliderDesc.capsule(
          geometry.length / 2,
          geometry.radius
        );
      },
      cone: (geometry = {}) => null,
      cylinder: (geometry = {}) => null,
      plane: (geometry = {}) => null,
      sphere: (geometry = {}) => {
        return RAPIER.ColliderDesc.ball(geometry.radius);
      },
    }[geometry.type](geometry);

    if (!_shape) {
      throw new Error(`Undefined shape "${geometry.type}"`);
    }

    return _shape
      .setMass(options.mass)
      .setRestitution(options.restitution)
      .setFriction(options.friction)
      .setSensor(options.sensor);
  }

  basicMeshAdd(options = {}) {
    // Configuration
    options = _.merge(
      {
        position: { x: 0, y: 0, z: 0 },
        rotation: { w: 0, x: 0, y: 0, z: 0 },
        geometry: this.getThreejsGeometryOptions(),
        material: this.getThreejsMaterialOptions(),
        physics: this.getRapierPhysicsOptions(),
      },
      options
    );

    const geometry = this.getThreejsGeometry(options.geometry);
    const material = this.getThreejsMaterial(options.material);
    const mesh = this.getThreejsMesh(geometry, material, options);
    this.parent.game.scene.add(mesh);

    const body = this.getRapierBody(
      options.physics,
      options.position,
      options.rotation
    );

    const shape = this.getRapierShape(options.physics, options.geometry);

    const r = this.dynamicBodyAdd({ mesh, body, shape });
    console.log(`
      uuid:      ${r.uuid}
      geometry:  ${options.geometry.type}
      material:  ${options.material.type}
      physics:   ${options.physics.type}
        - mass:  ${options.physics.mass}
    `);
    return r;
  }

  applyPhysicsBodyTrimesh(options = {}) {
    options = _.merge(
      {
        object: null,
        physics: this.getRapierPhysicsOptions(),
        filter: (mesh) => true,
      },
      options
    );

    options.object.traverse((mesh) => {
      if (!mesh.isMesh) return;
      if (!options.filter(mesh)) return;

      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);
      geometry.computeVertexNormals();
      let vertices = geometry.attributes.position.array;
      let indices = geometry.index.array;

      const body = this.getRapierBody(
        options.physics,
        {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
        },
        {
          x: mesh.quaternion.x,
          y: mesh.quaternion.y,
          z: mesh.quaternion.z,
          w: mesh.quaternion.w,
        }
      );

      let shape = RAPIER.ColliderDesc.trimesh(
        new Float32Array(new Float32Array(vertices)),
        new Uint32Array(new Uint32Array(indices))
      ).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

      this.dynamicBodyAdd({ mesh, body, shape });
    });
  }

  dynamicBodyAdd({ mesh, body, shape }) {
    const uuid = _.uuid();
    const collider = this.world.createCollider(shape, body);
    const item = { uuid, mesh, body, shape, collider };
    this.dynamicBodies[uuid] = item;
    return item;
  }

  dynamicBodyRemove(uuid) {
    delete this.dynamicBodies[uuid];
  }

  // https://sketches.isaacmason.com/sketch/recast-navigation/rigid-body-agent
  // https://github.com/isaac-mason/sketches/blob/main/sketches/recast-navigation/rigid-body-agent/src/player.tsx#L145
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
