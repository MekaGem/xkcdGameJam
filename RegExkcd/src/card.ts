import {TEXT_FONT, BORDER_SIZE} from "./constants"
import {randomInt} from "utils";

// const WORDS = ["foo", "bar", "baz", "qux"];
const WORDS = ["foo", "bar", "qux"];

export function generate_cards(card_count: number): Array<Card> {
    let cards = new Array<Card>(card_count);
    for (let i = 0; i < card_count; ++i) {
        let attack = WORDS[randomInt(0, WORDS.length - 1)];
        let dna = ""
        let dna_parts = randomInt(1, 4);
        for (let j = 0; j < dna_parts; ++j) {
            dna += WORDS[randomInt(0, WORDS.length - 1)];
        }
        cards[i] = new Card(attack, dna);
    }
    return cards;
}

export enum CardState {
    InPlay, InHand, Destoyed
};

export class Card {
    attack: string;
    dna: string;

    state: CardState;
    selected: boolean;

    attack_text: createjs.Text;
    dna_text: createjs.Text;
    card_selection_number: createjs.Text;
    in_play_card_envelope: createjs.Shape;
    in_hand_card_envelope: createjs.Shape;
    container: createjs.Container;

    visible: boolean;
    container_shown: createjs.Container;
    container_hidden: createjs.Container;

    // Unique card index.
    id: number;

    static card_count = 0;

    constructor(attack: string, dna: string) {
        this.attack = attack;
        this.dna = dna;
        this.id = ++Card.card_count;
        this.selected = false;

        this.container_shown = new createjs.Container();
        this.container_hidden = new createjs.Container();

        this.attack_text = new createjs.Text(this.attack, TEXT_FONT);
        this.attack_text.x += BORDER_SIZE;
        this.dna_text = new createjs.Text(this.dna, TEXT_FONT);
        this.dna_text.x += BORDER_SIZE;
        this.dna_text.y += this.attack_text.getMeasuredHeight();

        // let width = Math.max(this.attack_text.getMeasuredWidth(), this.dna_text.getMeasuredWidth());
        let card_width = 28 * 4;
        let card_height = this.attack_text.getMeasuredHeight() + this.dna_text.getMeasuredHeight() + 8;

        this.in_play_card_envelope = new createjs.Shape();
        this.in_play_card_envelope.graphics
            .setStrokeStyle(1)
            .beginStroke("#000000")
            .beginFill("yellow")
            .drawRect(0, 0, card_width, card_height);

        this.in_hand_card_envelope = new createjs.Shape();
        this.in_hand_card_envelope.graphics
            .setStrokeStyle(1)
            .beginStroke("#000000")
            .beginFill("AAAAAA")
            .drawRect(0, 0, card_width, card_height);

        this.card_selection_number = new createjs.Text("", TEXT_FONT, "red");
        this.card_selection_number.x = card_width - 14;
        this.card_selection_number.y = this.attack_text.y;

        this.container_shown.addChild(this.in_play_card_envelope);
        this.container_shown.addChild(this.card_selection_number);
        this.container_shown.addChild(this.attack_text);
        this.container_shown.addChild(this.dna_text);

        this.container_hidden.addChild(this.in_hand_card_envelope);

        this.container = new createjs.Container();
        this.container.setBounds(0, 0, card_width, card_height);
        this.change_state(CardState.InPlay);
        this.set_visible(true);
    }

    select(index: number) {
        this.selected = true;
        this.card_selection_number.text = index.toString();
    }

    deselect() {
        this.selected = false;
        this.card_selection_number.text = "";
    }

    destroy() {
        console.log("Card destroyed");
        this.change_state(CardState.Destoyed);
        this.container.alpha = 0.5;
    }

    remove_dna(attack: string) {
        this.dna = this.dna.replace(attack, '');
        console.log(`New dna: ${this.dna}`);
        this.dna_text.text = this.dna;
        if (this.dna == "") {
            this.destroy();
        }
    }

    change_state(state: CardState) {
        this.state = state;
    }

    set_visible(visible: boolean) {
        if (this.visible != visible) {
            this.visible = visible;
            this.container.removeAllChildren();
            if (visible) {
                this.container.addChild(this.container_shown);
            } else {
                this.container.addChild(this.container_hidden);
            }
        }
    }
};
