import { randomInt } from "./utils";

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

export const XKCD_MEME_CARDS = [
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

export function draw_random_card_spec(cards: Array<CardSpec>): CardSpec {
    let card_i = randomInt(0, cards.length - 1);
    // HACK.
    cards[card_i].image_index = card_i;
    return cards[card_i];
}