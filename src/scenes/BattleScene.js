class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
        this.selectedMove = 0;
        this.battleState = 'intro';
        this.lastBattleResult = null;
        this.introStage = 0;
        this.pendingTurnActions = [];
        this.pendingTurnIndex = 0;
        this.selectedAction = 0;
        this.selectedBagItem = 0;
        this.selectedPartyIndex = 0;
        this.forcePartySwitch = false;
    }

    init(data) {
        this.playerParty = this.coerceParty(data.playerParty);
        this.enemyParty = this.coerceParty(data.enemyParty);
        this.trainer = data.trainer;
        this.battleType = data.battleType || (data.trainer ? 'trainer' : 'wild');
        this.onBattleEnd = data.onBattleEnd;
    }

    coerceParty(partyLike) {
        if (partyLike instanceof Party) {
            return partyLike;
        }

        const party = new Party();
        if (Array.isArray(partyLike)) {
            party.fromJSON(partyLike);
            return party;
        }

        if (partyLike?.pokemon && Array.isArray(partyLike.pokemon)) {
            const serialized = partyLike.pokemon.map((pokemon) => ({
                species: pokemon.species,
                level: pokemon.level,
                experience: pokemon.experience ?? pokemon.exp ?? 0,
                currentHP: pokemon.currentHP ?? pokemon.hp,
                moves: pokemon.moves,
            }));
            party.fromJSON(serialized);
        }

        return party;
    }

    create() {
        try {
            this.scene.setVisible(true, 'BattleScene');
            this.scene.bringToTop('BattleScene');
            this.cameras.main.setBackgroundColor('#000000');
            this.cameras.main.fadeIn(180, 0, 0, 0);

            this.playerParty?.resetBattleState?.();
            this.enemyParty?.resetBattleState?.();

            this.battleUI = new BattleUI(this);
            this.battleUI.create();

            this.playerActive = this.playerParty?.getActive?.();
            this.enemyActive = this.enemyParty?.getActive?.();

            if (!this.playerActive || !this.enemyActive) {
                throw new Error('Battle party setup failed');
            }

            this.battleUI.showBattle(this.playerActive, this.enemyActive, this.playerActive.moves, this.trainer, this.battleType);

            Movement.init();
            this.battleState = 'intro';
            this.selectedMove = 0;
            this.lastBattleResult = null;
            this.introStage = 0;
            this.pendingTurnActions = [];
            this.pendingTurnIndex = 0;
            this.actionList = this.getActionList();
            this.bagList = this.getBagList();
            this.commandList = this.playerActive.moves || [];
        } catch (error) {
            console.error('BattleScene failed to create:', error);
            this.renderStartupError(error);
        }
    }

    renderStartupError(error) {
        this.add.rectangle(GameConfig.SCREEN_WIDTH / 2, GameConfig.SCREEN_HEIGHT / 2, GameConfig.SCREEN_WIDTH, GameConfig.SCREEN_HEIGHT, 0x120c0c);
        this.add.text(24, 24, 'Battle scene failed to load.', {
            font: 'bold 20px Arial',
            fill: '#ffd8d8',
        });
        this.add.text(24, 60, String(error?.message || error), {
            font: '14px Arial',
            fill: '#fff0f0',
            wordWrap: { width: GameConfig.SCREEN_WIDTH - 48 },
        });
    }

    update() {
        Movement.updateFrame();

        if (this.battleState === 'intro' && Movement.isConfirmPressed()) {
            if (this.trainer?.id && this.introStage === 0) {
                this.introStage = 1;
                this.battleUI.showPokemonBattleIntro(this.playerActive, this.enemyActive, this.playerActive.moves, this.battleType);
                this.battleUI.updateLog(
                    `${this.trainer.name.toUpperCase()} sent out ${this.enemyActive.species.toUpperCase()}!\nGo! ${this.playerActive.species.toUpperCase()}!`
                );
                return;
            }
            this.battleState = 'select_action';
            this.battleUI.setSelectionMode();
            this.actionList = this.getActionList();
            this.battleUI.updateActionSelection(this.selectedAction, this.actionList);
            this.battleUI.updateLog(`What will ${this.playerActive.species.toUpperCase()} do?`);
            return;
        }

        if (this.battleState === 'select_action') {
            this.handleActionSelection();
            if (Movement.isConfirmPressed()) {
                this.executeAction();
            }
            return;
        }

        if (this.battleState === 'select_bag') {
            this.handleBagSelection();
            if (Movement.isSkipPressed()) {
                this.showActionMenu();
            } else if (Movement.isConfirmPressed()) {
                this.executeBagCommand();
            }
            return;
        }

        if (this.battleState === 'select_party') {
            this.handlePartySelection();
            if (Movement.isSkipPressed()) {
                if (!this.forcePartySwitch) {
                    this.showActionMenu();
                }
            } else if (Movement.isConfirmPressed()) {
                this.executePokemonSwitch();
            }
            return;
        }

        if (this.battleState === 'select_move') {
            this.handleMoveSelection();
            if (Movement.isSkipPressed()) {
                this.showActionMenu();
                return;
            }
            if (Movement.isConfirmPressed()) {
                this.executeRound();
            }
            return;
        }

        if (this.battleState === 'turn_message' && Movement.isConfirmPressed()) {
            this.playNextTurnAction();
            return;
        }

        if (this.battleState === 'battle_end' && Movement.isConfirmPressed()) {
            this.finishBattle();
        }
    }

    handleMoveSelection() {
        const moveDir = this.getMenuMovePressed();
        if (!moveDir) {
            return;
        }

        const cols = GameConfig.MOVE_MENU_COLS;
        const moveCount = this.commandList.length;
        const row = Math.floor(this.selectedMove / cols);
        const col = this.selectedMove % cols;
        let nextIndex = this.selectedMove;

        if (moveDir.dx !== 0) {
            nextIndex = row * cols + GameMath.clamp(col + moveDir.dx, 0, cols - 1);
        } else if (moveDir.dy !== 0) {
            nextIndex = GameMath.clamp(row + moveDir.dy, 0, Math.ceil(moveCount / cols) - 1) * cols + col;
        }

        nextIndex = GameMath.clamp(nextIndex, 0, moveCount - 1);
        if (nextIndex !== this.selectedMove) {
            this.selectedMove = nextIndex;
            this.battleUI.updateMoveSelection(this.selectedMove, this.commandList);
        }
    }

    handleActionSelection() {
        const moveDir = this.getMenuMovePressed();
        if (!moveDir) {
            return;
        }

        this.selectedAction = this.moveSelectionIndex(this.selectedAction, this.actionList.length, moveDir);
        this.battleUI.updateActionSelection(this.selectedAction, this.actionList);
    }

    handleBagSelection() {
        const moveDir = this.getMenuMovePressed();
        if (!moveDir) {
            return;
        }

        this.selectedBagItem = this.moveSelectionIndex(this.selectedBagItem, this.bagList.length, moveDir);
        this.battleUI.updateBagSelection(this.selectedBagItem, this.bagList);
    }

    handlePartySelection() {
        const moveDir = this.getMenuMovePressed();
        if (!moveDir) {
            return;
        }

        const partyList = this.getPartyList();
        if (moveDir.dy !== 0) {
            this.selectedPartyIndex = GameMath.clamp(this.selectedPartyIndex + moveDir.dy, 0, partyList.length - 1);
        } else if (moveDir.dx !== 0) {
            this.selectedPartyIndex = GameMath.clamp(this.selectedPartyIndex + moveDir.dx, 0, partyList.length - 1);
        }
        this.battleUI.updatePartySelection(this.selectedPartyIndex, partyList, this.forcePartySwitch);
    }

    getMenuMovePressed() {
        if (Movement.consumePressed('ArrowUp') || Movement.consumePressed('w')) return { dx: 0, dy: -1, name: 'up' };
        if (Movement.consumePressed('ArrowDown') || Movement.consumePressed('s')) return { dx: 0, dy: 1, name: 'down' };
        if (Movement.consumePressed('ArrowLeft') || Movement.consumePressed('a')) return { dx: -1, dy: 0, name: 'left' };
        if (Movement.consumePressed('ArrowRight') || Movement.consumePressed('d')) return { dx: 1, dy: 0, name: 'right' };
        return null;
    }

    moveSelectionIndex(currentIndex, itemCount, moveDir) {
        const cols = GameConfig.MOVE_MENU_COLS;
        const row = Math.floor(currentIndex / cols);
        const col = currentIndex % cols;
        let nextIndex = currentIndex;

        if (moveDir.dx !== 0) {
            nextIndex = row * cols + GameMath.clamp(col + moveDir.dx, 0, cols - 1);
        } else if (moveDir.dy !== 0) {
            nextIndex = GameMath.clamp(row + moveDir.dy, 0, Math.ceil(itemCount / cols) - 1) * cols + col;
        }

        return GameMath.clamp(nextIndex, 0, itemCount - 1);
    }

    getActionList() {
        return [
            { id: 'fight', name: 'FIGHT' },
            { id: 'bag', name: 'BAG' },
            { id: 'pokemon', name: 'POKéMON' },
            { id: 'run', name: 'RUN' },
        ];
    }

    getBagList() {
        const inventory = {
            pokeBalls: 0,
            potions: 0,
            ...(window.gameState?.inventory || {}),
        };

        return [
            { id: 'poke_ball', name: 'POKé BALL', count: inventory.pokeBalls || 0 },
            { id: 'potion', name: 'POTION', count: inventory.potions || 0 },
        ];
    }

    showActionMenu() {
        this.battleState = 'select_action';
        this.selectedAction = 0;
        this.selectedMove = 0;
        this.selectedBagItem = 0;
        this.selectedPartyIndex = 0;
        this.forcePartySwitch = false;
        this.actionList = this.getActionList();
        this.battleUI.setSelectionMode();
        this.battleUI.updateActionSelection(this.selectedAction, this.actionList);
        this.battleUI.updateLog(`What will ${this.playerActive.species.toUpperCase()} do?`);
    }

    showPartyMenu(forceSwitch = false) {
        this.forcePartySwitch = forceSwitch;
        this.battleState = 'select_party';
        this.selectedPartyIndex = forceSwitch
            ? this.getFirstUsablePartyIndex()
            : (this.playerParty.activeIndex || 0);
        this.battleUI.updatePartySelection(this.selectedPartyIndex, this.getPartyList(), forceSwitch);
        this.battleUI.updateLog(forceSwitch ? 'Choose next POKéMON.' : 'Choose a POKéMON.');
    }

    executeAction() {
        const action = this.actionList[this.selectedAction];
        if (action?.id === 'fight') {
            this.battleState = 'select_move';
            this.selectedMove = 0;
            this.commandList = this.playerActive.moves || [];
            this.battleUI.updateMoveSelection(this.selectedMove, this.commandList);
            return;
        }

        if (action?.id === 'bag') {
            this.battleState = 'select_bag';
            this.selectedBagItem = 0;
            this.bagList = this.getBagList();
            this.battleUI.updateBagSelection(this.selectedBagItem, this.bagList);
            this.battleUI.updateLog('Choose an item from the BAG.');
            return;
        }

        if (action?.id === 'pokemon') {
            this.showPartyMenu(false);
            return;
        }

        if (action?.id === 'run') {
            if (this.battleType === 'trainer') {
                this.battleUI.setTextMode('Battle text');
                this.battleUI.updateLog("No! There's no running from a TRAINER battle!");
                this.battleState = 'turn_message';
                this.pendingTurnActions = [];
                return;
            }

            this.lastBattleResult = {
                playerWon: true,
                escaped: true,
                trainer: null,
                battleType: 'wild',
                enemySpecies: this.enemyActive?.species,
            };
            this.battleUI.setTextMode('Battle result');
            this.battleUI.updateLog('Got away safely!');
            this.battleState = 'battle_end';
        }
    }

    executeRound() {
        const playerMove = this.playerActive.getMove(this.selectedMove);
        const enemyMove = BattleManager.getEnemyMove(this.enemyActive, this.playerActive, {
            battleType: this.battleType,
            trainer: this.trainer,
        });
        const result = BattleManager.resolveTurn({
            playerMove,
            enemyMove,
            playerPoke: this.playerActive,
            enemyPoke: this.enemyActive,
            options: {
                trainer: this.trainer,
                battleType: this.battleType,
            },
        });

        this.battleUI.setTextMode('Battle text');
        this.pendingTurnActions = result.actions || [];
        this.pendingTurnIndex = 0;
        this.battleState = 'turn_animating';
        this.playNextTurnAction();
    }

    executeBagCommand() {
        const item = this.bagList[this.selectedBagItem];
        if (item?.id === 'poke_ball') {
            this.executeCatchAttempt();
            return;
        }

        if (item?.id === 'potion') {
            this.executePotionUse();
        }
    }

    getPartyList() {
        return this.playerParty.getAll().map((pokemon, index) => ({
            id: index,
            name: pokemon.species,
            level: pokemon.level,
            hp: pokemon.currentHP,
            maxHP: pokemon.maxHP,
            active: index === this.playerParty.activeIndex,
            fainted: pokemon.isFainted(),
        }));
    }

    getFirstUsablePartyIndex() {
        const partyList = this.getPartyList();
        const index = partyList.findIndex((pokemon) => !pokemon.fainted && !pokemon.active);
        if (index >= 0) {
            return index;
        }

        return Math.max(0, partyList.findIndex((pokemon) => !pokemon.fainted));
    }

    executePokemonSwitch() {
        const partyList = this.getPartyList();
        const selected = partyList[this.selectedPartyIndex];
        if (!selected) {
            this.showActionMenu();
            return;
        }

        if (selected.fainted) {
            this.battleUI.setTextMode('Battle text');
            this.battleUI.updateLog(`${selected.name.toUpperCase()} has no energy left!`);
            this.battleState = 'turn_message';
            this.pendingTurnActions = [];
            return;
        }

        if (selected.active) {
            this.battleUI.setTextMode('Battle text');
            this.battleUI.updateLog(`${selected.name.toUpperCase()} is already in battle!`);
            this.battleState = 'turn_message';
            this.pendingTurnActions = [];
            return;
        }

        const wasForcedSwitch = this.forcePartySwitch;
        this.forcePartySwitch = false;
        this.playerActive.resetBattleState?.();
        this.playerParty.switchTo(this.selectedPartyIndex);
        this.playerActive = this.playerParty.getActive();
        this.playerActive.resetBattleState?.();

        this.battleUI.setTextMode('Battle text');
        this.pendingTurnActions = [
            {
                type: 'switch',
                target: this.playerActive,
                message: `Go! ${this.playerActive.species.toUpperCase()}!`,
            },
        ];

        if (!wasForcedSwitch) {
            this.pendingTurnActions.push({
                type: 'enemy_after_switch',
            });
        }

        this.pendingTurnIndex = 0;
        this.battleState = 'turn_animating';
        this.playNextTurnAction();
    }

    executeCatchAttempt() {
        const inventory = window.gameState?.inventory || {};
        const ballCount = inventory.pokeBalls || 0;

        this.battleUI.setTextMode('Battle text');
        if (this.battleType === 'trainer') {
            this.battleUI.updateLog("The TRAINER blocked the BALL!");
            this.battleState = 'turn_message';
            this.pendingTurnActions = [];
            return;
        }

        if (ballCount <= 0) {
            this.battleUI.updateLog('You have no POKé BALLS left!');
            this.battleState = 'turn_message';
            this.pendingTurnActions = [];
            return;
        }

        inventory.pokeBalls = Math.max(0, ballCount - 1);
        window.gameState.inventory = inventory;

        const catchResult = this.tryCatchPokemon();
        if (catchResult.caught) {
            this.lastBattleResult = {
                playerWon: true,
                caught: true,
                trainer: null,
                battleType: 'wild',
                enemySpecies: this.enemyActive?.species,
            };
            this.pendingTurnActions = [{
                type: 'catch',
                caught: true,
                target: this.enemyActive,
                message: `Gotcha! ${this.enemyActive.species.toUpperCase()} was caught!`,
            }];
            this.pendingTurnIndex = 0;
            this.battleState = 'turn_animating';
            this.playNextTurnAction();
            return;
        }

        const enemyMove = BattleManager.getEnemyMove(this.enemyActive, this.playerActive, {
            battleType: this.battleType,
            trainer: this.trainer,
        });
        const moveResult = BattleManager.executeMove(enemyMove, this.enemyActive, this.playerActive, 'enemy', {
            trainer: this.trainer,
            battleType: this.battleType,
        });

        this.pendingTurnActions = [
            {
                type: 'catch',
                caught: false,
                owner: 'player',
                attacker: this.playerActive,
                defender: this.enemyActive,
                target: this.enemyActive,
                message: catchResult.message,
            },
            {
                type: 'move',
                owner: 'enemy',
                attacker: this.enemyActive,
                defender: this.playerActive,
                move: enemyMove,
                ...moveResult,
            },
        ];

        if (this.playerActive.isFainted()) {
            this.pendingTurnActions.push({
                type: 'faint',
                target: this.playerActive,
                owner: 'enemy',
                message: `${this.playerActive.species} fainted!`,
            });
        }

        this.pendingTurnIndex = 0;
        this.battleState = 'turn_animating';
        this.playNextTurnAction();
    }

    executePotionUse() {
        const inventory = window.gameState?.inventory || {};
        const potionCount = inventory.potions || 0;

        this.battleUI.setTextMode('Battle text');
        if (potionCount <= 0) {
            this.battleUI.updateLog('You have no POTIONS left!');
            this.battleState = 'turn_message';
            this.pendingTurnActions = [];
            return;
        }

        if (this.playerActive.currentHP >= this.playerActive.maxHP) {
            this.battleUI.updateLog(`${this.playerActive.species.toUpperCase()} is already healthy.`);
            this.battleState = 'turn_message';
            this.pendingTurnActions = [];
            return;
        }

        inventory.potions = Math.max(0, potionCount - 1);
        window.gameState.inventory = inventory;
        const beforeHP = this.playerActive.currentHP;
        this.playerActive.heal(20);

        const enemyMove = BattleManager.getEnemyMove(this.enemyActive, this.playerActive, {
            battleType: this.battleType,
            trainer: this.trainer,
        });
        const moveResult = BattleManager.executeMove(enemyMove, this.enemyActive, this.playerActive, 'enemy', {
            trainer: this.trainer,
            battleType: this.battleType,
        });

        this.pendingTurnActions = [
            {
                type: 'move',
                owner: 'player',
                attacker: this.playerActive,
                defender: this.playerActive,
                move: { name: 'POTION' },
                message: `You used a POTION! ${this.playerActive.species} recovered ${this.playerActive.currentHP - beforeHP} HP.`,
                damage: 0,
                isStatusMove: true,
            },
            {
                type: 'move',
                owner: 'enemy',
                attacker: this.enemyActive,
                defender: this.playerActive,
                move: enemyMove,
                ...moveResult,
            },
        ];

        if (this.playerActive.isFainted()) {
            this.pendingTurnActions.push({
                type: 'faint',
                target: this.playerActive,
                owner: 'enemy',
                message: `${this.playerActive.species} fainted!`,
            });
        }

        this.pendingTurnIndex = 0;
        this.battleState = 'turn_animating';
        this.playNextTurnAction();
    }

    tryCatchPokemon() {
        const hpRatio = this.enemyActive.currentHP / Math.max(1, this.enemyActive.maxHP);
        const speciesData = PokemonData[this.enemyActive.species];
        const catchRate = speciesData?.catchRate || 120;
        const hpBonus = 1 - hpRatio;
        const chance = GameMath.clamp((catchRate / 255) * 0.35 + hpBonus * 0.65, 0.08, 0.95);
        const caught = Math.random() < chance;

        if (!caught) {
            return {
                caught: false,
                message: this.enemyActive.currentHP <= Math.floor(this.enemyActive.maxHP / 3)
                    ? 'Aargh! Almost had it!'
                    : 'Oh no! The POKéMON broke free!',
            };
        }

        if (speciesData && window.gameState?.playerParty instanceof Party) {
            window.gameState.playerParty.add(new Pokemon(speciesData, this.enemyActive.level, {
                currentHP: this.enemyActive.currentHP,
                moves: this.enemyActive.moves,
            }));
        }

        return { caught: true };
    }


    playNextTurnAction() {
        if (this.pendingTurnIndex >= this.pendingTurnActions.length) {
            this.pendingTurnActions = [];
            this.pendingTurnIndex = 0;
            this.advanceBattleState();
            return;
        }

        const action = this.pendingTurnActions[this.pendingTurnIndex];
        this.pendingTurnIndex += 1;

        if (action.type === 'faint') {
            this.battleUI.updateLog(action.message);
            this.battleUI.animateFaint(action.target, () => {
                this.battleUI.updateHP(this.playerActive, this.enemyActive);
                if (action.target === this.playerActive && this.playerParty.hasAlivePokemon()) {
                    this.pendingTurnActions = [];
                    this.pendingTurnIndex = 0;
                    this.showPartyMenu(true);
                    return;
                }

                this.battleState = 'turn_message';
            });
            return;
        }

        if (action.type === 'catch') {
            this.battleUI.updateLog('You threw a POKé BALL!');
            this.battleUI.animatePokeBallThrow(action.target, action.caught, () => {
                this.battleUI.updateHP(this.playerActive, this.enemyActive);
                this.battleUI.updateLog(action.message);
                this.battleState = 'turn_message';
            });
            return;
        }

        if (action.type === 'switch') {
            this.battleUI.updateLog(action.message);
            this.battleUI.animatePlayerSwitch(action.target, () => {
                this.battleUI.updateHP(this.playerActive, this.enemyActive, true);
                this.battleState = 'turn_message';
            });
            return;
        }

        if (action.type === 'enemy_after_switch') {
            const enemyMove = BattleManager.getEnemyMove(this.enemyActive, this.playerActive, {
                battleType: this.battleType,
                trainer: this.trainer,
            });
            const moveResult = BattleManager.executeMove(enemyMove, this.enemyActive, this.playerActive, 'enemy', {
                trainer: this.trainer,
                battleType: this.battleType,
            });
            const moveAction = {
                type: 'move',
                owner: 'enemy',
                attacker: this.enemyActive,
                defender: this.playerActive,
                move: enemyMove,
                ...moveResult,
            };

            if (this.playerActive.isFainted()) {
                this.pendingTurnActions.splice(this.pendingTurnIndex, 0, {
                    type: 'faint',
                    target: this.playerActive,
                    owner: 'enemy',
                    message: `${this.playerActive.species} fainted!`,
                });
            }

            this.battleUI.updateLog(moveAction.message);
            this.battleUI.animateMove(moveAction, () => {
                this.battleUI.updateHP(this.playerActive, this.enemyActive);
                this.battleState = 'turn_message';
            });
            return;
        }

        this.battleUI.updateLog(action.message);
        this.battleUI.animateMove(action, () => {
            this.battleUI.updateHP(this.playerActive, this.enemyActive);
            this.battleState = 'turn_message';
        });
    }

    advanceBattleState() {
        if (this.lastBattleResult?.caught) {
            this.battleUI.setTextMode('Battle result');
            this.battleUI.updateLog(`Gotcha! ${this.enemyActive.species.toUpperCase()} was caught!`);
            this.battleState = 'battle_end';
            return;
        }

        if (this.playerActive?.isFainted?.() && this.playerParty.hasAlivePokemon()) {
            this.showPartyMenu(true);
            return;
        }

        if (this.enemyActive?.isFainted?.() && this.enemyParty.hasAlivePokemon()) {
            this.sendOutNextEnemyPokemon();
            return;
        }

        const status = BattleManager.checkBattleEnd(this.playerActive, this.enemyActive);
        if (status === 'ongoing') {
            this.showActionMenu();
            return;
        }

        if (status === 'player_win') {
            const reward = BattleManager.awardExp(this.playerActive, this.enemyActive, {
                isTrainerBattle: Boolean(this.trainer),
            });
            this.lastBattleResult = {
                playerWon: true,
                trainer: this.trainer,
                battleType: this.battleType,
                enemySpecies: this.enemyActive?.species,
                expAwarded: reward.exp,
                leveledUp: reward.leveledUp,
                learnedMoves: reward.learnedMoves || [],
            };
            this.battleUI.updateHP(this.playerActive, this.enemyActive);
            this.battleUI.setTextMode('Battle result');
            this.battleUI.updateLog('Enemy down! Return to the field.');
            this.battleState = 'battle_end';
            return;
        }

        this.lastBattleResult = {
            playerWon: false,
            trainer: this.trainer,
            battleType: this.battleType,
            enemySpecies: this.enemyActive?.species,
        };
        this.battleUI.setTextMode('Battle result');
        this.battleUI.updateLog('Your Pokemon fainted. Return to town.');
        this.battleState = 'battle_end';
    }

    sendOutNextEnemyPokemon() {
        const reward = BattleManager.awardExp(this.playerActive, this.enemyActive, {
            isTrainerBattle: Boolean(this.trainer),
        });
        const nextIndex = this.enemyParty.getAll().findIndex((pokemon, index) =>
            index !== this.enemyParty.activeIndex && !pokemon.isFainted()
        );

        if (nextIndex < 0) {
            this.battleState = 'battle_end';
            return;
        }

        this.enemyParty.switchTo(nextIndex);
        this.enemyActive = this.enemyParty.getActive();
        this.enemyActive.resetBattleState?.();
        this.battleUI.drawPokemonSprite(this.enemyActive, true);
        this.battleUI.updateHP(this.playerActive, this.enemyActive, true);
        this.battleUI.setTextMode('Battle text');

        const expLine = reward?.exp ? `${this.playerActive.species.toUpperCase()} gained ${reward.exp} EXP.\n` : '';
        this.battleUI.updateLog(`${expLine}${this.trainer?.name?.toUpperCase() || 'FOE'} sent out ${this.enemyActive.species.toUpperCase()}!`);
        this.battleState = 'turn_message';
        this.pendingTurnActions = [];
        this.pendingTurnIndex = 0;
    }

    finishBattle() {
        this.playerParty?.resetBattleState?.();
        this.enemyParty?.resetBattleState?.();

        if (this.onBattleEnd) {
            this.onBattleEnd(this.lastBattleResult || { playerWon: false, trainer: this.trainer });
        }
    }
}
