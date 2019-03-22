/********************************************
 * moon-position:
 *********************************************/

const path = require('path');

const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));
const util = require('util');

module.exports = function (RED) {
    'use strict';

    function moonPositionNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        this.topic = config.topic || '';
        this.rules = config.rules || [];
        this.azimuthPos = {};
        const node = this;

        this.on('input', function (msg) {
            try {
                const ports = new Array(this.rules.length);
                ports[0] = {
                    payload: this.positionConfig.getMoonCalc(msg.ts),
                    topic: this.topic
                };
                if (!ports[0].payload.azimuth) {
                    this.error('Azimuth could not calculated!');
                    this.send(ports);
                    return;
                }

                ports[0].payload.pos = [];
                ports[0].payload.posChanged = false;
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
                        ports[i + 1].moonPos = chk;
                        ports[i + 1].posChanged = chg;
                        ports[i + 1].azimuth = ports[0].payload.azimuth;
                    }
                }

                node.azimuthPos = ports[0].payload.pos;
                this.send(ports);
                this.status({
                    fill: 'grey',
                    shape: 'dot',
                    text: ports[0].payload.azimuth.toFixed(2) + '/' + ports[0].payload.altitude.toFixed(2) + ' - ' + ports[0].payload.lastUpdate.toLocaleString()
                });
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
            // this.error("Input parameter wrong or missing. You need to setup (or give in the input message) the 'url' and 'content type' or the 'message' and 'language'!!");
            // this.status({fill:"red",shape:"dot",text:"error - input parameter"});
        });

        function getNumProp(srcNode, msg, vType, value) {
            try {
                if (vType === 'none') {
                    return undefined;
                }
                return node.positionConfig.getFloatProp(node, msg, vType, value);
            } catch (err) {
                return undefined;
            }
        }
    }

    RED.nodes.registerType('moon-position', moonPositionNode);
};