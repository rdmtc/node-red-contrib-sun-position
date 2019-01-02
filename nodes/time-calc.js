/********************************************
 * time-calc:
 *********************************************/
"use strict";
const util = require('util');

const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));
//const cron = require("cron");

module.exports = function (RED) {
    "use strict";

    function tsGetOperandData(node, msg, type, value, format, offset, multiplier) {
        if (type !== 'none' && name) {
            let res = tsGetOperandData(node, msg, type, name, format, offset, multiplier);
            if (res == null || (typeof res === 'undefined')) {
                throw new Error("could not evaluate " + valueType + '.' + value);
            } else if (res.error) {
                this.error('error on getting additional payload 1: ' + res.error);
            } else if (type === 'msg' || type === 'msgProperty') {
                RED.util.setMessageProperty(msg, name, res);
            } else if ((type === 'flow' || type === 'global')) {
                let contextKey = RED.util.parseContextStore(name);
                node.context()[type].set(contextKey.key, res, contextKey.store);
            }
        }

        if (type == null || type === "none" || type === "" || (typeof type === 'undefined') || type === "date") {
            return Date.now();
        } else if (type === "entered" || type === "pdsTime" || type === "pdmTime") {
            let data = node.positionConfig.getTimeProp(node, msg, type, value, 0, 0, days);
            if (data == null || (typeof data === 'undefined')) {
                throw new Error("could not evaluate " + type + '.' + value);
            } else if (data.error) {
                throw new Error('error on getting operand: ' + data.error);
            }
        } else {
            let data = RED.util.evaluateNodeProperty(value, type, node, msg);
            if (!data) {
                throw new Error("could not evaluate " + type + '.' + value);
            }
            format = format || 0;
            if (isNaN(format)) {
                data = hlp.getDateFromFormat(data, format);
            } else {
                switch (Number(format)) {
                    case 1: //timeparse_ECMA262
                        data = Date.parse(data);
                    case 2: //timeparse_TextOther
                        data = hlp.parseDateFromFormat(parseDateTime, true);
                    case 3: //timeformat_YYYYMMDDHHMMSS
                        return getforamtDateCmp(data.value);
                    case 4: //timeformat_YYYYMMDD_HHMMSS
                        return getforamtDateCmp2(data.value);
                        //case 5: //timeformat_ms
                    case 6: //timeformat_sec
                        data = new Date(Number(date) * 1000);
                    case 7: //timeformat_min
                        data = new Date(Number(date) * 60000);
                    case 8: //timeformat_hour
                        data = new Date(Number(date) * 3600000);
                    default:
                        data = hlp.getDateOfText(data);
                }
            }
            if (data === "Invalid Date" || isNaN(data)) {
                throw new Error("could not evaluate format of " + data);
            }
        }
        if (offset != 0 && multiplier > 0) {
            return new Date(data.value.getTime() + offset * multiplier);
        } else if (offset !== 0 && multiplier == -1) {
            data.value.setMonth(data.value.getMonth() + offset);
        } else if (offset !== 0 && multiplier == -2) {
            data.value.setFullYear(data.value.getFullYear() + offset);
        }
        return data.value;
    }

    function timeCalcNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        //this.debug('initialize timeCalcNode ' + util.inspect(config));
        let operator = config.operator || 0;
        var node = this;

        this.on('input', msg => {
            try {
                node.debug('input ' + util.inspect(msg));

                let operand1 = tsGetOperandData(this, msg, config.operand1Type, config.operand1, config.operand1Format, config.operand1Offset, config.operand1OffsetMultiplier);
                let result = false;
                if (operator != 0) {
                    let operand2 = tsGetOperandData(this, msg, config.operand1Type, config.operand2, config.operand2Format, config.operand2Offset, config.operand2OffsetMultiplier);
                    switch (operator) {
                        case 1: //greater
                            result = operand1.getTime() > operand12getTime();
                            break;
                        case 2: //greaterOrEqual
                            result = operand1.getTime() >= operand12getTime();
                            break;
                        case 3: //lesser
                            result = operand1.getTime() < operand12getTime();
                            break;
                        case 4: //lesserOrEqual
                            result = operand1.getTime() <= operand12getTime();
                            break;
                        case 5: //equal
                            result = operand1.getTime() == operand12getTime();
                            break;
                        case 6: //unequal
                            result = operand1.getTime() != operand12getTime();
                            break;
                        case 7: //equalSec
                            operand1.setMilliseconds(0);
                            operand2.setMilliseconds(0);
                            result = operand1.getTime() == operand12getTime();
                            break;
                        case 8: //unequalSec
                            operand1.setMilliseconds(0);
                            operand2.setMilliseconds(0);
                            result = operand1.getTime() != operand12getTime();
                            break;
                        case 7: //equalMin
                            operand1.setMilliseconds(0);
                            operand1.setSeconds(0);
                            operand2.setMilliseconds(0);
                            operand2.setSeconds(0);
                            result = operand1.getTime() == operand12getTime();
                            break;
                        case 8: //unequalMin
                            operand1.setMilliseconds(0);
                            operand1.setSeconds(0);
                            operand2.setMilliseconds(0);
                            operand2.setSeconds(0);
                            result = operand1.getTime() != operand12getTime();
                            break;
                    }
                } else {
                    result = operand1;
                }

                if (config.result1Type !== 'none' && config.result1Value) {
                    let res = tsGetPropData(node, msg, valueType, value, format, offset, days);
                    if (res == null || (typeof res === 'undefined')) {
                        throw new Error("could not evaluate " + valueType + '.' + value);
                    } else if (res.error) {
                        this.error('error on getting additional payload 1: ' + res.error);
                    } else if (type === 'msg' || type === 'msgProperty') {
                        RED.util.setMessageProperty(msg, name, res);
                    } else if ((type === 'flow' || type === 'global')) {
                        let contextKey = RED.util.parseContextStore(name);
                        node.context()[type].set(contextKey.key, res, contextKey.store);
                    }
                }
                tsSetAddProp(this, msg, config.addPayload1Type, config.addPayload1, config.addPayload1ValueType, config.addPayload1Value, config.addPayload1Format, config.addPayload1Offset, config.addPayload1Days);

                node.send(msg);
            } catch (err) {
                hlp.errorHandler(this, err, RED._("time-calc.errors.error-text"), RED._("time-calc.errors.error-title"));
            }
        });

        try {
            if (config.once) {
                config.onceTimeout = setTimeout(function () {
                    node.emit("input", {
                        type: 'once'
                    });
                    doCreateTimeout(node, undefined);
                }, (config.onceDelay || 0.1) * 1000);
            } else {
                doCreateTimeout(node, undefined);
            }
        } catch (err) {
            hlp.errorHandler(this, err, RED._("time-calc.errors.error-text"), RED._("time-calc.errors.error-title"));
        }
    }
    RED.nodes.registerType('time-calc', timeCalcNode);
};