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
    emoji: '🌚',
    code: ':new_moon_with_face:',
    name: 'New Moon',
    weight: 1
},
{
    emoji: '🌒',
    code: ':waxing_crescent_moon:',
    name: 'Waxing Crescent',
    weight: 6.3825
},
{
    emoji: '🌓',
    code: ':first_quarter_moon:',
    name: 'First Quarter',
    weight: 1
},
{
    emoji: '🌔',
    code: ':waxing_gibbous_moon:',
    name: 'Waxing Gibbous',
    weight: 6.3825
},
{
    emoji: '🌝',
    code: ':full_moon_with_face:',
    name: 'Full Moon',
    weight: 1
},
{
    emoji: '🌖',
    code: ':waning_gibbous_moon:',
    name: 'Waning Gibbous',
    weight: 6.3825
},
{
    emoji: '🌗',
    code: ':last_quarter_moon:',
    name: 'Last Quarter',
    weight: 1
},
{
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

const compareOperators = {
    'true': (a) => (a === true),
    'false': (a) => (a === false),
    'null': (a) => (typeof a == 'undefined' || a === null), // eslint-disable-line eqeqeq
    'nnull': (a) => (typeof a != 'undefined' && a !== null), // eslint-disable-line eqeqeq
    'empty': (a) => {
        if (typeof a === 'string' || Array.isArray(a) || Buffer.isBuffer(a)) {
            return a.length === 0;
        } else if (typeof a === 'object' && a !== null) {
            return Object.keys(a).length === 0;
        }
        return false;
    },
    'nempty': (a) => {
        if (typeof a === 'string' || Array.isArray(a) || Buffer.isBuffer(a)) {
            return a.length !== 0;
        } else if (typeof a === 'object' && a !== null) {
            return Object.keys(a).length !== 0;
        }
        return false;
    },
    'true_expr': (a) => hlp.isTrue(a),
    'false_expr': (a) => hlp.isFalse(a),
    'ntrue_expr': (a) => (!hlp.isTrue(a)),
    'nfalse_expr': (a) => (!hlp.isFalse(a)),
    'equal': (a, b) => (a == b),  // eslint-disable-line eqeqeq
    'nequal': (a, b) => (a != b),  // eslint-disable-line eqeqeq
    'lt': (a, b) => (a < b),
    'lte': (a, b) => (a <= b),
    'gt': (a, b) => (a > b),
    'gte': (a, b) => (a >= b),
    'contain': (a, b) => ((a + '').indexOf(b) !== -1),
    'istype': (a, b) => {
        if (b === 'array') {
            return Array.isArray(a);
        } else if (b === 'buffer') {
            return Buffer.isBuffer(a);
        } else if (b === 'json') {
            try {
                JSON.parse(a); return true;
            } catch (e) {
                return false;
            }
        } else if (b === 'null') {
            return a === null;
        }
        return typeof a === b && !Array.isArray(a) && !Buffer.isBuffer(a) && a !== null;
    }
};

module.exports = function (RED) {
    'use strict';

    function positionConfigurationNode(n) {
        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.longitude = parseFloat(this.credentials.posLongitude || n.longitude);
        this.latitude = parseFloat(this.credentials.posLatitude || n.latitude);
        this.angleType = n.angleType;
        this.tzOffset = (n.timezoneOffset * -60) || 0;
        // this.debug('load position-config ' + this.name + ' long:' + this.longitude + ' latitude:' + this.latitude + ' angelt:' + this.angleType + ' TZ:' + this.tzOffset);

        this.lastSunCalc = {
            ts: 0
        };
        this.lastMoonCalc = {
            ts: 0
        };
        const node = this;
        this.getSunTime = (now, value, offset, multiplier, next, days) => {
            // node.debug('getSunTime value=' + value + ' offset=' + offset + ' multiplier=' + multiplier + ' next=' + next + ' days=' + days);
            let result = sunTimesCheck(node, now);
            result = Object.assign(result, node.sunTimesToday[value]);
            result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
            if (next && !isNaN(next) && result.value.getTime() <= now.getTime()) {
                if (next === 1) {
                    result = Object.assign(result, node.sunTimesTomorow[value]);
                } else if (next > 1) {
                    checkCoordinates(node);
                    const date = (new Date()).addDays(next);
                    result = Object.assign(result, sunCalc.getTimes(date, node.latitude, node.longitude)[value]);
                }

                result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
            }

            if (days && (days !== '*') && (days !== '')) {
                // node.debug('move days ' + days + ' result=' + util.inspect(result));
                const dayx = hlp.calcDayOffset(days, result.value.getDay());
                if (dayx > 0) {
                    checkCoordinates(node);
                    const date = result.value.addDays(dayx);
                    // let times = sunCalc.getTimes(date, node.latitude, node.longitude);
                    result = Object.assign(result, sunCalc.getTimes(date, node.latitude, node.longitude)[value]);
                    result.value = hlp.addOffset(new Date(result.value), offset, multiplier);
                } else if (dayx < 0) {
                    // node.debug('getSunTime - no valid day of week found value=' + value + ' - next=' + next + ' - days=' + days + ' result=' + util.inspect(result));
                    result.error = 'No valid day of week found!';
                }
            }

            // node.debug('getSunTime result=' + util.inspect(result));
            return result;
        };

        this.getMoonTime = (now, value, offset, multiplier, next, days) => {
            // node.debug('getMoonTime value=' + value + ' offset=' + offset + ' next=' + next + ' days=' + days);
            const result = moonTimesCheck(node, now);
            result.value = hlp.addOffset(new Date(node.moonTimesToday[value]), offset, multiplier);
            if (next && !isNaN(next) && result.value.getTime() <= now.getTime()) {
                if (next === 1) {
                    result.value = hlp.addOffset(new Date(node.moonTimesTomorow[value]), offset, multiplier);
                    // node.debug('Moon Times tomorrow =' + util.inspect(node.moonTimesTomorrow));
                } else if (next > 1) {
                    checkCoordinates(node);
                    const date = (new Date()).addDays(next);
                    const times = sunCalc.getMoonTimes(date, node.latitude, node.longitude, true);
                    result.value = hlp.addOffset(new Date(times[value]), offset, multiplier);
                    // node.debug('Moon Times for ' + date + ' =' + util.inspect(times));
                }
            }

            if (days && (days !== '*') && (days !== '')) {
                const dayx = hlp.calcDayOffset(days, result.value.getDay());
                if (dayx > 0) {
                    checkCoordinates(node);
                    const date = (new Date()).addDays(dayx);
                    const times = sunCalc.getMoonTimes(date, node.latitude, node.longitude, true);
                    result.value = hlp.addOffset(new Date(times[value]), offset, multiplier);
                } else if (dayx < 0) {
                    result.error = 'No valid day of week found!';
                    // node.debug('getMoonTime - no valid week day found value=' + value + ' - next=' + next + ' - days=' + days + ' result=' + result.value);
                }
            }

            // node.debug('getMoonTime result' + util.inspect(result));
            return result;
        };

        this.getFloatProp = (_srcNode, msg, type, value, def) => {
            // _srcNode.debug('getFloatProp type='+type+' value='+value);
            let data; // 'msg', 'flow', 'global', 'num', 'bin', 'env', 'jsonata'
            if (type === 'num') {
                data = value;
            } else if (type === '' || (typeof type === 'undefined') || type === null) {
                if (isNaN(value)) {
                    return def || NaN;
                }
                data = value;
            } else if (type === 'none') {
                return def || NaN;
            } else if (type === 'msgPayload') {
                data = msg.payload;
            } else if (type === 'msgValue') {
                data = msg.value;
            } else {
                data = RED.util.evaluateNodeProperty(value, type, _srcNode, msg);
            }
            if (data === null || typeof data === 'undefined') {
                throw new Error(RED._('errors.notEvaluableProperty', {type:type, value:value}));
            }
            data = parseFloat(data);
            if (isNaN(data)) {
                throw new Error('the value of ' + type + '.' + value + ' is not a valid Number!');
            }
            return data;
        };

        this.getOutDataProp = (_srcNode, msg, vType, value, format, offset, offsetType, multiplier, days) => {
            // _srcNode.debug('getOutDataProp type='+vType+' value='+value+' format='+format+' offset='+offset+' offset='+offsetType+' multiplier='+multiplier);
            let result = null;
            if (vType === null || vType === 'none' || vType === '' || (typeof vType === 'undefined')) {
                if (value === '' || (typeof value === 'undefined')) {
                    const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                    result = hlp.addOffset((new Date()), offsetX, multiplier);
                    return hlp.getFormattedDateOut(result, format);
                }
                return value;
            } else if (vType === 'date') {
                return Date.now();
            } else if (vType === 'dateSpecific') {
                const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                result = hlp.addOffset((new Date()), offsetX, multiplier);
                return hlp.getFormattedDateOut(result, format);
            } else if (vType === 'msgPayload') {
                return msg.payload;
            } else if (vType === 'msgTs') {
                return msg.ts;
            } else if (vType === 'msgLc') {
                return msg.lc;
            } else if (vType === 'msgValue') {
                return msg.value;
            } else if (vType === 'pdsCalcData') {
                return node.getSunCalc(msg.ts);
            } else if (vType === 'pdmCalcData') {
                return node.getMoonCalc(msg.ts);
            } else if ((vType === 'pdsTime') || (vType === 'pdmTime')) {
                if (vType === 'pdsTime') { // sun
                    const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                    result = node.getSunTime((new Date()), value, offsetX, multiplier, undefined, days);
                } else if (vType === 'pdmTime') { // moon
                    const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                    result = node.getMoonTime((new Date()), value, offsetX, multiplier, undefined, days);
                }
                if (result && result.value && !result.error) {
                    return hlp.getFormattedDateOut(result.value, format);
                }
                return null;
            } else if (vType === 'entered' || vType === 'dateEntered') {
                result = hlp.getDateOfText(String(value));
                const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                result = hlp.normalizeDate(result, offsetX, multiplier, undefined, days);
                return hlp.getFormattedDateOut(result, format);
            } else if (vType === 'dayOfMonth') {
                result = new Date();
                result = hlp.getSpecialDayOfMonth(result.getFullYear(),result.getMonth(), value);
                if (result !== null && typeof result !== 'undefined') {
                    const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                    result = hlp.addOffset(result, offsetX, multiplier);
                    return hlp.getFormattedDateOut(result, format);
                }
                return null;
            }
            return RED.util.evaluateNodeProperty(value, vType, _srcNode, msg);
        };

        this.getDateFromProp = (_srcNode, msg, vType, value, format, offset, offsetType, multiplier) => {
            // _srcNode.debug('getDateFromProp type='+vType+' value='+value+' format='+format+' offset='+offset+ ' offsetType=' + offsetType +' multiplier='+multiplier);
            let result = null;
            try {
                if (vType === null || vType === 'none' || vType === '') {
                    return new Date();
                } else if (vType === 'date') {
                    return new Date();
                } else if (vType === 'dateSpecific') {
                    const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                    return hlp.addOffset((new Date()), offsetX, multiplier);
                } else if (vType === 'dayOfMonth') {
                    let d = new Date();
                    d = hlp.getSpecialDayOfMonth(d.getFullYear(),d.getMonth(), value);
                    const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                    return hlp.addOffset(d, offsetX, multiplier);
                } else if ((vType === 'pdsTime') || (vType === 'pdmTime')) {
                    const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                    if (vType === 'pdsTime') {
                        // sun
                        result = node.getSunTime((new Date()), value, offsetX, multiplier);
                        result.fix = true;
                    } else if (vType === 'pdmTime') {
                        // moon
                        result = node.getMoonTime((new Date()), value, offsetX, multiplier);
                        result.fix = true;
                    }
                    if (result && result.value && !result.error) {
                        return result.value;
                    }
                    throw new Error(RED._('errors.notEvaluablePropertyAdd', {type:vType, value:value, err:result.error}));
                } else if (vType === 'entered' || vType === 'dateEntered') {
                    result = hlp.getDateOfText(String(value));
                    const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                    return hlp.addOffset(result, offsetX, multiplier);
                } else if (vType === 'msgPayload') {
                    result = msg.payload;
                } else if (vType === 'msgTs') {
                    result = msg.ts;
                } else if (vType === 'msgLc') {
                    return msg.lc;
                } else if (vType === 'msgValue') {
                    result = msg.value;
                } else {
                    // msg, flow, global, str, num, env
                    result = RED.util.evaluateNodeProperty(value, vType, _srcNode, msg);
                }
                if (result !== null && typeof result !== 'undefined') {
                    const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                    result = hlp.parseDateFromFormat(result, format, RED._('position-config.days'), RED._('position-config.month'), RED._('position-config.dayDiffNames'));
                    return hlp.addOffset(result, offsetX, multiplier);
                }
            } catch (err) {
                node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                const e = new Error(`Exception "${err.message}", on try to evaluate ${vType}.${value}`);
                e.original = err;
                e.stack = e.stack.split('\n').slice(0,2).join('\n')+'\n'+err.stack;
                throw e;
            }
        };

        this.getTimeProp = (_srcNode, msg, vType, value, offset, offsetType, multiplier, next, days) => {
            // node.debug('getTimeProp [' + hlp.getNodeId(_srcNode) + '] vType=' + vType + ' value=' + value + ' offset=' + offset + ' offsetType=' + offsetType + ' multiplier=' + multiplier + ' next=' + next + ' days=' + days);
            let result = {
                value: null,
                error: null,
                fix: true
            };
            try {
                if (days === '') {
                    result.error = 'No valid Days given!';
                } else if (vType === '' || vType === 'none') {
                    result.error = 'wrong type "' + vType + '"="' + value+'"';
                } else if (vType === 'date') {
                    result.value = new Date();
                    result.fix = true;
                } else if (vType === 'dateSpecific') {
                    const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                    result.value = hlp.normalizeDate((new Date()), offsetX, multiplier, next, days);
                    result.fix = true;
                } else if (vType === 'entered') {
                    result.value = hlp.getTimeOfText(String(value), (new Date()));
                    if (result.value !== null) {
                        const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                        result.value = hlp.normalizeDate(result.value, offsetX, multiplier, next, days);
                    }
                    result.fix = true;
                } else if (vType === 'pdsTime') {
                    // sun
                    const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                    result = node.getSunTime((new Date()), value, offsetX, multiplier, next, days);
                    result.fix = true;
                } else if (vType === 'pdmTime') {
                    // moon
                    const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                    result = node.getMoonTime((new Date()), value, offsetX, multiplier, next, days);
                    result.fix = true;
                } else {
                    // can handle context, json, jsonata, env, ...
                    result.fix = (vType === 'json'); // is not a fixed time if can be changed
                    const res = RED.util.evaluateNodeProperty(value, vType, _srcNode, msg);
                    if (res) {
                        result.value = hlp.getDateOfText(res);
                        const offsetX = node.getFloatProp(node, msg, offsetType, offset, 0);
                        result.value = hlp.normalizeDate(result.value, offsetX, multiplier, next, days);
                        // node.debug(String(res) + '  --  ' + result.value);
                    } else {
                        result.error = RED._('errors.notEvaluableProperty', {type:vType, value:value});
                    }
                }
            } catch (err) {
                node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                const e = new Error(RED._('errors.notEvaluablePropertyAdd', {type:vType, value:value, err:result.error}));
                e.original = err;
                e.stack = e.stack.split('\n').slice(0,2).join('\n')+'\n'+err.stack;
                throw e;
            }

            if (!result.value) {
                if (!result.error) {
                    result.error = 'Can not get time for ' + vType + '=' + value;
                }
                result.value = new Date();
            }

            // node.debug('getTimeProp result' + util.inspect(result));
            return result;
        };
        /*******************************************************************************************************/
        this.comparePropValue = (_srcNode, msg, opTypeA, opValueA, compare, opTypeB, opValueB, tempStorage) => {
            _srcNode.debug(`getComparablePropValue opTypeA='${opTypeA}' opValueA='${opValueA}' compare='${compare}' opTypeB='${opTypeB}' opValueB='${opValueB}'`);
            if (opTypeA === 'none' || opTypeA === '' || typeof opTypeA === 'undefined' || opTypeA === null) {
                return false;
            }
            const opVal = (type, value, opName) => {
                let opData = null;
                try {
                    if (type === 'num') {
                        return Number(value);
                    } else if (type === 'msgPayload') {
                        return msg.payload;
                    } else if (type === 'msgValue') {
                        return msg.value;
                    }
                    opData = RED.util.evaluateNodeProperty(value, type, _srcNode, msg);
                    if (typeof tempStorage !== 'undefined' && type === 'msg') {
                        tempStorage[opName] = opData;
                    }
                    return opData;
                } catch (err) {
                    node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                    if (tempStorage && (type === 'msg') && tempStorage[opName]) {
                        _srcNode.log(RED._('errors.notEvaluableProperty', { type: type, value: value }));
                        return tempStorage[opName];
                    }
                    _srcNode.warn(RED._('errors.notEvaluableProperty', { type: type, value: value }));
                    return null;
                }
            };

            return compareOperators[compare](opVal(opTypeA, opValueA, 'OperandA'), opVal(opTypeB, opValueB, 'OperandB'));
        };
        /**************************************************************************************************************/
        this.getSunCalc = (date, noTimes) => {
            // node.debug(`getSunCalc for date="${date}" noTimes="${noTimes}"`);
            if (typeof date === 'string') {
                // node.debug('getSunCalc for date ' + date);
                const dto = new Date(date);
                if (dto !== 'Invalid Date' && !isNaN(dto)) {
                    date = dto;
                }
            }

            if ((typeof date === 'undefined') || !(date instanceof Date)) {
                node.debug('getSunCalc, no valid date ' + date + ' given');
                date = new Date();
                if (this.lastSunCalc && (Math.abs(date.getTime() - this.lastSunCalc.ts) < 4000)) {
                    node.debug('getSunCalc, time difference since last output to low, do no calculation');
                    return this.lastSunCalc;
                }
            }

            const sunPos = sunCalc.getPosition(date, node.latitude, node.longitude);
            const azimuthDegrees = 180 + 180 / Math.PI * sunPos.azimuth;
            const altitudeDegrees = 180 / Math.PI * sunPos.altitude; // elevation = altitude

            const result = {
                ts: date.getTime(),
                lastUpdate: date,
                latitude: node.latitude,
                longitude: node.longitude,
                angleType: node.angleType,
                azimuth: (node.angleType === 'deg') ? azimuthDegrees : sunPos.azimuth,
                altitude: (node.angleType === 'deg') ? altitudeDegrees : sunPos.altitude, // elevation = altitude
                altitudeDegrees: altitudeDegrees,
                azimuthDegrees: azimuthDegrees,
                altitudeRadians: sunPos.altitude,
                azimuthRadians: sunPos.azimuth
            };

            if (noTimes) {
                // node.debug('no times result= ' + util.inspect(result));
                return result;
            }
            sunTimesCheck(node);
            result.times = node.sunTimesToday;
            this.lastSunCalc = result;
            // node.debug('result= ' + util.inspect(result));
            return result;
        };

        /**************************************************************************************************************/
        this.getMoonCalc = (date, noTimes) => {
            if (typeof date === 'string') {
                const dto = new Date(date);
                if (dto !== 'Invalid Date' && !isNaN(dto)) {
                    date = dto;
                }
            }

            if ((typeof date === 'undefined') || !(date instanceof Date)) {
                date = new Date();
                if (this.lastMoonCalc (Math.abs(date.getTime() - this.lastMoonCalc.ts) < 3000)) {
                    return this.lastMoonCalc;
                }
            }

            const moonPos = sunCalc.getMoonPosition(date, node.latitude, node.longitude);
            const moonIllum = sunCalc.getMoonIllumination(date);

            const result = {
                ts: date.getTime(),
                lastUpdate: date,
                latitude: node.latitude,
                longitude: node.longitude,
                angleType: node.angleType,
                azimuth: (node.angleType === 'deg') ? 180 + 180 / Math.PI * moonPos.azimuth : moonPos.azimuth,
                altitude: (node.angleType === 'deg') ? 180 / Math.PI * moonPos.altitude : moonPos.altitude, // elevation = altitude
                distance: moonPos.distance,
                parallacticAngle: (node.angleType === 'deg') ? 180 / Math.PI * moonPos.parallacticAngle : moonPos.parallacticAngle,
                illumination: {
                    angle: (node.angleType === 'deg') ? 180 / Math.PI * moonIllum.angle : moonIllum.angle,
                    fraction: moonIllum.fraction,
                    phase: {},
                    zenithAngle: (node.angleType === 'deg') ? 180 / Math.PI * (moonIllum.angle - moonPos.parallacticAngle) : moonIllum.angle - moonPos.parallacticAngle
                }
            };

            if (moonIllum.phase < 0.01) {
                // 0            New Moon            -   Neumond(Phasenwinkel = 0°)
                result.illumination.phase = moonPhases[0];
            } else if (moonIllum.phase < 0.25) {
                // 0 - 0.25     Waxing Crescent     -   erstes Viertel bzw. zunehmende Sichel(0° < Phasenwinkel < 90°),
                result.illumination.phase = moonPhases[1];
            } else if (moonIllum.phase < 0.26) {
                // 0.25	        First Quarter       -   zunehmender Halbmond(astronomisch: erstes Viertel, Phasenwinkel = 90°),
                result.illumination.phase = moonPhases[2];
            } else if (moonIllum.phase < 0.50) {
                // 0.25 - 0.5   Waxing Gibbous      -   zweites Viertel(90° < Phasenwinkel < 180°),
                result.illumination.phase = moonPhases[3];
            } else if (moonIllum.phase < 0.51) {
                // 0.5	        Full Moon           -   Vollmond(Phasenwinkel = 180°),
                result.illumination.phase = moonPhases[4];
            } else if (moonIllum.phase <= 0.75) {
                // 0.5 - 0.75    Waning Gibbous     -   drittes Viertel (180° < Phasenwinkel < 270°),
                result.illumination.phase = moonPhases[5];
            } else if (moonIllum.phase < 0.76) {
                // 0.75	        Last Quarter        -   abnehmender Halbmond(astronomisch: letztes Viertel, Phasenwinkel = 270°),
                result.illumination.phase = moonPhases[6];
            } else {
                // Waning Crescent                  -   letztes Viertel bzw. abnehmende Sichel(Phasenwinkel > 270°).
                result.illumination.phase = moonPhases[7];
            }

            result.illumination.phase.value = moonIllum.phase;
            result.illumination.phase.angle = (node.angleType === 'rad') ? (moonIllum.phase * 360) / (180 / Math.PI) : moonIllum.phase * 360;

            if (noTimes) { return result; }
            sunTimesCheck(node);
            result.times = node.moonTimesToday;
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
        };

        /**************************************************************************************************************/
        try {
            node.debug('initialize');
            const today = new Date();
            const dayId = getUTCDayId(today);
            const tomorrow = today.addDays(1);
            sunTimesRefresh(node, today, tomorrow, dayId);
            moonTimesRefresh(node, today, tomorrow, dayId);
            hlp.initializeParser(RED._('common.days', { returnObjects: true}), RED._('common.month', { returnObjects: true}), RED._('common.dayDiffNames', { returnObjects: true}));
        } catch (err) {
            node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
            node.status({
                fill: 'red',
                shape: 'ring',
                text: RED._('errors.error-title')
            });
            throw err;
        }
        /**************************************************************************************************************/
        function checkCoordinates(node) {
            if (isNaN(node.longitude) || (node.longitude < -180) || (node.longitude > 180)) {
                throw new Error(RED._('position-config.errors.longitude-missing'));
            }
            if (isNaN(node.latitude) || (node.latitude < -90) || (node.latitude > 90)) {
                throw new Error(RED._('position-config.errors.latitude-missing'));
            }
            if ((node.latitude === 0) && (node.longitude === 0)) {
                throw new Error(RED._('position-config.errors.coordinates-missing'));
            }
        }

        function sunTimesRefresh(node, today, tomorrow, dayId) {
            checkCoordinates(node);
            // node.debug('sunTimesRefresh - calculate sun times');
            node.sunTimesToday = sunCalc.getTimes(today, node.latitude, node.longitude);
            node.sunTimesTomorow = sunCalc.getTimes(tomorrow, node.latitude, node.longitude);
            node.sunDayId = dayId;
        }

        function sunTimesCheck(node, today, dayId) {
            // node.debug('sunTimesCheck');
            const dateb = today || new Date();
            const day_id = dayId || getUTCDayId(dateb);
            if (node.sunDayId !== day_id) {
                const tomorrow = (new Date()).addDays(1);
                sunTimesRefresh(node, dateb, tomorrow, day_id);
            }

            return {
                calcDate: dateb,
                dayId: day_id
            };
        }

        function moonTimesRefresh(node, today, tomorrow, dayId) {
            checkCoordinates(node);
            // node.debug('moonTimesRefresh - calculate moon times');
            node.moonTimesToday = sunCalc.getMoonTimes(today, node.latitude, node.longitude, true);
            if (!node.moonTimesToday.alwaysUp) {
                // true if the moon never rises/sets and is always above the horizon during the day
                node.moonTimesToday.alwaysUp = false;
            }

            if (!node.moonTimesToday.alwaysDown) {
                // true if the moon is always below the horizon
                node.moonTimesToday.alwaysDown = false;
            }

            node.moonTimesTomorow = sunCalc.getMoonTimes(tomorrow, node.latitude, node.longitude, true);
            if (!node.moonTimesTomorow.alwaysUp) {
                // true if the moon never rises/sets and is always above the horizon during the day
                node.moonTimesTomorow.alwaysUp = false;
            }

            if (!node.moonTimesTomorow.alwaysDown) {
                // true if the moon is always below the horizon
                node.moonTimesTomorow.alwaysDown = false;
            }

            node.moonDayId = dayId;
        }

        function moonTimesCheck(node, today, dayId) {
            // node.debug('moonTimesCheck');
            const dateb = today || new Date();
            const day_id = dayId || getUTCDayId(dateb);
            if (node.moonDayId !== day_id) {
                const tomorrow = (new Date()).addDays(1);
                moonTimesRefresh(node, dateb, tomorrow, day_id);
            }

            return {
                calcDate: dateb,
                dayId: day_id
            };
        }

        function getUTCDayId(d) {
            return d.getUTCDay() + (d.getUTCMonth() * 31) + (d.getUTCFullYear() * 372);
        }
    }

    RED.nodes.registerType('position-config', positionConfigurationNode, {
        credentials: {
            posLongitude: {type: 'text' },
            posLatitude: { type: 'text' }
        }
    });
};