const GameMath = {
    growthRates: {
        medium_fast: 'medium_fast',
        erratic: 'erratic',
        fluctuating: 'fluctuating',
        medium_slow: 'medium_slow',
        fast: 'fast',
        slow: 'slow',
    },

    typeChart: {
        normal: { rock: 0.5, ghost: 0 },
        electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, ground: 0 },
        fire: { grass: 2, water: 0.5, fire: 0.5, rock: 0.5, bug: 2, ice: 2, steel: 2 },
        poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
        water: { fire: 2, water: 0.5, grass: 0.5, rock: 2, ground: 2 },
        grass: { water: 2, fire: 0.5, grass: 0.5, rock: 2, ground: 2, flying: 0.5, bug: 0.5, poison: 0.5 },
        bug: { grass: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, psychic: 2, dark: 2 },
        flying: { grass: 2, fighting: 2, bug: 2, rock: 0.5, electric: 0.5 },
        ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
        rock: { fire: 2, flying: 2, bug: 2, ice: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
    },

    physicalTypes: new Set(['normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel']),

    getMovePriority(move) {
        return move?.priority || 0;
    },

    getStageMultiplier(stage) {
        const stageTable = [
            [2, 8],
            [2, 7],
            [2, 6],
            [2, 5],
            [2, 4],
            [2, 3],
            [2, 2],
            [3, 2],
            [4, 2],
            [5, 2],
            [6, 2],
            [7, 2],
            [8, 2],
        ];
        return stageTable[Phaser.Math.Clamp(stage, -6, 6) + 6];
    },

    getAccuracyMultiplier(stage) {
        const bounded = Phaser.Math.Clamp(stage, -6, 6);
        if (bounded >= 0) {
            return [(3 + bounded), 3];
        }
        return [3, 3 - bounded];
    },

    isPhysicalMove(move) {
        if (move?.category) {
            return move.category === 'physical';
        }

        return this.physicalTypes.has(move?.type || 'normal');
    },

    getTypeEffectiveness(moveType, defenderTypes) {
        if (!moveType || !defenderTypes) {
            return 1;
        }

        const types = Array.isArray(defenderTypes) ? defenderTypes : [defenderTypes];
        return types.reduce((modifier, defenderType) => {
            if (!defenderType) {
                return modifier;
            }

            return modifier * (this.typeChart[moveType]?.[defenderType] ?? 1);
        }, 1);
    },

    calculateDamage(move, attacker, defender) {
        if (!move || move.power === 0) {
            return 0;
        }

        const attackStat = this.isPhysicalMove(move)
            ? attacker.getModifiedStat('atk')
            : attacker.getModifiedStat('spAtk');
        const defenseStat = this.isPhysicalMove(move)
            ? defender.getModifiedStat('def')
            : defender.getModifiedStat('spDef');
        const levelFactor = Math.floor((2 * attacker.level) / 5) + 2;
        let damage = Math.floor((levelFactor * move.power * attackStat) / Math.max(1, defenseStat));
        damage = Math.floor(damage / 50) + 2;

        if (move.type && attacker.types?.includes(move.type)) {
            damage = Math.floor(damage * 1.5);
        }

        damage = Math.floor(damage * this.getTypeEffectiveness(move.type, defender.types || defender.type));
        damage = Math.floor(damage * (Phaser.Math.Between(85, 100) / 100));

        return Math.max(1, damage);
    },

    calculateExpReward(defeated, options = {}) {
        const defeatedLevel = defeated?.level || 1;
        const expYield = defeated?.expYield || 1;
        let exp = Math.floor((expYield * defeatedLevel) / 7);

        if (options.isTrainerBattle) {
            exp = Math.floor((exp * 3) / 2);
        }

        return Math.max(1, exp);
    },

    doesMoveHit(move, attacker = null, defender = null) {
        if (!move || move.accuracy == null || move.accuracy === 0) {
            return true;
        }

        const [accNum, accDen] = this.getAccuracyMultiplier(attacker?.battleStages?.accuracy || 0);
        const [evaNum, evaDen] = this.getAccuracyMultiplier(defender?.battleStages?.evasion || 0);
        const effectiveAccuracy = move.accuracy * (accNum / accDen) * (evaDen / evaNum);
        return Phaser.Math.Between(1, 100) <= effectiveAccuracy;
    },

    determineTurnOrder(playerPokemon, enemyPokemon, playerMove, enemyMove) {
        const playerPriority = this.getMovePriority(playerMove);
        const enemyPriority = this.getMovePriority(enemyMove);

        if (playerPriority > enemyPriority) {
            return [playerPokemon, enemyPokemon];
        }

        if (enemyPriority > playerPriority) {
            return [enemyPokemon, playerPokemon];
        }

        return playerPokemon.stats.spd >= enemyPokemon.stats.spd
            ? [playerPokemon, enemyPokemon]
            : [enemyPokemon, playerPokemon];
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    getExperienceForLevel(growthRate, level) {
        const n = Math.max(1, level);
        const square = n * n;
        const cube = square * n;

        switch (growthRate) {
        case this.growthRates.fast:
            return Math.floor((4 * cube) / 5);
        case this.growthRates.medium_slow:
            return Math.floor((6 * cube) / 5 - (15 * square) + (100 * n) - 140);
        case this.growthRates.slow:
            return Math.floor((5 * cube) / 4);
        case this.growthRates.erratic:
            if (n <= 50) return Math.floor(((100 - n) * cube) / 50);
            if (n <= 68) return Math.floor(((150 - n) * cube) / 100);
            if (n <= 98) return Math.floor((((1911 - 10 * n) / 3) * cube) / 500);
            return Math.floor(((160 - n) * cube) / 100);
        case this.growthRates.fluctuating:
            if (n <= 15) return Math.floor((((Math.floor((n + 1) / 3)) + 24) * cube) / 50);
            if (n <= 36) return Math.floor(((n + 14) * cube) / 50);
            return Math.floor(((Math.floor(n / 2) + 32) * cube) / 50);
        case this.growthRates.medium_fast:
        default:
            return cube;
        }
    },

    getLevelFromExperience(growthRate, experience) {
        let level = 1;
        while (level <= 100 && this.getExperienceForLevel(growthRate, level) <= experience) {
            level += 1;
        }
        return level - 1;
    },
};

Object.freeze(GameMath);
