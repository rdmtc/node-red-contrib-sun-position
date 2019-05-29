/********************************************
 * within-time-switch:
 *********************************************/
'use strict';

const util = require('util');
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));

module.exports = function (RED) {
    'use strict';
    function getDate(comparetype, msg, node) {
        let id = '';
        let value = '';
        switch (comparetype) {
            case '1':
                id = 'msg.ts';
                value = msg.ts;
                break;
            case '2':
                id = 'msg.lc';
                value = msg.lc;
                break;
            case '3':
                id = 'msg.time';
                value = msg.time;
                break;
            case '4':
                id = 'msg.value';
                value = msg.value;
                break;
            default:
                return new Date();
        }
        node.debug('compare time to ' + id + ' = "' + value + '"');
        const dto = new Date(msg.ts);
        if (dto !== 'Invalid Date' && !isNaN(dto)) {
            return dto;
        }
        node.error('Error can not get a valide timestamp from ' + id + '="' + value + '"! Will use current timestamp!');
        return new Date();
    }

    function setstate(node, result, status, statusObj, _onInit) {
        if (status > 255) {
            return false;
        }
        if (result.start.error) {
            if (_onInit === true) {
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-init', result.start.error)
                });
                node.warn(RED._('node-red-contrib-sun-position/position-config:errors.warn-init', result.start.error));
                return true;
            }
            hlp.handleError(node, RED._('within-time-switch.errors.error-start-time', { message : result.start.error}), undefined, result.start.error);
        } else if (result.end.error) {
            if (_onInit === true) {
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-init', result.end.error)
                });
                node.warn(RED._('node-red-contrib-sun-position/position-config:errors.warn-init', result.end.error));
                return true;
            }
            hlp.handleError(node, RED._('within-time-switch.errors.error-end-time', { message : result.end.error}), undefined, result.end.error);
        } else if ((status & 2) && statusObj) {
            node.status(statusObj);
        } else if ((status & 1) && result.start.value && result.end.value) {
            node.status({
                fill: 'yellow',
                shape: 'dot',
                text: '⏲ ⏵' + node.positionConfig.dateToTimeString(result.start.value) + result.startSuffix + ' - ⏴' + node.positionConfig.dateToTimeString(result.end.value) + result.endSuffix
            });
        } else {
            node.status({});
            /*
            node.status({
                fill: "red",
                shape: "dot",
                text: 'status not available'
            }); */
        }
        return false;
    }

    function calcWithinTimes(node, msg, config) {
        // node.debug('calcWithinTimes');
        const result = {
            start: {},
            end: {},
            startSuffix: '',
            endSuffix: '',
            altStartTime: (node.propertyStartType !== 'none') && (msg || (node.propertyStartType !== 'msg')),
            altEndTime: (node.propertyEndType !== 'none') && (msg || (node.propertyEndType !== 'msg'))
        };

        if (result.altStartTime) {
            // node.debug('alternate start times enabled ' + node.propertyStartType + '.' + node.propertyStart);
            try {
                result.altStartTime = node.positionConfig.comparePropValue(node, msg, node.propertyStartType, node.propertyStart,
                    node.propertyStartOperator, node.propertyStartThresholdType, node.propertyStartThresholdValue);
            } catch (err) {
                result.altStartTime = false;
                hlp.handleError(node, RED._('within-time-switch.errors.invalid-propertyStart-type', {
                    type: node.propertyStartType,
                    value: node.propertyStart
                }), err);
                node.debug(util.inspect(err));
            }
        }

        if (result.altEndTime) {
            // node.debug('alternate end times enabled ' + node.propertyEndType + '.' + node.propertyEnd);
            try {
                result.altEndTime = node.positionConfig.comparePropValue(node, msg, node.propertyEndType, node.propertyEnd,
                    node.propertyEndOperator, node.propertyEndThresholdType, node.propertyEndThresholdValue);
            } catch (err) {
                result.altEndTime = false;
                hlp.handleError(node, RED._('within-time-switch.errors.invalid-propertyEnd-type', {
                    type: node.propertyEndType,
                    value: node.propertyEnd
                }), err);
                node.debug(util.inspect(err));
            }
        }

        if (result.altStartTime && config.startTimeAltType !== 'none') {
            // node.debug('using alternate start time ' + result.altStartTime + ' - ' + config.startTimeAltType);
            result.start = node.positionConfig.getTimeProp(node, msg, config.startTimeAltType, config.startTimeAlt, config.startOffsetAltType, config.startOffsetAlt, config.startOffsetAltMultiplier);
            result.startSuffix = '⎇ ';
        } else {
            // node.debug('using standard start time ' + result.altStartTime + ' - ' + config.startTimeAltType);
            result.start = node.positionConfig.getTimeProp(node, msg, config.startTimeType, config.startTime, config.startOffsetType, config.startOffset, config.startOffsetMultiplier);
        }

        if (result.altEndTime && config.endTimeAltType !== 'none') {
            // node.debug('using alternate end time ' + result.altEndTime + ' - ' + config.startTimeAltType);
            result.end = node.positionConfig.getTimeProp(node, msg, config.endTimeAltType, config.endTimeAlt, config.endOffsetAltType, config.endOffsetAlt, config.endOffsetAltMultiplier);
            result.endSuffix = ' ⎇';
        } else {
            // node.debug('using standard end time ' + result.altEndTime + ' - ' + config.startTimeAltType);
            result.end = node.positionConfig.getTimeProp(node, msg, config.endTimeType, config.endTime, config.endOffsetType, config.endOffset, config.endOffsetMultiplier);
        }

        // node.debug(util.inspect(result, Object.getOwnPropertyNames(result)));
        return result;
    }

    function getScheduleTime(time) {
        const now = new Date();
        let millis = time.getTime() - now.getTime();
        while (millis < 10) {
            millis += 86400000; // 24h
        }

        return millis;
    }

    function checkReSendMsgDelayed(isActive, node, time, msg) {
        if (node.timeOutObj) {
            clearTimeout(node.timeOutObj);
            node.timeOutObj = null;
        }

        if (!msg.reSendMsgDelayed && isActive && time) {
            node.lastMsgObj = RED.util.cloneMessage(msg);
            node.lastMsgObj.reSendMsgDelayed = false;
            const millis = getScheduleTime(time) + 10;
            node.debug('timeout for resend last message ' + time + ' is in ' + millis + 'ms');
            node.timeOutObj = setTimeout(() => {
                node.debug('setTimeout triggered, resend last message as configured');
                node.timeOutObj = null;
                if (node.lastMsgObj) {
                    node.lastMsgObj.reSendMsgDelayed = true;
                    node.emit('input', node.lastMsgObj);
                }
            }, millis);
        }
    }

    function withinTimeSwitchNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize withinTimeSwitchNode ' + util.inspect(config));

        this.propertyStart = config.propertyStart || '';
        this.propertyStartType = config.propertyStartType || 'none';
        this.propertyStartOperator = config.propertyStartCompare || 'true';
        this.propertyStartThresholdValue = config.propertyStartThreshold;
        this.propertyStartThresholdType = config.propertyStartThresholdType;

        this.propertyEnd = config.propertyEnd || '';
        this.propertyEndType = config.propertyEndType || 'none';
        this.propertyEndOperator = config.propertyEndCompare || 'true';
        this.propertyEndThresholdValue = config.propertyEndThreshold;
        this.propertyEndThresholdType = config.propertyEndThresholdType;
        this.timeOutObj = null;
        this.lastMsgObj = null;
        const node = this;

        this.on('input', msg => {
            try {
                if (!node.positionConfig) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'));
                    node.status({
                        fill: 'red',
                        shape: 'dot',
                        text: RED._('node-red-contrib-sun-position/position-config:errors.pos-config-state')
                    });
                    return null;
                }
                // this.debug('starting ' + util.inspect(msg, Object.getOwnPropertyNames(msg)));
                // this.debug('self ' + util.inspect(this, Object.getOwnPropertyNames(this)));
                // this.debug('config ' + util.inspect(config, Object.getOwnPropertyNames(config)));
                const result = calcWithinTimes(this, msg, config);
                const now = getDate(config.tsCompare, msg, node);

                if (!result.start.value || !result.end.value) {
                    throw new Error('Error can not calc time!');
                }

                const startNr = hlp.getTimeNumberUTC(result.start.value);
                const endNr = hlp.getTimeNumberUTC(result.end.value);
                const cmpNow = hlp.getTimeNumberUTC(now);
                const status = (config.statusOut || 3);
                if (startNr < endNr) {
                    if (cmpNow >= startNr && cmpNow < endNr) {
                        // this.debug('compare in time 1 ' + startNr + ' - ' + cmpNow + ' - ' + endNr);
                        this.send([msg, null]);
                        setstate(this, result, status, {
                            fill: 'green',
                            shape: 'ring',
                            text: '🖅 ' + result.startSuffix + node.positionConfig.dateToString(now) + result.endSuffix
                        }, false);
                        checkReSendMsgDelayed(config.lastMsgOnEndOut, this, result.end.value, msg);
                        return null;
                    }
                } else if (!(cmpNow >= endNr && cmpNow < startNr)) {
                    // this.debug('compare in time 2 ' + startNr + ' - ' + cmpNow + ' - ' + endNr);
                    this.send([msg, null]);
                    setstate(this, result, status, {
                        fill: 'green',
                        shape: 'dot',
                        text: '🖅 ' + result.startSuffix + node.positionConfig.dateToString(now) + result.endSuffix
                    }, false);
                    checkReSendMsgDelayed(config.lastMsgOnEndOut, this, result.end.value, msg);
                    return null;
                }

                // this.debug('compare out of time ' + startNr + ' - ' + cmpNow + ' - ' + endNr);
                this.send([null, msg]);
                setstate(this, result, status, {
                    fill: 'yellow',
                    shape: 'dot',
                    text: '⛔' + result.startSuffix + node.positionConfig.dateToString(now) + result.endSuffix
                }, false);
                checkReSendMsgDelayed(config.lastMsgOnStartOut, this, result.start.value, msg);
            } catch (err) {
                node.error(err.message);
                node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                });
            }
        });

        try {
            if (!node.positionConfig) {
                node.error(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'));
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.pos-config-state')
                });
                return null;
            }
            node.status({});
            const result = calcWithinTimes(this, null, config);
            // if an error occurred, will retry in 6 minutes. This will prevent errors on initialization.
            if (setstate(this, result, (config.statusOut || 3), null, true)) {
                node.debug('node is in initialization, retrigger time calculation in 6 min');
                setTimeout(() => {
                    try {
                        const result = calcWithinTimes(this, null, config);
                        setstate(this, result, (config.statusOut || 3));
                    } catch (err) {
                        node.error(err.message);
                        node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                        node.status({
                            fill: 'red',
                            shape: 'ring',
                            text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                        });
                    }
                }, 360000); // 6 Minuten
            }
        } catch (err) {
            node.error(err.message);
            node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
            node.status({
                fill: 'red',
                shape: 'ring',
                text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
            });
        }
    }

    RED.nodes.registerType('within-time-switch', withinTimeSwitchNode);
};