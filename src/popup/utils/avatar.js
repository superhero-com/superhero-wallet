/* eslint-disable */
// Helper methods from https://github.com/dmester/jdenticon/blob/master/dist/jdenticon-module.js

/**
 * Computes a SHA1 hash for any value and returns it as a hexadecimal string.
 * 
 * This function is optimized for minimal code size and rather short messages.
 * 
 * @param {string} message 
 */
function sha1(message) {
  var HASH_SIZE_HALF_BYTES = 40;
  var BLOCK_SIZE_WORDS = 16;

  // Variables
  // `var` is used to be able to minimize the number of `var` keywords.
  var i = 0,
    f = 0,

    // Use `encodeURI` to UTF8 encode the message without any additional libraries
    // We could use `unescape` + `encodeURI` to minimize the code, but that would be slightly risky
    // since `unescape` is deprecated.
    urlEncodedMessage = encodeURI(message) + "%80", // trailing '1' bit padding

    // This can be changed to a preallocated Uint32Array array for greater performance and larger code size
    data = [],
    dataSize,

    hashBuffer = [],

    a = 0x67452301,
    b = 0xefcdab89,
    c = ~a,
    d = ~b,
    e = 0xc3d2e1f0,
    hash = [a, b, c, d, e],

    blockStartIndex = 0,
    hexHash = "";

  /**
   * Rotates the value a specified number of bits to the left.
   * @param {number} value  Value to rotate
   * @param {number} shift  Bit count to shift.
   */
  function rotl(value, shift) {
    return (value << shift) | (value >>> (32 - shift));
  }

  // Message data
  for (; i < urlEncodedMessage.length; f++) {
    data[f >> 2] = data[f >> 2] |
      (
        (
          urlEncodedMessage[i] == "%"
            // Percent encoded byte
            ? parseInt(urlEncodedMessage.substring(i + 1, i += 3), 16)
            // Unencoded byte
            : urlEncodedMessage.charCodeAt(i++)
        )

        // Read bytes in reverse order (big endian words)
        << ((3 - (f & 3)) * 8)
      );
  }

  // f is now the length of the utf8 encoded message
  // 7 = 8 bytes (64 bit) for message size, -1 to round down
  // >> 6 = integer division with block size
  dataSize = (((f + 7) >> 6) + 1) * BLOCK_SIZE_WORDS;

  // Message size in bits.
  // SHA1 uses a 64 bit integer to represent the size, but since we only support short messages only the least
  // significant 32 bits are set. -8 is for the '1' bit padding byte.
  data[dataSize - 1] = f * 8 - 8;

  // Compute hash
  for (; blockStartIndex < dataSize; blockStartIndex += BLOCK_SIZE_WORDS) {
    for (i = 0; i < 80; i++) {
      f = rotl(a, 5) + e + (
        // Ch
        i < 20 ? ((b & c) ^ ((~b) & d)) + 0x5a827999 :

          // Parity
          i < 40 ? (b ^ c ^ d) + 0x6ed9eba1 :

            // Maj
            i < 60 ? ((b & c) ^ (b & d) ^ (c & d)) + 0x8f1bbcdc :

              // Parity
              (b ^ c ^ d) + 0xca62c1d6
      ) + (
          hashBuffer[i] = i < BLOCK_SIZE_WORDS
            // Bitwise OR is used to coerse `undefined` to 0
            ? (data[blockStartIndex + i] | 0)
            : rotl(hashBuffer[i - 3] ^ hashBuffer[i - 8] ^ hashBuffer[i - 14] ^ hashBuffer[i - 16], 1)
        );

      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = f;
    }

    hash[0] = a = ((hash[0] + a) | 0);
    hash[1] = b = ((hash[1] + b) | 0);
    hash[2] = c = ((hash[2] + c) | 0);
    hash[3] = d = ((hash[3] + d) | 0);
    hash[4] = e = ((hash[4] + e) | 0);
  }

  // Format hex hash
  for (i = 0; i < HASH_SIZE_HALF_BYTES; i++) {
    hexHash += (
      (
        // Get word (2^3 half-bytes per word)
        hash[i >> 3] >>>

        // Append half-bytes in reverse order
        ((7 - (i & 7)) * 4)
      )
      // Clamp to half-byte
      & 0xf
    ).toString(16);
  }

  return hexHash;
}

function decToHex(v) {
  v |= 0; // Ensure integer value
  return v < 0 ? "00" :
    v < 16 ? "0" + v.toString(16) :
      v < 256 ? v.toString(16) :
        "ff";
}

function hueToRgb(m1, m2, h) {
  h = h < 0 ? h + 6 : h > 6 ? h - 6 : h;
  return decToHex(255 * (
    h < 1 ? m1 + (m2 - m1) * h :
      h < 3 ? m2 :
        h < 4 ? m1 + (m2 - m1) * (4 - h) :
          m1));
}

/**
 * Converts an HSL color to a hexadecimal RGB color.
 * @param {number} hue  Hue in range [0, 1]
 * @param {number} saturation  Saturation in range [0, 1]
 * @param {number} lightness  Lightness in range [0, 1]
 * @returns {string}
 */
function hsl(hue, saturation, lightness) {
  // Based on http://www.w3.org/TR/2011/REC-css3-color-20110607/#hsl-color
  var result;

  if (saturation == 0) {
    var partialHex = decToHex(lightness * 255);
    result = partialHex + partialHex + partialHex;
  }
  else {
    var m2 = lightness <= 0.5 ? lightness * (saturation + 1) : lightness + saturation - lightness * saturation,
      m1 = lightness * 2 - m2;
    result =
      hueToRgb(m1, m2, hue * 6 + 2) +
      hueToRgb(m1, m2, hue * 6) +
      hueToRgb(m1, m2, hue * 6 - 2);
  }

  return "#" + result;
}

/**
 * Converts an HSL color to a hexadecimal RGB color. This function will correct the lightness for the "dark" hues
 * @param {number} hue  Hue in range [0, 1]
 * @param {number} saturation  Saturation in range [0, 1]
 * @param {number} lightness  Lightness in range [0, 1]
 * @returns {string}
 */
function correctedHsl(hue, saturation, lightness) {
  // The corrector specifies the perceived middle lightness for each hue
  var correctors = [0.55, 0.5, 0.5, 0.46, 0.6, 0.55, 0.55],
    corrector = correctors[(hue * 6 + 0.5) | 0];

  // Adjust the input lightness relative to the corrector
  lightness = lightness < 0.5 ? lightness * corrector * 2 : corrector + (lightness - 0.5) * (1 - corrector) * 2;

  return hsl(hue, saturation, lightness);
}

/**
 * Gets a set of identicon color candidates for a specified hue and config.
 * @param {number} hue
 * @param {ParsedConfiguration} config
 */
function colorTheme(hue, config) {
  hue = config.X/*hue*/(hue);
  return [
    // Dark gray
    correctedHsl(hue, config.F/*grayscaleSaturation*/, config.G/*grayscaleLightness*/(0)),
    // Mid color
    correctedHsl(hue, config.o/*colorSaturation*/, config.p/*colorLightness*/(0.5)),
    // Light gray
    correctedHsl(hue, config.F/*grayscaleSaturation*/, config.G/*grayscaleLightness*/(1)),
    // Light color
    correctedHsl(hue, config.o/*colorSaturation*/, config.p/*colorLightness*/(1)),
    // Dark color
    correctedHsl(hue, config.o/*colorSaturation*/, config.p/*colorLightness*/(0))
  ];
}

/**
 * Parses a substring of the hash as a number.
 * @param {number} startPosition 
 * @param {number=} octets
 */
function parseHex(hash, startPosition, octets) {
  return parseInt(hash.substr(startPosition, octets), 16);
}

/**
 * Computes a hash for the specified value. Currently SHA1 is used. This function
 * always returns a valid hash.
 */
function computeHash(value) {
  return sha1(value == null ? "" : "" + value);
}

/**
 * Inputs a value that might be a valid hash string for Jdenticon and returns it 
 * if it is determined valid, otherwise a falsy value is returned.
 */
function isValidHash(hashCandidate) {
  return /^[0-9a-f]{11,}$/i.test(hashCandidate) && hashCandidate;
}

export const JDENTICON_CONFIG = {
  lightness: {
    color: 0.57,
    grayscale: [0.47, 0.58]
  },
  saturation: {
    color: 1.00,
    grayscale: 0.42
  },
  backColor: '#12121bff',
};

/**
 * @param {string} color  Color value to parse. Currently hexadecimal strings on the format #rgb[a] and #rrggbb[aa] are supported.
 * @returns {string}
 */
function parseColor(color) {
  if (/^#[0-9a-f]{3,8}$/i.test(color)) {
    var result;
    var colorLength = color.length;

    if (colorLength < 6) {
      var r = color[1],
        g = color[2],
        b = color[3],
        a = color[4] || "";
      result = "#" + r + r + g + g + b + b + a + a;
    }
    if (colorLength == 7 || colorLength > 8) {
      result = color;
    }

    return result;
  }
}

/**
 * Gets the normalized current Jdenticon color configuration. Missing fields have default values.
 * @param {Object|number|undefined} paddingOrLocalConfig - Configuration passed to the called API method. A
 *    local configuration overrides the global configuration in it entirety. This parameter can for backward
 *    compatibility also contain a padding value. A padding value only overrides the global padding, not the
 *    entire global configuration.
 * @param {number} defaultPadding - Padding used if no padding is specified in neither the configuration nor
 *    explicitly to the API method.
 * @returns {ParsedConfiguration}
 */
function getConfiguration(paddingOrLocalConfig, defaultPadding) {
  var configObject =
    typeof paddingOrLocalConfig == "object" && paddingOrLocalConfig ||
    rootConfigurationHolder[CONFIG_PROPERTIES.n/*MODULE*/] ||
    GLOBAL[CONFIG_PROPERTIES.W/*GLOBAL*/] ||
    {},

    lightnessConfig = configObject["lightness"] || {},

    // In versions < 2.1.0 there was no grayscale saturation -
    // saturation was the color saturation.
    saturation = configObject["saturation"] || {},
    colorSaturation = "color" in saturation ? saturation["color"] : saturation,
    grayscaleSaturation = saturation["grayscale"],

    backColor = configObject["backColor"],
    padding = configObject["padding"];

  /**
   * Creates a lightness range.
   */
  function lightness(configName, defaultRange) {
    var range = lightnessConfig[configName];

    // Check if the lightness range is an array-like object. This way we ensure the
    // array contain two values at the same time.
    if (!(range && range.length > 1)) {
      range = defaultRange;
    }

    /**
     * Gets a lightness relative the specified value in the specified lightness range.
     */
    return function (value) {
      value = range[0] + value * (range[1] - range[0]);
      return value < 0 ? 0 : value > 1 ? 1 : value;
    };
  }

  /**
   * Gets a hue allowed by the configured hue restriction,
   * provided the originally computed hue.
   */
  function hueFunction(originalHue) {
    var hueConfig = configObject["hues"];
    var hue;

    // Check if 'hues' is an array-like object. This way we also ensure that
    // the array is not empty, which would mean no hue restriction.
    if (hueConfig && hueConfig.length > 0) {
      // originalHue is in the range [0, 1]
      // Multiply with 0.999 to change the range to [0, 1) and then truncate the index.
      hue = hueConfig[0 | (0.999 * originalHue * hueConfig.length)];
    }

    return typeof hue == "number" ?

      // A hue was specified. We need to convert the hue from
      // degrees on any turn - e.g. 746° is a perfectly valid hue -
      // to turns in the range [0, 1).
      ((((hue / 360) % 1) + 1) % 1) :

      // No hue configured => use original hue
      originalHue;
  }

  return {
    X/*hue*/: hueFunction,
    o/*colorSaturation*/: typeof colorSaturation == "number" ? colorSaturation : 0.5,
    F/*grayscaleSaturation*/: typeof grayscaleSaturation == "number" ? grayscaleSaturation : 0,
    p/*colorLightness*/: lightness("color", [0.4, 0.8]),
    G/*grayscaleLightness*/: lightness("grayscale", [0.3, 0.9]),
    H/*backColor*/: parseColor(backColor),
    Y/*iconPadding*/:
      typeof paddingOrLocalConfig == "number" ? paddingOrLocalConfig :
        typeof padding == "number" ? padding :
          defaultPadding
  }
}

export const getAddressColor = (hashOrValue) => {
  const hash = isValidHash(hashOrValue) || computeHash(hashOrValue);
  const hue = parseHex(hash, -7) / 0xfffffff
  var parsedConfig = getConfiguration(JDENTICON_CONFIG, 0.08);
  return colorTheme(hue, parsedConfig)[4] // Pick dark color
}

export default {
  getAddressColor,
};
