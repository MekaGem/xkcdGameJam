import { randomInt, randomIndex } from "./utils";
import { Card } from "./card";

export class CardSpec {
    password: string;
    regex: string;
    image_index: number;

    constructor(password: string, regex: string, image_index: number = 0) {
        this.password = password;
        this.regex = regex;
        this.image_index = image_index;
    }
};

export function draw_random_card_spec(cards: Array<CardSpec>): CardSpec {
    let card_i = randomInt(0, cards.length - 1);
    // HACK.
    cards[card_i].image_index = card_i % 25;
    return cards[card_i];
}

export let XKCD_MEME_CARDS = [
    new CardSpec('Tr0ub4dor&3', '[a-z]'),
    new CardSpec('Serious PuTTY', '[a-z]'),
    new CardSpec('tumblv3rs3', '[a-z]'),
    new CardSpec('i12kissU', '[a-z]'),
    new CardSpec('itsasecret', '[a-z]'),
    new CardSpec('password', '[A-Z]'),
    new CardSpec('******', '[A-Z]'),
    new CardSpec('b33sw1tht1r3s', '[A-Z]'),
    new CardSpec('Huge ass-box', '[A-Z]'),
    new CardSpec('WE RISE', '\\s?[a-uC-E]'),
    new CardSpec('DenverCoder9', '\\w'),
    new CardSpec('123456789', '\\w'),
    new CardSpec('qwerty', '\\d{1,2}'),
    new CardSpec('f00tb411', '\\d{1,2}'),
    new CardSpec('segF4ULT', '\\d{1,2}'),
    new CardSpec('go ham or go home', '.\\d'),
    new CardSpec('TH3C4K31S4L13', '.\\d'),
    new CardSpec('sTrOnGpAsSwOrD', '\\D{2}'),
    new CardSpec('xXxH4XX0RxXx', '\\D{2}'),
    new CardSpec('DeepFriedSkittles', '.er'),
    new CardSpec('\\\\"\\\'no\\\'\\escape\\"\\', '[oui].'),
    new CardSpec('choKoBAnaNA', '(.)\\1+'),
    new CardSpec('ilovepuppies', '[aeiou]+'),
    new CardSpec('24-06-1985', '[a-n]{1,3}'),
    new CardSpec('1337_4_L1F3', '[A-Z]{3,}'),
    new CardSpec('hamster ball', '([a-z][A-Z]){1,3}'),
    new CardSpec('100 Problems', '.[xkcd].'),
    new CardSpec('f**k grapefruit', '[123]{1,3}'),
    new CardSpec('fLyingfErret', '\\W{1,4}'),
    new CardSpec('MansNotHot', '\\d\\D*\\d')
];

enum CardClass {
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
    "0",
    "1",
];

const SYMBOLS_KEY_TEMPLATES = [
    "_",
    "\\\\",
    "\\'",
    "\\\"",
    ".",
];

const MODIFIERS_KEY_TEMPLATES = [
    "{1, 2}",
    "{3}",
    "{1,}",
    "*",
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
        length = randomInt(2, 4);
    } else if (card_class === CardClass.Digits) {
        template = DIGITS_PASSWORD_TEMPLATES[randomIndex(DIGITS_PASSWORD_TEMPLATES.length)];
        length = randomInt(2, 4);
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
    new CardTemplate("000", CardClass.Letters, [CardClass.Random, CardClass.Random]),
    new CardTemplate("001", CardClass.Letters, [CardClass.Random, CardClass.Random]),
    new CardTemplate("002", CardClass.Digits, [CardClass.Random, CardClass.Random]),
    new CardTemplate("003", CardClass.Digits, [CardClass.Random, CardClass.Random]),
    new CardTemplate("004", CardClass.Digits, [CardClass.Random, CardClass.Random]),
    new CardTemplate("005", CardClass.Symbols, [CardClass.Random, CardClass.Random]),
    new CardTemplate("006", CardClass.Symbols, [CardClass.Random, CardClass.Random]),
    new CardTemplate("007", CardClass.Modifiers, [CardClass.Random, CardClass.Random]),
    new CardTemplate("008", CardClass.Modifiers, [CardClass.Random, CardClass.Random]),
    new CardTemplate("009", CardClass.Modifiers, [CardClass.Random, CardClass.Random]),

    new CardTemplate("010", CardClass.Letters, [CardClass.Random, CardClass.Random]),
    new CardTemplate("011", CardClass.Letters, [CardClass.Random, CardClass.Random]),
];

function generate_regex_class_cards(): Array<CardSpec> {
    let cards = new Array<CardSpec>();
    for (let i = 0; i < CARD_TEMPLATES.length; ++i) {
        let template = CARD_TEMPLATES[i];

        let id = template.id;
        let key = generate_key(template.key_class);
        let password = "";
        for (let j = 0; j < template.password_classes.length; ++j) {
            let tmp = generate_password(template.password_classes[j]);
            password += tmp;
        }

        console.log("new card spec: ", id, key, password);
        cards.push(new CardSpec(password, key, i % 25));
    }

    XKCD_MEME_CARDS = cards;
    return cards;
}

export const REGEX_CLASS_CARDS = generate_regex_class_cards();

export const IPV4 = [
    "163.10.201.43",
    "217.79.198.104",
    "191.134.54.100",
    "99.120.177.211",
    "172.220.254.106"
];
