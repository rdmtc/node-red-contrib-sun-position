/********************************************
 * within-time-switch:
 *********************************************/
"use strict";
const util = require('util');

const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));
//const cron = require("cron");

module.exports = function (RED) {
    "use strict";

    function timeInjectNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        //this.debug('initialize timeInjectNode ' + util.inspect(config));

        this.payload = config.payload || '';
        this.payloadType = config.payloadType || 'none';
        this.topic = config.topic;

        this.time = config.time;
        this.timeType = config.timeType || 'none';
        this.timeDays = config.timeDays;
        this.offset = config.offset || 0;
        this.offsetMultiplier = config.offsetMultiplier || 60;

        this.property = config.property || '';
        this.propertyType = config.propertyType || 'none';
        this.timeAlt = config.timeAlt || '';
        this.timeAltType = config.timeAltType || 'none';
        this.timeAltOffset = config.timeAltOffset || 0;
        this.timeAltOffsetMultiplier = config.timeAltOffsetMultiplier || 60;

        this.recalcTime = (config.recalcTime || 2) * 3600000;

        this.once = config.once;
        this.onceDelay = (config.onceDelay || 0.1) * 1000;

        this.timeOutObj = null;
        this.intervalObj = null;
        this.nextTime = null;
        this.nextTimeAlt = null;
        this.nextTimeData = null;
        this.nextTimeAltData = null;
        var node = this;

        this.getScheduleTime = (time) => {
            var now = new Date();
            var millis = time.getTime() - now.getTime();
            while (millis < 10) {
                millis += 86400000; //24h
            }
            return millis;
        }

        function doCreateTimeout(node, msg) {
            let errorStatus = '';
            let fixTimeStamp = false;
            let isAltFirst = false;
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
                    fixTimeStamp = true;
                } else {
                    fixTimeStamp = node.nextTimeData.fix;
                    node.nextTime = node.nextTimeData.value;
                }
            }
            //console.log(util.inspect(node.nextTimeData));

            if (node.propertyType !== 'none' &&
                node.timeAltType !== 'none' &&
                node.positionConfig) {
                node.nextTimeAltData = node.positionConfig.getTimeProp(node, undefined, node.timeAltType, node.timeAlt, node.timeAltOffset * node.timeAltOffsetMultiplier, 1, node.timeDays);
                if (node.nextTimeAltData.error) {
                    errorStatus = "could not evaluate alternate time";
                    node.error(node.nextTimeAltData.error);
                    //console.log('2');
                    node.nextTimeAlt = null;
                } else {
                    fixTimeStamp = fixTimeStamp && node.nextTimeAltData.fix;
                    node.nextTimeAlt = node.nextTimeAltData.value;
                }
            }
            if (node.nextTime && !errorStatus) {
                if (!(node.nextTime instanceof Date) || node.nextTime === 'Invalid Date' || isNaN(node.nextTime)) {
                    node.debug(node.nextTime);
                    hlp.errorHandler(this, new Error('Invalid Date'), 'Invalid time format', 'internal error!');
                    return;
                }
                let millis = node.getScheduleTime(node.nextTime);
                if (millis > 500) {
                    node.debug('timeout ' + node.nextTime + ' is in ' + millis + 'ms');
                    let isAlt = (node.nextTimeAlt);
                    if (isAlt) {
                        let millisAlt = node.getScheduleTime(node.nextTimeAlt);
                        if (millisAlt < millis) {
                            millis = millisAlt;
                            isAltFirst = true;
                        }
                    }
                    node.timeOutObj = setTimeout((isAlt, isAltFirst) => {
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
                                node.debug(util.inspect(err));
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
                        let msg = {
                            type: 'start',
                            timeData: {}
                        };
                        if (useAlternateTime && node.nextTimeAltData) {
                            msg.timeData = node.nextTimeAltData;
                        } else if (node.nextTimeData) {
                            msg.timeData = node.nextTimeData;
                        }
                        node.debug('redo doCreateTimeout');
                        node.emit("input", msg);
                    }, millis, isAlt, isAltFirst);
                } else {
                    errorStatus = "invalid calculated time";
                    node.nextTime = null;
                    fixTimeStamp = false;
                }
            } else {
                fixTimeStamp = false;
            }
            if (errorStatus) {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: errorStatus
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

            if (!fixTimeStamp && !node.intervalObj) {
                node.intervalObj = setInterval(() => {
                    node.debug('retrigger timecalc');
                    doCreateTimeout(node, msg);
                }, node.recalcTime);
            } else if (fixTimeStamp && node.intervalObj) {
                clearInterval(node.intervalObj);
                node.intervalObj = null;
            }
        }

        this.on('close', function () {
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
                //node.debug('input ' + util.inspect(msg));
                let plType = 'date';
                let plValue = '';

                if (this.timeType !== 'none') {
                    plType = this.payloadType;
                    plValue = this.payload;
                }
                msg.topic = this.topic;

                if (plType == null || plType === "date" || plType === "none" || plType === "") {
                    if (plValue === "") {
                        msg.payload = Date.now();
                    } else {
                        msg.payload = plValue;
                    }
                    node.send(msg);
                } else if (plType === "pdsCalcData") {
                    msg.payload = this.positionConfig.getSunCalc(msg.ts);
                } else if (plType === "pdmCalcData") {
                    msg.payload = this.positionConfig.getMoonCalc(msg.ts);
                } else {
                    RED.util.evaluateNodeProperty(plValue, plType, this, msg, function (err, res) {
                        if (err) {
                            hlp.errorHandler(node, err, RED._("time-inject.errors.error-text"), RED._("time-inject.errors.error-title"));
                        } else {
                            msg.payload = res;
                            node.send(msg);
                        }
                    });
                }
                msg = null;
            } catch (err) {
                hlp.errorHandler(this, err, RED._("time-inject.errors.error-text"), RED._("time-inject.errors.error-title"));
            }
        });

        try {
            if (this.once) {
                this.onceTimeout = setTimeout(function () {
                    node.emit("input", {
                        type: 'once'
                    });
                    doCreateTimeout(node, undefined);
                }, this.onceDelay);
            } else {
                doCreateTimeout(node, undefined);
            }
        } catch (err) {
            hlp.errorHandler(this, err, RED._("time-inject.errors.error-text"), RED._("time-inject.errors.error-title"));
        }
    }
    RED.nodes.registerType('time-inject', timeInjectNode);
};