/********************************************
 * sun-position:
 *********************************************/
"use strict";
const util = require('util');

module.exports = {
    errorHandler,
    compareAzimuth,
    addOffset,
    calcDayOffset,
    calcTimeValue,
    calcTimeValueUTC,
    getTimeOfText,
    getDateOfText,
    //getTimeOfTextUTC,
    //getDateOfTextUTC,
    getTimeNumber,
    getNodeId,
    formatDate
};

/*******************************************************************************************************/
/* Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setUTCDate(date.getUTCDate() + days);
    return date;
} */

/*******************************************************************************************************/
/* exported functions                                                                                  */
/*******************************************************************************************************/
function getNodeId(node) {
    //node.debug(node.debug(util.inspect(srcNode, Object.getOwnPropertyNames(srcNode))));
    return '[' + node.type + ((node.name) ? '/' + node.name + ':' : ':') + node.id + ']';
}
/*******************************************************************************************************/
function errorHandler(node, err, messageText, stateText) {
    if (!err) {
        return true;
    }
    if (err.message) {
        let msg = err.message.toLowerCase();
        messageText += ':' + err.message;
    } else {
        messageText += '! (No error message given!)';
    }

    if (node) {
        node.error(messageText);
        node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
        node.status({
            fill: "red",
            shape: "ring",
            text: stateText
        });
    } else if (console) {
        console.error(messageText);
        console.error(util.inspect(err, Object.getOwnPropertyNames(err)));
    }
    return false;
};
/*******************************************************************************************************/
function getTimeNumber(date) {
    return date.getUTCMilliseconds() + date.getUTCSeconds() + date.getUTCMinutes() * 60 + date.getUTCHours() * 3600;
}
/*******************************************************************************************************/
/*function compareAzimuth(obj, name, azimuth, low, high, old) {
    if (typeof low !== 'undefined' && low !== '' && !isNaN(low)) {
        if (typeof high !== 'undefined' && high !== '' && !isNaN(high)) {
            if (high > low) {
                obj[name] = (azimuth > low) && (azimuth < high);
            } else {
                obj[name] = (azimuth > low) || (azimuth < high);
            }
        } else {
            obj[name] = (azimuth > low);
        }
        return obj[name] != old[name];
    } else if (typeof high !== 'undefined' && high !== '' && !isNaN(high)) {
        obj[name] = (azimuth < high);
        return obj[name] != old[name];
    }
    return false;
}; */
function compareAzimuth(azimuth, low, high) {
    if (typeof low !== 'undefined' && low !== '' && !isNaN(low) && low >= 0) {
        if (typeof high !== 'undefined' && high !== '' && !isNaN(high) && high >= 0) {
            if (high > low) {
                return (azimuth > low) && (azimuth < high);
            } else {
                return (azimuth > low) || (azimuth < high);
            }
        } else {
            return (azimuth > low);
        }
    } else if (typeof high !== 'undefined' && high !== '' && !isNaN(high)) {
        return (azimuth < high);
    }
    return false;
};

/*******************************************************************************************************/
function addOffset(d, offset) {
    if (offset && !isNaN(offset) && offset !== 0) {
        return new Date(d.getTime() + offset * 1000); //- does not work
    }
    return d;
}
/*******************************************************************************************************/
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
function calcTimeValue(d, offset, next, days) {
    //console.debug('calcTimeValue d=' + d + ' offset=' + offset + ' next=' + next + ' days=' + days);
    d = addOffset(d, offset);
    if (next && !isNaN(next)) {
        let now = new Date();
        d.setMilliseconds(0);
        now.setMilliseconds(600); //security
        let cmp = now.getTime();
        if (d.getTime() <= cmp) {
            d.setDate(d.getDate() + Number(next));
            //d = d.addDays(Number(next));
        }
    }
    if (days && (days !== '*') && (days !== '')) {
        let dayx = calcDayOffset(days, d.getDay());
        if (dayx > 0) {
            d.setDate(d.getDate() + dayx);
            //d = d.addDays(dayx);
        }
    }
    return d;
}
/*******************************************************************************************************/
function calcTimeValueUTC(d, offset, next, days) {
    //console.debug('calcTimeValueUTC d=' + d + ' offset=' + offset + ' next=' + next + ' days=' + days);
    d = addOffset(d, offset);
    if (next && !isNaN(next)) {
        let now = new Date();
        d.setUTCMilliseconds(0);
        now.setUTCMilliseconds(600); //security
        let cmp = now.getTime();
        if (d.getTime() <= cmp) {
            d.setUTCDate(d.getUTCDate() + Number(next));
            //d = d.addDays(Number(next));
        }
    }
    if (days && (days !== '*') && (days !== '')) {
        let dayx = calcDayOffset(days, d.getUTCDay());
        if (dayx > 0) {
            d.setUTCDate(d.getUTCDate() + dayx);
            //d = d.addDays(dayx);
        }
    }
    return d;
}
/*******************************************************************************************************/
function getTimeOfText(t, offset, next, days, date) {
    //console.debug('getTimeOfText t=' + t + ' offset=' + offset + ' next=' + next + ' days=' + days);
    let d = date || new Date();
    if (t && (t.indexOf('.') === -1) && (t.indexOf('-') === -1)) {
        let matches = t.match(/(0[0-9]|1[0-9]|2[0-3]|[0-9])(?::([0-5][0-9]|[0-9]))(?::([0-5][0-9]|[0-9]))?\s*(p?)/);
        if (matches) {
            d.setHours((parseInt(matches[1]) + (matches[4] ? 12 : 0)),
                (parseInt(matches[2]) || 0),
                (parseInt(matches[3]) || 0), 0);
            //console.log(d);
        } else {
            return null;
        }
        return calcTimeValue(d, offset, next, days)
    }
    return null;
};
/*******************************************************************************************************/
function getDateOfText(date, offset, next, days) {
    if (date == null) {
        throw new Error('Could not evaluate as a valid Date or time. Value is null!');
    }
    if (typeof date === 'object') {
        if (x.hasOwnProperty('now')) {
            date = date.now;
        } else if (x.hasOwnProperty('date')) {
            date = date.date;
        } else if (x.hasOwnProperty('time')) {
            date = date.time;
        } else if (x.hasOwnProperty('ts')) {
            date = date.ts;
        } else if (x.hasOwnProperty('lc')) {
            date = date.lc;
        } else if (x.hasOwnProperty('value')) {
            date = date.lc;
        }
    }
    var re = /^(0[0-9]|[0-9]|1[0-9]|2[0-3])(?::([0-5][0-9]|[0-9]))?(?::([0-5][0-9]|[0-9]))?\s*(pm?)?$/;
    if (re.test(String(date))) {
        let result = getTimeOfText(String(date), offset, next, days);
        if (result != null) {
            return result;
        }
    }
    if (!isNaN(date)) {
        date = Number(date);
    }
    let dto = new Date(date);
    if (dto !== "Invalid Date" && !isNaN(dto)) {
        return calcTimeValue(dto, offset, next, days);
    }
    throw new Error("could not evaluate " + String(date) + ' as a valid Date or time.');
};
/*******************************************************************************************************/
/*
function getTimeOfTextUTC(t, tzOffset, offset, next, days, date) {
    //console.debug('getTimeOfTextUTC t=' + t + ' tzOffset=' + tzOffset + ' offset=' + offset + ' next=' + next + ' days=' + days);
    let d = date || new Date();
    if (t && (t.indexOf('.') === -1) && (t.indexOf('-') === -1)) {
        let matches = t.match(/(0[0-9]|1[0-9]|2[0-3]|[0-9])(?::([0-5][0-9]|[0-9]))(?::([0-5][0-9]|[0-9]))?\s*(p?)/);
        if (matches) {
            d.setHours((parseInt(matches[1]) + (matches[4] ? 12 : 0)),
                (parseInt(matches[2]) || 0) + (tzOffset || 0),
                (parseInt(matches[3]) || 0), 0);
            //console.log(d);
        } else {
            return null;
        }
        return calcTimeValueUTC(d, offset, next, days)
    }
    return null;
};
/*******************************************************************************************************/
/*
function getDateOfTextUTC(date, tzOffset, offset, next, days) {
    if (!isNaN(date)) {
        date = Number(date);
    }
    let dto = new Date(date);
    if (dto !== "Invalid Date" && !isNaN(dto)) {
        return calcTimeValueUTC(dto, offset, next, days);
    } else {
        let result = getTimeOfTextUTC(String(date), tzOffset, offset, next, days);
        if (result != null) {
            return result;
        }
    }
    throw new Error("could not evaluate " + String(date) + ' as a valid Date or time.');
};/** **/


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

    var dateFormat = function () {
        var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
            timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            timezoneClip = /[^-+\dA-Z]/g,
            pad = function (val, len) {
                val = String(val);
                len = len || 2;
                while (val.length < len) val = "0" + val;
                return val;
            };

        // Regexes and supporting functions are cached through closure
        return function (date, mask, utc) {
            var dF = dateFormat;

            // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
            if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
                mask = date;
                date = undefined;
            }

            // Passing date through Date applies Date.parse, if necessary
            let now = new Date;
            date = date ? new Date(date) : now;
            let dayDiff = (date.getDate() - now.getDate());
            if (isNaN(date)) throw SyntaxError("invalid date");

            mask = String(dF.masks[mask] || mask || dF.masks["default"]);

            // Allow setting the utc argument via the mask
            if (mask.slice(0, 4) == "UTC:") {
                mask = mask.slice(4);
                utc = true;
            }

            var	_ = utc ? "getUTC" : "get",
                d = date[_ + "Date"](),
                D = date[_ + "Day"](),
                m = date[_ + "Month"](),
                y = date[_ + "FullYear"](),
                H = date[_ + "Hours"](),
                M = date[_ + "Minutes"](),
                s = date[_ + "Seconds"](),
                L = date[_ + "Milliseconds"](),
                o = utc ? 0 : date.getTimezoneOffset(),
                flags = {
                    d:    d,
                    dd:   pad(d),
                    ddd:  dF.i18n.dayNames[D + 7],
                    dddd: dF.i18n.dayNames[D],
                    m:    m + 1,
                    mm:   pad(m + 1),
                    mmm:  dF.i18n.monthNames[m + 12],
                    mmmm: dF.i18n.monthNames[m],
                    yy:   String(y).slice(2),
                    yyyy: y,
                    h:    H % 12 || 12,
                    hh:   pad(H % 12 || 12),
                    H:    H,
                    HH:   pad(H),
                    M:    M,
                    MM:   pad(M),
                    s:    s,
                    ss:   pad(s),
                    l:    pad(L, 3),
                    L:    pad(L > 99 ? Math.round(L / 10) : L),
                    t:    H < 12 ? "a"  : "p",
                    tt:   H < 12 ? "am" : "pm",
                    T:    H < 12 ? "A"  : "P",
                    TT:   H < 12 ? "AM" : "PM",
                    Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                    o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                    S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10],
                    x:    dayDiff,
                    xx:   (dayDiff >=  -1 && dayDiff <= dF.i18n.dayDiffNames.length ) ? dF.i18n.dayDiffNames(dayDiff + 1) : dF.i18n.dayNames[D]
                };

            return mask.replace(token, function ($0) {
                return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
            });
        };
    }();

    // Some common format strings
    dateFormat.masks = {
        "default":      "ddd mmm dd yyyy HH:MM:ss",
        shortDate:      "m/d/yy",
        mediumDate:     "mmm d, yyyy",
        longDate:       "mmmm d, yyyy",
        fullDate:       "dddd, mmmm d, yyyy",
        shortTime:      "h:MM TT",
        mediumTime:     "h:MM:ss TT",
        longTime:       "h:MM:ss TT Z",
        isoDate:        "yyyy-mm-dd",
        isoTime:        "HH:MM:ss",
        isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
        isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    };
    dateFormat.i18n = {
        dayNames: [
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
            "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
        ],
        monthNames: [
            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ],
        dayDiffNames: [
            "Yesterday", "Today", "Tomorrow", "day after tomorrow", "in 3 days", "in 4 days", "in 5 days", "in 6 days"
        ]
    };

function formatDate(date, mask, utc, dayNames, monthNames, dayDiffNames) {
    if (dayNames) {
        dateFormat.i18n.dayNames = dayNames;
    }
    if (monthNames) {
        dateFormat.i18n.monthNames = monthNames;
    }
    if (dayDiffNames) {
        dateFormat.i18n.dayDiffNames = dayDiffNames;
    }
    return dateFormat(date, mask, utc);
};