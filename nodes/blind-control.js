/********************************************
 * blind-control:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');

/*************************************************************************************************************************/
/**
 * check if a level has a valid value
 * @param {*} node the node data
 * @param {*} level the level to check
 * @returns {boolean} true if the level is valid, otherwise false
 */
function validPosition_(node, level) {
    // node.debug('validPosition_ level='+level);
    if (isNaN(level)) {
        node.warn(`Position: "${level}" is NaN!`);
        return false;
    }
    if (level < node.blindData.levelClosed) {
        node.warn(`Position: "${level}" < levelClosed ${node.blindData.levelClosed}`);
        return false;
    }
    if (level > node.blindData.levelOpen) {
        node.warn(`Position: "${level}" > levelOpen ${node.blindData.levelOpen}`);
        return false;
    }
    if (Number.isInteger(node.blindData.levelOpen) &&
        Number.isInteger(node.blindData.levelClosed) &&
        Number.isInteger(node.blindData.increment) &&
        ((level % node.blindData.increment !== 0) ||
        !Number.isInteger(level) )) {
        node.warn(`Position invalid "${level}" not fit to increment ${node.blindData.increment}`);
        return false;
    }
    return Number.isInteger(Number((level / node.blindData.increment).toFixed(hlp.countDecimals(node.blindData.increment) + 2)));
}
/******************************************************************************************/
/**
   * the definition of the time to compare
   * @param {*} compareType type to compare
   * @param {*} msg the message object
   * @param {*} node the current node object
   */
function getNow_(node, msg, compareType) {
    let id = '';
    let value = '';
    if (compareType == '0' || compareType == '') { // eslint-disable-line eqeqeq
        return new Date();
    } else if (compareType === '1') {
        id = 'msg.ts';
        value = msg.ts;
    } else if (compareType === '2') {
        id = 'msg.lc';
        value = msg.lc;
    } else if (compareType === '3') {
        id = 'msg.time';
        value = msg.time;
    } else {
        return new Date();
    }
    node.debug(`compare time to ${id} = "${value}"`);
    const dto = new Date(msg.ts);
    if (dto !== 'Invalid Date' && !isNaN(dto)) {
        return dto;
    }
    node.error('Error can not get a valide timestamp from ' + id + '="' + value + '"! Will use current timestamp!');
    return new Date();
}

/******************************************************************************************/
/**
 * get the absolute level from percentage level
 * @param {*} node the node settings
 * @param {*} percentPos the level in percentage
 */
function posPrcToAbs_(node, levelPercent) {
    return posRound_(node, ((node.blindData.levelOpen - node.blindData.levelClosed) * levelPercent) + node.blindData.levelClosed);
}
/**
 * round a level to the next increment
 * @param {*} node node data
 * @param {number} pos level
 * @return {number} rounded level number
 */
function posRound_(node, pos) {
    // node.debug(`levelPrcToAbs_ ${pos} - increment is ${node.blindData.increment}`);
    // pos = Math.ceil(pos / node.blindData.increment) * node.blindData.increment;
    // pos = Math.floor(pos / node.blindData.increment) * node.blindData.increment;
    pos = Math.round(pos / node.blindData.increment) * node.blindData.increment;
    pos = Number(pos.toFixed(hlp.countDecimals(node.blindData.increment)));
    if (pos > node.blindData.levelOpen) {
        pos = node.blindData.levelOpen;
    }
    if (pos < node.blindData.levelClosed) {
        pos = node.blindData.levelClosed;
    }
    // node.debug(`levelPrcToAbs_ result ${pos}`);
    return pos;
}

/**
 * normalizes an angle
 * @param {number} angle to normalize
 */
function angleNorm_(angle) {
    while (angle < 0) {
        angle += 360;
    }
    while (angle > 360) {
        angle -= 360;
    }
    return angle;
}
/******************************************************************************************/
/**
 * calculates the current sun level
 * @param {*} node node data
 * @param {*} now the current timestamp
 */
function getSunPosition_(node, now) {
    const sunPosition = node.positionConfig.getSunCalc(now);
    // node.debug('sunPosition: ' + util.inspect(sunPosition, Object.getOwnPropertyNames(sunPosition)));
    sunPosition.InWindow = (sunPosition.azimuthDegrees >= node.windowSettings.AzimuthStart) &&
                           (sunPosition.azimuthDegrees <= node.windowSettings.AzimuthEnd);
    return sunPosition;
}

module.exports = function (RED) {
    'use strict';
    /******************************************************************************************/
    /**
     * check the weather data
     * @param {*} node node data
     * @param {*} msg the message object
     */
    function checkWeather(node, msg) {
        // node.debug('checkWeather');
        if (!node.cloudData.active) {
            node.cloudData.isOperative = false;
            return;
        }
        try {
            node.cloudData.isOperative = node.positionConfig.comparePropValue(node, msg, node.cloudData.valueType, node.cloudData.value,
                node.cloudData.operator, node.cloudData.thresholdType, node.cloudData.thresholdValue, node.cloudData.temp);
        } catch (err) {
            node.error(RED._('blind-control.errors.getCloudData', err));
            node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
            node.cloudData.isOperative = false;
        }
        // node.debug('node.cloudData=' + util.inspect(node.cloudData));
    }
    /******************************************************************************************/
    /**
     * get the blind level from a typed input
     * @param {*} node node data
     * @param {*} type type field
     * @param {*} value value field
     * @returns blind level as number or NaN if not defined
     */
    function getBlindPosFromTI(node, msg, type, value, def) {
        def = def || NaN;
        if (type === 'none' || type === '') {
            return def;
        }
        try {
            if (type === 'levelFixed') {
                if (value.includes('close')) {
                    return node.blindData.levelClosed;
                } else if (value === '75%') {
                    return posPrcToAbs_(node, 0.75);
                } else if (value === '66%') {
                    return posPrcToAbs_(node, 0.66666);
                } else if (value === '50%') {
                    return posPrcToAbs_(node, 0.5);
                } else if (value === '33%') {
                    return posPrcToAbs_(node, 0.33333);
                } else if (value === '25%') {
                    return posPrcToAbs_(node, 0.25);
                } else if (value === '10%') {
                    return posPrcToAbs_(node, 0.1);
                } else if (value.includes('open')) {
                    return node.blindData.levelOpen;
                }
                throw new Error('unknown value "'+ value + '" of type "' + type + '"' );
            }
            return node.positionConfig.getFloatProp(node, msg, type, value, def);
        } catch (err) {
            node.error(RED._('blind-control.errors.getBlindPosData', err));
            node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
        }
        return def;
    }
    /******************************************************************************************/
    /**
     * reset any existing override
     * @param {*} node node data
     */
    function blindPosOverwriteReset(node) {
        node.debug(`blindPosOverwriteReset expire=${node.blindData.overwrite.expireTs}`);
        node.blindData.overwrite.active = false;
        node.blindData.overwrite.priority = 0;
        if (node.timeOutObj) {
            clearTimeout(node.timeOutObj);
            node.timeOutObj = null;
        }
        if (node.blindData.overwrite.expireTs || node.blindData.overwrite.expires) {
            delete node.blindData.overwrite.expires;
            delete node.blindData.overwrite.expireTs;
            delete node.blindData.overwrite.expireDate;
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
            expire = node.blindData.overwrite.expireDuration;
            node.debug(`using default expire value ${expire}`);
        }
        node.blindData.overwrite.expires = Number.isFinite(expire) && (expire > 0);

        if (!node.blindData.overwrite.expires) {
            node.debug(`expireNever expire=${expire}` + (typeof expire) + ' - isNaN=' + isNaN(expire) + ' - finite=' + !isFinite(expire) + ' - min=' + (expire < 100));
            delete node.blindData.overwrite.expireTs;
            delete node.blindData.overwrite.expireDate;
            return;
        }
        node.blindData.overwrite.expireTs = (now.getTime() + expire);
        node.blindData.overwrite.expireDate = new Date(node.blindData.overwrite.expireTs);
        node.debug(`expires in ${expire}ms = ${node.blindData.overwrite.expireDate}`);
        node.timeOutObj = setTimeout(() => {
            node.debug('timeout - overwrite expired');
            blindPosOverwriteReset(node);
            node.emit('input', { payload: -1, topic: 'internal-trigger-overwriteExpired', force: false });
        }, expire);
    }

    /**
     * setting the reason for override
     * @param {*} node node data
     */
    function setOverwriteReason(node) {
        if (node.blindData.overwrite.expireTs) {
            node.reason.code = 3;
            node.reason.state = RED._('blind-control.states.overwriteExpire', {
                prio: node.blindData.overwrite.priority,
                time: node.blindData.overwrite.expireDate.toLocaleTimeString()
            });
            node.reason.description = RED._('blind-control.reasons.overwriteExpire', {
                prio: node.blindData.overwrite.priority,
                time: node.blindData.overwrite.expireDate.toISOString()
            });
        } else {
            node.reason.code = 2;
            node.reason.state = RED._('blind-control.states.overwriteNoExpire', { prio: node.blindData.overwrite.priority });
            node.reason.description = RED._('blind-control.states.overwriteNoExpire', { prio: node.blindData.overwrite.priority });
        }
        node.debug(`overwrite exit true node.blindData.overwrite.active=${node.blindData.overwrite.active}`);
    }

    /**
     * check if a manual overwrite of the blind level should be set
     * @param {*} node node data
     * @param {*} msg message object
     * @returns true if override is active, otherwhise false
     */
    function checkBlindPosOverwrite(node, msg, now) {
        // node.debug(`checkBlindPosOverwrite act=${node.blindData.overwrite.active}`);
        hlp.getMsgBoolValue(msg, 'reset', 'resetOverwrite',
            (val) => {
                if (val) {
                    blindPosOverwriteReset(node);
                }
            });

        const prio = hlp.getMsgNumberValue(msg, ['prio', 'priority'], ['prio', 'alarm'], undefined, 0);

        if (node.blindData.overwrite.active && (node.blindData.overwrite.priority > 0) && (node.blindData.overwrite.priority > prio)) {
            setOverwriteReason(node);
            node.debug(`overwrite exit true node.blindData.overwrite.active=${node.blindData.overwrite.active}, prio=${prio}, node.blindData.overwrite.priority=${node.blindData.overwrite.priority}`);
            // if active, the prio must be 0 or given with same or higher as current overwrite otherwise this will not work
            return true;
        }
        const newPos = hlp.getMsgNumberValue(msg, ['blindPosition', 'position', 'level', 'blindLevel'], ['manual', 'levelOverwrite']);
        const expire = hlp.getMsgNumberValue(msg, 'expire', 'expire');
        if (node.blindData.overwrite.active && isNaN(newPos)) {
            node.debug(`overwrite active, check of prio=${prio} or expire=${expire}, newPos=${newPos}`);
            if (Number.isFinite(expire)) {
                // set to new expiring time
                setExpiringOverwrite(node, now, expire);
            }
            if (prio > 0) {
                // set to new priority
                node.blindData.overwrite.priority = prio;
            }
            setOverwriteReason(node);
            node.debug(`overwrite exit true node.blindData.overwrite.active=${node.blindData.overwrite.active}, newPos=${newPos}, expire=${expire}`);
            return true;
        } else if (!isNaN(newPos)) {
            node.debug(`needOverwrite prio=${prio} expire=${expire} newPos=${newPos}`);
            if (newPos === -1) {
                node.blindData.level = NaN;
            } else if (!isNaN(newPos)) {
                if (!validPosition_(node, newPos)) {
                    node.error(RED._('blind-control.errors.invalid-blind-level', { pos: newPos }));
                    return false;
                }
                node.debug(`overwrite newPos=${newPos}`);
                const noSameValue = hlp.getMsgBoolValue(msg, 'ignoreSameValue');
                if (noSameValue && (node.previousData.level === newPos)) {
                    setOverwriteReason(node);
                    node.debug(`overwrite exit true noSameValue=${noSameValue}, newPos=${newPos}`);
                    return true;
                }
                node.blindData.level = newPos;
            }

            if (Number.isFinite(expire) || (prio <= 0)) {
                // will set expiring if prio is 0 or if expire is explizit defined
                setExpiringOverwrite(node, now, expire);
            } else if ((prio > node.blindData.overwrite.priority) || (!node.blindData.overwrite.expireTs)) {
                // no expiring on prio change or no existing expiring
                setExpiringOverwrite(node, now, -1);
            }
            if (prio > 0) {
                node.blindData.overwrite.priority = prio;
            }
            node.blindData.overwrite.active = true;
        }
        if (node.blindData.overwrite.active) {
            setOverwriteReason(node);
            node.debug(`overwrite exit true node.blindData.overwrite.active=${node.blindData.overwrite.active}`);
            return true;
        }
        node.debug(`overwrite exit false node.blindData.overwrite.active=${node.blindData.overwrite.active}`);
        return false;
    }

    /******************************************************************************************/
    /**
     * calculates for the blind the new level
     * @param {*} node the node data
     * @param {*} msg the message object
     * @returns the sun position object
     */
    function calcBlindSunPosition(node, msg, now) {
        // node.debug('calcBlindSunPosition: calculate blind position by sun');
        // sun control is active
        const sunPosition = getSunPosition_(node, now);
        // to be able to store values
        checkWeather(node, msg);

        if (!sunPosition.InWindow) {
            node.reason.code = 8;
            node.reason.state = RED._('blind-control.states.sunNotInWin');
            node.reason.description = RED._('blind-control.reasons.sunNotInWin');
            return sunPosition;
        }

        if (node.sunData.minAltitude && (sunPosition.altitudeDegrees < node.sunData.minAltitude)) {
            node.reason.code = 7;
            node.reason.state = RED._('blind-control.states.sunMinAltitude');
            node.reason.description = RED._('blind-control.reasons.sunMinAltitude');
            return sunPosition;
        }
        // set default values:
        if (node.cloudData.isOperative) {
            node.blindData.level = node.cloudData.blindPos;
            node.reason.code = 10;
            node.reason.state = RED._('blind-control.states.cloudExceeded');
            node.reason.description = RED._('blind-control.reasons.cloudExceeded');
            return sunPosition;
        }

        // node.debug('node.windowSettings: ' + util.inspect(node.windowSettings, Object.getOwnPropertyNames(node.windowSettings)));
        const height = Math.tan(sunPosition.altitudeRadians) * node.sunData.floorLength;
        // node.debug(`height=${height} - altitude=${sunPosition.altitudeRadians} - floorLength=${node.sunData.floorLength}`);
        if (height <= node.windowSettings.bottom) {
            node.blindData.level = node.blindData.levelClosed;
        } else if (height >= node.windowSettings.top) {
            node.blindData.level = node.blindData.levelOpen;
        } else {
            node.blindData.level = posPrcToAbs_(node, (height - node.windowSettings.bottom) / (node.windowSettings.top - node.windowSettings.bottom));
        }
        if ((node.smoothTime > 0) && (node.sunData.changeAgain > now.getTime())) {
            // node.debug(`no change smooth - smoothTime= ${node.smoothTime}  changeAgain= ${node.sunData.changeAgain}`);
            node.reason.code = 11;
            node.reason.state = RED._('blind-control.states.smooth', { pos: node.blindData.level.toString()});
            node.reason.description = RED._('blind-control.reasons.smooth', { pos: node.blindData.level.toString()});
            node.blindData.level = node.previousData.level;
        } else {
            node.reason.code = 9;
            node.reason.state = RED._('blind-control.states.sunCtrl');
            node.reason.description = RED._('blind-control.reasons.sunCtrl');
            node.sunData.changeAgain = now.getTime() + node.smoothTime;
            // node.debug(`set next time - smoothTime= ${node.smoothTime}  changeAgain= ${node.sunData.changeAgain} now=` + now.getTime());
        }
        if (node.blindData.level < node.blindData.levelMin)  {
            // min
            // node.debug(`${node.blindData.level} is below ${node.blindData.levelMin} (min)`);
            node.reason.code = 5;
            node.reason.state = RED._('blind-control.states.sunCtrlMin', {org: node.reason.state});
            node.reason.description = RED._('blind-control.reasons.sunCtrlMin', {org: node.reason.description, level:node.blindData.level});
            node.blindData.level = node.blindData.levelMin;
        } else if (node.blindData.level > node.blindData.levelMax) {
            // max
            // node.debug(`${node.blindData.level} is above ${node.blindData.levelMax} (max)`);
            node.reason.code = 6;
            node.reason.state = RED._('blind-control.states.sunCtrlMax', {org: node.reason.state});
            node.reason.description = RED._('blind-control.reasons.sunCtrlMax', {org: node.reason.description, level:node.blindData.level});
            node.blindData.level = node.blindData.levelMax;
        }
        // node.debug(`calcBlindSunPosition end pos=${node.blindData.level} reason=${node.reason.code} description=${node.reason.description}`);
        return sunPosition;
    }
    /******************************************************************************************/
    /**
       * calculates the times
       * @param {*} node node data
       * @param {*} msg the message object
       * @param {*} config the configuration object
       * @returns the active rule or null
       */
    function checkRules(node, msg, now) {
        const livingRuleData = {};
        const nowNr = hlp.getTimeNumber(now);
        // node.debug(`checkRules nowNr=${nowNr}, node.rulesCount=${node.rulesCount}`); // {colors:true, compact:10}
        const fkt = (rule, cmp) => {
            // node.debug('rule ' + util.inspect(rule, {colors:true, compact:10}));
            if (rule.conditional) {
                try {
                    if (!node.positionConfig.comparePropValue(node, msg, rule.validOperandAType, rule.validOperandAValue, rule.validOperator, rule.validOperandBType, rule.validOperandBValue, rule.temp)) {
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
            rule.switchTime = node.positionConfig.getTimeProp(node, msg, rule.timeType, rule.timeValue, rule.offsetValue, rule.offsetType, rule.multiplier);
            if (rule.switchTime.error) {
                hlp.handleError(node, RED._('blind-control.errors.error-time', { message: rule.switchTime.error }), undefined, rule.switchTime.error);
                return null;
            } else if (!rule.switchTime.value) {
                throw new Error('Error can not calc time!');
            }
            rule.switchTime.num = hlp.getTimeNumber(rule.switchTime.value);

            if (cmp(rule.switchTime.num, nowNr)) {
                return rule;
            }
            return null;
        };

        let ruleSel = null;
        // node.debug('first loop ' + node.rulesCount);
        for (let i = 0; i < node.rulesCount; ++i) {
            const rule = node.rulesData[i];
            // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== 1) + ' - ' + util.inspect(rule, {colors:true, compact:10}));
            if (rule.timeOp !== 0) { continue; }
            const res = fkt(rule, (r,h) => (r >= h));
            if (res) {
                ruleSel = res;
                break;
            }
        }
        if (!ruleSel || ruleSel.timeLimited) {
            // node.debug('second loop ' + node.rulesCount);
            for (let i = (node.rulesCount -1); i >= 0; --i) {
                const rule = node.rulesData[i];
                // node.debug('rule ' + rule.timeOp + ' - ' + (rule.timeOp !== 1) + ' - ' + util.inspect(rule, {colors:true, compact:10}));
                if (rule.timeOp === 0) { continue; }
                const res = fkt(rule, (r,h) => (r <= h));
                if (res) {
                    ruleSel = res;
                    break;
                }
            }
        }

        if (ruleSel) {
            // node.debug('ruleSel ' + util.inspect(ruleSel, {colors:true, compact:10}));
            if (ruleSel.timeLimited) {
                ruleSel.text = ruleSel.timeOpText + ' ' + ruleSel.switchTime.value.toLocaleTimeString();
            }
            if (ruleSel.conditional) {
                ruleSel.text += '*';
            }
            livingRuleData.id = ruleSel.pos;
            livingRuleData.active = true;
            livingRuleData.level = getBlindPosFromTI(node, msg, ruleSel.levelType, ruleSel.levelValue, node.blindData.levelDefault);
            livingRuleData.conditional = ruleSel.conditional;
            livingRuleData.timeLimited = ruleSel.timeLimited;
            node.blindData.level = livingRuleData.level;
            node.reason.code = 4;
            node.reason.state= RED._('blind-control.states.time', ruleSel);
            node.reason.description = RED._('blind-control.reasons.time', ruleSel);
            // node.debug('checkRules end: livingRuleData=' + util.inspect(livingRuleData,{colors:true, compact:10}));
            return livingRuleData;
        }
        livingRuleData.active = false;
        livingRuleData.id = -1;
        node.blindData.level = node.blindData.levelDefault;
        node.reason.code = 1;
        node.reason.state = RED._('blind-control.states.default');
        node.reason.description = RED._('blind-control.reasons.default');
        // node.debug('checkRules end default: livingRuleData=' + util.inspect(livingRuleData, {colors:true, compact:10}));
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
        this.smoothTime = (parseFloat(config.smoothTime) || 0);
        const node = this;
        if (node.smoothTime >= 0x7FFFFFFF) {
            node.error(RED._('blind-control.errors.smoothTimeToolong', this));
            delete node.smoothTime;
        }

        node.reason = {
            code : 0,
            state: '',
            description: ''
        };
        // Retrieve the config node
        node.sunData = {
            /** Defines if the sun control is active or not */
            active: hlp.chkValueFilled(config.sunControlActive,true),
            /** define how long could be the sun on the floor **/
            floorLength: Number(hlp.chkValueFilled(config.sunFloorLength,0)),
            /** minimum altitude of the sun */
            minAltitude: Number(hlp.chkValueFilled(config.sunMinAltitude, 0)),
            changeAgain: 0
        };
        node.windowSettings = {
            /** The top of the window */
            top: Number(config.windowTop),
            /** The bottom of the window */
            bottom: Number(config.windowBottom),
            /** the orientation angle to the geographical north */
            AzimuthStart: angleNorm_(Number(hlp.chkValueFilled(config.windowAzimuthStart, 0))),
            /** an offset for the angle clockwise offset */
            AzimuthEnd: angleNorm_(Number(hlp.chkValueFilled(config.windowAzimuthEnd, 0)))
        };
        node.blindData = {
            /** The Level of the window */
            level: NaN, // unknown
            /** The override settings */
            overwrite: {
                active: false,
                expireDuration: parseFloat(hlp.chkValueFilled(config.overwriteExpire, NaN)),
                priority: 0
            },
            increment: Number(hlp.chkValueFilled(config.blindIncrement,1)),
            levelOpen: Number(hlp.chkValueFilled(config.blindOpenPos, 100)),
            levelClosed: Number(hlp.chkValueFilled(config.blindClosedPos, 0))
        };
        node.blindData.levelDefault = getBlindPosFromTI(node, undefined, config.blindPosDefaultType, config.blindPosDefault, node.blindData.levelOpen);
        node.blindData.levelMin = getBlindPosFromTI(node, undefined, config.blindPosMinType, config.blindPosMin, node.blindData.levelClosed);
        node.blindData.levelMax = getBlindPosFromTI(node, undefined, config.blindPosMaxType, config.blindPosMax, node.blindData.levelOpen);
        node.cloudData = {
            active: (typeof config.cloudValueType !== 'undefined') && (config.cloudValueType !== 'none'),
            value: config.cloudValue || '',
            valueType: config.cloudValueType || 'none',
            operator: config.cloudCompare,
            thresholdValue: config.cloudThreshold,
            thresholdType: config.cloudThresholdType,
            blindPos: getBlindPosFromTI(node, undefined, config.cloudBlindPosType, config.cloudBlindPos, node.blindData.levelOpen),
            isOperative: false,
            temp: {}
        };
        node.rulesData = config.rules || [];
        node.previousData = {
            level: NaN,
            reasonCode: -1,
            usedRule: NaN
        };

        /**
         * set the state of the node
         */
        function setState() {
            let code = node.reason.code;
            let shape = 'ring';
            let fill = 'yellow';
            if (code === 10) { // smooth;
                code = node.previousData.reasonCode;
            }

            if (node.blindData.level === node.blindData.levelOpen) {
                shape = 'dot';
            }

            if (code <= 3) {
                fill = 'blue'; // override
            } else if (code === 4) {
                fill = 'grey'; // rule
            } else if (code === 1 || code === 8) {
                fill = 'green'; // not in window or cloudExceeded
            }

            node.status({
                fill: fill,
                shape: shape,
                text: (isNaN(node.blindData.level)) ? node.reason.state : node.blindData.level.toString() + ' - ' + node.reason.state
            });
        }

        /**
         * handles the input of a message object to the node
         */
        this.on('input', function (msg) {
            try {
                node.debug(`input msg.topic=${msg.topic} msg.payload=${msg.payload}`);
                // node.debug('input ' + util.inspect(msg, {colors:true, compact:10})); // Object.getOwnPropertyNames(msg)
                if (!this.positionConfig) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'));
                    node.status({
                        fill: 'red',
                        shape: 'dot',
                        text: 'Node not properly configured!!'
                    });
                    return null;
                }
                msg.blindCtrl = {
                    reason : node.reason,
                    blind: node.blindData
                };

                node.previousData.level = node.blindData.level;
                node.previousData.reasonCode= node.reason.code;
                node.previousData.reasonState= node.reason.state;
                node.previousData.reasonDescription= node.reason.description;
                node.reason.code = NaN;
                const now = getNow_(node, msg, config.tsCompare);
                // check if the message contains any weather data
                let ruleId = NaN;

                // node.debug(`start pos=${node.blindData.level} manual=${node.blindData.overwrite.active} reasoncode=${node.reason.code} description=${node.reason.description}`);
                // check for manual overwrite
                if (!checkBlindPosOverwrite(node, msg, now)) {
                    // calc times:
                    msg.blindCtrl.rule = checkRules(node, msg, now);
                    ruleId = msg.blindCtrl.rule.id;
                    if (!msg.blindCtrl.rule.active && node.sunData.active) {
                        // calc sun position:
                        msg.blindCtrl.sunPosition = calcBlindSunPosition(node, msg, now);
                        if (node.cloudData.active) {
                            msg.blindCtrl.cloud = node.cloudData;
                        }
                    }
                    if (node.blindData.level < node.blindData.levelClosed) {
                        node.debug(`${node.blindData.level} is below ${node.blindData.levelClosed}`);
                        node.blindData.level = node.blindData.levelClosed;
                    }
                    if (node.blindData.level > node.blindData.levelOpen) {
                        node.debug(`${node.blindData.level} is above ${node.blindData.levelClosed}`);
                        node.blindData.level = node.blindData.levelOpen;
                    }
                }
                node.debug(`result pos=${node.blindData.level} manual=${node.blindData.overwrite.active} reasoncode=${node.reason.code} description=${node.reason.description}`);
                setState();

                const forceOutput = hlp.getMsgBoolValue(msg, 'forceOut', 'forceOut');

                if (forceOutput ||
                    ((!isNaN(node.blindData.level)) &&
                    (node.blindData.level !== node.previousData.level ||
                    node.reason.code !== node.previousData.reasonCode ||
                    ruleId !== node.previousData.usedRule))) {
                    msg.payload = node.blindData.level;
                    // msg.blindCtrl.blind = node.blindData;
                    if (config.topic) {
                        const topicAttrs = {
                            name: node.name,
                            level: node.blindData.level,
                            code: node.reason.code,
                            rule: ruleId
                        };
                        msg.topic = hlp.topicReplace(config.topic, topicAttrs);
                    }
                    node.send(msg);
                }
                node.previousData.usedRule = ruleId;
                return null;
            } catch (err) {
                node.error(RED._('blind-control.errors.internal', err));
                node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'internal error'
                });
            }
        });
        // ####################################################################################################
        /**
         * initializes the node
         */
        function initialize() {
            node.debug('initialize');
            node.rulesCount = node.rulesData.length;
            for (let i = 0; i < node.rulesCount; ++i) {
                const rule = node.rulesData[i];
                rule.timeOp = Number(rule.timeOp);
                rule.pos = i + 1;
                rule.conditional = (rule.validOperandAType !== 'none');
                rule.timeLimited = (rule.timeType !== 'none');
                rule.temp = {};
            }
        }
        initialize();
    }

    RED.nodes.registerType('blind-control', sunBlindControlNode);
};