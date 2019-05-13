/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc
*/
'use strict';
const util = require('util'); // eslint-disable-line no-unused-vars

(function () {
    'use strict';

    // shortcuts for easier to read formulas
    const PI = Math.PI;
    const sin = Math.sin;
    const cos = Math.cos;
    const tan = Math.tan;
    const asin = Math.asin;
    const atan = Math.atan2;
    const acos = Math.acos;
    const rad = PI / 180;
    // sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas
    // date/time constants and conversions

    const dayMs = 1000 * 60 * 60 * 24;
    const J1970 = 2440588;
    const J2000 = 2451545;

    function toJulian(date) {
        return date.valueOf() / dayMs - 0.5 + J1970;
    }

    function fromJulian(j) {
        return new Date((j + 0.5 - J1970) * dayMs);
    }

    function toDays(date) {
        return toJulian(date) - J2000;
    }

    // general calculations for position

    const e = rad * 23.4397; // obliquity of the Earth

    function rightAscension(l, b) {
        return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
    }

    function declination(l, b) {
        return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
    }

    function azimuth(H, phi, dec) {
        return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
    }

    function altitude(H, phi, dec) {
        return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
    }

    function siderealTime(d, lw) {
        return rad * (280.16 + 360.9856235 * d) - lw;
    }

    function astroRefraction(h) {
        if (h < 0) { // the following formula works for positive altitudes only.
            h = 0;
        } // if h = -0.08901179 a div/0 would occur.

        // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
        return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
    }
    // general sun calculations
    function solarMeanAnomaly(d) {
        return rad * (357.5291 + 0.98560028 * d);
    }

    function eclipticLongitude(M) {
        const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M));
        // equation of center
        const P = rad * 102.9372; // perihelion of the Earth
        return M + C + P + PI;
    }

    function sunCoords(d) {
        const M = solarMeanAnomaly(d);
        const L = eclipticLongitude(M);

        return {
            dec: declination(L, 0),
            ra: rightAscension(L, 0)
        };
    }

    const SunCalc = {};

    // calculates sun position for a given date and latitude/longitude

    SunCalc.getPosition = function (date, lat, lng) {
        if (isNaN(lat)) {
            throw new Error('latitude missing');
        }
        if (isNaN(lng)) {
            throw new Error('longitude missing');
        }

        const lw = rad * -lng;
        const phi = rad * lat;
        const d = toDays(date);
        const c = sunCoords(d);
        const H = siderealTime(d, lw) - c.ra;
        return {
            azimuth: azimuth(H, phi, c.dec),
            altitude: altitude(H, phi, c.dec)
        };
    };

    // sun times configuration (angle, morning name, evening name)
    const sunTimes = SunCalc.times = [
        [6, 'goldenHourEnd', 'goldenHourStart', 9, 11], // GOLDEN_HOUR_AM
        [-0.3, 'sunriseEnd', 'sunsetStart', 8, 12], // SUNRISE_END
        [-0.833, 'sunrise', 'sunset', 7, 13], // SUNRISE
        [-4, 'blueHourDawnEnd', 'blueHourDuskStart', 6, 14], // BLUE_HOUR
        [-6, 'civilDawn', 'civilDusk', 5, 15], // DAWN
        [-8, 'blueHourDawnStart', 'blueHourDuskEnd', 4, 16], // BLUE_HOUR
        [-12, 'nauticalDawn', 'nauticalDusk', 3, 17], // NAUTIC_DAWN
        [-15, 'amateurDawn', 'amateurDusk', 2, 18],
        [-18, 'astronomicalDawn', 'astronomicalDusk', 1, 19] // ASTRO_DAWN
    ];
    const sunTimesDefault = SunCalc.timesDefault = {
        solarNoon: 10,
        nadir: 0
    };
    const sunTimesAlternate = SunCalc.timesAlternate = [
        // for backward compatibility
        ['dawn', 'civilDawn'],
        ['dusk', 'civilDusk'],
        ['nightEnd', 'astronomicalDawn'],
        ['night', 'astronomicalDusk'],
        ['nightStart', 'astronomicalDusk'],
        ['goldenHour', 'goldenHourStart']
    ];

    // adds a custom time to the times config
    SunCalc.addTime = function (angle, riseName, setName, risePos, setPos) {
        sunTimes.push([angle, riseName, setName, risePos, setPos]);
    };

    // calculations for sun times

    const J0 = 0.0009;

    function julianCycle(d, lw) {
        return Math.round(d - J0 - lw / (2 * PI));
    }

    function approxTransit(Ht, lw, n) {
        return J0 + (Ht + lw) / (2 * PI) + n;
    }

    function solarTransitJ(ds, M, L) {
        return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
    }

    function hourAngle(h, phi, d) {
        return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)));
    }

    // returns set time for the given sun altitude
    function getSetJ(h, lw, phi, dec, n, M, L) {
        const w = hourAngle(h, phi, dec);

        const a = approxTransit(w, lw, n);
        return solarTransitJ(a, M, L);
    }

    // calculates sun times for a given date and latitude/longitude

    SunCalc.getTimes = function (date, lat, lng) {
        if (isNaN(lat)) {
            throw new Error('latitude missing');
        }
        if (isNaN(lng)) {
            throw new Error('longitude missing');
        }

        const lw = rad * -lng;
        const phi = rad * lat;

        const d = toDays(date);
        const n = julianCycle(d, lw);
        const ds = approxTransit(0, lw, n);
        const M = solarMeanAnomaly(ds);
        const L = eclipticLongitude(M);
        const dec = declination(L, 0);
        const Jnoon = solarTransitJ(ds, M, L);

        const result = {
            solarNoon: {
                value: fromJulian(Jnoon),
                pos: sunTimesDefault.solarNoon,
                name: 'solarNoon',
                angle: 90
            },
            nadir: {
                value: fromJulian(Jnoon + 0.5),
                pos: sunTimesDefault.nadir,
                name: 'nadir',
                angle: 270
            }
        };
        result.solarNoon.ts = result.solarNoon.value.getTime();
        result.nadir.ts = result.nadir.value.getTime();
        for (let i = 0, len = sunTimes.length; i < len; i += 1) {
            const time = sunTimes[i];

            const Jset = getSetJ(time[0] * rad, lw, phi, dec, n, M, L);
            const Jrise = Jnoon - (Jset - Jnoon);

            result[time[2]] = {
                value: fromJulian(Jset),
                pos: time[4],
                name: time[2],
                angle: time[0]
            };
            result[time[1]] = {
                value: fromJulian(Jrise),
                pos: time[3],
                name: time[1],
                angle: (180 + (time[0] * -1))
            };
            result[time[2]].ts = result[time[2]].value.getTime();
            result[time[1]].ts = result[time[1]].value.getTime();
        }

        // for backward compatibility
        for (let i = 0, len = sunTimesAlternate.length; i < len; i += 1) {
            const time = sunTimesAlternate[i];
            result[time[0]] = result[time[1]];
        }

        return result;
    };

    // moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

    function moonCoords(d) { // geocentric ecliptic coordinates of the moon
        const L = rad * (218.316 + 13.176396 * d);
        // ecliptic longitude

        const M = rad * (134.963 + 13.064993 * d);
        // mean anomaly

        const F = rad * (93.272 + 13.229350 * d);
        // mean distance

        const l = L + rad * 6.289 * sin(M);
        // longitude

        const b = rad * 5.128 * sin(F);
        // latitude

        const dt = 385001 - 20905 * cos(M); // distance to the moon in km

        return {
            ra: rightAscension(l, b),
            dec: declination(l, b),
            dist: dt
        };
    }

    SunCalc.getMoonPosition = function (date, lat, lng) {
        const lw = rad * -lng;
        const phi = rad * lat;
        const d = toDays(date);
        const c = moonCoords(d);
        const H = siderealTime(d, lw) - c.ra;
        let h = altitude(H, phi, c.dec);
        // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        const pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));

        h += astroRefraction(h); // altitude correction for refraction

        return {
            azimuth: azimuth(H, phi, c.dec),
            altitude: h,
            distance: c.dist,
            parallacticAngle: pa
        };
    };

    // calculations for illumination parameters of the moon,
    // based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
    // Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.

    SunCalc.getMoonIllumination = function (date) {
        const d = toDays(date || new Date());

        const s = sunCoords(d);

        const m = moonCoords(d);

        const sdist = 149598000;
        // distance from Earth to Sun in km

        const phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra));

        const inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi));

        const angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) -
                cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));

        return {
            fraction: (1 + cos(inc)) / 2,
            phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
            angle
        };
    };

    function hoursLater(date, h) {
        return new Date(date.valueOf() + h * dayMs / 24);
    }

    // calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article

    SunCalc.getMoonTimes = function (date, lat, lng, inUTC) {
        const t = new Date(date);
        if (inUTC) {
            t.setUTCHours(0, 0, 0, 0);
        } else {
            t.setHours(0, 0, 0, 0);
        }

        const hc = 0.133 * rad;
        let h0 = SunCalc.getMoonPosition(t, lat, lng).altitude - hc;
        let rise; let set; let ye; let d; let roots; let x1; let x2; let dx;

        // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
        for (let i = 1; i <= 24; i += 2) {
            const h1 = SunCalc.getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc;
            const h2 = SunCalc.getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc;

            const a = (h0 + h2) / 2 - h1;
            const b = (h2 - h0) / 2;
            const xe = -b / (2 * a);
            ye = (a * xe + b) * xe + h1;
            d = b * b - 4 * a * h1;
            roots = 0;

            if (d >= 0) {
                dx = Math.sqrt(d) / (Math.abs(a) * 2);
                x1 = xe - dx;
                x2 = xe + dx;
                if (Math.abs(x1) <= 1) {
                    roots++;
                }

                if (Math.abs(x2) <= 1) {
                    roots++;
                }

                if (x1 < -1) {
                    x1 = x2;
                }
            }

            if (roots === 1) {
                if (h0 < 0) {
                    rise = i + x1;
                } else {
                    set = i + x1;
                }
            } else if (roots === 2) {
                rise = i + (ye < 0 ? x2 : x1);
                set = i + (ye < 0 ? x1 : x2);
            }

            if (rise && set) {
                break;
            }

            h0 = h2;
        }

        const result = {};
        if (rise) {
            result.rise = hoursLater(t, rise);
        } else {
            result.rise = NaN;
        }

        if (set) {
            result.set = hoursLater(t, set);
        } else {
            result.set = NaN;
        }

        if (!rise && !set) {
            result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true;
        }

        return result;
    };

    module.exports = SunCalc;
})();