
export function randomInt(lower: number, upper: number): number {
    return lower + Math.floor(Math.random() * (upper - lower + 1))
}

export function randomIntExclusive(lower: number, upper: number): number {
    return lower + Math.floor(Math.random() * (upper - lower))
}

export function randomIndex(size: number): number {
    return Math.floor(Math.random() * size)
}

export function clone_object(object) {
    return JSON.parse(JSON.stringify(object));
}

export function is_regex_valid(regex: string): boolean {
    try {
        new RegExp(regex, "g");
        return true;
    } catch(e) {
        return false;
    }
}

export function get_max_match(regex: string, password: string): string {
    let matches = password.match(new RegExp(regex, "g"));
    let max_match = "";
    if (matches) {
        for (const match of matches) {
            if (match.length > max_match.length) {
                max_match = match;
            }
        }
    }
    return max_match;
}

export function oppositePlayer(player: number): number {
    return 1 - player;
}
