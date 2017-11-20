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

            // humanSpriteSheet: queue.getResult("human"),
            // golemSpriteSheet: queue.getResult("golem"),
            // statusBarsSpriteSheet: queue.getResult("status_bars"),
            // healthSpriteSheet: queue.getResult("health"),
            // buttonSpriteSheet: queue.getResult("button"),
            // raftSpriteSheet: queue.getResult("raft")
        // }
        console.log(assets);
        // assets.heartFill = createjs.SpriteSheetUtils.extractFrame(assets.healthSpriteSheet, 1);
        // assets.progressBarFill = createjs.SpriteSheetUtils.extractFrame(assets.statusBarsSpriteSheet, 1);
        callback();
    };

    var updateLoading = function() {
        loadingText.text = "Loading " + (queue.progress * 100 | 0) + "%";
        stage.update();
    }

    queue.on("complete", handleComplete, this);
    queue.on("progress", updateLoading);
    queue.loadFile({src: "img/health_sprite.json", id: "health", type: createjs.AbstractLoader.SPRITESHEET});
    // queue.loadFile({src: "assets/human.json", id: "human", type: createjs.AbstractLoader.SPRITESHEET});
    // queue.loadFile({src: "assets/golem.json", id: "golem", type: createjs.AbstractLoader.SPRITESHEET});
    // queue.loadFile({src: "assets/status_bars.json", id: "status_bars", type: createjs.AbstractLoader.SPRITESHEET});
    // queue.loadFile({src: "assets/health.json", id: "health", type: createjs.AbstractLoader.SPRITESHEET});
    // queue.loadFile({src: "assets/buttons.json", id: "button", type: createjs.AbstractLoader.SPRITESHEET});
    // queue.loadFile({src: "assets/raft.json", id: "raft", type: createjs.AbstractLoader.SPRITESHEET});
}