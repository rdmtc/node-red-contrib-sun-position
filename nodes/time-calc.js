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
        let result = {};
        if (type == null || type === "none" || type === "") {
            return Date.now();
        } else if (type === "entered" || type === "pdsTime" || type === "pdmTime" || type === "date") {
            result = node.positionConfig.getTimeProp(node, msg, type, value);
            if (result == null) {
                throw new Error("could not evaluate " + type + '.' + value);
            } else if (result.error) {
                throw new Error('error on getting operand: ' + result.error);
            }
        } else { //msg, flow, global, str, num, env
            let data = RED.util.evaluateNodeProperty(value, type, node, msg);
            if (!data) {
                throw new Error("could not evaluate " + type + '.' + value);
            }
            result.value = hlp.parseDateFromFormat(data, format, RED._("time-calc.days"), RED._("time-calc.month"), RED._("time-calc.dayDiffNames"));

            if (result.value === "Invalid Date" || isNaN(result.value)) {
                throw new Error("could not evaluate format of " + data);
            }
        }
        if (offset != 0 && multiplier > 0) {
            return new Date(result.value.getTime() + offset * multiplier);
        } else if (offset !== 0 && multiplier == -1) {
            result.value.setMonth(result.value.getMonth() + offset);
        } else if (offset !== 0 && multiplier == -2) {
            result.value.setFullYear(result.value.getFullYear() + offset);
        }
        return result.value;
    }

    function tsGetPropData(node, msg, type, value, format, offset, days) {
        if (type == null || type === "none" || type === "") {
            if (value === "" || (typeof value === 'undefined')) {
                return Date.now();
            } else {
                return value;
            }
        } else if (type === "pdsCalcData") {
            return node.positionConfig.getSunCalc(msg.ts);
        } else if (type === "pdmCalcData") {
            return node.positionConfig.getMoonCalc(msg.ts);
        } else if (type === "entered" || type === "pdsTime" || type === "pdmTime" || type === "date") {
            let data = node.positionConfig.getTimeProp(node, msg, type, value, offset, 1, days);
            if (!data.error) {
                return hlp.getFormatedDateOut(data.value, format, false, RED._("time-inject.days"), RED._("time-inject.month"), RED._("time-inject.dayDiffNames"));
            }
            return data;
        }
        return RED.util.evaluateNodeProperty(value, type, node, msg);
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
                if (node.positionConfig == null ||
                    config.operator == null ||
                    config.operand1Type == null) {
                    throw new Error('Configuration is missing!!');
                }
                let operand1 = tsGetOperandData(this, msg, config.operand1Type, config.operand1, config.operand1Format, config.operand1Offset, config.operand1OffsetMultiplier);
                let operand2 = null;
                let result = false;
                let resObj = null;

                if (operator > 0) {
                    let useAltOper = true;
                    if (config.operand2PropertyType !== 'none' &&
                        config.operand2Type !== 'none') {
                        let res = RED.util.evaluateNodeProperty(config.operand2Property, config.operand2PropertyType, node, msg);
                        useAltOper = ((res == true) || (res == 'true'));
                    }
                    if (useAltOper) {
                        operand2 = tsGetOperandData(this, msg, config.operand2AltType, config.operand2Alt, config.operand2AltFormat, config.operand2AltOffset, config.operand2AltOffsetMultiplier);
                    } else {
                        operand2 = tsGetOperandData(this, msg, config.operand2Type, config.operand2, config.operand2Format, config.operand2Offset, config.operand2OffsetMultiplier);
                    }
                    switch (operator) {
                        case 1: //greater
                            result = operand1.getTime() > operand2.getTime();
                            break;
                        case 2: //greaterOrEqual
                            result = operand1.getTime() >= operand2.getTime();
                            break;
                        case 3: //lesser
                            result = operand1.getTime() < operand2.getTime();
                            break;
                        case 4: //lesserOrEqual
                            result = operand1.getTime() <= operand2.getTime();
                            break;
                        case 5: //equal
                            result = operand1.getTime() == operand2.getTime();
                            break;
                        case 6: //unequal
                            result = operand1.getTime() != operand2.getTime();
                            break;
                        case 7: //equalSec
                            operand1.setMilliseconds(0);
                            operand2.setMilliseconds(0);
                            result = operand1.getTime() == operand2.getTime();
                            break;
                        case 8: //unequalSec
                            operand1.setMilliseconds(0);
                            operand2.setMilliseconds(0);
                            result = operand1.getTime() != operand2.getTime();
                            break;
                        case 9: //equalMin
                            operand1.setMilliseconds(0);
                            operand1.setSeconds(0);
                            operand2.setMilliseconds(0);
                            operand2.setSeconds(0);
                            result = operand1.getTime() == operand2.getTime();
                            break;
                        case 10: //unequalMin
                            operand1.setMilliseconds(0);
                            operand1.setSeconds(0);
                            operand2.setMilliseconds(0);
                            operand2.setSeconds(0);
                            result = operand1.getTime() != operand2.getTime();
                            break;
                    }
                }

                if (config.result1Type !== 'none' && config.result1Value) {
                    let resObj = null;
                    if (config.result1Type == 'operand1') {
                        resObj = hlp.getFormatedDateOut(operand1, config.result1Format, false, RED._("time-inject.days"), RED._("time-inject.month"), RED._("time-inject.dayDiffNames"));
                    } else if (config.result1Type == 'operand2') {
                        resObj = hlp.getFormatedDateOut(operand2, config.result1Format, false, RED._("time-inject.days"), RED._("time-inject.month"), RED._("time-inject.dayDiffNames"));
                    } else {
                        resObj = tsGetPropData(node, msg, config.result1ValueType, config.result1Value, config.result1Format, config.result1Offset);
                    }
                    if (resObj == null) {
                        throw new Error("could not evaluate " + config.result1ValueType + '.' + config.result1Value);
                    } else if (resObj.error) {
                        this.error('error on getting result: ' + resObj.error);
                    } else if (config.result1Type === 'msg' || config.result1Type === 'msgProperty') {
                        RED.util.setMessageProperty(msg, name, resObj);
                    } else if ((config.result1Type === 'flow' || config.result1Type === 'global') && ((operator <= 0) || result)) {
                        let contextKey = RED.util.parseContextStore(name);
                        node.context()[type].set(contextKey.key, resObj, contextKey.store);
                    }
                }

                if ((operator > 0) && result) {
                    node.send([msg, null]);
                } else if (operator > 0) {
                    node.send([null, msg]);
                }
                node.send(msg);
            } catch (err) {
                hlp.errorHandler(this, err, RED._("time-calc.errors.error-text"), RED._("time-calc.errors.error-title"));
            }
        });
    }
    RED.nodes.registerType('time-calc', timeCalcNode);
};