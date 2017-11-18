
export function randomInt(lower: number, upper: number): number {
    return lower + Math.floor(Math.random() * (upper - lower + 1))
}

export function clone_object(object) {
    return JSON.parse(JSON.stringify(object));
}
