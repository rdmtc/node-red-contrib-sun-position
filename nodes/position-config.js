/********************************************
 * position-config:
 *********************************************/
'use strict';

const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');

const sunCalc = require(path.join(__dirname, '/lib/suncalc.js'));

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

Date.prototype.addDays = function (days) {
    const date = new Date(this.valueOf());
    date.setUTCDate(date.getUTCDate() + days);
    return date;
};

module.exports = function (RED) {
    'use strict';

    /** generic configuration Node */
    class positionConfigurationNode {
        /**
         * creates a new instance of the settings node and initializes them
         * @param {*} config - configuration of the node
         */
        constructor(config) {
            RED.nodes.createNode(this, config);
            try {
                this.debug('initialize');
                this.name = config.name;
                this.longitude = parseFloat(this.credentials.posLongitude || config.longitude);
                this.latitude = parseFloat(this.credentials.posLatitude || config.latitude);
                this.angleType = config.angleType;
                this.tzOffset = parseInt(config.timeZoneOffset || 99);
                this.tzDST = parseInt(config.timeZoneDST || 0);

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

                this.stateTimeFormat = config.stateTimeFormat || '3';
                this.stateDateFormat = config.stateDateFormat || '12';
                // this.debug('load position-config ' + this.name + ' long:' + this.longitude + ' latitude:' + this.latitude + ' angelt:' + this.angleType + ' TZ:' + this.tzOffset);
                this.lastSunCalc = {
                    ts: 0
                };
                this.lastMoonCalc = {
                    ts: 0
                };

                const today = new Date();
                const dayId = this._getDayId(today); // this._getUTCDayId(today);
                const tomorrow = today.addDays(1);
                this._sunTimesRefresh(today, tomorrow, dayId);
                this._moonTimesRefresh(today, tomorrow, dayId);
                hlp.initializeParser(RED._('common.days', { returnObjects: true}), RED._('common.month', { returnObjects: true}), RED._('common.dayDiffNames', { returnObjects: true}));
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
         * gets sun time
         * @param {Date} now current time
         * @param {string} value name of the sun time
         * @param {number} [offset] the offset (positive or negative) which should be added to the date. If no multiplier is given, the offset must be in milliseconds.
         * @param {number} [multiplier] additional multiplier for the offset. Should be a positive Number. Special value -1 if offset is in month and -2 if offset is in years
         * @param {number} [next] if greater than 0 the number of days in the future
         * @param {string} [days] days for which should be calculated the sun time
         * @return {timeresult|erroresult} result object of sunTime
         */
        getSunTime(now, value, offset, multiplier, next, days) {
            this.debug(`getSunTime value=${value} offset=${offset} multiplier=${multiplier} next=${next} days=${days} now=${now}`);

            let result;
            const dayid = this._getDayId(now); // this._getUTCDayId(now);
            const today = this._sunTimesCheck(); // refresh if needed, get dayId
            if (dayid === today.dayId) {
                result = Object.assign({}, this.sunTimesToday[value]); // needed for a object copy
            } else if (dayid === (today.dayId + 1)) {
                result = Object.assign({},this.sunTimesTomorow[value]); // needed for a object copy
            } else {
                this.debug('calc extra times ');
                result = Object.assign({},sunCalc.getSunTimes(now, this.latitude, this.longitude, false)[value]); // needed for a object copy
            }

            result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
            if (next && result.value.getTime() <= now.getTime()) {
                if (dayid === today.dayId) {
                    result = Object.assign(result, this.sunTimesTomorow[value]);
                    result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                }
                const datebase = new Date(now);
                while (result.value.getTime() <= now.getTime()) {
                    datebase.addDays(1);
                    result = Object.assign(result, sunCalc.getSunTimes(datebase, this.latitude, this.longitude, false)[value]);
                    result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                }
            }

            if (days && (days !== '*') && (days !== '')) {
                // this.debug('move days ' + days + ' result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                const dayx = hlp.calcDayOffset(days, result.value.getDay());
                if (dayx > 0) {
                    this._checkCoordinates();
                    const date = result.value.addDays(dayx);
                    result = Object.assign(result, sunCalc.getSunTimes(date, this.latitude, this.longitude, false)[value]);
                    result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                } else if (dayx < 0) {
                    // this.debug('getSunTime - no valid day of week found value=' + value + ' - next=' + next + ' - days=' + days + ' result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                    result.error = 'No valid day of week found!';
                }
            }

            this.debug('getSunTime result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            return result;
        }
        /*******************************************************************************************************/
        /**
         * @typedef {Object} moontime
         * @property {Date|NaN} value - a Date object of the neesed date/time
         */

        /**
        * gets moon time
        * @param {Date} now current time
        * @param {string} value name of the moon time
        * @param {number} [offset] the offset (positive or negative) which should be added to the date. If no multiplier is given, the offset must be in milliseconds.
        * @param {number} [multiplier] additional multiplier for the offset. Should be a positive Number. Special value -1 if offset is in month and -2 if offset is in years
        * @param {number} [next] if greater than 0 the number of days in the future
        * @param {string} [days] days for which should be calculated the moon time
        * @return {moontime|erroresult} result object of moon time
        */
        getMoonTime(now, value, offset, multiplier, next, days) {
            let result = {};
            const datebase = new Date(now);
            const dayid = this._getDayId(now); // this._getUTCDayId(now);
            const today = this._moonTimesCheck(); // refresh if needed, get dayId
            this.debug(`getMoonTime value=${value} offset=${offset} multiplier=${multiplier} next=${next} days=${days} now=${now} dayid=${dayid} today=${today}`);
            this.debug('data '+ util.inspect(this.moonTimesToday, { colors: true, compact: 10, breakLength: Infinity }));
            this.debug('value "'+ util.inspect(value, { colors: true, compact: 10, breakLength: Infinity }) + '"');
            this.debug('data - value '+ util.inspect(this.moonTimesToday[value], { colors: true, compact: 10, breakLength: Infinity }));

            if (dayid === today.dayId) {
                this.debug('today '+ util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                this.debug('today '+ util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                result.value = this.moonTimesToday[value]; // needed for a object copy
                this.debug('today '+ util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            } else if (dayid === (today.dayId + 1)) {
                result.value = this.moonTimesTomorow[value]; // needed for a object copy
                this.debug('tomorrow '+ util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            } else {
                result.value = sunCalc.getMoonTimes(now, this.latitude, this.longitude, false)[value]; // needed for a object copy
                this.debug('calc extra times '+ util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            }
            if (hlp.isValidDate(result.value)) {
                result.value = hlp.addOffset(new Date(result.value.getTime()), offset, multiplier);
                if (next && result.value.getTime() <= now.getTime()) {
                    if (dayid === today.dayId) {
                        result.value = this.sunTimesTomorow[value];
                        result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                    }
                    while (hlp.isValidDate(result.value) && result.value.getTime() <= now.getTime()) {
                        datebase.addDays(1);
                        result.value = sunCalc.getMoonTimes(datebase, this.latitude, this.longitude, false)[value];
                        result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                    }
                }
            }

            while (!hlp.isValidDate(result.value)) {
                datebase.addDays(1);
                result.value = sunCalc.getMoonTimes(datebase, this.latitude, this.longitude, false)[value];
            }
            result.value = new Date(result.value.getTime());

            if (days && (days !== '*') && (days !== '')) {
                // this.debug('move days ' + days + ' result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                const dayx = hlp.calcDayOffset(days, result.value.getDay());
                if (dayx > 0) {
                    this._checkCoordinates();
                    const date = result.value.addDays(dayx);
                    result.value = new Date(sunCalc.getMoonTimes(date, this.latitude, this.longitude, false)[value]);
                    result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                } else if (dayx < 0) {
                    // this.debug('getSunTime - no valid day of week found value=' + value + ' - next=' + next + ' - days=' + days + ' result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                    result.error = 'No valid day of week found!';
                }
            }

            this.debug('getMoonTime result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
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
        getFloatProp(_srcNode, msg, type, value, def, opCallback) {
            // _srcNode.debug('getFloatProp type='+type+' value='+value);
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
                data = this.getPropValue(_srcNode, msg, { type, value, callback:opCallback });
            }
            if (data === null || typeof data === 'undefined') {
                throw new Error(RED._('errors.error', { message: RED._('errors.notEvaluableProperty', {type, value}) }));
            }
            data = parseFloat(data);
            if (isNaN(data)) {
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
        * @property {string} [days] - valide days
        * @property {Date} [now] - base date, current time as default
        */

        /**
         * get the time Data prepared for output
         * @param {*} _srcNode - source node for logging
         * @param {*} [msg] - the message object
         * @param {outPropType} data - a Data object
         * @returns {*} output Data
         */
        getOutDataProp(_srcNode, msg, data) {
            _srcNode.debug(`getOutDataProp data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity }) } tzOffset=${this.tzOffset}`);
            // _srcNode.debug(`getOutDataProp type=${data.type} value=${data.value} format=${data.format} offset=${data.offset} offsetType=${data.offsetType} multiplier=${data.multiplier} next=${data.next} days=${data.days} tzOffset=${this.tzOffset}`);
            let now = new Date(data.now);
            if (!hlp.isValidDate(data.now)) { now = new Date(); }
            let result = null;
            if (data.type === null || data.type === 'none' || data.type === '' || (typeof data.type === 'undefined')) {
                if (data.value === '' || (typeof data.value === 'undefined')) {
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                    result = hlp.addOffset(now, offsetX, data.multiplier);
                    return hlp.getFormattedDateOut(result, data.format, (this.tzOffset === 0), this.tzOffset);
                }
                return data.value;
            } else if (data.type === 'date') {
                if (this.tzOffset) {
                    return hlp.convertDateTimeZone(Date.now(), this.tzOffset);
                }
                return Date.now();
            } else if (data.type === 'dateSpecific') {
                const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                result = hlp.addOffset(now, offsetX, data.multiplier);
                return hlp.getFormattedDateOut(result, data.format, (this.tzOffset === 0), this.tzOffset);
            } else if ((data.type === 'pdsTime') || (data.type === 'pdmTime')) {
                if (data.type === 'pdsTime') { // sun
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                    result = this.getSunTime(now, data.value, offsetX, data.multiplier, data.next, data.days);
                } else if (data.type === 'pdmTime') { // moon
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                    result = this.getMoonTime(now, data.value, offsetX, data.multiplier, data.next, data.days);
                }
                if (result && result.value && !result.error) {
                    return hlp.getFormattedDateOut(result.value, data.format, (this.tzOffset === 0), this.tzOffset);
                }
                return null;
            } else if (data.type === 'entered' || data.type === 'dateEntered') {
                result = hlp.getDateOfText(String(data.value), (this.tzOffset === 0), this.tzOffset);
                const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                result = hlp.normalizeDate(result, offsetX, data.multiplier, data.next, data.days);
                return hlp.getFormattedDateOut(result, data.format, (this.tzOffset === 0), this.tzOffset);
            } else if (data.type === 'dayOfMonth') {
                result = new Date();
                result = hlp.getSpecialDayOfMonth(result.getFullYear(),result.getMonth(), data.value);
                if (result !== null && typeof result !== 'undefined') {
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                    result = hlp.normalizeDate(result, offsetX, data.multiplier, data.next, data.days);
                    return hlp.getFormattedDateOut(result, data.format, (this.tzOffset === 0), this.tzOffset);
                }
                return null;
            }
            return this.getPropValue(_srcNode, msg, { type: data.type, value: data.value });
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
        * @property {string} [days] - valide days
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
         * @returns {timePropResultType} value of the type input
         */
        getTimeProp(_srcNode, msg, data) {
            // _srcNode.debug(`getTimeProp data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })} tzOffset=${this.tzOffset}`);
            let result = {
                value: null,
                error: null,
                fix: true
            };
            let now = new Date(data.now);
            if (!hlp.isValidDate(data.now)) { now = new Date(); }
            try {
                if (data.days === '') {
                    result.error = 'No valid Days given!';
                } else if (data.type === '' || data.type === 'none' || data.type === null) {
                    result.error = 'wrong type "' + data.type + '"="' + data.value+'"';
                } else if (data.type === 'date') {
                    result.value = now;
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                    result.fix = true;
                } else if (data.type === 'dateSpecific') {
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                    result.value = hlp.normalizeDate(now, offsetX, data.multiplier, data.next, data.days);
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value);
                    }
                    result.fix = true;
                } else if (data.type === 'dayOfMonth') {
                    result.value = hlp.getSpecialDayOfMonth(now.getFullYear(), now.getMonth(), data.value);
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                    result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data.next, data.days);
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value);
                    }
                } else if (data.type === 'entered') {
                    result.value = hlp.getTimeOfText(String(data.value), now, (this.tzOffset === 0), this.tzOffset);
                    if (result.value !== null) {
                        const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                        result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data.next, data.days);
                    }
                    result.fix = true;
                } else if (data.type === 'dateEntered') {
                    result.value =  hlp.getDateOfText(String(data.value), (this.tzOffset === 0), this.tzOffset);
                    if (result.value !== null) {
                        const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                        result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data.next, data.days);
                    }
                    result.fix = true;
                } else if (data.type === 'pdsTime') {
                    // sun
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                    result = this.getSunTime(now, data.value, offsetX, data.multiplier, data.next, data.days);
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                    result.fix = true;
                } else if (data.type === 'pdmTime') {
                    // moon
                    const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                    result = this.getMoonTime(now, data.value, offsetX, data.multiplier, data.next, data.days);
                    if (this.tzOffset) {
                        result.value = hlp.convertDateTimeZone(result.value, this.tzOffset);
                    }
                    result.fix = true;
                } else {
                    // can handle context, json, jsonata, env, ...
                    result.fix = (data.type === 'json'); // is not a fixed time if can be changed
                    const res = this.getPropValue(_srcNode, msg, data);
                    if (res) {
                        if (data.format) {
                            result.value = hlp.parseDateFromFormat(result.value, data.format, RED._('position-config.days'), RED._('position-config.month'), RED._('position-config.dayDiffNames'));
                        } else {
                            result.value = hlp.getDateOfText(res, (this.tzOffset === 0), this.tzOffset);
                        }
                        const offsetX = this.getFloatProp(_srcNode, msg, data.offsetType, data.offset, 0);
                        result.value = hlp.normalizeDate(result.value, offsetX, data.multiplier, data.next, data.days);
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
                const e = new Error(RED._('errors.error', { message: RED._('errors.notEvaluablePropertyAdd', {type:data.type, value: data.value, err:result.error}) }) );
                e.original = err;
                e.stack = e.stack.split('\n').slice(0,2).join('\n')+'\n'+err.stack;
                throw e;
            }
            if (!hlp.isValidDate(result.value)) {
                if (!result.error) {
                    result.error = 'Can not get time for ' + data.type + '=' + data.value;
                }
                result.value = new Date(now);
            }
            _srcNode.debug(`getTimeProp data=${util.inspect(data, { colors: true, compact: 10, breakLength: Infinity })} tzOffset=${this.tzOffset} result=${ util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }) }`);
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
        * @param {*} msg - message object
        * @param {propValueType} data - data object with more information
        * @returns {*} value of the type input, return of the callback function if defined or __null__ if value could not resolved
        */
        getPropValue(_srcNode, msg, data) {
            // _srcNode.debug(`getPropValue ${data.type}.${data.value} (${data.addID})`);
            let result = null;
            if (data.type === '' || data.type === 'none' || typeof data.type === 'undefined' || data.type === null) {
                result = null;
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
            } else if (data.type === 'msgValue') {
                result = msg.value;
            } else if (data.type === 'msgTs') {
                result =  msg.ts;
            } else if (data.type === 'msgLc') {
                result = msg.lc;
            } else if (data.type === 'pdsCalcData') {
                result = this.getSunCalc(msg.ts);
            } else if (data.type === 'pdmCalcData') {
                result = this.getMoonCalc(msg.ts);
            } else if (data.type === 'pdmPhase') {
                result = this.getMoonPhase(msg.ts);
            } else if (data.type === 'pdmPhaseCheck') {
                const pahse = this.getMoonPhase(msg.ts);
                result = (pahse === data.value);
            } else if (data.type === 'entered' || data.type === 'dateEntered') {
                result = hlp.getDateOfText(String(data.value), (this.tzOffset === 0), this.tzOffset);
            } else {
                try {
                    result = RED.util.evaluateNodeProperty(data.value, data.type, _srcNode, msg);
                } catch (err) {
                    _srcNode.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                }
            }
            if (typeof data.callback === 'function') {
                return data.callback(data.type, data.value, result, data);
            } else if (result === null || typeof result === 'undefined') {
                _srcNode.error(RED._('errors.error', { message: RED._('errors.notEvaluableProperty', data) }) );
                return null;
            }
            // _srcNode.debug('getPropValue result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }) + ' - ' + typeof result);
            return result;
        }
        /*******************************************************************************************************/
        comparePropValue(_srcNode, msg, opTypeA, opValueA, compare, opTypeB, opValueB, opCallback) { // eslint-disable-line complexity
            // _srcNode.debug(`getComparablePropValue opTypeA='${opTypeA}' opValueA='${opValueA}' compare='${compare}' opTypeB='${opTypeB}' opValueB='${opValueB}'`);
            if (opTypeA === 'none' || opTypeA === '' || typeof opTypeA === 'undefined' || opTypeA === null) {
                return false;
            } else if (opTypeA === 'jsonata' || opTypeA === 'pdmPhaseCheck') {
                compare = 'true';
            }

            const a = this.getPropValue(_srcNode, msg, { type: opTypeA, value: opValueA, callback: opCallback, addID: 1 });
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
                    return (a == this.getPropValue(_srcNode, msg, { type: opTypeB, value: opValueB, callback: opCallback, addID: 2 }));  // eslint-disable-line eqeqeq
                case 'nequal':
                    return (a != this.getPropValue(_srcNode, msg, { type: opTypeB, value: opValueB, callback: opCallback, addID: 2 }));  // eslint-disable-line eqeqeq
                case 'lt':
                    return (a < this.getPropValue(_srcNode, msg, { type: opTypeB, value: opValueB, callback: opCallback, addID: 2 }));
                case 'lte':
                    return (a <= this.getPropValue(_srcNode, msg, { type: opTypeB, value: opValueB, callback: opCallback, addID: 2 }));
                case 'gt':
                    return (a > this.getPropValue(_srcNode, msg, { type: opTypeB, value: opValueB, callback: opCallback, addID: 2 }));
                case 'gte':
                    return (a >= this.getPropValue(_srcNode, msg, { type: opTypeB, value: opValueB, callback: opCallback, addID: 2 }));
                case 'contain':
                    return ((a + '').includes(this.getPropValue(_srcNode, msg, { type: opTypeB, value: opValueB, callback: opCallback, addID: 2 })));
                case 'containSome': {
                    const vals = this.getPropValue(_srcNode, msg, { type: opTypeB, value: opValueB, callback: opCallback, addID: 2 }).split(/,;\|/);
                    const txt = (a + '');
                    return vals.some(v => txt.includes(v));
                }
                case 'containEvery': {
                    const vals = this.getPropValue(_srcNode, msg, { type: opTypeB, value: opValueB, callback: opCallback, addID: 2 }).split(/,;\|/);
                    const txt = (a + '');
                    return vals.every(v => txt.includes(v));
                }
                default:
                    _srcNode.error(RED._('errors.unknownCompareOperator', { operator: compare }));
                    return hlp.isTrue(a);
            }
        }
        /**************************************************************************************************************/
        getSunCalc(date, noTimes) {
            // this.debug(`getSunCalc for date="${date}" noTimes="${noTimes}"`);
            if (typeof date === 'string') {
                const dto = new Date(date);
                if (hlp.isValidDate(dto)) {
                    date = dto;
                }
            }
            if (!hlp.isValidDate(date)) {
                date = new Date(date);
            }

            if ((typeof date === 'undefined') || !(date instanceof Date)) {
                this.debug('getSunCalc, no valid date ' + date + ' given');
                date = new Date();
                if (this.lastSunCalc && (Math.abs(date.getTime() - this.lastSunCalc.ts) < 4000)) {
                    this.debug('getSunCalc, time difference since last output to low, do no calculation');
                    return this.lastSunCalc;
                }
            }

            const sunPos = sunCalc.getPosition(date, this.latitude, this.longitude, false);
            const azimuthDegrees = 180 + 180 / Math.PI * sunPos.azimuth;
            const altitudeDegrees = 180 / Math.PI * sunPos.altitude; // elevation = altitude

            const result = {
                ts: date.getTime(),
                lastUpdate: date,
                latitude: this.latitude,
                longitude: this.longitude,
                angleType: this.angleType,
                azimuth: (this.angleType === 'deg') ? azimuthDegrees : sunPos.azimuth,
                altitude: (this.angleType === 'deg') ? altitudeDegrees : sunPos.altitude, // elevation = altitude
                altitudeDegrees,
                azimuthDegrees,
                altitudeRadians: sunPos.altitude,
                azimuthRadians: sunPos.azimuth
            };

            if (noTimes) {
                // this.debug('no times result= ' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                return result;
            }
            this._sunTimesCheck();
            result.times = this.sunTimesToday;
            this.lastSunCalc = result;
            // this.debug('result= ' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            return result;
        }

        /**************************************************************************************************************/
        getMoonIllumination(date) {
            if (typeof date === 'string') {
                const dto = new Date(date);
                if (hlp.isValidDate(dto)) {
                    date = dto;
                }
            }
            if (!hlp.isValidDate(date)) {
                date = new Date(date);
            }
            const moonIllum = sunCalc.getMoonIllumination(date, false);
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

        getMoonCalc(date, noTimes) {
            if (typeof date === 'string') {
                const dto = new Date(date);
                if (hlp.isValidDate(dto)) {
                    date = dto;
                }
            }
            if (!hlp.isValidDate(date)) {
                date = new Date(date);
            }

            if (this.lastMoonCalc (Math.abs(date.getTime() - this.lastMoonCalc.ts) < 3000)) {
                return this.lastMoonCalc;
            }

            const moonPos = sunCalc.getMoonPosition(date, this.latitude, this.longitude, false);
            const moonIllum = this.getMoonIllumination(date);

            const result = {
                ts: date.getTime(),
                lastUpdate: date,
                latitude: this.latitude,
                longitude: this.longitude,
                angleType: this.angleType,
                azimuth: (this.angleType === 'deg') ? 180 + 180 / Math.PI * moonPos.azimuth : moonPos.azimuth,
                altitude: (this.angleType === 'deg') ? 180 / Math.PI * moonPos.altitude : moonPos.altitude, // elevation = altitude
                distance: moonPos.distance,
                parallacticAngle: (this.angleType === 'deg') ? 180 / Math.PI * moonPos.parallacticAngle : moonPos.parallacticAngle,
                illumination: {
                    angle: (this.angleType === 'deg') ? 180 / Math.PI * moonIllum.angle : moonIllum.angle,
                    fraction: moonIllum.fraction,
                    phase: moonIllum.phase,
                    zenithAngle: (this.angleType === 'deg') ? 180 / Math.PI * (moonIllum.angle - moonPos.parallacticAngle) : moonIllum.angle - moonPos.parallacticAngle
                }
            };

            if (noTimes) { return result; }
            this._sunTimesCheck();
            result.times = this.moonTimesToday;
            // getAngle : angle / 57.2957795130823209 //angle(rad) * (180° / Pi) = angle(deg)

            if (!result.times.alwaysUp) {
                // true if the moon never rises/sets and is always above the horizon during the day
                result.times.alwaysUp = false;
            }

            if (!result.times.alwaysDown) {
                // true if the moon is always below the horizon
                result.times.alwaysDown = false;
            }

            this.lastMoonCalc = result;

            return result;
        }

        getMoonPhase(date) {
            let result;
            const now = new Date();
            if (typeof date === 'string') {
                const dto = new Date(date);
                if (hlp.isValidDate(dto)) {
                    date = dto;
                }
            }
            if (!hlp.isValidDate(date)) {
                date = now;
            }
            const dayidReq = this._getDayId(date); // this._getUTCDayId(now);
            const dayIdNow = this._getDayId(now); // this._getUTCDayId(dateb);

            if (dayidReq === dayIdNow) {
                if (dayIdNow !== this.moonIlluDayId) {
                    this.moonIlluminationToday = this.getMoonIllumination(date, false);
                    this.moonIlluDayId = dayIdNow;
                }
                result = Object.assign({}, this.moonIlluminationToday.phase); // needed for a object copy
            } else {
                result = Object.assign({},this.getMoonIllumination(date, false).phase); // needed for a object copy
            }

            this.debug('getMoonPhase result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
            return result;
        }
        /**************************************************************************************************************/
        _checkCoordinates() {
            if (isNaN(this.longitude) || (this.longitude < -180) || (this.longitude > 180)) {
                throw new Error(RED._('position-config.errors.longitude-missing'));
            }
            if (isNaN(this.latitude) || (this.latitude < -90) || (this.latitude > 90)) {
                throw new Error(RED._('position-config.errors.latitude-missing'));
            }
            if ((this.latitude === 0) && (this.longitude === 0)) {
                throw new Error(RED._('position-config.errors.coordinates-missing'));
            }
        }

        _sunTimesRefresh(today, tomorrow, dayId) {
            this._checkCoordinates();
            this.sunTimesToday = sunCalc.getSunTimes(today, this.latitude, this.longitude, false);
            this.sunTimesTomorow = sunCalc.getSunTimes(tomorrow, this.latitude, this.longitude, false);
            this.sunDayId = dayId;
            this.debug(`sunTimesRefresh - calculate sun times - dayId=${ dayId }, today=${ today.toISOString() }, tomorrow=${ tomorrow.toISOString() } `); //  + util.inspect(this.sunTimesToday, { colors: true, compact: 40 }));
        }

        _sunTimesCheck(force) {
            // this.debug('_sunTimesCheck');
            const calcDate = new Date();
            const dayId = this._getDayId(calcDate); // _getUTCDayId(calcDate);
            if (force || this.sunDayId !== dayId) {
                this.debug(`_sunTimesCheck - need refresh - force=${ force }, base-dayId=${ this.sunDayId } current-dayId=${ dayId }`);
                const tomorrow = (new Date()).addDays(1);
                this._sunTimesRefresh(calcDate, tomorrow, dayId);
            }

            return {
                calcDate,
                dayId
            };
        }

        _moonTimesRefresh(today, tomorrow, dayId) {
            this._checkCoordinates();
            // this.debug('moonTimesRefresh - calculate moon times');
            this.moonTimesToday = sunCalc.getMoonTimes(today, this.latitude, this.longitude, false);
            if (!this.moonTimesToday.alwaysUp) {
                // true if the moon never rises/sets and is always above the horizon during the day
                this.moonTimesToday.alwaysUp = false;
            }

            if (!this.moonTimesToday.alwaysDown) {
                // true if the moon is always below the horizon
                this.moonTimesToday.alwaysDown = false;
            }

            this.moonTimesTomorow = sunCalc.getMoonTimes(tomorrow, this.latitude, this.longitude, false);
            if (!this.moonTimesTomorow.alwaysUp) {
                // true if the moon never rises/sets and is always above the horizon during the day
                this.moonTimesTomorow.alwaysUp = false;
            }

            if (!this.moonTimesTomorow.alwaysDown) {
                // true if the moon is always below the horizon
                this.moonTimesTomorow.alwaysDown = false;
            }

            this.moonDayId = dayId;
        }

        _moonTimesCheck(force) {
            // this.debug('moonTimesCheck');
            const calcDate = new Date();
            const dayId = this._getDayId(calcDate); // this._getUTCDayId(dateb);
            if (force || this.moonDayId !== dayId) {
                this.debug(`_moonTimesCheck - need refresh - force=${ force }, base-dayId=${ this.moonDayId } current-dayId=${ dayId }`);
                const tomorrow = (new Date()).addDays(1);
                this._moonTimesRefresh(calcDate, tomorrow, dayId);
            }

            return {
                calcDate,
                dayId
            };
        }

        _getUTCDayId(d) {
            return d.getUTCDay() + (d.getUTCMonth() * 31) + (d.getUTCFullYear() * 372);
        }

        _getDayId(d) {
            return d.getDay() + (d.getMonth() * 31) + (d.getFullYear() * 372);
        }
    }

    /**************************************************************************************************************/
    RED.nodes.registerType('position-config', positionConfigurationNode, {
        credentials: {
            posLongitude: {type: 'text' },
            posLatitude: { type: 'text' }
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
        if (req.query.config && req.query.config !== '_ADD_') {
            const posConfig = RED.nodes.getNode(req.query.config);
            if (!posConfig) {
                res.status(500).send(JSON.stringify({}));
                return;
            }
            let obj = {};
            switch (req.query.kind) {
                case 'getTimeData': {
                    try {
                        obj = posConfig.getTimeProp(posConfig, undefined, req.query); // req.query.type, req.query.value, req.query.offsetType, req.query.offset, req.query.multiplier, req.query.next, req.query.days);
                    } catch(err) {
                        obj.value = NaN;
                        obj.error = err;
                    }
                    res.status(200).send(JSON.stringify(obj));
                    break;
                }
                case 'getOutDataData': {
                    try {
                        obj = posConfig.getOutDataProp(posConfig, undefined, req.query); // req.query.type, req.query.value, req.query.format, req.query.offset, req.query.offsetType, req.query.multiplier, req.query.next, req.query.days);
                    } catch(err) {
                        obj.value = NaN;
                        obj.error = err;
                    }
                    res.status(200).send(JSON.stringify(obj));
                    break;
                }
            }
        }
    });
};