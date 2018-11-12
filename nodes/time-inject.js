/********************************************
 * within-time-switch:
 *********************************************/
"use strict";

const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));
//const cron = require("cron");

module.exports = function (RED) {
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
        this.offset = config.offset || 60;
        this.offsetMultiplier = config.offsetMultiplier || 60;

        this.property = config.property || '';
        this.propertyType = config.propertyType || 'none';
        this.timeAlt = config.timeAlt || '';
        this.timeAltType = config.timeAltType || 'none';
        this.timeAltOffset = config.timeAltOffset || 0;
        this.timeAltOffsetMultiplier = config.timeAltOffsetMultiplier || 60;


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

        this.setStatus = (error) => {
            if (node.nextTime) {
                this.status({
                    fill: "green",
                    shape: "dot",
                    text: node.nextTime.toLocaleString()
                });
            } else if (error) {
                this.status({
                    fill: "red",
                    shape: "dot",
                    text: error
                });
            } else {
                this.status({});
            }
        }

        function doCreateTimeout(node) {
            let errorStatus = '';
            let fixTimeStamp = false;
            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
            }
            if (node.timeType !== 'none' && node.positionConfig) {
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
            } else {
                node.nextTime = null;
                if (node.intervalObj) {
                    clearInterval(node.intervalObj);
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
            } else {
                node.nextTimeAlt = null;
            }
            if (node.nextTime && !node.nextTime.error) {
                let millis = node.getScheduleTime(node.nextTime);
                node.debug('doCreateTimeout ' + node.nextTime + ' in ' + millis + 'ms');
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
                                type: this.propertyType,
                                value: this.property
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
            }
            if (!fixTimeStamp && !node.intervalObj) {
                //2h = 7200000
                //4h = 14400000
                //6h = 21600000
                node.intervalObj = setInterval(() => {
                    node.debug('retrigger timecalc');
                    doCreateTimeout(node);
                }, 7200000);
            } else if (fixTimeStamp && node.intervalObj) {
                clearInterval(this.intervalObj);
                node.intervalObj = null;
            }
            node.setStatus(errorStatus);
        }

        this.on('close', function () {
            if (this.timeOutObj) {
                clearTimeout(this.timeOutObj);
            }
            if (this.intervalObj) {
                clearInterval(this.intervalObj);
            }
            // tidy up any state
        });

        this.on('input', msg => {
            try {
                doCreateTimeout(node);
                //this.debug('input ' + JSON.stringify(msg));
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
            doCreateTimeout(node);
        } catch (err) {
            hlp.errorHandler(this, err, RED._("time-inject.errors.error-text"), RED._("time-inject.errors.error-title"));
        }
    }
    RED.nodes.registerType('time-inject', timeInjectNode);
};