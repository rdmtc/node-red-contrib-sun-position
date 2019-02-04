/********************************************
 * time-inject:
 *********************************************/
'use strict';

const util = require('util');
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));

module.exports = function (RED) {
    'use strict';

    function tsGetScheduleTime(time, limit) {
        const now = new Date();
        let millis = time.getTime() - now.getTime();
        if (limit) {
            while (millis < limit) {
                millis += 86400000; // 24h
            }
        }

        return millis;
    }

    function tsGetPropData(node, msg, type, value, format, offset, offsetType, multiplier, days) {
        if (type === null || type === 'none' || type === '' || (typeof type === 'undefined')) {
            if (value === '' || (typeof value === 'undefined')) {
                const offsetX = this.positionConfig.getFloatProp(node,offsetType, offset);
                const result = hlp.addOffset(Date.now(), offsetX, multiplier);
                return hlp.getFormattedDateOut(result, format, RED._('time-inject.days'), RED._('time-inject.month'), RED._('time-inject.dayDiffNames'));
            }
            return value;
        } else if (type === 'pdsCalcData') {
            return node.positionConfig.getSunCalc(msg.ts);
        } else if (type === 'pdmCalcData') {
            return node.positionConfig.getMoonCalc(msg.ts);
        } else if (type === 'msgPayload') {
            return msg.payload;
        } else if (type === 'msgTs') {
            return msg.ts;
        } else if ((type === 'pdsTime') ||
                    (type === 'pdmTime')) {
            let result;
            const offsetX = this.positionConfig.getFloatProp(node,offsetType, offset);
            if (type === 'pdsTime') { // sun
                result = node.getSunTime(Date.now(), value, offsetX, multiplier, days);
            } else if (type === 'pdmTime') { // moon
                result = node.getMoonTime(Date.now(), value, offsetX, multiplier, days);
            }
            if (result && result.value && !result.error) {
                return hlp.getFormattedDateOut(result, format, RED._('time-inject.days'), RED._('time-inject.month'), RED._('time-inject.dayDiffNames'));
            }
            return null;
        } else if (type === 'entered' || type === 'dateEntered') {
            let result = hlp.getDateOfText(String(value));
            const offsetX = this.positionConfig.getFloatProp(node,offsetType, offset);
            result = hlp.normalizeDate(result, offsetX, multiplier, 1, days);
            return hlp.getFormattedDateOut(result, format, RED._('time-inject.days'), RED._('time-inject.month'), RED._('time-inject.dayDiffNames'));
        } else if (type === 'dayOfMonth') {
            let result = new Date();
            result = hlp.getSpecialDayOfMonth(result.getFullYear(),result.getMonth(), value);
            if (result !== null && typeof result !== 'undefined') {
                result = hlp.addOffset(result, offset, multiplier);
                return hlp.getFormattedDateOut(result, format, RED._('position-config.days'), RED._('position-config.month'), RED._('position-config.dayDiffNames'));
            }
            return null;
        }
        return RED.util.evaluateNodeProperty(value, type, node, msg);
    }

    function tsSetAddProp(node, msg, type, name, valueType, value, format, offset, offsetType, multiplier, days) {
        if (type !== 'none' && name) {
            const res = tsGetPropData(node, msg, valueType, value, format, offset, offsetType, multiplier, days);
            if (res === null || (typeof res === 'undefined')) {
                throw new Error('could not evaluate ' + valueType + '.' + value);
            } else if (res.error) {
                this.error('error on getting additional payload 1: ' + res.error);
            } else if (type === 'msg' || type === 'msgProperty') {
                RED.util.setMessageProperty(msg, name, res);
            } else if ((type === 'flow' || type === 'global')) {
                const contextKey = RED.util.parseContextStore(name);
                node.context()[type].set(contextKey.key, res, contextKey.store);
            }
        }
    }

    function timeInjectNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize timeInjectNode ' + util.inspect(config));

        this.time = config.time;
        this.timeType = config.timeType || 'none';
        this.timeDays = config.timeDays;
        this.timeAltDays = config.timeAltDays;
        this.offset = config.offset || config.timeOffset || 0;
        this.offsetType = config.offsetType || (this.offset === 0) ? 'none' : 'num';
        this.offsetMultiplier = config.offsetMultiplier || config.timeOffsetMultiplier || 60;

        this.property = config.property || '';
        this.propertyType = config.propertyType || 'none';
        this.timeAlt = config.timeAlt || '';
        this.timeAltType = config.timeAltType || 'none';
        this.timeAltOffset = config.timeAltOffset || 0;
        this.timeAltOffsetType = config.timeAltOffsetType || (this.timeAltOffset === 0) ? 'none' : 'num';
        this.timeAltOffsetMultiplier = config.timeAltOffsetMultiplier || 60;

        this.recalcTime = (config.recalcTime || 2) * 3600000;

        this.timeOutObj = null;
        this.intervalObj = null;
        this.nextTime = null;
        this.nextTimeAlt = null;
        this.nextTimeData = null;
        this.nextTimeAltData = null;
        const node = this;

        function doCreateTimeout(node, msg) {
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
                // (srcNode, msg, vType, value, offset, next, days)
                // node.nextTime = hlp.getTimeProp(node, node.timeType, node.time, node.offset, node.offsetMultiplier, 1);
                const nextTimeOffset = node.positionConfig.getFloatProp(node,msg, node.offsetType, node.offset);
                node.nextTimeData = node.positionConfig.getTimeProp(node, undefined, node.timeType, node.time, nextTimeOffset, node.offsetMultiplier, 1, node.timeDays);
                if (node.nextTimeData.error) {
                    errorStatus = 'could not evaluate time';
                    node.error(node.nextTimeData.error);
                    node.debug(util.inspect(node.nextTimeData));
                    // console.log('1');
                    node.nextTime = null;
                    isFixedTime = false;
                } else {
                    node.nextTime = node.nextTimeData.value;
                    isFixedTime = node.nextTimeData.fix;
                }
            }
            // console.log(util.inspect(node.nextTimeData));

            if (node.propertyType !== 'none' &&
                node.timeAltType !== 'none' &&
                node.positionConfig) {
                const nextTimeOffset = node.positionConfig.getFloatProp(node,msg, node.timeAltOffsetType, node.timeAltOffset);
                node.nextTimeAltData = node.positionConfig.getTimeProp(node, undefined, node.timeAltType, node.timeAlt, nextTimeOffset, node.timeAltOffsetMultiplier, 1, node.timeAltDays);
                if (node.nextTimeAltData.error) {
                    errorStatus = 'could not evaluate alternate time';
                    node.error(node.nextTimeAltData.error);
                    // console.log('2');
                    node.nextTimeAlt = null;
                    isFixedTime = false;
                } else {
                    node.nextTimeAlt = node.nextTimeAltData.value;
                    isFixedTime = isFixedTime && node.nextTimeAltData.fix;
                }
            }

            if (node.nextTime && !errorStatus) {
                if (!(node.nextTime instanceof Date) || node.nextTime === 'Invalid Date' || isNaN(node.nextTime)) {
                    // node.debug(node.nextTime);
                    hlp.handleError(this, 'Invalid time format', undefined, 'internal error!');
                    return;
                }

                let millis = tsGetScheduleTime(node.nextTime, 10);
                // node.debug('timeout ' + node.nextTime + ' is in ' + milis + 'ms');
                const isAlt = (node.nextTimeAlt);
                if (isAlt) {
                    const millisAlt = tsGetScheduleTime(node.nextTimeAlt, 10);
                    if (millisAlt < millis) {
                        millis = millisAlt;
                        isAltFirst = true;
                    }
                }

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
                            const res = RED.util.evaluateNodeProperty(node.property, node.propertyType, node, msg);
                            useAlternateTime = hlp.isTrue(res);
                            needsRecalc = (isAltFirst && !useAlternateTime) || (!isAltFirst && useAlternateTime);
                        } catch (err) {
                            needsRecalc = isAltFirst;
                            hlp.handleError(node, RED._('time-inject.errors.invalid-property-type', {
                                type: node.propertyType,
                                value: node.property
                            }),  err);
                        }

                        if (needsRecalc) {
                            try {
                                doCreateTimeout(node, msg);
                            } catch (err) {
                                hlp.handleError(node, RED._('time-inject.errors.error-text'), err, RED._('time-inject.errors.error-title'));
                            }

                            return;
                        }
                    }

                    if (useAlternateTime && node.nextTimeAltData) {
                        msg.timeData = node.nextTimeAltData;
                    } else if (node.nextTimeData) {
                        msg.timeData = node.nextTimeData;
                    }

                    // node.debug('redo doCreateTimeout');
                    node.emit('input', msg);
                }, millis, isAlt, isAltFirst);
            }

            if (!isFixedTime && !node.intervalObj) {
                node.intervalObj = setInterval(() => {
                    // node.debug('retrigger');
                    doCreateTimeout(node, msg);
                }, node.recalcTime);
            } else if (isFixedTime && node.intervalObj) {
                clearInterval(node.intervalObj);
                node.intervalObj = null;
            }

            if (errorStatus) {
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: errorStatus + ((node.intervalObj) ? ' 🖩' : '')
                });
            } else if (node.nextTimeAlt && node.timeOutObj) {
                if (isAltFirst) {
                    node.status({
                        fill: 'green',
                        shape: 'ring',
                        text: node.nextTimeAlt.toLocaleString() + ' / ' + node.nextTime.toLocaleTimeString()
                    });
                } else {
                    node.status({
                        fill: 'green',
                        shape: 'dot',
                        text: node.nextTime.toLocaleString() + ' / ' + node.nextTimeAlt.toLocaleTimeString()
                    });
                }
            } else if (node.nextTime && node.timeOutObj) {
                node.status({
                    fill: 'green',
                    shape: 'dot',
                    text: node.nextTime.toLocaleString()
                });
            } else {
                node.status({});
            }
        }

        this.on('close', () => {
            if (node.timeOutObj) {
                clearTimeout(node.timeOutObj);
            }

            if (node.intervalObj) {
                clearInterval(node.intervalObj);
            }
            // tidy up any state
        });

        this.on('input', msg => {
            try {
                doCreateTimeout(node, msg);
                node.debug('input ' + util.inspect(msg));
                msg.topic = config.topic;
                if (!node.positionConfig) {
                    throw new Error('configuration missing!');
                }

                const value = tsGetPropData(this, msg, config.payloadType, config.payload, config.payloadTimeFormat, node.payloadOffset, config.payloadOffsetType, config.payloadOffsetMultiplier);
                if (value === null || (typeof value === 'undefined')) {
                    throw new Error('could not evaluate ' + config.payloadType + '.' + config.payload);
                } else if (value.error) {
                    throw new Error('could not getting payload: ' + value.error);
                } else {
                    msg.payload = value;
                }

                tsSetAddProp(this, msg, config.addPayload1Type, config.addPayload1, config.addPayload1ValueType, config.addPayload1Value,
                    config.addPayload1Format, config.addPayload1Offset, config.addPayload1OffsetType, config.addPayload1OffsetMultiplier, config.addPayload1Days);
                tsSetAddProp(this, msg, config.addPayload2Type, config.addPayload2, config.addPayload2ValueType, config.addPayload2Value,
                    config.addPayload2Format, config.addPayload2Offset, config.addPayload2OffsetType, config.addPayload2OffsetMultiplier, config.addPayload2Days);
                tsSetAddProp(this, msg, config.addPayload3Type, config.addPayload3, config.addPayload3ValueType, config.addPayload3Value,
                    config.addPayload3Format, config.addPayload3Offset, config.addPayload3OffsetType, config.addPayload3OffsetMultiplier, config.addPayload3Days);

                node.send(msg);
            } catch (err) {
                hlp.handleError(this, RED._('time-inject.errors.error-text'), err, RED._('time-inject.errors.error-title'));
            }
        });

        try {
            if (config.once) {
                config.onceTimeout = setTimeout(() => {
                    node.emit('input', {
                        type: 'once'
                    });
                    doCreateTimeout(node, undefined);
                }, (config.onceDelay || 0.1) * 1000);
            } else {
                doCreateTimeout(node, undefined);
            }
        } catch (err) {
            hlp.handleError(this, RED._('time-inject.errors.error-text'), err, RED._('time-inject.errors.error-title'));
        }
    }

    RED.nodes.registerType('time-inject', timeInjectNode);

    RED.httpAdmin.get('/sun-position/js/*', RED.auth.needsPermission('sun-position.read'), (req,res) => {
        const options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
        };
        res.sendFile(req.params[0], options);
    });
};