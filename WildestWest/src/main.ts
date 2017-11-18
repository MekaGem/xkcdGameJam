const TEXT_FONT = "20px Arial";

let bounds: {
    width: number,
    height: number
};

let stage: createjs.Stage;

let sand: Sand;

class Hero {

}

class Sand {
    static SIZE = 600;
    static sandSheet: createjs.SpriteSheet;

    container: createjs.Container;
    sprites: Array<createjs.Sprite>;

    y = 0;

    constructor() {
        this.container = new createjs.Container();
        stage.addChild(this.container);
        this.setup();
    }
    setup() {
        this.container.removeAllChildren();

        this.sprites = [];
        let xtiles = Math.ceil(bounds.width / Sand.SIZE);
        let ytiles = Math.ceil(bounds.height / Sand.SIZE) + 1;

        let x = 0;
        let y = this.y - Sand.SIZE;

        for (let yy = 0; yy < ytiles; yy++) {
            for (let xx = 0; xx < xtiles; xx++) {
                let sprite = new createjs.Sprite(Sand.sandSheet);
                sprite.x = x + xx * Sand.SIZE;
                sprite.y = y + yy * Sand.SIZE;
    
                this.container.addChild(sprite);
                this.sprites.push(sprite);
            }
        }

        this.container.cache(0, 0, bounds.width, bounds.height);
    }

    move(dy: number) {
        this.y += dy;
        if (this.y >= Sand.SIZE) {
            this.y -= Sand.SIZE;
            dy -= Sand.SIZE;
        }

        for (let sprite of this.sprites) {
            sprite.y += dy;
        }
        
        this.container.cache(0, 0, bounds.width, bounds.height);
    }
}

function main() {
    stage = new createjs.StageGL('WildestWestStage');
    stage.mouseEnabled = true;

    Sand.sandSheet = new createjs.SpriteSheet({
        images: ["sand.jpg"],
        frames: {width:600, height:600, count:1, regX: 0, regY: 0, spacing:0, margin:0}
    });

    let canvas = stage.canvas as HTMLCanvasElement;
    bounds = {width: canvas.width, height: canvas.height};

    sand = new Sand();
    stage.update();

    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", tick);
}

function tick() {
    sand.move(2);

    stage.update();
}
