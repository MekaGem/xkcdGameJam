import {Card, CardState} from "./card";
import {randomInt} from "./utils";

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

// const WORDS = ["foo", "bar", "baz", "qux"];
const WORDS = ["foo", "bar", "qux"];

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

    computer_thinking: boolean;

    constructor(game_field: createjs.Container) {
        this.current_player = FIRST_PLAYER;

        this.cards_inplay = new Array<InPlay>(PLAYER_COUNT);
        this.cards_inplay[FIRST_PLAYER] = new InPlay(generate_cards(5));
        this.cards_inplay[SECOND_PLAYER] = new InPlay(generate_cards(5));

        this.computer_thinking = false;

        this.id_to_card = {};
        this.selected_cards = [];

        this.battlefield_container = new createjs.Container();
        for (let i = 0; i < PLAYER_COUNT; ++i) {
            let cards = this.cards_inplay[i].cards;
            let container = this.cards_inplay[i].container;
            for (let j = 0; j < cards.length; ++j) {
                cards[j].container.on("click", (event) => {
                    this.select_card(i, cards[j].id, false);
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

    play_as_computer() {
        this.computer_thinking = true;

        let first_player_cards = this.cards_inplay[FIRST_PLAYER].cards;
        let second_player_cards = this.cards_inplay[SECOND_PLAYER].cards;

        let any_j = 0;
        let any_k = 0;
        for (let i = 0; i < second_player_cards.length + 1; ++i) {
            for (let j = 0; j < second_player_cards.length; ++j) {
                if (second_player_cards[j].state != CardState.InPlay) {
                    continue;
                }
                any_j = j;
                let attack_string = second_player_cards[j].attack;
                if (i != second_player_cards.length) {
                    if (second_player_cards[i].state != CardState.InPlay) {
                        continue;
                    }
                    attack_string += second_player_cards[i].attack;
                }
                for (let k = 0; k < first_player_cards.length; ++k) {
                    if (first_player_cards[k].state == CardState.InPlay) {
                        any_k = k;
                        if (first_player_cards[k].dna.indexOf(attack_string) != -1) {
                            console.log(`Attacking ${i}, ${j}, ${k}`);
                            this.select_card(SECOND_PLAYER, second_player_cards[j].id, true);
                            let T = 1000;
                            if (i != second_player_cards.length) {
                                setTimeout(() => {
                                    this.select_card(SECOND_PLAYER, second_player_cards[i].id, true);
                                }, T);
                                T += 1000;
                            }
                            setTimeout(() => {
                                this.select_card(FIRST_PLAYER, first_player_cards[k].id, true);
                                console.log("Releasing lock");
                                this.computer_thinking = false;
                            }, T);
                            return;
                        }
                    }
                }
            }
        }
        this.select_card(SECOND_PLAYER, second_player_cards[any_j].id, true);
        this.select_card(FIRST_PLAYER, first_player_cards[any_k].id, true);
        console.log("Releasing lock");
        this.computer_thinking = false;
    }

    select_card(player: number, card_id: number, is_computer: boolean): void {
        console.log(`Selecting card (${player}, ${card_id})`);
        if (this.computer_thinking && !is_computer) {
            return;
        }

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

                    if (this.current_player == SECOND_PLAYER) {
                        this.play_as_computer();
                    }
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

export function play() {
    let stage = new createjs.Stage('RegExkcdStage');
    stage.mouseEnabled = true;

    let game_field = new createjs.Container();
    let game = new GameState(game_field);
    stage.addChild(game_field);
    stage.update();

    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", stage);
}
