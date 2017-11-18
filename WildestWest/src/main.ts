const TEXT_FONT = "20px Arial";

let bounds: {
    width: number,
    height: number
};

let stage: createjs.Stage;

let sand: Sand;
let hero: Hero;

let keys = {};

document.onkeydown = function(e) {
	keys[e.keyCode] = true;
};
document.onkeyup = function(e) {
	delete keys[e.keyCode];
};

function up(): boolean {
    return keys[87] || keys[38];
}
function down(): boolean {
    return keys[83] || keys[40];
}
function left(): boolean {
    return keys[65] || keys[37];
}
function right(): boolean {
    return keys[68] || keys[39];
}

class Hero {
    shape: createjs.Shape;

    static bounds;

    constructor() {
        this.shape = new createjs.Shape();
        this.shape.graphics.beginFill("gray").drawCircle(0, 0, 20);
        this.shape.cache(-20,-20,40,40);

        this.shape.x = bounds.width / 2;
        this.shape.y = bounds.height - 50;

        stage.addChild(this.shape);

        Hero.bounds = {
            left: 30,
            right: bounds.width - 30,
            top: bounds.height - 80,
            bottom: bounds.height - 30
        };
    }

    move() {
        if (left()) {
            this.shape.x -= 3;
        }
        if (right()) {
            this.shape.x += 3;
        }
        if (up()) {
            this.shape.y -= 3;
        }
        if (down()) {
            this.shape.y += 3;
        }

        if (this.shape.x < Hero.bounds.left) {
            this.shape.x = Hero.bounds.left;
        }
        if (this.shape.x > Hero.bounds.right) {
            this.shape.x = Hero.bounds.right;
        }
        if (this.shape.y < Hero.bounds.top) {
            this.shape.y = Hero.bounds.top;
        }
        if (this.shape.y > Hero.bounds.bottom) {
            this.shape.y = Hero.bounds.bottom;
        }
    }
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
        frames: {width: Sand.SIZE, height: Sand.SIZE, count: 1, regX: 0, regY: 0, spacing: 0, margin: 0}
    });

    let canvas = stage.canvas as HTMLCanvasElement;
    bounds = {width: canvas.width, height: canvas.height};

    sand = new Sand();
    hero = new Hero();

    stage.update();

    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", tick);
}

function tick(event) {
    sand.move(2);
    hero.move();

    stage.update();
}
