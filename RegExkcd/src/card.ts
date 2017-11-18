import {BORDER_SIZE, CARD_ATTACK_TEXT_FONT, CARD_DNA_TEXT_FONT, CARD_SELECTION_TEXT_FONT} from "./constants"
import {randomInt} from "utils";

// const WORDS = ["foo", "bar", "baz", "qux"];
const WORDS = ["foo", "bar", "qux"];

const CARDS = [
    {pass: 'Tr0ub4dor&3',                  regex: '[a-z]'},
    {pass: 'Serious PuTTY',                regex: '[a-z]'},
    {pass: 'tumblv3rs3',                   regex: '[a-z]'},
    {pass: 'i12kissU',                     regex: '[a-z]'},
    {pass: 'itsasecret',                   regex: '[a-z]'},
    {pass: 'password',                     regex: '[A-Z]'},
    {pass: '******',                       regex: '[A-Z]'},
    {pass: 'b33sw1tht1r3s',                regex: '[A-Z]'},
    {pass: 'Huge ass-box',                 regex: '[A-Z]'},
    {pass: 'WE RISE',                      regex: '\\s?[a-uC-E]'},
    {pass: 'DenverCoder9',                 regex: '\\w'},
    {pass: '123456789',                    regex: '\\w'},
    {pass: 'qwerty',                       regex: '\\d{1,2}'},
    {pass: 'f00tb411',                     regex: '\\d{1,2}'},
    {pass: 'segF4ULT',                     regex: '\\d{1,2}'},
    {pass: 'go ham or go home',            regex: '.\\d'},
    {pass: 'TH3C4K31S4L13',                regex: '.\\d'},
    {pass: 'sTrOnGpAsSwOrD',               regex: '\\D{2}'},
    {pass: 'xXxH4XX0RxXx',                 regex: '\\D{2}'},
    {pass: 'DeepFriedSkittles',            regex: '.er'},
    {pass: '\\\\"\\\'no\\\'\\escape\\"\\', regex: '[oui].'},
    {pass: 'choKoBAnaNA',                  regex: '(.)\\1+'},
    {pass: 'ilovepuppies',                 regex: '[aeiou]+'},
    {pass: '24-06-1985',                   regex: '[a-n]{1,3}'},
    {pass: '1337_4_L1F3',                  regex: '[A-Z]{3,}'},
    {pass: 'hamster ball',                 regex: '([a-z][A-Z]){1,3}'},
    {pass: '100 Problems',                 regex: '.[xkcd].'},
    {pass: 'f**k grapefruit',              regex: '[123]{1,3}'},
    {pass: 'fLyingfErret',                 regex: '\\W{1,4}'},
    {pass: 'MansNotHot',                   regex: '\\d\\D*\\d'}
]


export function generate_cards(card_count: number): Array<Card> {
    let cards = new Array<Card>(card_count);
    for (let i = 0; i < card_count; ++i) {
        let card_i = randomInt(0, CARDS.length - 1);
        let attack = CARDS[card_i].regex;
        let dna = CARDS[card_i].pass;
        cards[i] = new Card(dna, attack, card_i);
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
    in_play_card_envelope: createjs.Container;
    in_play_card_bg: createjs.Sprite;
    in_hand_card_envelope: createjs.Sprite;
    container: createjs.Container;

    visible: boolean;
    container_shown: createjs.Container;
    container_hidden: createjs.Container;

    selected_for_swap: boolean;

    // Unique card index.
    id: number;

    static card_count = 0;

    static card_sheets_initted = false;
    static card_sheet: createjs.SpriteSheet;
    static card_bg_sheet: createjs.SpriteSheet;

    constructor(attack: string, dna: string, card_id: number) {
        if (!Card.card_sheets_initted) {
            Card.card_sheets_initted = true;
            Card.card_sheet = new createjs.SpriteSheet({
                images: ["img/cards.png"],
                frames: {
                    width: 200,
                    height: 300,
                    count: 10,
                    regX: 0,
                    regY: 0,
                    spacing: 0,
                    margin: 0
                }
            });

            Card.card_bg_sheet = new createjs.SpriteSheet({
                images: ["img/card_background.png"],
                frames: {
                    width: 200,
                    height: 300,
                    count: 3,
                    regX: 0,
                    regY: 0,
                    spacing: 0,
                    margin: 0
                }
            });
        }

        this.attack = attack;
        this.dna = dna;
        this.id = ++Card.card_count;
        this.selected = false;

        this.container_shown = new createjs.Container();
        this.container_hidden = new createjs.Container();

        this.attack_text = new createjs.Text(this.attack, CARD_ATTACK_TEXT_FONT);
        this.attack_text.x = 50;
        this.attack_text.y = 225;
        this.dna_text = new createjs.Text(this.dna, CARD_DNA_TEXT_FONT);
        this.dna_text.x = 50;
        this.dna_text.y = 260;

        // let width = Math.max(this.attack_text.getMeasuredWidth(), this.dna_text.getMeasuredWidth());
        let card_width = 200;
        let card_height = 300;

        this.in_play_card_envelope = new createjs.Container();
        {
            this.in_play_card_bg = new createjs.Sprite(Card.card_bg_sheet);
            this.in_play_card_bg.gotoAndStop(1);
            this.in_play_card_envelope.addChild(this.in_play_card_bg);

            let face = new createjs.Sprite(Card.card_sheet);
            face.gotoAndStop(card_id % 10);
            this.in_play_card_envelope.addChild(face);
        }

        this.in_hand_card_envelope = new createjs.Sprite(Card.card_bg_sheet);
        this.in_hand_card_envelope.gotoAndStop(0);

        this.card_selection_number = new createjs.Text("", CARD_SELECTION_TEXT_FONT, "red");
        this.card_selection_number.x = card_width - 14;
        this.card_selection_number.y = this.attack_text.y;

        this.container_shown.addChild(this.in_play_card_envelope);
        this.container_shown.addChild(this.card_selection_number);
        this.container_shown.addChild(this.attack_text);
        this.container_shown.addChild(this.dna_text);

        this.container_hidden.addChild(this.in_hand_card_envelope);

        this.container = new createjs.Container();
        this.container.setBounds(0, 0, card_width, card_height);

        this.container.scaleX = this.container.scaleY = 0.7;
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
        if (this.visible !== visible) {
            this.visible = visible;
            this.container.removeAllChildren();
            if (visible) {
                this.container.addChild(this.container_shown);
            } else {
                this.container.addChild(this.container_hidden);
            }
        }
    }

    select_for_swap(selected_for_swap) {
        if (this.selected_for_swap !== selected_for_swap) {
            this.selected_for_swap = selected_for_swap;
            if (selected_for_swap) {
                this.in_play_card_bg.gotoAndStop(2);
            } else {
                this.in_play_card_bg.gotoAndStop(1);
            }
        }
    }
};
