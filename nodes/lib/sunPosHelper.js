/********************************************
 * sun-position:
 *********************************************/
"use strict";

const sunCalc = require('suncalc');

module.exports = {
    errorHandler,
    compareAzimuth,
    calcTimeValue,
    getTimeOfText,
    getTimeOfTextUTC,
    getDateOfText,
    getDateOfTextUTC,
    getTimeNumber,
    getNodeId
};

/*******************************************************************************************************/
Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setUTCDate(date.getUTCDate() + days);
    return date;
}

/*******************************************************************************************************/
/* exported functions                                                                                  */
/*******************************************************************************************************/
function getNodeId(node) {
    //node.debug(node.debug(JSON.stringify(srcNode, Object.getOwnPropertyNames(srcNode))));
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
        node.debug(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        node.status({
            fill: "red",
            shape: "ring",
            text: stateText
        });
    } else if (console) {
        console.error(messageText);
        console.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
    return false;
};
/*******************************************************************************************************/
function getTimeNumber(date) {
    return date.getUTCSeconds() + date.getUTCMinutes() * 60 + date.getUTCHours() * 3600;
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
function calcTimeValue(d, offset, next, days) {
    //console.debug('calcTimeValue d=' + d + ' offset=' + offset + ' next=' + next + ' days=' + days);
    if (offset && !isNaN(offset) && offset !== 0) {
        d = new Date(d.getTime() + offset * 1000); //- does not work
    }
    if (next && !isNaN(next)) {
        let now = new Date();
        d.setUTCMilliseconds(0);
        now.setUTCMilliseconds(600); //security
        let cmp = now.getTime();
        if (d.getTime() <= cmp) {
            d = d.addDays(Number(next));
        }
    }
    if (days && (days !== '*') && (days !== '')) {
        let daystart = d.getUTCDay();
        let dayx = 0;
        let daypos = daystart;
        while (days.indexOf(daypos) === -1) {
            dayx += 1;
            if ((daystart + dayx) > 6) {
                daypos = (daystart * -1) + dayx - 1;
            } else {
                daypos = daystart + dayx;
            }
            if (dayx > 6) {
                dayx = -1;
                break;
            }
        }
        if (dayx > 0) {
            d = d.addDays(dayx);
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
    if (!isNaN(date)) {
        date = Number(date);
    }
    let dto = new Date(date);
    if (dto !== "Invalid Date" && !isNaN(dto)) {
        return calcTimeValue(dto, offset, next, days);
    } else {
        let result = getTimeOfText(String(date), offset, next, days);
        if (result != null) {
            return result;
        }
    }
    throw new Error("could not evaluate " + String(date) + ' as a valid Date or time.');
};
/*******************************************************************************************************/
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
        return calcTimeValue(d, offset, next, days)
    }
    return null;
};
/*******************************************************************************************************/
function getDateOfTextUTC(date, tzOffset, offset, next, days) {
    if (!isNaN(date)) {
        date = Number(date);
    }
    let dto = new Date(date);
    if (dto !== "Invalid Date" && !isNaN(dto)) {
        return calcTimeValue(dto, offset, next, days);
    } else {
        let result = getTimeOfTextUTC(String(date), tzOffset, offset, next, days);
        if (result != null) {
            return result;
        }
    }
    throw new Error("could not evaluate " + String(date) + ' as a valid Date or time.');
};