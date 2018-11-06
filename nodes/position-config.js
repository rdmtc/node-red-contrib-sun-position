/********************************************
 * position-config:
 *********************************************/
"use strict";

const sunCalc = require('suncalc');
const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));

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
                let res = sunTimesCheck(node);
                res.today = node.sunTimesToday;
                res.tomorrow = node.sunTimesTomorow;
                return res;
            }
            this.getSunTime = (now, value) => {
                sunTimesCheck(node, now);
                return new Date(node.sunTimesToday[value]);
            }
            this.getMoonTimes = () => {
                let res = moonTimesCheck(node);
                res.today = node.moonTimesToday;
                res.tomorrow = node.moonTimesTomorow;
                return res;
            }
            this.getMoonTimes = () => {
                let res = moonTimesCheck(node);
                res.today = node.moonTimesToday;
                res.tomorrow = node.moonTimesTomorow;
                return res;
            }
            this.getMoonTime = (now, value) => {
                moonTimesCheck(node, now);
                return new Date(node.moonTimesToday[value]);
            }
            initTimes(this);
        } catch (err) {
            hlp.errorHandler(this, err, 'Exception occured on position-config', 'internal error');
        }
        /**************************************************************************************************************/
        function sunTimesRefresh(node, today, tomorrow, dayId) {
            node.debug('sunTimesRefresh');
            node.sunTimesToday = sunCalc.getTimes(today, node.latitude, node.longitude);
            node.sunTimesToday
            node.sunTimesTomorow = sunCalc.getTimes(tomorrow, node.latitude, node.longitude);
            node.sunDayId = dayId;
        }

        function sunTimesCheck(node, today, dayId) {
            node.debug('sunTimesCheck');
            let dateb = today || new Date();
            let day_id = dayId || getDayId(dateb);
            if (node.sunDayId != day_id) {
                let tomorrow = new Date();
                tomorrow.setDate(dateb.getDate() + 1);
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
                let tomorrow = new Date();
                tomorrow.setDate(dateb.getDate() + 1);
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
            let tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);
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