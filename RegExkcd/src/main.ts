import { Card, CardState, generate_cards } from "card";
import { PlayerState, generate_players } from "player";
import { randomInt } from "utils";
import { TiledLayout, LayoutDirection } from "layout";

class Hand {
    cards: Array<Card>;
    container: TiledLayout;

    constructor(cards: Array<Card>) {
        this.cards = cards;
        this.container = new TiledLayout(LayoutDirection.Horizontal, 15);

        for (let i = 0; i < this.cards.length; ++i) {
            this.cards[i].change_state(CardState.InHand);
            this.container.addItem(this.cards[i].container);
        }
    }
};

class InPlay {
    cards: Array<Card>;
    container: TiledLayout;

    constructor(cards: Array<Card>) {
        this.cards = cards;
        this.container = new TiledLayout(LayoutDirection.Horizontal, 15);

        for (let i = 0; i < this.cards.length; ++i) {
            this.cards[i].state = CardState.InPlay;
            this.container.addItem(this.cards[i].container);
        }
    }
};

const PLAYER_COUNT = 2;
const FIRST_PLAYER = 0;
const SECOND_PLAYER = 1;

function clone_object(object) {
    return JSON.parse(JSON.stringify(object));
}

class GameState {
    current_player: number;
    cards_inplay: Array<InPlay>;
    cards_inhand: Array<Hand>;

    // States of the players (e.g. hp, decks).
    player_states: Array<PlayerState>;

    // Currently selected cards.
    selected_cards: Array<Card>;

    // Map from id to the card;
    id_to_card: { [key: number]: Card };

    // Container holding cards in hands.
    hand_containers: Array<createjs.Container>;

    // Container showing cards in play.
    battlefield_container: createjs.Container;

    computer_thinking: boolean;

    constructor(game_field: createjs.Container) {
        this.current_player = FIRST_PLAYER;

        this.cards_inplay = new Array<InPlay>(PLAYER_COUNT);
        this.cards_inplay[FIRST_PLAYER] = new InPlay(generate_cards(3));
        this.cards_inplay[SECOND_PLAYER] = new InPlay(generate_cards(3));

        this.cards_inhand = new Array<Hand>(PLAYER_COUNT);
        this.cards_inhand[FIRST_PLAYER] = new Hand(generate_cards(4));
        this.cards_inhand[SECOND_PLAYER] = new Hand(generate_cards(4));

        this.player_states = generate_players();

        this.computer_thinking = false;

        this.id_to_card = {};
        this.selected_cards = [];

        for (let i = 0; i < PLAYER_COUNT; ++i) {
            // cards in play
            {
                let cards = this.cards_inplay[i].cards;
                let container = this.cards_inplay[i].container;
                for (let j = 0; j < cards.length; ++j) {
                    cards[j].container.on("click", (event) => {
                        this.select_card(i, cards[j].id, false);
                    });
                    this.add_card(cards[j]);
                }
            }

            // cards in hands
            {
                let cards = this.cards_inhand[i].cards;
                let container = this.cards_inhand[i].container;
                for (let j = 0; j < cards.length; ++j) {
                    cards[j].container.on("click", (event) => {
                        this.select_card(i, cards[j].id, false);
                    });
                    this.add_card(cards[j]);
                    if (i === SECOND_PLAYER) {
                        cards[j].set_visible(false);
                    }
                }
            }
        }

        let verticalLayout = new TiledLayout(LayoutDirection.Vertical, 50);
        verticalLayout.addItem(this.player_states[SECOND_PLAYER].container);
        verticalLayout.addItem(this.cards_inhand[SECOND_PLAYER].container);
        verticalLayout.addItem(this.cards_inplay[SECOND_PLAYER].container);
        verticalLayout.addItem(this.cards_inplay[FIRST_PLAYER].container);
        verticalLayout.addItem(this.cards_inhand[FIRST_PLAYER].container);
        verticalLayout.addItem(this.player_states[FIRST_PLAYER].container);
        this.battlefield_container = verticalLayout;

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
        let first_player_cards = this.cards_inplay[FIRST_PLAYER].cards;
        let second_player_cards = this.cards_inplay[SECOND_PLAYER].cards;

        class Action {
            attack_cards: Array<number>;
            attack_string: string;
            target_card: number;

            constructor(target_card: number) {
                this.attack_string = "";
                this.attack_cards = new Array<number>();
                this.target_card = target_card;
            }
        }

        let actions = new Array<Action>();
        for (let i = 0; i < first_player_cards.length; ++i) {
            let card = first_player_cards[i];
            if (card.state != CardState.InPlay) {
                continue;
            }
            actions.push(new Action(i));
        }

        let MAX_DEPTH = 2;
        let wave_start = 0;
        let wave_finish = actions.length;
        for (let depth = 0; depth < MAX_DEPTH; ++depth) {
            for (let i = wave_start; i < wave_finish; ++i) {
                let action = actions[i];
                for (let j = 0; j < second_player_cards.length; ++j) {
                    let card = second_player_cards[j];
                    if (card.state !== CardState.InPlay) {
                        continue;
                    }
                    if (action.attack_cards.indexOf(j) !== -1) {
                        continue;
                    }
                    let attack_string = action.attack_string + card.attack;
                    // Replace this with finding a best regex match.
                    if (first_player_cards[action.target_card].dna.indexOf(attack_string) !== -1) {
                        let new_action = clone_object(action);
                        new_action.attack_cards.push(j);
                        new_action.attack_string = attack_string;
                        actions.push(new_action);
                    }
                }
            }
            wave_start = wave_finish;
            wave_finish = actions.length;
        }

        let tween = createjs.Tween.get({});
        console.log(`Found ${actions.length} actions`);
        console.log(actions);

        let action = actions[actions.length - 1];
        console.log("Making action: ", action);
        for (const attack_card_index of action.attack_cards) {
            tween.wait(1000).call(() => this.select_card(SECOND_PLAYER, second_player_cards[attack_card_index].id, true));
        }
        tween.wait(1000).call(() => {
            this.select_card(FIRST_PLAYER, first_player_cards[action.target_card].id, true);
            console.log("Releasing lock");
            this.computer_thinking = false;
        });
    }

    select_card(owner: number, card_id: number, is_computer: boolean): void {
        console.log(`Selecting card (${owner}, ${card_id})`);
        if (this.computer_thinking && !is_computer) {
            return;
        }

        let card = this.get_card(card_id);
        if (owner === this.current_player) {
            if (card.state === CardState.InPlay) {
                if (!card.selected) {
                    this.selected_cards.push(card);
                    card.select(this.selected_cards.length);
                } else {
                    let index = this.selected_cards.indexOf(card);
                    if (index + 1 === this.selected_cards.length) {
                        this.selected_cards.splice(index);
                        card.deselect();
                    }
                }
            } else if (card.state === CardState.InHand) {
                let cards = this.cards_inhand[owner].cards;
                if (card.selected_for_swap) {
                    card.select_for_swap(false);
                } else {
                    for (let k = 0; k < cards.length; ++k) {
                        cards[k].select_for_swap(false);
                    }
                    card.select_for_swap(true);
                }
            }
        } else {
            if (card.state === CardState.InPlay) {
                this.attack(card);
                this.current_player = 1 - this.current_player;

                if (this.current_player == SECOND_PLAYER) {
                    console.log("Taking lock");
                    this.computer_thinking = true;
                    this.play_as_computer();
                }
            }
        }
    }

    attack(card: Card): void {
        let attack_string = "";
        for (let i = 0; i < this.selected_cards.length; ++i) {
            attack_string += this.selected_cards[i].attack;
        }
        console.log(`Attacking "${card.dna}" with "${attack_string}"`);

        let matches = card.dna.match("(" + attack_string + ")");
        let max_match = "";
        if (matches) {
            for (const match of matches) {
                if (match.length > max_match.length) {
                    max_match = match;
                }
            }
        }
        console.log(`Max match: "${max_match}"`);

        this.player_states[1 - this.current_player].deal_damage(max_match.length);
        // card.remove_dna(attack_string);

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
