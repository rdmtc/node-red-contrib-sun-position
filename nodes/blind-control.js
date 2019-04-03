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
function checkWeather_(node, msg) {
    hlp.getMsgNumberValue(msg, ['maxtemp', 'maxTemp'], 'temp', (maxTemp) => {
        node.weatherData.maxTemp = maxTemp;
    });
    node.tempData.nok = (node.weatherData.maxTemp && node.tempData.threshold) ? node.weatherData.maxTemp > node.tempData.threshold : false;

    hlp.getMsgNumberValue(msg, ['clouds', 'cloud'], 'cloud', (clouds) => {
        node.weatherData.clouds = clouds;
    });
    node.cloudData.nok = (node.weatherData.clouds && node.cloudData.threshold) ? node.weatherData.clouds > node.cloudData.threshold : false;
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
 * calculates the current sun position
 * @param {*} node node data
 * @param {*} msg the message object
 * @param {*} config the configuration object
 * @param {*} time the time object
 * @param {*} blindData the blind Data
 */
function getSunPosition_(node) {
    const sunPosition = node.positionConfig.getSunCalc(node.time.now, true);
    // calc sunInSky:
    sunPosition.isDay = false;
    if (node.time.startNr < node.time.endNr) {
        sunPosition.isDay = (node.time.cmpNow >= node.time.startNr && node.time.cmpNow < node.time.endNr);
    } else {
        sunPosition.isDay = (!(node.time.cmpNow >= node.time.endNr && node.time.cmpNow < node.time.startNr));
    }
    sunPosition.inWindow = false;
    if (!sunPosition.isDay) {
        return sunPosition;
    }
    if ((node.windowSettings.angle - node.windowSettings.angleOffsetStart) < 0) {
        if ( (360 + node.windowSettings.angle - node.windowSettings.angleOffsetStart <= sunPosition.altitudeDegrees) & (sunPosition.azimuthDegrees <= 360) ||
              (0 <= sunPosition.azimuthDegrees && sunPosition.azimuthDegrees <= node.windowSettings.angle + node.windowSettings.angleOffsetEnd)
        ) {
            sunPosition.inWindow = true;
        }
    } else if (node.windowSettings.angle + node.windowSettings.angleOffsetStart > 360) {
        if ( (0 <= sunPosition.azimuthDegrees) & (sunPosition.azimuthDegrees <= node.windowSettings.angle + node.windowSettings.angleOffsetStart - 360) ||
            (node.windowSettings.angle - node.windowSettings.angleOffsetEnd <= sunPosition.azimuthDegrees && sunPosition.azimuthDegrees <= 360)
        ) {
            sunPosition.inWindow = true;
        }
    } else {
        if ( (node.windowSettings.angle - node.windowSettings.angleOffsetEnd <= sunPosition.azimuthDegrees) &&
             (sunPosition.azimuthDegrees <= node.windowSettings.angle + node.windowSettings.angleOffsetStart)
        ) {
            sunPosition.inWindow = true;
        }
    }
    return sunPosition;
}
/******************************************************************************************/
module.exports = function (RED) {
    'use strict';
    function blindPosOverwriteReset(node) {
        if (node.blindData.overwrite.expires >= 0) {
            node.debug('blindPosOverwriteReset');

            delete node.blindData.overwrite.expires;
            delete node.blindData.overwrite.expireNever;
            delete node.blindData.overwrite.expireDate;
            node.blindData.overwrite.active = false;
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
        hlp.getMsgBoolValue(msg, 'alarm', 'alarm',
            (val) => {
                if (val) {
                    node.debug('alarm');
                    blindPosOverwriteReset(node);
                    node.blindData.overwrite.expireNever = true;
                    node.blindData.overwrite.active = true;
                    node.reason.Code = 1;
                    node.reason.State = RED._('blind-control.states.overwriteAlarm');
                    node.reason.Description = RED._('blind-control.reasons.overwriteAlarm');
                    node.blindData.position = node.blindData.openPos;
                    return true;
                }
            });

        hlp.getMsgBoolValue(msg, 'reset', 'reset',
            (val) => {
                if (val) {
                    blindPosOverwriteReset(node);
                }
            });

        const now = node.time.now.getTime();
        if (node.blindData.overwrite.active) {
            if (node.blindData.overwrite.expireNever) {
                return true;
            }
            if (!node.blindData.overwrite.expires || (node.blindData.overwrite.expires > now)) {
                blindPosOverwriteReset(node);
            }
        }

        let needOverwrite = false;
        const newPos = hlp.getMsgNumberValue(msg, ['blindPosition', 'position'], ['manual', 'overwrite'],
            (val) => {
                needOverwrite = true;
                return val;
            }, () => {
                return node.blindData.position;
            });
        needOverwrite = needOverwrite || (node.blindData.position !== newPos);

        const expire = hlp.getMsgNumberValue(msg, 'expire', 'expire',
            (val) => {
                needOverwrite = true;
                return val;
            }, () => {
                return node.blindData.overwrite.expireDuration;
            });

        if (needOverwrite) {
            node.debug('needOverwrite expire=' + expire + ' newPos=' + newPos);
            if (!validPosition_(node, newPos)) {
                node.error(RED._('invalid-blind-position', { pos: newPos }));
                return false;
            }
            node.blindData.position = newPos;
            node.blindData.overwrite.active = true;
            const prio = hlp.getMsgBoolValue(msg, ['prio', 'priority'], 'priority', undefined, false);
            if (prio || (expire < 500)) {
                node.debug('needOverwrite prio=' + prio + ' expire=' + expire);
                node.blindData.overwrite.expireNever = true;
                node.reason.Code = 2;
                node.reason.State = RED._('blind-control.states.overwritePrio');
                node.reason.Description = RED._('blind-control.reasons.overwritePrio');
            } else {
                node.blindData.overwrite.expires = (now + expire);
                node.blindData.overwrite.expireDate = new Date(now + expire);
                node.debug('expires in ' + expire + 'ms = ' + node.blindData.overwrite.expireDate);
                if (node.timeOutObj) {
                    blindPosOverwriteReset(node);
                }
                node.timeOutObj = setTimeout(() => {
                    node.debug('overwrites expires');
                    blindPosOverwriteReset(node);
                    node.emit('retrigger', msg);
                }, expire);
                node.reason.Code = 3;
                node.reason.State = RED._('blind-control.states.overwrite');
                node.reason.Description = RED._('blind-control.reasons.overwrite', {
                    time: node.blindData.overwrite.expireDate.toISOString()
                });
            }
            return true;
        }
        return false;
    }

    /**
     * calculates for the blind the new position
     * @param {*} node the node data
     * @param {*} msg the message object
     * @param {*} blindData the blind data
     * @param {*} time the time data
     * @param {*} sunPosition the sun position
     * @param {*} weather the weather data
     */
    function calcBlindPosition(node, sunPosition) {
        node.debug('calcBlindPosition');
        if ((node.blindData.nightPos) && !sunPosition.isDay) {
            node.blindData.position = node.blindData.nightPos;
            node.reason.Code = 4;
            node.reason.State = RED._('blind-control.states.night');
            node.reason.Description = RED._('blind-control.reasons.night');
        } else if (node.tempData.nok) {
            node.blindData.position = node.tempData.blindPos;
            node.reason.Code = 9;
            node.reason.State = RED._('blind-control.states.tempExceeded');
            node.reason.Description = RED._('blind-control.reasons.tempExceeded');
        } else if (!sunPosition.inWindow) {
            node.blindData.position = node.blindData.noSunPos;
            node.reason.Code = 6;
            node.reason.State = RED._('blind-control.states.sunNotInWin');
            node.reason.Description = RED._('blind-control.reasons.sunNotInWin');
        } else if (node.sunData.active) {
            if (((node.sunData.minAltitude && sunPosition.altitudeDegrees >= node.sunData.minAltitude) ||
                !node.sunData.minAltitude) && !node.cloudData.nok) {
                const height = Math.tan(sunPosition.altitudeRadians) * node.sunData.floorLength;
                if (height <= node.windowSettings.bottom) {
                    node.blindData.position = node.blindData.closedPos;
                } else if (height >= node.windowSettings.top) {
                    node.blindData.position = node.blindData.openPos;
                } else {
                    node.blindData.position = 100 * (1 - (height - node.windowSettings.bottom) / (node.windowSettings.top - node.windowSettings.bottom));
                    if (Number.isInteger(node.blindData.increment)) {
                        node.blindData.position = Math.ceil(node.blindData.position);
                        node.blindData.position = Math.ceil(node.blindData.position / node.blindData.increment) * node.blindData.increment;
                    }
                }
                node.reason.Code = 7;
                node.reason.State = RED._('blind-control.states.sunCtrl');
                node.reason.Description = RED._('blind-control.reasons.sunCtrl');
            } else if (node.sunData.minAltitude && sunPosition.altitudeDegrees < node.sunData.minAltitude) {
                node.reason.Code = 5;
                node.reason.State = RED._('blind-control.states.sunMinAltitude');
                node.reason.Description = RED._('blind-control.reasons.sunMinAltitude');
            } else if (node.cloudData.nok) {
                node.blindData.position = node.cloudData.threshold;
                node.reason.Code = 8;
                node.reason.State = RED._('blind-control.states.cloudExceeded');
                node.reason.Description = RED._('blind-control.reasons.cloudExceeded');
            }
        } else if (node.cloudData.nok) {
            node.blindData.position = node.cloudData.threshold;
            node.reason.Code = 8;
            node.reason.State = RED._('blind-control.states.cloudExceeded');
            node.reason.Description = RED._('blind-control.reasons.cloudExceeded');
        } else {
            node.blindData.position = node.blindData.openPos;
            node.reason.Code = 10;
            node.reason.State = RED._('blind-control.states.openDef');
            node.reason.Description = RED._('blind-control.reasons.openDef');
        }

        if (node.blindData.position > node.blindData.closedPos) {
            node.blindData.position = node.blindData.closedPos;
        }
        if (node.blindData.position < node.blindData.openPos) {
            node.blindData.position = node.blindData.openPos;
        }
    }

    /**
       * calculates the times
       * @param {*} node node data
       * @param {*} msg the message object
       * @param {*} config the configuration object
       */
    function calcTimes(node, msg, config) {
        node.time = {
            now: getNow_(node, msg, config.tsCompare),
            start: {},
            end: {},
            altStartTime: false,
            altEndTime: false
        };
        if ((node.propertyStartType !== 'none') && (msg || (node.propertyStartType !== 'msg'))) {
            try {
                const res = RED.util.evaluateNodeProperty(node.propertyStart, node.propertyStartType, node, msg);
                node.time.altStartTime = hlp.isTrue(res);
            } catch (err) {
                node.time.altStartTime = false;
                hlp.handleError(node, RED._('blind-control.errors.invalid-propertyStart-type', {
                    type: node.propertyStartType,
                    value: node.propertyStart
                }), err);
                node.debug(util.inspect(err));
            }
        }

        if ((node.propertyEndType !== 'none') && (msg || (node.propertyEndType !== 'msg'))) {
            try {
                const res = RED.util.evaluateNodeProperty(node.propertyEnd, node.propertyEndType, node, msg);
                node.time.altEndTime = hlp.isTrue(res);
            } catch (err) {
                node.time.altEndTime = false;
                hlp.handleError(node, RED._('blind-control.errors.invalid-propertyEnd-type', {
                    type: node.propertyEndType,
                    value: node.propertyEnd
                }), err);
                node.debug(util.inspect(err));
            }
        }

        if (node.time.altStartTime && config.startTimeAltType !== 'none') {
            node.time.start = node.positionConfig.getTimeProp(node, msg, config.startTimeAltType, config.startTimeAlt, config.startOffsetAlt, config.startOffsetAltType, config.startOffsetAltMultiplier);
        } else {
            node.time.start = node.positionConfig.getTimeProp(node, msg, config.startTimeType, config.startTime, config.startOffset, config.startOffsetType, config.startOffsetMultiplier);
        }

        if (node.time.altEndTime && config.endTimeAltType !== 'none') {
            node.time.end = node.positionConfig.getTimeProp(node, msg, config.endTimeAltType, config.endTimeAlt, config.endOffsetAlt, config.endOffsetAltType, config.endOffsetAltMultiplier);
        } else {
            node.time.end = node.positionConfig.getTimeProp(node, msg, config.endTimeType, config.endTime, config.endOffset, config.endOffsetType, config.endOffsetMultiplier);
        }
        node.time.startNr = hlp.getTimeNumber(node.time.start.value);
        node.time.endNr = hlp.getTimeNumber(node.time.end.value);
        node.time.cmpNow = hlp.getTimeNumber(node.time.now);
    }

    function sunBlindControlNode(config) {
        RED.nodes.createNode(this, config);
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        this.reason = {
            Code : 0,
            State: '',
            Description: ''
        };
        // Retrieve the config node
        this.windowSettings = {
            /** The Height of the window */
            height: Number(config.windowHeight),
            /** The bottom of the window */
            bottom: Number(config.windowBottom),
            /** The top of the window */
            top: Number(config.windowBottom) + Number(config.windowHeight),
            /** the orientation to the geographical north */
            angle: Number(config.windowOrientation),
            /** an offset for the angle anti-clockwise offset */
            angleOffsetStart: Number(hlp.chkValueFilled(config.windowAngleOffsetStart, 0)),
            /** an offset for the angle clockwise offset */
            angleOffsetEnd: Number(hlp.chkValueFilled(config.windowAngleOffsetEnd, 0))
        };
        this.sunData = {
            /** Defines if the sun control is active or not */
            active: hlp.chkValueFilled(config.sunControlActive,true),
            /** define how long could be the sun on the floor **/
            floorLength: Number(hlp.chkValueFilled(config.sunFloorLength,0)),
            /** minimum altitude of the sun */
            minAltitude: Number(hlp.chkValueFilled(config.sunMinAltitude,0)),
            isDay: false
        };
        this.blindData = {
            position: -1, // unknown
            increment: Number(hlp.chkValueFilled(config.blindIncrement,1)),
            openPos: Number(hlp.chkValueFilled(config.blindOpenPos, 100)),
            closedPos: Number(hlp.chkValueFilled(config.blindClosedPos, 0)),
            nightPos: Number(hlp.chkValueFilled(config.blindPosNight, NaN)),
            /** position if sun is not in window */
            noSunPos: Number(hlp.chkValueFilled(config.blindPosSunNotInWindow, (hlp.chkValueFilled(config.blindOpenPos, 100)))),
            overwrite : {
                active: false,
                expireDuration: Number(hlp.chkValueFilled(config.blindPosOverwriteExpire, 0)) * Number(hlp.chkValueFilled(config.blindPosOverwriteExpireMultiplier, 60000)),
                alarm: false,
                onDay: hlp.chkValueFilled(config.blindPosOverwriteExpireDay, false),
                onNight: hlp.chkValueFilled(config.blindPosOverwriteExpireNight, false)
            }
        };
        this.tempData = {
            threshold: config.tempThreshold,
            blindPos: Number(hlp.chkValueFilled(config.tempBlindPos, undefined)),
            ok: true
        };
        this.cloudData = {
            threshold: config.cloudThreshold,
            blindPos: Number(hlp.chkValueFilled(config.cloudBlindPos, undefined)),
            ok: true
        };
        this.weatherData = {
            /** forecast of the max temp of the day */
            maxTemp : -1,
            /** percentage 0 - 100 of the sky occluded by clouds */
            clouds : 0
        };
        const node = this;

        this.on('input', function (msg) {
            try {
                this.debug('input ' + util.inspect(msg, Object.getOwnPropertyNames(msg)));
                this.debug('input ' + util.inspect(msg, Object.getOwnPropertyNames(msg)));
                this.debug('input ' + util.inspect(msg, Object.getOwnPropertyNames(msg)));

                msg.reason = node.reason;
                // calc times:
                calcTimes(this, msg, config);
                node.debug('node.time=' + util.inspect(node.time));

                // check if the message contains any weather data
                checkWeather_(this, msg);
                node.debug('node.cloudData=' + util.inspect(node.cloudData));
                node.debug('node.tempData=' + util.inspect(node.tempData));
                node.debug('node.weatherData=' + util.inspect(node.weatherData));

                const previous = {
                    position: node.blindData.position,
                    reasonCode: node.reason.Code
                };
                // check for manual overwrite
                if (checkBlindPosOverwrite(this, msg)) {
                    // calc sun position:
                    const sunPosition = getSunPosition_(this);
                    this.debug('sunPosition ' + util.inspect(sunPosition));
                    this.debug('node.sunData ' + util.inspect(node.sunData));
                    msg.sunPosition = sunPosition;

                    if (sunPosition.isDay !== node.sunData.isDay) {
                        node.sunData.isDay = sunPosition.isDay;
                        if ((node.blindData.overwrite.onDay && sunPosition.isDay) ||
                            (node.blindData.overwrite.onNight && !sunPosition.isDay)) {
                            blindPosOverwriteReset(node);
                        }
                    }

                    if (node.blindData.nightPos && (!this.time.start.value || !this.time.end.value)) {
                        throw new Error('Error can not calc time!');
                    }

                    if (!node.blindData.overwrite.active) {
                        calcBlindPosition(node, sunPosition);
                    }
                }

                if (node.blindData.position !== previous.position ||
                    node.reason.Code !== previous.reasonCode) {
                    msg.payload = node.blindData.position;
                    msg.blind = node.blindData;
                    msg.temp = node.tempData;
                    msg.cloud = node.cloudData;
                    if (config.topic) {
                        msg.topic = config.topic;
                    }
                    node.send(msg);

                    node.status({
                        fill: (node.reason.Code <= 3) ? 'blue' :
                            ((node.reason.Code === 4) ? 'grey' :
                                ((node.reason.Code >= 8) ? 'green' : 'yellow')),
                        shape: node.blindData.position === node.blindData.openPos ? 'dot' : 'ring',
                        text: node.blindData.position + ' - ' + node.reason.State + ' (' + node.reason.Code + ')'
                    });
                }
                return null;
            } catch (err) {
                node.error(err.message);
                node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'internal error'
                });
            }
        });
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