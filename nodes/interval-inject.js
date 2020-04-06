/********************************************
 * interval-inject:
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
     * intervalInjectNode
     * @param {*} config - configuration
     */
    function intervalInjectNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize intervalInjectNode ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));
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

        this.timeOutStartObj = null;
        this.timeOutEndObj = null;
        this.intervalObj = null;
        this.intervalTime = null;
        this.nextStartTime = null;
        this.nextEndTime = null;
        const node = this;

        /**
         * Recalculate the timeout
         */
        node.getTimeParameter = (dNow) => {
            const result = {
                value: null,
                isFixedTime: false,
                valid : true
            };
            if (config.timedatestart || config.timedateend) {
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
                        result.warnStatus = RED._('interval-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(result.value)+ ']';
                        result.valid = false;
                        return result;
                    }
                } else {
                    // switch between year from end to start - e.g. 2.11. - 20.3.
                    if (dNow < node.cacheStart && dNow > node.cacheEnd) {
                        result.value = new Date(node.cacheYear, node.cacheStart.getMonth(), node.cacheStart.getDate(), 0, 0, 1);
                        result.isFixedTime = true;
                        result.warnStatus = RED._('interval-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(result.value)+ ']';
                        result.valid = false;
                        return result;
                    }
                }
            }
            return result;
        };

        node.doCreateEndTimeout = () => {
            if (node.timeOutEndObj) {
                clearTimeout(node.timeOutEndObj);
                node.timeOutEndObj = null;
            }
            node.nextEndTime = null;

            let nextEndTimeData = node.positionConfig.getTimeProp(node, undefined, node.timeEndData);
            if (nextEndTimeData.error) {
                errorStatus = 'could not evaluate time';
                node.nextEndTime = null;
                isFixedTime = false;
                if (_onInit === true) {
                    return { state: 'error', done: false, statusMsg: errorStatus, errorMsg: nextEndTimeData.error };
                }
                node.debug('nextEndTimeData=' + util.inspect(nextEndTimeData, { colors: true, compact: 10, breakLength: Infinity }));
                node.error(nextEndTimeData.error);
            } else {
                node.nextEndTime = nextEndTimeData.value;
                isFixedTime = isFixedTime && nextEndTimeData.fix;
            }

            let millisecEnd = 1000 * 60 * 60 * 24; // 24h
            if ((node.nextEndTime !== null) && (typeof node.nextEndTime !== undefined) && (errorStatus === '')) {
                // node.debug('timeout ' + node.nextEndTime + ' is in ' + millisec + 'ms');
                millisecEnd = tsGetScheduleTime(node.nextEndTime, 10);
            }

            if ((millisecEnd - millisecStart) > 345600000) {
                millisecEnd = Math.min((millisecEnd - 129600000), 2147483646);
                node.timeOutEndObj = setTimeout(() => {
                    node.doCreateEndTimeout();
                }, millisecEnd); // 1,5 days before
                return;
            }
            node.timeOutEndObj = setTimeout(() => {
                node.timeOutEndObj = null;
                clearInterval(node.intervalObj);
                node.intervalObj = null;
                node.doCreateStartTimeout(false);
            }, millisecEnd);
        }
        /**
         * creates the timeout
         * @param {*} node - the node representation
         * @param {boolean} [_onInit] - _true_ if is in initialisation
         * @param {Date} [dNow] - Date object with the calculation base
         * @returns {object} state or error
         */
        node.doCreateStartTimeout = (_onInit, dNow) => {
            // node.debug(`doCreateStartTimeout _onInit=${_onInit} node.timeStartData=${util.inspect(node.timeStartData, { colors: true, compact: 10, breakLength: Infinity })}`);
            if (!node.positionConfig) {
                throw new Error('configuration missing!');
            }
            node.nextStartTime = null;
            node.intervalTime = node.positionConfig.getFloatProp(node, null, config.intervalCountType, config.intervalCount, 0);
            if (node.intervalTime <= 0) {
                throw new Error('Interval wrong!');
            } else {
                if (config.intervalCountMultiplier > 0) {
                    node.intervalTime = Math.floor(node.intervalTime * config.intervalCountMultiplier);
                }
            }

            if (node.timeOutStartObj) {
                clearTimeout(node.timeOutStartObj);
                node.timeOutStartObj = null;
            }

            if (node.injectType === 'interval' || node.timeStartData.type === 'none' || node.timeEndData.type === 'none') {
                clearInterval(node.intervalObj);
                node.intervalObj = setInterval(() => {
                    node.emit('input', {});
                }, node.intervalTime);
               return;
            }

            let fill = 'yellow';
            const shape = 'dot';

            let errorStatus = '';
            let warnStatus = '';
            let isFixedTime = true;
            node.timeStartData.now = dNow || new Date();

            let startLimit = node.getTimeParameter(node.timeStartData.now);
            if (startLimit.valid) {
                let nextStartTimeData = node.positionConfig.getTimeProp(node, undefined, node.timeStartData);
                if (nextStartTimeData.error) {
                    errorStatus = 'could not evaluate time';
                    node.nextStartTime = null;
                    isFixedTime = false;
                    if (_onInit === true) {
                        return { state: 'error', done: false, statusMsg: errorStatus, errorMsg: nextStartTimeData.error };
                    }
                    node.debug('node.nextStartTimeData=' + util.inspect(nextStartTimeData, { colors: true, compact: 10, breakLength: Infinity }));
                    node.error(nextStartTimeData.error);
                } else {
                    node.nextStartTime = nextStartTimeData.value;
                    isFixedTime = nextStartTimeData.fix;
                }
            } else {
                warnStatus = startLimit.warnStatus;
                isFixedTime = true;
                node.nextStartTime = startLimit.value;
            }


            if ((node.nextStartTime !== null) && (typeof node.nextStartTime !== undefined) && (errorStatus === '')) {
                if (!hlp.isValidDate(node.nextStartTime)) {
                    hlp.handleError(this, 'Invalid start time format "' + node.nextStartTime + '"', undefined, 'internal error!');
                    return { state: 'error', done: false, statusMsg: 'Invalid time format!', errorMsg: 'Invalid time format' };
                }

                let millisecStart = tsGetScheduleTime(node.nextStartTime, 10);

                if (millisecStart > 345600000) {
                    // there is a limitation of nodejs that the maximum setTimeout time
                    // should not more then 2147483647 ms (24.8 days).
                    millisecStart = Math.min((millisecStart - 129600000), 2147483646);
                    node.debug('next inject is far far away, plan a inject time recalc in ' + millisecStart + ' ms');
                    node.timeOutStartObj = setTimeout(() => {
                        node.doCreateStartTimeout(false);
                    }, millisecStart); // 1,5 days before
                    fill = 'blue';
                } else {
                    node.timeEndData.now = node.nextStartTime;
                    node.timeOutStartObj = setTimeout(() => {
                        node.timeOutStartObj = null;
                        node.doCreateEndTimeout();
                        clearInterval(node.intervalObj);
                        node.intervalObj = setInterval(() => {
                            node.emit('input', { });
                        }, node.intervalTime);
                    }, millisecStart);
                }
            }

            if ((errorStatus !== '')) {
                node.status({
                    fill: 'red',
                    shape,
                    text: errorStatus
                });
                return { state:'error', done: false, statusMsg: errorStatus, errorMsg: errorStatus };
            // if an error occurred, will retry in 10 minutes. This will prevent errors on initialization.
            } else if ((warnStatus !== '')) {
                node.status({
                    fill: 'red',
                    shape,
                    text: warnStatus
                });
            } else if (node.nextStartTime && node.timeOutStartObj) {
                node.status({
                    fill,
                    shape,
                    text: node.positionConfig.toDateTimeString(node.nextStartTime)
                });
            } else {
                node.status({});
            }
            return { state:'ok', done: true };
        }

        this.on('close', () => {
            if (node.timeOutStartObj) {
                clearTimeout(node.timeOutStartObj);
                node.timeOutStartObj = null;
            }
            if (node.timeOutEndObj) {
                clearTimeout(node.timeOutEndObj);
                node.timeOutEndObj = null;
            }
            if (node.onceTimeout) {
                clearTimeout(node.onceTimeout);
                node.onceTimeout = null;
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
                node.debug('--------- interval-inject - input');
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
                done('internal error interval-inject:' + err.message, msg);
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
                    text: RED._('interval-inject.message.onceDelay', { seconds: (config.onceDelay || 0.1)})
                });

                node.onceTimeout = setTimeout(() => {
                    node.emit('input', {
                        type: 'once'
                    });
                    node.doCreateStartTimeout(node);
                }, (config.onceDelay || 0.1) * 1000);
                return;
            }

            setTimeout(() => {
                try {
                    let createTO = { done: false};
                    createTO = node.doCreateStartTimeout(node, true);
                    if (createTO.done !== true) {
                        if (createTO.errorMsg) {
                            node.warn(RED._('node-red-contrib-sun-position/position-config:errors.warn-init', { message: createTO.errorMsg, time: 6}));
                        }
                        setTimeout(() => {
                            try {
                                node.doCreateStartTimeout(node);
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

    RED.nodes.registerType('interval-inject', intervalInjectNode);

    intervalInjectNode.prototype.close = function () {
        if (this.onceTimeout) {
            clearTimeout(node.onceTimeout);
            this.onceTimeout = null;
        }
        if (this.timeOutStartObj) {
            clearTimeout(this.timeOutStartObj);
            this.timeOutStartObj = null;
        }
        if (this.timeOutEndObj) {
            clearTimeout(this.timeOutEndObj);
            this.timeOutEndObj = null;
        }
        if (this.intervalObj) {
            clearInterval(this.intervalObj);
            this.intervalObj = null;
            if (RED.settings.verbose) { this.log(RED._('inject.stopped')); }
        }
    };

    RED.httpAdmin.post('/interval-inject/:id', RED.auth.needsPermission('interval-inject.write'), (req,res) => {
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