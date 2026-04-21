const BattleAssetManifest = {
    trainers: {
        player: {
            back: {
                key: 'battle-trainer-red-back',
                path: 'graphics/trainers/back_pics/red_back_pic.png',
                frameWidth: 64,
                frameHeight: 64,
                frame: 0,
            },
            playerScale: 1.35,
            playerOffset: { x: -4, y: -8 },
        },
        rival_lab_battle: {
            front: {
                key: 'battle-trainer-rival-early',
                path: 'graphics/trainers/front_pics/rival_early_front_pic.png',
            },
            enemyScale: 1.45,
            enemyOffset: { x: 6, y: -10 },
        },
        trainer_route1: {
            front: {
                key: 'battle-trainer-youngster',
                path: 'graphics/trainers/front_pics/youngster_front_pic.png',
            },
            enemyScale: 1.35,
            enemyOffset: { x: 0, y: -6 },
        },
        trainer_gym: {
            front: {
                key: 'battle-trainer-camper',
                path: 'graphics/trainers/front_pics/camper_front_pic.png',
            },
            enemyScale: 1.35,
            enemyOffset: { x: 0, y: -8 },
        },
        forest_rick: {
            front: {
                key: 'battle-trainer-bug-catcher-rick',
                path: 'graphics/trainers/front_pics/bug_catcher_front_pic.png',
            },
            enemyScale: 1.35,
            enemyOffset: { x: 0, y: -8 },
        },
        forest_doug: {
            front: {
                key: 'battle-trainer-bug-catcher-doug',
                path: 'graphics/trainers/front_pics/bug_catcher_front_pic.png',
            },
            enemyScale: 1.35,
            enemyOffset: { x: 0, y: -8 },
        },
        forest_sammy: {
            front: {
                key: 'battle-trainer-bug-catcher-sammy',
                path: 'graphics/trainers/front_pics/bug_catcher_front_pic.png',
            },
            enemyScale: 1.35,
            enemyOffset: { x: 0, y: -8 },
        },
        forest_anthony: {
            front: {
                key: 'battle-trainer-bug-catcher-anthony',
                path: 'graphics/trainers/front_pics/bug_catcher_front_pic.png',
            },
            enemyScale: 1.35,
            enemyOffset: { x: 0, y: -8 },
        },
        forest_charlie: {
            front: {
                key: 'battle-trainer-bug-catcher-charlie',
                path: 'graphics/trainers/front_pics/bug_catcher_front_pic.png',
            },
            enemyScale: 1.35,
            enemyOffset: { x: 0, y: -8 },
        },
        gym_leader: {
            front: {
                key: 'battle-trainer-brock',
                path: 'graphics/trainers/front_pics/leader_brock_front_pic.png',
            },
            enemyScale: 1.45,
            enemyOffset: { x: 4, y: -8 },
        },
    },

    pokemon: {
        Bulbasaur: {
            front: {
                key: 'battle-front-bulbasaur',
                path: 'graphics/pokemon/bulbasaur/front.png',
            },
            back: {
                key: 'battle-back-bulbasaur',
                path: 'graphics/pokemon/bulbasaur/back.png',
            },
            enemyScale: 1.2,
            playerScale: 1.42,
            playerOffset: { x: 2, y: -4 },
        },
        Charmander: {
            front: {
                key: 'battle-front-charmander',
                path: 'graphics/pokemon/charmander/front.png',
            },
            back: {
                key: 'battle-back-charmander',
                path: 'graphics/pokemon/charmander/back.png',
            },
            enemyScale: 1.2,
            playerScale: 1.38,
            playerOffset: { x: 2, y: -4 },
        },
        Squirtle: {
            front: {
                key: 'battle-front-squirtle',
                path: 'graphics/pokemon/squirtle/front.png',
            },
            back: {
                key: 'battle-back-squirtle',
                path: 'graphics/pokemon/squirtle/back.png',
            },
            enemyScale: 1.18,
            playerScale: 1.34,
            playerOffset: { x: 2, y: -4 },
        },
        Pidgey: {
            front: {
                key: 'battle-front-pidgey',
                path: 'graphics/pokemon/pidgey/front.png',
            },
            back: {
                key: 'battle-back-pidgey',
                path: 'graphics/pokemon/pidgey/back.png',
            },
            enemyScale: 1.08,
            playerScale: 1.2,
            enemyOffset: { x: 0, y: -8 },
            playerOffset: { x: 2, y: -2 },
        },
        Rattata: {
            front: {
                key: 'battle-front-rattata',
                path: 'graphics/pokemon/rattata/front.png',
            },
            back: {
                key: 'battle-back-rattata',
                path: 'graphics/pokemon/rattata/back.png',
            },
            enemyScale: 1.1,
            playerScale: 1.22,
            enemyOffset: { x: 0, y: -4 },
            playerOffset: { x: 2, y: -2 },
        },
        Pidgeotto: {
            front: {
                key: 'battle-front-pidgeotto',
                path: 'assets/battle/front/pidgeotto.png',
            },
            back: null,
            enemyScale: 1.24,
            enemyOffset: { x: 0, y: -10 },
        },
        Geodude: {
            front: {
                key: 'battle-front-geodude',
                path: 'graphics/pokemon/geodude/front.png',
            },
            back: {
                key: 'battle-back-geodude',
                path: 'graphics/pokemon/geodude/back.png',
            },
            enemyScale: 1.16,
            enemyOffset: { x: 0, y: -2 },
        },
        Onix: {
            front: {
                key: 'battle-front-onix',
                path: 'graphics/pokemon/onix/front.png',
            },
            back: {
                key: 'battle-back-onix',
                path: 'graphics/pokemon/onix/back.png',
            },
            enemyScale: 1.28,
            enemyOffset: { x: -8, y: -6 },
        },
        Caterpie: {
            front: {
                key: 'battle-front-caterpie',
                path: 'graphics/pokemon/caterpie/front.png',
            },
            back: {
                key: 'battle-back-caterpie',
                path: 'graphics/pokemon/caterpie/back.png',
            },
            enemyScale: 1.02,
            playerScale: 1.15,
            enemyOffset: { x: 0, y: -2 },
            playerOffset: { x: 2, y: -2 },
        },
        Metapod: {
            front: {
                key: 'battle-front-metapod',
                path: 'graphics/pokemon/metapod/front.png',
            },
            back: {
                key: 'battle-back-metapod',
                path: 'graphics/pokemon/metapod/back.png',
            },
            enemyScale: 1.04,
            playerScale: 1.16,
            enemyOffset: { x: 0, y: -2 },
            playerOffset: { x: 2, y: -2 },
        },
        Weedle: {
            front: {
                key: 'battle-front-weedle',
                path: 'graphics/pokemon/weedle/front.png',
            },
            back: {
                key: 'battle-back-weedle',
                path: 'graphics/pokemon/weedle/back.png',
            },
            enemyScale: 1.02,
            playerScale: 1.15,
            enemyOffset: { x: 0, y: -2 },
            playerOffset: { x: 2, y: -2 },
        },
        Kakuna: {
            front: {
                key: 'battle-front-kakuna',
                path: 'graphics/pokemon/kakuna/front.png',
            },
            back: {
                key: 'battle-back-kakuna',
                path: 'graphics/pokemon/kakuna/back.png',
            },
            enemyScale: 1.04,
            playerScale: 1.16,
            enemyOffset: { x: 0, y: -2 },
            playerOffset: { x: 2, y: -2 },
        },
        Pikachu: {
            front: {
                key: 'battle-front-pikachu',
                path: 'graphics/pokemon/pikachu/front.png',
            },
            back: {
                key: 'battle-back-pikachu',
                path: 'graphics/pokemon/pikachu/back.png',
            },
            enemyScale: 1.14,
            playerScale: 1.28,
            enemyOffset: { x: 0, y: -4 },
            playerOffset: { x: 2, y: -3 },
        },
        Sandshrew: {
            front: {
                key: 'battle-front-sandshrew',
                path: 'graphics/pokemon/sandshrew/front.png',
            },
            back: {
                key: 'battle-back-sandshrew',
                path: 'graphics/pokemon/sandshrew/back.png',
            },
            enemyScale: 1.12,
            playerScale: 1.24,
            enemyOffset: { x: 0, y: -4 },
            playerOffset: { x: 2, y: -2 },
        },
    },

    forSpecies(species) {
        return this.pokemon[species] || null;
    },

    forTrainer(trainerId) {
        return this.trainers[trainerId] || null;
    },

    all() {
        return [
            ...Object.values(this.pokemon),
            ...Object.values(this.trainers),
        ];
    },
};

Object.freeze(BattleAssetManifest);
