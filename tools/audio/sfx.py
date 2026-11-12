#!/usr/bin/env python3
"""events.json -> sfx.wav : motion-graphics sound design synced to the HeyMariner timeline.
Adapted from the motion-video skill's sfx.py. All sounds are synthesised with ffmpeg (no downloads, no licences).
events.json = {"total": seconds, "events": [{"name": "whoosh", "t": 1.25}, ...]}"""
import argparse, json, subprocess, tempfile

SR = 48000
SOUNDS = {
    "whoosh": ("anoisesrc=d=0.6:c=pink:a=0.9:r=48000,highpass=f=350,lowpass=f=6000,"
               "volume='pow(sin(PI*t/0.6),3)':eval=frame,aphaser=in_gain=0.6:out_gain=0.9:speed=1.6:decay=0.5"),
    "swoosh": ("anoisesrc=d=0.45:c=pink:a=0.9:r=48000,highpass=f=900,lowpass=f=7000,"
               "volume='pow(sin(PI*t/0.45),2)':eval=frame"),
    "pop": "aevalsrc='0.9*sin(2*PI*(230+950*exp(-t*38))*t)*exp(-t*16)':d=0.3:s=48000",
    "tick": "aevalsrc='0.55*sin(2*PI*2300*t)*exp(-t*70)+0.3*sin(2*PI*3450*t)*exp(-t*90)':d=0.09:s=48000",
    "click": "aevalsrc='0.7*sin(2*PI*1800*t)*exp(-t*120)+0.4*(random(0)*2-1)*exp(-t*200)':d=0.06:s=48000",
    "ding": ("aevalsrc='(0.5*sin(2*PI*1568*t)+0.25*sin(2*PI*3136*t))*exp(-t*4)':d=1.0:s=48000,"
             "aecho=0.8:0.6:90:0.25"),
    "ping": ("aevalsrc='0.6*sin(2*PI*1200*t)*exp(-t*5)':d=1.2:s=48000,aecho=0.8:0.7:180|360:0.4|0.25"),
    "boom": ("aevalsrc='0.95*sin(2*PI*(42+90*exp(-t*9))*t)*exp(-t*3.2)+0.35*(random(0)*2-1)*exp(-t*14)':d=1.6:s=48000,"
             "lowpass=f=2500,aecho=0.8:0.6:60|130:0.25|0.15"),
    "riser": ("aevalsrc='(0.32*sin(2*PI*(180*t+117*t*t*t))+0.18*(random(0)*2-1))*pow(t/1.6,2.2)':d=1.6:s=48000,"
              "highpass=f=200,aecho=0.8:0.7:90|170:0.3|0.2"),
    "chime": ("aevalsrc='(0.35*sin(2*PI*1318.5*t)+0.28*sin(2*PI*1975.5*t)+0.2*sin(2*PI*2637*t))*exp(-t*2.6)':d=1.8:s=48000,"
              "aecho=0.8:0.7:110|230:0.35|0.25"),
}
GAIN = {"whoosh": -8, "swoosh": -11, "pop": -10, "tick": -15, "click": -12, "ding": -12, "ping": -12, "boom": -5, "riser": -10, "chime": -11}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--events", required=True); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    data = json.load(open(a.events, encoding="utf-8"))
    T = float(data["total"])
    ev = [(e["name"], max(0.0, float(e["t"]))) for e in data["events"] if e["name"] in SOUNDS and float(e["t"]) < T]
    if not ev:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", str(T), a.out], check=True)
        print("0 sfx events"); return
    work = tempfile.mkdtemp(prefix="sfx_")
    for name in {n for n, _ in ev}:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", SOUNDS[name], "-ac", "2", "-ar", str(SR),
                        "-af", f"volume={GAIN[name]}dB", f"{work}/{name}.wav"], check=True)
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    for name, _ in ev: cmd += ["-i", f"{work}/{name}.wav"]
    fc = "".join(f"[{k}:a]adelay={int(t*1000)}|{int(t*1000)}[e{k}];" for k, (_, t) in enumerate(ev))
    fc += "".join(f"[e{k}]" for k in range(len(ev))) + f"amix=inputs={len(ev)}:normalize=0:duration=longest,apad=whole_dur={T},atrim=0:{T}[out]"
    cmd += ["-filter_complex", fc, "-map", "[out]", "-ar", str(SR), a.out]
    subprocess.run(cmd, check=True)
    print(f"{len(ev)} sfx events -> {a.out}")


if __name__ == "__main__":
    main()
