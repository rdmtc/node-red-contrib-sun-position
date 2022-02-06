/*
 * This code is licensed under the Apache License Version 2.0.
 *
 * Copyright (c) 2022 Robert Gester
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 */

/********************************************
 * dateTimeHelper.js:
 *********************************************/
'use strict';
const util = require('util');

module.exports = {
    isBool,
    isTrue,
    isFalse,
    XOR,
    XAND,
    pad2,
    pad,
    angleNorm,
    angleNormRad,
    clipStrLength,
    countDecimals,
    handleError,
    chkValueFilled,
    checkLimits,
    getMsgBoolValue,
    getMsgBoolValue2,
    getMsgTopicContains,
    getMsgNumberValue,
    getMsgNumberValue2,
    getSpecialDayOfMonth,
    getNthWeekdayOfMonth,
    getLastDayOfMonth,
    getStdTimezoneOffset,
    isDSTObserved,
    addOffset,
    calcDayOffset,
    calcMonthOffset,
    convertDateTimeZone,
    isValidDate,
    isoStringToDate,
    roundToHour,
    normalizeDate,
    limitDate,
    getTimeOfText,
    getDateOfText,
    getDayOfYear,
    getWeekOfYear,
    getUTCDayId,
    getDayId,
    getTimeNumberUTC,
    getNodeId,
    initializeParser,
    getFormattedDateOut,
    parseDateFromFormat,
    topicReplace,
    getNowTimeStamp,
    getNowObject
};

/*******************************************************************************************************/
/* Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setUTCDate(date.getUTCDate() + days);
    return date;
}

// Returns the ISO week of the date.
Date.prototype.getWeek = function() {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    const week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                          - 3 + (week1.getDay() + 6) % 7) / 7);
};

// Returns the four-digit year corresponding to the ISO week of the date.
Date.prototype.getWeekYear = function() {
    const date = new Date(this.getTime());
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    return date.getFullYear();
}; */
/*******************************************************************************************************/
/* simple functions                                                                                    */
/*******************************************************************************************************/

/**
 * returns **true** if the parameter value is a valid boolean value for **false** or **true**
 * @param {*} val a parameter which should be checked if  it is a valid false boolean
 * @returns {boolean} true if the parameter value is a valid boolean value for for **false** or **true**
 */
function isBool(val) {
    val = (val+'').toLowerCase();
    return (['true', 'yes', 'on', 'ja', 'false', 'no', 'off', 'nein'].includes(val) || !isNaN(val));
}
/**
 * returns **true** if the parameter value is a valid boolean value for **true**
 * @param {*} val a parameter which should be checked if  it is a valid true boolean
 * @returns {boolean} true if the parameter value is a valid boolean value for **true**
 */
function isTrue(val) {
    val = (val+'').toLowerCase();
    return (['true', 'yes', 'on', 'ja'].includes(val) || (!isNaN(val) && (Number(val) > 0)));
}

/**
 * returns **true** if the parameter value is a valid boolean value for **false**
 * @param {*} val a parameter which should be checked if  it is a valid false boolean
 * @returns {boolean} true if the parameter value is a valid boolean value for **false**
 */
function isFalse(val) {
    val = (val+'').toLowerCase();
    return (['false', 'no', 'off', 'nein'].includes(val) || (!isNaN(val) && (Number(val) <= 0)));
}

/**
 * Exclusive OR
 * @param {*} a  -  operand one
 * @param {*} b  -  operand two
 * @returns {boolean}  -  **true** if the a expression or b expression is **true** (like ||), but not if both are **true**
 */
function XOR(a,b) {
    return (!a !== !b); // (a || b) && !(a && b); // ( a && !b ) || ( !a && b )
}

/**
 * Exclusive AND
 * @param {*} a  -  operand one
 * @param {*} b  -  operand two
 * @returns {boolean}  -  **true** if the a expression and b expression is **true** (like &&) or if both are **false**
 */
function XAND(a, b) {
    return (!a === !b); // (a && b) || !(a || b); // (a && b) || (!a && !b);
}

/**
 * count the number of decimals of a number
 * @param {*} value number to check
 */
function countDecimals(value) {
    return value === value>> 0 ? 0 : value.toString().split('.')[1].length || 0;
}

/**
 * normalizes an angle
 * @param {number} angle to normalize
 */
function angleNorm(angle) {
    while (angle < 0) {
        angle += 360;
    }
    while (angle > 360) {
        angle -= 360;
    }
    return angle;
}

/**
 * normalizes an angle
 * @param {number} angle to normalize
 */
function angleNormRad(angle) {
    const dr = (2 * Math.PI);
    while (angle < 0) {
        angle += dr;
    }
    while (angle > dr) {
        angle -= dr;
    }
    return angle;
}
/*******************************************************************************************************/
/**
 * gives a ID of a node
 * @param {any} node a node
 * @returns {string} id of the given node
 */
function getNodeId(node) {
    return '[' + node.type + ((node.name) ? '/' + node.name + ':' : ':') + (node._path || node.id) + ']';
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

/**
 * creates a string from a number with leading zeros
 * @param {string|number|boolean} n number to format
 * @param {number} [len] length of number (default 2)
 * @returns {string} number with minimum digits as defined in length
 */
function pad(val, len) {
    val = String(val);
    len = len || 2;
    while (val.length < len) {
        val = '0' + val;
    }
    return val;
}

/*******************************************************************************************************/
// obj.timer = setTimeoutPromise(60500).then(()
// const setTimeoutPromise = util.promisify(setTimeout);
// const setIntervalPromise = util.promisify(setTimeout);

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
        node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
        node.status({
            fill: 'red',
            shape: 'ring',
            text: (stateText) ? stateText : messageText
        });
    } else if (console) {
        /* eslint-disable no-console */
        console.error(messageText);
        console.log(util.inspect(err, Object.getOwnPropertyNames(err)));
        console.trace(); // eslint-disable-line
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
 * clip a text to a maximum length
 * @param {string} v text to clip
 * @param {number} [l] length to clip the text
* @returns {string} string not longer than the given length
 */
function clipStrLength(v, l) {
    l = l || 15;
    v = String(v);
    if (v.length > l) {
        return v.slice(0, (l - 3)) + '...';
    }
    return v;
}
/*******************************************************************************************************/
/**
 * get a date for the first day of week in the given month
 * @param {number} year year to check
 * @param {number} month month to check
 * @param {number} [dayOfWeek]  Day of week, where 0 is Sunday, 1 Monday ... 6 Saturday
 * @returns {Date} first day of given month
 */
/* function _getFirstDayOfMonth(year, month, dayOfWeek) {
    const d = new Date(year, month, 1);
    dayOfWeek = dayOfWeek || 1; // Monday
    while (d.getDay() !== dayOfWeek) {
        d.setDate(d.getDate() + 1);
    }
    return d;
} */

/**
 * get a date for the specific day of week in the given month
 * @param {number} year year to check
 * @param {number} month month to check
 * @param {number} [dayOfWeek] day of week 0=Sunday, 1=Monday, ..., 6=Saturday
 * @param {number} [n] the nTh Numer of the day of week - 0 based
 * @returns {Date} weekday of given month
 */
function getNthWeekdayOfMonth(year, month, dayOfWeek, n) {
    const date = new Date(year, month, 1);
    dayOfWeek = dayOfWeek || 1; // Monday
    n = n || 0; // sunday
    const add = (dayOfWeek - date.getDay() + 7) % 7 + n * 7;
    date.setDate(1 + add);
    return date;
}

/**
 * get a date for the last day of week in the given month
 * @param {number} year year to check
 * @param {number} month month to check
 * @param {number} [dayOfWeek]  Day of week, where 0 is Sunday, 1 Monday ... 6 Saturday
 * @returns {Date} last day of given month
 */
function getLastDayOfMonth(year, month, dayOfWeek) {
    const d = new Date(year, month+1, 0);
    dayOfWeek = dayOfWeek || 1; // Monday
    while (d.getDay() !== dayOfWeek) {
        d.setDate(d.getDate() - 1);
    }
    return d;
}

/**
 * get a date for the special day in the given month
 * @param {string} year year to check
 * @param {number} month month to check
 * @param {number} dayName  Name of the special day
 * @returns {Date|null} last day of given month or null
 */
function getSpecialDayOfMonth(year, month, dayName) {
    switch (dayName) {
        case 'fMon':
            return getNthWeekdayOfMonth(year, month, 1, 0);
        case 'fTue':
            return getNthWeekdayOfMonth(year, month, 2, 0);
        case 'fWed':
            return getNthWeekdayOfMonth(year, month, 3, 0);
        case 'fThu':
            return getNthWeekdayOfMonth(year, month, 4, 0);
        case 'fFri':
            return getNthWeekdayOfMonth(year, month, 5, 0);
        case 'fSat':
            return getNthWeekdayOfMonth(year, month, 6, 0);
        case 'fSun':
            return getNthWeekdayOfMonth(year, month, 0, 0);
        case 'lMon':
            return getLastDayOfMonth(year, month, 1);
        case 'lTue':
            return getLastDayOfMonth(year, month, 2);
        case 'lWed':
            return getLastDayOfMonth(year, month, 3);
        case 'lThu':
            return getLastDayOfMonth(year, month, 4);
        case 'lFri':
            return getLastDayOfMonth(year, month, 5);
        case 'lSat':
            return getLastDayOfMonth(year, month, 6);
        case 'lSun':
            return getLastDayOfMonth(year, month, 0);
    }
    return null;
}

/**
 * For a given date, get the ISO week number
 *
 * Based on information at:
 *
 *    http://www.merlyn.demon.co.uk/weekcalc.htm#WNR
 *
 * Algorithm is to find nearest thursday, it's year
 * is the year of the week number. Then get weeks
 * between that date and the first day of that year.
 *
 * Note that dates in one year can be weeks of previous
 * or next year, overlap is up to 3 days.
 *
 * e.g. 2014/12/29 is Monday in week  1 of 2015
 *      2012/1/1   is Sunday in week 52 of 2011
 *
 * @param {Date} date date to get week number
 * @returns {Array} ISO week number, [UTCFullYear, weekNumber]
 */
function getWeekOfYear(date) {
    // Copy date so don't modify original
    date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay()||7));
    // Get first day of year
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil(( ( (date - yearStart) / 86400000) + 1)/7);
    // Return array of year and week number
    return [date.getUTCFullYear(), weekNo];
}

/**
 * For a given date, get the day number
 * @param {Date} date date to get day number
 * @returns {Array} day number, [UTCFullYear, dayNumber]
 */
function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    return [date.getUTCFullYear(),  Math.floor(diff / oneDay)];
}

/**
 * gets a day id from a date
 * @param {Date} d date to get day id from
 */
function getUTCDayId(d) {
    return d.getUTCDay() + (d.getUTCMonth() * 31) + (d.getUTCFullYear() * 372);
}

/**
 * gets a day id from a date
 * @param {Date} d date to get day id from
 */
function getDayId(d) {
    return d.getDay() + (d.getMonth() * 31) + (d.getFullYear() * 372);
}

/******************************************************************************************/
/**
 * the definition of the time to compare
 * @param {*} node the current node object
 * @param {*} msg the message object
* @returns {Date} Date object of given Date or now
 */
function getNowTimeStamp(node, msg) {
    let value = '';
    if (typeof msg.time === 'number') {
        value = msg.time;
        node.debug(`compare time to msg.time = "${value}"`);
    } else if (typeof msg.ts === 'number') {
        value = msg.ts;
        node.debug(`compare time to msg.ts = "${value}"`);
    } else {
        return new Date();
    }
    const dto = new Date(value);
    if (isValidDate(dto)) {
        // node.debug(dto.toISOString());
        return dto;
    }
    node.error(`Error can not get a valid timestamp from "${value}"! Will use current timestamp!`);
    return new Date();
}


/**
* support timeData
* @name ITimeObject Data
* @param {Date} now
* @param {number} nowNr
* @param {number} dayNr
* @param {number} monthNr
* @param {number} dateNr
* @param {number} yearNr
* @param {number} dayId
*/

/**
* the definition of the time to compare
* @param {*} node the current node object
* @param {*} msg the message object
* @returns {ITimeObject} Date object of given Date or now
*/
function getNowObject(node, msg) {
    const dNow = getNowTimeStamp(node, msg);
    return {
        now     : dNow,
        nowNr   : dNow.getTime(),
        dayNr   : dNow.getDay(),
        dateNr  : dNow.getDate(),
        weekNr  : getWeekOfYear(dNow),
        monthNr : dNow.getMonth(),
        yearNr  : dNow.getFullYear(),
        dayId   : getDayId(dNow)
    };
}
/*******************************************************************************************************/
/* date-time functions                                                                                 */
/*******************************************************************************************************/
/**
 * convert the time part of a date into a comparable number
 * @param {Date} date  - date to convert
 * @return {number}   numeric representation of the time part of the date
 */
function getTimeNumberUTC(date) {
    return date.getUTCMilliseconds() + date.getUTCSeconds() * 1000 + date.getUTCMinutes() * 60000 + date.getUTCHours() * 3600000;
}
/*******************************************************************************************************/
/**
 * check if a given number is in given limits
 * @param {number} num number angle to compare
 * @param {number} low low limit
 * @param {number} high high limit
 * @return {bool}  **true** if the number is inside given limits, at least one limit must be validate, otherwise returns **false**
 */
function checkLimits(num, low, high) {
    // console.debug('checkLimits num=' + num + ' low=' + low + ' high=' + high); // eslint-disable-line
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

/**
 * check the type of the message
 * @param {*} msg message
 * @param {*} name property name
 */
function getMsgNumberValue(msg, ids, names, isFound, notFound) {
    if (ids && msg) {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            if (msg.payload && (typeof msg.payload[id] !== 'undefined') && (msg.payload[id] !== '')) {
                const res = Number(msg.payload[id]); // Number() instead of parseFloat() to also parse boolean
                if (!isNaN(res)) {
                    if (typeof isFound === 'function') {
                        return isFound(res);
                    }
                    return res;
                }
            }
            if ((typeof msg[id] !== 'undefined') && (msg[id] !== '')) {
                const res = Number(msg[id]);
                if (!isNaN(res)) {
                    if (typeof isFound === 'function') {
                        return isFound(res);
                    }
                    return res;
                }
            }
        }
    }
    if (names && msg && msg.topic) {
        const res = Number(msg.payload);
        if (!isNaN(res)) {
            if (!Array.isArray(names)) {
                names = [names];
            }
            for (let i = 0; i < names.length; i++) {
                if (String(msg.topic).includes(String(names[i]))) {
                    if (typeof isFound === 'function') {
                        return isFound(res);
                    }
                    return res;
                }
            }
        }
    }
    if (typeof notFound === 'function') {
        return notFound(msg);
    } else if (typeof notFound === 'undefined') {
        return NaN;
    }
    return notFound;
}

/**
 * check the type of the message
 * @param {*} msg message
 * @param {*} name property name
 */
function getMsgNumberValue2(msg, ids, isFound, notFound) {
    if (ids && msg) {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            if ((typeof msg[id] !== 'undefined') && (msg[id] !== '')) {
                const res = Number(msg[id]);
                if (!isNaN(res)) {
                    if (typeof isFound === 'function') {
                        return isFound(res);
                    }
                    return res;
                }
            }
        }
    }
    if (typeof notFound === 'function') {
        return notFound(msg);
    } else if (typeof notFound === 'undefined') {
        return NaN;
    }
    return notFound;
}
/**
 * check if the msg or msg.property contains a property with value true or the topic contains the given name
 * @param {*} msg message
 * @param {*} name property name
 */
function getMsgBoolValue(msg, ids, names, isFound, notFound) {
    if (ids && msg) {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            if (msg.payload && (typeof msg.payload[id] !== 'undefined') && (msg.payload[id] !== null) && (msg.payload[id] !== '')) {
                if (typeof isFound === 'function') {
                    return isFound(isTrue(msg.payload[id]), msg.payload[id], msg.topic);
                }
                return isTrue(msg.payload[id]);
            }
            if ((typeof msg[id] !== 'undefined') && (msg[id] !== null) && (msg[id] !== '')) {
                if (typeof isFound === 'function') {
                    return isFound(isTrue(msg[id]), msg[id], msg.topic);
                }
                return isTrue(msg[id]);
            }
        }
    }
    return getMsgTopicContains(msg, names, isFound, notFound);
}

/**
 * check if the msg contains a property with value true (no payload check)
 * @param {*} msg message
 * @param {*} name property name
 */
function getMsgBoolValue2(msg, ids, isFound, notFound) {
    if (ids && msg) {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            if ((typeof msg[id] !== 'undefined') && (msg[id] !== null) && (msg[id] !== '')) {
                if (typeof isFound === 'function') {
                    return isFound(isTrue(msg[id]), msg[id], msg.topic);
                }
                return isTrue(msg[id]);
            }
        }
    }
    if (typeof notFound === 'function') {
        return notFound(msg);
    } else if (typeof notFound === 'undefined') {
        return false;
    }
    return notFound;
}

/**
 * check if thetopic contains one of the given names
 * @param {*} msg message
 * @param {*} name property name
 */
function getMsgTopicContains(msg, names, isFound, notFound) {
    if (msg) { // && msg.topic
        if (!Array.isArray(names)) {
            names = [names];
        }
        const topic = String(msg.topic);
        for (let i = 0; i < names.length; i++) {
            if (topic.includes(String(names[i]))) {
                if (typeof isFound === 'function') {
                    return isFound(true, msg.payload, topic);
                }
                return true;
            }
        }
    }
    if (typeof notFound === 'function') {
        return notFound(msg);
    } else if (typeof notFound === 'undefined') {
        return false;
    }
    return notFound;
}
/*******************************************************************************************************/
/**
 * get the standard timezone offset without DST
 * @param {Date} d - Date to check
 * @returns {number} minutes of the timezone offset
 */
function getStdTimezoneOffset(d) {
    d = d || new Date();
    const jan = new Date(d.getFullYear(),0,1);
    const jul = new Date(d.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

/**
 * check mif a given Date is DST
 * @param {Date} d - Date to check
 * @returns {boolean} _true_ if the given Date has DST
 */
function isDSTObserved(d) {
    d = d || new Date();
    return d.getTimezoneOffset() < getStdTimezoneOffset(d);
}

/**
 * changes the time based on a timezone
 * @param {date} date Javascript Date object
 * @param {number} timeZoneOffset Offset in Minutes
  * @return {date} new date object with changed timezone to use with .toLocaleString()
 */
function convertDateTimeZone(date, timeZoneOffset) {
    const localTime = date.getTime();
    const localOffset = date.getTimezoneOffset() * 60000;
    const utc = localTime + localOffset;
    const destTime = utc + (60000*timeZoneOffset);
    return new Date(destTime);
}

/**
 * checks if a value is a valid Date object
 * @param {*} d - a value to check
 * @returns {boolean} returns __true__ if it is a valid Date, otherwhise __false__
 */
function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
    // d !== 'Invalid Date' && !isNaN(d)
}

/**
 * Parse an ISO date string (i.e. "2019-01-18T00:00:00.000Z",
 * "2019-01-17T17:00:00.000-07:00", or "2019-01-18T07:00:00.000+07:00",
 * which are the same time) and return a JavaScript Date object with the
 * value represented by the string.
 * @param {string} isoString - a ISO 8601 format string
 * @returns {Date} returns Date represtntation of the string
 */
function isoStringToDate( isoString ) {

    // Split the string into an array based on the digit groups.
    const dateParts = isoString.split( /\D+/ );

    // Set up a date object with the current time.
    const returnDate = new Date();

    // Manually parse the parts of the string and set each part for the
    // date. Note: Using the UTC versions of these functions is necessary
    // because we're manually adjusting for time zones stored in the
    // string.
    returnDate.setUTCFullYear( parseInt( dateParts[ 0 ] ) );

    // The month numbers are one "off" from what normal humans would expect
    // because January == 0.
    returnDate.setUTCMonth( parseInt( dateParts[ 1 ] - 1 ) );
    returnDate.setUTCDate( parseInt( dateParts[ 2 ] ) );

    // Set the time parts of the date object.
    returnDate.setUTCHours( parseInt( dateParts[ 3 ] ) );
    returnDate.setUTCMinutes( parseInt( dateParts[ 4 ] ) );
    returnDate.setUTCSeconds( parseInt( dateParts[ 5 ] ) );
    returnDate.setUTCMilliseconds( parseInt( dateParts[ 6 ] ) );

    // Track the number of hours we need to adjust the date by based
    // on the timezone.
    let timezoneOffsetHours = 0;

    // If there's a value for either the hours or minutes offset.
    if ( dateParts[ 7 ] || dateParts[ 8 ] ) {

        // Track the number of minutes we need to adjust the date by
        // based on the timezone.
        let timezoneOffsetMinutes = 0;

        // If there's a value for the minutes offset.
        if ( dateParts[ 8 ] ) {

            // Convert the minutes value into an hours value.
            timezoneOffsetMinutes = parseInt( dateParts[ 8 ] ) / 60;
        }

        // Add the hours and minutes values to get the total offset in
        // hours.
        timezoneOffsetHours = parseInt( dateParts[ 7 ] ) + timezoneOffsetMinutes;

        // If the sign for the timezone is a plus to indicate the
        // timezone is ahead of UTC time.
        if ( isoString.substr( -6, 1 ) === '+' ) {

            // Make the offset negative since the hours will need to be
            // subtracted from the date.
            timezoneOffsetHours *= -1;
        }
    }

    // Get the current hours for the date and add the offset to get the
    // correct time adjusted for timezone.
    returnDate.setHours( returnDate.getHours() + timezoneOffsetHours );

    // Return the Date object calculated from the string.
    return returnDate;
}
/* like previous isoStringToDate, but smaller
const parseDate = dateString => {
    const b = dateString.split(/\D+/);
    const offsetMult = dateString.indexOf('+') !== -1 ? -1 : 1;
    const hrOffset = offsetMult * (+b[7] || 0);
    const minOffset = offsetMult * (+b[8] || 0);
    return new Date(Date.UTC(+b[0], +b[1] - 1, +b[2], +b[3] + hrOffset, +b[4] + minOffset, +b[5], +b[6] || 0));
}; */

/**
 * Round a date to the nearest full Hour
 * @param {DATE} date Date to round
 * @returns {DATE} Date round to next full Hour
 */
function roundToHour(date) {
    const p = 60 * 60 * 1000; // milliseconds in an hour
    return new Date(Math.round(date.getTime() / p ) * p);
}

/*******************************************************************************************************/
/**
 * adds an offset to a given Date object (Warning: No copy of Date Object will be created and original Date Object could be changed!!)
 * @param {Date} d Date object where the offset should be added
 * @param {number} offset the offset (positive or negative) which should be added to the date. If no multiplier is given, the offset must be in milliseconds.
 * @param {number} [multiplier] additional multiplier for the offset. Should be a positive Number. Special value -1 if offset is in month and -2 if offset is in years
 * @return {Date|undefined|null}  Date with added offset
 */
function addOffset(d, offset, multiplier) {
    if (offset && !isNaN(offset) && offset !== 0) {
        if (multiplier > 0) {
            return new Date(d.getTime() + Math.floor(offset * multiplier));
        } else if (multiplier === -1) {
            d.setMonth(Math.floor(d.getMonth() + offset));
        } else if (multiplier === -2) {
            d.setFullYear(Math.floor(d.getFullYear() + offset));
        } else {
            return new Date(d.getTime() + Math.floor(offset)); // if multiplier is not a valid value
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
    while (!days.includes(daystart + dayx)) {
        dayx++;
        if ((daystart + dayx) > 6) {
            daystart = (dayx * -1);
        }
        if (dayx > 7) {
            dayx = -1;
            break;
        }
    }
    return dayx;
}

/**
 * calculates the number of month to get a positive date object
 * @param {Array.<number>} months array of allowed months
 * @param {number} monthstart start month (0=January)
 * @return {number} number of months for the next valid day as offset to the monthstart
 */
function calcMonthOffset(months, monthstart) {
    let monthx = 0;
    while (!months.includes(monthstart + monthx)) {
        monthx++;
        if ((monthstart + monthx) > 11) {
            monthstart = (monthx * -1);
        }
        if (monthx > 12) {
            monthx = -1;
            break;
        }
    }
    return monthx;
}

/*******************************************************************************************************/
/**
 * @typedef {Object} limitationsObj
 * @property {number} [next] if greater than 0 the number of days in the future
 * @property {string} [days] days for which should be calculated the sun time
 * @property {string} [months] months for which should be calculated the sun time
 * @property {boolean} [onlyOddDays] - if true only odd days will be used
 * @property {boolean} [onlyEvenDays] - if true only even days will be used
 * @property {boolean} [onlyOddWeeks] - if true only odd weeks will be used
 * @property {boolean} [onlyEvenWeeks] - if true only even weeks will be used
 */

/**
 * normalize date by adding offset, get only the next valid date, etc...
 * @param {Date} d input Date to normalize
 * @param {number} offset offset to add tot he Date object
 * @param {number} multiplier multiplier for the offset
 * @param {limitationsObj} [limit] additional limitations for the calculation
 * @return {Date} a normalized date moved tot the future to fulfill all conditions
 */
function normalizeDate(d, offset, multiplier, limit) {
    // console.debug(`normalizeDate d=${d} offset=${ offset }, multiplier=${multiplier}, limit=${limit}`); // eslint-disable-line
    if (d === null || typeof d === 'undefined') { return d; }
    if (d.value) { d = d.value; }
    if (!(d instanceof Date)) { d = Date(d); }
    d = addOffset(d, offset, multiplier);
    if (limit.next) {
        const dNow = new Date();
        d.setMilliseconds(0);
        dNow.setMilliseconds(600); // security
        const cmp = dNow.getTime();
        while (d.getTime() <= cmp) {
            d.setDate(d.getDate() + 1);
        }
    }
    const r = limitDate(limit, d);
    if (r.hasChanged) {
        return r.date;
    }
    return d;
}

/**
 * calculates limitation of a date
 * @param {limitationsObj} limit limitation object
 * @param {Date} date Date to check
 * @returns [date, hasChanged, error]
 */
function limitDate(limit, d) {
    let hasChanged = false;
    let error = '';
    if (limit.days && (limit.days !== '*') && (limit.days !== '')) {
        const dayx = calcDayOffset(limit.days, d.getDay());
        if (dayx > 0) {
            d.setDate(d.getDate() + dayx);
            hasChanged = true;
        } else if (dayx < 0) {
            error = 'No valid day of week found!';
        }
    }

    if (limit.months && (limit.months !== '*') && (limit.months !== '')) {
        const monthx = calcMonthOffset(limit.months, d.getMonth());
        if (monthx > 0) {
            d.setMonth(d.getMonth() + monthx);
            hasChanged = true;
        } else if (monthx < 0) {
            error = 'No valid month found!';
        }
    }

    if (isTrue(limit.onlyEvenDays) && !isTrue(limit.onlyOddDays)) { // eslint-disable-line eqeqeq
        let time = d.getDate();
        while ((time % 2 !== 0)) {
            // odd
            d.setDate(d.getDate() + 1);
            time = d.getDate();
            hasChanged = true;
        }
    }
    if (isTrue(limit.onlyOddDays) && !isTrue(limit.onlyEvenDays)) { // eslint-disable-line eqeqeq
        let time = d.getDate();
        while((time % 2 === 0)) {
            // even
            d.setDate(d.getDate() + 1);
            time = d.getDate();
            hasChanged = true;
        }
    }
    if (isTrue(limit.onlyEvenWeeks) && !isTrue(limit.onlyOddWeeks)) { // eslint-disable-line eqeqeq
        let week = getWeekOfYear(d);
        while (week[1] % 2 !== 0) {
            // odd
            d.setDate(d.getDate() + 1);
            week = getWeekOfYear(d);
            hasChanged = true;
        }
    }
    if (isTrue(limit.onlyOddWeeks) && !isTrue(limit.onlyEvenWeeks)) { // eslint-disable-line eqeqeq
        let week = getWeekOfYear(d);
        while(week[1] % 2 === 0) {
            // even
            d.setDate(d.getDate() + 1);
            week = getWeekOfYear(d);
            hasChanged = true;
        }
    }
    return {date:d, hasChanged, error};
}

/*******************************************************************************************************/
/**
 * parses a string which contains only a time to a Date object of today
 * @param {string} t text representation of a time
 * @param {Date} [date] bade Date object for parsing the time, now will be used if not defined
 * @param {boolean} [utc] define if the time should be in utc
 * @param {number} [timeZoneOffset] define a time zone offset if required
 * @return {Date|null} the parsed date object or **null** if can not parsed
 */
function getTimeOfText(t, date, utc, timeZoneOffset) {
    // console.debug('getTimeOfText t=' + t + ' date=' + date); // eslint-disable-line
    const d = date || new Date();
    if (t && (!t.includes('.')) && (!t.includes('-'))) {
        t = t.toLocaleLowerCase();
        // const matches = t.match(/(0\d|1\d|2[0-3]|\d)(?::([0-5]\d|\d))(?::([0-5]\d|\d))?\s*(p?)/);
        if (t.includes('utc')) {
            utc = true;
            t = t.replace('utc','');
        }
        if (t.includes('local')) {
            utc = false;
            t = t.replace('local','');
        }
        const matches = t.match(/(0\d|1\d|2[0-3]|\d)(?::([0-5]\d|\d))(?::([0-5]\d|\d))?\s*(p?)(?:a|am|m|\s)?\s*(?:(\+|-)(\d\d):([0-5]\d)|(\+|-)(\d\d\d\d?))?/);
        if (matches) {
            if (utc || matches[5] || matches[6] || matches[9] ) {
                // matches[5] - GMT, UTC or Z; matches[6] - +/-; matches[9] - +/-
                d.setUTCHours((parseInt(matches[1]) + (matches[4] ? 12 : 0)),
                    (parseInt(matches[2]) || 0),
                    (parseInt(matches[3]) || 0), 0);

                if (matches[6] && matches[7] && matches[8]) {
                    // +00:00 - timezone offset
                    const v = ((parseInt(matches[7]) * 60) + (matches[8] ? parseInt(matches[8]) : 0)) * ((matches[6] === '-') ? -1 : 1);
                    const m = d.getMinutes() + v;
                    d.setMinutes(m);
                }
                if (matches[9] && matches[10]) {
                    // +0000 or +000
                    const v = (parseInt(matches[10])) * ((matches[9] === '-') ? -1 : 1);
                    const m = d.getMinutes() + v;
                    d.setMinutes(m);
                }
                return d; // timeZoneOffset will be ignored!
            }
            d.setHours((parseInt(matches[1]) + (matches[4] ? 12 : 0)),
                (parseInt(matches[2]) || 0),
                (parseInt(matches[3]) || 0), 0);

            if (timeZoneOffset) {
                return convertDateTimeZone(d, timeZoneOffset);
            }
            return d;
        }
    }
    return null;
}
/*******************************************************************************************************/
/**
 * parses a string which contains a date or only a time to a Date object
 * @param {any} dt number or text which contains a date or a time
 * @param {boolean} preferMonthFirst if true, Dates with moth first should be preferd, otherwise month last (european)
 * @param {boolean} [utc] define if the time should be in utc
 * @return {Date} the parsed date object, throws an error if can not parsed
 */
function getDateOfText(dt, preferMonthFirst, utc, timeZoneOffset) {
    // console.debug('getDateOfText dt=' + util.inspect(dt, { colors: true, compact: 10, breakLength: Infinity })); // eslint-disable-line
    if (dt === null || typeof dt === 'undefined') {
        throw new Error('Could not evaluate as a valid Date or time. Value is null or undefined!');
    } else if (dt === '') {
        if (timeZoneOffset) {
            return convertDateTimeZone(new Date(), timeZoneOffset);
        }
        return new Date();
    }

    if (typeof dt === 'object') {
        dt = String(dt);
    }

    if (!isNaN(dt)) {
        dt = Number(dt);

        let dto = new Date(dt);
        if (utc || timeZoneOffset === 0) {
            dto = Date.UTC(dt);
        } else if (timeZoneOffset) {
            dto = convertDateTimeZone(dto, timeZoneOffset);
        }

        if (isValidDate(dto)) {
            return dto;
        }
    }

    const result = getTimeOfText(String(dt), utc, timeZoneOffset);
    if (result !== null && typeof result !== 'undefined') {
        return result;
    }

    if (typeof dt === 'string') {
        let res = _parseDateTime(dt, preferMonthFirst, utc, timeZoneOffset);
        if (res !== null && typeof res !== 'undefined') { return res; }
        res = _parseDate(dt, preferMonthFirst, utc, timeZoneOffset);
        if (res !== null && typeof res !== 'undefined') { return res; }
        res = _parseArray(dt, _dateFormat.parseTimes, utc, timeZoneOffset);
        if (res !== null && typeof res !== 'undefined') { return res; }
        if (utc || timeZoneOffset === 0) {
            if (!dt.includes('UTC') && !dt.includes('utc') && !dt.includes('+') && !dt.includes('-')) {
                dt += ' UTC';
            }
        } if (utc || timeZoneOffset === 0) {
            if (!dt.includes('+') && !dt.includes('-')) {
                if (timeZoneOffset < 0) {
                    dt += '-';
                } else {
                    dt += '+';
                }
                dt += pad2(Math.floor(Math.abs(timeZoneOffset) / 60)) + ':' + pad2(Math.abs(timeZoneOffset) % 60);
            }
        }

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
 *
 * http://blog.stevenlevithan.com/archives/date-time-format
 * http://stevenlevithan.com/assets/misc/date.format.js
 */

// Regexes and supporting functions are cached through closure

/**
 * Formate a date to the given Format string
 * @param  {Date} date -  JavaScript Date to format
 * @param  {string} mask -  mask of the date
 * @param  {boolean} [utc] -  if true the time should be delivered as UTC
 * @param  {number} [timeZoneOffset] -  define a different timezoneOffset in Minutes for output
 * @return {string}   date as depending on the given Format
 */
const _dateFormat = (function () {
    const token = /x{1,2}|d{1,4}|E{1,2}|M{1,4}|NNN|yy(?:yy)?|([HhKkmsTt])\1?|l{1,3}|[LSZ]|z{1,2}|o{1,4}|ww|w|dy|ddy|"[^"]*"|'[^']*'/g;

    // const timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
    // const timezoneClip = /[^-+\dA-Z]/g;

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc, timeZoneOffset) {
        const dF = _dateFormat;
        // You can't provide utc if you skip other Args. (use the "UTC:" mask prefix)
        if (arguments.length === 1 && Object.prototype.toString.call(date) === '[object String]' && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        const dNow = new Date();
        date = date ? new Date(date) : dNow;
        if (!isValidDate(date)) {
            throw new SyntaxError('invalid date');
        }
        const dayDiff = (date.getDate() - dNow.getDate());
        if (timeZoneOffset === 0) {
            utc = true;
        } else if (timeZoneOffset) {
            date = convertDateTimeZone(date, timeZoneOffset);
        }

        mask = String(mask || _dateFormat.isoDateTime);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) === 'UTC:' || mask.slice(0, 4) === 'utc:') {
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
        const o = utc ? 0 : ( (timeZoneOffset) ? timeZoneOffset : date.getTimezoneOffset());

        const flags = {
            d,
            dd: pad2(d),
            ddd: dF.i18n.dayNames[D + 7],
            dddd: dF.i18n.dayNames[D],
            E: dF.i18n.dayNames[D + 7],
            EE: dF.i18n.dayNames[D],
            M: M + 1,
            MM: pad2(M + 1),
            MMM: dF.i18n.monthNames[M + 12],
            MMMM: dF.i18n.monthNames[M],
            NNN: dF.i18n.monthNames[M],
            yy: String(y).slice(2),
            yyyy: y,
            h: H % 12 || 12,
            hh: pad2(H % 12 || 12),
            H, // 0-23
            HH: pad2(H), // 00-23
            k: (H % 12 || 12) - 1,
            kk: pad2((H % 12 || 12) - 1),
            K: H + 1,
            KK: pad2(H + 1),
            m,
            mm: pad2(m),
            s,
            ss: pad2(s),
            l,
            ll: pad2(l),
            lll: pad(l, 3),
            L: Math.round(l / 100),
            LL: pad2(Math.round(l / 10)),
            LLL: pad(l, 3),
            t: H < 12 ? 'a' : 'p',
            tt: H < 12 ? 'am' : 'pm',
            T: H < 12 ? 'A' : 'P',
            TT: H < 12 ? 'AM' : 'PM',
            w: getWeekOfYear(date)[1],
            ww: pad2(getWeekOfYear(date)[1]),
            dy: getDayOfYear(date)[1],
            ddy: pad(getDayOfYear(date)[1],3),
            Z: utc ? 'UTC' : /.*\s(.+)/.exec(date.toLocaleTimeString([], { timeZoneName: 'short' }))[1],
            z: utc ? '' : (String(date).match(/\b(?:GMT|UTC)(?:[-+]\d{4})?\b/g) || ['']).pop(),
            zz: utc ? '' : (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
            o: (o > 0 ? '-' : '+') + pad2(Math.floor(Math.abs(o) / 60)) + ':' + pad2(Math.abs(o) % 60),
            oo: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
            ooo: utc ? 'Z' : (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
            oooo: utc ? 'UTC' : (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
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
_dateFormat.isoDateTime = 'yyyy-MM-dd\'T\'HH:mm:ss';
_dateFormat.parseDates = {
    monthFirst : ['MMM d, y', 'MMM d,y', 'M/d/y', 'M-d-y', 'M.d.y', 'MMM-d', 'M/d', 'MMM d', 'M-d'],
    dateFirst : ['d-MMM-y', 'd/M/y', 'd-M-y', 'd.M.y', 'd-MMM', 'd/M', 'd-M', 'd MMM'],
    general : ['y-M-d', 'y-MMM-d']
};

_dateFormat.parseTimes = ['h:m:s:lt', 'h:m:s.lt', 'h:m:st', 'h:mt', 'h:m:s t', 'h:m:s.t', 'H:m:s:l', 'H:m:s.l', 'H:m:s', 'H:m', 'h:m:s t Z', 'H:m:s Z'];

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
    _dateFormat.i18n = {
        dayNames,
        monthNames,
        dayDiffNames
    };
}

_dateFormat.parse = [
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
_dateFormat.format = [
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
 * @param  {bool} [utc] - indicates if the formatted date should be in utc or not
 * @param  {number} [timeZoneOffset] - timezone offset for conversation in minutes
 * @return {any}   returns a number, string or object depending on the given Format
 */
function getFormattedDateOut(date, format, utc, timeZoneOffset) {
    // console.debug('getFormattedDateOut date=' + date + ' --> format=' + format + '  [' + dayNames + '] - [' + monthNames + '] [' + dayDiffNames + ']'); // eslint-disable-line
    if (timeZoneOffset === 0) {
        utc = true;
    }
    format = format || 0;
    if (date.value) { date = date.value; }
    if (!(date instanceof Date)) {
        date = Date(date);
        if (!isValidDate(date)) {
            throw new Error(`given Date is not a valid Date!!`);
        }
    }

    if (isNaN(format)) {
        return _dateFormat(date, String(format), utc, timeZoneOffset);
    }

    switch (Number(format)) {
        case 0: // timeformat_UNIX - milliseconds since Jan 1, 1970 00:00
            if (timeZoneOffset) {
                return convertDateTimeZone(date, timeZoneOffset).getTime();
            }
            return date.getTime();
        case 1: // timeformat_ECMA262 - date as string ECMA-262
        case 4:
            return date.toUTCString();
        case 2: // timeformat_local      - 26.12.2018, 23:40:45  - timeformat_G - 6/15/2009 1:45:30 PM
        case 14:
            if (utc) {
                return date.toUTCString();
            }
            if (timeZoneOffset) {
                return convertDateTimeZone(date, timeZoneOffset).toLocaleString();
            }
            return date.toLocaleString();
        case 3: // timeformat_localTime  - 23:40:58              - timeformat_T - 1:45:30 PM
        case 13:
            if (utc) {
                return date.toLocaleTimeString([], { timeZone: 'UTC' });
            }
            if (timeZoneOffset) {
                return convertDateTimeZone(date, timeZoneOffset).toLocaleTimeString();
            }
            return date.toLocaleTimeString();
        case 12: // timeformat_localDate - 26.12.2018  - timeformat_d - 6/15/2009
        case 15:
            if (utc) {
                return date.toLocaleDateString([], { timeZone: 'UTC' });
            }
            if (timeZoneOffset) {
                return convertDateTimeZone(date, timeZoneOffset).toLocaleDateString();
            }
            return date.toLocaleDateString();
        case 5: // timeparse_ISO8601
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
            if (utc) {
                return Number(date.getUTCFullYear() +
                        pad2(date.getUTCMonth() + 1) +
                        pad2(date.getUTCDate()) +
                        pad2(date.getUTCHours()) +
                        pad2(date.getUTCMinutes()) +
                        pad2(date.getUTCSeconds()));
            }
            if (timeZoneOffset) {
                date = convertDateTimeZone(date, timeZoneOffset);
            }
            return Number(date.getFullYear() +
                    pad2(date.getMonth() + 1) +
                    pad2(date.getDate()) +
                    pad2(date.getHours()) +
                    pad2(date.getMinutes()) +
                    pad2(date.getSeconds()));
        case 11: // timeformat_YYYYMMDD_HHMMSS
            if (utc) {
                return Number(date.getUTCFullYear() +
                        pad2(date.getUTCMonth() + 1) +
                        pad2(date.getUTCDate()) + '.' +
                        pad2(date.getUTCHours()) +
                        pad2(date.getUTCMinutes()) +
                        pad2(date.getUTCSeconds()));
            }
            if (timeZoneOffset) {
                date = convertDateTimeZone(date, timeZoneOffset);
            }
            return Number(date.getFullYear() +
                    pad2(date.getMonth() + 1) +
                    pad2(date.getDate()) + '.' +
                    pad2(date.getHours()) +
                    pad2(date.getMinutes()) +
                    pad2(date.getSeconds()));
        case 16: // timeformat_weekday           - Montag, 22.12.
            return _dateFormat(date, 'dddd, d.M.', utc, timeZoneOffset);
        case 17: // timeformat_weekday2          - heute 22.12., morgen 23.12., übermorgen 24.12., in 3 Tagen 25.12., Montag, 26.12.
            return _dateFormat(date, 'xx, d.M.', utc, timeZoneOffset);
        case 18: { // customISOstring(date, offset)
            date = new Date(date); // copy instance
            let offset = 0;
            if (!utc) {
                if (!timeZoneOffset) {
                    offset = date.getTimezoneOffset();
                } else {
                    offset = timeZoneOffset;
                }
            }
            const h = Math.floor(Math.abs(offset) / 60);
            const m = Math.abs(offset) % 60;
            date.setMinutes(date.getMinutes() - offset); // apply custom timezone
            return date.getUTCFullYear() + '-' // return custom format
                + pad2(date.getUTCMonth() + 1) + '-'
                + pad2(date.getUTCDate()) + 'T'
                + pad2(date.getUTCHours()) + ':'
                + pad2(date.getUTCMinutes()) + ':'
                + pad2(date.getUTCSeconds())
                + (offset === 0 ? 'Z' : (offset < 0 ? '+' : '-') + pad2(h) + ':' + pad2(m));
        }
        case 19: // workweek
            return getWeekOfYear(date)[1];
        case 20: // workweek even
            return !(getWeekOfYear(date)[1] % 2); // eslint-disable-line no-extra-boolean-cast
        case 21: // day of year
            return getDayOfYear(date)[1]; // eslint-disable-line no-extra-boolean-cast
        case 22: // day of year even
            return !(getDayOfYear(date)[1] % 2); // eslint-disable-line no-extra-boolean-cast
    }

    const dNow = new Date();
    const delay = (date.getTime() - dNow.getTime());
    const weekOfYear = getWeekOfYear(date);
    const dayOfYear = getDayOfYear(date);
    return {
        date,
        ts: date.getTime(),
        timeUTCStr: date.toUTCString(),
        timeISOStr: date.toISOString(),
        delay,
        delaySec: Math.round(delay / 1000),
        lc: dNow.getTime(),
        ofYear: {
            year : dayOfYear[0],
            day: {
                iso : dayOfYear,
                week : dayOfYear[1],
                even : !(dayOfYear[1] % 2)
            },
            week: {
                iso : weekOfYear,
                week : weekOfYear[1],
                even : !(weekOfYear[1] % 2)
            }
        }
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
        // if (digits.indexOf(val.charAt(i)) === -1) {
        if (!digits.includes(val.charAt(i))) {
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
        const token = str.substr(i, x);
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
 * @param {boolean} [utc] indicates if the date should be in utc
 * @param {number} [timeZoneOffset] timezone offset in minutes of the input date
 * @returns {object} a Date object with value:{Date} or error:{String} if pattern does not match.
 */
function _getDateFromFormat(val, format, utc, timeZoneOffset) {
    // console.debug(`getDateFromFormat val=${val} format=${format} timeZoneOffset=${timeZoneOffset}`); // eslint-disable-line
    val = String(val);

    if (format.slice(0, 4) === 'UTC:' || format.slice(0, 4) === 'utc:') {
        format = format.slice(4);
        utc = true;
    }
    if (val.includes('UTC') || val.includes('utc')) {
        val = val.replace('UTC', '').replace('utc', '');
        utc = true;
    }

    val = String(val);
    format = String(format);
    const dNow = new Date();
    let i_val = 0;
    let i_format = 0;
    let x; let y;
    let year = dNow.getFullYear();
    let month = dNow.getMonth() + 1;
    let date = dNow.getDate();
    let hour = dNow.getHours();
    let min = dNow.getMinutes();
    let sec = dNow.getSeconds();
    let misec = dNow.getMilliseconds();
    let ampm = '';

    while (i_format < format.length) {
        // Get next token from format string
        const c = format.charAt(i_format);
        let token = '';
        while ((format.charAt(i_format) === c) && (i_format < format.length)) {
            token += format.charAt(i_format++);
        }
        // console.log('"'+ token + '" ' + i_val);
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
            if (year === null && typeof year !== 'undefined') {
                return { value: null, error: 'invalid year of format "' + token + '"'};
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
            for (let i = 0; i < _dateFormat.i18n.monthNames.length; i++) {
                const month_name = _dateFormat.i18n.monthNames[i];
                if (val.substr(i_val, month_name.length).toLowerCase() === month_name.toLowerCase()) {
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
                return { value: null, error: 'invalidmonth "' + month + '" of format "' + token + '"' };
            }
        } else if (token === 'EE' || token === 'E' || token === 'dddd' || token === 'ddd') {
            for (let i = 0; i < _dateFormat.i18n.dayNames.length; i++) {
                const day_name = _dateFormat.i18n.dayNames[i];
                if (val.substr(i_val, day_name.length).toLowerCase() === day_name.toLowerCase()) {
                    i_val += day_name.length;
                    break;
                }
            }
        } else if (token === 'MM' || token === 'M') {
            month = _getInt(val, i_val, token.length, 2);
            if (month === null || typeof month === 'undefined' || (month < 1) || (month > 12)) {
                return { value: null, error: 'invalid month "' + month + '" of format "' + token + '"' };
            }
            i_val += month.length;
        } else if (token === 'dd' || token === 'd') {
            date = _getInt(val, i_val, token.length, 2);
            if (date === null || typeof date === 'undefined' || (date < 1) || (date > 31)) {
                return { value: null, error: 'invalid date "' + date + '"' };
            }
            i_val += date.length;
        } else if (token === 'hh' || token === 'h') {
            hour = _getInt(val, i_val, token.length, 2);
            if (hour === null || typeof hour === 'undefined' || (hour < 1) || (hour > 12)) {
                return { value: null, error: 'invalid hour "' + hour + '" of format "' + token + '"' };
            }
            i_val += hour.length;
        } else if (token === 'HH' || token === 'H') {
            hour = _getInt(val, i_val, token.length, 2);
            if (hour === null || typeof hour === 'undefined' || (hour < 0) || (hour > 23)) {
                return { value: null, error: 'invalid hour "' + hour + '" of format "' + token + '"' };
            }
            i_val += hour.length;
        } else if (token === 'kk' || token === 'k') {
            hour = _getInt(val, i_val, token.length, 2);
            if (hour === null || typeof hour === 'undefined' || (hour < 0) || (hour > 11)) {
                return { value: null, error: 'invalid hour "' + hour + '" of format "' + token + '"' };
            }
            i_val += hour.length;
        } else if (token === 'KK' || token === 'K') {
            hour = _getInt(val, i_val, token.length, 2);
            if (hour === null || typeof hour === 'undefined' || (hour < 1) || (hour > 24)) {
                return { value: null, error: 'invalid hour "' + hour + '" of format "' + token + '"' };
            }
            i_val += hour.length;
            hour--;
        } else if (token === 'mm' || token === 'm') {
            min = _getInt(val, i_val, token.length, 2);
            if (min === null || typeof min === 'undefined' || (min < 0) || (min > 59)) {
                return { value: null, error: 'invalid hour "' + hour + '" of format "' + token + '"' };
            }
            i_val += min.length;
        } else if (token === 'ss' || token === 's') {
            sec = _getInt(val, i_val, token.length, 2);
            if (sec === null || typeof sec === 'undefined' || (sec < 0) || (sec > 59)) {
                return { value: null, error: 'invalid sec "' + sec + '" of format "' + token + '"' };
            }
            i_val += sec.length;
        } else if (token.toLowerCase() === 'lll' || token.toLowerCase() === 'll' || token.toLowerCase() === 'l') {
            misec = _getInt(val, i_val, token.length, 3);
            if (misec === null || typeof misec === 'undefined' || (misec < 0) || (misec > 999)) {
                return { value: null, error: 'invalid millisecond "' + misec + '" of format "' + token + '"' };
            }
            i_val += misec.length;
            if ( token === 'L' && misec < 10) {
                misec = misec * 100;
            }
            if ( token === 'LL' && misec < 100) {
                misec = misec * 10;
            }
        } else if ((token.toLowerCase() === 'tt') || (token.toLowerCase() === 't')) {
            if (val.substr(i_val, 2).toLowerCase() === 'am') {
                ampm = 'AM';
                i_val += 2;
            } else if (val.substr(i_val, 2).toLowerCase() === 'pm') {
                ampm = 'PM';
                i_val += 2;
            } else if (val.substr(i_val, 1).toLowerCase() === 'a') {
                ampm = 'AM';
                i_val += 1;
            } else if (val.substr(i_val, 1).toLowerCase() === 'p') {
                ampm = 'PM';
                i_val += 1;
            } else {
                return { value: null, error: 'invalid ampm "' + sec + '" of format "' + token + '"' };
            }
        } else {
            if (val.substr(i_val, token.length) !== token) {
                return { value: null, error: 'value ' + val.substr(i_val, token.length) + ' is not equal to ' + token };
            }

            i_val += token.length;
        }
    }

    // console.log(`getDateFromFormat midFormat year=${year} month=${month} date=${date} hour=${hour} min=${min} sec=${sec} misec=${misec} utc=${utc}`); // eslint-disable-line

    // If there are any trailing characters left in the value, it doesn't match
    if (i_val !== val.length) {
        return { value: null, error: 'input value is longer than format' };
    }

    // Is date valid for month?
    if (month === 2) {
        // Check for leap year
        if (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)) { // leap year
            if (date > 29) {
                return { value: null, error: 'day of month > 29 (not valid for february - leap year)' };
            }
        } else if (date > 28) {
            return { value: null, error: 'day of month > 28 (not valid for february)' };
        }
    }

    if ((month === 4) || (month === 6) || (month === 9) || (month === 11)) {
        if (date > 30) {
            return { value: null, error: 'day of month is not valid' };
        }
    }

    // Correct hours value
    if (hour < 12 && ampm === 'PM') {
        hour = hour - 0 + 12;
    } else if (hour > 11 && ampm === 'AM') {
        hour -= 12;
    }

    // console.log(`getDateFromFormat out year=${year} month=${month} date=${date} hour=${hour} min=${min} sec=${sec} misec=${misec}`); // eslint-disable-line
    if (utc || timeZoneOffset === 0) {
        return { value : Date.UTC(year, month - 1, date, hour, min, sec, misec) };
    } else if (timeZoneOffset) {
        return {
            value: convertDateTimeZone(new Date(year, month - 1, date, hour, min, sec, misec), timeZoneOffset) };
    }
    return {
        value: new Date(year, month - 1, date, hour, min, sec, misec)
    };
}

/**
 * parses an array of different formats
 * @param {string} val date string to parse
 * @param {Array.<string>} listToCheck a list of strings with different formats to check
 * @returns {Date|null} a Date object or **null** if no patterns match.
 */
function _parseArray(val, listToCheck, utc, timeZoneOffset) {
    for (let i = 0, n = listToCheck.length; i < n; i++) {
        const res = _getDateFromFormat(val, listToCheck[i], utc, timeZoneOffset);
        if (res.value !== null && typeof res.value !== 'undefined') {
            return res.value;
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
function _parseDate(val, preferMonthFirst, utc, timeZoneOffset) {
    // console.debug('_parseDate val=' + val + ' - preferMonthFirst=' + preferMonthFirst); // eslint-disable-line
    let res = _parseArray(val, (preferMonthFirst) ? _dateFormat.parseDates.monthFirst : _dateFormat.parseDates.dateFirst, utc, timeZoneOffset);
    if (res !== null && typeof res !== 'undefined') { return res; }
    res = _parseArray(val, (preferMonthFirst) ? _dateFormat.parseDates.dateFirst : _dateFormat.parseDates.monthFirst, utc, timeZoneOffset);
    if (res !== null && typeof res !== 'undefined') { return res; }
    return _parseArray(val, _dateFormat.parseDates.general, utc, timeZoneOffset);
}

/**
 * This function takes a date and time string and tries to match it to a
 * number of possible date formats to get the value.
 * @param {string} val date string to parse
 * @param {boolean} [preferMonthFirst] if **true** the method to search first for formats like M/d/y (e.g. American format) before d/M/y (e.g. European).
 * @returns {Date|null} a Date object or **null** if no patterns match.
 */
function _parseDateTime(val, preferMonthFirst, utc, timeZoneOffset) {
    // console.debug('_parseDateTime val=' + val + ' - preferMonthFirst=' + preferMonthFirst); // eslint-disable-line
    /** mixes two lists */
    function mix(lst1, lst2, result) {
        for (let i = 0; i < lst1.length; i++) {
            for (let j = 0; j < lst2.length; j++) {
                result.push(lst1[i] + ' ' + lst2[j]);
            }
        }
        return result;
    }

    let checkList = [_dateFormat.isoDateTime];
    if (preferMonthFirst) {
        checkList = mix(_dateFormat.parseDates.monthFirst, _dateFormat.parseTimes, checkList);
        checkList = mix(_dateFormat.parseDates.dateFirst, _dateFormat.parseTimes, checkList);
    } else {
        checkList = mix(_dateFormat.parseDates.dateFirst, _dateFormat.parseTimes, checkList);
        checkList = mix(_dateFormat.parseDates.monthFirst, _dateFormat.parseTimes, checkList);
    }
    checkList = mix(_dateFormat.parseDates.general, _dateFormat.parseTimes, checkList);
    return _parseArray(val, checkList, utc, timeZoneOffset);
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
function parseDateFromFormat(date, format, dayNames, monthNames, dayDiffNames, utc, timeZoneOffset) {
    // console.debug('parseDateFromFormat date=' + util.inspect(date, { colors: true, compact: 10, breakLength: Infinity }) + ' - format=' + util.inspect(format, { colors: true, compact: 10, breakLength: Infinity }) + '  [' + dayNames + '] - [' + monthNames + '] [' + dayDiffNames + ']'); // eslint-disable-line
    if (dayNames) {
        _dateFormat.i18n.dayNames = dayNames;
    }

    if (monthNames) {
        _dateFormat.i18n.monthNames = monthNames;
    }

    if (dayDiffNames) {
        _dateFormat.i18n.dayDiffNames = dayDiffNames;
    }

    format = format || 0;
    if (timeZoneOffset === 0) {
        utc = true;
    }

    let res = null;

    if (isNaN(format)) { // timeparse_TextOther
        res = _getDateFromFormat(date, format, utc, timeZoneOffset);
        if (res.error) {
            throw new Error('could not evaluate format of ' + date + ' (' + format + ') - ' + res.error);
        }
        res = res.value;
    } else {
        const tryparse = (val, preferMonthFirst) => {
            // console.debug('try parse ' + util.inspect(val, { colors: true, compact: 10, breakLength: Infinity }) + ' preferMonthFirst=' + preferMonthFirst); // eslint-disable-line
            let res = _parseDateTime(val, preferMonthFirst, utc, timeZoneOffset);
            if (res !== null && typeof res !== 'undefined') { return res; }
            res = _parseDate(val, preferMonthFirst, utc, timeZoneOffset);
            if (res !== null && typeof res !== 'undefined') { return res; }
            res = _parseArray(val, _dateFormat.parseTimes, utc, timeZoneOffset);
            if (res !== null && typeof res !== 'undefined') { return res; }
            res = Date.parse(val);
            if (!isNaN(res)) {
                return new Date(res);
            }
            if (!isNaN(val) && _isTimestamp(val)) {
                const dto = new Date(val);
                if (isValidDate(dto)) {
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
                res = new Date(Date.parse(date));
                break;
            case 6: // timeparse_ISO8601
                res = isoStringToDate(date);
                break;
            case 2: // various - try different Formats, prefer day first like d/M/y (e.g. European format)
                res = tryparse(date, false);
                break;
            case 3: // various - try different Formats, prefer month first like M/d/y (e.g. American format)
                res = tryparse(date, true);
                break;
            case 4: {// timeformat_YYYYMMDDHHMMSS
                date = String(date);
                const year = date.substr(0, 4);
                const month = date.substr(4, 2);
                const day = date.substr(6, 2);
                const hours = date.substr(8, 2);
                const mins = date.substr(10, 2);
                const secs = date.substr(12, 2);
                const mss = date.substr(14);
                if (utc) {
                    res = Date.UTC(year, month, day, hours, mins, secs, mss);
                } else if (timeZoneOffset) {
                    res = convertDateTimeZone(new Date(year, month, day, hours, mins, secs, mss), timeZoneOffset);
                } else {
                    res =new Date(year, month, day, hours, mins, secs, mss);
                }
                break;
            }
            case 5: { // timeformat_YYYYMMDD_HHMMSS
                date = String(date);
                const year = date.substr(0, 4);
                const month = date.substr(4, 2);
                const day = date.substr(6, 2);
                const hours = date.substr(9, 2);
                const mins = date.substr(11, 2);
                const secs = date.substr(13, 2);
                const mss = date.substr(15);
                if (utc) {
                    res = Date.UTC(year, month, day, hours, mins, secs, mss);
                } else if (timeZoneOffset) {
                    res = convertDateTimeZone(new Date(year, month, day, hours, mins, secs, mss), timeZoneOffset);
                } else {
                    res = new Date(year, month, day, hours, mins, secs, mss);
                }
                break;
            }
            default: {
                res = getDateOfText(date);
                break;
            }
        }
        // console.debug('result='+ util.inspect(res, { colors: true, compact: 10, breakLength: Infinity }) + ' ' + isNaN(res)); // eslint-disable-line
        if (!isValidDate(res)) {
            throw new Error('could not evaluate format of ' + date + ' (' + format + ')');
        }
    }
    return res;
}

/**
 * replaces placeholder in a string
 * @param {string} topic - the topic
 * @param {object} topicAttrs - an object with different propertys who are allowed as placeholders
 * @returns {string} the topic with replaced placeholders
 */
function topicReplace(topic, topicAttrs) {
    if (!topic || typeof topicAttrs !== 'object') {
        return topic;
    }

    const topicAttrsLower = {};
    Object.keys(topicAttrs).forEach(k => {
        topicAttrsLower[k.toLowerCase()] = topicAttrs[k];
    });

    const match = topic.match(/\${[^}]+}/g);
    if (match) {
        match.forEach(v => {
            const key = v.substr(2, v.length - 3);
            const rx = new RegExp('\\${' + key + '}', 'g');
            const rkey = key.toLowerCase();
            const res = Object.prototype.hasOwnProperty.call(topicAttrsLower, rkey) ? topicAttrsLower[rkey] : '';
            topic = topic.replace(rx, res);
        });
    }
    return topic;
}