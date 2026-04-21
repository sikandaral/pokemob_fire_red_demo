class BattleUI {
    constructor(scene) {
        this.scene = scene;
        this.moveTexts = [];
        this.enemyNameText = null;
        this.enemyLevelText = null;
        this.playerNameText = null;
        this.playerLevelText = null;
        this.enemyBarFill = null;
        this.playerBarFill = null;
        this.enemyBarLabel = null;
        this.playerBarLabel = null;
        this.playerExpFill = null;
        this.logText = null;
        this.hintText = null;
        this.moveInfoText = null;
        this.playerSprite = null;
        this.enemySprite = null;
        this.playerTrainerSprite = null;
        this.enemyTrainerSprite = null;
        this.playerShadow = null;
        this.enemyShadow = null;
        this.commandDivider = null;
        this.commandPanel = null;
        this.displayedPlayerHP = null;
        this.displayedEnemyHP = null;
        this.partyPanelElements = [];
    }

    create() {
        const cfg = GameConfig;
        const centerX = cfg.SCREEN_WIDTH / 2;

        // Layout positions matching FireRed/LeafGreen GBA style
        this.ENEMY_STATUS_RECT = { x: 120, y: 38, width: 160, height: 40 };
        this.PLAYER_STATUS_RECT = { x: 360, y: 168, width: 170, height: 52 };
        this.ENEMY_SPRITE_POS = { x: 370, y: 145 };
        this.PLAYER_SPRITE_POS = { x: 120, y: 260 };
        this.COMMAND_PANEL = { x: centerX, y: 280, width: 472, height: 78 };

        this.drawBackground();
        this.drawEnemyStatusCard();
        this.drawPlayerStatusCard();

        // Enemy name & level — white text on dark card
        this.enemyNameText = this.scene.add.text(52, 24, '', {
            font: 'bold 11px "Courier New"',
            fill: '#f8f8f8',
        }).setDepth(11);
        this.enemyLevelText = this.scene.add.text(172, 24, '', {
            font: 'bold 10px "Courier New"',
            fill: '#f8f8f8',
        }).setDepth(11);

        // Player name & level — dark text on light card
        this.playerNameText = this.scene.add.text(290, 152, '', {
            font: 'bold 11px "Courier New"',
            fill: '#383838',
        }).setDepth(11);
        this.playerLevelText = this.scene.add.text(410, 152, '', {
            font: 'bold 10px "Courier New"',
            fill: '#383838',
        }).setDepth(11);

        // HP labels
        this.enemyHpText = this.scene.add.text(54, 40, 'HP', { font: 'bold 9px Arial', fill: '#f0b830' }).setDepth(11);
        this.playerHpText = this.scene.add.text(294, 170, 'HP', { font: 'bold 9px Arial', fill: '#f0b830' }).setDepth(11);

        // EXP label
        this.playerExpText = this.scene.add.text(282, 196, 'EXP', { font: 'bold 7px Arial', fill: '#58a8e8' }).setDepth(11);

        // HP bar backgrounds (dark tracks)
        this.scene.add.rectangle(120, 44, 80, 6, 0x404040, 1).setOrigin(0, 0.5).setDepth(11);
        this.scene.add.rectangle(350, 174, 90, 6, 0x404040, 1).setOrigin(0, 0.5).setDepth(11);

        // EXP bar background
        this.scene.add.rectangle(310, 200, 120, 4, 0x404040, 1).setOrigin(0, 0.5).setDepth(11);

        // HP bar fills
        this.enemyBarFill = this.scene.add.rectangle(120, 44, 80, 6, 0x58a850, 1).setOrigin(0, 0.5).setDepth(11);
        this.playerBarFill = this.scene.add.rectangle(350, 174, 90, 6, 0x58a850, 1).setOrigin(0, 0.5).setDepth(11);

        // EXP bar fill
        this.playerExpFill = this.scene.add.rectangle(310, 200, 120, 4, 0x58a8e8, 1).setOrigin(0, 0.5).setDepth(11);

        // Enemy has no numeric HP label (authentic FireRed)
        this.enemyBarLabel = this.scene.add.text(0, 0, '', { font: '8px Arial', fill: '#2b2b2b' }).setVisible(false).setDepth(11);

        // Player numeric HP (e.g. "10/36")
        this.playerBarLabel = this.scene.add.text(400, 184, '', {
            font: 'bold 10px "Courier New"',
            fill: '#383838',
        }).setOrigin(0, 0.5).setDepth(11);

        // Shadows under Pokemon
        this.enemyShadow = this.scene.add.ellipse(this.ENEMY_SPRITE_POS.x, this.ENEMY_SPRITE_POS.y + 4, 70, 14, 0x50903a, 0.4).setDepth(6);
        this.playerShadow = this.scene.add.ellipse(this.PLAYER_SPRITE_POS.x, this.PLAYER_SPRITE_POS.y + 4, 80, 16, 0x50903a, 0.4).setDepth(6);

        // Command panel — gold border with dark teal interior
        this.commandPanel = this.scene.add.rectangle(
            this.COMMAND_PANEL.x,
            this.COMMAND_PANEL.y,
            this.COMMAND_PANEL.width,
            this.COMMAND_PANEL.height,
            0xc6942c,
            1,
        ).setStrokeStyle(4, 0x3a2f13).setDepth(20);

        this.scene.add.rectangle(
            this.COMMAND_PANEL.x,
            this.COMMAND_PANEL.y,
            this.COMMAND_PANEL.width - 16,
            this.COMMAND_PANEL.height - 14,
            0x315d79,
            1,
        ).setStrokeStyle(3, 0xf2ebd6).setDepth(20);

        const commandTextTop = 262;
        const commandTextLeft = 324;
        const commandTextColumnWidth = 86;
        const commandTextRowHeight = 18;

        this.commandDivider = this.scene.add.line(314, 292, 0, -16, 0, 16, 0xf1d7a1, 0.95).setLineWidth(2).setDepth(21);

        this.logText = this.scene.add.text(18, 258, '', {
            font: '12px "Courier New"',
            fill: '#f8f0ef',
            wordWrap: { width: 432 },
            lineSpacing: 9,
        }).setDepth(21);

        this.hintText = this.scene.add.text(0, 0, '', {
            font: '7px Arial',
            fill: '#ffe18d',
        }).setVisible(false).setDepth(21);

        this.moveInfoText = this.scene.add.text(0, 0, '', {
            font: '7px Arial',
            fill: '#d9e3ef',
        }).setVisible(false).setDepth(21);

        for (let i = 0; i < 6; i += 1) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const text = this.scene.add.text(
                commandTextLeft + col * commandTextColumnWidth,
                commandTextTop + row * commandTextRowHeight,
                '',
                {
                    font: '8px "Courier New"',
                    fill: '#ffffff',
                },
            ).setDepth(21);
            this.moveTexts.push(text);
        }
    }

    drawBackground() {
        const cfg = GameConfig;
        const centerX = cfg.SCREEN_WIDTH / 2;
        const battleAreaHeight = 240; // area above the command panel

        // Sky gradient — light blue at top fading to white/pale at bottom
        const steps = 80;
        for (let i = 0; i < steps; i += 1) {
            const t = i / (steps - 1);
            const r = Math.floor(0x88 + (0xf8 - 0x88) * t);
            const g = Math.floor(0xc8 + (0xf8 - 0xc8) * t);
            const b = Math.floor(0xf8 + (0xf8 - 0xf8) * t);
            const color = (r << 16) | (g << 8) | b;
            const y = (i / steps) * battleAreaHeight;
            this.scene.add.rectangle(centerX, y, cfg.SCREEN_WIDTH, battleAreaHeight / steps + 1, color);
        }

        // Green grass platforms — large bright ovals like FireRed
        // Enemy platform (upper-right) — shifted left so it's not hidden behind player status card
        this.scene.add.ellipse(350, 152, 200, 56, 0x68a840, 0.55).setDepth(5);
        this.scene.add.ellipse(350, 148, 190, 50, 0x90d868, 0.9).setDepth(5);

        // Player platform (lower-left) — large and visible under Bulbasaur
        this.scene.add.ellipse(130, 252, 210, 58, 0x68a840, 0.55).setDepth(5);
        this.scene.add.ellipse(130, 248, 200, 52, 0x90d868, 0.9).setDepth(5);
    }

    drawEnemyStatusCard() {
        const rect = this.ENEMY_STATUS_RECT;

        // Dark charcoal box — FireRed enemy status style
        this.scene.add.rectangle(rect.x, rect.y, rect.width, rect.height, 0x484850, 1)
            .setStrokeStyle(2, 0x282830).setDepth(10);

        // Slightly lighter inner header area
        this.scene.add.rectangle(rect.x, rect.y - 6, rect.width - 8, 16, 0x505058, 0.6).setDepth(10);
    }

    drawPlayerStatusCard() {
        const rect = this.PLAYER_STATUS_RECT;

        // White/cream box — FireRed player status style
        this.scene.add.rectangle(rect.x, rect.y, rect.width, rect.height, 0xf8f0d0, 1)
            .setStrokeStyle(2, 0x484848).setDepth(10);

        // Subtle header area
        this.scene.add.rectangle(rect.x, rect.y - 12, rect.width - 8, 16, 0xf0e8c0, 0.6).setDepth(10);
    }

    showBattle(playerPokemon, enemyPokemon, moveList, trainer, battleType = 'wild') {
        if (!playerPokemon || !enemyPokemon) {
            this.setTextMode();
            this.updateLog('Battle scene could not load a Pokemon.');
            return;
        }

        if (trainer?.id) {
            this.updateHP(playerPokemon, enemyPokemon);
            this.updateMoveSelection(0, moveList);
            this.setTextMode();
            this.drawTrainerSprites(trainer);
            this.updateLog(`${trainer.name.toUpperCase()} wants to battle!`);
            return;
        }

        this.showPokemonBattleIntro(playerPokemon, enemyPokemon, moveList, battleType);
    }

    showPokemonBattleIntro(playerPokemon, enemyPokemon, moveList, battleType = 'wild') {
        if (!playerPokemon || !enemyPokemon) {
            this.setTextMode();
            this.updateLog('Battle scene could not load a Pokemon.');
            return;
        }

        this.clearTrainerSprites();
        this.drawPokemonSprite(playerPokemon, false);
        this.drawPokemonSprite(enemyPokemon, true);
        this.animateSendOut(() => {
            this.updateHP(playerPokemon, enemyPokemon, true);
        });
        this.updateMoveSelection(0, moveList);
        this.setTextMode();
        const encounterLabel = battleType === 'trainer'
            ? `Foe ${enemyPokemon.species.toUpperCase()}\nappeared!`
            : `Wild ${enemyPokemon.species.toUpperCase()}\nappeared!`;
        this.updateLog(encounterLabel);
    }

    formatPokemonSummary(pokemon) {
        if (!pokemon) {
            return {
                name: '---',
                level: 'Lv?',
            };
        }

        const stats = pokemon.getStats();
        return {
            name: stats.species.toUpperCase(),
            level: `Lv${stats.level}`,
        };
    }

    getHpColor(currentHP, maxHP) {
        const ratio = maxHP > 0 ? currentHP / maxHP : 0;
        if (ratio <= 0.25) return 0xf03030;
        if (ratio <= 0.5) return 0xf0c030;
        return 0x58a850;
    }

    updateHealthBar(barFill, barLabel, currentHP, maxHP, maxWidth) {
        const safeMaxHp = Math.max(1, maxHP);
        const ratio = Phaser.Math.Clamp(currentHP / safeMaxHp, 0, 1);
        barFill.width = Math.max(2, Math.floor(maxWidth * ratio));
        barFill.fillColor = this.getHpColor(currentHP, safeMaxHp);
        if (barLabel) {
            barLabel.setText(`${currentHP}/${safeMaxHp}`);
        }
    }

    getSpeciesVisual(species) {
        return BattleAssetManifest.forSpecies(species) || {};
    }

    drawPokemonSprite(pokemon, isEnemy) {
        const existing = isEnemy ? this.enemySprite : this.playerSprite;
        existing?.destroy();

        if (!pokemon) {
            return;
        }

        const visual = this.getSpeciesVisual(pokemon.species);
        const assetInfo = isEnemy ? visual.front : visual.back;
        const textureKey = assetInfo?.key;
        const baseX = isEnemy ? this.ENEMY_SPRITE_POS.x : this.PLAYER_SPRITE_POS.x;
        const baseY = isEnemy ? this.ENEMY_SPRITE_POS.y : this.PLAYER_SPRITE_POS.y;
        const scale = isEnemy ? (visual.enemyScale || 1) : (visual.playerScale || 1);

        let sprite;
        if (textureKey && this.scene.textures.exists(textureKey)) {
            sprite = this.scene.add.image(baseX, baseY, textureKey);
            sprite.setOrigin(0.5, 1);
            sprite.setScale(scale);
        } else {
            sprite = this.scene.add.rectangle(baseX, baseY, isEnemy ? 40 : 44, isEnemy ? 40 : 44, 0x7aa5d8);
        }

        sprite.setDepth(30);
        if (isEnemy) {
            this.enemySprite = sprite;
        } else {
            this.playerSprite = sprite;
        }
    }

    animateSendOut(onComplete) {
        const tweens = [];

        if (this.enemySprite) {
            this.enemySprite.setAlpha(0);
            this.enemySprite.setX(this.ENEMY_SPRITE_POS.x + 44);
            tweens.push(new Promise((resolve) => {
                this.scene.tweens.add({
                    targets: this.enemySprite,
                    x: this.ENEMY_SPRITE_POS.x,
                    alpha: 1,
                    duration: 260,
                    ease: 'Quad.out',
                    onComplete: resolve,
                });
            }));
        }

        if (this.playerSprite) {
            this.playerSprite.setAlpha(0);
            this.playerSprite.setX(this.PLAYER_SPRITE_POS.x - 52);
            tweens.push(new Promise((resolve) => {
                this.scene.tweens.add({
                    targets: this.playerSprite,
                    x: this.PLAYER_SPRITE_POS.x,
                    alpha: 1,
                    duration: 300,
                    ease: 'Quad.out',
                    onComplete: resolve,
                });
            }));
        }

        if (!tweens.length) {
            onComplete?.();
            return;
        }

        Promise.all(tweens).then(() => onComplete?.());
    }

    getTrainerVisual(trainer) {
        return BattleAssetManifest.forTrainer(trainer?.id) || {};
    }

    clearTrainerSprites() {
        this.playerTrainerSprite?.destroy();
        this.enemyTrainerSprite?.destroy();
        this.playerTrainerSprite = null;
        this.enemyTrainerSprite = null;
    }

    drawTrainerSprites(trainer) {
        this.playerSprite?.destroy();
        this.enemySprite?.destroy();
        this.playerSprite = null;
        this.enemySprite = null;
        this.clearTrainerSprites();

        const playerVisual = BattleAssetManifest.forTrainer('player') || {};
        const enemyVisual = this.getTrainerVisual(trainer);

        if (playerVisual.back?.key && this.scene.textures.exists(playerVisual.back.key)) {
            const frame = playerVisual.back.frame || 0;
            this.playerTrainerSprite = this.scene.add.sprite(
                this.PLAYER_SPRITE_POS.x + (playerVisual.playerOffset?.x || 0),
                this.PLAYER_SPRITE_POS.y + (playerVisual.playerOffset?.y || 0),
                playerVisual.back.key,
                frame
            );
            this.playerTrainerSprite.setOrigin(0.5, 1);
            this.playerTrainerSprite.setScale(playerVisual.playerScale || 1);
            this.playerTrainerSprite.setDepth(30);
        }

        if (enemyVisual.front?.key && this.scene.textures.exists(enemyVisual.front.key)) {
            this.enemyTrainerSprite = this.scene.add.image(
                this.ENEMY_SPRITE_POS.x + (enemyVisual.enemyOffset?.x || 0),
                this.ENEMY_SPRITE_POS.y + (enemyVisual.enemyOffset?.y || 0),
                enemyVisual.front.key
            );
            this.enemyTrainerSprite.setOrigin(0.5, 1);
            this.enemyTrainerSprite.setScale(enemyVisual.enemyScale || 1);
            this.enemyTrainerSprite.setDepth(30);
        }
    }

    setSelectionMode() {
        this.clearPartyPanel();
        this.commandDivider?.setVisible(true);
        this.moveTexts.forEach((text) => text.setVisible(true));
        this.moveInfoText?.setVisible(true);
        this.hintText?.setVisible(false);
    }

    setTextMode() {
        this.clearPartyPanel();
        this.commandDivider?.setVisible(false);
        this.moveTexts.forEach((text) => text.setVisible(false));
        this.moveInfoText?.setVisible(false);
        this.hintText?.setVisible(false);
    }

    clearPartyPanel() {
        this.partyPanelElements.forEach((element) => element.destroy());
        this.partyPanelElements = [];
    }

    updateActionSelection(selectedIndex, actionList) {
        this.moveTexts.forEach((text, index) => {
            const action = actionList[index];
            if (!action) {
                text.setText('');
                return;
            }

            const prefix = index === selectedIndex ? '> ' : '  ';
            text.setText(`${prefix}${action.name}`);
            text.setColor(index === selectedIndex ? '#ffd97d' : '#ffffff');
        });

        this.moveInfoText
            ?.setPosition(334, 298)
            .setText('Choose an action')
            .setVisible(true);
    }

    updateBagSelection(selectedIndex, itemList) {
        this.moveTexts.forEach((text, index) => {
            const item = itemList[index];
            if (!item) {
                text.setText('');
                return;
            }

            const prefix = index === selectedIndex ? '> ' : '  ';
            text.setText(`${prefix}${item.name} x${item.count}`);
            text.setColor(index === selectedIndex ? '#ffd97d' : '#ffffff');
        });

        this.moveInfoText
            ?.setPosition(334, 298)
            .setText('Z back')
            .setVisible(true);
    }

    updatePartySelection(selectedIndex, partyList, forceSwitch = false) {
        this.clearPartyPanel();
        this.commandDivider?.setVisible(false);
        this.moveTexts.forEach((text) => text.setVisible(false));
        this.moveInfoText?.setVisible(false);

        const elements = [];
        const add = (element) => {
            elements.push(element);
            return element;
        };

        add(this.scene.add.rectangle(240, 134, 440, 196, 0xe8e0c8, 1)
            .setStrokeStyle(4, 0x584838)
            .setDepth(34));
        add(this.scene.add.rectangle(240, 134, 424, 180, 0xf8f8f8, 1)
            .setStrokeStyle(2, 0x90a0a8)
            .setDepth(35));
        add(this.scene.add.rectangle(240, 42, 424, 18, 0x507090, 1).setDepth(36));
        add(this.scene.add.text(34, 35, 'Choose a POKéMON', {
            font: 'bold 10px "Courier New"',
            fill: '#ffffff',
        }).setDepth(37));

        partyList.forEach((pokemon, index) => {
            const rowY = 66 + index * 24;
            const selected = index === selectedIndex;
            const rowColor = selected ? 0xf8e0a0 : pokemon.active ? 0xd8f0f8 : 0xffffff;
            const textColor = pokemon.fainted ? '#808080' : '#303030';

            add(this.scene.add.rectangle(240, rowY + 8, 404, 21, rowColor, 1)
                .setStrokeStyle(selected ? 2 : 1, selected ? 0xb87020 : 0xc8c8c8)
                .setDepth(36));

            add(this.scene.add.text(42, rowY, selected ? '>' : '', {
                font: 'bold 12px "Courier New"',
                fill: '#303030',
            }).setDepth(37));

            add(this.scene.add.text(60, rowY, pokemon.name.toUpperCase(), {
                font: 'bold 11px "Courier New"',
                fill: textColor,
            }).setDepth(37));

            add(this.scene.add.text(174, rowY, `Lv${pokemon.level}`, {
                font: 'bold 10px "Courier New"',
                fill: textColor,
            }).setDepth(37));

            const hpText = pokemon.fainted ? 'FNT' : `${pokemon.hp}/${pokemon.maxHP}`;
            add(this.scene.add.text(250, rowY, hpText, {
                font: 'bold 10px "Courier New"',
                fill: pokemon.fainted ? '#b84040' : '#303030',
            }).setDepth(37));

            if (pokemon.active) {
                add(this.scene.add.text(370, rowY, 'IN BATTLE', {
                    font: 'bold 8px "Courier New"',
                    fill: '#406878',
                }).setDepth(37));
            }
        });

        const hint = forceSwitch
            ? 'Choose next POKéMON'
            : 'X/ENTER switch   Z back';
        add(this.scene.add.text(34, 218, hint, {
            font: 'bold 9px "Courier New"',
            fill: '#405060',
        }).setDepth(37));

        this.partyPanelElements = elements;
    }

    updateMoveSelection(selectedIndex, moveList) {
        this.moveTexts.forEach((text, index) => {
            const move = moveList[index];
            if (!move) {
                text.setText('');
                return;
            }

            const prefix = index === selectedIndex ? '> ' : '  ';
            text.setText(`${prefix}${move.name}`);
            text.setColor(index === selectedIndex ? '#ffd97d' : '#ffffff');
        });

        const selectedMove = moveList[selectedIndex];
        if (selectedMove && this.moveInfoText) {
            if (selectedMove.isCatchCommand) {
                const count = window.gameState?.inventory?.pokeBalls || 0;
                this.moveInfoText
                    .setPosition(334, 298)
                    .setText(`BAG  ${count} left`)
                    .setVisible(true);
                return;
            }

            const accuracy = selectedMove.accuracy ?? 100;
            this.moveInfoText
                .setPosition(334, 298)
                .setText(`Pow ${selectedMove.power}  Acc ${accuracy}%`)
                .setVisible(true);
        }
    }

    updateLog(message) {
        this.logText?.setText(message);
    }

    setHint(message) {
        this.hintText?.setText(message);
    }

    getBattleSpriteForPokemon(pokemon) {
        if (!pokemon) {
            return null;
        }

        if (this.playerSprite && this.scene.playerActive === pokemon) {
            return this.playerSprite;
        }

        if (this.enemySprite && this.scene.enemyActive === pokemon) {
            return this.enemySprite;
        }

        return this.playerSprite?.texture?.key === this.getSpeciesVisual(pokemon.species)?.back?.key
            ? this.playerSprite
            : this.enemySprite;
    }

    animateMove(action, onComplete) {
        const attackerSprite = this.getBattleSpriteForPokemon(action.attacker);
        const defenderSprite = this.getBattleSpriteForPokemon(action.defender);

        if (!attackerSprite || !defenderSprite) {
            onComplete?.();
            return;
        }

        const attackerStartX = attackerSprite.x;
        const defenderStartX = defenderSprite.x;
        const direction = action.owner === 'player' ? 1 : -1;
        const lungeDistance = action.isStatusMove ? 6 : 18;

        this.scene.tweens.killTweensOf(attackerSprite);
        this.scene.tweens.killTweensOf(defenderSprite);

        this.scene.tweens.add({
            targets: attackerSprite,
            x: attackerStartX + direction * lungeDistance,
            duration: 110,
            ease: 'Quad.out',
            yoyo: true,
            hold: 40,
            onYoyo: () => {
                if (action.missed) {
                    return;
                }

                if (action.isStatusMove) {
                    this.spawnStatusEffect(defenderSprite.x, defenderSprite.y - 24, action.move?.type);
                    return;
                }

                if (!action.isStatusMove) {
                    this.spawnImpactEffect(defenderSprite.x, defenderSprite.y - 28, action.move?.type);
                    this.scene.tweens.add({
                        targets: defenderSprite,
                        x: defenderStartX - direction * 10,
                        duration: 54,
                        yoyo: true,
                        repeat: 2,
                    });
                }

                defenderSprite.setTintFill(0xffffff);
                this.scene.time.delayedCall(90, () => {
                    defenderSprite.clearTint();
                });
            },
            onComplete: () => {
                attackerSprite.x = attackerStartX;
                defenderSprite.x = defenderStartX;
                defenderSprite.clearTint();
                if (!action.isStatusMove && typeof action.beforeDefenderHP === 'number' && typeof action.afterDefenderHP === 'number') {
                    this.animateHpForPokemon(action.defender, action.beforeDefenderHP, action.afterDefenderHP, onComplete);
                    return;
                }

                onComplete?.();
            },
        });
    }

    animatePokeBallThrow(targetPokemon, caught, onComplete) {
        const targetSprite = this.getBattleSpriteForPokemon(targetPokemon) || this.enemySprite;
        const startX = this.PLAYER_SPRITE_POS.x + 28;
        const startY = this.PLAYER_SPRITE_POS.y - 72;
        const endX = this.ENEMY_SPRITE_POS.x;
        const endY = this.ENEMY_SPRITE_POS.y - 34;
        const originalScaleX = targetSprite?.scaleX || 1;
        const originalScaleY = targetSprite?.scaleY || 1;
        const ball = this.scene.add.container(startX, startY).setDepth(55);
        const top = this.scene.add.arc(0, 0, 7, 180, 360, false, 0xe03838, 1).setStrokeStyle(1, 0x303030);
        const bottom = this.scene.add.arc(0, 0, 7, 0, 180, false, 0xf8f8f8, 1).setStrokeStyle(1, 0x303030);
        const band = this.scene.add.rectangle(0, 0, 14, 2, 0x303030, 1);
        const button = this.scene.add.circle(0, 0, 2, 0xf8f8f8, 1).setStrokeStyle(1, 0x303030);
        ball.add([top, bottom, band, button]);

        this.scene.tweens.add({
            targets: ball,
            x: endX,
            y: endY,
            angle: 720,
            duration: 430,
            ease: 'Quad.out',
            onComplete: () => {
                if (targetSprite) {
                    this.scene.tweens.add({
                        targets: targetSprite,
                        alpha: 0,
                        scaleX: 0.1,
                        scaleY: 0.1,
                        duration: 170,
                        ease: 'Quad.in',
                    });
                }

                this.scene.time.delayedCall(190, () => {
                    this.scene.tweens.add({
                        targets: ball,
                        y: endY + 30,
                        angle: 0,
                        duration: 180,
                        ease: 'Bounce.out',
                    onComplete: () => this.shakePokeBall(ball, targetSprite, caught, onComplete, originalScaleX, originalScaleY),
                });
            });
        },
    });
}

    animatePlayerSwitch(pokemon, onComplete) {
        if (this.playerSprite) {
            this.scene.tweens.add({
                targets: this.playerSprite,
                alpha: 0,
                x: this.PLAYER_SPRITE_POS.x - 36,
                duration: 140,
                ease: 'Quad.in',
                onComplete: () => {
                    this.drawPokemonSprite(pokemon, false);
                    if (this.playerSprite) {
                        this.playerSprite.setAlpha(0);
                        this.playerSprite.setX(this.PLAYER_SPRITE_POS.x - 44);
                        this.scene.tweens.add({
                            targets: this.playerSprite,
                            x: this.PLAYER_SPRITE_POS.x,
                            alpha: 1,
                            duration: 220,
                            ease: 'Quad.out',
                            onComplete,
                        });
                    } else {
                        onComplete?.();
                    }
                },
            });
            return;
        }

        this.drawPokemonSprite(pokemon, false);
        onComplete?.();
    }

    shakePokeBall(ball, targetSprite, caught, onComplete, originalScaleX = 1, originalScaleY = 1) {
        const shakes = caught ? 3 : Phaser.Math.Between(1, 2);
        let completed = 0;
        const doShake = () => {
            if (completed >= shakes) {
                if (caught) {
                    this.scene.tweens.add({
                        targets: ball,
                        scaleX: 1.12,
                        scaleY: 1.12,
                        duration: 90,
                        yoyo: true,
                        onComplete: () => {
                            ball.destroy();
                            onComplete?.();
                        },
                    });
                    return;
                }

                ball.destroy();
                if (targetSprite) {
                    targetSprite.setAlpha(1);
                    this.scene.tweens.add({
                        targets: targetSprite,
                        scaleX: originalScaleX,
                        scaleY: originalScaleY,
                        duration: 120,
                        ease: 'Back.out',
                        onComplete,
                    });
                    return;
                }

                onComplete?.();
                return;
            }

            completed += 1;
            this.scene.tweens.add({
                targets: ball,
                angle: completed % 2 === 0 ? 14 : -14,
                duration: 120,
                yoyo: true,
                hold: 70,
                onComplete: doShake,
            });
        };

        doShake();
    }


    spawnStatusEffect(x, y, moveType) {
        const colorMap = {
            fire: 0xffb26b,
            water: 0x9fdcff,
            grass: 0x9bec7d,
            normal: 0xf5f1c8,
        };
        const color = colorMap[moveType] || 0xd8e7ff;
        const ring = this.scene.add.circle(x, y, 10, color, 0.2).setStrokeStyle(2, color, 0.9).setDepth(41);
        this.scene.tweens.add({
            targets: ring,
            scaleX: 1.8,
            scaleY: 1.8,
            alpha: 0,
            duration: 180,
            ease: 'Quad.out',
            onComplete: () => ring.destroy(),
        });
    }

    spawnImpactEffect(x, y, moveType) {
        const colorMap = {
            fire: 0xff9b47,
            water: 0x78c8ff,
            grass: 0x7ce06f,
            rock: 0xc8b090,
            flying: 0xe7efff,
            normal: 0xf8efd8,
        };
        const color = colorMap[moveType] || 0xf8efd8;
        const burst = this.scene.add.circle(x, y, 8, color, 0.95).setDepth(41);
        const core = this.scene.add.circle(x, y, 3, 0xffffff, 1).setDepth(42);

        this.scene.tweens.add({
            targets: burst,
            scaleX: 2.7,
            scaleY: 2.7,
            alpha: 0,
            duration: 170,
            ease: 'Quad.out',
            onComplete: () => burst.destroy(),
        });

        this.scene.tweens.add({
            targets: core,
            scaleX: 1.8,
            scaleY: 1.8,
            alpha: 0,
            duration: 130,
            onComplete: () => core.destroy(),
        });
    }

    animateFaint(pokemon, onComplete) {
        const sprite = this.getBattleSpriteForPokemon(pokemon);
        if (!sprite) {
            onComplete?.();
            return;
        }

        this.scene.tweens.killTweensOf(sprite);
        this.scene.tweens.add({
            targets: sprite,
            y: sprite.y + 18,
            alpha: 0,
            duration: 260,
            ease: 'Quad.in',
            onComplete: () => {
                onComplete?.();
            },
        });
    }

    animateHpForPokemon(pokemon, fromHP, toHP, onComplete) {
        const isPlayer = this.scene.playerActive === pokemon;
        const barFill = isPlayer ? this.playerBarFill : this.enemyBarFill;
        const barLabel = isPlayer ? this.playerBarLabel : null;
        const maxWidth = isPlayer ? 90 : 80;
        const maxHP = pokemon.maxHP || 1;

        this.scene.tweens.addCounter({
            from: fromHP,
            to: toHP,
            duration: Math.max(180, Math.abs(fromHP - toHP) * 46),
            ease: 'Linear',
            onUpdate: (tween) => {
                const displayedValue = Math.round(tween.getValue());
                if (isPlayer) {
                    this.displayedPlayerHP = displayedValue;
                } else {
                    this.displayedEnemyHP = displayedValue;
                }
                this.updateHealthBar(barFill, barLabel, displayedValue, maxHP, maxWidth);
            },
            onComplete: () => {
                this.updateHealthBar(barFill, barLabel, toHP, maxHP, maxWidth);
                if (isPlayer) {
                    this.displayedPlayerHP = toHP;
                } else {
                    this.displayedEnemyHP = toHP;
                }
                onComplete?.();
            },
        });
    }

    updateHP(playerPokemon, enemyPokemon, immediate = false) {
        if (!playerPokemon || !enemyPokemon) {
            return;
        }

        const playerStats = playerPokemon.getStats();
        const enemyStats = enemyPokemon.getStats();

        const playerSummary = this.formatPokemonSummary(playerPokemon);
        const enemySummary = this.formatPokemonSummary(enemyPokemon);

        this.playerNameText?.setText(playerSummary.name);
        this.playerLevelText?.setText(playerSummary.level);
        this.enemyNameText?.setText(enemySummary.name);
        this.enemyLevelText?.setText(enemySummary.level);

        if (immediate || this.displayedPlayerHP == null) {
            this.displayedPlayerHP = playerStats.hp;
        }

        if (immediate || this.displayedEnemyHP == null) {
            this.displayedEnemyHP = enemyStats.hp;
        }

        this.updateHealthBar(this.playerBarFill, this.playerBarLabel, this.displayedPlayerHP, playerStats.maxHP, 90);
        this.updateHealthBar(this.enemyBarFill, null, this.displayedEnemyHP, enemyStats.maxHP, 80);
        this.updateExpBar(playerStats.exp, playerStats.nextLevelExp);

        this.playerSprite?.setAlpha(playerStats.hp <= 0 ? 0.25 : 1);
        this.enemySprite?.setAlpha(enemyStats.hp <= 0 ? 0.25 : 1);
    }

    updateExpBar(currentExp, nextLevelExp) {
        if (!this.playerExpFill) {
            return;
        }

        const safeGoal = Math.max(1, nextLevelExp);
        const ratio = Phaser.Math.Clamp(currentExp / safeGoal, 0, 1);
        this.playerExpFill.width = Math.max(2, Math.floor(120 * ratio));
    }
}
