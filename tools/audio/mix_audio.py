#!/usr/bin/env python3
"""Voice + music -> clean ducked mix at -14 LUFS. No --music => synth pad."""
import argparse, subprocess


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", p], capture_output=True, text=True).stdout)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", required=True); ap.add_argument("--music")
    ap.add_argument("--total", type=float); ap.add_argument("--out", required=True)
    ap.add_argument("--music-db", type=float, default=-18); ap.add_argument("--lufs", type=float, default=-14)
    ap.add_argument("--sfx"); ap.add_argument("--sfx-db", type=float, default=-4)
    a = ap.parse_args()
    vo = dur(a.voice); T = a.total or vo
    if a.music:
        mus = ["-stream_loop", "-1", "-i", a.music]
    else:
        mus = ["-f", "lavfi", "-i", ("aevalsrc='0.10*sin(2*PI*110*t)+0.07*sin(2*PI*164.8*t)+0.06*sin(2*PI*220*t)"
               "+0.04*sin(2*PI*277.2*t)':s=48000:d=%.2f,tremolo=f=0.15:d=0.4,lowpass=f=1800,"
               "aecho=0.8:0.7:120|240:0.3|0.2" % T)]
    fx = a.sfx is not None
    fc = (f"[0:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=80,"
          f"equalizer=f=3500:t=q:w=1.2:g=2,deesser=i=0.3,"
          f"acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=3,apad=whole_dur={T}[vo];"
          f"[vo]asplit=2[vo1][key];"
          f"[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{T},asetpts=N/SR/TB,"
          f"volume={a.music_db}dB,afade=t=in:d=1.2,afade=t=out:st={max(T-2.0,0)}:d=2.0[m];"
          f"[m][key]sidechaincompress=threshold=0.03:ratio=10:attack=20:release=450:level_sc=1[duck];"
          + (f"[2:a]aresample=48000,aformat=channel_layouts=stereo,volume={a.sfx_db}dB[fx];" if fx else "")
          + f"[vo1][duck]{'[fx]' if fx else ''}amix=inputs={3 if fx else 2}:duration=first:normalize=0,"
          f"loudnorm=I={a.lufs}:TP=-1.5:LRA=9,alimiter=limit=0.89[out]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a.voice, *mus, *(["-i", a.sfx] if a.sfx else []), "-filter_complex", fc,
                    "-map", "[out]", "-t", str(T), "-c:a", "aac", "-b:a", "256k", a.out], check=True)
    print(f"mix {T:.2f}s (VO {vo:.2f}s, music {'file' if a.music else 'synth pad'}) -> {a.out}")


if __name__ == "__main__":
    main()
