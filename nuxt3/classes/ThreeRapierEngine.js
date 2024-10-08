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

    this.Vec3 = (x, y = 0, z = 0) => {
      if (Array.isArray(x)) {
        [x, y, z] = [x[0], x[1], x[2]];
      } else if (typeof x == "object") {
        [x, y, z] = [x.x, x.y, x.z];
      }
      return new THREE.Vector3(x, y, z);
    };

    this.Quat = (x, y = 0, z = 0, w = 0) => {
      if (Array.isArray(x)) {
        [x, y, z, w] = [x[0], x[1], x[2], x[3]];
      } else if (typeof x == "object") {
        [x, y, z, w] = [x.x, x.y, x.z, x.w];
      }
      return new THREE.Quaternion(x, y, z, w);
    };

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

    for (let uuid in this.rapierPhysicsData) {
      const { mesh, body, shape } = this.rapierPhysicsData[uuid];

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
        body: "dynamic",
        shape: "box",
        canSleep: false,
        restitution: 0.5,
        mass: 1,
        friction: 0.5,
        sensor: false,
        linvel: { x: 0, y: 0, z: 0 },
        angvel: { x: 0, y: 0, z: 0 },
        mesh: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        geometry: {
          width: 1,
          height: 1,
          depth: 1,
          length: 1,
          radius: 1,
        },
      },
      options
    );
  }

  rapierBody(options) {
    options = this.rapierPhysicsOptions(options);

    let rigidBodyDesc =
      typeof options.body == "function"
        ? options.body(this, options)
        : this.switch(options.body, {
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

    // const bodyRotation = new THREE.Quaternion().setFromAxisAngle(
    //   new Vector3(options.rotation.x, options.rotation.y, options.rotation.z),
    //   -Math.PI / 2
    // );

    return this.world.createRigidBody(
      rigidBodyDesc
        .setCanSleep(options.canSleep)
        .setLinvel(options.linvel.x, options.linvel.y, options.linvel.z)
        .setAngvel(options.angvel)
        .setRotation(options.rotation)
        .setTranslation(
          options.position.x || 0,
          options.position.y || 0,
          options.position.z || 0
        )
    );
  }

  rapierShape(options) {
    options = this.rapierPhysicsOptions(options);

    if (
      typeof options.shape == "string" &&
      ["trimesh", "convexMesh"].includes(options.shape)
    ) {
      if (!options.mesh) {
        throw new Error(`"mesh" param is required for type "trimesh"`);
      }
      if (!options.mesh.isMesh) {
        throw new Error(`Param "mesh.isMesh" is false. This need to be true`);
      }
    }

    const geometry = options.geometry;
    let shape =
      typeof options.shape == "function"
        ? options.shape(this, options)
        : this.switch(options.shape, {
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
            // cone: () => null,
            cylinder: () => {
              return RAPIER.ColliderDesc.cylinder(1, 1);
            },
            plane: () => null,
            sphere: () => {
              return RAPIER.ColliderDesc.ball(geometry.radius);
            },
            convexMesh: () => {
              const geometry2 = options.mesh.geometry.clone();
              geometry2.applyMatrix4(options.mesh.matrix);
              geometry2.computeVertexNormals();
              let vertices = geometry2.attributes.position.array;
              return RAPIER.ColliderDesc.convexMesh(new Float32Array(vertices));
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
              let vertices = geometry2.attributes.position.array;
              let indexes = geometry2.index.array;
              return RAPIER.ColliderDesc.trimesh(
                new Float32Array(vertices),
                new Float32Array(indexes)
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
      .setSensor(options.sensor)
      .setRotation(options.rotation)
      .setTranslation(
        options.position.x || 0,
        options.position.y || 0,
        options.position.z || 0
      );
  }

  rapierPhysicsData = {};
  rapierPhysicsAdd(mesh, body, shape) {
    const uuid = this.uuid();
    const collider = this.world.createCollider(shape, body);
    const item = { uuid, mesh, body, shape, collider };
    this.rapierPhysicsData[uuid] = item;
    return item;
  }

  rapierPhysicsApply(options = {}) {
    options = this.rapierPhysicsOptions(options);
    options.mesh = this.threeGetMesh(options.mesh);

    let mesh = options.mesh;
    let body = this.rapierBody(options);
    let shape = this.rapierShape(options);

    return this.rapierPhysicsAdd(mesh, body, shape);
  }

  rapierCarPhysicsApply(options = {}) {
    options = _.merge(
      {
        chassi: null,
        wheelFL: null,
        wheelFR: null,
        wheelBL: null,
        wheelBR: null,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      options
    );

    let chassi = { mesh: this.threeGetMesh(options.chassi) };
    chassi.body = this.rapierBody({ body: "dynamic", mesh: chassi.mesh });
    chassi.shape = this.rapierShape({
      body: "convexMesh",
      mesh: chassi.mesh,
      geometry: { width: 2, height: 0.5 },
      position: options.position,
      rotation: options.rotation,
    });

    this.rapierPhysicsAdd(chassi.mesh, chassi.body, chassi.shape);

    const dist1 = 10;
    const dist2 = 10;
    const dist3 = 2;
    let wheels = {
      wheelFL: {
        mesh: this.threeGetMesh(options.wheelFL),
        revoluteArgs: [
          this.Vec3(-dist1, 0, -dist2),
          this.Vec3(0, 0, 0),
          this.Vec3(dist3, 0, 0),
        ],
      },
      wheelFR: {
        mesh: this.threeGetMesh(options.wheelFR),
        revoluteArgs: [
          this.Vec3(dist1, 0, -dist2),
          this.Vec3(0, 0, 0),
          this.Vec3(dist3, 0, 0),
        ],
      },
      wheelBL: {
        mesh: this.threeGetMesh(options.wheelBL),
        revoluteArgs: [
          this.Vec3(-dist1, 0, dist2),
          this.Vec3(0, 0, 0),
          this.Vec3(-dist3, 0, 0),
        ],
      },
      wheelBR: {
        mesh: this.threeGetMesh(options.wheelBR),
        revoluteArgs: [
          this.Vec3(dist1, 0, dist2),
          this.Vec3(0, 0, 0),
          this.Vec3(-dist3, 0, 0),
        ],
      },
    };

    for (let wheelName in wheels) {
      let wheel = wheels[wheelName];

      wheel.mesh.removeFromParent();
      wheel.body = this.rapierBody({ body: "dynamic", mesh: wheel.mesh });
      wheel.shape = this.rapierShape({ shape: "cylinder", mesh: wheel.mesh });

      // this.world.createImpulseJoint(
      //   this.RAPIER.JointData.revolute(...wheel.revoluteArgs),
      //   chassi.body,
      //   wheel.body,
      //   true
      // );

      this.rapierPhysicsAdd(wheel.mesh, wheel.body, wheel.shape);
    }

    console.log(chassi);
    console.log(wheels);
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

    const playerMesh = this.engine.threeMesh({
      material: { type: "basic", color: 0xff0000 },
      geometry: { type: "capsule", radius: 1, length: 1.7 },
      mesh: this.options.player.mesh,
    });

    this.engine.scene.add(playerMesh);
    this.player = this.engine.rapierPhysicsApply(playerMesh, {
      position: this.options.player.mesh.position,
      rotation: this.options.player.mesh.rotation,
      body: "kinematicPositionBased",
      shape: "capsule",
      radius: 1,
      length: 1.7,
    });

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
