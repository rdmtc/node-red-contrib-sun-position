/********************************************
 * blind-control:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');

/*************************************************************************************************************************/
/**
   * the definition of the time to compare
   * @param {*} compareType type to compare
   * @param {*} msg the message object
   * @param {*} node the current node object
   */
function getNow_(node, msg) {
    let value = '';
    if (typeof msg.time === 'number') {
        value = msg.time;
        node.debug(`compare time to msg.time = "${value}"`);
    } else if (typeof msg.ts === 'number') {
        value = msg.ts;
        node.debug(`compare time to msg.ts = "${value}"`);
    } else {
        return new Date();
    }
    const dto = new Date(value);
    if (hlp.isValidDate(dto)) {
        node.debug(dto.toISOString());
        return dto;
    }
    node.error(`Error can not get a valide timestamp from "${value}"! Will use current timestamp!`);
    return new Date();
}

/******************************************************************************************/
module.exports = function (RED) {
    'use strict';
    /**
     * evaluate temporary Data
     * @param {*} node   node Data
     * @param {string} type  type of type input
     * @param {string} value  value of typeinput
     * @param {*} data  data to cache
     * @returns {*}  data which was cached
     */
    function evalTempData(node, type, value, data) {
        // node.debug(`evalTempData type=${type} value=${value} data=${data}`);
        if (data === null || typeof data === 'undefined') {
            const name = `${type}.${value}`;
            if (typeof node.tempData[name] !== 'undefined') {
                node.log(RED._('blind-control.errors.usingTempValue', { type, value, usedValue: node.tempData[name] }));
                return node.tempData[name];
            }
            if (node.nowarn[name]) {
                return null; // only one error per run
            }
            node.warn(RED._('blind-control.errors.warning', { message: RED._('blind-control.errors.notEvaluableProperty', { type, value, usedValue: 'null' }) }));
            node.nowarn[name] = true;
            return null;
        }
        node.tempData[`${type}.${value}`] = data;
        return data;
    }
    /******************************************************************************************/
    /**
     * reset any existing override
     * @param {*} node node data
     */
    function blindPosOverwriteReset(node) {
        node.debug(`blindPosOverwriteReset expire=${node.timeData.overwrite.expireTs}`);
        node.timeData.overwrite.active = false;
        node.timeData.overwrite.priority = 0;
        if (node.timeOutObj) {
            clearTimeout(node.timeOutObj);
            node.timeOutObj = null;
        }
        if (node.timeData.overwrite.expireTs || node.timeData.overwrite.expires) {
            delete node.timeData.overwrite.expires;
            delete node.timeData.overwrite.expireTs;
            delete node.timeData.overwrite.expireDate;
            delete node.timeData.overwrite.expireDateISO;
            delete node.timeData.overwrite.expireDateUTC;
            delete node.timeData.overwrite.expireTimeLocal;
            delete node.timeData.overwrite.expireDateLocal;
        }
    }

    /**
     * setup the expiring of n override or update an existing expiring
     * @param {*} node node data
     * @param {Date} now the current timestamp
     * @param {number} expire the expiring time, (if it is NaN, default time will be tried to use) if it is not used, nor a Number or less than 1 no expiring activated
     */
    function setExpiringOverwrite(node, now, expire) {
        node.debug(`setExpiringOverwrite now=${now}, expire=${expire}`);
        if (node.timeOutObj) {
            clearTimeout(node.timeOutObj);
            node.timeOutObj = null;
        }

        if (isNaN(expire)) {
            expire = node.timeData.overwrite.expireDuration;
            node.debug(`using default expire value ${expire}`);
        }
        node.timeData.overwrite.expires = Number.isFinite(expire) && (expire > 0);

        if (!node.timeData.overwrite.expires) {
            node.debug(`expireNever expire=${expire} ${  typeof expire  } - isNaN=${  isNaN(expire)  } - finite=${  !isFinite(expire)  } - min=${  expire < 100}`);
            delete node.timeData.overwrite.expireTs;
            delete node.timeData.overwrite.expireDate;
            return;
        }
        node.timeData.overwrite.expireTs = (now.getTime() + expire);
        node.timeData.overwrite.expireDate = new Date(node.timeData.overwrite.expireTs);
        node.timeData.overwrite.expireDateISO = node.timeData.overwrite.expireDate.toISOString();
        node.timeData.overwrite.expireDateUTC = node.timeData.overwrite.expireDate.toUTCString();
        node.timeData.overwrite.expireDateLocal = node.positionConfig.toDateString(node.timeData.overwrite.expireDate);
        node.timeData.overwrite.expireTimeLocal = node.positionConfig.toTimeString(node.timeData.overwrite.expireDate);

        node.debug(`expires in ${expire}ms = ${node.timeData.overwrite.expireDate}`);
        node.timeOutObj = setTimeout(() => {
            node.debug('timeout - overwrite expired');
            blindPosOverwriteReset(node);
            node.emit('input', { payload: -1, topic: 'internal-trigger-overwriteExpired', force: false });
        }, expire);
    }

    /**
     * check if an override can be reset
     * @param {*} node node data
     * @param {*} msg message object
     * @param {*} now current timestamp
     */
    function checkOverrideReset(node, msg, now, prio) {
        if (node.timeData.overwrite &&
            node.timeData.overwrite.expires &&
            (node.timeData.overwrite.expireTs < now.getTime())) {
            blindPosOverwriteReset(node);
        }
        if ((!prio) || (node.timeData.overwrite.priority <= prio)) {
            hlp.getMsgBoolValue(msg, 'reset', 'resetOverwrite',
                val => {
                    node.debug(`reset val="${util.inspect(val, { colors: true, compact: 10, breakLength: Infinity })  }"`);
                    if (val) {
                        blindPosOverwriteReset(node);
                    }
                });
        }
    }
    /**
     * setting the reason for override
     * @param {*} node node data
     */
    function setOverwriteReason(node) {
        if (node.timeData.overwrite.expireTs) {
            node.reason.code = 3;
            const obj = {
                prio: node.timeData.overwrite.priority,
                timeLocal: node.timeData.overwrite.expireTimeLocal,
                dateLocal: node.timeData.overwrite.expireDateLocal,
                dateISO: node.timeData.overwrite.expireDateISO,
                dateUTC: node.timeData.overwrite.expireDateUTC
            };
            node.reason.state = RED._('blind-control.states.overwriteExpire', obj);
            node.reason.description = RED._('blind-control.reasons.overwriteExpire', obj);
        } else {
            node.reason.code = 2;
            node.reason.state = RED._('blind-control.states.overwriteNoExpire', { prio: node.timeData.overwrite.priority });
            node.reason.description = RED._('blind-control.states.overwriteNoExpire', { prio: node.timeData.overwrite.priority });
        }
        node.debug(`overwrite exit true node.timeData.overwrite.active=${node.timeData.overwrite.active}`);
    }

    /**
     * check if a manual overwrite of the blind level should be set
     * @param {*} node node data
     * @param {*} msg message object
     * @returns true if override is active, otherwise false
     */
    function checkBlindPosOverwrite(node, msg, now) {
        node.debug(`checkBlindPosOverwrite act=${node.timeData.overwrite.active} `);
        const prio = hlp.getMsgNumberValue(msg, ['prio', 'priority'], ['prio', 'alarm'], p => {
            checkOverrideReset(node, msg, now, p);
            return p;
        }, () => {
            checkOverrideReset(node, msg, now);
            return 0;
        });
        if (node.timeData.overwrite.active && (node.timeData.overwrite.priority > 0) && (node.timeData.overwrite.priority > prio)) {
            setOverwriteReason(node);
            node.debug(`overwrite exit true node.timeData.overwrite.active=${node.timeData.overwrite.active}, prio=${prio}, node.timeData.overwrite.priority=${node.timeData.overwrite.priority}`);
            // if active, the prio must be 0 or given with same or higher as current overwrite otherwise this will not work
            return true;
        }
        let newPos = hlp.getMsgNumberValue(msg, ['blindPosition', 'position', 'level', 'blindLevel'], ['manual', 'levelOverwrite']);
        const expire = hlp.getMsgNumberValue(msg, 'expire', 'expire');
        if (node.timeData.overwrite.active && isNaN(newPos)) {
            node.debug(`overwrite active, check of prio=${prio} or expire=${expire}, newPos=${newPos}`);
            if (Number.isFinite(expire)) {
                // set to new expiring time
                setExpiringOverwrite(node, now, expire);
            }
            if (prio > 0) {
                // set to new priority
                node.timeData.overwrite.priority = prio;
            }
            setOverwriteReason(node);
            node.debug(`overwrite exit true node.timeData.overwrite.active=${node.timeData.overwrite.active}, newPos=${newPos}, expire=${expire}`);
            return true;
        } else if (!isNaN(newPos)) {
            node.debug(`needOverwrite prio=${prio} expire=${expire} newPos=${newPos}`);
            if (newPos === -1) {
                node.tempData.level = NaN;
            } else if (!isNaN(newPos)) {
                const allowRound = (msg.topic ? (msg.topic.includes('roundLevel') || msg.topic.includes('roundLevel')) : false);
                if (!validPosition_(node, newPos, allowRound)) {
                    node.error(RED._('blind-control.errors.invalid-blind-level', { pos: newPos }));
                    return false;
                }
                if (allowRound) {
                    newPos = posRound_(node, newPos);
                }
                node.debug(`overwrite newPos=${newPos}`);
                const noSameValue = hlp.getMsgBoolValue(msg, 'ignoreSameValue');
                if (noSameValue && (node.previousData.level === newPos)) {
                    setOverwriteReason(node);
                    node.debug(`overwrite exit true noSameValue=${noSameValue}, newPos=${newPos}`);
                    return true;
                }
                node.tempData.level = newPos;
            }

            if (Number.isFinite(expire) || (prio <= 0)) {
                // will set expiring if prio is 0 or if expire is explizit defined
                setExpiringOverwrite(node, now, expire);
            } else if ((prio > node.timeData.overwrite.priority) || (!node.timeData.overwrite.expireTs)) {
                // no expiring on prio change or no existing expiring
                setExpiringOverwrite(node, now, -1);
            }
            if (prio > 0) {
                node.timeData.overwrite.priority = prio;
            }
            node.timeData.overwrite.active = true;
        }
        if (node.timeData.overwrite.active) {
            setOverwriteReason(node);
            node.debug(`overwrite exit true node.timeData.overwrite.active=${node.timeData.overwrite.active}`);
            return true;
        }
        node.debug(`overwrite exit false node.timeData.overwrite.active=${node.timeData.overwrite.active}`);
        return false;
    }

    /******************************************************************************************/
    /**
     * pre-checking conditions to may be able to store temp data
     * @param {*} node node data
     * @param {*} msg the message object
     */
    function prepareRules(node, msg) {
        for (let i = 0; i < node.rules.count; ++i) {
            const rule = node.rules.data[i];
            if (rule.conditional) {
                delete rule.conditonData.operandValue;
                delete rule.conditonData.thresholdValue;
                rule.conditonData.result = node.positionConfig.comparePropValue(node, msg,
                    rule.validOperandAType,
                    rule.validOperandAValue,
                    rule.validOperator,
                    rule.validOperandBType,
                    rule.validOperandBValue,
                    (type, value, data, _id) => { // opCallback
                        if (_id === 1) {
                            rule.conditonData.operandValue = value;
                        } else if (_id === 2) {
                            rule.conditonData.thresholdValue = value;
                        }
                        return evalTempData(node, type, value, data);
                    });
                rule.conditonData.text = rule.conditonData.operandName + ' ' + rule.conditonData.operatorText;
                rule.conditonData.textShort = (rule.conditonData.operandNameShort || rule.conditonData.operandName) + ' ' + rule.conditonData.operatorText;
                if (typeof rule.conditonData.thresholdValue !== 'undefined') {
                    rule.conditonData.text += ' ' + rule.conditonData.thresholdValue;
                    rule.conditonData.textShort += ' ' + hlp.clipStrLength(rule.conditonData.thresholdValue, 10);
                }
            }
        }
    }

    /**
       * calculates the times
       * @param {*} node node data
       * @param {*} msg the message object
       * @param {*} config the configuration object
       * @returns the active rule or null
       */
    function checkRules(node, msg, now) {
        const livingRuleData = {};
        const nowNr = now.getTime();
        prepareRules(node,msg);
        node.debug(`checkRules nowNr=${nowNr}, rules.count=${node.rules.count}, rules.lastUntil=${node.rules.lastUntil}`); // {colors:true, compact:10}

        const fkt = (rule, cmp) => {
            // node.debug('rule ' + util.inspect(rule, {colors:true, compact:10}));
            if (rule.conditional) {
                try {
                    if (!rule.conditonData.result) {
                        return null;
                    }
                } catch (err) {
                    node.warn(RED._('blind-control.errors.getPropertyData', err));
                    node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                    return null;
                }
            }
            if (!rule.timeLimited) {
                return rule;
            }
            rule.timeData = node.positionConfig.getTimeProp(node, msg, {
                type: rule.timeType,
                value : rule.timeValue,
                offsetType : rule.offsetType,
                offset : rule.offsetValue,
                multiplier : rule.multiplier,
                next : false,
                now
            });

            if (rule.timeData.error) {
                hlp.handleError(node, RED._('blind-control.errors.error-time', { message: rule.timeData.error }), undefined, rule.timeData.error);
                return null;
            } else if (!rule.timeData.value) {
                throw new Error('Error can not calc time!');
            }
            rule.timeData.num = rule.timeData.value.getTime();
            // node.debug(`pos=${rule.pos} type=${rule.timeOpText} - ${rule.timeValue} - rule.timeData = ${ util.inspect(rule.timeData, { colors: true, compact: 40, breakLength: Infinity }) }`);
            if (cmp(rule.timeData.num)) {
                return rule;
            }
            return null;
        };

        let ruleSel = null;
        // node.debug('first loop ' + node.rules.count);
        for (let i = 0; i <= node.rules.lastUntil; ++i) {
            const rule = node.rules.data[i];
            // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== 1) + ' - ' + util.inspect(rule, {colors:true, compact:10, breakLength: Infinity }));
            if (rule.timeOp === 1) { continue; } // - Until: timeOp === 0
            const res = fkt(rule, r => (r >= nowNr));
            if (res) {
                node.debug('1. ruleSel ' + util.inspect(res, { colors: true, compact: 10, breakLength: Infinity }));
                ruleSel = res;
                break;
            }
        }
        if (!ruleSel) {
            // node.debug('--------- starting second loop ' + node.rules.count);
            for (let i = (node.rules.count - 1); i >= 0; --i) {
                const rule = node.rules.data[i];
                // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== 0) + ' - ' + util.inspect(rule, {colors:true, compact:10, breakLength: Infinity }));
                if (rule.timeOp === 0) { continue; } // - From: timeOp === 1
                const res = fkt(rule, r => (r <= nowNr));
                if (res) {
                    node.debug('2. ruleSel ' + util.inspect(res, { colors: true, compact: 10, breakLength: Infinity }));
                    ruleSel = res;
                    break;
                }
            }
        }

        if (ruleSel) {
            // ruleSel.text = '';
            node.debug('ruleSel ' + util.inspect(ruleSel, {colors:true, compact:10, breakLength: Infinity }));
            node.reason.code = 4;
            livingRuleData.id = ruleSel.pos;
            node.reason.code = 4;

            livingRuleData.active = true;
            livingRuleData.outputValue = ruleSel.outputValue;
            livingRuleData.outputType = ruleSel.outputType;

            livingRuleData.conditional = ruleSel.conditional;
            livingRuleData.timeLimited = ruleSel.timeLimited;
            node.tempData.level = livingRuleData.level;
            const data = { number: ruleSel.pos };
            let name = 'rule';
            if (ruleSel.conditional) {
                livingRuleData.conditon = ruleSel.conditonData;
                data.text = ruleSel.conditonData.text;
                data.textShort = ruleSel.conditonData.textShort;
                data.operatorText = ruleSel.conditonData.operatorText;
                data.operatorDescription = ruleSel.conditonData.operatorDescription;
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
            node.reason.state= RED._('blind-control.states.'+name, data);
            node.reason.description = RED._('blind-control.reasons.'+name, data);
            node.debug(`checkRules end pos=${node.tempData.level} reason=${node.reason.code} description=${node.reason.description} all=${util.inspect(livingRuleData, { colors: true, compact: 10, breakLength: Infinity })}`);
            return livingRuleData;
        }
        livingRuleData.active = false;
        livingRuleData.id = -1;
        node.reason.code = 1;
        node.reason.state = RED._('blind-control.states.default');
        node.reason.description = RED._('blind-control.reasons.default');
        node.debug(`checkRules end pos=${node.tempData.level} reason=${node.reason.code} description=${node.reason.description} all=${util.inspect(livingRuleData, { colors: true, compact: 10, breakLength: Infinity })}`);
        return livingRuleData;
    }
    /******************************************************************************************/
    /******************************************************************************************/
    /**
     * standard Node-Red Node handler for the sunBlindControlNode
     * @param {*} config the Node-Red Configuration property of the Node
     */
    function sunBlindControlNode(config) {
        RED.nodes.createNode(this, config);
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        this.outputs = Number(config.outputs || 1);
        const node = this;

        node.nowarn = {};
        node.reason = {
            code : 0,
            state: '',
            description: ''
        };
        // temporary node Data
        node.tempData = { };
        // Retrieve the config node
        node.timeData = {
            output: NaN, // unknown
            outputType: 'str',
            /** The Level of the window */
            outputDefault: config.outputDefault,
            outputDefaultType: config.outputDefaultType,
            /** The override settings */
            overwrite: {
                active: false,
                expireDuration: parseFloat(hlp.chkValueFilled(config.overwriteExpire, NaN)),
                priority: 0
            }
        };
        node.rules = {
            data: config.rules || []
        };
        node.previousData = {
            level: NaN,
            reasonCode: -1,
            usedRule: NaN
        };

        /**
         * set the state of the node
         */
        function setState(blindCtrl) {
            let code = node.reason.code;
            let shape = 'ring';
            let fill = 'yellow';
            if (code === 10) { // smooth;
                code = node.previousData.reasonCode;
            }

            if (node.tempData.level === node.timeData.levelTop) {
                shape = 'dot';
            }

            if (code <= 3) {
                fill = 'blue'; // override
            } else if (code === 4 || code === 15 || code === 16) {
                fill = 'grey'; // rule
            } else if (code === 1 || code === 8) {
                fill = 'green'; // not in window or oversteerExceeded
            }

            node.reason.stateComplete = (isNaN(blindCtrl.level)) ? node.reason.state : getRealLevel_(node).toString() + ' - ' + node.reason.state;
            node.status({
                fill,
                shape,
                text: node.reason.stateComplete
            });
        }

        /**
         * handles the input of a message object to the node
         */
        this.on('input', function (msg) {
            try {
                node.debug(`input msg.topic=${msg.topic} msg.payload=${msg.payload}`);
                // node.debug('input ' + util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity })); // Object.getOwnPropertyNames(msg)
                if (!this.positionConfig) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'));
                    node.status({
                        fill: 'red',
                        shape: 'dot',
                        text: 'Node not properly configured!!'
                    });
                    return null;
                }
                node.nowarn = {};
                const blindCtrl = {
                    reason : node.reason,
                    blind: node.timeData
                };

                node.previousData.level = node.tempData.level;
                node.previousData.reasonCode= node.reason.code;
                node.previousData.reasonState= node.reason.state;
                node.previousData.reasonDescription= node.reason.description;
                node.oversteer.isChecked = false;
                node.reason.code = NaN;
                const now = getNow_(node, msg);
                // check if the message contains any oversteering data
                let ruleId = NaN;

                const newMode = hlp.getMsgNumberValue(msg, ['mode'], ['setMode']);
                if (Number.isFinite(newMode) && newMode >= 0 && newMode <= node.sunData.modeMax) {
                    node.sunData.mode = newMode;
                }

                // node.debug(`start pos=${node.tempData.level} manual=${node.timeData.overwrite.active} reasoncode=${node.reason.code} description=${node.reason.description}`);
                // check for manual overwrite
                if (!checkBlindPosOverwrite(node, msg, now)) {
                    // calc times:
                    blindCtrl.rule = checkRules(node, msg, now);
                    ruleId = blindCtrl.rule.id;
                }

                node.debug(`result pos=${blindCtrl.level} manual=${node.timeData.overwrite.active} reasoncode=${node.reason.code} description=${node.reason.description}`);
                setState(blindCtrl);

                let topic = config.topic;
                if (topic) {
                    const topicAttrs = {
                        name: node.name,
                        level: blindCtrl.level,
                        code: node.reason.code,
                        state: node.reason.state,
                        rule: ruleId,
                        mode: node.sunData.mode,
                        topic: msg.topic,
                        payload: msg.payload
                    };
                    topic = hlp.topicReplace(config.topic, topicAttrs);
                }
                if ((!isNaN(node.tempData.level)) &&
                    (node.tempData.level !== node.previousData.level ||
                    node.reason.code !== node.previousData.reasonCode ||
                    ruleId !== node.previousData.usedRule)) {
                    msg.payload = blindCtrl.level;
                    if (node.outputs > 1) {
                        node.send([msg, { topic, payload: blindCtrl}]);
                    } else {
                        msg.topic = topic || msg.topic;
                        msg.blindCtrl = blindCtrl;
                        node.send(msg, null);
                    }
                } else if (node.outputs > 1) {
                    node.send([null, { topic, payload: blindCtrl}]);
                }
                node.previousData.usedRule = ruleId;
                return null;
            } catch (err) {
                node.error(RED._('blind-control.errors.error', err));
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'internal error'
                });
            }
            return null;
        });
        // ####################################################################################################
        /**
         * initializes the node
         */
        function initialize() {
            node.debug('initialize');
            const getName = (type, value) => {
                if (type === 'num') {
                    return value;
                } else if (type === 'str') {
                    return '"' + value + '"';
                } else if (type === 'bool') {
                    return '"' + value + '"';
                } else if (type === 'global' || type === 'flow') {
                    value = value.replace(/^#:(.+)::/, '');
                }
                return type + '.' + value;
            };
            const getNameShort = (type, value) => {
                if (type === 'num') {
                    return value;
                } else if (type === 'str') {
                    return '"' + hlp.clipStrLength(value,20) + '"';
                } else if (type === 'bool') {
                    return '"' + value + '"';
                } else if (type === 'global' || type === 'flow') {
                    value = value.replace(/^#:(.+)::/, '');
                    // special for Homematic Devices
                    if (/^.+\[('|").{18,}('|")\].*$/.test(value)) {
                        value = value.replace(/^.+\[('|")/, '').replace(/('|")\].*$/, '');
                        if (value.length > 25) {
                            return '...' + value.slice(-22);
                        }
                        return value;
                    }
                }
                if ((type + value).length > 25) {
                    return type + '...' + value.slice(-22);
                }
                return type + '.' + value;
            };
            node.rules.count = node.rules.data.length;
            node.rules.lastUntil = node.rules.count -1;
            node.rules.checkUntil = false;
            node.rules.checkFrom = false;
            node.rules.firstFrom = node.rules.lastUntil;

            for (let i = 0; i < node.rules.count; ++i) {
                const rule = node.rules.data[i];
                rule.pos = i + 1;
                rule.timeOp = Number(rule.timeOp) || 0;
                rule.conditional = (rule.validOperandAType !== 'none');
                rule.timeLimited = (rule.timeType !== 'none');
                if (!rule.timeLimited) {
                    rule.timeOp = -1;
                }
                if (rule.conditional) {
                    rule.conditonData = {
                        result: false,
                        operandName: getName(rule.validOperandAType,rule.validOperandAValue),
                        thresholdName: getName(rule.validOperandBType, rule.validOperandBValue),
                        operator: rule.validOperator,
                        operatorText: rule.validOperatorText,
                        operatorDescription: RED._('node-red-contrib-sun-position/position-config:common.comparatorDescription.' + rule.validOperator)
                    };
                    if (rule.conditonData.operandName.length > 25) {
                        rule.conditonData.operandNameShort = getNameShort(rule.validOperandAType, rule.validOperandAValue);
                    }
                    if (rule.conditonData.thresholdName.length > 25) {
                        rule.conditonData.thresholdNameShort = getNameShort(rule.validOperandBType, rule.validOperandBValue);
                    }
                }
                if (rule.timeOp === 0) {
                    node.rules.lastUntil = i; // from rule
                    node.rules.checkUntil = true; // from rule
                }
                if (rule.timeOp === 1 && !node.rules.checkFrom) {
                    node.rules.firstFrom = i;
                    node.rules.checkFrom = true; // from rule
                }
            }
            /* if (node.rules.data) {
                node.rules.data.sort((a, b) => {
                    if (a.timeLimited && b.timeLimited) { // both are time limited
                        const top = (a.timeOp - b.timeOp);
                        if (top !== 0) { // from/until type different
                            return top; // from before until
                        }
                    }
                    return a.pos - b.pos;
                });
                node.debug('node.rules.data =' + util.inspect(node.rules.data, { colors: true, compact: 10, breakLength: Infinity }));
            } */
        }
        initialize();
    }

    RED.nodes.registerType('blind-control', sunBlindControlNode);
};