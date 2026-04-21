const Collision = {
    isWalkable(x, y, mapData) {
        if (!mapData || !mapData.tiles) {
            return false;
        }

        if (x < 0 || y < 0 || x >= mapData.width || y >= mapData.height) {
            return false;
        }

        return GameConfig.WALKABLE_TILES.includes(mapData.tiles[y][x]);
    },

    canMoveTo(toX, toY, mapData, blockers = []) {
        if (!this.isWalkable(toX, toY, mapData)) {
            return false;
        }

        return !blockers.some((blocker) => blocker.x === toX && blocker.y === toY);
    },

    isAdjacent(playerX, playerY, targetX, targetY) {
        const dx = Math.abs(playerX - targetX);
        const dy = Math.abs(playerY - targetY);
        return dx + dy <= GameConfig.NPC_INTERACT_RANGE;
    },

    checkTransition(x, y, mapData) {
        if (!mapData.exits) {
            return null;
        }

        return mapData.exits.find((exit) => exit.from.x === x && exit.from.y === y)?.to || null;
    },
};

Object.freeze(Collision);
