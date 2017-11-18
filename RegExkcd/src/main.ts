const TEXT_FONT = "20px Arial";

class Card {
    attack: string;
    dna: string;

    attack_text: createjs.Text;
    dna_text: createjs.Text;
    container: createjs.Container;

    // Unique card index.
    id: number;

    static card_count = 0; 

    constructor(attack: string, dna: string) {
        this.attack = attack;
        this.dna = dna;
        this.id = ++Card.card_count;

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

class InPlay {
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

function generate_cards(card_count: number): Array<Card> {
    let cards = new Array<Card>(card_count);
    for (let i = 0; i < card_count; ++i) {
        let attack = WORDS[randomInt(0, WORDS.length - 1)];
        let dna = ""
        let dna_parts = randomInt(1, 4);
        for (let j = 0; j < dna_parts; ++j) {
            dna += WORDS[randomInt(0, WORDS.length - 1)];
        }
        cards[i] = new Card(attack, dna);
    }
    return cards;
}

const PLAYER_COUNT = 2;
const FIRST_PLAYER = 0;
const SECOND_PLAYER = 1;

class GameState {
    current_player: number;
    cards_inplay: Array<InPlay>;
    cards_inhand: Array<Hand>;

    // Container holding cards in hands.
    hand_containers: Array<createjs.Container>;

    // Container showing cards in play.
    battlefield_container: createjs.Container;

    constructor(game_field: createjs.Container) {
        this.current_player = FIRST_PLAYER;

        this.cards_inplay = new Array<InPlay>(PLAYER_COUNT);
        this.cards_inplay[FIRST_PLAYER] = new Hand(generate_cards(5));
        this.cards_inplay[SECOND_PLAYER] = new Hand(generate_cards(5));

        this.battlefield_container = new createjs.Container();
        for (let i = 0; i < PLAYER_COUNT; ++i) {
            let cards = this.cards_inplay[i].cards;
            let container = this.cards_inplay[i].container;
            for (let j = 0; j < cards.length; ++j) {
                cards[j].container.on("click", (event) => {
                    this.select_card(i, cards[j].id);
                });
            }
            if (i > 0) {
                container.y += this.battlefield_container.getBounds().height + 50;
            }
            this.battlefield_container.addChild(container);
        }
        game_field.addChild(this.battlefield_container);
    }


    select_card(player: number, card_id: number): void {
        if (player == this.current_player) {
        } else {
        }
    }
};

function main() {
    let stage = new createjs.Stage('RegExkcdStage');
    stage.mouseEnabled = true;

    let game_field = new createjs.Container();
    let game = new GameState(game_field);
    stage.addChild(game_field);
    stage.update();

    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", stage);
}
