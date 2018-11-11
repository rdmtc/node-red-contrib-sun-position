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

        this.time = config.time;
        this.timeType = config.timeType;
        this.timeDays = config.timeDays;
        this.offset = config.offset;
        this.offsetMultiplier = config.offsetMultiplier;
        this.payload = config.payload;
        this.payloadType = config.payloadType;
        this.topic = config.topic;

        this.lastSendType = 'none';
        this.lastInputType = 'none';
        this.timeOutObj = null;
        this.intervalObj = null;
        this.nextTime = null;
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
                } else {
                    node.nextTime = node.nextTime.value;
                }
            } else {
                node.nextTime = null;
                if (node.intervalObj) {
                    clearInterval(node.intervalObj);
                }
            }
            if (node.nextTime && !node.nextTime.error) {
                let millis = node.getScheduleTime(node.nextTime);
                node.debug('doCreateTimeout ' + node.nextTime + ' in ' + millis + 'ms');
                node.timeOutObj = setTimeout(() => {
                    node.timeOutObj = null;
                    node.debug('redo doCreateTimeout');
                    node.emit("input", {
                        type: 'start'
                    });
                }, millis);
            }
            if (!node.intervalObj) {
                //2h = 7200000
                //4h = 14400000
                //6h = 21600000
                node.intervalObj = setInterval(() => {
                    node.debug('retrigger timecalc');
                    doCreateTimeout(node);
                }, 7200000);
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