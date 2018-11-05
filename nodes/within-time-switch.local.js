/********************************************
 * within-time-switch:
 *********************************************/
const path = require('path');
var hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));
//const hlp = '/lib/sunPosHelper.js';

<<<<<<< HEAD
const getMoment = (time) => {}

const getTimeOfText = (t, offset) => {
    let d = new Date();
    d = d.getMinutes() + d.getHours() * 60;
    if (t) {
        let matches = t.match(/(\d+)(?::(\d\d))?\s*(pm?)/);
        d.setHours(parseInt(matches[1]) + (matches[3] ? 12 : 0));
        d.setMinutes(parseInt(matches[2]) || 0);
        if (offset && !isNaN(offset) && offset !== 0) {
            d = new Date(d.getTime() + offset * 60000);
        }
    }
    return d;
}
const getSunTime = (config, d, t, offset) => {
    if (!config) {
        return d;
    }
    let type = 'sun';
    if (t === 'moonRise') {
        type = 'moon';
        t = 'rise';
    } else if (t === 'moonSet') {
        type = 'moon';
        t = 'set';
    }
    let chachedSunCalc = this.context().global.get(config.cachProp + type);
    let needRefresh = (!chachedSunCalc || !chachedSunCalc.times);
    if (!needRefresh) {
        let oldd = new Date(chachedSunCalc.lastUpdate);
        needRefresh = (oldd.getDay != d.getDay);
    }

    if (needRefresh) {
        chachedSunCalc = hlp.getSunCalc(d, config.latitude, config.longitude, config.angleType);
        this.context().global.set(config.cachProp + type, chachedSunCalc);
    }

    const date = new Date(chachedSunCalc.times[t]);
    if (offset && !isNaN(offset) && offset !== 0) {
        return new Date(date.getTime() + offset * 60000);
=======
const getTime = (node, now, vType, value, offset) => {
    node.debug('vType=' + vType + ' value=' + value + ' offset=' + offset);
    if (vType === 'entered' || vType === '') {
        return hlp.getTimeOfText(value, offset) || now;
    } else if (vType === 'pdsTime') {
        //sun
        return hlp.getSunTime(node.positionConfig, now, value, offset)
    } else if (vType === 'pdmTime') {
        //moon
        return hlp.getMoonTime(node.positionConfig, now, value, offset)
    } else if (vType === 'msg') {
        return hlp.getTimeOfText(RED.util.getMessageProperty(msg, value, true), offset) || now;
    } else if (vType === 'flow' || vType === 'global') {
        var contextKey = RED.util.parseContextStore(value);
        return hlp.getTimeOfText(node.context()[vType].get(contextKey.key, contextKey.store), offset) || now;
>>>>>>> 9d18d7a98a4cb7f1bf536baaad7a00794f5c0e7e
    }
    node.error("Not suported time definition! " + vType + '=' + value);
    node.status({
        fill: "red",
        shape: "dot",
        text: "error - time definition"
    });
    return now;
}

module.exports = function (RED) {
    "use strict";

    function withinTimeSwitchNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);

        this.property = config.property;
        this.propertyType = config.propertyType || "global";
        var node = this;

        this.on('input', msg => {
            try {
                this.debug('starting ' + JSON.stringify(msg, Object.getOwnPropertyNames(msg)));
                this.debug('self ' + JSON.stringify(this, Object.getOwnPropertyNames(this)));
                this.debug('config ' + JSON.stringify(config, Object.getOwnPropertyNames(config)));

                let now = new Date();
                if ((typeof msg.ts === 'string') || (msg.ts instanceof Date)) {
                    let dto = new Date(msg.ts);
                    if (dto !== "Invalid Date" && !isNaN(dto)) {
                        now = dto;
                    }
                }
                let start;
                let end;
                let alternateTimes = config.addTimes;
                if (alternateTimes) {
                    this.debug('alternate times enabled');
                    if (this.propertyType === 'msg') {
                        alternateTimes = (RED.util.getMessageProperty(msg, this.property, true) == true);
                    } else if (this.propertyType === 'flow' || this.propertyType === 'global') {
                        var contextKey = RED.util.parseContextStore(this.property);
                        alternateTimes = (this.context()[this.propertyType].get(contextKey.key, contextKey.store) == true);
                    }
                }

                if (alternateTimes && config.startTimeAlt) {
                    this.debug('using alternate start time');
                    start = getTime(this, now, config.startTimeAltType, config.startTimeAlt, config.startOffsetAlt);
                } else {
                    start = getTime(this, now, config.startTimeType, config.startTime, config.startOffset);
                }
                if (alternateTimes && config.endTimeAlt) {
                    this.debug('using alternate end time');
                    end = getTime(this, now, config.endTimeAltType, config.endTimeAlt, config.endOffsetAlt);
                } else {
                    end = getTime(this, now, config.endTimeType, config.endTime, config.startOffset);
                }

                this.debug(start + ' - ' + now + ' - ' + end);

                start = start.getMinutes() + start.getHours() * 60;
                end = end.getMinutes() + end.getHours() * 60;
                let cmpNow = now.getMinutes() + now.getHours() * 60;

                this.debug(start + ' - ' + now + ' - ' + end);
                if (start < end) {
                    if (cmpNow >= start && cmpNow <= end) {
                        this.send([msg, null]);
                        this.status({
                            fill: "green",
                            shape: "dot",
                            text: now.getHours() + ':' + now.getMinutes()
                        });
                        return;
                    }
                } else {
                    if (!(cmpNow > end && cmpNow < start)) {
                        this.send([msg, null]);
                        this.status({
                            fill: "green",
                            shape: "ring",
                            text: now.getHours() + ':' + now.getMinutes()
                        });
                        return;
                    }
                }
                this.status({
                    fill: "yellow",
                    shape: "dot",
                    text: now.getHours() + ':' + now.getMinutes()
                });
                this.send([null, msg]);
            } catch (err) {
                hlp.errorHandler(this, err, 'Exception occured on withinTimeSwitch', 'internal error');
            }
        });

        this.now = function () {
            return moment();
        };
    }
    RED.nodes.registerType('within-time-switch', withinTimeSwitchNode);
};