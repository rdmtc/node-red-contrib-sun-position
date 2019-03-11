/********************************************
 * sun-blind-control:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');


/*************************************************************************************************************************/
/*
   * Function to calculate the appropriate blind position based on the
   * altitude of the sun, characteristics of the window, with the target of
   * restricting or maximizing the extent to which direct sunlight enters
   * the room.
   *
   * The function works in two modes, Summer and Winter.  In Summer mode, it
   * restricts direct sunlight entering the room.  When the sun is considered
   * to be in the window, the function calculates the minimum height of an
   * object that casts a shadow to the depth property based on the sun
   * altitude of the sun.  This height is converted into a blind position
   * using the dimensions of the window and the increments by which the blind
   * position can be controlled.
   *
   * The calculation also takes into account the following (in order of
   * precedence):
   * - if the blind's position has been manually specified, the calculation
   *   is not performed for that blind until that position expires
   * - if the forecasted temperature for the day exceeds a threshold, the
   *   blind will be closed fully while the sun is in the sky.  This feature
   *   of the function is intended to allow blinds to be used to block out
   *   extreme heat.
   * - if it is deemed to be sufficiently overcast, the blind will be set to a
   *   fully open position.
   * - if the sun is below an altitude threshold, the blind will be set to a
   *   fully open position.
   *
   * In winter mode, the calculation is based on whether the sun is in
   * window and whether it is sufficiently overcast.  If the sun is in the
   * window, it will be opened to a configured Open position unless it is
   * overcast it which case it will be closed.  If the sun is not in the
   * window, it is closed to a configured Closed position.
   *
   * Outside daylight hours, the blind is closed to a configured position.
   */
  function calcBlindPosition(blind, sunPosition, weather) {
    /*
     * For the given altitude of the sun, calculate the minimum height of
     * an object that casts a shadow to the specified depth. Convert this
     * height into a blind position based on the dimensions of the window
     */
    var isTemperatureAConcern = weather.maxtemp && blind.temperaturethreshold
        ? weather.maxtemp > blind.temperaturethreshold : false;
    var isOvercast = weather.clouds && blind.cloudsthreshold
		? weather.clouds > blind.cloudsthreshold : false;

    var now = new Date();

    if (hasBlindPositionExpired(blind.blindPositionExpiry)) {
      blind.blindPosition = blind.maxopen;
      if (sunPosition.sunInSky) {
        if (isTemperatureAConcern) {
          blind.blindPosition = blind.temperaturethresholdposition;
          blind.blindPositionReasonCode = "07";
          blind.blindPositionReasonDesc = RED._("blindcontroller.positionReason.07");
        } else {
          blind.sunInWindow = isSunInWindow(blind, sunPosition.azimuth);
          switch (blind.mode) {
            case "Winter":
              if (blind.sunInWindow) {
                if (isOvercast) {
                  blind.blindPosition = blind.cloudsthresholdposition;
                  blind.blindPositionReasonCode = "06";
                  blind.blindPositionReasonDesc = RED._(
                    "blindcontroller.positionReason.06"
                  );
                } else {
                  blind.blindPosition = blind.maxopen;
                  blind.blindPositionReasonCode = "05";
                  blind.blindPositionReasonDesc = RED._(
                    "blindcontroller.positionReason.05"
                  );
                }
              } else {
                blind.blindPosition = blind.maxclosed;
                blind.blindPositionReasonCode = "04";
                blind.blindPositionReasonDesc = RED._(
                  "blindcontroller.positionReason.04"
                );
              }
              break;
            default:
              if (blind.sunInWindow) {
                if (
                  ((blind.altitudethreshold &&
                    sunPosition.altitude >= blind.altitudethreshold) ||
                    !blind.altitudethreshold) &&
                  !isOvercast
                ) {
                  var height =
                    Math.tan(sunPosition.altitude * Math.PI / 180) *
                    blind.depth;
                  if (height <= blind.bottom) {
                    blind.blindPosition = blind.maxclosed;
                  } else if (height >= blind.top) {
                    blind.blindPosition = blind.maxopen;
                  } else {
                    blind.blindPosition = Math.ceil(
                      100 *
                        (1 -
                          (height - blind.bottom) / (blind.top - blind.bottom))
                    );
                    blind.blindPosition =
                      Math.ceil(blind.blindPosition / blind.increment) *
                      blind.increment;
                    blind.blindPosition =
                      blind.blindPosition > blind.maxclosed
                        ? blind.maxclosed
                        : blind.blindPosition;
                    blind.blindPosition =
                      blind.blindPosition < blind.maxopen
                        ? blind.maxopen
                        : blind.blindPosition;
                  }
                  blind.blindPositionReasonCode = "05";
                  blind.blindPositionReasonDesc = RED._(
                    "blindcontroller.positionReason.05"
                  );
                } else if (
                  blind.altitudethreshold &&
                  sunPosition.altitude < blind.altitudethreshold
                ) {
                  blind.blindPositionReasonCode = "03";
                  blind.blindPositionReasonDesc = RED._(
                    "blindcontroller.positionReason.03"
                  );
                } else if (isOvercast) {
                  blind.blindPosition = blind.cloudsthresholdposition;
                  blind.blindPositionReasonCode = "06";
                  blind.blindPositionReasonDesc = RED._(
                    "blindcontroller.positionReason.06"
                  );
                }
              } else {
                blind.blindPositionReasonCode = "04";
                blind.blindPositionReasonDesc = RED._(
                  "blindcontroller.positionReason.04"
                );
              }
              if (weather) {
                blind.weather = weather;
              }
              break;
          }
        }
      } else {
        blind.blindPosition = blind.nightposition;
        blind.blindPositionReasonCode = "02";
        blind.blindPositionReasonDesc = RED._(
          "blindcontroller.positionReason.02"
        );
        blind.sunInWindow = false;
      }
      if (blind.blindPositionExpiry) {
        delete blind.blindPositionExpiry;
      }
    }
  }
/*************************************************************************************************************************/

  /*
   * When the blind position is manually specified, this function is used to
   * prepare the message and the expiry timestamp.
   */
	function setBlindPosition(now, node, msg, blindData, expireDefault) {
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
		blindData.position = newPos;
		blindData.positionExpiry = new Date(now.getTime() + expire);
	}

  /*
   * For each blind, run the blind calculation process and if a different
   * position is determined send a message with the new position for the
   * channel.
   */
  function calcBlindPosition(node, msg, blindData, sunPosition, weather) {
		var previousBlindPosition = blindData.blindPosition;
		var previousSunInWindow = blindData.sunInWindow;
		var previousBlindPositionReasonCode = blindData.blindPositionReasonCode;

		calcBlindPosition(blinds[i], sunPosition, weather);
		if (
		blinds[i].blindPosition != previousBlindPosition ||
		blinds[i].sunInWindow != previousSunInWindow ||
		blinds[i].blindPositionReasonCode != previousBlindPositionReasonCode
		) {
		msg.payload = blinds[i];
		msg.data = {
			channel: blinds[i].channel,
			altitude: sunPosition.altitude,
			azimuth: sunPosition.azimuth,
			blindPosition: blinds[i].blindPosition
		};
		msg.topic = "blind";
		node.send(msg);
		}
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