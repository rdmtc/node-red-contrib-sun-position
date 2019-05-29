/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc
*/
'use strict';
const util = require('util'); // eslint-disable-line no-unused-vars

(function () {
    'use strict';
    // sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas

    // shortcuts for easier to read formulas
    const PI = Math.PI;
    const sin = Math.sin;
    const cos = Math.cos;
    const tan = Math.tan;
    const asin = Math.asin;
    const atan = Math.atan2;
    const acos = Math.acos;
    const rad = PI / 180;

    // date/time constants and conversions
    const dayMs = 86400000; // 1000 * 60 * 60 * 24;
    const J1970 = 2440587.5;
    const J2000 = 2451545;

    /**
     * convert date from Julian calendar
     * @param {*} date object to convert
     * @return {date} result date
     */
    function fromJulianDay(j) {
        return new Date((j - J1970) * dayMs);
    }

    /**
     * get number of days for a date since 2000
     * @param {*} date date to get days
     * @param {boolean} [inUTC] defines if the calculation should be in utc or local time (default is UTC)
     * @return {number} cont of days
     */
    function toDays(date, inUTC) {
        date = date || new Date();
        if (inUTC === false) {
            return ((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / dayMs) + J1970) - J2000;
        }
        return ((date.valueOf() / dayMs) + J1970) - J2000;
        // return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / dayMs + J1970 - J2000;

        // return toJulianDay(date) - J2000;
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

    /**
    * @typedef {Object} sunposition
    * @property {number} azimuth - The azimuth of the sun
    * @property {number} altitude - The altitude of the sun
    */

    /**
     * calculates sun position for a given date and latitude/longitude
     * @param {Date} date Date object with the  for calculating sun-position
     * @param {number} lat latitude for calculating sun-position
     * @param {number} lng longitude for calculating sun-position
     * @param {boolean} [inUTC] defines if the calculation should be in utc or local time (default is UTC)
     * @return {sunposition} result object of sun-position
    */
    SunCalc.getPosition = function (date, lat, lng, inUTC) {
        if (isNaN(lat)) {
            throw new Error('latitude missing');
        }
        if (isNaN(lng)) {
            throw new Error('longitude missing');
        }

        const lw = rad * -lng;
        const phi = rad * lat;
        const d = toDays(date, inUTC);
        const c = sunCoords(d);
        const H = siderealTime(d, lw) - c.ra;

        return {
            azimuth: azimuth(H, phi, c.dec),
            altitude: altitude(H, phi, c.dec),
            declination: c.dec
        };
    };

    /**
    * @typedef {Object} suntime
    * @property {string} name - The Name of the time
    * @property {Date} value - Date object with the calculated sun-time
    * @property {number} pos - The position of the sun on the time
    * @property {number} angle - Angle of the sun on the time
    */

    /**
    * @typedef {Object} suntimes
    * @property {suntime} solarNoon - The sun-time for the solar noon (sun is in the highest position)
    * @property {suntime} nadir - The sun-time for nadir (darkest moment of the night, sun is in the lowest position)
    * @property {suntime} goldenHourDawnStart - The sun-time for morning golden hour (soft light, best time for photography)
    * @property {suntime} goldenHourDawnEnd - The sun-time for morning golden hour (soft light, best time for photography)
    * @property {suntime} goldenHourDuskStart - The sun-time for evening golden hour starts
    * @property {suntime} goldenHourDuskEnd - The sun-time for evening golden hour starts
    * @property {suntime} sunriseEnd - The sun-time for sunrise ends (bottom edge of the sun touches the horizon)
    * @property {suntime} sunsetStart - The sun-time for sunset starts (bottom edge of the sun touches the horizon)
    * @property {suntime} sunrise - The sun-time for sunrise (top edge of the sun appears on the horizon)
    * @property {suntime} sunset - The sun-time for sunset (sun disappears below the horizon, evening civil twilight starts)
    * @property {suntime} blueHourDawnStart - The sun-time for blue Hour start (time for special photography photos starts)
    * @property {suntime} blueHourDawnEnd - The sun-time for blue Hour end (time for special photography photos end)
    * @property {suntime} blueHourDuskStart - The sun-time for blue Hour start (time for special photography photos starts)
    * @property {suntime} blueHourDuskEnd - The sun-time for blue Hour end (time for special photography photos end)
    * @property {suntime} civilDawn - The sun-time for dawn (morning nautical twilight ends, morning civil twilight starts)
    * @property {suntime} civilDusk - The sun-time for dusk (evening nautical twilight starts)
    * @property {suntime} nauticalDawn - The sun-time for nautical dawn (morning nautical twilight starts)
    * @property {suntime} nauticalDusk - The sun-time for nautical dusk end (evening astronomical twilight starts)
    * @property {suntime} amateurDawn - The sun-time for amateur astronomical dawn (sun at 12° before sunrise)
    * @property {suntime} amateurDusk - The sun-time for amateur astronomical dusk (sun at 12° after sunrise)
    * @property {suntime} astronomicalDawn - The sun-time for night ends (morning astronomical twilight starts)
    * @property {suntime} astronomicalDusk - The sun-time for night starts (dark enough for astronomical observations)
    * @property {suntime} [dawn] - Deprecated: alternate for civilDawn
    * @property {suntime} [dusk] - Deprecated: alternate for civilDusk
    * @property {suntime} [nightEnd] - Deprecated: alternate for astronomicalDawn
    * @property {suntime} [night] - Deprecated: alternate for astronomicalDusk
    * @property {suntime} [nightStart] - Deprecated: alternate for astronomicalDusk
    * @property {suntime} [goldenHour] - Deprecated: alternate for goldenHourDuskStart
    * @property {suntime} [sunsetEnd] - Deprecated: alternate for sunset
    * @property {suntime} [sunriseStart] - Deprecated: alternate for sunrise
    * @property {suntime} [goldenHourEnd] - Deprecated: alternate for goldenHourDawnEnd
    * @property {suntime} [goldenHourStart] - Deprecated: alternate for goldenHourDuskStart
    */

    /** sun times configuration (angle, morning name, evening name) */
    const sunTimes = SunCalc.times = [
        [6, 'goldenHourDawnEnd', 'goldenHourDuskStart', 10, 12], // GOLDEN_HOUR_2
        [-0.3, 'sunriseEnd', 'sunsetStart', 9, 13], // SUNRISE_END
        [-0.833, 'sunrise', 'sunset', 8, 14], // SUNRISE
        [-1, 'goldenHourDawnStart', 'goldenHourDuskEnd', 7, 15], // GOLDEN_HOUR_1
        [-4, 'blueHourDawnEnd', 'blueHourDuskStart', 6, 16], // BLUE_HOUR
        [-6, 'civilDawn', 'civilDusk', 5, 17], // DAWN
        [-8, 'blueHourDawnStart', 'blueHourDuskEnd', 4, 18], // BLUE_HOUR
        [-12, 'nauticalDawn', 'nauticalDusk', 3, 19], // NAUTIC_DAWN
        [-15, 'amateurDawn', 'amateurDusk', 2, 20],
        [-18, 'astronomicalDawn', 'astronomicalDusk', 1, 21] // ASTRO_DAWN
    ];

    /** default time definitions */
    const sunTimesDefault = SunCalc.timesDefault = {
        solarNoon: 11,
        nadir: 0
    };

    /** alternate time names for backward compatibility */
    const sunTimesAlternate = SunCalc.timesAlternate = [
        ['dawn', 'civilDawn'],
        ['dusk', 'civilDusk'],
        ['nightEnd', 'astronomicalDawn'],
        ['night', 'astronomicalDusk'],
        ['nightStart', 'astronomicalDusk'],
        ['goldenHour', 'goldenHourDuskStart'],
        ['sunriseStart', 'sunrise'],
        ['sunsetEnd', 'sunset'],
        ['goldenHourEnd', 'goldenHourDawnEnd'],
        ['goldenHourStart', 'goldenHourDuskStart']
    ];

    /** adds a custom time to the times config */
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

    /** returns set time for the given sun altitude */
    function getSetJ(h, lw, phi, dec, n, M, L) {
        const w = hourAngle(h, phi, dec);

        const a = approxTransit(w, lw, n);
        // console.log(`h=${h} lw=${lw} phi=${phi} dec=${dec} n=${n} M=${M} L=${L} w=${w} a=${a}`);
        return solarTransitJ(a, M, L);
    }

    /**
     * calculates sun times for a given date and latitude/longitude
     * @param {Date} date Date object with the  for calculating sun-times
     * @param {number} lat latitude for calculating sun-times
     * @param {number} lng longitude for calculating sun-times
     * @param {boolean} [inUTC] defines if the calculation should be in utc or local time (default is UTC)
     * @return {suntimes} result object of sunTime
     */
    SunCalc.getSunTimes = function (date, lat, lng, inUTC, noDeprecated) {
        if (isNaN(lat)) {
            throw new Error('latitude missing');
        }
        if (isNaN(lng)) {
            throw new Error('longitude missing');
        }

        const lw = rad * -lng;
        const phi = rad * lat;

        const d = toDays(date, inUTC);
        const n = julianCycle(d, lw);
        const ds = approxTransit(0, lw, n);
        const M = solarMeanAnomaly(ds);
        const L = eclipticLongitude(M);
        const dec = declination(L, 0);
        const Jnoon = solarTransitJ(ds, M, L);

        const noonVal = fromJulianDay(Jnoon);
        const nadirVal = fromJulianDay(Jnoon + 0.5);

        const result = {
            solarNoon : {
                value: noonVal,
                ts: noonVal.getTime(),
                pos: sunTimesDefault.solarNoon,
                name: 'solarNoon',
                angle: 90,
                julian: Jnoon,
                valid: !isNaN(Jnoon)
            },
            nadir: {
                value: nadirVal,
                ts: nadirVal.getTime(),
                pos: sunTimesDefault.nadir,
                name: 'nadir',
                angle: 270,
                julian: Jnoon + 0.5,
                valid: !isNaN(Jnoon)
            }
        };

        for (let i = 0, len = sunTimes.length; i < len; i += 1) {
            const time = sunTimes[i];
            const sa = time[0];
            let valid = true;

            let Jset = getSetJ(sa * rad, lw, phi, dec, n, M, L);
            if (isNaN(Jset)) {
                Jset = (Jnoon + 0.5);
                valid = false;
                /* Näherung an Wert
                const b = Math.abs(time[0]);
                while (isNaN(Jset) && ((Math.abs(sa) - b) < 2)) {
                    sa += 0.005;
                    Jset = getSetJ(sa * rad, lw, phi, dec, n, M, L);
                } /* */
            }

            const Jrise = Jnoon - (Jset - Jnoon);
            const v1 = fromJulianDay(Jset);
            const v2 = fromJulianDay(Jrise);

            result[time[2]] = {
                value: v1,
                ts: v1.getTime(),
                pos: time[4],
                name: time[2],
                angle: sa,
                julian: Jset,
                valid
            };
            result[time[1]] = {
                value: v2,
                ts: v2.getTime(),
                pos: time[3],
                name: time[1],
                angle: (180 + (sa * -1)),
                julian: Jrise,
                valid
            };
        }

        if (!noDeprecated) {
            // for backward compatibility
            for (let i = 0, len = sunTimesAlternate.length; i < len; i += 1) {
                const time = sunTimesAlternate[i];
                result[time[0]] = result[time[1]];
            }
        }

        return result;
    };

    /**
     * calculates sun times for a given date and latitude/longitude
     * @param {Date} date Date object with the  for calculating sun-times
     * @param {number} lat latitude for calculating sun-times
     * @param {number} lng longitude for calculating sun-times
     * @param {number} sunAngle sun angle for calculating sun-time
     * @param {boolean} [inUTC] defines if the calculation should be in utc or local time (default is UTC)
     * @return {suntimes} result object of sunTime
     */
    SunCalc.getSunTime = function (date, lat, lng, sunAngle, inUTC) {
        if (isNaN(lat)) {
            throw new Error('latitude missing');
        }
        if (isNaN(lng)) {
            throw new Error('longitude missing');
        }
        if (isNaN(sunAngle)) {
            throw new Error('angle missing');
        }

        const lw = rad * -lng;
        const phi = rad * lat;

        const d = toDays(date, inUTC);
        const n = julianCycle(d, lw);
        const ds = approxTransit(0, lw, n);
        const M = solarMeanAnomaly(ds);
        const L = eclipticLongitude(M);
        const dec = declination(L, 0);
        const Jnoon = solarTransitJ(ds, M, L);

        const Jset = getSetJ(sunAngle * rad, lw, phi, dec, n, M, L);
        const Jrise = Jnoon - (Jset - Jnoon);
        const v1 = fromJulianDay(Jset);
        const v2 = fromJulianDay(Jrise);

        return {
            set: {
                value: v1,
                ts: v1.getTime(),
                angle: sunAngle,
                julian: Jset
            },
            rise: {
                value: v2,
                ts: v2.getTime(),
                angle: (180 + (sunAngle * -1)),
                julian: Jrise
            }
        };
    };

    // moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

    /**
     * calculate the geocentric ecliptic coordinates of the moon
     * @param {number} d number of days
     */
    function moonCoords(d) {
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

    /**
    * @typedef {Object} moonposition
    * @property {number} azimuth - The azimuth of the moon
    * @property {number} altitude - The altitude of the moon
    * @property {number} distance - The distance of the moon to the earth
    * @property {number} parallacticAngle - The parallactic angle of the moon
    */

    /**
     * calculates moon position for a given date and latitude/longitude
     * @param {Date} date Date object with the  for calculating moon-position
     * @param {number} lat latitude for calculating moon-position
     * @param {number} lng longitude for calculating moon-position
     * @param {boolean} [inUTC] defines if the calculation should be in utc or local time (default is UTC)
     * @return {moonposition} result object of moon-position
     */
    SunCalc.getMoonPosition = function (date, lat, lng, inUTC) {
        const lw = rad * -lng;
        const phi = rad * lat;
        const d = toDays(date, inUTC);
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

    /**
    * @typedef {Object} moonillumination
    * @property {number} fraction - The fraction of the moon
    * @property {number} phase - The phase of the moon
    * @property {number} angle - The angle of the moon
    */

    /**
     * calculations for illumination parameters of the moon,
     * based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
     * Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
     * @param {Date} date Date object with the  for calculating moon-illumination
     * @param {boolean} [inUTC] defines if the calculation should be in utc or local time (default is UTC)
     * @return {moonillumination} result object of moon-illumination
     */
    SunCalc.getMoonIllumination = function (date, inUTC) {
        const d = toDays(date, inUTC);

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

    /**
    * @typedef {Object} moontimes
    * @property {Date} rise - a Date object if the moon is rising on the given Date, otherwhise NaN
    * @property {Date} set - a Date object if the moon is setting on the given Date, otherwhise NaN
    * @property {boolean} [alwaysUp] - is true if the moon in always up, oitherwise property not exists
    * @property {boolean} [alwaysDown] - is true if the moon in always up, oitherwise property not exists
    */

    /**
     * calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article
     * @param {Date} date Date object with the  for calculating moon-times
     * @param {number} lat latitude for calculating moon-times
     * @param {number} lng longitude for calculating moon-times
     * @param {boolean} [inUTC] defines if the calculation should be in utc or local time (default is UTC)
     * @return {moontimes} result object of sunTime
     */
    SunCalc.getMoonTimes = function (date, lat, lng, inUTC) {
        const t = new Date(date);
        if (inUTC === false) {
            t.setHours(0, 0, 0, 0);
        } else {
            t.setUTCHours(0, 0, 0, 0);
        }
        // console.log(`getMoonTimes lat=${lat} lng=${lng} inUTC=${inUTC} date=${date} t=${t}`);

        const hc = 0.133 * rad;
        let h0 = SunCalc.getMoonPosition(t, lat, lng).altitude - hc;
        let rise; let set; let ye; let d; let roots; let x1; let x2; let dx;

        // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
        for (let i = 1; i <= 26; i += 2) {
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