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
    function getIntDate(comparetype, msg, node) {
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
     * @returns {boolean}
     */
    function setstate(node, data) {
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
            hlp.handleError(node, RED._('within-time-switch.errors.error-start-time', { message : data.start.error}), undefined, data.start.error);
        } else if (data.end && data.end.error) {
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
    function calcWithinTimes(node, msg, config, dNow) {
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

        if (config.timeDays && !config.timeDays.includes(dNow.getDay())) {
            node.debug('invalid Day config. today=' + dNow.getDay() + ' timeDays=' + util.inspect(config.timeDays, Object.getOwnPropertyNames(config.timeDays)));
            result.warn = RED._('within-time-switch.errors.invalid-day');
            return result;
        }
        if (config.timeMonths && !config.timeMonths.includes(dNow.getMonth())) {
            node.debug('invalid Month config. today=' + dNow.getMonth() + ' timeMonths=' + util.inspect(config.timeMonths, Object.getOwnPropertyNames(config.timeMonths)));
            result.warn = RED._('within-time-switch.errors.invalid-month');
            return result;
        }
        if (config.timedatestart || config.timedateend) {
            let dStart,dEnd;
            if (config.timedatestart) {
                dStart = new Date(config.timedatestart);
                dStart.setFullYear(dNow.getFullYear());
                dStart.setHours(0, 0, 0, 1);
            } else {
                dStart = new Date(dNow.getFullYear(), 0, 0, 0, 0, 0, 1);
            }
            if (config.timedateend) {
                dEnd = new Date(config.timedateend);
                dEnd.setFullYear(dNow.getFullYear());
                dEnd.setHours(23, 59, 59, 999);
            } else {
                dEnd = new Date(dNow.getFullYear(), 11, 31, 23, 59, 59, 999);
            }
            if (dStart < dEnd) {
                // in the current year - e.g. 6.4. - 7.8.
                if (dNow < dStart || dNow > dEnd) {
                    result.warn = RED._('within-time-switch.errors.invalid-daterange');
                    return result;
                }
            } else {
                // switch between year from end to start - e.g. 2.11. - 20.3.
                if (dNow < dStart && dNow > dEnd) {
                    result.warn = RED._('within-time-switch.errors.invalid-daterange');
                    return result;
                }
            }
        }
        const dateNr = dNow.getDate();
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
                result.altStartTime = node.positionConfig.comparePropValue(node, msg, { type:node.propertyStartType, value:node.propertyStart},
                    node.propertyStartOperator, {type: node.propertyStartThresholdType, value:node.propertyStartThresholdValue});
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
                result.altEndTime = node.positionConfig.comparePropValue(node, msg, { type:node.propertyEndType, value:node.propertyEnd},
                    node.propertyEndOperator, {type:node.propertyEndThresholdType, value:node.propertyEndThresholdValue});
            } catch (err) {
                result.altEndTime = false;
                hlp.handleError(node, RED._('within-time-switch.errors.invalid-propertyEnd-type', {
                    type: node.propertyEndType,
                    value: node.propertyEnd
                }), err);
            }
        }

        if (result.altStartTime && config.startTimeAltType !== 'none') {
            // node.debug(`using alternate start time  config.startTimeType=${ config.startTimeType},config.startTime=${ config.startTime}, result.altStartTime=${ result.altStartTime}, config.startTimeAltType=${ config.startTimeAltType}`);
            result.start = node.positionConfig.getTimeProp(node, msg, {
                type: config.startTimeAltType,
                value : config.startTimeAlt,
                offsetType : config.startOffsetAltType,
                offset : config.startOffsetAlt,
                multiplier : config.startOffsetAltMultiplier
            });

            result.startSuffix = '⎇ ';
        } else if (msg || (node.startTimeType !== 'msg')) {
            // node.debug(`using standard start time  config.startTimeType=${ config.startTimeType},config.startTime=${ config.startTime}, result.altStartTime=${ result.altStartTime}, config.startTimeAltType=${ config.startTimeAltType}`);
            result.start = node.positionConfig.getTimeProp(node, msg, {
                type: config.startTimeType,
                value : config.startTime,
                offsetType : config.startOffsetType,
                offset : config.startOffset,
                multiplier : config.startOffsetMultiplier
            });
        }

        if (result.altEndTime && config.endTimeAltType !== 'none') {
            // node.debug(`using alternate end time  config.endTimeType=${ config.endTimeType},config.endTime=${ config.endTime}, result.altEndTime=${ result.altEndTime}, config.endTimeAltType=${ config.endTimeAltType}`);
            result.end = node.positionConfig.getTimeProp(node, msg, {
                type: config.endTimeAltType,
                value : config.endTimeAlt,
                offsetType : config.endOffsetAltType,
                offset : config.endOffsetAlt,
                multiplier : config.endOffsetAltMultiplier
            });
            result.endSuffix = ' ⎇';
        } else if (msg || (node.endTimeType !== 'msg')) {
            // node.debug(`using standard end time  config.endTimeType=${ config.endTimeType},config.endTime=${ config.endTime}, result.altEndTime=${ result.altEndTime}, config.endTimeAltType=${ config.endTimeAltType}`);
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
        } else if (!config.timeDays || config.timeDays === '*') {
            config.timeDays = null;
        } else {
            config.timeDays = config.timeDays.split(',');
            config.timeDays = config.timeDays.map( e => parseInt(e) );
        }

        if (config.timeMonths === '') {
            throw new Error('No valid month given! Please check settings!');
        } else if (!config.timeMonths || config.timeMonths === '*') {
            config.timeMonths = null;
        } else {
            config.timeMonths = config.timeMonths.split(',');
            config.timeMonths = config.timeMonths.map( e => parseInt(e) );
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
                node.debug('--------- within-time-switch - input');
                if (!node.positionConfig) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'));
                    setstate(node, { error: RED._('node-red-contrib-sun-position/position-config:errors.pos-config-state')});
                    return null;
                }
                // this.debug('starting ' + util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity }));
                // this.debug('self ' + util.inspect(this, { colors: true, compact: 10, breakLength: Infinity }));
                // this.debug('config ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));
                const now = getIntDate(config.tsCompare, msg, node);
                const result = calcWithinTimes(this, msg, config, now);

                if (result.valid && result.start.value && result.end.value) {
                    msg.withinTimeStart = result.start;
                    msg.withinTimeEnd = result.end;
                    msg.withinTimeStart.id = hlp.getTimeNumberUTC(result.start.value);
                    msg.withinTimeEnd.id = hlp.getTimeNumberUTC(result.end.value);
                    const cmpNow = hlp.getTimeNumberUTC(now);
                    setstate(this, result);
                    if (msg.withinTimeStart.id < msg.withinTimeEnd.id) {
                        if (cmpNow >= msg.withinTimeStart.id && cmpNow < msg.withinTimeEnd.id) {
                            msg.withinTime = true;
                            this.debug('in time [1] - send msg to first output ' + result.startSuffix +
                                node.positionConfig.toDateTimeString(now) + result.endSuffix + ' (' + msg.withinTimeStart.id + ' - ' + cmpNow + ' - ' + msg.withinTimeEnd.id + ')');
                            send([msg, null]); // this.send([msg, null]);
                            done();
                            return null;
                        }
                    } else if (!(cmpNow >= msg.withinTimeEnd.id && cmpNow < msg.withinTimeStart.id)) {
                        msg.withinTime = true;
                        this.debug('in time [2] - send msg to first output ' + result.startSuffix +
                            node.positionConfig.toDateTimeString(now) + result.endSuffix + ' (' + msg.withinTimeStart.id + ' - ' + cmpNow + ' - ' + msg.withinTimeEnd.id + ')');
                        send([msg, null]); // this.send([msg, null]);
                        done();
                        return null;
                    }
                } else {
                    setstate(node, result);
                }
                msg.withinTime = false;
                this.debug('out of time - send msg to second output ' + result.startSuffix + node.positionConfig.toDateTimeString(now) + result.endSuffix);
                send([null, msg]); // this.send([null, msg]);
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
        } catch (err) {
            node.error(err.message);
            node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
            setstate(node, { error: RED._('node-red-contrib-sun-position/position-config:errors.error-title') });
        }
        return null;
    }

    RED.nodes.registerType('within-time-switch', withinTimeSwitchNode);
};