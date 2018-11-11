/********************************************
 * within-time-switch:
 *********************************************/
"use strict";

const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));

module.exports = function(RED) {
    "use strict";

    function withinTimeSwitchNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        //this.debug('initialize withinTimeSwitchNode ' + JSON.stringify(config));

        this.property = config.property;
        this.propertyType = config.propertyType || "global";
        var node = this;

        this.on('input', msg => {
            try {
                //this.debug('starting ' + JSON.stringify(msg, Object.getOwnPropertyNames(msg)));
                //this.debug('self ' + JSON.stringify(this, Object.getOwnPropertyNames(this)));
                //this.debug('config ' + JSON.stringify(config, Object.getOwnPropertyNames(config)));

                let now = new Date();
                let start;
                let end;
                let alternateTimes = this.propertyType !== 'none';
                if (alternateTimes) {
                    //this.debug('alternate times enabled ' + this.propertyType + '.' + this.property);
                    try {
                        //evaluateNodeProperty(this.property, type, node, msg, callback)
                        let res = RED.util.evaluateNodeProperty(this.property, this.propertyType, node, msg);
                        alternateTimes = ((res == true) || (res == 'true'));
                    } catch (err) {
                        alternateTimes = false;
                        hlp.errorHandler(node, err, RED._("within-time-switch.errors.invalid-property-type", {
                            type: this.propertyType,
                            value: this.property
                        }));
                        node.debug(JSON.stringify(err));
                    }
                }

                let startSuffix = '';
                if (alternateTimes && config.startTimeAltType !== 'none') {
                    //this.debug('using alternate start time');
                    //start = hlp.getTimeProp(this, config.startTimeAltType, config.startTimeAlt, config.startOffsetAlt);
                    start = node.positionConfig.getTimeProp(this, msg, config.startTimeAltType, config.startTimeAlt, config.startOffsetAlt * config.startOffsetAltMultiplier);
                    startSuffix = '⎇⏴ ';
                } else {
                    //this.debug('using standard start time ' + alternateTimes + ' - ' + config.startTimeAltType);
                    //start = hlp.getTimeProp(this, config.startTimeType, config.startTime, config.startOffset);
                    start = node.positionConfig.getTimeProp(this, msg, config.startTimeType, config.startTime, config.startOffset * config.startOffsetMultiplier);
                }

                let endSuffix = '';
                if (alternateTimes && config.endTimeAltType !== 'none') {
                    //this.debug('using alternate end time');
                    //end = hlp.getTimeProp(this, config.endTimeAltType, config.endTimeAlt, config.endOffsetAlt);
                    end = node.positionConfig.getTimeProp(this, msg, config.endTimeAltType, config.endTimeAlt, config.endOffsetAlt * config.endOffsetAltMultiplier);
                    endSuffix = ' ⏵⎇';
                } else {
                    //this.debug('using standard end time ' + alternateTimes + ' - ' + config.startTimeAltType);
                    //end = hlp.getTimeProp(this, config.endTimeType, config.endTime, config.endOffset);
                    end = node.positionConfig.getTimeProp(this, msg, config.endTimeType, config.endTime, config.endOffset * config.endOffsetMultiplier);
                }

                if (start.error) {
                    this.status({
                        fill: "red",
                        shape: "dot",
                        text: start.error
                    });
                    throw new Error('Error get start time:' + start.error);
                }
                if (end.error) {
                    this.status({
                        fill: "red",
                        shape: "dot",
                        text: start.error
                    });
                    throw new Error('Error get end time:' + start.error);
                }

                if ((typeof msg.ts === 'string') || (msg.ts instanceof Date)) {
                    let dto = new Date(msg.ts);
                    if (dto !== "Invalid Date" && !isNaN(dto)) {
                        now = dto;
                    }
                }
                //this.debug(start.value + ' - ' + now + ' - ' + end.value);
                let startNr = hlp.getOnlyTime(start.value);
                let endNr = hlp.getOnlyTime(end.value);
                let cmpNow = hlp.getOnlyTime(now);
                //this.debug(startNr + ' - ' + cmpNow + ' - ' + endNr);

                if (startNr < endNr) {
                    if (cmpNow >= startNr && cmpNow <= endNr) {
                        this.send([msg, null]);
                        this.status({
                            fill: "green",
                            shape: "dot",
                            text: startSuffix + now.toLocaleString() + endSuffix
                        });
                        return null;
                    }
                } else {
                    if (!(cmpNow > endNr && cmpNow < startNr)) {
                        this.send([msg, null]);
                        this.status({
                            fill: "green",
                            shape: "ring",
                            text: startSuffix + now.toLocaleString() + endSuffix
                        });
                        return null;
                    }
                }
                this.status({
                    fill: "yellow",
                    shape: "dot",
                    text: now.toLocaleString() + startSuffix + endSuffix
                });
                this.send([null, msg]);
            } catch (err) {
                hlp.errorHandler(this, err, RED._("within-time-switch.errors.error-text"), RED._("within-time-switch.errors.error-title"));
            }
        });
    }
    RED.nodes.registerType('within-time-switch', withinTimeSwitchNode);
};