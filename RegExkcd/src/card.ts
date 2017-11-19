import {BORDER_SIZE, CARD_REGEX_TEXT_FONT, CARD_PASSWORD_TEXT_FONT, CARD_SELECTION_TEXT_FONT, CARD_DAMAGE_TEXT_FONT} from "./constants"
import {randomInt, is_regex_valid, get_max_match} from "utils";
import {CardSpec, draw_random_card_spec, XKCD_MEME_CARDS, CardClass} from "decks";

const IMAGE_COUNT = 30;

export function card_from_spec(card_spec: CardSpec): Card {
    return new Card(card_spec.regex, card_spec.password, card_spec.image_index, card_spec.original_key_class);
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

const HIGHLIGHT_MAX = 10;

export class Card {
    regex: string;
    password: string;

    state: CardState;
    selected: boolean;

    regex_text: createjs.Text;
    regex_key_sprite: createjs.Sprite;
    password_text: createjs.Text;
    password_highlight: createjs.Shape;
    password_attack_highlight: createjs.Shape;

    card_selection_number: createjs.Text;
    in_play_card_envelope: createjs.Container;
    in_play_card_bg: createjs.Sprite;
    in_play_attacked: createjs.Sprite;
    in_play_selected: createjs.Sprite;
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

    card_class: CardClass;

    static card_count = 0;

    static card_sheets_initted = false;
    static card_sheet: createjs.SpriteSheet;
    static keys_sheet: createjs.SpriteSheet;

    constructor(regex: string, password: string, image_index: number, card_class: CardClass) {
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

            Card.keys_sheet = new createjs.SpriteSheet({
                images: ["img/keys_sprite.png"],
                frames: {
                    width: 25,
                    height: 25,
                    count: 4,
                }
            });
        }

        this.card_class = card_class;

        this.regex = regex;
        this.password = password;
        this.id = ++Card.card_count;
        this.selected = false;

        this.container_shown = new createjs.Container();
        this.container_hidden = new createjs.Container();

        this.password_text = new createjs.Text(this.password, CARD_PASSWORD_TEXT_FONT);
        this.password_text.x = 50;
        this.password_text.y = 225;

        this.password_highlight = new createjs.Shape();
        this.password_highlight.visible = false;
        this.password_highlight.x = this.password_text.x;
        this.password_highlight.y = this.password_text.y;

        this.password_attack_highlight = new createjs.Shape();
        this.password_attack_highlight.visible = false;
        this.password_attack_highlight.x = this.password_text.x;
        this.password_attack_highlight.y = this.password_text.y;

        this.regex_text = new createjs.Text(this.regex, CARD_REGEX_TEXT_FONT);
        this.regex_text.x = 50;
        this.regex_text.y = 260;

        this.regex_key_sprite = new createjs.Sprite(Card.keys_sheet);
        this.regex_key_sprite.gotoAndStop(card_class);
        this.regex_key_sprite.x = this.regex_text.x - 30;
        this.regex_key_sprite.y = this.regex_text.y - 5;

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

            this.in_play_attacked = new createjs.Sprite(Card.card_sheet);
            this.in_play_attacked.gotoAndStop(4);
            this.in_play_attacked.visible = false;

            this.in_play_card_envelope.addChild(this.in_play_attacked);

            this.in_play_selected = new createjs.Sprite(Card.card_sheet);
            this.in_play_selected.gotoAndStop(3);
            this.in_play_selected.visible = false;

            this.in_play_card_envelope.addChild(this.in_play_selected);
        }

        this.in_hand_card_envelope = new createjs.Sprite(Card.card_sheet);
        this.in_hand_card_envelope.gotoAndStop(0);

        this.card_selection_number = new createjs.Text("", CARD_SELECTION_TEXT_FONT, "white");
        this.card_selection_number.x = 153;
        this.card_selection_number.y = 175;

        this.container_shown.addChild(this.in_play_card_envelope);
        this.container_shown.addChild(this.card_selection_number);
        this.container_shown.addChild(this.regex_key_sprite);
        this.container_shown.addChild(this.regex_text);
        this.container_shown.addChild(this.password_attack_highlight);
        this.container_shown.addChild(this.password_highlight);
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
        this.in_play_selected.visible = true;
    }

    deselect() {
        this.selected = false;
        this.card_selection_number.text = "";
        this.in_play_selected.visible = false;
    }

    destroy() {
        console.log("Card destroyed");
        this.change_state(CardState.Destoyed);
        this.container.alpha = 0.5;
    }

    highlighting_this_frame = false;
    highlighting_attack_this_frame = false;

    pre_update_highlight() {
        this.highlighting_this_frame = false;
        this.highlighting_attack_this_frame = false;
    }

    get_regex_match_box(regex: string) {
        let result:any = {};
        result.show = false;
        if (is_regex_valid(regex)) {
            let max_match = get_max_match(regex, this.password);
            if (max_match.length > 0) {
                for (let i = 0; i <= this.password.length - max_match.length; i++) {
                    if (this.password.substr(i, max_match.length) == max_match) {
                        let pt:any = this.password_text;
                        result.x = pt._getMeasuredWidth(this.password.substr(0, i)) - 1;
                        result.width = pt._getMeasuredWidth(max_match) + 2;
                        break;
                    }
                }
                result.height = this.password_text.getMeasuredHeight() + 5;

                result.show = true;
            }
        }

        return result;
    }

    highlighting = false;
    highlight = 0;
    highlighted_regex = "";

    show_highlight(regex: string) {
        if (this.highlighting && this.highlighted_regex == regex) { this.highlighting_this_frame = true; return; }
        let result = this.get_regex_match_box(regex);

        if (result.show) {
            this.password_highlight.graphics.clear();
            this.password_highlight.graphics.beginFill("red").drawRoundRect(result.x, 0, result.width, result.height, 2);
            //this.password_highlight.graphics.endFill().beginStroke("red").moveTo(result.x, result.height).lineTo(result.x + result.width, result.height);
            this.password_highlight.alpha = 0;
            this.highlight = 0;

            this.highlighted_regex = regex;
            this.highlighting_this_frame = true;
        }
    }

    highlighting_attack = false;
    highlight_attack = 0;
    highlighted_attack_regex = "";

    show_attack_highlight(regex: string) {
        if (this.highlighting_attack && this.highlighted_attack_regex == regex) { this.highlighting_attack_this_frame = true; return; }
        let result = this.get_regex_match_box(regex);

        if (result.show) {
            this.password_attack_highlight.graphics.clear();
            this.password_attack_highlight.graphics.beginStroke("red").setStrokeStyle(2).drawRoundRect(result.x, 0, result.width, result.height, 2);
            this.password_attack_highlight.alpha = 0;
            this.highlight_attack = 0;

            this.highlighted_attack_regex = regex;
            this.highlighting_attack_this_frame = true;
        }
    }

    update_highlight() {
        this.highlighting = this.highlighting_this_frame;

        if (this.highlighting) {
            this.highlight++;
        } else {
            this.highlight--;
        }
        if (this.highlight > HIGHLIGHT_MAX) this.highlight = HIGHLIGHT_MAX;
        if (this.highlight < 0) this.highlight = 0;
        this.password_highlight.visible = this.highlight > 0;
        this.password_highlight.alpha = 0.15 * this.highlight / HIGHLIGHT_MAX;

        this.highlighting_attack = this.highlighting_attack_this_frame;

        if (this.highlighting_attack) {
            this.highlight_attack++;
        } else {
            this.highlight_attack--;
        }
        if (this.highlight_attack > HIGHLIGHT_MAX) this.highlight_attack = HIGHLIGHT_MAX;
        if (this.highlight_attack < 0) this.highlight_attack = 0;
        this.password_attack_highlight.visible = this.highlight_attack > 0;
        this.password_attack_highlight.alpha = 0.6 * this.highlight_attack / HIGHLIGHT_MAX;
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

    set_visible(visible: boolean, animate = false, put_down = true) {
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
                let inOut = createjs.Ease.getPowInOut(2);
                let tween = createjs.Tween.get(this.container)
                    .to({scaleX: 0}, 300, createjs.Ease.getPowIn(2))
                    .call(function(){
                        this.container.removeAllChildren();
                        this.container.addChild(visible ? this.container_shown : this.container_hidden);
                    }, null, this)
                    .to({scaleX: CARD_SCALE + SWAP_HOVER}, 300, createjs.Ease.getPowOut(2));
                if (put_down) tween.to({scaleX: CARD_SCALE, scaleY: CARD_SCALE}, 500, inOut);
                tween.call(function(){
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

    show_attacked(dmg: number) {
        this.animating = true;
        
        this.hover = 0;

        this.in_play_attacked.visible = true;
        this.in_play_attacked.alpha = 0;

        let dmg_text = new createjs.Text("-" + dmg.toString(), CARD_DAMAGE_TEXT_FONT, "white");
        dmg_text.x = 145;
        dmg_text.y = 170;
        dmg_text.alpha = 0;
        this.container.addChild(dmg_text);

        let in_out = createjs.Ease.getPowInOut(2);
        let out = createjs.Ease.getPowOut(2);

        createjs.Tween.get(this.container)
            .to({scaleX: CARD_SCALE + SWAP_HOVER, scaleY: CARD_SCALE + SWAP_HOVER}, 100, in_out)
            .wait(700)
            .to({scaleX: CARD_SCALE, scaleY: CARD_SCALE}, 100, in_out);
        createjs.Tween.get(this.container)
            .to({rotation: 5},  30)
            .to({rotation: -5}, 60)
            .to({rotation: 5},  60)
            .to({rotation: -5}, 60)
            .to({rotation: 5},  60)
            .to({rotation: -5}, 60)
            .to({rotation: 0},  30);
        createjs.Tween.get(dmg_text)
            .to({alpha: 1}, 300, out)
            .wait(500)
            .to({alpha: 0}, 300);
        createjs.Tween.get(this.in_play_attacked)
            .to({alpha: 1}, 500, out)
            .wait(300)
            .to({alpha: 0, visible: false}, 300)
            .call(function(){
                this.container.removeChild(dmg_text);
                this.animating = false;
            }, null, this);
    }
};
