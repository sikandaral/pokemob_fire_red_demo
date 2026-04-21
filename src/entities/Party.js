class Party {
    constructor() {
        this.pokemon = [];
        this.activeIndex = 0;
    }

    add(pokemon) {
        if (this.pokemon.length >= 6) {
            return false;
        }

        this.pokemon.push(pokemon);
        return true;
    }

    getActive() {
        if (!this.pokemon.length) {
            return null;
        }

        if (!this.pokemon[this.activeIndex] || this.pokemon[this.activeIndex].isFainted()) {
            const nextAliveIndex = this.pokemon.findIndex((pokemon) => !pokemon.isFainted());
            this.activeIndex = nextAliveIndex >= 0 ? nextAliveIndex : 0;
        }

        return this.pokemon[this.activeIndex] || null;
    }

    switchTo(index) {
        if (index < 0 || index >= this.pokemon.length) {
            return false;
        }

        this.activeIndex = index;
        return true;
    }

    get(index) {
        return this.pokemon[index] || null;
    }

    size() {
        return this.pokemon.length;
    }

    hasAlivePokemon() {
        return this.pokemon.some((pokemon) => !pokemon.isFainted());
    }

    healAll() {
        this.pokemon.forEach((pokemon) => pokemon.heal());
    }

    resetBattleState() {
        this.pokemon.forEach((pokemon) => {
            if (typeof pokemon.resetBattleState === 'function') {
                pokemon.resetBattleState();
            }
        });
    }

    getAll() {
        return [...this.pokemon];
    }

    toJSON() {
        return this.pokemon.map((pokemon) => pokemon.toJSON());
    }

    fromJSON(data) {
        this.pokemon = [];

        (data || []).forEach((pokemonData) => {
            const speciesData = PokemonData[pokemonData.species];
            if (speciesData) {
                this.add(Pokemon.fromJSON(pokemonData, speciesData));
            }
        });

        this.activeIndex = 0;
    }
}
