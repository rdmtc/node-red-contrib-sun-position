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

        this.topic = config.topic;
        this.payloadStart = config.payloadStart;
        this.payloadStartType = config.payloadStartType;
        this.startTime = config.startTime;
        this.startTimeType = config.startTimeType;
        this.startOffset = config.startOffset;

        this.payloadEnd = config.payloadEnd;
        this.payloadEndType = config.payloadEndType;
        this.endTime = config.endTime;
        this.endTimeType = config.endTimeType;
        this.endOffset = config.endOffset;
        this.startTimeout = null;
        this.endTimeout = null;
        var node = this;

        var node = this;

        node.scheduleTime = function (time, val) {
            var now = new Date();
            var millis = time - now;
            if (millis < 0) {
                millis += 86400000; //24h
            }
            return setTimeout(() => {
                node.emit("input", {type : val});
            }, millis);
        };

        this.on('close', function() {
            if (this.startTimeout) {

            }
            // tidy up any state
        });

        this.on('input', msg => {
            try {
                msg.topic = this.topic;

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
    }
    RED.nodes.registerType('time-inject', timeInjectNode);
};