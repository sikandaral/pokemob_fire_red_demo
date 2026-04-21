class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
        this.sceneData = {};
    }

    init(data) {
        this.sceneData = data || {};
    }

    preload() {
        this.createLoadingUI();
        this.registerLoadingProgress();
        this.preloadBattleSprites();
        this.preloadWorldTiles();
        this.preloadOverworldSprites();
        this.preloadBattleUI();
    }

    create() {
        if (this.sceneData.debugBattle) {
            this.startDebugBattle();
            return;
        }

        const saveData = this.getIncomingSaveData();
        window.gameState = this.buildRuntimeState(saveData);

        EventFlags.load(saveData.eventFlags);
        window.gameState.gymCompleted = Boolean(
            saveData.gymCompleted || EventFlags.isSet('defeated_gym_leader') || EventFlags.isSet('demo_complete')
        );

        SaveManager.save(window.gameState);
        this.scene.start('WorldScene');
    }

    createLoadingUI() {
        const centerX = GameConfig.SCREEN_WIDTH / 2;
        const centerY = GameConfig.SCREEN_HEIGHT / 2;

        this.add.rectangle(centerX, centerY, GameConfig.SCREEN_WIDTH, GameConfig.SCREEN_HEIGHT, 0x12181a);
        this.add.circle(centerX - 110, centerY - 72, 64, 0x77b255, 0.12);
        this.add.circle(centerX + 122, centerY - 58, 72, 0x5a92d8, 0.12);

        this.add.text(centerX, centerY - 70, 'Preparing Adventure', {
            font: 'bold 24px Arial',
            fill: '#f8f6ef',
        }).setOrigin(0.5);

        this.loadingHintText = this.add.text(centerX, centerY - 36, 'Loading map, sprites, and battle assets...', {
            font: '12px Arial',
            fill: '#d7d2c7',
        }).setOrigin(0.5);

        this.loadingBarFrame = this.add.rectangle(centerX, centerY + 10, 284, 22, 0x202a32)
            .setStrokeStyle(2, 0xf8f6ef);
        this.loadingBarFill = this.add.rectangle(centerX - 138, centerY + 10, 0, 16, 0xf2d479)
            .setOrigin(0, 0.5);

        this.loadingPercentText = this.add.text(centerX, centerY + 44, '0%', {
            font: 'bold 14px Arial',
            fill: '#f2d479',
        }).setOrigin(0.5);
    }

    registerLoadingProgress() {
        this.load.on('progress', (value) => {
            this.loadingBarFill.width = Math.floor(276 * value);
            this.loadingPercentText.setText(`${Math.round(value * 100)}%`);
        });

        this.load.on('complete', () => {
            this.loadingHintText.setText('Assets ready. Finalizing save state...');
            this.loadingPercentText.setText('Ready');
        });
    }

    preloadBattleSprites() {
        BattleAssetManifest.all().forEach((entry) => {
            if (entry.front) {
                this.load.image(entry.front.key, entry.front.path);
            }
            if (entry.back) {
                if (entry.back.frameWidth && entry.back.frameHeight) {
                    this.load.spritesheet(entry.back.key, entry.back.path, {
                        frameWidth: entry.back.frameWidth,
                        frameHeight: entry.back.frameHeight,
                    });
                } else {
                    this.load.image(entry.back.key, entry.back.path);
                }
            }
        });
    }

    preloadWorldTiles() {
        const tileBase = 'assets/tiles/extracted/';
        this.load.image('town-scene-bg', 'assets/generated/town_scene_bg.png?v=20260420ae');
        this.load.image('lab-scene-bg', 'assets/generated/lab_scene_bg.png');
        this.load.image('route-scene-bg', 'assets/generated/route_scene_bg.png?v=20260420ac');
        this.load.image('viridian-scene-bg', 'assets/generated/viridian_scene_bg.png?v=20260420ac');
        this.load.image('viridian-source-bg', 'assets/generated/viridian_source_bg.png?v=20260420ac');
        this.load.image('route2-scene-bg', 'assets/generated/route2_scene_bg.png?v=20260420ac');
        this.load.image('route2-source-bg', 'assets/generated/route2_source_bg.png');
        this.load.image('forest-source-bg', 'assets/generated/forest_source_bg.png');
        this.load.image('viridian-gym-source', 'assets/generated/viridian_gym_source.png?v=20260420ac');
        this.load.image('viridian-mart-source', 'assets/generated/viridian_mart_source.png');
        this.load.image('viridian-pokemon-center-source', 'assets/generated/viridian_pokemon_center_source.png?v=20260420ac');
        this.load.image('forest-scene-bg', 'assets/generated/forest_scene_bg.png');
        this.load.image('pewter-scene-bg', 'assets/generated/pewter_scene_bg.png');
        this.load.image('pewter-gym-scene-bg', 'assets/generated/pewter_gym_scene_bg.png');
        this.load.image('mart-scene-bg', 'assets/generated/mart_scene_bg.png');
        this.load.image('pokemon-center-scene-bg', 'assets/generated/pokemon_center_scene_bg.png');
        const tiles = [
            'firered_ground', 'firered_ground_alt', 'firered_ground_sec',
            'firered_tree', 'firered_tree_alt',
            'firered_house_roof_l', 'firered_house_roof_m', 'firered_house_roof_r',
            'firered_house_roof_edge_l', 'firered_house_roof_edge_m', 'firered_house_roof_edge_m_alt', 'firered_house_roof_edge_r',
            'firered_house_wall_l', 'firered_house_wall_m', 'firered_house_wall_r',
            'firered_house_base_l', 'firered_house_base_mid', 'firered_house_door', 'firered_house_base_r',
            'firered_water', 'firered_water_alt', 'primary_mt_123', 'primary_mt_12A',
            'firered_path', 'firered_path_alt',
            'lab_roof_l', 'lab_roof_m', 'lab_roof_r',
            'lab_wall_l', 'lab_wall_m', 'lab_wall_r',
            'lab_door', 'lab_base_l', 'lab_base_r',
            'mart_roof', 'mart_wall',
            'gym_roof_l', 'gym_roof_m', 'gym_roof_r', 'gym_wall', 'gym_door',
            'pallet_mt_19', 'pallet_mt_1A', 'pallet_mt_1B', 'pallet_mt_1C',
            'pallet_mt_20', 'pallet_mt_21', 'pallet_mt_22', 'pallet_mt_23', 'pallet_mt_24',
            'pallet_mt_25', 'pallet_mt_28', 'pallet_mt_29', 'pallet_mt_30', 'pallet_mt_31', 'pallet_mt_2D',
            'pallet_mt_04', 'pallet_mt_07',
            'pallet_mt_33', 'pallet_mt_34',
            'pallet_mt_38', 'pallet_mt_39', 'pallet_mt_3A', 'pallet_mt_3B', 'pallet_mt_3C', 'pallet_mt_3D',
            'pallet_mt_40', 'pallet_mt_41', 'pallet_mt_42', 'pallet_mt_43', 'pallet_mt_44', 'pallet_mt_45',
            'pallet_mt_48', 'pallet_mt_49', 'pallet_mt_4A', 'pallet_mt_4B', 'pallet_mt_4C', 'pallet_mt_4D',
            'pallet_mt_50', 'pallet_mt_51', 'pallet_mt_52', 'pallet_mt_58',
            'fence', 'fence_alt',
            'viridian_fence_horizontal', 'viridian_fence_vertical', 'viridian_fence_corner',
            'flower', 'flower_alt',
            'sign', 'grass', 'grass_alt', 'water_edge',
        ];

        tiles.forEach((name) => {
            this.load.image(`tile_${name}`, `${tileBase}${name}.png`);
        });
    }

    preloadOverworldSprites() {
        this.load.spritesheet('ow_red', 'graphics/object_events/pics/people/red_normal.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_youngster', 'graphics/object_events/pics/people/youngster.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_man', 'graphics/object_events/pics/people/man.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_woman_1', 'graphics/object_events/pics/people/woman_1.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_gentleman', 'graphics/object_events/pics/people/gentleman.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_little_girl', 'graphics/object_events/pics/people/little_girl.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_blue', 'graphics/object_events/pics/people/blue.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_old_man_1', 'graphics/object_events/pics/people/old_man_1.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_old_man_lying_down', 'graphics/object_events/pics/people/old_man_lying_down.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('ow_old_man_2', 'graphics/object_events/pics/people/old_man_2.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_picnicker', 'graphics/object_events/pics/people/picnicker.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_bug_catcher', 'graphics/object_events/pics/people/bug_catcher.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_camper', 'graphics/object_events/pics/people/camper.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_boy', 'graphics/object_events/pics/people/boy.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_lass', 'graphics/object_events/pics/people/lass.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_scientist', 'graphics/object_events/pics/people/scientist.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_clerk', 'graphics/object_events/pics/people/clerk.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_nurse', 'graphics/object_events/pics/people/nurse.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_gym_guy', 'graphics/object_events/pics/people/gym_guy.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_prof_oak', 'graphics/object_events/pics/people/prof_oak.png', { frameWidth: 16, frameHeight: 32 });
        this.load.spritesheet('ow_brock', 'graphics/object_events/pics/people/brock.png', { frameWidth: 16, frameHeight: 32 });
        this.load.image('ow_wooden_sign', 'graphics/object_events/pics/misc/wooden_sign.png');
        this.load.image('ow_sign', 'graphics/object_events/pics/misc/sign.png');
        this.load.image('ow_item_ball', 'graphics/object_events/pics/misc/item_ball.png');
    }

    preloadBattleUI() {
        this.load.image('battle-ui-enemy-shadow', 'assets/generated/ui/battle_enemy_shadow.png');
        this.load.image('battle-ui-enemy-main', 'assets/generated/ui/enemy_main.png');
        this.load.image('battle-ui-enemy-level', 'assets/generated/ui/enemy_level.png');
        this.load.image('battle-ui-enemy-hp', 'assets/generated/ui/enemy_hp.png');
        this.load.image('battle-ui-enemy-bar', 'assets/generated/ui/enemy_bar.png');
        this.load.image('battle-ui-player-main', 'assets/generated/ui/player_main.png');
        this.load.image('battle-ui-player-level', 'assets/generated/ui/player_level.png');
        this.load.image('battle-ui-player-hp', 'assets/generated/ui/player_hp.png');
        this.load.image('battle-ui-player-bar', 'assets/generated/ui/player_bar.png');
    }

    getIncomingSaveData() {
        return SaveManager.normalize(this.sceneData.saveData || this.data.get('saveData'));
    }

    buildRuntimeState(saveData) {
        return {
            ...saveData,
            playerParty: this.buildPlayerParty(saveData.playerParty),
            currentTrainer: null,
            battleLog: [],
            isNewGame: Boolean(this.sceneData.isNewGame),
        };
    }

    buildPlayerParty(savedParty) {
        const party = new Party();

        if (Array.isArray(savedParty) && savedParty.length > 0) {
            party.fromJSON(savedParty);
        }

        if (!party.size() && EventFlags.isSet('starter_received')) {
            party.add(new Pokemon(PokemonData.Bulbasaur, 5));
        }

        return party;
    }

    startDebugBattle() {
        const playerParty = new Party();
        const enemyParty = new Party();
        playerParty.add(new Pokemon(PokemonData.Bulbasaur, 5));
        enemyParty.add(new Pokemon(PokemonData.Pidgeotto, 7));

        this.scene.start('BattleScene', {
            playerParty,
            enemyParty,
            trainer: { name: 'Debug Trainer', id: 'debug-trainer' },
            onBattleEnd: () => {
                this.scene.restart({ debugBattle: true });
            },
        });
    }
}
