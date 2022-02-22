/*
 * This code is licensed under the Apache License Version 2.0.
 *
 * Copyright (c) 2022 Robert Gester
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 */

/********************************************
 * delay-until:
 *********************************************/
'use strict';

module.exports = function(RED) {
    'use strict';
    /**
     * withinTimeSwitchNode
     * @param {*} config - configuration
     */
    function rdgDelayUntilNode(config) {
        const util = require('util');
        const path = require('path');

        const hlp = require(path.join(__dirname, '/lib/dateTimeHelper.js'));

        RED.nodes.createNode(this, config);
        this.locale = require('os-locale').sync();
        // Retrieve the config node
        this.positionConfig = RED.nodes.getNode(config.positionConfig);
        // this.debug('initialize rdgDelayUntilNode ' + util.inspect(config, { colors: true, compact: 10, breakLength: Infinity }));
        if (!this.positionConfig) {
            node.error(RED._('node-red-contrib-sun-position/position-config:errors.config-missing'));
            node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.config-missing-state') });
            return null;
        }
        if (this.positionConfig.checkNode(
            error => {
                node.error(error);
                node.status({fill: 'red', shape: 'dot', text: error });
            }, false)) {
            return null;
        }
        this.timeData = {
            type: config.timeType,
            value : config.time,
            offsetType : config.offsetType,
            offset : config.offset,
            multiplier : config.offsetMultiplier,
            next: true,
            calcByMsg: (config.timeType === 'msg' ||
                        config.timeType === 'flow' ||
                        config.timeType === 'global')
        };
        if (this.timeData.type === 'jsonata') {
            try {
                this.timeData.expr = this.positionConfig.getJSONataExpression(this, this.timeData.value);
            } catch (err) {
                this.error(RED._('node-red-contrib-sun-position/position-config:errors.invalid-expr', { error:err.message }));
                this.timeData.expr = null;
            }
        }
        this.queuingBehavior = config.queuingBehavior;
        this.flushMsgs = {
            type: config.flushMsgsType || 'none',
            value : config.flushMsgs
        };
        this.flushMsgsValue = config.flushMsgsValue;
        this.dropMsgs = {
            type: config.dropMsgsType || 'none',
            value : config.dropMsgs
        };
        this.dropMsgsValue = config.dropMsgsValue;
        this.enqueueMsg = {
            type: config.enqueueMsgType || 'none',
            value : config.enqueueMsg
        };
        this.enqueueMsgValue = config.enqueueMsgValue;
        this.ctrlPropSet = config.ctrlPropSet;
        this.ctrlPropValue = config.ctrlPropValue;
        this.tsCompare = config.tsCompare;
        const node = this;

        node.msgQueue = [];

        node.on('input', (msg, send, done) => {
            // If this is pre-1.0, 'done' will be undefined
            done = done || function (text, msg) { if (text) { return node.error(text, msg); } return null; };
            send = send || function (...args) { node.send.apply(node, args); };

            try {
                node.debug('--------- delay-until - input');
                if (!node.positionConfig) {
                    node.error(RED._('node-red-contrib-sun-position/position-config:errors.config-missing'));
                    node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.config-missing-state') });
                    return null;
                }

                // this.debug('starting ' + util.inspect(msg, { colors: true, compact: 10, breakLength: Infinity }));
                // this.debug('self ' + util.inspect(this, { colors: true, compact: 10, breakLength: Infinity }));
                node.debug('test 00');
                if (!node.flushMsgs.type !== 'none') {
                    try {
                        const result = RED.util.getMessageProperty(msg, node.flushMsgs.value);
                        if (result == node.flushMsgsValue) { // eslint-disable-line eqeqeq
                            node.debug(`flush queue control property ${node.flushMsgs.value}=${result}`);
                            flushEntireQueue();
                            clearTimer();
                            const enqueue = RED.util.getMessageProperty(msg, node.enqueueMsg.value);
                            if (enqueue == node.enqueueMsgValue) { // eslint-disable-line eqeqeq
                                if (node.ctrlPropSet) {
                                    RED.util.setMessageProperty(msg, node.flushMsgs.value, node.ctrlPropValue, false);
                                }
                                addMsgToQueue(msg, done);
                                return null;
                            }
                            setStatus();
                            done();
                            return null;
                        }
                    } catch(_err) {
                        node.debug(_err);
                    }
                }
                node.debug('test 05');
                if (!node.dropMsgs.type !== 'none') {
                    node.debug('test 06');
                    try {
                        const result = RED.util.getMessageProperty(msg, node.dropMsgs.value);
                        if (result == node.dropMsgsValue) { // eslint-disable-line eqeqeq
                            node.debug(`flush queue control property ${node.dropMsgs.value}=${result}`);
                            dropEntireQueue();
                            clearTimer();
                            const enqueue = RED.util.getMessageProperty(msg, node.enqueueMsg.value);
                            if (enqueue == node.enqueueMsgValue) { // eslint-disable-line eqeqeq
                                if (node.ctrlPropSet) {
                                    RED.util.setMessageProperty(msg, node.dropMsgs.value, node.ctrlPropValue, false);
                                }
                                addMsgToQueue(msg, done);
                                return null;
                            }
                            setStatus();
                            done();
                            return null;
                        }
                    } catch(_err) {
                        node.debug(_err);
                    }
                }
                node.debug('test 1');
                addMsgToQueue(msg, done);
                return null;
            } catch (err) {
                node.debug('test catch');
                node.log(err.message);
                node.log(util.inspect(err, Object.getOwnPropertyNames(err)));
                node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.error-title') });
                done('internal error delay-until until:' + err.message, msg);
            }
            return null;
        });

        node.on('close', () => {
            clearTimer();
        });

        /**
        * @typedef {Object} queueObject
        * @property {*} msg - the message to send
        * @property {*} done - the done function
        */

        /**
         * get the Data for compare Date
         * @param {number} comparetype - type of compare
         * @param {*} msg - message object
         * @param {*} node - node object
         * @returns {*} Date value
         */
        function getIntDate(comparetype, msg, node) {
            let id = '';
            let value = '';
            switch (comparetype) {
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
                default:
                    return new Date();
            }
            node.debug('compare time to ' + id + ' = "' + value + '"');
            const dto = new Date(value);
            if (hlp.isValidDate(dto)) {
                return dto;
            }
            node.error('Error can not get a valid timestamp from ' + id + '="' + value + '"! Will use current timestamp!');
            return new Date();
        }

        /**
         * clears all tmers
         */
        function clearTimer() {
            if (node.delayTimer) {
                node.debug('clear timer');
                clearTimeout(node.delayTimer);
                delete node.delayTimer;
                delete node.nextTime;
            }
        }

        /**
         * send all messages in queue
         */
        function flushEntireQueue() {
            node.debug('flushEntireQueue - Flush all queued messages');

            while (node.msgQueue.length > 0) {
                const item = node.msgQueue.shift();
                node.send(item.msg);
                item.done();
            }
        }

        /**
         * drop all messages from queue
         */
        function dropEntireQueue() {
            node.debug('dropEntireQueue - Drop all queued messages');
            while (node.msgQueue.length > 0) {
                const item = node.msgQueue.shift();
                item.done();
            }
        }

        /**
         * get the schedule time
         * @param {queueObject} qObj - message queue Object
         * @returns {boolean} returns true if ok
         */
        function recalcTimeOut(qObj) {
            if (node.delayTimer) {
                clearTimer();
            }
            const dNow = getIntDate(node.tsCompare, qObj.msg, node);
            node.nextTime = node.positionConfig.getTimeProp(node, qObj.msg, node.timeData, dNow);
            if (node.nextTime.error) {
                node.debug('node.nextTime=' + util.inspect(node.nextTime, { colors: true, compact: 10, breakLength: Infinity }));
                hlp.handleError(node, node.nextTime.error, null, 'could not evaluate time');
                return;
            }
            let millisec = node.nextTime.value.valueOf() - dNow.valueOf();
            node.debug(`set timeout to ${node.nextTime.value.valueOf()} - ${dNow.valueOf()}`);
            while (millisec < 1) {
                millisec += 86400000; // 24h
            }
            if (millisec > 345600000) {
                // there is a limitation of nodejs that the maximum setTimeout time
                // should not more then 2147483647 ms (24.8 days).
                millisec = Math.min((millisec - 129600000), 2147483646);
                // node.debug('next inject is far far away, plan a inject time recalc in ' + millisec + ' ms');
                node.delayTimer = setTimeout(() => {
                    delete node.delayTimer;
                    recalcTimeOut(qObj);
                }, millisec); // 1,5 days before
                node.nextTime.intermedia = true;
            } else {
                node.debug('set timeout to ' + millisec);
                node.delayTimer = setTimeout(() => {
                    delete node.delayTimer;
                    flushEntireQueue();
                    setStatus();
                }, millisec);
            }
            setStatus();
        }

        /**
         * adds a new message tot he queue
         * @param {*} msg - message object
         * @param {*} done - done object
         */
        function addMsgToQueue(msg, done) {
            if (node.queuingBehavior === 'first' && node.msgQueue.length > 0) {
                done();
                return;
            }
            if (node.queuingBehavior === 'last') {
                dropEntireQueue();
            }
            node.debug('test 3');
            const qObj = {msg, done};
            node.msgQueue.push(qObj);
            node.debug('test 4');
            if (!node.delayTimer || node.timeData.calcByMsg) {
                recalcTimeOut(qObj);
            }
            setStatus();
        }

        /**
         * adds a new message tot he queue
         * @param {*} msg - message object
         * @param {*} done - done object
         */
        function setStatus() {
            if (node.msgQueue.length > 0) {
                try {
                    if (node.nextTime) {
                        node.debug('set state ' + util.inspect(node.nextTime, { colors: true, compact: 10, breakLength: Infinity }));
                        if (node.nextTime.error ) {
                            node.status({fill: 'red', shape: 'ring', text: node.nextTime.error });
                        } else if (node.nextTime.intermedia) {
                            node.status({
                                fill: 'yellow',
                                shape: 'dot',
                                text: RED._('delay-until.state.intermedia', {
                                    queueLength:    node.msgQueue.length,
                                    sendTime:       node.positionConfig.toDateTimeString(node.nextTime.value)
                                })
                            });
                        } else {
                            node.status({
                                fill: 'green',
                                shape: 'dot',
                                text: RED._('delay-until.state.default', {
                                    queueLength:    node.msgQueue.length,
                                    sendTime:       node.positionConfig.toDateTimeString(node.nextTime.value)
                                })
                            });
                        }
                    } else {
                        node.status({
                            fill: 'green',
                            shape: 'dot',
                            text: RED._('delay-until.state.noTime', {
                                queueLength:    node.msgQueue.length
                            })
                        });
                    }
                } catch(_err) {
                    node.error(_err.message);
                    node.status({fill: 'red', shape: 'dot', text: RED._('node-red-contrib-sun-position/position-config:errors.error-title') });
                }
            } else {
                node.status({});
            }
        }
        node.status({});
        return null;
    }

    RED.nodes.registerType('rdg-delay-until', rdgDelayUntilNode);
};