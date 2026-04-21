class Pokemon {
    constructor(speciesData, level = 5, options = {}) {
        this.species = speciesData.name;
        this.growthRate = speciesData.growthRate || GameMath.growthRates.medium_fast;
        this.expYield = speciesData.expYield || 1;
        this.types = speciesData.types || (speciesData.type ? [speciesData.type] : ['normal']);
        this.type = this.types[0];
        this.baseStats = speciesData.baseStats || { hp: 50, atk: 50, def: 50, spAtk: 50, spDef: 50, spd: 50 };
        this.learnset = speciesData.learnset || [];
        this.level = level;
        this.experience = this.resolveExperience(options.experience, level);
        this.stats = this.calculateStats();
        this.maxHP = this.stats.hp;
        this.currentHP = options.currentHP ?? this.maxHP;
        this.moves = this.resolveMoves(options.moves || this.getMovesForLevel(this.level));
        this.resetBattleState();
    }

    resolveExperience(savedExperience, level) {
        const baseExp = GameMath.getExperienceForLevel(this.growthRate, level);
        if (typeof savedExperience !== 'number' || Number.isNaN(savedExperience)) {
            return baseExp;
        }

        if (savedExperience >= baseExp) {
            return savedExperience;
        }

        // Migrate older saves that stored EXP progress within the current level.
        return baseExp + Math.max(0, savedExperience);
    }

    getMovesForLevel(level) {
        if (!this.learnset.length) {
            return [];
        }

        return this.learnset
            .filter((entry) => entry.level <= level)
            .slice(-4)
            .map((entry) => entry.move);
    }

    resolveMoves(moveList) {
        return moveList
            .slice(0, 4)
            .map((move) => {
                if (typeof move === 'string') {
                    return { ...MoveData[move], id: move };
                }

                if (move && move.id && MoveData[move.id]) {
                    return { ...MoveData[move.id], ...move };
                }

                return move;
            })
            .filter(Boolean);
    }

    calculateStats() {
        return {
            hp: Math.floor(((2 * this.baseStats.hp) * this.level) / 100) + this.level + 10,
            atk: Math.floor(((2 * this.baseStats.atk) * this.level) / 100) + 5,
            def: Math.floor(((2 * this.baseStats.def) * this.level) / 100) + 5,
            spAtk: Math.floor(((2 * this.baseStats.spAtk) * this.level) / 100) + 5,
            spDef: Math.floor(((2 * this.baseStats.spDef) * this.level) / 100) + 5,
            spd: Math.floor(((2 * this.baseStats.spd) * this.level) / 100) + 5,
        };
    }

    gainExp(exp) {
        let leveledUp = false;
        const learnedMoves = [];
        this.experience += exp;

        while (this.level < 100 && this.experience >= GameMath.getExperienceForLevel(this.growthRate, this.level + 1)) {
            const result = this.levelUp();
            leveledUp = true;
            learnedMoves.push(...result.learnedMoves);
        }

        return {
            leveledUp,
            learnedMoves,
        };
    }

    levelUp() {
        const previousMaxHP = this.maxHP;
        this.level += 1;
        this.stats = this.calculateStats();
        this.maxHP = this.stats.hp;
        this.currentHP = Math.min(this.maxHP, this.currentHP + (this.maxHP - previousMaxHP));
        return {
            learnedMoves: this.learnMovesForLevel(this.level),
        };
    }

    learnMovesForLevel(level) {
        const learnedMoves = [];
        this.learnset
            .filter((entry) => entry.level === level)
            .forEach((entry) => {
                const learnedMove = this.learnMove(entry.move);
                if (learnedMove) {
                    learnedMoves.push(learnedMove.name || learnedMove.id || entry.move);
                }
            });
        return learnedMoves;
    }

    learnMove(moveName) {
        const resolvedMove = this.resolveMoves([moveName])[0];
        if (!resolvedMove) {
            return null;
        }

        const existingIds = this.moves.map((move) => move.id || move.name);
        if (existingIds.includes(resolvedMove.id || resolvedMove.name)) {
            return null;
        }

        if (this.moves.length < 4) {
            this.moves.push(resolvedMove);
            return resolvedMove;
        }

        const replaceIndex = this.getWeakestMoveIndex();
        this.moves[replaceIndex] = resolvedMove;
        return resolvedMove;
    }

    getWeakestMoveIndex() {
        return this.moves.reduce((weakestIndex, move, index) => {
            const weakestPower = this.getMoveDamageScore(this.moves[weakestIndex]);
            const currentPower = this.getMoveDamageScore(move);
            return currentPower < weakestPower ? index : weakestIndex;
        }, 0);
    }

    getMoveDamageScore(move) {
        return Number.isFinite(move?.power) ? move.power : 0;
    }

    takeDamage(damage) {
        this.currentHP = Math.max(0, this.currentHP - damage);
    }

    heal(amount = null) {
        if (amount === null) {
            this.currentHP = this.maxHP;
            return;
        }

        this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
    }

    isFainted() {
        return this.currentHP <= 0;
    }

    resetBattleState() {
        this.battleStages = {
            atk: 0,
            def: 0,
            spAtk: 0,
            spDef: 0,
            spd: 0,
            accuracy: 0,
            evasion: 0,
        };
        this.volatileStatus = {
            leechSeedSource: null,
        };
    }

    modifyBattleStage(stat, delta) {
        if (!this.battleStages || this.battleStages[stat] == null) {
            return 0;
        }

        const nextStage = Phaser.Math.Clamp(this.battleStages[stat] + delta, -6, 6);
        const appliedDelta = nextStage - this.battleStages[stat];
        this.battleStages[stat] = nextStage;
        return appliedDelta;
    }

    getModifiedStat(stat) {
        const stage = this.battleStages?.[stat] || 0;
        const baseValue = this.stats[stat] || 1;
        const [numerator, denominator] = GameMath.getStageMultiplier(stage);
        return Math.max(1, Math.floor((baseValue * numerator) / denominator));
    }

    getMove(index) {
        return this.moves[index] || null;
    }

    getStats() {
        return {
            species: this.species,
            level: this.level,
            hp: this.currentHP,
            maxHP: this.maxHP,
            atk: this.stats.atk,
            def: this.stats.def,
            spAtk: this.stats.spAtk,
            spDef: this.stats.spDef,
            spd: this.stats.spd,
            exp: this.getExpIntoCurrentLevel(),
            nextLevelExp: this.getExpNeededForNextLevel(),
        };
    }

    getExpIntoCurrentLevel() {
        return this.experience - GameMath.getExperienceForLevel(this.growthRate, this.level);
    }

    getExpNeededForNextLevel() {
        if (this.level >= 100) {
            return 1;
        }

        return GameMath.getExperienceForLevel(this.growthRate, this.level + 1)
            - GameMath.getExperienceForLevel(this.growthRate, this.level);
    }

    toJSON() {
        return {
            species: this.species,
            level: this.level,
            experience: this.experience,
            currentHP: this.currentHP,
            moves: this.moves.map((move) => move.id || move.name),
            types: this.types,
            growthRate: this.growthRate,
        };
    }

    static fromJSON(data, speciesData) {
        return new Pokemon(speciesData, data.level, {
            experience: data.experience,
            currentHP: data.currentHP,
            moves: data.moves,
        });
    }
}
