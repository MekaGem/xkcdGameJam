import { Card, CardState, generate_cards, CARD_SCALE, SWAP_HOVER } from "card";
import { PlayerState, generate_players, Hand, InPlay } from "player";
import { randomInt, clone_object, is_regex_valid, get_max_match, oppositePlayer } from "utils";
import { TiledLayout, LayoutDirection } from "layout";
import { REGEX_STRING_TEXT_FONT, PLAYER_COUNT, FIRST_PLAYER, SECOND_PLAYER, GamePhase, SKIP_TURN_FONT } from "constants";
import { play_as_computer } from "./computer";
import { get_results_screen, get_game_result, GameResult } from "./results";
import { GamePhaseIndicator } from "./game_phase_indicator";

let mouse = {
    x: 0,
    y: 0
};

export let stage_width = 0;
export let stage_height = 0;

let input_disable = 0;

// Function for changing the current screen.
let change_screen;

export class GameState {
    // Index of the current player.
    current_player: number;

    // Cards on the table.
    cards_inplay: Array<InPlay>;

    // Cards in the hand.
    cards_inhand: Array<Hand>;

    // States of the players (e.g. hp, decks).
    player_states: Array<PlayerState>;

    // Graveyard for cards
    player_graveyard: Array<Array<Card>>;

    // Currently selected cards.
    selected_cards: Array<Card>;

    // Map from id to the card;
    id_to_card: { [key: number]: Card };

    // Container showing cards in play.
    battlefield_container: createjs.Container;

    // Is computer making a move now.
    computer_thinking: boolean;

    // Indicator in the middle of the board describing current state.
    game_phase_indicator: GamePhaseIndicator;

    // Number of current half round (total number of actions all players made).
    half_round_index: number;

    // Current phase of the game.
    phase: GamePhase;

    // Skip turn button.
    skip_turn_button: createjs.Container;

    constructor(game_field: createjs.Container) {
        this.cards_inplay = new Array<InPlay>(PLAYER_COUNT);
        this.cards_inplay[FIRST_PLAYER] = new InPlay(generate_cards(3));
        this.cards_inplay[SECOND_PLAYER] = new InPlay(generate_cards(3));

        this.cards_inhand = new Array<Hand>(PLAYER_COUNT);
        this.cards_inhand[FIRST_PLAYER] = new Hand(generate_cards(4));
        this.cards_inhand[SECOND_PLAYER] = new Hand(generate_cards(4));

        this.player_states = generate_players();

        this.player_graveyard = new Array<Array<Card>>(PLAYER_COUNT);
        this.player_graveyard[FIRST_PLAYER] = new Array<Card>();
        this.player_graveyard[SECOND_PLAYER] = new Array<Card>();

        this.selected_cards = [];

        this.id_to_card = {};

        this.computer_thinking = false;

        this.game_phase_indicator = new GamePhaseIndicator();

        this.skip_turn_button = new createjs.Container();
        let skip_turn_button_text = new createjs.Text("Skip turn", SKIP_TURN_FONT, "black");
        let skip_button_rect = new createjs.Shape();
        skip_button_rect.graphics.beginFill("white").drawRect(0, 0, skip_turn_button_text.getMeasuredWidth(), skip_turn_button_text.getMeasuredHeight());
        this.skip_turn_button.addChild(skip_button_rect);
        this.skip_turn_button.addChild(skip_turn_button_text);

        this.skip_turn_button.on("click", (event) => {
            this.change_player();
        });

        this.set_player(FIRST_PLAYER);

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
            this.update_regex_highlight();

            if (input_disable) return;
            for (let i = 0; i < PLAYER_COUNT; ++i) {
                for (let card of this.cards_inplay[i].cards) {
                    card.update_hover(mouse);
                }

                for (let card of this.cards_inhand[i].cards) {
                    card.update_hover(mouse);
                }
            }
        }, this);

        let verticalLayout = new TiledLayout(LayoutDirection.Vertical, 35, true, stage_width);
        verticalLayout.addItem(this.player_states[SECOND_PLAYER].container);
        verticalLayout.addItem(this.cards_inhand[SECOND_PLAYER].container, -20);
        verticalLayout.addItem(this.cards_inplay[SECOND_PLAYER].container);
        verticalLayout.addItem(this.game_phase_indicator.container);
        verticalLayout.addItem(this.skip_turn_button, -30);
        verticalLayout.addItem(this.cards_inplay[FIRST_PLAYER].container);
        verticalLayout.addItem(this.cards_inhand[FIRST_PLAYER].container);
        verticalLayout.addItem(this.player_states[FIRST_PLAYER].container, -20);

        verticalLayout.apply_centering();

        this.battlefield_container = verticalLayout;

        game_field.addChild(this.battlefield_container);

        this.half_round_index = 0;
        this.set_phase(GamePhase.Changing);
    }

    highlight_for_card(owner: number, card: Card) {
        let regex_prefix = "";
        if (this.phase === GamePhase.Matching) {
            if (this.current_player !== FIRST_PLAYER || owner !== FIRST_PLAYER) return;
            if (this.selected_cards.indexOf(card) >= 0) return;
            regex_prefix = this.get_regex_string();
        }

        let local = card.container.globalToLocal(mouse.x, mouse.y);
        let bounds = card.container.getBounds();
        if (local.x >= bounds.x && local.y >= bounds.y &&
            local.x <= bounds.x + bounds.width && local.y <= bounds.y + bounds.height) {
            for (let enemy_card of this.cards_inplay[1 - owner].cards) {
                enemy_card.show_highlight(regex_prefix + card.regex);
            }
        }
    }

    update_regex_highlight() {
        for (let i = 0; i < PLAYER_COUNT; ++i) {
            for (let card of this.cards_inplay[i].cards) card.pre_update_highlight();
            for (let card of this.cards_inhand[i].cards) card.pre_update_highlight();
        }

        for (let i = 0; i < PLAYER_COUNT; ++i) {
            for (let card of this.cards_inplay[i].cards) {
                this.highlight_for_card(i, card);
            }
            if (i == FIRST_PLAYER) for (let card of this.cards_inhand[i].cards) {
                this.highlight_for_card(i, card);
            }
        }

        if (this.phase === GamePhase.Matching) {
            let attack_regex = this.get_regex_string();
            for (let card of this.cards_inplay[1 - this.current_player].cards) {
                card.show_attack_highlight(attack_regex);
            }
        }

        for (let i = 0; i < PLAYER_COUNT; ++i) {
            for (let card of this.cards_inplay[i].cards) card.update_highlight();
            for (let card of this.cards_inhand[i].cards) card.update_highlight();
        }
    }

    set_phase(phase: GamePhase) {
        this.phase = phase;
        this.game_phase_indicator.set_phase(phase);
    }

    set_player(player: number) {
        this.current_player = player;
        this.game_phase_indicator.set_player(player);
        this.skip_turn_button.visible = (player == FIRST_PLAYER);
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


    select_card(owner: number, card_id: number, is_computer: boolean): void {
        console.log(`Selecting card (${owner}, ${card_id})`);
        if ((this.computer_thinking || input_disable) && !is_computer) {
            return;
        }

        if (this.phase === GamePhase.Changing) {
            this.select_card_while_changing(owner, card_id, is_computer);
        } else if (this.phase == GamePhase.Matching) {
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
        input_disable++;

        card_in_hand.select_for_swap(false);
        card_in_play.select_for_swap(false);

        let hand_pos = {x: card_in_hand.container.x, y: card_in_hand.container.y};
        let play_pos = {x: card_in_play.container.x, y: card_in_play.container.y};
        let glob_hand_pos = card_in_hand.container.localToGlobal(card_in_hand.container.getBounds().width / 2, card_in_hand.container.getBounds().height / 2);
        let glob_play_pos = card_in_play.container.localToGlobal(card_in_play.container.getBounds().width / 2, card_in_play.container.getBounds().height / 2);

        let ai_move = (owner == SECOND_PLAYER);

        let in_out = createjs.Ease.getPowInOut(2);

        createjs.Tween.get(card_in_play.container)
            .to({
                scaleX: CARD_SCALE + SWAP_HOVER,
                scaleY: CARD_SCALE + SWAP_HOVER,
                rotation: 90,
                x: card_in_play.container.x - 800
            }, 500, in_out);
        createjs.Tween.get(card_in_hand.container)
            .to({
                scaleX: CARD_SCALE + SWAP_HOVER,
                scaleY: CARD_SCALE + SWAP_HOVER
            }, 500, in_out)
            .call(function(){
                if (ai_move) this.set_visible(true, true, false);
            }, null, card_in_hand)
            .to({
                x: card_in_hand.container.x + glob_play_pos.x - glob_hand_pos.x,
                y: card_in_hand.container.y + glob_play_pos.y - glob_hand_pos.y
            }, 600, in_out)
            .to({
                scaleX: CARD_SCALE,
                scaleY: CARD_SCALE
            }, 300, in_out)
            .call(function() {
                let players_hand = this.cards_inhand[owner];
                let players_play = this.cards_inplay[owner];

                //console.log("Before");
                //console.log("Card in hand: " + card_in_hand.id);
                //console.log("Card in play: " + card_in_play.id);

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
                    play_pos.x,
                    play_pos.y,
                    hand_pos.x,
                    hand_pos.y
                ]

                card_in_hand.change_state(CardState.InPlay);
                card_in_hand.hover = 0;

                //console.log("Before");
                //console.log("Card in hand: " + card_in_hand.id);
                //console.log("Card in play: " + card_in_play.id);

                this.discard_and_pick_new(owner, card_in_play);
                this.change_player();

                input_disable--;
            }, null, this);
    }

    discard_and_pick_new(owner: number, card_in_hand: Card) {
        this.player_graveyard[owner].push(card_in_hand);

        let new_card = this.player_states[owner].pick_card_from_deck();
        if (new_card === null) {
            console.error("No card in deck!. Pls implement something here!");
        } else {
            this.cards_inhand[owner].change_card(card_in_hand, new_card);
            let id = new_card.id;
            new_card.container.on("click", (event) => {
                this.select_card(owner, id, false);
            });
            this.add_card(new_card);
            new_card.set_visible(false);

            input_disable++;

            let ai = (owner == SECOND_PLAYER);
            let target_pos = {x: new_card.container.x, y: new_card.container.y};
            new_card.container.x = stage_width + 200;
            new_card.container.y += ai ? 200 : -200;
            new_card.container.rotation = 90;
            new_card.container.scaleX = new_card.container.scaleY = CARD_SCALE + SWAP_HOVER;

            let in_out = createjs.Ease.getPowInOut(2);
            let tween = createjs.Tween.get(new_card.container)
                .to({
                    x: target_pos.x,
                    y: target_pos.y,
                    rotation: 0
                }, 800, in_out)
            if (ai) tween.to({
                scaleX: CARD_SCALE, scaleY: CARD_SCALE
            }, 300, in_out);
            tween.call(function(){
                    if (!ai) {
                        new_card.set_visible(true, true);
                    }
                    input_disable--;
                }, null, this);
        }
    }

    select_card_while_matching(owner: number, card_id: number, is_computer: boolean) {
        let card = this.get_card(card_id);
        if (owner === this.current_player) {
            if (card.state === CardState.InPlay) {
                if (!card.selected) {
                    let new_regex_string = this.get_regex_string() + card.regex;
                    if (is_regex_valid(new_regex_string)) {
                        this.selected_cards.push(card);
                        card.select(this.selected_cards.length);
                        this.game_phase_indicator.set_regex_text(new_regex_string);
                    }
                } else {
                    let index = this.selected_cards.indexOf(card);
                    if (index + 1 === this.selected_cards.length) {
                        this.selected_cards.splice(index);
                        card.deselect();
                        this.game_phase_indicator.set_regex_text(this.get_regex_string());
                    }
                }
            }
        } else {
            if (card.state === CardState.InPlay) {
                this.attack(card);
                this.change_player();
            }
        }
    }

    change_player() {
        if (get_game_result(this) !== GameResult.None) {
            change_screen(get_results_screen(this));
            return;
        }

        this.half_round_index += 1;

        if (this.half_round_index % 2 === 0) {
            console.log("Changing phase", this.half_round_index);
            this.change_phase();
        }

        this.set_player(oppositePlayer(this.current_player));
        if (this.half_round_index % 4 === 0) {
            console.log("Changing player", this.half_round_index);
            this.set_player(oppositePlayer(this.current_player));
        }

        if (this.current_player == SECOND_PLAYER) {
            play_as_computer(this);
        }
    }

    change_phase() {
        if (this.phase === GamePhase.Changing) {
            console.log("Matching phase started");
            this.set_phase(GamePhase.Matching);
        } else if (this.phase === GamePhase.Matching) {
            console.log("Changing phase started");
            this.set_phase(GamePhase.Changing);
        }
    }

    get_regex_string(): string {
        let regex_string = "";
        for (let i = 0; i < this.selected_cards.length; ++i) {
            regex_string += this.selected_cards[i].regex;
        }
        return regex_string;
    }

    attack(card: Card): void {
        let regex_string = this.get_regex_string();
        console.log(`Attacking "${card.password}" with "${regex_string}"`);

        let max_match = get_max_match(regex_string, card.password);
        console.log(`Max match: "${max_match}"`);

        let damage = max_match.length;
        this.player_states[oppositePlayer(this.current_player)].deal_damage(damage);
        // card.remove_password(regex_string);

        for (let i = 0; i < this.selected_cards.length; ++i) {
            this.selected_cards[i].deselect();
        }
        this.selected_cards = [];
        card.show_attacked(damage);
        this.game_phase_indicator.set_regex_text("");
    }
};

function create_background() {
    var bg_sprite_sheet = new createjs.SpriteSheet({
        images: ["img/game_bg.png"],
        frames: {
            width: 1500,
            height: 1500,
            count: 1,
            regX: 0,
            regY: 0,
            spacing: 0,
            margin: 0
        }
    });
    let game_field_bg = new createjs.Sprite(bg_sprite_sheet);
    game_field_bg.setTransform(0, 75, 0.7, 0.7);
    game_field_bg.gotoAndStop(0);
    return game_field_bg;
}

export function play() {
    let stage = new createjs.Stage('RegExkcdStage');
    stage.mouseEnabled = true;

    let canvas:any = stage.canvas;
    stage_width = canvas.width;
    stage_height = canvas.height;

    let game_field = new createjs.Container();

    game_field.addChild(create_background());

    let game = new GameState(game_field);
    stage.addChild(game_field);

    change_screen = (screen: createjs.Container) => {
        stage.removeAllChildren();
        stage.addChild(screen);
    };

    stage.update();

    stage.on("stagemousemove", function(event: any) {
        mouse.x = event.stageX;
        mouse.y = event.stageY;
    });

    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", stage);
}
