/********************************************
 * time-inject:
 *********************************************/
"use strict";
const util = require('util');

const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));
//const cron = require("cron");

module.exports = function(RED) {
    "use strict";

    function getforamtDateCmp(date) {
        function pad2(n) { // always returns a string
            return (n < 10 ? '0' : '') + n;
        }

        return Number(date.getFullYear() +
            pad2(date.getMonth() + 1) +
            pad2(date.getDate()) +
            pad2(date.getHours()) +
            pad2(date.getMinutes()) +
            pad2(date.getSeconds()));
    }

    function getforamtDateCmp2(date) {
        function pad2(n) { // always returns a string
            return (n < 10 ? '0' : '') + n;
        }

        return Number(date.getFullYear() +
            pad2(date.getMonth() + 1) +
            pad2(date.getDate()) + '.' +
            pad2(date.getHours()) +
            pad2(date.getMinutes()) +
            pad2(date.getSeconds()));
    }

    function tsGetScheduleTime(time, limit) {
        var now = new Date();
        var millis = time.getTime() - now.getTime();
        if (limit) {
            while (millis < limit) {
                millis += 86400000; //24h
            }
        }
        return millis;
    }

    function tsGetPropData(node, msg, type, value, format, offset, days) {
        if (type == null || type === "none" || type === "" || (typeof type === 'undefined')) {
            if (value === "" || (typeof value === 'undefined')) {
                return Date.now();
            } else {
                return value;
            }
        } else if (type === "pdsCalcData") {
            return node.positionConfig.getSunCalc(msg.ts);
        } else if (type === "pdmCalcData") {
            return node.positionConfig.getMoonCalc(msg.ts);
        } else if (type === "entered" || type === "pdsTime" || type === "pdmTime" || type === "date") {
            let data = node.positionConfig.getTimeProp(node, msg, type, value, offset, 1, days);
            if (!data.error) {
                format = format || 0;
                switch (Number(format)) {
                    case 0: //timeformat_UNIX - milliseconds since Jan 1, 1970 00:00
                        return data.value.getTime();
                    case 1: //timeformat_ECMA262 - date as string ECMA-262
                        return data.value;
                    case 2: //timeformat_local
                        return data.value.toLocaleString();
                    case 3: //timeformat_localTime
                        return data.value.toLocaleTimeString();
                    case 4: //timeformat_UTC
                        return data.value.toUTCString();
                    case 5: //timeformat_ISO
                        return data.value.toISOString();
                    case 6: //timeformat_ms
                        return tsGetScheduleTime(data.value, (type === "date") ? 10 : undefined);
                    case 7: //timeformat_sec
                        return Math.round(tsGetScheduleTime(data.value, (type === "date") ? 10 : undefined) / 1000);
                    case 8: //timeformat_min
                        return (Math.round(tsGetScheduleTime(data.value, (type === "date") ? 10 : undefined) / 1000) / 60);
                    case 9: //timeformat_hour
                        return (Math.round(tsGetScheduleTime(data.value, (type === "date") ? 10 : undefined) / 1000) / 3600);
                    case 10: //timeformat_YYYYMMDDHHMMSS
                        return getforamtDateCmp(data.value);
                    case 11: //timeformat_YYYYMMDD_HHMMSS
                        return getforamtDateCmp2(data.value);
                    default:
                        let obj = data;
                        obj.name = value;
                        obj.offset = offset;
                        obj.allowedDays = days;
                        obj.ts = data.value.getTime();
                        obj.timeUTCStr = data.value.toUTCString();
                        obj.timeISOStr = data.value.toISOString();
                        obj.timeLocaleStr = data.value.toLocaleString();
                        obj.timeLocaleTimeStr = data.value.toLocaleTimeString();
                        let delay = tsGetScheduleTime(data.value, (type === "date") ? 10 : undefined);
                        obj.delay = delay;
                        obj.delaySec = Math.round(delay / 1000);
                        return obj;
                }
            }
            return data;
        }
        return RED.util.evaluateNodeProperty(value, type, node, msg);
    }

    function tsSetAddProp(node, msg, type, name, valueType, value, format, offset, days) {
        if (type !== 'none' && name) {
            let res = tsGetPropData(node, msg, valueType, value, format, offset, days);
            if (res == null || (typeof res === 'undefined')) {
                throw new Error("could not evaluate " + valueType + '.' + value);
            } else if (res.error) {
                this.error('error on getting additional payload 1: ' + res.error);
            } else if (type === 'msg' || type === 'msgProperty') {
                RED.util.setMessageProperty(msg, name, res);
            } else if ((type === 'flow' || type === 'global')) {
                let contextKey = RED.util.parseContextStore(name);
                node.context()[type].set(contextKey.key, res, contextKey.store);
            }
        }
    }

    function timeInjectNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        //this.debug('initialize timeInjectNode ' + util.inspect(config));

        this.time = config.time;
        this.timeType = config.timeType || 'none';
        this.timeDays = config.timeDays;
        this.timeAltDays = config.timeAltDays;
        this.offset = config.offset || config.timeOffset || 0;
        this.offsetMultiplier = config.offsetMultiplier || config.timeOffsetMultiplier || 60;

        this.property = config.property || '';
        this.propertyType = config.propertyType || 'none';
        this.timeAlt = config.timeAlt || '';
        this.timeAltType = config.timeAltType || 'none';
        this.timeAltOffset = config.timeAltOffset || 0;
        this.timeAltOffsetMultiplier = config.timeAltOffsetMultiplier || 60;

        this.recalcTime = (config.recalcTime || 2) * 3600000;

        this.timeOutObj = null;
        this.intervalObj = null;
        this.nextTime = null;
        this.nextTimeAlt = null;
        this.nextTimeData = null;
        this.nextTimeAltData = null;
        var node = this;

        function doCreateTimeout(node, msg) {
            let errorStatus = '';
            let isAltFirst = false;
            let isFixedTime = true;
            node.nextTime = null;
            node.nextTimeAlt = null;

            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
                node.timeOutObj = null;
            }

            if (node.timeType !== 'none' && node.positionConfig) {
                //(srcNode, msg, vType, value, offset, next, days)
                //node.nextTime = hlp.getTimeProp(node, node.timeType, node.time, node.offset * node.offsetMultiplier, 1);
                node.nextTimeData = node.positionConfig.getTimeProp(node, undefined, node.timeType, node.time, node.offset * node.offsetMultiplier, 1, node.timeDays);
                if (node.nextTimeData.error) {
                    errorStatus = "could not evaluate time";
                    node.error(node.nextTimeData.error);
                    node.debug(util.inspect(node.nextTimeData));
                    //console.log('1');
                    node.nextTime = null;
                    isFixedTime = false;
                } else {
                    node.nextTime = node.nextTimeData.value;
                    isFixedTime = node.nextTimeData.fix;
                }
            }
            //console.log(util.inspect(node.nextTimeData));

            if (node.propertyType !== 'none' &&
                node.timeAltType !== 'none' &&
                node.positionConfig) {
                node.nextTimeAltData = node.positionConfig.getTimeProp(node, undefined, node.timeAltType, node.timeAlt, node.timeAltOffset * node.timeAltOffsetMultiplier, 1, node.timeAltDays);
                if (node.nextTimeAltData.error) {
                    errorStatus = "could not evaluate alternate time";
                    node.error(node.nextTimeAltData.error);
                    //console.log('2');
                    node.nextTimeAlt = null;
                    isFixedTime = false;
                } else {
                    node.nextTimeAlt = node.nextTimeAltData.value;
                    isFixedTime = isFixedTime && node.nextTimeAltData.fix;
                }
            }
            if (node.nextTime && !errorStatus) {
                if (!(node.nextTime instanceof Date) || node.nextTime === 'Invalid Date' || isNaN(node.nextTime)) {
                    //node.debug(node.nextTime);
                    hlp.errorHandler(this, new Error('Invalid Date'), 'Invalid time format', 'internal error!');
                    return;
                }
                let millis = tsGetScheduleTime(node.nextTime, 10);
                //node.debug('timeout ' + node.nextTime + ' is in ' + millis + 'ms');
                let isAlt = (node.nextTimeAlt);
                if (isAlt) {
                    let millisAlt = tsGetScheduleTime(node.nextTimeAlt, 10);
                    if (millisAlt < millis) {
                        millis = millisAlt;
                        isAltFirst = true;
                    }
                }
                node.timeOutObj = setTimeout((isAlt, isAltFirst) => {
                    let msg = {
                        type: 'start',
                        timeData: {}
                    };
                    node.timeOutObj = null;
                    let useAlternateTime = false;
                    if (isAlt) {
                        let needsRecalc = false;
                        try {
                            let res = RED.util.evaluateNodeProperty(node.property, node.propertyType, node, msg);
                            useAlternateTime = ((res == true) || (res == 'true'));
                            needsRecalc = (isAltFirst && !useAlternateTime) || (!isAltFirst && useAlternateTime);
                        } catch (err) {
                            needsRecalc = isAltFirst;
                            hlp.errorHandler(node, err, RED._("time-inject.errors.invalid-property-type", {
                                type: node.propertyType,
                                value: node.property
                            }));
                            node.log('Error: ' + util.inspect(err));
                        }
                        if (needsRecalc) {
                            try {
                                doCreateTimeout(node, msg);
                            } catch (err) {
                                hlp.errorHandler(node, err, RED._("time-inject.errors.error-text"), RED._("time-inject.errors.error-title"));
                            }
                            return;
                        }
                    }
                    if (useAlternateTime && node.nextTimeAltData) {
                        msg.timeData = node.nextTimeAltData;
                    } else if (node.nextTimeData) {
                        msg.timeData = node.nextTimeData;
                    }
                    //node.debug('redo doCreateTimeout');
                    node.emit("input", msg);
                }, millis, isAlt, isAltFirst);
            }

            if (!isFixedTime && !node.intervalObj) {
                node.intervalObj = setInterval(() => {
                    //node.debug('retrigger timecalc');
                    doCreateTimeout(node, msg);
                }, node.recalcTime);
            } else if (isFixedTime && node.intervalObj) {
                clearInterval(node.intervalObj);
                node.intervalObj = null;
            }

            if (errorStatus) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: errorStatus + ((node.intervalObj) ? ' 🖩' : '')
                });
            } else if (node.nextTimeAlt && node.timeOutObj) {
                if (isAltFirst) {
                    node.status({
                        fill: "green",
                        shape: "ring",
                        text: node.nextTimeAlt.toLocaleString() + ' / ' + node.nextTime.toLocaleTimeString()
                    });
                } else {
                    node.status({
                        fill: "green",
                        shape: "dot",
                        text: node.nextTime.toLocaleString() + ' / ' + node.nextTimeAlt.toLocaleTimeString()
                    });
                }
            } else if (node.nextTime && node.timeOutObj) {
                node.status({
                    fill: "green",
                    shape: "dot",
                    text: node.nextTime.toLocaleString()
                });
            } else {
                node.status({});
            }
        }

        this.on('close', function() {
            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
            }
            if (node.intervalObj) {
                clearInterval(node.intervalObj);
            }
            // tidy up any state
        });

        this.on('input', msg => {
            try {
                doCreateTimeout(node, msg);
                node.debug('input ' + util.inspect(msg));
                msg.topic = config.topic;

                let value = tsGetPropData(this, msg, config.payloadType, config.payload);
                if (value == null || (typeof value === 'undefined')) {
                    throw new Error("could not evaluate " + config.payloadType + '.' + config.payload);
                } else if (value.error) {
                    throw new Error('could not getting payload: ' + value.error);
                } else {
                    msg.payload = value;
                }

                tsSetAddProp(this, msg, config.addPayload1Type, config.addPayload1, config.addPayload1ValueType, config.addPayload1Value, config.addPayload1Format, config.addPayload1Offset, config.addPayload1Days);
                tsSetAddProp(this, msg, config.addPayload2Type, config.addPayload2, config.addPayload2ValueType, config.addPayload2Value, config.addPayload2Format, config.addPayload2Offset, config.addPayload2Days);
                tsSetAddProp(this, msg, config.addPayload3Type, config.addPayload3, config.addPayload3ValueType, config.addPayload3Value, config.addPayload3Format, config.addPayload3Offset, config.addPayload3Days);

                node.send(msg);
            } catch (err) {
                hlp.errorHandler(this, err, RED._("time-inject.errors.error-text"), RED._("time-inject.errors.error-title"));
            }
        });

        try {
            if (config.once) {
                config.onceTimeout = setTimeout(function() {
                    node.emit("input", {
                        type: 'once'
                    });
                    doCreateTimeout(node, undefined);
                }, (config.onceDelay || 0.1) * 1000);
            } else {
                doCreateTimeout(node, undefined);
            }
        } catch (err) {
            hlp.errorHandler(this, err, RED._("time-inject.errors.error-text"), RED._("time-inject.errors.error-title"));
        }
    }
    RED.nodes.registerType('time-inject', timeInjectNode);
};