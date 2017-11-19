import { GameState, stage_width, stage_height } from "./main"
import { Card } from "./card"
import { TiledLayout, LayoutDirection } from "./layout";
import { FIRST_PLAYER, SECOND_PLAYER, HP_TEXT_FONT } from "./constants";

const results_screen = new TiledLayout(LayoutDirection.Vertical, 50);

export enum GameResult {
    None, PlayerWins, AIWins, Tie
};

export function get_game_result(game_state: GameState) {
    const player_hp = game_state.player_states[FIRST_PLAYER].hp;
    const ai_hp = game_state.player_states[SECOND_PLAYER].hp;
    if (player_hp <= 0 && ai_hp <= 0) {
        return GameResult.Tie;
    } else if (player_hp <= 0) {
        return GameResult.AIWins;
    } else if (ai_hp <= 0) {
        return GameResult.PlayerWins;
    } else {
        return GameResult.None;
    }
}

function get_result_text(game_result: GameResult) {
    if (game_result === GameResult.None) {
        console.error("GameResult.None is not the end of the game!");
    } else if (game_result === GameResult.PlayerWins) {
        return "Congrats! You win!"
    } else if (game_result === GameResult.AIWins) {
        return "Sorry, you lose. Try again!"
    } else {
        return "Tie!"
    }
}

export function get_results_screen(game_state: GameState) {
    const outer_scale = 0.8;

    const game_result = get_game_result(game_state);

    results_screen.removeAllChildren();

    let enemy_container = new TiledLayout(LayoutDirection.Horizontal, 0);
    let enemy_cards = game_state.cards_inplay[SECOND_PLAYER].cards;
    enemy_cards = enemy_cards.concat(game_state.cards_inhand[SECOND_PLAYER].cards);
    enemy_cards = enemy_cards.concat(game_state.player_graveyard[SECOND_PLAYER]);

    console.log(enemy_cards);

    for (let card of enemy_cards) {
        // createjs.Tween.removeTweens(card.container);
        card.container.x = 0;
        card.container.y = 0;
        enemy_container.addItem(card.container);
        card.set_visible(true);
        card.container.removeAllEventListeners();
    }
    enemy_container.scaleX = outer_scale;
    enemy_container.scaleY = outer_scale;
    enemy_container.y = 50;

    let player_container = new TiledLayout(LayoutDirection.Horizontal, 0);
    let player_cards = game_state.cards_inplay[FIRST_PLAYER].cards;
    player_cards = player_cards.concat(game_state.cards_inhand[FIRST_PLAYER].cards);
    player_cards = player_cards.concat(game_state.player_graveyard[FIRST_PLAYER]);

    for (let card of player_cards) {
        // createjs.Tween.removeTweens(card.container);
        card.container.x = 0;
        card.container.y = 0;
        player_container.addItem(card.container);
        card.set_visible(true);
        card.container.removeAllEventListeners();
    }
    player_container.scaleX = outer_scale;
    player_container.scaleY = outer_scale;
    player_container.y = 50;

    let result_text = new createjs.Text(get_result_text(game_result), HP_TEXT_FONT, "red");

    const player_hp = game_state.player_states[FIRST_PLAYER].hp;
    const ai_hp = game_state.player_states[SECOND_PLAYER].hp;
    let score = new createjs.Text("PLAYER " + player_hp + " : AI " + ai_hp, HP_TEXT_FONT, "red");

    let enemy_title = new createjs.Text("Enemy cards history:", HP_TEXT_FONT);
    let player_title = new createjs.Text("Player cards history:", HP_TEXT_FONT);

    results_screen.addItem(result_text);
    results_screen.addItem(score);

    results_screen.addItem(enemy_title);
    results_screen.addItem(enemy_container);

    results_screen.addItem(player_title);
    results_screen.addItem(player_container);

    results_screen.x = 100; //(stage_width - results_screen.getBounds().width) / 2.0;
    results_screen.y = 0;

    return results_screen;
}