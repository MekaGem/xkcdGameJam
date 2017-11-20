import { Card, CardState, generate_cards, CARD_SCALE, SWAP_HOVER } from "card";
import { PlayerState, generate_players, Hand, InPlay } from "player";
import { randomInt, clone_object, is_regex_valid, get_max_match, oppositePlayer } from "utils";
import { TiledLayout, LayoutDirection } from "layout";
import { REGEX_STRING_TEXT_FONT, PLAYER_COUNT, FIRST_PLAYER, SECOND_PLAYER, GamePhase, SKIP_TURN_FONT, HP_TEXT_FONT, START_HP, GAME_FIELD_Y } from "constants";
import { Computer } from "./computer";
import { get_results_screen, get_game_result, GameResult } from "./results";
import { GamePhaseIndicator } from "./game_phase_indicator";
import { loadResources } from "./resource_loader";
import { get_menu_screen } from "./menu";

let MAX_HEIGHT;
let MAX_WIDTH;

let desired_aspect;

let mouse = {
    x: 0,
    y: 0
};

export let stage_width = 0;
export let stage_height = 0;

export let input_disable = {
    i: 0
};

export let assets;

// Function for changing the current screen.
export let change_screen;

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

    // Containers for hp stats of players
    player_hp_containers: Array<createjs.Container>;

    // HP text stats
    player_hp_texts: Array<createjs.Text>;

    // HP brain stats
    player_brains: Array<createjs.Bitmap>;

    // Player instructions bubble
    player_instructions: createjs.Sprite;

    // Skip turn button
    skip_turn_button: createjs.Sprite;

    // Computer.
    computer: Computer;

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

        this.create_skip_turn_button();
        this.skip_turn_button.on("click", (event) => {
            if (this.current_player === SECOND_PLAYER) {
                return;
            }
            this.change_player();
        });

        this.set_player(FIRST_PLAYER);

        this.computer = new Computer();

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

            this.hover_cards();
        }, this);


        let verticalLayout = new TiledLayout(LayoutDirection.Vertical, 35, true, stage_width);
        verticalLayout.addItem(this.cards_inhand[SECOND_PLAYER].container);
        verticalLayout.addItem(this.cards_inplay[SECOND_PLAYER].container, -30);
        verticalLayout.addItem(this.game_phase_indicator.container);
        verticalLayout.addItem(this.cards_inplay[FIRST_PLAYER].container, -20);
        verticalLayout.addItem(this.cards_inhand[FIRST_PLAYER].container, -15);

        verticalLayout.apply_centering();

        this.battlefield_container = new createjs.Container();
        this.battlefield_container.addChild(verticalLayout);
        this.battlefield_container.addChild(this.skip_turn_button);

        game_field.addChild(this.battlefield_container);

        this.create_hp_containers();

        this.create_instruction_bubble();

        this.computer.difficulty_container.x = stage_width - 195;
        this.computer.difficulty_container.y = 220;

        this.battlefield_container.addChild(this.computer.difficulty_container);

        this.half_round_index = 0;
        this.set_phase(GamePhase.Changing);

        this.update_instruction_bubble();
    }

    create_hp_containers() {
        this.player_hp_containers = new Array<createjs.Container>(2);
        this.player_hp_containers[FIRST_PLAYER] = new createjs.Container();
        this.player_hp_containers[SECOND_PLAYER] = new createjs.Container();

        this.player_hp_texts = new Array<createjs.Text>();
        this.player_hp_texts[FIRST_PLAYER] = new createjs.Text(this.player_states[FIRST_PLAYER].hp.toString(), HP_TEXT_FONT);
        this.player_hp_texts[SECOND_PLAYER] = new createjs.Text(this.player_states[SECOND_PLAYER].hp.toString(), HP_TEXT_FONT);

        this.player_brains = new Array<createjs.Bitmap>();

        {
            this.player_brains[FIRST_PLAYER] = new createjs.Bitmap(assets.health_fill_bitmap);
            this.player_brains[FIRST_PLAYER].scaleX = -1;
            this.player_brains[FIRST_PLAYER].regX = +21;

            let player_brain_full = this.player_brains[FIRST_PLAYER];
            player_brain_full.sourceRect = new createjs.Rectangle(0, 0, 21, 16);

            let player_brain_empty = new createjs.Sprite(assets.health_spritesheet);
            player_brain_empty.gotoAndStop(1);
            player_brain_empty.scaleX = -1;
            player_brain_empty.regX = +21;

            this.player_hp_texts[FIRST_PLAYER].x = 21/*player_heart_full.getBounds().width*/ + 5;
            this.player_hp_texts[FIRST_PLAYER].y = -3;

            this.player_hp_containers[FIRST_PLAYER].x = 97;
            this.player_hp_containers[FIRST_PLAYER].y = 682;

            this.player_hp_containers[FIRST_PLAYER].addChild(
                player_brain_empty,
                player_brain_full,
                this.player_hp_texts[FIRST_PLAYER]
            );
            this.battlefield_container.addChild(this.player_hp_containers[FIRST_PLAYER]);
        }

        {
            this.player_brains[SECOND_PLAYER] = new createjs.Bitmap(assets.health_fill_bitmap);

            const enemy_hp_text = this.player_hp_texts[SECOND_PLAYER];
            enemy_hp_text.x = 0;
            enemy_hp_text.y = -3;

            let enemy_brain_full = this.player_brains[SECOND_PLAYER];
            enemy_brain_full.x = 5 + enemy_hp_text.getBounds().width;
            enemy_brain_full.y = 0;
            enemy_brain_full.sourceRect = new createjs.Rectangle(0, 0, 21, 16);

            let enemy_brain_empty = new createjs.Sprite(assets.health_spritesheet);
            enemy_brain_empty.x = enemy_brain_full.x;
            enemy_brain_empty.y = enemy_brain_full.y;
            enemy_brain_empty.gotoAndStop(1);

            this.player_hp_containers[SECOND_PLAYER].x = stage_width - 154;
            this.player_hp_containers[SECOND_PLAYER].y = 363;

            this.player_hp_containers[SECOND_PLAYER].addChild(
                enemy_brain_empty,
                enemy_brain_full,
                this.player_hp_texts[SECOND_PLAYER]
            );
            this.battlefield_container.addChild(this.player_hp_containers[SECOND_PLAYER]);
        }
    }

    update_brains() {
        {
            let player_hp = this.player_states[FIRST_PLAYER].hp;
            let v = (player_hp * 1.0) / START_HP;
            let height = Math.max(0, 16 * v);
            this.player_brains[FIRST_PLAYER].sourceRect = new createjs.Rectangle(0, 16 - height, 21, height);
            this.player_brains[FIRST_PLAYER].y = 16 - height;

            this.player_hp_texts[FIRST_PLAYER].text = player_hp.toString();
        }

        {
            let enemy_hp = this.player_states[SECOND_PLAYER].hp;
            let v = (enemy_hp * 1.0) / START_HP;
            let height = Math.max(0, 16 * v);
            this.player_brains[SECOND_PLAYER].sourceRect = new createjs.Rectangle(0, 16 - height, 21, height);
            this.player_brains[SECOND_PLAYER].y = 16 - height;

            this.player_hp_texts[SECOND_PLAYER].text = enemy_hp.toString();
        }
    }

    create_instruction_bubble() {
        this.player_instructions = new createjs.Sprite(assets.instructions_spritesheet);
        this.player_instructions.x = 32;
        this.player_instructions.y = 527;
        this.player_instructions.scaleX = 0.6;
        this.player_instructions.scaleY = 0.6;

        this.battlefield_container.addChild(this.player_instructions);
    }

    update_instruction_bubble() {
        if (this.current_player === FIRST_PLAYER) {
            if (this.phase === GamePhase.Changing) {
                this.player_instructions.gotoAndStop(1);
            } else {
                this.player_instructions.gotoAndStop(0);
            }
        } else {
            this.player_instructions.gotoAndStop(2);
        }
    }

    create_skip_turn_button() {
        this.skip_turn_button = new createjs.Sprite(assets.skip_button_spritesheet);
        this.skip_turn_button.x = 75;
        this.skip_turn_button.y = 448;
    }

    update_skip_turn_button() {
        if (this.current_player === FIRST_PLAYER) {
            this.skip_turn_button.gotoAndStop(0);
        } else {
            this.skip_turn_button.gotoAndStop(1);
        }
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

    hover_cards() {
        if (input_disable.i) return;
        for (let i = 0; i < PLAYER_COUNT; ++i) {
            for (let card of this.cards_inplay[i].cards) {
                let could_be_increased = this.phase === GamePhase.Matching
                                         || (this.phase === GamePhase.Changing && i == FIRST_PLAYER
                                            && this.cards_inhand[FIRST_PLAYER].get_selected_for_swap() !== null);
                if (this.phase === GamePhase.Matching && i === FIRST_PLAYER &&
                    this.selected_cards.indexOf(card) < 0 && !is_regex_valid(this.get_regex_string() + card.regex)) {
                    could_be_increased = false;
                }
                card.update_hover(mouse, could_be_increased);
            }
        }
        for (let card of this.cards_inhand[FIRST_PLAYER].cards) {
            card.update_hover(mouse, this.current_player === FIRST_PLAYER && this.phase === GamePhase.Changing);
        }
    }

    set_phase(phase: GamePhase) {
        this.phase = phase;
        this.game_phase_indicator.set_phase(phase);
    }

    set_player(player: number) {
        this.current_player = player;
        this.game_phase_indicator.set_player(player);
        this.update_skip_turn_button();
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
        if ((this.computer_thinking || input_disable.i) && !is_computer) {
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
        input_disable.i++;

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

                input_disable.i--;
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

            input_disable.i++;

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
                    input_disable.i--;
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
            this.computer.play_as_computer(this);
        }

        this.update_instruction_bubble();
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

        // updating brain bar
        this.update_brains();

        for (let i = 0; i < this.selected_cards.length; ++i) {
            this.selected_cards[i].deselect();
        }
        this.selected_cards = [];
        card.show_attacked(damage);
        this.game_phase_indicator.set_regex_text("");
    }
};

function create_background() {
    // TODO: Move this out.
    let game_field_bg = new createjs.Sprite(assets.game_bg_spritesheet);
    game_field_bg.setTransform(0, 0, 0.7, 0.7);
    game_field_bg.gotoAndStop(0);

    let border = new createjs.Sprite(assets.border_spritesheet);
    border.setTransform(0, 0, 0.7, 0.7);
    border.gotoAndStop(0);
    return [game_field_bg, border];
}

export function init() {
    let stage = new createjs.Stage('RegExkcdStage');

    let canvas = stage.canvas as HTMLCanvasElement;
    MAX_HEIGHT = canvas.width;
    MAX_WIDTH = canvas.height;
    desired_aspect = MAX_WIDTH / MAX_HEIGHT;

    // resize(stage);

    stage.mouseEnabled = true;

    stage_width = canvas.width;
    stage_height = canvas.height;

    assets = {};

    loadResources(() => { play(stage) }, stage, assets);
}

export let game_screen: createjs.Container;

function resize(stage): void {
    stage_width = Math.min(window.innerWidth, MAX_WIDTH);
    stage_height = Math.min(window.innerHeight, MAX_HEIGHT);
    console.log("Stage: " + stage.canvas.width + ":" + stage.canvas.height);
    console.log("Resize to: " + stage_width + ":" + stage_height);
    let scale_w = stage_width / stage.canvas.width;
    let scale_h = stage_height / stage.canvas.height;
    let scale = Math.min(scale_w, scale_h);
    stage.scaleX = scale;
    stage.scaleY = scale;
    stage.canvas.width *= scale;
    stage.canvas.height *= scale;
    stage_width = stage.canvas.width;
    stage_height = stage.canvas.height;
    console.log("Resize to: " + stage.canvas.width + ":" + stage.canvas.height);
}

export function play(stage) {
    console.log(assets);

    let god_screen = new createjs.Container();
    change_screen = (screen: createjs.Container) => {
        god_screen.removeAllChildren();
        god_screen.addChild(screen);
    };
    stage.addChild(god_screen);

    // TODO: Refactor this.
    let v = create_background();

    stage.addChild(v[1]);

    game_screen = new createjs.Container();

    // Init game screen
    {
        let game_field = new createjs.Container();
        let game = new GameState(game_field);
        game_field.setTransform(0, GAME_FIELD_Y);

        game_screen.addChild(v[0]);
        game_screen.addChild(game_field);
    }

    change_screen(get_menu_screen());

    stage.on("stagemousemove", function(event: any) {
        mouse.x = event.stageX;
        mouse.y = event.stageY;
    });

    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", stage);
}
