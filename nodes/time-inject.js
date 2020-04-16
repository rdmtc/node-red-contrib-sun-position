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

        this.timeData = {
            type: config.timeType || 'none',
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

<<<<<<< Updated upstream
        if (!this.timeData.offsetType) {
            this.timeData.offsetType = ((this.timeData.offset === 0) ? 'none' : 'num');
        }
        if (this.timeData.days === '') {
            throw new Error('No valid days given! Please check settings!');
        }
        if (this.timeData.months === '') {
            throw new Error('No valid month given! Please check settings!');
        }
        if (this.timeData.onlyEvenDays && this.timeData.onlyOddDays) {
            this.timeData.onlyEvenDays = false;
            this.timeData.onlyOddDays = false;
        }

        this.timeAltData = {
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
        if (!this.timeAltData.offsetType) { this.timeAltData.offsetType = ((this.timeAltData.offset === 0) ? 'none' : 'num'); }

        if (this.timeAltData.days === '') {
            throw new Error('No valid alternate days given! Please check settings!');
        }
        if (this.timeAltData.months === '') {
            throw new Error('No valid alternate month given! Please check settings!');
        }
        if (this.timeAltData.onlyEvenDays && this.timeAltData.onlyOddDays) {
            this.timeAltData.onlyEvenDays = false;
            this.timeAltData.onlyOddDays = false;
        }

        this.property = config.property || '';
        this.propertyType = config.propertyType || 'none';
        this.propertyOperator = config.propertyCompare || 'true';
        this.propertyThresholdValue = config.propertyThreshold;
        this.propertyThresholdType = config.propertyThresholdType;
=======
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

        /*    if (typeof this.addPayload1Data.next === 'undefined' ||
                this.addPayload1Data.next === null ||
                this.addPayload1Data.next === true ||
                this.addPayload1Data.next === 'true') {
                this.addPayload1Data.next = true;
            } else if (this.addPayload1Data.next === 'false' || this.addPayload1Data.next === false) {
                this.addPayload1Data.next = false;
            }

            if (typeof config.addPayload2Type !== 'undefined' &&
                typeof config.addPayload2ValueType !== 'undefined' &&
                config.addPayload2Type !== 'none' &&
                config.addPayload2ValueType !== 'none' &&) {
                this.addPayload2Data = {
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
                };
                if (typeof this.addPayload2Data.next === 'undefined' ||
                    this.addPayload2Data.next === null ||
                    this.addPayload2Data.next === true ||
                    this.addPayload2Data.next === 'true') {
                    this.addPayload2Data.next = true;
                } else if (this.addPayload2Data.next === 'false' ||
                        this.addPayload2Data.next === false) {
                    this.addPayload2Data.next = false;
                }

                if (typeof config.addPayload3Type !== 'undefined' &&
                    typeof config.addPayload3ValueType !== 'undefined' &&
                    config.addPayload3Type !== 'none' &&
                    config.addPayload3ValueType !== 'none') {
                    this.addPayload3Data = {
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
                    };
                    if (typeof this.addPayload3Data.next === 'undefined' ||
                        this.addPayload3Data.next === null ||
                        this.addPayload3Data.next === true ||
                        this.addPayload3Data.next === 'true') {
                        this.addPayload3Data.next = true;
                    } else if (this.addPayload3Data.next === 'false' ||
                            this.addPayload3Data.next === false) {
                        this.addPayload3Data.next = false;
                    }
                } // has addPayload3
            } // has addPayload2
        } // has addPayload1 */

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
>>>>>>> Stashed changes

        this.recalcTime = (config.recalcTime || 2) * 3600000;

        this.timeOutObj = null;
        this.intervalObj = null;
        this.nextTime = null;
        this.nextTimeAlt = null;
        this.nextTimeData = null;
        this.nextTimeAltData = null;
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
<<<<<<< Updated upstream
        }
=======
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
>>>>>>> Stashed changes

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
            let shape = 'dot';

            let errorStatus = '';
            let warnStatus = '';
            let isAltFirst = false;
            let isFixedTime = true;
            let timeValid = (node.timeData && node.timeData.type !== 'none');
            let timeAltValid = (node.timeAltData && node.propertyType !== 'none' && node.timeAltData.type !== 'none');
            node.timeData.now = dNow || new Date();
            node.timeAltData.now = node.timeData.now;

            node.nextTime = null;
            node.nextTimeAlt = null;

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
                        node.nextTime = new Date(dStart.getFullYear() + ((dNow >= dEnd) ? 1 : 0), dStart.getMonth(), dStart.getDate(), 0, 0, 1);
                        warnStatus = RED._('time-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(node.nextTime)+ ']';
                        timeValid = false;
                        timeAltValid = false;
                    }
                } else {
                    // switch between year from end to start - e.g. 2.11. - 20.3.
                    if (dNow < dStart && dNow > dEnd) {
                        node.nextTime = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate(), 0, 0, 1);
                        warnStatus = RED._('time-inject.errors.invalid-daterange') + ' [' + node.positionConfig.toDateString(node.nextTime)+ ']';
                        timeValid = false;
                        timeAltValid = false;
                    }
                }
            }
            if (timeValid && node.positionConfig) {
                node.nextTimeData = node.positionConfig.getTimeProp(node, undefined, node.timeData);
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
            }

            if (timeAltValid && node.positionConfig) {
                node.nextTimeAltData = node.positionConfig.getTimeProp(node, undefined, node.timeAltData);

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
            }
            if ((node.nextTime !== null) && (typeof node.nextTime !== undefined) && (errorStatus === '')) {
                if (!hlp.isValidDate(node.nextTime)) {
                    hlp.handleError(this, 'Invalid time format "' + node.nextTime + '"', undefined, 'internal error!');
                    return { state:'error', done: false, statusMsg: 'Invalid time format!', errorMsg: 'Invalid time format'};
                }

                let millisec = tsGetScheduleTime(node.nextTime, 10);
                const isAlt = node.nextTimeAlt;
                if (isAlt) {
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
                        doTimeRecalc();
                    }, millisec); // 1,5 days before
                    fill = 'blue';
                } else {
                    // node.debug('timeout ' + node.nextTime + ' is in ' + millisec + 'ms (isAlt=' + isAlt + ' isAltFirst=' + isAltFirst + ')');
                    node.timeOutObj = setTimeout((isAlt, isAltFirst) => {
                        // node.debug(`timeOutObj isAlt=${isAlt} isAltFirst=${isAltFirst}`);

                        const msg = {
                            type: 'start',
                            timeData: {}
                            // settingData: node.timeData,
                            // settingDataAlt: node.timeAltData
                        };
                        node.timeOutObj = null;
                        let useAlternateTime = false;
                        if (isAlt) {
                            let needsRecalc = false;
                            try {
<<<<<<< Updated upstream
                                useAlternateTime = node.positionConfig.comparePropValue(node, msg, node.propertyType, node.property,
                                    node.propertyOperator, node.propertyThresholdType, node.propertyThresholdValue);
                                needsRecalc = (isAltFirst && !useAlternateTime) || (!isAltFirst && useAlternateTime);
                                // node.debug(`timeOutObj isAlt=${isAlt} isAltFirst=${isAltFirst} needsRecalc=${needsRecalc}`);
=======
                                useAlternateTime = node.positionConfig.comparePropValue(node, msg, { type: node.propertyType, value: node.property},
                                    node.propertyOperator, { type:node.propertyThresholdType, value:node.propertyThresholdValue});
                                needsRecalc = (node.timeStartData.isAltFirst && !useAlternateTime) || (!node.timeStartData.isAltFirst && useAlternateTime);
                                // node.debug(`timeOutStartObj isAltAvailable=${node.timeStartData.isAltAvailable} isAltFirst=${node.timeStartData.isAltFirst} needsRecalc=${needsRecalc}`);
>>>>>>> Stashed changes

                            } catch (err) {
                                needsRecalc = isAltFirst;
                                hlp.handleError(node, RED._('time-inject.errors.invalid-property-type', {
                                    type: node.propertyType,
                                    value: node.property
                                }),  err);
                            }

                            if (needsRecalc) {
                                // node.debug(`doTimeRecalc, no send message!`);
                                doTimeRecalc();
                                return { state:'recalc', done: true };
                            }
                        }

                        if (useAlternateTime && node.nextTimeAltData) {
                            // node.debug(`useAlternateTime!`);
                            msg.timeData = node.nextTimeAltData;
                        } else if (node.nextTimeData) {
                            // node.debug(`usenormalTime!`);
                            msg.timeData = node.nextTimeData;
                        }
                        // node.debug(`usenormalTime!`);
                        node.emit('input', msg);
                        return { state: 'emit', done: true };
                    }, millisec, isAlt, isAltFirst);
                    fill = 'green';

                    if (!isFixedTime && !node.intervalObj && (_onInit !== true)) {
                        node.intervalObj = setInterval(() => {
                            node.debug('retriggered');
                            doCreateTimeout(node);
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
        }

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
            const dNow = new Date();

            try {
                msg._srcid = node.id;
                node.debug('--------- time-inject - input (type=' + msg.type + ')');
                doCreateTimeout(node, false, dNow);
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
                    next: true,
                    now: dNow
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
                        days: config.addPayload1Days,
                        now: dNow
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
                        days: config.addPayload2Days,
                        now: dNow
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
                        days: config.addPayload3Days,
                        now: dNow
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
                        type: 'once/startup'
                    });
                    doCreateTimeout(node);
                }, (config.onceDelay || 0.1) * 1000);
                return;
            }

            setTimeout(() => {
                try {
                    const createTO = doCreateTimeout(node, true);
                    if (createTO.done !== true) {
                        if (createTO.errorMsg) {
                            node.warn(RED._('node-red-contrib-sun-position/position-config:errors.warn-init', { message: createTO.errorMsg, time: 6}));
                        }
                        setTimeout(() => {
                            try {
                                doCreateTimeout(node);
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