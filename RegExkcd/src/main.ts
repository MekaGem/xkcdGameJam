const TEXT_FONT = "15px Arial";
const BORDER_SIZE = 8;

enum CardState {
    InPlay, InHand, Destoyed    
};

class Card {
    attack: string;
    dna: string;

    state: CardState;
    selected: boolean;

    attack_text: createjs.Text;
    dna_text: createjs.Text;
    card_selection_number: createjs.Text;
    card_envelope: createjs.Shape;
    container: createjs.Container;

    // Unique card index.
    id: number;

    static card_count = 0; 

    constructor(attack: string, dna: string) {
        this.attack = attack;
        this.dna = dna;
        this.id = ++Card.card_count;
        this.selected = false;

        this.container = new createjs.Container();

        this.attack_text = new createjs.Text(this.attack, TEXT_FONT);
        this.attack_text.x += BORDER_SIZE;
        this.dna_text = new createjs.Text(this.dna, TEXT_FONT);
        this.dna_text.x += BORDER_SIZE;
        this.dna_text.y += this.attack_text.getMeasuredHeight();

        // let width = Math.max(this.attack_text.getMeasuredWidth(), this.dna_text.getMeasuredWidth());
        let card_width = 28 * 4;
        let card_height = this.attack_text.getMeasuredHeight() + this.dna_text.getMeasuredHeight() + 8;

        this.card_envelope = new createjs.Shape();
        this.card_envelope.graphics
            .setStrokeStyle(1)
            .beginStroke("#000000")
            .beginFill("yellow")
            .drawRect(0, 0, card_width, card_height);
        
        this.card_selection_number = new createjs.Text("", TEXT_FONT, "red");
        this.card_selection_number.x = card_width - 14;
        this.card_selection_number.y = this.attack_text.y;

        this.container.addChild(this.card_envelope);
        this.container.addChild(this.card_selection_number);
        this.container.addChild(this.attack_text);
        this.container.addChild(this.dna_text);

        this.container.setBounds(0, 0, card_width, card_height);
    }

    select(index: number) {
        this.selected = true;
        this.card_selection_number.text = index.toString();
    }

    deselect() {
        this.selected = false;
        this.card_selection_number.text = "";
    }

    destroy() {
        console.log("Card destroyed");
        this.state = CardState.Destoyed;
        this.container.alpha = 0.5;
    }

    remove_dna(attack: string) {
        this.dna = this.dna.replace(attack, '');
        console.log(`New dna: ${this.dna}`);
        this.dna_text.text = this.dna;
        if (this.dna == "") {
            this.destroy();
        }
    }
};

class Hand {
    cards: Array<Card>;
    container: createjs.Container;

    constructor(cards: Array<Card>) {
        this.cards = cards;
        this.container = new createjs.Container();

        for (let i = 0; i < this.cards.length; ++i) {
            this.cards[i].state = CardState.InHand;
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
            this.cards[i].state = CardState.InPlay;
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

    // Currently selected cards.
    selected_cards: Array<Card>;

    // Map from id to the card;
    id_to_card: { [key:number]: Card };

    // Container holding cards in hands.
    hand_containers: Array<createjs.Container>;

    // Container showing cards in play.
    battlefield_container: createjs.Container;

    constructor(game_field: createjs.Container) {
        this.current_player = FIRST_PLAYER;

        this.cards_inplay = new Array<InPlay>(PLAYER_COUNT);
        this.cards_inplay[FIRST_PLAYER] = new InPlay(generate_cards(5));
        this.cards_inplay[SECOND_PLAYER] = new InPlay(generate_cards(5));

        this.id_to_card = {};
        this.selected_cards = [];

        this.battlefield_container = new createjs.Container();
        for (let i = 0; i < PLAYER_COUNT; ++i) {
            let cards = this.cards_inplay[i].cards;
            let container = this.cards_inplay[i].container;
            for (let j = 0; j < cards.length; ++j) {
                cards[j].container.on("click", (event) => {
                    this.select_card(i, cards[j].id);
                });
                this.add_card(cards[j]);
            }
            if (i > 0) {
                container.y += this.battlefield_container.getBounds().height + 50;
            }
            this.battlefield_container.addChild(container);
        }
        game_field.addChild(this.battlefield_container);
    }

    add_card(card: Card) {
        this.id_to_card[card.id] = card;
    }

    get_card(card_id: number): Card {
        // TODO: Handle case if card is not there.
        return this.id_to_card[card_id];
    }

    select_card(player: number, card_id: number): void {
        console.log(`Selecting card (${player}, ${card_id})`);

        let card = this.get_card(card_id);
        if (player == this.current_player) {
            if (card.state == CardState.InPlay) {
                if (!card.selected) {
                    this.selected_cards.push(card);
                    card.select(this.selected_cards.length);
                } else {
                    let index = this.selected_cards.indexOf(card);
                    if (index + 1 == this.selected_cards.length) {
                        this.selected_cards.splice(index);
                        card.deselect();
                    }
                }
            }
        } else {
            if (card.state == CardState.InPlay) {
                if (this.selected_cards.length > 0) {
                    this.attack(card);
                    this.current_player = 1 - this.current_player;
                }
            }
        }
    }

    attack(card: Card): void {
        let attack_string = "";
        for (let i = 0; i < this.selected_cards.length; ++i) {
            attack_string += this.selected_cards[i].attack;
        }
        console.log(`Attacking ${card.dna} with ${attack_string}`);

        card.remove_dna(attack_string);

        for (let i = 0; i < this.selected_cards.length; ++i) {
            this.selected_cards[i].deselect();
        }
        this.selected_cards = [];
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
