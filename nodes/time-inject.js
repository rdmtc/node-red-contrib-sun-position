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
        this.debug('timeInjectNode ' + JSON.stringify(config));

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
        this.endTimeoutObj = null;
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

        this.setStatus = () => {
            if (node.nextTime) {
                this.status({
                    fill: "green",
                    shape: "dot",
                    text: node.nextTime.toLocaleDateString() + " " + node.nextTime.toLocaleTimeString()
                });
            } else {
                this.status({});
            }
        }

        function doCreateTimeout(node) {
            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
            }
            if (node.timeType !== 'none' && node.positionConfig) {
                //node.nextTime = hlp.getTimeProp(node, node.timeType, node.time, node.offset * node.offsetMultiplier, 1);
                node.nextTime = node.positionConfig.getTimeProp(node.timeType, node.time, node.offset * node.offsetMultiplier, 1);
            } else {
                node.nextTime = null;
            }
            if (node.nextTime) {
                let millis = node.getScheduleTime(node.nextTime);
                node.debug('doCreateTimeout ' + node.nextTime + ' in ' + millis + 'ms');
                node.timeOutObj = setTimeout(() => {
                    node.emit("input", {
                        type: 'start'
                    });
                    node.timeOutObj = null;
                    node.debug('redo doCreateTimeout');
                    doCreateTimeout(node);
                }, millis);
            }
            node.setStatus();
        }

        this.on('close', function () {
            if (this.timeOutObj) {
                clearTimeout(this.timeOutObj);
            }
            if (this.endTimeoutObj) {
                clearTimeout(this.endTimeoutObj);
            }
            // tidy up any state
        });

        this.on('input', msg => {
            try {
                this.debug('input ' + JSON.stringify(msg));
                this.lastInputType = msg.type;
                let plType = 'date';
                let plValue = '';

                if (this.timeType !== 'none') {
                    plType = this.payloadType;
                    plValue = this.payload;
                }
                msg.topic = this.topic;
                this.lastSendType = 'start';

                if (plType !== 'flow' && plType !== 'global') {
                    try {
                        if (plType == null || plType === "date" || plType === "none" || plType === "") {
                            if (plValue === "") {
                                msg.payload = Date.now();
                            } else {
                                msg.payload = plValue;
                            }
                        } else if (plType === 'none') {
                            msg.payload = "";
                        } else if (msg.propertyType === 'jsonata') {
                            try {
                                msg.payload = RED.util.evaluateJSONataExpression(plValue, msg);
                            } catch (err) {
                                this.error(RED._("time-inject.errors.invalid-jsonata-expr", {
                                    error: err.message
                                }));
                                msg.payload = plValue;
                            }
                        } else {
                            msg.payload = RED.util.evaluateNodeProperty(plValue, plType, this, msg);
                        }
                        this.send(msg);
                        msg = null;
                    } catch (err) {
                        this.error(err, msg);
                    }
                } else {
                    RED.util.evaluateNodeProperty(plValue, plType, this, msg, function (err, res) {
                        if (err) {
                            node.error(err, msg);
                        } else {
                            msg.payload = res;
                            node.send(msg);
                        }
                    });
                }
                this.send([null, msg]);
            } catch (err) {
                hlp.errorHandler(this, err, 'Exception occured on withinTimeSwitch', 'internal error');
            }
        });
        doCreateTimeout(node);
    }
    RED.nodes.registerType('time-inject', timeInjectNode);
};