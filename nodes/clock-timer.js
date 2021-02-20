/********************************************
 * clock-timer:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const ctrlLib = require(path.join(__dirname, '/lib/timeControlHelper.js'));
const util = require('util');

const cRuleUntil = 0;
const cRuleFrom = 1;
// const cRuleAbsolute = 0;

/******************************************************************************************/
module.exports = function (RED) {
    'use strict';
    /******************************************************************************************/
    /**


    /**
     * check if a manual overwrite should be set
     * @param {*} node node data
     * @param {*} msg message object
     * @returns {boolean} true if override is active, otherwise false
     */
    function checkPosOverwrite(node, msg, dNow) {
        // node.debug(`checkPosOverwrite act=${node.nodeData.overwrite.active} `);
        let isSignificant = false;
        const exactImportance = hlp.getMsgBoolValue(msg, ['exactImportance', 'exactSignificance', 'exactPriority', 'exactPrivilege']);
        const nImportance = hlp.getMsgNumberValue(msg, ['importance', 'significance', 'prio', 'priority', 'privilege'], null, p => {
            if (exactImportance) {
                isSignificant = (node.nodeData.overwrite.importance === p);
            } else {
                isSignificant = (node.nodeData.overwrite.importance <= p);
            }
            ctrlLib.checkOverrideReset(node, msg, dNow, isSignificant);
            return p;
        }, () => {
            ctrlLib.checkOverrideReset(node, msg, dNow, true);
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
                msg.topic.includes('overwrite'))) {
                overrideData = msg.payload;
                overrideTopic = msg.topic;
            } else if (typeof msg.payload === 'object' && (msg.payload.value && (msg.payload.expires || msg.payload.importance || msg.payload.importance))) {
                overrideData = msg.payload.value;
                overrideTopic = msg.topic;
            }
        }

        let nExpire = hlp.getMsgNumberValue(msg, 'expire');
        if (msg.topic && String(msg.topic).includes('noExpir')) {
            nExpire = -1;
        }
        if (typeof overrideData !== 'undefined') {
            node.debug(`needOverwrite importance=${nImportance} expire=${nExpire}`);
            if (typeof overrideData !== 'undefined') {
                node.debug(`overwrite overrideData=${overrideData}`);
                node.payload.current = overrideData;
                node.payload.topic = overrideTopic;
            }

            if (Number.isFinite(nExpire) || (nImportance <= 0)) {
                // will set expiring if importance is 0 or if expire is explizit defined
                node.debug(`set expiring - expire is explizit defined "${nExpire}"`);
                ctrlLib.setExpiringOverwrite(node, dNow, nExpire, 'set expiring time by message');
            } else if ((!exactImportance && (node.nodeData.overwrite.importance < nImportance)) || (!node.nodeData.overwrite.expireTs)) {
                // isSignificant
                // no expiring on importance change or no existing expiring
                node.debug(`no expire defined, using default or will not expire`);
                ctrlLib.setExpiringOverwrite(node, dNow, NaN, 'no special expire defined');
            }
            if (nImportance > 0) {
                node.nodeData.overwrite.importance = nImportance;
            }
            node.nodeData.overwrite.active = true;
        } else if (node.nodeData.overwrite.active) {
            node.debug(`overwrite active, check of nImportance=${nImportance} or nExpire=${nExpire}`);
            if (Number.isFinite(nExpire)) {
                node.debug(`set to new expiring time nExpire="${nExpire}"`);
                // set to new expiring time
                ctrlLib.setExpiringOverwrite(node, dNow, nExpire, 'set new expiring time by message');
            }
            if (nImportance > 0) {
                // set to new importance
                node.nodeData.overwrite.importance = nImportance;
            }
        }
        // node.debug(`overwrite exit node.nodeData.overwrite.active=${node.nodeData.overwrite.active}; expire=${nExpire}`);
        return ctrlLib.setOverwriteReason(node);
    }

    /******************************************************************************************/

    /**
     * check all rules and determinate the active rule
     * @param {Object} node node data
     * @param {Object} msg the message object
     * @param {Date} dNow the *current* date Object
     * @param {Object} tempData the object storing the temporary caching data
     * @returns the active rule or null
     */
    function checkRules(node, msg, dNow, tempData) {
        // node.debug('checkRules --------------------');
        const livingRuleData = {};
        const nowNr = dNow.getTime();
        const dayNr = dNow.getDay();
        const dateNr = dNow.getDate();
        const monthNr = dNow.getMonth();
        const dayId =  hlp.getDayId(dNow);
        ctrlLib.prepareRules(node, msg, tempData);
        // node.debug(`checkRules dNow=${dNow.toISOString()}, nowNr=${nowNr}, dayNr=${dayNr}, dateNr=${dateNr}, monthNr=${monthNr}, dayId=${dayId}, rules.count=${node.rules.count}, rules.lastUntil=${node.rules.lastUntil}`);

        /**
        * Timestamp compare function
        * @name ICompareTimeStamp
        * @function
        * @param {number} timeStamp The timestamp which should be compared
        * @returns {Boolean} return true if if the timestamp is valid, otherwise false
        */

        /**
         * function to check a rule
         * @param {object} rule a rule object to test
         * @param {ICompareTimeStamp} cmp a function to compare two timestamps.
         * @returns {Object|null} returns the rule if rule is valid, otherwhise null
         */
        const fktCheck = (rule, cmp) => {
            // node.debug('fktCheck rule ' + util.inspect(rule, {colors:true, compact:10}));
            if (rule.conditional) {
                try {
                    if (!rule.conditon.result) {
                        return null;
                    }
                } catch (err) {
                    node.warn(RED._('node-red-contrib-sun-position/position-config:errors.getPropertyData', err));
                    node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                    return null;
                }
            }
            if (!rule.timeLimited) {
                return rule;
            }
            if (rule.timeDays && rule.timeDays !== '*' && !rule.timeDays.includes(dayNr)) {
                return null;
            }
            if (rule.timeMonths && rule.timeMonths !== '*' && !rule.timeMonths.includes(monthNr)) {
                return null;
            }
            if (rule.timeOnlyOddDays && (dateNr % 2 === 0)) { // even
                return null;
            }
            if (rule.timeOnlyEvenDays && (dateNr % 2 !== 0)) { // odd
                return null;
            }
            if (rule.timeDateStart || rule.timeDateEnd) {
                rule.timeDateStart.setFullYear(dNow.getFullYear());
                rule.timeDateEnd.setFullYear(dNow.getFullYear());
                if (rule.timeDateEnd > rule.timeDateStart) {
                    // in the current year
                    if (dNow < rule.timeDateStart || dNow > rule.timeDateEnd) {
                        return null;
                    }
                } else {
                    // switch between year from end to start
                    if (dNow < rule.timeDateStart && dNow > rule.timeDateEnd) {
                        return null;
                    }
                }
            }
            const num = ctrlLib.getRuleTimeData(node, msg, rule, dNow);
            // node.debug(`pos=${rule.pos} type=${rule.timeOpText} - ${rule.timeValue} - num=${num} - rule.timeData = ${ util.inspect(rule.timeData, { colors: true, compact: 40, breakLength: Infinity }) }`);
            if (dayId === rule.timeData.dayId && num >=0 && (cmp(num) === true)) {
                return rule;
            }
            return null;
        };

        let ruleSel = null;
        let ruleindex = -1;
        // node.debug('first loop count:' + node.rules.count + ' lastuntil:' + node.rules.lastUntil);
        for (let i = 0; i <= node.rules.lastUntil; ++i) {
            const rule = node.rules.data[i];
            // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== cRuleFrom) + ' - ' + util.inspect(rule, {colors:true, compact:10, breakLength: Infinity }));
            if (rule.timeOp === cRuleFrom) { continue; }
            // const res = fktCheck(rule, r => (r >= nowNr));
            let res = null;
            if (rule.timeOp === cRuleFrom) {
                res = fktCheck(rule, r => (r <= nowNr));
            } else {
                res = fktCheck(rule, r => (r >= nowNr));
            }
            if (res) {
                // node.debug('1. ruleSel ' + util.inspect(res, { colors: true, compact: 10, breakLength: Infinity }));
                ruleSel = res;
                ruleindex = i;
                if (rule.timeOp !== cRuleFrom) {
                    break;
                }
            }
        }

        if (!ruleSel || (ruleSel.timeOp === cRuleFrom) ) {
            // node.debug('--------- starting second loop ' + node.rules.count);
            for (let i = (node.rules.count - 1); i >= 0; --i) {
                const rule = node.rules.data[i];
                // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== cRuleUntil) + ' - ' + util.inspect(rule, {colors:true, compact:10, breakLength: Infinity }));
                if (rule.timeOp === cRuleUntil) { continue; } // - From: timeOp === cRuleFrom
                const res = fktCheck(rule, r => (r <= nowNr));
                if (res) {
                    // node.debug('2. ruleSel ' + util.inspect(res, { colors: true, compact: 10, breakLength: Infinity }));
                    ruleSel = res;
                    break;
                }
            }
        }

        const checkRuleForAT = rule => {
            if (!rule.timeLimited) {
                return;
            }
            const num = ctrlLib.getRuleTimeData(node, msg, rule, dNow);
            if (num > nowNr) {
                node.debug('autoTrigger set to rule ' + rule.pos);
                const diff = num - nowNr;
                node.autoTrigger.time = Math.min(node.autoTrigger.time, diff);
                node.autoTrigger.type = 2; // next rule
            }
        };
        if (ruleSel) {
            if (node.autoTrigger) {
                if (ruleSel.timeLimited && ruleSel.timeData.ts > nowNr) {
                    node.debug('autoTrigger set to rule ' + ruleSel.pos + ' (current)');
                    const diff = ruleSel.timeData.ts - nowNr;
                    node.autoTrigger.time = Math.min(node.autoTrigger.time, diff);
                    node.autoTrigger.type = 1; // current rule end
                } else {
                    for (let i = (ruleindex+1); i < node.rules.count; ++i) {
                        const rule = node.rules.data[i];
                        if (!rule.timeLimited) {
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
            livingRuleData.timeLimited = ruleSel.timeLimited;
            livingRuleData.payloadData = {
                type: ruleSel.payloadType,
                value: ruleSel.payloadValue,
                format: ruleSel.payloadFormat,
                offsetType: ruleSel.payloadOffsetType,
                offset: ruleSel.payloadOffsetValue,
                multiplier: ruleSel.payloadOffsetMultiplier,
                next: true
            };
            const data = { number: ruleSel.pos, name: ruleSel.name };
            let name = 'rule';
            if (ruleSel.conditional) {
                livingRuleData.conditon = ruleSel.conditon;
                data.text = ruleSel.conditon.text;
                data.textShort = ruleSel.conditon.textShort;
                name = 'ruleCond';
            }
            if (ruleSel.timeLimited) {
                livingRuleData.time = ruleSel.timeData;
                livingRuleData.time.timeLocal = node.positionConfig.toTimeString(ruleSel.timeData.value);
                livingRuleData.time.timeLocalDate = node.positionConfig.toDateString(ruleSel.timeData.value);
                livingRuleData.time.dateISO= ruleSel.timeData.value.toISOString();
                livingRuleData.time.dateUTC= ruleSel.timeData.value.toUTCString();
                data.timeOp = ruleSel.timeOpText;
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
        livingRuleData.id = -1;
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
        // node.myNamename = config.name;
        this.debug(`starting ${config.name}, name = ${node.name}`);

        if (config.autoTrigger) {
            node.autoTrigger = {
                defaultTime : config.autoTriggerTime || 20 * 60000 // 20min
            };
            node.autoTriggerObj = null;
        }


        node.nowarn = {};
        node.reason = {
            code : 0,
            state: '',
            description: ''
        };
        // temporary node Data
        node.storeName = config.storeName || '';
        node.nodeData = {
            /** The Level of the window */
            payloadDefault: config.payloadDefault,
            payloadDefaultType: config.payloadDefaultType,
            payloadDefaultTimeFormat: config.payloadDefaultTimeFormat,
            payloadDefaultOffset: config.payloadDefaultOffset,
            payloadDefaultOffsetType: config.payloadDefaultOffsetType,
            payloadDefaultOffsetMultiplier: config.payloadDefaultOffsetMultiplier,
            topic:config.topic,
            /** The override settings */
            overwrite: {
                active: false,
                expireDuration: parseFloat(hlp.chkValueFilled(config.overwriteExpire, NaN)),
                importance: 0
            }
        };

        node.rules = {
            data: config.rules || []
        };
        node.payload = {
            current: undefined,
            topic: node.nodeData.topic
        };
        node.previousData = {
            reasonCode: -1,
            usedRule: NaN,
            last : {}
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
                if (msg.topic && (typeof msg.topic === 'string') && msg.topic.startsWith('set')) {
                    switch (msg.topic) {
                        /* Default Settings */
                        case 'setSettingsTopic':
                            node.nodeData.topic = msg.payload || node.nodeData.topic;
                            break;
                        /* advanced Settings */
                        case 'setAutoTriggerTime':
                            node.autoTrigger.defaultTime = parseFloat(msg.payload) || node.autoTrigger.defaultTime;
                            break;
                        case 'setStoreName':
                            node.storeName = msg.payload || node.storeName;
                            break;
                        default:
                            break;
                    }
                }

                // initialize
                node.nowarn = {};
                const tempData = node.context().get('cacheData',node.storeName) || {};
                node.previousData.payloadType = (typeof node.payload.current);
                node.previousData.reasonCode = node.reason.code;
                node.previousData.reasonState = node.reason.state;
                node.previousData.reasonDescription = node.reason.description;
                if (node.previousData.payloadType === 'string' ||
                    node.previousData.payloadType === 'boolean' ||
                    node.previousData.payloadType === 'number') {
                    node.previousData.payloadValue = node.payload.current;
                    node.previousData.payloadSimple = true;
                }
                node.reason.code = NaN;
                const dNow = hlp.getNowTimeStamp(node, msg);
                if (node.autoTrigger) {
                    node.autoTrigger.time = node.autoTrigger.defaultTime;
                    node.autoTrigger.type = 0; // default time
                }

                // check if the message contains any oversteering data
                const timeCtrl = {
                    autoTrigger : node.autoTrigger,
                    lastEvaluated: node.previousData.last,
                    name: node.name || node.id,
                    id: node.id
                };
                let ruleId = -2;

                // check for manual overwrite
                let overwrite = checkPosOverwrite(node, msg, dNow);
                if (!overwrite || node.rules.canResetOverwrite || (node.rules.maxImportance > 0 && node.rules.maxImportance > node.nodeData.overwrite.importance)) {
                    // calc times:
                    timeCtrl.rule = checkRules(node, msg, dNow, tempData);
                    node.previousData.last.ruleId = timeCtrl.rule.id;
                    node.previousData.last.ruleTopic = timeCtrl.rule.topic;

                    node.debug(`overwrite=${overwrite}, node.rules.maxImportance=${node.rules.maxImportance}, nodeData.overwrite.importance=${node.nodeData.overwrite.importance}`);
                    if (overwrite && timeCtrl.rule.resetOverwrite && timeCtrl.rule.id !== node.previousData.usedRule) {
                        ctrlLib.posOverwriteReset(node);
                        overwrite = false;
                    }

                    if (!overwrite || timeCtrl.rule.importance > node.nodeData.overwrite.importance) {
                        ruleId = timeCtrl.rule.id;
                        node.payload.current = node.positionConfig.getOutDataProp(node, msg, timeCtrl.rule.payloadData, dNow);
                        node.payload.topic = timeCtrl.rule.topic;
                        node.reason.code = timeCtrl.rule.code;
                        node.reason.state = timeCtrl.rule.state;
                        node.reason.description = timeCtrl.rule.description;
                        node.previousData.last.payload = node.payload.current;
                        node.previousData.last.topic = node.payload.topic;
                    }
                }

                // node.debug(`result manual=${node.nodeData.overwrite.active} reasoncode=${node.reason.code} description=${node.reason.description}`);
                timeCtrl.reason = node.reason;
                timeCtrl.timeClock = node.nodeData;

                if (node.startDelayTimeOut) {
                    node.reason.code = NaN;
                    node.reason.state = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.states.startDelay', {date:node.positionConfig.toTimeString(node.startDelayTimeOut)});
                    node.reason.description = RED._('node-red-contrib-sun-position/position-config:ruleCtrl.reasons.startDelay', {dateISO:node.startDelayTimeOut.toISOString()});
                }
                node.setState(node.payload.current);
                let topic = node.payload.topic || msg.topic;
                if (topic) {
                    const topicAttrs = {
                        name: timeCtrl.name,
                        id: timeCtrl.id,
                        code: node.reason.code,
                        state: node.reason.state,
                        rule: ruleId,
                        newtopic: topic,
                        topic: msg.topic,
                        payload: msg.payload
                    };
                    topic = hlp.topicReplace(topic, topicAttrs);
                }

                if ((typeof node.payload.current !== 'undefined') &&
                    (node.payload.current !== 'none') &&
                    (node.payload.current !== null) &&
                    !isNaN(node.reason.code) &&
                    ((node.reason.code !== node.previousData.reasonCode) ||
                    (ruleId !== node.previousData.usedRule) ||
                    (typeof node.payload.current !== node.previousData.payloadType) ||
                    ((typeof node.previousData.payloadValue  !== 'undefined') && (node.previousData.payloadValue !== node.payload.current))) ) {
                    msg.payload = node.payload.current;
                    msg.topic =  topic;
                    msg.timeCtrl = timeCtrl;
                    if (node.outputs > 1) {
                        send([msg, { topic, payload: timeCtrl, payloadOut: node.payload.current }]);
                    } else {
                        send([msg, null]);
                    }
                } else if (node.outputs > 1) {
                    send([null, { topic, payload: timeCtrl }]);
                }
                node.previousData.usedRule = ruleId;
                node.context().set('cacheData', tempData, node.storeName);
                if (node.autoTrigger) {
                    node.debug('------------- autoTrigger ---------------- ' + node.autoTrigger.time + ' - ' + node.autoTrigger.type);
                    if (node.autoTriggerObj) {
                        clearTimeout(node.autoTriggerObj);
                        node.autoTriggerObj = null;
                    }
                    node.autoTriggerObj = setTimeout(() => {
                        clearTimeout(node.autoTriggerObj);
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
                node.autoTriggerObj = null;
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
};