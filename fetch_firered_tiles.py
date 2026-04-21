"""
fetch_firered_tiles.py  v4 — correct GBA transparency + verified metatile IDs

GBA 4bpp rule: color index 0 in every 16-color palette = fully transparent.
Metatile IDs confirmed from include/constants/metatile_labels.h in pret/pokefirered.

Run: python3 fetch_firered_tiles.py
Re-run freely — downloads cached in assets/tiles/cache/.
"""
import os, struct, urllib.request
from PIL import Image, ImageDraw

CACHE = "assets/tiles/cache"
OUT   = "assets/tiles/extracted"
DBG   = "assets/tiles"
RAW   = "https://raw.githubusercontent.com/pret/pokefirered/master"
T     = 8    # GBA tile size
MT    = 16   # metatile size (2×2 tiles)
SECONDARY_OFFSET = 0x280  # metatile IDs >= this come from secondary tileset

# GBA VRAM tile offset where the secondary tileset starts.
# = (primary tiles.png width // 8) * (primary tiles.png height // 8)
# Primary is 128×320 = 640 tiles, so secondary starts at GBA tile index 640.
SEC_GBA_TILE_OFFSET = 640

os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT,   exist_ok=True)

# ── Download helpers ──────────────────────────────────────────────────────────

def fetch(url, dest):
    if not os.path.exists(dest):
        print(f"  ↓ {url.split('master/')[-1]}")
        urllib.request.urlretrieve(url, dest)
    return dest

def parse_pal(path):
    """JASC-PAL → list of 16 (R,G,B) tuples."""
    with open(path) as f:
        lines = [l.strip() for l in f if l.strip()]
    colors = []
    for line in lines[3:]:
        parts = line.split()
        if len(parts) >= 3:
            colors.append((int(parts[0]), int(parts[1]), int(parts[2])))
    while len(colors) < 16:
        colors.append((0, 0, 0))
    return colors[:16]

def parse_metatiles(path):
    """metatiles.bin → dict {idx: list of 8 attr dicts (bottom 4 + top 4 tiles)}"""
    data = open(path, 'rb').read()
    mts  = {}
    for i in range(len(data) // 16):
        off = i * 16
        attrs = []
        for j in range(8):
            v = struct.unpack_from('<H', data, off + j * 2)[0]
            attrs.append(dict(
                tile_idx = v & 0x3FF,
                xflip    = bool(v & 0x400),
                yflip    = bool(v & 0x800),
                pal_slot = (v >> 12) & 0xF,
            ))
        mts[i] = attrs
    return mts

# ── Tile rendering ────────────────────────────────────────────────────────────

def get_palette(pal_slot, prim_pals, palt_pals, is_secondary_metatile=False):
    """
    For the extracted FireRed tilesets in this project:
    - primary general metatiles read from the primary palette bank
    - secondary Pallet Town metatiles read from the secondary-local palette bank

    The earlier slot-7 remap worked for some pieces but produced visibly wrong
    colors on Pallet Town building tiles. Visual comparison against the Pallet
    Town reference shows the secondary metatiles line up better when their
    palette slot is treated as a secondary-local index.
    """
    if is_secondary_metatile:
        return palt_pals.get(pal_slot, palt_pals.get(max(0, pal_slot - 7), prim_pals[0]))
    return prim_pals.get(pal_slot, palt_pals.get(pal_slot, prim_pals[0]))

def tile_rgba(indexed_img, tile_idx, pal_colors, transparent_zero=True):
    """
    Extract 8×8 tile from the indexed sheet and apply a 16-colour palette.
    For metatile compositing we treat index 0 as transparent only on the upper
    layer; the lower layer keeps palette color 0 so background fills correctly.
    """
    cols_per_row = indexed_img.width // T
    col = tile_idx % cols_per_row
    row = tile_idx // cols_per_row
    region = indexed_img.crop((col * T, row * T, (col + 1) * T, (row + 1) * T))

    raw = list(region.getdata())
    out = Image.new('RGBA', (T, T))
    pixels = []
    for idx in raw:
        i = idx % 16          # 4-bit palette index
        if transparent_zero and i == 0:
            pixels.append((0, 0, 0, 0))
        else:
            r, g, b = pal_colors[i]
            pixels.append((r, g, b, 255))
    out.putdata(pixels)
    return out

def render_metatile(mt_attrs, prim_img, palt_img, prim_pals, palt_pals, is_secondary_metatile=False):
    """Render a 16×16 metatile from its 8 tile-attribute records (2 layers × 4 tiles)."""
    PRIM_TOTAL = (prim_img.width // T) * (prim_img.height // T)
    PALT_TOTAL = (palt_img.width // T) * (palt_img.height // T)
    SEC_GBA    = SEC_GBA_TILE_OFFSET  # primary has 640 tiles, secondary starts here

    result = Image.new('RGBA', (MT, MT), (0, 0, 0, 0))
    POS = [(0, 0), (T, 0), (0, T), (T, T)]  # TL TR BL BR

    for layer in range(2):
        layer_img = Image.new('RGBA', (MT, MT), (0, 0, 0, 0))
        for i, pos in enumerate(POS):
            attr     = mt_attrs[layer * 4 + i]
            gba_idx  = attr['tile_idx']
            pal      = get_palette(attr['pal_slot'], prim_pals, palt_pals, is_secondary_metatile=is_secondary_metatile)

            if gba_idx >= SEC_GBA:
                sec_idx = gba_idx - SEC_GBA
                if sec_idx >= PALT_TOTAL:
                    continue
                t = tile_rgba(palt_img, sec_idx, pal, transparent_zero=(layer == 1))
            else:
                if gba_idx >= PRIM_TOTAL:
                    continue
                t = tile_rgba(prim_img, gba_idx, pal, transparent_zero=(layer == 1))

            if attr['xflip']:
                t = t.transpose(Image.FLIP_LEFT_RIGHT)
            if attr['yflip']:
                t = t.transpose(Image.FLIP_TOP_BOTTOM)
            layer_img.alpha_composite(t, pos)
        result.alpha_composite(layer_img)

    return result

# ── Debug grid ────────────────────────────────────────────────────────────────

def save_debug_grid(items, title, filename, cols=16, scale=4):
    """Save an annotated debug grid — tiles upscaled by `scale` for readability."""
    cell = MT * scale + 2
    label_h = 14
    n    = len(items)
    rows = (n + cols - 1) // cols
    hdr  = 20
    img  = Image.new('RGBA',
                     (cols * cell + 4, hdr + rows * (cell + label_h) + 4),
                     (24, 24, 24, 255))
    d = ImageDraw.Draw(img)
    d.text((4, 4), title, fill=(255, 220, 60))

    for k, (idx, tile) in enumerate(items):
        c = k % cols
        r = k // cols
        px = c * cell + 2
        py = hdr + r * (cell + label_h) + 2

        # Background checkerboard for transparency visibility
        bg = Image.new('RGBA', (MT * scale, MT * scale), (50, 50, 50, 255))
        for ty in range(MT * scale):
            for tx in range(MT * scale):
                if (tx // (scale * 2) + ty // (scale * 2)) % 2 == 0:
                    bg.putpixel((tx, ty), (70, 70, 70, 255))

        scaled = tile.resize((MT * scale, MT * scale), Image.NEAREST)
        bg.alpha_composite(scaled)
        img.paste(bg, (px, py))
        d.text((px, py + MT * scale + 1), f"0x{idx:03X}", fill=(180, 220, 180))

    img.save(os.path.join(DBG, filename))
    print(f"  ➜ {DBG}/{filename}  ({n} metatiles, {cols} per row)")

# ── Download ──────────────────────────────────────────────────────────────────

print("=== Downloading assets ===")
prim_png = fetch(f"{RAW}/data/tilesets/primary/general/tiles.png",           f"{CACHE}/prim_tiles.png")
palt_png = fetch(f"{RAW}/data/tilesets/secondary/pallet_town/tiles.png",     f"{CACHE}/palt_tiles.png")
prim_bin = fetch(f"{RAW}/data/tilesets/primary/general/metatiles.bin",       f"{CACHE}/prim_meta.bin")
palt_bin = fetch(f"{RAW}/data/tilesets/secondary/pallet_town/metatiles.bin", f"{CACHE}/palt_meta.bin")

prim_pals = {}
for i in range(7):
    p = fetch(f"{RAW}/data/tilesets/primary/general/palettes/{i:02d}.pal",   f"{CACHE}/prim_{i:02d}.pal")
    prim_pals[i] = parse_pal(p)

palt_pals = {}
for i in range(13):
    try:
        p = fetch(f"{RAW}/data/tilesets/secondary/pallet_town/palettes/{i:02d}.pal", f"{CACHE}/palt_{i:02d}.pal")
        palt_pals[i] = parse_pal(p)
    except Exception:
        palt_pals[i] = prim_pals[0]

print()
print("=== Parsing metatiles.bin ===")
prim_mts = parse_metatiles(prim_bin)
palt_mts = parse_metatiles(palt_bin)
print(f"  primary general  : {len(prim_mts)} metatiles")
print(f"  pallet town sec  : {len(palt_mts)} metatiles")

prim_img = Image.open(prim_png)
palt_img = Image.open(palt_png)

# ── Build debug grids ─────────────────────────────────────────────────────────

print("\n=== Building debug grids ===")

# Only render a useful subset of primary (first 256) to keep file manageable
prim_subset = [(i, render_metatile(prim_mts[i], prim_img, palt_img, prim_pals, palt_pals, is_secondary_metatile=False))
               for i in range(min(256, len(prim_mts)))]
save_debug_grid(prim_subset,
                "PRIMARY GENERAL — first 256 metatiles (IDs 0x000-0x0FF)",
                "debug_primary_metatiles.png", cols=16, scale=4)

palt_all = [(i, render_metatile(palt_mts[i], prim_img, palt_img, prim_pals, palt_pals, is_secondary_metatile=True))
            for i in range(len(palt_mts))]
save_debug_grid(palt_all,
                "PALLET TOWN SECONDARY — all metatiles (secondary index, add 0x280 for full ID)",
                "debug_pallet_metatiles.png", cols=16, scale=4)

# ── Named tile extraction ─────────────────────────────────────────────────────
#
#  IDs from include/constants/metatile_labels.h (pret/pokefirered):
#    METATILE_General_Plain_Grass            = 0x00D  → prim_mts[0x00D]
#    METATILE_General_Plain_Mowed            = 0x001  → prim_mts[0x001]
#    METATILE_General_ThinTreeTop_Grass      = 0x00A  → prim_mts[0x00A]
#    METATILE_General_WideTreeTopLeft_Grass  = 0x00B  → prim_mts[0x00B]
#    METATILE_General_WideTreeTopRight_Grass = 0x00C  → prim_mts[0x00C]
#    METATILE_General_CalmWater              = 0x12B  → prim_mts[0x12B]
#
#    House bottom-row piece currently verified by debug_pallet_metatiles:
#    local 0x18 (full 0x298) belongs to the Pallet Town house lower section
#    METATILE_PalletTown_OaksLabDoor         = 0x2AC  → palt_mts[0x2AC - 0x280] = palt_mts[0x2C]
#
#  Secondary indices for house/lab components identified from debug_pallet_metatiles.png:
#  (These are best-guess sequential layout — adjust if debug grid shows otherwise)

##############################################################################
# Metatile IDs confirmed by parsing data/layouts/PalletTown/map.bin
# and include/constants/metatile_labels.h from pret/pokefirered.
#
# PRIMARY metatiles (full ID = index into prim_mts):
#   0x00D = METATILE_General_Plain_Grass (green grass, used on routes)
#   0x01C = top border tree row (even col)
#   0x01D = top border tree row (odd col)
#   0x014-0x017 = side border tiles
#   0x12B = METATILE_General_CalmWater
#   0x12C = water alt
#   0x002-0x004, 0x008-0x009 = decorations seen in Pallet Town map
#   0x011 = mowed/trimmed grass (appears throughout Pallet Town)
#
# SECONDARY metatiles (local index = full_id − 0x280):
#   Confirmed from Pallet Town map.bin:
#   0x16 (0x296) = main walkable Pallet Town ground (green grass)
#   0x01 (0x281) = house roof left
#   0x02 (0x282) = house roof middle
#   0x03 (0x283) = corrected roof-run tile; user review says use this instead of 0x04
#   0x11 (0x291) = house roof edge left
#   0x12 (0x292) = house roof edge middle
#   0x13 (0x293) = duplicate visual reference for the corrected 0x03 roof piece
#   0x14 (0x294) = house roof edge right
#   0x04 (0x284) is not part of the red-roof house run per debug review
#   0x09 (0x289) = house wall left
#   0x0A (0x28A) = house wall middle
#   0x0B (0x28B) = house wall right
#   0x18 (0x298) = Pallet Town house lower-section piece ✓ (use this instead of 0x23)
#   0x07 (0x287) = lab/large building roof middle (from map row 19)
#   0x08 (0x288) = lab roof right
#   0x10 (0x290) = lab roof left
#   0x1E (0x29E) = lab wall (appears extensively in lab area)
#   0x35 (0x2B5) = lab wall middle variant
#   0x36 (0x2B6) = lab wall right edge
#   0x2C (0x2AC) = METATILE_PalletTown_OaksLabDoor ✓
#   0x46 (0x2C6) = lab/building base left
#   0x47 (0x2C7) = lab/building base right
##############################################################################

PRIMARY_MAP = {
    # full primary metatile ID → output filename
    # Confirmed from metatile_labels.h + Pallet Town map.bin + visual inspection
    0x00D: "firered_ground",         # Plain_Grass (green grass tiles, routes)
    0x011: "firered_ground_alt",     # Mowed grass (alt, appears in Pallet Town map)
    0x01C: "firered_tree",           # Border tree even col (confirmed from Pallet Town map)
    0x01D: "firered_tree_alt",       # Border tree odd col
    0x12B: "firered_water",          # CalmWater ✓ (metatile_labels.h)
    0x12C: "firered_water_alt",      # Water adjacent tile
    0x123: "primary_mt_123",         # Pond top fill used in Pallet Town
    0x12A: "primary_mt_12A",         # Pond left edge used in Pallet Town
    0x018: "firered_path",           # Sandy path (palette 5, tan ground)
    0x019: "firered_path_alt",       # Path alternate
    0x004: "flower",                 # Red flowers ✓ (visual inspection)
    0x005: "flower_alt",             # Green bush/shrub ✓
    0x003: "sign",                   # Wooden signboard ✓ (visual inspection)
}

SECONDARY_MAP = {
    # local index (= full_id − 0x280) → output filename
    # House tiles — confirmed from Pallet Town map.bin
    0x01: "firered_house_roof_l",
    0x02: "firered_house_roof_m",
    0x03: "firered_house_roof_r",         # corrected from debug_pallet_metatiles review
    0x11: "firered_house_roof_edge_l",
    0x12: "firered_house_roof_edge_m",
    0x13: "firered_house_roof_edge_m_alt",# duplicate roof reference noted during review
    0x14: "firered_house_roof_edge_r",
    0x09: "firered_house_wall_l",
    0x0A: "firered_house_wall_m",
    0x0B: "firered_house_wall_r",
    0x26: "firered_house_base_l",    # 0x2A6 ✓ confirmed in map
    0x18: "firered_house_door",      # corrected from debug_pallet_metatiles review
    0x27: "firered_house_base_r",    # 0x2A7 ✓ confirmed in map
    # Lab / Oak's Lab — confirmed from Pallet Town map rows 19-21
    0x10: "lab_roof_l",
    0x07: "lab_roof_m",
    0x08: "lab_roof_r",
    0x1E: "lab_wall_l",
    0x35: "lab_wall_m",
    0x36: "lab_wall_r",
    0x2C: "lab_door",                # METATILE_PalletTown_OaksLabDoor ✓
    0x46: "lab_base_l",
    0x47: "lab_base_r",
    # Fence/log posts — confirmed from Pallet Town map (0x2D1, 0x2D2 appear in fence row)
    0x51: "fence",                   # 0x2D1 — fence with sign post (left)
    0x52: "fence_alt",               # 0x2D2 — fence alternate (right)
    # Main Pallet Town walkable ground
    0x16: "firered_ground_sec",      # 0x296 — actual Pallet Town ground tile
}

# Extra review aliases so corrected debug findings are preserved as standalone PNGs
# without breaking the filenames the runtime already expects.
SECONDARY_ALIASES = {
    0x04: ["pallet_mt_04"],
    0x07: ["pallet_mt_07"],
    0x13: ["firered_house_roof_r_ref"],   # user noted 0x03 should visually duplicate 0x13
    0x18: ["firered_house_base_mid"],     # user noted this is the correct lower house piece
    0x19: ["pallet_mt_19"],
    0x1A: ["pallet_mt_1A"],
    0x1B: ["pallet_mt_1B"],
    0x1C: ["pallet_mt_1C"],
    0x20: ["pallet_mt_20"],
    0x21: ["pallet_mt_21"],
    0x22: ["pallet_mt_22"],
    0x23: ["pallet_mt_23"],
    0x24: ["pallet_mt_24"],
    0x25: ["pallet_mt_25"],
    0x28: ["pallet_mt_28"],
    0x29: ["pallet_mt_29"],
    0x30: ["pallet_mt_30"],
    0x31: ["pallet_mt_31"],
    0x2D: ["pallet_mt_2D"],
    0x33: ["pallet_mt_33"],
    0x34: ["pallet_mt_34"],
    0x38: ["pallet_mt_38"],
    0x39: ["pallet_mt_39"],
    0x3A: ["pallet_mt_3A"],
    0x3B: ["pallet_mt_3B"],
    0x3C: ["pallet_mt_3C"],
    0x3D: ["pallet_mt_3D"],
    0x40: ["pallet_mt_40"],
    0x41: ["pallet_mt_41"],
    0x42: ["pallet_mt_42"],
    0x43: ["pallet_mt_43"],
    0x44: ["pallet_mt_44"],
    0x45: ["pallet_mt_45"],
    0x48: ["pallet_mt_48"],
    0x49: ["pallet_mt_49"],
    0x4A: ["pallet_mt_4A"],
    0x4B: ["pallet_mt_4B"],
    0x4C: ["pallet_mt_4C"],
    0x4D: ["pallet_mt_4D"],
    0x50: ["pallet_mt_50"],
    0x51: ["pallet_mt_51"],
    0x52: ["pallet_mt_52"],
    0x58: ["pallet_mt_58"],
}

print("\n=== Extracting named game tiles ===")
saved = 0

for full_id, name in PRIMARY_MAP.items():
    local = full_id  # primary IDs are direct indices
    if local not in prim_mts:
        print(f"  MISS primary 0x{full_id:03X} → {name}")
        continue
    img = render_metatile(prim_mts[local], prim_img, palt_img, prim_pals, palt_pals, is_secondary_metatile=False)
    img.save(os.path.join(OUT, f"{name}.png"))
    print(f"  ✓ {name}.png  (primary 0x{full_id:03X})")
    saved += 1

for local_id, name in SECONDARY_MAP.items():
    if local_id not in palt_mts:
        print(f"  MISS secondary 0x{local_id:02X} (full 0x{local_id+0x280:03X}) → {name}")
        continue
    img = render_metatile(palt_mts[local_id], prim_img, palt_img, prim_pals, palt_pals, is_secondary_metatile=True)
    img.save(os.path.join(OUT, f"{name}.png"))
    print(f"  ✓ {name}.png  (secondary 0x{local_id:02X} / full 0x{local_id+0x280:03X})")
    saved += 1

for local_id, names in SECONDARY_ALIASES.items():
    if local_id not in palt_mts:
        print(f"  MISS secondary alias 0x{local_id:02X} → {', '.join(names)}")
        continue
    img = render_metatile(palt_mts[local_id], prim_img, palt_img, prim_pals, palt_pals, is_secondary_metatile=True)
    for name in names:
        img.save(os.path.join(OUT, f"{name}.png"))
        print(f"  ✓ {name}.png  (secondary alias 0x{local_id:02X} / full 0x{local_id+0x280:03X})")
        saved += 1

print(f"\n=== Done — {saved} tiles written to {OUT}/ ===")
print()
print("Open debug sheets to verify and correct indices:")
print(f"  open {DBG}/debug_primary_metatiles.png   (primary tiles 0x000-0x0FF)")
print(f"  open {DBG}/debug_pallet_metatiles.png    (all secondary pallet town tiles)")
