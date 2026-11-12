// One layout definition used by the video components AND by quality control (to inspect the 3D panel).
export type Rect = {x: number; y: number; w: number; h: number};
export type Layout = {vertical: boolean; margin: number; header: Rect; title: Rect; content: Rect; panel: Rect; captions: Rect; u: number};

export const layoutFor = (width: number, height: number): Layout => {
  const vertical = height > width;
  if (vertical) {
    const m = 64;
    return {
      vertical, margin: m, u: width / 1080,
      header: {x: m, y: 100, w: width - 2 * m, h: 84},
      title: {x: m, y: 214, w: width - 2 * m, h: 250},
      content: {x: m, y: 480, w: width - 2 * m, h: 800},
      panel: {x: 40, y: 480, w: width - 80, h: 800},
      captions: {x: m, y: 1320, w: width - 2 * m, h: 240},
    };
  }
  const m = 90;
  return {
    vertical, margin: m, u: height / 1080,
    header: {x: m, y: 44, w: width - 2 * m, h: 72},
    title: {x: m, y: 136, w: width - 2 * m, h: 150},
    content: {x: m + 200, y: 300, w: width - 2 * m - 400, h: 560},
    panel: {x: 380, y: 300, w: width - 760, h: 560},
    captions: {x: m, y: 890, w: width - 2 * m, h: 140},
  };
};
