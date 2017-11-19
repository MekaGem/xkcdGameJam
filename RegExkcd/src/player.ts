import { HP_TEXT_FONT, START_HP } from "./constants";
import {Card, generate_cards, CardState} from "./card"
import { TiledLayout, LayoutDirection } from "./layout";

export function generate_players(): Array<PlayerState> {
    let player_states = new Array<PlayerState>(2);
    for (let i = 0; i < 2; ++i) {
        player_states[i] = new PlayerState();
    }
    return player_states;
}

export class Hand {
    cards: Array<Card>;
    container: TiledLayout;

    constructor(cards: Array<Card>) {
        this.cards = cards;
        this.container = new TiledLayout(LayoutDirection.Horizontal, 15);

        for (let i = 0; i < this.cards.length; ++i) {
            this.cards[i].change_state(CardState.InHand);
            this.container.addItem(this.cards[i].container);
        }
    }

    get_selected_for_swap() {
        for (let card of this.cards) {
            if (card.selected_for_swap) {
                return card;
            }
        }
        return null;
    }

    change_card(old_card: Card, new_card: Card) {
        let index = this.cards.indexOf(old_card);
        this.cards[index] = new_card;
        index = this.container.getChildIndex(old_card.container);
        this.container.removeChildAt(index);
        this.container.addChildAt(new_card.container, index);
        new_card.container.x = old_card.container.x;
        new_card.container.y = old_card.container.y;
        new_card.change_state(CardState.InHand);
    }
};

export class InPlay {
    cards: Array<Card>;
    container: TiledLayout;

    constructor(cards: Array<Card>) {
        this.cards = cards;
        this.container = new TiledLayout(LayoutDirection.Horizontal, 15);

        for (let i = 0; i < this.cards.length; ++i) {
            this.cards[i].state = CardState.InPlay;
            this.container.addItem(this.cards[i].container);
        }
    }

    get_selected_for_swap() {
        for (let card of this.cards) {
            if (card.selected_for_swap) {
                return card;
            }
        }
        return null;
    }
};

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