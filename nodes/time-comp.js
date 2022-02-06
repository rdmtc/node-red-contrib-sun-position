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
 * time-comp:
 *********************************************/
'use strict';
const util = require('util');
const path = require('path');
const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));

module.exports = function (RED) {
    'use strict';
    /**
     * timeCompNode
     * @param {*} config - configuration
     */
    function timeCompNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize time Node ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));
        this.input = {
            type: config.inputType,
            value: config.input,
            next: hlp.isTrue(config.inputNext),
            format: config.inputFormat,
            offsetType: config.inputOffsetType,
            offset: config.inputOffset,
            multiplier: config.inputOffsetMultiplier
        };

        if (!Array.isArray(config.results)) {
            config.results = [];
            if (config.result1Type && config.result1Type !== 'none') {
                config.results.push({
                    p           : config.result1 ? config.result1 : 'msgPayload',
                    pt          : config.result1Type ? config.result1Type : 'input',
                    v           : config.result1Value ? config.result1Value : '',
                    vt          : config.result1ValueType ? config.result1ValueType : 'input',
                    o           : config.result1Offset ? config.result1Offset : 1,
                    oT          : (config.result1OffsetType === 0 || config.result1OffsetType === '') ? 'none' : (config.result1OffsetType ? config.result1OffsetType : 'num'),
                    oM          : config.result1OffsetMultiplier ? config.result1OffsetMultiplier : 60000,
                    f           : config.result1Format ? config.result1Format : 0,
                    next        : false,
                    days        : '*',
                    months      : '*',
                    onlyEvenDays: false,
                    onlyOddDays : false
                });
            }

            delete config.result1;
            delete config.result1Type;
            delete config.result1Value;
            delete config.result1ValueType;
            delete config.result1Format;
            delete config.result1Offset;
            delete config.result1OffsetType;
            delete config.result1OffsetMultiplier;
        }

        this.results = [];
        config.results.forEach(prop => {
            const propNew = {
                outType     : prop.pt,
                outValue    : prop.p,
                type        : prop.vt,
                value       : prop.v,
                format      : prop.f,
                offsetType  : prop.oT,
                offset      : prop.o,
                multiplier  : prop.oM,
                next        : (typeof prop.next === 'undefined' || prop.next === null || hlp.isTrue(prop.next)) ? true : false,
                days        : prop.days,
                months      : prop.months,
                onlyEvenDays: prop.onlyEvenDays,
                onlyOddDays : prop.onlyOddDays,
                onlyEvenWeeks: prop.onlyEvenWeeks,
                onlyOddWeeks : prop.onlyOddWeeks
            };

            if (this.positionConfig && propNew.type === 'jsonata') {
                try {
                    propNew.expr = this.positionConfig.getJSONataExpression(this, propNew.value);
                } catch (err) {
                    this.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error: err.message }));
                    propNew.expr = null;
                }
            }
            this.results.push(propNew);
        });

        this.rules = config.rules;
        this.checkall = config.checkall;
        const node = this;
        if (!this.positionConfig) {
            node.status({
                fill: 'red',
                shape: 'dot',
                text: 'Node not properly configured!!'
            });
            return;
        }

        this.on('input', (msg, send, done) => {
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) { if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };
            const dNow = new Date();

            if (node.positionConfig === null ||
                typeof node.positionConfig === 'undefined' ||
                node.input.type === null ||
                typeof node.input.type === 'undefined') {
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'Configuration is missing!!'
                });
                throw new Error('Configuration is missing!!');
            }

            try {
                // const inputData = node.positionConfig.getDateFromProp(node, msg, node.input.type, node.input.value);
                const inputData = node.positionConfig.getTimeProp(node, msg, node.input);
                if (inputData.error) {
                    throw new Error(inputData.error);
                }

                for (let i = 0; i < node.results.length; i++) {
                    const prop = node.results[i];
                    // node.debug(`prepOutMsg-${i} node.results[${i}]=${util.inspect(prop, { colors: true, compact: 10, breakLength: Infinity })}`);

                    let resultObj = null;
                    if (prop.type === 'input') {
                        resultObj = node.positionConfig.formatOutDate(this, msg, inputData.value, prop);
                    } else {
                        resultObj = node.positionConfig.getOutDataProp(this, msg, prop, dNow);
                    }
                    if (resultObj === null || (typeof resultObj === 'undefined')) {
                        this.error('Could not evaluate ' + prop.type + '.' + prop.value + '. - Maybe settings outdated (open and save again)!');
                    } else if (resultObj.error) {
                        this.error('error on getting result: "' + resultObj.error + '"');
                    } else {
                        node.positionConfig.setMessageProp(this, msg, prop.outType, prop.outValue, resultObj);
                    }
                    // node.debug(`prepOutMsg-${i} msg=${util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity })}`);
                }

                const resObj = [];
                const rulesLength = node.rules.length;
                for (let i = 0; i < rulesLength; ++i) {
                    const rule = node.rules[i];
                    let operatorValid = true;
                    if (rule.propertyType !== 'none') {
                        const res = RED.util.evaluateNodeProperty(rule.propertyValue, rule.propertyType, node, msg);
                        operatorValid = hlp.toBoolean(res);
                    }

                    if (operatorValid) {
                        if (rule.format === 'time-calc.timeFormat.default') {
                            rule.format = 0;
                        }

                        let compare = null;
                        let result = false;
                        switch (Number(rule.operator)) {
                            case 1: // equal             { id: 1, group: "ms", label: "==", "text": "equal" },
                                compare = (op1, op2) => op1 === op2;
                                break;
                            case 2: // unequal           { id: 2, group: "ms", label: "!=", "text": "unequal" },
                                compare = (op1, op2) => op1 !== op2;
                                break;
                            case 3: // greater           { id: 3, group: "ms", label: ">", "text": "greater" },
                                compare = (op1, op2) => op1 > op2;
                                break;
                            case 4: // greaterOrEqual    { id: 5, group: "ms", label: ">=", "text": "greater or equal" },
                                compare = (op1, op2) => op1 >= op2;
                                break;
                            case 5: // lesser            { id: 6, group: "ms", label: "<", "text": "lesser" },
                                compare = (op1, op2) => op1 < op2;
                                break;
                            case 6: // lesserOrEqual     { id: 7, group: "ms", label: "<=", "text": "lesser or equal" },
                                compare = (op1, op2) => op1 <= op2;
                                break;
                            case 99: // otherwise
                                result = true;
                                break;
                        }

                        if (compare) {
                            let ruleoperand = null;
                            try {
                                ruleoperand = node.positionConfig.getTimeProp(node, msg, {
                                    type: rule.operandType,
                                    value: rule.operandValue,
                                    format: rule.format,
                                    next: rule.next,
                                    offsetType: 'num',
                                    offset: rule.offsetValue,
                                    multiplier: rule.multiplier
                                });
                            } catch (ex) {
                                continue;
                            }

                            // node.debug(i + ' operand=' + util.inspect(ruleoperand, { colors: true, compact: 10, breakLength: Infinity }));
                            if (!ruleoperand || ruleoperand.error) {
                                continue;
                            }
                            ruleoperand = ruleoperand.value;

                            const inputOperant = new Date(inputData.value);
                            // node.debug(i + ' inputOperant=' + util.inspect(inputOperant, { colors: true, compact: 10, breakLength: Infinity }));
                            // node.debug(i + ' operatorType=' + util.inspect(rule.operatorType, { colors: true, compact: 10, breakLength: Infinity }));
                            if (rule.operatorType !== '*' && typeof rule.operatorType !== 'undefined') {
                                switch (rule.operatorType) {
                                    case '11': // ms
                                        result = compare(inputOperant.getMilliseconds(), ruleoperand.getMilliseconds());
                                        break;
                                    case '12': // only sec
                                        result = compare(inputOperant.getSeconds(), ruleoperand.getSeconds());
                                        break;
                                    case '13': // only min
                                        result = compare(inputOperant.getMinutes(), ruleoperand.getMinutes());
                                        break;
                                    case '14': // only hour
                                        result = compare(inputOperant.getHours(), ruleoperand.getHours());
                                        break;
                                    case '15': // only day
                                        result = compare(inputOperant.getDate(), ruleoperand.getDate());
                                        break;
                                    case '16': // only Month
                                        result = compare(inputOperant.getMonth(), ruleoperand.getMonth());
                                        break;
                                    case '17': // only FullYear
                                        result = compare(inputOperant.getFullYear(), ruleoperand.getFullYear());
                                        break;
                                    case '18': // only dayOfWeek
                                        result = compare(inputOperant.getDay(), ruleoperand.getDay());
                                        break;
                                    default:
                                        if (rule.operatorType.indexOf('11') < 0) {
                                            inputOperant.setMilliseconds(0);
                                            ruleoperand.setMilliseconds(0);
                                        }

                                        if (rule.operatorType.indexOf('12') < 0) {
                                            inputOperant.setSeconds(0);
                                            ruleoperand.setSeconds(0);
                                        }

                                        if (rule.operatorType.indexOf('13') < 0) {
                                            inputOperant.setMinutes(0);
                                            ruleoperand.setMinutes(0);
                                        }

                                        if (rule.operatorType.indexOf('14') < 0) {
                                            inputOperant.setHours(0);
                                            ruleoperand.setHours(0);
                                        }

                                        if (rule.operatorType.indexOf('15') < 0) {
                                            inputOperant.setDate(0);
                                            ruleoperand.setDate(0);
                                        }

                                        if (rule.operatorType.indexOf('16') < 0) {
                                            inputOperant.setMonth(0);
                                            ruleoperand.setMonth(0);
                                        }

                                        if (rule.operatorType.indexOf('17') < 0) {
                                            inputOperant.setFullYear(0);
                                            ruleoperand.setFullYear(0);
                                        }

                                        result = compare(inputOperant.getTime(), ruleoperand.getTime());
                                        if (rule.operatorType.indexOf('18') >= 0) {
                                            result = result && compare(inputOperant.getDay(), ruleoperand.getDay());
                                        }
                                        break;
                                }
                            }
                        }
                        // node.debug(i + ' result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));

                        if (result) {
                            resObj.push(msg);
                            node.debug(i + ' result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));
                            if (node.checkall != 'true') { // eslint-disable-line eqeqeq
                                node.debug(i + ' end cause checkall');
                                break;
                            }
                        } else {
                            resObj.push(null);
                        }
                    }
                }

                for (let i = resObj.length; i < rulesLength; ++i) {
                    resObj.push(null);
                }

                resObj.push(msg);
                node.status({
                    text: inputData.value.toISOString()
                });
                send(resObj); // node.send(resObj);
                done();
                return null;
            } catch (err) {
                node.log(err.message);
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text:  RED._('node-red-contrib-sun-position/position-config:errors.error-title')
                });
                done('internal error time-comp:' + err.message, msg);
                // throw err;
            }
            return null;
        });
    }

    RED.nodes.registerType('time-comp', timeCompNode);
};