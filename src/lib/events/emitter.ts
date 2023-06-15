export default class Emitter {
    private readonly events: Map<string, Function[]>;
    
    constructor() {
        this.events = new Map();
    }

    public getEvents(event: string) {
        return this.events.get(event) || [];
    }

    public setEvents(event: string, listeners: Function[]) {
        this.events.set(event, listeners);
    }

    public emit(event: string, ...args: any[]) {
        const listeners = this.getEvents(event);
        listeners.forEach((listener) => {
            listener(...args);
        });
    }

    public on(event: string, callback: Function) {
        const listeners = this.getEvents(event);
        listeners.push(callback);
        this.setEvents(event, listeners);
    }
}