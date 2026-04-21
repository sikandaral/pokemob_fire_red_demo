const SaveManager = {
    SAVE_KEY: 'firered_demo_save',

    normalizePosition(areaName, position) {
        const map = MapData[areaName];
        if (!map) {
            return { ...position };
        }

        const clamped = {
            x: Math.max(1, Math.min(map.width - 2, position.x)),
            y: Math.max(1, Math.min(map.height - 2, position.y)),
        };

        const tile = map.tiles?.[clamped.y]?.[clamped.x];
        if (GameConfig.WALKABLE_TILES.includes(tile)) {
            return clamped;
        }

        return { ...map.spawnPoint };
    },

    migrateLegacyTownPosition(position) {
        const shifted = {
            x: position.x + 2,
            y: position.y + 2,
        };

        return this.normalizePosition(GameConfig.AREAS.TOWN, shifted);
    },

    createBaseState() {
        return {
            playerParty: null,
            playerStarterSpecies: null,
            rivalStarterSpecies: null,
            currentArea: GameConfig.START_AREA,
            playerPosition: { ...GameConfig.START_POSITION },
            playerFacing: 'down',
            eventFlags: { ...EventFlags.defaults },
            inventory: {
                pokeBalls: 0,
                potions: 0,
            },
            lastInteriorSourceArea: null,
            lastPokemonCenterArea: null,
            currentObjective: GameConfig.DEFAULT_OBJECTIVE,
            currentTrainer: null,
            battleLog: [],
            gymCompleted: false,
        };
    },

    normalize(rawData = {}) {
        const baseState = this.createBaseState();
        const normalized = {
            ...baseState,
            ...rawData,
        };

        normalized.playerPosition = rawData.playerPosition
            ? { ...rawData.playerPosition }
            : { ...baseState.playerPosition };
        normalized.playerFacing = rawData.playerFacing || baseState.playerFacing;

        if (normalized.currentArea === GameConfig.AREAS.TOWN && rawData.playerPosition) {
            const looksLikeLegacyTownSave =
                rawData.playerPosition.x <= 19 &&
                rawData.playerPosition.y <= 14 &&
                (rawData.playerPosition.x !== GameConfig.START_POSITION.x ||
                    rawData.playerPosition.y !== GameConfig.START_POSITION.y);

            normalized.playerPosition = looksLikeLegacyTownSave
                ? this.migrateLegacyTownPosition(rawData.playerPosition)
                : this.normalizePosition(normalized.currentArea, normalized.playerPosition);
        } else {
            normalized.playerPosition = this.normalizePosition(normalized.currentArea, normalized.playerPosition);
        }

        normalized.eventFlags = {
            ...EventFlags.defaults,
            ...(rawData.eventFlags || {}),
        };

        normalized.inventory = {
            ...baseState.inventory,
            ...(rawData.inventory || {}),
        };
        normalized.lastInteriorSourceArea = rawData.lastInteriorSourceArea || baseState.lastInteriorSourceArea;
        normalized.lastPokemonCenterArea =
            rawData.lastPokemonCenterArea ||
            (normalized.currentArea === GameConfig.AREAS.POKEMON_CENTER &&
                (normalized.lastInteriorSourceArea === GameConfig.AREAS.PEWTER ||
                    normalized.lastInteriorSourceArea === GameConfig.AREAS.VIRIDIAN)
                ? normalized.lastInteriorSourceArea
                : null) ||
            (normalized.currentArea === GameConfig.AREAS.PEWTER || normalized.currentArea === GameConfig.AREAS.VIRIDIAN
                ? normalized.currentArea
                : baseState.lastPokemonCenterArea);

        normalized.rivalStarterSpecies = rawData.rivalStarterSpecies || baseState.rivalStarterSpecies;
        normalized.playerStarterSpecies =
            rawData.playerStarterSpecies ||
            rawData.playerParty?.[0]?.species ||
            normalized.playerParty?.[0]?.species ||
            baseState.playerStarterSpecies;
        normalized.currentObjective = rawData.currentObjective || baseState.currentObjective;
        normalized.battleLog = Array.isArray(rawData.battleLog) ? rawData.battleLog : [];
        normalized.gymCompleted = Boolean(
            rawData.gymCompleted || normalized.eventFlags.defeated_gym_leader || normalized.eventFlags.demo_complete
        );

        return normalized;
    },

    save(gameState) {
        try {
            const normalized = this.normalize(gameState);
            const saveData = {
                currentArea: normalized.currentArea,
                playerPosition: normalized.playerPosition,
                playerFacing: normalized.playerFacing,
                playerParty: normalized.playerParty ? normalized.playerParty.toJSON() : [],
                playerStarterSpecies: normalized.playerStarterSpecies,
                rivalStarterSpecies: normalized.rivalStarterSpecies,
                eventFlags: normalized.eventFlags,
                inventory: normalized.inventory,
                lastInteriorSourceArea: normalized.lastInteriorSourceArea,
                lastPokemonCenterArea: normalized.lastPokemonCenterArea,
                currentObjective: normalized.currentObjective,
                gymCompleted: normalized.gymCompleted,
                timestamp: Date.now(),
            };

            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    },

    load() {
        try {
            const rawData = localStorage.getItem(this.SAVE_KEY);
            if (!rawData) {
                return null;
            }

            const parsed = JSON.parse(rawData);
            return this.normalize(parsed);
        } catch (error) {
            console.error('Failed to load save:', error);
            return null;
        }
    },

    hasSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    },

    clearSave() {
        localStorage.removeItem(this.SAVE_KEY);
    },
};

Object.freeze(SaveManager);
