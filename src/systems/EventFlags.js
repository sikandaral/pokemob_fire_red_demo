const EventFlags = {
    defaults: Object.freeze({
        intro_seen: false,
        opening_intro_complete: false,
        town_arrival_seen: false,
        route_arrival_seen: false,
        route2_arrival_seen: false,
        forest_arrival_seen: false,
        viridian_arrival_seen: false,
        pewter_arrival_seen: false,
        mart_arrival_seen: false,
        lab_arrival_seen: false,
        gym_arrival_seen: false,
        oak_stop_seen: false,
        starter_received: false,
        lab_intro_complete: false,
        rival_battle_complete: false,
        got_oaks_parcel: false,
        delivered_oaks_parcel: false,
        pokedex_received: false,
        rival_pokedex_received: false,
        got_route1_potion: false,
        viridian_catching_tutorial_seen: false,
        teachy_tv_received: false,
        pewter_guide_seen: false,
        talked_to_guide: false,
        route_cleared: false,
        gym_unlocked: false,
        defeated_trainer_route1: false,
        defeated_trainer_gym: false,
        defeated_gym_leader: false,
        demo_complete: false,
    }),

    ensureState() {
        if (!window.gameState) {
            window.gameState = {};
        }

        if (!window.gameState.eventFlags || typeof window.gameState.eventFlags !== 'object') {
            window.gameState.eventFlags = {};
        }

        window.gameState.eventFlags = {
            ...this.defaults,
            ...window.gameState.eventFlags,
        };

        return window.gameState.eventFlags;
    },

    set(flag, value = true) {
        const flags = this.ensureState();
        flags[flag] = value;
    },

    get(flag) {
        const flags = this.ensureState();
        return Boolean(flags[flag]);
    },

    isSet(flag) {
        return this.get(flag);
    },

    toggle(flag) {
        this.set(flag, !this.get(flag));
    },

    getAll() {
        return { ...this.ensureState() };
    },

    load(savedFlags) {
        this.ensureState();
        if (savedFlags && typeof savedFlags === 'object') {
            window.gameState.eventFlags = {
                ...this.defaults,
                ...savedFlags,
            };
        }
    },

    reset() {
        this.ensureState();
        window.gameState.eventFlags = { ...this.defaults };
    },
};

Object.freeze(EventFlags);
