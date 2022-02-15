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
 * clock-timer:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const ctrlLib = require(path.join(__dirname, '/lib/timeControlHelper.js'));
const util = require('util');
const clonedeep = require('lodash.clonedeep');
const isEqual = require('lodash.isequal');

const cRuleUntil = 0;
const cRuleFrom = 1;
const cRuleDefault = -1;

/******************************************************************************************/
module.exports = function (RED) {
    'use strict';
    /******************************************************************************************/
    /**
     * check if a manual overwrite should be set
     * @param {*} node node data
     * @param {*} msg message object
     * @param {ITimeObject} oNow the *current* date Object
     * @returns {boolean} true if override is active, otherwise false
     */
    function checkPosOverwrite(node, msg, oldValue, oNow) {
        // node.debug(`checkPosOverwrite act=${node.nodeData.overwrite.active} `);
        let isSignificant = false;
        const exactImportance = hlp.getMsgBoolValue(msg, ['exactImportance', 'exactSignificance', 'exactPriority', 'exactPrivilege']);
        const nImportance = hlp.getMsgNumberValue(msg, ['importance', 'significance', 'prio', 'priority', 'privilege'], null, p => {
            if (exactImportance) {
                isSignificant = (node.nodeData.overwrite.importance === p);
            } else {
                isSignificant = (node.nodeData.overwrite.importance <= p);
            }
            ctrlLib.checkOverrideReset(node, msg, oNow, isSignificant);
            return p;
        }, () => {
            ctrlLib.checkOverrideReset(node, msg, oNow, true);
            return 0;
        });

        if (node.nodeData.overwrite.active && (node.nodeData.overwrite.importance > 0) && !isSignificant) {
        // if (node.nodeData.overwrite.active && (node.nodeData.overwrite.importance > 0) && (node.nodeData.overwrite.importance > importance)) {
            // node.debug(`overwrite exit true node.nodeData.overwrite.active=${node.nodeData.overwrite.active}, importance=${nImportance}, node.nodeData.overwrite.importance=${node.nodeData.overwrite.importance}`);
            // if active, the importance must be 0 or given with same or higher as current overwrite otherwise this will not work
            node.debug(`do not check any overwrite, importance of message ${nImportance} not matches current overwrite importance ${node.nodeData.overwrite.importance}`);
            return ctrlLib.setOverwriteReason(node);
        }
        const onlyTrigger = hlp.getMsgBoolValue(msg, ['trigger', 'noOverwrite'], ['triggerOnly', 'noOverwrite']);
        if (onlyTrigger) {
            return ctrlLib.setOverwriteReason(node);
        }
        let overrideData = undefined;
        let overrideTopic = undefined;
        if (typeof msg.payload !== 'undefined') {
            if (msg.topic && (msg.topic.includes('manual') ||
                msg.topic.includes('overwrite') ||
                (msg.topic.includes('Overwrite') && !msg.topic.includes('resetOverwrite')))) {
                overrideData = msg.payload;
                overrideTopic = msg.topic;
            } else if (typeof msg.payload === 'object' &&
                        (msg.payload.value && (msg.payload.expire ||
                            msg.payload.importance ||
                            msg.payload.resetOnSameAsLastValue ||
                            msg.payload.ignoreSameValue ||
                            msg.payload.overwrite === true))) {
                overrideData = msg.payload.value;
                overrideTopic = msg.topic;
            }
        }

        let nExpire = hlp.getMsgNumberValue(msg, 'expire');
        if (msg.topic && String(msg.topic).includes('noExpir')) {
            nExpire = -1;
        }
        if (typeof overrideData !== 'undefined') {
            const rosalv = hlp.getMsgBoolValue(msg, 'resetOnSameAsLastValue');
            const isv = hlp.getMsgBoolValue(msg, 'ignoreSameValue');
            node.debug(`needOverwrite importance=${nImportance} expire=${nExpire} resetOnSameAsLastValue=${rosalv} ignoreSameValue=${isv}`);

            if (rosalv && isEqual(oldValue, overrideData)) {
                node.debug(`resetOnSameAsLastValue active, reset overwrite and exit overrideData=${overrideData}`);
                ctrlLib.posOverwriteReset(node);
                return ctrlLib.setOverwriteReason(node);
            } else if (isv && isEqual(oldValue, overrideData)) {
                node.debug(`overwrite exit true (ignoreSameValue), overrideData=${overrideData}`);
                return ctrlLib.setOverwriteReason(node);
            }
            node.debug(`overwrite overrideData=${overrideData}`);
            node.payload.current = overrideData;
            node.payload.topic = overrideTopic;

            if (Number.isFinite(nExpire) || (nImportance <= 0)) {
                // will set expiring if importance is 0 or if expire is explicit defined
                node.debug(`set expiring - expire is explicit defined "${nExpire}"`);
                ctrlLib.setExpiringOverwrite(node, oNow, nExpire, 'set expiring time by message');
            } else if ((!exactImportance && (node.nodeData.overwrite.importance < nImportance)) || (!node.nodeData.overwrite.expireTs)) {
                // isSignificant
                // no expiring on importance change or no existing expiring
                node.debug(`no expire defined, using default or will not expire`);
                ctrlLib.setExpiringOverwrite(node, oNow, NaN, 'no special expire defined');
            }
            if (nImportance > 0) {
                node.nodeData.overwrite.importance = nImportance;
            }
            node.nodeData.overwrite.active = true;
            node.context().set('overwrite', node.nodeData.overwrite, node.contextStore);
        } else if (node.nodeData.overwrite.active) {
            node.debug(`overwrite active, check of nImportance=${nImportance} or nExpire=${nExpire}`);
            if (Number.isFinite(nExpire)) {
                node.debug(`set to new expiring time nExpire="${nExpire}"`);
                // set to new expiring time
                ctrlLib.setExpiringOverwrite(node, oNow, nExpire, 'set new expiring time by message');
            }
            if (nImportance > 0) {
                // set to new importance
                node.nodeData.overwrite.importance = nImportance;
            }
            node.context().set('overwrite', node.nodeData.overwrite, node.contextStore);
        }
        // node.debug(`overwrite exit node.nodeData.overwrite.active=${node.nodeData.overwrite.active}; expire=${nExpire}`);
        return ctrlLib.setOverwriteReason(node);
    }

    /******************************************************************************************/
    /**
     * changes the rule settings
     * @param {Object} node node data
     * @param {number} [rulePos] the position of the rule which should be changed
     * @param {string} [ruleName] the name of the rule which should be changed
     * @param {Object} ruleData the properties of the rule which should be changed
     */
    function changeRules(node, rulePos, ruleName, ruleData) {
        // node.debug(`changeRules: ${ node.rules.count } ruleData:' ${util.inspect(ruleData, {colors:true, compact:10})}`);
        for (let i = 0; i <= node.rules.count; ++i) {
            const rule = node.rules[i];
            if (((typeof rulePos !== 'undefined') && rule.pos === rulePos) ||
                ((typeof ruleName !== 'undefined') && rule.name === ruleName)) {
                node.rules[i] = Object.assign(node.rules[i], ruleData);
            }
        }
    }
    /******************************************************************************************/
    /**
     * check all rules and determinate the active rule
     * @param {Object} node node data
     * @param {Object} msg the message object
     * @param {ITimeObject} oNow the *current* date Object
     * @param {Object} tempData the object storing the temporary caching data
     * @returns the active rule or null
     */
    function checkRules(node, msg, oNow, tempData) {
        // node.debug('checkRules --------------------');
        const livingRuleData = {};
        ctrlLib.prepareRules(node, msg, tempData, oNow.now);
        // node.debug(`checkRules rules.count=${node.rules.count}, rules.lastUntil=${node.rules.lastUntil}, oNow=${util.inspect(oNow, {colors:true, compact:10})}`);

        let ruleSel = null;
        let ruleindex = -1;
        // node.debug('first loop count:' + node.rules.count + ' lastuntil:' + node.rules.lastUntil);
        for (let i = 0; i <= node.rules.lastUntil; ++i) {
            const rule = node.rules.data[i];
            // node.debug('rule ' + rule.time.operator + ' - ' + (rule.time.operator !== cRuleFrom) + ' - ' + util.inspect(rule, {colors:true, compact:10, breakLength: Infinity }));
            if (!rule.enabled) { continue; }
            if (rule.time && rule.time.operator === cRuleFrom) { continue; }
            // const res = fktCheck(rule, r => (r >= nowNr));
            const res = ctrlLib.compareRules(node, msg, rule, r => (r >= oNow.nowNr), oNow);
            if (res) {
                // node.debug(`1. ruleSel ${rule.name} (${rule.pos}) data=${ util.inspect(res, { colors: true, compact: 10, breakLength: Infinity }) }`);
                ruleSel = res;
                ruleindex = i;
                break;
            }
        }

        if (!ruleSel || (ruleSel.time && ruleSel.time.operator === cRuleFrom) ) {
            // node.debug('--------- starting second loop ' + node.rules.count);
            for (let i = (node.rules.count - 1); i >= 0; --i) {
                const rule = node.rules.data[i];
                // node.debug(`rule ${rule.name} (${rule.pos}) enabled=${rule.enabled} operator=${rule.time.operator} noUntil=${rule.time.operator !== cRuleUntil} data=${util.inspect(rule, {colors:true, compact:10, breakLength: Infinity })}`);
                if (!rule.enabled) { continue; }
                if (rule.time && rule.time.operator === cRuleUntil) { continue; } // - From: timeOp === cRuleFrom
                const res = ctrlLib.compareRules(node, msg, rule, r => (r <= oNow.nowNr), oNow);
                if (res) {
                    // node.debug(`2. ruleSel ${rule.name} (${rule.pos}) data=${ util.inspect(res, { colors: true, compact: 10, breakLength: Infinity }) }`);
                    ruleSel = res;
                    break;
                }
            }
        }

        const checkRuleForAT = rule => {
            if (!rule.time) {
                return;
            }
            const num = ctrlLib.getRuleTimeData(node, msg, rule, oNow);
            if (num > oNow.nowNr) {
                node.debug('autoTrigger set to rule ' + rule.pos);
                const diff = num - oNow.nowNr;
                node.autoTrigger.time = Math.min(node.autoTrigger.time, diff);
                node.autoTrigger.type = 2; // next rule
            }
        };
        if (ruleSel) {
            if (node.autoTrigger) {
                if (ruleSel.time && ruleSel.timeData.ts > oNow.nowNr) {
                    node.debug('autoTrigger set to rule ' + ruleSel.pos + ' (current)');
                    const diff = ruleSel.timeData.ts - oNow.nowNr;
                    node.autoTrigger.time = Math.min(node.autoTrigger.time, diff);
                    node.autoTrigger.type = 1; // current rule end
                } else {
                    for (let i = (ruleindex+1); i < node.rules.count; ++i) {
                        const rule = node.rules.data[i];
                        if (!rule.time) {
                            continue;
                        }
                        checkRuleForAT(rule);
                    }
                    // check first rule, maybe next day
                    if ((node.autoTrigger.type !== 2) && (node.rules.firstTimeLimited < node.rules.count)) {
                        checkRuleForAT(node.rules.data[node.rules.firstTimeLimited]);
                    }
                }
            }
            // ruleSel.text = '';
            // node.debug('ruleSel ' + util.inspect(ruleSel, {colors:true, compact:10, breakLength: Infinity }));
            livingRuleData.id = ruleSel.pos;
            livingRuleData.name = ruleSel.name;
            livingRuleData.importance = ruleSel.importance;
            livingRuleData.resetOverwrite = ruleSel.resetOverwrite;
            livingRuleData.code = 4;
            livingRuleData.topic = ruleSel.topic;

            livingRuleData.active = true;
            livingRuleData.outputValue = ruleSel.outputValue;
            livingRuleData.outputType = ruleSel.outputType;

            livingRuleData.conditional = ruleSel.conditional;
            livingRuleData.timeLimited = (!!ruleSel.time);
            livingRuleData.payloadData = ruleSel.payload;
            const data = { number: ruleSel.pos, name: ruleSel.name };
            let name = 'rule';
            if (ruleSel.conditional) {
                livingRuleData.conditon = ruleSel.conditon;
                data.text = ruleSel.conditon.text;
                data.textShort = ruleSel.conditon.textShort;
                name = 'ruleCond';
            }
            if (ruleSel.time && ruleSel.timeData) {
                livingRuleData.time = ruleSel.timeData;
                livingRuleData.time.timeLocal = node.positionConfig.toTimeString(ruleSel.timeData.value);
                livingRuleData.time.timeLocalDate = node.positionConfig.toDateString(ruleSel.timeData.value);
                livingRuleData.time.dateISO= ruleSel.timeData.value.toISOString();
                livingRuleData.time.dateUTC= ruleSel.timeData.value.toUTCString();
                data.timeOp = ruleSel.time.operatorText;
                data.timeLocal = livingRuleData.time.timeLocal;
                data.time = livingRuleData.time.dateISO;
                name = (ruleSel.conditional) ? 'ruleTimeCond' : 'ruleTime';
            }
            livingRuleData.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.'+name, data);
            livingRuleData.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.'+name, data);
            // node.debug(`checkRules end livingRuleData=${util.inspect(livingRuleData, { colors: true, compact: 10, breakLength: Infinity })}`);
            return livingRuleData;
        }
        livingRuleData.active = false;
        livingRuleData.id = cRuleDefault;
        livingRuleData.importance = 0;
        livingRuleData.resetOverwrite = false;
        livingRuleData.payloadData = {
            type: node.nodeData.payloadDefaultType,
            value: node.nodeData.payloadDefault,
            format: node.nodeData.payloadDefaultTimeFormat,
            offsetType: node.nodeData.payloadDefaultOffsetType,
            offset: node.nodeData.payloadDefaultOffset,
            multiplier: node.nodeData.payloadDefaultOffsetMultiplier,
            next: true
        };
        livingRuleData.topic = node.nodeData.topic;
        livingRuleData.code = 1;
        livingRuleData.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.default');
        livingRuleData.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.default');

        if (node.autoTrigger && node.rules && node.rules.count > 0) {
            // check first rule, maybe next day
            if (node.rules.firstTimeLimited < node.rules.count) {
                checkRuleForAT(node.rules.data[node.rules.firstTimeLimited]);
            }
            if (node.rules.firstTimeLimited !== node.rules.firstFrom) {
                checkRuleForAT(node.rules.data[node.rules.firstFrom]);
            }
        }
        // node.debug(`checkRules end livingRuleData=${util.inspect(livingRuleData, { colors: true, compact: 10, breakLength: Infinity })}`);
        return livingRuleData;
    }
    /******************************************************************************************/
    /******************************************************************************************/
    /**
     * standard Node-Red Node handler for the clockTimerNode
     * @param {*} config the Node-Red Configuration property of the Node
     */
    function clockTimerNode(config) {
        RED.nodes.createNode(this, config);
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        this.outputs = Number(config.outputs || 1);
        const node = this;
        if (!this.positionConfig) {
            node.status({
                fill: 'red',
                shape: 'dot',
                text: 'Node not properly configured!!'
            });
            return;
        }

        if (!Array.isArray(config.results)) {
            config.results = [{
                p: '',
                pt: 'msgPayload',
                v: '',
                vt: 'payload'
            },
            {
                p: '',
                pt: 'msgTopic',
                v: '',
                vt: 'topic'
            },
            {
                p: 'timeCtrl',
                pt: 'msg',
                v: 'full',
                vt: 'ctrlObj'
            }];
        }

        if (config.autoTrigger) {
            node.autoTrigger = {
                defaultTime : parseInt(config.autoTriggerTime) || 20 * 60000 // 20min
            };
        }

        node.nowarn = {};
        node.reason = {
            code : 0,
            state: '',
            description: ''
        };
        // temporary node Data
        node.contextStore = config.contextStore || this.positionConfig.contextStore;
        node.nodeData = {
            isDisabled: node.context().get('isDisabled', node.contextStore) || false,
            /** The Level of the window */
            payloadDefault: config.payloadDefault,
            payloadDefaultType: config.payloadDefaultType,
            payloadDefaultTimeFormat: config.payloadDefaultTimeFormat,
            payloadDefaultOffset: config.payloadDefaultOffset,
            payloadDefaultOffsetType: config.payloadDefaultOffsetType,
            payloadDefaultOffsetMultiplier: config.payloadDefaultOffsetMultiplier,
            topic: config.topic,
            addId: config.addId,
            addIdType: config.addIdType||'none',
            /** The override settings */
            overwrite: node.context().get('overwrite', node.contextStore) || {
                active: false,
                importance: 0
            }
        };
        node.nodeData.overwrite.expireDuration = parseFloat(hlp.chkValueFilled(config.overwriteExpire, NaN));

        node.rules = {
            data: config.rules || []
        };
        node.payload = {
            current: undefined,
            topic: node.nodeData.topic
        };

        /**
         * set the state of the node
         */
        this.setState = pLoad => {
            const code = node.reason.code;
            let shape = 'ring';
            let fill = 'yellow';

            if (isNaN(code)) {
                fill = 'red'; // block
                shape = 'dot';
            } else if (code <= 3) {
                fill = 'blue'; // override
            } else if (code === 4 || code === 15 || code === 16) {
                fill = 'grey'; // rule
            } else if (code === 1 || code === 8) {
                fill = 'green'; // not in window or oversteerExceeded
            }

            node.reason.stateComplete = node.reason.state ;
            if (pLoad === null || typeof pLoad !== 'object') {
                node.reason.stateComplete = hlp.clipStrLength(''+pLoad,20) + ' - ' + node.reason.stateComplete;
            } else if (typeof pLoad === 'object') {
                node.reason.stateComplete = hlp.clipStrLength(JSON.stringify(pLoad),20) + ' - ' + node.reason.stateComplete;
            }
            node.status({
                fill,
                shape,
                text: node.reason.stateComplete
            });
        };

        /**
         * handles the input of a message object to the node
         */
        this.on('input', function (msg, send, done) {
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) {if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };

            try {
                node.debug(`--------- clock-timer - input msg.topic=${msg.topic} msg.payload=${msg.payload} msg.ts=${msg.ts}`);
                if (!this.positionConfig) {
                    node.status({
                        fill: 'red',
                        shape: 'dot',
                        text: 'Node not properly configured!!'
                    });
                    done(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'), msg);
                    return null;
                }

                // allow to overwrite settings by incomming message
                if (msg.topic && (typeof msg.topic === 'string') &&
                (msg.topic.startsWith('set') ||
                msg.topic.startsWith('disable') ||
                msg.topic.startsWith('enable'))) {
                    switch (msg.topic) {
                        /* Default Settings */
                        case 'setSettingsTopic':
                            node.nodeData.topic = msg.payload || node.nodeData.topic;
                            break;
                        /* advanced Settings */
                        case 'setAutoTriggerTime':
                            node.autoTrigger.defaultTime = parseInt(msg.payload) || node.autoTrigger.defaultTime; // payload of 0 makes no sense, use then default
                            break;
                        case 'setContextStore':
                            node.contextStore = msg.payload || node.contextStore;
                            break;
                        case 'disableRule':
                            changeRules(node, undefined, msg.payload, { enabled: false });
                            break;
                        case 'enableRule':
                            changeRules(node, undefined, msg.payload, { enabled: true });
                            break;
                        case 'disableRuleByPos':
                            changeRules(node, parseInt(msg.payload), undefined, { enabled: false });
                            break;
                        case 'enableRuleByPos':
                            changeRules(node, parseInt(msg.payload), undefined, { enabled: true });
                            break;
                        case 'enableNode':
                            node.nodeData.isDisabled = false;
                            node.context().set('isDisabled', false, node.contextStore);
                            break;
                        case 'disableNode':
                            node.nodeData.isDisabled = true;
                            node.context().set('isDisabled', true, node.contextStore);
                            node.status({
                                fill: 'grey',
                                shape: 'dot',
                                text: (typeof msg.payload === 'string') ? msg.payload : 'disabled'
                            });
                            break;
                        default:
                            break;
                    }
                }
                if (node.nodeData.isDisabled) {
                    done();
                    return null;
                }

                // initialize
                node.nowarn = {};
                const tempData = node.context().get('cacheData',node.contextStore) || {};
                const previousData = node.context().get('lastData', node.contextStore) || {
                    reasonCode: -1,
                    usedRule: NaN,
                    lastAuto : {}
                };

                node.reason.code = NaN;
                const oNow = hlp.getNowObject(node, msg);
                if (node.autoTrigger) {
                    node.autoTrigger.time = node.autoTrigger.defaultTime;
                    node.autoTrigger.type = 0; // default time
                }

                if (node.nodeData.addIdType !== 'none') {
                    node.addId = node.positionConfig.getPropValue(node, msg, {
                        type: node.nodeData.addIdType,
                        value: node.nodeData.addId,
                        callback: (result, _obj) => {
                            if (result !== null && typeof result !== 'undefined') {
                                tempData[_obj.type + '.' + _obj.value] = result;
                            }
                        }
                    }, true, oNow.now);
                }
                const timeCtrl = {
                    reason : node.reason,
                    timeClock : node.nodeData,
                    autoTrigger : node.autoTrigger,
                    lastEvaluated: previousData.lastAuto,
                    name: node.name || node.id,
                    id: node.addId || node.id,
                    srcId: node.id,
                    path: node._path || node.id
                };

                let ruleId = -2;

                // check for manual overwrite
                let overwrite = checkPosOverwrite(node, msg, previousData.payload, oNow);
                if (!overwrite || node.rules.canResetOverwrite || (node.rules.maxImportance > 0 && node.rules.maxImportance > node.nodeData.overwrite.importance)) {
                    // calc times:
                    timeCtrl.rule = checkRules(node, msg, oNow, tempData);
                    previousData.lastAuto.ruleId = timeCtrl.rule.id;
                    previousData.lastAuto.ruleTopic = timeCtrl.rule.topic;

                    node.debug(`overwrite=${overwrite}, node.rules.maxImportance=${node.rules.maxImportance}, nodeData.overwrite.importance=${node.nodeData.overwrite.importance}`);
                    if (overwrite && timeCtrl.rule.resetOverwrite && timeCtrl.rule.id !== previousData.usedRule) {
                        node.debug(`Overwrite expired caused by rule rule=${timeCtrl.rule.id}, previousRule=${previousData.usedRule}`);
                        ctrlLib.posOverwriteReset(node);
                        overwrite = false;
                    }

                    if (!overwrite || timeCtrl.rule.importance > node.nodeData.overwrite.importance) {
                        ruleId = timeCtrl.rule.id;
                        if (timeCtrl.rule.payloadData) {
                            node.payload.current = node.positionConfig.getOutDataProp(node, msg, timeCtrl.rule.payloadData, oNow.now);
                        }
                        node.payload.topic = timeCtrl.rule.topic;
                        node.reason.code = timeCtrl.rule.code;
                        node.reason.state = timeCtrl.rule.state;
                        node.reason.description = timeCtrl.rule.description;
                        previousData.lastAuto.payload = clonedeep(node.payload.current);
                        previousData.lastAuto.topic = node.payload.topic;
                    }
                }

                if (node.startDelayTimeOut) {
                    node.reason.code = NaN;
                    node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.startDelay', {date:node.positionConfig.toTimeString(node.startDelayTimeOut)});
                    node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.startDelay', {dateISO:node.startDelayTimeOut.toISOString()});
                }
                node.setState(node.payload.current);
                let topic = node.payload.topic || msg.topic;
                const replaceAttrs = {
                    name: timeCtrl.name,
                    id: timeCtrl.id,
                    srcId: timeCtrl.srcId,
                    path: timeCtrl.path,
                    code: node.reason.code,
                    state: node.reason.state,
                    description: node.reason.description,
                    rule: ruleId,
                    topic: msg.topic,
                    payload: msg.payload
                };
                if (topic) {
                    topic = hlp.topicReplace(topic, replaceAttrs);
                }

                if ((!node.startDelayTimeOut) &&
                    (typeof node.payload.current !== 'undefined') &&
                    (node.payload.current !== 'none') &&
                    (node.payload.current !== null) &&
                    !(isEqual(node.payload.topic, previousData.topic) &&
                      isEqual(previousData.payload, node.payload.current))) {
                    const msgOut = {};
                    for (let i = 0; i < node.results.length; i++) {
                        const prop = node.results[i];
                        let resultObj = null;
                        if (prop.type === 'topic') {
                            resultObj = topic;
                        } else if (prop.type === 'payload') {
                            resultObj = node.payload.current;
                        } else if (prop.type === 'ctrlObj') {
                            resultObj = timeCtrl;
                        } else if (prop.type === 'strPlaceholder') {
                            resultObj = hlp.topicReplace(''+prop.value, replaceAttrs);
                        } else {
                            resultObj = node.positionConfig.getPropValue(this, msg, prop, false, oNow.now);
                        }
                        if (typeof resultObj !== 'undefined') {
                            if (resultObj.error) {
                                this.error('error on getting result: "' + resultObj.error + '"');
                            } else {
                                node.positionConfig.setMessageProp(this, msgOut, prop.outType, prop.outValue, resultObj);
                            }
                        }
                    }
                    send([msgOut, { topic, payload: timeCtrl, payloadOut: node.payload.current }]);
                } else {
                    send([null, { topic, payload: timeCtrl }]);
                }

                previousData.usedRule = ruleId;
                previousData.payload = clonedeep(node.payload.current);
                previousData.topic = node.payload.topic;
                previousData.reasonCode = node.reason.code;
                previousData.reasonState = node.reason.state;
                previousData.reasonDescription = node.reason.description;
                node.context().set('cacheData', tempData, node.contextStore);
                node.context().set('lastData', previousData, node.contextStore);
                if (node.autoTrigger) {
                    node.debug('next autoTrigger will set to ' + node.autoTrigger.time + ' - ' + node.autoTrigger.type);
                    if (node.autoTriggerObj) {
                        clearTimeout(node.autoTriggerObj);
                        delete node.autoTriggerObj;
                    }
                    node.autoTriggerObj = setTimeout(() => {
                        clearTimeout(node.autoTriggerObj);
                        delete node.autoTriggerObj;
                        node.emit('input', {
                            topic: 'autoTrigger/triggerOnly',
                            payload: 'triggerOnly',
                            triggerOnly: true
                        });
                    }, node.autoTrigger.time);
                }
                done();
                return null;
            } catch (err) {
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'internal error: ' + err.message
                });
                done(RED._('node-red-contrib-sun-position/position-config:errors.error', err), msg);
            }
            return null;
        });

        this.on('close', () => {
            if (node.autoTriggerObj) {
                clearTimeout(node.autoTriggerObj);
                delete node.autoTriggerObj;
            }
            if (node.startDelayTimeOutObj) {
                clearTimeout(node.startDelayTimeOutObj);
                delete node.startDelayTimeOutObj;
            }
            // tidy up any state
        });
        // ####################################################################################################
        try {
            ctrlLib.initializeCtrl(RED, node, config);
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

    RED.nodes.registerType('clock-timer', clockTimerNode);

    RED.httpAdmin.post('/clock-timer/:id', RED.auth.needsPermission('clock-timer.write'), (req, res) => {
        const node = RED.nodes.getNode(req.params.id);
        if (node !== null && typeof node !== 'undefined') {
            try {
                if (req.body && req.body.ruleData) {
                    changeRules(node, req.body.rulePos, req.body.ruleName, req.body.ruleData);
                }
                res.sendStatus(200);
            } catch(err) {
                res.sendStatus(500);
                node.error(RED._('node-red:inject.failed',{error:err.toString()}));
            }
        } else {
            res.status(404).send(JSON.stringify({
                error: 'can not find node "' +req.params.id+'" '+String(node)
            }));
            return;
        }
    });
};