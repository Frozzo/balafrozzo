export class Charm {
    constructor(data) {
        Object.assign(this, data);
    }

    static listFromRaw(rawList) {
        return rawList.map(d => new Charm(d));
    }
}
