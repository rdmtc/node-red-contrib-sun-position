/********************************************
 * position-config:
 *********************************************/
"use strict";

const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));
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
    }
];

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setUTCDate(date.getUTCDate() + days);
    return date;
}

function nextday(days, daystart) {
    let dayx = 0;
    let daypos = daystart;
    while (days.indexOf(daypos) === -1) {
        dayx += 1;
        if ((daystart + dayx) > 6) {
            daypos = dayx - (7 - daystart);
        } else {
            daypos = daystart + dayx;
        }
        if (dayx > 6) {
            dayx = -1;
            break;
        }
    }
    return dayx;
}

module.exports = function (RED) {
    "use strict";

    function positionConfigurationNode(n) {
        RED.nodes.createNode(this, n);
        try {
            //this.debug('load position-config ' + n.name);
            this.name = n.name;
            this.longitude = n.longitude;
            this.latitude = n.latitude;
            this.angleType = n.angleType;
            this.tzOffset = (n.timezoneOffset * -60) || 0;
            this.debug('load position-config ' + this.name + ' long:' + this.longitude + ' lat:' + this.latitude + ' angelt:' + this.angleType + ' TZ:' + this.tzOffset);

            this.lastSunCalc = {
                ts: 0
            };
            this.lastMoonCalc = {
                ts: 0
            };

            var node = this;

            /*this.getSunTimes = () => {
                //node.debug('getSunTimes');
                let res = sunTimesCheck(node);
                res.today = node.sunTimesToday;
                res.tomorrow = node.sunTimesTomorow;
                return res;
            }*/
            this.getSunTime = (now, value, next, days) => {
                //node.debug('getSunTime ' + value + ' - ' + next + ' - ' + days);
                let result = sunTimesCheck(node, now);
                result = Object.assign(result, node.sunTimesToday[value]);
                result.value = new Date(result.value);
                if (next && !isNaN(next) && result.value.getTime() <= now.getTime()) {
                    if (next === 1) {
                        result = Object.assign(result, node.sunTimesTomorow[value]);
                    } else if (next > 1) {
                        let date = (new Date()).addDays(next);
                        result = Object.assign(result, sunCalc.getTimes(date, node.latitude, node.longitude)[value]);
                    }
                    result.value = new Date(result.value);
                }
                if (days && (days !== '*') && (days !== '')) {
                    let dayx = nextday(days, result.value.getUTCDay());
                    //node.debug('move day ' + dayx);
                    if (dayx > 0) {
                        let date = result.value.addDays(dayx);
                        //let times = sunCalc.getTimes(date, node.latitude, node.longitude);
                        result = Object.assign(result, sunCalc.getTimes(date, node.latitude, node.longitude)[value]);
                        result.value = new Date(result.value);
                    } else if (dayx < 0) {
                        node.debug('getSunTime - no valid day of week found value=' + value + ' - next=' + next + ' - days=' + days + ' result=' + util.inspect(result));
                        result.error = 'No valid day of week found!';
                    }
                }
                //node.debug('getSunTime result=' + util.inspect(result));
                return result;
            }
            this.getMoonTimes = () => {
                //node.debug('getMoonTimes');
                let res = moonTimesCheck(node);
                res.today = node.moonTimesToday;
                res.tomorrow = node.moonTimesTomorow;
                return res;
            }
            this.getMoonTime = (now, value, next, days) => {
                //node.debug('getMoonTime ' + value + ' - ' + next + ' - ' + days);
                let result = moonTimesCheck(node, now);
                result.value = new Date(node.moonTimesToday[value]);
                if (next && !isNaN(next) && result.value.getTime() <= now.getTime()) {
                    if (next === 1) {
                        result.value = new Date(node.moonTimesTomorow[value]);
                    } else if (next > 1) {
                        let date = (new Date()).addDays(next);
                        let times = sunCalc.getMoonTimes(date, node.latitude, node.longitude, true);
                        result.value = times[value];
                    }
                }
                if (days && (days !== '*') && (days !== '')) {
                    let dayx = nextday(days, result.value.getUTCDay());
                    if (dayx === 1) {
                        result.value = new Date(node.moonTimesTomorow[value]);
                    } else if (dayx > 1) {
                        let date = (new Date()).addDays(dayx);
                        let times = sunCalc.getMoonTimes(date, node.latitude, node.longitude, true);
                        result.value = new Date(times[value]);
                    } else if (dayx < 0) {
                        result.error = 'no valid week day found!';
                        node.debug('getMoonTime - no valid week day found value=' + value + ' - next=' + next + ' - days=' + days + ' result=' + result.value);
                    }
                }
                return result;
            }

            this.getTimeProp = (srcNode, msg, vType, value, offset, next, days) => {
                //node.debug('getTimeProp ' + hlp.getNodeId(srcNode) + ' vType=' + vType + ' value=' + value + ' offset=' + offset + ' next=' + next + ' days=' + days);
                let now = new Date();
                let result = {
                    value: null,
                    error: null,
                    fix: true
                };
                try {
                    if (vType === '' || vType === 'none' || days === '') {
                        //nix
                    } else if (vType === 'date') {
                        result.value = now;
                        result.fix = true;
                    } else if (vType === 'entered') {
                        result.value = hlp.getTimeOfText(String(value), offset, next, days, now);
                        //node.debug(String(value) + '  --  ' + result.value);
                        result.fix = true;
                    } else if (vType === 'pdsTime') {
                        //sun
                        result = node.getSunTime(now, value, next, days);
                        result.fix = true;
                    } else if (vType === 'pdmTime') {
                        //moon
                        result = node.getMoonTime(now, value, next, days);
                        result.fix = true;
                    } else if (vType === 'json') {
                        let val = JSON.parse(value);
                        let date = (val.now) ? val.now : ((val.date) ? val.date : ((val.time) ? val.time : ((val.ts) ? val.ts : "")));
                        result.value = hlp.hlp.getDateOfText(date, offset, next, days);
                        //node.debug(date + '  --  ' + result.value);
                        result.fix = true;
                    } else {
                        //evaluateNodeProperty(value, type, node, msg, callback)
                        let res = RED.util.evaluateNodeProperty(value, vType, srcNode, msg);
                        if (res) {
                            result.value = hlp.getDateOfText(String(res), offset, next, days);
                            result.fix = false; // not a fixed time, because can be changed
                            //node.debug(String(res) + '  --  ' + result.value);
                        } else {
                            result.error = "could not evaluate " + vType + '.' + value;
                        }
                    }
                } catch (err) {
                    result.error = "could not evaluate " + vType + '=' + value + ': ' + err.message;
                    //node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                }

                if (!result.value) {
                    if (!result.error) {
                        result.error = "Can not get time for " + vType + '=' + value;
                    }
                    result.value = now;
                }
                return result;
            };
            initTimes(this);
        } catch (err) {
            hlp.errorHandler(this, err, RED._("position-config.errors.error-text"), RED._("position-config.errors.error-title"));
        }
        /**************************************************************************************************************/
        this.getSunCalc = (date) => {
            if (typeof date === 'string') {
                node.debug('getSunCalc for date ' + date);
                let dto = new Date(date);
                if (dto !== "Invalid Date" && !isNaN(dto)) {
                    date = dto;
                }
            }
            if ((typeof date === 'undefined') || !(date instanceof Date)) {
                node.debug('getSunCalc, no valid date ' + date + ' given');
                date = new Date();
                if (Math.abs(date.getTime() - this.lastSunCalc.ts) < 4000) {
                    node.debug('getSunCalc, time difference since last output to low, do no calculation');
                    return this.lastSunCalc;
                }
            }

            var sunPos = sunCalc.getPosition(date, node.latitude, node.longitude);
            let result = {
                ts: date.getTime(),
                lastUpdate: date,
                latitude: node.latitude,
                longitude: node.longitude,
                angleType: node.angleType,
                azimuth: (node.angleType === 'deg') ? 180 + 180 / Math.PI * sunPos.azimuth : sunPos.azimuth,
                altitude: (node.angleType === 'deg') ? 180 / Math.PI * sunPos.altitude : sunPos.altitude, //elevation = altitude
            }
            sunTimesCheck(node);
            result.times = node.sunTimesToday;
            this.lastSunCalc = result;

            return result;
        }
        /**************************************************************************************************************/
        this.getMoonCalc = (date) => {
            if (typeof date === 'string') {
                let dto = new Date(date);
                if (dto !== "Invalid Date" && !isNaN(dto)) {
                    date = dto;
                }
            }
            if ((typeof date === 'undefined') || !(date instanceof Date)) {
                date = new Date();
                if (Math.abs(date.getTime() - this.lastMoonCalc.ts) < 3000) {
                    return this.lastMoonCalc;
                }
            }

            let moonPos = sunCalc.getMoonPosition(date, node.latitude, node.longitude);
            let moonIllum = sunCalc.getMoonIllumination(date);

            var result = {
                ts: date.getTime(),
                lastUpdate: date,
                latitude: node.latitude,
                longitude: node.longitude,
                angleType: node.angleType,
                azimuth: (node.angleType === 'deg') ? 180 + 180 / Math.PI * moonPos.azimuth : moonPos.azimuth,
                altitude: (node.angleType === 'deg') ? 180 / Math.PI * moonPos.altitude : moonPos.altitude, //elevation = altitude
                distance: moonPos.distance,
                parallacticAngle: (node.angleType === 'deg') ? 180 / Math.PI * moonPos.parallacticAngle : moonPos.parallacticAngle,
                illumination: {
                    angle: (node.angleType === 'deg') ? 180 / Math.PI * moonIllum.angle : moonIllum.angle,
                    fraction: moonIllum.fraction,
                    phase: {},
                    zenithAngle: (node.angleType === 'deg') ? 180 / Math.PI * (moonIllum.angle - moonPos.parallacticAngle) : moonIllum.angle - moonPos.parallacticAngle,
                },
            }
            sunTimesCheck(node);
            result.times = node.moonTimesToday;
            //getAngle : angle / 57.2957795130823209 //angle(rad) * (180° / Pi) = angle(deg)

            if (moonIllum.phase < 0.01) {
                // 0            New Moon            -   Neumond(Phasenwinkel = 0°)
                result.illumination.phase = moonPhases[0];
            } else if (moonIllum.phase < 0.25) {
                // 0 - 0.25     Waxing Crescent     -   erstes Viertel bzw.zunehmende Sichel(0° < Phasenwinkel < 90°),
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
                // Waning Crescent                  -   letztes Viertel bzw.abnehmende Sichel(Phasenwinkel > 270°).
                result.illumination.phase = moonPhases[7];
            }
            result.illumination.phase.value = moonIllum.phase;
            result.illumination.phase.angle = (node.angleType === 'rad') ? (moonIllum.phase * 360) / (180 / Math.PI) : moonIllum.phase * 360;

            if (!result.times.alwaysUp) {
                //true if the moon never rises/sets and is always above the horizon during the day
                result.times.alwaysUp = false;
            }
            if (!result.times.alwaysDown) {
                //true if the moon is always below the horizon
                result.times.alwaysDown = false;
            }
            this.lastMoonCalc = result;

            return result;
        }
        /**************************************************************************************************************/
        //sendDebug({id:node.id, name:node.name, topic:msg.topic, msg:msg, _path:msg._path});
        //{id:node.id, z:node.z, name:node.name, topic:msg.topic, property:property, msg:output, _path:msg._path}
        /*
        function sendDebug(msg) {
            // don't put blank errors in sidebar (but do add to logs)
            //if ((msg.msg === "") && (msg.hasOwnProperty("level")) && (msg.level === 20)) { return; }
            msg = RED.util.encodeObject(msg, {
                maxLength: debuglength
            });
            RED.comms.publish("debug", msg);
        } /* */
        /**************************************************************************************************************/
        function sunTimesRefresh(node, today, tomorrow, dayId) {
            node.debug('sunTimesRefresh - calculate sun times');
            node.sunTimesToday = sunCalc.getTimes(today, node.latitude, node.longitude);
            node.sunTimesTomorow = sunCalc.getTimes(tomorrow, node.latitude, node.longitude);
            node.sunDayId = dayId;
        }

        function sunTimesCheck(node, today, dayId) {
            //node.debug('sunTimesCheck');
            let dateb = today || new Date();
            let day_id = dayId || getUTCDayId(dateb);
            if (node.sunDayId != day_id) {
                let tomorrow = (new Date()).addDays(1);
                sunTimesRefresh(node, dateb, tomorrow, day_id);
            }
            return {
                date: dateb,
                dayId: day_id
            }
        }

        function moonTimesRefresh(node, today, tomorrow, dayId) {
            node.debug('moonTimesRefresh - calculate moon times');
            node.moonTimesToday = sunCalc.getMoonTimes(today, node.latitude, node.longitude, true);
            if (!node.moonTimesToday.alwaysUp) {
                //true if the moon never rises/sets and is always above the horizon during the day
                node.moonTimesToday.alwaysUp = false;
            }
            if (!node.moonTimesToday.alwaysDown) {
                //true if the moon is always below the horizon
                node.moonTimesToday.alwaysDown = false;
            }
            node.moonTimesTomorow = sunCalc.getMoonTimes(tomorrow, node.latitude, node.longitude, true);
            if (!node.moonTimesTomorow.alwaysUp) {
                //true if the moon never rises/sets and is always above the horizon during the day
                node.moonTimesTomorow.alwaysUp = false;
            }
            if (!node.moonTimesTomorow.alwaysDown) {
                //true if the moon is always below the horizon
                node.moonTimesTomorow.alwaysDown = false;
            }
            node.moonDayId = dayId;
        }

        function moonTimesCheck(node, today, dayId) {
            //node.debug('moonTimesCheck');
            let dateb = today || new Date();
            let day_id = dayId || getUTCDayId(dateb);
            if (node.moonDayId != day_id) {
                let tomorrow = (new Date()).addDays(1);
                moonTimesRefresh(node, dateb, tomorrow, day_id);
            }
            return {
                date: dateb,
                dayId: day_id
            }
        }

        function initTimes(node) {
            node.debug('initTimes');
            let today = new Date();
            let dayId = getUTCDayId(today);
            let tomorrow = today.addDays(1);
            sunTimesRefresh(node, today, tomorrow, dayId);
            moonTimesRefresh(node, today, tomorrow, dayId);
        }

        function getUTCDayId(d) {
            return d.getUTCDay() + (d.getUTCMonth() * 31) + (d.getUTCFullYear() * 372);
        }
        /**************************************************************************************************************/
    }
    RED.nodes.registerType("position-config", positionConfigurationNode);
}