class DialogueBox {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.container = null;
        this.textDisplay = null;
        this.promptText = null;
        this.currentText = '';
        this.currentPages = [];
        this.currentPageIndex = 0;
        this.charIndex = 0;
        this.charDisplayTimer = 0;
    }

    create() {
        const cfg = GameConfig;
        const x = cfg.SCREEN_WIDTH / 2;
        const y = cfg.SCREEN_HEIGHT - cfg.DIALOGUE_BOX_HEIGHT / 2 - 10;
        const width = cfg.DIALOGUE_BOX_WIDTH;
        const height = cfg.DIALOGUE_BOX_HEIGHT;

        const outer = this.scene.add.rectangle(x, y, width, height, 0xe2c465, 1);
        const innerFrame = this.scene.add.rectangle(x, y, width - 10, height - 10, 0xf6f0db, 1);
        const panel = this.scene.add.rectangle(x, y, width - 20, height - 20, 0x2f597a, 1);

        this.textDisplay = this.scene.add.text(
            x - width / 2 + cfg.DIALOGUE_PADDING + 6,
            y - height / 2 + cfg.DIALOGUE_PADDING + 12,
            '',
            {
                font: '18px "Courier New"',
                fill: '#f8f6ef',
                wordWrap: { width: width - cfg.DIALOGUE_PADDING * 2 - 84 },
                lineSpacing: 6,
            }
        );

        this.promptText = this.scene.add.text(
            x + width / 2 - 70,
            y + height / 2 - 26,
            '',
            {
                font: 'bold 12px "Courier New"',
                fill: '#f2d479',
            }
        );

        this.container = this.scene.add.container(0, 0, [outer, innerFrame, panel, this.textDisplay, this.promptText]);
        this.container.setScrollFactor(0);
        this.container.setDepth(1000);
        this.hide();
    }

    show(text) {
        this.isVisible = true;
        this.currentPages = this.paginateText(String(text || ''));
        this.currentPageIndex = 0;
        this.currentText = this.currentPages[this.currentPageIndex] || '';
        this.charIndex = 0;
        this.charDisplayTimer = 0;
        this.textDisplay?.setText('');
        this.promptText?.setText('');
        this.container?.setVisible(true);
    }

    hide() {
        this.isVisible = false;
        this.currentText = '';
        this.currentPages = [];
        this.currentPageIndex = 0;
        this.charIndex = 0;
        this.charDisplayTimer = 0;
        this.textDisplay?.setText('');
        this.container?.setVisible(false);
    }

    update(delta) {
        if (!this.isVisible || !this.currentText) {
            return;
        }

        this.charDisplayTimer += delta;
        const charsToShow = Math.floor(this.charDisplayTimer / GameConfig.DIALOGUE_SPEED);
        if (charsToShow > this.charIndex) {
            this.charIndex = Math.min(charsToShow, this.currentText.length);
            this.textDisplay?.setText(this.currentText.substring(0, this.charIndex));
        }

        const completePrompt = this.hasMorePages() ? 'X MORE' : 'X NEXT';
        this.promptText?.setText(this.isComplete() ? completePrompt : 'Z SKIP');
    }

    finishLine() {
        this.charIndex = this.currentText.length;
        this.textDisplay?.setText(this.currentText);
        this.promptText?.setText(this.hasMorePages() ? 'X MORE' : 'X NEXT');
    }

    isComplete() {
        return this.charIndex >= this.currentText.length;
    }

    hasMorePages() {
        return this.currentPageIndex < this.currentPages.length - 1;
    }

    nextPage() {
        if (!this.hasMorePages()) {
            return false;
        }

        this.currentPageIndex += 1;
        this.currentText = this.currentPages[this.currentPageIndex] || '';
        this.charIndex = 0;
        this.charDisplayTimer = 0;
        this.textDisplay?.setText('');
        this.promptText?.setText('');
        return true;
    }

    paginateText(text) {
        const maxLinesPerPage = 2;
        const maxCharsPerLine = 28;
        const wrappedLines = [];

        text.split('\n').forEach((rawLine) => {
            const words = rawLine.trim().split(/\s+/).filter(Boolean);
            if (!words.length) {
                wrappedLines.push('');
                return;
            }

            let line = '';
            words.forEach((word) => {
                if (word.length > maxCharsPerLine) {
                    if (line) {
                        wrappedLines.push(line);
                        line = '';
                    }

                    for (let i = 0; i < word.length; i += maxCharsPerLine) {
                        wrappedLines.push(word.slice(i, i + maxCharsPerLine));
                    }
                    return;
                }

                const nextLine = line ? `${line} ${word}` : word;
                if (nextLine.length <= maxCharsPerLine) {
                    line = nextLine;
                    return;
                }

                if (line) {
                    wrappedLines.push(line);
                }

                line = word;
            });

            if (line) {
                wrappedLines.push(line);
            }
        });

        const pages = [];
        for (let i = 0; i < wrappedLines.length; i += maxLinesPerPage) {
            pages.push(wrappedLines.slice(i, i + maxLinesPerPage).join('\n'));
        }

        return pages.length ? pages : [''];
    }
}
