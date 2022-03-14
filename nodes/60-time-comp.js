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
/** --- Type Defs ---
  * @typedef {import('./types/typedefs.js').runtimeRED} runtimeRED
  * @typedef {import('./types/typedefs.js').runtimeNode} runtimeNode
  * @typedef {import('./types/typedefs.js').runtimeNodeConfig} runtimeNodeConfig
  * @typedef {import("./10-position-config.js").ITimePropertyType} ITimePropertyType
  * @typedef {import("./10-position-config.js").IPositionConfigNode} IPositionConfigNode
  */


/**
  * @typedef {Object} ITimeCompareNodeInstance Extensions for the nodeInstance object type
  * @property {IPositionConfigNode} positionConfig    -   tbd
  *
 * @property {ITimePropertyType} input      -   input data
 * @property {Array} results                -   output data
 * @property {Array} rules                  -   input data
 * @property {boolean|string} checkall      -   define if check all rules
 *
 */

/**
  * @typedef {ITimeCompareNodeInstance & runtimeNode} ITimeCompareNode Combine nodeInstance with additional, optional functions
  */
/******************************************************************************************/
/** Export the function that defines the node
  * @type {runtimeRED} */
module.exports = function (/** @type {runtimeRED} */ RED) {
    'use strict';
    const util = require('util');
    const hlp = require('./lib/dateTimeHelper.js');

    /**
     * standard Node-Red Node handler for the timeCompNode
     * @param {*} config the Node-Red Configuration property of the Node
     */
    function timeCompNode(config) {
        RED.nodes.createNode(this, config);
        /** Copy 'this' object in case we need it in context of callbacks of other functions.
         * @type {ITimeCompareNode}
         */
        // @ts-ignore
        const node = this;
        // Retrieve the config node
        node.positionConfig = RED.nodes.getNode(config.positionConfig);
        // node.debug('initialize time Node ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));
        if (!node.positionConfig) {
            node.error(RED._('node-red-contrib-sun-position/position-config:errors.config-missing'));
            node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.config-missing-state') });
            return;
        }
        if (node.positionConfig.checkNode(
            error => {
                node.error(error);
                node.status({fill: 'red', shape: 'dot', text: error });
            }, false)) {
            return;
        }
        node.input = {
            type: config.inputType,
            value: config.input,
            next: hlp.isTrue(config.inputNext),
            format: config.inputFormat,
            offsetType: config.inputOffsetType,
            offset: config.inputOffset,
            multiplier: config.inputOffsetMultiplier
        };
        if (node.input.type !== 'entered' && node.input.type !== 'pdsTime' && node.input.type !== 'pdmTime') {
            node.input.next = false;
        }

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

        node.results = [];
        config.results.forEach(prop => {
            const propNew = {
                outType     : prop.pt,
                outValue    : prop.p,
                type        : prop.vt,
                value       : prop.v,
                format      : prop.f,
                offsetType  : prop.oT,
                offset      : prop.o,
                multiplier  : parseFloat(prop.oM) || 60000,
                next        : (typeof prop.next === 'undefined' || prop.next === null || hlp.isTrue(prop.next)) ? true : false,
                days        : prop.days,
                months      : prop.months,
                onlyEvenDays: prop.onlyEvenDays,
                onlyOddDays : prop.onlyOddDays,
                onlyEvenWeeks: prop.onlyEvenWeeks,
                onlyOddWeeks : prop.onlyOddWeeks
            };
            if (propNew.type !== 'entered' && propNew.type !== 'pdsTime' && propNew.type !== 'pdmTime') {
                propNew.next = false;
            }

            if (node.positionConfig && propNew.type === 'jsonata') {
                try {
                    propNew.expr = node.positionConfig.getJSONataExpression(this, propNew.value);
                } catch (err) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error: err.message }));
                    propNew.expr = null;
                }
            }
            node.results.push(propNew);
        });

        node.rules = config.rules;
        const rulesLength = node.rules.length;
        for (let i = 0; i < rulesLength; ++i) {
            const rule = node.rules[i];
            rule.operator = Number(rule.operator);
            if (rule.operator === 99) {
                rule.next = false;
            } else {
                if (rule.operandType !== 'entered' && rule.operandType !== 'pdsTime' && rule.operandType !== 'pdmTime') {
                    rule.next = false;
                }
            }
            rule.compare = null;
            rule.result = false;
            switch (rule.operator) {
                case 1: // equal             { id: 1, group: "ms", label: "==", "text": "equal" },
                    rule.compare = (op1, op2) => op1 === op2;
                    break;
                case 2: // unequal           { id: 2, group: "ms", label: "!=", "text": "unequal" },
                    rule.compare = (op1, op2) => op1 !== op2;
                    break;
                case 3: // greater           { id: 3, group: "ms", label: ">", "text": "greater" },
                    rule.compare = (op1, op2) => op1 > op2;
                    break;
                case 4: // greaterOrEqual    { id: 5, group: "ms", label: ">=", "text": "greater or equal" },
                    rule.compare = (op1, op2) => op1 >= op2;
                    break;
                case 5: // lesser            { id: 6, group: "ms", label: "<", "text": "lesser" },
                    rule.compare = (op1, op2) => op1 < op2;
                    break;
                case 6: // lesserOrEqual     { id: 7, group: "ms", label: "<=", "text": "lesser or equal" },
                    rule.compare = (op1, op2) => op1 <= op2;
                    break;
                case 99: // otherwise
                    rule.result = true;
                    break;
            }
        }
        node.checkall = config.checkall === true || config.checkall === 'true';

        node.on('input', (msg, send, done) => {
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
                        node.error('Could not evaluate ' + prop.type + '.' + prop.value + '. - Maybe settings outdated (open and save again)!');
                    } else if (resultObj.error) {
                        node.error('error on getting result: "' + resultObj.error + '"');
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
                        operatorValid = hlp.isTrue(res);
                    }

                    if (operatorValid) {
                        if (rule.format === 'time-calc.timeFormat.default') {
                            rule.format = 0;
                        }

                        rule.result = rule.operator === 99;
                        if (rule.compare) {
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
                                        rule.result = rule.compare(inputOperant.getMilliseconds(), ruleoperand.getMilliseconds());
                                        break;
                                    case '12': // only sec
                                        rule.result = rule.compare(inputOperant.getSeconds(), ruleoperand.getSeconds());
                                        break;
                                    case '13': // only min
                                        rule.result = rule.compare(inputOperant.getMinutes(), ruleoperand.getMinutes());
                                        break;
                                    case '14': // only hour
                                        rule.result = rule.compare(inputOperant.getHours(), ruleoperand.getHours());
                                        break;
                                    case '15': // only day
                                        rule.result = rule.compare(inputOperant.getDate(), ruleoperand.getDate());
                                        break;
                                    case '16': // only Month
                                        rule.result = rule.compare(inputOperant.getMonth(), ruleoperand.getMonth());
                                        break;
                                    case '17': // only FullYear
                                        rule.result = rule.compare(inputOperant.getFullYear(), ruleoperand.getFullYear());
                                        break;
                                    case '18': // only dayOfWeek
                                        rule.result = rule.compare(inputOperant.getDay(), ruleoperand.getDay());
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

                                        rule.result = rule.compare(inputOperant.getTime(), ruleoperand.getTime());
                                        if (rule.operatorType.indexOf('18') >= 0) {
                                            rule.result = rule.result && rule.compare(inputOperant.getDay(), ruleoperand.getDay());
                                        }
                                        break;
                                }
                            }
                        }
                        // node.debug(i + ' result=' + util.inspect(result, { colors: true, compact: 10, breakLength: Infinity }));

                        if (rule.result) {
                            resObj.push(msg);
                            node.debug(i + ' result=' + util.inspect(rule.result, { colors: true, compact: 10, breakLength: Infinity }));
                            if (!node.checkall) { // eslint-disable-line eqeqeq
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
                node.log(util.inspect(err));
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
        node.status({});
    }

    RED.nodes.registerType('time-comp', timeCompNode);
};