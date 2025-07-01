var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// .wrangler/tmp/pages-rwWFOq/functionsWorker-0.24779590532619333.mjs
var __create = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __require2 = /* @__PURE__ */ ((x) => typeof __require !== "undefined" ? __require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: /* @__PURE__ */ __name((a, b) => (typeof __require !== "undefined" ? __require : a)[b], "get")
}) : x)(function(x) {
  if (typeof __require !== "undefined") return __require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = /* @__PURE__ */ __name((fn, res) => /* @__PURE__ */ __name(function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
}, "__init"), "__esm");
var __commonJS = /* @__PURE__ */ __name((cb, mod) => /* @__PURE__ */ __name(function __require22() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
}, "__require2"), "__commonJS");
var __copyProps = /* @__PURE__ */ __name((to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp2(to, key, { get: /* @__PURE__ */ __name(() => from[key], "get"), enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
}, "__copyProps");
var __toESM = /* @__PURE__ */ __name((mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
  mod
)), "__toESM");
var require_bcrypt = __commonJS({
  "../node_modules/bcryptjs/dist/bcrypt.js"(exports, module) {
    init_functionsRoutes_0_2579771843798755();
    (function(global, factory) {
      if (typeof define === "function" && define["amd"])
        define([], factory);
      else if (typeof __require2 === "function" && typeof module === "object" && module && module["exports"])
        module["exports"] = factory();
      else
        (global["dcodeIO"] = global["dcodeIO"] || {})["bcrypt"] = factory();
    })(exports, function() {
      "use strict";
      var bcrypt2 = {};
      var randomFallback = null;
      function random(len) {
        if (typeof module !== "undefined" && module && module["exports"])
          try {
            return __require2("crypto")["randomBytes"](len);
          } catch (e) {
          }
        try {
          var a;
          (self["crypto"] || self["msCrypto"])["getRandomValues"](a = new Uint32Array(len));
          return Array.prototype.slice.call(a);
        } catch (e) {
        }
        if (!randomFallback)
          throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
        return randomFallback(len);
      }
      __name(random, "random");
      __name2(random, "random");
      var randomAvailable = false;
      try {
        random(1);
        randomAvailable = true;
      } catch (e) {
      }
      randomFallback = null;
      bcrypt2.setRandomFallback = function(random2) {
        randomFallback = random2;
      };
      bcrypt2.genSaltSync = function(rounds, seed_length) {
        rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof rounds !== "number")
          throw Error("Illegal arguments: " + typeof rounds + ", " + typeof seed_length);
        if (rounds < 4)
          rounds = 4;
        else if (rounds > 31)
          rounds = 31;
        var salt = [];
        salt.push("$2a$");
        if (rounds < 10)
          salt.push("0");
        salt.push(rounds.toString());
        salt.push("$");
        salt.push(base64_encode(random(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
        return salt.join("");
      };
      bcrypt2.genSalt = function(rounds, seed_length, callback) {
        if (typeof seed_length === "function")
          callback = seed_length, seed_length = void 0;
        if (typeof rounds === "function")
          callback = rounds, rounds = void 0;
        if (typeof rounds === "undefined")
          rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
        else if (typeof rounds !== "number")
          throw Error("illegal arguments: " + typeof rounds);
        function _async(callback2) {
          nextTick(function() {
            try {
              callback2(null, bcrypt2.genSaltSync(rounds));
            } catch (err) {
              callback2(err);
            }
          });
        }
        __name(_async, "_async");
        __name2(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt2.hashSync = function(s, salt) {
        if (typeof salt === "undefined")
          salt = GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof salt === "number")
          salt = bcrypt2.genSaltSync(salt);
        if (typeof s !== "string" || typeof salt !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof salt);
        return _hash(s, salt);
      };
      bcrypt2.hash = function(s, salt, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s === "string" && typeof salt === "number")
            bcrypt2.genSalt(salt, function(err, salt2) {
              _hash(s, salt2, callback2, progressCallback);
            });
          else if (typeof s === "string" && typeof salt === "string")
            _hash(s, salt, callback2, progressCallback);
          else
            nextTick(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof salt)));
        }
        __name(_async, "_async");
        __name2(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      function safeStringCompare(known, unknown) {
        var right = 0, wrong = 0;
        for (var i = 0, k = known.length; i < k; ++i) {
          if (known.charCodeAt(i) === unknown.charCodeAt(i))
            ++right;
          else
            ++wrong;
        }
        if (right < 0)
          return false;
        return wrong === 0;
      }
      __name(safeStringCompare, "safeStringCompare");
      __name2(safeStringCompare, "safeStringCompare");
      bcrypt2.compareSync = function(s, hash) {
        if (typeof s !== "string" || typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof hash);
        if (hash.length !== 60)
          return false;
        return safeStringCompare(bcrypt2.hashSync(s, hash.substr(0, hash.length - 31)), hash);
      };
      bcrypt2.compare = function(s, hash, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s !== "string" || typeof hash !== "string") {
            nextTick(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof hash)));
            return;
          }
          if (hash.length !== 60) {
            nextTick(callback2.bind(this, null, false));
            return;
          }
          bcrypt2.hash(s, hash.substr(0, 29), function(err, comp) {
            if (err)
              callback2(err);
            else
              callback2(null, safeStringCompare(comp, hash));
          }, progressCallback);
        }
        __name(_async, "_async");
        __name2(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt2.getRounds = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        return parseInt(hash.split("$")[2], 10);
      };
      bcrypt2.getSalt = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        if (hash.length !== 60)
          throw Error("Illegal hash length: " + hash.length + " != 60");
        return hash.substring(0, 29);
      };
      var nextTick = typeof process !== "undefined" && process && typeof process.nextTick === "function" ? typeof setImmediate === "function" ? setImmediate : process.nextTick : setTimeout;
      function stringToBytes(str) {
        var out = [], i = 0;
        utfx.encodeUTF16toUTF8(function() {
          if (i >= str.length) return null;
          return str.charCodeAt(i++);
        }, function(b) {
          out.push(b);
        });
        return out;
      }
      __name(stringToBytes, "stringToBytes");
      __name2(stringToBytes, "stringToBytes");
      var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
      var BASE64_INDEX = [
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        0,
        1,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        -1,
        -1,
        -1,
        -1,
        -1
      ];
      var stringFromCharCode = String.fromCharCode;
      function base64_encode(b, len) {
        var off = 0, rs = [], c1, c2;
        if (len <= 0 || len > b.length)
          throw Error("Illegal len: " + len);
        while (off < len) {
          c1 = b[off++] & 255;
          rs.push(BASE64_CODE[c1 >> 2 & 63]);
          c1 = (c1 & 3) << 4;
          if (off >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off++] & 255;
          c1 |= c2 >> 4 & 15;
          rs.push(BASE64_CODE[c1 & 63]);
          c1 = (c2 & 15) << 2;
          if (off >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off++] & 255;
          c1 |= c2 >> 6 & 3;
          rs.push(BASE64_CODE[c1 & 63]);
          rs.push(BASE64_CODE[c2 & 63]);
        }
        return rs.join("");
      }
      __name(base64_encode, "base64_encode");
      __name2(base64_encode, "base64_encode");
      function base64_decode(s, len) {
        var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
        if (len <= 0)
          throw Error("Illegal len: " + len);
        while (off < slen - 1 && olen < len) {
          code = s.charCodeAt(off++);
          c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          code = s.charCodeAt(off++);
          c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c1 == -1 || c2 == -1)
            break;
          o = c1 << 2 >>> 0;
          o |= (c2 & 48) >> 4;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off >= slen)
            break;
          code = s.charCodeAt(off++);
          c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c3 == -1)
            break;
          o = (c2 & 15) << 4 >>> 0;
          o |= (c3 & 60) >> 2;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off >= slen)
            break;
          code = s.charCodeAt(off++);
          c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          o = (c3 & 3) << 6 >>> 0;
          o |= c4;
          rs.push(stringFromCharCode(o));
          ++olen;
        }
        var res = [];
        for (off = 0; off < olen; off++)
          res.push(rs[off].charCodeAt(0));
        return res;
      }
      __name(base64_decode, "base64_decode");
      __name2(base64_decode, "base64_decode");
      var utfx = function() {
        "use strict";
        var utfx2 = {};
        utfx2.MAX_CODEPOINT = 1114111;
        utfx2.encodeUTF8 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = /* @__PURE__ */ __name2(function() {
              return null;
            }, "src");
          while (cp !== null || (cp = src()) !== null) {
            if (cp < 128)
              dst(cp & 127);
            else if (cp < 2048)
              dst(cp >> 6 & 31 | 192), dst(cp & 63 | 128);
            else if (cp < 65536)
              dst(cp >> 12 & 15 | 224), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            else
              dst(cp >> 18 & 7 | 240), dst(cp >> 12 & 63 | 128), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            cp = null;
          }
        };
        utfx2.decodeUTF8 = function(src, dst) {
          var a, b, c, d, fail = /* @__PURE__ */ __name2(function(b2) {
            b2 = b2.slice(0, b2.indexOf(null));
            var err = Error(b2.toString());
            err.name = "TruncatedError";
            err["bytes"] = b2;
            throw err;
          }, "fail");
          while ((a = src()) !== null) {
            if ((a & 128) === 0)
              dst(a);
            else if ((a & 224) === 192)
              (b = src()) === null && fail([a, b]), dst((a & 31) << 6 | b & 63);
            else if ((a & 240) === 224)
              ((b = src()) === null || (c = src()) === null) && fail([a, b, c]), dst((a & 15) << 12 | (b & 63) << 6 | c & 63);
            else if ((a & 248) === 240)
              ((b = src()) === null || (c = src()) === null || (d = src()) === null) && fail([a, b, c, d]), dst((a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63);
            else throw RangeError("Illegal starting byte: " + a);
          }
        };
        utfx2.UTF16toUTF8 = function(src, dst) {
          var c1, c2 = null;
          while (true) {
            if ((c1 = c2 !== null ? c2 : src()) === null)
              break;
            if (c1 >= 55296 && c1 <= 57343) {
              if ((c2 = src()) !== null) {
                if (c2 >= 56320 && c2 <= 57343) {
                  dst((c1 - 55296) * 1024 + c2 - 56320 + 65536);
                  c2 = null;
                  continue;
                }
              }
            }
            dst(c1);
          }
          if (c2 !== null) dst(c2);
        };
        utfx2.UTF8toUTF16 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = /* @__PURE__ */ __name2(function() {
              return null;
            }, "src");
          while (cp !== null || (cp = src()) !== null) {
            if (cp <= 65535)
              dst(cp);
            else
              cp -= 65536, dst((cp >> 10) + 55296), dst(cp % 1024 + 56320);
            cp = null;
          }
        };
        utfx2.encodeUTF16toUTF8 = function(src, dst) {
          utfx2.UTF16toUTF8(src, function(cp) {
            utfx2.encodeUTF8(cp, dst);
          });
        };
        utfx2.decodeUTF8toUTF16 = function(src, dst) {
          utfx2.decodeUTF8(src, function(cp) {
            utfx2.UTF8toUTF16(cp, dst);
          });
        };
        utfx2.calculateCodePoint = function(cp) {
          return cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
        };
        utfx2.calculateUTF8 = function(src) {
          var cp, l = 0;
          while ((cp = src()) !== null)
            l += utfx2.calculateCodePoint(cp);
          return l;
        };
        utfx2.calculateUTF16asUTF8 = function(src) {
          var n = 0, l = 0;
          utfx2.UTF16toUTF8(src, function(cp) {
            ++n;
            l += utfx2.calculateCodePoint(cp);
          });
          return [n, l];
        };
        return utfx2;
      }();
      Date.now = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      var BCRYPT_SALT_LEN = 16;
      var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
      var BLOWFISH_NUM_ROUNDS = 16;
      var MAX_EXECUTION_TIME = 100;
      var P_ORIG = [
        608135816,
        2242054355,
        320440878,
        57701188,
        2752067618,
        698298832,
        137296536,
        3964562569,
        1160258022,
        953160567,
        3193202383,
        887688300,
        3232508343,
        3380367581,
        1065670069,
        3041331479,
        2450970073,
        2306472731
      ];
      var S_ORIG = [
        3509652390,
        2564797868,
        805139163,
        3491422135,
        3101798381,
        1780907670,
        3128725573,
        4046225305,
        614570311,
        3012652279,
        134345442,
        2240740374,
        1667834072,
        1901547113,
        2757295779,
        4103290238,
        227898511,
        1921955416,
        1904987480,
        2182433518,
        2069144605,
        3260701109,
        2620446009,
        720527379,
        3318853667,
        677414384,
        3393288472,
        3101374703,
        2390351024,
        1614419982,
        1822297739,
        2954791486,
        3608508353,
        3174124327,
        2024746970,
        1432378464,
        3864339955,
        2857741204,
        1464375394,
        1676153920,
        1439316330,
        715854006,
        3033291828,
        289532110,
        2706671279,
        2087905683,
        3018724369,
        1668267050,
        732546397,
        1947742710,
        3462151702,
        2609353502,
        2950085171,
        1814351708,
        2050118529,
        680887927,
        999245976,
        1800124847,
        3300911131,
        1713906067,
        1641548236,
        4213287313,
        1216130144,
        1575780402,
        4018429277,
        3917837745,
        3693486850,
        3949271944,
        596196993,
        3549867205,
        258830323,
        2213823033,
        772490370,
        2760122372,
        1774776394,
        2652871518,
        566650946,
        4142492826,
        1728879713,
        2882767088,
        1783734482,
        3629395816,
        2517608232,
        2874225571,
        1861159788,
        326777828,
        3124490320,
        2130389656,
        2716951837,
        967770486,
        1724537150,
        2185432712,
        2364442137,
        1164943284,
        2105845187,
        998989502,
        3765401048,
        2244026483,
        1075463327,
        1455516326,
        1322494562,
        910128902,
        469688178,
        1117454909,
        936433444,
        3490320968,
        3675253459,
        1240580251,
        122909385,
        2157517691,
        634681816,
        4142456567,
        3825094682,
        3061402683,
        2540495037,
        79693498,
        3249098678,
        1084186820,
        1583128258,
        426386531,
        1761308591,
        1047286709,
        322548459,
        995290223,
        1845252383,
        2603652396,
        3431023940,
        2942221577,
        3202600964,
        3727903485,
        1712269319,
        422464435,
        3234572375,
        1170764815,
        3523960633,
        3117677531,
        1434042557,
        442511882,
        3600875718,
        1076654713,
        1738483198,
        4213154764,
        2393238008,
        3677496056,
        1014306527,
        4251020053,
        793779912,
        2902807211,
        842905082,
        4246964064,
        1395751752,
        1040244610,
        2656851899,
        3396308128,
        445077038,
        3742853595,
        3577915638,
        679411651,
        2892444358,
        2354009459,
        1767581616,
        3150600392,
        3791627101,
        3102740896,
        284835224,
        4246832056,
        1258075500,
        768725851,
        2589189241,
        3069724005,
        3532540348,
        1274779536,
        3789419226,
        2764799539,
        1660621633,
        3471099624,
        4011903706,
        913787905,
        3497959166,
        737222580,
        2514213453,
        2928710040,
        3937242737,
        1804850592,
        3499020752,
        2949064160,
        2386320175,
        2390070455,
        2415321851,
        4061277028,
        2290661394,
        2416832540,
        1336762016,
        1754252060,
        3520065937,
        3014181293,
        791618072,
        3188594551,
        3933548030,
        2332172193,
        3852520463,
        3043980520,
        413987798,
        3465142937,
        3030929376,
        4245938359,
        2093235073,
        3534596313,
        375366246,
        2157278981,
        2479649556,
        555357303,
        3870105701,
        2008414854,
        3344188149,
        4221384143,
        3956125452,
        2067696032,
        3594591187,
        2921233993,
        2428461,
        544322398,
        577241275,
        1471733935,
        610547355,
        4027169054,
        1432588573,
        1507829418,
        2025931657,
        3646575487,
        545086370,
        48609733,
        2200306550,
        1653985193,
        298326376,
        1316178497,
        3007786442,
        2064951626,
        458293330,
        2589141269,
        3591329599,
        3164325604,
        727753846,
        2179363840,
        146436021,
        1461446943,
        4069977195,
        705550613,
        3059967265,
        3887724982,
        4281599278,
        3313849956,
        1404054877,
        2845806497,
        146425753,
        1854211946,
        1266315497,
        3048417604,
        3681880366,
        3289982499,
        290971e4,
        1235738493,
        2632868024,
        2414719590,
        3970600049,
        1771706367,
        1449415276,
        3266420449,
        422970021,
        1963543593,
        2690192192,
        3826793022,
        1062508698,
        1531092325,
        1804592342,
        2583117782,
        2714934279,
        4024971509,
        1294809318,
        4028980673,
        1289560198,
        2221992742,
        1669523910,
        35572830,
        157838143,
        1052438473,
        1016535060,
        1802137761,
        1753167236,
        1386275462,
        3080475397,
        2857371447,
        1040679964,
        2145300060,
        2390574316,
        1461121720,
        2956646967,
        4031777805,
        4028374788,
        33600511,
        2920084762,
        1018524850,
        629373528,
        3691585981,
        3515945977,
        2091462646,
        2486323059,
        586499841,
        988145025,
        935516892,
        3367335476,
        2599673255,
        2839830854,
        265290510,
        3972581182,
        2759138881,
        3795373465,
        1005194799,
        847297441,
        406762289,
        1314163512,
        1332590856,
        1866599683,
        4127851711,
        750260880,
        613907577,
        1450815602,
        3165620655,
        3734664991,
        3650291728,
        3012275730,
        3704569646,
        1427272223,
        778793252,
        1343938022,
        2676280711,
        2052605720,
        1946737175,
        3164576444,
        3914038668,
        3967478842,
        3682934266,
        1661551462,
        3294938066,
        4011595847,
        840292616,
        3712170807,
        616741398,
        312560963,
        711312465,
        1351876610,
        322626781,
        1910503582,
        271666773,
        2175563734,
        1594956187,
        70604529,
        3617834859,
        1007753275,
        1495573769,
        4069517037,
        2549218298,
        2663038764,
        504708206,
        2263041392,
        3941167025,
        2249088522,
        1514023603,
        1998579484,
        1312622330,
        694541497,
        2582060303,
        2151582166,
        1382467621,
        776784248,
        2618340202,
        3323268794,
        2497899128,
        2784771155,
        503983604,
        4076293799,
        907881277,
        423175695,
        432175456,
        1378068232,
        4145222326,
        3954048622,
        3938656102,
        3820766613,
        2793130115,
        2977904593,
        26017576,
        3274890735,
        3194772133,
        1700274565,
        1756076034,
        4006520079,
        3677328699,
        720338349,
        1533947780,
        354530856,
        688349552,
        3973924725,
        1637815568,
        332179504,
        3949051286,
        53804574,
        2852348879,
        3044236432,
        1282449977,
        3583942155,
        3416972820,
        4006381244,
        1617046695,
        2628476075,
        3002303598,
        1686838959,
        431878346,
        2686675385,
        1700445008,
        1080580658,
        1009431731,
        832498133,
        3223435511,
        2605976345,
        2271191193,
        2516031870,
        1648197032,
        4164389018,
        2548247927,
        300782431,
        375919233,
        238389289,
        3353747414,
        2531188641,
        2019080857,
        1475708069,
        455242339,
        2609103871,
        448939670,
        3451063019,
        1395535956,
        2413381860,
        1841049896,
        1491858159,
        885456874,
        4264095073,
        4001119347,
        1565136089,
        3898914787,
        1108368660,
        540939232,
        1173283510,
        2745871338,
        3681308437,
        4207628240,
        3343053890,
        4016749493,
        1699691293,
        1103962373,
        3625875870,
        2256883143,
        3830138730,
        1031889488,
        3479347698,
        1535977030,
        4236805024,
        3251091107,
        2132092099,
        1774941330,
        1199868427,
        1452454533,
        157007616,
        2904115357,
        342012276,
        595725824,
        1480756522,
        206960106,
        497939518,
        591360097,
        863170706,
        2375253569,
        3596610801,
        1814182875,
        2094937945,
        3421402208,
        1082520231,
        3463918190,
        2785509508,
        435703966,
        3908032597,
        1641649973,
        2842273706,
        3305899714,
        1510255612,
        2148256476,
        2655287854,
        3276092548,
        4258621189,
        236887753,
        3681803219,
        274041037,
        1734335097,
        3815195456,
        3317970021,
        1899903192,
        1026095262,
        4050517792,
        356393447,
        2410691914,
        3873677099,
        3682840055,
        3913112168,
        2491498743,
        4132185628,
        2489919796,
        1091903735,
        1979897079,
        3170134830,
        3567386728,
        3557303409,
        857797738,
        1136121015,
        1342202287,
        507115054,
        2535736646,
        337727348,
        3213592640,
        1301675037,
        2528481711,
        1895095763,
        1721773893,
        3216771564,
        62756741,
        2142006736,
        835421444,
        2531993523,
        1442658625,
        3659876326,
        2882144922,
        676362277,
        1392781812,
        170690266,
        3921047035,
        1759253602,
        3611846912,
        1745797284,
        664899054,
        1329594018,
        3901205900,
        3045908486,
        2062866102,
        2865634940,
        3543621612,
        3464012697,
        1080764994,
        553557557,
        3656615353,
        3996768171,
        991055499,
        499776247,
        1265440854,
        648242737,
        3940784050,
        980351604,
        3713745714,
        1749149687,
        3396870395,
        4211799374,
        3640570775,
        1161844396,
        3125318951,
        1431517754,
        545492359,
        4268468663,
        3499529547,
        1437099964,
        2702547544,
        3433638243,
        2581715763,
        2787789398,
        1060185593,
        1593081372,
        2418618748,
        4260947970,
        69676912,
        2159744348,
        86519011,
        2512459080,
        3838209314,
        1220612927,
        3339683548,
        133810670,
        1090789135,
        1078426020,
        1569222167,
        845107691,
        3583754449,
        4072456591,
        1091646820,
        628848692,
        1613405280,
        3757631651,
        526609435,
        236106946,
        48312990,
        2942717905,
        3402727701,
        1797494240,
        859738849,
        992217954,
        4005476642,
        2243076622,
        3870952857,
        3732016268,
        765654824,
        3490871365,
        2511836413,
        1685915746,
        3888969200,
        1414112111,
        2273134842,
        3281911079,
        4080962846,
        172450625,
        2569994100,
        980381355,
        4109958455,
        2819808352,
        2716589560,
        2568741196,
        3681446669,
        3329971472,
        1835478071,
        660984891,
        3704678404,
        4045999559,
        3422617507,
        3040415634,
        1762651403,
        1719377915,
        3470491036,
        2693910283,
        3642056355,
        3138596744,
        1364962596,
        2073328063,
        1983633131,
        926494387,
        3423689081,
        2150032023,
        4096667949,
        1749200295,
        3328846651,
        309677260,
        2016342300,
        1779581495,
        3079819751,
        111262694,
        1274766160,
        443224088,
        298511866,
        1025883608,
        3806446537,
        1145181785,
        168956806,
        3641502830,
        3584813610,
        1689216846,
        3666258015,
        3200248200,
        1692713982,
        2646376535,
        4042768518,
        1618508792,
        1610833997,
        3523052358,
        4130873264,
        2001055236,
        3610705100,
        2202168115,
        4028541809,
        2961195399,
        1006657119,
        2006996926,
        3186142756,
        1430667929,
        3210227297,
        1314452623,
        4074634658,
        4101304120,
        2273951170,
        1399257539,
        3367210612,
        3027628629,
        1190975929,
        2062231137,
        2333990788,
        2221543033,
        2438960610,
        1181637006,
        548689776,
        2362791313,
        3372408396,
        3104550113,
        3145860560,
        296247880,
        1970579870,
        3078560182,
        3769228297,
        1714227617,
        3291629107,
        3898220290,
        166772364,
        1251581989,
        493813264,
        448347421,
        195405023,
        2709975567,
        677966185,
        3703036547,
        1463355134,
        2715995803,
        1338867538,
        1343315457,
        2802222074,
        2684532164,
        233230375,
        2599980071,
        2000651841,
        3277868038,
        1638401717,
        4028070440,
        3237316320,
        6314154,
        819756386,
        300326615,
        590932579,
        1405279636,
        3267499572,
        3150704214,
        2428286686,
        3959192993,
        3461946742,
        1862657033,
        1266418056,
        963775037,
        2089974820,
        2263052895,
        1917689273,
        448879540,
        3550394620,
        3981727096,
        150775221,
        3627908307,
        1303187396,
        508620638,
        2975983352,
        2726630617,
        1817252668,
        1876281319,
        1457606340,
        908771278,
        3720792119,
        3617206836,
        2455994898,
        1729034894,
        1080033504,
        976866871,
        3556439503,
        2881648439,
        1522871579,
        1555064734,
        1336096578,
        3548522304,
        2579274686,
        3574697629,
        3205460757,
        3593280638,
        3338716283,
        3079412587,
        564236357,
        2993598910,
        1781952180,
        1464380207,
        3163844217,
        3332601554,
        1699332808,
        1393555694,
        1183702653,
        3581086237,
        1288719814,
        691649499,
        2847557200,
        2895455976,
        3193889540,
        2717570544,
        1781354906,
        1676643554,
        2592534050,
        3230253752,
        1126444790,
        2770207658,
        2633158820,
        2210423226,
        2615765581,
        2414155088,
        3127139286,
        673620729,
        2805611233,
        1269405062,
        4015350505,
        3341807571,
        4149409754,
        1057255273,
        2012875353,
        2162469141,
        2276492801,
        2601117357,
        993977747,
        3918593370,
        2654263191,
        753973209,
        36408145,
        2530585658,
        25011837,
        3520020182,
        2088578344,
        530523599,
        2918365339,
        1524020338,
        1518925132,
        3760827505,
        3759777254,
        1202760957,
        3985898139,
        3906192525,
        674977740,
        4174734889,
        2031300136,
        2019492241,
        3983892565,
        4153806404,
        3822280332,
        352677332,
        2297720250,
        60907813,
        90501309,
        3286998549,
        1016092578,
        2535922412,
        2839152426,
        457141659,
        509813237,
        4120667899,
        652014361,
        1966332200,
        2975202805,
        55981186,
        2327461051,
        676427537,
        3255491064,
        2882294119,
        3433927263,
        1307055953,
        942726286,
        933058658,
        2468411793,
        3933900994,
        4215176142,
        1361170020,
        2001714738,
        2830558078,
        3274259782,
        1222529897,
        1679025792,
        2729314320,
        3714953764,
        1770335741,
        151462246,
        3013232138,
        1682292957,
        1483529935,
        471910574,
        1539241949,
        458788160,
        3436315007,
        1807016891,
        3718408830,
        978976581,
        1043663428,
        3165965781,
        1927990952,
        4200891579,
        2372276910,
        3208408903,
        3533431907,
        1412390302,
        2931980059,
        4132332400,
        1947078029,
        3881505623,
        4168226417,
        2941484381,
        1077988104,
        1320477388,
        886195818,
        18198404,
        3786409e3,
        2509781533,
        112762804,
        3463356488,
        1866414978,
        891333506,
        18488651,
        661792760,
        1628790961,
        3885187036,
        3141171499,
        876946877,
        2693282273,
        1372485963,
        791857591,
        2686433993,
        3759982718,
        3167212022,
        3472953795,
        2716379847,
        445679433,
        3561995674,
        3504004811,
        3574258232,
        54117162,
        3331405415,
        2381918588,
        3769707343,
        4154350007,
        1140177722,
        4074052095,
        668550556,
        3214352940,
        367459370,
        261225585,
        2610173221,
        4209349473,
        3468074219,
        3265815641,
        314222801,
        3066103646,
        3808782860,
        282218597,
        3406013506,
        3773591054,
        379116347,
        1285071038,
        846784868,
        2669647154,
        3771962079,
        3550491691,
        2305946142,
        453669953,
        1268987020,
        3317592352,
        3279303384,
        3744833421,
        2610507566,
        3859509063,
        266596637,
        3847019092,
        517658769,
        3462560207,
        3443424879,
        370717030,
        4247526661,
        2224018117,
        4143653529,
        4112773975,
        2788324899,
        2477274417,
        1456262402,
        2901442914,
        1517677493,
        1846949527,
        2295493580,
        3734397586,
        2176403920,
        1280348187,
        1908823572,
        3871786941,
        846861322,
        1172426758,
        3287448474,
        3383383037,
        1655181056,
        3139813346,
        901632758,
        1897031941,
        2986607138,
        3066810236,
        3447102507,
        1393639104,
        373351379,
        950779232,
        625454576,
        3124240540,
        4148612726,
        2007998917,
        544563296,
        2244738638,
        2330496472,
        2058025392,
        1291430526,
        424198748,
        50039436,
        29584100,
        3605783033,
        2429876329,
        2791104160,
        1057563949,
        3255363231,
        3075367218,
        3463963227,
        1469046755,
        985887462
      ];
      var C_ORIG = [
        1332899944,
        1700884034,
        1701343084,
        1684370003,
        1668446532,
        1869963892
      ];
      function _encipher(lr, off, P, S) {
        var n, l = lr[off], r = lr[off + 1];
        l ^= P[0];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[1];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[2];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[3];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[4];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[5];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[6];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[7];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[8];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[9];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[10];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[11];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[12];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[13];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[14];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[15];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[16];
        lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
        lr[off + 1] = l;
        return lr;
      }
      __name(_encipher, "_encipher");
      __name2(_encipher, "_encipher");
      function _streamtoword(data, offp) {
        for (var i = 0, word = 0; i < 4; ++i)
          word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
        return { key: word, offp };
      }
      __name(_streamtoword, "_streamtoword");
      __name2(_streamtoword, "_streamtoword");
      function _key(key, P, S) {
        var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
        for (i = 0; i < plen; i += 2)
          lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_key, "_key");
      __name2(_key, "_key");
      function _ekskey(data, key, P, S) {
        var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
        offp = 0;
        for (i = 0; i < plen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_ekskey, "_ekskey");
      __name2(_ekskey, "_ekskey");
      function _crypt(b, salt, rounds, callback, progressCallback) {
        var cdata = C_ORIG.slice(), clen = cdata.length, err;
        if (rounds < 4 || rounds > 31) {
          err = Error("Illegal number of rounds (4-31): " + rounds);
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.length !== BCRYPT_SALT_LEN) {
          err = Error("Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN);
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        rounds = 1 << rounds >>> 0;
        var P, S, i = 0, j;
        if (Int32Array) {
          P = new Int32Array(P_ORIG);
          S = new Int32Array(S_ORIG);
        } else {
          P = P_ORIG.slice();
          S = S_ORIG.slice();
        }
        _ekskey(salt, b, P, S);
        function next() {
          if (progressCallback)
            progressCallback(i / rounds);
          if (i < rounds) {
            var start = Date.now();
            for (; i < rounds; ) {
              i = i + 1;
              _key(b, P, S);
              _key(salt, P, S);
              if (Date.now() - start > MAX_EXECUTION_TIME)
                break;
            }
          } else {
            for (i = 0; i < 64; i++)
              for (j = 0; j < clen >> 1; j++)
                _encipher(cdata, j << 1, P, S);
            var ret = [];
            for (i = 0; i < clen; i++)
              ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
            if (callback) {
              callback(null, ret);
              return;
            } else
              return ret;
          }
          if (callback)
            nextTick(next);
        }
        __name(next, "next");
        __name2(next, "next");
        if (typeof callback !== "undefined") {
          next();
        } else {
          var res;
          while (true)
            if (typeof (res = next()) !== "undefined")
              return res || [];
        }
      }
      __name(_crypt, "_crypt");
      __name2(_crypt, "_crypt");
      function _hash(s, salt, callback, progressCallback) {
        var err;
        if (typeof s !== "string" || typeof salt !== "string") {
          err = Error("Invalid string / salt: Not a string");
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var minor, offset;
        if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
          err = Error("Invalid salt version: " + salt.substring(0, 2));
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.charAt(2) === "$")
          minor = String.fromCharCode(0), offset = 3;
        else {
          minor = salt.charAt(2);
          if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
            err = Error("Invalid salt revision: " + salt.substring(2, 4));
            if (callback) {
              nextTick(callback.bind(this, err));
              return;
            } else
              throw err;
          }
          offset = 4;
        }
        if (salt.charAt(offset + 2) > "$") {
          err = Error("Missing salt rounds");
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
        s += minor >= "a" ? "\0" : "";
        var passwordb = stringToBytes(s), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
        function finish(bytes) {
          var res = [];
          res.push("$2");
          if (minor >= "a")
            res.push(minor);
          res.push("$");
          if (rounds < 10)
            res.push("0");
          res.push(rounds.toString());
          res.push("$");
          res.push(base64_encode(saltb, saltb.length));
          res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
          return res.join("");
        }
        __name(finish, "finish");
        __name2(finish, "finish");
        if (typeof callback == "undefined")
          return finish(_crypt(passwordb, saltb, rounds));
        else {
          _crypt(passwordb, saltb, rounds, function(err2, bytes) {
            if (err2)
              callback(err2, null);
            else
              callback(null, finish(bytes));
          }, progressCallback);
        }
      }
      __name(_hash, "_hash");
      __name2(_hash, "_hash");
      bcrypt2.encodeBase64 = base64_encode;
      bcrypt2.decodeBase64 = base64_decode;
      return bcrypt2;
    });
  }
});
async function generateSessionId() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(generateSessionId, "generateSessionId");
async function hashPassword(password) {
  const saltRounds = 12;
  return await import_bcryptjs.default.hash(password, saltRounds);
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, hash) {
  return await import_bcryptjs.default.compare(password, hash);
}
__name(verifyPassword, "verifyPassword");
function generateUserId() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(generateUserId, "generateUserId");
function createSessionCookie(sessionId, maxAge = 30 * 24 * 60 * 60) {
  return `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`;
}
__name(createSessionCookie, "createSessionCookie");
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
__name(isValidEmail, "isValidEmail");
function isValidPassword(password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}
__name(isValidPassword, "isValidPassword");
function createUserResponse(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    created_at: user.created_at
  };
}
__name(createUserResponse, "createUserResponse");
async function createUser(env, userData) {
  const { username, email, password } = userData;
  if (!username || !email || !password) {
    throw new Error("Username, email, and password are required");
  }
  if (!isValidEmail(email)) {
    throw new Error("Invalid email format");
  }
  if (!isValidPassword(password)) {
    throw new Error("Password must be at least 8 characters with uppercase, lowercase, and number");
  }
  const existingUser = await env.DB.prepare(
    "SELECT id FROM users WHERE email = ? OR username = ?"
  ).bind(email, username).first();
  if (existingUser) {
    throw new Error("User with this email or username already exists");
  }
  const userId = generateUserId();
  const passwordHash = await hashPassword(password);
  const result = await env.DB.prepare(`
    INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(userId, username, email, passwordHash).run();
  if (!result.success) {
    throw new Error("Failed to create user");
  }
  return {
    id: userId,
    username,
    email,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(createUser, "createUser");
async function getUserByEmail(env, email) {
  return await env.DB.prepare(
    "SELECT * FROM users WHERE email = ?"
  ).bind(email).first();
}
__name(getUserByEmail, "getUserByEmail");
async function createSession(env, userId) {
  const sessionId = await generateSessionId();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
  const result = await env.DB.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).bind(sessionId, userId, expiresAt.toISOString()).run();
  if (!result.success) {
    throw new Error("Failed to create session");
  }
  return sessionId;
}
__name(createSession, "createSession");
async function getSessionWithUser(env, sessionId) {
  const result = await env.DB.prepare(`
    SELECT 
      s.id as session_id,
      s.user_id,
      s.expires_at,
      u.id,
      u.username,
      u.email,
      u.created_at as user_created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first();
  if (!result) {
    return null;
  }
  return {
    session: {
      id: result.session_id,
      user_id: result.user_id,
      expires_at: result.expires_at
    },
    user: {
      id: result.id,
      username: result.username,
      email: result.email,
      created_at: result.user_created_at
    }
  };
}
__name(getSessionWithUser, "getSessionWithUser");
var import_bcryptjs;
var init_utils = __esm({
  "auth/utils.js"() {
    init_functionsRoutes_0_2579771843798755();
    import_bcryptjs = __toESM(require_bcrypt(), 1);
    __name2(generateSessionId, "generateSessionId");
    __name2(hashPassword, "hashPassword");
    __name2(verifyPassword, "verifyPassword");
    __name2(generateUserId, "generateUserId");
    __name2(createSessionCookie, "createSessionCookie");
    __name2(isValidEmail, "isValidEmail");
    __name2(isValidPassword, "isValidPassword");
    __name2(createUserResponse, "createUserResponse");
    __name2(createUser, "createUser");
    __name2(getUserByEmail, "getUserByEmail");
    __name2(createSession, "createSession");
    __name2(getSessionWithUser, "getSessionWithUser");
  }
});
async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: "Email and password are required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const user = await getUserByEmail(env, email);
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: "Invalid email or password"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const isValidPassword2 = await verifyPassword(password, user.password_hash);
    if (!isValidPassword2) {
      return new Response(JSON.stringify({
        success: false,
        message: "Invalid email or password"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const sessionId = await createSession(env, user.id);
    const responseData = {
      success: true,
      message: "Login successful",
      user: createUserResponse(user)
    };
    const response = new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": createSessionCookie(sessionId)
      }
    });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Login failed"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost, "onRequestPost");
async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}
__name(onRequestOptions, "onRequestOptions");
var init_login = __esm({
  "api/auth/login.js"() {
    init_functionsRoutes_0_2579771843798755();
    init_utils();
    __name2(onRequestPost, "onRequestPost");
    __name2(onRequestOptions, "onRequestOptions");
  }
});
async function onRequestPost2({ request, env }) {
  try {
    const cookieHeader = request.headers.get("Cookie");
    let sessionId = null;
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
      const sessionCookie = cookies.find((cookie) => cookie.startsWith("session_id="));
      if (sessionCookie) {
        sessionId = sessionCookie.split("=")[1];
      }
    }
    if (sessionId) {
      try {
        const stmt = env.DB.prepare("DELETE FROM sessions WHERE id = ?");
        await stmt.bind(sessionId).run();
      } catch (error) {
        console.error("Error deleting session:", error);
      }
    }
    const response = new Response(JSON.stringify({
      success: true,
      message: "Logout successful"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "session_id=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
      }
    });
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return new Response(JSON.stringify({
      success: true,
      message: "Logout successful"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "session_id=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
      }
    });
  }
}
__name(onRequestPost2, "onRequestPost2");
async function onRequestOptions2({ request }) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}
__name(onRequestOptions2, "onRequestOptions2");
var init_logout = __esm({
  "api/auth/logout.js"() {
    init_functionsRoutes_0_2579771843798755();
    __name2(onRequestPost2, "onRequestPost");
    __name2(onRequestOptions2, "onRequestOptions");
  }
});
async function authenticateRequest(request, env) {
  try {
    const cookieHeader = request.headers.get("Cookie");
    let sessionId = null;
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
      const sessionCookie = cookies.find((cookie) => cookie.startsWith("session_id="));
      if (sessionCookie) {
        sessionId = sessionCookie.split("=")[1];
      }
    }
    if (!sessionId) {
      return null;
    }
    const sessionData = await getSessionWithUser(env, sessionId);
    if (!sessionData) {
      return null;
    }
    return sessionData.user;
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return null;
  }
}
__name(authenticateRequest, "authenticateRequest");
async function requireAuth(request, env) {
  const user = await authenticateRequest(request, env);
  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      message: "Authentication required"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  return user;
}
__name(requireAuth, "requireAuth");
function handleCors() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}
__name(handleCors, "handleCors");
function addCorsHeaders(response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
__name(addCorsHeaders, "addCorsHeaders");
var corsHeaders;
var init_middleware = __esm({
  "auth/middleware.js"() {
    init_functionsRoutes_0_2579771843798755();
    init_utils();
    __name2(authenticateRequest, "authenticateRequest");
    __name2(requireAuth, "requireAuth");
    corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    };
    __name2(handleCors, "handleCors");
    __name2(addCorsHeaders, "addCorsHeaders");
  }
});
async function onRequestGet({ request, env }) {
  try {
    const user = await requireAuth(request, env);
    if (user instanceof Response) {
      return addCorsHeaders(user);
    }
    const response = new Response(JSON.stringify({
      success: true,
      user: createUserResponse(user)
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    return addCorsHeaders(response);
  } catch (error) {
    console.error("Get user profile error:", error);
    const response = new Response(JSON.stringify({
      success: false,
      message: "Failed to get user profile"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
    return addCorsHeaders(response);
  }
}
__name(onRequestGet, "onRequestGet");
async function onRequestOptions3({ request }) {
  return handleCors();
}
__name(onRequestOptions3, "onRequestOptions3");
var init_me = __esm({
  "api/auth/me.js"() {
    init_functionsRoutes_0_2579771843798755();
    init_middleware();
    init_utils();
    __name2(onRequestGet, "onRequestGet");
    __name2(onRequestOptions3, "onRequestOptions");
  }
});
async function onRequestPost3({ request, env }) {
  try {
    const body = await request.json();
    const { username, email, password } = body;
    const user = await createUser(env, { username, email, password });
    const sessionId = await createSession(env, user.id);
    const responseData = {
      success: true,
      message: "User registered successfully",
      user: createUserResponse(user)
    };
    const response = new Response(JSON.stringify(responseData), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": createSessionCookie(sessionId)
      }
    });
    return response;
  } catch (error) {
    console.error("Registration error:", error);
    const errorResponse = {
      success: false,
      message: error.message || "Registration failed"
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
__name(onRequestPost3, "onRequestPost3");
async function onRequestOptions4({ request }) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}
__name(onRequestOptions4, "onRequestOptions4");
var init_register = __esm({
  "api/auth/register.js"() {
    init_functionsRoutes_0_2579771843798755();
    init_utils();
    __name2(onRequestPost3, "onRequestPost");
    __name2(onRequestOptions4, "onRequestOptions");
  }
});
async function onRequestGet2({ request, env }) {
  try {
    const cookieHeader = request.headers.get("Cookie");
    let sessionId = null;
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
      const sessionCookie = cookies.find((cookie) => cookie.startsWith("session_id="));
      if (sessionCookie) {
        sessionId = sessionCookie.split("=")[1];
      }
    }
    if (!sessionId) {
      return new Response(JSON.stringify({
        success: false,
        authenticated: false,
        message: "No session found"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const sessionData = await getSessionWithUser(env, sessionId);
    if (!sessionData) {
      return new Response(JSON.stringify({
        success: false,
        authenticated: false,
        message: "Invalid or expired session"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      authenticated: true,
      user: createUserResponse(sessionData.user)
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return new Response(JSON.stringify({
      success: false,
      authenticated: false,
      message: "Session validation failed"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet2, "onRequestGet2");
async function onRequestOptions5({ request }) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}
__name(onRequestOptions5, "onRequestOptions5");
var init_session = __esm({
  "api/auth/session.js"() {
    init_functionsRoutes_0_2579771843798755();
    init_utils();
    __name2(onRequestGet2, "onRequestGet");
    __name2(onRequestOptions5, "onRequestOptions");
  }
});
async function onRequestOptions6(context) {
  return new Response(null, {
    status: 200,
    headers: addCorsHeaders()
  });
}
__name(onRequestOptions6, "onRequestOptions6");
async function onRequestGet3(context) {
  const { request, env } = context;
  const corsHeaders2 = addCorsHeaders();
  try {
    const url = new URL(request.url);
    const templateId = url.searchParams.get("id");
    const format = url.searchParams.get("format") || "html";
    if (!templateId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Template ID is required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const template = await env.DB.prepare(`
      SELECT id, name, description, form_schema, created_at
      FROM form_templates 
      WHERE id = ?
    `).bind(templateId).first();
    if (!template) {
      return new Response(JSON.stringify({
        success: false,
        message: "Form template not found"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const formSchema = JSON.parse(template.form_schema);
    if (format === "json") {
      return new Response(JSON.stringify({
        success: true,
        data: {
          id: template.id,
          name: template.name,
          description: template.description,
          schema: formSchema,
          created_at: template.created_at
        }
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const htmlForm = generateFormHTML(template, formSchema);
    return new Response(htmlForm, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        ...corsHeaders2
      }
    });
  } catch (error) {
    console.error("Error rendering form:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to render form"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
}
__name(onRequestGet3, "onRequestGet3");
async function onRequestPost4(context) {
  const { request, env } = context;
  const corsHeaders2 = addCorsHeaders();
  try {
    const url = new URL(request.url);
    const templateId = url.searchParams.get("id");
    if (!templateId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Template ID is required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    let submissionData;
    const contentType = request.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const body = await request.json();
      submissionData = body.submission_data || body;
    } else if (contentType && contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      submissionData = {};
      for (const [key, value] of formData.entries()) {
        submissionData[key] = value;
      }
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: "Invalid content type. Use application/json or application/x-www-form-urlencoded"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const template = await env.DB.prepare(`
      SELECT id, form_schema FROM form_templates 
      WHERE id = ?
    `).bind(templateId).first();
    if (!template) {
      return new Response(JSON.stringify({
        success: false,
        message: "Form template not found"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const formSchema = JSON.parse(template.form_schema);
    const validationResult = validateSubmissionData(submissionData, formSchema);
    if (!validationResult.isValid) {
      return new Response(JSON.stringify({
        success: false,
        message: "Invalid form data",
        errors: validationResult.errors
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const submissionId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO form_submissions (id, template_id, submission_data, submitted_at)
      VALUES (?, ?, ?, ?)
    `).bind(
      submissionId,
      templateId,
      JSON.stringify(submissionData),
      now
    ).run();
    return new Response(JSON.stringify({
      success: true,
      message: "Form submitted successfully",
      data: {
        submission_id: submissionId,
        submitted_at: now
      }
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to submit form"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
}
__name(onRequestPost4, "onRequestPost4");
function generateFormHTML(template, formSchema) {
  const fields = formSchema.fields || [];
  let formFields = fields.map((field) => {
    let html = `<div class="form-group">`;
    html += `<label for="${field.name}">${field.label || field.name}`;
    if (field.required) {
      html += ' <span class="required">*</span>';
    }
    html += "</label>";
    switch (field.type) {
      case "text":
      case "email":
      case "url":
      case "tel":
        html += `<input type="${field.type}" id="${field.name}" name="${field.name}" `;
        if (field.placeholder) html += `placeholder="${field.placeholder}" `;
        if (field.required) html += "required ";
        html += "/>";
        break;
      case "number":
        html += `<input type="number" id="${field.name}" name="${field.name}" `;
        if (field.min !== void 0) html += `min="${field.min}" `;
        if (field.max !== void 0) html += `max="${field.max}" `;
        if (field.required) html += "required ";
        html += "/>";
        break;
      case "textarea":
        html += `<textarea id="${field.name}" name="${field.name}" `;
        if (field.placeholder) html += `placeholder="${field.placeholder}" `;
        if (field.required) html += "required ";
        html += "></textarea>";
        break;
      case "select":
        html += `<select id="${field.name}" name="${field.name}" `;
        if (field.required) html += "required ";
        html += ">";
        if (!field.required) {
          html += '<option value="">-- Select an option --</option>';
        }
        if (field.options) {
          field.options.forEach((option) => {
            html += `<option value="${option.value}">${option.label}</option>`;
          });
        }
        html += "</select>";
        break;
      case "checkbox":
        html += `<input type="checkbox" id="${field.name}" name="${field.name}" value="true" `;
        if (field.required) html += "required ";
        html += "/>";
        break;
      case "radio":
        if (field.options) {
          field.options.forEach((option, index) => {
            html += `<div class="radio-option">`;
            html += `<input type="radio" id="${field.name}_${index}" name="${field.name}" value="${option.value}" `;
            if (field.required) html += "required ";
            html += "/>";
            html += `<label for="${field.name}_${index}">${option.label}</label>`;
            html += "</div>";
          });
        }
        break;
      default:
        html += `<input type="text" id="${field.name}" name="${field.name}" `;
        if (field.required) html += "required ";
        html += "/>";
    }
    if (field.description) {
      html += `<small class="field-description">${field.description}</small>`;
    }
    html += "</div>";
    return html;
  }).join("");
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .form-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-bottom: 10px; }
        .description { color: #666; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { 
            display: block; 
            margin-bottom: 5px; 
            font-weight: 500; 
            color: #333;
        }
        .required { color: #e74c3c; }
        input, textarea, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }
        textarea { resize: vertical; min-height: 100px; }
        .radio-option { margin-bottom: 8px; }
        .radio-option input { width: auto; margin-right: 8px; }
        .radio-option label { display: inline; font-weight: normal; }
        input[type="checkbox"] { width: auto; margin-right: 8px; }
        .field-description { 
            display: block; 
            color: #666; 
            font-size: 12px; 
            margin-top: 5px;
        }
        .submit-btn {
            background-color: #007bff;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
        }
        .submit-btn:hover { background-color: #0056b3; }
        .success-message, .error-message {
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .success-message {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error-message {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h1>${template.name}</h1>
        ${template.description ? `<p class="description">${template.description}</p>` : ""}
        
        <form id="dynamicForm" method="POST">
            ${formFields}
            <button type="submit" class="submit-btn">Submit</button>
        </form>
    </div>

    <script>
        document.getElementById('dynamicForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitData = {};
            
            // Convert FormData to object
            for (const [key, value] of formData.entries()) {
                submitData[key] = value;
            }
            
            try {
                const response = await fetch(window.location.href, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ submission_data: submitData })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Show success message
                    const successDiv = document.createElement('div');
                    successDiv.className = 'success-message';
                    successDiv.textContent = 'Form submitted successfully!';
                    this.parentNode.insertBefore(successDiv, this);
                    this.reset();
                } else {
                    throw new Error(result.message || 'Failed to submit form');
                }
            } catch (error) {
                // Show error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = 'Error: ' + error.message;
                this.parentNode.insertBefore(errorDiv, this);
            }
        });
    <\/script>
</body>
</html>`;
}
__name(generateFormHTML, "generateFormHTML");
function validateSubmissionData(submissionData, formSchema) {
  const errors = [];
  try {
    if (!formSchema.fields || !Array.isArray(formSchema.fields)) {
      return { isValid: true, errors: [] };
    }
    for (const field of formSchema.fields) {
      const value = submissionData[field.name];
      if (field.required && (!value || value === "")) {
        errors.push(`${field.label || field.name} is required`);
        continue;
      }
      if (!value || value === "") continue;
      switch (field.type) {
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${field.label || field.name} must be a valid email address`);
          }
          break;
        case "number":
          if (isNaN(Number(value))) {
            errors.push(`${field.label || field.name} must be a valid number`);
          }
          break;
        case "url":
          try {
            new URL(value);
          } catch {
            errors.push(`${field.label || field.name} must be a valid URL`);
          }
          break;
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error("Validation error:", error);
    return { isValid: true, errors: [] };
  }
}
__name(validateSubmissionData, "validateSubmissionData");
var init_render = __esm({
  "api/forms/render.js"() {
    init_functionsRoutes_0_2579771843798755();
    init_middleware();
    __name2(onRequestOptions6, "onRequestOptions");
    __name2(onRequestGet3, "onRequestGet");
    __name2(onRequestPost4, "onRequestPost");
    __name2(generateFormHTML, "generateFormHTML");
    __name2(validateSubmissionData, "validateSubmissionData");
  }
});
async function onRequestOptions7(context) {
  return handleCors();
}
__name(onRequestOptions7, "onRequestOptions7");
async function onRequestGet4(context) {
  const { request, env } = context;
  const corsHeaders2 = addCorsHeaders();
  try {
    const user = await requireAuth(request, env);
    if (user instanceof Response) return user;
    const url = new URL(request.url);
    const templateId = url.searchParams.get("template_id");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    let query = `
      SELECT fs.id, fs.template_id, fs.submission_data, fs.submitted_at,
             ft.name as template_name
      FROM form_submissions fs
      INNER JOIN form_templates ft ON fs.template_id = ft.id
      WHERE ft.user_id = ?
    `;
    let params = [user.id];
    if (templateId) {
      query += ` AND fs.template_id = ?`;
      params.push(templateId);
    }
    query += ` ORDER BY fs.submitted_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const submissions = await env.DB.prepare(query).bind(...params).all();
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM form_submissions fs
      INNER JOIN form_templates ft ON fs.template_id = ft.id
      WHERE ft.user_id = ?
    `;
    let countParams = [user.id];
    if (templateId) {
      countQuery += ` AND fs.template_id = ?`;
      countParams.push(templateId);
    }
    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    const processedSubmissions = (submissions.results || []).map((submission) => ({
      ...submission,
      submission_data: JSON.parse(submission.submission_data)
    }));
    return new Response(JSON.stringify({
      success: true,
      data: {
        submissions: processedSubmissions,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    console.error("Error fetching form submissions:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to fetch form submissions"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
}
__name(onRequestGet4, "onRequestGet4");
async function onRequestPost5(context) {
  const { request, env } = context;
  const corsHeaders2 = addCorsHeaders();
  try {
    const body = await request.json();
    const { template_id, submission_data } = body;
    if (!template_id || !submission_data) {
      return new Response(JSON.stringify({
        success: false,
        message: "Template ID and submission data are required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    if (typeof submission_data !== "object") {
      return new Response(JSON.stringify({
        success: false,
        message: "Submission data must be a valid JSON object"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const template = await env.DB.prepare(`
      SELECT id, form_schema FROM form_templates 
      WHERE id = ?
    `).bind(template_id).first();
    if (!template) {
      return new Response(JSON.stringify({
        success: false,
        message: "Form template not found"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const formSchema = JSON.parse(template.form_schema);
    const validationResult = validateSubmissionData2(submission_data, formSchema);
    if (!validationResult.isValid) {
      return new Response(JSON.stringify({
        success: false,
        message: "Invalid submission data",
        errors: validationResult.errors
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const submissionId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO form_submissions (id, template_id, submission_data, submitted_at)
      VALUES (?, ?, ?, ?)
    `).bind(
      submissionId,
      template_id,
      JSON.stringify(submission_data),
      now
    ).run();
    const submission = await env.DB.prepare(`
      SELECT fs.id, fs.template_id, fs.submission_data, fs.submitted_at,
             ft.name as template_name
      FROM form_submissions fs
      INNER JOIN form_templates ft ON fs.template_id = ft.id
      WHERE fs.id = ?
    `).bind(submissionId).first();
    return new Response(JSON.stringify({
      success: true,
      data: {
        ...submission,
        submission_data: JSON.parse(submission.submission_data)
      }
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    console.error("Error creating form submission:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to create form submission"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
}
__name(onRequestPost5, "onRequestPost5");
async function onRequestDelete(context) {
  const { request, env } = context;
  const corsHeaders2 = addCorsHeaders();
  try {
    const user = await requireAuth(request, env);
    if (user instanceof Response) return user;
    const url = new URL(request.url);
    const submissionId = url.searchParams.get("id");
    if (!submissionId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Submission ID is required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const existingSubmission = await env.DB.prepare(`
      SELECT fs.id 
      FROM form_submissions fs
      INNER JOIN form_templates ft ON fs.template_id = ft.id
      WHERE fs.id = ? AND ft.user_id = ?
    `).bind(submissionId, user.id).first();
    if (!existingSubmission) {
      return new Response(JSON.stringify({
        success: false,
        message: "Form submission not found"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    await env.DB.prepare(`
      DELETE FROM form_submissions 
      WHERE id = ?
    `).bind(submissionId).run();
    return new Response(JSON.stringify({
      success: true,
      message: "Form submission deleted successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    console.error("Error deleting form submission:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to delete form submission"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
}
__name(onRequestDelete, "onRequestDelete");
function validateSubmissionData2(submissionData, formSchema) {
  const errors = [];
  try {
    if (!formSchema.fields || !Array.isArray(formSchema.fields)) {
      return { isValid: true, errors: [] };
    }
    for (const field of formSchema.fields) {
      if (field.required && (!submissionData[field.name] || submissionData[field.name] === "")) {
        errors.push(`Field '${field.label || field.name}' is required`);
      }
      if (submissionData[field.name] !== void 0 && submissionData[field.name] !== "") {
        const value = submissionData[field.name];
        switch (field.type) {
          case "email":
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push(`Field '${field.label || field.name}' must be a valid email address`);
            }
            break;
          case "number":
            if (isNaN(Number(value))) {
              errors.push(`Field '${field.label || field.name}' must be a valid number`);
            }
            break;
          case "url":
            try {
              new URL(value);
            } catch {
              errors.push(`Field '${field.label || field.name}' must be a valid URL`);
            }
            break;
        }
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error("Validation error:", error);
    return { isValid: true, errors: [] };
  }
}
__name(validateSubmissionData2, "validateSubmissionData2");
var init_submissions = __esm({
  "api/forms/submissions.js"() {
    init_functionsRoutes_0_2579771843798755();
    init_middleware();
    __name2(onRequestOptions7, "onRequestOptions");
    __name2(onRequestGet4, "onRequestGet");
    __name2(onRequestPost5, "onRequestPost");
    __name2(onRequestDelete, "onRequestDelete");
    __name2(validateSubmissionData2, "validateSubmissionData");
  }
});
async function onRequestOptions8(context) {
  return handleCors();
}
__name(onRequestOptions8, "onRequestOptions8");
async function onRequestGet5(context) {
  const { request, env } = context;
  const corsHeaders2 = addCorsHeaders();
  try {
    const user = await requireAuth(request, env);
    if (user instanceof Response) return user;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const templates = await env.DB.prepare(`
      SELECT id, name, description, form_schema, created_at, updated_at 
      FROM form_templates 
      WHERE user_id = ? 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM form_templates 
      WHERE user_id = ?
    `).bind(user.id).first();
    return new Response(JSON.stringify({
      success: true,
      data: {
        templates: templates.results || [],
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    console.error("Error fetching form templates:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to fetch form templates"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
}
__name(onRequestGet5, "onRequestGet5");
async function onRequestPost6(context) {
  const { request, env } = context;
  const corsHeaders2 = addCorsHeaders();
  try {
    const user = await requireAuth(request, env);
    if (user instanceof Response) return user;
    const body = await request.json();
    const { name, description, form_schema } = body;
    if (!name || !form_schema) {
      return new Response(JSON.stringify({
        success: false,
        message: "Name and form schema are required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    if (typeof form_schema !== "object") {
      return new Response(JSON.stringify({
        success: false,
        message: "Form schema must be a valid JSON object"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const templateId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO form_templates (id, user_id, name, description, form_schema, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      templateId,
      user.id,
      name,
      description || null,
      JSON.stringify(form_schema),
      now,
      now
    ).run();
    const template = await env.DB.prepare(`
      SELECT id, name, description, form_schema, created_at, updated_at 
      FROM form_templates 
      WHERE id = ?
    `).bind(templateId).first();
    return new Response(JSON.stringify({
      success: true,
      data: {
        ...template,
        form_schema: JSON.parse(template.form_schema)
      }
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    console.error("Error creating form template:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to create form template"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
}
__name(onRequestPost6, "onRequestPost6");
async function onRequestPut(context) {
  const { request, env } = context;
  const corsHeaders2 = addCorsHeaders();
  try {
    const user = await requireAuth(request, env);
    if (user instanceof Response) return user;
    const url = new URL(request.url);
    const templateId = url.searchParams.get("id");
    if (!templateId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Template ID is required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const existingTemplate = await env.DB.prepare(`
      SELECT id FROM form_templates 
      WHERE id = ? AND user_id = ?
    `).bind(templateId, user.id).first();
    if (!existingTemplate) {
      return new Response(JSON.stringify({
        success: false,
        message: "Form template not found"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const body = await request.json();
    const { name, description, form_schema } = body;
    if (!name || !form_schema) {
      return new Response(JSON.stringify({
        success: false,
        message: "Name and form schema are required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    if (typeof form_schema !== "object") {
      return new Response(JSON.stringify({
        success: false,
        message: "Form schema must be a valid JSON object"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      UPDATE form_templates 
      SET name = ?, description = ?, form_schema = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      name,
      description || null,
      JSON.stringify(form_schema),
      now,
      templateId,
      user.id
    ).run();
    const template = await env.DB.prepare(`
      SELECT id, name, description, form_schema, created_at, updated_at 
      FROM form_templates 
      WHERE id = ?
    `).bind(templateId).first();
    return new Response(JSON.stringify({
      success: true,
      data: {
        ...template,
        form_schema: JSON.parse(template.form_schema)
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    console.error("Error updating form template:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to update form template"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
}
__name(onRequestPut, "onRequestPut");
async function onRequestDelete2(context) {
  const { request, env } = context;
  const corsHeaders2 = addCorsHeaders();
  try {
    const user = await requireAuth(request, env);
    if (user instanceof Response) return user;
    const url = new URL(request.url);
    const templateId = url.searchParams.get("id");
    if (!templateId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Template ID is required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    const existingTemplate = await env.DB.prepare(`
      SELECT id FROM form_templates 
      WHERE id = ? AND user_id = ?
    `).bind(templateId, user.id).first();
    if (!existingTemplate) {
      return new Response(JSON.stringify({
        success: false,
        message: "Form template not found"
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    await env.DB.prepare(`
      DELETE FROM form_templates 
      WHERE id = ? AND user_id = ?
    `).bind(templateId, user.id).run();
    return new Response(JSON.stringify({
      success: true,
      message: "Form template deleted successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    console.error("Error deleting form template:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Failed to delete form template"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  }
}
__name(onRequestDelete2, "onRequestDelete2");
var init_templates = __esm({
  "api/forms/templates.js"() {
    init_functionsRoutes_0_2579771843798755();
    init_middleware();
    __name2(onRequestOptions8, "onRequestOptions");
    __name2(onRequestGet5, "onRequestGet");
    __name2(onRequestPost6, "onRequestPost");
    __name2(onRequestPut, "onRequestPut");
    __name2(onRequestDelete2, "onRequestDelete");
  }
});
async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return handleCors();
  }
  try {
    const method = request.method;
    const url = new URL(request.url);
    switch (method) {
      case "GET":
        return await getAnalytics(request, env, url);
      default:
        return addCorsHeaders(new Response(JSON.stringify({
          success: false,
          message: "Method not allowed"
        }), {
          status: 405,
          headers: { "Content-Type": "application/json" }
        }));
    }
  } catch (error) {
    console.error("Analytics API error:", error);
    return addCorsHeaders(new Response(JSON.stringify({
      success: false,
      message: "Internal server error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
}
__name(onRequest, "onRequest");
async function getAnalytics(request, env, url) {
  const authResult = await requireAuth(request, env);
  if (!authResult.success) {
    return addCorsHeaders(new Response(JSON.stringify(authResult), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    }));
  }
  const userId = authResult.data.userId;
  const params = url.searchParams;
  const templateId = params.get("template_id");
  const startDate = params.get("start_date");
  const endDate = params.get("end_date");
  const format = params.get("format") || "json";
  const type = params.get("type") || "overview";
  try {
    let analyticsData;
    switch (type) {
      case "overview":
        analyticsData = await getOverviewAnalytics(env, userId, templateId, startDate, endDate);
        break;
      case "trends":
        analyticsData = await getTrendsAnalytics(env, userId, templateId, startDate, endDate);
        break;
      case "fields":
        analyticsData = await getFieldAnalytics(env, userId, templateId, startDate, endDate);
        break;
      case "export":
        return await exportData(env, userId, templateId, startDate, endDate, format);
      default:
        analyticsData = await getOverviewAnalytics(env, userId, templateId, startDate, endDate);
    }
    return addCorsHeaders(new Response(JSON.stringify({
      success: true,
      data: analyticsData
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    console.error("Analytics query error:", error);
    return addCorsHeaders(new Response(JSON.stringify({
      success: false,
      message: "Failed to retrieve analytics data"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
}
__name(getAnalytics, "getAnalytics");
async function getOverviewAnalytics(env, userId, templateId, startDate, endDate) {
  const dateFilter = buildDateFilter(startDate, endDate);
  const templateFilter = templateId ? `AND ft.id = ?` : "";
  const statsQuery = `
        SELECT 
            COUNT(DISTINCT ft.id) as total_forms,
            COUNT(fs.id) as total_submissions,
            AVG(CASE WHEN fs.submitted_at IS NOT NULL THEN 1 ELSE 0 END) as avg_completion_rate,
            MIN(fs.submitted_at) as first_submission,
            MAX(fs.submitted_at) as latest_submission
        FROM form_templates ft
        LEFT JOIN form_submissions fs ON ft.id = fs.template_id ${dateFilter}
        WHERE ft.created_by = ? ${templateFilter}
    `;
  const statsParams = [userId];
  if (templateId) statsParams.push(templateId);
  const statsResult = await env.DB.prepare(statsQuery).bind(...statsParams).first();
  const formsQuery = `
        SELECT 
            ft.id,
            ft.name,
            ft.description,
            ft.created_at,
            COUNT(fs.id) as submission_count,
            MAX(fs.submitted_at) as last_submission
        FROM form_templates ft
        LEFT JOIN form_submissions fs ON ft.id = fs.template_id ${dateFilter}
        WHERE ft.created_by = ? ${templateFilter}
        GROUP BY ft.id, ft.name, ft.description, ft.created_at
        ORDER BY submission_count DESC
        LIMIT 10
    `;
  const formsParams = [userId];
  if (templateId) formsParams.push(templateId);
  const formsResults = await env.DB.prepare(formsQuery).bind(...formsParams).all();
  const recentQuery = `
        SELECT 
            fs.id,
            fs.submitted_at,
            ft.name as form_name,
            ft.id as template_id
        FROM form_submissions fs
        JOIN form_templates ft ON fs.template_id = ft.id
        WHERE ft.created_by = ? ${templateFilter} ${dateFilter}
        ORDER BY fs.submitted_at DESC
        LIMIT 10
    `;
  const recentParams = [userId];
  if (templateId) recentParams.push(templateId);
  const recentResults = await env.DB.prepare(recentQuery).bind(...recentParams).all();
  return {
    overview: {
      total_forms: statsResult.total_forms || 0,
      total_submissions: statsResult.total_submissions || 0,
      avg_completion_rate: Math.round((statsResult.avg_completion_rate || 0) * 100),
      first_submission: statsResult.first_submission,
      latest_submission: statsResult.latest_submission
    },
    top_forms: formsResults.results || [],
    recent_submissions: recentResults.results || []
  };
}
__name(getOverviewAnalytics, "getOverviewAnalytics");
async function getTrendsAnalytics(env, userId, templateId, startDate, endDate) {
  const dateFilter = buildDateFilter(startDate, endDate);
  const templateFilter = templateId ? `AND ft.id = ?` : "";
  const dailyQuery = `
        SELECT 
            DATE(fs.submitted_at) as date,
            COUNT(fs.id) as submissions
        FROM form_submissions fs
        JOIN form_templates ft ON fs.template_id = ft.id
        WHERE ft.created_by = ? ${templateFilter} ${dateFilter}
        GROUP BY DATE(fs.submitted_at)
        ORDER BY date DESC
        LIMIT 30
    `;
  const dailyParams = [userId];
  if (templateId) dailyParams.push(templateId);
  const dailyResults = await env.DB.prepare(dailyQuery).bind(...dailyParams).all();
  const hourlyQuery = `
        SELECT 
            CAST(strftime('%H', fs.submitted_at) AS INTEGER) as hour,
            COUNT(fs.id) as submissions
        FROM form_submissions fs
        JOIN form_templates ft ON fs.template_id = ft.id
        WHERE ft.created_by = ? ${templateFilter} ${dateFilter}
        GROUP BY hour
        ORDER BY hour
    `;
  const hourlyParams = [userId];
  if (templateId) hourlyParams.push(templateId);
  const hourlyResults = await env.DB.prepare(hourlyQuery).bind(...hourlyParams).all();
  const weeklyQuery = `
        SELECT 
            CAST(strftime('%w', fs.submitted_at) AS INTEGER) as day_of_week,
            COUNT(fs.id) as submissions
        FROM form_submissions fs
        JOIN form_templates ft ON fs.template_id = ft.id
        WHERE ft.created_by = ? ${templateFilter} ${dateFilter}
        GROUP BY day_of_week
        ORDER BY day_of_week
    `;
  const weeklyParams = [userId];
  if (templateId) weeklyParams.push(templateId);
  const weeklyResults = await env.DB.prepare(weeklyQuery).bind(...weeklyParams).all();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weeklyData = weeklyResults.results?.map((row) => ({
    day: dayNames[row.day_of_week],
    day_number: row.day_of_week,
    submissions: row.submissions
  })) || [];
  return {
    daily_trends: dailyResults.results || [],
    hourly_patterns: hourlyResults.results || [],
    weekly_patterns: weeklyData
  };
}
__name(getTrendsAnalytics, "getTrendsAnalytics");
async function getFieldAnalytics(env, userId, templateId, startDate, endDate) {
  if (!templateId) {
    throw new Error("Template ID is required for field analytics");
  }
  const dateFilter = buildDateFilter(startDate, endDate);
  const templateQuery = `
        SELECT form_schema FROM form_templates 
        WHERE id = ? AND created_by = ?
    `;
  const template = await env.DB.prepare(templateQuery).bind(templateId, userId).first();
  if (!template) {
    throw new Error("Template not found");
  }
  let formSchema;
  try {
    formSchema = JSON.parse(template.form_schema);
  } catch (error) {
    throw new Error("Invalid form schema");
  }
  const submissionsQuery = `
        SELECT submission_data FROM form_submissions fs
        JOIN form_templates ft ON fs.template_id = ft.id
        WHERE ft.id = ? AND ft.created_by = ? ${dateFilter}
    `;
  const submissions = await env.DB.prepare(submissionsQuery).bind(templateId, userId).all();
  const fields = formSchema.fields || [];
  const totalSubmissions = submissions.results?.length || 0;
  const fieldAnalytics = fields.map((field) => {
    let completedCount = 0;
    let values = [];
    submissions.results?.forEach((submission) => {
      try {
        const data = JSON.parse(submission.submission_data);
        const fieldValue = data[field.name];
        if (fieldValue !== void 0 && fieldValue !== null && fieldValue !== "") {
          completedCount++;
          values.push(fieldValue);
        }
      } catch (error) {
        console.error("Error parsing submission data:", error);
      }
    });
    const completionRate = totalSubmissions > 0 ? completedCount / totalSubmissions * 100 : 0;
    let insights = {};
    if (field.type === "select" || field.type === "radio") {
      insights = generateChoiceFieldInsights(values, field);
    } else if (field.type === "number") {
      insights = generateNumericFieldInsights(values);
    } else if (field.type === "text" || field.type === "textarea") {
      insights = generateTextFieldInsights(values);
    }
    return {
      field_name: field.name,
      field_type: field.type,
      field_label: field.label || field.name,
      completion_rate: Math.round(completionRate),
      completed_count: completedCount,
      total_submissions: totalSubmissions,
      insights
    };
  });
  return {
    template_id: templateId,
    total_submissions: totalSubmissions,
    field_analytics: fieldAnalytics
  };
}
__name(getFieldAnalytics, "getFieldAnalytics");
async function exportData(env, userId, templateId, startDate, endDate, format) {
  const dateFilter = buildDateFilter(startDate, endDate);
  const templateFilter = templateId ? `AND ft.id = ?` : "";
  const query = `
        SELECT 
            fs.id,
            fs.submitted_at,
            ft.name as form_name,
            ft.id as template_id,
            fs.submission_data
        FROM form_submissions fs
        JOIN form_templates ft ON fs.template_id = ft.id
        WHERE ft.created_by = ? ${templateFilter} ${dateFilter}
        ORDER BY fs.submitted_at DESC
    `;
  const params = [userId];
  if (templateId) params.push(templateId);
  const results = await env.DB.prepare(query).bind(...params).all();
  const submissions = results.results || [];
  if (format === "csv") {
    const csv = generateCSV(submissions);
    return addCorsHeaders(new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="form-submissions-${Date.now()}.csv"`
      }
    }));
  } else {
    const exportData2 = {
      exported_at: (/* @__PURE__ */ new Date()).toISOString(),
      total_records: submissions.length,
      filters: {
        template_id: templateId,
        start_date: startDate,
        end_date: endDate
      },
      submissions: submissions.map((sub) => ({
        ...sub,
        submission_data: JSON.parse(sub.submission_data)
      }))
    };
    return addCorsHeaders(new Response(JSON.stringify(exportData2, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="form-submissions-${Date.now()}.json"`
      }
    }));
  }
}
__name(exportData, "exportData");
function buildDateFilter(startDate, endDate) {
  let filter = "";
  if (startDate) {
    filter += ` AND fs.submitted_at >= '${startDate}'`;
  }
  if (endDate) {
    filter += ` AND fs.submitted_at <= '${endDate} 23:59:59'`;
  }
  return filter;
}
__name(buildDateFilter, "buildDateFilter");
function generateChoiceFieldInsights(values, field) {
  const choices = field.options || [];
  const choiceCounts = {};
  choices.forEach((choice) => {
    choiceCounts[choice.value || choice] = 0;
  });
  values.forEach((value) => {
    if (choiceCounts.hasOwnProperty(value)) {
      choiceCounts[value]++;
    }
  });
  const mostPopular = Object.entries(choiceCounts).sort(([, a], [, b]) => b - a)[0];
  return {
    choice_distribution: choiceCounts,
    most_popular: mostPopular ? {
      value: mostPopular[0],
      count: mostPopular[1]
    } : null,
    total_responses: values.length
  };
}
__name(generateChoiceFieldInsights, "generateChoiceFieldInsights");
function generateNumericFieldInsights(values) {
  const numbers = values.filter((v) => !isNaN(v)).map(Number);
  if (numbers.length === 0) {
    return { no_numeric_data: true };
  }
  const sum = numbers.reduce((a, b) => a + b, 0);
  const avg = sum / numbers.length;
  const sorted = numbers.sort((a, b) => a - b);
  return {
    count: numbers.length,
    average: Math.round(avg * 100) / 100,
    minimum: sorted[0],
    maximum: sorted[sorted.length - 1],
    median: sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)]
  };
}
__name(generateNumericFieldInsights, "generateNumericFieldInsights");
function generateTextFieldInsights(values) {
  const lengths = values.map((v) => String(v).length);
  const totalLength = lengths.reduce((a, b) => a + b, 0);
  return {
    response_count: values.length,
    average_length: values.length > 0 ? Math.round(totalLength / values.length) : 0,
    min_length: Math.min(...lengths) || 0,
    max_length: Math.max(...lengths) || 0
  };
}
__name(generateTextFieldInsights, "generateTextFieldInsights");
function generateCSV(submissions) {
  if (submissions.length === 0) {
    return "No data available";
  }
  const allFields = /* @__PURE__ */ new Set(["id", "form_name", "template_id", "submitted_at"]);
  submissions.forEach((sub) => {
    try {
      const data = JSON.parse(sub.submission_data);
      Object.keys(data).forEach((key) => allFields.add(key));
    } catch (error) {
      console.error("Error parsing submission data for CSV:", error);
    }
  });
  const headers = Array.from(allFields);
  const csvRows = [headers.join(",")];
  submissions.forEach((sub) => {
    try {
      const data = JSON.parse(sub.submission_data);
      const row = headers.map((header) => {
        let value = "";
        if (header === "id") value = sub.id;
        else if (header === "form_name") value = sub.form_name;
        else if (header === "template_id") value = sub.template_id;
        else if (header === "submitted_at") value = sub.submitted_at;
        else value = data[header] || "";
        if (typeof value === "string") {
          value = value.replace(/"/g, '""');
          if (value.includes(",")) {
            value = `"${value}"`;
          }
        }
        return value;
      });
      csvRows.push(row.join(","));
    } catch (error) {
      console.error("Error processing submission for CSV:", error);
    }
  });
  return csvRows.join("\n");
}
__name(generateCSV, "generateCSV");
var init_analytics = __esm({
  "api/forms/analytics.js"() {
    init_functionsRoutes_0_2579771843798755();
    init_middleware();
    __name2(onRequest, "onRequest");
    __name2(getAnalytics, "getAnalytics");
    __name2(getOverviewAnalytics, "getOverviewAnalytics");
    __name2(getTrendsAnalytics, "getTrendsAnalytics");
    __name2(getFieldAnalytics, "getFieldAnalytics");
    __name2(exportData, "exportData");
    __name2(buildDateFilter, "buildDateFilter");
    __name2(generateChoiceFieldInsights, "generateChoiceFieldInsights");
    __name2(generateNumericFieldInsights, "generateNumericFieldInsights");
    __name2(generateTextFieldInsights, "generateTextFieldInsights");
    __name2(generateCSV, "generateCSV");
  }
});
var routes;
var init_functionsRoutes_0_2579771843798755 = __esm({
  "../.wrangler/tmp/pages-rwWFOq/functionsRoutes-0.2579771843798755.mjs"() {
    init_login();
    init_login();
    init_logout();
    init_logout();
    init_me();
    init_me();
    init_register();
    init_register();
    init_session();
    init_session();
    init_render();
    init_render();
    init_render();
    init_submissions();
    init_submissions();
    init_submissions();
    init_submissions();
    init_templates();
    init_templates();
    init_templates();
    init_templates();
    init_templates();
    init_analytics();
    routes = [
      {
        routePath: "/api/auth/login",
        mountPath: "/api/auth",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions]
      },
      {
        routePath: "/api/auth/login",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost]
      },
      {
        routePath: "/api/auth/logout",
        mountPath: "/api/auth",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions2]
      },
      {
        routePath: "/api/auth/logout",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost2]
      },
      {
        routePath: "/api/auth/me",
        mountPath: "/api/auth",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet]
      },
      {
        routePath: "/api/auth/me",
        mountPath: "/api/auth",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions3]
      },
      {
        routePath: "/api/auth/register",
        mountPath: "/api/auth",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions4]
      },
      {
        routePath: "/api/auth/register",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost3]
      },
      {
        routePath: "/api/auth/session",
        mountPath: "/api/auth",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet2]
      },
      {
        routePath: "/api/auth/session",
        mountPath: "/api/auth",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions5]
      },
      {
        routePath: "/api/forms/render",
        mountPath: "/api/forms",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet3]
      },
      {
        routePath: "/api/forms/render",
        mountPath: "/api/forms",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions6]
      },
      {
        routePath: "/api/forms/render",
        mountPath: "/api/forms",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost4]
      },
      {
        routePath: "/api/forms/submissions",
        mountPath: "/api/forms",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete]
      },
      {
        routePath: "/api/forms/submissions",
        mountPath: "/api/forms",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet4]
      },
      {
        routePath: "/api/forms/submissions",
        mountPath: "/api/forms",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions7]
      },
      {
        routePath: "/api/forms/submissions",
        mountPath: "/api/forms",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost5]
      },
      {
        routePath: "/api/forms/templates",
        mountPath: "/api/forms",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete2]
      },
      {
        routePath: "/api/forms/templates",
        mountPath: "/api/forms",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet5]
      },
      {
        routePath: "/api/forms/templates",
        mountPath: "/api/forms",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions8]
      },
      {
        routePath: "/api/forms/templates",
        mountPath: "/api/forms",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost6]
      },
      {
        routePath: "/api/forms/templates",
        mountPath: "/api/forms",
        method: "PUT",
        middlewares: [],
        modules: [onRequestPut]
      },
      {
        routePath: "/api/forms/analytics",
        mountPath: "/api/forms",
        method: "",
        middlewares: [],
        modules: [onRequest]
      }
    ];
  }
});
init_functionsRoutes_0_2579771843798755();
init_functionsRoutes_0_2579771843798755();
init_functionsRoutes_0_2579771843798755();
init_functionsRoutes_0_2579771843798755();
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
init_functionsRoutes_0_2579771843798755();
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
init_functionsRoutes_0_2579771843798755();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
init_functionsRoutes_0_2579771843798755();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-WZ7AtC/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-WZ7AtC/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
/*! Bundled license information:

bcryptjs/dist/bcrypt.js:
  (**
   * @license bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
   * Released under the Apache License, Version 2.0
   * see: https://github.com/dcodeIO/bcrypt.js for details
   *)
*/
//# sourceMappingURL=functionsWorker-0.24779590532619333.js.map
