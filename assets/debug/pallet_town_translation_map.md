# Pallet Town Translation Map

This note compares the real `pret/pokefirered` Pallet Town map data to the
tile-built town in this project so we can decide where a direct translation is
possible.

## Core Rule

FireRed does **not** store Pallet Town as raw PNG placement. It stores a
`24 x 20` grid of 16-bit map blocks in:

- `data/layouts/PalletTown/map.bin`

For `LAYOUT_PALLET_TOWN`, the layout says:

- primary tileset: `gTileset_General`
- secondary tileset: `gTileset_PalletTown`

The visible metatile id is:

- `block & 0x03FF`

That means Pallet Town uses two metatile namespaces at once:

- primary general metatiles: plain ids like `0x01C`, `0x123`
- secondary Pallet Town metatiles: ids offset by `0x280`

So the direct conversion rule is:

- if the masked id is `< 0x280`, look it up in `debug_primary_metatiles.png`
- if the masked id is `>= 0x280`, subtract `0x280` and look it up in `debug_pallet_secondary_local_compare.png`

Examples:

- `0x281 -> local 0x01`
- `0x29A -> local 0x1A`
- `0x2D8 -> local 0x58`

## Real Town Size vs Our Town

- FireRed Pallet Town layout: `24 x 20`
- Our current town layout: `20 x 15`

Conclusion:

- the **metatile method translates directly**
- the **full map grid does not translate 1:1** into our current town because our
  playable town is smaller and compressed

## Real Structure Slices

These are the relevant masked metatile ids from the real FireRed town.

### Left House

Real map slice:

- rows `03-06`, cols `05-09` for the core house body

Combined ids:

```text
03: 281 282 282 282 283
04: 289 28A 28A 28A 28B
05: 291 293 292 292 294
06: 298 299 29A 29B 29C
```

Converted Pallet secondary local ids:

```text
03: 01 02 02 02 03
04: 09 0A 0A 0A 0B
05: 11 13 12 12 14
06: 18 19 1A 1B 1C
```

This means the **real house core** is:

```text
row 1: 0x01 0x02 0x02 0x02 0x03
row 2: 0x09 0x0A 0x0A 0x0A 0x0B
row 3: 0x11 0x13 0x12 0x12 0x14
row 4: 0x18 0x19 0x1A 0x1B 0x1C
```

### Our Current House

Current `WorldScene` house layout:

```text
row 1: roof_l roof_m roof_m roof_m roof_r
row 2: roof_edge_l roof_edge_m roof_edge_m roof_edge_m_alt roof_edge_r
row 3: door 19 1A 1B 1C
row 4: 20 23 22 21 24
```

Direct translation status:

- **No**, not yet

Why:

- our current house row order does **not** match the real map
- the real FireRed house uses the `0x01-0x03`, `0x09-0x0B`, `0x11-0x14`,
  `0x18-0x1C` progression
- our current build uses a custom/fused interpretation instead

### Civic Building

Real map slice:

- rows `09-13`, cols `13-19`

Combined ids:

```text
09: 2A8 2A9 2A9 2A9 2A9 2BD 2B5
10: 2B0 2B1 2B1 2B1 2B1 2B3 2B4
11: 2B8 2B9 2B9 2B9 2B9 2BB 2BC
12: 2C0 2C1 2D0 2C2 2C3 2C4 2C5
13: 2C8 2C9 2D8 2AC 2CB 2CC 2CD
```

Converted Pallet secondary local ids:

```text
09: 28 29 29 29 29 3D 35
10: 30 31 31 31 31 33 34
11: 38 39 39 39 39 3B 3C
12: 40 41 50 42 43 44 45
13: 48 49 58 2C 4B 4C 4D
```

### Our Current Civic Building

Current `WorldScene` civic layout:

```text
row 1: 28 29 29 29 29 3D 35
row 2: 30 31 31 31 31 33 34
row 3: 38 39 39 39 39 3B 3C
row 4: 40 41 50 42 43 44 45
row 5: 48 49 58 2C 4B 4C 4D
```

Direct translation status:

- **Yes**

Why:

- this building is already being translated almost exactly from the real map
- the only adaptation is that our runtime uses extracted tile keys instead of
  FireRed’s combined metatile ids

### Mailbox

Left mailbox area in the real map:

- row `05`, col `04`: `0x011`
- row `06`, col `04`: `0x2A5 -> local 0x25`
- row `07`, col `04`: `0x2AD -> local 0x2D`

Direct translation status:

- **Partially**

Why:

- our current mailbox uses `0x25` and `0x2D`
- the real map suggests a **3-tile mailbox stack**: `0x11`, `0x25`, `0x2D`

### Pond

Real pond slice:

- rows `17-19`, cols `07-10`

Combined ids:

```text
17: 2D1 123 123 2D2
18: 12A 12B 12B 12C
19: 12A 12B 12B 12C
```

Converted meaning:

- `0x2D1 -> local 0x51`
- `0x2D2 -> local 0x52`
- `0x123`, `0x12A`, `0x12B`, `0x12C` are primary general water tiles

Direct translation status:

- **Partially**

Why:

- the pond is a hybrid of primary water tiles plus secondary corner caps
- this can be translated directly, but our current pond shape still needs to
  follow the real `3 x 3` FireRed arrangement more closely

## What Translates Directly

These pieces can be copied from the real map method almost verbatim:

- civic building
- many fence/sign props once their exact ids are confirmed
- pond, if we use the real mixed primary/secondary block pattern
- the two top houses, **but only if we rebuild them from the real row order**

## What Does Not Translate 1:1

- the whole town grid, because our map is `20 x 15` instead of `24 x 20`
- the exact spacing between all features
- the outer border padding and path thickness

## Practical Translation Strategy

1. Keep FireRed’s metatile method.
2. Translate combined ids into our extracted tile keys:
   - primary id `0xXYZ` -> `debug_primary_metatiles`
   - secondary id `0x2AB` -> local `0x2B`
3. Rebuild each major structure as its own local layout:
   - left house
   - right house
   - civic building
   - mailbox
   - fence/sign rows
   - pond
4. Place those translated structures into our smaller town grid by anchor point.

## Bottom Line

Yes, we can directly translate **the repo’s method** to ours.

But the direct translation works at the **structure/metatile level**, not at the
full-map-grid level.

The strongest current translation is the civic building.
The biggest remaining divergence is the house layout, which still needs to be
rebuilt from the real FireRed metatile rows shown above.
