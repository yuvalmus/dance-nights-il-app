import { TAB_BAR_CONFIG } from './tabBarConfig';

// Builds a CURVE-UP shape: the bar is flat on the sides but rises upward
// in the center as a smooth convex hill. The center button sits at the peak.
//
// Visual (exaggerated):
//
//              ╭──────╮            ← peak of the hill (y = 0)
//           ╭──╯      ╰──╮
//       ────╯              ╰────   ← flat bar top edge (y = curveRise)
//       │                      │
//       └──────────────────────┘   ← bottom (y = curveRise + barHeight + insets)
//
// In SVG coordinates, y=0 is the TOP of the SVG viewport.
// The flat portions sit at y = curveRise.
// The hill peaks at y = 0.

export function buildCurvedUpPath(width: number, totalHeight: number): string {
  const mid = width / 2;
  const { curveWidth, curveRise } = TAB_BAR_CONFIG;
  const half = curveWidth / 2;

  const flatY = curveRise;
  const peakY = 0;

  // Bezier control points for a smooth, gradual bell curve.
  // The shoulder control points stay at flatY to create a gentle
  // S-curve transition, while the peak control points create a
  // rounded top.
  const shoulderCpX = half * 0.55;
  const peakCpX = half * 0.30;

  return [
    `M 0,${flatY}`,
    `L ${mid - half},${flatY}`,

    // Left side: gradual rise from flat to peak
    `C ${mid - half + shoulderCpX},${flatY}  ${mid - peakCpX},${peakY}  ${mid},${peakY}`,

    // Right side: gradual descent from peak to flat
    `C ${mid + peakCpX},${peakY}  ${mid + half - shoulderCpX},${flatY}  ${mid + half},${flatY}`,

    `L ${width},${flatY}`,
    `L ${width},${totalHeight}`,
    `L 0,${totalHeight}`,
    `Z`,
  ].join(' ');
}
