#!/usr/bin/env python3
"""Clickable thumbnail from the video's own strongest frame.
  python3 thumbnail.py --video final.mp4 --at 17.4 --text "HEAD-ON: WHICH WAY?" --badge "WHO GIVES WAY?" \
      --logo public/brand/logo.png --fonts public/fonts --accent "#2DD4BF" --out thumb.png [--wide thumb_16x9.jpg]
The background is a real frame of the animation (a topic graphic, not a stock picture); the headline is set
very large on colour blocks, the key word highlighted, the logo on a white card."""
import argparse, os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

HL = ['#FACC15', '#2DD4BF', '#FFFFFF']


def frame(video, t, out):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.2f}', '-i', video, '-frames:v', '1', out], check=True)
    return Image.open(out).convert('RGB')


def wrap(words, font, maxw, draw):
    lines, cur = [], []
    for w in words:
        test = ' '.join(cur + [w])
        if cur and draw.textlength(test, font=font) > maxw:
            lines.append(cur); cur = [w]
        else:
            cur.append(w)
    if cur: lines.append(cur)
    return lines


def rounded(im, r):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=r, fill=255)
    out = im.convert('RGBA'); out.putalpha(m); return out


def cover(im, W, H, fy=0.5):
    s = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * s + 0.5), int(im.height * s + 0.5)), Image.LANCZOS)
    top = int(max(0, im.height - H) * fy); left = (im.width - W) // 2
    return im.crop((left, top, left + W, top + H))


def compose(panel, W, H, text, badge, logo, fonts, accent, vertical):
    panel = ImageEnhance.Contrast(ImageEnhance.Color(panel).enhance(1.3)).enhance(1.1)
    u = W / 1080 if vertical else W / 1280
    if vertical:
        img = cover(panel, W, H).filter(ImageFilter.GaussianBlur(28))
        img = ImageEnhance.Brightness(img).enhance(0.45).convert('RGBA')
        pw = W - int(48 * u); ph = int(pw * panel.height / panel.width)
        sharp = rounded(panel.resize((pw, ph), Image.LANCZOS), int(40 * u))
        py = int(740 * u)
        glow = Image.new('RGBA', (pw + 80, ph + 80), (0, 0, 0, 0)); ImageDraw.Draw(glow).rounded_rectangle([40, 40, pw + 40, ph + 40], radius=int(40 * u), outline=accent, width=int(14 * u))
        img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(14)), (int(24 * u) - 40, py - 40))
        img.alpha_composite(sharp, (int(24 * u), py))
        ImageDraw.Draw(img).rounded_rectangle([int(24 * u), py, int(24 * u) + pw, py + ph], radius=int(40 * u), outline=accent, width=int(6 * u))
    else:
        img = cover(panel, W, H, 0.4).convert('RGBA')
        ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
        for x in range(W):
            d.line([(x, 0), (x, H)], fill=(4, 14, 30, int(235 * max(0, 1 - x / (W * 0.72)) ** 1.1)))
        img = Image.alpha_composite(img, ov)
    d = ImageDraw.Draw(img)
    head = os.path.join(fonts, 'Poppins-ExtraBold.ttf'); semi = os.path.join(fonts, 'Poppins-Bold.ttf')
    if badge:
        bf = ImageFont.truetype(semi, int((46 if vertical else 34) * u)); bw = d.textlength(badge, font=bf)
        x, y = int(56 * u), int((110 if vertical else 40) * u)
        d.rounded_rectangle([x, y, x + bw + 52 * u, y + bf.size * 1.75], radius=int(18 * u), fill=accent)
        d.text((x + 26 * u, y + bf.size * 0.28), badge, font=bf, fill='#061223')
    words = text.upper().split()
    size = int((158 if vertical else 104) * u)
    maxw = W - int(112 * u) if vertical else int(W * 0.66)
    while True:
        f = ImageFont.truetype(head, size)
        lines = wrap(words, f, maxw, d)
        if len(lines) <= (4 if vertical else 3) and all(d.textlength(' '.join(l), font=f) <= maxw for l in lines): break
        size -= 6
    lh = int(size * 1.16)
    block = lh * len(lines)
    y = int(230 * u) + max(0, (int(480 * u) - block) // 2) if vertical else int(150 * u)
    for i, l in enumerate(lines):
        line = ' '.join(l)
        x = int(56 * u)
        hl = i == len(lines) - 1 or any(ch.isdigit() for ch in line)
        tw = d.textlength(line, font=f); pad = int(18 * u)
        if hl:
            d.rounded_rectangle([x - pad / 2, y + size * 0.06, x + tw + pad, y + size * 1.12], radius=int(16 * u), fill=HL[0])
            d.text((x + pad / 4, y - size * 0.04), line, font=f, fill='#061223')
        else:
            d.text((x, y - size * 0.04 + 6 * u), line, font=f, fill=(2, 8, 20))
            d.text((x, y - size * 0.04), line, font=f, fill='#FFFFFF', stroke_width=int(3 * u), stroke_fill='#061223')
        y += lh
    if logo and os.path.exists(logo):
        lg = Image.open(logo).convert('RGBA')
        lh2 = int((140 if vertical else 80) * u)
        lg = lg.resize((int(lg.width * lh2 / lg.height), lh2), Image.LANCZOS)
        cw, ch = lg.width + int(56 * u), lg.height + int(30 * u)
        cx = (W - cw) // 2 if vertical else int(56 * u)
        cyy = H - ch - int((60 if vertical else 40) * u)
        card = Image.new('RGBA', (cw, ch), (0, 0, 0, 0)); ImageDraw.Draw(card).rounded_rectangle([0, 0, cw - 1, ch - 1], radius=int(28 * u), fill='#FFFFFF')
        img.alpha_composite(card, (cx, cyy)); img.alpha_composite(lg, (cx + int(28 * u), cyy + int(15 * u)))
    return img.convert('RGB')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--video', required=True); ap.add_argument('--at', type=float, required=True)
    ap.add_argument('--text', required=True); ap.add_argument('--badge', default='')
    ap.add_argument('--logo'); ap.add_argument('--fonts', required=True); ap.add_argument('--accent', default='#2DD4BF')
    ap.add_argument('--out', required=True); ap.add_argument('--wide')
    ap.add_argument('--crop', help='x,y,w,h of the animation panel inside the video frame')
    a = ap.parse_args()
    tmp = tempfile.mkdtemp()
    bg = frame(a.video, a.at, os.path.join(tmp, 'f.png'))
    vertical = bg.height > bg.width
    if a.crop:
        x, y, w, h = (int(v) for v in a.crop.split(','))
        bg = bg.crop((x + 4, y + 4, x + w - 4, y + h - 4))
    W, H = (1080, 1920) if vertical else (1280, 720)
    compose(bg, W, H, a.text, a.badge, a.logo, a.fonts, a.accent, vertical).save(a.out, optimize=True)
    if a.wide:  # 16:9 version for YouTube / LinkedIn previews
        compose(bg, 1280, 720, a.text, a.badge, a.logo, a.fonts, a.accent, False).save(a.wide, quality=92)
    print('thumbnail ->', a.out)


if __name__ == '__main__':
    main()
