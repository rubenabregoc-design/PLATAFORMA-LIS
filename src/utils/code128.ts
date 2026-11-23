/**
 * Authentic Code 128-B Barcode Generator (SVG)
 * ISO/IEC 15417 compliant Code 128 barcode generator.
 * Produces crisp, laser-accurate vector SVGs for screen display and thermal printing (203/300 DPI).
 */

// Code 128 character patterns: bar/space widths (6 digits, sum = 11 modules per pattern)
const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (106 is STOP pattern: 7 digits)
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/**
 * Encodes an ASCII string using Code 128 Subset B.
 * Returns an array of bar widths (alternating bar, space, bar, space...).
 */
export function encodeCode128B(text: string): { widths: number[]; checksum: number } {
  const codes: number[] = [START_CODE_B];

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // ASCII 32 to 126 map to Code 128-B values 0 to 94
    if (charCode >= 32 && charCode <= 126) {
      codes.push(charCode - 32);
    } else {
      // Fallback for unsupported chars
      codes.push(0);
    }
  }

  // Calculate checksum: (START + SUM(code[i] * i)) % 103
  let sum = START_CODE_B;
  for (let i = 1; i < codes.length; i++) {
    sum += codes[i] * i;
  }
  const checksum = sum % 103;
  codes.push(checksum);
  codes.push(STOP_CODE);

  // Convert codes to bar/space width sequence
  const widths: number[] = [];
  for (let i = 0; i < codes.length; i++) {
    const pattern = CODE128_PATTERNS[codes[i]];
    if (pattern) {
      for (let j = 0; j < pattern.length; j++) {
        widths.push(parseInt(pattern[j], 10));
      }
    }
  }

  return { widths, checksum };
}

/**
 * Generates an SVG string representation of a Code 128 barcode.
 * @param text The string to encode (e.g. "2026111657725.1")
 * @param height Height of the barcode in px (default 50)
 * @param moduleWidth Width of a single module (1x) in px (default 1.8)
 */
export function generateCode128Svg(
  text: string,
  height: number = 48,
  moduleWidth: number = 1.6
): { svgPath: string; totalWidth: number; totalHeight: number } {
  const { widths } = encodeCode128B(text);

  let currentX = 0;
  let path = '';

  for (let i = 0; i < widths.length; i++) {
    const w = widths[i] * moduleWidth;
    const isBar = i % 2 === 0; // Even indices are bars, odd are spaces

    if (isBar) {
      path += `M${currentX.toFixed(2)},0 h${w.toFixed(2)} v${height} h-${w.toFixed(2)} Z `;
    }
    currentX += w;
  }

  return {
    svgPath: path,
    totalWidth: Math.ceil(currentX),
    totalHeight: height
  };
}
