import { HP_TEXT_FONT } from "./constants";
import {Card, generate_cards} from "./card"

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
    deck: Array<Card>;

    constructor() {
        this.hp_text = new createjs.Text("", HP_TEXT_FONT, "red");
        this.set_hp(START_HP);
        this.container = new createjs.Container();
        this.container.addChild(this.hp_text);
        this.deck = generate_cards(10);
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

    pick_card_from_deck() {
        // A bit of a hack
        if (this.deck.length == 0) {
            this.deck = generate_cards(10);
        }

        if (this.deck.length == 0) {
            return null;
        } else {
            return this.deck.shift();
        }
    }
};