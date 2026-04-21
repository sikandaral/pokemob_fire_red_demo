from pathlib import Path
import json
import struct

from PIL import Image


ROOT = Path(__file__).resolve().parent
SOURCE_ROOT = Path("/Users/sikandarali/Downloads/fire red gba/pokefirered")
LAYOUTS_PATH = SOURCE_ROOT / "data/layouts/layouts.json"
OUTPUT_DIR = ROOT / "assets/generated"

TILE_SIZE = 8
METATILE_SIZE = 16

MAPS_TO_RENDER = {
    "PalletTown_Layout": "town_scene_bg.png",
    "PalletTown_ProfessorOaksLab_Layout": "lab_scene_bg.png",
    "Route1_Layout": "route_scene_bg.png",
    "ViridianCity_Layout": "viridian_scene_bg.png",
    "Route2_Layout": "route2_scene_bg.png",
    "ViridianForest_Layout": "forest_scene_bg.png",
    "PewterCity_Layout": "pewter_scene_bg.png",
    "PewterCity_Gym_Layout": "pewter_gym_scene_bg.png",
    "Mart_Layout": "mart_scene_bg.png",
    "PokemonCenter_1F_Layout": "pokemon_center_scene_bg.png",
}

OPAQUE_BASE_COLORS = {
    "Route1_Layout": (115, 205, 164, 255),
    "Route2_Layout": (115, 205, 164, 255),
}

TILESET_DIRS = {
    "gTileset_General": SOURCE_ROOT / "data/tilesets/primary/general",
    "gTileset_Building": SOURCE_ROOT / "data/tilesets/primary/building",
    "gTileset_PalletTown": SOURCE_ROOT / "data/tilesets/secondary/pallet_town",
    "gTileset_Lab": SOURCE_ROOT / "data/tilesets/secondary/lab",
    "gTileset_ViridianCity": SOURCE_ROOT / "data/tilesets/secondary/viridian_city",
    "gTileset_ViridianForest": SOURCE_ROOT / "data/tilesets/secondary/viridian_forest",
    "gTileset_PewterCity": SOURCE_ROOT / "data/tilesets/secondary/pewter_city",
    "gTileset_PewterGym": SOURCE_ROOT / "data/tilesets/secondary/pewter_gym",
    "gTileset_Mart": SOURCE_ROOT / "data/tilesets/secondary/mart",
    "gTileset_PokemonCenter": SOURCE_ROOT / "data/tilesets/secondary/pokemon_center",
}


def parse_palette(path):
    lines = [line.strip() for line in path.read_text().splitlines() if line.strip()]
    colors = []
    for line in lines[3:]:
        parts = line.split()
        if len(parts) >= 3:
            colors.append((int(parts[0]), int(parts[1]), int(parts[2])))
    while len(colors) < 16:
        colors.append((0, 0, 0))
    return colors[:16]


def load_palette_bank(tileset_dir):
    palettes = {}
    for path in sorted((tileset_dir / "palettes").glob("*.pal")):
        palettes[int(path.stem)] = parse_palette(path)
    return palettes


def parse_metatiles(path):
    data = path.read_bytes()
    metatiles = []
    for offset in range(0, len(data), 16):
        attrs = []
        for tile_offset in range(0, 16, 2):
            value = struct.unpack_from("<H", data, offset + tile_offset)[0]
            attrs.append({
                "tile_index": value & 0x3FF,
                "xflip": bool(value & 0x400),
                "yflip": bool(value & 0x800),
                "palette_slot": (value >> 12) & 0xF,
            })
        metatiles.append(attrs)
    return metatiles


def render_tile(sheet, tile_index, palette, transparent_zero):
    tiles_per_row = sheet.width // TILE_SIZE
    tile_x = (tile_index % tiles_per_row) * TILE_SIZE
    tile_y = (tile_index // tiles_per_row) * TILE_SIZE
    region = sheet.crop((tile_x, tile_y, tile_x + TILE_SIZE, tile_y + TILE_SIZE))

    pixels = []
    for value in region.getdata():
        palette_index = value % 16
        r, g, b = palette[palette_index]
        if (transparent_zero and palette_index == 0) or (r, g, b) == (255, 0, 255):
            pixels.append((0, 0, 0, 0))
        else:
            pixels.append((r, g, b, 255))

    rendered = Image.new("RGBA", (TILE_SIZE, TILE_SIZE))
    rendered.putdata(pixels)
    return rendered


def render_metatile(attrs, primary_sheet, secondary_sheet, primary_palettes, secondary_palettes, active_palettes=None, use_source_palettes=False):
    result = Image.new("RGBA", (METATILE_SIZE, METATILE_SIZE), (0, 0, 0, 0))
    positions = [(0, 0), (TILE_SIZE, 0), (0, TILE_SIZE), (TILE_SIZE, TILE_SIZE)]
    primary_tile_count = (primary_sheet.width // TILE_SIZE) * (primary_sheet.height // TILE_SIZE)
    secondary_tile_offset = primary_tile_count
    secondary_tile_count = (secondary_sheet.width // TILE_SIZE) * (secondary_sheet.height // TILE_SIZE)
    palettes = active_palettes or primary_palettes

    for layer_index in range(2):
        layer = Image.new("RGBA", (METATILE_SIZE, METATILE_SIZE), (0, 0, 0, 0))
        for quadrant_index, position in enumerate(positions):
            attr = attrs[layer_index * 4 + quadrant_index]
            tile_index = attr["tile_index"]

            if tile_index >= secondary_tile_offset:
                source_sheet = secondary_sheet
                source_index = tile_index - secondary_tile_offset
                source_palettes = secondary_palettes
                if source_index >= secondary_tile_count:
                    continue
            else:
                source_sheet = primary_sheet
                source_index = tile_index
                source_palettes = primary_palettes
                if source_index >= primary_tile_count:
                    continue

            if use_source_palettes:
                palette = source_palettes.get(
                    attr["palette_slot"],
                    secondary_palettes.get(attr["palette_slot"], primary_palettes.get(attr["palette_slot"], primary_palettes[0])),
                )
            else:
                palette = palettes.get(
                    attr["palette_slot"],
                    secondary_palettes.get(attr["palette_slot"], primary_palettes.get(attr["palette_slot"], primary_palettes[0])),
                )
            tile = render_tile(source_sheet, source_index, palette, transparent_zero=(layer_index == 1))
            if attr["xflip"]:
                tile = tile.transpose(Image.FLIP_LEFT_RIGHT)
            if attr["yflip"]:
                tile = tile.transpose(Image.FLIP_TOP_BOTTOM)
            layer.alpha_composite(tile, position)

        result.alpha_composite(layer)

    return result


def render_layout(layout_meta):
    width = int(layout_meta["width"])
    height = int(layout_meta["height"])
    primary_dir = TILESET_DIRS[layout_meta["primary_tileset"]]
    secondary_dir = TILESET_DIRS[layout_meta["secondary_tileset"]]

    primary_sheet = Image.open(primary_dir / "tiles.png")
    secondary_sheet = Image.open(secondary_dir / "tiles.png")
    primary_palettes = load_palette_bank(primary_dir)
    secondary_palettes = load_palette_bank(secondary_dir)
    # In-game maps load a combined active palette for the map. Secondary outdoor
    # tilesets such as Viridian override slots that are also used by primary
    # General graphics; using the primary palette for those primary tiles bakes
    # black/magenta placeholder colors into building metatiles.
    active_palettes = {**primary_palettes, **secondary_palettes}
    primary_metatiles = parse_metatiles(primary_dir / "metatiles.bin")
    secondary_metatiles = parse_metatiles(secondary_dir / "metatiles.bin")
    use_source_palettes = layout_meta["secondary_tileset"] == "gTileset_PalletTown"

    primary_count = len(primary_metatiles)
    blockdata = (SOURCE_ROOT / layout_meta["blockdata_filepath"]).read_bytes()
    scene = Image.new("RGBA", (width * METATILE_SIZE, height * METATILE_SIZE), (0, 0, 0, 0))

    for index in range(0, len(blockdata), 2):
        block_value = struct.unpack_from("<H", blockdata, index)[0] & 0x3FF
        x = (index // 2) % width
        y = (index // 2) // width

        if block_value >= primary_count:
            metatile = secondary_metatiles[block_value - primary_count]
        else:
            metatile = primary_metatiles[block_value]

        image = render_metatile(
            metatile,
            primary_sheet,
            secondary_sheet,
            primary_palettes,
            secondary_palettes,
            active_palettes,
            use_source_palettes,
        )
        scene.alpha_composite(image, (x * METATILE_SIZE, y * METATILE_SIZE))

    return scene


def main():
    layouts_data = json.loads(LAYOUTS_PATH.read_text())
    layout_entries = {}
    for entry in layouts_data["layouts"]:
        layout_name = entry.get("name") or entry.get("id")
        if layout_name:
            layout_entries[layout_name] = entry

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for layout_name, filename in MAPS_TO_RENDER.items():
        image = render_layout(layout_entries[layout_name])
        if layout_name in OPAQUE_BASE_COLORS:
            base = Image.new("RGBA", image.size, OPAQUE_BASE_COLORS[layout_name])
            base.alpha_composite(image)
            image = base
        output_path = OUTPUT_DIR / filename
        image.save(output_path)
        print(f"saved {output_path}")


if __name__ == "__main__":
    main()
