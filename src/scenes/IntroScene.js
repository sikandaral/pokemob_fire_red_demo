class IntroScene extends Phaser.Scene {
    constructor() {
        super({ key: 'IntroScene' });
        this.script = [];
        this.scriptIndex = 0;
        this.nextSaveData = null;
        this.currentVisualKey = null;
        this.currentRevealText = '';
        this.revealIndex = 0;
        this.revealEvent = null;
        this.isLineFullyRevealed = false;
        this.visualIdleTween = null;
        this.activeVisualTarget = null;
    }

    init(data) {
        this.nextSaveData = SaveManager.normalize(data?.saveData || SaveManager.createBaseState());
        this.script = [
            {
                speaker: 'Professor Oak',
                text: 'Hello there! Welcome to the world of Pokemon!',
                visual: 'oak',
            },
            {
                speaker: 'Professor Oak',
                text: 'My name is OAK. People call me the Pokemon Prof.',
                visual: 'oak',
            },
            {
                speaker: 'Professor Oak',
                text: 'This world is inhabited far and wide by creatures called Pokemon.',
                visual: 'pikachu',
            },
            {
                speaker: 'Professor Oak',
                text: 'For some people, Pokemon are pets. Others use them for battling.',
                visual: 'red',
            },
            {
                speaker: 'Professor Oak',
                text: 'In Pallet Town, both you and your rival are about to begin your journey.',
                visual: 'rival',
            },
            {
                speaker: 'Professor Oak',
                text: 'Step outside, explore town, and let the story lead you to your first Pokemon.',
                visual: 'red',
            },
        ];
        this.scriptIndex = 0;
    }

    preload() {
        const assets = [
            ['intro-oak-bg', 'graphics/oak_speech/bg_tiles.png'],
            ['intro-oak-platform', 'graphics/oak_speech/platform.png'],
            ['intro-oak-pic', 'graphics/oak_speech/oak/pic.png'],
            ['intro-red-pic', 'graphics/oak_speech/red/pic.png'],
            ['intro-rival-pic', 'graphics/oak_speech/rival/pic.png'],
            ['intro-pikachu-front', 'graphics/pokemon/pikachu/front.png'],
        ];

        assets.forEach(([key, path]) => {
            if (!this.textures.exists(key)) {
                this.load.image(key, path);
            }
        });
    }

    create() {
        Movement.init();

        const centerX = GameConfig.SCREEN_WIDTH / 2;
        const centerY = GameConfig.SCREEN_HEIGHT / 2;

        this.cameras.main.fadeIn(300, 255, 255, 255);

        this.drawBackdrop(centerX, centerY);
        this.createVisualStage(centerX);
        this.createDialoguePanel(centerX);
        this.createAmbientTweens();
        this.showCurrentLine();
    }

    drawBackdrop(centerX, centerY) {
        this.add.rectangle(centerX, centerY, GameConfig.SCREEN_WIDTH, GameConfig.SCREEN_HEIGHT, 0xdfeaf4);
        this.add.circle(84, 68, 96, 0xffffff, 0.38);
        this.add.circle(412, 72, 110, 0xaed7ff, 0.18);
        this.add.circle(394, 206, 94, 0xf8e18b, 0.12);

        for (let y = 0; y < 5; y += 1) {
            for (let x = 0; x < 8; x += 1) {
                this.add.image(x * 64 + 32, y * 40 + 20, 'intro-oak-bg')
                    .setOrigin(0.5)
                    .setScale(4)
                    .setAlpha(0.14);
            }
        }

        this.add.rectangle(centerX, 48, 204, 24, 0x24415a, 0.94).setStrokeStyle(2, 0xf2d479);
        this.add.text(centerX, 48, 'Professor Oak Speech', {
            font: 'bold 11px Arial',
            fill: '#f8f2d2',
            letterSpacing: 1,
        }).setOrigin(0.5);

        this.add.rectangle(centerX, 126, 332, 180, 0xe8d7a2, 1).setStrokeStyle(2, 0x6b5431);
        this.add.rectangle(centerX, 126, 322, 170, 0xf8fbff, 0.98).setStrokeStyle(3, 0x6a7790);
        this.add.rectangle(centerX, 126, 166, 322, 58, 0xd8ecfb, 0.18);
    }

    createVisualStage(centerX) {
        this.visualContainer = this.add.container(centerX, 126);

        this.shadow = this.add.ellipse(0, 64, 156, 30, 0x000000, 0.12);
        this.stageGlow = this.add.ellipse(0, 50, 112, 18, 0xbfd7ee, 0.16);

        this.oakSprite = this.add.image(0, -2, 'intro-oak-pic').setScale(1.72).setVisible(false);
        this.redSprite = this.add.image(0, -2, 'intro-red-pic').setScale(1.72).setVisible(false);
        this.rivalSprite = this.add.image(0, -2, 'intro-rival-pic').setScale(1.72).setVisible(false);

        this.pikachuContainer = this.add.image(0, 12, 'intro-pikachu-front').setScale(1.42).setVisible(false);

        [this.oakSprite, this.redSprite, this.rivalSprite, this.pikachuContainer].forEach((target) => {
            target.setAlpha(0);
            target.setScale(target.scaleX * 0.96, target.scaleY * 0.96);
        });

        this.visualContainer.add([
            this.shadow,
            this.stageGlow,
            this.oakSprite,
            this.redSprite,
            this.rivalSprite,
            this.pikachuContainer,
        ]);
    }

    createDialoguePanel(centerX) {
        const panelY = GameConfig.SCREEN_HEIGHT - 50;
        const speakerY = GameConfig.SCREEN_HEIGHT - 86;
        const dialogueY = GameConfig.SCREEN_HEIGHT - 66;
        this.add.rectangle(centerX, panelY, 438, 96, 0xe2c465, 1);
        this.add.rectangle(centerX, panelY, 428, 86, 0xf6f0db, 1);
        this.add.rectangle(centerX, panelY, 418, 76, 0x234866, 1);
        this.add.rectangle(126, speakerY, 156, 18, 0x183041, 0.96).setStrokeStyle(1, 0xf2d479);

        this.speakerText = this.add.text(126, speakerY, '', {
            font: 'bold 11px Arial',
            fill: '#f8f2d2',
            letterSpacing: 0.5,
        }).setOrigin(0.5);

        this.dialogueText = this.add.text(48, dialogueY, '', {
            font: '13px "Courier New"',
            fill: '#f8f8f8',
            wordWrap: { width: 360 },
            lineSpacing: 4,
        });

        this.hintText = this.add.text(GameConfig.SCREEN_WIDTH - 34, GameConfig.SCREEN_HEIGHT - 24, 'X next', {
            font: 'bold 10px Arial',
            fill: '#f2d479',
        }).setOrigin(1, 1);

        this.advanceArrow = this.add.text(GameConfig.SCREEN_WIDTH - 52, GameConfig.SCREEN_HEIGHT - 28, '▼', {
            font: 'bold 11px Arial',
            fill: '#f8f2d2',
        }).setOrigin(0.5).setAlpha(0.25);
    }

    createAmbientTweens() {
        this.tweens.add({
            targets: this.hintText,
            alpha: { from: 0.5, to: 1 },
            duration: 700,
            yoyo: true,
            repeat: -1,
        });

        this.tweens.add({
            targets: this.advanceArrow,
            y: this.advanceArrow.y + 3,
            alpha: { from: 0.18, to: 0.88 },
            duration: 520,
            yoyo: true,
            repeat: -1,
        });

    }

    showVisual(visual) {
        const nextTarget = this.getVisualByKey(visual);
        if (!nextTarget) {
            return;
        }

        if (this.currentVisualKey === visual) {
            return;
        }

        const previousTarget = this.activeVisualTarget;
        this.currentVisualKey = visual;
        this.activeVisualTarget = nextTarget;

        if (this.visualIdleTween) {
            this.visualIdleTween.stop();
            this.visualIdleTween = null;
        }

        [this.oakSprite, this.redSprite, this.rivalSprite, this.pikachuContainer].forEach((target) => {
            if (target !== nextTarget && target !== previousTarget) {
                this.tweens.killTweensOf(target);
                target.setVisible(false);
                target.setAlpha(0);
                target.setY(target === this.pikachuContainer ? 8 : -2);
            }
        });

        if (previousTarget && previousTarget !== nextTarget) {
            this.tweens.killTweensOf(previousTarget);
            previousTarget.setVisible(true);
            this.tweens.add({
                targets: previousTarget,
                alpha: 0,
                y: previousTarget.y + 4,
                duration: 140,
                onComplete: () => {
                    previousTarget.setVisible(false);
                    previousTarget.setY(previousTarget === this.pikachuContainer ? 8 : -2);
                },
            });
        }

        nextTarget.setVisible(true);
        nextTarget.setAlpha(0);
        nextTarget.setScale(visual === 'pikachu' ? 1.36 : 1.64);
        nextTarget.setY(visual === 'pikachu' ? 14 : 2);

        this.tweens.killTweensOf(nextTarget);
        this.tweens.add({
            targets: nextTarget,
            alpha: 1,
            scaleX: visual === 'pikachu' ? 1.42 : 1.72,
            scaleY: visual === 'pikachu' ? 1.42 : 1.72,
            y: visual === 'pikachu' ? 8 : -2,
            duration: 220,
            ease: 'Quad.out',
        });

        this.visualIdleTween = this.tweens.add({
            targets: nextTarget,
            y: `+=${visual === 'pikachu' ? 3 : 3}`,
            duration: visual === 'pikachu' ? 820 : 1040,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
        });
    }

    getVisualByKey(visual) {
        if (visual === 'oak') return this.oakSprite;
        if (visual === 'red') return this.redSprite;
        if (visual === 'rival') return this.rivalSprite;
        if (visual === 'pikachu') return this.pikachuContainer;
        return null;
    }

    startLineReveal(text) {
        this.currentRevealText = text;
        this.revealIndex = 0;
        this.isLineFullyRevealed = false;
        this.dialogueText.setText('');
        this.hintText.setText('Z skip');
        this.advanceArrow.setAlpha(0.15);

        if (this.revealEvent) {
            this.revealEvent.remove(false);
        }

        this.revealEvent = this.time.addEvent({
            delay: 26,
            repeat: Math.max(text.length - 1, 0),
            callback: () => {
                this.revealIndex += 1;
                this.dialogueText.setText(text.slice(0, this.revealIndex));

                if (this.revealIndex >= text.length) {
                    this.finishLineReveal();
                }
            },
        });
    }

    finishLineReveal() {
        if (this.revealEvent) {
            this.revealEvent.remove(false);
            this.revealEvent = null;
        }

        this.isLineFullyRevealed = true;
        this.revealIndex = this.currentRevealText.length;
        this.dialogueText.setText(this.currentRevealText);
        this.hintText.setText('X next');
        this.advanceArrow.setAlpha(0.88);
    }

    showCurrentLine() {
        const entry = this.script[this.scriptIndex];
        if (!entry) {
            return;
        }

        this.showVisual(entry.visual);
        this.speakerText.setText(entry.speaker || '');
        this.startLineReveal(entry.text);
    }

    advanceScript() {
        if (!this.isLineFullyRevealed) {
            this.finishLineReveal();
            return;
        }

        this.scriptIndex += 1;
        if (this.scriptIndex >= this.script.length) {
            this.finishIntro();
            return;
        }

        this.showCurrentLine();
    }

    finishIntro() {
        this.nextSaveData.eventFlags = {
            ...this.nextSaveData.eventFlags,
            intro_seen: true,
            opening_intro_complete: true,
        };

        this.scene.start('PreloadScene', {
            saveData: this.nextSaveData,
            isNewGame: true,
        });
    }

    update() {
        if (Movement.isSkipPressed() && !this.isLineFullyRevealed) {
            this.finishLineReveal();
            return;
        }

        if (Movement.isConfirmPressed()) {
            if (!this.isLineFullyRevealed) {
                return;
            }
            this.advanceScript();
        }
    }
}
