export function loadResources(callback, stage, assets) {
    let loadingText = new createjs.Text("Loading 0%", "30px Arial", "Black");
    loadingText.textAlign = "center";
    loadingText.textBaseline = "middle";
    loadingText.x = stage.canvas.width / 2;
    loadingText.y = stage.canvas.height / 2;
    stage.addChild(loadingText);
    stage.update();

    var queue = new createjs.LoadQueue(true);
    var handleComplete = function() {
        stage.removeChild(loadingText);

        assets.health_spritesheet = queue.getResult("health");
        assets.cards_spritesheet = queue.getResult("cards");
        assets.keys_spritesheet = queue.getResult("keys");
        assets.phase_indicator_spritesheet = queue.getResult("phase_indicator");
        assets.skip_button_spritesheet = queue.getResult("skip_button");
        assets.instructions_spritesheet = queue.getResult("instructions");
        assets.health_fill_bitmap = createjs.SpriteSheetUtils.extractFrame(assets.health_spritesheet, 0);

        callback();
    };

    var updateLoading = function() {
        loadingText.text = "Loading " + (queue.progress * 100 | 0) + "%";
        stage.update();
    }

    queue.on("complete", handleComplete, this);
    queue.on("progress", updateLoading);
    queue.loadFile({src: "img/health_sprite.json", id: "health", type: createjs.AbstractLoader.SPRITESHEET});
    queue.loadFile({src: "img/cards_sprite.json", id: "cards", type: createjs.AbstractLoader.SPRITESHEET});
    queue.loadFile({src: "img/keys_sprite.json", id: "keys", type: createjs.AbstractLoader.SPRITESHEET});
    queue.loadFile({src: "img/phase_indicator_sprite.json", id: "phase_indicator", type: createjs.AbstractLoader.SPRITESHEET});
    queue.loadFile({src: "img/skip_button_sprite.json", id: "skip_button", type: createjs.AbstractLoader.SPRITESHEET});
    queue.loadFile({src: "img/instructions_sprite.json", id: "instructions", type: createjs.AbstractLoader.SPRITESHEET});

}
