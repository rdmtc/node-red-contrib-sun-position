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
/** --- Type Defs ---
  * @typedef {import('./types/typedefs.js').runtimeRED} runtimeRED
  * @typedef {import('./types/typedefs.js').runtimeNode} runtimeNode
  * @typedef {import('./types/typedefs.js').runtimeNodeConfig} runtimeNodeConfig
  * @typedef {import("./lib/dateTimeHelper.js").ITimeObject} ITimeObject
  * @typedef {import("./lib/dateTimeHelper.js").ILimitationsObj} ILimitationsObj
  * @typedef {import("./10-position-config.js").ITypedValue} ITypedValue
  * @typedef {import("./10-position-config.js").IValuePropertyType} IValuePropertyType
  * @typedef {import("./10-position-config.js").ITimePropertyType} ITimePropertyType
  * @typedef {import("./10-position-config.js").IPositionConfigNode} IPositionConfigNode
  */

/**
 * @typedef {Object} IWithinTimeNodeInstance Extensions for the nodeInstance object type
 * @property {IPositionConfigNode} positionConfig    -   tbd
 *
 * @property {ITimePropertyType} timeStart     -   ??
 * @property {ITimePropertyType} timeStartAlt     -   ??
 * @property {IValuePropertyType} propertyStart     -   ??
 * @property {string} propertyStartOperator     -   ??
 * @property {IValuePropertyType} propertyStartThreshold     -   ??
 *
 * @property {ITimePropertyType} timeEnd     -   ??
 * @property {ITimePropertyType} timeEndAlt     -   ??
 * @property {IValuePropertyType} propertyEnd     -   ??
 * @property {string} propertyEndOperator     -   ??
 * @property {IValuePropertyType} propertyEndThreshold     -   ??
 *
 * @property {IValuePropertyType} timeRestrictions     -   ??
 * @property {ITypedValue} withinTimeValue     -   ??
 * @property {ITypedValue} outOfTimeValue     -   ??
 *
 * @property {boolean} timeOnlyEvenDays     -   ??
 * @property {boolean} timeOnlyOddDays     -   ??
 * @property {boolean} timeOnlyEvenWeeks     -   ??
 * @property {boolean} timeOnlyOddWeeks     -   ??
 * @property {Date} timeStartDate     -   ??
 * @property {Date} timeEndDate     -   ??
 * @property {Array.<number>} timeDays     -   ??
 * @property {Array.<number>} timeMonths     -   ??
 *
 *
 * @property {NodeJS.Timer} timeOutObj     -   ??
 * @property {*} lastMsgObj     -   ??
 *
 * @property {number} tsCompare     -   ??
 */

/**
 * @typedef {IWithinTimeNodeInstance & runtimeNode} IWithinTimeNode Combine nodeInstance with additional, optional functions
 */
/******************************************************************************************/
/** Export the function that defines the node
 * @type {runtimeRED} */
module.exports = function (/** @type {runtimeRED} */ RED) {
    'use strict';

    const util = require('util');
    const path = require('path');

    const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
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
            case 1:
                id = 'msg.ts';
                value = msg.ts;
                break;
            case 2:
                id = 'msg.lc';
                value = msg.lc;
                break;
            case 3:
                id = 'msg.time';
                value = msg.time;
                break;
            case 4:
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
    function setstate(node, data, reverse) {
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
            if (reverse) {
                node.status({
                    fill: 'blue',
                    shape: 'dot',
                    text: node.positionConfig.toTimeString(data.start.value) + data.startSuffix + '⏵ ~ 🌃 ~ ⏴' + node.positionConfig.toTimeString(data.end.value) + data.endSuffix
                });
            } else {
                node.status({
                    fill: 'blue',
                    shape: 'dot',
                    text: '⏵' + node.positionConfig.toTimeString(data.start.value) + data.startSuffix + ' - ⏴' + node.positionConfig.toTimeString(data.end.value) + data.endSuffix
                });
            }
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
                node.debug(util.inspect(err));
                node.error(err);
            }
        }
        if ((typeof node.timeDays !== 'undefined') && !node.timeDays.includes(dNow.getDay())) {
            node.debug('invalid Day config. today=' + dNow.getDay() + ' timeDays=' + util.inspect(node.timeDays));
            result.warn = RED._('within-time-switch.errors.invalid-day');
            return result;
        }
        if ((typeof node.timeMonths !== 'undefined') && !node.timeMonths.includes(dNow.getMonth())) {
            node.debug('invalid Month config. today=' + dNow.getMonth() + ' timeMonths=' + util.inspect(node.timeMonths));
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
                node.log(util.inspect(err));
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

    /******************************************************************************************/
    /**
     * standard Node-Red Node handler for the withinTimeSwitchNode
     * @param {*} config the Node-Red Configuration property of the Node
     */
    function withinTimeSwitchNode(config) {
        RED.nodes.createNode(this, config);
        /** Copy 'this' object in case we need it in context of callbacks of other functions.
         * @type {IWithinTimeNode}
         */
        // @ts-ignore
        const node = this;
        // Retrieve the config node
        node.positionConfig = RED.nodes.getNode(config.positionConfig);
        // node.debug('initialize withinTimeSwitchNode ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));
        if (!node.positionConfig) {
            node.error(RED._('node-red-contrib-sun-position/position-config:errors.config-missing'));
            setstate(node, { error: RED._('node-red-contrib-sun-position/position-config:errors.config-missing-state') });
            return;
        } else if (node.positionConfig.checkNode(
            error => {
                node.error(error);
                node.status({fill: 'red', shape: 'dot', text: error });
            }, false)) {
            return;
        }

        node.timeStart = {
            type: config.startTimeType,
            value : config.startTime,
            offsetType : config.startOffsetType,
            offset : config.startOffset,
            multiplier : config.startOffsetMultiplier,
            next : false
        };

        node.timeEnd = {
            type: config.endTimeType,
            value : config.endTime,
            offsetType : config.endOffsetType,
            offset : config.endOffset,
            multiplier : config.endOffsetMultiplier,
            next : false
        };

        node.timeStartAlt = {
            type: config.startTimeAltType || 'none',
            value : config.startTimeAlt,
            offsetType : config.startOffsetAltType,
            offset : config.startOffsetAlt,
            multiplier : config.startOffsetAltMultiplier,
            next : false
        };

        node.propertyStart = {
            type  : config.propertyStartType || 'none',
            value : config.propertyStart || ''
        };
        if (node.propertyStart.type === 'none' || node.timeStartAlt.type === 'none') {
            node.propertyStart.type = 'none';
            delete node.timeStartAlt;
        } else {
            node.propertyStartOperator = config.propertyStartCompare || 'true';
            node.propertyStartThreshold = {
                type  : config.propertyStartThresholdType || 'none',
                value : config.propertyStartThreshold || ''
            };
            if (node.positionConfig && node.propertyStart.type === 'jsonata') {
                try {
                    node.propertyStart.expr = node.positionConfig.getJSONataExpression(node, node.propertyStart.value);
                } catch (err) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                    node.propertyStart.expr = null;
                }
            }
        }

        node.timeEndAlt = {
            type: config.endTimeAltType || 'none',
            value : config.endTimeAlt,
            offsetType : config.endOffsetAltType,
            offset : config.endOffsetAlt,
            multiplier : config.endOffsetAltMultiplier,
            next : false
        };

        node.propertyEnd = {
            type  : config.propertyEndType || 'none',
            value : config.propertyEnd || ''
        };
        if (node.propertyEnd.type === 'none' || node.timeEndAlt.type === 'none') {
            node.propertyEnd.type = 'none';
            delete node.timeEndAlt;
        } else {
            node.propertyEndOperator = config.propertyEndCompare || 'true';
            node.propertyEndThreshold = {
                type  : config.propertyEndThresholdType || 'none',
                value : config.propertyEndThreshold || ''
            };
            if (node.positionConfig && node.propertyEnd.type === 'jsonata') {
                try {
                    node.propertyEnd.expr = node.positionConfig.getJSONataExpression(node, node.propertyEnd.value);
                } catch (err) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                    node.propertyEnd.expr = null;
                }
            }
        }

        node.timeRestrictions = {
            type: config.timeRestrictionsType || 'none',
            value : config.timeRestrictions
        };
        if (node.timeRestrictions.type === 'jsonata') {
            try {
                node.timeRestrictions.expr = node.positionConfig.getJSONataExpression(node, node.timeRestrictions.value);
            } catch (err) {
                node.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                node.timeRestrictions.expr = null;
            }
        }

        if (node.timeRestrictions.type === 'none') { // none means limitations would defined internal!
            node.timeOnlyEvenDays = hlp.isTrue(config.timeOnlyEvenDays);
            node.timeOnlyOddDays = hlp.isTrue(config.timeOnlyOddDays);
            node.timeOnlyEvenWeeks = hlp.isTrue(config.timeOnlyEvenWeeks);
            node.timeOnlyOddWeeks = hlp.isTrue(config.timeOnlyOddWeeks);

            if (node.timeOnlyEvenDays && node.timeOnlyOddDays) {
                node.timeOnlyEvenDays = false;
                node.timeOnlyOddDays = false;
            }
            if (node.timeOnlyEvenWeeks && node.timeOnlyOddWeeks) {
                node.timeOnlyEvenWeeks = false;
                node.timeOnlyOddWeeks = false;
            }

            if (typeof config.timedatestart !== 'undefined' && config.timedatestart !== '') {
                node.timeStartDate = new Date(config.timedatestart);
            }
            if (typeof config.timedateend !== 'undefined' && config.timedateend !== '') {
                node.timeEndDate = new Date(config.timedateend);
            }

            if (config.timeDays === '') {
                throw new Error('No valid days given! Please check settings!');
            } else if (!config.timeDays || config.timeDays === '*') {
                // config.timeDays = null;
                delete node.timeDays;
            } else {
                const tmp = config.timeDays.split(',');
                node.timeDays = tmp.map( e => parseInt(e) );
            }

            if (config.timeMonths === '') {
                throw new Error('No valid month given! Please check settings!');
            } else if (!config.timeMonths || config.timeMonths === '*') {
                // config.timeMonths = null;
                delete node.timeMonths;
            } else {
                const tmp = config.timeMonths.split(',');
                node.timeMonths = tmp.map( e => parseInt(e) );
            }
        }
        node.withinTimeValue = {
            value       : config.withinTimeValue ? config.withinTimeValue : 'true',
            type        : config.withinTimeValueType ? config.withinTimeValueType : 'msgInput'
        };
        if (node.withinTimeValue.type === 'input') { node.withinTimeValue.type = 'msgInput'; }
        node.outOfTimeValue = {
            value       : config.outOfTimeValue ? config.outOfTimeValue : 'false',
            type        : config.outOfTimeValueType ? config.outOfTimeValueType : 'msgInput'
        };
        if (node.outOfTimeValue.type === 'input') { node.outOfTimeValue.type = 'msgInput'; }

        node.timeOutObj = null;
        node.lastMsgObj = null;
        node.tsCompare = parseInt(config.tsCompare) || 0;

        node.on('input', function (msg, send, done) {
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) { if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };

            try {
                node.debug('--------- within-time-switch - input');
                if (!node.positionConfig) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.config-missing'));
                    node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.config-missing-state') });
                    return null;
                }
                // this.debug('starting ' + util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity }));
                // this.debug('self ' + util.inspect(this, { colors: true, compact: 10, breakLength: Infinity }));
                const dNow = getIntDate(node.tsCompare, msg, node);
                const result = calcWithinTimes(this, msg, dNow);

                if (result.valid && result.start.value && result.end.value) {
                    msg.withinTimeStart = result.start;
                    msg.withinTimeEnd = result.end;
                    msg.withinTimeStart.id = hlp.getTimeNumberUTC(result.start.value);
                    msg.withinTimeEnd.id = hlp.getTimeNumberUTC(result.end.value);
                    const cmpNow = hlp.getTimeNumberUTC(dNow);
                    if (msg.withinTimeStart.id < msg.withinTimeEnd.id) {
                        setstate(node, result, false);
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
                        setstate(node, result, true);
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
                    } else {
                        setstate(node, result, true);
                    }
                } else {
                    setstate(node, result, false);
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
                node.log(util.inspect(err));
                setstate(node, { error: RED._('node-red-contrib-sun-position/position-config:errors.error-title') });
                done('internal error within-time-switch:' + err.message, msg);
            }
            return null;
        });

        node.status({});
        return;
    }

    RED.nodes.registerType('within-time-switch', withinTimeSwitchNode);
};