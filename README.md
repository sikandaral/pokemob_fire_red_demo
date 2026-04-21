# FireRed Mini Browser Demo

A compact Pokemon FireRed-inspired browser demo built with Phaser 3 and plain JavaScript. The current slice follows Red from Pallet Town through Route 1, Viridian City, Route 2, Viridian Forest, Pewter City, and Brock's Gym.

The demo is intentionally short: beat Brock, see the ending, then return to the start menu with `New Game` as the only option.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local server:
   ```bash
   npm start
   ```
3. Open the local URL shown by `http-server`, usually `http://127.0.0.1:8081/`.

## Controls

- `Arrow Keys` or `WASD`: move Red and navigate menus.
- `X` or `Enter`: confirm choices, interact with NPCs/signs/doors, advance completed dialogue, choose battle commands, and continue battle text.
- `Z`: skip the current dialogue typing animation.
- `Z`: go back from battle submenus such as Fight, Bag, and Pokemon.
- `P`: manually save progress.
- `F`: toggle browser fullscreen, or use the on-screen fullscreen button.

## Battle Controls

- Choose from `Fight`, `Bag`, `Pokemon`, or `Run` at the start of a turn.
- Use `Fight` to select a move.
- Use `Bag` to throw Poke Balls or use Potions when available.
- Use `Pokemon` to switch to another healthy party member.
- `Run` works in wild battles, but trainer battles cannot be escaped.
- If a Pokemon faints and you have another healthy Pokemon, the party menu opens so you can choose the next one.

## Game Flow

1. Start a `New Game` from the title menu.
2. Watch Professor Oak's intro and begin in Pallet Town.
3. Enter Oak's Lab, choose Bulbasaur, Charmander, or Squirtle, then battle Blue.
4. Travel north through Route 1 toward Viridian City.
5. Visit the Viridian Poke Mart to receive Oak's Parcel.
6. Return to Professor Oak in Pallet Town to deliver the parcel and receive the Pokedex.
7. Go back through Viridian City after the old man teaches catching.
8. Continue through Route 2 and Viridian Forest, where wild Pokemon only appear in tall grass.
9. Reach Pewter City, heal/shop if needed, then challenge Pewter Gym.
10. Defeat Brock to receive the Boulderbadge and trigger the ending.
11. Press `X`, `Enter`, or `Z` on the ending screen to return to the title menu with only `New Game`.

## Current Features

- FireRed-style generated map backgrounds for Pallet Town, Route 1, Viridian City, Route 2, Viridian Forest, Pewter City, interiors, and the gym.
- Tile collision for buildings, trees, fences, tables, signs, water, and route barriers.
- One-way ledge jumps where appropriate; fence tiles block movement instead of acting like ledges.
- NPC dialogue, signs, story flags, and objective updates.
- Starter selection and rival battle in Oak's Lab.
- Oak's Parcel and Pokedex progression.
- Viridian old man catching tutorial.
- Wild encounters in grass-only encounter zones.
- Catching Pokemon with Poke Balls.
- Party switching in battle.
- Poke Mart and Pokemon Center interiors with shopping/healing behavior.
- Trainer line-of-sight battles and persistent defeated trainers.
- EXP, level-ups, move learning, and automatic move replacement when more than four moves are learned.
- Loss recovery at the Pokemon Center of the last city visited.
- Autosaves after important events, battles, area transitions, and manual saves.

## Architecture

- `BootScene` loads and normalizes save data before showing the title screen.
- `TitleScene` shows the start menu and handles `Continue` / `New Game`.
- `IntroScene` runs Professor Oak's intro.
- `PreloadScene` loads generated maps, sprites, battle assets, and runtime state.
- `WorldScene` handles exploration, collisions, dialogue, NPCs, transitions, events, wild encounters, and saves.
- `BattleScene` runs wild and trainer battles.

## Data And Systems

- `src/data/MapData.js` defines map collision, transitions, signs, and special movement rules.
- `src/data/NPCData.js` defines NPC dialogue and story interactions.
- `src/data/TrainerData.js` defines trainer teams, rewards, and battle gating.
- `src/data/WildEncounterData.js` defines grass encounter tables and encounter zones.
- `src/data/PokemonData.js` and `src/data/MoveData.js` define Pokemon, stats, learnsets, and moves.
- `SaveManager` stores progress in `localStorage` under `firered_demo_save`.
- `EventFlags` tracks story and trainer progress.
- `DialogueManager` controls dialogue flow and callbacks.
- `BattleManager` resolves damage, accuracy, AI move choice, EXP, catching, and battle outcomes.

## Notes

- The demo is a fan-made browser prototype inspired by FireRed, not a full remake.
- Progress is stored locally in the browser. Clearing `firered_demo_save` from local storage resets the save.
- After beating Brock, the ending clears the completed save and returns to the start menu for a fresh run.
