window.gameState = SaveManager.createBaseState();

const config = {
    type: Phaser.AUTO,
    width: GameConfig.SCREEN_WIDTH,
    height: GameConfig.SCREEN_HEIGHT,
    backgroundColor: GameConfig.COLORS.BACKGROUND,
    parent: 'game-shell',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        },
    },
    scene: [BootScene, TitleScene, IntroScene, PreloadScene, WorldScene, BattleScene],
    render: {
        pixelArt: true,
        antialias: false,
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GameConfig.SCREEN_WIDTH,
        height: GameConfig.SCREEN_HEIGHT,
    },
};

const game = new Phaser.Game(config);

function bindFullscreenControls() {
    const button = document.getElementById('fullscreen-btn');
    const updateLabel = () => {
        if (button) {
            button.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
        }
    };

    if (button) {
        button.addEventListener('click', async () => {
            try {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                } else {
                    await document.documentElement.requestFullscreen();
                }
            } catch (error) {
                console.error('Unable to toggle fullscreen:', error);
            }

            updateLabel();
        });
    }

    document.addEventListener('keydown', async (event) => {
        if (event.key.toLowerCase() !== 'f') {
            return;
        }

        event.preventDefault();
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await document.documentElement.requestFullscreen();
            }
        } catch (error) {
            console.error('Unable to toggle fullscreen:', error);
        }

        updateLabel();
    });

    document.addEventListener('fullscreenchange', updateLabel);
    updateLabel();
}

bindFullscreenControls();

window.game = game;
