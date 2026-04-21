class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
        this.options = [];
        this.selectedIndex = 0;
        this.hasSave = false;
        this.saveData = null;
        this.inputCooldownUntil = 0;
    }

    init(data) {
        this.saveData = data?.saveData || null;
        this.hasSave = Boolean(data?.hasSave) && !data?.forceNewGameOnly;
        this.options = this.hasSave ? ['Continue', 'New Game'] : ['New Game'];
        this.selectedIndex = 0;
    }

    preload() {
        if (!this.textures.exists('title-firered-logo-clean')) {
            this.load.image('title-firered-logo-clean', 'assets/generated/ui/title_logo_clean.png');
        }
    }

    create() {
        Movement.init();

        const centerX = GameConfig.SCREEN_WIDTH / 2;
        const centerY = GameConfig.SCREEN_HEIGHT / 2;
        this.drawBackground(centerX, centerY);
        this.drawHeroPanel(centerX);
        this.createTitleAnimation();
        this.drawMenu(centerX, centerY);

        const hint = this.hasSave
            ? 'Arrow Keys / WASD to choose, X or Enter to confirm'
            : 'Press X or Enter to begin your new game';

        this.hintText = this.add.text(centerX, GameConfig.SCREEN_HEIGHT - 22, hint, {
            font: 'bold 11px Arial',
            fill: '#e8dcc3',
            backgroundColor: 'rgba(27, 18, 18, 0.72)',
            padding: { x: 8, y: 4 },
        }).setOrigin(0.5);

        this.saveInfoText = this.add.text(centerX, centerY + 114, '', {
            font: 'bold 11px Arial',
            fill: '#f4d57b',
            align: 'center',
        }).setOrigin(0.5);

        if (this.hasSave && this.saveData) {
            this.saveInfoText.setText(`Saved in ${MapData[this.saveData.currentArea]?.name || this.saveData.currentArea}`);
        } else {
            this.saveInfoText.setText('No save found yet');
        }

        this.refreshSelection();
    }

    drawBackground(centerX, centerY) {
        this.add.rectangle(centerX, centerY, GameConfig.SCREEN_WIDTH, GameConfig.SCREEN_HEIGHT, 0x130b0b);
        this.add.circle(94, 78, 98, 0xf08e32, 0.14);
        this.add.circle(390, 84, 106, 0x2b3556, 0.36);
        this.add.rectangle(centerX, centerY, 404, 246, 0x1d1314, 0.98).setStrokeStyle(4, 0xf0eee8);
        this.add.rectangle(centerX, 34, 150, 16, 0x3d2b23, 0.92).setStrokeStyle(1, 0xf2d479, 0.8);
        this.add.text(centerX, 34, 'FIRERED OPENING', {
            font: 'bold 11px Arial',
            fill: '#f2d479',
            letterSpacing: 1,
        }).setOrigin(0.5);
    }

    createTitleAnimation() {
        this.tweens.add({
            targets: [this.leftGlow, this.rightGlow],
            alpha: { from: 0.18, to: 0.42 },
            scaleX: { from: 1, to: 1.12 },
            scaleY: { from: 1, to: 1.08 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
        });
    }

    drawHeroPanel(centerX) {
        this.leftGlow = this.add.circle(96, 112, 36, 0xf08e32, 0.28);
        this.rightGlow = this.add.circle(388, 112, 44, 0x8e3e19, 0.24);
        this.add.circle(96, 112, 18, 0xf7cd63, 0.5);
        this.add.circle(388, 112, 24, 0xf08e32, 0.36);

        this.add.image(centerX, 90, 'title-firered-logo-clean').setOrigin(0.5).setScale(1.02);
        this.add.text(centerX + 116, 108, 'KANTO DEMO', {
            font: 'bold 12px Arial',
            fill: '#f6dc96',
            letterSpacing: 1,
        }).setOrigin(0.5);

        this.add.text(centerX, 150, 'Mini Browser Adventure', {
            font: 'bold 18px Arial',
            fill: '#fff2cf',
            stroke: '#4d2b17',
            strokeThickness: 4,
        }).setOrigin(0.5);

    }

    drawMenu(centerX, centerY) {
        this.add.rectangle(centerX, centerY + 74, 258, 104, 0x1a2231, 0.96).setStrokeStyle(3, 0xf0eee8);
        this.add.rectangle(centerX, centerY + 42, 258, 18, 0x30435d, 0.9);
        this.add.text(centerX, centerY + 42, 'START MENU', {
            font: 'bold 10px Arial',
            fill: '#f4d57b',
            letterSpacing: 1,
        }).setOrigin(0.5);

        this.optionTexts = this.options.map((option, index) => (
            this.add.text(centerX, centerY + 62 + index * 28, option, {
                font: 'bold 18px Arial',
                fill: '#f8f6ef',
            }).setOrigin(0.5)
        ));
    }

    update(time) {
        const moveDir = Movement.getNextMove();
        if (this.hasSave && moveDir && time >= this.inputCooldownUntil) {
            if (moveDir.dy !== 0) {
                this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + moveDir.dy, 0, this.options.length);
                this.refreshSelection();
                this.inputCooldownUntil = time + 150;
            }
        }

        if (Movement.isConfirmPressed()) {
            this.confirmSelection();
        }
    }

    refreshSelection() {
        this.optionTexts.forEach((text, index) => {
            const selected = index === this.selectedIndex;
            text.setText(`${selected ? '▶ ' : '  '}${this.options[index]}`);
            text.setColor(selected ? '#f2d479' : '#f8f6ef');
            text.setScale(selected ? 1.05 : 1);
        });
    }

    confirmSelection() {
        const selectedOption = this.options[this.selectedIndex];
        const nextSaveData = selectedOption === 'Continue' && this.saveData
            ? this.saveData
            : SaveManager.createBaseState();

        if (selectedOption === 'New Game') {
            SaveManager.clearSave();
            this.scene.start('IntroScene', {
                saveData: SaveManager.normalize(nextSaveData),
            });
            return;
        }

        this.scene.start('PreloadScene', {
            saveData: SaveManager.normalize(nextSaveData),
            isNewGame: false,
        });
    }
}
