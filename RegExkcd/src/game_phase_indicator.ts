import { TiledLayout, LayoutDirection } from "./layout";
import { REGEX_STRING_TEXT_FONT, FIRST_PLAYER, GamePhase } from "./constants";


export class GamePhaseIndicator {
    container: createjs.Container;

    // Current regex string.
    regex_string_text: createjs.Text;

    // Current game phase.
    game_phase_text: createjs.Text;

    // Current player.
    current_player_text: createjs.Text;

    constructor() {
        this.container = new createjs.Container();
        this.game_phase_text = new createjs.Text("                            ", REGEX_STRING_TEXT_FONT, "red");
        this.regex_string_text = new createjs.Text("                  ", REGEX_STRING_TEXT_FONT, "red");
        this.current_player_text = new createjs.Text("                    ", REGEX_STRING_TEXT_FONT, "red");

        let horizonal = new TiledLayout(LayoutDirection.Horizontal, 90);
        horizonal.addItem(this.current_player_text);
        horizonal.addItem(this.game_phase_text, 40);
        horizonal.addItem(this.regex_string_text);
        this.container.addChild(horizonal);
    }

    set_regex_text(regex_text: string) {
        this.regex_string_text.text = regex_text;
    }

    set_player(current_player: number) {
        if (current_player == FIRST_PLAYER) {
            this.current_player_text.text = "YOUR TURN";
        } else {
            this.current_player_text.text = "OPPONENT TURN";
        }
    }

    set_phase(current_phase: GamePhase) {
        if (current_phase == GamePhase.Changing) {
            this.game_phase_text.text = "Strategy";
        }
        if (current_phase == GamePhase.Matching) {
            this.game_phase_text.text = "Battle";
        }
    }
}
