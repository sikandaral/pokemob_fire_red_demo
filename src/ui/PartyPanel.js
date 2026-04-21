class PartyPanel {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.display = null;
        this.background = null;
    }

    create() {
        this.background = this.scene.add.rectangle(88, 18, 144, 22, GameConfig.COLORS.UI_PANEL, 0.86);
        this.background.setStrokeStyle(2, GameConfig.COLORS.UI_BORDER, 0.85);
        this.background.setScrollFactor(0);
        this.background.setDepth(400);

        this.display = this.scene.add.text(16, 10, '', {
            font: 'bold 10px Arial',
            fill: '#f8f6ef',
        });
        this.display.setScrollFactor(0);
        this.display.setDepth(401);

        this.container = this.scene.add.container(0, 0, [this.background, this.display]);
        this.container.setScrollFactor(0);
    }

    update(party) {
        const active = party?.getActive();
        if (!active) {
            this.display?.setText('No Pokemon');
            return;
        }

        const stats = active.getStats();
        this.display?.setText(`${stats.species} Lv${stats.level}  ${stats.hp}/${stats.maxHP}`);
    }
}
