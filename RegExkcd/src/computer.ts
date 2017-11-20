import { GameState, assets } from "main";
import { GamePhase, FIRST_PLAYER, SECOND_PLAYER } from "./constants";
import { CardState } from "./card";
import { clone_object, randomInt, is_regex_valid, get_max_match } from "./utils";
import { TiledLayout, LayoutDirection } from "./layout";

const DIFFICULTY_COUNT = 3;

export class Computer {
    difficulty: number;

    difficulty_container: createjs.Container;

    difficulties_buttons_on: Array<createjs.Sprite>;
    difficulties_buttons_off: Array<createjs.Sprite>;

    constructor() {
        // console.error("Creating computer");
        this.difficulty_container = new createjs.Container();

        this.difficulties_buttons_on = new Array<createjs.Sprite>(DIFFICULTY_COUNT);
        this.difficulties_buttons_off = new Array<createjs.Sprite>(DIFFICULTY_COUNT);

        let vertical_on = new TiledLayout(LayoutDirection.Vertical, 10);
        let vertical_off = new TiledLayout(LayoutDirection.Vertical, 10);
        for (let i = 0; i < DIFFICULTY_COUNT; ++i) {
            this.difficulties_buttons_on[i] = new createjs.Sprite(assets.skip_button_spritesheet);
            this.difficulties_buttons_off[i] = new createjs.Sprite(assets.skip_button_spritesheet);
            this.difficulties_buttons_on[i].gotoAndStop(0);
            this.difficulties_buttons_on[i].on("click", (event) => {
                this.set_difficulty(i);
            })
            this.difficulties_buttons_off[i].gotoAndStop(1);
            vertical_on.addItem(this.difficulties_buttons_on[i]);
            vertical_off.addItem(this.difficulties_buttons_off[i]);
        }
        this.difficulty_container.addChild(vertical_on);
        this.difficulty_container.addChild(vertical_off);
        this.set_difficulty(0);
    }

    set_difficulty(difficulty: number) {
        console.log("Setting difficulty to", difficulty);
        this.difficulty = difficulty;
        for (let i = 0; i < DIFFICULTY_COUNT; ++i) {
            this.difficulties_buttons_on[i].visible = (i !== difficulty);
            this.difficulties_buttons_off[i].visible = (i === difficulty);
        }
    }

    play_as_computer(game_state: GameState) {
        // Give control to computer.
        console.log("Taking lock");
        game_state.computer_thinking = true;
        if (game_state.phase === GamePhase.Changing) {
            console.log("Playing change");
            this.play_change(game_state);
        } else if (game_state.phase == GamePhase.Matching) {
            console.log("Playing match");
            this.play_match(game_state);
        }
    }

    finish_play(game_state: GameState) {
        // Give control back to player.
        console.log("Releasing lock");
        game_state.computer_thinking = false;
    }

    play_change(game_state: GameState) {
        let opponent_cards_inplay = game_state.cards_inplay[FIRST_PLAYER].cards;
        let my_cards_inplay = game_state.cards_inplay[SECOND_PLAYER].cards;
        let my_cards_inhand = game_state.cards_inhand[SECOND_PLAYER].cards;

        let in_hand_card = randomInt(0, my_cards_inhand.length - 1);
        let in_play_card = randomInt(0, my_cards_inplay.length - 1);

        let max_total_match_length = 0;
        for (let i = 0; i < my_cards_inhand.length; ++i) {
            let my_card = my_cards_inhand[i];
            if (!is_regex_valid(my_card.regex)) {
                continue;
            }
            let total_match_length = 0;
            for (let j = 0; j < opponent_cards_inplay.length; ++j) {
                total_match_length += get_max_match(my_card.regex, opponent_cards_inplay[j].password).length;
            }
            if (total_match_length >= max_total_match_length) {
                in_hand_card = i;
                max_total_match_length = total_match_length;
            }
        }

        createjs.Tween.get({}).wait(2000).call(() => {
            game_state.select_card(SECOND_PLAYER, my_cards_inhand[in_hand_card].id, true);
            game_state.select_card(SECOND_PLAYER, my_cards_inplay[in_play_card].id, true);
            this.finish_play(game_state);
        });
    }

    play_match(game_state: GameState) {
        let opponent_cards = game_state.cards_inplay[FIRST_PLAYER].cards;
        let my_cards = game_state.cards_inplay[SECOND_PLAYER].cards;

        class Action {
            attack_cards: Array<number>;
            regex_string: string;
            target_card: number;

            constructor(target_card: number) {
                this.regex_string = "";
                this.attack_cards = new Array<number>();
                this.target_card = target_card;
            }
        }

        let actions = new Array<Action>();
        for (let i = 0; i < opponent_cards.length; ++i) {
            let card = opponent_cards[i];
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
                for (let j = 0; j < my_cards.length; ++j) {
                    let card = my_cards[j];
                    if (card.state !== CardState.InPlay) {
                        continue;
                    }
                    if (action.attack_cards.indexOf(j) !== -1) {
                        continue;
                    }
                    let regex_string = action.regex_string + card.regex;
                    if (!is_regex_valid(regex_string)) {
                        continue;
                    }

                    let max_match = get_max_match(regex_string, opponent_cards[action.target_card].password);
                    if (max_match.length > 0) {
                        let new_action = clone_object(action);
                        new_action.attack_cards.push(j);
                        new_action.regex_string = regex_string;
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

        let tween = createjs.Tween.get({}).wait(1500);
        console.log(`Found ${actions.length} actions`);
        console.log(actions);

        let action = actions[max_max_match_i];
        console.log("Making action: ", action);
        for (const attack_card_index of action.attack_cards) {
            tween.call(() => game_state.select_card(SECOND_PLAYER, my_cards[attack_card_index].id, true)).wait(1000);
        }
        tween.call(() => {
            game_state.select_card(FIRST_PLAYER, opponent_cards[action.target_card].id, true);
            this.finish_play(game_state);
        });
    }
}

