const DialogueManager = {
    currentDialogue: null,
    currentLineIndex: 0,
    isShowingDialogue: false,
    dialogueBox: null,
    onComplete: null,

    init(dialogueBox) {
        this.dialogueBox = dialogueBox;
    },

    start(lines, onComplete = null, eventFlags = []) {
        this.currentDialogue = {
            lines: lines || [],
            eventFlags,
        };
        this.currentLineIndex = 0;
        this.onComplete = onComplete;
        this.isShowingDialogue = true;
        this.showNextLine();
    },

    showNextLine() {
        if (!this.isShowingDialogue || !this.currentDialogue) {
            return;
        }

        if (this.currentLineIndex >= this.currentDialogue.lines.length) {
            this.endDialogue();
            return;
        }

        this.dialogueBox?.show(this.currentDialogue.lines[this.currentLineIndex]);
        this.currentLineIndex += 1;
    },

    advance() {
        if (!this.isShowingDialogue) {
            return;
        }

        if (this.dialogueBox && !this.dialogueBox.isComplete()) {
            this.dialogueBox.finishLine();
            return;
        }

        if (this.dialogueBox?.nextPage?.()) {
            return;
        }

        this.showNextLine();
    },

    endDialogue() {
        if (this.currentDialogue?.eventFlags) {
            this.currentDialogue.eventFlags.forEach((flag) => EventFlags.set(flag));
        }

        this.isShowingDialogue = false;
        this.dialogueBox?.hide();

        const callback = this.onComplete;
        this.currentDialogue = null;
        this.onComplete = null;

        if (callback) {
            callback();
        }
    },

    isActive() {
        return this.isShowingDialogue;
    },

    stop() {
        this.isShowingDialogue = false;
        this.currentDialogue = null;
        this.onComplete = null;
        this.dialogueBox?.hide();
    },
};
