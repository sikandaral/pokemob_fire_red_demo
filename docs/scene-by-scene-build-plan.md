# Scene-by-Scene Build Plan

This is the order we should build and verify the game logic so we do not skip
ahead and then backfill core systems later.

Current scene order in the game config:

- `BootScene`
- `TitleScene`
- `PreloadScene`
- `WorldScene`
- `BattleScene`

Source reference:

- [src/main.js](/Users/sikandarali/Downloads/Vibe%20coding%20project/src/main.js)

## 1. BootScene

File:

- [src/scenes/BootScene.js](/Users/sikandarali/Downloads/Vibe%20coding%20project/src/scenes/BootScene.js)

Responsibility:

- read URL debug flags
- load save data
- route to the correct first scene

Current flow:

- if `?debugBattle=1` -> start `PreloadScene` in debug mode
- else -> load save and start `TitleScene`

Build gate before moving on:

- normal launch opens the title screen
- debug battle launch bypasses title and reaches preload
- save presence is correctly detected

What not to build here:

- no gameplay logic
- no rendering beyond routing
- no state mutation outside save/bootstrap

## 2. TitleScene

File:

- [src/scenes/TitleScene.js](/Users/sikandarali/Downloads/Vibe%20coding%20project/src/scenes/TitleScene.js)

Responsibility:

- present `Continue` / `New Game`
- show save location summary
- pass clean scene data into preload

Current flow:

- reads `hasSave` and `saveData`
- offers `Continue` if save exists
- clears save on `New Game`
- starts `PreloadScene`

Build gate before moving on:

- `New Game` always starts with base state
- `Continue` restores the normalized save
- keyboard navigation works
- selection state is obvious

What to build here later only if needed:

- title polish
- intro animation
- brand screen

## 3. PreloadScene

File:

- [src/scenes/PreloadScene.js](/Users/sikandarali/Downloads/Vibe%20coding%20project/src/scenes/PreloadScene.js)

Responsibility:

- load all required assets
- normalize incoming save state
- reconstruct runtime objects like `Party`
- start the correct gameplay scene

Current flow:

- loads battle sprites and world tiles
- loads overworld spritesheets
- reconstructs `window.gameState`
- initializes `EventFlags`
- saves normalized state immediately
- starts `WorldScene`

Build gate before moving on:

- no missing texture errors
- save normalization is stable
- a new game creates Bulbasaur correctly
- a loaded game restores party and flags correctly

What not to build here:

- no map logic
- no battle resolution
- no scene-specific rules

## 4. WorldScene

File:

- [src/scenes/WorldScene.js](/Users/sikandarali/Downloads/Vibe%20coding%20project/src/scenes/WorldScene.js)

Responsibility:

- render the current map
- create player, NPCs, trainers, HUD, dialogue hooks
- movement, collision, transitions, trainer spotting
- launch battles
- apply battle outcomes back into overworld progression

This is the largest scene and should be built in sub-stages.

### 4A. World foundation

Build:

- map draw
- player spawn
- camera
- movement
- collision
- area transitions

Gate:

- player can walk cleanly
- blocked tiles are really blocked
- map exits work
- saved position restores correctly

### 4B. Overworld interaction

Build:

- NPC spawn
- trainer spawn
- interaction prompt
- dialogue box flow

Gate:

- adjacent NPC interaction works every time
- dialogue advances and exits cleanly
- event flags apply after dialogue

### 4C. Trainer logic

Build:

- line-of-sight spotting
- trainer approach path
- battle launch handoff

Gate:

- trainer sees player correctly
- trainer path does not softlock
- battle starts with the right trainer data

### 4D. Post-battle overworld state

Build:

- defeated trainer persistence
- objective updates
- gym unlock flow
- completion overlay

Gate:

- defeated trainers stay gone
- save/load preserves progression
- loss returns player safely to town

## 5. BattleScene

File:

- [src/scenes/BattleScene.js](/Users/sikandarali/Downloads/Vibe%20coding%20project/src/scenes/BattleScene.js)

Responsibility:

- render battle state through `BattleUI`
- accept move input
- resolve turns through `BattleManager`
- return a clean result payload to `WorldScene`

Current state machine:

- `intro`
- `select_move`
- `turn_complete`
- `battle_end`

Build gate before considering the loop done:

- intro advances correctly
- move selection works
- turn resolution updates HP
- EXP and level-up apply on win
- loss returns a clean fail result
- battle end hands back to `WorldScene` correctly

## 6. Systems Validation Order

These should be checked alongside the scenes, not after all scenes are “done”.

### SaveManager

File:

- [src/systems/SaveManager.js](/Users/sikandarali/Downloads/Vibe%20coding%20project/src/systems/SaveManager.js)

Check after:

- TitleScene
- PreloadScene
- every major WorldScene progression change

Must guarantee:

- new save
- load save
- migration safety
- safe fallback position

### DialogueManager

Check after:

- WorldScene interaction is first working

Must guarantee:

- no softlock
- completion callbacks run once
- event flags apply once

### BattleManager

Check after:

- BattleScene first becomes playable

Must guarantee:

- deterministic turn flow
- valid enemy move selection
- EXP reward
- end-state detection

## 7. Recommended Working Loop

For every scene, use the same workflow:

1. build the minimum logic for that scene
2. run only that scene’s intended path
3. fix all blockers in that scene
4. verify save/state handoff into the next scene
5. only then move forward

## 8. Immediate Next Sequence

Given the current codebase, the clean order to continue from here is:

1. finish `WorldScene` town translation and verify the opening town experience
2. verify `WorldScene -> BattleScene` handoff on the route trainer
3. verify `BattleScene -> WorldScene` return on win and loss
4. verify gym unlock and leader battle
5. do a full save/load pass across the whole loop

## 9. Definition Of Done For The Full Loop

- Boot routes correctly
- Title loads or starts a game correctly
- Preload restores all runtime state cleanly
- World scene supports town -> route -> gym progression
- Battle scene resolves both trainer and leader battles correctly
- Save/load survives the whole loop
- The demo can be played from first launch to completion without manual fixes
