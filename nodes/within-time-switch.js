/********************************************
 * within-time-switch:
 *********************************************/
"use strict";

const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));

module.exports = function (RED) {
    "use strict";


    function setstate(node, result, status, statusObj) {
        if (status > 255) {
            return result;
        }
        if (result.start.error) {
            hlp.errorHandler(node, new Error('Error get start time:' + result.start.error), RED._("within-time-switch.errors.error-text"), result.start.error);
        } else if (result.end.error) {
            hlp.errorHandler(node, new Error('Error get end time:' + result.end.error), RED._("within-time-switch.errors.error-text"), result.end.error);
        } else if ((status & 2) && statusObj) {
            node.status(statusObj);
        } else if ((status & 1) && result.start.value && result.end.value) {
            node.status({
                fill: "yellow",
                shape: "dot",
                text: '⏲ ⏵' + result.start.value.toLocaleTimeString() + result.startSuffix + ' - ⏴' + result.end.value.toLocaleTimeString() + result.endSuffix
            });
        } else {
            node.status({});
            /*node.status({
                fill: "red",
                shape: "dot",
                text: 'status not available'
            });*/
        }
    }

    function calcWithinTimes(node, msg, config, noState) {
        //node.debug('calcWithinTimes');
        let result = {
            start: {},
            end: {},
            startSuffix: '',
            endSuffix: '',
            altStartTime : (node.propertyStartType !== 'none') && (msg || (node.propertyStartType !== 'msg')),
            altEndTime : (node.propertyEndType !== 'none') && (msg || (node.propertyEndType !== 'msg'))
        }

        if (result.altStartTime) {
            //node.debug('alternate start times enabled ' + node.propertyStartType + '.' + node.propertyStart);
            try {
                //evaluateNodeProperty(node.property, type, node, msg, callback)
                let res = RED.util.evaluateNodeProperty(node.propertyStart, node.propertyStartType, node, msg);
                result.altStartTime = ((res == true) || (res == 'true'));
            } catch (err) {
                result.altStartTime = false;
                hlp.errorHandler(node, err, RED._("within-time-switch.errors.invalid-propertyStart-type", {
                    type: node.propertyStartType,
                    value: node.propertyStart
                }));
                node.debug(JSON.stringify(err));
            }
        }

        if (result.altEndTime) {
            //node.debug('alternate end times enabled ' + node.propertyEndType + '.' + node.propertyEnd);
            try {
                //evaluateNodeProperty(node.property, type, node, msg, callback)
                let res = RED.util.evaluateNodeProperty(node.propertyEnd, node.propertyEndType, node, msg);
                result.altEndTime = ((res == true) || (res == 'true'));
            } catch (err) {
                result.altEndTime = false;
                hlp.errorHandler(node, err, RED._("within-time-switch.errors.invalid-propertyEnd-type", {
                    type: node.propertyEndType,
                    value: node.propertyEnd
                }));
                node.debug(JSON.stringify(err));
            }
        }

        if (result.altStartTime && config.startTimeAltType !== 'none') {
            //node.debug('using alternate start time ' + result.altStartTime + ' - ' + config.startTimeAltType);
            result.start = node.positionConfig.getTimeProp(node, msg, config.startTimeAltType, config.startTimeAlt, (config.startOffsetAlt || 0) * (config.startOffsetAltMultiplier || 60));
            result.startSuffix = '⎇ ';
        } else {
            //node.debug('using standard start time ' + result.altStartTime + ' - ' + config.startTimeAltType);
            result.start = node.positionConfig.getTimeProp(node, msg, config.startTimeType, config.startTime, (config.startOffset || 0) * (config.startOffsetMultiplier || 60));
        }

        if (result.altEndTime && config.endTimeAltType !== 'none') {
            //node.debug('using alternate end time ' + result.altEndTime + ' - ' + config.startTimeAltType);
            result.end = node.positionConfig.getTimeProp(node, msg, config.endTimeAltType, config.endTimeAlt, (config.endOffsetAlt || 0) * (config.endOffsetAltMultiplier || 60));
            result.endSuffix = ' ⎇';
        } else {
            //node.debug('using standard end time ' + result.altEndTime + ' - ' + config.startTimeAltType);
            result.end = node.positionConfig.getTimeProp(node, msg, config.endTimeType, config.endTime, (config.endOffset || 0) * (config.endOffsetMultiplier || 60));
        }

        //node.debug(JSON.stringify(result, Object.getOwnPropertyNames(result)));
        return result;
    }

    function withinTimeSwitchNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        //this.debug('initialize withinTimeSwitchNode ' + JSON.stringify(config));

        this.propertyStart = config.propertyStart || "";
        this.propertyEnd = config.propertyEnd || "";
        this.propertyStartType = config.propertyStartType || "none";
        this.propertyEndType = config.propertyEndType || "none";
        var node = this;

        this.on('input', msg => {
            try {
                //this.debug('starting ' + JSON.stringify(msg, Object.getOwnPropertyNames(msg)));
                //this.debug('self ' + JSON.stringify(this, Object.getOwnPropertyNames(this)));
                //this.debug('config ' + JSON.stringify(config, Object.getOwnPropertyNames(config)));

                let result = calcWithinTimes(this, msg, config, true);
                let now = new Date();

                if ((typeof msg.ts === 'string') || (msg.ts instanceof Date)) {
                    let dto = new Date(msg.ts);
                    if (dto !== "Invalid Date" && !isNaN(dto)) {
                        now = dto;
                    }
                }

                if (!result.start.value || !result.end.value) {
                    throw new Error('Error can not calc time!');
                }

                //this.debug(result.start.value + ' - ' + now + ' - ' + result.end.value);
                let startNr = hlp.getTimeNumber(result.start.value);
                let endNr = hlp.getTimeNumber(result.end.value);
                let cmpNow = hlp.getTimeNumber(now);
                //this.debug(startNr + ' - ' + cmpNow + ' - ' + endNr);
                let status = (config.statusOut || 3);
                if (startNr < endNr) {
                    if (cmpNow >= startNr && cmpNow <= endNr) {
                        this.send([msg, null]);
                        setstate(this, result, status, {
                            fill: "green",
                            shape: "ring",
                            text: '🖅 ' + result.startSuffix + now.toLocaleString() + result.endSuffix //🖅
                        });
                        return null;
                    }
                } else {
                    if (!(cmpNow > endNr && cmpNow < startNr)) {
                        this.send([msg, null]);
                        setstate(this, result, status, {
                            fill: "green",
                            shape: "dot",
                            text: '🖅 ' + result.startSuffix + now.toLocaleString() + result.endSuffix //🖅
                        });
                        return null;
                    }
                }
                setstate(this, result, status, {
                    fill: "yellow",
                    shape: "dot",
                    text: '⛔ ⏵' + result.start.value.toLocaleTimeString() + result.startSuffix + ' - ⏴' + result.end.value.toLocaleTimeString() + result.endSuffix
                });
                this.send([null, msg]);
            } catch (err) {
                hlp.errorHandler(this, err, RED._("within-time-switch.errors.error-text"), RED._("within-time-switch.errors.error-title"));
            }
        });

        try {
            node.status({});
            let result = calcWithinTimes(this, null, config, true);
            setstate(this, result, (config.statusOut || 3));
        } catch (err) {
            hlp.errorHandler(this, err, RED._("within-time-switch.errors.error-text"), RED._("within-time-switch.errors.error-title"));
        }
    }
    RED.nodes.registerType('within-time-switch', withinTimeSwitchNode);
};