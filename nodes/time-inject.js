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

        this.startTime = config.startTime;
        this.startTimeType = config.startTimeType;
        this.startOffset = config.startOffset;
        this.payloadStart = config.payloadStart;
        this.payloadStartType = config.payloadStartType;
        this.topicStart = config.topicStart;

        this.endTime = config.endTime;
        this.endTimeType = config.endTimeType;
        this.endOffset = config.endOffset;
        this.payloadEnd = config.payloadEnd;
        this.payloadEndType = config.payloadEndType;
        this.topicEnd = config.topicEnd;

        this.lastSendType = 'none';
        this.lastInputType = 'none';
        this.startTimeoutObj = null;
        this.endTimeoutObj = null;
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
            let formatT = (t) => {
                return (t) ? (t.getHours() + ':' + (t.getMinutes() < 10 ? '0' : '') + t.getMinutes()) : '';
            }

            if (node.nextStartTime && node.nextEndTime) {
                this.status({
                    fill: "green",
                    shape: "dot",
                    text: formatT(node.nextStartTime) + ' - ' + formatT(node.nextEndTime)
                });
            } else if (node.nextStartTime) {
                this.status({
                    fill: "green",
                    shape: "ring",
                    text: formatT(node.nextStartTime)
                });
            } else if (node.nextEndTime) {
                this.status({
                    fill: "green",
                    shape: "ring",
                    text: formatT(node.nextEndTime)
                });
            } else {
                this.status({});
            }
        }

        function setStartTimeout(node) {
            if (node.startTimeoutObj) {
                clearTimeout(node.startTimeoutObj);
            }
            if (node.startTimeType !== 'none') {
                node.nextStartTime = hlp.getTimeProp(node, node.startTimeType, node.startTime, node.startOffset, 1);
            } else {
                node.nextStartTime = null;
            }
            if (node.nextStartTime) {
                let millis = node.getScheduleTime(node.nextStartTime);
                node.debug('setStartTimeout ' + node.nextStartTime + ' in ' + millis + 'ms');
                node.startTimeoutObj = setTimeout(() => {
                    node.emit("input", {
                        type: 'start'
                    });
                    node.startTimeoutObj = null;
                    node.debug('redo setStartTimeout');
                    setStartTimeout(node);
                }, millis);
            }
            node.setStatus();
        }

        function setEndTimeout(node) {
            if (node.endTimeoutObj) {
                clearTimeout(node.endTimeoutObj);
            }
            if (config.endTimeType !== 'none') {
                node.nextEndTime = hlp.getTimeProp(node, node.endTimeType, node.endTime, node.endOffset, 1);
            } else {
                node.nextEndTime = null;
            }
            if (node.nextEndTime) {
                let millis = node.getScheduleTime(node.nextEndTime);
                node.debug('setEndTimeout ' + node.nextEndTime + ' in ' + millis + 'ms');
                node.startTimeoutObj = setTimeout(() => {
                    node.emit("input", {
                        type: 'end'
                    });
                    node.endTimeoutObj = null;
                    node.debug('redo setEndTimeout');
                    setEndTimeout(node);
                }, millis);
            }
            node.setStatus();
        }

        this.on('close', function () {
            if (this.startTimeoutObj) {
                clearTimeout(this.startTimeoutObj);
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

                if (msg.type === 'start' || (msg.type !== 'end' && this.lastSendType !== 'start')) {
                    if (this.startTimeType !== 'none') {
                        plType = this.payloadStartType;
                        plValue = this.payloadStart;
                    }
                    msg.topic = this.topicStart;
                    this.lastSendType = 'start';
                } else {
                    if (this.payloadEndType !== 'none') {
                        plType = this.payloadEndType;
                        plValue = this.payloadEnd;
                    }
                    msg.topic = this.topicEnd;
                    this.lastSendType = 'end';
                }

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
        setStartTimeout(node);
        setEndTimeout(node);
        /* if (!node.nextStartTime && !node.nextEndTime) {
            node.emit("input", {
                type: 'intermediate',
            });
        } */
    }
    RED.nodes.registerType('time-inject', timeInjectNode);
};