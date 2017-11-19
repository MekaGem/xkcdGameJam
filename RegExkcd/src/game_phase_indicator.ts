import { TiledLayout, LayoutDirection } from "./layout";
import { REGEX_STRING_TEXT_FONT, FIRST_PLAYER, GamePhase, SECOND_PLAYER } from "./constants";

const ELEMENT_SCALE = 0.7;

function load_sprite(spritesheet, index: number, scale: number): createjs.Sprite {
    let sprite = new createjs.Sprite(spritesheet);
    sprite.gotoAndStop(index);
    sprite.setTransform(0, 0, scale, scale);
    // TODO: Remove this when we add preload.
    sprite.setBounds(0, 0, 400, 200);
    sprite.y -= 35;
    return sprite;
}

export class GamePhaseIndicator {
    container: createjs.Container;

    // Current regex string.
    regex_string_text: createjs.Text;

    // Current game phase.
    game_phase_text: createjs.Text;

    // Current player.
    current_player_text: createjs.Text;

    // Sprite shown during tactics.
    tactics_sprite: createjs.Sprite;

    // Sprite shown player attacks.
    player_attack_sprite: Array<createjs.Sprite>;

    current_player: number;
    current_phase: GamePhase;

    constructor() {
        this.container = new createjs.Container();

        var spritesheet = new createjs.SpriteSheet({
            images: ["img/phase_indicator_sprite.png"],
            frames: {
                width: 400,
                height: 200,
                count: 3,
                regX: 0,
                regY: 0,
                spacing: 0,
                margin: 0
            }
        });
        this.player_attack_sprite = new Array<createjs.Sprite>(2);

        this.tactics_sprite = load_sprite(spritesheet, 0, ELEMENT_SCALE);
        this.player_attack_sprite[FIRST_PLAYER] = load_sprite(spritesheet, 1, ELEMENT_SCALE);
        this.player_attack_sprite[SECOND_PLAYER] = load_sprite(spritesheet, 2, ELEMENT_SCALE);

        this.game_phase_text = new createjs.Text("                            ", REGEX_STRING_TEXT_FONT, "red");
        this.regex_string_text = new createjs.Text("                  ", REGEX_STRING_TEXT_FONT, "red");
        this.current_player_text = new createjs.Text("                    ", REGEX_STRING_TEXT_FONT, "red");

        // let horizonal = new TiledLayout(LayoutDirection.Horizontal, 90);
        // horizonal.addItem(this.current_player_text);
        // horizonal.addItem(this.game_phase_text);
        // horizonal.addItem(this.regex_string_text);
        // horizonal.addItem(this.tactics_sprite);
        // this.container.addChild(horizonal);
        // this.container.addChild(this.game_phase_text);
        // this.tactics_sprite.visible = true;
        // this.first_player_attack_sprite.visible = false;
        // this.player_attack_sprite[SECOND_PLAYER].visible = false;
        this.current_player = FIRST_PLAYER;
        this.current_phase = GamePhase.Changing;
        this.container.addChild(this.tactics_sprite);
        this.container.addChild(this.player_attack_sprite[FIRST_PLAYER]);
        this.container.addChild(this.player_attack_sprite[SECOND_PLAYER]);
    }

    set_regex_text(regex_text: string) {
        this.regex_string_text.text = regex_text;
    }

    redraw_phase_status() {
        this.player_attack_sprite[FIRST_PLAYER].visible = false;
        this.player_attack_sprite[SECOND_PLAYER].visible = false;
        this.tactics_sprite.visible = false;

        if (this.current_phase == GamePhase.Changing) {
            this.game_phase_text.text = "Strategy";
            this.tactics_sprite.visible = true;

            if (this.current_player == FIRST_PLAYER) {
                this.current_player_text.text = "YOUR TURN";
            } else {
                this.current_player_text.text = "OPPONENT TURN";
            }
        } else if (this.current_phase == GamePhase.Matching) {
            this.player_attack_sprite[this.current_player].visible = true;
            this.game_phase_text.text = "Battle";

            if (this.current_player == FIRST_PLAYER) {
                this.current_player_text.text = "YOUR TURN";
            } else {
                this.current_player_text.text = "OPPONENT TURN";
            }
        }

    }

    set_player(current_player: number) {
        this.current_player = current_player;
        this.redraw_phase_status();
    }

    set_phase(current_phase: GamePhase) {
        this.current_phase = current_phase;
        this.redraw_phase_status();
    }
}
