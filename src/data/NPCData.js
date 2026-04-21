const NPCData = {
    professor: {
        id: 'professor',
        area: 'lab',
        position: { x: 6, y: 3 },
        spriteSheet: 'ow_prof_oak',
        spriteFrame: 0,
        dialogue: [
            'There are only three Pokemon here.',
            'Ha ha! They are inside the Poke Balls.',
        ],
        dialogueAfterFlags: {
            delivered_oaks_parcel: [
                'Raise your young Pokemon by making it battle.',
                'The Pokedex will help you learn about many kinds of Pokemon.',
            ],
            starter_received: [
                'Raise your young Pokemon by making it battle.',
                'Head north to Viridian City and see what lies beyond.',
            ],
        },
    },
    rival_lab: {
        id: 'rival_lab',
        area: 'lab',
        position: { x: 5, y: 4 },
        spriteSheet: 'ow_blue',
        spriteFrame: 0,
        dialogue: [
            "Gramps! I'm fed up with waiting!",
            'Hey! No fair! What about me?',
        ],
        dialogueAfterFlags: {
            rival_battle_complete: [
                "Smell you later! I'm heading out to train my Pokemon.",
            ],
            starter_received: [
                "My Pokemon looks a lot stronger.",
                "Smell you later!",
            ],
        },
    },
    save_sign: {
        id: 'save_sign',
        area: 'town',
        position: { x: 4, y: 14 },
        objectImage: 'ow_wooden_sign',
        color: GameConfig.COLORS.DOOR,
        dialogue: [
            'Trainer Tips:',
            'Progress autosaves after battles, area changes, and important conversations.',
        ],
    },
    viridian_guide: {
        id: 'viridian_guide',
        area: 'viridian',
        position: { x: 21, y: 11 },
        spriteSheet: 'ow_old_man_1',
        spriteFrame: 0,
        dialogue: [
            "Well, now, I've had my coffee, and that's what I need to get going!",
            'At first, focus on weakening Pokemon before trying to catch them.',
        ],
        dialogueAfterFlags: {
            delivered_oaks_parcel: [
                "Well, now, I've had my coffee, and that's what I need to get going!",
                'At first, focus on weakening Pokemon before trying to catch them.',
            ],
            starter_received: [
                'The road ahead is private property for now.',
                'If you are heading back to Pallet Town, stop by the Poké Mart first.',
            ],
        },
    },
    mart_clerk: {
        id: 'mart_clerk',
        area: 'mart',
        position: { x: 2, y: 3 },
        spriteSheet: 'ow_clerk',
        spriteFrame: 0,
        dialogue: [
            'Hi there! May I help you?',
        ],
        dialogueAfterFlags: {
            delivered_oaks_parcel: [
                'Thanks for helping with that delivery.',
            ],
            got_oaks_parcel: [
                "Please deliver Oak's Parcel to Professor Oak in Pallet Town.",
            ],
        },
    },
    mart_youngster: {
        id: 'mart_youngster',
        area: 'mart',
        position: { x: 6, y: 2 },
        spriteSheet: 'ow_youngster',
        spriteFrame: 0,
        dialogue: [
            "I've got to buy some POTIONS.",
            'You never know when your POKéMON will need quick healing.',
        ],
    },
    mart_woman: {
        id: 'mart_woman',
        area: 'mart',
        position: { x: 9, y: 5 },
        spriteSheet: 'ow_woman_1',
        spriteFrame: 0,
        dialogue: [
            "This shop does good business in ANTIDOTES, I've heard.",
        ],
    },
    viridian_nurse: {
        id: 'viridian_nurse',
        area: 'pokemon_center',
        position: { x: 7, y: 2 },
        spriteSheet: 'ow_nurse',
        spriteFrame: 0,
        dialogue: [
            'Welcome to our POKéMON CENTER.',
            'We heal your POKéMON back to perfect health.',
        ],
        objectiveAfter: 'Head north through Route 2 when you are ready.',
    },
    pokemon_center_gentleman: {
        id: 'pokemon_center_gentleman',
        area: 'pokemon_center',
        position: { x: 12, y: 5 },
        spriteSheet: 'ow_gentleman',
        spriteFrame: 0,
        dialogue: [
            'Please feel free to use that PC in the corner.',
            "The receptionist told me so. It's so kind of her!",
        ],
    },
    pokemon_center_boy: {
        id: 'pokemon_center_boy',
        area: 'pokemon_center',
        position: { x: 4, y: 7 },
        spriteSheet: 'ow_boy',
        spriteFrame: 0,
        dialogue: [
            "There's a POKéMON CENTER in every town ahead.",
            "They charge no money, so don't be shy about healing POKéMON.",
        ],
    },
    pokemon_center_youngster: {
        id: 'pokemon_center_youngster',
        area: 'pokemon_center',
        position: { x: 2, y: 3 },
        spriteSheet: 'ow_youngster',
        spriteFrame: 0,
        dialogue: [
            'POKéMON CENTERS heal your tired, hurt, or fainted POKéMON.',
            'They make all POKéMON completely healthy.',
        ],
    },
    route1_mart_clerk: {
        id: 'route1_mart_clerk',
        area: 'route',
        position: { x: 6, y: 28 },
        spriteSheet: 'ow_clerk',
        spriteFrame: 0,
        dialogue: [
            'Hi! I work at a POKéMON MART.',
        ],
    },
    route1_boy: {
        id: 'route1_boy',
        area: 'route',
        position: { x: 19, y: 16 },
        spriteSheet: 'ow_boy',
        spriteFrame: 0,
        dialogue: [
            'See those ledges along the road?',
            "It's a bit scary, but you can jump from them.",
            'You can get back to PALLET TOWN quicker that way.',
        ],
    },
    pewter_guide: {
        id: 'pewter_guide',
        area: 'pewter',
        position: { x: 42, y: 20 },
        spriteSheet: 'ow_boy',
        spriteFrame: 0,
        dialogue: [
            "You're a TRAINER, right?",
            "BROCK's looking for new challengers. Follow me!",
        ],
        dialogueAfterFlags: {
            defeated_gym_leader: [
                'Nice! You beat Brock.',
                'The road east is open when you are ready.',
            ],
            defeated_trainer_gym: [
                'If you have the right stuff, go take on BROCK!',
            ],
            pokedex_received: [
                'If you have the right stuff, go take on BROCK!',
            ],
        },
    },
    gym_guide: {
        id: 'gym_guide',
        area: 'gym',
        position: { x: 7, y: 12 },
        spriteSheet: 'ow_gym_guy',
        spriteFrame: 0,
        dialogue: [
            'Hiya! Do you want to dream big?',
            "I'm no TRAINER, but I can advise you on how to win.",
            'Rock-type Pokémon fear Grass- and Water-type moves.',
        ],
        dialogueAfterFlags: {
            defeated_gym_leader: [
                "Just as I thought! You're Pokémon champ material!",
            ],
            defeated_trainer_gym: [
                'Brock is up ahead. Keep your strongest matchups ready.',
            ],
        },
    },
    pewter_lass: {
        id: 'pewter_lass',
        area: 'pewter',
        position: { x: 6, y: 15 },
        spriteSheet: 'ow_lass',
        spriteFrame: 0,
        dialogue: [
            'CLEFAIRY came from the moon. That is what the rumor is.',
        ],
    },
    pewter_bug_catcher: {
        id: 'pewter_bug_catcher',
        area: 'pewter',
        position: { x: 33, y: 27 },
        spriteSheet: 'ow_bug_catcher',
        spriteFrame: 0,
        dialogue: [
            "I'm spraying REPEL to keep wild Pokémon out of my garden!",
        ],
    },
    pewter_scientist: {
        id: 'pewter_scientist',
        area: 'pewter',
        position: { x: 46, y: 20 },
        spriteSheet: 'ow_scientist',
        spriteFrame: 0,
        dialogueAfterFlags: {
            defeated_gym_leader: [
                "Your mother asked me to give you these, but you've already proven you can move fast.",
            ],
        },
        dialogue: [
            "I'll catch up with you a little later.",
        ],
    },
};

Object.freeze(NPCData);
