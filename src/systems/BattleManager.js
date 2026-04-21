const BattleManager = {
    resolveTurn({ playerMove, enemyMove, playerPoke, enemyPoke, options = {} }) {
        const actions = [];
        const turnOrder = GameMath.determineTurnOrder(playerPoke, enemyPoke, playerMove, enemyMove);
        const turnActions = turnOrder.map((attacker) => {
            const isPlayer = attacker === playerPoke;
            return {
                attacker,
                defender: isPlayer ? enemyPoke : playerPoke,
                move: isPlayer ? playerMove : enemyMove,
                owner: isPlayer ? 'player' : 'enemy',
            };
        });

        for (const action of turnActions) {
            if (action.attacker.isFainted()) {
                continue;
            }

            const moveResult = this.executeMove(action.move, action.attacker, action.defender, action.owner, options);
            actions.push({
                type: 'move',
                owner: action.owner,
                attacker: action.attacker,
                defender: action.defender,
                move: action.move,
                ...moveResult,
            });

            if (action.defender.isFainted()) {
                actions.push({
                    type: 'faint',
                    target: action.defender,
                    owner: action.owner === 'player' ? 'enemy' : 'player',
                    message: `${action.defender.species} fainted!`,
                });
                break;
            }
        }

        this.applyEndOfTurnEffects(actions, playerPoke, enemyPoke);

        return {
            actions,
            playerPoke,
            enemyPoke,
        };
    },

    executeMove(move, attacker, defender, owner = null, options = {}) {
        if (!move) {
            return { message: `${attacker.species} hesitated.`, damage: 0, isStatusMove: false };
        }

        if (!GameMath.doesMoveHit(move, attacker, defender)) {
            return { message: `${attacker.species} used ${move.name}, but it missed!`, damage: 0, isStatusMove: false, missed: true };
        }

        if (move.power === 0) {
            return this.applyStatusMove(move, attacker, defender);
        }

        let damage = GameMath.calculateDamage(move, attacker, defender);
        if (options.trainer?.id === 'rival_lab_battle') {
            damage = owner === 'player'
                ? Math.max(1, Math.ceil(damage * 1.65))
                : Math.max(1, Math.floor(damage * 0.75));
        }
        const beforeDefenderHP = defender.currentHP;
        defender.takeDamage(damage);
        const afterDefenderHP = defender.currentHP;
        const typeEffectiveness = GameMath.getTypeEffectiveness(move.type, defender.types || defender.type);
        let message = `${attacker.species} used ${move.name}! ${damage} damage dealt.`;

        if (typeEffectiveness > 1) {
            message += ' It is super effective!';
        } else if (typeEffectiveness > 0 && typeEffectiveness < 1) {
            message += ' It is not very effective...';
        } else if (typeEffectiveness === 0) {
            message += ' It had no effect.';
        }

        return {
            message,
            damage,
            isStatusMove: false,
            typeEffectiveness,
            beforeDefenderHP,
            afterDefenderHP,
        };
    },

    applyStatusMove(move, attacker, defender) {
        if (move.effect === 'attack_down') {
            const applied = defender.modifyBattleStage('atk', -1);
            if (applied === 0) {
                return {
                    message: `${attacker.species} used ${move.name}, but ${defender.species}'s Attack will not go lower.`,
                    damage: 0,
                    isStatusMove: true,
                };
            }

            return {
                message: `${attacker.species} used ${move.name}! ${defender.species}'s Attack fell.`,
                damage: 0,
                isStatusMove: true,
            };
        }

        if (move.effect === 'defense_down') {
            const applied = defender.modifyBattleStage('def', -1);
            if (applied === 0) {
                return {
                    message: `${attacker.species} used ${move.name}, but ${defender.species}'s Defense will not go lower.`,
                    damage: 0,
                    isStatusMove: true,
                };
            }

            return {
                message: `${attacker.species} used ${move.name}! ${defender.species}'s Defense fell.`,
                damage: 0,
                isStatusMove: true,
            };
        }

        if (move.effect === 'defense_up') {
            const applied = attacker.modifyBattleStage('def', 1);
            if (applied === 0) {
                return {
                    message: `${attacker.species} used ${move.name}, but its Defense will not go higher.`,
                    damage: 0,
                    isStatusMove: true,
                };
            }

            return {
                message: `${attacker.species} used ${move.name}! Its Defense rose.`,
                damage: 0,
                isStatusMove: true,
            };
        }

        if (move.effect === 'defense_down_2') {
            const applied = defender.modifyBattleStage('def', -2);
            if (applied === 0) {
                return {
                    message: `${attacker.species} used ${move.name}, but ${defender.species}'s Defense will not go lower.`,
                    damage: 0,
                    isStatusMove: true,
                };
            }

            return {
                message: `${attacker.species} used ${move.name}! ${defender.species}'s Defense harshly fell.`,
                damage: 0,
                isStatusMove: true,
            };
        }

        if (move.effect === 'accuracy_down') {
            const applied = defender.modifyBattleStage('accuracy', -1);
            if (applied === 0) {
                return {
                    message: `${attacker.species} used ${move.name}, but ${defender.species}'s Accuracy will not go lower.`,
                    damage: 0,
                    isStatusMove: true,
                };
            }

            return {
                message: `${attacker.species} used ${move.name}! ${defender.species}'s Accuracy fell.`,
                damage: 0,
                isStatusMove: true,
            };
        }

        if (move.effect === 'speed_down') {
            const applied = defender.modifyBattleStage('spd', -1);
            if (applied === 0) {
                return {
                    message: `${attacker.species} used ${move.name}, but ${defender.species}'s Speed will not go lower.`,
                    damage: 0,
                    isStatusMove: true,
                };
            }

            return {
                message: `${attacker.species} used ${move.name}! ${defender.species}'s Speed fell.`,
                damage: 0,
                isStatusMove: true,
            };
        }

        if (move.effect === 'leech_seed') {
            if (defender.types?.includes('grass')) {
                return {
                    message: `${attacker.species} used ${move.name}, but it does not affect ${defender.species}.`,
                    damage: 0,
                    isStatusMove: true,
                };
            }

            if (defender.volatileStatus?.leechSeedSource) {
                return {
                    message: `${attacker.species} used ${move.name}, but ${defender.species} is already seeded.`,
                    damage: 0,
                    isStatusMove: true,
                };
            }

            defender.volatileStatus.leechSeedSource = attacker;
            return {
                message: `${attacker.species} used ${move.name}! ${defender.species} was seeded.`,
                damage: 0,
                isStatusMove: true,
            };
        }

        return {
            message: `${attacker.species} used ${move.name}.`,
            damage: 0,
            isStatusMove: true,
        };
    },

    applyEndOfTurnEffects(actions, playerPoke, enemyPoke) {
        [playerPoke, enemyPoke].forEach((pokemon) => {
            const source = pokemon?.volatileStatus?.leechSeedSource;
            if (!pokemon || !source || pokemon.isFainted()) {
                return;
            }

            const damage = Math.max(1, Math.floor(pokemon.maxHP / 8));
            const beforeDefenderHP = pokemon.currentHP;
            pokemon.takeDamage(damage);
            const healedAmount = Math.min(damage, source.maxHP - source.currentHP);
            if (healedAmount > 0) {
                source.heal(healedAmount);
            }

            actions.push({
                type: 'move',
                owner: source === playerPoke ? 'player' : 'enemy',
                attacker: source,
                defender: pokemon,
                move: { name: 'Leech Seed' },
                message: `${pokemon.species} was sapped by Leech Seed!`,
                damage,
                isStatusMove: true,
                beforeDefenderHP,
                afterDefenderHP: pokemon.currentHP,
            });

            if (pokemon.isFainted()) {
                actions.push({
                    type: 'faint',
                    target: pokemon,
                    owner: source === playerPoke ? 'enemy' : 'player',
                    message: `${pokemon.species} fainted!`,
                });
            }
        });
    },

    checkBattleEnd(playerPoke, enemyPoke) {
        if (playerPoke.isFainted()) {
            return 'player_loss';
        }

        if (enemyPoke.isFainted()) {
            return 'player_win';
        }

        return 'ongoing';
    },

    awardExp(victor, defeated, options = {}) {
        const exp = GameMath.calculateExpReward(defeated, options);
        const reward = victor.gainExp(exp);

        return {
            exp,
            leveledUp: reward.leveledUp,
            learnedMoves: reward.learnedMoves,
        };
    },

    estimateDamage(move, attacker, defender) {
        if (!move || move.power === 0) {
            return 0;
        }

        const attackStat = GameMath.isPhysicalMove(move)
            ? attacker.getModifiedStat('atk')
            : attacker.getModifiedStat('spAtk');
        const defenseStat = GameMath.isPhysicalMove(move)
            ? defender.getModifiedStat('def')
            : defender.getModifiedStat('spDef');
        const levelFactor = Math.floor((2 * attacker.level) / 5) + 2;
        let damage = Math.floor((levelFactor * move.power * attackStat) / Math.max(1, defenseStat));
        damage = Math.floor(damage / 50) + 2;

        if (move.type && attacker.types?.includes(move.type)) {
            damage = Math.floor(damage * 1.5);
        }

        damage = Math.floor(damage * GameMath.getTypeEffectiveness(move.type, defender.types || defender.type));
        damage = Math.floor(damage * 0.925);

        return Math.max(1, damage);
    },

    hasSmartTrainerAI(trainer) {
        const flags = trainer?.aiFlags || [];
        return flags.includes('AI_SCRIPT_TRY_TO_FAINT') || flags.includes('AI_SCRIPT_CHECK_VIABILITY');
    },

    hasUsefulPhysicalMove(moves = []) {
        return moves.some((move) => move?.power > 0 && GameMath.isPhysicalMove(move));
    },

    scoreDamagingMove(move, attacker, defender, isTrainerBattle) {
        const effectiveness = GameMath.getTypeEffectiveness(move.type, defender.types || defender.type);
        if (effectiveness === 0) {
            return 0;
        }

        const damage = this.estimateDamage(move, attacker, defender);
        let score = damage;

        score += (move.accuracy ?? 100) / 45;
        score += effectiveness > 1 ? 4 * effectiveness : 0;
        score += effectiveness > 0 && effectiveness < 1 ? -1.5 : 0;
        score += move.type && attacker.types?.includes(move.type) ? 1.5 : 0;
        score += isTrainerBattle ? 1 : 0;

        if (damage >= defender.currentHP) {
            score += 20;
        }

        return Math.max(0.25, score);
    },

    applyTrainerSpecificBias(score, move, attacker, defender, options = {}) {
        if (options.trainer?.id !== 'rival_lab_battle') {
            return score;
        }

        const targetLowHp = defender.currentHP / Math.max(1, defender.maxHP) <= 0.4;
        const attackStage = defender.battleStages?.atk || 0;
        const defenseStage = defender.battleStages?.def || 0;

        if (move.effect === 'attack_down') {
            if (attackStage === 0 && !targetLowHp) {
                return score + 3.5;
            }
            if (attackStage <= -1) {
                return Math.max(0.25, score - 5);
            }
        }

        if (move.effect === 'defense_down') {
            if (defenseStage === 0 && !targetLowHp) {
                return score + 3.5;
            }
            if (defenseStage <= -1) {
                return Math.max(0.25, score - 5);
            }
        }

        if (move.power > 0 && !targetLowHp) {
            return Math.max(0.25, score - 1);
        }

        return score;
    },

    scoreStatusMove(move, attacker, defender, options = {}) {
        const isTrainerBattle = options.battleType === 'trainer';
        const isSmartTrainer = this.hasSmartTrainerAI(options.trainer);
        const attackerHpRatio = attacker.currentHP / Math.max(1, attacker.maxHP);
        const defenderHpRatio = defender.currentHP / Math.max(1, defender.maxHP);
        const physicalPressure = this.hasUsefulPhysicalMove(attacker.moves);

        switch (move.effect) {
        case 'attack_down':
            if ((defender.battleStages?.atk || 0) <= -2) {
                return 0.25;
            }
            return attackerHpRatio >= 0.55 ? (isSmartTrainer ? 8 : 4.5) : 1.5;
        case 'defense_down':
            if ((defender.battleStages?.def || 0) <= -2 || !physicalPressure) {
                return 0.25;
            }
            return attackerHpRatio >= 0.45 && defenderHpRatio >= 0.3 ? (isSmartTrainer ? 7.5 : 4) : 1;
        case 'defense_down_2':
            if ((defender.battleStages?.def || 0) <= -4 || !physicalPressure) {
                return 0.25;
            }
            return attackerHpRatio >= 0.45 && defenderHpRatio >= 0.35 ? (isSmartTrainer ? 8.5 : 4.5) : 1;
        case 'accuracy_down':
            if ((defender.battleStages?.accuracy || 0) <= -2) {
                return 0.25;
            }
            return attackerHpRatio >= 0.5 ? (isSmartTrainer ? 6.5 : 3.5) : 1;
        case 'speed_down':
            if ((defender.battleStages?.spd || 0) <= -2) {
                return 0.25;
            }
            return attackerHpRatio >= 0.5 ? (isSmartTrainer ? 5.5 : 3) : 1;
        case 'defense_up':
            if ((attacker.battleStages?.def || 0) >= 2) {
                return 0.25;
            }
            return attackerHpRatio >= 0.6 ? (isTrainerBattle ? 5.5 : 2.5) : 1.5;
        case 'leech_seed':
            if (defender.types?.includes('grass') || defender.volatileStatus?.leechSeedSource) {
                return 0.25;
            }
            return defenderHpRatio >= 0.35 ? (isSmartTrainer ? 7 : 4) : 1.5;
        case 'field_only':
        case 'status_only':
        default:
            return isTrainerBattle && isSmartTrainer ? 1 : 0.25;
        }
    },

    chooseWeightedMove(scoredMoves) {
        const totalScore = scoredMoves.reduce((sum, entry) => sum + entry.score, 0);
        let roll = Phaser.Math.FloatBetween(0, totalScore);

        for (const entry of scoredMoves) {
            roll -= entry.score;
            if (roll <= 0) {
                return entry.move;
            }
        }

        return scoredMoves[scoredMoves.length - 1]?.move || null;
    },

    getEnemyMove(pokemon, opponent, options = {}) {
        const availableMoves = pokemon.moves || [];
        if (!availableMoves.length) {
            return { name: 'Struggle', power: 30, accuracy: 100 };
        }

        const isTrainerBattle = options.battleType === 'trainer';
        const scoredMoves = availableMoves.map((move) => ({
            move,
            score: move.power > 0
                ? this.scoreDamagingMove(move, pokemon, opponent, isTrainerBattle)
                : this.scoreStatusMove(move, pokemon, opponent, options),
        }));

        const bestScore = Math.max(...scoredMoves.map((entry) => entry.score));
        if (!Number.isFinite(bestScore) || bestScore <= 0) {
            return availableMoves[Phaser.Math.Between(0, availableMoves.length - 1)];
        }

        const scoreWindow = this.hasSmartTrainerAI(options.trainer) ? 2.5 : 1.5;
        const candidateMoves = scoredMoves.filter((entry) => entry.score >= bestScore - scoreWindow);
        return this.chooseWeightedMove(candidateMoves);
    },
};

Object.freeze(BattleManager);
