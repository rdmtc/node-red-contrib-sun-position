/********************************************
 * within-time-switch:
 *********************************************/
"use strict";

const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));

module.exports = function (RED) {
    "use strict";

    function withinTimeSwitchNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);

        this.property = config.property;
        this.propertyType = config.propertyType || "global";
        var node = this;
        this.debug('initialize node');

        this.on('input', msg => {
            try {
                this.debug('starting ' + JSON.stringify(msg, Object.getOwnPropertyNames(msg)));
                this.debug('self ' + JSON.stringify(this, Object.getOwnPropertyNames(this)));
                this.debug('config ' + JSON.stringify(config, Object.getOwnPropertyNames(config)));

                let start;
                let end;
                let alternateTimes = this.propertyType !== 'none';
                if (alternateTimes) {
                    this.debug('alternate times enabled');
                    if (this.propertyType === 'msg') {
                        alternateTimes = (RED.util.getMessageProperty(msg, this.property, true) == true);
                    } else if (this.propertyType === 'flow' || this.propertyType === 'global') {
                        var contextKey = RED.util.parseContextStore(this.property);
                        alternateTimes = (this.context()[this.propertyType].get(contextKey.key, contextKey.store) == true);
                    } else if (this.propertyType === 'jsonata') {
                        try {
                            alternateTimes = RED.util.evaluateJSONataExpression(node.property, msg);
                        } catch (err) {
                            this.error(RED._("within-time-switch.errors.invalid-jsonata-expr", {
                                error: err.message
                            }));
                            alternateTimes = false;
                        }
                    } else {
                        alternateTimes = false;
                        this.error(RED._("within-time-switch.errors.invalid-property-type", {
                            type: this.propertyType,
                            value: this.property
                        }));
                    }
                }

                if (alternateTimes && config.startTimeAltType !== 'none') {
                    this.debug('using alternate start time');
                    //start = hlp.getTimeProp(this, config.startTimeAltType, config.startTimeAlt, config.startOffsetAlt);
                    start = node.positionConfig.getTimeProp(this, msg, config.startTimeAltType, config.startTimeAlt, config.startOffsetAlt * config.startOffsetAltMultiplier);
                } else {
                    //start = hlp.getTimeProp(this, config.startTimeType, config.startTime, config.startOffset);
                    start = node.positionConfig.getTimeProp(this, msg, config.startTimeType, config.startTime, config.startOffset * config.startOffsetMultiplier);
                }
                if (alternateTimes && config.endTimeAltType !== 'none') {
                    this.debug('using alternate end time');
                    //end = hlp.getTimeProp(this, config.endTimeAltType, config.endTimeAlt, config.endOffsetAlt);
                    end = node.positionConfig.getTimeProp(this, msg, config.endTimeAltType, config.endTimeAlt, config.endOffsetAlt * config.endOffsetAltMultiplier);
                } else {
                    //end = hlp.getTimeProp(this, config.endTimeType, config.endTime, config.startOffset);
                    end = node.positionConfig.getTimeProp(this, msg, config.endTimeType, config.endTime, config.startOffset * config.startOffsetMultiplier);
                }

                if (start.error) {
                    throw new Error('Error get start time:' + start.error);
                }
                if (end.error) {
                    throw new Error('Error get end time:' + start.error);
                }

                let now = new Date();
                if ((typeof msg.ts === 'string') || (msg.ts instanceof Date)) {
                    let dto = new Date(msg.ts);
                    if (dto !== "Invalid Date" && !isNaN(dto)) {
                        now = dto;
                    }
                }
                this.debug(start.value + ' - ' + now + ' - ' + end.value);
                let startNr = start.value.getSeconds() + start.value.getMinutes() * 60 + start.value.getHours() * 3600;
                let endNr = end.value.getSeconds() + end.value.getMinutes() * 60 + end.value.getHours() * 3600;
                let cmpNow = now.getSeconds() + now.getMinutes() * 60 + now.getHours() * 3600;
                this.debug(start + ' - ' + cmpNow + ' - ' + end);

                if (startNr < endNr) {
                    if (cmpNow >= startNr && cmpNow <= endNr) {
                        this.send([msg, null]);
                        this.status({
                            fill: "green",
                            shape: "dot",
                            text: now.getHours() + ':' + now.getMinutes()
                        });
                        return;
                    }
                } else {
                    if (!(cmpNow > endNr && cmpNow < startNr)) {
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
                hlp.errorHandler(this, err, RED._("within-time-switch.errors.error-text"), RED._("within-time-switch.errors.error-title"));
            }
        });
    }
    RED.nodes.registerType('within-time-switch', withinTimeSwitchNode);
};