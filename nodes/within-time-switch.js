/*
 * This code is licensed under the Apache License Version 2.0.
 *
 * Copyright (c) 2022 Robert Gester
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 */

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
        const dto = new Date(value);
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
     * @param {Date|null} dNow - the current time
     * @returns {object} containing start and end Dates
     */
    function calcWithinTimes(node, msg, dNow) {
        // node.debug('calcWithinTimes');
        const result = {
            start: {},
            end: {},
            startSuffix: '',
            endSuffix: '',
            altStartTime: (node.propertyStart.type !== 'none') && (msg || (node.propertyStart.type !== 'msg')),
            altEndTime: (node.propertyEnd.type !== 'none') && (msg || (node.propertyEnd.type !== 'msg')),
            valid: false,
            warn: ''
        };

        if (node.timeRestrictions.type !== 'none') {
            try {
                if (node.timeRestrictions.type === 'jsonata') {
                    if (!node.timeRestrictions.expr) {
                        node.timeRestrictions.expr = this.getJSONataExpression(node, node.timeRestrictions.value);
                    }
                    node.timeRestrictions.data = RED.util.evaluateJSONataExpression(node.timeRestrictions.expr, msg);
                } else {
                    node.timeRestrictions.data = RED.util.evaluateNodeProperty(node.timeRestrictions.value, node.timeRestrictions.type, node, msg);
                }
                if (typeof node.timeRestrictions.data === 'object') {
                    // node.debug(util.inspect(node.timeRestrictions, Object.getOwnPropertyNames(node.timeRestrictions)));
                    if (Object.prototype.hasOwnProperty.call(node.timeRestrictions.data,'days')) {
                        node.timeDays = node.timeRestrictions.data.days;
                    } else {
                        delete node.timeDays;
                    }
                    if (Object.prototype.hasOwnProperty.call(node.timeRestrictions.data,'months')) {
                        node.timeMonths = node.timeRestrictions.data.months;
                    } else {
                        delete node.timeMonths;
                    }
                    if (Object.prototype.hasOwnProperty.call(node.timeRestrictions.data,'startDate') && node.timeRestrictions.data.startDate !== '') {
                        node.timeStartDate = node.timeRestrictions.data.startDate;
                    } else {
                        delete node.timeStartDate;
                    }
                    if (Object.prototype.hasOwnProperty.call(node.timeRestrictions.data,'endDate') && node.timeRestrictions.data.endDate !== '') {
                        node.timeEndDate = node.timeRestrictions.data.endDate;
                    } else {
                        delete node.timeEndDate;
                    }
                    if (Object.prototype.hasOwnProperty.call(node.timeRestrictions.data,'onlyOddDays')) {
                        node.timeOnlyOddDays = node.timeRestrictions.data.onlyOddDays;
                    } else {
                        delete node.timeOnlyOddDays;
                    }
                    if (Object.prototype.hasOwnProperty.call(node.timeRestrictions.data,'onlyEvenDays')) {
                        node.timeOnlyEvenDays = node.timeRestrictions.data.onlyEvenDays;
                    } else {
                        delete node.timeOnlyEvenDays;
                    }
                    if (Object.prototype.hasOwnProperty.call(node.timeRestrictions.data,'onlyOddWeeks')) {
                        node.timeOnlyOddWeeks = node.timeRestrictions.data.onlyOddWeeks;
                    } else {
                        delete node.timeOnlyOddWeeks;
                    }
                    if (Object.prototype.hasOwnProperty.call(node.timeRestrictions.data,'onlyEvenWeeks')) {
                        node.timeOnlyEvenWeeks = node.timeRestrictions.data.onlyEvenWeeks;
                    } else {
                        delete node.timeOnlyEvenWeeks;
                    }
                }
            } catch (err) {
                node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.error(err);
            }
        }
        if ((typeof node.timeDays !== 'undefined') && !node.timeDays.includes(dNow.getDay())) {
            node.debug('invalid Day config. today=' + dNow.getDay() + ' timeDays=' + util.inspect(node.timeDays, Object.getOwnPropertyNames(node.timeDays)));
            result.warn = RED._('within-time-switch.errors.invalid-day');
            return result;
        }
        if ((typeof node.timeMonths !== 'undefined') && !node.timeMonths.includes(dNow.getMonth())) {
            node.debug('invalid Month config. today=' + dNow.getMonth() + ' timeMonths=' + util.inspect(node.timeMonths, Object.getOwnPropertyNames(node.timeMonths)));
            result.warn = RED._('within-time-switch.errors.invalid-month');
            return result;
        }
        if ((typeof node.timeStartDate !== 'undefined') || (typeof node.timeEndDate !== 'undefined')) {
            let dStart,dEnd;
            if (typeof node.timeStartDate !== 'undefined') {
                dStart = new Date(node.timeStartDate);
                dStart.setFullYear(dNow.getFullYear());
                dStart.setHours(0, 0, 0, 1);
            } else {
                dStart = new Date(dNow.getFullYear(), 0, 0, 0, 0, 0, 1);
            }
            if (typeof node.timeEndDate !== 'undefined') {
                dEnd = new Date(node.timeEndDate);
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
        if (node.timeOnlyOddWeeks) {
            const weekNr = hlp.getWeekOfYear(dNow)[1];
            if (weekNr % 2 === 0) { // even
                result.warn = RED._('within-time-switch.errors.only-odd-week');
                return result;
            }
        }
        if (node.timeOnlyEvenWeeks) {
            const weekNr = hlp.getWeekOfYear(dNow[1]);
            if (weekNr % 2 !== 0) { // odd
                result.warn = RED._('within-time-switch.errors.only-even-week');
                return result;
            }
        }
        result.valid = true;

        if (result.altStartTime) {
            // node.debug('alternate start times enabled ' + node.propertyStart.type + '.' + node.propertyStart.value);
            try {
                result.altStartTime = node.positionConfig.comparePropValue(node, msg, node.propertyStart,
                    node.propertyStartOperator, node.propertyStartThreshold, false, dNow);
            } catch (err) {
                result.altStartTime = false;
                hlp.handleError(node, RED._('within-time-switch.errors.invalid-propertyStart-type', node.propertyStart), err);
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
            }
        }

        if (result.altStartTime) {
            // node.debug(`using alternate start time node.timeStart=${ util.inspect(node.timeStart, Object.getOwnPropertyNames(node.timeStart))}, config.timeStartAlt=${ util.inspect(node.timeStartAlt, Object.getOwnPropertyNames(node.timeStartAlt))}`);
            result.start = node.positionConfig.getTimeProp(node, msg, node.timeStartAlt);

            result.startSuffix = '⎇ ';
        } else if (msg || (node.timeStart.type !== 'msg')) {
            // node.debug(`using alternate start time node.timeStart=${ util.inspect(node.timeStart, Object.getOwnPropertyNames(node.timeStart))}`);
            result.start = node.positionConfig.getTimeProp(node, msg, node.timeStart);
        }

        if (result.altEndTime) {
            // node.debug('alternate end times enabled ' + node.propertyEnd.type + '.' + node.propertyEnd.value);
            try {
                result.altEndTime = node.positionConfig.comparePropValue(node, msg, node.propertyEnd,
                    node.propertyEndOperator, node.propertyEndThreshold, false, dNow);
            } catch (err) {
                result.altEndTime = false;
                hlp.handleError(node, RED._('within-time-switch.errors.invalid-propertyEnd-type', node.propertyEnd), err);
            }
        }

        if (result.altEndTime) {
            // node.debug(`using alternate start time node.timeEnd=${ util.inspect(node.timeEnd, Object.getOwnPropertyNames(node.timeEnd))}, config.timeEndAlt=${ util.inspect(node.timeEndAlt, Object.getOwnPropertyNames(node.timeEndAlt))}`);
            result.end = node.positionConfig.getTimeProp(node, msg, node.timeEndAlt);
            result.endSuffix = ' ⎇';
        } else if (msg || (node.timeEnd.type !== 'msg')) {
            // node.debug(`using alternate start time node.timeEnd=${ util.inspect(node.timeEnd, Object.getOwnPropertyNames(node.timeEnd))}`);
            result.end = node.positionConfig.getTimeProp(node, msg, node.timeEnd);
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
        if (!this.positionConfig) {
            node.status({
                fill: 'red',
                shape: 'dot',
                text: 'Node not properly configured!!'
            });
            return null;
        }
        this.timeStart = {
            type: config.startTimeType,
            value : config.startTime,
            offsetType : config.startOffsetType,
            offset : config.startOffset,
            multiplier : config.startOffsetMultiplier
        };

        this.timeEnd = {
            type: config.endTimeType,
            value : config.endTime,
            offsetType : config.endOffsetType,
            offset : config.endOffset,
            multiplier : config.endOffsetMultiplier
        };

        this.timeStartAlt = {
            type: config.startTimeAltType || 'none',
            value : config.startTimeAlt,
            offsetType : config.startOffsetAltType,
            offset : config.startOffsetAlt,
            multiplier : config.startOffsetAltMultiplier
        };

        this.propertyStartOperator = config.propertyStartCompare || 'true';
        this.propertyStart = {
            type  : config.propertyStartType || 'none',
            value : config.propertyStart || ''
        };
        this.propertyStartThreshold = {
            type  : config.propertyStartThresholdType || 'none',
            value : config.propertyStartThreshold || ''
        };
        if (this.positionConfig && this.propertyStart.type === 'jsonata') {
            try {
                this.propertyStart.expr = this.positionConfig.getJSONataExpression(this, this.propertyStart.value);
            } catch (err) {
                this.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                this.propertyStart.expr = null;
            }
        }
        if (this.propertyStart.type === 'none' || this.timeStartAlt.type === 'none') {
            this.propertyStart.type = 'none';
            delete this.timeStartAlt;
        }

        this.timeEndAlt = {
            type: config.endTimeAltType || 'none',
            value : config.endTimeAlt,
            offsetType : config.endOffsetAltType,
            offset : config.endOffsetAlt,
            multiplier : config.endOffsetAltMultiplier
        };

        this.propertyEndOperator = config.propertyEndCompare || 'true';
        this.propertyEnd = {
            type  : config.propertyEndType || 'none',
            value : config.propertyEnd || ''
        };
        this.propertyEndThreshold = {
            type  : config.propertyEndThresholdType || 'none',
            value : config.propertyEndThreshold || ''
        };
        if (this.positionConfig && this.propertyEnd.type === 'jsonata') {
            try {
                this.propertyEnd.expr = this.positionConfig.getJSONataExpression(this, this.propertyEnd.value);
            } catch (err) {
                this.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                this.propertyEnd.expr = null;
            }
        }
        if (this.propertyEnd.type === 'none' || this.timeEndAlt.type === 'none') {
            this.propertyEnd.type = 'none';
            delete this.timeEndAlt;
        }

        this.timeRestrictions = {
            type: config.timeRestrictionsType || 'none',
            value : config.timeRestrictions
        };
        if (this.timeRestrictions.type === 'jsonata') {
            try {
                this.timeRestrictions.expr = this.positionConfig.getJSONataExpression(this, this.timeRestrictions.value);
            } catch (err) {
                this.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                this.timeRestrictions.expr = null;
            }
        }

        if (this.timeRestrictions.type === 'none') { // none means limitations would defined internal!
            this.timeOnlyEvenDays = hlp.isTrue(config.timeOnlyEvenDays);
            this.timeOnlyOddDays = hlp.isTrue(config.timeOnlyOddDays);
            this.timeOnlyEvenWeeks = hlp.isTrue(config.timeOnlyEvenWeeks);
            this.timeOnlyOddWeeks = hlp.isTrue(config.timeOnlyOddWeeks);

            if (this.timeOnlyEvenDays && this.timeOnlyOddDays) {
                this.timeOnlyEvenDays = false;
                this.timeOnlyOddDays = false;
            }
            if (this.timeOnlyEvenWeeks && this.timeOnlyOddWeeks) {
                this.timeOnlyEvenWeeks = false;
                this.timeOnlyOddWeeks = false;
            }

            if (typeof config.timedatestart !== 'undefined' && config.timedatestart !== '') {
                this.timeStartDate = new Date(config.timedatestart);
            }
            if (typeof config.timedateend !== 'undefined' && config.timedateend !== '') {
                this.timeEndDate = new Date(config.timedateend);
            }

            if (config.timeDays === '') {
                throw new Error('No valid days given! Please check settings!');
            } else if (!config.timeDays || config.timeDays === '*') {
                // config.timeDays = null;
                delete this.timeDays;
            } else {
                this.timeDays = config.timeDays.split(',');
                this.timeDays = this.timeDays.map( e => parseInt(e) );
            }

            if (config.timeMonths === '') {
                throw new Error('No valid month given! Please check settings!');
            } else if (!config.timeMonths || config.timeMonths === '*') {
                // config.timeMonths = null;
                delete this.timeMonths;
            } else {
                this.timeMonths = config.timeMonths.split(',');
                this.timeMonths = this.timeMonths.map( e => parseInt(e) );
            }
        }
        this.withinTimeValue = {
            value       : config.withinTimeValue ? config.withinTimeValue : 'true',
            type        : config.withinTimeValueType ? config.withinTimeValueType : 'msgInput'
        };
        if (this.withinTimeValue.type === 'input') { this.withinTimeValue.type = 'msgInput'; }
        this.outOfTimeValue = {
            value       : config.outOfTimeValue ? config.outOfTimeValue : 'false',
            type        : config.outOfTimeValueType ? config.outOfTimeValueType : 'msgInput'
        };
        if (this.outOfTimeValue.type === 'input') { this.outOfTimeValue.type = 'msgInput'; }

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
                const dNow = getIntDate(config.tsCompare, msg, node);
                const result = calcWithinTimes(this, msg, dNow);

                if (result.valid && result.start.value && result.end.value) {
                    msg.withinTimeStart = result.start;
                    msg.withinTimeEnd = result.end;
                    msg.withinTimeStart.id = hlp.getTimeNumberUTC(result.start.value);
                    msg.withinTimeEnd.id = hlp.getTimeNumberUTC(result.end.value);
                    const cmpNow = hlp.getTimeNumberUTC(dNow);
                    setstate(node, result);
                    if (msg.withinTimeStart.id < msg.withinTimeEnd.id) {
                        if (cmpNow >= msg.withinTimeStart.id && cmpNow < msg.withinTimeEnd.id) {
                            msg.withinTime = true;
                            this.debug('in time [1] - send msg to first output ' + result.startSuffix +
                                node.positionConfig.toDateTimeString(dNow) + result.endSuffix + ' (' + msg.withinTimeStart.id + ' - ' + cmpNow + ' - ' + msg.withinTimeEnd.id + ')');
                            if (node.withinTimeValue.type === 'msgInput') {
                                send([msg, null]); // within time
                            } else {
                                const resultMsg = RED.util.cloneMessage(msg);
                                resultMsg.payload = node.positionConfig.getOutDataProp(node, msg, node.withinTimeValue, dNow);
                                send([resultMsg, null]); // within time
                            }
                            done();
                            return null;
                        }
                    } else if (!(cmpNow >= msg.withinTimeEnd.id && cmpNow < msg.withinTimeStart.id)) {
                        msg.withinTime = true;
                        this.debug('in time [2] - send msg to first output ' + result.startSuffix +
                            node.positionConfig.toDateTimeString(dNow) + result.endSuffix + ' (' + msg.withinTimeStart.id + ' - ' + cmpNow + ' - ' + msg.withinTimeEnd.id + ')');
                        if (node.withinTimeValue.type === 'msgInput') {
                            send([msg, null]); // within time
                        } else {
                            const resultMsg = RED.util.cloneMessage(msg);
                            resultMsg.payload = node.positionConfig.getOutDataProp(node, msg, node.withinTimeValue, dNow);
                            send([resultMsg, null]); // within time
                        }
                        done();
                        return null;
                    }
                } else {
                    setstate(node, result);
                }
                msg.withinTime = false;
                this.debug('out of time - send msg to second output ' + result.startSuffix + node.positionConfig.toDateTimeString(dNow) + result.endSuffix);
                if (node.outOfTimeValue.type === 'msgInput') {
                    send([null, msg]); // out of time
                } else {
                    const resultMsg = RED.util.cloneMessage(msg);
                    resultMsg.payload = node.positionConfig.getOutDataProp(node, msg, node.outOfTimeValue, dNow);
                    send([null, resultMsg]); // out of time
                }
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