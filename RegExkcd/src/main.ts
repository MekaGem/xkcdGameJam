const TEXT_FONT = "20px Arial";

class Card {
    attack: string;
    dna: string;

    attack_text: createjs.Text;
    dna_text: createjs.Text;
    container: createjs.Container;

    constructor(attack: string, dna: string) {
        this.attack = attack;
        this.dna = dna;

        this.container = new createjs.Container();

        this.attack_text = new createjs.Text(this.attack, TEXT_FONT);
        this.dna_text = new createjs.Text(this.dna, TEXT_FONT);
        this.dna_text.y += this.attack_text.getMeasuredHeight();

        let box = new createjs.Shape();
        box.graphics
            .setStrokeStyle(1)
            .beginStroke("#000000")
        box.graphics.beginFill("yellow");
        let width = Math.max(this.attack_text.getMeasuredWidth(), this.dna_text.getMeasuredWidth());
        let height = this.attack_text.getMeasuredHeight() + this.dna_text.getMeasuredHeight();
        box.graphics.drawRect(0, 0, width, height);

        this.container.addChild(box);
        this.container.addChild(this.attack_text);
        this.container.addChild(this.dna_text);
    }
};

class Hand {
    cards: Array<Card>;
    container: createjs.Container;

    constructor(cards: Array<Card>) {
        this.cards = cards;
        this.container = new createjs.Container();

        for (let i = 0; i < this.cards.length; ++i) {
            if (i > 0) {
                this.cards[i].container.x = this.container.getBounds().width + 15;
            }
            this.container.addChild(this.cards[i].container);
        }
    }
};

type PlayedCards = Array<Card>;

const WORDS = ["foo", "bar", "baz", "qux"];

function generate_hand(card_count: number): Hand {
    let hand = new Array<Card>(card_count);
    for (let i = 0; i < card_count; ++i) {
        let attack = WORDS[randomInt(0, WORDS.length - 1)];
        let dna = ""
        let dna_parts = randomInt(1, 4);
        for (let j = 0; j < dna_parts; ++j) {
            dna += WORDS[randomInt(0, WORDS.length - 1)];
        }
        hand[i] = new Card(attack, dna);
    }
    return new Hand(hand);
}

function main() {
    let stage = new createjs.Stage('RegExkcdStage');
    stage.mouseEnabled = true;

    let game_field = new createjs.Container();

    let first_hand = generate_hand(5);
    let second_hand = generate_hand(5);

    game_field.addChild(first_hand.container);
    second_hand.container.y += first_hand.container.getBounds().height + 50;
    game_field.addChild(second_hand.container);

    // grid_container.cache(0, 0, 640, 480);
    stage.addChild(game_field);
    stage.update();

    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", stage);
}
