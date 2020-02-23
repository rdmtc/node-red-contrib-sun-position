/********************************************
 * within-time-switch:
 *********************************************/
'use strict';

const util = require('util');
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));

module.exports = function (RED) {
    'use strict';
    /**
     * get the Data for compare Date
     * @param {number} comparetype - type of compare
     * @param {*} msg - message object
     * @param {*} node - node object
     * @returns {*} Date value
     */
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
        if (hlp.isValidDate(dto)) {
            return dto;
        }
        node.error('Error can not get a valid timestamp from ' + id + '="' + value + '"! Will use current timestamp!');
        return new Date();
    }

    /**
     * set the node state
     * @param {*} node - the node Data
     * @param {*} data - the state data
     * @param {boolean} [_onInit] - indicates if the node in in initialisation
     * @returns {boolean}
     */
    function setstate(node, data, _onInit) {
        if (data.error) {
            node.status({
                fill: 'red',
                shape: 'dot',
                text: data.error
            });
            return false;
        }
        if (data.warn) {
            node.status({
                fill: 'yellow',
                shape: 'dot',
                text: data.warn
            });
            return false;
        }
        if (data.start && data.start.error) {
            if (_onInit === true) {
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-init', data.start.error)
                });
                node.warn(RED._('node-red-contrib-sun-position/position-config:errors.warn-init', data.start.error));
                return true;
            }
            hlp.handleError(node, RED._('within-time-switch.errors.error-start-time', { message : data.start.error}), undefined, data.start.error);
        } else if (data.end && data.end.error) {
            if (_onInit === true) {
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-init', data.end.error)
                });
                node.warn(RED._('node-red-contrib-sun-position/position-config:errors.warn-init', data.end.error));
                return true;
            }
            hlp.handleError(node, RED._('within-time-switch.errors.error-end-time', { message : data.end.error}), undefined, data.end.error);
        } else if (data.start && data.start.value && data.end && data.end.value) {
            node.status({
                fill: 'blue',
                shape: 'dot',
                text: '⏵' + node.positionConfig.toTimeString(data.start.value) + data.startSuffix + ' - ⏴' + node.positionConfig.toTimeString(data.end.value) + data.endSuffix
            });
        }
        return false;
    }

    /**
     * calc the start and end times
     * @param {*} node - thje noide data
     * @param {*} msg - the messege object
     * @param {*} config - the configuration
     * @returns {object} containing start and end Dates
     */
    function calcWithinTimes(node, msg, config, now) {
        // node.debug('calcWithinTimes');
        const result = {
            start: {},
            end: {},
            startSuffix: '',
            endSuffix: '',
            altStartTime: (node.propertyStartType !== 'none') && (msg || (node.propertyStartType !== 'msg')),
            altEndTime: (node.propertyEndType !== 'none') && (msg || (node.propertyEndType !== 'msg')),
            valid: false,
            warn: ''
        };

        if (config.timeDays && config.timeDays !== '*' && !config.timeDays.includes(now.getDay())) {
            node.debug('invalid Day config. today=' + now.getDay() + ' timeDays=' + util.inspect(config.timeDays, Object.getOwnPropertyNames(config.timeDays)));
            result.warn = RED._('within-time-switch.errors.invalid-day');
            return result;
        }
        if (config.timeMonths && config.timeMonths !== '*') {
            const mn = config.timeMonths.split(',');
            if (!mn.includes(now.getMonth())) {
                node.debug('invalid Day config. today=' + now.getMonth() + ' timeMonths=' + util.inspect(config.timeMonths, Object.getOwnPropertyNames(config.timeMonths)));
                result.warn = RED._('within-time-switch.errors.invalid-month');
                return result;
            }
        }
        const dateNr = now.getDate();
        if (node.timeOnlyOddDays && (dateNr % 2 === 0)) { // even
            result.warn = RED._('within-time-switch.errors.only-odd-day');
            return result;
        }
        if (node.timeOnlyEvenDays && (dateNr % 2 !== 0)) { // odd
            result.warn = RED._('within-time-switch.errors.only-even-day');
            return result;
        }
        result.valid = true;

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
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
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
            }
        }

        if (result.altStartTime && config.startTimeAltType !== 'none') {
            // node.debug('using alternate start time ' + result.altStartTime + ' - ' + config.startTimeAltType);
            // result.start = node.positionConfig.getTimeProp(node, msg, config.startTimeAltType, config.startTimeAlt, config.startOffsetAltType, config.startOffsetAlt, config.startOffsetAltMultiplier);
            result.start = node.positionConfig.getTimeProp(node, msg, {
                type: config.startTimeAltType,
                value : config.startTimeAlt,
                offsetType : config.startOffsetAltType,
                offset : config.startOffsetAlt,
                multiplier : config.startOffsetAltMultiplier
            });

            result.startSuffix = '⎇ ';
        } else {
            // node.debug('using standard start time ' + result.altStartTime + ' - ' + config.startTimeAltType);
            // result.start = node.positionConfig.getTimeProp(node, msg, config.startTimeType, config.startTime, config.startOffsetType, config.startOffset, config.startOffsetMultiplier);
            result.start = node.positionConfig.getTimeProp(node, msg, {
                type: config.startTimeType,
                value : config.startTime,
                offsetType : config.startOffsetType,
                offset : config.startOffset,
                multiplier : config.startOffsetMultiplier
            });
        }

        if (result.altEndTime && config.endTimeAltType !== 'none') {
            // node.debug('using alternate end time ' + result.altEndTime + ' - ' + config.startTimeAltType);
            // result.end = node.positionConfig.getTimeProp(node, msg, config.endTimeAltType, config.endTimeAlt, config.endOffsetAltType, config.endOffsetAlt, config.endOffsetAltMultiplier);
            result.end = node.positionConfig.getTimeProp(node, msg, {
                type: config.endTimeAltType,
                value : config.endTimeAlt,
                offsetType : config.endOffsetAltType,
                offset : config.endOffsetAlt,
                multiplier : config.endOffsetAltMultiplier
            });
            result.endSuffix = ' ⎇';
        } else {
            // node.debug('using standard end time ' + result.altEndTime + ' - ' + config.startTimeAltType);
            // result.end = node.positionConfig.getTimeProp(node, msg, config.endTimeType, config.endTime, config.endOffsetType, config.endOffset, config.endOffsetMultiplier);
            result.end = node.positionConfig.getTimeProp(node, msg, {
                type: config.endTimeType,
                value : config.endTime,
                offsetType : config.endOffsetType,
                offset : config.endOffset,
                multiplier : config.endOffsetMultiplier
            });
        }

        // node.debug(util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
        return result;
    }

    /**
     * get the schedule time
     * @param {Date} time - time to schedule
     * @returns {number} milliseconds until the defined Date
     */
    function getScheduleTime(time) {
        const now = new Date();
        let millis = time.getTime() - now.getTime();
        while (millis < 10) {
            millis += 86400000; // 24h
        }

        return millis;
    }

    /**
     * check if message should be resend
     * @param {boolean} isActive - define if resend is active
     * @param {*} node - thew node Data
     * @param {Date} time - the time to schedule
     * @param {*} msg - the message object
     */
    function checkReSendMsgDelayed(isActive, node, time, msg) {
        if (node.timeOutObj) {
            clearTimeout(node.timeOutObj);
            node.timeOutObj = null;
        }

        if (!msg.reSendMsgDelayed && isActive && time) {
            node.lastMsgObj = RED.util.cloneMessage(msg);
            node.lastMsgObj.reSendMsgDelayed = false;
            const millis =  Math.min(getScheduleTime(time) + 10, 2147483646);
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
    /**
     * withinTimeSwitchNode
     * @param {*} config - configuration
     */
    function withinTimeSwitchNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize withinTimeSwitchNode ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));

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

        this.timeOnlyEvenDays = config.timeOnlyEvenDays;
        this.timeOnlyOddDays = config.timeOnlyOddDays;

        if (config.timeDays === '') {
            throw new Error('No valid days given! Please check settings!');
        }
        if (config.timeMonths === '') {
            throw new Error('No valid month given! Please check settings!');
        }
        if (this.timeOnlyEvenDays && this.timeOnlyOddDays) {
            this.timeOnlyEvenDays = false;
            this.timeOnlyOddDays = false;
        }

        this.timeOutObj = null;
        this.lastMsgObj = null;
        const node = this;


        this.on('input', function (msg, send, done) {
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) { if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };

            try {
                if (!node.positionConfig) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'));
                    setstate(node, { error: RED._('node-red-contrib-sun-position/position-config:errors.pos-config-state')});
                    return null;
                }
                // this.debug('starting ' + util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity }));
                // this.debug('self ' + util.inspect(this, { colors: true, compact: 10, breakLength: Infinity }));
                // this.debug('config ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));
                const now = getDate(config.tsCompare, msg, node);
                const result = calcWithinTimes(this, msg, config, now);

                if (result.valid && result.start.value && result.end.value) {
                    const startNr = hlp.getTimeNumberUTC(result.start.value);
                    const endNr = hlp.getTimeNumberUTC(result.end.value);
                    const cmpNow = hlp.getTimeNumberUTC(now);
                    setstate(this, result);
                    if (startNr < endNr) {
                        if (cmpNow >= startNr && cmpNow < endNr) {
                            this.debug('in time [1] - send msg to first output ' + result.startSuffix + node.positionConfig.toDateTimeString(now) + result.endSuffix + ' (' + startNr + ' - ' + cmpNow + ' - ' + endNr + ')');
                            send([msg, null]); // this.send([msg, null]);
                            checkReSendMsgDelayed(config.lastMsgOnEndOut, this, result.end.value, msg);
                            done();
                            return null;
                        }
                    } else if (!(cmpNow >= endNr && cmpNow < startNr)) {
                        this.debug('in time [2] - send msg to first output ' + result.startSuffix + node.positionConfig.toDateTimeString(now) + result.endSuffix + ' (' + startNr + ' - ' + cmpNow + ' - ' + endNr + ')');
                        send([msg, null]); // this.send([msg, null]);
                        checkReSendMsgDelayed(config.lastMsgOnEndOut, this, result.end.value, msg);
                        done();
                        return null;
                    }
                } else {
                    setstate(node, result);
                }

                this.debug('out of time - send msg to second output ' + result.startSuffix + node.positionConfig.toDateTimeString(now) + result.endSuffix);
                send([null, msg]); // this.send([null, msg]);
                checkReSendMsgDelayed(config.lastMsgOnStartOut, this, result.start.value, msg);
                done();
                return null;
            } catch (err) {
                node.log(err.message);
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                setstate(node, { error: RED._('node-red-contrib-sun-position/position-config:errors.error-title') });
                done('internal error within-time-switch:' + err.message, msg);
            }
            return null;
        });

        try {
            if (!node.positionConfig) {
                node.error(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'));
                setstate(node, { error: RED._('node-red-contrib-sun-position/position-config:errors.pos-config-state') });
                return null;
            }
            node.status({});
            const result = calcWithinTimes(this, null, config, new Date());
            // if an error occurred, will retry in 6 minutes. This will prevent errors on initialization.
            if (setstate(this, result, true)) {
                node.debug('node is in initialization, retrigger time calculation in 6 min');
                setTimeout(() => {
                    try {
                        const result = calcWithinTimes(this, null, config, new Date());
                        setstate(this, result);
                    } catch (err) {
                        node.error(err.message);
                        node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                        setstate(node, { error: RED._('node-red-contrib-sun-position/position-config:errors.error-title') });
                    }
                }, 360000); // 6 Minuten
            }
        } catch (err) {
            node.error(err.message);
            node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
            setstate(node, { error: RED._('node-red-contrib-sun-position/position-config:errors.error-title') });
        }
        return null;
    }

    RED.nodes.registerType('within-time-switch', withinTimeSwitchNode);
};