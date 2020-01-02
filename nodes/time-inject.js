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
        const now = new Date();
        let millisec = time.getTime() - now.getTime();
        if (limit) {
            while (millisec < limit) {
                millisec += 86400000; // 24h
            }
        }

        return millisec;
    }

    // function tsSetAddProp(node, msg, type, name, valueType, value, format, offset, offsetType, multiplier, days, next) {
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
                throw new Error('could not evaluate ' + data.type + '.' + data.value);
            } else if (res.error) {
                this.error('error on getting additional payload 1: ' + res.error);
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
        this.nextTimeData = null;
        this.nextTimeAltData = null;
        const node = this;

        /**
         * Recalculate the timeout
         */
        function doTimeRecalc() {
            try {
                node.debug('needsRecalc');
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
        }

        /**
         * creates the timeout
         * @param {*} node - the node representation
         * @param {boolean} [_onInit] - _true_ if is in initialisation
         * @returns {object} state or error
         */
        function doCreateTimeout(node, _onInit) {
            let errorStatus = '';
            let isAltFirst = false;
            let isFixedTime = true;
            node.nextTime = null;
            node.nextTimeAlt = null;

            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
                node.timeOutObj = null;
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
            }

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
            }
            let fill = 'yellow';
            let shape = 'dot';
            if ((node.nextTime !== null) && (typeof node.nextTime !== undefined) && (errorStatus === '')) {
                if (!hlp.isValidDate(node.nextTime)) {
                    hlp.handleError(this, 'Invalid time format', undefined, 'internal error!');
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

                if (millisec > 34560000) {
                    // > 4 Days
                    if (node.intervalObj) {
                        clearInterval(node.intervalObj);
                        node.intervalObj = null;
                    }

                    node.timeOutObj = setTimeout(() => {
                        doTimeRecalc();
                    }, millisec - 259200000); // 3 days before
                    fill = 'blue';
                } else {
                    // node.debug('timeout ' + node.nextTime + ' is in ' + millisec + 'ms (isAlt=' + isAlt + ' isAltFirst=' + isAltFirst + ')');
                    node.timeOutObj = setTimeout((isAlt, isAltFirst) => {
                        const msg = {
                            type: 'start',
                            timeData: {}
                        };
                        node.timeOutObj = null;
                        let useAlternateTime = false;
                        if (isAlt) {
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
                                doTimeRecalc();
                                return { state:'recalc', done: true };
                            }
                        }

                        if (useAlternateTime && node.nextTimeAltData) {
                            msg.timeData = node.nextTimeAltData;
                        } else if (node.nextTimeData) {
                            msg.timeData = node.nextTimeData;
                        }
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
                    shape: 'dot',
                    text: errorStatus + ((node.intervalObj) ? ' ↺🖩' : '')
                });
                return { state:'error', done: false, statusMsg: errorStatus, errorMsg: errorStatus };
            // if an error occurred, will retry in 10 minutes. This will prevent errors on initialization.
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

            try {
                msg._srcid = node.id;
                node.debug('input ');
                doCreateTimeout(node);
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
                node.status({
                    fill: 'yellow',
                    shape: 'ring',
                    text: RED._('time-inject.message.onceDelay', { seconds: (config.onceDelay || 0.1)})
                });

                config.onceTimeout = setTimeout(() => {
                    node.emit('input', {
                        type: 'once'
                    });
                    doCreateTimeout(node);
                }, (config.onceDelay || 0.1) * 1000);
                return;
            }

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