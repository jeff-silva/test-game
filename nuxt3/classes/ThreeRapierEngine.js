import RAPIER from "@dimforge/rapier3d-compat";

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import _ from "lodash";

export class ThreeRapierEngine {
  constructor(options = {}) {
    this.options = {
      el: null,
      debug: false,
      assets: {},
      ...options,
    };
  }

  async init() {
    if (!this.options.el) throw new Error("options.el not defined");
    this.busy = true;

    this.THREE = THREE;
    this.RAPIER = RAPIER;

    await this.rapierInit();
    await this.threeInit();
    await this.helpersInit();

    this.input = new ThreeRapierInput(this);

    this.busy = false;

    this.create();
    this.update();
  }

  resize() {
    const oldSize = { width: this.width, height: this.height };
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.aspect = this.width / this.height;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    this.dispatch("resize", { oldSize });
  }

  create() {
    this.onCreate();
    this.dispatch("create");
  }

  update() {
    this.onUpdate();
    this.dispatch("update");

    if (this.debug) {
      this.debug.update();
    }

    this.scripts.map((script) => {
      script.onUpdate();
    });

    for (let uuid in this.rapierPhysics) {
      const { mesh, body, shape } = this.rapierPhysics[uuid];

      if (typeof body.translation == "function") {
        mesh.position.copy(body.translation());
      }
      if (typeof body.rotation == "function") {
        mesh.quaternion.copy(body.rotation());
      }
    }

    const delta = this.clock.getDelta();
    this.world.timestep = Math.min(delta, 0.1);
    this.world.step();

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.update());
    // setTimeout(() => this.update(), 1000);
  }

  async rapierInit() {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
    this.debug = null;

    if (this.options.debug) {
      setTimeout(() => {
        this.debug = new (class {
          constructor(engine) {
            this.engine = engine;
            this.mesh = new THREE.LineSegments(
              new THREE.BufferGeometry(),
              new THREE.LineBasicMaterial({
                color: 0xffffff,
                vertexColors: true,
              })
            );
            this.mesh.frustumCulled = false;
            this.engine.scene.add(this.mesh);
          }

          update() {
            const { vertices, colors } = this.engine.world.debugRender();
            this.mesh.geometry.setAttribute(
              "position",
              new THREE.BufferAttribute(vertices, 3)
            );
            this.mesh.geometry.setAttribute(
              "color",
              new THREE.BufferAttribute(colors, 4)
            );
          }
        })(this);
      }, 10);
    }
  }

  async threeInit() {
    this.canvas = document.querySelector(this.options.el);
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.aspect = this.width / this.height;
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 1000);
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // this.renderer.gammaOutput = true;
    // this.renderer.shadowMap.enabled = true;
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.canvas.innerHTML = "";
    this.canvas.style.position = "relative";
    this.canvas.style.minHeight = "100px";
    this.canvas.appendChild(this.renderer.domElement);

    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";

    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.assets = await this.assetsLoad();
  }

  helpers = {};
  async helpersInit() {
    this.helpers.Vec3 = (o = {}) => {
      o = JSON.parse(JSON.stringify(o));
      let r = new THREE.Vector3(o.x || 0, o.y || 0, o.z || 0);
      r.toArray = () => [r.x, r.y, r.z];
      r.toJson = () => ({ x: r.x, y: r.y, z: r.z });
      return r;
    };

    this.helpers.Quat = (o = {}) => {
      const r = new THREE.Quaternion(o.x || 0, o.y || 0, o.z || 0, o.w || 0);
      r.toArray = () => [r.x, r.y, r.z, r.w];
      r.toJson = () => ({ x: r.x, y: r.y, z: r.z, w: r.w });
      return r;
    };
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

  events = [];

  on(event, call) {
    this.events.push({ event, call });
  }

  dispatch(...args) {
    const event = args.shift();
    this.events.map((e) => {
      if (e.event != event) return;
      e.call(...args);
    });
  }

  uuid() {
    let d = _.now();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        let r = (d + _.random(16)) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
  }

  switch(option, options = {}, def = null) {
    return options[option] ? options[option]() : def;
  }

  threeMeshOptions(options = {}) {
    return _.merge(
      {
        geometry: {
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
        },
        material: {
          type: "basic",
          color: 0xffffff,
        },
        mesh: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 0 },
        },
      },
      options
    );
  }

  threeGetMesh(meshId) {
    let mesh = null;

    if (typeof meshId == "string") {
      mesh = this.scene.getObjectByName(meshId);

      if (!mesh) {
        mesh = this.scene.getObjectById(meshId);
      }
    } else {
      mesh = meshId;
    }

    return mesh || null;
  }

  threeMesh(options = {}) {
    options = this.threeMeshOptions(options);

    const geometry = this.switch(options.geometry.type, {
      box: () => {
        return new THREE.BoxGeometry(
          options.geometry.width,
          options.geometry.height,
          options.geometry.depth
        );
      },
      capsule: () => {
        return new THREE.CapsuleGeometry(
          options.geometry.radius,
          options.geometry.length,
          options.geometry.capSegments,
          options.geometry.radialSegments
        );
      },
      cone: () => {
        return new THREE.ConeGeometry(
          options.geometry.radius,
          options.geometry.height,
          options.geometry.radialSegments,
          options.geometry.heightSegments,
          options.geometry.openEnded,
          options.geometry.thetaStart,
          options.geometry.thetaLength
        );
      },
      cylinder: () => {
        return new THREE.CylinderGeometry(
          options.geometry.radiusTop,
          options.geometry.radiusBottom,
          options.geometry.height,
          options.geometry.radialSegments,
          options.geometry.heightSegments,
          options.geometry.openEnded,
          options.geometry.thetaStart,
          options.geometry.thetaLength
        );
      },
      plane: () => {
        return new THREE.PlaneGeometry(
          options.geometry.width,
          options.geometry.height,
          options.geometry.widthSegments,
          options.geometry.heightSegments
        );
      },
      sphere: () => {
        return new THREE.SphereGeometry(
          options.geometry.radius,
          options.geometry.widthSegments,
          options.geometry.heightSegments,
          options.geometry.phiStart,
          options.geometry.phiLength,
          options.geometry.thetaStart,
          options.geometry.thetaLength
        );
      },
    });

    let optionsMaterial = { ...options.material };
    delete optionsMaterial.type;
    const material = this.switch(options.material.type, {
      basic: () => new THREE.MeshBasicMaterial(optionsMaterial),
      depth: () => new THREE.MeshDepthMaterial(optionsMaterial),
      lambert: () => new THREE.MeshLambertMaterial(optionsMaterial),
      matcap: () => new THREE.MeshMatcapMaterial(optionsMaterial),
      normal: () => new THREE.MeshNormalMaterial(optionsMaterial),
      phong: () => new THREE.MeshPhongMaterial(optionsMaterial),
      physical: () => new THREE.MeshPhysicalMaterial(optionsMaterial),
      standard: () => new THREE.MeshStandardMaterial(optionsMaterial),
      toon: () => new THREE.MeshToonMaterial(optionsMaterial),
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      options.mesh.position.x || 0,
      options.mesh.position.y || 0,
      options.mesh.position.z || 0
    );
    mesh.quaternion.set(
      options.mesh.rotation.x || 0,
      options.mesh.rotation.y || 0,
      options.mesh.rotation.z || 0,
      options.mesh.rotation.w || 0
    );

    return mesh;
  }

  rapierPhysicsOptions(options = {}) {
    return _.merge(
      {
        canSleep: false,
        restitution: 0.5,
        mass: 1,
        friction: 0.5,
        sensor: false,
        linvel: { x: 0, y: 0, z: 0 },
        angvel: { x: 0, y: 0, z: 0 },
      },
      options
    );
  }

  rapierBody(options) {
    options = _.merge(
      this.rapierPhysicsOptions(),
      {
        type: "dynamic",
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
      options
    );

    let rigidBodyDesc = this.switch(options.type, {
      dynamic: () => {
        return RAPIER.RigidBodyDesc.dynamic();
      },
      fixed: () => {
        return RAPIER.RigidBodyDesc.fixed();
      },
      kinematicVelocityBased: () => {
        return RAPIER.RigidBodyDesc.kinematicVelocityBased();
      },
      kinematicPositionBased: () => {
        return RAPIER.RigidBodyDesc.kinematicPositionBased();
      },
    });

    return this.world.createRigidBody(
      rigidBodyDesc
        .setTranslation(
          options.position.x || 0,
          options.position.y || 0,
          options.position.z || 0
        )
        .setRotation(options.rotation)
        .setCanSleep(options.canSleep)
        .setLinvel(options.linvel.x, options.linvel.y, options.linvel.z)
        .setAngvel(options.angvel)
    );
  }

  rapierShape(options) {
    options = _.merge(
      {
        type: "box",
        geometry: { width: 1, height: 1, depth: 1, length: 1, radius: 1 },
        mesh: null,
      },
      this.rapierPhysicsOptions(options)
    );

    if (options.type == "trimesh") {
      if (!options.mesh) {
        throw new Error(`"mesh" param is required for type "trimesh"`);
      }
      if (!options.mesh.isMesh) {
        throw new Error(`Param "mesh.isMesh" is false. This need to be true`);
      }
    }

    const geometry = options.geometry;
    let shape =
      typeof options.type == "function"
        ? options.type(this, options)
        : this.switch(options.type, {
            box: () => {
              return RAPIER.ColliderDesc.cuboid(
                geometry.width,
                geometry.height,
                geometry.depth
              );
            },
            capsule: () => {
              return RAPIER.ColliderDesc.capsule(
                geometry.length / 2,
                geometry.radius
              );
            },
            cone: () => null,
            cylinder: () => null,
            plane: () => null,
            sphere: () => {
              return RAPIER.ColliderDesc.ball(geometry.radius);
            },
            trimesh: () => {
              // const geometry2 = options.mesh.geometry.clone();
              // geometry2.applyMatrix4(options.mesh.matrixWorld);
              // geometry2.computeVertexNormals();
              // let vertices = geometry2.attributes.position.array;
              // let indices = geometry2.index.array;

              // return RAPIER.ColliderDesc.trimesh(
              //   new Float32Array(new Float32Array(vertices)),
              //   new Uint32Array(new Uint32Array(indices))
              // ).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

              const geometry2 = options.mesh.geometry.clone();
              geometry2.applyMatrix4(options.mesh.matrix);
              geometry2.computeVertexNormals();

              let vertices = new Float32Array(
                geometry2.attributes.position.array
              );
              let indexes = new Float32Array(geometry2.index.array);

              // for (let i = 1; i < vertices.length; i += 3) {
              //   vertices[i] += 18;
              // }

              return RAPIER.ColliderDesc.trimesh(
                vertices,
                indexes
              ).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
            },
          });

    if (!shape) {
      throw new Error(`Undefined shape "${geometry.type}"`);
    }

    return shape
      .setMass(options.mass)
      .setRestitution(options.restitution)
      .setFriction(options.friction)
      .setSensor(options.sensor);
  }

  rapierPhysics = {};
  rapierPhysicsAdd(mesh, body, shape) {
    const uuid = this.uuid();
    const collider = this.world.createCollider(shape, body);
    const item = { uuid, mesh, body, shape, collider };
    this.rapierPhysics[uuid] = item;
    return item;
  }

  rapierPhysicsApply(mesh, bodyType, meshType, options = {}) {
    mesh = this.threeGetMesh(mesh);
    if (!mesh) throw new Error("Mesh not found");

    options = this.rapierPhysicsOptions(options);

    let body = this.rapierBody({
      type: bodyType,
      ...options,
      position: {
        x: mesh.position.x,
        y: mesh.position.y,
        z: mesh.position.z,
      },
      rotation: {
        x: mesh.rotation.x,
        y: mesh.rotation.y,
        z: mesh.rotation.z,
        w: mesh.rotation.w || 1,
      },
    });

    let shape = this.rapierShape({ type: meshType, ...options, mesh });
    return this.rapierPhysicsAdd(mesh, body, shape);
  }

  characterCameraControllerCreate(options = {}) {
    return new CharacterCameraController(this, options);
  }

  getOrbitControls() {
    let orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );

    this.on("update", () => {
      orbitControls.update();
    });

    return orbitControls;
  }

  scripts = [];
  scriptAttach(theClass, meshes) {
    meshes = Array.isArray(meshes) ? meshes : [meshes];
    meshes = meshes
      .map((mesh) => {
        if (typeof mesh == "string") {
          mesh = this.scene.getObjectByName(mesh);
        }

        if (mesh) {
          mesh = new theClass(this, mesh);
          this.scripts.push(mesh);
          mesh.onCreate();
        }

        return mesh;
      })
      .filter((m) => !!m);

    return meshes;
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

export class ThreeRapierScript {
  constructor(engine, mesh) {
    this.engine = engine;
    this.mesh = mesh;
  }

  onCreate() {}
  onUpdate() {}
}

class ThreeRapierInput {
  constructor(engine) {
    this.engine = engine;
    this.keyboardData = {};
    this.events = [];
    this.keyboardEventsInit();
    this.events.map(({ evt, call }) => {
      document.addEventListener(evt, (ev) => {
        ev.preventDefault();
        call(ev);
      });
    });

    this.engine.on("update", () => {
      for (let attr in this.keyboardData) {
        const ev = this.keyboardData[attr];
        if (ev.type == "keyup") delete this.keyboardData[attr];
      }
    });
  }

  on(evts, call) {
    (Array.isArray(evts) ? evts : [evts]).map((evt) => {
      this.events.push({ evt, call });
    });
  }

  keyboardEventsInit() {
    this.on(["keydown", "keyup"], (ev) => {
      this.keyboardData[ev.key] = ev;
      this.keyboardData[ev.code] = ev;
    });
  }

  keyboard(keys, types = []) {
    keys = Array.isArray(keys) ? keys : [keys];
    types = Array.isArray(types) ? types : [types];

    for (let i in keys) {
      const key = keys[i];
      if (typeof this.keyboardData[key] == "undefined") return;
      const ev = this.keyboardData[key];

      if (types.length > 0) {
        for (let t in types) {
          if (ev.type == types[t]) {
            return ev;
          }
        }
        return null;
      }

      return ev;
    }

    return null;
  }
}

class CharacterCameraController {
  constructor(engine, options) {
    this.engine = engine;

    this.options = _.merge(
      {
        input: {
          forward: ["w"],
          backward: ["s"],
          left: ["a"],
          right: ["d"],
          jump: ["Space"],
        },
        camera: {
          type: "first",
        },
        mouse: {
          sensitivity: 0.5,
        },
        player: {
          speed: 0.2,
          jumpForce: 0.7,
          position: { x: 0, y: 0, z: 0 },
          mesh: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
          },
        },
      },
      options
    );

    this.controller = engine.world.createCharacterController(0.01);
    this.controller.setSlideEnabled(true); // Allow sliding down hill
    this.controller.setMaxSlopeClimbAngle((45 * Math.PI) / 180); // Don’t allow climbing slopes larger than 45 degrees.
    this.controller.setMinSlopeSlideAngle((30 * Math.PI) / 180); // Automatically slide down on slopes smaller than 30 degrees.
    this.controller.enableAutostep(0.5, 0.2, true); // (maxHeight, minWidth, includeDynamicBodies) Stair behavior
    this.controller.enableSnapToGround(0.5); // (distance) Set ground snap behavior
    this.controller.setApplyImpulsesToDynamicBodies(true); // Add push behavior
    this.controller.setCharacterMass(10);

    this.player = {
      mesh: this.engine.threeMesh({
        material: { type: "basic", color: 0xff0000 },
        geometry: { type: "capsule", radius: 1, length: 1.7 },
        mesh: this.options.player.mesh,
      }),
      body: this.engine.rapierBody({
        type: "kinematicPositionBased",
        position: this.options.player.mesh.position,
        rotation: this.options.player.mesh.rotation,
      }),
      shape: this.engine.rapierShape({
        type: "capsule",
        radius: 1,
        length: 1.7,
      }),
      collider: null,
    };

    this.engine.scene.add(this.player.mesh);

    this.player = this.engine.rapierPhysicsAdd(
      this.player.mesh,
      this.player.body,
      this.player.shape
    );

    // Player variables
    this.player.speed = 0;
    this.player.gravity = 0;
    this.player.grounded = false;

    this.cameraType = this.cameraTypeSet(this.options.camera.type);
    this.engine.on("update", () => {
      const { Vec3, Quat } = this.engine.helpers;

      this.player.speed = 0;
      this.player.grounded = this.controller.computedGrounded();
      this.player.gravity = this.player.grounded
        ? 0
        : Math.max(-9.2, this.player.gravity - 0.05);

      let charDirection = Vec3();
      let charMoveFront = Vec3();
      let charMoveRight = Vec3();

      if (this.engine.input.keyboard(this.options.input.forward)) {
        charMoveFront.z = 1;
      }

      if (this.engine.input.keyboard(this.options.input.backward)) {
        charMoveFront.z = -1;
      }

      if (this.engine.input.keyboard(this.options.input.left)) {
        charMoveFront.x = 1;
      }

      if (this.engine.input.keyboard(this.options.input.right)) {
        charMoveFront.x = -1;
      }

      if (this.engine.input.keyboard(this.options.input.jump)) {
        if (this.player.grounded) {
          this.player.gravity += this.options.player.jumpForce;
        }
      }

      charDirection
        .subVectors(charMoveFront, charMoveRight)
        .normalize()
        .multiplyScalar(this.options.player.speed * -1);

      const cameraWorldDirection = this.engine.camera.getWorldDirection(
        new THREE.Vector3()
      );

      const cameraYaw = Math.atan2(
        cameraWorldDirection.x,
        cameraWorldDirection.z
      );

      charDirection
        .applyAxisAngle(Vec3({ x: 0, y: 1, z: 0 }), cameraYaw)
        .multiplyScalar(-1);

      const charMoveDirection = {
        x: charDirection.x,
        y: this.player.gravity,
        z: charDirection.z,
      };

      this.controller.computeColliderMovement(
        this.player.collider,
        charMoveDirection
      );

      this.player.body.setNextKinematicTranslation(
        Vec3()
          .copy(this.player.body.translation())
          .add(this.controller.computedMovement())
      );

      this.cameraType.onUpdate();
    });
  }

  cameraTypes() {
    return {
      first: CharacterCameraControllerFirst,
      third: CharacterCameraControllerThird,
      fixed: CharacterCameraControllerFixed,
    };
  }

  cameraTypeSet(mode) {
    this.options.camera.type = mode;
    mode = this.cameraTypes()[mode];
    mode = new mode(this);
    return mode;
  }
}

// First person view
class CharacterCameraControllerFirst {
  constructor(characterController) {
    this.camera = characterController.engine.camera;
    this.characterController = characterController;
    this.onCreate();
  }

  set(type) {
    this.characterController.cameraType =
      this.characterController.cameraTypeSet(type);
  }

  onCreate() {
    if (!this.camera.parent) {
      this.characterController.player.mesh.attach(this.camera);
    }
    this.camera.position.set(0, 1.7, 0);
    this.camera.rotation.set(0, 0, 0);
  }

  onUpdate() {
    //
  }
}

// Third person view
class CharacterCameraControllerThird extends CharacterCameraControllerFirst {
  onCreate() {
    if (!this.camera.parent) {
      this.characterController.player.mesh.attach(this.camera);
    }
    this.camera.position.set(0, 4, 10);
    this.camera.rotation.set(-0.4, 0, 0);
  }
}

// Vixed camera view
class CharacterCameraControllerFixed extends CharacterCameraControllerFirst {
  onCreate() {
    if (!this.camera.parent) {
      this.characterController.player.mesh.attach(this.camera);
    }
    this.camera.position.set(0, 25, 25);
    this.camera.rotation.set(-0.8, 0, 0);
  }
}
