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
function validPosition_(node, level, allowRound) {
    // node.debug('validPosition_ level='+level);
    if (level === '' || level === null || typeof level === 'undefined') {
        node.warn(`Position is empty!`);
        return false;
    }
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
    if (allowRound) {
        return true;
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
    const dto = new Date(msg.ts);
    if (dto !== 'Invalid Date' && !isNaN(dto)) {
        return dto;
    }
    node.error('Error can not get a valide timestamp from "' + value + '"! Will use current timestamp!');
    return new Date();
}

/******************************************************************************************/
/**
 * get the absolute level from percentage level
 * @param {*} node the node settings
 * @param {*} percentPos the level in percentage (0-1)
 */
function posPrcToAbs_(node, levelPercent) {
    return posRound_(node, ((node.blindData.levelOpen - node.blindData.levelClosed) * levelPercent) + node.blindData.levelClosed);
}
/**
 * get the percentage level from absolute level  (0-1)
 * @param {*} node the node settings
 * @param {*} levelAbsolute the level absolute
 */
function posAbsToPrc_(node, levelAbsolute) {
    return (levelAbsolute - node.blindData.levelClosed) / (node.blindData.levelOpen - node.blindData.levelClosed);
}

/**
 * get the absolute inverse level
 * @param {*} node the node settings
 * @param {*} levelAbsolute the level absolute
 */
function getInversePos_(node, levelAbsolute) {
    return posPrcToAbs_(node, 1 - posAbsToPrc_(node, levelAbsolute));
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

    function evalTempData(node, type, value, data) {
        // node.debug(`evalTempData type=${type} value=${value} data=${data}`);
        if (data === null || typeof data === 'undefined') {
            const name = type + '.' + value;
            if (typeof node.tempData[name] !== 'undefined') {
                node.log(RED._('blind-control.errors.usingTempValue', { type: type, value: value, usedValue: node.tempData[name] }));
                return node.tempData[name];
            }
            if (node.nowarn[name]) {
                return null; // only one error per run
            }
            node.warn(RED._('blind-control.errors.notEvaluableProperty', { type: type, value: value, usedValue: 'null' }));
            node.nowarn[name] = true;
            return null;
        }
        node.tempData[type + '.' + value] = data;
        return data;
    }

    /******************************************************************************************/
    /**
     * check the oversteering data
     * @param {*} node node data
     * @param {*} msg the message object
     */
    function checkOversteer(node, msg) {
        // node.debug('checkOversteer');
        try {
            node.oversteerData.isChecked = true;
            return node.positionConfig.comparePropValue(node, msg,
                node.oversteerData.valueType,
                node.oversteerData.value,
                node.oversteerData.operator,
                node.oversteerData.thresholdType,
                node.oversteerData.thresholdValue,
                (type, value, data, _id) => { // opCallback
                    return evalTempData(node, type, value, data);
                });
        } catch (err) {
            node.error(RED._('blind-control.errors.getOversteerData', err));
            node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
        }
        // node.debug('node.oversteerData=' + util.inspect(node.oversteerData));
        return false;
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
            delete node.blindData.overwrite.expireDateISO;
            delete node.blindData.overwrite.expireDateUTC;
            delete node.blindData.overwrite.expireTimeLocal;
            delete node.blindData.overwrite.expireDateLocal;
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
        node.blindData.overwrite.expireDateISO = node.blindData.overwrite.expireDate.toISOString();
        node.blindData.overwrite.expireDateUTC = node.blindData.overwrite.expireDate.toUTCString();
        node.blindData.overwrite.expireDateLocal = node.positionConfig.toDateString(node.blindData.overwrite.expireDate);
        node.blindData.overwrite.expireTimeLocal = node.positionConfig.toTimeString(node.blindData.overwrite.expireDate);

        node.debug(`expires in ${expire}ms = ${node.blindData.overwrite.expireDate}`);
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
        if (node.blindData.overwrite &&
            node.blindData.overwrite.expires &&
            (node.blindData.overwrite.expireTs < now.getTime())) {
            blindPosOverwriteReset(node);
        }
        if ((!prio) || (node.blindData.overwrite.priority <= prio)) {
            hlp.getMsgBoolValue(msg, 'reset', 'resetOverwrite',
                (val) => {
                    node.debug('reset val="' + util.inspect(val, { colors: true, compact: 10 }) + '"');
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
        if (node.blindData.overwrite.expireTs) {
            node.reason.code = 3;
            const obj = {
                prio: node.blindData.overwrite.priority,
                timeLocal: node.blindData.overwrite.expireTimeLocal,
                dateLocal: node.blindData.overwrite.expireDateLocal,
                dateISO: node.blindData.overwrite.expireDateISO,
                dateUTC: node.blindData.overwrite.expireDateUTC
            };
            node.reason.state = RED._('blind-control.states.overwriteExpire', obj);
            node.reason.description = RED._('blind-control.reasons.overwriteExpire', obj);
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
     * @returns true if override is active, otherwise false
     */
    function checkBlindPosOverwrite(node, msg, now) {
        node.debug(`checkBlindPosOverwrite act=${node.blindData.overwrite.active} `);
        const prio = hlp.getMsgNumberValue(msg, ['prio', 'priority'], ['prio', 'alarm'], (p) => {
            checkOverrideReset(node, msg, now, p);
            return p;
        }, () => {
            checkOverrideReset(node, msg, now);
            return 0;
        });
        if (node.blindData.overwrite.active && (node.blindData.overwrite.priority > 0) && (node.blindData.overwrite.priority > prio)) {
            setOverwriteReason(node);
            node.debug(`overwrite exit true node.blindData.overwrite.active=${node.blindData.overwrite.active}, prio=${prio}, node.blindData.overwrite.priority=${node.blindData.overwrite.priority}`);
            // if active, the prio must be 0 or given with same or higher as current overwrite otherwise this will not work
            return true;
        }
        let newPos = hlp.getMsgNumberValue(msg, ['blindPosition', 'position', 'level', 'blindLevel'], ['manual', 'levelOverwrite']);
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
                node.blindData.levelInverse = NaN;
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
                node.blindData.level = newPos;
                node.blindData.levelInverse = newPos;
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

        if (!sunPosition.InWindow) {
            if (node.sunData.mode === 1) {
                node.blindData.level = node.blindData.levelMin;
                node.blindData.levelInverse = node.blindData.levelMax;
                node.reason.code = 13;
                node.reason.state = RED._('blind-control.states.sunNotInWinMin');
                node.reason.description = RED._('blind-control.reasons.sunNotInWin');
            } else {
                node.reason.code = 8;
                node.reason.state = RED._('blind-control.states.sunNotInWin');
                node.reason.description = RED._('blind-control.reasons.sunNotInWin');
            }
            return sunPosition;
        }

        if ((node.sunData.mode === 2) && node.sunData.minAltitude && (sunPosition.altitudeDegrees < node.sunData.minAltitude)) {
            node.reason.code = 7;
            node.reason.state = RED._('blind-control.states.sunMinAltitude');
            node.reason.description = RED._('blind-control.reasons.sunMinAltitude');
            return sunPosition;
        }

        if (node.oversteerData.active && checkOversteer(node, msg)) {
            node.blindData.level = node.oversteerData.blindPos;
            node.reason.code = 10;
            node.reason.state = RED._('blind-control.states.oversteer');
            node.reason.description = RED._('blind-control.reasons.oversteer');
            sunPosition.oversteer = node.oversteerData;
            return sunPosition;
        }
        sunPosition.oversteer = node.oversteerData;

        if (node.sunData.mode === 1) {
            node.blindData.level = node.blindData.levelMax;
            node.blindData.levelInverse = node.blindData.levelMin;
            node.reason.code = 12;
            node.reason.state = RED._('blind-control.states.sunInWinMax');
            node.reason.description = RED._('blind-control.reasons.sunInWinMax');
            return sunPosition;
        }

        // node.debug('node.windowSettings: ' + util.inspect(node.windowSettings, Object.getOwnPropertyNames(node.windowSettings)));
        const height = Math.tan(sunPosition.altitudeRadians) * node.sunData.floorLength;
        // node.debug(`height=${height} - altitude=${sunPosition.altitudeRadians} - floorLength=${node.sunData.floorLength}`);
        if (height <= node.windowSettings.bottom) {
            node.blindData.level = node.blindData.levelClosed;
            node.blindData.levelInverse = node.blindData.levelOpen;
        } else if (height >= node.windowSettings.top) {
            node.blindData.level = node.blindData.levelOpen;
            node.blindData.levelInverse = node.blindData.levelClosed;
        } else {
            node.blindData.level = posPrcToAbs_(node, (height - node.windowSettings.bottom) / (node.windowSettings.top - node.windowSettings.bottom));
            node.blindData.levelInverse = getInversePos_(node, node.blindData.level);
        }
        if ((node.smoothTime > 0) && (node.sunData.changeAgain > now.getTime())) {
            node.debug(`no change smooth - smoothTime= ${node.smoothTime}  changeAgain= ${node.sunData.changeAgain}`);
            node.reason.code = 11;
            node.reason.state = RED._('blind-control.states.smooth', { pos: node.blindData.level.toString()});
            node.reason.description = RED._('blind-control.reasons.smooth', { pos: node.blindData.level.toString()});
            node.blindData.level = node.previousData.level;
            node.blindData.levelInverse = node.previousData.levelInverse;
        } else {
            node.reason.code = 9;
            node.reason.state = RED._('blind-control.states.sunCtrl');
            node.reason.description = RED._('blind-control.reasons.sunCtrl');
            node.sunData.changeAgain = now.getTime() + node.smoothTime;
            // node.debug(`set next time - smoothTime= ${node.smoothTime}  changeAgain= ${node.sunData.changeAgain} now=` + now.getTime());
        }
        if (node.blindData.level < node.blindData.levelMin)  {
            // min
            node.debug(`${node.blindData.level} is below ${node.blindData.levelMin} (min)`);
            node.reason.code = 5;
            node.reason.state = RED._('blind-control.states.sunCtrlMin', {org: node.reason.state});
            node.reason.description = RED._('blind-control.reasons.sunCtrlMin', {org: node.reason.description, level:node.blindData.level});
            node.blindData.level = node.blindData.levelMin;
            node.blindData.levelInverse = node.blindData.levelMax;
        } else if (node.blindData.level > node.blindData.levelMax) {
            // max
            node.debug(`${node.blindData.level} is above ${node.blindData.levelMax} (max)`);
            node.reason.code = 6;
            node.reason.state = RED._('blind-control.states.sunCtrlMax', {org: node.reason.state});
            node.reason.description = RED._('blind-control.reasons.sunCtrlMax', {org: node.reason.description, level:node.blindData.level});
            node.blindData.level = node.blindData.levelMax;
            node.blindData.levelInverse = node.blindData.levelMin;
        }
        node.debug(`calcBlindSunPosition end pos=${node.blindData.level} reason=${node.reason.code} description=${node.reason.description}`);
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
        const nowNr = now.getTime();
        // node.debug(`checkRules nowNr=${nowNr}, node.rulesCount=${node.rulesCount}`); // {colors:true, compact:10}
        // pre-checking conditions to may be able to store temp data
        for (let i = 0; i < node.rulesCount; ++i) {
            const rule = node.rulesData[i];
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
            rule.timeData = node.positionConfig.getTimeProp(node, msg, rule.timeType, rule.timeValue, rule.offsetType, rule.offsetValue, rule.multiplier);
            if (rule.timeData.error) {
                hlp.handleError(node, RED._('blind-control.errors.error-time', { message: rule.timeData.error }), undefined, rule.timeData.error);
                return null;
            } else if (!rule.timeData.value) {
                throw new Error('Error can not calc time!');
            }
            rule.timeData.num = rule.timeData.value.getTime();
            node.debug('rule.timeData=' + util.inspect(rule.timeData));
            if (cmp(rule.timeData.num, nowNr)) {
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
            ruleSel.text = '';
            // node.debug('ruleSel ' + util.inspect(ruleSel, {colors:true, compact:10}));
            livingRuleData.id = ruleSel.pos;
            livingRuleData.active = true;
            livingRuleData.level = getBlindPosFromTI(node, msg, ruleSel.levelType, ruleSel.levelValue, node.blindData.levelDefault);
            livingRuleData.conditional = ruleSel.conditional;
            livingRuleData.timeLimited = ruleSel.timeLimited;
            node.blindData.level = livingRuleData.level;
            node.blindData.levelInverse = getInversePos_(node, livingRuleData.level);
            node.reason.code = 4;
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
            // node.debug('checkRules end: livingRuleData=' + util.inspect(livingRuleData,{colors:true, compact:10}));
            node.debug(`checkRules end pos=${node.blindData.level} reason=${node.reason.code} description=${node.reason.description}`);
            return livingRuleData;
        }
        livingRuleData.active = false;
        livingRuleData.id = -1;
        node.blindData.level = node.blindData.levelDefault;
        node.blindData.levelInverse = getInversePos_(node, node.blindData.levelDefault);
        node.reason.code = 1;
        node.reason.state = RED._('blind-control.states.default');
        node.reason.description = RED._('blind-control.reasons.default');
        // node.debug('checkRules end default: livingRuleData=' + util.inspect(livingRuleData, {colors:true, compact:10}));
        node.debug(`checkRules end pos=${node.blindData.level} reason=${node.reason.code} description=${node.reason.description}`);
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
        this.smoothTime = (parseFloat(config.smoothTime) || 0);
        const node = this;

        if (node.smoothTime >= 0x7FFFFFFF) {
            node.error(RED._('blind-control.errors.smoothTimeToolong', this));
            delete node.smoothTime;
        }
        node.nowarn = {};
        node.reason = {
            code : 0,
            state: '',
            description: ''
        };
        // temporary node Data
        node.tempData = {};
        // Retrieve the config node
        node.sunData = {
            /** Defines if the sun control is active or not */
            active: false,
            mode: Number(hlp.chkValueFilled(config.sunControlMode, 0)),
            /** define how long could be the sun on the floor **/
            floorLength: Number(hlp.chkValueFilled(config.sunFloorLength,0)),
            /** minimum altitude of the sun */
            minAltitude: Number(hlp.chkValueFilled(config.sunMinAltitude, 0)),
            changeAgain: 0
        };
        node.sunData.active = node.sunData.mode > 0;
        node.sunData.modeMax = node.sunData.mode;
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
            levelInverse: NaN,
            levelOpen: Number(hlp.chkValueFilled(config.blindOpenPos, 100)),
            levelClosed: Number(hlp.chkValueFilled(config.blindClosedPos, 0)),
            increment: Number(hlp.chkValueFilled(config.blindIncrement, 1)),
            levelDefault: NaN,
            levelMin: NaN,
            levelMax: NaN,
            /** The override settings */
            overwrite: {
                active: false,
                expireDuration: parseFloat(hlp.chkValueFilled(config.overwriteExpire, NaN)),
                priority: 0
            }
        };
        node.blindData.levelDefault = getBlindPosFromTI(node, undefined, config.blindPosDefaultType, config.blindPosDefault, node.blindData.levelOpen);
        node.blindData.levelMin = getBlindPosFromTI(node, undefined, config.blindPosMinType, config.blindPosMin, node.blindData.levelClosed);
        node.blindData.levelMax = getBlindPosFromTI(node, undefined, config.blindPosMaxType, config.blindPosMax, node.blindData.levelOpen);
        node.oversteerData = {
            active: (typeof config.oversteerValueType !== 'undefined') && (config.oversteerValueType !== 'none'),
            isChecked: false
        };
        if (node.oversteerData.active) {
            node.oversteerData.value = config.oversteerValue || '';
            node.oversteerData.valueType = config.oversteerValueType || 'none';
            node.oversteerData.operator = config.oversteerCompare;
            node.oversteerData.thresholdValue = config.oversteerThreshold || '';
            node.oversteerData.thresholdType = config.oversteerThresholdType;
            node.oversteerData.blindPos = getBlindPosFromTI(node, undefined, config.oversteerBlindPosType, config.oversteerBlindPos, node.blindData.levelOpen);
        }

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
                fill = 'green'; // not in window or oversteerExceeded
            }
            node.reason.stateComplete = (isNaN(node.blindData.level)) ? node.reason.state : node.blindData.level.toString() + ' - ' + node.reason.state;
            node.status({
                fill: fill,
                shape: shape,
                text: node.reason.stateComplete
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
                node.nowarn = {};
                const blindCtrl = {
                    reason : node.reason,
                    blind: node.blindData
                };

                node.previousData.level = node.blindData.level;
                node.previousData.levelInverse = node.blindData.levelInverse;
                node.previousData.reasonCode= node.reason.code;
                node.previousData.reasonState= node.reason.state;
                node.previousData.reasonDescription= node.reason.description;
                node.oversteerData.isChecked = false;
                node.reason.code = NaN;
                const now = getNow_(node, msg);
                // check if the message contains any oversteering data
                let ruleId = NaN;

                const newMode = hlp.getMsgNumberValue(msg, ['mode'], ['setMode']);
                if (Number.isFinite(newMode) && newMode >= 0 && newMode <= node.sunData.modeMax) {
                    node.sunData.mode = newMode;
                }

                // node.debug(`start pos=${node.blindData.level} manual=${node.blindData.overwrite.active} reasoncode=${node.reason.code} description=${node.reason.description}`);
                // check for manual overwrite
                if (!checkBlindPosOverwrite(node, msg, now)) {
                    // calc times:
                    blindCtrl.rule = checkRules(node, msg, now);
                    ruleId = blindCtrl.rule.id;
                    if (!blindCtrl.rule.active && node.sunData.active) {
                        // calc sun position:
                        blindCtrl.sunPosition = calcBlindSunPosition(node, msg, now);
                    }
                    if (node.blindData.level < node.blindData.levelClosed) {
                        node.debug(`${node.blindData.level} is below ${node.blindData.levelClosed}`);
                        node.blindData.level = node.blindData.levelClosed;
                        node.blindData.levelInverse = node.blindData.levelOpen;
                    }
                    if (node.blindData.level > node.blindData.levelOpen) {
                        node.debug(`${node.blindData.level} is above ${node.blindData.levelClosed}`);
                        node.blindData.level = node.blindData.levelOpen;
                        node.blindData.levelInverse = node.blindData.levelClosed;
                    }
                }

                if (node.oversteerData.active && !node.oversteerData.isChecked) {
                    node.positionConfig.getPropValue(node, msg,
                        node.oversteerData.valueType,
                        node.oversteerData.value,
                        node.oversteerData.operator,
                        (type, value, data, _id) => {
                            if (data !== null && typeof data !== 'undefined') {
                                node.tempData[type + '.' + value] = data;
                            }
                        });
                }
                node.debug(`result pos=${node.blindData.level} manual=${node.blindData.overwrite.active} reasoncode=${node.reason.code} description=${node.reason.description}`);
                setState();

                let topic = config.topic;
                if (topic) {
                    const topicAttrs = {
                        name: node.name,
                        level: node.blindData.level,
                        levelInverse: node.blindData.levelInverse,
                        code: node.reason.code,
                        state: node.reason.state,
                        rule: ruleId,
                        mode: node.sunData.mode,
                        topic: msg.topic,
                        payload: msg.payload
                    };
                    topic = hlp.topicReplace(config.topic, topicAttrs);
                }
                if ((!isNaN(node.blindData.level)) &&
                    (node.blindData.level !== node.previousData.level ||
                    node.reason.code !== node.previousData.reasonCode ||
                    ruleId !== node.previousData.usedRule)) {
                    msg.payload = node.blindData.level;
                    if (node.outputs > 1) {
                        node.send([msg, { topic: topic, payload: blindCtrl}]);
                    } else {
                        msg.topic = topic || msg.topic;
                        msg.blindCtrl = blindCtrl;
                        node.send(msg, null);
                    }
                } else if (node.outputs > 1) {
                    node.send([null, { topic: topic, payload: blindCtrl}]);
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
            node.rulesTemp = [];
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
            for (let i = 0; i < node.rulesCount; ++i) {
                const rule = node.rulesData[i];
                rule.timeOp = Number(rule.timeOp);
                rule.pos = i + 1;
                rule.conditional = (rule.validOperandAType !== 'none');
                rule.timeLimited = (rule.timeType !== 'none');
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
            }
        }
        initialize();
    }

    RED.nodes.registerType('blind-control', sunBlindControlNode);
};