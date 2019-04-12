/********************************************
 * blind-control:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');

/*************************************************************************************************************************/
/**
 * check if a position has a valid value
 * @param {*} node the node data
 * @param {*} position the position to check
 * @returns {boolean} true if the position is valid, otherwise false
 */
function validPosition_(node, position) {
    node.debug('validPosition_ position='+position);
    if (isNaN(position)) {
        node.debug('Position: "' + position + '" is NaN!');
        return false;
    }
    if (position < node.blindData.closedPos) {
        node.debug('Position: "' + position + '" < ' + node.blindData.closedPos);
        return false;
    }
    if (node.blindData.position > node.blindData.openPos) {
        node.debug('Position: "' + position + '" > ' + node.blindData.openPos);
        return false;
    }
    if (Number.isInteger(node.blindData.openPos) &&
        Number.isInteger(node.blindData.closedPos) &&
        Number.isInteger(node.blindData.increment) &&
        ((position % node.blindData.increment !== 0) ||
        !Number.isInteger(position) )) {
        node.debug('Position invalid "' + position + '" > ' + node.blindData.openPos);
        return false;
    }
    return Number.isInteger(position / node.blindData.increment);
}
/******************************************************************************************/
/**
   * the definition of the time to compare
   * @param {*} compareType type to compare
   * @param {*} msg the message object
   * @param {*} node the current node object
   */
function getNow_(node, msg, compareType) {
    node.debug('getNow_');
    let id = '';
    let value = '';
    switch (compareType) {
        case '1':
            id = 'msg.ts';
            value = msg.ts;
            break;
        case '2':
            id = 'msg.lc';
            value = msg.lc;
            break;
        case '3':
            id = 'msg.time';
            value = msg.time;
            break;
        case '4':
            id = 'msg.value';
            value = msg.value;
            break;
        default:
            return new Date();
    }
    node.debug('compare time to ' + id + ' = "' + value + '"');
    const dto = new Date(msg.ts);
    if (dto !== 'Invalid Date' && !isNaN(dto)) {
        return dto;
    }
    node.error('Error can not get a valide timestamp from ' + id + '="' + value + '"! Will use current timestamp!');
    return new Date();
}

/******************************************************************************************/
/**
 * get the absolute position from percentage position
 * @param {*} node the node settings
 * @param {*} percentPos the level in percentage
 */
function posPrcToAbs_(node, levelPercent) {
    node.debug(`levelPrcToAbs_ ${levelPercent}`);
    return posRound_(node, ((node.blindData.openPos - node.blindData.closedPos) * levelPercent) + node.blindData.closedPos);
}
/**
 * round a position to the next increment
 * @param {*} node node data
 * @param {number} pos position
 * @return {number} rounded position number
 */
function posRound_(node, pos) {
    node.debug(`levelPrcToAbs_ ${pos} - increment is ${node.blindData.increment}`);
    /* if (Number.isInteger(node.blindData.increment)) {
        pos = Math.ceil(pos);
        pos = Math.ceil(pos / node.blindData.increment) * node.blindData.increment;
        return pos;
    } */
    pos = Math.ceil(pos / node.blindData.increment) * node.blindData.increment;
    pos = Number(pos.toFixed(hlp.countDecimals(node.blindData.increment)));
    node.debug(`levelPrcToAbs_ 2 ${pos}`);
    if (pos > node.blindData.openPos) {
        pos = node.blindData.openPos;
    }
    if (pos < node.blindData.closedPos) {
        pos = node.blindData.closedPos;
    }
    node.debug(`levelPrcToAbs_ result ${pos}`);
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
 * calculates the current sun position
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
    function checkWeather(node, msg) {
        node.debug('checkWeather');
        if (!node.cloudData.active) {
            return;
        }
        try {
            const val = node.positionConfig.getFloatProp(node, msg, node.cloudData.valueType, node.cloudData.value);
            if (val) {
                node.cloudData.actValue = val;
                node.cloudData.inLimit = (node.cloudData.threshold) ? val <= node.cloudData.threshold : true;
            }
        } catch (err) {
            node.error(RED._('blind-control.errors.getCloudData', err));
            node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
        }
        msg.cloud = node.cloudData;
        node.debug('node.cloudData=' + util.inspect(node.cloudData));
    }
    /******************************************************************************************/
    /**
     * get the blind position from a typed input
     * @param {*} node node data
     * @param {*} type type field
     * @param {*} value value field
     * @returns blind position as number or NaN if not defined
     */
    function getBlindPosFromTI(node, msg, type, value, def) {
        def = def || NaN;
        if (type === 'none' || type === '') {
            return def;
        }
        try {
            if (type === 'levelFixed') {
                if (value.includes('close')) {
                    return node.blindData.closedPos;
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
                    return node.blindData.openPos;
                }
                throw new Error('unknown value "'+ value + '" of type "' + type + '"' );
            }
            return node.positionConfig.getFloatProp(node, msg, type, value);
        } catch (err) {
            node.error(RED._('blind-control.errors.getBlindPosData', err));
            node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
        }
        return def;
    }
    /******************************************************************************************/

    function blindPosOverwriteReset(node) {
        node.debug(`blindPosOverwriteReset expire=${node.blindData.overwrite.expires}`);
        node.blindData.overwrite.active = false;
        if (node.blindData.overwrite.expires) {
            delete node.blindData.overwrite.expires;
            delete node.blindData.overwrite.expireNever;
            delete node.blindData.overwrite.expireDate;
        }
        if (node.timeOutObj) {
            node.debug('clearTimeout');
            clearTimeout(node.timeOutObj);
            node.timeOutObj = null;
        }
    }

    /**
     * check if a manual overwrite of the blind position should be set
     * @param {*} node node data
     * @param {*} msg message object
     */
    function checkBlindPosOverwrite(node, msg) {
        node.debug(`checkBlindPosOverwrite act=${node.blindData.overwrite.active}`);
        hlp.getMsgBoolValue(msg, 'reset', 'reset',
            (val) => {
                if (val) {
                    blindPosOverwriteReset(node);
                }
            });

        const nowTS = node.time.now.getTime();
        const prio = hlp.getMsgBoolValue(msg, ['prio', 'priority', 'alarm'], ['prio', 'alarm']);
        if (node.blindData.overwrite.active) {
            if (!prio && node.blindData.overwrite.expireNever) {
                return true;
            }
            if (!node.blindData.overwrite.expires || (node.blindData.overwrite.expires > nowTS)) {
                blindPosOverwriteReset(node);
            }
        }
        const newPos = hlp.getMsgNumberValue(msg, ['blindPosition', 'position'], ['manual', 'overwrite'], undefined, -1);
        let expire = hlp.getMsgNumberValue(msg, 'expire', 'expire', undefined, -10);
        if (prio || (newPos > -1) || (expire > -10)) {
            node.debug(`needOverwrite prio=${prio} expire=${expire} newPos=${newPos}`);
            if (newPos > -1) {
                if (!validPosition_(node, newPos)) {
                    node.error(RED._('invalid-blind-position', { pos: newPos }));
                    return false;
                }
                node.debug(`overwrite newPos=${newPos}`);
                node.blindData.position = newPos;
            }
            if (prio || (expire === 0) || (expire === -1)) {
                node.blindData.overwrite.expireNever = true;
                node.blindData.overwrite.active = true;
                node.reason.Code = 2;
                node.reason.State = RED._('blind-control.states.overwritePrio');
                node.reason.Description = RED._('blind-control.reasons.overwritePrio');
            } else {
                if (node.timeOutObj) {
                    blindPosOverwriteReset(node);
                }
                expire = (expire < 10) ? node.blindData.overwrite.expireDuration : expire;
                node.blindData.overwrite.active = true;
                node.blindData.overwrite.expires = (nowTS + expire);
                node.debug('expires in ' + expire + 'ms = ' + node.blindData.overwrite.expireDate);
                node.blindData.overwrite.expireDate = new Date(node.blindData.overwrite.expires);
                node.timeOutObj = setTimeout(() => {
                    node.debug('timeout overwrites expires');
                    blindPosOverwriteReset(node);
                    node.emit('input', {});
                }, expire);
                node.reason.Code = 3;
                node.reason.State = RED._('blind-control.states.overwrite', {
                    time: node.blindData.overwrite.expireDate.toLocaleTimeString()
                });
                node.reason.Description = RED._('blind-control.reasons.overwrite', {
                    time: node.blindData.overwrite.expireDate.toISOString()
                });
            }
            return true;
        }
        return false;
    }

    /******************************************************************************************/
    /**
     * calculates for the blind the new position
     * @param {*} node the node data
     * @param {*} msg the message object
     */
    function calcBlindPosition(node, msg) {
        node.debug('calcBlindPosition');
        if (node.time.operator === 0 || !node.sunData.active) {
            return;
        }
        // sun control is active
        const sunPosition = getSunPosition_(node, node.time.now);
        msg.sunPosition = sunPosition;
        if (!sunPosition.InWindow) {
            node.blindData.position = node.time.level;
            node.reason.Code = 6;
            node.reason.State = RED._('blind-control.states.sunNotInWin');
            node.reason.Description = RED._('blind-control.reasons.sunNotInWin');
            return;
        }
        checkWeather(node, msg);
        const previousLevel = node.blindData.position;

        if (node.cloudData.inLimit &&
                    (!node.sunData.minAltitude ||
                    (sunPosition.altitudeDegrees >= node.sunData.minAltitude))) {
            node.debug('node.windowSettings: ' + util.inspect(node.windowSettings, Object.getOwnPropertyNames(node.windowSettings)));
            const height = Math.tan(sunPosition.altitudeRadians) * node.sunData.floorLength;
            node.debug(`height=${height} - ${sunPosition.altitudeDegrees} - ${node.sunData.floorLength}` );
            if (height <= node.windowSettings.bottom) {
                node.debug('set to closed position ' + node.blindData.closedPos);
                node.blindData.position = node.blindData.closedPos;
            } else if (height >= node.windowSettings.top) {
                node.debug('set to closed position ' + node.blindData.openPos);
                node.blindData.position = node.blindData.openPos;
            } else {
                // node.blindData.position = roundPos_(node, 100 * (1 - (height - node.windowSettings.bottom) / (node.windowSettings.top - node.windowSettings.bottom)));
                node.blindData.position = posPrcToAbs_(node, (1 - (height - node.windowSettings.bottom) / (node.windowSettings.top - node.windowSettings.bottom)));
                node.debug('set to calced position ' + node.blindData.position);
            }
            if (node.hysteresis > 0 && node.blindData.nextchange > node.time.now.getTime() && node.blindData.position > previousLevel) {
                node.blindData.position = previousLevel;
                node.reason.Code = 10;
                node.reason.State = RED._('blind-control.states.hysteresis');
                node.reason.Description = RED._('blind-control.reasons.hysteresis');
            } else {
                node.reason.Code = 7;
                node.reason.State = RED._('blind-control.states.sunCtrl');
                node.reason.Description = RED._('blind-control.reasons.sunCtrl');
                node.blindData.nextchange = node.time.now.getTime() + node.hysteresis;
            }
        } else if (node.sunData.minAltitude && (sunPosition.altitudeDegrees < node.sunData.minAltitude)) {
            node.reason.Code = 5;
            node.reason.State = RED._('blind-control.states.sunMinAltitude');
            node.reason.Description = RED._('blind-control.reasons.sunMinAltitude');
        } else if (!node.cloudData.inLimit) {
            node.blindData.position = node.cloudData.blindPos;
            node.reason.Code = 8;
            node.reason.State = RED._('blind-control.states.cloudExceeded');
            node.reason.Description = RED._('blind-control.reasons.cloudExceeded');
        }
        node.debug(`calcBlindPosition end pos=${node.blindData.position} reason=${node.reason.Code} description=${node.reason.Description}`);
    }
    /******************************************************************************************/
    /**
       * calculates the times
       * @param {*} node node data
       * @param {*} msg the message object
       * @param {*} config the configuration object
       */
    function calcTimes(node, msg, config, now) {
        node.debug('calcTimes');
        const nowNr = hlp.getTimeNumber(now);
        const rulesLength = node.timeRules.length;
        node.debug(`calcTimes now=${nowNr}`);
        for (let i = 0; i < rulesLength; ++i) {
            const rule = node.timeRules[i];
            node.debug('rule ' + i + ' ' + util.inspect(rule, Object.getOwnPropertyNames(rule)));
            let operatorValid = true;
            node.time.switchProp = rule.propertyType !== 'none';
            if (node.time.switchProp) {
                try {
                    const res = RED.util.evaluateNodeProperty(rule.propertyValue, rule.propertyType, node, msg);
                    operatorValid = hlp.isTrue(res);
                } catch (err) {
                    node.warn(RED._('blind-control.errors.getPropertyData', err));
                    node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                    continue;
                }
            }
            if (operatorValid) {
                let isTime = true;
                if (rule.timeType !== 'none') {
                    node.time.switchTime = node.positionConfig.getTimeProp(node, msg, rule.timeType, rule.timeValue, rule.offsetValue, rule.offsetType, rule.multiplier);
                    if (node.time.switchTime.error) {
                        hlp.handleError(node, RED._('blind-control.errors.error-time', { message: node.time.switchTime.error }), undefined, node.time.switchTime.error);
                        continue;
                    } else if (!node.time.switchTime.value) {
                        throw new Error('Error can not calc time!');
                    }
                    node.time.switchTime.num = hlp.getTimeNumber(node.time.switchTime.value);
                    node.debug('nowNr=' + nowNr + ' switchTimeNum=' + node.time.switchTime.num + ' - end time value = ' + node.time.switchTime.value);
                    isTime = (node.time.switchTime.num >= nowNr);
                }
                if (isTime) {
                    node.time.text = (node.time.switchTime) ? node.time.switchTime.value.toLocaleTimeString() : RED._('blind-control.label.endOfDay');
                    if (node.time.switchProp) {
                        node.time.text += '*';
                    }
                    node.debug(node.time.text);
                    node.time.operator = Number(rule.operator);
                    node.time.rule = i+1;
                    node.time.level = getBlindPosFromTI(node, msg, rule.levelType, rule.levelValue, node.blindData.defaultPos);
                    node.blindData.position = node.time.level;
                    node.reason.Code = 4;
                    node.reason.State = RED._('blind-control.states.time', node.time);
                    node.reason.Description = RED._('blind-control.reasons.time', node.time);

                    if ((node.time.operator === 1) && (node.blindData.position <= node.blindData.openPos))  {
                        // min
                        node.time.operator = 0;
                        node.blindData.position = node.blindData.openPos;
                    }
                    if ((node.time.operator === 2) && (node.blindData.position >= node.blindData.closedPos))  {
                        // max
                        node.time.operator = 0;
                        node.blindData.position = node.blindData.closedPos;
                    }
                    return;
                }
            }
        }
        node.time.operator = 2; // max
        if (node.blindData.defaultPos === node.blindData.closedPos) {
            node.time.operator = 1; // min
        }
        node.time.level = node.blindData.defaultPos;
        node.blindData.position = node.blindData.defaultPos;
        node.reason.Code = 1;
        node.reason.State = RED._('blind-control.states.default');
        node.reason.Description = RED._('blind-control.reasons.default');
        delete node.time.rule;
        delete node.time.switchTime;
    }
    /******************************************************************************************/
    /******************************************************************************************/
    function sunBlindControlNode(config) {
        RED.nodes.createNode(this, config);
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        this.interval = config.interval || 0;
        this.once = config.once;
        this.onceDelay = (config.onceDelay || 0);
        this.hysteresis = config.hysteresis || 0;
        const node = this;
        if (node.interval >= 0x7FFFFFFF) {
            node.error(RED._('blind-control.errors.intervaltoolong', this));
            delete node.interval;
        }
        if (node.hysteresis >= 0x7FFFFFFF) {
            node.error(RED._('blind-control.errors.hysteresistoolong', this));
            delete node.hysteresis;
        }

        node.reason = {
            Code : 0,
            State: '',
            Description: ''
        };
        // Retrieve the config node
        node.sunData = {
            /** Defines if the sun control is active or not */
            active: hlp.chkValueFilled(config.sunControlActive,true),
            /** define how long could be the sun on the floor **/
            floorLength: Number(hlp.chkValueFilled(config.sunFloorLength,0)),
            /** minimum altitude of the sun */
            minAltitude: Number(hlp.chkValueFilled(config.sunMinAltitude,0)),
            isDay: false
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
            position: -1, // unknown
            increment: Number(hlp.chkValueFilled(config.blindIncrement,1)),
            openPos: Number(hlp.chkValueFilled(config.blindOpenPos, 100)),
            closedPos: Number(hlp.chkValueFilled(config.blindClosedPos, 0)),
            defaultPos: NaN,
            /** position if sun is not in window */
            overwrite : {
                active: false,
                value: config.overwriteValue || '',
                valueType: config.overwriteValueType || 'none',
                valuePrio: config.overwritePrioValue || '',
                valuePrioType: config.overwritePrioValueType || 'none',
                expireDuration: Number(hlp.chkValueFilled(config.overwriteExpire, 0)),
                alarm: false
            },
            nextchange:0
        };
        node.blindData.defaultPos = getBlindPosFromTI(node, undefined, config.blindDefaultPosType, config.blindDefaultPos, node.blindData.openPos);
        node.cloudData = {
            active: (typeof config.cloudValueType !== 'undefined') && (config.cloudValueType !== 'none'),
            value: config.cloudValue || '',
            valueType: config.cloudValueType || 'none',
            actValue: 100,
            threshold: config.cloudThreshold,
            thresholdValue: 100,
            blindPos: getBlindPosFromTI(node, undefined, config.cloudBlindPosType, config.cloudBlindPos, node.blindData.openPos),
            inLimit: true
        };
        node.timeRules = config.rules || [];
        node.time = {};

        function setState() {
            node.status({
                fill: (node.reason.Code <= 3) ? 'blue' :
                    ((node.reason.Code === 4) ? 'grey' :
                        ((node.reason.Code >= 8) ? 'green' : 'yellow')),
                shape: node.blindData.position === node.blindData.openPos ? 'dot' : 'ring',
                text: node.blindData.position.toString() + ' - ' + node.reason.State
            });
        }

        this.on('input', function (msg) {
            try {
                this.debug('input ' + util.inspect(msg, Object.getOwnPropertyNames(msg)));
                if (!this.positionConfig) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'));
                    node.status({
                        fill: 'red',
                        shape: 'dot',
                        text: 'Node not properly configured!!'
                    });
                    return null;
                }

                msg.reason = node.reason;
                node.time.now = getNow_(node, msg, config.tsCompare);
                node.debug('node.time=' + util.inspect(node.time));
                // check if the message contains any weather data

                const previous = {
                    position: node.blindData.position,
                    reasonCode: node.reason.Code
                };
                // check for manual overwrite
                if (!checkBlindPosOverwrite(this, msg, node.time.now)) {
                    // calc times:
                    calcTimes(this, msg, config, node.time.now);
                    // calc sun position:
                    calcBlindPosition(node, msg);

                    if ((node.time.operator === 1) && (node.blindData.position < node.time.level))  {
                        // min
                        node.debug(`${node.blindData.position} is below ${node.time.level} (min)`);
                        node.blindData.position = node.time.level;
                    } else if ((node.time.operator === 2) && (node.blindData.position > node.time.level)) {
                        // max
                        node.debug(`${node.blindData.position} is above ${node.time.level} (max)`);
                        node.blindData.position = node.time.level;
                    }
                    if (node.blindData.position < node.blindData.closedPos) {
                        node.debug(`${node.blindData.position} is below ${node.blindData.closedPos}`);
                        node.blindData.position = node.blindData.closedPos;
                    }
                    if (node.blindData.position > node.blindData.openPos) {
                        node.debug(`${node.blindData.position} is above ${node.blindData.closedPos}`);
                        node.blindData.position = node.blindData.openPos;
                    }
                }
                node.debug(`result pos=${node.blindData.position} manual=${node.blindData.overwrite.active} reasoncode=${node.reason.Code} description=${node.reason.Description}`);

                if (node.blindData.position !== previous.position ||
                    node.reason.Code !== previous.reasonCode) {
                    msg.payload = node.blindData.position;
                    msg.blind = node.blindData;
                    msg.time =  node.time;
                    if (config.topic) {
                        msg.topic = config.topic;
                    }
                    setState();
                    node.send(msg);
                }
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

        node.repeaterSetup = function () {
            if (this.interval && !isNaN(this.interval) && this.interval > 200) {
                this.interval_id = setInterval(() => {
                    node.emit('input', {});
                }, this.interval);
            }
        };

        if (this.once) {
            this.onceTimeout = setTimeout(() => {
                node.emit('input',{});
                node.repeaterSetup();
            }, this.onceDelay);
        } else {
            node.repeaterSetup();
        }

        sunBlindControlNode.prototype.close = function() {
            if (this.onceTimeout) {
                clearTimeout(this.onceTimeout);
            }
            if (this.interval_id !== null) {
                clearInterval(this.interval_id);
            }
        };
    }

    RED.nodes.registerType('blind-control', sunBlindControlNode);

    RED.httpAdmin.get('/sun-position/js/*', RED.auth.needsPermission('sun-position.read'), (req, res) => {
        const options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
        };
        res.sendFile(req.params[0], options);
    });
};