"""Generate Android launcher and splash assets from resources/icon.png."""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "resources" / "icon.png"
RES = ROOT / "android" / "app" / "src" / "main" / "res"
PAPER = (243, 239, 227, 255)
ICON = Image.open(SOURCE).convert("RGBA")

MIPMAPS = {
    "mdpi": (48, 108),
    "hdpi": (72, 162),
    "xhdpi": (96, 216),
    "xxhdpi": (144, 324),
    "xxxhdpi": (192, 432),
}


def resize(image: Image.Image, size: int) -> Image.Image:
    return image.resize((size, size), Image.Resampling.LANCZOS)


def write_mipmaps() -> None:
    for density, (legacy_size, foreground_size) in MIPMAPS.items():
        folder = RES / f"mipmap-{density}"
        folder.mkdir(parents=True, exist_ok=True)

        resized = resize(ICON, legacy_size)
        resized.save(folder / "ic_launcher.png", "PNG", optimize=True)

        # Android's round launcher icon should not show the square corners.
        mask = Image.new("L", (legacy_size, legacy_size), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, legacy_size - 1, legacy_size - 1), fill=255)
        round_icon = Image.new("RGBA", (legacy_size, legacy_size), (0, 0, 0, 0))
        round_icon.alpha_composite(resized)
        round_icon.putalpha(mask)
        round_icon.save(folder / "ic_launcher_round.png", "PNG", optimize=True)

        resize(ICON, foreground_size).save(
            folder / "ic_launcher_foreground.png", "PNG", optimize=True
        )


def write_splashes() -> None:
    for path in RES.glob("drawable*/splash.png"):
        with Image.open(path) as old:
            width, height = old.size
        canvas = Image.new("RGBA", (width, height), PAPER)
        icon_size = max(48, round(min(width, height) * 0.32))
        icon = resize(ICON, icon_size)
        canvas.alpha_composite(icon, ((width - icon_size) // 2, (height - icon_size) // 2))
        canvas.convert("RGB").save(path, "PNG", optimize=True)


if __name__ == "__main__":
    write_mipmaps()
    write_splashes()
    print("Android icons and splashes generated from resources/icon.png")
