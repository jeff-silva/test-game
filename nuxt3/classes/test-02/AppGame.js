import { Game } from "@/classes/Motor.js";

import WasdScript from "./WasdScript.js";
import SceneScript from "./SceneScript.js";

export default class extends Game {
  constructor(...args) {
    super(...args);

    this.assetAdd("scene", {
      url: "/assets/threejs/models/low-poly-level/scene.gltf",
      onLoad: (scope) => {
        const model = scope.loadedItem.model.scene;
        scope.game.scene.add(model);
        this.scriptAttach(model, new SceneScript());
      },
    });
  }

  onCreate(scope) {
    this.scriptAttach(scope.game.camera, new WasdScript());
  }
}
