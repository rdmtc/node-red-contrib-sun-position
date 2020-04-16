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
        let millisec = time.valueOf() - dNow.valueOf();
        if (limit) {
            while (millisec < limit) {
                millisec += 86400000; // 24h
            }
        }

        return millisec;
    }

    /**
     * timeInjectNode
     * @param {*} config - configuration
     */
    function timeInjectNode(config) {
        const tInj = {
            none : 0,
            timer : 1,
            interval : 2,
            intervalTime : 4
        };
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize timeInjectNode ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));
        if (config.injectTypeSelect === 'interval-time') {
            this.injType = tInj.intervalTime;
        } else if (config.injectTypeSelect === 'interval') {
            this.injType = tInj.interval;
        } else if ((config.injectTypeSelect === 'time') && (config.timeType && config.timeType !== 'none')) {
            this.injType = tInj.timer;
        } else {
            this.injType = tInj.none;
        }
        this.intervalCount = config.intervalCount || 0;
        this.intervalCountType = (this.injType === tInj.interval || this.injType === tInj.intervalTime) ? config.intervalCountType || 'num' : 'none';
        this.intervalCountMultiplier = config.intervalCountMultiplier || 60000;

        if (this.injType === tInj.intervalTime ||
            this.injType === tInj.timer) {
            this.timeStartData = {
                type: config.timeType,
                value : config.time,
                offsetType : config.offsetType,
                offset : config.offset || config.timeOffset || 0,
                multiplier : config.offsetMultiplier || config.timeOffsetMultiplier || 60,
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
            this.property = config.property || '';
            this.propertyType = config.propertyType || 'none';
            this.propertyOperator = config.propertyCompare || 'true';
            this.propertyThresholdValue = config.propertyThreshold;
            this.propertyThresholdType = config.propertyThresholdType;

            if (this.injType === tInj.timer && config.timeAltType &&
                config.timeAltType !== 'none' &&
                this.propertyType !== 'none') {
                this.timeStartAltData = {
                    type: config.timeAltType || 'none',
                    value : config.timeAlt || '',
                    offsetType : config.timeAltOffsetType,
                    offset : config.timeAltOffset || 0,
                    multiplier : config.timeAltOffsetMultiplier || 60,
                    next : true,
                    days : config.timeAltDays,
                    months : config.timeAltMonths,
                    onlyOddDays: config.timeAltOnlyOddDays,
                    onlyEvenDays: config.timeAltOnlyEvenDays
                };
                if (!this.timeStartAltData.offsetType) { this.timeStartAltData.offsetType = ((this.timeStartAltData.offset === 0) ? 'none' : 'num'); }

                if (this.timeStartAltData.days === '') {
                    throw new Error('No valid alternate days given! Please check settings!');
                }
                if (this.timeStartAltData.months === '') {
                    throw new Error('No valid alternate month given! Please check settings!');
                }
                if (this.timeStartAltData.onlyEvenDays && this.timeStartAltData.onlyOddDays) {
                    this.timeStartAltData.onlyEvenDays = false;
                    this.timeStartAltData.onlyOddDays = false;
                }
            } // timeAlt
        } // timeStartData

        if (this.injType === tInj.intervalTime) {
            this.timeEndData = {
                type: config.timeEndType,
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
        } // timeEndData

        this.payloadData = {
            type: config.payloadType,
            value: config.payload,
            format: config.payloadTimeFormat,
            offsetType: config.payloadOffsetType,
            offset: config.payloadOffset,
            multiplier: config.payloadOffsetMultiplier,
            next: true
        };

        this.addPayloadData = [];
        if (typeof config.addPayload1Type !== 'undefined' &&
            typeof config.addPayload1ValueType !== 'undefined' &&
            config.addPayload1Type !== 'none' &&
            config.addPayload1ValueType !== 'none') {
            this.addPayloadData.push({
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
        if (typeof config.addPayload2Type !== 'undefined' &&
            typeof config.addPayload2ValueType !== 'undefined' &&
            config.addPayload2Type !== 'none' &&
            config.addPayload2ValueType !== 'none') {
            this.addPayloadData.push({
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
        }
        if (typeof config.addPayload3Type !== 'undefined' &&
            typeof config.addPayload3ValueType !== 'undefined' &&
            config.addPayload3Type !== 'none' &&
            config.addPayload3ValueType !== 'none') {
            this.addPayloadData.push({
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
        for (let i = 0; i < this.addPayloadData.length; i++) {
            const el = this.addPayloadData[i];
            if (typeof el.next === 'undefined' ||
                el.next === null ||
                el.next === true ||
                el.next === 'true') {
                el.next = true;
            } else if (el.next === 'false' ||
                el.next === false) {
                el.next = false;
            }
        }

        this.recalcTime = (config.recalcTime || 2) * 3600000;

        this.timeOutStartObj = null;
        this.timeOutEndObj = null;
        this.intervalObj = null;
        this.intervalTime = null;
        this.nextStartTime = null;
        this.nextStartTimeAlt = null;
        this.nextEndTime = null;
        const node = this;

        /**
         * get the limitation for time
         */
        node.getTimeLimitation = dNow => {
            const result = {
                value: null,
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
                        result.warnStatus = RED._('time-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(result.value)+ ']';
                        result.valid = false;
                        return result;
                    }
                } else {
                    // switch between year from end to start - e.g. 2.11. - 20.3.
                    if (dNow < node.cacheStart && dNow > node.cacheEnd) {
                        result.value = new Date(node.cacheYear, node.cacheStart.getMonth(), node.cacheStart.getDate(), 0, 0, 1);
                        result.warnStatus = RED._('time-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(result.value)+ ']';
                        result.valid = false;
                        return result;
                    }
                }
            }
            return result;
        };

        /**
         * creates the end timeout
         * @param {*} node - the node representation
         * @returns {object} state or error
         */
        node.doCreateEndTimeout = node => {
            if (!node.timeEndData) {
                return;
            }
            node.debug(`doCreateEndTimeout node.timeEndData=${util.inspect(node.timeEndData, { colors: true, compact: 10, breakLength: Infinity })}`);
            if (node.timeOutEndObj) {
                clearTimeout(node.timeOutEndObj);
                node.timeOutEndObj = null;
            }
            node.nextEndTime = null;
            let errorStatus = '';
            const nextEndTimeData = node.positionConfig.getTimeProp(node, undefined, node.timeEndData);
            if (nextEndTimeData.error) {
                errorStatus = 'could not evaluate end time';
                node.nextEndTime = null;
                node.debug('nextEndTimeData=' + util.inspect(nextEndTimeData, { colors: true, compact: 10, breakLength: Infinity }));
                node.error(nextEndTimeData.error);
            } else {
                node.nextEndTime = nextEndTimeData.value;
            }

            let millisecEnd = 1000 * 60 * 60 * 24; // 24h
            if ((node.nextEndTime !== null) && (typeof node.nextEndTime !== undefined) && (errorStatus === '')) {
                // node.debug('timeout ' + node.nextEndTime + ' is in ' + millisec + 'ms');
                millisecEnd = tsGetScheduleTime(node.nextEndTime, 10);
            }

            if (millisecEnd> 345600000) {
                millisecEnd = Math.min((millisecEnd - 129600000), 2147483646);
                node.timeOutEndObj = setTimeout(() => {
                    node.doCreateEndTimeout(node);
                }, millisecEnd); // 1,5 days before
                return;
            }
            node.timeOutEndObj = setTimeout(() => {
                node.timeOutEndObj = null;
                clearInterval(node.intervalObj);
                node.intervalObj = null;
                node.doCreateStartTimeout(node, false);
            }, millisecEnd);
        }; // doCreateEndTimeout

        /**
         * Recalculate the Start timeout
         */
        node.doRecalcStartTimeOut = () => {
            try {
                node.debug('performing a recalc of the next inject time');
                node.doCreateStartTimeout(node);
            } catch (err) {
                node.error(err.message);
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                });
            }
        };

        /**
         * Prepaes a message object for sending
         */
        node.prepOutMsg = msg => {
            node.debug(`prepOutMsg node.msg=${util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity })}`);
            msg.payload = node.positionConfig.getOutDataProp(node, msg, node.payloadData);
            msg.topic = config.topic;
            for (let i = 0; i < node.addPayloadData.length; i++) {
                node.debug(`prepOutMsg-${i} node.addPayload[${i}]=${util.inspect(node.addPayloadData[i], { colors: true, compact: 10, breakLength: Infinity })}`);
                node.positionConfig.setMessageProp(this, msg, node.addPayloadData[i], node.payloadData.now);
                node.debug(`prepOutMsg-${i} msg=${util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity })}`);
            }
            msg._srcid = node.id;
            msg._ts = node.payloadData.now.valueOf();
            return msg;
        };

        /**
         * creates the timeout
         * @param {*} node - the node representation
         * @param {boolean} [_onInit] - _true_ if is in initialisation
         * @param {Date} [dNow] - Date object with the calculation base
         * @returns {object} state or error
         */
        node.doCreateStartTimeout = (node, _onInit, dNow) => {
            node.debug(`doCreateStartTimeout _onInit=${_onInit} node.timeStartData=${util.inspect(node.timeStartData, { colors: true, compact: 10, breakLength: Infinity })}`);
            node.nextStartTime = null;
            node.nextStartTimeAlt = null;

            if (node.timeOutStartObj) {
                clearTimeout(node.timeOutStartObj);
                node.timeOutStartObj = null;
            }

            if (node.injType === tInj.none) {
                return { state:'ok', done: true };
            }

            if (node.injType === tInj.interval ||
                node.injType === tInj.intervalTime) {
                node.intervalTime = node.positionConfig.getFloatProp(node, null, node.intervalCountType, node.intervalCount, 0);
                if (node.intervalTime <= 0) {
                    throw new Error('Interval wrong!');
                } else {
                    if (node.intervalCountMultiplier > 0) {
                        node.intervalTime = Math.floor(node.intervalTime * node.intervalCountMultiplier);
                    }
                }
            }

            node.debug(`doCreateStartTimeout2 node.intervalTime=${util.inspect(node.intervalTime, { colors: true, compact: 10, breakLength: Infinity })}`);
            if (!node.timeStartData) {
                node.debug('doCreateStartTimeout - absolute Intervall');
                clearInterval(node.intervalObj);
                node.send(node.prepOutMsg({ type: 'interval-start' }));
                node.intervalObj = setInterval(() => {
                    node.send(node.prepOutMsg({ type: 'interval' }));
                }, node.intervalTime);
                return { state:'ok', done: true };
            }

            let fill = 'yellow';
            let shape = 'dot';

            let errorStatus = '';
            let warnStatus = '';
            node.timeStartData.isAltAvailable = false;
            node.timeStartData.isAltFirst = false;
            let isFixedTime = true;

            node.timeStartData.now = dNow || new Date();
            const startLimit = node.getTimeLimitation(node.timeStartData.now);
            if (startLimit.valid) {
                node.debug(`node.timeStartData=${util.inspect(node.timeStartData, { colors: true, compact: 10, breakLength: Infinity })}`);
                const nextStartTimeData = node.positionConfig.getTimeProp(node, undefined, node.timeStartData);
                if (nextStartTimeData.error) {
                    errorStatus = 'could not evaluate time';
                    if (_onInit === true) {
                        return { state: 'error', done: false, statusMsg: errorStatus, errorMsg: nextStartTimeData.error };
                    }
                    node.debug('node.nextStartTimeData=' + util.inspect(nextStartTimeData, { colors: true, compact: 10, breakLength: Infinity }));
                    node.error(nextStartTimeData.error);
                } else {
                    node.nextStartTime = nextStartTimeData.value;
                    isFixedTime = isFixedTime && nextStartTimeData.fix;


                    if (node.timeStartAltData) {
                        node.timeStartAltData.now = node.timeStartData.now;
                        node.debug(`node.timeStartAltData=${util.inspect(node.timeStartAltData, { colors: true, compact: 10, breakLength: Infinity })}`);
                        const nextTimeAltData = node.positionConfig.getTimeProp(node, undefined, node.timeStartAltData);

                        if (nextTimeAltData.error) {
                            errorStatus = 'could not evaluate alternate time';
                            isFixedTime = false;
                            if (_onInit === true) {
                                return { state:'error', done: false, statusMsg: errorStatus, errorMsg: nextTimeAltData.error};
                            }
                            node.debug('nextTimeAltData=' + util.inspect(nextTimeAltData, { colors: true, compact: 10, breakLength: Infinity }));
                            node.error(nextTimeAltData.error);
                        } else {
                            node.nextStartTimeAlt = nextTimeAltData.value;
                            isFixedTime = isFixedTime && nextTimeAltData.fix;
                            if (!hlp.isValidDate(node.nextStartTimeAlt)) {
                                hlp.handleError(this, 'Invalid time format of alternate time "' + node.nextStartTimeAlt + '"', undefined, 'internal error!');
                            } else {
                                node.timeStartData.isAltAvailable = true;
                            }
                        }
                    }
                }
            } else {
                warnStatus = startLimit.warnStatus;
                node.nextStartTime = startLimit.value;
            }

            if ((node.nextStartTime) && (errorStatus === '')) {
                if (!hlp.isValidDate(node.nextStartTime)) {
                    hlp.handleError(this, 'Invalid time format "' + node.nextStartTime + '"', undefined, 'internal error!');
                    return { state:'error', done: false, statusMsg: 'Invalid time format!', errorMsg: 'Invalid time format'};
                }

                let millisec = tsGetScheduleTime(node.nextStartTime, 10);
                if (node.timeStartData.isAltAvailable) {
                    shape = 'ring';
                    const millisecAlt = tsGetScheduleTime(node.nextStartTimeAlt, 10);
                    if (millisecAlt < millisec) {
                        millisec = millisecAlt;
                        node.timeStartData.isAltFirst = true;
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
                    node.timeOutStartObj = setTimeout(() => {
                        node.doRecalcStartTimeOut();
                    }, millisec); // 1,5 days before
                    fill = 'blue';
                } else if (this.injType === tInj.intervalTime) {
                    node.timeEndData.now = node.nextStartTime;
                    node.timeOutStartObj = setTimeout(() => {
                        node.timeOutStartObj = null;
                        node.doCreateEndTimeout(node);
                        clearInterval(node.intervalObj);
                        node.send(node.prepOutMsg({ type: 'interval-time-start' }));
                        node.intervalObj = setInterval(() => {
                            node.send(node.prepOutMsg({ type: 'interval-time' }));
                        }, node.intervalTime);
                    }, millisec);
                } else { // this.injType === tInj.timer
                    // node.debug('timeout ' + node.nextStartTime + ' is in ' + millisec + 'ms (isAlt=' + node.timeStartData.isAltAvailable + ' isAltFirst=' + node.timeStartData.isAltFirst + ')');
                    node.timeOutStartObj = setTimeout(() => {
                        // node.debug(`timeOutStartObj isAlt=${isAlt} isAltFirst=${node.timeStartData.isAltFirst}`);

                        const msg = {
                            type: 'start',
                            timeData: {}
                            // settingData: node.timeStartData,
                            // settingDataAlt: node.timeStartAltData
                        };
                        node.timeOutStartObj = null;
                        let useAlternateTime = false;
                        if (node.timeStartData.isAltAvailable) {
                            let needsRecalc = false;
                            try {
                                useAlternateTime = node.positionConfig.comparePropValue(node, msg, { type: node.propertyType, value: node.property},
                                    node.propertyOperator, { type:node.propertyThresholdType, value:node.propertyThresholdValue});
                                needsRecalc = (node.timeStartData.isAltFirst && !useAlternateTime) || (!node.timeStartData.isAltFirst && useAlternateTime);
                                // node.debug(`timeOutStartObj isAltAvailable=${node.timeStartData.isAltAvailable} isAltFirst=${node.timeStartData.isAltFirst} needsRecalc=${needsRecalc}`);

                            } catch (err) {
                                needsRecalc = node.timeStartData.isAltFirst;
                                hlp.handleError(node, RED._('time-inject.errors.invalid-property-type', {
                                    type: node.propertyType,
                                    value: node.property
                                }),  err);
                            }

                            if (needsRecalc) {
                                // node.debug(`doTimeRecalc, no send message!`);
                                node.doRecalcStartTimeOut();
                                return { state:'recalc', done: true };
                            }
                        }

                        // node.debug(`usenormalTime!`);
                        node.emit('input', msg);
                        return { state: 'emit', done: true };
                    }, millisec);
                    fill = 'green';

                    if (!isFixedTime && !node.intervalObj && (_onInit !== true)) {
                        node.intervalObj = setInterval(() => {
                            node.debug('retriggered');
                            node.doCreateStartTimeout(node);
                        }, node.recalcTime);
                    } else if (isFixedTime && node.intervalObj) {
                        clearInterval(node.intervalObj);
                        node.intervalObj = null;
                    }
                }
            }

            if ((errorStatus !== '')) {
                node.status({
                    fill: 'red',
                    shape,
                    text: errorStatus + ((node.intervalObj) ? ' ↺🖩' : '')
                });
                return { state:'error', done: false, statusMsg: errorStatus, errorMsg: errorStatus };
            // if an error occurred, will retry in 10 minutes. This will prevent errors on initialization.
            } else if ((warnStatus !== '')) {
                node.status({
                    fill: 'red',
                    shape,
                    text: warnStatus + ((node.intervalObj) ? ' ↺🖩' : '')
                });
            } else if (node.nextStartTimeAlt && node.timeOutStartObj) {
                if (node.timeStartData.isAltFirst) {
                    node.status({
                        fill,
                        shape,
                        text: node.positionConfig.toDateTimeString(node.nextStartTimeAlt) + ' / ' + node.positionConfig.toTimeString(node.nextStartTime)
                    });
                } else {
                    node.status({
                        fill,
                        shape,
                        text: node.positionConfig.toDateTimeString(node.nextStartTime) + ' / ' + node.positionConfig.toTimeString(node.nextStartTimeAlt)
                    });
                }
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
        };

        this.on('close', () => {
            if (node.timeOutStartObj) {
                clearTimeout(node.timeOutStartObj);
                node.timeOutStartObj = null;
            }

            if (node.intervalObj) {
                clearInterval(node.intervalObj);
                node.intervalObj = null;
            }
            // tidy up any state
        });

        this.on('input', (msg, send, done) => { // eslint-disable-line complexity
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) { if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };

            try {
                node.payloadData.now = new Date();
                node.debug('--------- time-inject - input (type=' + msg.type + ')');
                if (!node.positionConfig) {
                    throw new Error('configuration missing!');
                }
                node.doCreateStartTimeout(node, false, node.payloadData.now);
                send(node.prepOutMsg(msg));
                if (msg.payload === null || (typeof msg.payload === 'undefined')) {
                    done('could not evaluate ' + config.payloadType + '.' + config.payload);
                } else if (msg.payload.error) {
                    done('could not getting payload: ' + msg.payload.error);
                } else {
                    done();
                }
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
            if (!node.positionConfig) {
                node.error(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: RED._('node-red-contrib-sun-position/position-config:errors.pos-config-state')
                });
                return;
            }
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
                        type: 'once/startup'
                    }); // will create timeout
                }, (config.onceDelay || 0.1) * 1000);
                return;
            }

            setTimeout(() => {
                try {
                    const createTO = node.doCreateStartTimeout(node, true);
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

    RED.nodes.registerType('time-inject', timeInjectNode);

    timeInjectNode.prototype.close = function () {
        if (this.timeOutStartObj) {
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