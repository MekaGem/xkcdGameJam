import {TEXT_FONT, BORDER_SIZE} from "./constants"

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
    card_envelope: createjs.Shape;
    container: createjs.Container;

    // Unique card index.
    id: number;

    static card_count = 0; 

    constructor(attack: string, dna: string) {
        this.attack = attack;
        this.dna = dna;
        this.id = ++Card.card_count;
        this.selected = false;

        this.container = new createjs.Container();

        this.attack_text = new createjs.Text(this.attack, TEXT_FONT);
        this.attack_text.x += BORDER_SIZE;
        this.dna_text = new createjs.Text(this.dna, TEXT_FONT);
        this.dna_text.x += BORDER_SIZE;
        this.dna_text.y += this.attack_text.getMeasuredHeight();

        // let width = Math.max(this.attack_text.getMeasuredWidth(), this.dna_text.getMeasuredWidth());
        let card_width = 28 * 4;
        let card_height = this.attack_text.getMeasuredHeight() + this.dna_text.getMeasuredHeight() + 8;

        this.card_envelope = new createjs.Shape();
        this.card_envelope.graphics
            .setStrokeStyle(1)
            .beginStroke("#000000")
            .beginFill("yellow")
            .drawRect(0, 0, card_width, card_height);
        
        this.card_selection_number = new createjs.Text("", TEXT_FONT, "red");
        this.card_selection_number.x = card_width - 14;
        this.card_selection_number.y = this.attack_text.y;

        this.container.addChild(this.card_envelope);
        this.container.addChild(this.card_selection_number);
        this.container.addChild(this.attack_text);
        this.container.addChild(this.dna_text);

        this.container.setBounds(0, 0, card_width, card_height);
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
        this.state = CardState.Destoyed;
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
};
