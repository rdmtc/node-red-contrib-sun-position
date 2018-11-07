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
            this.debug('load position-config ' + n.name);
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
            var node = this;

            this.getSunTimes = () => {
                node.debug('getSunTimes');
                let res = sunTimesCheck(node);
                res.today = node.sunTimesToday;
                res.tomorrow = node.sunTimesTomorow;
                return res;
            }
            this.getSunTime = (now, value, next, days) => {
                node.debug('getSunTime ' + value + ' - ' + next + ' - ' + days);
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
                    node.debug('move day ' + dayx);
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
                node.debug('getMoonTimes');
                let res = moonTimesCheck(node);
                res.today = node.moonTimesToday;
                res.tomorrow = node.moonTimesTomorow;
                return res;
            }
            this.getMoonTime = (now, value, next, days) => {
                node.debug('getMoonTime ' + value + ' - ' + next + ' - ' + days);
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
                node.debug('getTimeProp ' + srcNode.name + ' vType=' + vType + ' value=' + value + ' offset=' + offset);
                let now = new Date();
                let result = {
                    value: null,
                    error: null
                };
                if (vType === '' || vType === 'none' || days === '') {
                    //nix
                } else if (vType === 'date') {
                    result.value = now;
                } else if (vType === 'entered' ||
                    vType === "string" ||
                    vType === "str" ||
                    vType === "num") {
                    result.value = hlp.getTimeOfText(String(value), offset, next, days);
                } else if (vType === 'pdsTime') {
                    //sun
                    result = node.getSunTime(now, value, next, days);
                } else if (vType === 'pdmTime') {
                    //moon
                    result = node.getMoonTime(now, value, next, days);
                } else if (vType === 'jsonata') {
                    try {
                        result.value = hlp.getTimeOfText(RED.util.evaluateJSONataExpression(value, msg), offset, next, days);
                    } catch (err) {
                        result.error = "Invalid JSONata expression: " + value;
                    }
                } else if (vType === 'msg' && msg) {
                    let value = RED.util.getMessageProperty(msg, value, true);
                    result.value = hlp.getTimeOfText(value, offset, next, days);
                } else if (vType === 'flow' || vType === 'global') {
                    var contextKey = RED.util.parseContextStore(value);
                    if (!contextKey) {
                        result.error = "Context key " + vType + '.' + value + " not found!";
                    } else {
                        let ctx = node.context()[vType];
                        if (ctx) {
                            let value = ctx.get(contextKey.key, contextKey.store);
                            result.value = hlp.getTimeOfText(value, offset, next, days);
                        } else {
                            result.error = "Context " + vType + '.' + value + " not found!";
                        }
                    }
                } else {
                    result.error = "Not suported time definition! " + vType + '=' + value;
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
        function sunTimesRefresh(node, today, tomorrow, dayId) {
            node.debug('sunTimesRefresh');
            node.sunTimesToday = sunCalc.getTimes(today, node.latitude, node.longitude);
            node.sunTimesTomorow = sunCalc.getTimes(tomorrow, node.latitude, node.longitude);
            node.sunDayId = dayId;
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