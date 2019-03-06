/********************************************
 * sun-blind-control:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');

  /*
   * When the blind position is manually specified, this function is used to
   * prepare the message and the expiry timestamp.
   */
	function setBlindPosition(now, node, msg, blind, expireDefault) {
		let newPos = null;
		if (typeof msg.payload.blindPosition !== 'undefined') {
			newPos = parseFloat(msg.payload.blindPosition);
		} else if (typeof msg.blindPosition !== 'undefined') {
			newPos = parseFloat(msg.blindPosition);
		} else if (!isNaN(msg.payload)) {
			newPos = parseFloat(msg.payload);
		}
		if (isNaN(newPos)) {
			return false;
		}
		let expire = expireDefault;
		if (typeof msg.payload.blindPositionExpiry !== 'undefined') {
			expire = parseFloat(msg.payload.blindPositionExpiry);
		} else if (typeof msg.payload.expire !== 'undefined') {
			expire = parseFloat(msg.payload.expire);
		} else if (typeof msg.expire !== 'undefined') {
			expire = parseFloat(msg.expire);
		}
		if (isNaN(expire)) {
			expire = expireDefault;
		}
		blind.position = newPos;
		blind.positionExpiry = new Date(now.getTime() + expire);
	}

module.exports = function (RED) {
    'use strict';

    function checkMsgType(msg, name) {
		if (typeof msg[name] !== 'undefined') {
			if (msg[name] !== '' && msg[name] !== 0) {
				return true;
			}
		}

		if (typeof msg.topic !== 'undefined') {
			if (String(msg.topic).toLocaleLowerCase === name) {
				return true;
			}
		}

		return false;
	}

    function sunBlindControlNode(config) {
		RED.nodes.createNode(this, config);
		this.positionConfig = RED.nodes.getNode(config.positionConfig);
		// Retrieve the config node

		this.blindData = {
			name: config.name || 'blind',
			mode: config.mode,
			window: {
				top: Number(config.windowTop),
				bottom: Number(config.windowBottom),
				orientation: Number(config.windowOrientation),
				noffset: Number(hlp.chkValueFilled(config.windowOrientationNOffset, RED._("blindcontroller.placeholder.noffset"))),
				poffset: Number(hlp.chkValueFilled(config.windowOrientationPOffset, RED._("blindcontroller.placeholder.poffset"))),
			},
			depth: Number(config.sunDepth),
			altitudethreshold: Number(config.altitudethreshold),
			increment: Number(config.increment),
			maxopen: Number(hlp.chkValueFilled(config.maxopen, RED._("blindcontroller.placeholder.maxopen"))),
			maxclosed: Number(hlp.chkValueFilled(config.maxclosed,RED._("blindcontroller.placeholder.maxclosed"))),
			temperaturethreshold: config.temperaturethreshold,
			temperaturethresholdposition: Number(hlp.chkValueFilled(config.temperaturethresholdposition,RED._("blindcontroller.placeholder.temperaturethresholdposition"))),
			cloudsthreshold: config.cloudsthreshold,
			cloudsthresholdposition: Number(hlp.chkValueFilled(config.cloudsthresholdposition,RED._("blindcontroller.placeholder.cloudsthresholdposition"))),
			nightposition: Number(hlp.chkValueFilled(config.nightposition,RED._("blindcontroller.placeholder.nightposition"))),
			expiryperiod: Number(hlp.chkValueFilled(config.expiryperiod,RED._("blindcontroller.placeholder.expiryperiod")))
		}
		const node = this;

		function runCalc(node, msg, blinds, sunPosition, weather) {

		}

		this.on('input', function (msg) {
            try {
				let controlType = '';
                let now = new Date();
                if (typeof msg.time !== 'undefined') {
                    now = new Date(msg.time);
                }
                if (typeof msg.ts !== 'undefined') {
                    now = new Date(msg.time);
				}

				if (checkMsgType(msg, 'reset')) {
					controlType = 'reset';
				} else if (checkMsgType(msg, 'manual')) {
					controlType = 'manual';
				} else if (checkMsgType(msg, 'weather')) {
					controlType = 'weather';
				} else if (checkMsgType(msg, 'blindposition')) {
					controlType = 'position';
				} else if (checkMsgType(msg, 'calc')) {
					controlType = 'recalc';
				}

				if (controlType === '') {
					return null; //TODO: error Handling?
				}

				let sunPosition = this.positionConfig.getSunCalc(now);
				const startTime = node.positionConfig.getTimeProp(node, msg, node.startType, node.start, node.startOffset, node.startOffsetType, node.startOffsetMultiplier);
				let startTimeMillis = null;
				node.debug('startTime: ' + util.inspect(startTime));
				if (startTime.error) {
					errorStatus = 'could not evaluate start time';
					node.error(startTime.error);
					node.debug('startTime: ' + util.inspect(startTime));
				} else {
					startTimeMillis = startTime.value.getTime();
				}
				const endTime = node.positionConfig.getTimeProp(node, msg, node.endType, node.end, node.endOffset, node.endOffsetType, node.endOffsetMultiplier);
				let endTimeMillis = null;
				if (endTime.error) {
					errorStatus = 'could not evaluate end time';
					node.error(endTime.error);
					node.debug('endTime: ' + util.inspect(endTime));
				} else {
					endTimeMillis = endTime.value.getTime();
				}
				const nowMillis = now.getTime();
				const sunInSky = nowMillis > startTimeMillis && nowMillis < endTimeMillis;

				switch (controlType) {
					case 'recalc':
						runCalc(node, msg, blinds, sunPosition, weather);
						break;
					default:
						break;
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

	RED.nodes.registerType('sun-blind-control', sunBlindControlNode);
};