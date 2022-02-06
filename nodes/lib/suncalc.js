/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc

 Reworked and enhanced by Robert Gester
*/
'use strict';
const util = require('util'); // eslint-disable-line no-unused-vars

(function () {
    'use strict';
    // sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas

    // shortcuts for easier to read formulas
    const sin = Math.sin;
    const cos = Math.cos;
    const tan = Math.tan;
    const asin = Math.asin;
    const atan = Math.atan2;
    const acos = Math.acos;
    const rad = Math.PI / 180;
    const degr = 180 / Math.PI;

    // date/time constants and conversions
    const dayMs = 86400000; // 1000 * 60 * 60 * 24;
    const J1970 = 2440587.5;
    const J2000 = 2451545;

    const lunarDaysMs = 2551442778; // The duration in days of a lunar cycle is 29.53058770576
    const firstNewMoon2000 = 947178840000; // first newMoon in the year 2000 2000-01-06 18:14

    const fractionOfTheMoonCycle = [{
        from: 0,
        to: 0.033863193308711,
        id: 'newMoon',
        emoji: '🌚',
        code: ':new_moon_with_face:',
        name: 'New Moon',
        weight: 1,
        css: 'wi-moon-new'
    },
    {
        from: 0.033863193308711,
        to: 0.216136806691289,
        id: 'waxingCrescentMoon',
        emoji: '🌒',
        code: ':waxing_crescent_moon:',
        name: 'Waxing Crescent',
        weight: 6.3825,
        css: 'wi-moon-wax-cres'
    },
    {
        from: 0.216136806691289,
        to: 0.283863193308711,
        id: 'firstQuarterMoon',
        emoji: '🌓',
        code: ':first_quarter_moon:',
        name: 'First Quarter',
        weight: 1,
        css: 'wi-moon-first-quart'
    },
    {
        from: 0.283863193308711,
        to: 0.466136806691289,
        id: 'waxingGibbousMoon',
        emoji: '🌔',
        code: ':waxing_gibbous_moon:',
        name: 'Waxing Gibbous',
        weight: 6.3825,
        css: 'wi-moon-wax-gibb'
    },
    {
        from: 0.466136806691289,
        to: 0.533863193308711,
        id: 'fullMoon',
        emoji: '🌝',
        code: ':full_moon_with_face:',
        name: 'Full Moon',
        weight: 1,
        css: 'wi-moon-full'
    },
    {
        from: 0.533863193308711,
        to: 0.716136806691289,
        id: 'waningGibbousMoon',
        emoji: '🌖',
        code: ':waning_gibbous_moon:',
        name: 'Waning Gibbous',
        weight: 6.3825,
        css: 'wi-moon-wan-gibb'
    },
    {
        from: 0.716136806691289,
        to: 0.783863193308711,
        id: 'thirdQuarterMoon',
        emoji: '🌗',
        code: ':last_quarter_moon:',
        name: 'third Quarter',
        weight: 1,
        css: 'wi-moon-third-quart'
    },
    {
        from: 0.783863193308711,
        to: 0.966136806691289,
        id: 'waningCrescentMoon',
        emoji: '🌘',
        code: ':waning_crescent_moon:',
        name: 'Waning Crescent',
        weight: 6.3825,
        css: 'wi-moon-wan-cres'
    },
    {
        from: 0.966136806691289,
        to: 1,
        id: 'newMoon',
        emoji: '🌚',
        code: ':new_moon_with_face:',
        name: 'New Moon',
        weight: 1,
        css: 'wi-moon-new'
    }];

    /**
     * convert date from Julian calendar
     * @param {number} day nmber in julian calendar to convert
     * @return {number} result date as unix timestamp
     */
    function fromJulianDay(j) {
        return (j - J1970) * dayMs;
    }

    /**
     * get number of days for a dateValue since 2000
     * @param {number} dateValue date as unix timestamp to get days
     * @return {number} count of days
     */
    function toDays(dateValue) {
        return ((dateValue / dayMs) + J1970) - J2000;
    }

    // general calculations for position

    const e = rad * 23.4397; // obliquity of the Earth

    /**
     * get right ascension
     * @param {number} l
     * @param {number} b
     * @returns {number}
     */
    function rightAscension(l, b) {
        return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
    }

    /**
     * get declination
     * @param {number} l
     * @param {number} b
     * @returns {number}
     */
    function declination(l, b) {
        return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
    }

    /**
    * get azimuth
    * @param {number} H - siderealTime
    * @param {number} phi - PI constant
    * @param {number} dec - The declination of the sun
    * @returns {number} azimuth in rad
    */
    function azimuthCalc(H, phi, dec) {
        return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)) + Math.PI;
    }

    /**
    * get altitude
    * @param {number} H - siderealTime
    * @param {number} phi - PI constant
    * @param {number} dec - The declination of the sun
    * @returns {number}
    */
    function altitudeCalc(H, phi, dec) {
        return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
    }

    /**
     * side real time
     * @param {number} d
     * @param {number} lw
     * @returns {number}
     */
    function siderealTime(d, lw) {
        return rad * (280.16 + 360.9856235 * d) - lw;
    }

    /**
     * get astro refraction
     * @param {number} h
     * @returns {number}
     */
    function astroRefraction(h) {
        if (h < 0) { // the following formula works for positive altitudes only.
            h = 0;
        } // if h = -0.08901179 a div/0 would occur.

        // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
        return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
    }
    // general sun calculations
    /**
     * get solar mean anomaly
     * @param {number} d
     * @returns {number}
     */
    function solarMeanAnomaly(d) {
        return rad * (357.5291 + 0.98560028 * d);
    }

    /**
     * ecliptic longitude
     * @param {number} M
     * @returns {number}
     */
    function eclipticLongitude(M) {
        const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M));
        // equation of center
        const P = rad * 102.9372; // perihelion of the Earth
        return M + C + P + Math.PI;
    }

    /**
    * @typedef {Object} sunCoordsObj
    * @property {number} dec - The declination of the sun
    * @property {number} ra - The right ascension of the sun
    */

    /**
     * sun coordinates
     * @param {number} d days in julian calendar
     * @returns {sunCoordsObj}
     */
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
    * @property {number} azimuth - The azimuth of the sun in radians
    * @property {number} altitude - The altitude of the sun in radians
    * @property {number} zenith - The zenith of the sun in radians
    * @property {number} azimuthDegrees - The azimuth of the sun in decimal degree
    * @property {number} altitudeDegrees - The altitude of the sun in decimal degree
    * @property {number} zenithDegrees - The zenith of the sun in decimal degree
    * @property {number} declination - The declination of the sun
    */

    /**
     * calculates sun position for a given date and latitude/longitude
     * @param {number} dateValue date as unix timestamp for calculating sun-position
     * @param {number} lat latitude for calculating sun-position
     * @param {number} lng longitude for calculating sun-position
     * @return {sunposition} result object of sun-position
    */
    SunCalc.getPosition = function (dateValue, lat, lng) {
        // console.log(`getPosition dateValue=${dateValue}  lat=${lat}, lng=${lng}`);
        if (isNaN(lat)) {
            throw new Error('latitude missing');
        }
        if (isNaN(lng)) {
            throw new Error('longitude missing');
        }
        const lw = rad * -lng;
        const phi = rad * lat;
        const d = toDays(dateValue);
        const c = sunCoords(d);
        const H = siderealTime(d, lw) - c.ra;
        const azimuth = azimuthCalc(H, phi, c.dec);
        const altitude = altitudeCalc(H, phi, c.dec);
        // console.log(`getPosition date=${date}, M=${H}, L=${H}, c=${JSON.stringify(c)}, d=${d}, lw=${lw}, phi=${phi}`);

        return {
            azimuth,
            altitude,
            zenith: (90*Math.PI/180) - altitude,
            azimuthDegrees: degr * azimuth,
            altitudeDegrees: degr * altitude,
            zenithDegrees: 90 - (degr * altitude),
            declination: c.dec
        };
    };

    /**
    * @typedef {Object} suntime
    * @property {string} name - The Name of the time
    * @property {Date} value - Date object with the calculated sun-time
    * @property {number} ts - The time as unix timestamp
    * @property {number} pos - The position of the sun on the time
    * @property {number} angle - Angle of the sun on the time
    * @property {number} julian - The time as julian calendar
    * @property {boolean} valid - indicates if the time is valid or not
    */

    /**
    * @typedef {Object} suntimes
    * @property {suntime} solarNoon - The sun-time for the solar noon (sun is in the highest position)
    * @property {suntime} nadir - The sun-time for nadir (darkest moment of the night, sun is in the lowest position)
    * @property {suntime} goldenHourDawnStart - The sun-time for morning golden hour (soft light, best time for photography)
    * @property {suntime} goldenHourDawnEnd - The sun-time for morning golden hour (soft light, best time for photography)
    * @property {suntime} goldenHourDuskStart - The sun-time for evening golden hour starts
    * @property {suntime} goldenHourDuskEnd - The sun-time for evening golden hour starts
    * @property {suntime} sunriseStart - The sun-time for sunrise starts (top edge of the sun appears on the horizon)
    * @property {suntime} sunriseEnd - The sun-time for sunrise ends (bottom edge of the sun touches the horizon)
    * @property {suntime} sunsetStart - The sun-time for sunset starts (bottom edge of the sun touches the horizon)
    * @property {suntime} sunsetEnd - The sun-time for sunset ends (sun disappears below the horizon, evening civil twilight starts)
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
    * @property {suntime} [sunset] - Deprecated: alternate for sunsetEnd
    * @property {suntime} [sunrise] - Deprecated: alternate for sunriseStart
    * @property {suntime} [goldenHourEnd] - Deprecated: alternate for goldenHourDawnEnd
    * @property {suntime} [goldenHourStart] - Deprecated: alternate for goldenHourDuskStart
    */

    /** sun times configuration (angle, morning name, evening name) */
    const sunTimes = SunCalc.times = [
        [6, 'goldenHourDawnEnd', 'goldenHourDuskStart'], // GOLDEN_HOUR_2
        [-0.3, 'sunriseEnd', 'sunsetStart'], // SUNRISE_END
        [-0.833, 'sunriseStart', 'sunsetEnd'], // SUNRISE
        [-1, 'goldenHourDawnStart', 'goldenHourDuskEnd'], // GOLDEN_HOUR_1
        [-4, 'blueHourDawnEnd', 'blueHourDuskStart'], // BLUE_HOUR
        [-6, 'civilDawn', 'civilDusk'], // DAWN
        [-8, 'blueHourDawnStart', 'blueHourDuskEnd'], // BLUE_HOUR
        [-12, 'nauticalDawn', 'nauticalDusk'], // NAUTIC_DAWN
        [-15, 'amateurDawn', 'amateurDusk'],
        [-18, 'astronomicalDawn', 'astronomicalDusk'] // ASTRO_DAWN
    ];

    /** alternate time names for backward compatibility */
    const sunTimesAlternate = SunCalc.timesAlternate = [
        ['dawn', 'civilDawn'],
        ['dusk', 'civilDusk'],
        ['nightEnd', 'astronomicalDawn'],
        ['night', 'astronomicalDusk'],
        ['nightStart', 'astronomicalDusk'],
        ['goldenHour', 'goldenHourDuskStart'],
        ['sunrise', 'sunriseStart'],
        ['sunset', 'sunsetEnd'],
        ['goldenHourEnd', 'goldenHourDawnEnd'],
        ['goldenHourStart', 'goldenHourDuskStart']
    ];

    /** adds a custom time to the times config */
    SunCalc.addTime = function (angle, riseName, setName, risePos, setPos) {
        sunTimes.push([angle, riseName, setName, risePos, setPos]);
    };

    // calculations for sun times

    const J0 = 0.0009;

    /**
     * julian cycle
     * @param {number} d
     * @param {number} lw
     * @returns {number}
     */
    function julianCycle(d, lw) {
        return Math.round(d - J0 - lw / (2 * Math.PI));
    }

    /**
     * approx transit
     * @param {number} Ht
     * @param {number} lw
     * @param {number} n
     * @returns {number}
     */
    function approxTransit(Ht, lw, n) {
        return J0 + (Ht + lw) / (2 * Math.PI) + n;
    }

    /**
     * solar transit in julian
     * @param {number} ds
     * @param {number} M
     * @param {number} L
     * @returns {number}
     */
    function solarTransitJ(ds, M, L) {
        return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
    }

    /**
     * hour angle
     * @param {number} h
     * @param {number} phi
     * @param {number} d
     * @returns {number}
     */
    function hourAngle(h, phi, d) {
        return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)));
    }

    /**
     * returns set time for the given sun altitude
     * @param {*} h
     * @param {*} lw - rad * -lng
     * @param {*} phi -  rad * lat;
     * @param {*} dec - declination
     * @param {*} n - julian cycle
     * @param {*} M - solar mean anomal
     * @param {*} L - ecliptic longitude
     * @returns
     */
    function getSetJ(h, lw, phi, dec, n, M, L) {
        const w = hourAngle(h, phi, dec);
        const a = approxTransit(w, lw, n);
        // console.log(`h=${h} lw=${lw} phi=${phi} dec=${dec} n=${n} M=${M} L=${L} w=${w} a=${a}`);
        return solarTransitJ(a, M, L);
    }

    /**
     * calculates sun times for a given date and latitude/longitude
     * @param {number} dateValue date as unix timestamp for calculating sun-times
     * @param {number} lat latitude for calculating sun-times
     * @param {number} lng longitude for calculating sun-times
     * @param {boolean} [inUTC] defines if the calculation should be in utc or local time (default is local)
     * @return {suntimes} result object of sunTime
     */
    SunCalc.getSunTimes = function (dateValue, lat, lng, noDeprecated, inUTC) {
        // console.log(`getSunTimes dateValue=${dateValue}  lat=${lat}, lng=${lng}, noDeprecated=${noDeprecated}`);
        if (isNaN(lat)) {
            throw new Error('latitude missing');
        }
        if (isNaN(lng)) {
            throw new Error('longitude missing');
        }
        const t = new Date(dateValue);
        if (inUTC) {
            t.setUTCHours(12, 0, 0, 0);
        } else {
            t.setHours(12, 0, 0, 0);
        }
        const lw = rad * -lng;
        const phi = rad * lat;
        const d = toDays(t.valueOf());
        const n = julianCycle(d, lw);
        const ds = approxTransit(0, lw, n);
        const M = solarMeanAnomaly(ds);
        const L = eclipticLongitude(M);
        const dec = declination(L, 0);
        const Jnoon = solarTransitJ(ds, M, L);
        const noonVal = fromJulianDay(Jnoon);
        const nadirVal = fromJulianDay(Jnoon + 0.5);

        const result = {
            solarNoon: {
                value: new Date(noonVal),
                ts: noonVal,
                name: 'solarNoon',
                // elevation: 90,
                julian: Jnoon,
                valid: !isNaN(Jnoon),
                pos: sunTimes.length
            },
            nadir: {
                value: new Date(nadirVal),
                ts: nadirVal,
                name: 'nadir',
                // elevation: 270,
                julian: Jnoon + 0.5,
                valid: !isNaN(Jnoon),
                pos: (sunTimes.length * 2) + 1
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
                value: new Date(v1),
                ts: v1,
                name: time[2],
                elevation: sa,
                julian: Jset,
                valid,
                pos: len + i + 1
            };
            result[time[1]] = {
                value: new Date(v2),
                ts: v2,
                name: time[1],
                elevation: sa, // (180 + (sa * -1)),
                julian: Jrise,
                valid,
                pos: len - i - 1
            };
        }

        if (!noDeprecated) {
            // for backward compatibility
            for (let i = 0, len = sunTimesAlternate.length; i < len; i += 1) {
                const time = sunTimesAlternate[i];
                result[time[0]] = Object.assign({}, result[time[1]]);
                result[time[0]].deprecated = true;
                result[time[0]].posOrg = result[time[0]].pos;
                result[time[0]].pos = -2;
            }
        }
        return result;
    };

    /**
     * calculates sun times for a given date and latitude/longitude
     * @param {number} dateValue date as unix timestamp for calculating sun-times
     * @param {number} lat latitude for calculating sun-times
     * @param {number} lng longitude for calculating sun-times
     * @param {number} elevationAngle sun angle for calculating sun-time
     * @param {boolean} [degree] defines if the elevationAngle is in degree not in radians
     * @param {boolean} [inUTC] defines if the calculation should be in utc or local time (default is local)
     * @return {suntimes} result object of sunTime
     ***/
    SunCalc.getSunTime = function (dateValue, lat, lng, elevationAngle, degree, inUTC) {
        // console.log(`getSunTime dateValue=${dateValue}  lat=${lat}, lng=${lng}, elevationAngle=${elevationAngle}`);
        if (isNaN(lat)) {
            throw new Error('latitude missing');
        }
        if (isNaN(lng)) {
            throw new Error('longitude missing');
        }
        if (isNaN(elevationAngle)) {
            throw new Error('elevationAngle missing');
        }
        if (degree) {
            elevationAngle = elevationAngle * rad;
        }
        const t = new Date(dateValue);
        if (inUTC) {
            t.setUTCHours(12, 0, 0, 0);
        } else {
            t.setHours(12, 0, 0, 0);
        }
        const lw = rad * -lng;
        const phi = rad * lat;
        const d = toDays(t.valueOf());
        const n = julianCycle(d, lw);
        const ds = approxTransit(0, lw, n);
        const M = solarMeanAnomaly(ds);
        const L = eclipticLongitude(M);
        const dec = declination(L, 0);
        const Jnoon = solarTransitJ(ds, M, L);

        const Jset = getSetJ(elevationAngle * rad, lw, phi, dec, n, M, L);
        const Jrise = Jnoon - (Jset - Jnoon);
        const v1 = fromJulianDay(Jset);
        const v2 = fromJulianDay(Jrise);

        return {
            set: {
                value: new Date(v1),
                ts: v1,
                elevation: elevationAngle,
                julian: Jset,
                valid: !isNaN(Jset)
            },
            rise: {
                value: new Date(v2),
                ts: v2,
                elevation: elevationAngle, // (180 + (elevationAngle * -1)),
                julian: Jrise,
                valid: !isNaN(Jrise)
            }
        };
    };

    /**
     * calculates time for a given azimuth angle for a given date and latitude/longitude
     * @param {number} date start date for calculating sun-position
     * @param {number} nazimuth azimuth for calculating sun-position
     * @param {number} lat latitude for calculating sun-position
     * @param {number} lng longitude for calculating sun-position
     * @param {boolean} [degree] true if the angle is in degree and not in rad
     * @return {sunposition} result object of sun-position
    */
    SunCalc.getSunTimeByAzimuth = function (date, lat, lng, nazimuth,  degree) {
        if (isNaN(nazimuth)) {
            throw new Error('azimuth missing');
        }
        if (isNaN(lat)) {
            throw new Error('latitude missing');
        }
        if (isNaN(lng)) {
            throw new Error('longitude missing');
        }
        if (degree) {
            nazimuth = nazimuth * rad;
        }
        const lw = rad * -lng;
        const phi = rad * lat;

        let dateValue = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).valueOf();
        let addval = dayMs; // / 2);
        dateValue += addval;

        while (addval > 200) {
        // let nazi = this.getPosition(dateValue, lat, lng).azimuth;
            const d = toDays(dateValue);
            const c = sunCoords(d);
            const H = siderealTime(d, lw) - c.ra;
            const nazim = azimuthCalc(H, phi, c.dec);

            addval /= 2;
            if (nazim < nazimuth) {
                dateValue += addval;
            } else {
                dateValue -= addval;
            }
        }
        return new Date(Math.floor(dateValue));
    };

    // moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

    /**
     * calculate the geocentric ecliptic coordinates of the moon
     * @param {number} d number of days
     */
    function moonCoords(d) {
        const L = rad * (218.316 + 13.176396 * d); // ecliptic longitude
        const M = rad * (134.963 + 13.064993 * d); // mean anomaly
        const F = rad * (93.272 + 13.229350 * d); // mean distance
        const l = L + rad * 6.289 * sin(M); // longitude
        const b = rad * 5.128 * sin(F); // latitude
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
     * @param {number} dateValue date as unix timestamp for calculating moon-position
     * @param {number} lat latitude for calculating moon-position
     * @param {number} lng longitude for calculating moon-position
     * @return {moonposition} result object of moon-position
     */
    SunCalc.getMoonPosition = function (dateValue, lat, lng) {
        // console.log(`getMoonPosition dateValue=${dateValue}  lat=${lat}, lng=${lng}`);
        if (isNaN(lat)) {
            throw new Error('latitude missing');
        }
        if (isNaN(lng)) {
            throw new Error('longitude missing');
        }

        const lw = rad * -lng;
        const phi = rad * lat;
        const d = toDays(dateValue);
        const c = moonCoords(d);
        const H = siderealTime(d, lw) - c.ra;
        let altitude = altitudeCalc(H, phi, c.dec);
        altitude += astroRefraction(altitude); // altitude correction for refraction

        // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        const pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));

        const azimuth = azimuthCalc(H, phi, c.dec);

        return {
            azimuth,
            altitude,
            azimuthDegrees: degr * azimuth,
            altitudeDegrees: degr * altitude,
            distance: c.dist,
            parallacticAngle: pa,
            parallacticAngleDegrees: degr * pa
        };
    };

    /**
    * @typedef {Object} dateData
    * @property {string} date - The Date as a ISO String YYYY-MM-TTTHH:MM:SS.mmmmZ
    * @property {number} value - The Date as the milliseconds since 1.1.1970 0:00 UTC
    */

    /**
    * @typedef {Object} phaseObj
    * @property {number} from - The phase start
    * @property {number} to - The phase end
    * @property {string} id - id of the phase
    * @property {string} emoji - unicode symbol of the phase
    * @property {string} name - name of the phase
    * @property {string} id - phase name
    * @property {number} weight - weight of the phase
    * @property {string} css - a css value of the phase
    */

    /**
    * @typedef {Object} nextmoonillum
    * @property {number} fraction - The fraction of the moon
    * @property {string} date - The Date as a ISO String YYYY-MM-TTTHH:MM:SS.mmmmZ of the next phase
    * @property {number} value - The Date as the milliseconds since 1.1.1970 0:00 UTC of the next phase
    * @property {string} type - The name of the next phase [newMoon, fullMoon, firstQuarter, thirdQuarter]
    * @property {dateData} newMoon - Date of the next new moon
    * @property {dateData} fullMoon - Date of the next full moon
    * @property {dateData} firstQuarter - Date of the next first quater of the moon
    * @property {dateData} thirdQuarter - Date of the next third/last quater of the moon
    */

    /**
    * @typedef {Object} moonillumination
    * @property {number} fraction - The fraction of the moon
    * @property {phaseObj} phase - The phase of the moon
    * @property {number} phaseValue - The phase of the moon in the current cycle
    * @property {nextmoonillum} next - object containing information about the next phases of the moon
    */

    /**
     * calculations for illumination parameters of the moon,
     * based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
     * Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
     * @param {number} dateValue date as unix timestamp for calculating moon-illumination
     * @return {moonillumination} result object of moon-illumination
     */
    SunCalc.getMoonIllumination = function (dateValue) {
        // console.log(`getMoonIllumination dateValue=${dateValue}`);
        const d = toDays(dateValue);
        const s = sunCoords(d);
        const m = moonCoords(d);
        const sdist = 149598000;  // distance from Earth to Sun in km
        const phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra));
        const inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi));
        const angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) -
            cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
        const phaseValue = 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI;

        // calculates the difference in ms between the sirst fullMoon 2000 and given Date
        const diffBase = dateValue - firstNewMoon2000;
        // Calculate modulus to drop completed cycles
        let cycleModMs = diffBase % lunarDaysMs;
        // If negative number (date before new moon 2000) add lunarDaysMs
        if ( cycleModMs < 0 ) { cycleModMs += lunarDaysMs; }
        const nextNewMoon = (lunarDaysMs - cycleModMs) + dateValue;
        let nextFullMoon = ((lunarDaysMs/2) - cycleModMs) + dateValue;
        if (nextFullMoon < dateValue) { nextFullMoon += lunarDaysMs; }
        const quater = (lunarDaysMs/4);
        let nextFirstQuarter = (quater - cycleModMs) + dateValue;
        if (nextFirstQuarter < dateValue) { nextFirstQuarter += lunarDaysMs; }
        let nextThirdQuarter = (lunarDaysMs - quater - cycleModMs) + dateValue;
        if (nextThirdQuarter < dateValue) { nextThirdQuarter += lunarDaysMs; }
        // Calculate the fraction of the moon cycle
        // const currentfrac = cycleModMs / lunarDaysMs;
        const next = Math.min(nextNewMoon, nextFirstQuarter, nextFullMoon, nextThirdQuarter);
        let phase = '';

        for (let index = 0; index < fractionOfTheMoonCycle.length; index++) {
            const element = fractionOfTheMoonCycle[index];
            if ( (phaseValue >= element.from) && (phaseValue <= element.to) ) {
                phase = element;
                break;
            }
        }

        return {
            fraction: (1 + cos(inc)) / 2,
            // fraction2: cycleModMs / lunarDaysMs,
            phase,
            phaseValue,
            next : {
                value: next,
                date: (new Date(next)).toISOString(),
                type: (next === nextNewMoon) ? 'newMoon' : ((next === nextFirstQuarter) ? 'firstQuarter' : ((next === nextFullMoon) ? 'fullMoon' : 'thirdQuarter')),
                newMoon: {
                    value: nextNewMoon,
                    date: (new Date(nextNewMoon)).toISOString()
                },
                fullMoon: {
                    value: nextFullMoon,
                    date: (new Date(nextFullMoon)).toISOString()
                },
                firstQuarter: {
                    value: nextFirstQuarter,
                    date: (new Date(nextFirstQuarter)).toISOString()
                },
                thirdQuarter: {
                    value: nextThirdQuarter,
                    date: (new Date(nextThirdQuarter)).toISOString()
                }
            }
        };
    };

    /**
     * add hours to a date
     * @param {number} dateValue date as unix timestamp to add hours
     * @param {number} h - hours to add
     * @returns {number} new Date as unix timestamp with added hours
     */
    function hoursLater(dateValue, h) {
        return dateValue + h * dayMs / 24;
    }

    /**
    * @typedef {Object} moontimes
    * @property {Date} rise - a Date object if the moon is rising on the given Date, otherwhise NaN
    * @property {Date} set - a Date object if the moon is setting on the given Date, otherwhise NaN
    * @property {boolean} alwaysUp - is true if the moon in always up, oitherwise property not exists
    * @property {boolean} alwaysDown - is true if the moon in always up, oitherwise property not exists
    */

    /**
     * calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article
     * @param {number} dateValue date as unix timestamp for calculating moon-times
     * @param {number} lat latitude for calculating moon-times
     * @param {number} lng longitude for calculating moon-times
     * @param {boolean} [inUTC] defines if the calculation should be in utc or local time (default is local)
     * @return {moontimes} result object of sunTime
     */
    SunCalc.getMoonTimes = function (dateValue, lat, lng, inUTC) {
        if (isNaN(lat)) {
            throw new Error('latitude missing');
        }
        if (isNaN(lng)) {
            throw new Error('longitude missing');
        }
        const t = new Date(dateValue);
        if (inUTC) {
            t.setUTCHours(0, 0, 0, 0);
        } else {
            t.setHours(0, 0, 0, 0);
        }
        dateValue = t.valueOf();
        // console.log(`getMoonTimes lat=${lat} lng=${lng} dateValue=${dateValue} t=${t}`);

        const hc = 0.133 * rad;
        let h0 = SunCalc.getMoonPosition(dateValue, lat, lng).altitude - hc;
        let rise; let set; let ye; let d; let roots; let x1; let x2; let dx;

        // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
        for (let i = 1; i <= 26; i += 2) {
            const h1 = SunCalc.getMoonPosition(hoursLater(dateValue, i), lat, lng).altitude - hc;
            const h2 = SunCalc.getMoonPosition(hoursLater(dateValue, i + 1), lat, lng).altitude - hc;

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
            result.rise = new Date(hoursLater(dateValue, rise));
        } else {
            result.rise = NaN;
        }

        if (set) {
            result.set = new Date(hoursLater(dateValue, set));
        } else {
            result.set = NaN;
        }

        if (!rise && !set) {
            if (ye > 0) {
                result.alwaysUp = true;
                result.alwaysDown = false;
            } else {
                result.alwaysUp = false;
                result.alwaysDown = true;
            }
        } else if (rise && set) {
            result.alwaysUp = false;
            result.alwaysDown = false;
            result.highest = new Date(hoursLater(dateValue, Math.min(rise, set) + (Math.abs(set - rise) / 2)));
        } else {
            result.alwaysUp = false;
            result.alwaysDown = false;
        }
        return result;
    };

    // export as Node module / AMD module / browser variable
    if (typeof exports === 'object' && typeof module !== 'undefined') module.exports = SunCalc;
    // else if (typeof define === 'function' && define.amd) define(SunCalc);
    else window.SunCalc = SunCalc;

})();