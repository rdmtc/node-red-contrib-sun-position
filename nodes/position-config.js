/********************************************
 * position-config:
 *********************************************/
'use strict';

const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');

const sunCalc = require(path.join(__dirname, '/lib/suncalc.js'));

// (function() {
/*******************************************************************************************************/
const moonPhases = [{
    pos: 0,
    id: 'newMoon',
    emoji: '🌚',
    code: ':new_moon_with_face:',
    name: 'New Moon',
    weight: 1
},
{
    pos: 1,
    id: 'waxingCrescentMoon',
    emoji: '🌒',
    code: ':waxing_crescent_moon:',
    name: 'Waxing Crescent',
    weight: 6.3825
},
{
    pos: 2,
    id: 'firstQuarterMoon',
    emoji: '🌓',
    code: ':first_quarter_moon:',
    name: 'First Quarter',
    weight: 1
},
{
    pos: 3,
    id: 'waxingGibbousMoon',
    emoji: '🌔',
    code: ':waxing_gibbous_moon:',
    name: 'Waxing Gibbous',
    weight: 6.3825
},
{
    pos: 4,
    id: 'fullMoon',
    emoji: '🌝',
    code: ':full_moon_with_face:',
    name: 'Full Moon',
    weight: 1
},
{
    pos: 5,
    id: 'waningGibbousMoon',
    emoji: '🌖',
    code: ':waning_gibbous_moon:',
    name: 'Waning Gibbous',
    weight: 6.3825
},
{
    pos: 6,
    id: 'lastQuarterMoon',
    emoji: '🌗',
    code: ':last_quarter_moon:',
    name: 'Last Quarter',
    weight: 1
},
{
    pos: 7,
    id: 'waningCrescentMoon',
    emoji: '🌘',
    code: ':waning_crescent_moon:',
    name: 'Waning Crescent',
    weight: 6.3825
}];

module.exports = function (RED) {
    'use strict';
    const dayMs = 86400000; // 1000 * 60 * 60 * 24;

    /** generic configuration Node */
    class positionConfigurationNode {
        /**
         * creates a new instance of the settings node and initializes them
         * @param {*} config - configuration of the node
         */
        constructor(config) {
            RED.nodes.createNode(this, config);

            try {
                this.name = config.name;
                this.latitude = parseFloat(this.credentials.posLatitude || config.latitude);
                this.longitude = parseFloat(this.credentials.posLongitude || config.longitude);
                this.angleType = config.angleType;
                this.tzOffset = parseInt(config.timeZoneOffset || 99);
                this.tzDST = parseInt(config.timeZoneDST || 0);

                this.cache = {
                    lastSunCalc: {
                        ts: 0
                    },
                    lastMoonCalc: {
                        ts: 0
                    },
                    sunTimesToday: {},
                    sunTimesTomorrow: {},
                    sunTimesAdd1: {},
                    sunTimesAdd2: {},
                    moonTimesToday: {},
                    moonTimesTomorrow: {}
                };

                if (isNaN(this.tzOffset) || this.tzOffset > 99 || this.tzOffset < -99) {
                    this.tzOffset = 99;
                }
                if (this.tzOffset !== 99) {
                    this.tzOffset += this.tzDST;
                    this.tzOffset = (this.tzOffset * -60);
                    this.debug('tzOffset is set to ' + this.tzOffset + ' tzDST=' + this.tzDST);
                } else {
                    this.tzOffset = null;
                    // this.debug('no tzOffset defined (tzDST=' + this.tzDST + ')');
                }
                this.debug(`initialize latitude=${this.latitude} longitude=${this.longitude} tzOffset=${this.tzOffset} tzDST=${this.tzDST}`);

                this.stateTimeFormat = config.stateTimeFormat || '3';
                this.stateDateFormat = config.stateDateFormat || '12';
                // this.debug('load position-config ' + this.name + ' latitude:' + this.latitude + ' long:' + this.longitude + ' angelt:' + this.angleType + ' TZ:' + this.tzOffset);


                const today = new Date();
                const dayId = hlp.getDayId(today); // this._getUTCDayId(today);
                this._sunTimesRefresh(today.valueOf(), dayId);
                this._moonTimesRefresh(today.valueOf(), dayId);
                hlp.initializeParser(RED._('common.days', { returnObjects: true}), RED._('common.months', { returnObjects: true}), RED._('common.dayDiffNames', { returnObjects: true}));
            } catch (err) {
                this.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                this.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('errors.error-title')
                });
                throw err;
            }
        }

        /**
         * register a node as child
         * @param {*} node node to register as child node
         */
        register(node) {
            this.users[node.id] = node;
        }

        /**
         * remove a previous registered node as child
         * @param {*} node node to remove
         * @param {function} done function which should be executed after deregister
         * @returns {*} result of the function
         */
        deregister(node, done) {
            delete node.users[node.id];
            return done();
        }
        /*******************************************************************************************************/
        /**
         * @typedef {Object} limitationsObj
         * @property {number} [next] if greater than 0 the number of days in the future
         * @property {string} [days] days for which should be calculated the sun time
         * @property {string} [months] months for which should be calculated the sun time
         * @property {boolean} [onlyOddDays] - if true only odd days will be used
         * @property {boolean} [onlyEvenDays] - if true only even days will be used
         */
        // * @property {string} [meteoSeason] -only valid meteorological season
        // * @property {string} [astroSeason] -only valid astronomical season

        /**
         * @typedef {Object} timeresult
         * @property {Date} value - a Date object of the neesed date/time
         * @property {number} ts - The time as unix timestamp
         * @property {number} pos - The position of the sun on the time
         * @property {number} angle - Angle of the sun on the time
         * @property {number} julian - The time as julian calendar
         * @property {boolean} valid - indicates if the time is valid or not
         */

        /**
         * @typedef {Object} erroresult
         * @property {string} error - string of an error message if an error occurs
         */

        /**
         * gets sun time by Name
         * @param {Date} dNow current time
         * @param {string} value name of the sun time
         * @param {number} [offset] the offset (positive or negative) which should be added to the date. If no multiplier is given, the offset must be in milliseconds.
         * @param {number} [multiplier] additional multiplier for the offset. Should be a positive Number. Special value -1 if offset is in month and -2 if offset is in years
         * @param {limitationsObj} [limit] additional limitations for the calculation
         * @param {number} [latitude] latitude
         * @param {number} [longitude] longitude
         * @return {timeresult|erroresult} result object of sunTime
         */
        getSunTimeByName(dNow, value, offset, multiplier, limit, latitude, longitude) {
            // this.debug('getSunTimeByName dNow=' + dNow + ' limit=' + util.inspect(limit, { colors: true, compact: 10, breakLength: Infinity }));
            let result;
            const dayId = hlp.getDayId(dNow); // this._getUTCDayId(dNow);
            if (latitude && longitude) {
                result = Object.assign({},sunCalc.getSunTimes(dNow.valueOf(), latitude, longitude)[value]);
            } else {
                latitude = this.latitude;
                longitude = this.longitude;
                this._sunTimesCheck(); // refresh if needed, get dayId
                // this.debug(`getSunTimeByName value=${value} offset=${offset} multiplier=${multiplier} dNow=${dNow} dayId=${dayId} limit=${util.inspect(limit, { colors: true, compact: 10, breakLength: Infinity })} today=${util.inspect(today, { colors: true, compact: 10, breakLength: Infinity })}`);
                if (dayId === this.cache.sunTimesToday.dayId) {
                    result = Object.assign({}, this.cache.sunTimesToday.times[value]); // needed for a object copy
                } else if (dayId === this.cache.sunTimesTomorrow.dayId) {
                    result = Object.assign({}, this.cache.sunTimesTomorrow.times[value]); // needed for a object copy
                } else if (dayId === this.cache.sunTimesAdd1.dayId) {
                    result = Object.assign({},this.cache.sunTimesAdd1.times[value]); // needed for a object copy
                } else if (dayId === this.cache.sunTimesAdd2.dayId) {
                    result = Object.assign({},this.cache.sunTimesAdd2.times[value]); // needed for a object copy
                } else {
                    this.debug('sun-time not in cache - calc time');
                    this.cache.sunTimesAdd2 = {
                        dayId: this.cache.sunTimesAdd1.dayId,
                        times: this.cache.sunTimesAdd1.times
                    };
                    this.cache.sunTimesAdd1 = {
                        dayId,
                        times : sunCalc.getSunTimes(dNow.valueOf(), latitude, longitude)
                    };
                    result = Object.assign({},this.cache.sunTimesAdd1.times[value]); // needed for a object copy
                }
            }

            result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
            if (limit.next && result.value.getTime() <= dNow.getTime()) {
                if (dayId === this.cache.sunTimesToday.dayId) {
                    result = Object.assign({}, this.cache.sunTimesTomorrow.times[value]);
                    result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                }
                const datebase = new Date(dNow);
                while (result.value.getTime() <= dNow.getTime()) {
                    datebase.setUTCDate(datebase.getUTCDate() + 1);
                    result = Object.assign(result, sunCalc.getSunTimes(datebase.valueOf(), latitude, longitude)[value]);
                    result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                }
            }

            let calcSpecial = false;
            let date = result.value;
            if (limit.days && (limit.days !== '*') && (limit.days !== '')) {
                const dayx = hlp.calcDayOffset(limit.days, result.value.getDay());
                if (dayx > 0) {
                    date.setDate(date.getDate() + dayx);
                    calcSpecial = true;
                } else if (dayx < 0) {
                    // this.debug('getSunTimeByName - no valid day of week found value=' + value + ' - limit=' + util.inspect(limit, { colors: true, compact: 10, breakLength: Infinity }) + ' - result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                    result.error = 'No valid day of week found!';
                }
            }

            if (limit.months && (limit.months !== '*') && (limit.months !== '')) {
                const monthx = hlp.calcMonthOffset(limit.months, result.value.getMonth());
                if (monthx > 0) {
                    date = date.setMonth(date.getMonth() + monthx);
                    calcSpecial = true;
                } else if (monthx < 0) {
                    // this.debug('getSunTimeByName - no valid day of week found value=' + value + ' - limit=' + util.inspect(limit, { colors: true, compact: 10, breakLength: Infinity }) + ' - result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                    result.error = 'No valid month found!';
                }
            }

            if (limit.onlyEvenDays) {
                let time = date.getDate();
                while ((time % 2 !== 0)) {
                    // odd
                    date.setDate(date.getDate() + 1);
                    time = date.getDate();
                }
            }
            if (limit.onlyOddDays) {
                let time = date.getDate();
                while((time % 2 === 0)) {
                    // even
                    date.setDate(date.getDate() + 1);
                    time = date.getDate();
                }
            }
            if (calcSpecial) {
                this._checkCoordinates();
                result = Object.assign(result, sunCalc.getSunTimes(date.valueOf(), latitude, longitude)[value]);
                result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
            }

            // this.debug('getSunTimeByName result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            return result;
        }

        /**
         * gets sun time by Name
         * @param {Date} dNow current time
         * @param {number} elevationAngle name of the sun time
         * @param {timePropType} [tprop] additional limitations for the calculation
         * @param {number} [latitude] latitude
         * @param {number} [longitude] longitude
         * @return {timeresult|erroresult} result object of sunTime
         */
        getSunTimeElevation(dNow, elevationAngle, degree, tprop, latitude, longitude) {
            if (!hlp.isValidDate(dNow)) {
                const dto = new Date(dNow);
                if (hlp.isValidDate(dto)) {
                    dNow = dto;
                } else {
                    dNow = new Date();
                }
            }
            // this.debug('getSunTimeByName dNow=' + dNow + ' tprop=' + util.inspect(tprop, { colors: true, compact: 10, breakLength: Infinity }));
            latitude = (latitude || tprop.latitude || this.latitude);
            longitude = (longitude || tprop.longitude || this.longitude);
            const result = Object.assign({},sunCalc.getSunTime(dNow.valueOf(), latitude, longitude, elevationAngle, degree));

            const offsetX = this.getFloatProp(this, null, tprop.offsetType, tprop.offset, 0, tprop.offsetCallback, tprop.noOffsetError);
            const calc = (result, recalc) => {
                result.value = hlp.addOffset(new Date(result.value), offsetX, tprop.multiplier);
                if (tprop.next && result.value.getTime() <= dNow.getTime()) {
                    const datebase = new Date(dNow);
                    while (result.value.getTime() <= dNow.getTime()) {
                        datebase.setUTCDate(datebase.getUTCDate() + 1);
                        result = Object.assign({},recalc(datebase.valueOf()));
                        result.value = hlp.addOffset(new Date(result.value), offsetX, tprop.multiplier);
                    }
                }

                let calcSpecial = false;
                let date = result.value;
                if (tprop.days && (tprop.days !== '*') && (tprop.days !== '')) {
                    const dayx = hlp.calcDayOffset(tprop.days, result.value.getDay());
                    if (dayx > 0) {
                        date.setDate(date.getDate() + dayx);
                        calcSpecial = true;
                    } else if (dayx < 0) {
                        // this.debug('getSunTimeByName - no valid day of week found value=' + value + ' - tprop=' + util.inspect(tprop, { colors: true, compact: 10, breakLength: Infinity }) + ' - result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                        result.error = 'No valid day of week found!';
                    }
                }

                if (tprop.months && (tprop.months !== '*') && (tprop.months !== '')) {
                    const monthx = hlp.calcMonthOffset(tprop.months, result.value.getMonth());
                    if (monthx > 0) {
                        date = date.setMonth(date.getMonth() + monthx);
                        calcSpecial = true;
                    } else if (monthx < 0) {
                        // this.debug('getSunTimeByName - no valid day of week found value=' + value + ' - tprop=' + util.inspect(tprop, { colors: true, compact: 10, breakLength: Infinity }) + ' - result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                        result.error = 'No valid month found!';
                    }
                }

                if (tprop.onlyEvenDays) {
                    let time = date.getDate();
                    while ((time % 2 !== 0)) {
                        // odd
                        date.setDate(date.getDate() + 1);
                        time = date.getDate();
                    }
                }
                if (tprop.onlyOddDays) {
                    let time = date.getDate();
                    while((time % 2 === 0)) {
                        // even
                        date.setDate(date.getDate() + 1);
                        time = date.getDate();
                    }
                }
                if (calcSpecial) {
                    this._checkCoordinates();
                    result = Object.assign(result, recalc(date.valueOf()));
                    result.value = hlp.addOffset(new Date(result.value), offsetX, tprop.multiplier);
                }
            };
            calc(result.rise, dt => sunCalc.getSunTime(dt, latitude, longitude, elevationAngle, degree).rise);
            calc(result.set, dt => sunCalc.getSunTime(dt, latitude, longitude, elevationAngle, degree).set);
            return result;
        }

        /**
         * gets sun time by Name
         * @param {Date} dNow current time
         * @param {number} azimuthAngle angle of the sun
         * @param {timePropType} [tprop] additional limitations for the calculation
         * @param {number} [latitude] latitude
         * @param {number} [longitude] longitude
         * @return {timeresult|erroresult} result object of sunTime
         */
        getSunTimeAzimuth(dNow, azimuthAngle, degree, tprop, latitude, longitude) {
            if (!hlp.isValidDate(dNow)) {
                const dto = new Date(dNow);
                if (hlp.isValidDate(dto)) {
                    dNow = dto;
                } else {
                    dNow = new Date();
                }
            }
            // this.debug('getSunTimeByName dNow=' + dNow + ' tprop=' + util.inspect(tprop, { colors: true, compact: 10, breakLength: Infinity }));
            latitude = (latitude || tprop.latitude || this.latitude);
            longitude = (longitude || tprop.longitude || this.longitude);
            let result = sunCalc.getSunTimeByAzimuth(dNow, latitude, longitude, azimuthAngle, degree);

            const offsetX = this.getFloatProp(this, null, tprop.offsetType, tprop.offset, 0, tprop.offsetCallback, tprop.noOffsetError);
            result = hlp.addOffset(result, offsetX, tprop.multiplier);
            if (tprop.next && result.getTime() <= dNow.getTime()) {
                const datebase = new Date(dNow);
                while (result.getTime() <= dNow.getTime()) {
                    datebase.setUTCDate(datebase.getUTCDate() + 1);
                    result = sunCalc.getSunTimeByAzimuth(datebase, latitude, longitude, azimuthAngle, degree);
                    result = hlp.addOffset(result, offsetX, tprop.multiplier);
                }
            }

            let calcSpecial = false;
            if (tprop.days && (tprop.days !== '*') && (tprop.days !== '')) {
                const dayx = hlp.calcDayOffset(tprop.days, result.getDay());
                if (dayx > 0) {
                    result.setDate(result.getDate() + dayx);
                    calcSpecial = true;
                } else if (dayx < 0) {
                    result = NaN;
                }
            }

            if (tprop.months && (tprop.months !== '*') && (tprop.months !== '')) {
                const monthx = hlp.calcMonthOffset(tprop.months, result.getMonth());
                if (monthx > 0) {
                    result = result.setMonth(result.getMonth() + monthx);
                    calcSpecial = true;
                } else if (monthx < 0) {
                    result = NaN;
                }
            }

            if (tprop.onlyEvenDays) {
                let time = result.getDate();
                while ((time % 2 !== 0)) {
                    // odd
                    result.setDate(result.getDate() + 1);
                    time = result.getDate();
                }
            }
            if (tprop.onlyOddDays) {
                let time = result.getDate();
                while((time % 2 === 0)) {
                    // even
                    result.setDate(result.getDate() + 1);
                    time = result.getDate();
                }
            }
            if (calcSpecial) {
                this._checkCoordinates();
                result = sunCalc.getSunTimeByAzimuth(result, latitude, longitude, azimuthAngle, degree);
                result = hlp.addOffset(result, offsetX, tprop.multiplier);
            }

            return result;
        }

        /**
         * gets previous and next sun time
         * @param {Date} dNow current time
         * @return {array} result object of sunTime
         */
        getSunTimePrevNext(dNow) {
            let dayId = hlp.getDayId(dNow); // this._getUTCDayId(dNow);
            this._sunTimesCheck(); // refresh if needed, get dayId
            let result;
            // this.debug(`getSunTimePrevNext dNow=${dNow} dayId=${dayId} today=${util.inspect(today, { colors: true, compact: 10, breakLength: Infinity })}`);
            if (dayId === this.cache.sunTimesToday.dayId) {
                result = this.cache.sunTimesToday.times;
            } else if (dayId === this.cache.sunTimesTomorrow.dayId) {
                result = this.cache.sunTimesTomorrow.times;
            } else if (dayId === this.cache.sunTimesAdd1.dayId) {
                result = this.cache.sunTimesAdd1.times;
            } else if (dayId === this.cache.sunTimesAdd2.dayId) {
                result = this.cache.sunTimesAdd2.times;
            } else {
                this.debug('sun-time not in cache - calc time (2)');
                this.cache.sunTimesAdd2 = {
                    dayId: this.cache.sunTimesAdd1.dayId,
                    times: this.cache.sunTimesAdd1.times
                };
                this.cache.sunTimesAdd1 = {
                    dayId,
                    times: sunCalc.getSunTimes(dNow.valueOf(), this.latitude, this.longitude)
                };
                result = this.cache.sunTimesAdd1.times;
            }
            const sortable = [];
            for (const key in result) {
                if (result[key].pos >= 0) {
                    sortable.push(result[key]);
                }
            }
            sortable.sort((a, b) => {
                return a.ts - b.ts;
            });
            const dNowTs = dNow.getTime() + 300; // offset to get really next
            // this.debug(`getSunTimePrevNext dNowTs=${dNowTs} sortable=${util.inspect(sortable, { colors: true, compact: 10, breakLength: Infinity })}`);

            let last = sortable[0];
            if (last.ts >= dNowTs) {
                return {
                    next : {
                        value : new Date(last.value),
                        name : last.name,
                        pos : last.pos,
                        valid : last.valid,
                        elevation : last.elevation
                    },
                    last : {
                        value : new Date(result['nadir'].value),
                        name : result['nadir'].name,
                        pos : result['nadir'].pos,
                        valid : result['nadir'].valid,
                        elevation : result['nadir'].elevation
                    }
                };
            }
            for (let i = 1; i < sortable.length; i++) {
                const element = sortable[i];
                if (dNowTs < element.ts) {
                    return {
                        next : {
                            value : new Date(element.value),
                            name : element.name,
                            pos : element.pos,
                            valid : element.valid,
                            elevation : element.elevation
                        },
                        last : {
                            value : new Date(last.value),
                            name : last.name,
                            pos : last.pos,
                            valid : last.valid,
                            elevation : last.elevation
                        }
                    };
                }
                last = element;
            }
            dayId += 1;
            if (dayId === this.cache.sunTimesToday.dayId) {
                result = this.cache.sunTimesToday.times;
            } else if (dayId === this.cache.sunTimesTomorrow.dayId) {
                result = this.cache.sunTimesTomorrow.times;
            } else if (dayId === this.cache.sunTimesAdd1.dayId) {
                result = this.cache.sunTimesAdd1.times;
            } else if (dayId === this.cache.sunTimesAdd2.dayId) {
                result = this.cache.sunTimesAdd2.times;
            } else {
                result = sunCalc.getSunTimes(dNow.valueOf() + dayMs, this.latitude, this.longitude); // needed for a object copy
            }
            const sortable2 = [];
            for (const key in result) {
                if (result[key].pos >=0) {
                    sortable2.push(result[key]);
                }
            }
            sortable2.sort((a, b) => {
                return a.ts - b.ts;
            });
            return {
                next : {
                    value : new Date(sortable2[0].value),
                    name : sortable2[0].name,
                    pos : sortable2[0].pos,
                    valid : sortable2[0].valid,
                    elevation : sortable2[0].elevation
                },
                last : {
                    value : new Date(last.value),
                    name : last.name,
                    pos : last.pos,
                    valid : last.valid,
                    elevation : last.elevation
                }
            };
        }
        /*******************************************************************************************************/
        /**
         * @typedef {Object} moontime
         * @property {Date|NaN} value - a Date object of the neesed date/time
         */

        /**
        * gets moon time
        * @param {Date} dNow current time
        * @param {string} value name of the moon time
        * @param {number} [offset] the offset (positive or negative) which should be added to the date. If no multiplier is given, the offset must be in milliseconds.
        * @param {number} [multiplier] additional multiplier for the offset. Should be a positive Number. Special value -1 if offset is in month and -2 if offset is in years
        * @param {limitationsObj} [limit] additional limitations for the calculation
        * @return {moontime|erroresult} result object of moon time
        */
        getMoonTimeByName(dNow, value, offset, multiplier, limit, latitude, longitude) {
            const result = {};
            const datebase = new Date(dNow);
            const dayId = hlp.getDayId(dNow); // this._getUTCDayId(dNow);
            if (latitude && longitude) {
                result.value = sunCalc.getMoonTimes(dNow.valueOf(), latitude, longitude)[value];
            } else {
                latitude = this.latitude;
                longitude = this.longitude;

                this._moonTimesCheck(); // refresh if needed, get dayId
                // this.debug(`getMoonTimeByName value=${value} offset=${offset} multiplier=${multiplier} next=${next} days=${days} dNow=${dNow} dayId=${dayId} today=${today}`);

                if (dayId === this.cache.moonTimesToday.dayId) {
                    result.value = this.cache.moonTimesToday.times[value]; // needed for a object copy
                } else if (dayId === this.cache.moonTimesTomorrow.dayId) {
                    result.value = this.cache.moonTimesTomorrow.times[value]; // needed for a object copy
                } else {
                    result.value = sunCalc.getMoonTimes(dNow.valueOf(), this.latitude, this.longitude)[value]; // needed for a object copy
                }
            }
            if (hlp.isValidDate(result.value)) {
                result.value = hlp.addOffset(new Date(result.value.getTime()), offset, multiplier);
                if (limit.next && result.value.getTime() <= dNow.getTime()) {
                    if (dayId === this.cache.moonTimesToday.dayId) {
                        result.value = this.cache.moonTimesTomorrow.times[value];
                        result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                    }
                    while (hlp.isValidDate(result.value) && result.value.getTime() <= dNow.getTime()) {
                        datebase.setUTCDate(datebase.getUTCDate() + 1);
                        result.value = sunCalc.getMoonTimes(datebase.valueOf(), latitude, longitude)[value];
                        result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                    }
                }
            }

            while (!hlp.isValidDate(result.value)) {
                datebase.setUTCDate(datebase.getUTCDate() + 1);
                result.value = sunCalc.getMoonTimes(datebase.valueOf(), latitude, longitude)[value];
            }
            result.value = new Date(result.value.getTime());

            let calcSpecial = false;
            let date = result.value;
            if (limit.days && (limit.days !== '*') && (limit.days !== '')) {
                const dayx = hlp.calcDayOffset(limit.days, result.value.getDay());
                if (dayx > 0) {
                    date.setDate(date.getDate() + dayx);
                    calcSpecial = true;
                } else if (dayx < 0) {
                    // this.debug('getSunTimeByName - no valid day of week found value=' + value + ' - next=' + next + ' - days=' + days + ' result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                    result.error = 'No valid day of week found!';
                }
            }
            if (limit.months && (limit.months !== '*') && (limit.months !== '')) {
                const monthx = hlp.calcMonthOffset(limit.months, result.value.getMonth());
                if (monthx > 0) {
                    date = date.setMonth(date.getMonth() + monthx);
                    calcSpecial = true;
                } else if (monthx < 0) {
                    // this.debug('getSunTimeByName - no valid day of week found value=' + value + ' - next=' + next + ' - days=' + days + ' result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                    result.error = 'No valid month found!';
                }
            }
            if (limit.onlyEvenDays) {
                let time = date.getDate();
                while ((time % 2 !== 0)) {
                    // odd
                    date.setDate(date.getDate() + 1);
                    time = date.getDate();
                }
            }
            if (limit.onlyOddDays) {
                let time = date.getDate();
                while((time % 2 === 0)) {
                    // even
                    date.setDate(date.getDate() + 1);
                    time = date.getDate();
                }
            }
            if (calcSpecial) {
                this._checkCoordinates();
                result.value = new Date(sunCalc.getMoonTimes(date.valueOf(), latitude, longitude)[value]);
                result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
            }

            // this.debug('getMoonTimeByName result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            return result;
        }
        /*******************************************************************************************************/
        /**
         * Formate a Date Object to a Date and Time String
         * @param {Date} dt Date to format to Date and Time string
         * @returns {string} formated Date object
         */
        toDateTimeString(dt) {
            return (this.toDateString(dt) + ' ' + this.toTimeString(dt)).trim();
        }

        /**
         * Formate a Date Object to a Time String
         * @param {Date} dt Date to format to trime string
         * @returns {string} formated Date object
         */
        toTimeString(dt) {
            if (!this.tzOffset && this.stateTimeFormat === '3') {
                return dt.toLocaleTimeString();
            }
            return hlp.getFormattedDateOut(dt, this.stateTimeFormat, (this.tzOffset === 0), this.tzOffset);
        }

        /**
         * Formate a Date Object to a Date String
         * @param {Date} dt Date to format to Date string
         * @returns {string} formated Date object
         */
        toDateString(dt) {
            if (!this.tzOffset && this.stateDateFormat === '12') {
                return dt.toLocaleDateString();
            }
            return hlp.getFormattedDateOut(dt, this.stateDateFormat, (this.tzOffset === 0), this.tzOffset);
        }
        /*******************************************************************************************************/
        /**
         * get a float value from a type input in Node-Red
         * @param {*} _srcNode - source node information
         * @param {*} msg - message object
         * @param {string} type - type name of the type input
         * @param {*} value - value of the type input
         * @param {*} [def] - default value if can not get float value
         * @param {*} [opCallback] - callback function for getting getPropValue
         * @returns {number} float property
         */
        getFloatProp(_srcNode, msg, type, value, def, callback, noError) {
            // _srcNode.debug(`getFloatProp type=${type} value=${value} def=${def} callback=${callback} noError=${noError}`);
            let data; // 'msg', 'flow', 'global', 'num', 'bin', 'env', 'jsonata'
            if (type === 'num') {
                data = Number(value); // extra conversation to handle empty string as 0
            } else if (type === '' || (typeof type === 'undefined') || type === null) {
                if (isNaN(value)) {
                    return def || NaN;
                }
                data = value;
            } else if (type === 'none') {
                return def || NaN;
            } else {
                data = this.getPropValue(_srcNode, msg, { type, value, callback }, noError);
            }
            if (data === null || typeof data === 'undefined') {
                if (noError) { return NaN; }
                throw new Error(RED._('errors.notEvaluableProperty', {type, value}));
            }
            data = parseFloat(data);
            if (isNaN(data)) {
                if (noError) { return NaN; }
                throw new Error('the value of ' + type + '.' + value + ' is not a valid Number!');
            }
            return data;
        }
        /*******************************************************************************************************/
        /**
        * @typedef {Object} outPropType
        * @property {string} type - type name of the type input
        * @property {string} value - value of the type input
        * @property {string|number} format - format of the input
        * @property {string} [offset] - value of the offset type input
        * @property {string} [offsetType] - type name of the offset type input
        * @property {number} [multiplier] - multiplier to the time
        * @property {boolean} [next] - if __true__ the next date will be delivered starting from now, otherwise the matching date of the date from now
        * @property {string} [days] - valid days
        */

        /**
          * get an formated date prepared for output
          * @param {*} _srcNode - source node for logging
          * @param {*} [msg] - the message object
          * @param {Date} dateValue - the source date object which should be formated
          * @param {outPropType} data - additional formating and control data
          */
        formatOutDate(_srcNode, msg, dateValue, data) {
            const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
            const result = hlp.normalizeDate(dateValue, offsetX, data.multiplier, data);
            return hlp.getFormattedDateOut(result, data.format, (this.tzOffset === 0), this.tzOffset);
        }

        /**
         * get the time Data prepared for output
         * @param {*} _srcNode - source node for logging
         * @param {*} [msg] - the message object
         * @param {outPropType} data - a Data object
         * @param {*} [dNow] base Date to use for Date time functions
         * @returns {*} output Data
         */
        getOutDataProp(_srcNode, msg, data, dNow) {
            // _srcNode.debug(`getOutDataProp IN data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity }) } tzOffset=${this.tzOffset} dNow=${dNow}`);
            dNow = dNow || ((hlp.isValidDate(data.now)) ? new Date(data.now) : new Date());

            let result = null;
            if (data.type === null || data.type === 'none' || data.type === '' || data.type === 'null' || (typeof data.type === 'undefined')) {
                return null;
            } else if (data.type === 'date') {
                if (this.tzOffset) {
                    return hlp.convertDateTimeZone(Date.now(), this.tzOffset);
                }
                return Date.now();
            } else if (data.type === 'dateSpecific') {
                return this.formatOutDate(_srcNode, msg, dNow, data);
            } else if ((data.type === 'pdsTime') || (data.type === 'pdmTime')) {
                if (data.type === 'pdsTime') { // sun
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
                    result = this.getSunTimeByName(dNow, data.value, offsetX, data.multiplier, data, data.latitude, data.longitude);
                } else if (data.type === 'pdmTime') { // moon
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
                    result = this.getMoonTimeByName(dNow, data.value, offsetX, data.multiplier, data, data.latitude, data.longitude);
                }
                if (result && result.value && !result.error) {
                    return hlp.getFormattedDateOut(result.value, data.format, (this.tzOffset === 0), this.tzOffset);
                }
                return null;
            } else if (data.type === 'pdsTimeNow') {
                result = Object.assign({}, this.getSunTimePrevNext(dNow));
                const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
                result.last.value = hlp.normalizeDate(result.last.value, offsetX, data.multiplier, data);
                result.next.value = hlp.normalizeDate(result.next.value, offsetX, data.multiplier, data);
                if (this.tzOffset) {
                    result.last.value = hlp.convertDateTimeZone(result.last.value, this.tzOffset).getTime();
                    result.next.value = hlp.convertDateTimeZone(result.next.value, this.tzOffset).getTime();
                }
                return result;
            } else if (data.type === 'entered' || data.type === 'dateEntered') {
                result = hlp.getDateOfText(String(data.value), true, (this.tzOffset === 0), this.tzOffset);
                return this.formatOutDate(_srcNode, msg, result, data);
            } else if (data.type === 'dayOfMonth') {
                result = hlp.getSpecialDayOfMonth(dNow.getFullYear(),dNow.getMonth(), data.value);
                if (result !== null && typeof result !== 'undefined') {
                    return this.formatOutDate(_srcNode, msg, result, data);
                }
                return null;
            }
            // _srcNode.debug(`getOutDataProp OUT data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })} tzOffset=${this.tzOffset} result=${util.inspect(result, { colors: true, compact: 10, breakLength: Infinity })}`);
            return this.getPropValue(_srcNode, msg, { type: data.type, value: data.value });
        }
        /*******************************************************************************************************/
        /**
         * Creates a out object, based on input data
         * @param {*} _srcNode The base node
         * @param {*} msg The Message Object to set the Data
         * @param {*} type type of the property to set
         * @param {*} value value of the property to set
         * @param {*} data Data object to set to the property
         */
        setMessageProp(_srcNode, msg, type, value, data) {
            // _srcNode.debug(`setMessageProp dNow=${dNow} msg=${util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity })} data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })}`);
            if (type === 'msgPayload') {
                msg.payload = data;
            } else if (type === 'msgTopic') {
                msg.topic = data;
            } else if (type === 'msgTs') {
                msg.ts = data;
            } else if (type === 'msgLc') {
                msg.lc = data;
            } else if (type === 'msgValue') {
                msg.value = data;
            } else if (type === 'msg') {
                RED.util.setMessageProperty(msg, value, data, true);
            } else if ((type === 'flow' || type === 'global')) {
                const contextKey = RED.util.parseContextStore(value);
                _srcNode.context()[type].set(contextKey.key, data, contextKey.store);
            }
        }
        /*******************************************************************************************************/
        /**
        * @typedef {Object} timePropType
        * @property {string} type - type name of the type input
        * @property {string} value - value of the type input
        * @property {string|number} [format] - format of the input
        * @property {string} [offset] - value of the offset type input
        * @property {string} [offsetType] - type name of the offset type input
        * @property {number} [multiplier] - multiplier to the time
        * @property {boolean} [next] - if __true__ the next date will be delivered starting from now, otherwise the matching date of the date from now
        * @property {string} [days] - valid days
        * @property {string} [months] - valid monthss
        * @property {Date} [now] - base date, current time as default
        */

        /**
        * @typedef {Object} timePropResultType
        * @property {Date} value - the Date value
        * @property {string} error - error message if an error has occured
        * @property {boolean} fix - indicator if the given time value is a fix date
        */

        /**
         * get the time Data from a typed input
         * @param {*} _srcNode - source node for logging
         * @param {*} [msg] - the message object
         * @param {timePropType} data - a Data object
         * @param {*} [dNow] base Date to use for Date time functions
         * @returns {timePropResultType} value of the type input
         */
        getTimeProp(_srcNode, msg, data, dNow) {
            // _srcNode.debug(`getTimeProp data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })} tzOffset=${this.tzOffset}`);
            let result = {
                value: null,
                error: null,
                fix: true
            };
            dNow = dNow || ((hlp.isValidDate(data.now)) ? new Date(data.now) : new Date());
            if (!hlp.isValidDate(dNow)) { dNow = new Date(); _srcNode.debug('getTimeProp: Date parameter not given or date Parameter ' + data.now + ' is invalid!!');}
            try {
                if (data.type === '' || data.type === 'none' || data.type === null || typeof data.type === 'undefined') {
                    result.error = 'wrong type "' + data.type + '"="' + data.value+'"';
                } else if (data.type === 'date') {
                    result.value = dNow;
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                    result.fix = true;
                } else if (data.type === 'dateSpecific') {
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
                    result.value = hlp.normalizeDate(dNow, offsetX, data.multiplier, data);
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value);
                    }
                    result.fix = true;
                } else if (data.type === 'dayOfMonth') {
                    result.value = hlp.getSpecialDayOfMonth(dNow.getFullYear(), dNow.getMonth(), data.value);
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
                    result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data);
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value);
                    }
                } else if (data.type === 'entered') {
                    result.value = hlp.getTimeOfText(String(data.value), dNow, (this.tzOffset === 0), this.tzOffset);
                    if (result.value !== null && typeof result.value !== 'undefined') {
                        const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
                        result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data);
                    }
                    result.fix = true;
                } else if (data.type === 'dateEntered') {
                    result.value =  hlp.getDateOfText(String(data.value), true, (this.tzOffset === 0), this.tzOffset);
                    if (result.value !== null && typeof result.value !== 'undefined') {
                        const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
                        result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data);
                    }
                    result.fix = true;
                } else if (data.type === 'pdsTime') {
                    // sun
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
                    result = this.getSunTimeByName(dNow, data.value, offsetX, data.multiplier, data, data.latitude, data.longitude);
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                    result.fix = true;
                } else if (data.type === 'pdmTime') {
                    // moon
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
                    result = this.getMoonTimeByName(dNow, data.value, offsetX, data.multiplier, data, data.latitude, data.longitude);
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                    result.fix = true;
                } else if (data.type === 'pdsTimeNow') {
                    result = this.getSunTimePrevNext(dNow).next;
                    result.fix = true;
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
                    result.value = hlp.addOffset(new Date(result.value), offsetX, data.multiplier, data.next);
                } else if (data.type === 'pdsTimeByAzimuth' ||
                           data.type === 'pdsTimeByAzimuthRad') {
                    result.value = this.getPropValue(_srcNode, msg, data, true);
                } else if (data.type === 'str') {
                    result.fix = true;
                    if (data.format) {
                        result.value = hlp.parseDateFromFormat(data.value, data.format, RED._('position-config.days'), RED._('position-config.month'), RED._('position-config.dayDiffNames'));
                    } else {
                        result.value = hlp.getDateOfText(data.value, true, (this.tzOffset === 0), this.tzOffset);
                    }
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
                    result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data);
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                } else {
                    // can handle context, json, jsonata, env, ...
                    result.fix = false; // is not a fixed time if can be changed
                    const res = this.getPropValue(_srcNode, msg, data, true);
                    if (typeof res !== 'undefined' && res !== null) {
                        if (data.format) {
                            result.value = hlp.parseDateFromFormat(res, data.format, RED._('position-config.days'), RED._('position-config.month'), RED._('position-config.dayDiffNames'));
                        } else {
                            result.value = hlp.getDateOfText(res, true, (this.tzOffset === 0), this.tzOffset);
                        }
                        const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0, data.offsetCallback, data.noOffsetError);
                        result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data);
                        if (this.tzOffset) {
                            result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                        }
                        // this.debug(String(res) + '  --  ' + result.value);
                    } else {
                        result.error = RED._('errors.notEvaluableProperty', {type:data.type, value: data.value});
                    }
                }
            } catch (err) {
                _srcNode.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                const e = new Error(RED._('errors.notEvaluablePropertyAdd', {type:data.type, value: data.value, err:err.message}));
                e.original = err;
                e.stack = e.stack.split('\n').slice(0,2).join('\n')+'\n'+err.stack;
                throw e;
            }
            if (!hlp.isValidDate(result.value)) {
                if (!result.error) {
                    result.error = 'Can not get time for ' + data.type + '=' + data.value;
                }
                result.value = new Date(dNow);
            }
            // _srcNode.debug(`getTimeProp data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })} tzOffset=${this.tzOffset} result=${ util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }) }`);
            return result;
        }
        /*******************************************************************************************************/
        /**
        * @typedef {Object} propValueType
        * @property {string} type - type name of the type input
        * @property {string} value - value of the type input
        * @property {function} [callback] - function which should be called after value was recived
        */

        /**
        * get a property value from a type input in Node-Red
        * @param {*} _srcNode - source node information
        * @param {propValueType} data - data object with more information
        * @returns {*} JSONataExpression
        */
        getJSONataExpression(_srcNode, data) {
            // _srcNode.debug(`getJSONataExpression - data= ${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })}`);
            const expr = RED.util.prepareJSONataExpression(data, _srcNode);
            // expr.assign('sunTimes', function (val, store) {
            //     return node.context().global.get(val, store);
            // });
            // expr.registerFunction('clone', cloneMessage, '<(oa)-:o>');
            expr.registerFunction('isValidDate', date => {
                return hlp.isValidDate(date);
            }, '<x?:b>');
            expr.registerFunction('isBool', val => {
                return hlp.isBool(val);
            }, '<x:b>');
            expr.registerFunction('isTrue', val => {
                return hlp.isTrue(val);
            }, '<x:b>');
            expr.registerFunction('isFalse', val => {
                return hlp.isFalse(val);
            }, '<x:b>');
            expr.registerFunction('XOR', (a,b) => {
                return hlp.XOR(a,b);
            }, '<bb:b>');
            expr.registerFunction('XAND', (a, b) => {
                return hlp.XAND(a,b);
            }, '<bb:b>');
            expr.registerFunction('countDecimals', val => {
                return hlp.countDecimals(val);
            }, '<n:n>');
            expr.registerFunction('pad', (val, len) => {
                return hlp.pad(val, len);
            }, '<(nsb)n?:s>');
            expr.registerFunction('clipStrLength', (val, len) => {
                return hlp.clipStrLength(val, len);
            }, '<sn:s>');
            expr.registerFunction('getLastDayOfMonth', (year, month, weekday) => {
                if (weekday < 0) { weekday = 6; }
                if (weekday > 6) { weekday = 0; }
                return hlp.getLastDayOfMonth(year, month, weekday);
            }, '<nnn?n?:s>');
            expr.registerFunction('getNthWeekdayOfMonth', (year, month, weekday, nTh) => {
                return hlp.getNthWeekdayOfMonth(year, month, weekday, nTh);
            }, '<nnn?n?:s>');
            expr.registerFunction('getWeekOfYear', date => {
                return hlp.getWeekOfYear(new Date(date));
            }, '<(osn)?:a<n>>');
            expr.registerFunction('getDayOfYear', date => {
                return hlp.getDayOfYear(new Date(date));
            }, '<(osn)?:a<n>>');
            expr.registerFunction('getStdTimezoneOffset', date => {
                return hlp.getStdTimezoneOffset(new Date(date));
            }, '<(osn)?:n>');
            expr.registerFunction('isDSTObserved', date => {
                return hlp.isDSTObserved(new Date(date));
            }, '<(osn)?:b>');
            expr.registerFunction('addOffsetToDate', (date, offset, multiplier) => {
                return hlp.addOffsetToDate(new Date(date), offset, multiplier);
            }, '<(osn)?nn:b>');
            expr.registerFunction('getFormattedDateOut', (date, format, utc, timeZoneOffset) => {
                return hlp.getFormattedDateOut(date, format, utc, timeZoneOffset);
            }, '<(osn)?(sn)?b?n?:o>');
            expr.registerFunction('parseDateFromFormat', (date, format, utc, timeZoneOffset, dayNames, monthNames, dayDiffNames) => {
                return hlp.parseDateFromFormat(date, format, dayNames, monthNames, dayDiffNames, utc, timeZoneOffset);
            }, '<xs?b?n?a<s>?a<s>?a<s>?:s>');
            expr.registerFunction('parseTimeString', (text, date, utc, timeZoneOffset) => {
                return hlp.getTimeOfText(text, date, utc, timeZoneOffset);
            }, '<s(osn)?b?n?:o>');
            expr.registerFunction('parseDateTimeObject', (text, utc, timeZoneOffset, preferMonthFirst) => {
                return hlp.getDateOfText(text, preferMonthFirst, utc, timeZoneOffset);
            }, '<xb?n?b?:o>');

            expr.registerFunction('getSunTimeByName', (value, offset, multiplier, dNow) => {
                if (!hlp.isValidDate(dNow)) {
                    const dto = new Date(dNow);
                    if (hlp.isValidDate(dNow)) {
                        dNow = dto;
                    } else {
                        dNow = new Date();
                    }
                }
                return this.getSunTimeByName(dNow, value, offset, multiplier).value;
            }, '<sn?n?(osn)?:(ol)>');
            expr.registerFunction('getSunTimePrevNext', dNow => {
                if (!hlp.isValidDate(dNow)) {
                    const dto = new Date(dNow);
                    if (hlp.isValidDate(dNow)) {
                        dNow = dto;
                    } else {
                        dNow = new Date();
                    }
                }
                return this.getSunTimePrevNext(dNow);
            }, '<(osn)?:(ol)>');
            expr.registerFunction('getSunTimeByElevation', (elevation, dNow) => {
                if (!hlp.isValidDate(dNow)) {
                    const dto = new Date(dNow);
                    if (hlp.isValidDate(dNow)) {
                        dNow = dto;
                    } else {
                        dNow = new Date();
                    }
                }
                return this.getSunTime(dNow, parseFloat(elevation), {});
            }, '<sn?n?>');
            expr.registerFunction('getMoonTimeByName', (value, offset, multiplier, dNow) => {
                if (!hlp.isValidDate(dNow)) {
                    const dto = new Date(dNow);
                    if (hlp.isValidDate(dNow)) {
                        dNow = dto;
                    } else {
                        dNow = new Date();
                    }
                }
                return this.getMoonTimeByName(dNow, value, offset, multiplier).value;
            }, '<sn?n?(osn)?:(ol)>');
            expr.registerFunction('getSunCalc', (date, calcTimes, sunInSky) => {
                return this.getSunCalc(date, calcTimes, sunInSky);
            }, '<(osn)?b?b?:(ol)>');
            expr.registerFunction('getSunInSky', date => {
                return this.getSunInSky(date);
            }, '<(osn)?:n>');
            expr.registerFunction('getMoonCalc', (date, calcTimes, moonInSky) => {
                return this.getMoonCalc(new Date(date), calcTimes, moonInSky);
            }, '<(osn)?b?:(ol)>');
            expr.registerFunction('getMoonIllumination', date => {
                return this.getMoonIllumination(date);
            }, '<(osn)?:(ol)>');
            expr.registerFunction('getMoonPhase', date => {
                return this.getMoonPhase(date);
            }, '<(osn)?:(ol)>');
            return expr;
        }

        /**
        * get a property value from a type input in Node-Red
        * @param {*} _srcNode - source node information
        * @param {*} msg - message object
        * @param {propValueType} data - data object with more information
        * @returns {*} value of the type input, return of the callback function if defined or __null__ if value could not resolved
        */
        getPropValue(_srcNode, msg, data, noError) {
            // _srcNode.debug(`getPropValue ${data.type}.${data.value} (${data.addID}) - data= ${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })}`);
            let result = undefined;
            if (data.type === '' || data.type === 'none' || typeof data.type === 'undefined' || data.type === null) {
                result = undefined;
            } else if (data.type === 'num') {
                result = Number(data.value);
            } else if (data.type === 'str') {
                result = ''+data.value;
            } else if (data.type === 'bool') {
                result = /^true$/i.test(data.value);
            } else if (data.type === 'date') {
                result = Date.now();
            } else if (data.type === 'msgPayload') {
                result = msg.payload;
            } else if (data.type === 'msgTopic') {
                result = msg.topic;
            } else if (data.type === 'msgValue') {
                result = msg.value;
            } else if (data.type === 'msgTs') {
                result =  msg.ts;
            } else if (data.type === 'msgLc') {
                result = msg.lc;
            } else if (data.type === 'numPct') {
                return parseFloat(data.value) / 100;
            } else if (data.type === 'randomNum') {
                data.value = parseFloat(data.value);
                /*
                if (data.value < 0) {
                    return (Math.random() * Math.abs(data.value || 60));
                } */
                return Math.random() * ((data.value || 60) + 1);
            } else if (data.type === 'PlT') {
                if (msg.topic && data.value && msg.topic.includes(data.value)) {
                    result = msg.payload;
                } else {
                    result = undefined;
                }
            } else if (data.type === 'pdsCalcData') {
                result = this.getSunCalc(msg.ts, true, false);
            } else if (data.type === 'pdsCalcPercent') {
                result = this.getSunInSky(msg.ts);
            } else if (data.type === 'pdsCalcAzimuth') {
                result = this.getSunCalc(msg.ts, false, false).azimuthDegrees;
            } else if (data.type === 'pdsCalcElevation') {
                result = this.getSunCalc(msg.ts, false, false).altitudeDegrees;
            } else if (data.type === 'pdsCalcAzimuthRad') {
                result = this.getSunCalc(msg.ts, false, false).azimuthRadians;
            } else if (data.type === 'pdsCalcElevationRad') {
                result = this.getSunCalc(msg.ts, false, false).altitudeRadians;
            } else if (data.type === 'pdsTimeByElevation') {
                result = this.getSunTimeElevation(msg.ts, parseFloat(data.value), true, data);
            } else if (data.type === 'pdsTimeByAzimuth') {
                result = this.getSunTimeAzimuth(msg.ts, parseFloat(data.value), true, data);
            } else if (data.type === 'pdsTimeByElevationRad') {
                result = this.getSunTimeElevation(msg.ts, parseFloat(data.value), false, data);
            } else if (data.type === 'pdsTimeByAzimuthRad') {
                result = this.getSunTimeAzimuth(msg.ts, parseFloat(data.value), false, data);
            } else if (data.type === 'pdmCalcData') {
                result = this.getMoonCalc(msg.ts, true, false);
            } else if (data.type === 'pdmPhase') {
                result = this.getMoonPhase(msg.ts);
            } else if (data.type === 'pdmPhaseCheck') {
                const pahse = this.getMoonPhase(msg.ts);
                result = (pahse === data.value);
            } else if (data.type === 'entered' || data.type === 'dateEntered') {
                result = hlp.getDateOfText(String(data.value), true, (this.tzOffset === 0), this.tzOffset);
            } else if (data.type === 'pdbIsDST') {
                result = hlp.isDSTObserved(msg.ts);
            } else if (data.type === 'pdnWeekOfYear') {
                result = hlp.getWeekOfYear(msg.ts);
            } else if (data.type === 'pdbWeekOfYearEven') {
                result = (hlp.getWeekOfYear(msg.ts) % 2 === 0);
            } else if (data.type === 'pdnDayOfYear') {
                result = hlp.getDayOfYear(msg.ts);
            } else if (data.type === 'pdbDayOfYearEven') {
                result = (hlp.getDayOfYear(msg.ts) % 2 === 0);
            } else if (data.type === 'jsonata') {
                try {
                    if (!data.expr) {
                        data.expr = this.getJSONataExpression(_srcNode, data.value);
                    }
                    result = RED.util.evaluateJSONataExpression(data.expr, msg);
                } catch (err) {
                    _srcNode.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                }
            } else {
                try {
                    result = RED.util.evaluateNodeProperty(data.value, data.type, _srcNode, msg);
                } catch (err) {
                    _srcNode.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                }
            }
            if (typeof data.callback === 'function') {
                // _srcNode.debug('getPropValue result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }) + ' - ' + typeof result);
                return data.callback(result, data);
            } else if (result === null || typeof result === 'undefined') {
                if (noError !== true) {
                    _srcNode.error(RED._('errors.notEvaluableProperty', data));
                }
                return undefined;
            }
            // _srcNode.debug('getPropValue result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }) + ' - ' + typeof result);
            return result;
        }
        /*******************************************************************************************************/
        /**
        * get a property value from a type input in Node-Red
        * @param {*} _srcNode - source node information
        * @param {*} msg - message object
        * @property {propValueType} operandA - first operand
        * @property {string} compare - compare between the both operands
        * @property {propValueType} operandB - second operand
        * @returns {*} value of the type input, return of the callback function if defined or __null__ if value could not resolved
        */
        comparePropValue(_srcNode, msg, operandA, compare, operandB) {
            // _srcNode.debug(`getComparablePropValue opTypeA='${opTypeA}' opValueA='${opValueA}' compare='${compare}' opTypeB='${opTypeB}' opValueB='${opValueB}'`);
            if (operandA.type === 'none' || operandA.type === '' || typeof operandA.type === 'undefined' || operandA.type === null) {
                return false;
            } else if (operandA.type === 'jsonata' || operandA.type === 'pdmPhaseCheck') {
                compare = 'true';
            }

            const a = this.getPropValue(_srcNode, msg, operandA);
            switch (compare) {
                case 'true':
                    return (a === true);
                case 'false':
                    return (a === false);
                case 'null':
                    return (typeof a == 'undefined' || a === null); // eslint-disable-line eqeqeq
                case 'nnull':
                    return (typeof a != 'undefined' && a !== null); // eslint-disable-line eqeqeq
                case 'empty':
                    if (typeof a === 'string' || Array.isArray(a) || Buffer.isBuffer(a)) {
                        return a.length === 0;
                    } else if (typeof a === 'object' && a !== null) {
                        return Object.keys(a).length === 0;
                    }
                    return false;
                case 'nempty':
                    if (typeof a === 'string' || Array.isArray(a) || Buffer.isBuffer(a)) {
                        return a.length !== 0;
                    } else if (typeof a === 'object' && a !== null) {
                        return Object.keys(a).length !== 0;
                    }
                    return false;
                case 'true_expr':
                    return hlp.isTrue(a);
                case 'false_expr':
                    return hlp.isFalse(a);
                case 'ntrue_expr':
                    return !hlp.isTrue(a);
                case 'nfalse_expr':
                    return !hlp.isFalse(a);
                case 'equal':
                    return (a == this.getPropValue(_srcNode, msg, operandB));  // eslint-disable-line eqeqeq
                case 'nequal':
                    return (a != this.getPropValue(_srcNode, msg, operandB));  // eslint-disable-line eqeqeq
                case 'lt':
                    return (a < this.getPropValue(_srcNode, msg, operandB));
                case 'lte':
                    return (a <= this.getPropValue(_srcNode, msg, operandB));
                case 'gt':
                    return (a > this.getPropValue(_srcNode, msg, operandB));
                case 'gte':
                    return (a >= this.getPropValue(_srcNode, msg, operandB));
                case 'contain': {
                    let val = this.getPropValue(_srcNode, msg, operandB);
                    if (!val) { return false; }
                    val = (val + '').trim();
                    return ((a + '').includes(val));
                }
                case 'containSome': {
                    let vals = this.getPropValue(_srcNode, msg, operandB);
                    if (!vals) { return false; }
                    vals = (vals + '').trim().split(/\s*[,;|]\s*/).filter(x => x);
                    const txt = (a + '');
                    return vals.some(v => txt.includes(v));
                }
                case 'containEvery': {
                    let vals = this.getPropValue(_srcNode, msg, operandB);
                    if (!vals) { return false; }
                    vals = (vals + '').trim().split(/\s*[,;|]\s*/).filter(x => x);
                    const txt = (a + '');
                    return vals.every(v => txt.includes(v));
                }
                default:
                    _srcNode.error(RED._('errors.unknownCompareOperator', { operator: compare}));
                    return hlp.isTrue(a);
            }
        }
        /**************************************************************************************************************/
        getSunCalc(date, calcTimes, sunInSky, specLatitude,  specLongitude) {
            // this.debug(`getSunCalc for date="${date}" calcTimes="${calcTimes}" sunInSky="${sunInSky}"`);
            if (!hlp.isValidDate(date)) {
                const dto = new Date(date);
                if (hlp.isValidDate(dto)) {
                    date = dto;
                } else {
                    date = new Date();
                }
            }

            const cacheEnabled = isNaN(specLatitude) && isNaN(specLongitude);
            if (cacheEnabled && (Math.abs(date.getTime() - this.cache.lastSunCalc.ts) < 3000)) {
                this.log('getSunCalc, time difference since last output to low, do no calculation');
                return this.cache.lastSunCalc;
            }
            specLatitude = specLatitude || this.latitude;
            specLongitude = specLongitude || this.longitude;

            const sunPos = sunCalc.getPosition(date.valueOf(), specLatitude, specLongitude);
            const result = {
                ts: date.getTime(),
                lastUpdate:     date,
                lastUpdateStr:  date.getFullYear() + '-' // return custom format
                                + hlp.pad2(date.getMonth() + 1) + '-'
                                + hlp.pad2(date.getDate()) + 'T'
                                + hlp.pad2(date.getHours()) + ':'
                                + hlp.pad2(date.getMinutes()) + ':'
                                + hlp.pad2(date.getSeconds()),
                latitude:       specLatitude,
                longitude:      specLongitude,
                angleType:      this.angleType,
                azimuth:        (this.angleType === 'deg') ? sunPos.azimuthDegrees : sunPos.azimuth,
                altitude:       (this.angleType === 'deg') ? sunPos.altitudeDegrees : sunPos.altitude, // elevation = altitude
                altitudeDegrees:    sunPos.altitudeDegrees,
                azimuthDegrees:     sunPos.azimuthDegrees,
                altitudeRadians:    sunPos.altitude,
                azimuthRadians:     sunPos.azimuth
            };

            if (!calcTimes) { return result; }

            this._sunTimesCheck(); // refresh if needed, get dayId
            const dayId = hlp.getDayId(date);
            if (cacheEnabled && dayId === this.cache.sunTimesToday.dayId) {
                result.times = this.cache.sunTimesToday.times;
                result.positionAtSolarNoon = this.cache.sunTimesToday.sunPosAtSolarNoon;
            } else if (cacheEnabled && dayId === this.cache.sunTimesTomorrow.dayId) {
                result.times = this.cache.sunTimesTomorrow.times;
                result.positionAtSolarNoon = this.cache.sunTimesTomorrow.sunPosAtSolarNoon;
            } else if (cacheEnabled && dayId === this.cache.sunTimesAdd1.dayId) {
                result.times = this.cache.sunTimesAdd1.times;
            } else if (cacheEnabled && dayId === this.cache.sunTimesAdd2.dayId) {
                result.times = this.cache.sunTimesAdd2.times;
            } else {
                // this.debug('getSunTimes calc extra time');
                result.times = sunCalc.getSunTimes(date.valueOf(), specLatitude, specLongitude); // needed for a object copy
            }
            if (!result.positionAtSolarNoon && sunInSky && result.times.solarNoon.valid) {
                result.positionAtSolarNoon = sunCalc.getPosition(result.times.solarNoon.value.valueOf(), specLatitude, specLongitude);
            }

            if (result.positionAtSolarNoon && result.times.solarNoon.valid) {
                if (result.altitudeDegrees > 0) {
                    result.altitudePercent = (result.altitudeDegrees / result.positionAtSolarNoon.altitudeDegrees) * 100;
                } else {
                    result.altitudePercent = 0;
                }
            }

            if (cacheEnabled) {
                this.cache.lastSunCalc = result;
            }
            // this.debug('getSunCalc result= ' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            return result;
        }

        /**************************************************************************************************************/
        getSunInSky(date) {
            const result = this.getSunCalc(date, true, true);
            return result.altitudePercent;
        }
        /**************************************************************************************************************/
        getMoonIllumination(date) {
            if (!hlp.isValidDate(date)) {
                const dto = new Date(date);
                if (hlp.isValidDate(dto)) {
                    date = dto;
                } else {
                    date = new Date();
                }
            }

            const moonIllum = sunCalc.getMoonIllumination(date.valueOf());
            const result = Object.assign({}, moonIllum);

            if (moonIllum.phase < 0.01) {
                // 0            New Moon            -   Neumond(Phasenwinkel = 0°)
                result.phase = moonPhases[0];
            } else if (moonIllum.phase < 0.25) {
                // 0 - 0.25     Waxing Crescent     -   erstes Viertel bzw. zunehmende Sichel(0° < Phasenwinkel < 90°),
                result.phase = moonPhases[1];
            } else if (moonIllum.phase < 0.26) {
                // 0.25	        First Quarter       -   zunehmender Halbmond(astronomisch: erstes Viertel, Phasenwinkel = 90°),
                result.phase = moonPhases[2];
            } else if (moonIllum.phase < 0.50) {
                // 0.25 - 0.5   Waxing Gibbous      -   zweites Viertel(90° < Phasenwinkel < 180°),
                result.phase = moonPhases[3];
            } else if (moonIllum.phase < 0.51) {
                // 0.5	        Full Moon           -   Vollmond(Phasenwinkel = 180°),
                result.phase = moonPhases[4];
            } else if (moonIllum.phase <= 0.75) {
                // 0.5 - 0.75    Waning Gibbous     -   drittes Viertel (180° < Phasenwinkel < 270°),
                result.phase = moonPhases[5];
            } else if (moonIllum.phase < 0.76) {
                // 0.75	        Last Quarter        -   abnehmender Halbmond(astronomisch: letztes Viertel, Phasenwinkel = 270°),
                result.phase = moonPhases[6];
            } else {
                // Waning Crescent                  -   letztes Viertel bzw. abnehmende Sichel(Phasenwinkel > 270°).
                result.phase = moonPhases[7];
            }
            result.phase.nameAlt = RED._('common.typeOptions.' + result.phase.id);
            result.phase.value = moonIllum.phase;
            result.phase.angle = (this.angleType === 'rad') ? (moonIllum.phase * 360) / (180 / Math.PI) : moonIllum.phase * 360;

            return result;
        }

        getMoonCalc(date, calcTimes, moonInSky, specLatitude, specLongitude) {
            if (!hlp.isValidDate(date)) {
                const dto = new Date(date);
                if (hlp.isValidDate(dto)) {
                    date = dto;
                } else {
                    date = new Date();
                }
            }

            const cacheEnabled = isNaN(specLatitude) && isNaN(specLongitude);
            if (cacheEnabled && (Math.abs(date.getTime() - this.cache.lastMoonCalc.ts) < 3000)) {
                this.log('getMoonCalc, time difference since last output to low, do no calculation');
                return this.cache.lastMoonCalc;
            }
            specLatitude = specLatitude || this.latitude;
            specLongitude = specLongitude || this.longitude;

            const moonPos = sunCalc.getMoonPosition(date.valueOf(), specLatitude, specLongitude);
            const moonIllum = this.getMoonIllumination(date.valueOf());

            const result = {
                ts: date.getTime(),
                lastUpdate:     date,
                lastUpdateStr:  date.getFullYear() + '-'
                                + hlp.pad2(date.getMonth() + 1) + '-'
                                + hlp.pad2(date.getDate()) + 'T'
                                + hlp.pad2(date.getHours()) + ':'
                                + hlp.pad2(date.getMinutes()) + ':'
                                + hlp.pad2(date.getSeconds()),
                latitude:       specLatitude,
                longitude:      specLongitude,
                angleType:      this.angleType,
                azimuth:        (this.angleType === 'deg') ? moonPos.azimuthDegrees : moonPos.azimuth,
                altitude:       (this.angleType === 'deg') ? moonPos.altitudeDegrees : moonPos.altitude, // elevation = altitude
                altitudeDegrees:    moonPos.altitudeDegrees,
                azimuthDegrees:     moonPos.azimuthDegrees,
                altitudeRadians:    moonPos.altitude,
                azimuthRadians:     moonPos.azimuth,
                distance:           moonPos.distance,
                parallacticAngle:   (this.angleType === 'deg') ? moonPos.parallacticAngleDegrees : moonPos.parallacticAngle,
                illumination: {
                    angle: (this.angleType === 'deg') ? 180 / Math.PI * moonIllum.angle : moonIllum.angle,
                    fraction: moonIllum.fraction,
                    phase: moonIllum.phase,
                    zenithAngle: (this.angleType === 'deg') ? 180 / Math.PI * (moonIllum.angle - moonPos.parallacticAngle) : moonIllum.angle - moonPos.parallacticAngle
                }
            };

            if (!calcTimes) { return result; }

            this._moonTimesCheck();
            const dayId = hlp.getDayId(date);
            if (cacheEnabled && dayId === this.cache.moonTimesToday.dayId) {
                result.times = this.cache.moonTimesToday.times;
                result.positionAtRise = this.cache.moonTimesToday.positionAtRise;
                result.positionAtSet = this.cache.moonTimesToday.positionAtSet;
            } else if (cacheEnabled && dayId === this.cache.moonTimesTomorrow.dayId) {
                result.times = this.cache.moonTimesTomorrow.times;
                result.positionAtRise = this.cache.moonTimesTomorrow.positionAtRise;
                result.positionAtSet = this.cache.moonTimesTomorrow.positionAtSet;
            } else {
                result.times = sunCalc.getMoonTimes(date.valueOf(), specLatitude, specLongitude);
            }

            if (cacheEnabled) {
                this.cache.lastMoonCalc = result;
            }
            if (moonInSky) {
                if (!result.positionAtRise && result.times.rise) {
                    result.positionAtRise = sunCalc.getMoonPosition(result.times.rise.valueOf(), specLatitude, specLongitude);
                }

                if (!result.positionAtSet && result.times.set) {
                    result.positionAtSet = sunCalc.getMoonPosition(result.times.set.valueOf(), specLatitude, specLongitude);
                }
            }

            if (result.times.alwaysUp) {
                result.isUp = true;
            } else if (result.times.alwaysDown) {
                result.isUp = false;
            } else {
                if (result.positionAtRise && result.positionAtSet) {
                    result.isUp = (result.positionAtRise.azimuthDegrees < result.azimuthDegrees) &&
                                  (result.positionAtSet.azimuthDegrees > result.azimuthDegrees);
                }
            }

            return result;
        }

        getMoonPhase(date) {
            let result;
            const dNow = new Date();
            if (!hlp.isValidDate(date)) {
                const dto = new Date(date);
                if (hlp.isValidDate(dto)) {
                    date = dto;
                } else {
                    date = dNow;
                }
            }

            const dayIdReq = hlp.getDayId(date);
            const dayIdNow = hlp.getDayId(dNow);

            if (dayIdReq === dayIdNow) {
                if (dayIdNow !== this.moonIlluDayId) {
                    this.moonIlluminationToday = this.getMoonIllumination(date, false);
                    this.moonIlluDayId = dayIdNow;
                }
                result = Object.assign({}, this.moonIlluminationToday.phase); // needed for a object copy
            } else {
                result = Object.assign({},this.getMoonIllumination(date, false).phase); // needed for a object copy
            }

            // this.debug('getMoonPhase result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            return result;
        }
        /**************************************************************************************************************/
        _checkCoordinates() {
            if (isNaN(this.latitude) || (this.latitude < -90) || (this.latitude > 90)) {
                throw new Error(RED._('position-config.errors.latitude-missing'));
            }
            if (isNaN(this.longitude) || (this.longitude < -180) || (this.longitude > 180)) {
                throw new Error(RED._('position-config.errors.longitude-missing'));
            }
            if ((this.latitude === 0) && (this.longitude === 0)) {
                throw new Error(RED._('position-config.errors.coordinates-missing'));
            }
        }

        _sunTimesRefresh(todayValue, dayId) {
            this._checkCoordinates();
            if (this.cache.sunTimesToday.dayId === (dayId + 1)) {
                this.cache.sunTimesToday.times = this.cache.sunTimesTomorrow.times;
                this.cache.sunTimesToday.sunPosAtSolarNoon = this.cache.sunTimesTomorrow.sunPosAtSolarNoon;
                this.cache.sunTimesToday.dayId = this.cache.sunTimesTomorrow.dayId;
            } else {
                this.cache.sunTimesToday.times = sunCalc.getSunTimes(todayValue, this.latitude, this.longitude);
                this.cache.sunTimesToday.sunPosAtSolarNoon = sunCalc.getPosition(this.cache.sunTimesToday.times.solarNoon.value.valueOf(), this.latitude, this.longitude);
                this.cache.sunTimesToday.dayId = dayId;
            }
            this.cache.sunTimesTomorrow = {};
            this.cache.sunTimesTomorrow.times = sunCalc.getSunTimes(todayValue + dayMs, this.latitude, this.longitude);
            this.cache.sunTimesTomorrow.sunPosAtSolarNoon = sunCalc.getPosition(this.cache.sunTimesTomorrow.times.solarNoon.value.valueOf(), this.latitude, this.longitude);
            this.cache.sunTimesTomorrow.dayId = (dayId + 1);

            // this.debug(`sunTimesRefresh - calculate sun times - dayId=${dayId}, today=${today.toISOString()}, this.cache=${util.inspect(this.cache, { colors: true, compact: 10, breakLength: Infinity })}`);
        }

        _sunTimesCheck(force) {
            // this.debug(`_sunTimesCheck - force=${force}`);
            const today = new Date();
            const dayId = hlp.getDayId(today); // _getUTCDayId(today);
            if (force || this.cache.sunTimesToday.dayId !== dayId) {
                this._sunTimesRefresh(today.valueOf(), dayId);
            }
        }

        _moonTimesRefresh(todayValue, dayId) {
            this._checkCoordinates();

            if (this.cache.moonTimesToday.dayId === (dayId + 1)) {
                this.cache.moonTimesToday.dayId = this.cache.moonTimesTomorrow.dayId;
                this.cache.moonTimesToday.times = this.cache.moonTimesTomorrow.times;
                this.cache.moonTimesTomorrow = {};
            } else {
                this.cache.moonTimesToday.dayId = dayId;
                this.cache.moonTimesToday.times = sunCalc.getMoonTimes(todayValue, this.latitude, this.longitude);
            }
            this.cache.moonTimesTomorrow.times = sunCalc.getMoonTimes(todayValue + dayMs, this.latitude, this.longitude);
            this.cache.moonTimesTomorrow.dayId = (dayId + 1);
        }

        _moonTimesCheck(force) {
            // this.debug(`_moonTimesCheck - force=${force}`);
            const today = new Date();
            const dayId = hlp.getDayId(today); // this._getUTCDayId(dateb);
            if (force || this.cache.moonTimesToday.dayId !== dayId) {
                this._moonTimesRefresh(today.valueOf(), dayId);
            }
        }
    }

    /**************************************************************************************************************/
    RED.nodes.registerType('position-config', positionConfigurationNode, {
        credentials: {
            posLatitude: { type: 'text' },
            posLongitude: {type: 'text' }
        }
    });

    RED.httpAdmin.get('/sun-position/js/*', RED.auth.needsPermission('sun-position.read'), (req, res) => {
        const options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
        };
        res.sendFile(req.params[0], options);
    });

    RED.httpAdmin.get('/sun-position/data', RED.auth.needsPermission('sun-position.read'), (req, res) => {
        // console.log('RED.httpAdmin.get', req.query.config);
        if (req.query.config && req.query.config !== '_ADD_') {
            const posConfig = RED.nodes.getNode(req.query.config);
            if (!posConfig) {
                res.status(500).send(JSON.stringify({
                    error: 'can not find position config node "' +req.query.config+'" '+String(posConfig)
                }));
                return;
            }
            let scrNode;
            if (req.query.nodeId) {
                scrNode = RED.nodes.getNode(req.query.nodeId);
            }
            if (!scrNode) {
                scrNode = posConfig;
            }
            let obj = {};
            switch (req.query.kind) {
                case 'getTimeData': {
                    try {
                        obj = posConfig.getTimeProp(scrNode, undefined, req.query); // req.query.type, req.query.value, req.query.offsetType, req.query.offset, req.query.multiplier, req.query.next, req.query.days);
                    } catch(err) {
                        obj.value = NaN;
                        obj.error = err.message;
                        obj.errorStack= err.stack;
                    }
                    res.status(200).send(JSON.stringify(obj,Object.getOwnPropertyNames(obj)));
                    break;
                }
                case 'getOutDataData': {
                    try {
                        obj = posConfig.getOutDataProp(scrNode, undefined, req.query, req.query.now); // req.query.type, req.query.value, req.query.format, req.query.offset, req.query.offsetType, req.query.multiplier, req.query.next, req.query.days);
                    } catch(err) {
                        obj.value = NaN;
                        obj.error = err.message;
                        obj.errorStack= err.stack;
                    }
                    res.status(200).send(JSON.stringify(obj,Object.getOwnPropertyNames(obj)));
                    break;
                }
            }
        } else {
            res.status(200).send(JSON.stringify({value: '', error: 'no valid configuration!!'}));
        }
    });
};
// })();