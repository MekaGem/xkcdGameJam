import { Card, CardState, generate_cards } from "card";
import { PlayerState, generate_players } from "player";
import { randomInt, clone_object } from "utils";
import { TiledLayout, LayoutDirection } from "layout";
import { ATTACK_STRING_TEXT_FONT } from "./constants";

let mouse = {
    x: 0,
    y: 0
};

let stageWidth = 0;
let stageHeight = 0;

class Hand {
    cards: Array<Card>;
    container: TiledLayout;

    constructor(cards: Array<Card>) {
        this.cards = cards;
        this.container = new TiledLayout(LayoutDirection.Horizontal, 15, true, stageWidth);

        for (let i = 0; i < this.cards.length; ++i) {
            this.cards[i].change_state(CardState.InHand);
            this.container.addItem(this.cards[i].container);
        }

        this.container.apply_centering();
    }

    get_selected_for_swap() {
        for (let card of this.cards) {
            if (card.selected_for_swap) {
                return card;
            }
        }
        return null;
    }
};

class InPlay {
    cards: Array<Card>;
    container: TiledLayout;

    constructor(cards: Array<Card>) {
        this.cards = cards;
        this.container = new TiledLayout(LayoutDirection.Horizontal, 15, true, stageWidth);

        for (let i = 0; i < this.cards.length; ++i) {
            this.cards[i].state = CardState.InPlay;
            this.container.addItem(this.cards[i].container);
        }

        this.container.apply_centering();
    }

    get_selected_for_swap() {
        for (let card of this.cards) {
            if (card.selected_for_swap) {
                return card;
            }
        }
        return null;
    }
};

enum GamePhase {
    Changing, Matching
};

const PLAYER_COUNT = 2;
const FIRST_PLAYER = 0;
const SECOND_PLAYER = 1;

class GameState {
    // Index of the current player.
    current_player: number;

    // Cards on the table.
    cards_inplay: Array<InPlay>;

    // Cards in the hand.
    cards_inhand: Array<Hand>;

    // States of the players (e.g. hp, decks).
    player_states: Array<PlayerState>;

    // Currently selected cards.
    selected_cards: Array<Card>;

    // Map from id to the card;
    id_to_card: { [key: number]: Card };

    // Container showing cards in play.
    battlefield_container: createjs.Container;

    // Is computer making a move now.
    computer_thinking: boolean;

    // Current attack string.
    attack_string_text: createjs.Text;

    phase: GamePhase;

    constructor(game_field: createjs.Container) {
        this.current_player = FIRST_PLAYER;

        this.cards_inplay = new Array<InPlay>(PLAYER_COUNT);
        this.cards_inplay[FIRST_PLAYER] = new InPlay(generate_cards(3));
        this.cards_inplay[SECOND_PLAYER] = new InPlay(generate_cards(3));

        this.cards_inhand = new Array<Hand>(PLAYER_COUNT);
        this.cards_inhand[FIRST_PLAYER] = new Hand(generate_cards(4));
        this.cards_inhand[SECOND_PLAYER] = new Hand(generate_cards(4));

        this.player_states = generate_players();

        this.selected_cards = [];

        this.id_to_card = {};

        this.computer_thinking = false;

        this.attack_string_text = new createjs.Text("--------------", ATTACK_STRING_TEXT_FONT, "red");

        for (let i = 0; i < PLAYER_COUNT; ++i) {
            // cards in play
            {
                let cards = this.cards_inplay[i].cards;
                let container = this.cards_inplay[i].container;
                for (let j = 0; j < cards.length; ++j) {
                    let id = cards[j].id;
                    cards[j].container.on("click", (event) => {
                        this.select_card(i, id, false);
                    });
                    this.add_card(cards[j]);
                }
            }

            // cards in hands
            {
                let cards = this.cards_inhand[i].cards;
                let container = this.cards_inhand[i].container;
                for (let j = 0; j < cards.length; ++j) {
                    let id = cards[j].id;
                    cards[j].container.on("click", (event) => {
                        this.select_card(i, id, false);
                    });
                    this.add_card(cards[j]);
                    if (i === SECOND_PLAYER) {
                        cards[j].set_visible(false);
                    }
                }
            }
        }

        createjs.Ticker.on("tick", function(event) {
            for (let i = 0; i < PLAYER_COUNT; ++i) {
                for (let card of this.cards_inplay[i].cards) {
                    card.update_hover(mouse);
                }

                for (let card of this.cards_inhand[i].cards) {
                    card.update_hover(mouse);
                }
            }
        }, this);

        let verticalLayout = new TiledLayout(LayoutDirection.Vertical, 35);
        verticalLayout.addItem(this.player_states[SECOND_PLAYER].container);
        verticalLayout.addItem(this.cards_inhand[SECOND_PLAYER].container, -20);
        verticalLayout.addItem(this.cards_inplay[SECOND_PLAYER].container);
        verticalLayout.addItem(this.attack_string_text);
        verticalLayout.addItem(this.cards_inplay[FIRST_PLAYER].container);
        verticalLayout.addItem(this.cards_inhand[FIRST_PLAYER].container);
        verticalLayout.addItem(this.player_states[FIRST_PLAYER].container, -20);
        this.battlefield_container = verticalLayout;

        game_field.addChild(this.battlefield_container);

        this.phase = GamePhase.Changing;
    }

    add_card(card: Card) {
        this.id_to_card[card.id] = card;
    }

    get_card(card_id: number): Card {
        if (this.id_to_card[card_id] === undefined) {
            console.error(`Can't find card ${card_id}`)
        }
        return this.id_to_card[card_id];
    }

    play_as_computer() {
        if (this.phase === GamePhase.Changing) {
            this.change_player();
            return;
        }

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

        let max_max_match = "";
        let max_max_match_i = 0;
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


                    let matches = first_player_cards[action.target_card].dna.match(new RegExp(attack_string, "g"));
                    let max_match = "";
                    if (matches) {
                        for (const match of matches) {
                            if (match.length > max_match.length) {
                                max_match = match;
                            }
                        }

                        let new_action = clone_object(action);
                        new_action.attack_cards.push(j);
                        new_action.attack_string = attack_string;
                        actions.push(new_action);

                        if (max_match.length > max_max_match.length) {
                            max_max_match = max_match;
                            max_max_match_i = actions.length - 1;
                        }
                    }
                }
            }
            wave_start = wave_finish;
            wave_finish = actions.length;
        }

        let tween = createjs.Tween.get({});
        console.log(`Found ${actions.length} actions`);
        console.log(actions);

        let action = actions[max_max_match_i];
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

        if (this.phase === GamePhase.Changing) {
            this.select_card_while_changing(owner, card_id, is_computer);
        } else {
            this.select_card_while_matching(owner, card_id, is_computer);
        }
    }

    select_card_while_changing(owner: number, card_id: number, is_computer: boolean) {
        let players_hand = this.cards_inhand[this.current_player];
        let players_play = this.cards_inplay[this.current_player];
        let card_selected_for_swap_in_hand = players_hand.get_selected_for_swap();

        let card = this.get_card(card_id);
        if (owner !== this.current_player) {
            if (card_selected_for_swap_in_hand !== null) {
                console.log("You can not swap your card with your opponent's card");
                // you can not change other player's cards
            } else {
                console.log("Skip changing phase");
                // just skipping turn
                this.change_player();
            }
            return;
        }

        if (card.state === CardState.InPlay) {
            if (card_selected_for_swap_in_hand) {
                console.log("Swapping cards");
                // swapping cards
                this.swap_cards(owner, card_selected_for_swap_in_hand, card);
                this.change_player();
            }
        } else if (card.state === CardState.InHand) {
            console.log("Select for swap");
            if (card.selected_for_swap) {
                card.select_for_swap(false);
            } else {
                for (let k = 0; k < players_hand.cards.length; ++k) {
                    players_hand.cards[k].select_for_swap(false);
                }
                card.select_for_swap(true);
            }
        }
    }

    swap_cards(owner: number, card_in_hand: Card, card_in_play: Card) {
        let players_hand = this.cards_inhand[owner];
        let players_play = this.cards_inplay[owner];

        console.log("Before");
        console.log("Card in hand: " + card_in_hand.id);
        console.log("Card in play: " + card_in_play.id);

        let hand_card_index = players_hand.cards.indexOf(card_in_hand);
        let play_card_index = players_play.cards.indexOf(card_in_play);
        [players_hand.cards[hand_card_index], players_play.cards[play_card_index]] = [
            players_play.cards[play_card_index],
            players_hand.cards[hand_card_index]
        ];

        hand_card_index = players_hand.container.getChildIndex(card_in_hand.container);
        play_card_index = players_play.container.getChildIndex(card_in_play.container);

        players_hand.container.removeChild(card_in_hand.container);
        players_hand.container.addChildAt(card_in_play.container, hand_card_index);

        players_play.container.removeChild(card_in_play.container);
        players_play.container.addChildAt(card_in_hand.container, play_card_index);

        [card_in_hand.container.x, card_in_hand.container.y, card_in_play.container.x, card_in_play.container.y] = [
            card_in_play.container.x,
            card_in_play.container.y,
            card_in_hand.container.x,
            card_in_hand.container.y
        ]

        card_in_hand.select_for_swap(false);
        card_in_play.select_for_swap(false);

        card_in_hand.change_state(CardState.InPlay);
        card_in_play.change_state(CardState.InHand);

        console.log("Before");
        console.log("Card in hand: " + card_in_hand.id);
        console.log("Card in play: " + card_in_play.id);
    }

    select_card_while_matching(owner: number, card_id: number, is_computer: boolean) {
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
                this.attack_string_text.text = this.get_attack_string();
            }
        } else {
            if (card.state === CardState.InPlay) {
                this.attack(card);
                this.change_player();
            }
        }
    }

    change_player() {
        this.current_player = 1 - this.current_player;
        if (this.current_player == SECOND_PLAYER) {
            // now computer changes cards
            console.log("Taking lock");
            this.computer_thinking = true;
            this.play_as_computer();
        } else {
            this.computer_thinking = false;
            this.change_phase();
        }
    }

    change_phase() {
        if (this.phase === GamePhase.Changing) {
            console.log("Matching phase started");
            this.phase = GamePhase.Matching;
        } else if (this.phase === GamePhase.Matching) {
            console.log("Changing phase started");
            this.phase = GamePhase.Changing;
        }
    }

    get_attack_string(): string {
        let attack_string = "";
        for (let i = 0; i < this.selected_cards.length; ++i) {
            attack_string += this.selected_cards[i].attack;
        }
        return attack_string;
    }

    attack(card: Card): void {
        let attack_string = this.get_attack_string();
        console.log(`Attacking "${card.dna}" with "${attack_string}"`);

        let matches = card.dna.match(new RegExp(attack_string, "g"));
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
        this.attack_string_text.text = "";
    }
};

export function play() {
    let stage = new createjs.Stage('RegExkcdStage');
    stage.mouseEnabled = true;

    let canvas:any = stage.canvas;
    stageWidth = canvas.width;
    stageHeight = canvas.height;

    let game_field = new createjs.Container();
    let game = new GameState(game_field);
    stage.addChild(game_field);
    stage.update();

    stage.on("stagemousemove", function(event: any) {
        mouse.x = event.stageX;
        mouse.y = event.stageY;
    });

    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", stage);
}
