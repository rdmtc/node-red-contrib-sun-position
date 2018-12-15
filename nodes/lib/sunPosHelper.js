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
    getNodeId
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
        let dayx = calcDayOffset(days,d.getDay());
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
        let dayx = calcDayOffset(days,d.getUTCDay());
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
    if ( typeof date === 'object') {
        if ( x.hasOwnProperty('now') ) {
            date = date.now;
        } else if ( x.hasOwnProperty('date') ) {
            date = date.date;
        } else if ( x.hasOwnProperty('time') ) {
            date = date.time;
        } else if ( x.hasOwnProperty('ts') ) {
            date = date.ts;
        } else if ( x.hasOwnProperty('lc') ) {
            date = date.lc;
        } else if ( x.hasOwnProperty('value') ) {
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