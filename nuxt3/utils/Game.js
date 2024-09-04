import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { AmmoPhysics } from "@enable3d/ammo-physics";
import { PhysicsLoader } from "enable3d";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export const Game = class Game {
  target = null;

  canvas = {
    target: null,
    width: 0,
    height: 0,
  };

  assets = {
    progress: 0,
    items: {},
    manager: null,
  };

  game = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    physics: null,
  };

  scripts = {
    items: [],
  };

  constructor() {
    this.inputInit();

    onMounted(() => {
      this.canvasInit();
      this.gameInit(() => {
        this.assetsInit();
      });
    });
  }

  inputInit() {
    ["keyup", "keydown", "mousemove", "click"].map((evt) => {
      document.addEventListener(evt, (event) => {
        const scopeParams = this.getScope({ event });
        this.onInput(scopeParams);
        this.scripts.items.map((script) => {
          script.onInput(scopeParams);
        });
      });
    });
  }

  canvasInit() {
    this.canvas.target = document.querySelector(this.target);
    this.canvas.width = this.canvas.target.offsetWidth;
    this.canvas.height = this.canvas.target.offsetHeight;

    window.addEventListener("resize", () => {
      this.canvas.width = this.canvas.target.offsetWidth;
      this.canvas.height = this.canvas.target.offsetHeight;
    });
  }

  assetsInit(onSuccess = () => null) {
    this.assets.manager = new THREE.LoadingManager();

    this.assets.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const managerProgress = {
        progress: (itemsLoaded / itemsTotal) * 100,
        url,
        itemsLoaded,
        itemsTotal,
      };
      this.assets.progress = managerProgress.progress;
      this.onLoadProgress(this.getScope({ managerProgress }));
    };

    this.assets.manager.onLoad = () => {
      const managerProgress = { progress: 100 };
      this.onLoadProgress(this.getScope({ managerProgress }));
      onSuccess();
    };

    const modelLoaders = {
      gltf: (name, loadedItem, manager) => {
        return new GLTFLoader(manager).load(loadedItem.url, (gltf) => {
          loadedItem.loaded = true;
          loadedItem.model = gltf;
          loadedItem.onLoad(this.getScope({ loadedItem }));
        });
      },
    };

    Object.entries(this.assets.items).map(([name, item]) => {
      const ext = item.url.split("?").at(0).split(".").at(-1);
      modelLoaders[ext](name, item, this.assets.manager);
    });
  }

  assetAdd(name, data = {}) {
    this.assets.items[name] = {
      loaded: false,
      name,
      onLoad: (scope) => null,
      ...data,
    };
  }

  targetSet(selector) {
    this.target = selector;
  }

  getScope(merge = {}) {
    return {
      THREE,
      ...this,
      ...merge,
    };
  }

  gameInit(onSuccess = () => null) {
    PhysicsLoader("/assets/threejs/ammo", async () => {
      this.game.scene = new THREE.Scene();
      this.game.camera = new THREE.PerspectiveCamera(
        50,
        this.canvas.width / this.canvas.height,
        1,
        1000
      );
      this.game.clock = new THREE.Clock();

      this.game.physics = new AmmoPhysics(this.game.scene);
      this.game.physics.debug.enable();
      this.game.physics.debug.mode(1);

      this.game.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.canvas.target.appendChild(this.game.renderer.domElement);
      this.game.renderer.domElement.style.width = "100%";
      this.game.renderer.domElement.style.height = "100%";

      onSuccess();
      this.onCreate(this.getScope());

      const updateHandler = () => {
        this.scripts.items.map((script) => {
          script.onUpdate(this.getScope());
        });

        this.game.physics.updateDebugger();
        this.game.physics.update(this.game.clock.getDelta() * 1000);
        this.game.renderer.render(this.game.scene, this.game.camera);
        requestAnimationFrame(updateHandler);
      };
      requestAnimationFrame(updateHandler);
    });
  }

  scriptAttach(script) {
    this.scripts.items.push(script);
    script.parent = this;
    script.onCreate(this.getScope());
  }

  pointerLockControls() {
    return new PointerLockControls(this.game.camera, this.canvas.target);
  }

  onLoadProgress(scope) {}
  onLoadSuccess(scope) {}
  onCreate(scope) {}
  onUpdate(scope) {}
  onInput(scope) {}
};

export const Script = class Script {
  name = null;
  object = null;
  parent = null;
  constructor(object) {
    this.object = object;
  }
  onCreate(scope) {}
  onUpdate(scope) {}
  onInput(scope) {}
};
