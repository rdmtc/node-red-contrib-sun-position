/********************************************
 * within-time-switch:
 *********************************************/
"use strict";

const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));
//const cron = require("cron");

module.exports = function(RED) {
    "use strict";

    function timeInjectNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        //this.debug('initialize timeInjectNode ' + JSON.stringify(config));

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

        this.lastSendType = 'none';
        this.lastInputType = 'none';
        this.timeOutObj = null;
        this.intervalObj = null;
        this.nextTime = null;
        this.nextTimeAlt = null;
        var node = this;

        this.getScheduleTime = (time) => {
            var now = new Date();
            var millis = time.getTime() - now.getTime();
            while (millis < 10) {
                millis += 86400000; //24h
            }
            return millis;
        }

        function doCreateTimeout(node) {
            let errorStatus = '';
            let fixTimeStamp = false;
            node.nextTime = null;
            node.nextTimeAlt = null;

            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
                node.timeOutObj = null;
            }

            if (node.timeType !== 'none' && node.positionConfig) {
                //(srcNode, msg, vType, value, offset, next, days)
                //node.nextTime = hlp.getTimeProp(node, node.timeType, node.time, node.offset * node.offsetMultiplier, 1);
                node.nextTime = node.positionConfig.getTimeProp(node, undefined, node.timeType, node.time, node.offset * node.offsetMultiplier, 1, node.timeDays);
                if (node.nextTime.error) {
                    errorStatus = "could not evaluate time";
                    node.error(node.nextTime.error);
                    node.nextTime = null;
                    fixTimeStamp = true;
                } else {
                    fixTimeStamp = node.nextTime.fix;
                    node.nextTime = node.nextTime.value;
                }
            }

            if (node.propertyType !== 'none' &&
                node.timeAltType !== 'none' &&
                node.positionConfig) {
                node.nextTimeAlt = node.positionConfig.getTimeProp(node, undefined, node.timeAltType, node.timeAlt, node.timeAltOffset * node.timeAltOffsetMultiplier, 1, node.timeDays);
                if (node.nextTimeAlt.error) {
                    errorStatus = "could not evaluate alternate time";
                    node.error(node.nextTimeAlt.error);
                    node.nextTimeAlt = null;
                } else {
                    fixTimeStamp = fixTimeStamp && node.nextTimeAlt.fix;
                    node.nextTimeAlt = node.nextTimeAlt.value;
                }
            }
            if (node.nextTime && !errorStatus) {
                if (!(node.nextTime instanceof Date) || node.nextTime === 'Invalid Date' || isNaN(node.nextTime)) {
                    node.debug(node.nextTime);
                    hlp.errorHandler(this, err, 'Invalid time format', 'internal error!');
                    return;
                }
                let millis = node.getScheduleTime(node.nextTime);
                if (millis > 1000) {
                    node.debug('timeout ' + node.nextTime + ' is in ' + millis + 'ms');
                    let isAlt = (node.nextTimeAlt);
                    let isAltFirst = false;
                    if (isAlt) {
                        let millisAlt = node.getScheduleTime(node.nextTimeAlt);
                        if (millisAlt < millis) {
                            millis = millisAlt;
                            isAltFirst = true;
                        }
                    }
                    node.timeOutObj = setTimeout((isAlt, isAltFirst) => {
                        node.timeOutObj = null;
                        if (isAlt) {
                            let needsRecalc = false;
                            try {
                                let res = RED.util.evaluateNodeProperty(node.property, node.propertyType, node, msg);
                                let alternateTimes = ((res == true) || (res == 'true'));
                                needsRecalc = (isAltFirst && !alternateTimes) || (!isAltFirst && alternateTimes);
                            } catch (err) {
                                needsRecalc = isAltFirst;
                                hlp.errorHandler(node, err, RED._("time-inject.errors.invalid-property-type", {
                                    type: node.propertyType,
                                    value: node.property
                                }));
                                node.debug(JSON.stringify(err));
                            }
                            if (needsRecalc) {
                                try {
                                    doCreateTimeout(node);
                                } catch (err) {
                                    hlp.errorHandler(node, err, RED._("time-inject.errors.error-text"), RED._("time-inject.errors.error-title"));
                                }
                                return;
                            }
                        }
                        node.debug('redo doCreateTimeout');
                        node.emit("input", {
                            type: 'start'
                        });
                    }, millis, isAlt, isAltFirst);
                } else {
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
                    doCreateTimeout(node);
                }, node.recalcTime);
            } else if (fixTimeStamp && node.intervalObj) {
                clearInterval(node.intervalObj);
                node.intervalObj = null;
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
                doCreateTimeout(node);
                //node.debug('input ' + JSON.stringify(msg));
                this.lastInputType = msg.type;
                let plType = 'date';
                let plValue = '';

                if (this.timeType !== 'none') {
                    plType = this.payloadType;
                    plValue = this.payload;
                }
                msg.topic = this.topic;
                this.lastSendType = 'start';

                if (plType == null || plType === "date" || plType === "none" || plType === "") {
                    if (plValue === "") {
                        msg.payload = Date.now();
                    } else {
                        msg.payload = plValue;
                    }
                    node.send(msg);
                } else if (plType === "typeSunCalc") {
                    msg.payload = this.positionConfig.getSunCalc(msg.ts);
                } else if (plType === "typeMoonCalc") {
                    msg.payload = this.positionConfig.getMoonCalc(msg.ts);
                } else {
                    RED.util.evaluateNodeProperty(plValue, plType, this, msg, function(err, res) {
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
                this.onceTimeout = setTimeout(function() {
                    node.emit("input", {
                        type: 'once'
                    });
                    doCreateTimeout(node);
                }, this.onceDelay);
            } else {
                doCreateTimeout(node);
            }
        } catch (err) {
            hlp.errorHandler(this, err, RED._("time-inject.errors.error-text"), RED._("time-inject.errors.error-title"));
        }
    }
    RED.nodes.registerType('time-inject', timeInjectNode);
};