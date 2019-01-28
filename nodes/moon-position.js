/********************************************
 * moon-position:
 *********************************************/

const path = require('path');

const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));
const util = require('util');

// const hlp = '/lib/sunPosHelper.js';

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
                        ports[i + 1].posChanged = chg;
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
                hlp.handleError(this, 'Exception occured on moon-position', err, 'internal error');
            }
            // this.error("Input parameter wrong or missing. You need to setup (or give in the input message) the 'url' and 'content type' or the 'message' and 'language'!!");
            // this.status({fill:"red",shape:"dot",text:"error - input parameter"});
        });

        function getNumProp(srcNode, msg, vType, value) {
            // srcNode.debug('getNumProp vType=' + vType + ' value=' + value);
            const now = new Date();
            let result = -1;
            if (vType === '' || vType === 'none') {
                // nix
            } else if (vType === 'num') {
                result = Number(now);
            } else {
                try {
                    // evaluateNodeProperty(value, type, srcNode, msg, callback)
                    const res = RED.util.evaluateNodeProperty(value, vType, srcNode, msg);
                    if (res && !isNaN(res)) {
                        result = Number(now);
                    } else {
                        srcNode.error('could not evaluate ' + vType + '.' + value);
                    }
                } catch (err) {
                    srcNode.error('could not evaluate ' + vType + '.' + value + ': ' + err.message);
                    srcNode.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                }
            }

            return result;
        }
    }

    RED.nodes.registerType('moon-position', moonPositionNode);
};