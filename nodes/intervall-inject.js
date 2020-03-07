/********************************************
 * time-inject:
 *********************************************/
'use strict';

const util = require('util');
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));

module.exports = function (RED) {
    'use strict';

    /**
     * get the schedule time
     * @param {Date} time - time to schedule
     * @param {number} [limit] - minimal time limit to schedule
     * @returns {number} milliseconds until the defined Date
     */
    function tsGetScheduleTime(time, limit) {
        const dNow = new Date();
        let millisec = time.getTime() - dNow.getTime();
        if (limit) {
            while (millisec < limit) {
                millisec += 86400000; // 24h
            }
        }

        return millisec;
    }

    /**
     *
     * @param {*} node
     * @param {*} msg
     * @param {*} type
     * @param {*} name
     * @param {*} valueType
     * @param {*} value
     * @param {*} format
     * @param {*} offset
     * @param {*} offsetType
     * @param {*} multiplier
     * @param {*} days
     * @param {*} next
     */
    function tsSetAddProp(node, msg, data) {
        if (typeof data.next === 'undefined' || data.next === null || data.next === true || data.next === 'true') {
            data.next = true;
        } else if (data.next === 'false' || data.next === false) {
            data.next = false;
        }
        // node.debug(`tsSetAddProp  ${msg}, ${type}, ${name}, ${valueType}, ${value}, ${format}, ${offset}, ${offsetType}, ${multiplier}, ${days}`);
        if (data.outType !== 'none') {
            const res = node.positionConfig.getOutDataProp(node, msg, data);
            if (res === null || (typeof res === 'undefined')) {
                this.error('Could not evaluate ' + data.type + '.' + data.value + '. - Maybe settings outdated (open and save again)!');
            } else if (res.error) {
                this.error('Eerror on getting additional payload: "' + res.error + '"');
            } else if (data.outType === 'msgPayload') {
                msg.payload = res;
            } else if (data.outType === 'msgTs') {
                msg.ts = res;
            } else if (data.outType === 'msgLc') {
                msg.lc = res;
            } else if (data.outType === 'msgValue') {
                msg.value = res;
            } else if (data.outType === 'msg') {
                RED.util.setMessageProperty(msg, data.outValue, res);
            } else if ((data.outType === 'flow' || data.outType === 'global')) {
                const contextKey = RED.util.parseContextStore(data.outValue);
                node.context()[data.outType].set(contextKey.key, res, contextKey.store);
            }
        }
    }

    /**
     * timeInjectNode
     * @param {*} config - configuration
     */
    function timeInjectNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize timeInjectNode ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));
        this.timeType = config.timeType || 'none';
        this.injectType = config.injectTypeSelect || (this.timeType === 'none' ? 'none' : 'time');
        this.intervalCount = config.intervalCount || 0;
        this.intervalCountType = config.intervalCountType || 'num';
        this.intervalCountMultiplier = config.intervalCountMultiplier || 60000;

        this.time = config.time;
        this.timeType = config.timeType || 'none';
        this.timeDays = config.timeDays;
        this.timeOnlyOddDays = config.timeOnlyOddDays;
        this.timeOnlyEvenDays = config.timeOnlyEvenDays;
        this.timeMonths = config.timeMonths;
        this.timeAltDays = config.timeAltDays;
        this.timeAltOnlyOddDays = config.timeAltOnlyOddDays;
        this.timeAltOnlyEvenDays = config.timeAltOnlyEvenDays;
        this.timeAltMonths = config.timeAltMonths;

        if (this.timeDays === '') {
            throw new Error('No valid days given! Please check settings!');
        }
        if (this.timeAltDays === '') {
            throw new Error('No valid alternate days given! Please check settings!');
        }
        if (this.timeMonths === '') {
            throw new Error('No valid month given! Please check settings!');
        }
        if (this.timeAltMonths === '') {
            throw new Error('No valid alternate month given! Please check settings!');
        }
        if (this.timeOnlyEvenDays && this.timeOnlyOddDays) {
            this.timeOnlyEvenDays = false;
            this.timeOnlyOddDays = false;
        }
        if (this.timeAltOnlyEvenDays && this.timeAltOnlyOddDays) {
            this.timeAltOnlyEvenDays = false;
            this.timeAltOnlyOddDays = false;
        }

        this.offset = config.offset || config.timeOffset || 0;
        this.offsetType = config.offsetType;
        if (!this.offsetType) { this.offsetType = ((this.offset === 0) ? 'none' : 'num'); }
        this.offsetMultiplier = config.offsetMultiplier || config.timeOffsetMultiplier || 60;

        this.property = config.property || '';
        this.propertyType = config.propertyType || 'none';
        this.propertyOperator = config.propertyCompare || 'true';
        this.propertyThresholdValue = config.propertyThreshold;
        this.propertyThresholdType = config.propertyThresholdType;
        this.timeAlt = config.timeAlt || '';
        this.timeAltType = config.timeAltType || 'none';
        this.timeAltOffset = config.timeAltOffset || 0;
        this.timeAltOffsetType = config.timeAltOffsetType;
        if (!this.timeAltOffsetType) { this.timeAltOffsetType = ((this.timeAltOffset === 0) ? 'none' : 'num'); }
        this.timeAltOffsetMultiplier = config.timeAltOffsetMultiplier || 60;

        this.recalcTime = (config.recalcTime || 2) * 3600000;

        this.timeOutObj = null;
        this.intervalObj = null;
        this.nextTime = null;
        this.nextTimeAlt = null;
        const node = this;

        /**
         * Recalculate the timeout
         */
        node.getTimeParameter = (data, _onInit) => {
            const result = {
                time: {},
                value: null,
                isFixedTime: false
            };
            if (config.timedatestart || config.timedateend) {
                const dNow = new Date();
                const year = dNow.getFullYear();
                if (node.cacheYear !== year) {
                    node.cacheYear = year;
                    if (config.timedatestart) {
                        node.cacheStart = new Date(config.timedatestart);
                        node.cacheStart.setFullYear(year);
                        node.cacheStart.setHours(0, 0, 0, 0);
                    } else {
                        node.cacheStart = new Date(year, 0, 0, 0, 0, 0, 1);
                    }
                    if (config.timedateend) {
                        node.cacheEnd = new Date(config.timedateend);
                        node.cacheEnd.setFullYear(year);
                        node.cacheEnd.setHours(23, 59, 59, 999);
                    } else {
                        node.cacheEnd = new Date(year, 11, 31, 23, 59, 59, 999);
                    }
                }

                if (node.cacheStart < node.cacheEnd) {
                    // in the current year - e.g. 6.4. - 7.8.
                    if (dNow < node.cacheStart || dNow > node.cacheEnd) {
                        result.value = new Date(node.cacheYear + ((dNow >= node.cacheEnd) ? 1 : 0), node.cacheStart.getMonth(), node.cacheStart.getDate(), 0, 0, 1);
                        result.isFixedTime = true;
                        result.warnStatus = RED._('time-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(result.value)+ ']';
                        return result;
                    }
                } else {
                    // switch between year from end to start - e.g. 2.11. - 20.3.
                    if (dNow < node.cacheStart && dNow > node.cacheEnd) {
                        result.value = new Date(node.cacheYear, node.cacheStart.getMonth(), node.cacheStart.getDate(), 0, 0, 1);
                        result.isFixedTime = true;
                        result.warnStatus = RED._('time-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(result.value)+ ']';
                        return result;
                    }
                }
            }
            result.time = node.positionConfig.getTimeProp(node, undefined, data);
            if (result.time.error) {
                result.errorStatus = 'could not evaluate time';
                if (_onInit === true) {
                    return { state:'error', done: false, statusMsg: result.errorStatus, errorMsg: result.time.error};
                }
                node.debug('result.time=' + util.inspect(result.time, { colors: true, compact: 10, breakLength: Infinity }));
                node.error(result.time.error);
            } else {
                result.value = result.time.value;
                result.isFixedTime = result.time.fix;
            }
            return result;
        };

        /**
         * Recalculate the timeout
         */
        node.doTimeRecalc = () => {
            try {
                node.debug('performing a recalc of the next inject time');
                if (node.injectType === 'time') {
                    node.doCreateTimeout(node);
                } else if (node.injectType === 'interval' || node.injectType === 'interval-time') {
                    node.doCreateInterval(node);
                }
            } catch (err) {
                node.error(err.message);
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                });
            }
        };

        /**
         * creates the timeout
         * @param {*} node - the node representation
         * @param {boolean} [_onInit] - _true_ if is in initialisation
         * @returns {object} state or error
         */
        node.doCreateTimeout = (node, _onInit) => {
            let isAltFirst = false;
            let isFixedTime = true;
            let timeOk = false;
            let timeAltOk = false;
            node.nextTime = null;
            node.nextTimeAlt = null;

            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
                node.timeOutObj = null;
            }
            if (node.timeType !== 'none' && node.positionConfig) {
                node.nextTime = node.getTimeParameter({
                    type: node.timeType,
                    value : node.time,
                    offsetType : node.offsetType,
                    offset : node.offset,
                    multiplier : node.offsetMultiplier,
                    next : true,
                    days : node.timeDays,
                    months : node.timeMonths,
                    onlyOddDays: node.timeOnlyOddDays,
                    onlyEvenDays: node.timeOnlyEvenDays
                }, _onInit);
                isFixedTime = node.nextTime.isFixedTime;
                timeOk = (node.nextTime.value !== null) && (!node.nextTime.errorStatus);
            }
            if (node.propertyType !== 'none' &&
                node.timeAltType !== 'none' &&
                node.positionConfig) {
                node.nextTimeAlt = node.getTimeParameter({
                    type: node.timeAltType,
                    value : node.timeAlt,
                    offsetType : node.timeAltOffsetType,
                    offset : node.timeAltOffset,
                    multiplier : node.timeAltOffsetMultiplier,
                    next : true,
                    days : node.timeAltDays,
                    months : node.timeAltMonths,
                    onlyOddDays: node.timeAltOnlyOddDays,
                    onlyEvenDays: node.timeAltOnlyEvenDays
                }, _onInit);
                isFixedTime = isFixedTime && node.nextTime.isFixedTime;
                timeAltOk = (node.nextTimeAlt.value !== null) && (!node.nextTimeAlt.errorStatus);
            }

            /*
            if (config.timedatestart || config.timedateend) {
                let dStart, dEnd;
                const dNow = new Date();
                if (config.timedatestart) {
                    dStart = new Date(config.timedatestart);
                    dStart.setFullYear(dNow.getFullYear());
                    dStart.setHours(0, 0, 0, 0);
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
                        node.nextTime = new Date(dStart.getFullYear() + ((dNow >= dEnd) ? 1 : 0), dStart.getMonth(), dStart.getDate(), 0, 0, 1);
                        warnStatus = RED._('time-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(node.nextTime)+ ']';
                        node.timeType = 'none';
                        node.timeAltType = 'none';
                    }
                } else {
                    // switch between year from end to start - e.g. 2.11. - 20.3.
                    if (dNow < dStart && dNow > dEnd) {
                        node.nextTime = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate(), 0, 0, 1);
                        warnStatus = RED._('time-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(node.nextTime)+ ']';
                        node.timeType = 'none';
                        node.timeAltType = 'none';
                    }
                }
            }
            if (node.timeType !== 'none' && node.positionConfig) {
                node.nextTimeData = node.positionConfig.getTimeProp(node, undefined, {
                    type: node.timeType,
                    value : node.time,
                    offsetType : node.offsetType,
                    offset : node.offset,
                    multiplier : node.offsetMultiplier,
                    next : true,
                    days : node.timeDays,
                    months : node.timeMonths,
                    onlyOddDays: node.timeOnlyOddDays,
                    onlyEvenDays: node.timeOnlyEvenDays
                });
                if (node.nextTimeData.error) {
                    errorStatus = 'could not evaluate time';
                    node.nextTime = null;
                    isFixedTime = false;
                    if (_onInit === true) {
                        return { state:'error', done: false, statusMsg: errorStatus, errorMsg: node.nextTimeData.error};
                    }
                    node.debug('node.nextTimeData=' + util.inspect(node.nextTimeData, { colors: true, compact: 10, breakLength: Infinity }));
                    node.error(node.nextTimeData.error);
                } else {
                    node.nextTime = node.nextTimeData.value;
                    isFixedTime = node.nextTimeData.fix;
                }
            } */
            /*
            if (node.propertyType !== 'none' &&
                node.timeAltType !== 'none' &&
                node.positionConfig) {
                node.nextTimeAltData = node.positionConfig.getTimeProp(node, undefined, {
                    type: node.timeAltType,
                    value : node.timeAlt,
                    offsetType : node.timeAltOffsetType,
                    offset : node.timeAltOffset,
                    multiplier : node.timeAltOffsetMultiplier,
                    next : true,
                    days : node.timeAltDays,
                    months : node.timeAltMonths,
                    onlyOddDays: node.timeAltOnlyOddDays,
                    onlyEvenDays: node.timeAltOnlyEvenDays
                });

                if (node.nextTimeAltData.error) {
                    errorStatus = 'could not evaluate alternate time';
                    node.nextTimeAlt = null;
                    isFixedTime = false;
                    if (_onInit === true) {
                        return { state:'error', done: false, statusMsg: errorStatus, errorMsg: node.nextTimeAltData.error};
                    }
                    node.debug('node.nextTimeAltData=' + util.inspect(node.nextTimeAltData, { colors: true, compact: 10, breakLength: Infinity }));
                    node.error(node.nextTimeAltData.error);
                } else {
                    node.nextTimeAlt = node.nextTimeAltData.value;
                    isFixedTime = isFixedTime && node.nextTimeAltData.fix;
                }
            } */
            let fill = 'yellow';
            let shape = 'dot';
            if (timeOk) {
                if (!hlp.isValidDate(node.nextTime.value)) {
                    hlp.handleError(node, 'Invalid time format "' + node.nextTime.value + '"', undefined, 'internal error!');
                    return { state:'error', done: false, statusMsg: 'Invalid time format!', errorMsg: 'Invalid time format'};
                }

                let millisec = tsGetScheduleTime(node.nextTime.value, 10);
                if (timeAltOk) {
                    shape = 'ring';
                    const millisecAlt = tsGetScheduleTime(node.nextTimeAlt, 10);
                    if (millisecAlt < millisec) {
                        millisec = millisecAlt;
                        isAltFirst = true;
                    }
                }

                if (millisec > 345600000) {
                    // > 4 Days
                    if (node.intervalObj) {
                        clearInterval(node.intervalObj);
                        node.intervalObj = null;
                    }
                    // there is a limitation of nodejs that the maximum setTimeout time
                    // should not more then 2147483647 ms (24.8 days).
                    millisec = Math.min((millisec - 129600000), 2147483646);
                    node.debug('next inject is far far away, plan a inject time recalc in ' + millisec + ' ms');
                    node.timeOutObj = setTimeout(() => {
                        node.doTimeRecalc();
                    }, millisec); // 1,5 days before
                    fill = 'blue';
                } else {
                    // node.debug('timeout ' + node.nextTime + ' is in ' + millisec + 'ms (isAlt=' + isAlt + ' isAltFirst=' + isAltFirst + ')');
                    node.timeOutObj = setTimeout((timeAltOk, isAltFirst) => {
                        const msg = {
                            type: 'start',
                            timeData: {}
                        };
                        node.timeOutObj = null;
                        let useAlternateTime = false;
                        if (timeAltOk) {
                            let needsRecalc = false;
                            try {
                                useAlternateTime = node.positionConfig.comparePropValue(node, msg, node.propertyType, node.property,
                                    node.propertyOperator, node.propertyThresholdType, node.propertyThresholdValue);
                                needsRecalc = (isAltFirst && !useAlternateTime) || (!isAltFirst && useAlternateTime);
                            } catch (err) {
                                needsRecalc = isAltFirst;
                                hlp.handleError(node, RED._('time-inject.errors.invalid-property-type', {
                                    type: node.propertyType,
                                    value: node.property
                                }),  err);
                            }

                            if (needsRecalc) {
                                node.doTimeRecalc();
                                return { state:'recalc', done: true };
                            }
                        }

                        if (useAlternateTime) {
                            msg.timeData = node.nextTimeAlt;
                        } else if (node.nextTime) {
                            msg.timeData = node.nextTime;
                        }
                        node.emit('input', msg);
                        return { state: 'emit', done: true };
                    }, millisec, timeAltOk, isAltFirst);
                    fill = 'green';

                    if (!isFixedTime && !node.intervalObj && (_onInit !== true)) {
                        node.intervalObj = setInterval(() => {
                            node.debug('retriggered');
                            node.doCreateTimeout(node);
                        }, node.recalcTime);
                    } else if (isFixedTime && node.intervalObj) {
                        clearInterval(node.intervalObj);
                        node.intervalObj = null;
                    }
                }
            }

            if (node.nextTime.errorStatus || node.nextTimeAlt.errorStatus) {
                const error = node.nextTime.errorStatus + ' ' + node.nextTimeAlt.errorStatus;
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: error + ((node.intervalObj) ? ' ↺🖩' : '')
                });
                return { state:'error', done: false, statusMsg: error, errorMsg: error };
            // if an error occurred, will retry in 10 minutes. This will prevent errors on initialization.
            } else if (node.nextTime.warnStatus) {
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: node.nextTime.warnStatus + ((node.intervalObj) ? ' ↺🖩' : '')
                });
            } else if (node.nextTimeAlt && node.timeOutObj) {
                if (isAltFirst) {
                    node.status({
                        fill,
                        shape,
                        text: node.positionConfig.toDateTimeString(node.nextTimeAlt) + ' / ' + node.positionConfig.toTimeString(node.nextTime)
                    });
                } else {
                    node.status({
                        fill,
                        shape,
                        text: node.positionConfig.toDateTimeString(node.nextTime) + ' / ' + node.positionConfig.toTimeString(node.nextTimeAlt)
                    });
                }
            } else if (node.nextTime && node.timeOutObj) {
                node.status({
                    fill,
                    shape,
                    text: node.positionConfig.toDateTimeString(node.nextTime)
                });
            } else {
                node.status({});
            }
            return { state:'ok', done: true };
        };

        /**
         * creates the interval
         * @param {*} node - the node representation
         * @param {boolean} [_onInit] - _true_ if is in initialisation
         * @returns {object} state or error
         */
        node.doCreateInterval = (node, _onInit) => {
            node.nextTime = null;
            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
                node.timeOutObj = null;
            }
            if (node.timeType !== 'none' && node.positionConfig) {
                let next = false;
                if (node.timeEndType !== 'none' && node.positionConfig) {
                    node.nextTimeEnd = node.getTimeParameter({
                        type: node.timeEndType,
                        value : node.timeEnd,
                        offsetType : node.timeEndOffsetType,
                        offset : node.timeEndOffset,
                        multiplier : node.timeEndOffsetMultiplier,
                        next : false,
                        days : node.timeDays,
                        months : node.timeMonths,
                        onlyOddDays: node.timeOnlyOddDays,
                        onlyEvenDays: node.timeOnlyEvenDays
                    }, _onInit);
                    // isFixedTime = node.nextTime.isFixedTime;
                    // timeOk = (node.nextTime.value !== null) && (!node.nextTime.errorStatus);
                    if ((node.nextTimeEnd.value !== null) && (!node.nextTimeEnd.errorStatus) && dNow > node.nextTimeEnd.value) {
                        next = true;
                    }
                }
                node.nextTime = node.getTimeParameter({
                    type: node.timeType,
                    value : node.time,
                    offsetType : node.offsetType,
                    offset : node.offset,
                    multiplier : node.offsetMultiplier,
                    next,
                    days : node.timeDays,
                    months : node.timeMonths,
                    onlyOddDays: node.timeOnlyOddDays,
                    onlyEvenDays: node.timeOnlyEvenDays
                }, _onInit);
                const dNow = new Date();
                if ((node.nextTime.value !== null) && (!node.nextTime.errorStatus) && dNow < node.nextTime.value) {
                    if (node.intervalObj) {
                        clearInterval(node.intervalObj);
                        node.intervalObj = null;
                    }
                    if (!hlp.isValidDate(node.nextTime.value)) {
                        hlp.handleError(node, 'Invalid time format "' + node.nextTime.value + '"', undefined, 'internal error!');
                        return { state:'error', done: false, statusMsg: 'Invalid time format!', errorMsg: 'Invalid time format'};
                    }
                    let millisec = tsGetScheduleTime(node.nextTime.value, 10);
                    if (millisec > 345600000) {
                        // > 4 Days
                        // there is a limitation of nodejs that the maximum setTimeout time
                        // should not more then 2147483647 ms (24.8 days).
                        millisec = Math.min((millisec - 129600000), 2147483646);
                        node.debug('next inject is far far away, plan a inject time recalc in ' + millisec + ' ms'); // 1,5 days before
                    }
                    node.timeOutObj = setTimeout(() => {
                        node.doTimeRecalc();
                    }, millisec);
                    return { state:'rescheduled', done: true };
                }

            }
            /*
                    config.injectTypeSelect || (this.timeType === 'none' ? 'none' : 'time');
                    this.intervalCount = config.intervalCount || 0;
                    this.intervalCountType = config.intervalCountType || 'num';
                    this.intervalCountMultiplier = config.intervalCountMultiplier || 60000;
            */

            if (node.intervalObj) {
                clearInterval(node.intervalObj);
                node.intervalObj = null;
            }
            return { state:'ok', done: true };
        };

        this.on('close', () => {
            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
                node.timeOutObj = null;
            }

            if (node.intervalObj) {
                clearInterval(node.intervalObj);
                node.intervalObj = null;
            }
            // tidy up any state
        });

        this.on('input', function (msg, send, done) { // eslint-disable-line complexity
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) { if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };

            try {
                msg._srcid = node.id;
                node.debug('--------- time-inject - input');
                if (node.injectType === 'time') {
                    node.doCreateTimeout(node);
                } else if (node.injectType === 'interval' || node.injectType === 'interval-time') {
                    node.doCreateInterval(node);
                }
                msg.topic = config.topic;
                if (!node.positionConfig) {
                    throw new Error('configuration missing!');
                }
                const value = node.positionConfig.getOutDataProp(node, msg, {
                    type: config.payloadType,
                    value: config.payload,
                    format: config.payloadTimeFormat,
                    offsetType: config.payloadOffsetType,
                    offset: config.payloadOffset,
                    multiplier: config.payloadOffsetMultiplier,
                    next: true
                });
                if (value === null || (typeof value === 'undefined')) {
                    throw new Error('could not evaluate ' + config.payloadType + '.' + config.payload);
                } else if (value.error) {
                    throw new Error('could not getting payload: ' + value.error);
                } else {
                    msg.payload = value;
                }

                if (typeof config.addPayload1Type !== 'undefined' &&
                    typeof config.addPayload1ValueType !== 'undefined') {
                    tsSetAddProp(this, msg, {
                        outType: config.addPayload1Type,
                        outValue: config.addPayload1,
                        type: config.addPayload1ValueType,
                        value: config.addPayload1Value,
                        format: config.addPayload1Format,
                        offsetType: config.addPayload1OffsetType,
                        offset: config.addPayload1Offset,
                        multiplier: config.addPayload1OffsetMultiplier,
                        next: config.addPayload1Next,
                        days: config.addPayload1Days
                    });
                    tsSetAddProp(this, msg, {
                        outType: config.addPayload2Type,
                        outValue: config.addPayload2,
                        type: config.addPayload2ValueType,
                        value: config.addPayload2Value,
                        format: config.addPayload2Format,
                        offsetType: config.addPayload2OffsetType,
                        offset: config.addPayload2Offset,
                        multiplier: config.addPayload2OffsetMultiplier,
                        next: config.addPayload2Next,
                        days: config.addPayload2Days
                    });
                    tsSetAddProp(this, msg, {
                        outType: config.addPayload3Type,
                        outValue: config.addPayload3,
                        type: config.addPayload3ValueType,
                        value: config.addPayload3Value,
                        format: config.addPayload3Format,
                        offsetType: config.addPayload3OffsetType,
                        offset: config.addPayload3Offset,
                        multiplier: config.addPayload3OffsetMultiplier,
                        next: config.addPayload3Next,
                        days: config.addPayload3Days
                    });
                }
                send(msg); // node.send(msg);
                done();
                return null;
            } catch (err) {
                node.log(err.message);
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                });
                done('internal error time-inject:' + err.message, msg);
            }
            return null;
        });

        node.status({});
        try {
            if (config.once) {
                if (config.onceDelay > 2147483) {
                    config.onceDelay = 2147483;
                }
                node.status({
                    fill: 'yellow',
                    shape: 'ring',
                    text: RED._('time-inject.message.onceDelay', { seconds: (config.onceDelay || 0.1)})
                });

                config.onceTimeout = setTimeout(() => {
                    node.emit('input', {
                        type: 'once'
                    });
                    if (node.injectType === 'time') {
                        node.doCreateTimeout(node);
                    } else if (node.injectType === 'interval' || node.injectType === 'interval-time') {
                        node.doCreateInterval(node);
                    }
                }, (config.onceDelay || 0.1) * 1000);
                return;
            }

            setTimeout(() => {
                try {
                    let createTO = { done: false};
                    if (node.injectType === 'time') {
                        createTO = node.doCreateTimeout(node, true);
                    } else if (node.injectType === 'interval' || node.injectType === 'interval-time') {
                        createTO = node.doCreateInterval(node, true);
                    }
                    if (createTO.done !== true) {
                        if (createTO.errorMsg) {
                            node.warn(RED._('node-red-contrib-sun-position/position-config:errors.warn-init', { message: createTO.errorMsg, time: 6}));
                        }
                        setTimeout(() => {
                            try {
                                if (node.injectType === 'time') {
                                    node.doCreateTimeout(node);
                                } else if (node.injectType === 'interval' || node.injectType === 'interval-time') {
                                    node.doCreateInterval(node);
                                }
                            } catch (err) {
                                node.error(err.message);
                                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                                node.status({
                                    fill: 'red',
                                    shape: 'ring',
                                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                                });
                            }
                        }, 360000); // 6 Minuten
                        node.status({
                            fill: 'red',
                            shape: 'ring',
                            text: RED._('node-red-contrib-sun-position/position-config:errors.error-init', { message: createTO.statusMsg, time: '6min'})
                        });
                    }
                } catch (err) {
                    node.error(err.message);
                    node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                    node.status({
                        fill: 'red',
                        shape: 'ring',
                        text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                    });
                }
            }, 200 + Math.floor(Math.random() * 600));
        } catch (err) {
            node.error(err.message);
            node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
            node.status({
                fill: 'red',
                shape: 'ring',
                text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
            });
        }
    }

    RED.nodes.registerType('time-inject', timeInjectNode);

    timeInjectNode.prototype.close = function () {
        if (this.timeOutObj) {
            clearTimeout(this.onceTimeout);
            this.onceTimeout = null;
            if (RED.settings.verbose) { this.log(RED._('inject.stopped')); }
        }
        if (this.intervalObj) {
            clearInterval(this.intervalObj);
            this.intervalObj = null;
            if (RED.settings.verbose) { this.log(RED._('inject.stopped')); }
        }
    };

    RED.httpAdmin.post('/time-inject/:id', RED.auth.needsPermission('time-inject.write'), (req,res) => {
        const node = RED.nodes.getNode(req.params.id);
        if (node !== null && typeof node !== 'undefined') {
            try {
                node.receive();
                res.sendStatus(200);
            } catch(err) {
                res.sendStatus(500);
                node.error(RED._('node-red:inject.failed',{error:err.toString()}));
            }
        } else {
            res.sendStatus(404);
        }
    });
};