import { TiledLayout, LayoutDirection } from "./layout";
import { REGEX_STRING_TEXT_FONT, FIRST_PLAYER, GamePhase, SECOND_PLAYER } from "./constants";
import { input_disable, assets } from "./main";

const ELEMENT_SCALE = 0.7;
const GAME_STATUS_TEXT_X_SHIFT = 140;

function load_sprite(spritesheet, index: number, scale: number): createjs.Sprite {
    let sprite = new createjs.Sprite(spritesheet);
    sprite.gotoAndStop(index);
    sprite.setTransform(0, 0, scale, scale);
    // TODO: Remove this when we add preload.
    sprite.setBounds(0, 0, 400, 150);
    return sprite;
}

export class GamePhaseIndicator {
    container: createjs.Container;

    // Current regex string.
    game_status_text: createjs.Text;

    // Sprite shown during tactics.
    tactics_container: createjs.Container;

    // Sprite shown player attacks.
    player_attack_container: Array<createjs.Container>;

    current_player: number;
    current_phase: GamePhase;

    constructor() {
        this.container = new createjs.Container();
        this.container.regY = 100 * ELEMENT_SCALE;
        this.container.y = 17;

        var spritesheet = assets.phase_indicator_spritesheet;
        this.player_attack_container = new Array<createjs.Container>(2);
        this.player_attack_container[FIRST_PLAYER] = new createjs.Container();
        this.player_attack_container[SECOND_PLAYER] = new createjs.Container();
        this.player_attack_container[FIRST_PLAYER].addChild(load_sprite(spritesheet, 1, ELEMENT_SCALE));
        this.player_attack_container[SECOND_PLAYER].addChild(load_sprite(spritesheet, 2, ELEMENT_SCALE));

        this.tactics_container = new createjs.Container();
        this.tactics_container.addChild(load_sprite(spritesheet, 0, ELEMENT_SCALE));

        this.game_status_text = new createjs.Text("-----", REGEX_STRING_TEXT_FONT, "white");
        this.game_status_text.textAlign = "center";
        this.game_status_text.textBaseline = "middle";
        this.game_status_text.x = GAME_STATUS_TEXT_X_SHIFT;
        this.game_status_text.y = this.container.regY;

        this.current_player = FIRST_PLAYER;
        this.current_phase = GamePhase.Changing;

        this.container.addChild(this.tactics_container);
        this.container.addChild(this.player_attack_container[FIRST_PLAYER]);
        this.container.addChild(this.player_attack_container[SECOND_PLAYER]);
        this.container.addChild(this.game_status_text);

        this.update_phase_status();
    }

    set_text(text: string) {
        this.game_status_text.text = text;
    }

    set_regex_text(regex_text: string) {
        if (regex_text.length == 0) {
            this.update_phase_status();
        } else {
            this.set_text(regex_text);
        }
    }

    redraw_phase_status() {
        input_disable.i++;

        createjs.Tween.get(this.container)
            .to({scaleY: 0}, 300, createjs.Ease.getPowIn(4))
            .call(function(){
                this.update_phase_status();
            }, null, this)
            .to({scaleY: 1}, 300, createjs.Ease.getPowOut(4))
            .call(function(){input_disable.i--});
    }

    update_phase_status() {
        this.player_attack_container[FIRST_PLAYER].visible = false;
        this.player_attack_container[SECOND_PLAYER].visible = false;
        this.tactics_container.visible = false;

        if (this.current_phase == GamePhase.Changing) {
            this.tactics_container.visible = true;

            if (this.current_player == FIRST_PLAYER) {
                this.set_text("YOU SWAP");
            } else {
                this.set_text("ENEMY SWAPS");
            }
        } else if (this.current_phase == GamePhase.Matching) {
            this.player_attack_container[this.current_player].visible = true;

            if (this.current_player == FIRST_PLAYER) {
                this.set_text("YOU ATTACK");
            } else {
                this.set_text("ENEMY ATTACKS");
            }
        }
    }

    set_player(current_player: number) {
        if (current_player === this.current_player) return;
        this.current_player = current_player;
        // if (this.current_phase === GamePhase.Changing) return;
        this.redraw_phase_status();
    }

    set_phase(current_phase: GamePhase) {
        if (current_phase === this.current_phase) return;
        this.current_phase = current_phase;
        this.redraw_phase_status();
    }
}
