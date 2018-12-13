/********************************************
 * sun-position:
 *********************************************/
const path = require('path');
const hlp = require(path.join(__dirname, '/lib/sunPosHelper.js'));
const util = require('util');

module.exports = function (RED) {
    "use strict";

    function sunPositionNode(config) {
        RED.nodes.createNode(this, config);
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        this.topic = config.topic || "";
        this.rules = config.rules || [];
        this.azimuthPos = {};
        var node = this;

        this.on('input', function (msg) {
            try {
                var ports = new Array(this.rules.length);
                ports[0] = {
                    payload: this.positionConfig.getSunCalc(msg.ts),
                    topic: this.topic,
                }
                if (!ports[0].payload.azimuth) {
                    this.error('Azimuth could not calculated!');
                    this.send(ports);
                    return;
                }
                ports[0].payload.pos = [];
                ports[0].payload.posChanged = false;
                for (var i = 0; i < this.rules.length; i += 1) {
                    var rule = this.rules[i];
                    let low = getNumProp(node, msg, rule.valueLowType, rule.valueLow);
                    let high = getNumProp(node, msg, rule.valueHighType, rule.valueHigh);
                    let chk = hlp.compareAzimuth(ports[0].payload.azimuth, low, high);
                    let chg = (node.azimuthPos[i] !== chk);
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
                    fill: "grey",
                    shape: "dot",
                    text: ports[0].payload.azimuth.toFixed(2) + '/' + ports[0].payload.altitude.toFixed(2) + ' - ' + ports[0].payload.lastUpdate.toLocaleString()
                });
                return null;
            } catch (err) {
                hlp.errorHandler(this, err, 'Exception occured on sun-position', 'internal error');
            }
            //this.error("Input parameter wrong or missing. You need to setup (or give in the input message) the 'url' and 'content type' or the 'message' and 'language'!!");
            //this.status({fill:"red",shape:"dot",text:"error - input parameter"});
        });

        function getNumProp(node, msg, vType, value) {
            //node.debug('getNumProp vType=' + vType + ' value=' + value);
            let now = new Date();
            let result = -1;
            if (vType === '' || vType === 'none') {
                //nix
            } else if (vType === 'num') {
                result = Number(now);
            } else {
                try {
                    //evaluateNodeProperty(value, type, node, msg, callback)
                    let res = RED.util.evaluateNodeProperty(value, vType, srcNode, msg);
                    if (res && !isNaN(res)) {
                        result = Number(now);
                    } else {
                        node.error("could not evaluate " + vType + '.' + value);
                    }
                } catch (err) {
                    node.error("could not evaluate " + vType + '.' + value + ': ' + err.message);
                    node.debug(util.inspect(err, Object.getOwnPropertyNames(err)));
                }
            }
            return result;
        };
    }

    RED.nodes.registerType('sun-position', sunPositionNode);
};