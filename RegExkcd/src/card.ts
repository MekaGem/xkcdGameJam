import {BORDER_SIZE, CARD_REGEX_TEXT_FONT, CARD_PASSWORD_TEXT_FONT, CARD_SELECTION_TEXT_FONT} from "./constants"
import {randomInt} from "utils";
import {CardSpec, draw_random_card_spec, XKCD_MEME_CARDS} from "decks";

const IMAGE_COUNT = 30;

export function card_from_spec(card_spec: CardSpec): Card {
    return new Card(card_spec.regex, card_spec.password, card_spec.image_index);
}

export function generate_cards(card_count: number): Array<Card> {
    let cards = new Array<Card>(card_count);
    for (let i = 0; i < card_count; ++i) {
        cards[i] = card_from_spec(draw_random_card_spec(XKCD_MEME_CARDS));
    }
    return cards;
}

export enum CardState {
    InPlay, InHand, Destoyed
};

export const CARD_SCALE = 0.7;
export const SWAP_HOVER = 0.15;

export class Card {
    regex: string;
    password: string;

    state: CardState;
    selected: boolean;

    regex_text: createjs.Text;
    password_text: createjs.Text;
    card_selection_number: createjs.Text;
    in_play_card_envelope: createjs.Container;
    in_play_card_bg: createjs.Sprite;
    in_hand_card_envelope: createjs.Sprite;
    container: createjs.Container;

    visible: boolean;
    container_shown: createjs.Container;
    container_hidden: createjs.Container;

    selected_for_swap: boolean;

    hover = 0;
    animating = false;

    // Unique card index.
    id: number;

    static card_count = 0;

    static card_sheets_initted = false;
    static card_sheet: createjs.SpriteSheet;

    constructor(regex: string, password: string, image_index: number) {
        if (!Card.card_sheets_initted) {
            Card.card_sheets_initted = true;
            Card.card_sheet = new createjs.SpriteSheet({
                images: ["img/cards_sprite.png"],
                frames: {
                    width: 200,
                    height: 300,
                    count: IMAGE_COUNT + 5,
                    regX: 0,
                    regY: 0,
                    spacing: 0,
                    margin: 0
                }
            });
        }

        this.regex = regex;
        this.password = password;
        this.id = ++Card.card_count;
        this.selected = false;

        this.container_shown = new createjs.Container();
        this.container_hidden = new createjs.Container();

        this.password_text = new createjs.Text(this.password, CARD_PASSWORD_TEXT_FONT);
        this.password_text.x = 50;
        this.password_text.y = 225;

        this.regex_text = new createjs.Text(this.regex, CARD_REGEX_TEXT_FONT);
        this.regex_text.x = 50;
        this.regex_text.y = 260;

        let card_width = 200;
        let card_height = 300;

        this.in_play_card_envelope = new createjs.Container();
        {
            this.in_play_card_bg = new createjs.Sprite(Card.card_sheet);
            this.in_play_card_bg.gotoAndStop(1);
            this.in_play_card_envelope.addChild(this.in_play_card_bg);

            let face = new createjs.Sprite(Card.card_sheet);
            face.gotoAndStop(5 + image_index);
            this.in_play_card_envelope.addChild(face);
        }

        this.in_hand_card_envelope = new createjs.Sprite(Card.card_sheet);
        this.in_hand_card_envelope.gotoAndStop(0);

        this.card_selection_number = new createjs.Text("", CARD_SELECTION_TEXT_FONT, "red");
        this.card_selection_number.x = card_width - 30;
        this.card_selection_number.y = 20;

        this.container_shown.addChild(this.in_play_card_envelope);
        this.container_shown.addChild(this.card_selection_number);
        this.container_shown.addChild(this.regex_text);
        this.container_shown.addChild(this.password_text);

        this.container_hidden.addChild(this.in_hand_card_envelope);

        this.container = new createjs.Container();
        this.container.regX = card_width / 2;
        this.container.regY = card_height / 2;
        this.container.x = card_width / 2 * CARD_SCALE;
        this.container.y = card_height / 2 * CARD_SCALE;
        this.container.setBounds(0, 0, card_width, card_height);

        this.container.scaleX = this.container.scaleY = CARD_SCALE;
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

    remove_password(regex: string) {
        this.password = this.password.replace(regex, '');
        console.log(`New password: ${this.password}`);
        this.password_text.text = this.password;
        if (this.password == "") {
            this.destroy();
        }
    }

    change_state(state: CardState) {
        this.state = state;
    }

    set_visible(visible: boolean, animate = false) {
        if (this.visible !== visible) {
            this.visible = visible;
            if (!animate) {
                this.container.removeAllChildren();
                if (visible) {
                    this.container.addChild(this.container_shown);
                } else {
                    this.container.addChild(this.container_hidden);
                }
            } else {
                this.animating = true;
                createjs.Tween.get(this.container)
                    .to({scaleX: 0}, 300)
                    .call(function(){
                        this.container.removeAllChildren();
                        this.container.addChild(visible ? this.container_shown : this.container_hidden);
                    }, null, this)
                    .to({scaleX: CARD_SCALE + SWAP_HOVER}, 300)
                    .to({scaleX: CARD_SCALE, scaleY: CARD_SCALE}, 500)
                    .call(function(){
                        this.animating = false;
                    }, null, this);
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

    update_hover(mouse) {
        if (this.animating) return;
        
        let local = this.container.globalToLocal(mouse.x, mouse.y);
        let bounds = this.container.getBounds();
        if (local.x >= bounds.x && local.y >= bounds.y &&
            local.x <= bounds.x + bounds.width && local.y <= bounds.y + bounds.height) {
            this.hover += 1;
        } else {
            this.hover -= 1;
        }
        if (this.hover > 14) this.hover = 14;
        if (this.hover < 0) this.hover = 0;
        this.container.scaleX = this.container.scaleY = CARD_SCALE + this.hover * 0.01;
    }
};
