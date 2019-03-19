/********************************************
 * dateTimeHelper.js:
 *********************************************/
'use strict';
const util = require('util');

module.exports = {
    isTrue,
    isFalse,
    handleError,
    chkValueFilled,
    getSpecialDayOfMonth,
    checkLimits,
    addOffset,
    calcDayOffset,
    normalizeDate,
    getTimeOfText,
    getDateOfText,
    getTimeNumber,
    getNodeId,
    initializeParser,
    getFormattedDateOut,
    parseDateFromFormat
};

/*******************************************************************************************************/
/* Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setUTCDate(date.getUTCDate() + days);
    return date;
} */

/*******************************************************************************************************/
/* simple functions                                                                                    */
/*******************************************************************************************************/
/**
 * returns **true** if the parameter value is a valid boolean value for **true**
 * @param {*} val a parameter which should be checked if  it is a valid true boolean
 * @returns {boolean} true if the parameter value is a valid boolean value for **true**
 */
function isTrue(val) {
    val = (val+'').toLowerCase();
    return (val === 'true' || val === 'yes' || val === 'on' || val === 'ja' || val === '1' || (!isNaN(val) && (Number(val) > 0)));
}

/**
 * returns **true** if the parameter value is a valid boolean value for **false**
 * @param {*} val a parameter which should be checked if  it is a valid false boolean
 * @returns {boolean} true if the parameter value is a valid boolean value for **false**
 */
function isFalse(val) {
    val = (val+'').toLowerCase();
    return (val === 'false' || val === 'no' || val === 'off' || val === 'nein' || val === '0' || (!isNaN(val) && (Number(val) <= 0)));
}
/*******************************************************************************************************/
/**
 * gives a ID of a node
 * @param {any} node a node
 * @returns {string} id of the given node
 */
function getNodeId(node) {
    return '[' + node.type + ((node.name) ? '/' + node.name + ':' : ':') + node.id + ']';
}
/*******************************************************************************************************/
/**
 * creates a string with two digits
 * @param {number} n number to format
 * @returns {string} number with minimum two digits
 */
function pad2(n) { // always returns a string
    return (n < 0 || n > 9 ? '' : '0') + n;
}
/*******************************************************************************************************/
/**
 * gets a comparable date Format
 * @param {Date} date - Date to format
 * @return {string} number in Format YYYYMMDDHHMMSS
 */
function _getComparableDateFormat(date) {
    return Number(date.getFullYear() +
        pad2(date.getMonth() + 1) +
        pad2(date.getDate()) +
        pad2(date.getHours()) +
        pad2(date.getMinutes()) +
        pad2(date.getSeconds()));
}
/*******************************************************************************************************/
/* Node-Red Helper functions                                                                           */
/*******************************************************************************************************/
/**
 * generic function for handle a error in a node
 * @param {any} node the node where the error occurs
 * @param {String} messageText the message text
 * @param {Error} err the error object
 * @param {string} stateText the state text which should be set to the node
 */
function handleError(node, messageText, err, stateText) {
    if (!err) {
        err = new Error(messageText);
    } else {
        if (messageText && err.message) {
            messageText += ':' + err.message;
        } else if (err.message) {
            messageText = err.message;
        }
    }

    if (node && messageText) {
        node.error(messageText);
        node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
        node.status({
            fill: 'red',
            shape: 'ring',
            text: (stateText) ? stateText : messageText
        });
    } else if (console) {
        /* eslint-disable no-console */
        console.error(messageText);
        console.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
        console.trace();
        /* eslint-enable no-console */
    }
}

/*******************************************************************************************************/
/**
 * check if a value is filled or returns default value
 * @param {any} val to check for undefined, null, empty
 * @param {any} defaultVal default value to use
 * @returns {any} result to use if value is undefined, null or empty string
 */
function chkValueFilled(val, defaultVal) {
    return ((typeof val === 'undefined') || (val === '') || (val === null)) ? defaultVal : val;
}

/*******************************************************************************************************/
/**
 * get a date for the first day of week in the given month
 * @param {number} year year to check
 * @param {number} month month to check
 * @param {number} [dayOfWeek]  Day of week, where 0 is Sunday, 1 Monday ... 6 Saturday
 * @returns {Date} first day of given month
 */
function _getFirstDayOfMonth(year, month, dayOfWeek) {
    const d = new Date(year, month, 1);
    dayOfWeek = dayOfWeek || 1; // Monday
    while (d.getDay() !== dayOfWeek) {
        d.setDate(d.getDate() + 1);
    }
    return d;
}

/**
 * get a date for the last day of week in the given month
 * @param {number} year year to check
 * @param {number} month month to check
 * @param {number} [dayOfWeek]  Day of week, where 0 is Sunday, 1 Monday ... 6 Saturday
 * @returns {Date} last day of given month
 */
function _getLastDayOfMonth(year, month, dayOfWeek) {
    const d = new Date(year, month+1, 0);
    dayOfWeek = dayOfWeek || 1; // Monday
    while (d.getDay() !== dayOfWeek) {
        d.setDate(d.getDate() - 1);
    }
    return d;
}

/**
 * get a date for the special day in the given month
 * @param {number} year year to check
 * @param {number} month month to check
 * @param {number} dayName  Name of the special day
 * @returns {Date} last day of given month or null
 */
function getSpecialDayOfMonth(year, month, dayName) {
    switch (dayName) {
        case 'first Monday':
            return _getFirstDayOfMonth(year, month, 1);
        case 'first Tuesday':
            return _getFirstDayOfMonth(year, month, 2);
        case 'first Wednesday':
            return _getFirstDayOfMonth(year, month, 3);
        case 'first Thursday':
            return _getFirstDayOfMonth(year, month, 4);
        case 'first Friday':
            return _getFirstDayOfMonth(year, month, 5);
        case 'first Saturday':
            return _getFirstDayOfMonth(year, month, 6);
        case 'first Sunday':
            return _getFirstDayOfMonth(year, month, 0);
        case 'last Monday':
            return _getLastDayOfMonth(year, month, 1);
        case 'last Tuesday':
            return _getLastDayOfMonth(year, month, 2);
        case 'last Wednesday':
            return _getLastDayOfMonth(year, month, 3);
        case 'last Thursday':
            return _getLastDayOfMonth(year, month, 4);
        case 'last Friday':
            return _getLastDayOfMonth(year, month, 5);
        case 'last Saturday':
            return _getLastDayOfMonth(year, month, 6);
        case 'last Sunday':
            return _getLastDayOfMonth(year, month, 0);
    }
    return null;
}
/*******************************************************************************************************/
/* date-time functions                                                                                 */
/*******************************************************************************************************/
/**
 * gets a date from a comparable date Format
 * @param {number} date - number or string in Format YYYYMMDDHHMMSS
 * @return {Date} date of the number
 */
function _parseComparableDateFormat(date) {
    date = String(date);
    const year = date.substr(0, 4);
    const month = date.substr(4, 2);
    const day = date.substr(6, 2);
    const hours = date.substr(8, 2);
    const mins = date.substr(10, 2);
    const secs = date.substr(12, 2);
    const mss = date.substr(14);
    return new Date(year, month, day, hours, mins, secs, mss);
}

/*******************************************************************************************************/
/**
 * gets a comparable date Format
 * @param {Date} date - Date to format
 * @return {string} number in Format YYYYMMDD.HHMMSS
 */
function _getComparableDateFormat2(date) {
    return Number(date.getFullYear() +
        pad2(date.getMonth() + 1) +
        pad2(date.getDate()) + '.' +
        pad2(date.getHours()) +
        pad2(date.getMinutes()) +
        pad2(date.getSeconds()));
}

/*******************************************************************************************************/
/**
 * gets a date from a comparable date Format
 * @param {number} date - number or string in Format YYYYMMDD.HHMMSS or YYYYMMDDTHHMMSS
 * @return {Date} date of the number
 */
function _parseComparableDateFormat2(date) {
    date = String(date);
    const year = date.substr(0, 4);
    const month = date.substr(4, 2);
    const day = date.substr(6, 2);
    const hours = date.substr(9, 2);
    const mins = date.substr(11, 2);
    const secs = date.substr(13, 2);
    const mss = date.substr(15);
    return new Date(year, month, day, hours, mins, secs, mss);
}

/*******************************************************************************************************/
/**
 * convert the time part of a date into a comparable number
 * @param {Date} date  - date to convert
 * @return {number}   numeric representation of the time part of the date
 */
function getTimeNumber(date) {
    return date.getUTCMilliseconds() + date.getUTCSeconds() * 1000 + date.getUTCMinutes() * 60000 + date.getUTCHours() * 3600000;
}

/*******************************************************************************************************/
/**
 * check if a given number is in given limits
 * @param {number} num number angle to compare
 * @param {number} low low limit
 * @param number*} high high limit
 * @return {bool}  **true** if the number is inside given limits, at least one limit must be validate, otherwise returns **false**
 */
function checkLimits(num, low, high) {
    if (typeof low !== 'undefined' && low !== '' && !isNaN(low) && low >= 0) {
        if (typeof high !== 'undefined' && high !== '' && !isNaN(high) && high >= 0) {
            if (high > low) {
                return (num > low) && (num < high);
            }

            return (num > low) || (num < high);
        }

        return (num > low);
    }

    if (typeof high !== 'undefined' && high !== '' && !isNaN(high)) {
        return (num < high);
    }

    return false;
}

/*******************************************************************************************************/
/**
 * adds an offset to a given Date object
 * @param {Date} d Date object where the offset should be added
 * @param {number} offset the offset (positive or negative) which should be added to the date. If no multiplier is given, the offset must be in milliseconds.
 * @param {number} [multiplier] additional multiplier for the offset. Should be a positive Number. Special value -1 if offset is in month and -2 if offset is in years
 * @return {Date}  Date with added offset
 */
function addOffset(d, offset, multiplier) {
    if (d.value) { d = d.value; }
    if (!(d instanceof Date)) { d = Date(d); }

    if (offset && !isNaN(offset) && offset !== 0) {
        if (offset !== 0 && multiplier > 0) {
            return new Date(d.getTime() + offset * multiplier);
        } else if (multiplier === -1) {
            d.setMonth(d.getMonth() + offset);
        } else if (multiplier === -2) {
            d.setFullYear(d.getFullYear() + offset);
        } else {
            return new Date(d.getTime() + offset); // if multiplier is not a valid value
        }
    }
    return d;
}

/*******************************************************************************************************/
/**
 * calculates the number of days to get a positive date object
 * @param {Array.<number>} days array of allowed days
 * @param {number} daystart start day (0=Sunday)
 * @return {number} number of days for the next valid day as offset to the daystart
 */
function calcDayOffset(days, daystart) {
    let dayx = 0;
    let daypos = daystart;
    while (days.indexOf(daypos) === -1) {
        dayx += 1;
        if ((daystart + dayx) > 6) {
            daystart = (dayx * -1);
        }

        daypos = daystart + dayx;

        if (dayx > 7) {
            dayx = -1;
            break;
        }
    }
    return dayx;
}

/*******************************************************************************************************/
/**
 * normalize date by adding offset, get only the next valid date, etc...
 * @param {Date} d input Date to normalize
 * @param {number} offset offset to add tot he Date object
 * @param {number} multiplier multiplier for the offset
 * @param {number} next If date is less then today this number of days will be added to the date
 * @param {Array.<number>} days array of allowed days
 * @return {Date} a normalized date moved tot the future to fulfill all conditions
 */
function normalizeDate(d, offset, multiplier, next, days) {
    // console.debug('normalizeDate d=' + d + ' offset=' + offset + ' next=' + next + ' days=' + days); // eslint-disable-line
    d = addOffset(d, offset, multiplier);
    if (next && !isNaN(next)) {
        const now = new Date();
        d.setMilliseconds(0);
        now.setMilliseconds(600); // security
        const cmp = now.getTime();
        if (d.getTime() <= cmp) {
            d.setDate(d.getDate() + Number(next));
        }
    }

    if (days && (days !== '*') && (days !== '')) {
        const dayx = calcDayOffset(days, d.getDay());
        if (dayx > 0) {
            d.setDate(d.getDate() + dayx);
        }
    }
    return d;
}

/*******************************************************************************************************/
/**
 * parses a string which contains only a time to a Date object of today
 * @param {string} t text representation of a time
 * @param {Date} [date] bade Date object for parsing the time, now will be used if not defined
 * @return {Date} the parsed date object or **null** if can not parsed
 */
function getTimeOfText(t, date) {
    // console.debug('getTimeOfText t=' + t + ' date=' + date); // eslint-disable-line
    const d = date || new Date();
    if (t && (t.indexOf('.') === -1) && (t.indexOf('-') === -1)) {
        const matches = t.match(/(0\d|1\d|2[0-3]|\d)(?::([0-5]\d|\d))(?::([0-5]\d|\d))?\s*(p?)/);
        if (matches) {
            d.setHours((parseInt(matches[1]) + (matches[4] ? 12 : 0)),
                (parseInt(matches[2]) || 0),
                (parseInt(matches[3]) || 0), 0);
        } else {
            return null;
        }
        return d;
    }
    return null;
}
/*******************************************************************************************************/
/**
 * parses a string which contains a date or only a time to a Date object
 * @param {any} dt number or text which contains a date or a time
 * @return {Date} the parsed date object, throws an error if can not parsed
 */
function getDateOfText(dt, preferMonthFirst) {
    // console.log('getDateOfText dt=' + util.inspect(dt)); // eslint-disable-line
    if (dt === null || typeof dt === 'undefined') {
        throw new Error('Could not evaluate as a valid Date or time. Value is null or undefined!');
    } else if (dt === '') {
        return new Date();
    }

    if (typeof dt === 'object') {
        if (dt.hasOwnProperty('now')) {
            dt = dt.now;
        } else if (dt.hasOwnProperty('date')) {
            dt = dt.date;
        } else if (dt.hasOwnProperty('time')) {
            dt = dt.time;
        } else if (dt.hasOwnProperty('ts')) {
            dt = dt.ts;
        } else if (dt.hasOwnProperty('lc')) {
            dt = dt.lc;
        } else if (dt.hasOwnProperty('value')) {
            dt = dt.lc;
        } else if (dt.hasOwnProperty('payload')) {
            dt = dt.payload;
        } else if (dt.hasOwnProperty('timeStamp')) {
            dt = dt.timeStamp;
        } else if (dt.hasOwnProperty('created')) {
            dt = dt.created;
        } else if (dt.hasOwnProperty('changed')) {
            dt = dt.changed;
        } else {
            dt = String(dt);
        }
    }

    const re = /^(0\d|\d|1\d|2[0-3])(?::([0-5]\d|\d))?(?::([0-5]\d|\d))?\s*(pm?)?$/;
    if (re.test(String(dt))) {
        const result = getTimeOfText(String(dt));
        if (result !== null) {
            return result;
        }
    }

    if (!isNaN(dt)) {
        dt = Number(dt);
    }

    const dto = new Date(dt);
    if (dto !== 'Invalid Date' && !isNaN(dto)) {
        return dto;
    }

    if (typeof dt === 'string') {
        let res = _parseDateTime(dt, preferMonthFirst);
        if (res !== null) { return res; }
        res = _parseDate(dt, preferMonthFirst);
        if (res !== null) { return res; }
        res = _parseArray(dt, dateFormat.parseTimes);
        if (res !== null) { return res; }
        res = Date.parse(dt);
        if (!isNaN(res)) { return res; }
    }
    throw new Error('could not evaluate ' + String(dt) + ' as a valid Date or time.');
}
/*******************************************************************************************************/
/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 *
 * http://blog.stevenlevithan.com/archives/date-time-format
 * http://stevenlevithan.com/assets/misc/date.format.js
 */

// Regexes and supporting functions are cached through closure

/**
 * Formate a date to the given Format string
 * @param  {Date} date -  JavaScript Date to format
 * @param  {string} mask -  mask of the date
 * @return {string}   date as depending on the given Format
 */
const dateFormat = (function () {
    const token = /x{1,2}|d{1,4}|E{1,2}|M{1,4}|NNN|yy(?:yy)?|([HhKkmsTt])\1?|l{1,3}|[LoSZ]|"[^"]*"|'[^']*'/g;

    const timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;

    const timezoneClip = /[^-+\dA-Z]/g;

    const pad = function (val, len) {
        val = String(val);
        len = len || 2;
        while (val.length < len) {
            val = '0' + val;
        }

        return val;
    };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        const dF = dateFormat;
        // You can't provide utc if you skip other Args. (use the "UTC:" mask prefix)
        if (arguments.length === 1 && Object.prototype.toString.call(date) === '[object String]' && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        const now = new Date();
        date = date ? new Date(date) : now;
        const dayDiff = (date.getDate() - now.getDate());
        if (isNaN(date)) {
            throw new SyntaxError('invalid date');
        }

        mask = String(dF.masks[mask] || mask || dF.masks.default);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) === 'UTC:') {
            mask = mask.slice(4);
            utc = true;
        }

        const _ = utc ? 'getUTC' : 'get';
        const d = date[_ + 'Date']();
        const D = date[_ + 'Day']();
        const M = date[_ + 'Month']();
        const y = date[_ + 'FullYear']();
        const H = date[_ + 'Hours'](); // 0-23
        const m = date[_ + 'Minutes']();
        const s = date[_ + 'Seconds']();
        const l = date[_ + 'Milliseconds']();
        const o = utc ? 0 : date.getTimezoneOffset();

        const flags = {
            d,
            dd: pad(d),
            ddd: dF.i18n.dayNames[D + 7],
            dddd: dF.i18n.dayNames[D],
            E: dF.i18n.dayNames[D + 7],
            EE: dF.i18n.dayNames[D],
            M: M + 1,
            MM: pad(M + 1),
            MMM: dF.i18n.monthNames[M + 12],
            MMMM: dF.i18n.monthNames[M],
            NNN: dF.i18n.monthNames[M],
            yy: String(y).slice(2),
            yyyy: y,
            h: H % 12 || 12,
            hh: pad(H % 12 || 12),
            H, // 0-23
            HH: pad(H), // 00-23
            k: (H % 12 || 12) - 1,
            kk: pad((H % 12 || 12) - 1),
            K: H + 1,
            KK: pad(H + 1),
            m,
            mm: pad(m),
            s,
            ss: pad(s),
            l,
            ll: pad(l),
            lll: pad(l, 3),
            L: Math.round(l / 100),
            LL: pad(Math.round(l / 10)),
            LLL: pad(l, 3),
            t: H < 12 ? 'a' : 'p',
            tt: H < 12 ? 'am' : 'pm',
            T: H < 12 ? 'A' : 'P',
            TT: H < 12 ? 'AM' : 'PM',
            Z: utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
            o: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
            S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10],
            x: dayDiff,
            xx: ((dayDiff >= -7) && ((dayDiff + 7) < dF.i18n.dayDiffNames.length)) ? dF.i18n.dayDiffNames[dayDiff + 7] : dF.i18n.dayNames[D]
        };

        return mask.replace(token, $0 => {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
})();

// Some common format strings
dateFormat.masks = {
    default: 'ddd MMM dd yyyy HH:mm:ss',
    shortDate: 'm/d/yy',
    mediumDate: 'MMM d, yyyy',
    longDate: 'MMMM d, yyyy',
    fullDate: 'dddd, MMMM d, yyyy',
    shortTime: 'h:mm TT',
    mediumTime: 'h:mm:ss TT',
    longTime: 'h:mm:ss TT Z',
    isoDate: 'yyyy-MM-dd',
    isoTime: 'HH:MM:ss',
    isoDateTime: 'yyyy-MM-dd\'T\'HH:mm:ss',
    isoUtcDateTime: 'UTC:yyyy-MM-dd\'T\'HH:mm:ss\'Z\''
};

dateFormat.parseDates = {
    monthFirst : ['MMM d, y', 'MMM d,y', 'M/d/y', 'M-d-y', 'M.d.y', 'MMM-d', 'M/d', 'MMM d', 'M-d'],
    dateFirst : ['d-MMM-y', 'd/M/y', 'd-M-y', 'd.M.y', 'd-MMM', 'd/M', 'd-M', 'd MMM'],
    general : ['y-M-d', 'y-MMM-d']
};

dateFormat.parseTimes = ['h:m:s:lt', 'h:m:s.lt', 'h:m:st', 'h:mt', 'h:m:s t', 'h:m:s.t', 'H:m:s:l', 'H:m:s.l', 'H:m:s', 'H:m', 'h:m:s t Z', 'H:m:s Z'];

/**
 * pre defined formats of a given date
 * @param  {Date}            date            -  JavaScript Date to format
 * @param  {string}          [format]        -  format of the date
 * @param  {Array.<string>}  [dayNames]      -  Array of day Names in short and ["Sunday", "Monday", ..., "Mo", "Tu", ...]
 * @param  {Array.<string>}  [monthNames]    -  Array of month Names long and short ["January", "February", ..., "Jan", "Feb", ...]
 * @param  {Array.<string>}  [dayDiffNames]  -  Array of names for relative day, starting 7 days ago ["1 week ago", "6 days ago", ..., "Yesterday", "Today", "Tomorrow", ...]
 * @param  {bool} [utc] - indicates if the formatted date should be in utc or not
 * @return {any}   returns a number, string or object depending on the given Format
 */
function initializeParser(dayNames, monthNames, dayDiffNames) {
    dateFormat.i18n = {
        dayNames : dayNames,
        monthNames : monthNames,
        dayDiffNames : dayDiffNames
    };
}

dateFormat.parse = [
    {label: 'Year yy (2 digits)', value: 'yy'},
    {label: 'Year yyyy (4 digits)', value: 'yyyy'},
    {label: 'Month M (1/2 digit)', value: 'M'},
    {label: 'Month MM (2 digits)', value: 'MM'},
    {label: 'Month MMM (name or abbr.)', value: 'MMM'},
    {label: 'Month NNN (abbr.)', value: 'NNN'},
    {label: 'Day of Month d (1/2 digit)', value: 'd'},
    {label: 'Day of Month dd (2 digits)', value: 'dd'},
    {label: 'Day of Week E (abbr.)', value: 'E'},
    {label: 'Day of Week EE (name)', value: 'EE'},
    {label: 'Hour h (1/2 digit 1-12)', value: 'h'},
    {label: 'Hour hh (2 digits 1-12)', value: 'hh'},
    {label: 'Hour H (1/2 digit 0-23)', value: 'H'},
    {label: 'Hour HH (2 digits 0-23)', value: 'HH'},
    {label: 'Hour K (1/2 digit 0-11)', value: 'K'},
    {label: 'Hour KK (2 digits 0-11)', value: 'KK'},
    {label: 'Hour k (1/2 digit 1-24)', value: 'k'},
    {label: 'Hour kk (2 digits 1-24)', value: 'kk'},
    {label: 'Minute m (1/2 digit)', value: 'm'},
    {label: 'Minute mm (2 digits)', value: 'mm'},
    {label: 'Second s (1/2 digit)', value: 's'},
    {label: 'Second ss (2 digits)', value: 'ss'},
    {label: 'Milliseconds l (1-3 digits)', value: 'l'},
    {label: 'Milliseconds ll (2/3 digits)', value: 'll'},
    {label: 'Milliseconds lll (3 digits)', value: 'lll'},
    {label: 'Milliseconds L (1 digit rounded)', value: 'L'},
    {label: 'Milliseconds LL (2 digits rounded)', value: 'LL'},
    {label: 'AM/PM t (1 digit)', value: 't'},
    {label: 'AM/PM tt (2 digits)', value: 'tt'}
];
dateFormat.format = [
    {label: 'Year yyyy (4 digits)', value: 'yyyy'},
    {label: 'Year yy (2 digits)', value: 'yy'},
    {label: 'Month M (1 digit)', value: 'M'},
    {label: 'Month MM (2 digits)', value: 'MM'},
    {label: 'Month MMM (abbr.)', value: 'MMM'},
    {label: 'Month NNN (name)', value: 'NNN'},
    {label: 'Day of Month d (1 digit)', value: 'd'},
    {label: 'Day of Month dd (2 digits)', value: 'dd'},
    {label: 'Day of Week E (abbr.)', value: 'E'},
    {label: 'Day of Week EE (name)', value: 'EE'},
    {label: 'Hour h (1-12)', value: 'h'},
    {label: 'Hour hh (2 digits 01-12)', value: 'hh'},
    {label: 'Hour H (0-23)', value: 'H'},
    {label: 'Hour HH (2 digits 00-23)', value: 'HH'},
    {label: 'Hour K (0-11)', value: 'K'},
    {label: 'Hour KK (2 digits 00-11)', value: 'KK'},
    {label: 'Hour k (1-24)', value: 'k'},
    {label: 'Hour kk (2 digits 01-24)', value: 'kk'},
    {label: 'Minute m (0-59)', value: 'm'},
    {label: 'Minute mm (2 digits 00-59)', value: 'mm'},
    {label: 'Second s (0-59)', value: 's'},
    {label: 'Second ss (2 digits 00-59)', value: 'ss'},
    {label: 'Milliseconds l (0-999)', value: 'l'},
    {label: 'Milliseconds ll (2/3 digits 00-999)', value: 'll'},
    {label: 'Milliseconds lll (3 digits 000-999)', value: 'lll'},
    {label: 'Milliseconds L (round to 1 digit 0-9)', value: 'L'},
    {label: 'Milliseconds LL (round to 2 digits 00-99)', value: 'LL'},
    {label: 'AM/PM t (1 digit - Lowercase)', value: 't'},
    {label: 'AM/PM tt (2 digits - Lowercase)', value: 'tt'},
    {label: 'AM/PM T (1 digit - Uppercase)', value: 'T'},
    {label: 'AM/PM TT (2 digits - Uppercase)', value: 'TT'},
    {label: 'timezone Z (abbr.)', value: 'Z'},
    {label: 'timezone offset o (abbr.)', value: 'o'},
    {label: 'date\'s ordinal suffix (st, nd, rd, or th) S', value: 'S'},
    {label: 'Day difference x', value: 'x'},
    {label: 'Day difference (name) xx', value: 'xx'}
];

/**
 * pre defined formats of a given date
 * @param  {Date}            date            -  JavaScript Date to format
 * @param  {string}          [format]        -  format of the date
 * @param  {Array.<string>}  [dayNames]      -  Array of day Names in short and ["Sunday", "Monday", ..., "Mo", "Tu", ...]
 * @param  {Array.<string>}  [monthNames]    -  Array of month Names long and short ["January", "February", ..., "Jan", "Feb", ...]
 * @param  {Array.<string>}  [dayDiffNames]  -  Array of names for relative day, starting 7 days ago ["1 week ago", "6 days ago", ..., "Yesterday", "Today", "Tomorrow", ...]
 * @param  {bool} [utc] - indicates if the formatted date should be in utc or not
 * @return {any}   returns a number, string or object depending on the given Format
 */
function getFormattedDateOut(date, format, utc) {
    // console.debug('getFormattedDateOut date=' + date + ' --> format=' + format + '  [' + dayNames + '] - [' + monthNames + '] [' + dayDiffNames + ']'); // eslint-disable-line
    format = format || 0;
    if (date.value) { date = date.value; }
    if (!(date instanceof Date)) { date = Date(date); }

    if (isNaN(format)) {
        return dateFormat(date, String(format), utc);
    }

    switch (Number(format)) {
        case 0: // timeformat_UNIX - milliseconds since Jan 1, 1970 00:00
            return date.getTime();
        case 1: // timeformat_ECMA262 - date as string ECMA-262
            return String(date);
        case 2: // timeformat_local      - 26.12.2018, 23:40:45  - timeformat_G - 6/15/2009 1:45:30 PM
            return date.toLocaleString();
        case 3: // timeformat_localTime  - 23:40:58              - timeformat_T - 1:45:30 PM
            return date.toLocaleTimeString();
        case 4: // timeformat_UTC
            return date.toUTCString();
        case 5: // timeformat_ISO
            return date.toISOString();
        case 6: // timeformat_ms
            return date.getTime() - (new Date()).getTime();
        case 7: // timeformat_sec
            return Math.round((date.getTime() - (new Date()).getTime()) / 1000);
        case 8: // timeformat_min
            return (Math.round((date.getTime() - (new Date()).getTime()) / 1000) / 60);
        case 9: // timeformat_hour
            return (Math.round((date.getTime() - (new Date()).getTime()) / 1000) / 3600);
        case 10: // timeformat_YYYYMMDDHHMMSS
            return _getComparableDateFormat(date);
        case 11: // timeformat_YYYYMMDD_HHMMSS
            return _getComparableDateFormat2(date);
        case 12: // timeformat_localDate - 26.12.2018  - timeformat_d - 6/15/2009
            return date.toLocaleDateString();
        case 13: // timeformat_localTimeLong       - 23:43:10 GMT+0100 (Mitteleuropäische Normalzeit)
            return date.toTimeString();
        case 14: // timeformat_localLong       - Wed Dec 26 2018 23:44:12 GMT+0100 (Mitteleuropäische Normalzeit)
            return date.toString();
        case 15: // timeformat_localDateLong       - Wed Dec 26 2018
            return date.toDateString();
        case 16: // timeformat_weekday           - Montag, 22.12.
            return  dateFormat(date, 'dddd, d.M.', utc);
        case 17: // timeformat_weekday2          - heute 22.12., morgen 23.12., übermorgen 24.12., in 3 Tagen 25.12., Montag, 26.12.
            return  dateFormat(date, 'xx, d.M.', utc);
    }

    const now = new Date();
    const delay = (date.getTime() - now.getTime());
    return {
        date,
        ts: date.getTime(),
        dateStr: String(date),
        timeUTCStr: date.toUTCString(),
        timeISOStr: date.toISOString(),
        timeLocaleStr: date.toLocaleString(),
        timeLocaleTimeStr: date.toLocaleTimeString(),
        delay,
        delaySec: Math.round(delay / 1000),
        lc: now.getTime()
    };
}
// ===================================================================
// Author: Matt Kruse <matt@mattkruse.com>
// WWW: http://www.mattkruse.com/
// https://www.mattkruse.com/javascript/date/source.html
// http://javascripttoolbox.com/lib/date/index.php
//
// NOTICE: You may use this code for any purpose, commercial or
// private, without any further permission from the author. You may
// remove this notice from your final code if you wish, however it is
// appreciated by the author if at least my web site address is kept.
//
// You may *NOT* re-distribute this code in any way except through its
// use. That means, you can include it in your product, or your web
// site, or any other form where the code is actually being used. You
// may not put the plain JavaScript up on your site for download or
// include it in your JavaScript libraries for download.
// If you wish to share this code with others, please just point them
// to the URL instead.
// Please DO NOT link directly to my .js files from your site. Copy
// the files to your server and use them there. Thank you.
// ===================================================================

// HISTORY
// ------------------------------------------------------------------
// May 17, 2003: Fixed bug in parseDate() for dates <1970
// March 11, 2003: Added parseDate() function
// March 11, 2003: Added "NNN" formatting option. Doesn't match up
//                 perfectly with SimpleDateFormat formats, but
//                 backwards-compatibility was required.

// ------------------------------------------------------------------
// These functions use the same 'format' strings as the
// java.text.SimpleDateFormat class, with minor exceptions.
// The format string consists of the following abbreviations:
//
// Field        | Full Form          | Short Form
// -------------+--------------------+-----------------------
// Year         | yyyy (4 digits)    | yy (2 digits), y (2 or 4 digits)
// Month        | MMM (name or abbr.)| MM (2 digits), M (1 or 2 digits)
//              | NNN (abbr.)        |
// Day of Month | dd (2 digits)      | d (1 or 2 digits)
// Day of Week  | EE (name)          | E (abbr.)
// Hour (1-12)  | hh (2 digits)      | h (1 or 2 digits)
// Hour (0-23)  | HH (2 digits)      | H (1 or 2 digits)
// Hour (0-11)  | kk (2 digits)      | k (1 or 2 digits)
// Hour (1-24)  | KK (2 digits)      | K (1 or 2 digits)
// Minute       | mm (2 digits)      | m (1 or 2 digits)
// Second       | ss (2 digits)      | s (1 or 2 digits)
// Millisecond  | ll (3 digits)      | l (1, 2 or 3 digits)
// AM/PM        | tt  (2 digits)     | t (1 or 2 digits)
//
// NOTE THE DIFFERENCE BETWEEN MM and mm! Month=MM, not mm!
// Examples:
//  "MMM d, y" matches: January 01, 2000
//                      Dec 1, 1900
//                      Nov 20, 00
//  "M/d/yy"   matches: 01/20/00
//                      9/2/00
//  "MMM dd, yyyy hh:mm:sst" matches: "January 01, 2000 12:30:45AM"
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Utility functions for parsing in getDateFromFormat()
// ------------------------------------------------------------------
/**
 * check if string is integer
 * @param {any} val value to check
 * @return {bool} **true** if value is integer otherwise **false**
 */
function _isInteger(val) {
    const digits = '1234567890';
    for (let i = 0; i < val.length; i++) {
        if (digits.indexOf(val.charAt(i)) === -1) {
            return false;
        }
    }

    return true;
}

/**
 * returns integer token
 * @param {string} str string to parse
 * @param {number} i position
 * @param {*} minlength minimum required length
 * @param {*} maxlength maximum length
 * @returns {string|null} token if it is an integer otherwise **null**
 */
function _getInt(str, i, minlength, maxlength) {
    for (let x = maxlength; x >= minlength; x--) {
        const token = str.substring(i, i + x);
        if (token.length < minlength) {
            return null;
        }

        if (_isInteger(token)) {
            return token;
        }
    }

    return null;
}

/**
 * This function takes a date string and a format string. It matches
 * If the date string matches the format string, it returns the
 * getTime() of the date. If it does not match, it returns 0.
 * @param {string} val date string to parse
 * @param {string} format format of the value
 * @returns {Date|null} a Date object or **null** if pattern does not match.
 */
function getDateFromFormat(val, format) {
    // console.log('getDateFromFormat val=' + val + ' --> format=' + format); // eslint-disable-line
    val = String(val);
    format = String(format);
    const now = new Date();
    let i_val = 0;
    let i_format = 0;
    let x; let y;
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let date = now.getDate();
    let hour = now.getHours();
    let min = now.getMinutes();
    let sec = now.getSeconds();
    let misec = now.getMilliseconds();
    let ampm = '';

    while (i_format < format.length) {
        // Get next token from format string
        const c = format.charAt(i_format);
        let token = '';
        while ((format.charAt(i_format) === c) && (i_format < format.length)) {
            token += format.charAt(i_format++);
        }

        // Extract contents of value based on format token
        if (token === 'yyyy' || token === 'yy' || token === 'y') {
            if (token === 'yyyy') {
                x = 4;
                y = 4;
            }

            if (token === 'yy') {
                x = 2;
                y = 2;
            }

            if (token === 'y') {
                x = 2;
                y = 4;
            }
            year = _getInt(val, i_val, x, y);
            if (year === null) {
                return null;
            }

            i_val += year.length;
            if (year.length === 2) {
                if (year > 70) {
                    year = 1900 + (year - 0);
                } else {
                    year = 2000 + (year - 0);
                }
            }
        } else if (token === 'MMM' || token === 'NNN' || token === 'MMMM') {
            month = 0;
            for (let i = 0; i < dateFormat.i18n.monthNames.length; i++) {
                const month_name = dateFormat.i18n.monthNames[i];
                if (val.substring(i_val, i_val + month_name.length).toLowerCase() === month_name.toLowerCase()) {
                    if (token === 'MMM' || ((token === 'NNN' || token === 'MMMM') && i > 11)) {
                        month = i + 1;
                        if (month > 12) {
                            month -= 12;
                        }

                        i_val += month_name.length;
                        break;
                    }
                }
            }

            if ((month < 1) || (month > 12)) {
                return null;
            }
        } else if (token === 'EE' || token === 'E' || token === 'dddd' || token === 'ddd') {
            for (let i = 0; i < dateFormat.i18n.dayNames.length; i++) {
                const day_name = dateFormat.i18n.dayNames[i];
                if (val.substring(i_val, i_val + day_name.length).toLowerCase() === day_name.toLowerCase()) {
                    i_val += day_name.length;
                    break;
                }
            }
        } else if (token === 'MM' || token === 'M') {
            month = _getInt(val, i_val, token.length, 2);
            if (month === null || (month < 1) || (month > 12)) {
                return null;
            }
            i_val += month.length;
        } else if (token === 'dd' || token === 'd') {
            date = _getInt(val, i_val, token.length, 2);
            if (date === null || (date < 1) || (date > 31)) {
                return null;
            }
            i_val += date.length;
        } else if (token === 'hh' || token === 'h') {
            hour = _getInt(val, i_val, token.length, 2);
            if (hour === null || (hour < 1) || (hour > 12)) {
                return null;
            }
            i_val += hour.length;
        } else if (token === 'HH' || token === 'H') {
            hour = _getInt(val, i_val, token.length, 2);
            if (hour === null || (hour < 0) || (hour > 23)) {
                return null;
            }
            i_val += hour.length;
        } else if (token === 'kk' || token === 'k') {
            hour = _getInt(val, i_val, token.length, 2);
            if (hour === null || (hour < 0) || (hour > 11)) {
                return null;
            }
            i_val += hour.length;
        } else if (token === 'KK' || token === 'K') {
            hour = _getInt(val, i_val, token.length, 2);
            if (hour === null || (hour < 1) || (hour > 24)) {
                return null;
            }
            i_val += hour.length;
            hour--;
        } else if (token === 'mm' || token === 'm') {
            min = _getInt(val, i_val, token.length, 2);
            if (min === null || (min < 0) || (min > 59)) {
                return null;
            }
            i_val += min.length;
        } else if (token === 'ss' || token === 's') {
            sec = _getInt(val, i_val, token.length, 2);
            if (sec === null || (sec < 0) || (sec > 59)) {
                return null;
            }
            i_val += sec.length;
        } else if (token.toLowerCase() === 'lll' || token.toLowerCase() === 'll' || token.toLowerCase() === 'l') {
            misec = _getInt(val, i_val, token.length, 3);
            if (misec === null || (misec < 0) || (misec > 999)) {
                return null;
            }
            i_val += misec.length;
            if ( token === 'L' && misec < 10) {
                misec = misec * 100;
            }
            if ( token === 'LL' && misec < 100) {
                misec = misec * 10;
            }
        } else if ((token.toLowerCase() === 'tt') || (token.toLowerCase() === 't')) {
            if (val.substring(i_val, i_val + 2).toLowerCase() === 'am') {
                ampm = 'AM';
                i_val += 2;
            } else if (val.substring(i_val, i_val + 2).toLowerCase() === 'pm') {
                ampm = 'PM';
                i_val += 2;
            } else if (val.substring(i_val, i_val + 1).toLowerCase() === 'a') {
                ampm = 'AM';
                i_val += 1;
            } else if (val.substring(i_val, i_val + 1).toLowerCase() === 'p') {
                ampm = 'PM';
                i_val += 1;
            } else {
                return null;
            }
        } else {
            if (val.substring(i_val, i_val + token.length) !== token) {
                return null;
            }

            i_val += token.length;
        }
    }

    // If there are any trailing characters left in the value, it doesn't match
    if (i_val !== val.length) {
        return null;
    }

    // Is date valid for month?
    if (month === 2) {
        // Check for leap year
        if (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)) { // leap year
            if (date > 29) {
                return null;
            }
        } else if (date > 28) {
            return null;
        }
    }

    if ((month === 4) || (month === 6) || (month === 9) || (month === 11)) {
        if (date > 30) {
            return null;
        }
    }

    // Correct hours value
    if (hour < 12 && ampm === 'PM') {
        hour = hour - 0 + 12;
    } else if (hour > 11 && ampm === 'AM') {
        hour -= 12;
    }
    // console.log(`getDateFromFormat out year=${year} month=${month} date=${date} hour=${hour} min=${min} sec=${sec} misec=${misec}`); // eslint-disable-line
    return new Date(year, month - 1, date, hour, min, sec, misec);
}

/**
 * parses an array of different formats
 * @param {string} val date string to parse
 * @param {Array.<string>} listToCheck a list of strings with different formats to check
 * @returns {Date|null} a Date object or **null** if no patterns match.
 */
function _parseArray(val, listToCheck) {
    for (let i = 0, n = listToCheck.length; i < n; i++) {
        const res = getDateFromFormat(val, listToCheck[i]);
        if (res !== null) {
            return res;
        }
    }
    return null;
}

/**
 * check if a string is an integer
 * @param {string} str string to check
 * @returns boolean if it is a valid integer
 */
function _isTimestamp(str) {
    const n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n > 946684800000;
}

/**
 * This function takes a date string and tries to match it to a
 * number of possible date formats to get the value. It will try to
 * match against the following international formats, in this order:
 * y-M-d   MMM d, y   MMM d,y   y-MMM-d   d-MMM-y  MMM d
 * M/d/y   M-d-y      M.d.y     MMM-d     M/d      M-d
 * d/M/y   d-M-y      d.M.y     d-MMM     d/M      d-M
 * @param {string} val date string to parse
 * @param {boolean} [preferMonthFirst] if **true** the method to search first for formats like M/d/y (e.g. American format) before d/M/y (e.g. European).
 * @returns {Date|null} a Date object or **null** if no patterns match.
 */
function _parseDate(val, preferMonthFirst) {
    // console.debug('_parseDate val=' + val + ' - preferMonthFirst=' + preferMonthFirst); // eslint-disable-line
    let res = _parseArray(val, (preferMonthFirst) ? dateFormat.parseDates.monthFirst : dateFormat.parseDates.dateFirst);
    if (res !== null) { return res; }
    res = _parseArray(val, (preferMonthFirst) ? dateFormat.parseDates.dateFirst : dateFormat.parseDates.monthFirst);
    if (res !== null) { return res; }
    return _parseArray(val, dateFormat.parseDates.general);
}

/**
 * This function takes a date and time string and tries to match it to a
 * number of possible date formats to get the value.
 * @param {string} val date string to parse
 * @param {boolean} [preferMonthFirst] if **true** the method to search first for formats like M/d/y (e.g. American format) before d/M/y (e.g. European).
 * @returns {Date|null} a Date object or **null** if no patterns match.
 */
function _parseDateTime(val, preferMonthFirst) {
    // console.debug('_parseDateTime val=' + val + ' - preferMonthFirst=' + preferMonthFirst); // eslint-disable-line
    function mix(lst1, lst2, result) {
        for (let i = 0; i < lst1.length; i++) {
            for (let j = 0; j < lst2.length; j++) {
                result.push(lst1[i] + ' ' + lst2[j]);
            }
        }
        return result;
    }

    let checkList = [dateFormat.masks.isoDateTime];
    if (preferMonthFirst) {
        checkList = mix(dateFormat.parseDates.monthFirst, dateFormat.parseTimes, checkList);
        checkList = mix(dateFormat.parseDates.dateFirst, dateFormat.parseTimes, checkList);
    } else {
        checkList = mix(dateFormat.parseDates.dateFirst, dateFormat.parseTimes, checkList);
        checkList = mix(dateFormat.parseDates.monthFirst, dateFormat.parseTimes, checkList);
    }
    checkList = mix(dateFormat.parseDates.general, dateFormat.parseTimes, checkList);
    return _parseArray(val, checkList);
}

/**
 * parses a date string to given format definition
 * @param {string} val date string to parse
 * @param {number|string} format Format definition, if it is a number a predefined format will be try
 * @param {Array.<string>} [dayNames] list of day names
 * @param {Array.<string>} [monthNames] list of month names
 * @param {Array.<string>} [dayDiffNames] list of day diff names
 * @returns {Date} a Date object or throws an error if no patterns match.
 */
function parseDateFromFormat(date, format, dayNames, monthNames, dayDiffNames) {
    // console.debug('parseDateFromFormat date=' + util.inspect(date) + ' - format=' + util.inspect(format) + '  [' + dayNames + '] - [' + monthNames + '] [' + dayDiffNames + ']'); // eslint-disable-line
    if (dayNames) {
        dateFormat.i18n.dayNames = dayNames;
    }

    if (monthNames) {
        dateFormat.i18n.monthNames = monthNames;
    }

    if (dayDiffNames) {
        dateFormat.i18n.dayDiffNames = dayDiffNames;
    }

    format = format || 0;

    let res = null;
    if (isNaN(format)) { // timeparse_TextOther
        res = getDateFromFormat(date, format);
    } else {
        const tryparse = (val, preferMonthFirst) => {
            // console.debug('try parse ' + util.inspect(val) + ' preferMonthFirst=' + preferMonthFirst); // eslint-disable-line
            let res = _parseDateTime(val, preferMonthFirst);
            if (res !== null) { return res; }
            res = _parseDate(val, preferMonthFirst);
            if (res !== null) { return res; }
            res = _parseArray(val, dateFormat.parseTimes);
            if (res !== null) { return res; }
            res = Date.parse(val);
            if (!isNaN(res)) {
                return new Date(res);
            }
            if (!isNaN(val) && _isTimestamp(val)) {
                const dto = new Date(val);
                if (dto !== 'Invalid Date' && !isNaN(dto)) {
                    return dto;
                }
            }
            return null;
        };

        switch (Number(format)) {
            case 0: // UNIX Timestamp
                res = new Date(Number(date));
                break;
            case 1: // timeparse_ECMA262
                res = Date.parse(date);
                break;
            case 2: // various - try different Formats, prefer day first like d/M/y (e.g. European format)
                res = tryparse(date, false);
                break;
            case 3: // various - try different Formats, prefer month first like M/d/y (e.g. American format)
                res = tryparse(date, true);
                break;
            case 4: // timeformat_YYYYMMDDHHMMSS
                res = _parseComparableDateFormat(date);
                break;
            case 5: // timeformat_YYYYMMDD_HHMMSS
                res = _parseComparableDateFormat2(date);
                break;
            default: {
                res = getDateOfText(date);
                break;
            }
        }
    }
    // console.debug('result='+ util.inspect(res) + ' ' + isNaN(res)); // eslint-disable-line
    if (res === 'Invalid Date' || isNaN(res) || res === null) {
        throw new Error('could not evaluate format of ' + date + ' (' + format+')');
    }
    return res;
}