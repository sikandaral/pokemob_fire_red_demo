const Movement = {
    isBound: false,
    keysDown: new Set(),
    pressedKeys: new Set(),
    lastInteractTime: 0,
    lastConfirmTime: 0,
    lastSkipTime: 0,
    lastSaveTime: 0,
    preventDefaultKeys: new Set([
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'w',
        'a',
        's',
        'd',
        'x',
        'z',
        'p',
    ]),

    init() {
        if (this.isBound) {
            return;
        }

        this.handleKeyDown = (event) => {
            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
            if (this.preventDefaultKeys.has(key)) {
                event.preventDefault();
            }

            if (!this.keysDown.has(key)) {
                this.pressedKeys.add(key);
            }

            this.keysDown.add(key);
        };

        this.handleKeyUp = (event) => {
            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
            this.keysDown.delete(key);
        };

        this.handleBlur = () => {
            this.keysDown.clear();
            this.pressedKeys.clear();
        };

        window.addEventListener('keydown', this.handleKeyDown, { passive: false });
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('blur', this.handleBlur);
        this.isBound = true;
    },

    updateFrame() {
        return null;
    },

    consumePressed(key) {
        if (this.pressedKeys.has(key)) {
            this.pressedKeys.delete(key);
            return true;
        }

        return false;
    },

    isDown(...keys) {
        return keys.some((key) => this.keysDown.has(key));
    },

    getNextMove() {
        if (this.isDown('ArrowUp', 'w')) return { dx: 0, dy: -1, name: 'up' };
        if (this.isDown('ArrowDown', 's')) return { dx: 0, dy: 1, name: 'down' };
        if (this.isDown('ArrowLeft', 'a')) return { dx: -1, dy: 0, name: 'left' };
        if (this.isDown('ArrowRight', 'd')) return { dx: 1, dy: 0, name: 'right' };
        return null;
    },

    isInteractPressed() {
        const now = Date.now();
        if ((this.consumePressed('x') || this.consumePressed('X') || this.consumePressed('Enter')) && now - this.lastInteractTime > GameConfig.INTERACT_DEBOUNCE) {
            this.lastInteractTime = now;
            return true;
        }

        return false;
    },

    isConfirmPressed() {
        const now = Date.now();
        if ((this.consumePressed('x') || this.consumePressed('X') || this.consumePressed('Enter')) && now - this.lastConfirmTime > GameConfig.CONFIRM_DEBOUNCE) {
            this.lastConfirmTime = now;
            return true;
        }

        return false;
    },

    isSkipPressed() {
        const now = Date.now();
        if ((this.consumePressed('z') || this.consumePressed('Z')) && now - this.lastSkipTime > GameConfig.CONFIRM_DEBOUNCE) {
            this.lastSkipTime = now;
            return true;
        }

        return false;
    },

    isSavePressed() {
        const now = Date.now();
        if ((this.consumePressed('p') || this.consumePressed('P')) && now - this.lastSaveTime > GameConfig.SAVE_DEBOUNCE) {
            this.lastSaveTime = now;
            return true;
        }

        return false;
    },
};
