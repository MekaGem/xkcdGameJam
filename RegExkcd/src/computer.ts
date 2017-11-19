import { GameState } from "main";
import { GamePhase, FIRST_PLAYER, SECOND_PLAYER } from "./constants";
import { CardState } from "./card";
import { clone_object } from "./utils";

export function play_as_computer(game_state: GameState) {
    if (this.phase === GamePhase.Changing) {
        play_change(game_state);
        this.change_player();
    } else {
        play_match(game_state);
    }
}

function play_change(game_state: GameState) {
}

function play_match(game_state: GameState) {
    let first_player_cards = game_state.cards_inplay[FIRST_PLAYER].cards;
    let second_player_cards = game_state.cards_inplay[SECOND_PLAYER].cards;

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
                let regex_string = action.regex_string + card.regex;


                let matches = first_player_cards[action.target_card].password.match(new RegExp(regex_string, "g"));
                let max_match = "";
                if (matches) {
                    for (const match of matches) {
                        if (match.length > max_match.length) {
                            max_match = match;
                        }
                    }

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

    let tween = createjs.Tween.get({});
    console.log(`Found ${actions.length} actions`);
    console.log(actions);

    let action = actions[max_max_match_i];
    console.log("Making action: ", action);
    for (const attack_card_index of action.attack_cards) {
        tween.wait(1000).call(() => game_state.select_card(SECOND_PLAYER, second_player_cards[attack_card_index].id, true));
    }
    tween.wait(1000).call(() => {
        game_state.select_card(FIRST_PLAYER, first_player_cards[action.target_card].id, true);
        console.log("Releasing lock");
        game_state.computer_thinking = false;
    });
}
