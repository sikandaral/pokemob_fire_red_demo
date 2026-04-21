"""
Extract key 16x16 tiles from Pokemon town source images.
Run: python3 extract_tiles.py

Tile coordinates verified visually from annotated grid images.
Pallet Town: 320x288px = 20x18 tile grid (tx=col, ty=row)
"""
from PIL import Image
import os

TILE = 16
OUT_DIR = "assets/tiles/extracted"
os.makedirs(OUT_DIR, exist_ok=True)

def crop_tile(img, tx, ty):
    """Crop a 16x16 tile at grid position (tx=col, ty=row)."""
    x = tx * TILE
    y = ty * TILE
    return img.crop((x, y, x + TILE, y + TILE))

def extract_from_pallet():
    """
    Extract tiles from Pallet Town (320x288px, 20x18 grid).
    Coordinates confirmed from pallet_grid.png visual inspection.
    """
    img = Image.open("assets/tiles/pallet_town_full.png").convert("RGBA")
    w, h = img.size
    print(f"  Pallet size: {w}x{h} = {w//TILE}x{h//TILE} tiles")

    tiles = {
        # Interior ground — yellow-tan sand with tiny blue dots (main walkable surface)
        "ground": (2, 2),
        "ground_alt": (3, 3),

        # Border grass — green checkerboard (non-walkable outer areas)
        "grass": (1, 2),
        "grass_alt": (1, 3),

        # Border rock — gray oval boulder (border/wall)
        "rock": (1, 1),
        "rock_alt": (2, 1),

        # Left house roof (cols 4-6, row 3)
        "house_roof_l": (4, 3),
        "house_roof_m": (5, 3),
        "house_roof_r": (6, 3),

        # Left house body/walls (cols 4-6, row 4)
        "house_wall_l": (4, 4),
        "house_wall_m": (5, 4),
        "house_wall_r": (6, 4),

        # Left house base/door (cols 4-6, row 5)
        "house_base_l": (4, 5),
        "house_door": (5, 5),
        "house_base_r": (6, 5),

        # Sign/mailbox (col 3, row 5)
        "sign": (3, 5),

        # Oak's Lab roof — gray crosshatch (lower area, row 9)
        "lab_roof_l": (10, 9),
        "lab_roof_m": (11, 9),
        "lab_roof_r": (12, 9),

        # Oak's Lab wall — brick texture (row 10)
        "lab_wall_l": (10, 10),
        "lab_wall_m": (12, 10),
        "lab_wall_r": (15, 10),

        # Oak's Lab door (row 11)
        "lab_door": (12, 11),
        "lab_base_l": (10, 11),
        "lab_base_r": (15, 11),

        # Fence/log posts (row 9, cols 4-8)
        "fence": (4, 9),
        "fence_alt": (5, 9),

        # Flowers on grass (row 10, cols 4-7)
        "flower": (4, 10),
        "flower_alt": (5, 10),

        # Water (row 15)
        "water": (5, 15),
        "water_alt": (6, 15),

        # Water edge — dirt/sand border (row 14)
        "water_edge": (4, 14),
    }

    saved = 0
    for name, (tx, ty) in tiles.items():
        try:
            tile = crop_tile(img, tx, ty)
            tile.save(os.path.join(OUT_DIR, f"{name}.png"))
            print(f"  Extracted: {name} from ({tx}, {ty})")
            saved += 1
        except Exception as e:
            print(f"  SKIP: {name} - {e}")

    return saved

def extract_from_pewter():
    """Extract gym/city tiles from Pewter City."""
    try:
        img = Image.open("assets/tiles/pewter_town_full.png").convert("RGBA")
    except FileNotFoundError:
        print("  pewter_town_full.png not found, skipping")
        return 0

    w, h = img.size
    print(f"  Pewter size: {w}x{h} = {w//TILE}x{h//TILE} tiles")

    tiles = {
        # Path tile (darker/different than interior ground)
        "path": (5, 10),
        "path_alt": (6, 10),
    }

    saved = 0
    for name, (tx, ty) in tiles.items():
        try:
            tile = crop_tile(img, tx, ty)
            tile.save(os.path.join(OUT_DIR, f"{name}.png"))
            print(f"  Extracted: {name} from ({tx}, {ty})")
            saved += 1
        except Exception as e:
            print(f"  SKIP: {name} - {e}")

    return saved

if __name__ == "__main__":
    print("Extracting tiles from Pallet Town...")
    n1 = extract_from_pallet()
    print(f"\nExtracting tiles from Pewter City...")
    n2 = extract_from_pewter()
    print(f"\nDone! {n1+n2} tiles saved to {OUT_DIR}/")
    print(f"Total files in dir: {len(os.listdir(OUT_DIR))}")
