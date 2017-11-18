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

    constructor() {
        this.hp = START_HP;
    }

    deal_damage(match_length: number): void {
        let damage = match_length / 3;
        this.hp -= damage;
        console.log(`Dealed ${damage} damage, current hp: ${this.hp}`);
    }
};