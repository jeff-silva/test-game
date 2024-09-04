import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { AmmoPhysics } from "@enable3d/ammo-physics";
import { PhysicsLoader } from "enable3d";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

class Base {
  events = [];

  on(name, callback) {
    this.events.push({ name, callback });
  }

  dispatch(...args) {
    const name = args.shift();
    this.events
      .filter((e) => e.name == name)
      .map(({ name, callback }) => {
        callback.apply(this, args);
      });
  }
}

export const Game = class Game extends Base {
  options = {};

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

  constructor(options = {}) {
    super();

    this.options = {
      el: null,
      ...options,
    };

    this.inputInit();

    onMounted(() => {
      this.canvasInit(() => {
        this.gameInit(() => {
          this.assetsInit();
        });
      });
    });
  }

  inputInit() {
    ["keyup", "keydown", "mousemove", "click"].map((evt) => {
      document.addEventListener(evt, (event) => {
        const keyboard = (evt, keys = [], call = () => null) => {
          if (evt == event.type) {
            if (keys.length && (event.key || event.code || event.keyCode)) {
              if (
                keys.includes(event.key) ||
                keys.includes(event.code) ||
                keys.includes(event.keyCode)
              ) {
                call(event);
                return true;
              }
              return false;
            }
            call(event);
            return true;
          }
          return false;
        };
        const scopeParams = this.getScope({ event, keyboard });
        this.onInput(scopeParams);
        this.dispatch("input", scopeParams);
        this.scripts.items.map((script) => {
          script.onInput(scopeParams);
        });
      });
    });
  }

  canvasInit(onSuccess = () => null) {
    setTimeout(() => {
      if (!this.options.el) return;

      const updateSizeHandler = (scope) => {
        scope.canvas.width = scope.canvas.target.offsetWidth;
        scope.canvas.height = scope.canvas.target.offsetHeight;

        if (scope.game.camera) {
          scope.game.camera.aspect = scope.canvas.width / scope.canvas.height;
          scope.game.camera.updateProjectionMatrix();
        }

        if (scope.game.renderer) {
          scope.game.renderer.setSize(scope.canvas.width, scope.canvas.height);
        }
      };

      if ((this.canvas.target = document.querySelector(this.options.el))) {
        updateSizeHandler(this);

        window.addEventListener("resize", () => {
          updateSizeHandler(this);
        });
      }

      onSuccess();
    }, 10);
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
      this.dispatch("loadProgress", this.getScope({ managerProgress }));
    };

    this.assets.manager.onLoad = () => {
      const managerProgress = { progress: 100 };
      this.onLoadSuccess(this.getScope({ managerProgress }));
      this.dispatch("loadSuccess", this.getScope({ managerProgress }));
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
      if (this.canvas.target) {
        this.canvas.target.appendChild(this.game.renderer.domElement);
        this.game.renderer.domElement.style.width = "100%";
        this.game.renderer.domElement.style.height = "100%";
      }

      onSuccess();
      this.onCreate(this.getScope());
      this.dispatch("create", this.getScope());

      const updateHandler = () => {
        this.onUpdate(this.getScope());
        this.dispatch("update", this.getScope());

        this.scripts.items.map((script) => {
          script.onUpdate(this.getScope());
          script.dispatch("update", this.getScope());
        });

        this.game.physics.updateDebugger();
        this.game.physics.update(this.game.clock.getDelta() * 1000);
        this.game.renderer.render(this.game.scene, this.game.camera);
        requestAnimationFrame(updateHandler);
      };
      requestAnimationFrame(updateHandler);
    });
  }

  scriptAttach(object, script) {
    this.scripts.items.push(script);
    script.object = object;
    script.parent = this;
    script.onCreate(this.getScope());
  }

  pointerLockControls(object = null, element = null) {
    object = object === null ? this.game.camera : object;
    element = element === null ? this.canvas.target : element;
    return new PointerLockControls(object, element);
  }

  onLoadProgress(scope) {}
  onLoadSuccess(scope) {}
  onCreate(scope) {}
  onUpdate(scope) {}
  onInput(scope) {}
};

export const Script = class Script extends Base {
  name = null;
  object = null;
  parent = null;
  onCreate(scope) {}
  onUpdate(scope) {}
  onInput(scope) {}

  constructor() {
    super();
  }
};
