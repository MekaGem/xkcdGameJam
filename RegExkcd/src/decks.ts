import { randomInt, randomIndex } from "./utils";
import { Card } from "./card";

const CARD_COUNT = 30;

export class CardSpec {
    password: string;
    regex: string;
    image_index: number;
    original_key_class: CardClass;

    constructor(password: string, regex: string, image_index: number, original_key_class: CardClass) {
        this.password = password;
        this.regex = regex;
        this.image_index = image_index;
        this.original_key_class = original_key_class;
    }
};

let card_indexes = [];

export function draw_random_card_spec(cards: Array<CardSpec>): CardSpec {
    if (card_indexes.length === 0) {
        for (let i = 0; i < cards.length; i++) card_indexes.push(i);
    }
    let index_i = randomIndex(card_indexes.length);
    let card_i = card_indexes[index_i];
    card_indexes.splice(index_i, 1);
    // HACK.
    cards[card_i].image_index = card_i % CARD_COUNT;
    //console.log(`Drawing random card, card_i = ${card_i}, image = ${cards[card_i].image_index}`);
    return cards[card_i];
}

export enum CardClass {
    Letters, Digits, Symbols, Modifiers, Random
};

function resolve_random_class(card_class: CardClass, is_password: boolean) {
    if (card_class === CardClass.Random) {
        card_class = randomIndex(CardClass.Random);
        if (is_password) {
            while (card_class === CardClass.Modifiers) {
                card_class = randomIndex(CardClass.Random);
            }
        }
    }
    return card_class;
}

const LETTER_KEY_TEMPLATES = [
    "[A-Z]",
    "[a-z]",
];

const DIGITS_KEY_TEMPLATES = [
    "[0-9]", // same as \d
    "\\d",
    "000",
    "111",
];

const SYMBOLS_KEY_TEMPLATES = [
    "_",
    "\\\\",
    "\\'",
    "\\\"",
    ".",
    "\\D",
];

const MODIFIERS_KEY_TEMPLATES = [
    "{1,2}",
    "{2,3}",
    "*",
    "+",
];

function generate_key(card_class: CardClass) {
    card_class = resolve_random_class(card_class, false);

    if (card_class === CardClass.Letters) {
        return LETTER_KEY_TEMPLATES[randomIndex(LETTER_KEY_TEMPLATES.length)];
    } else if (card_class === CardClass.Digits) {
        return DIGITS_KEY_TEMPLATES[randomIndex(DIGITS_KEY_TEMPLATES.length)];
    } else if (card_class === CardClass.Symbols) {
        return SYMBOLS_KEY_TEMPLATES[randomIndex(SYMBOLS_KEY_TEMPLATES.length)];
    } else if (card_class === CardClass.Modifiers) {
        return MODIFIERS_KEY_TEMPLATES[randomIndex(MODIFIERS_KEY_TEMPLATES.length)];
    }
    console.error("generate_key: unknown card_class");
    return null;
}

const LETTER_PASSWORD_TEMPLATES = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
];

const DIGITS_PASSWORD_TEMPLATES = [
    "0123456789",
    "0",
    "1",
];

const SYMBOLS_PASSWORD_TEMPLATES = [
    "_",
    "\\",
    "\'",
    "\"",
];

function generate_password(card_class: CardClass) {
    card_class = resolve_random_class(card_class, true);

    let template: string;
    let length: number;
    if (card_class === CardClass.Letters) {
        template = LETTER_PASSWORD_TEMPLATES[randomIndex(LETTER_PASSWORD_TEMPLATES.length)];
        length = randomInt(3, 4);
    } else if (card_class === CardClass.Digits) {
        template = DIGITS_PASSWORD_TEMPLATES[randomIndex(DIGITS_PASSWORD_TEMPLATES.length)];
        length = 3; // randomInt(3, 5);
    } else if (card_class === CardClass.Symbols) {
        template = SYMBOLS_PASSWORD_TEMPLATES[randomIndex(SYMBOLS_PASSWORD_TEMPLATES.length)];
        length = 1;
    } else if (card_class === CardClass.Modifiers) {
        console.error("generate_password: can not use CardClass.Modifiers");
        return null;
    } else {
        console.error("generate_password: unknown card_class " + card_class);
        return null;
    }

    let password = ""
    for (let i = 0; i < length; ++i) {
        let index = randomIndex(template.length);
        password += template[index];
    }
    return password;
}

class CardTemplate {
    id: string;
    key_class: CardClass;
    password_classes: Array<CardClass>;

    constructor(id: string, key_class: CardClass, password_classes: Array<CardClass>) {
        this.id = id;
        this.key_class = key_class;
        this.password_classes = password_classes;
    }
}

const CARD_TEMPLATES = [
    new CardTemplate("L00", CardClass.Letters, [CardClass.Random]),
    new CardTemplate("L01", CardClass.Letters, [CardClass.Random, CardClass.Letters]),
    new CardTemplate("L02", CardClass.Letters, [CardClass.Symbols]),
    new CardTemplate("L03", CardClass.Letters, [CardClass.Symbols, CardClass.Letters]),
    new CardTemplate("L04", CardClass.Letters, [CardClass.Digits]),
    new CardTemplate("L04", CardClass.Letters, [CardClass.Digits, CardClass.Letters]),

    new CardTemplate("D00", CardClass.Digits, [CardClass.Random]),
    new CardTemplate("D01", CardClass.Digits, [CardClass.Random, CardClass.Letters]),
    new CardTemplate("D02", CardClass.Digits, [CardClass.Symbols]),
    new CardTemplate("D03", CardClass.Digits, [CardClass.Symbols, CardClass.Letters]),
    new CardTemplate("D04", CardClass.Digits, [CardClass.Letters]),

    new CardTemplate("S00", CardClass.Symbols, [CardClass.Random, CardClass.Random]),
    new CardTemplate("S01", CardClass.Symbols, [CardClass.Random, CardClass.Random]),

    new CardTemplate("M00", CardClass.Modifiers, [CardClass.Letters, CardClass.Letters, CardClass.Letters]),
    new CardTemplate("M01", CardClass.Modifiers, [CardClass.Digits, CardClass.Digits, CardClass.Digits]),
    new CardTemplate("M02", CardClass.Modifiers, [CardClass.Letters, CardClass.Letters, CardClass.Digits]),
    new CardTemplate("M03", CardClass.Modifiers, [CardClass.Digits, CardClass.Digits, CardClass.Letters]),
    new CardTemplate("M04", CardClass.Modifiers, [CardClass.Symbols, CardClass.Letters]),
    new CardTemplate("M05", CardClass.Modifiers, [CardClass.Symbols, CardClass.Digits]),
];

function generate_regex_class_cards(): Array<CardSpec> {
    let cards = new Array<CardSpec>();
    for (let i = 0; i < CARD_TEMPLATES.length; ++i) for (let k = 0; k < 2; k++) {
        let template = CARD_TEMPLATES[i];

        let id = template.id;
        let key = generate_key(template.key_class);
        let password = "";
        for (let j = 0; j < template.password_classes.length; ++j) {
            let tmp = generate_password(template.password_classes[j]);
            password += tmp;
        }

        //console.log("new card spec: ", id, key, password);
        cards.push(new CardSpec(password, key, i % CARD_COUNT, template.key_class));
    }

    return cards;
}

export const XKCD_MEME_CARDS = generate_regex_class_cards();
// [
//     new CardSpec('Tr0ub4dor&3', '[a-z]'),
//     new CardSpec('Serious PuTTY', '[a-z]'),
//     new CardSpec('tumblv3rs3', '[a-z]'),
//     new CardSpec('i12kissU', '[a-z]'),
//     new CardSpec('itsasecret', '[a-z]'),
//     new CardSpec('password', '[A-Z]'),
//     new CardSpec('******', '[A-Z]'),
//     new CardSpec('b33sw1tht1r3s', '[A-Z]'),
//     new CardSpec('Huge ass-box', '[A-Z]'),
//     new CardSpec('WE RISE', '\\s?[a-uC-E]'),
//     new CardSpec('DenverCoder9', '\\w'),
//     new CardSpec('123456789', '\\w'),
//     new CardSpec('qwerty', '\\d{1,2}'),
//     new CardSpec('f00tb411', '\\d{1,2}'),
//     new CardSpec('segF4ULT', '\\d{1,2}'),
//     new CardSpec('go ham or go home', '.\\d'),
//     new CardSpec('TH3C4K31S4L13', '.\\d'),
//     new CardSpec('sTrOnGpAsSwOrD', '\\D{2}'),
//     new CardSpec('xXxH4XX0RxXx', '\\D{2}'),
//     new CardSpec('DeepFriedSkittles', '.er'),
//     new CardSpec('\\\\"\\\'no\\\'\\escape\\"\\', '[oui].'),
//     new CardSpec('choKoBAnaNA', '(.)\\1+'),
//     new CardSpec('ilovepuppies', '[aeiou]+'),
//     new CardSpec('24-06-1985', '[a-n]{1,3}'),
//     new CardSpec('1337_4_L1F3', '[A-Z]{3,}'),
//     new CardSpec('hamster ball', '([a-z][A-Z]){1,3}'),
//     new CardSpec('100 Problems', '.[xkcd].'),
//     new CardSpec('f**k grapefruit', '[123]{1,3}'),
//     new CardSpec('fLyingfErret', '\\W{1,4}'),
//     new CardSpec('MansNotHot', '\\d\\D*\\d')
// ];

export const IPV4 = [
    "163.10.201.43",
    "217.79.198.104",
    "191.134.54.100",
    "99.120.177.211",
    "172.220.254.106"
];
