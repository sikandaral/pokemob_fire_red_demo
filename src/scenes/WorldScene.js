class WorldScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldScene' });
        this.isTransitioning = false;
        this.completionOverlay = null;
        this.trainerEncounterInProgress = false;
        this.wildEncounterInProgress = false;
        this.stepsSinceWildEncounter = 99;
        this.starterSelectionVisible = false;
        this.pendingStarterSpecies = null;
        this.starterConfirmIndex = 0;
        this.starterSelectionContainer = null;
    }

    create() {
        this.isTransitioning = false;
        this.trainerEncounterInProgress = false;
        this.wildEncounterInProgress = false;
        this.stepsSinceWildEncounter = 99;
        this.currentMap = MapData[window.gameState.currentArea];
        this.dialogueBox = new DialogueBox(this);
        this.dialogueBox.create();
        DialogueManager.init(this.dialogueBox);

        this.drawMap();
        this.createPlayer();
        this.spawnNPCs();
        this.spawnTrainers();
        this.createHUD();
        this.createCompletionOverlay();
        if (window.gameState.currentArea === GameConfig.AREAS.LAB) {
            this.createStarterSelectionOverlay();
        }

        Movement.init();
        this.lastMoveTime = 0;

        this.cameras.main.setBounds(0, 0, this.currentMap.width * GameConfig.TILE_SIZE, this.currentMap.height * GameConfig.TILE_SIZE);
        this.cameras.main.startFollow(this.playerSprite, true, 0.16, 0.16);
        this.cameras.main.fadeIn(150);

        this.refreshHUD();
        this.showAreaName();
        this.runAreaArrivalSequence();
    }

    drawMap() {
        this.drawAreaBackdrop();

        const translatedBackgrounds = {
            [GameConfig.AREAS.TOWN]: 'town-scene-bg',
            [GameConfig.AREAS.LAB]: 'lab-scene-bg',
            [GameConfig.AREAS.ROUTE]: 'route-scene-bg',
            [GameConfig.AREAS.VIRIDIAN]: 'viridian-scene-bg',
            [GameConfig.AREAS.ROUTE2]: 'route2-source-bg',
            [GameConfig.AREAS.FOREST]: 'forest-scene-bg',
            [GameConfig.AREAS.PEWTER]: 'pewter-scene-bg',
            [GameConfig.AREAS.GYM]: 'pewter-gym-scene-bg',
            [GameConfig.AREAS.MART]: 'mart-scene-bg',
            [GameConfig.AREAS.POKEMON_CENTER]: 'pokemon-center-scene-bg',
        };
        const backgroundKey = translatedBackgrounds[window.gameState.currentArea];

        if (backgroundKey && this.textures.exists(backgroundKey)) {
            this.add.image(
                (this.currentMap.width * GameConfig.TILE_SIZE) / 2,
                (this.currentMap.height * GameConfig.TILE_SIZE) / 2,
                backgroundKey
            ).setDepth(-20);

            if (window.gameState.currentArea === GameConfig.AREAS.LAB) {
                this.drawLabInteractiveMarkers();
            } else if (window.gameState.currentArea === GameConfig.AREAS.VIRIDIAN) {
                this.drawViridianTranslatedFixups();
            } else if (window.gameState.currentArea === GameConfig.AREAS.ROUTE2) {
                this.drawRoute2ClosedEastBarrier();
            }
            return;
        }

        for (let y = 0; y < this.currentMap.height; y += 1) {
            for (let x = 0; x < this.currentMap.width; x += 1) {
                this.drawTile(x, y, this.currentMap.tiles[y][x]);
            }
        }

        this.drawAreaDecorations();
    }

    drawAreaBackdrop() {
        const width = this.currentMap.width * GameConfig.TILE_SIZE;
        const height = this.currentMap.height * GameConfig.TILE_SIZE;
        const centerX = width / 2;
        const centerY = height / 2;

        // Solid fallback color behind all tiles
        if (window.gameState.currentArea === GameConfig.AREAS.GYM) {
            this.add.rectangle(centerX, centerY, width, height, 0xe8e0d0).setDepth(-50);
        } else if (window.gameState.currentArea === GameConfig.AREAS.LAB) {
            this.add.rectangle(centerX, centerY, width, height, 0xcfd8dd).setDepth(-50);
        } else {
            // FireRed outdoor grass — matches primary palette 00 index 2 (#83D562)
            this.add.rectangle(centerX, centerY, width, height, 0x83d562).setDepth(-50);
        }
    }

    // Returns true if a WALL tile at (x,y) is a border/edge tile (adjacent to a
    // non-wall tile). Interior WALL tiles (fully surrounded by walls, i.e. inside
    // building footprints) return false — they should render as ground, not trees.
    isWallEdge(x, y) {
        const map = this.currentMap;
        const W = GameConfig.TILES.WALL;
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        return dirs.some(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) return true;
            return map.tiles[ny][nx] !== W;
        });
    }

    drawTile(x, y, tileType) {
        const T = GameConfig.TILE_SIZE;
        const cx = x * T + T / 2;
        const cy = y * T + T / 2;
        const alt = (x + y) % 2 === 0;
        const inTown = window.gameState.currentArea === GameConfig.AREAS.TOWN;
        const inLab = window.gameState.currentArea === GameConfig.AREAS.LAB;
        // Town uses the Pallet Town secondary ground tile; route keeps the grassy alternation.
        const groundKey = inTown
            ? 'tile_firered_ground_sec'
            : (alt ? 'tile_firered_ground' : 'tile_firered_ground_alt');

        if (inLab) {
            if (tileType === GameConfig.TILES.WALL) {
                this.add.rectangle(cx, cy, 16, 16, y <= 2 ? 0xb7c1c8 : 0xa3afb7).setDepth(-21);
                if (y <= 2) {
                    this.add.rectangle(cx, cy + 5, 16, 3, 0x89939b).setDepth(-20);
                }
                return;
            }

            if (tileType === GameConfig.TILES.DOOR) {
                this.add.rectangle(cx, cy, 16, 16, 0xd9dde0).setDepth(-21);
                this.add.rectangle(cx, cy + 4, 16, 8, 0xa88b5c).setDepth(-20);
                return;
            }

            if (tileType === GameConfig.TILES.FLOOR) {
                this.add.rectangle(cx, cy, 16, 16, alt ? 0xd8dfe4 : 0xd2d9de).setDepth(-21);
                this.add.rectangle(cx, cy, 14, 14, alt ? 0xe2e7eb : 0xdbe2e7, 0.25).setDepth(-20);
                return;
            }
        }

        if (tileType === GameConfig.TILES.WALL) {
            // Always draw ground base first so building/tree transparent areas show grass.
            this.add.image(cx, cy, groundKey).setDepth(-21);
            if (window.gameState.currentArea === GameConfig.AREAS.TOWN) {
                return;
            }
            // Only draw the tree/rock overlay for actual border edges.
            // Interior wall tiles (inside building footprints) just stay as grass.
            if (this.isWallEdge(x, y)) {
                const wallKey = alt ? 'tile_firered_tree' : 'tile_firered_tree_alt';
                this.add.image(cx, cy, wallKey).setDepth(-20);
            }
            return;
        }

        let key;
        if (tileType === GameConfig.TILES.WATER) {
            key = alt ? 'tile_firered_water' : 'tile_firered_water_alt';
        } else if (window.gameState.currentArea === GameConfig.AREAS.TOWN && (tileType === GameConfig.TILES.PATH || tileType === GameConfig.TILES.DOOR)) {
            key = groundKey;
        } else if (tileType === GameConfig.TILES.PATH || tileType === GameConfig.TILES.DOOR) {
            key = alt ? 'tile_firered_path' : 'tile_firered_path_alt';
        } else {
            key = groundKey;
        }
        this.add.image(cx, cy, key).setDepth(-20);
    }

    drawAreaDecorations() {
        if (window.gameState.currentArea === GameConfig.AREAS.TOWN) {
            this.drawTownDecorations();
        } else if (window.gameState.currentArea === GameConfig.AREAS.ROUTE) {
            this.drawRouteDecorations();
        } else if (window.gameState.currentArea === GameConfig.AREAS.LAB) {
            this.drawLabDecorations();
        } else if (window.gameState.currentArea === GameConfig.AREAS.GYM) {
            this.drawGymDecorations();
        }
    }

    drawTownDecorations() {
        this.drawTownBorderTrees();

        this.drawTownLawnPatch(3, 2, 7, 6);
        this.drawTownLawnPatch(13, 2, 7, 6);
        this.drawTownLawnPatch(4, 10, 6, 4);
        this.drawTownLawnPatch(13, 9, 8, 7);
        this.drawTownLawnPatch(13, 16, 8, 2);
        this.drawTownLawnPatch(6, 16, 7, 3);

        this.drawTownHouseTiles(4, 3);
        this.drawTownHouseTiles(14, 3);
        this.drawTownCivicBuilding(13, 9);

        this.drawTownMailbox(3, 5);
        this.drawTownMailbox(13, 5);

        this.drawFenceRow(4, 11, 5);
        this.drawSignTile(9, 11);
        this.drawFlowerBed(4, 12, 4, 2);
        this.drawFenceRow(13, 16, 6);
        this.drawSignTile(16, 16);
        this.drawPond(8, 17, 4, 3);
    }

    drawRouteDecorations() {
        // Fence posts along top and bottom edges
        for (let x = 2; x <= 17; x += 2) {
            this.drawFencePost(x, 1);
            this.drawFencePost(x, 13);
        }
        // Trees along route edges
        this.drawTree(3, 1);
        this.drawTree(16, 2);
        this.drawTree(2, 12);
        this.drawTree(17, 11);
        this.drawRouteGate(10, 0);
    }

    drawGymDecorations() {
        this.add.rectangle(8 * 16 + 8, 7 * 16 + 8, 34, 150, 0x7d6252, 0.16).setDepth(-11);
        this.add.rectangle(8 * 16 + 8, 7 * 16 + 8, 18, 150, 0xb98658, 0.16).setDepth(-10);
        this.drawPillar(3, 2);
        this.drawPillar(12, 2);
        this.drawPillar(3, 11);
        this.drawPillar(12, 11);
        this.drawBanner(8, 2);
    }

    drawLabDecorations() {
        this.drawLabBackCounter(1, 2, 11);
        this.drawLabMachine(2, 1);
        this.drawLabMachine(3, 1);
        this.drawLabDexTerminal(4, 1);
        this.drawLabDexTerminal(5, 1);
        this.drawLabDeskSign(6, 1);
        this.drawLabDeskSign(7, 1);
        this.drawLabTable(7, 4, 4);
        this.drawStarterPedestal(8, 4, 0xf2d479);
        this.drawStarterPedestal(9, 4, 0x7fc3f2);
        this.drawStarterPedestal(10, 4, 0xf08b69);
        this.drawLabBookcase(1, 8);
        this.drawLabBookcase(11, 8);
    }

    drawLabInteractiveMarkers() {
        [
            { x: 8, y: 4, species: 'Bulbasaur' },
            { x: 9, y: 4, species: 'Squirtle' },
            { x: 10, y: 4, species: 'Charmander' },
        ].filter(({ species }) => this.isStarterBallVisible(species)).forEach(({ x, y }) => {
            const centerX = x * 16 + 8;
            const centerY = y * 16 + 8;
            this.add.ellipse(centerX, centerY + 6, 10, 4, 0x000000, 0.18).setDepth(221);
            this.add.image(centerX, centerY + 1, 'ow_item_ball').setDepth(222);
        });
    }

    isStarterBallVisible(species) {
        if (!EventFlags.isSet('starter_received')) {
            return true;
        }

        if (EventFlags.isSet('rival_battle_complete')) {
            return false;
        }

        const playerStarter = window.gameState.playerStarterSpecies || window.gameState.playerParty?.get?.(0)?.species;
        const rivalStarter = window.gameState.rivalStarterSpecies;
        return species !== playerStarter && species !== rivalStarter;
    }

    drawViridianTranslatedFixups() {
        this.drawViridianWestConstructionBlock();
    }

    drawSourceBuilding(tileX, tileY, textureKey) {
        if (!this.textures.exists(textureKey)) {
            return;
        }

        const source = this.textures.get(textureKey).getSourceImage();
        const width = source?.width || GameConfig.TILE_SIZE;
        const height = source?.height || GameConfig.TILE_SIZE;
        this.drawGroundPatch(
            tileX,
            tileY,
            Math.ceil(width / GameConfig.TILE_SIZE),
            Math.ceil(height / GameConfig.TILE_SIZE),
            'tile_firered_ground_sec',
        );

        this.add.image(
            tileX * GameConfig.TILE_SIZE,
            tileY * GameConfig.TILE_SIZE,
            textureKey
        ).setOrigin(0, 0).setDepth(18 + tileY);
    }

    drawGroundPatch(tileX, tileY, width, height, groundKey = 'tile_firered_ground_sec') {
        const T = GameConfig.TILE_SIZE;
        for (let dy = 0; dy < height; dy += 1) {
            for (let dx = 0; dx < width; dx += 1) {
                const cx = (tileX + dx) * T + T / 2;
                const cy = (tileY + dy) * T + T / 2;
                this.add.image(cx, cy, groundKey).setDepth(0);
            }
        }
    }

    drawMetatileStructure(tileX, tileY, layout, groundKey = 'tile_firered_ground_sec') {
        const T = GameConfig.TILE_SIZE;
        layout.forEach((row, dy) => {
            row.forEach((key, dx) => {
                const cx = (tileX + dx) * T + T / 2;
                const cy = (tileY + dy) * T + T / 2;
                if (groundKey) {
                    this.add.image(cx, cy, groundKey).setDepth(1 + dy);
                }
                if (key) {
                    this.add.image(cx, cy, key).setDepth(2 + dy);
                }
            });
        });
    }

    drawTownHouseTiles(tileX, tileY) {
        this.drawGroundPatch(tileX - 1, tileY - 1, 7, 7);
        const layout = [
            [
                'tile_firered_house_roof_l',
                'tile_firered_house_roof_m',
                'tile_firered_house_roof_m',
                'tile_firered_house_roof_m',
                'tile_firered_house_roof_r',
            ],
            [
                'tile_firered_house_wall_l',
                'tile_firered_house_wall_m',
                'tile_firered_house_wall_m',
                'tile_firered_house_wall_m',
                'tile_firered_house_wall_r',
            ],
            [
                'tile_firered_house_roof_edge_l',
                'tile_firered_house_roof_edge_m_alt',
                'tile_firered_house_roof_edge_m',
                'tile_firered_house_roof_edge_m',
                'tile_firered_house_roof_edge_r',
            ],
            [
                'tile_firered_house_door',
                'tile_pallet_mt_19',
                'tile_pallet_mt_1A',
                'tile_pallet_mt_1B',
                'tile_pallet_mt_1C',
            ],
            [
                'tile_pallet_mt_20',
                'tile_pallet_mt_23',
                'tile_pallet_mt_22',
                'tile_pallet_mt_21',
                'tile_pallet_mt_24',
            ],
        ];
        this.drawMetatileStructure(tileX, tileY, layout);
    }

    drawViridianGymTiles(tileX, tileY) {
        this.drawGroundPatch(tileX - 1, tileY - 1, 7, 7);
        const layout = [
            [
                'tile_gym_roof_l',
                'tile_gym_roof_m',
                'tile_gym_roof_m',
                'tile_gym_roof_m',
                'tile_gym_roof_r',
            ],
            [
                'tile_gym_wall',
                'tile_gym_wall',
                'tile_gym_wall',
                'tile_gym_wall',
                'tile_gym_wall',
            ],
            [
                'tile_gym_wall',
                'tile_gym_door',
                'tile_gym_wall',
                'tile_gym_wall',
                'tile_gym_wall',
            ],
            [
                'tile_pallet_mt_20',
                'tile_pallet_mt_23',
                'tile_pallet_mt_22',
                'tile_pallet_mt_21',
                'tile_pallet_mt_24',
            ],
        ];
        this.drawMetatileStructure(tileX, tileY, layout);
    }

    drawViridianMartTiles(tileX, tileY) {
        this.drawGroundPatch(tileX - 1, tileY - 1, 7, 6);
        const layout = [
            [
                'tile_mart_roof',
                'tile_mart_roof',
                'tile_mart_roof',
                'tile_mart_roof',
                'tile_mart_roof',
            ],
            [
                'tile_mart_wall',
                'tile_mart_wall',
                'tile_mart_wall',
                'tile_mart_wall',
                'tile_mart_wall',
            ],
            [
                'tile_mart_wall',
                'tile_firered_house_door',
                'tile_mart_wall',
                'tile_mart_wall',
                'tile_mart_wall',
            ],
            [
                'tile_pallet_mt_20',
                'tile_pallet_mt_23',
                'tile_pallet_mt_22',
                'tile_pallet_mt_21',
                'tile_pallet_mt_24',
            ],
        ];
        this.drawMetatileStructure(tileX, tileY, layout);
    }

    drawPokemonCenterExterior(tileX, tileY) {
        const T = GameConfig.TILE_SIZE;
        const depth = 16 + tileY;
        this.drawGroundPatch(tileX - 1, tileY - 1, 7, 6);

        const x = tileX * T;
        const y = tileY * T;
        this.add.rectangle(x + T * 2.5, y + T * 0.5, T * 5, T, 0xd84b48).setDepth(depth);
        this.add.rectangle(x + T * 2.5, y + T * 1.5, T * 5, T, 0xf2efe0).setDepth(depth + 1);
        this.add.rectangle(x + T * 2.5, y + T * 2.5, T * 5, T, 0xd9d0a8).setDepth(depth + 1);
        this.add.rectangle(x + T * 2.5, y + T * 3.35, T * 5, T * 0.3, 0x7f6a38).setDepth(depth + 2);
        this.add.rectangle(x + T * 2.5, y + T * 0.95, T * 3, T * 0.35, 0xb63836).setDepth(depth + 2);
        this.add.rectangle(x + T * 2.0, y + T * 2.55, T * 0.7, T * 0.9, 0x38455d).setDepth(depth + 3);
        this.add.rectangle(x + T * 3.0, y + T * 2.55, T * 0.7, T * 0.9, 0x38455d).setDepth(depth + 3);
        this.add.rectangle(x + T * 2.5, y + T * 1.52, T * 1.1, T * 0.55, 0xffffff).setDepth(depth + 3);
        this.add.rectangle(x + T * 2.5, y + T * 1.52, T * 0.32, T * 0.55, 0xe54747).setDepth(depth + 4);
        this.add.rectangle(x + T * 2.5, y + T * 1.52, T * 1.1, T * 0.16, 0xe54747).setDepth(depth + 4);
    }

    drawViridianWestConstructionBlock() {
        this.add.image(7 * 16 + 8, 15 * 16 + 8, 'tile_firered_ground_sec').setDepth(3);
        for (let y = 16; y <= 19; y += 1) {
            for (let x = 0; x <= 7; x += 1) {
                this.add.image(x * 16 + 8, y * 16 + 8, 'tile_firered_ground_sec').setDepth(3);
            }
        }

        this.drawViridianSourceFenceRow(0, 19, 8);
        for (let y = 15; y <= 18; y += 1) {
            this.drawViridianSourceFence(7, y, 'tile_viridian_fence_vertical');
        }
        this.drawSignTile(8, 18);
    }

    drawViridianSourceFenceRow(tileX, tileY, count) {
        for (let i = 0; i < count; i += 1) {
            const key = i === count - 1 ? 'tile_viridian_fence_corner' : 'tile_viridian_fence_horizontal';
            this.drawViridianSourceFence(tileX + i, tileY, key);
        }
    }

    drawViridianSourceFence(tileX, tileY, key) {
        const T = GameConfig.TILE_SIZE;
        this.add.image(tileX * T + T / 2, tileY * T + T / 2, key).setDepth(8);
    }

    drawRoute2ClosedEastBarrier() {
        this.drawTree(12, 14);
        this.drawTree(12, 15);
        this.drawTree(14, 62);
        this.drawTree(14, 69);
    }

    drawLabTiles(tileX, tileY) {
        const T = GameConfig.TILE_SIZE;
        // 5-wide × 3-tall Oak's Lab using extracted pixel-art tiles
        // Roof (3 tiles) centred in a 5-wide span, padded by wall tiles
        const roofRow = [
            'tile_lab_roof_l', 'tile_lab_roof_m', 'tile_lab_roof_m',
            'tile_lab_roof_m', 'tile_lab_roof_r',
        ];
        const wallRow = [
            'tile_lab_wall_l', 'tile_lab_wall_m', 'tile_lab_wall_m',
            'tile_lab_wall_m', 'tile_lab_wall_r',
        ];
        const baseRow = [
            'tile_lab_base_l', 'tile_lab_wall_m', 'tile_lab_door',
            'tile_lab_wall_m', 'tile_lab_base_r',
        ];
        const layout = [roofRow, wallRow, baseRow];
        layout.forEach((row, dy) => {
            row.forEach((key, dx) => {
                const cx = (tileX + dx) * T + T / 2;
                const cy = (tileY + dy) * T + T / 2;
                this.add.image(cx, cy, 'tile_firered_ground').setDepth(1 + dy);
                this.add.image(cx, cy, key).setDepth(2 + dy);
            });
        });
    }

    drawLabTable(tileX, tileY, width) {
        for (let dx = 0; dx < width; dx += 1) {
            const cx = (tileX + dx) * 16 + 8;
            const cy = tileY * 16 + 8;
            this.add.rectangle(cx, cy, 16, 12, 0xe8d9b2).setDepth(4).setStrokeStyle(2, 0x7f6d49);
            this.add.rectangle(cx, cy - 5, 16, 2, 0xf3ead2).setDepth(5);
            this.add.rectangle(cx - 4, cy + 6, 2, 8, 0x7f6d49).setDepth(3);
            this.add.rectangle(cx + 4, cy + 6, 2, 8, 0x7f6d49).setDepth(3);
        }
    }

    drawLabMachine(tileX, tileY) {
        const cx = tileX * 16 + 8;
        const cy = tileY * 16 + 8;
        this.add.rectangle(cx, cy, 14, 14, 0xc2ccd4).setDepth(4).setStrokeStyle(2, 0x697582);
        this.add.rectangle(cx, cy - 1, 8, 5, 0x7fb1d5).setDepth(5);
        this.add.circle(cx + 4, cy + 4, 1.5, 0xf05050).setDepth(5);
    }

    drawLabDexTerminal(tileX, tileY) {
        const cx = tileX * 16 + 8;
        const cy = tileY * 16 + 8;
        this.add.rectangle(cx, cy + 1, 10, 8, 0xd3c4a0).setDepth(5).setStrokeStyle(1, 0x7f6d49);
        this.add.rectangle(cx, cy - 3, 8, 3, 0x89b4d8).setDepth(6);
    }

    drawLabDeskSign(tileX, tileY) {
        const cx = tileX * 16 + 8;
        const cy = tileY * 16 + 8;
        this.add.rectangle(cx, cy + 1, 8, 6, 0xf0e3b8).setDepth(5).setStrokeStyle(1, 0x7f6d49);
        this.add.rectangle(cx, cy - 1, 6, 1, 0x8b6f41).setDepth(6);
    }

    drawLabShelf(tileX, tileY, width) {
        for (let dx = 0; dx < width; dx += 1) {
            const cx = (tileX + dx) * 16 + 8;
            const cy = tileY * 16 + 8;
            this.add.rectangle(cx, cy, 16, 14, 0xb7b1a0).setDepth(4).setStrokeStyle(1, 0x6d6659);
            this.add.rectangle(cx, cy + 2, 16, 4, 0x8f8877).setDepth(5);
        }
    }

    drawStarterPedestal(tileX, tileY, glowColor) {
        const cx = tileX * 16 + 8;
        const cy = tileY * 16 + 8;
        this.add.ellipse(cx, cy + 6, 10, 4, 0x000000, 0.14).setDepth(6);
        this.add.circle(cx, cy, 4, 0xf4f4f4).setDepth(7).setStrokeStyle(1, 0x7a7a7a);
        this.add.rectangle(cx, cy + 1, 8, 2, 0x7a7a7a).setDepth(8);
        this.add.circle(cx, cy - 1, 1.5, glowColor).setDepth(9);
    }

    drawLabBackCounter(tileX, tileY, width) {
        for (let dx = 0; dx < width; dx += 1) {
            const cx = (tileX + dx) * 16 + 8;
            const cy = tileY * 16 + 8;
            this.add.rectangle(cx, cy, 16, 12, 0xc8b493).setDepth(3).setStrokeStyle(1, 0x7f6d49);
            this.add.rectangle(cx, cy - 4, 16, 2, 0xefe1c4).setDepth(4);
        }
    }

    drawLabBookcase(tileX, tileY) {
        const cx = tileX * 16 + 8;
        const cy = tileY * 16 + 8;
        this.add.rectangle(cx, cy, 14, 20, 0x8a6f48).setDepth(4).setStrokeStyle(2, 0x534126);
        this.add.rectangle(cx, cy - 4, 10, 3, 0xcf6b58).setDepth(5);
        this.add.rectangle(cx, cy, 10, 3, 0x5d8fc8).setDepth(5);
        this.add.rectangle(cx, cy + 4, 10, 3, 0xe0c15a).setDepth(5);
    }

    drawTownCivicBuilding(tileX, tileY) {
        const layout = [
            ['tile_pallet_mt_28', 'tile_pallet_mt_29', 'tile_pallet_mt_29', 'tile_pallet_mt_29', 'tile_pallet_mt_29', 'tile_pallet_mt_3D', 'tile_lab_wall_m'],
            ['tile_pallet_mt_30', 'tile_pallet_mt_31', 'tile_pallet_mt_31', 'tile_pallet_mt_31', 'tile_pallet_mt_31', 'tile_pallet_mt_33', 'tile_pallet_mt_34'],
            ['tile_pallet_mt_38', 'tile_pallet_mt_39', 'tile_pallet_mt_39', 'tile_pallet_mt_39', 'tile_pallet_mt_39', 'tile_pallet_mt_3B', 'tile_pallet_mt_3C'],
            ['tile_pallet_mt_40', 'tile_pallet_mt_41', 'tile_pallet_mt_50', 'tile_pallet_mt_42', 'tile_pallet_mt_43', 'tile_pallet_mt_44', 'tile_pallet_mt_45'],
            ['tile_pallet_mt_48', 'tile_pallet_mt_49', 'tile_pallet_mt_58', 'tile_lab_door', 'tile_pallet_mt_4B', 'tile_pallet_mt_4C', 'tile_pallet_mt_4D'],
        ];
        this.drawMetatileStructure(tileX, tileY, layout);
    }

    drawWindow(x, y, width, height) {
        this.add.rectangle(x, y, width, height, 0x7eaee3).setDepth(5).setStrokeStyle(2, 0x5b6f8b);
        this.add.rectangle(x, y + height / 2 - 2, width - 2, 3, 0xe3bd7a).setDepth(6);
        this.add.rectangle(x, y - 1, width - 3, 2, 0xd7efff, 0.65).setDepth(6);
    }

    drawTownWindow(x, y, width, height) {
        this.add.rectangle(x, y, width, height, 0x8fb9e7).setDepth(5).setStrokeStyle(2, 0x5c6f90);
        this.add.rectangle(x, y, 2, height - 2, 0x5f7395).setDepth(6);
        this.add.rectangle(x, y, width - 2, 2, 0x5f7395).setDepth(6);
        this.add.rectangle(x, y, width - 4, 3, 0xdaf1ff, 0.55).setDepth(6);
    }

    drawTownBorderTrees() {
        const T = GameConfig.TILE_SIZE;
        for (let y = 0; y < this.currentMap.height; y += 1) {
            for (let x = 0; x < this.currentMap.width; x += 1) {
                if (x !== 0 && y !== 0 && x !== this.currentMap.width - 1 && y !== this.currentMap.height - 1) {
                    continue;
                }

                const cx = x * T + T / 2;
                const cy = y * T + T / 2;
                const wallKey = (x + y) % 2 === 0 ? 'tile_firered_tree' : 'tile_firered_tree_alt';
                this.add.image(cx, cy, wallKey).setDepth(-12);
            }
        }
    }

    drawTownLawnPatch(tileX, tileY, width, height) {
        for (let dy = 0; dy < height; dy += 1) {
            for (let dx = 0; dx < width; dx += 1) {
                const cx = (tileX + dx) * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
                const cy = (tileY + dy) * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2;
                this.add.image(cx, cy, 'tile_firered_ground_alt').setDepth(-18);
            }
        }
    }

    drawSignTile(tileX, tileY) {
        const T = GameConfig.TILE_SIZE;
        const cx = tileX * T + T / 2;
        const cy = tileY * T + T / 2;
        this.add.image(cx, cy, 'tile_sign').setDepth(4);
    }

    drawTownMailbox(tileX, tileY) {
        const T = GameConfig.TILE_SIZE;
        const topCx = tileX * T + T / 2;
        const topCy = tileY * T + T / 2;
        const bottomCx = topCx;
        const bottomCy = (tileY + 1) * T + T / 2;
        this.add.image(topCx, topCy, 'tile_pallet_mt_25').setDepth(4);
        this.add.image(bottomCx, bottomCy, 'tile_pallet_mt_2D').setDepth(4);
    }

    drawTownPondTiles(tileX, tileY) {
        const layout = [
            ['tile_pallet_mt_51', 'tile_primary_mt_123', 'tile_primary_mt_123', 'tile_pallet_mt_52'],
            ['tile_primary_mt_12A', 'tile_firered_water', 'tile_firered_water', 'tile_firered_water_alt'],
            ['tile_primary_mt_12A', 'tile_firered_water', 'tile_firered_water', 'tile_firered_water_alt'],
        ];
        this.drawMetatileStructure(tileX, tileY, layout, null);
    }

    drawTree(tileX, tileY) {
        const px = tileX * 16 + 8;
        const py = tileY * 16 + 8;
        // FireRed-style tree: brown trunk, round dark green crown with lighter highlights
        this.add.rectangle(px, py + 6, 4, 8, 0x685030).setDepth(5);
        this.add.circle(px, py - 2, 8, 0x489048).setDepth(6);
        this.add.circle(px - 4, py, 6, 0x58a858).setDepth(6);
        this.add.circle(px + 4, py, 6, 0x58a858).setDepth(6);
        this.add.circle(px - 1, py - 4, 4, 0x68b868, 0.6).setDepth(7);
    }

    drawFencePost(tileX, tileY) {
        const T = GameConfig.TILE_SIZE;
        const cx = tileX * T + T / 2;
        const cy = tileY * T + T / 2;
        if (window.gameState.currentArea === GameConfig.AREAS.TOWN) {
            const key = (tileX + tileY) % 2 === 0 ? 'tile_pallet_mt_04' : 'tile_pallet_mt_07';
            this.add.image(cx, cy, key).setDepth(4);
            return;
        }

        this.add.image(cx, cy, 'tile_grass').setDepth(3);
        this.drawWoodFenceAt(cx, cy, 4);
    }

    drawFenceRow(tileX, tileY, count) {
        for (let i = 0; i < count; i += 1) {
            this.drawFencePost(tileX + i, tileY);
        }
    }

    drawWoodFenceAt(cx, cy, depth = 4) {
        this.add.rectangle(cx, cy + 3, 14, 3, 0x7a4a2a).setDepth(depth);
        this.add.rectangle(cx, cy - 3, 14, 3, 0xb06b38).setDepth(depth + 1);
        this.add.rectangle(cx - 5, cy, 3, 14, 0x6a3a22).setDepth(depth + 2);
        this.add.rectangle(cx + 5, cy, 3, 14, 0x6a3a22).setDepth(depth + 2);
        this.add.rectangle(cx - 5, cy - 5, 5, 3, 0xd08a48).setDepth(depth + 3);
        this.add.rectangle(cx + 5, cy - 5, 5, 3, 0xd08a48).setDepth(depth + 3);
    }

    drawFlower(tileX, tileY) {
        const T = GameConfig.TILE_SIZE;
        const cx = tileX * T + T / 2;
        const cy = tileY * T + T / 2;
        if (window.gameState.currentArea === GameConfig.AREAS.TOWN) {
            const key = (tileX + tileY) % 2 === 0 ? 'tile_flower' : 'tile_flower_alt';
            this.add.image(cx, cy, key).setDepth(4);
            return;
        }

        this.add.image(cx, cy, 'tile_grass').setDepth(3);
        const key = (tileX + tileY) % 2 === 0 ? 'tile_flower' : 'tile_flower_alt';
        this.add.image(cx, cy, key).setDepth(4);
    }

    drawFlowerBed(startX, startY, width, height) {
        for (let dy = 0; dy < height; dy += 1) {
            for (let dx = 0; dx < width; dx += 1) {
                this.drawFlower(startX + dx, startY + dy);
            }
        }
    }

    drawGrassIsland(startX, startY, width, height) {
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const cx = (startX + x) * 16 + 8;
                const cy = (startY + y) * 16 + 8;
                const key = (x + y) % 2 === 0 ? 'tile_grass' : 'tile_grass_alt';
                this.add.image(cx, cy, key).setDepth(-19);
            }
        }
    }

    drawPond(startX, startY, width, height) {
        if (window.gameState.currentArea === GameConfig.AREAS.TOWN) {
            this.drawTownPondTiles(startX, startY);
            return;
        }

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const cx = (startX + x) * 16 + 8;
                const cy = (startY + y) * 16 + 8;
                const waterKey = (x + y) % 2 === 0 ? 'tile_firered_water' : 'tile_firered_water_alt';
                this.add.image(cx, cy, waterKey).setDepth(-18);
                this.add.image(cx, cy, 'tile_water_edge').setDepth(-17);
            }
        }
    }

    drawRouteGate(tileX, tileY) {
        const px = tileX * 16 + 8;
        const py = tileY * 16 + 8;
        this.add.rectangle(px, py + 9, 22, 10, 0xc6ae78, 0.95).setDepth(3).setStrokeStyle(2, 0x7b603d);
        this.add.rectangle(px, py + 3, 6, 18, 0x8f6e43).setDepth(4);
    }

    drawPillar(tileX, tileY) {
        const px = tileX * 16 + 8;
        const py = tileY * 16 + 8;
        this.add.rectangle(px, py + 8, 10, 22, 0x8a7867).setDepth(4).setStrokeStyle(1, 0xd0c3b0);
        this.add.rectangle(px, py - 2, 14, 4, 0x6c5d4f).setDepth(5);
    }

    drawBanner(tileX, tileY) {
        const px = tileX * 16 + 8;
        const py = tileY * 16 + 8;
        this.add.rectangle(px, py, 18, 24, 0x9d6d3d).setDepth(4).setStrokeStyle(2, 0xf0d19c);
        this.add.circle(px, py - 2, 4, 0xe8d188).setDepth(5);
    }

    createWorldSprite(tileX, tileY, textureKey, frame = 0, scale = 1) {
        const shadow = this.add.ellipse(0, -1, 10, 4, 0x000000, 0.16);
        const sprite = this.add.sprite(0, 0, textureKey, frame);
        sprite.setOrigin(0.5, 1);
        sprite.setScale(scale);

        const container = this.add.container(
            (tileX + 0.5) * GameConfig.TILE_SIZE,
            (tileY + 1) * GameConfig.TILE_SIZE,
            [shadow, sprite]
        );
        container.setDepth(20 + tileY);
        container.shadow = shadow;
        container.sprite = sprite;
        return container;
    }

    setWorldSpriteFacing(container, direction) {
        if (!container?.sprite) {
            return;
        }

        const frameMap = {
            up: 1,
            left: 2,
            down: 0,
            right: 2,
        };
        const frame = frameMap[direction];
        if (typeof frame === 'number') {
            container.sprite.setFrame(frame);
        }
        container.sprite.setFlipX(direction === 'right');
    }

    createWorldObject(tileX, tileY, textureKey, scale = 1) {
        const sprite = this.add.image(0, 0, textureKey);
        sprite.setOrigin(0.5, 1);
        sprite.setScale(scale);
        const container = this.add.container(
            (tileX + 0.5) * GameConfig.TILE_SIZE,
            (tileY + 1) * GameConfig.TILE_SIZE,
            [sprite]
        );
        container.setDepth(18 + tileY);
        return container;
    }

    createPlayer() {
        const { x, y } = window.gameState.playerPosition;
        this.playerSprite = this.createWorldSprite(x, y, 'ow_red', 0, 1);
        this.setWorldSpriteFacing(this.playerSprite, window.gameState.playerFacing || 'down');
    }

    spawnNPCs() {
        this.npcs = Object.values(NPCData)
            .filter((npc) => npc.area === window.gameState.currentArea)
            .map((npcData) => {
                const resolvedData = this.resolveNPCRuntimeData(npcData);
                const sprite = resolvedData.objectImage
                    ? this.createWorldObject(resolvedData.position.x, resolvedData.position.y, resolvedData.objectImage, 1)
                    : this.createWorldSprite(resolvedData.position.x, resolvedData.position.y, resolvedData.spriteSheet || 'ow_man', resolvedData.spriteFrame || 0, 1);
                return { data: resolvedData, sprite };
            });
    }

    resolveNPCRuntimeData(npcData) {
        if (npcData.id !== 'viridian_guide') {
            return npcData;
        }

        if (!EventFlags.isSet('pokedex_received')) {
            return {
                ...npcData,
                position: { x: 21, y: 11 },
                spriteSheet: 'ow_old_man_lying_down',
                spriteFrame: 0,
            };
        }

        return {
            ...npcData,
            position: { x: 21, y: 8 },
            spriteSheet: 'ow_old_man_1',
            spriteFrame: 0,
        };
    }

    spawnTrainers() {
        this.trainers = Object.values(TrainerData)
            .filter((trainer) => trainer.area === window.gameState.currentArea)
            .filter((trainer) => !EventFlags.isSet(trainer.defeatFlag))
            .map((trainerData) => {
                const sprite = this.createWorldSprite(
                    trainerData.position.x,
                    trainerData.position.y,
                    trainerData.spriteSheet || 'ow_youngster',
                    trainerData.spriteFrame || 0,
                    1
                );
                return { data: trainerData, sprite };
            });
    }

    createHUD() {
        // FireRed overworld: no party panel during exploration
        // Area name banner — shows briefly when entering a new area (FireRed style)
        this.areaLabel = this.add.text(16, GameConfig.SCREEN_HEIGHT - 32, '', {
            font: 'bold 12px "Courier New"',
            fill: '#f8f8f8',
            backgroundColor: 'rgba(0,0,0,0.72)',
            padding: { x: 10, y: 5 },
        });
        this.areaLabel.setOrigin(0, 1);
        this.areaLabel.setScrollFactor(0);
        this.areaLabel.setDepth(401);
        this.areaLabel.setAlpha(0);

        this.promptText = this.add.text(GameConfig.SCREEN_WIDTH / 2, GameConfig.SCREEN_HEIGHT - 10, '', {
            font: 'bold 11px Arial',
            fill: '#f2d479',
            backgroundColor: 'rgba(31,36,48,0.55)',
            padding: { x: 8, y: 4 },
        });
        this.promptText.setOrigin(0.5, 1);
        this.promptText.setScrollFactor(0);
        this.promptText.setDepth(950);

        this.toastText = this.add.text(GameConfig.SCREEN_WIDTH - 14, 12, '', {
            font: 'bold 11px Arial',
            fill: '#f2d479',
            align: 'right',
            backgroundColor: 'rgba(31,36,48,0.72)',
            padding: { x: 6, y: 4 },
        });
        this.toastText.setOrigin(1, 0);
        this.toastText.setScrollFactor(0);
        this.toastText.setDepth(401);
    }

    createStarterSelectionOverlay() {
        const centerX = GameConfig.SCREEN_WIDTH / 2;
        const centerY = GameConfig.SCREEN_HEIGHT / 2;
        const backing = this.add.rectangle(centerX, centerY, GameConfig.SCREEN_WIDTH, GameConfig.SCREEN_HEIGHT, 0x06080d, 0.62);
        const panelY = GameConfig.SCREEN_HEIGHT - 64;
        const dialogueOuter = this.add.rectangle(centerX, panelY, 436, 104, 0xe2c465, 1);
        const dialogueInner = this.add.rectangle(centerX, panelY, 426, 94, 0xf6f0db, 1);
        const dialoguePanel = this.add.rectangle(centerX, panelY, 416, 84, 0x2f597a, 1);
        this.starterPreviewText = this.add.text(38, GameConfig.SCREEN_HEIGHT - 108, '', {
            font: '18px "Courier New"',
            fill: '#f8f8f8',
            wordWrap: { width: 302 },
            lineSpacing: 8,
        });

        this.starterChoiceOuter = this.add.rectangle(GameConfig.SCREEN_WIDTH - 66, GameConfig.SCREEN_HEIGHT - 70, 88, 58, 0xe2c465, 1);
        this.starterChoiceInner = this.add.rectangle(GameConfig.SCREEN_WIDTH - 66, GameConfig.SCREEN_HEIGHT - 70, 80, 50, 0xf6f0db, 1);
        this.starterConfirmTexts = ['YES', 'NO'].map((label, index) =>
            this.add.text(GameConfig.SCREEN_WIDTH - 82, GameConfig.SCREEN_HEIGHT - 84 + index * 18, label, {
                font: 'bold 14px "Courier New"',
                fill: '#243024',
            })
        );

        this.starterSelectionContainer = this.add.container(0, 0, [
            backing,
            dialogueOuter,
            dialogueInner,
            dialoguePanel,
            this.starterPreviewText,
            this.starterChoiceOuter,
            this.starterChoiceInner,
            ...this.starterConfirmTexts,
        ]);
        this.starterSelectionContainer.setScrollFactor(0);
        this.starterSelectionContainer.setDepth(1100);
        this.starterSelectionContainer.setVisible(false);
    }

    createCompletionOverlay() {
        const centerX = GameConfig.SCREEN_WIDTH / 2;
        const centerY = GameConfig.SCREEN_HEIGHT / 2;

        const backing = this.add.rectangle(centerX, centerY, GameConfig.SCREEN_WIDTH, GameConfig.SCREEN_HEIGHT, 0x08090c, 0.68);
        const panel = this.add.rectangle(centerX, centerY, 344, 188, 0x1f2430, 0.96).setStrokeStyle(3, 0xf8f6ef);
        const ribbon = this.add.rectangle(centerX, centerY - 58, 214, 18, 0x8f673d, 0.95).setStrokeStyle(1, 0xf2d479);
        const title = this.add.text(centerX, centerY - 58, 'GYM CLEAR', {
            font: 'bold 14px Arial',
            fill: '#f2d479',
        }).setOrigin(0.5);
        const heading = this.add.text(centerX, centerY - 18, 'BOULDERBADGE Won!', {
            font: 'bold 24px Arial',
            fill: '#f8f6ef',
            stroke: '#3b2e27',
            strokeThickness: 4,
        }).setOrigin(0.5);
        const body = this.add.text(centerX, centerY + 24, 'Red decided one Badge was enough proof.\nTo make him learn otherwise, email sikki@umich.edu.', {
            font: '12px Arial',
            fill: '#d7d2c7',
            align: 'center',
            lineSpacing: 6,
            wordWrap: { width: 286 },
        }).setOrigin(0.5);
        const prompt = this.add.text(centerX, centerY + 72, 'Z or X to continue', {
            font: 'bold 12px Arial',
            fill: '#f2d479',
        }).setOrigin(0.5);

        this.completionOverlay = this.add.container(0, 0, [backing, panel, ribbon, title, heading, body, prompt]);
        this.completionOverlay.setScrollFactor(0);
        this.completionOverlay.setDepth(1200);
        this.completionOverlay.setVisible(false);
    }

    update(time, delta) {
        Movement.updateFrame();
        this.dialogueBox.update(delta);

        if (this.starterSelectionVisible) {
            this.updateStarterSelection();
            return;
        }

        if (this.completionOverlay?.visible) {
            if (Movement.isConfirmPressed() || Movement.isInteractPressed()) {
                this.hideCompletionOverlay();
            }
            return;
        }

        if (DialogueManager.isActive()) {
            if (Movement.isSkipPressed()) {
                this.dialogueBox.finishLine();
            } else if (Movement.isInteractPressed()) {
                if (this.dialogueBox.isComplete()) {
                    DialogueManager.advance();
                }
            }
            this.refreshHUD();
            return;
        }

        if (this.trainerEncounterInProgress || this.wildEncounterInProgress) {
            this.refreshHUD();
            return;
        }

        if (Movement.isSavePressed()) {
            SaveManager.save(window.gameState);
            this.showToast('Progress saved');
        }

        if (Movement.isInteractPressed()) {
            this.handleInteraction();
        }

        const moveDir = Movement.getNextMove();
        if (moveDir && !this.isTransitioning && time - this.lastMoveTime > GameConfig.TILE_WALK_TIME) {
            this.tryMove(moveDir);
            this.lastMoveTime = time;
        }

        this.checkTrainerLineOfSight();

        this.refreshHUD();
    }

    tryMove(moveDir) {
        window.gameState.playerFacing = moveDir.name || window.gameState.playerFacing || 'down';
        this.setWorldSpriteFacing(this.playerSprite, window.gameState.playerFacing);

        const nextX = window.gameState.playerPosition.x + moveDir.dx;
        const nextY = window.gameState.playerPosition.y + moveDir.dy;
        const blockers = this.getBlockingPositions();

        if (this.isViridianOldManRoadblock(nextX, nextY)) {
            DialogueManager.start(['This is private property!']);
            return;
        }

        if (this.isViridianGymLockedTrigger(nextX, nextY)) {
            DialogueManager.start(["VIRIDIAN GYM's doors are locked…"]);
            return;
        }

        if (!Collision.canMoveTo(nextX, nextY, this.currentMap, blockers)) {
            if (this.tryLedgeJump(moveDir, nextX, nextY, blockers)) {
                return;
            }
            return;
        }

        const transition = Collision.checkTransition(nextX, nextY, this.currentMap);
        if (transition && !this.canUseTransition(transition)) {
            return;
        }

        window.gameState.playerPosition = { x: nextX, y: nextY };
        this.playerSprite.setPosition(
            (nextX + 0.5) * GameConfig.TILE_SIZE,
            (nextY + 1) * GameConfig.TILE_SIZE
        );
        this.playerSprite.setDepth(20 + nextY);

        if (transition) {
            this.changeArea(transition.area, transition.x, transition.y);
            return;
        }

        this.tryTriggerWildEncounter(nextX, nextY);
    }

    isViridianOldManRoadblock(tileX, tileY) {
        return window.gameState.currentArea === GameConfig.AREAS.VIRIDIAN &&
            !EventFlags.isSet('pokedex_received') &&
            tileX === 22 &&
            tileY === 11;
    }

    isViridianGymLockedTrigger(tileX, tileY) {
        return window.gameState.currentArea === GameConfig.AREAS.VIRIDIAN &&
            tileX === 36 &&
            tileY === 11;
    }

    tryLedgeJump(moveDir, blockedX, blockedY, blockers) {
        if (!this.canJumpLedge(moveDir, blockedX, blockedY, blockers)) {
            return false;
        }

        const landingX = blockedX + moveDir.dx;
        const landingY = blockedY + moveDir.dy;
        window.gameState.playerPosition = { x: landingX, y: landingY };
        this.tweens.add({
            targets: this.playerSprite,
            x: (landingX + 0.5) * GameConfig.TILE_SIZE,
            y: (landingY + 1) * GameConfig.TILE_SIZE,
            duration: GameConfig.TILE_WALK_TIME,
            ease: 'Quad.out',
            onUpdate: () => {
                this.playerSprite.setDepth(20 + landingY);
            },
            onComplete: () => {
                this.tryTriggerWildEncounter(landingX, landingY);
            },
        });
        return true;
    }

    canJumpLedge(moveDir, blockedX, blockedY, blockers) {
        const ledgeAreas = new Set([GameConfig.AREAS.ROUTE, GameConfig.AREAS.ROUTE2, GameConfig.AREAS.PEWTER]);
        if (!ledgeAreas.has(window.gameState.currentArea)) {
            return false;
        }

        // Early FireRed overworld ledges in this slice are south-facing one-way drops.
        if (moveDir.dy !== 1 || moveDir.dx !== 0) {
            return false;
        }

        if (this.currentMap.blockedLedges?.some((tile) => tile.x === blockedX && tile.y === blockedY)) {
            return false;
        }

        const landingX = blockedX;
        const landingY = blockedY + 1;
        return Collision.canMoveTo(landingX, landingY, this.currentMap, blockers);
    }

    tryTriggerWildEncounter(tileX, tileY) {
        if (this.isTransitioning || this.trainerEncounterInProgress || this.wildEncounterInProgress) {
            return;
        }

        if (!EventFlags.isSet('starter_received')) {
            return;
        }

        const encounterTable = WildEncounterData[window.gameState.currentArea];
        if (!encounterTable?.landMons?.length) {
            return;
        }

        const tileType = this.currentMap.tiles?.[tileY]?.[tileX];
        if (tileType !== encounterTable.terrainTile) {
            return;
        }

        const encounterZones = encounterTable.encounterZones || [];
        if (encounterZones.length && !encounterZones.some((zone) =>
            tileX >= zone.x &&
            tileX < zone.x + zone.width &&
            tileY >= zone.y &&
            tileY < zone.y + zone.height
        )) {
            return;
        }

        this.stepsSinceWildEncounter += 1;

        if (this.stepsSinceWildEncounter < (encounterTable.cooldownSteps || 0)) {
            return;
        }

        if (Math.random() > encounterTable.stepChance) {
            return;
        }

        const encounter = Phaser.Utils.Array.GetRandom(encounterTable.landMons);
        if (!encounter) {
            return;
        }

        this.startWildEncounter(encounter);
    }

    startWildEncounter(encounter) {
        this.wildEncounterInProgress = true;
        this.stepsSinceWildEncounter = 0;
        this.showToast(`A wild ${encounter.species.toUpperCase()} appeared!`);
        this.launchWildBattle(encounter);
    }

    getBlockingPositions() {
        const npcPositions = this.npcs.map((npc) => npc.data.position);
        const trainerPositions = this.trainers.map((trainer) => trainer.data.position);
        return [...npcPositions, ...trainerPositions];
    }

    getAdjacentTrainer() {
        const { x, y } = window.gameState.playerPosition;
        return this.trainers.find((trainer) =>
            Collision.isAdjacent(x, y, trainer.data.position.x, trainer.data.position.y)
        );
    }

    getAdjacentNPC() {
        const { x, y } = window.gameState.playerPosition;
        const facing = this.getFacingVector();
        const directlyAdjacent = this.npcs.find((npc) =>
            npc.data.position.x === x + facing.dx &&
            npc.data.position.y === y + facing.dy
        );

        if (directlyAdjacent) {
            return directlyAdjacent;
        }

        // FireRed lets the player talk across counters, so indoor clerks/nurses can be two tiles away.
        return this.npcs.find((npc) =>
            npc.data.position.x === x + facing.dx * 2 &&
            npc.data.position.y === y + facing.dy * 2
        ) || null;
    }

    getFacingVector() {
        const facing = window.gameState.playerFacing || 'down';
        if (facing === 'up') return { dx: 0, dy: -1 };
        if (facing === 'down') return { dx: 0, dy: 1 };
        if (facing === 'left') return { dx: -1, dy: 0 };
        if (facing === 'right') return { dx: 1, dy: 0 };
        return { dx: 0, dy: 1 };
    }

    getAdjacentBgEvent() {
        const { x, y } = window.gameState.playerPosition;
        const events = this.currentMap.bgEvents || [];
        return events.find((event) => {
            if (event.type === 'starter_ball') {
                if (!this.isStarterBallVisible(event.species)) {
                    return false;
                }

                const dx = Math.abs(x - event.x);
                const dy = Math.abs(y - event.y);
                return dx + dy <= 1;
            }

            return Collision.isAdjacent(x, y, event.x, event.y);
        });
    }

    getPromptText() {
        if (window.gameState.currentArea === GameConfig.AREAS.LAB && !EventFlags.isSet('starter_received')) {
            return 'X inspect a Poke Ball';
        }

        const trainer = this.getAdjacentTrainer();
        if (trainer) {
            return 'X Talk / Battle';
        }

        const npc = this.getAdjacentNPC();
        if (npc) {
            return 'X Interact';
        }

        const bgEvent = this.getAdjacentBgEvent();
        if (bgEvent) {
            if (bgEvent.type === 'starter_ball' && !EventFlags.isSet('starter_received')) {
                return 'X inspect Poke Ball';
            }
            return bgEvent.type === 'sign' ? 'X Read' : 'X Inspect';
        }

        return 'X interact  P save';
    }

    refreshHUD() {
        // Area label is shown via showAreaName() on scene start — no update needed here
        this.promptText.setText(DialogueManager.isActive() ? '' : this.getPromptText());
    }

    showAreaName() {
        const label = this.areaLabel;
        label.setText(this.getCurrentAreaDisplayName());
        label.setAlpha(1);
        this.tweens.add({
            targets: label,
            alpha: 0,
            delay: 2200,
            duration: 700,
            ease: 'Linear',
        });
    }

    getCurrentAreaDisplayName() {
        const area = window.gameState.currentArea;
        const origin = window.gameState.lastInteriorSourceArea;

        if (area === GameConfig.AREAS.MART) {
            return origin === GameConfig.AREAS.PEWTER ? 'Pewter Poké Mart' : 'Viridian Poké Mart';
        }

        if (area === GameConfig.AREAS.POKEMON_CENTER) {
            return origin === GameConfig.AREAS.PEWTER ? 'Pewter Pokémon Center' : 'Viridian Pokémon Center';
        }

        return this.currentMap.name;
    }

    runAreaArrivalSequence() {
        const area = window.gameState.currentArea;

        if (area === GameConfig.AREAS.TOWN && !EventFlags.isSet('town_arrival_seen')) {
            EventFlags.set('town_arrival_seen');
            this.time.delayedCall(180, () => {
                DialogueManager.start([
                    'You step into quiet Pallet Town.',
                    'A narrow path leads north toward Route 1.',
                ], () => {
                    SaveManager.save(window.gameState);
                    this.refreshHUD();
                });
            });
            return;
        }

        if (area === GameConfig.AREAS.ROUTE && !EventFlags.isSet('route_arrival_seen')) {
            EventFlags.set('route_arrival_seen');
            this.time.delayedCall(160, () => {
                DialogueManager.start([
                    'Route 1 stretches north toward Viridian City.',
                    'Wild Pokemon live in the tall grass, so keep your partner close.',
                ], () => {
                    SaveManager.save(window.gameState);
                    this.refreshHUD();
                });
            });
            return;
        }

        if (area === GameConfig.AREAS.ROUTE2 && !EventFlags.isSet('route2_arrival_seen')) {
            EventFlags.set('route2_arrival_seen');
            this.time.delayedCall(160, () => {
                DialogueManager.start([
                    'Route 2 runs north toward Pewter City.',
                    'Viridian Forest stretches ahead beyond the gatehouses.',
                ], () => {
                    SaveManager.save(window.gameState);
                    this.refreshHUD();
                });
            });
            return;
        }

        if (area === GameConfig.AREAS.VIRIDIAN && !EventFlags.isSet('viridian_arrival_seen')) {
            EventFlags.set('viridian_arrival_seen');
            this.time.delayedCall(160, () => {
                DialogueManager.start([
                    'Viridian City opens up ahead in a broad green square.',
                    "The gym is closed, but the Poké Mart is open if you need anything.",
                ], () => {
                    SaveManager.save(window.gameState);
                    this.refreshHUD();
                });
            });
            return;
        }

        if (area === GameConfig.AREAS.FOREST && !EventFlags.isSet('forest_arrival_seen')) {
            EventFlags.set('forest_arrival_seen');
            this.time.delayedCall(160, () => {
                DialogueManager.start([
                    'Viridian Forest is thick with Bug Pokémon and eager bug catchers.',
                    'Keep heading north if you want to reach Pewter City.',
                ], () => {
                    SaveManager.save(window.gameState);
                    this.refreshHUD();
                });
            });
            return;
        }

        if (area === GameConfig.AREAS.PEWTER && !EventFlags.isSet('pewter_arrival_seen')) {
            EventFlags.set('pewter_arrival_seen');
            this.time.delayedCall(160, () => {
                DialogueManager.start([
                    "You're a TRAINER, right?",
                    "BROCK's looking for new challengers. Follow me!",
                    'If you have the right stuff, go take on BROCK!',
                ], () => {
                    EventFlags.set('pewter_guide_seen');
                    window.gameState.currentObjective = 'Enter Pewter Gym and challenge Brock.';
                    SaveManager.save(window.gameState);
                    this.refreshHUD();
                });
            });
            return;
        }

        if (area === GameConfig.AREAS.MART && !EventFlags.isSet('mart_arrival_seen')) {
            EventFlags.set('mart_arrival_seen');
            this.time.delayedCall(120, () => {
                DialogueManager.start([
                    'The clerk looks up from behind the counter.',
                    'It seems there is something here for Professor Oak.',
                ], () => {
                    SaveManager.save(window.gameState);
                    this.refreshHUD();
                });
            });
            return;
        }

        if (area === GameConfig.AREAS.POKEMON_CENTER) {
            this.time.delayedCall(80, () => {
                this.refreshHUD();
            });
            return;
        }

        if (area === GameConfig.AREAS.LAB && !EventFlags.isSet('lab_arrival_seen')) {
            EventFlags.set('lab_arrival_seen');
            this.time.delayedCall(160, () => {
                if (EventFlags.isSet('starter_received')) {
                    this.refreshHUD();
                    SaveManager.save(window.gameState);
                    return;
                }

                DialogueManager.start([
                    "OAK: Here, come with me!",
                    "Gramps! I'm fed up with waiting!",
                    'OAK: There are three Pokemon here. They are inside the Poke Balls.',
                    'OAK: When I was young, I was a serious Pokemon trainer.',
                    'OAK: In my old age, I have only these three left. You can have one. Go on, choose!',
                ], () => {
                    EventFlags.set('lab_intro_complete');
                    window.gameState.currentObjective = 'Walk up to a Poke Ball and choose your first Pokemon.';
                    SaveManager.save(window.gameState);
                    this.refreshHUD();
                });
            });
            return;
        }

        if (area === GameConfig.AREAS.GYM && !EventFlags.isSet('gym_arrival_seen')) {
            EventFlags.set('gym_arrival_seen');
            this.time.delayedCall(160, () => {
                DialogueManager.start([
                    'Pewter Gym is quiet except for the crunch of stone underfoot.',
                    'Camper Liam stands between you and Brock.',
                ], () => {
                    SaveManager.save(window.gameState);
                    this.refreshHUD();
                });
            });
        }
    }

    canUseTransition(transition) {
        if (window.gameState.currentArea === GameConfig.AREAS.TOWN && transition.area === GameConfig.AREAS.ROUTE) {
            if (!EventFlags.isSet('starter_received')) {
                this.triggerOakStopSequence();
                return false;
            }
        }

        if (window.gameState.currentArea === GameConfig.AREAS.VIRIDIAN && transition.area === GameConfig.AREAS.ROUTE2 && !EventFlags.isSet('pokedex_received')) {
            this.showToast('The old man is still blocking the way north.');
            return false;
        }

        return true;
    }

    checkTrainerLineOfSight() {
        if (DialogueManager.isActive() || this.isTransitioning || this.trainerEncounterInProgress) {
            return;
        }

        const playerPosition = window.gameState.playerPosition;
        const spottingTrainer = this.trainers.find((trainer) => this.canTrainerSeePlayer(trainer.data, playerPosition));
        if (!spottingTrainer) {
            return;
        }

        this.startTrainerSpottingEncounter(spottingTrainer);
    }

    canTrainerSeePlayer(trainerData, playerPosition) {
        if (!this.trainerRequirementsMet(trainerData)) {
            return false;
        }

        const sightRange = trainerData.sightRange || 0;
        if (sightRange <= 0) {
            return false;
        }

        const dx = playerPosition.x - trainerData.position.x;
        const dy = playerPosition.y - trainerData.position.y;

        if (dx !== 0 && dy !== 0) {
            return false;
        }

        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance === 0 || distance > sightRange) {
            return false;
        }

        const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
        const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
        for (let step = 1; step < distance; step += 1) {
            const tileX = trainerData.position.x + stepX * step;
            const tileY = trainerData.position.y + stepY * step;
            if (!Collision.isWalkable(tileX, tileY, this.currentMap)) {
                return false;
            }
        }

        return true;
    }

    startTrainerSpottingEncounter(trainer) {
        this.trainerEncounterInProgress = true;
        window.gameState.currentTrainer = trainer.data;
        this.showToast(`${trainer.data.name} spotted you!`);

        const path = this.buildTrainerApproachPath(trainer.data.position, window.gameState.playerPosition);
        this.moveTrainerAlongPath(trainer, path, () => {
            const before = trainer.data.dialogueBefore;
            const introLines = Array.isArray(before)
                ? before
                : [before ? `${trainer.data.name}: ${before}` : `${trainer.data.name} wants to battle!`];

            DialogueManager.start(introLines, () => {
                this.launchBattle(trainer.data);
            });
        });
    }

    buildTrainerApproachPath(trainerPosition, playerPosition) {
        const path = [];
        const dx = playerPosition.x - trainerPosition.x;
        const dy = playerPosition.y - trainerPosition.y;
        const distance = Math.abs(dx) + Math.abs(dy);
        const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
        const stepY = dy === 0 ? 0 : dy / Math.abs(dy);

        for (let step = 1; step < distance; step += 1) {
            path.push({
                x: trainerPosition.x + stepX * step,
                y: trainerPosition.y + stepY * step,
            });
        }

        return path;
    }

    moveTrainerAlongPath(trainer, path, onComplete) {
        if (!path.length) {
            onComplete();
            return;
        }

        const nextStep = path.shift();
        trainer.data.position = { ...nextStep };
        this.tweens.add({
            targets: trainer.sprite,
            x: (nextStep.x + 0.5) * GameConfig.TILE_SIZE,
            y: (nextStep.y + 0.5) * GameConfig.TILE_SIZE,
            duration: 110,
            onComplete: () => this.moveTrainerAlongPath(trainer, path, onComplete),
        });
    }

    showCompletionOverlay() {
        this.completionOverlay?.setVisible(true);
    }

    hideCompletionOverlay() {
        this.completionOverlay?.setVisible(false);
        SaveManager.clearSave();
        window.gameState = SaveManager.createBaseState();
        this.scene.start('TitleScene', {
            hasSave: false,
            saveData: null,
            forceNewGameOnly: true,
        });
    }

    showToast(message) {
        this.toastText.setText(message);
        this.time.delayedCall(1400, () => {
            this.toastText.setText('');
        });
    }

    handleInteraction() {
        const trainer = this.getAdjacentTrainer();
        if (trainer) {
            this.interactWithTrainer(trainer.data);
            return;
        }

        const npc = this.getAdjacentNPC();
        if (npc) {
            this.interactWithNPC(npc.data);
            return;
        }

        const bgEvent = this.getAdjacentBgEvent();
        if (bgEvent) {
            this.interactWithBgEvent(bgEvent);
        }
    }

    interactWithNPC(npcData) {
        window.gameState.inventory = {
            pokeBalls: 0,
            potions: 0,
            ...(window.gameState.inventory || {}),
        };

        if (npcData.id === 'route1_mart_clerk') {
            if (EventFlags.isSet('got_route1_potion')) {
                DialogueManager.start([
                    'Please come see us if you need POKé BALLS for catching POKéMON.',
                ]);
                return;
            }

            DialogueManager.start([
                'Hi! I work at a POKéMON MART.',
                "It's part of a convenient chain selling all sorts of items.",
                'Please, visit us in VIRIDIAN CITY.',
                "I know, I'll give you a sample. Here you go!",
                'You put the POTION away in the BAG.',
            ], () => {
                EventFlags.set('got_route1_potion');
                window.gameState.inventory.potions += 1;
                SaveManager.save(window.gameState);
            });
            return;
        }

        if (npcData.id === 'viridian_guide') {
            if (!EventFlags.isSet('pokedex_received')) {
                DialogueManager.start(['This is private property!']);
                return;
            }

            if (!EventFlags.isSet('viridian_catching_tutorial_seen')) {
                DialogueManager.start([
                    "Well, now, I've had my coffee, and that's what I need to get going!",
                    "Ah, so you're working on your POKéDEX.",
                    "You don't know how to catch a POKéMON?",
                    'I suppose I had better show you then!',
                    'First, focus on weakening the POKéMON before trying to catch it.',
                    'There! Now tell me, that was educational, was it not?',
                    'And here, take this, too.',
                    'You received the TEACHY TV.',
                ], () => {
                    EventFlags.set('viridian_catching_tutorial_seen');
                    EventFlags.set('teachy_tv_received');
                    window.gameState.inventory.pokeBalls = Math.max(window.gameState.inventory.pokeBalls, 5);
                    window.gameState.currentObjective = 'Catch wild POKéMON in tall grass, then continue north to Route 2.';
                    SaveManager.save(window.gameState);
                    this.refreshHUD();
                });
                return;
            }

            DialogueManager.start([
                'At first, focus on weakening the POKéMON before trying to catch it.',
            ]);
            return;
        }

        if (npcData.id === 'mart_clerk' && EventFlags.isSet('starter_received') && !EventFlags.isSet('got_oaks_parcel')) {
            DialogueManager.start([
                'Hey! You came from PALLET TOWN?',
                'You know PROF. OAK, right?',
                'His order came in. Can I get you to take it to him?',
                "You received OAK's PARCEL!",
            ], () => {
                EventFlags.set('got_oaks_parcel');
                window.gameState.currentObjective = "Return to Pallet Town and deliver Oak's Parcel.";
                SaveManager.save(window.gameState);
                this.refreshHUD();
            });
            return;
        }

        if (npcData.id === 'mart_clerk' && EventFlags.isSet('pokedex_received')) {
            DialogueManager.start([
                'Hi there! May I help you?',
                'You bought 5 POKé BALLS.',
            ], () => {
                window.gameState.inventory.pokeBalls += 5;
                SaveManager.save(window.gameState);
                this.refreshHUD();
            });
            return;
        }

        if (npcData.id === 'viridian_nurse') {
            DialogueManager.start([
                'NURSE: Welcome to our POKéMON CENTER.',
                'NURSE: We will restore your tired POKéMON to full health.',
                'NURSE: Thank you for waiting. Your POKéMON are fighting fit!',
            ], () => {
                window.gameState.playerParty?.healAll?.();
                SaveManager.save(window.gameState);
                this.refreshHUD();
            });
            return;
        }

        if (npcData.id === 'professor' && EventFlags.isSet('got_oaks_parcel') && !EventFlags.isSet('delivered_oaks_parcel')) {
            DialogueManager.start([
                "OAK: Oh! That's the custom Poké Ball I ordered!",
                'OAK: Thank you!',
                'OAK: Here, take these with you on your journey.',
                'OAK: Both of you, take these POKEDEXES!',
                'You received a POKEDEX!',
                'BLUE received a POKEDEX, too!',
                'OAK: The road north of Viridian City should be clear now.',
                'OAK: Go through Route 2 and Viridian Forest to reach Pewter City.',
            ], () => {
                EventFlags.set('delivered_oaks_parcel');
                EventFlags.set('pokedex_received');
                EventFlags.set('rival_pokedex_received');
                window.gameState.inventory.pokeBalls = Math.max(window.gameState.inventory.pokeBalls || 0, 5);
                window.gameState.currentObjective = 'Head back to Viridian City and continue north through Route 2.';
                SaveManager.save(window.gameState);
                this.refreshHUD();
            });
            return;
        }

        const lines = this.resolveNPCDialogue(npcData);
        DialogueManager.start(lines, () => {
            if (npcData.id === 'professor' && !EventFlags.isSet('starter_received')) {
                window.gameState.currentObjective = 'Inspect one of the three Poke Balls on the table.';
                SaveManager.save(window.gameState);
                this.refreshHUD();
                return;
            }

            if (npcData.objectiveAfter) {
                window.gameState.currentObjective = npcData.objectiveAfter;
            }
            SaveManager.save(window.gameState);
        }, npcData.eventFlags || []);
    }

    interactWithBgEvent(bgEvent) {
        if (bgEvent.type === 'starter_ball' && EventFlags.isSet('starter_received')) {
            DialogueManager.start(['There is a POKé BALL left on the table.']);
            return;
        }

        if (bgEvent.type === 'starter_ball') {
            DialogueManager.start(bgEvent.lines || [], () => {
                this.showStarterSelection(bgEvent.species);
            });
            return;
        }

        const lines = bgEvent.lines || ['There is nothing unusual here.'];
        DialogueManager.start(lines, () => {
            SaveManager.save(window.gameState);
        });
    }

    resolveNPCDialogue(npcData) {
        if (npcData.dialogueAfterFlags) {
            const entries = Object.entries(npcData.dialogueAfterFlags);
            for (const [flag, lines] of entries) {
                if (EventFlags.isSet(flag)) {
                    return lines;
                }
            }
        }

        return npcData.dialogue;
    }

    interactWithTrainer(trainerData) {
        if (this.trainerEncounterInProgress) {
            return;
        }

        if (!this.trainerRequirementsMet(trainerData)) {
            const blockedText = trainerData.blockedDialogue || 'You cannot challenge this trainer yet.';
            DialogueManager.start([blockedText]);
            return;
        }

        window.gameState.currentTrainer = trainerData;
        if (trainerData.dialogueBefore) {
            const before = trainerData.dialogueBefore;
            const lines = Array.isArray(before) ? before : [before];
            DialogueManager.start(lines, () => this.launchBattle(trainerData));
            return;
        }

        this.launchBattle(trainerData);
    }

    trainerRequirementsMet(trainerData) {
        const requiredFlags = trainerData.requiredFlags || [];
        return requiredFlags.every((flag) => EventFlags.isSet(flag));
    }

    launchBattle(trainerData) {
        const enemyParty = new Party();
        trainerData.team.forEach((pokemonDef) => {
            const speciesData = PokemonData[pokemonDef.species];
            if (speciesData) {
                enemyParty.add(new Pokemon(speciesData, pokemonDef.level, {
                    moves: pokemonDef.moves,
                }));
            }
        });

        this.isTransitioning = true;
        this.cameras.main.fadeOut(180, 0, 0, 0);
        this.time.delayedCall(180, () => {
            this.scene.launch('BattleScene', {
                playerParty: window.gameState.playerParty,
                enemyParty,
                trainer: trainerData,
                onBattleEnd: this.onBattleEnd.bind(this),
            });
            this.scene.bringToTop('BattleScene');
            this.scene.setVisible(false, 'WorldScene');
            this.scene.sleep('WorldScene');
        });
    }

    launchWildBattle(encounterDef) {
        const speciesData = PokemonData[encounterDef.species];
        if (!speciesData) {
            this.wildEncounterInProgress = false;
            return;
        }

        const enemyParty = new Party();
        enemyParty.add(new Pokemon(speciesData, encounterDef.level, {
            moves: encounterDef.moves,
        }));

        this.isTransitioning = true;
        this.cameras.main.fadeOut(180, 0, 0, 0);
        this.time.delayedCall(180, () => {
            this.scene.launch('BattleScene', {
                playerParty: window.gameState.playerParty,
                enemyParty,
                trainer: null,
                battleType: 'wild',
                onBattleEnd: this.onBattleEnd.bind(this),
            });
            this.scene.bringToTop('BattleScene');
            this.scene.setVisible(false, 'WorldScene');
            this.scene.sleep('WorldScene');
        });
    }

    onBattleEnd(result) {
        const trainerData = result.trainer || window.gameState.currentTrainer;
        window.gameState.currentTrainer = null;
        this.isTransitioning = false;
        this.trainerEncounterInProgress = false;
        this.wildEncounterInProgress = false;

        if (!trainerData) {
            if (!result.playerWon) {
                this.respawnAtLastPokemonCenter();
                return;
            }

            SaveManager.save(window.gameState);
            this.scene.stop('BattleScene');
            this.scene.setVisible(true, 'WorldScene');
            this.scene.wake('WorldScene');
            this.cameras.main.fadeIn(180);

            const followUpLines = [];
            if (result.escaped) {
                // FireRed returns straight to the map after a successful RUN.
            } else if (result.caught && result.enemySpecies) {
                followUpLines.push(`${result.enemySpecies.toUpperCase()} was added to your party.`);
            } else if (result.enemySpecies) {
                followUpLines.push(`The wild ${result.enemySpecies.toUpperCase()} was defeated.`);
            }
            if (!result.caught && result.expAwarded) {
                followUpLines.push(`${window.gameState.playerParty.getActive().species} gained ${result.expAwarded} EXP.`);
            }
            if (!result.caught && result.leveledUp) {
                followUpLines.push(`${window.gameState.playerParty.getActive().species} grew to Lv${window.gameState.playerParty.getActive().level}!`);
            }
            (result.learnedMoves || []).forEach((moveName) => {
                followUpLines.push(`${window.gameState.playerParty.getActive().species} learned ${moveName}!`);
            });

            if (followUpLines.length) {
                this.time.delayedCall(40, () => {
                    DialogueManager.start(followUpLines, () => {
                        SaveManager.save(window.gameState);
                    });
                });
            }
            return;
        }

        if (trainerData?.id === 'rival_lab_battle') {
            EventFlags.set('rival_battle_complete');
            window.gameState.playerParty.healAll();
            window.gameState.currentObjective = 'Leave the lab and head north to Viridian City.';
            SaveManager.save(window.gameState);

            this.scene.stop('BattleScene');
            this.scene.setVisible(true, 'WorldScene');
            this.scene.wake('WorldScene');
            this.cameras.main.fadeIn(180);

            const followUpLines = result.playerWon
                ? [
                    "BLUE: Hmph! Am I great or what?",
                    'OAK: Train your Pokemon by battling and make your way north to Viridian City.',
                ]
                : [
                    "BLUE: Yeah! Am I great or what?",
                    'OAK: Take good care of your Pokemon, then head north when you are ready.',
                ];

            this.time.delayedCall(40, () => {
                DialogueManager.start(followUpLines, () => {
                    SaveManager.save(window.gameState);
                });
            });
            return;
        }

        if (!result.playerWon) {
            this.respawnAtLastPokemonCenter();
            return;
        }

        EventFlags.set(trainerData.defeatFlag);

        if (trainerData.id === 'trainer_route1') {
            EventFlags.set('route_cleared');
        }

        if (trainerData.isBoss) {
            window.gameState.gymCompleted = true;
            window.gameState.currentObjective = 'Red thinks he is already the best there is.';
        } else if (trainerData.objectiveAfter) {
            window.gameState.currentObjective = trainerData.objectiveAfter;
        }

        SaveManager.save(window.gameState);

        const trainerEntry = this.trainers.find((trainer) => trainer.data.id === trainerData.id);
        if (trainerEntry) {
            trainerEntry.sprite.destroy();
            this.trainers = this.trainers.filter((trainer) => trainer !== trainerEntry);
        }

        this.scene.stop('BattleScene');
        this.scene.setVisible(true, 'WorldScene');
        this.scene.wake('WorldScene');
        this.cameras.main.fadeIn(180);

        const followUpLines = [];
        if (trainerData.dialogueAfter) {
            const after = trainerData.dialogueAfter;
            if (Array.isArray(after)) {
                followUpLines.push(...after);
            } else {
                followUpLines.push(after);
            }
        }
        if (result.expAwarded) {
            followUpLines.push(`${window.gameState.playerParty.getActive().species} gained ${result.expAwarded} EXP.`);
        }
        if (result.leveledUp) {
            followUpLines.push(`${window.gameState.playerParty.getActive().species} grew to Lv${window.gameState.playerParty.getActive().level}!`);
        }
        (result.learnedMoves || []).forEach((moveName) => {
            followUpLines.push(`${window.gameState.playerParty.getActive().species} learned ${moveName}!`);
        });
        if (trainerData.id === 'gym_leader') {
            followUpLines.push('RED received the BOULDERBADGE!');
            followUpLines.push('RED stared at it proudly.');
            followUpLines.push('RED: One badge... Yep. Best there is.');
            followUpLines.push('And so, RED ended his journey a little early.');
            followUpLines.push('If you want RED to learn that he is very wrong, email sikki@umich.edu and convince me to make the full version.');
        }

        if (followUpLines.length) {
            this.time.delayedCall(40, () => {
                DialogueManager.start(followUpLines, () => {
                    if (trainerData.id === 'gym_leader') {
                        EventFlags.set('demo_complete');
                        this.showCompletionOverlay();
                    }
                    SaveManager.save(window.gameState);
                });
            });
        }
    }

    changeArea(areaName, x, y) {
        if (this.isTransitioning) {
            return;
        }

        const fromArea = window.gameState.currentArea;
        let targetArea = areaName;
        let targetX = x;
        let targetY = y;

        if (this.isSharedInterior(areaName) && this.isCityArea(fromArea)) {
            window.gameState.lastInteriorSourceArea = fromArea;
            window.gameState.lastPokemonCenterArea = fromArea;
        }

        if (this.isSharedInterior(fromArea) && areaName === GameConfig.AREAS.VIRIDIAN) {
            const origin = this.isCityArea(window.gameState.lastInteriorSourceArea)
                ? window.gameState.lastInteriorSourceArea
                : GameConfig.AREAS.VIRIDIAN;
            const returnPoint = this.getSharedInteriorReturnPoint(fromArea, origin);
            targetArea = origin;
            targetX = returnPoint.x;
            targetY = returnPoint.y;
        }

        if (this.isCityArea(targetArea)) {
            window.gameState.lastPokemonCenterArea = targetArea;
        }

        this.isTransitioning = true;
        this.trainerEncounterInProgress = false;
        this.cameras.main.fadeOut(120, 0, 0, 0);
        this.time.delayedCall(120, () => {
            window.gameState.currentArea = targetArea;
            window.gameState.playerPosition = { x: targetX, y: targetY };
            SaveManager.save(window.gameState);
            this.scene.restart();
        });
    }

    isSharedInterior(areaName) {
        return areaName === GameConfig.AREAS.MART || areaName === GameConfig.AREAS.POKEMON_CENTER;
    }

    isCityArea(areaName) {
        return areaName === GameConfig.AREAS.VIRIDIAN || areaName === GameConfig.AREAS.PEWTER;
    }

    getSharedInteriorReturnPoint(interiorArea, originArea) {
        if (originArea === GameConfig.AREAS.PEWTER) {
            return interiorArea === GameConfig.AREAS.MART
                ? { x: 28, y: 19 }
                : { x: 17, y: 26 };
        }

        return interiorArea === GameConfig.AREAS.MART
            ? { x: 36, y: 20 }
            : { x: 26, y: 27 };
    }

    getLastPokemonCenterArea() {
        return this.isCityArea(window.gameState.lastPokemonCenterArea)
            ? window.gameState.lastPokemonCenterArea
            : GameConfig.AREAS.VIRIDIAN;
    }

    respawnAtLastPokemonCenter() {
        const centerArea = this.getLastPokemonCenterArea();
        window.gameState.playerParty?.healAll?.();
        window.gameState.currentArea = GameConfig.AREAS.POKEMON_CENTER;
        window.gameState.lastInteriorSourceArea = centerArea;
        window.gameState.lastPokemonCenterArea = centerArea;
        window.gameState.playerPosition = { ...MapData[GameConfig.AREAS.POKEMON_CENTER].spawnPoint };
        window.gameState.playerFacing = 'up';
        window.gameState.currentObjective = 'Your Pokémon were restored. Head back out when you are ready.';
        SaveManager.save(window.gameState);
        this.scene.stop('BattleScene');
        this.scene.start('WorldScene');
    }

    triggerOakStopSequence() {
        if (DialogueManager.isActive() || this.isTransitioning || this.starterSelectionVisible) {
            return;
        }

        EventFlags.set('oak_stop_seen');
        window.gameState.currentObjective = "Follow Oak to the lab and choose a Pokemon.";
        DialogueManager.start([
            "OAK: Hey! Wait! Don't go out!",
            'OAK: It is unsafe! Wild Pokemon live in tall grass!',
            'OAK: You need your own Pokemon for your protection. I know! Come with me!',
        ], () => {
            SaveManager.save(window.gameState);
            this.changeArea(GameConfig.AREAS.LAB, 6, 11);
        });
    }

    showStarterSelection(species) {
        if (EventFlags.isSet('starter_received') || !species) {
            return;
        }

        if (!this.starterSelectionContainer) {
            this.createStarterSelectionOverlay();
        }

        this.pendingStarterSpecies = species;
        this.starterSelectionVisible = true;
        this.starterConfirmIndex = 0;
        this.starterSelectionContainer?.setVisible(true);
        this.refreshStarterSelection();
    }

    hideStarterSelection() {
        this.starterSelectionVisible = false;
        this.pendingStarterSpecies = null;
        this.starterSelectionContainer?.setVisible(false);
    }

    updateStarterSelection() {
        if (Movement.consumePressed('ArrowLeft') || Movement.consumePressed('a') || Movement.consumePressed('ArrowUp') || Movement.consumePressed('w')) {
            this.starterConfirmIndex = 0;
            this.refreshStarterSelection();
        } else if (Movement.consumePressed('ArrowRight') || Movement.consumePressed('d') || Movement.consumePressed('ArrowDown') || Movement.consumePressed('s')) {
            this.starterConfirmIndex = 1;
            this.refreshStarterSelection();
        }

        const confirmPressed =
            Movement.consumePressed('Enter') ||
            Movement.consumePressed('x') ||
            Movement.consumePressed('X');

        if (confirmPressed) {
            if (this.starterConfirmIndex === 0) {
                this.chooseStarter(this.pendingStarterSpecies);
            } else {
                this.hideStarterSelection();
                this.refreshHUD();
            }
        }
    }

    refreshStarterSelection() {
        const descriptions = {
            Bulbasaur: "OAK: I see! BULBASAUR is your choice.\nIt's very easy to raise.\n\nSo, you want to go with the GRASS Pokémon BULBASAUR?",
            Charmander: "OAK: Ah! CHARMANDER is your choice.\nYou should raise it patiently.\n\nSo, you're claiming the FIRE Pokémon CHARMANDER?",
            Squirtle: "OAK: Hm! SQUIRTLE is your choice.\nIt's one worth raising.\n\nSo, you've decided on the WATER Pokémon SQUIRTLE?",
        };
        const species = this.pendingStarterSpecies || 'Bulbasaur';

        this.starterPreviewText.setText(descriptions[species]);

        this.starterConfirmTexts.forEach((text, index) => {
            const selected = index === this.starterConfirmIndex;
            text.setColor(selected ? '#1f261b' : '#425042');
            text.setText(`${selected ? '▶ ' : '  '}${index === 0 ? 'YES' : 'NO'}`);
        });
    }

    chooseStarter(species) {
        const starterParty = new Party();
        starterParty.add(new Pokemon(PokemonData[species], 5));
        window.gameState.playerParty = starterParty;
        window.gameState.playerStarterSpecies = species;
        window.gameState.rivalStarterSpecies = this.getRivalStarter(species);
        window.gameState.currentObjective = 'Battle your rival, then head north to Route 1.';
        EventFlags.set('starter_received');

        this.hideStarterSelection();
        SaveManager.save(window.gameState);

        DialogueManager.start([
            `You received ${species}!`,
            `BLUE: I'll take ${window.gameState.rivalStarterSpecies}, then!`,
            'BLUE: Wait! Let us check out our Pokemon!',
        ], () => {
            SaveManager.save(window.gameState);
            this.startRivalBattle();
        });
    }

    getRivalStarter(playerStarter) {
        if (playerStarter === 'Bulbasaur') {
            return 'Charmander';
        }
        if (playerStarter === 'Charmander') {
            return 'Squirtle';
        }
        return 'Bulbasaur';
    }

    startRivalBattle() {
        const rivalStarter = window.gameState.rivalStarterSpecies || 'Charmander';
        const trainerData = {
            id: 'rival_lab_battle',
            name: 'Blue',
            team: [{
                species: rivalStarter,
                level: 5,
            }],
            aiFlags: ['AI_SCRIPT_CHECK_BAD_MOVE', 'AI_SCRIPT_TRY_TO_FAINT', 'AI_SCRIPT_CHECK_VIABILITY'],
            dialogueAfter: '',
            expReward: 45,
        };
        this.launchBattle(trainerData);
    }
}
