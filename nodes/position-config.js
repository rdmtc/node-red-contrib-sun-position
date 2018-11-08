/********************************************
 * position-config:
 *********************************************/
"use strict";

const sunCalc = require('suncalc');
const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
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
            this.azimuthWestLow = n.azimuthWestLow;
            this.azimuthWestHigh = n.azimuthWestHigh;
            this.azimuthSouthLow = n.azimuthSouthLow;
            this.azimuthSouthHigh = n.azimuthSouthHigh;
            this.azimuthEastLow = n.azimuthEastLow;
            this.azimuthEastHigh = n.azimuthEastHigh;
            this.azimuthNorthLow = n.azimuthNorthLow;
            this.azimuthNorthHigh = n.azimuthNorthHigh;
            this.cachProp = (n.name) ? n.name + '-' : 'position-';
            let data = this.context().global.get(node.cachProp);
            if (data) {

            } else {
                this.oldsunpos = null;
                this.oldmoonpos = null;
            }
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
                    let daystart = result.value.getDay();
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
                    //node.debug('move day ' + dayx);
                    if (dayx > 0) {
                        let date = result.value.addDays(dayx);
                        let times = sunCalc.getTimes(date, node.latitude, node.longitude);
                        result.value = times[value];
                    } else if (dayx < 0) {
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
                    let daystart = now.getDay();
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
                    if (dayx === 1) {
                        result.value = new Date(node.moonTimesTomorow[value]);
                    } else if (dayx > 1) {
                        let date = (new Date()).addDays(dayx);
                        let times = sunCalc.getMoonTimes(date, node.latitude, node.longitude, true);
                        result.value = times[value];
                    } else if (dayx < 0) {
                        result.error = 'no valid week day found!';
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
        this.getSunCalc = (srcNode, msg) => {
            let date = new Date();

            var sunPos = sunCalc.getPosition(date, node.latitude, node.longitude);
            let result = {
                lastUpdate: date,
                latitude: node.latitude,
                longitude: node.longitude,
                angleType: node.angleType,
                azimuth: (node.angleType === 'deg') ? 180 + 180 / Math.PI * sunPos.azimuth : sunPos.azimuth,
                altitude: (node.angleType === 'deg') ? 180 / Math.PI * sunPos.altitude : sunPos.altitude, //elevation = altitude
            }
            sunTimesCheck(node);
            result.times = node.sunTimesToday;
            if (!node.oldsunpos) {
                node.oldsunpos = this.context().global.get(node.cachProp);
            }
            //this.oldsunpos = null;
            //this.oldmoonpos = null;

            let oldvalue = this.context().global.get(node.cachProp);
            if (!oldvalue) {
                oldvalue = {
                    sunpos: {},
                    moonpos: {},
                }
            }
            if (hlp.compareAzimuth(result, 'west', outMsg.payload.azimuth, outMsg.data.azimuthWestLow, outMsg.data.azimuthWestHigh, node.oldsunpos) ||
                hlp.compareAzimuth(result, 'south', outMsg.payload.azimuth, outMsg.data.azimuthSouthLow, outMsg.data.azimuthSouthHigh, node.oldsunpos) ||
                hlp.compareAzimuth(result, 'east', outMsg.payload.azimuth, outMsg.data.azimuthEastLow, outMsg.data.azimuthEastHigh, node.oldsunpos) ||
                hlp.compareAzimuth(result, 'north', outMsg.payload.azimuth, outMsg.data.azimuthNorthLow, outMsg.data.azimuthNorthHigh, oldvanode.oldsunposlue)) {
                outMsg.payload.exposureChanged = true;
                this.context().global.set('sunpos', outMsg.payload);
            }
            node.oldsunpos = result;
            //this.context().global.set(node.cachProp, node.oldsunpos);

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