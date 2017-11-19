
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
