/********************************************
 * position-config:
 *********************************************/
"use strict";

const sunCalc = require('suncalc');
const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));

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
    date.setDate(date.getDate() + days);
    return date;
}

function nextday(days, daystart) {
    let dayx = 0;
    let daypos = daystart;
    while (days.indexOf(daypos) === -1) {
        dayx += 1;
        if ((daystart + dayx) > 6) {
            daypos =dayx - (7-daystart);
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
            this.lastSunCalc = { ts : 0};
            this.lastMoonCalc = { ts : 0};

            var node = this;

            this.getSunTimes = () => {
                //node.debug('getSunTimes');
                let res = sunTimesCheck(node);
                res.today = node.sunTimesToday;
                res.tomorrow = node.sunTimesTomorow;
                return res;
            }
            this.getSunTime = (now, value, next, days) => {
                //node.debug('getSunTime ' + value + ' - ' + next + ' - ' + days);
                let result = sunTimesCheck(node, now);
                result.value = new Date(node.sunTimesToday[value]);
                if (next && !isNaN(next) && result.value.getTime() <= (now.getTime())) {
                    if (next === 1) {
                        result.value = new Date(node.sunTimesTomorow[value]);
                    } else if (next > 1) {
                        let date = (new Date()).addDays(next);
                        let times = sunCalc.getTimes(date, node.latitude, node.longitude);
                        result.value = times[value];
                    }
                }
                if (days && (days !== '*') && (days !== '')) {
                    let dayx = nextday(days, result.value.getDay());
                    //node.debug('move day ' + dayx);
                    if (dayx > 0) {
                        let date = result.value.addDays(dayx);
                        let times = sunCalc.getTimes(date, node.latitude, node.longitude);
                        result.value = new Date(times[value]);
                    } else if (dayx < 0) {
                        node.debug('getSunTime value=' + value + ' - next=' + next + ' - days=' + days + ' result=' + result.value);
                        result.error = 'No valid day of week found!';
                    }
                }
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
                if (next && !isNaN(next) && result.value.getTime() <= (now.getTime())) {
                    if (next === 1) {
                        result.value = new Date(node.moonTimesTomorow[value]);
                    } else if (next > 1) {
                        let date = (new Date()).addDays(next);
                        let times = sunCalc.getMoonTimes(date, node.latitude, node.longitude, true);
                        result.value = times[value];
                    }
                }
                if (days && (days !== '*') && (days !== '')) {
                    let dayx = nextday(days, result.value.getDay());
                    if (dayx === 1) {
                        result.value = new Date(node.moonTimesTomorow[value]);
                    } else if (dayx > 1) {
                        let date = (new Date()).addDays(dayx);
                        let times = sunCalc.getMoonTimes(date, node.latitude, node.longitude, true);
                        result.value = new Date(times[value]);
                    } else if (dayx < 0) {
                        result.error = 'no valid week day found!';
                        node.debug('getMoonTime value=' + value + ' - next=' + next + ' - days=' + days + ' result=' + result.value);
                    }
                }
                return result;
            }
            this.getTimeProp = (srcNode, msg, vType, value, offset, next, days) => {
                //node.debug(node.debug(JSON.stringify(srcNode, Object.getOwnPropertyNames(srcNode))));
                node.debug('getTimeProp ' + hlp.getNodeId(srcNode) + ' vType=' + vType + ' value=' + value + ' offset=' + offset + ' next=' + next + ' days=' + days);
                let now = new Date();
                let result = {
                    value: null,
                    error: null
                };
                if (vType === '' || vType === 'none' || days === '') {
                    //nix
                } else if (vType === 'date') {
                    result.value = now;
                } else if (vType === 'entered') {
                    result.value = hlp.getTimeOfText(String(value), offset, next, days);
                } else if (vType === 'pdsTime') {
                    //sun
                    result = node.getSunTime(now, value, next, days);
                } else if (vType === 'pdmTime') {
                    //moon
                    result = node.getMoonTime(now, value, next, days);
                } else if (vType === 'json') {
                    result.value = new Date(JSON.parse(value));
                } else {
                    try {
                        //evaluateNodeProperty(value, type, node, msg, callback)
                        let res = RED.util.evaluateNodeProperty(value, vType, srcNode, msg);
                        if (res) {
                            if (res.match(/^(0[0-9]|[0-9]|1[0-9]|2[0-3])(?::([0-5][0-9]|[0-9]))?(?::([0-5][0-9]|[0-9]))?\s*(pm?)?$/)) {
                                result.value = hlp.getTimeOfText("" + res, offset, next, days);
                            } else {
                                let dto = new Date(res);
                                if (dto !== "Invalid Date" && !isNaN(dto)) {
                                    result.value = hlp.calcTimeValue(dto, offset, next, days);
                                } else {
                                    result.error = "could not evaluate " + vType + '.' + value + ' = ' + res;
                                }
                            }
                        } else {
                            result.error = "could not evaluate " + vType + '.' + value;
                        }
                    } catch (err) {
                        result.error = "could not evaluate " + vType + '=' + value + ': ' + err.message;
                        node.debug(JSON.stringify(err, Object.getOwnPropertyNames(err)));
                    }
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
                node.debug('date ' + date);
                let dto = new Date(date);
                if (dto !== "Invalid Date" && !isNaN(dto)) {
                    node.debug('date ' + dto);
                    date = dto;
                }
            }
            if ((typeof date === 'undefined') || !(date instanceof Date)) {
                node.debug('no date' + date);
                date = new Date();
                if (Math.abs(date.getTime() - this.lastSunCalc.ts) < 4000) {
                    return this.lastSunCalc;
                }
            }

            var sunPos = sunCalc.getPosition(date, node.latitude, node.longitude);
            let result = {
                ts : date.getTime(),
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
                ts : date.getTime(),
                lastUpdate: date,
                latitude: node.latitude,
                longitude: node.longitude,
                angleType: node.angleType,
                azimuth: (node.angleType === 'deg') ? 180 + 180 / Math.PI * moonPos.azimuth : moonPos.azimuth,
                altitude: (node.angleType === 'deg') ? 180 / Math.PI * moonPos.altitude : moonPos.altitude, //elevation = altitude
                distance: moonPos.distance,
                parallacticAngle: (node.angleType === 'deg') ? 180 / Math.PI * moonPos.parallacticAngle : moonPos.parallacticAngle,
                illumination: {
                    angle: (node.angleType === 'deg') ? 180 / Math.PI * moonPos.angle : moonIllum.angle,
                    fraction: moonIllum.fraction,
                    phase: moonIllum.phase,
                    phaseAngle: (node.angleType === 'rad') ? (moonIllum.phase * 360) / (180 / Math.PI) : moonIllum.phase * 360,
                    zenithAngle: (node.angleType === 'deg') ? 180 / Math.PI * (moonIllum.angle - moonPos.parallacticAngle) : moonIllum.angle - moonPos.parallacticAngle,
                },
            }
            sunTimesCheck(node);
            result.times = node.moonTimesToday;
            //getAngle : angle / 57.2957795130823209 //angle(rad) * (180° / Pi) = angle(deg)
        
            if (moonIllum.phase < 0.01) {
                // 0            New Moon            -   Neumond(Phasenwinkel = 0°)
                result.illumination.phaseEmoji = moonPhases[0];
            } else if (moonIllum.phase < 0.25) {
                // 0 - 0.25     Waxing Crescent     -   erstes Viertel bzw.zunehmende Sichel(0° < Phasenwinkel < 90°),
                result.illumination.phaseEmoji = moonPhases[1];
            } else if (moonIllum.phase < 0.26) {
                // 0.25	        First Quarter       -   zunehmender Halbmond(astronomisch: erstes Viertel, Phasenwinkel = 90°),
                result.illumination.phaseEmoji = moonPhases[2];
            } else if (moonIllum.phase < 0.50) {
                // 0.25 - 0.5   Waxing Gibbous      -   zweites Viertel(90° < Phasenwinkel < 180°),
                result.illumination.phaseEmoji = moonPhases[3];
            } else if (moonIllum.phase < 0.51) {
                // 0.5	        Full Moon           -   Vollmond(Phasenwinkel = 180°),
                result.illumination.phaseEmoji = moonPhases[4];
            } else if (moonIllum.phase <= 0.75) {
                // 0.5 - 0.75    Waning Gibbous     -   drittes Viertel (180° < Phasenwinkel < 270°),
                result.illumination.phaseEmoji = moonPhases[5];
            } else if (moonIllum.phase < 0.76) {
                // 0.75	        Last Quarter        -   abnehmender Halbmond(astronomisch: letztes Viertel, Phasenwinkel = 270°),
                result.illumination.phaseEmoji = moonPhases[6];
            } else {
                // Waning Crescent                  -   letztes Viertel bzw.abnehmende Sichel(Phasenwinkel > 270°).
                result.illumination.phaseEmoji = moonPhases[7];
            }
        
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
        function sunTimesRefresh(node, today, tomorrow, dayId) {
            node.debug('sunTimesRefresh');
            node.sunTimesToday = sunCalc.getTimes(today, node.latitude, node.longitude);
            node.sunTimesTomorow = sunCalc.getTimes(tomorrow, node.latitude, node.longitude);
            node.sunDayId = dayId;
            /*
                {"solarNoon":"2018-11-01T10:49:56.550Z",
                "nadir":"2018-10-31T22:49:56.550Z",
                "sunrise":"2018-11-01T05:58:13.904Z",
                "sunset":"2018-11-01T15:41:39.196Z",
                "sunriseEnd":"2018-11-01T06:01:54.246Z",
                "sunsetStart":"2018-11-01T15:37:58.854Z",
                "dawn":"2018-11-01T05:23:28.111Z",
                "dusk":"2018-11-01T16:16:24.989Z",
                "nauticalDawn":"2018-11-01T04:44:25.813Z",
                "nauticalDusk":"2018-11-01T16:55:27.288Z",
                "nightEnd":"2018-11-01T04:06:06.184Z",
                "night":"2018-11-01T17:33:46.916Z",
                "goldenHourEnd":"2018-11-01T06:47:04.923Z",
                "goldenHour":"2018-11-01T14:52:48.178Z"}
            */
        }

        function sunTimesCheck(node, today, dayId) {
            node.debug('sunTimesCheck');
            let dateb = today || new Date();
            let day_id = dayId || getDayId(dateb);
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
            node.debug('moonTimesRefresh');
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
            node.debug('moonTimesCheck');
            let dateb = today || new Date();
            let day_id = dayId || getDayId(dateb);
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
            let dayId = getDayId(today);
            let tomorrow = today.addDays(1);
            sunTimesRefresh(node, today, tomorrow, dayId);
            moonTimesRefresh(node, today, tomorrow, dayId);
        }

        function getDayId(d) {
            return d.getDay() + (d.getMonth() * 31) + (d.getFullYear() * 372);
        }
        /**************************************************************************************************************/
    }
    RED.nodes.registerType("position-config", positionConfigurationNode);
}