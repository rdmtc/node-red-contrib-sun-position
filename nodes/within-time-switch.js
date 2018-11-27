/********************************************
 * within-time-switch:
 *********************************************/
"use strict";

const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));

function setstate(node, result, status, statusObj) {
    if (status > 255) {
        return result;
    }
    if (result.start.error) {
        node.status({
            fill: "red",
            shape: "dot",
            text: result.start.error
        });
        throw new Error('Error get start time:' + result.start.error);
    } else if (result.end.error) {
        node.status({
            fill: "red",
            shape: "dot",
            text: result.end.error
        });
        throw new Error('Error get end time:' + result.end.error);
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
    let result = {
        start: {},
        end: {},
        startSuffix: '',
        endSuffix: ''
    }

    let alternateTimes = node.propertyType !== 'none';
    if (alternateTimes && msg) {
        //node.debug('alternate times enabled ' + node.propertyType + '.' + node.property);
        try {
            //evaluateNodeProperty(node.property, type, node, msg, callback)
            let res = RED.util.evaluateNodeProperty(node.property, node.propertyType, node, msg);
            alternateTimes = ((res == true) || (res == 'true'));
        } catch (err) {
            alternateTimes = false;
            hlp.errorHandler(node, err, RED._("within-time-switch.errors.invalid-property-type", {
                type: node.propertyType,
                value: node.property
            }));
            node.debug(JSON.stringify(err));
        }
    }

    if (alternateTimes && config.startTimeAltType !== 'none') {
        //node.debug('using alternate start time');
        result.start = node.positionConfig.getTimeProp(node, msg, config.startTimeAltType, config.startTimeAlt, (config.startOffsetAlt || 0) * (config.startOffsetAltMultiplier || 60));
        result.startSuffix = '⎇ ';
    } else {
        //node.debug('using standard start time ' + alternateTimes + ' - ' + config.startTimeAltType);
        result.start = node.positionConfig.getTimeProp(node, msg, config.startTimeType, config.startTime, (config.startOffset || 0) * (config.startOffsetMultiplier || 60));
    }

    if (alternateTimes && config.endTimeAltType !== 'none') {
        //node.debug('using alternate end time');
        result.end = node.positionConfig.getTimeProp(node, msg, config.endTimeAltType, config.endTimeAlt, (config.endOffsetAlt || 0) * (config.endOffsetAltMultiplier || 60));
        result.endSuffix = ' ⎇';
    } else {
        //node.debug('using standard end time ' + alternateTimes + ' - ' + config.startTimeAltType);
        result.end = node.positionConfig.getTimeProp(node, msg, config.endTimeType, config.endTime, (config.endOffset || 0) * (config.endOffsetMultiplier || 60));
    }

    node.debug(JSON.stringify(result, Object.getOwnPropertyNames(result)));
    return result;
}

module.exports = function (RED) {
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
                            shape: "dot",
                            text: '🖅 ' + result.startSuffix + now.toLocaleString() + result.endSuffix //🖅
                        });
                        return null;
                    }
                } else {
                    if (!(cmpNow > endNr && cmpNow < startNr)) {
                        this.send([msg, null]);
                        setstate(this, result, status, {
                            fill: "green",
                            shape: "ring",
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