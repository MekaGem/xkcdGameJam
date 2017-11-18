import { HP_TEXT_FONT } from "./constants";

const START_HP = 10;

export function generate_players(): Array<PlayerState> {
    let player_states = new Array<PlayerState>(2);
    for (let i = 0; i < 2; ++i) {
        player_states[i] = new PlayerState();
    }
    return player_states;
}

export class PlayerState {
    hp: number;
    hp_text: createjs.Text;
    container: createjs.Container;

    constructor() {
        this.hp_text = new createjs.Text("", HP_TEXT_FONT, "red");
        this.set_hp(START_HP);
        this.container = new createjs.Container();
        this.container.addChild(this.hp_text);
    }

    set_hp(hp: number) {
        this.hp = hp;
        this.hp_text.text = "HP: " + this.hp.toString();
    }

    deal_damage(match_length: number): void {
        let damage = match_length;
        this.set_hp(this.hp - damage);
        console.log(`Dealed ${damage} damage, current hp: ${this.hp}`);

    }
};