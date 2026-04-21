"""
Generate FireRed-accurate 16x16 tile PNGs programmatically.
Run: python3 generate_firered_tiles.py

FireRed palette reference:
- Grass (walkable): #88C070 base, #98D880 highlight dots
- Border trees: #307830 dark, #489048 highlight
- Path/dirt: #D0B878 base, #D8C888 alt
- Water: #4888C8 base, #68A8E8 highlight
- House roof: #70B8A0 teal (FireRed Pallet Town style)
- House wall: #F0D870 cream-yellow
- Lab roof: #909090 gray crosshatch
- Lab wall: #C8A870 brick tan
"""
from PIL import Image, ImageDraw
import os

OUT_DIR = "assets/tiles/extracted"
os.makedirs(OUT_DIR, exist_ok=True)
T = 16  # tile size


def save(img, name):
    path = os.path.join(OUT_DIR, f"{name}.png")
    img.save(path)
    print(f"  {name}.png")


def solid(color):
    return Image.new("RGBA", (T, T), color)


def grass_tile(base, dot):
    """Mint green grass with sparse lighter dots — FireRed overworld ground."""
    img = solid(base)
    d = ImageDraw.Draw(img)
    # Sparse dot pattern (every 4px offset by 2)
    for y in range(0, T, 4):
        for x in range(0, T, 4):
            # Offset every other row
            ox = 2 if (y // 4) % 2 == 1 else 0
            px = (x + ox) % T
            d.point((px, y), fill=dot)
    return img


def grass_alt_tile(base, dot):
    """Alternate grass — dots offset by half."""
    img = solid(base)
    d = ImageDraw.Draw(img)
    for y in range(2, T, 4):
        for x in range(2, T, 4):
            ox = 2 if (y // 4) % 2 == 0 else 0
            px = (x + ox) % T
            d.point((px, y), fill=dot)
    return img


def tree_border_tile():
    """Dark green border tree tile — rounded boulder look."""
    base = (56, 136, 56)      # #387838 mid green
    dark = (24, 88, 24)       # #185818 shadow
    light = (88, 168, 88)     # #58A858 highlight
    img = solid(dark)
    d = ImageDraw.Draw(img)
    # Draw a rounded oval fill
    d.ellipse([1, 1, 14, 14], fill=base)
    d.ellipse([3, 2, 10, 8], fill=light)  # top highlight
    return img


def tree_border_alt_tile():
    """Alternate border tree — slightly shifted highlight."""
    base = (48, 120, 48)
    dark = (24, 80, 24)
    light = (80, 160, 80)
    img = solid(dark)
    d = ImageDraw.Draw(img)
    d.ellipse([1, 2, 14, 14], fill=base)
    d.ellipse([5, 3, 12, 8], fill=light)
    return img


def path_tile(base, accent):
    """Tan dirt path with faint texture."""
    img = solid(base)
    d = ImageDraw.Draw(img)
    # Subtle crosshatch texture
    for i in range(0, T, 4):
        d.line([(i, 0), (i, T)], fill=accent, width=1)
    for i in range(0, T, 4):
        d.line([(0, i), (T, i)], fill=accent, width=1)
    return img


def water_tile(base, wave):
    """Blue water with wavy lighter lines."""
    img = solid(base)
    d = ImageDraw.Draw(img)
    for y in range(2, T, 4):
        for x in range(0, T, 2):
            shift = 1 if (x // 2) % 2 == 0 else 0
            d.point((x, y + shift), fill=wave)
    return img


def water_alt_tile(base, wave):
    img = solid(base)
    d = ImageDraw.Draw(img)
    for y in range(0, T, 4):
        for x in range(1, T, 2):
            shift = 1 if (x // 2) % 2 == 1 else 0
            d.point((x, y + shift), fill=wave)
    return img


def house_roof_l():
    """Left side of house roof — teal with left edge shadow."""
    img = solid((112, 184, 160))  # #70B8A0 teal
    d = ImageDraw.Draw(img)
    # Left dark border
    d.line([(0, 0), (0, T)], fill=(40, 96, 80), width=2)
    # Bottom shadow line
    d.line([(0, T - 1), (T, T - 1)], fill=(80, 152, 128))
    # Subtle diagonal stripe for roof texture
    for i in range(-T, T * 2, 4):
        d.line([(i, 0), (i + T, T)], fill=(96, 168, 144), width=1)
    return img


def house_roof_m():
    """Middle of house roof — teal."""
    img = solid((112, 184, 160))
    d = ImageDraw.Draw(img)
    for i in range(-T, T * 2, 4):
        d.line([(i, 0), (i + T, T)], fill=(96, 168, 144), width=1)
    d.line([(0, T - 1), (T, T - 1)], fill=(80, 152, 128))
    return img


def house_roof_r():
    """Right side of house roof — teal with right edge shadow."""
    img = solid((112, 184, 160))
    d = ImageDraw.Draw(img)
    d.line([(T - 1, 0), (T - 1, T)], fill=(40, 96, 80), width=2)
    for i in range(-T, T * 2, 4):
        d.line([(i, 0), (i + T, T)], fill=(96, 168, 144), width=1)
    d.line([(0, T - 1), (T, T - 1)], fill=(80, 152, 128))
    return img


def house_roof_edge(side):
    """Narrow edge band below roof — darker teal trim."""
    img = solid((80, 152, 128))  # slightly darker
    d = ImageDraw.Draw(img)
    if side == 'l':
        d.line([(0, 0), (0, T)], fill=(40, 96, 80), width=2)
    elif side == 'r':
        d.line([(T - 1, 0), (T - 1, T)], fill=(40, 96, 80), width=2)
    # Top highlight
    d.line([(0, 0), (T, 0)], fill=(128, 200, 176))
    return img


def house_wall(side):
    """Cream-yellow house wall."""
    img = solid((240, 216, 112))  # #F0D870
    d = ImageDraw.Draw(img)
    # Window on middle tile
    if side == 'm':
        d.rectangle([3, 2, 12, 11], fill=(160, 200, 232))  # blue window glass
        d.rectangle([3, 2, 12, 11], outline=(80, 80, 80), width=1)
        d.line([(7, 2), (7, 11)], fill=(80, 80, 80))  # vertical divider
        d.line([(3, 6), (12, 6)], fill=(80, 80, 80))  # horizontal divider
    if side == 'l':
        d.line([(0, 0), (0, T)], fill=(176, 152, 64), width=2)
    if side == 'r':
        d.line([(T - 1, 0), (T - 1, T)], fill=(176, 152, 64), width=2)
    return img


def house_base(side):
    """House base/foundation — slightly darker than wall."""
    img = solid((208, 184, 88))  # #D0B858
    d = ImageDraw.Draw(img)
    if side == 'l':
        d.line([(0, 0), (0, T)], fill=(160, 136, 48), width=2)
    if side == 'r':
        d.line([(T - 1, 0), (T - 1, T)], fill=(160, 136, 48), width=2)
    # Top trim line
    d.line([(0, 0), (T, 0)], fill=(160, 136, 48))
    return img


def house_door():
    """Brown door with knob."""
    img = solid((208, 184, 88))  # same base as house_base
    d = ImageDraw.Draw(img)
    # Door frame
    d.rectangle([3, 1, 12, 15], fill=(168, 88, 32))   # #A85820 brown door
    d.rectangle([3, 1, 12, 15], outline=(96, 48, 8), width=1)
    # Door panels
    d.rectangle([4, 2, 7, 7], fill=(184, 104, 48))
    d.rectangle([8, 2, 11, 7], fill=(184, 104, 48))
    d.rectangle([4, 8, 11, 13], fill=(184, 104, 48))
    # Knob
    d.ellipse([10, 9, 12, 11], fill=(240, 200, 64))
    return img


def lab_roof(side):
    """Gray crosshatch roof — Oak's Lab / Pewter style."""
    img = solid((144, 144, 144))  # #909090
    d = ImageDraw.Draw(img)
    # Crosshatch pattern
    for i in range(0, T, 4):
        d.line([(i, 0), (i, T)], fill=(112, 112, 112), width=1)
    for i in range(0, T, 4):
        d.line([(0, i), (T, i)], fill=(112, 112, 112), width=1)
    # Highlight dots at intersections
    for y in range(0, T, 4):
        for x in range(0, T, 4):
            d.point((x, y), fill=(168, 168, 168))
    if side == 'l':
        d.line([(0, 0), (0, T)], fill=(80, 80, 80), width=2)
    if side == 'r':
        d.line([(T - 1, 0), (T - 1, T)], fill=(80, 80, 80), width=2)
    d.line([(0, T - 1), (T, T - 1)], fill=(80, 80, 80))
    return img


def lab_wall(side):
    """Brick tan wall — Oak's Lab."""
    img = solid((200, 168, 112))  # #C8A870
    d = ImageDraw.Draw(img)
    # Brick rows
    for row in range(0, T, 4):
        offset = 4 if (row // 4) % 2 == 1 else 0
        for col in range(-4, T + 4, 8):
            d.rectangle([col + offset, row, col + offset + 6, row + 2],
                        outline=(152, 112, 64), width=1)
    if side == 'l':
        d.line([(0, 0), (0, T)], fill=(120, 80, 32), width=2)
    if side == 'r':
        d.line([(T - 1, 0), (T - 1, T)], fill=(120, 80, 32), width=2)
    return img


def lab_door():
    img = solid((200, 168, 112))
    d = ImageDraw.Draw(img)
    # Door arch
    d.rectangle([3, 2, 12, 15], fill=(128, 96, 64))
    d.rectangle([3, 2, 12, 15], outline=(80, 48, 16), width=1)
    # Glass window on door
    d.rectangle([5, 3, 10, 8], fill=(136, 184, 216))
    d.line([(7, 3), (7, 8)], fill=(80, 48, 16))
    return img


def lab_base(side):
    img = solid((176, 144, 96))  # #B09060 stone base
    d = ImageDraw.Draw(img)
    d.line([(0, 0), (T, 0)], fill=(128, 96, 48))
    if side == 'l':
        d.line([(0, 0), (0, T)], fill=(120, 80, 32), width=2)
    if side == 'r':
        d.line([(T - 1, 0), (T - 1, T)], fill=(120, 80, 32), width=2)
    return img


def fence_tile(variant=0):
    """Wooden log fence post."""
    img = solid((136, 200, 112))  # grass behind fence  #88C870
    d = ImageDraw.Draw(img)
    # Log post (center)
    d.rectangle([6, 0, 9, 15], fill=(152, 112, 64))   # #987040 brown
    d.rectangle([6, 0, 9, 15], outline=(104, 72, 32), width=1)
    if variant == 0:
        # Horizontal rail at top and bottom
        d.rectangle([0, 3, 15, 5], fill=(168, 128, 80))
        d.rectangle([0, 10, 15, 12], fill=(168, 128, 80))
    else:
        # Alternate — rails at different heights
        d.rectangle([0, 2, 15, 4], fill=(168, 128, 80))
        d.rectangle([0, 11, 15, 13], fill=(168, 128, 80))
    return img


def flower_tile(variant=0):
    """Pink flower on green grass."""
    img = grass_tile((136, 192, 112), (152, 216, 128))
    d = ImageDraw.Draw(img)
    if variant == 0:
        # Single flower cluster center-left
        cx, cy = 5, 8
    else:
        cx, cy = 10, 7
    # Petals
    petal = (216, 96, 112)       # #D86070 pink-red
    center_c = (240, 200, 64)    # #F0C840 yellow center
    for dx, dy in [(-2, 0), (2, 0), (0, -2), (0, 2)]:
        d.point((cx + dx, cy + dy), fill=petal)
    d.point((cx, cy), fill=center_c)
    # Second flower
    cx2, cy2 = (11, 4) if variant == 0 else (4, 11)
    for dx, dy in [(-2, 0), (2, 0), (0, -2), (0, 2)]:
        d.point((cx2 + dx, cy2 + dy), fill=petal)
    d.point((cx2, cy2), fill=center_c)
    return img


def sign_tile():
    """Sign post on grass."""
    img = grass_tile((136, 192, 112), (152, 216, 128))
    d = ImageDraw.Draw(img)
    # Post
    d.rectangle([7, 8, 9, 15], fill=(128, 96, 64))
    # Board
    d.rectangle([3, 2, 12, 8], fill=(200, 160, 64))    # #C8A040 tan board
    d.rectangle([3, 2, 12, 8], outline=(96, 64, 16), width=1)
    # Text lines on board
    d.line([(5, 4), (10, 4)], fill=(80, 48, 16))
    d.line([(5, 6), (10, 6)], fill=(80, 48, 16))
    return img


# ── Generate all tiles ──────────────────────────────────────────────────────

GRASS_BASE = (136, 192, 112)   # #88C070
GRASS_DOT  = (152, 216, 128)   # #98D880
PATH_BASE  = (208, 184, 120)   # #D0B878
PATH_ACCENT= (216, 200, 136)   # #D8C888
WATER_BASE = (72, 136, 200)    # #4888C8
WATER_WAVE = (104, 168, 232)   # #68A8E8

tiles = {
    "firered_ground":          grass_tile(GRASS_BASE, GRASS_DOT),
    "firered_ground_alt":      grass_alt_tile(GRASS_BASE, GRASS_DOT),
    "firered_tree":            tree_border_tile(),
    "firered_tree_alt":        tree_border_alt_tile(),
    "firered_path":            path_tile(PATH_BASE, PATH_ACCENT),
    "firered_path_alt":        path_tile(PATH_ACCENT, PATH_BASE),
    "firered_water":           water_tile(WATER_BASE, WATER_WAVE),
    "firered_water_alt":       water_alt_tile(WATER_BASE, WATER_WAVE),
    "firered_house_roof_l":    house_roof_l(),
    "firered_house_roof_m":    house_roof_m(),
    "firered_house_roof_r":    house_roof_r(),
    "firered_house_roof_edge_l": house_roof_edge('l'),
    "firered_house_roof_edge_m": house_roof_edge('m'),
    "firered_house_roof_edge_r": house_roof_edge('r'),
    "firered_house_wall_l":    house_wall('l'),
    "firered_house_wall_m":    house_wall('m'),
    "firered_house_wall_r":    house_wall('r'),
    "firered_house_base_l":    house_base('l'),
    "firered_house_base_r":    house_base('r'),
    "firered_house_door":      house_door(),
    "lab_roof_l":              lab_roof('l'),
    "lab_roof_m":              lab_roof('m'),
    "lab_roof_r":              lab_roof('r'),
    "lab_wall_l":              lab_wall('l'),
    "lab_wall_m":              lab_wall('m'),
    "lab_wall_r":              lab_wall('r'),
    "lab_door":                lab_door(),
    "lab_base_l":              lab_base('l'),
    "lab_base_r":              lab_base('r'),
    "fence":                   fence_tile(0),
    "fence_alt":               fence_tile(1),
    "flower":                  flower_tile(0),
    "flower_alt":              flower_tile(1),
    "sign":                    sign_tile(),
}

print(f"Generating {len(tiles)} FireRed tiles → {OUT_DIR}/")
for name, img in tiles.items():
    save(img, name)

print(f"\nDone! {len(tiles)} tiles written.")
print("Now open index.html in your browser to see the updated map.")
