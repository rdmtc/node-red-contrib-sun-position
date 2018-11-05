/********************************************
 * within-time-switch:
 *********************************************/
const path = require('path');
var hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));
//const hlp = '/lib/sunPosHelper.js';

const getMoment = (time) => {}

const getTimeOfText = (t, offset) => {
    let d = new Date();
    d = d.getMinutes() + d.getHours() * 60;
    if (t) {
        let matches = t.match(/(\d+)(?::(\d\d))?\s*(p?)/);
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
    let chachedSunCalc = this.context().global.get(config.cachProp + 'sun');
    let needRefresh = (!chachedSunCalc || !chachedSunCalc.times);
    if (!needRefresh) {
        let oldd = new Date(chachedSunCalc.lastUpdate);
        needRefresh = (oldd.getDay != d.getDay);
    }

    if (needRefresh) {
        chachedSunCalc = hlp.getSunCalc(d, config.latitude, config.longitude, config.angleType);
        this.context().global.set(config.cachProp + 'sun', chachedSunCalc);
    }

    const date = new Date(chachedSunCalc.times[t]);
    if (offset && !isNaN(offset) && offset !== 0) {
        return new Date(date.getTime() + offset * 60000);
    }
    return date;
}

const getMoonTime = (config, d, t, offset) => {
    if (!config) {
        return d;
    }
    let chachedMoonCalc = this.context().global.get(config.cachProp + 'moon');
    let needRefresh = (!chachedMoonCalc || !chachedMoonCalc.times);
    if (!needRefresh) {
        let oldd = new Date(chachedMoonCalc.lastUpdate);
        needRefresh = (oldd.getDay != d.getDay);
    }

    if (needRefresh) {
        chachedMoonCalc = hlp.getMoonCalc(d, config.latitude, config.longitude, config.angleType);
        this.context().global.set(config.cachProp + 'moon', chachedMoonCalc);
    }

    const date = new Date(chachedMoonCalc.times[t]);
    if (offset && !isNaN(offset) && offset !== 0) {
        return new Date(date.getTime() + offset * 60000);
    }
    return date;
}

const getTime = (node, now, vType, value, offset) => {
    if (vType === 'entered' || vType === '') {
        return getTimeOfText(value, offset);
    } else if (vType === 'pdsTime') {
        //sun
        return getSunTime(node.positionConfig, now, value, offset)
    } else if (vType === 'pdmTime') {
        //moon
        return getMoonTime(node.positionConfig, now, value, offset)
    } else if (vType === 'msg') {
        return getTimeOfText(RED.util.getMessageProperty(msg, value, true), offset);
    } else if (vType === 'flow' || vType === 'global') {
        var contextKey = RED.util.parseContextStore(value);
        return getTimeOfText(node.context()[vType].get(contextKey.key, contextKey.store), offset);
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
        this.useAsyncRules = (
            this.propertyType === 'flow' ||
            this.propertyType === 'global'
        );
        this.startTimeAlt = config.startTimeAlt;
        this.startTimeAltType = config.startTimeAltType || "entered";
        this.endTimeAlt = config.endTimeAlt;
        this.endTimeAltType = config.endTimeAltType || "entered";

        this.on('input', msg => {
            try {
                const now = new Date();
                let start;
                let end;
                let alternateTimes = config.addTimes;
                if (alternateTimes) {
                    if (this.propertyType === 'msg') {
                        alternateTimes = (RED.util.getMessageProperty(msg, this.property, true) == true);
                    } else if (this.propertyType === 'flow' || this.propertyType === 'global') {
                        var contextKey = RED.util.parseContextStore(this.property);
                        alternateTimes = (this.context()[this.propertyType].get(contextKey.key, contextKey.store) == true);
                    }
                }

                if (alternateTimes && this.startTimeAlt) {
                    start = getTime(this, now, this.startTimeAltType, this.startTimeAlt, config.startOffsetAlt);
                } else {
                    start = getTime(this, now, this.startTimeType, this.startTime, config.startOffset);
                }
                if (alternateTimes && config.endTimeAlt) {
                    end = getTime(this, now, this.endTimeAltType, this.endTimeAlt, config.endOffsetAlt);
                } else {
                    end = getTime(this, now, this.endTimeType, this.endTime, config.startOffset);
                }

                this.warn(start + ' - ' + now + ' - ' + end);
                if (start < end) {
                    if (now >= start && now <= end) {
                        this.send(msg, null);
                        return;
                    }
                } else {
                    if (!(now > end && now < start)) {
                        this.send(msg, null);
                        return;
                    }
                }
                this.send(null, msg);
            } catch (err) {
                errorHandler(this, err, 'Exception occured on get german holidays', 'internal error');
            }
        });

        this.now = function () {
            return moment();
        };
    }
    RED.nodes.registerType('within-time-switch', withinTimeSwitchNode);
};