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

        this.timeStartData = {
            type: config.timeStartType || 'none',
            value : config.timeStart,
            offsetType : config.timeStartOffsetType,
            offset : config.timeStartOffset || 0,
            multiplier : config.timeStartOffsetMultiplierr || 60,
            next : true,
            days : config.timeDays,
            months : config.timeMonths,
            onlyOddDays: config.timeOnlyOddDays,
            onlyEvenDays: config.timeOnlyEvenDays
        };

        this.timeEndData = {
            type: config.timeEndType || 'none',
            value : config.timeEnd,
            offsetType : config.timeEndOffsetType,
            offset : config.timeEndOffset || 0,
            multiplier : config.timeEndOffsetMultiplierr || 60,
            next : true,
            days : config.timeDays,
            months : config.timeMonths,
            onlyOddDays: config.timeOnlyOddDays,
            onlyEvenDays: config.timeOnlyEvenDays
        };

        if (!this.timeStartData.offsetType) {
            this.timeStartData.offsetType = ((this.timeStartData.offset === 0) ? 'none' : 'num');
        }
        if (this.timeStartData.days === '') {
            throw new Error('No valid days given! Please check settings!');
        }
        if (this.timeStartData.months === '') {
            throw new Error('No valid month given! Please check settings!');
        }
        if (this.timeStartData.onlyEvenDays && this.timeStartData.onlyOddDays) {
            this.timeStartData.onlyEvenDays = false;
            this.timeStartData.onlyOddDays = false;
        }

        if (!this.timeEndData.offsetType) {
            this.timeEndData.offsetType = ((this.timeEndData.offset === 0) ? 'none' : 'num');
        }
        if (this.timeEndData.days === '') {
            throw new Error('No valid days given! Please check settings!');
        }
        if (this.timeEndData.months === '') {
            throw new Error('No valid month given! Please check settings!');
        }
        if (this.timeEndData.onlyEvenDays && this.timeEndData.onlyOddDays) {
            this.timeEndData.onlyEvenDays = false;
            this.timeEndData.onlyOddDays = false;
        }

        this.recalcTime = (config.recalcTime || 2) * 3600000;

        this.timeOutObj = null;
        this.intervalObj = null;
        this.intervalRecalcObj = null;
        this.nextStartTime = null;
        this.nextEndTime = null;
        const node = this;

        /**
         * Recalculate the timeout
         */
        function doTimeRecalc() {
            try {
                node.debug('performing a recalc of the next inject time');
                doCreateTimeout(node);
            } catch (err) {
                node.error(err.message);
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                });
            }
        }

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
                if (node.injectType === 'interval') {
                    // node.doCreateTimeout(node);
                    /*
                    clearInterval(node.intervalObj);
                    node.intervalObj = setInterval(() => {
                        node.debug('retriggered');
                        doCreateTimeout(node);
                    }, node.recalcTime);
                    */
                } else if (node.injectType === 'interval-time') {
                    node.doCreateTimeout(node);
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
         * @param {Date} [dNow] - Date object with the calculation base
         * @returns {object} state or error
         */
        function doCreateTimeout(node, _onInit, dNow) {
            // node.debug(`doCreateTimeout _onInit=${_onInit} node.timeData=${util.inspect(node.timeData, { colors: true, compact: 10, breakLength: Infinity })}`);
            let fill = 'yellow';
            const shape = 'dot';

            let errorStatus = '';
            let warnStatus = '';
            let isFixedTime = true;
            let timeStartValid = (node.timeStartData && node.timeStartData.type !== 'none');
            let timeEndValid = (node.timeEndData && node.timeEndData.type !== 'none');
            node.timeStartData.now = dNow || new Date();
            node.timeEndData.now = node.timeStartData.now;

            node.nextStartTime = null;
            node.nextEndTime = null;

            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
                node.timeOutObj = null;
            }
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
                        node.nextStartTime = new Date(dStart.getFullYear() + ((dNow >= dEnd) ? 1 : 0), dStart.getMonth(), dStart.getDate(), 0, 0, 1);
                        warnStatus = RED._('time-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(node.nextStartTime)+ ']';
                        timeStartValid = false;
                        timeEndValid = false;
                    }
                } else {
                    // switch between year from end to start - e.g. 2.11. - 20.3.
                    if (dNow < dStart && dNow > dEnd) {
                        node.nextStartTime = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate(), 0, 0, 1);
                        warnStatus = RED._('time-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(node.nextStartTime)+ ']';
                        timeStartValid = false;
                        timeEndValid = false;
                    }
                }
            }
            if (timeStartValid && node.positionConfig) {
                node.nextStartTimeData = node.positionConfig.getTimeProp(node, undefined, node.timeData);
                if (node.nextStartTimeData.error) {
                    errorStatus = 'could not evaluate time';
                    node.nextStartTime = null;
                    isFixedTime = false;
                    if (_onInit === true) {
                        return { state:'error', done: false, statusMsg: errorStatus, errorMsg: node.nextStartTimeData.error};
                    }
                    node.debug('node.nextStartTimeData=' + util.inspect(node.nextStartTimeData, { colors: true, compact: 10, breakLength: Infinity }));
                    node.error(node.nextStartTimeData.error);
                } else {
                    node.nextStartTime = node.nextStartTimeData.value;
                    isFixedTime = node.nextStartTimeData.fix;
                }
            }
            if (timeEndValid && node.positionConfig) {
                node.nextEndTimeData = node.positionConfig.getTimeProp(node, undefined, node.timeData);
                if (node.nextEndTimeData.error) {
                    errorStatus = 'could not evaluate time';
                    node.nextEndTime = null;
                    isFixedTime = false;
                    if (_onInit === true) {
                        return { state:'error', done: false, statusMsg: errorStatus, errorMsg: node.nextEndTimeData.error};
                    }
                    node.debug('node.nextEndTimeData=' + util.inspect(node.nextEndTimeData, { colors: true, compact: 10, breakLength: Infinity }));
                    node.error(node.nextEndTimeData.error);
                } else {
                    node.nextEndTime = node.nextEndTimeData.value;
                    isFixedTime = node.nextEndTimeData.fix;
                }
            }

            if ((node.nextStartTime !== null) && (typeof node.nextStartTime !== undefined) && (errorStatus === '')) {
                if (!hlp.isValidDate(node.nextStartTime)) {
                    hlp.handleError(this, 'Invalid time format "' + node.nextStartTime + '"', undefined, 'internal error!');
                    return { state:'error', done: false, statusMsg: 'Invalid time format!', errorMsg: 'Invalid time format'};
                }

                let millisec = tsGetScheduleTime(node.nextStartTime, 10);

                if (millisec > 345600000) {
                    // > 4 Days
                    if (node.intervalRecalcObj) {
                        clearInterval(node.intervalRecalcObj);
                        node.intervalRecalcObj = null;
                    }
                    // there is a limitation of nodejs that the maximum setTimeout time
                    // should not more then 2147483647 ms (24.8 days).
                    millisec = Math.min((millisec - 129600000), 2147483646);
                    node.debug('next inject is far far away, plan a inject time recalc in ' + millisec + ' ms');
                    node.timeOutObj = setTimeout(() => {
                        doTimeRecalc();
                    }, millisec); // 1,5 days before
                    fill = 'blue';
                } else {
                    // node.debug('timeout ' + node.nextTime + ' is in ' + millisec + 'ms');
                    node.timeOutObj = setTimeout(() => {
                        // node.debug(`timeOutObj`);

                        const msg = {
                            type: 'start',
                            timeData: {}
                            // settingData: node.timeData,
                        };
                        node.timeOutObj = null;

                        // node.debug(`usenormalTime!`);
                        msg.timeData = node.nextTimeData;
                        // node.debug(`usenormalTime!`);
                        node.emit('input', msg);
                        return { state: 'emit', done: true };
                    }, millisec);
                    fill = 'green';

                    if (!isFixedTime && !node.intervalRecalcObj && (_onInit !== true)) {
                        node.intervalRecalcObj = setInterval(() => {
                            node.debug('retriggered');
                            doCreateTimeout(node);
                        }, node.recalcTime);
                    } else if (isFixedTime && node.intervalRecalcObj) {
                        clearInterval(node.intervalRecalcObj);
                        node.intervalRecalcObj = null;
                    }
                }
            }

            if ((errorStatus !== '')) {
                node.status({
                    fill: 'red',
                    shape,
                    text: errorStatus + ((node.intervalRecalcObj) ? ' ↺🖩' : '')
                });
                return { state:'error', done: false, statusMsg: errorStatus, errorMsg: errorStatus };
            // if an error occurred, will retry in 10 minutes. This will prevent errors on initialization.
            } else if ((warnStatus !== '')) {
                node.status({
                    fill: 'red',
                    shape,
                    text: warnStatus + ((node.intervalRecalcObj) ? ' ↺🖩' : '')
                });
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
        }

        this.on('close', () => {
            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
                node.timeOutObj = null;
            }

            if (node.intervalRecalcObj) {
                clearInterval(node.intervalRecalcObj);
                node.intervalRecalcObj = null;
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
        if (this.intervalRecalcObj) {
            clearInterval(this.intervalRecalcObj);
            this.intervalRecalcObj = null;
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