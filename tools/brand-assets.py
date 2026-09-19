"""Generate public web assets from the approved existing Heavyar logo."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
icons = ROOT / "assets/icons"
social = ROOT / "assets/social"
icons.mkdir(parents=True, exist_ok=True)
social.mkdir(parents=True, exist_ok=True)
logo = Image.open(ROOT / "assets/images/logo.png").convert("RGBA")
hero_source = ROOT / "assets/images/hero.jpg"
hero = Image.open(hero_source if hero_source.exists() else ROOT / "assets/images/banner.jpg").convert("RGB")
hero.thumbnail((1600, 1000), Image.Resampling.LANCZOS)
hero.save(ROOT / "assets/images/hero.webp", quality=80, method=6)
# Remove transparent outer padding, without changing the approved artwork.
logo = logo.crop(logo.getbbox())
for size, name in [(32, "favicon-32.png"), (192, "icon-192.png"),
                   (512, "icon-512.png"), (180, "apple-touch-icon.png")]:
    logo.resize((size, size), Image.Resampling.LANCZOS).save(icons / name, optimize=True)
logo.resize((256, 256), Image.Resampling.LANCZOS).save(
    icons / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
logo.resize((112, 112), Image.Resampling.LANCZOS).save(icons / "brand.png", optimize=True)

image = Image.new("RGB", (1200, 630), "#0b1424")
draw = ImageDraw.Draw(image)
draw.rectangle((0, 0, 1199, 9), fill="#e7b749")
draw.rectangle((68, 545, 1132, 547), fill="#263448")
brand = logo.resize((330, 330), Image.Resampling.LANCZOS)
image.paste(brand, (795, 133), brand)
fontdir = Path("/usr/share/fonts/truetype/dejavu")
def font(size, bold=False):
    return ImageFont.truetype(str(fontdir / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")), size)
draw.text((68, 106), "HEAVYAR", font=font(23, True), fill="#e7b749")
draw.text((63, 177), "Heavy equipment.", font=font(55, True), fill="#ffffff")
draw.text((63, 252), "Better connected.", font=font(55, True), fill="#ffffff")
draw.text((68, 359), "Equipment • Providers • Drivers", font=font(25), fill="#c3cbd8")
draw.text((68, 414), "Built for Saudi Arabia", font=font(24), fill="#e7b749")
draw.text((68, 571), "heavyar.com", font=font(21), fill="#c3cbd8")
image.save(social / "heavyar-og.jpg", quality=90, optimize=True)