import { GameState, stage_width, stage_height, assets } from "./main"
import { Card, CardState } from "./card"
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

    // let enemy_container = new TiledLayout(LayoutDirection.Horizontal, 0);
    // let enemy_container_graveyard = new TiledLayout(LayoutDirection.Horizontal, 0);
    // let enemy_cards = game_state.cards_inplay[SECOND_PLAYER].cards;
    // enemy_cards = enemy_cards.concat(game_state.cards_inhand[SECOND_PLAYER].cards);
    // const enemy_active_cards = enemy_cards.length;
    // enemy_cards = enemy_cards.concat(game_state.player_graveyard[SECOND_PLAYER]);

    // console.log(enemy_cards);

    // let index = 0;
    // let current_container = enemy_container;
    // for (let card of enemy_cards) {
    //     if (index === enemy_active_cards) {
    //         current_container = enemy_container_graveyard;
    //     }
    //     ++index;

    //     // createjs.Tween.removeTweens(card.container);
    //     card.container.x = 0;
    //     card.container.y = 0;
    //     current_container.addItem(card.container);
    //     card.set_visible(true);
    //     card.container.removeAllEventListeners();
    //     card.change_state(CardState.Destoyed);
    // }
    // enemy_container.scaleX = outer_scale;
    // enemy_container.scaleY = outer_scale;
    // enemy_container.y = 50;
    // enemy_container_graveyard.scaleX = outer_scale;
    // enemy_container_graveyard.scaleY = outer_scale;
    // enemy_container_graveyard.y = 50;

    // let player_container = new TiledLayout(LayoutDirection.Horizontal, 0);
    // let player_container_graveyard = new TiledLayout(LayoutDirection.Horizontal, 0);
    // let player_cards = game_state.cards_inplay[FIRST_PLAYER].cards;
    // player_cards = player_cards.concat(game_state.cards_inhand[FIRST_PLAYER].cards);
    // const player_active_cards = player_cards.length;
    // player_cards = player_cards.concat(game_state.player_graveyard[FIRST_PLAYER]);

    // index = 0;
    // current_container = player_container;
    // for (let card of player_cards) {
    //     if (index === player_active_cards) {
    //         current_container = player_container_graveyard;
    //     }
    //     ++index;

    //     // createjs.Tween.removeTweens(card.container);
    //     card.container.x = 0;
    //     card.container.y = 0;
    //     current_container.addItem(card.container);
    //     card.set_visible(true);
    //     card.container.removeAllEventListeners();
    //     card.change_state(CardState.Destoyed);
    // }
    // player_container.scaleX = outer_scale;
    // player_container.scaleY = outer_scale;
    // player_container.y = 50;
    // player_container_graveyard.scaleX = outer_scale;
    // player_container_graveyard.scaleY = outer_scale;
    // player_container_graveyard.y = 50;

    // let result_text = new createjs.Text(get_result_text(game_result), HP_TEXT_FONT, "red");

    const player_hp = game_state.player_states[FIRST_PLAYER].hp;
    const ai_hp = game_state.player_states[SECOND_PLAYER].hp;

    let result = new createjs.Sprite(assets.result_spritesheet);
    result.x = -result.getBounds().width / 2;
    let h = result.getBounds().height -0;

    let you = new createjs.Text("YOU ", HP_TEXT_FONT, "black");
    you.x = -70;
    you.y = h;

    let score = new createjs.Text(player_hp + " : " + ai_hp, HP_TEXT_FONT, "red");
    score.x = you.x + you.getBounds().width;
    score.y = h;

    let ai = new createjs.Text(" AI", HP_TEXT_FONT, "black");
    ai.x = score.x + score.getBounds().width;
    ai.y = h;

    let enemy_title = new createjs.Text("Enemy cards history:", HP_TEXT_FONT);
    let player_title = new createjs.Text("Player cards history:", HP_TEXT_FONT);

    let score_container = new createjs.Container();
    score_container.addChild(you);
    score_container.addChild(score);
    score_container.addChild(ai);

    score_container.addChild(result);
    score_container.x = (stage_width) / 2;
    score_container.y = 80;

    let bg = new createjs.Sprite(assets.results_bg_spritesheet);
    bg.scaleX = 0.7;
    bg.scaleY = 0.7;

    results_screen.addChild(bg);
    results_screen.addChild(score_container);

    return results_screen;
}