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
    }
    return date;
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

        this.on('input', msg => {
            try {
                const now = new Date();

                let alternateTimes = false;
                if (this.propertyType === 'msg' && (this.property != '')) {
                    alternateTimes = (RED.util.getMessageProperty(outMsg, this.property, true) == true);
                } else if (this.propertyType === 'flow' || this.propertyType === 'global' && (this.property != '')) {
                    var contextKey = RED.util.parseContextStore(this.property);
                    alternateTimes = (this.context()[this.propertyType].get(contextKey.key, contextKey.store) == true);
                }

                let start;
                let end;
                if (config.startTime2 && alternateTimes) {
                    if (config.startTime2Type == 'entered') {
                        start = getTimeOfText(config.startTime2, config.startOffset2);
                    } else {
                        start = getSunTime(node.positionConfig, now, config.startTime2Type, config.startOffset2)
                    }
                } else {
                    if (config.startTime1Type == 'entered') {
                        start = getTimeOfText(config.startTime1, config.startOffset1);
                    } else {
                        start = getSunTime(node.positionConfig, now, config.startTime1Type, config.startOffset1)
                    }
                }
                if (config.endTime2 && alternateTimes) {
                    if (config.endTime2Type == 'entered') {
                        end = getTimeOfText(config.endTime2, config.startOffset2);
                    } else {
                        end = getSunTime(node.positionConfig, now, config.endTime2Type, config.endOffset2)
                    }
                } else {
                    if (config.endTime1Type == 'entered') {
                        end = getTimeOfText(config.endTime1, config.startOffset1);
                    } else {
                        end = getSunTime(node.positionConfig, now, config.endTime1Type, config.endOffset1)
                    }
                }

                node.warn(start + ' - ' + now + ' - ' + end);
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