/********************************************
 * sun-position:
 *********************************************/
const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');

module.exports = function (RED) {
    'use strict';

    function sunPositionNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        this.topic = config.topic || '';
        this.rules = config.rules || [];
        this.azimuthPos = {};
        this.start = config.start;
        this.startType = config.startType || 'none';
        this.startOffset = config.startOffset || 0;
        this.startOffsetType = config.startOffsetType || 'none';
        this.startOffsetMultiplier = config.startOffsetMultiplier || 60;
        this.end = config.end;
        this.endType = config.endType || 'none';
        this.endOffset = config.endOffset || 0;
        this.endOffsetType = config.endOffsetType || 'none';
        this.endOffsetMultiplier = config.endOffsetMultiplier || 60;
        const node = this;

        this.on('input', function (msg) {
            try {
                let errorStatus = '';
                let now = new Date();
                if (typeof msg.time !== 'undefined') {
                    now = new Date(msg.time);
                }
                if (typeof msg.ts !== 'undefined') {
                    now = new Date(msg.time);
                }
                if (!this.positionConfig) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.pos-config'));
                    node.status({
                        fill: 'red',
                        shape: 'dot',
                        text: RED._('node-red-contrib-sun-position/position-config:errors.pos-config-state')
                    });
                    return null;
                }
                const ports = new Array(this.rules.length);

                ports[0] = RED.util.cloneMessage(msg);
                ports[0].payload = this.positionConfig.getSunCalc(now);
                ports[0].topic = this.topic;
                if (!ports[0].payload.azimuth) {
                    this.error('Azimuth could not calculated!');
                    this.send(ports);
                    return;
                }

                ports[0].payload.pos = [];
                ports[0].payload.posChanged = false;
                if (node.startType !== 'none') {
                    const startTime = node.positionConfig.getTimeProp(node, msg, node.startType, node.start, node.startOffsetType, node.startOffset, node.startOffsetMultiplier);
                    node.debug('startTime: ' + util.inspect(startTime));
                    if (startTime.error) {
                        errorStatus = 'could not evaluate start time';
                        node.error(startTime.error);
                        // node.debug('startTime: ' + util.inspect(startTime));
                    } else {
                        ports[0].payload.startTime = startTime.value.getTime();
                    }
                }

                if (node.endType !== 'none') {
                    const endTime = node.positionConfig.getTimeProp(node, msg, node.endType, node.end, node.endOffsetType, node.endOffset, node.endOffsetMultiplier);
                    node.debug('endTime: ' + util.inspect(endTime));
                    if (endTime.error) {
                        errorStatus = 'could not evaluate end time';
                        node.error(endTime.error);
                        // node.debug('endTime: ' + util.inspect(endTime));
                    } else {
                        ports[0].payload.endTime = endTime.value.getTime();
                    }
                }

                if (ports[0].payload.startTime && ports[0].payload.endTime) {
                    const nowMillis = now.getTime();
                    ports[0].payload.sunInSky = nowMillis > ports[0].payload.startTime && nowMillis < ports[0].payload.endTime;
                }

                for (let i = 0; i < this.rules.length; i += 1) {
                    const rule = this.rules[i];
                    const low = getNumProp(node, msg, rule.valueLowType, rule.valueLow);
                    const high = getNumProp(node, msg, rule.valueHighType, rule.valueHigh);
                    const chk = hlp.checkLimits(ports[0].payload.azimuth, low, high);
                    const chg = (node.azimuthPos[i] !== chk);
                    ports[0].payload.pos.push(chk);
                    ports[0].payload.posChanged = ports[0].payload.posChanged && chg;
                    if (chk) {
                        ports[i + 1] = RED.util.cloneMessage(msg);
                        ports[i + 1].sunPos = chk;
                        ports[i + 1].posChanged = chg;
                        ports[i + 1].azimuth = ports[0].payload.azimuth;
                    }
                }
                node.azimuthPos = ports[0].payload.pos;

                if (errorStatus) {
                    this.status({
                        fill:   'red',
                        shape:  'dot',
                        text:   errorStatus
                    });
                } else if (ports[0].payload.startTime && ports[0].payload.endTime) {
                    if (ports[0].payload.sunInSky === true) {
                        node.status({
                            fill:   'yellow',
                            shape:  'dot',
                            text:   node.positionConfig.toTimeString(new Date(ports[0].payload.startTime)) + ' - ' +
                                    node.positionConfig.toTimeString(new Date(ports[0].payload.endTime))
                        });
                    } else {
                        node.status({
                            fill:   'blue',
                            shape:  'dot',
                            text:   node.positionConfig.toTimeString(new Date(ports[0].payload.startTime)) + ' - ' +
                                    node.positionConfig.toTimeString(new Date(ports[0].payload.endTime))
                        });
                    }
                } else {
                    let fill = 'red';
                    let text = 'no Data loaded!';

                    if (ports[0] && ports[0].payload && ports[0].payload.lastUpdate) {
                        const azimuth = (ports[0].payload.azimuth) ? ports[0].payload.azimuth.toFixed(2) : '?';
                        const altitude = (ports[0].payload.altitude) ? ports[0].payload.altitude.toFixed(2) : '?';
                        text = azimuth + '/' + altitude + ' - ' + node.positionConfig.toDateTimeString(ports[0].payload.lastUpdate);
                        fill = 'grey';
                    }
                    this.status({
                        fill: fill,
                        shape:  'dot',
                        text: text
                    });
                }
                this.send(ports); // Warning change msg object!!
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

        function getNumProp(srcNode, msg, vType, value) {
            try {
                if (vType === 'none') {
                    return undefined;
                }
                return node.positionConfig.getFloatProp(node, msg, vType, value, 0);
            } catch (err) {
                return undefined;
            }
        }
    }

    RED.nodes.registerType('sun-position', sunPositionNode);
};