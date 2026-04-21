class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('debugBattle') === '1') {
            this.scene.start('PreloadScene', {
                debugBattle: true,
            });
            return;
        }

        const saveData = SaveManager.load();
        this.scene.start('TitleScene', {
            hasSave: Boolean(saveData),
            saveData: saveData ? SaveManager.normalize(saveData) : null,
        });
    }
}
