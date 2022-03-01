/* eslint-disable no-template-curly-in-string */
/* eslint-disable require-jsdoc */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-vars */
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
/* global Context context describe beforeEach before afterEach after it */

/**
 * Test cases for delay until node
 *
 * @example:
 * to run all tests: npm test
 * to run only testcases: npm run testnode
 * to run single test: mocha -g "test configuration"
 */

const should = require('should');
const sinon = require('sinon');
require('should-sinon');

const helper = require('node-red-node-test-helper');

// Nodes
const nodeConfig = require('../nodes/10-position-config.js');
const nodeDelayUntil = require('../nodes/22-delay-until.js');

helper.init(require.resolve('node-red'));

const credentials = {'nc1': {'posLatitude': '51.16406769771653', 'posLongitude': '10.447609909242438'}};
const cfgNode = {
    id: 'nc1',
    type: 'position-config',
    name: 'Mitte von Deutschland',
    isValide: 'true',
    angleType: 'deg',
    timeZoneOffset: '99',
    timeZoneDST: '0',
    stateTimeFormat: '3',
    stateDateFormat: '12',
    contextStore: ''
};
const tabNode = {id: 'flow', type: 'tab', label: 'FLOW' };
const hlpNode = {id: 'n2', type: 'helper'};

describe('delay until node', function() {
    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload().then(function () {
            helper.stopServer(done);
        });
    });

    describe('test configuration (delay until)', function() {
        it('fail if missing configuration ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    name: 'delayuntil',
                    positionConfig: '',
                    time: '10:00',
                    timeType: 'entered',
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                const n1 = helper.getNode('n1'); // delay until node
                const n2 = helper.getNode('n2'); // helper node
                try {
                    n1.status.should.be.calledOnce();
                    n1.error.should.be.calledOnce().and.calledWith('node-red-contrib-sun-position/position-config:errors.config-missing');
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('fail if latitude missing ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '10:00',
                    timeType: 'entered',
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [[]]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLongitude': '10'}};
            helper.load([nodeConfig, nodeDelayUntil], flow, invalidCreds, function() {
                const n1 = helper.getNode('n1');
                const nc1 = helper.getNode('nc1');
                try {
                    n1.status.should.be.called();
                    n1.error.should.be.called().and.calledWith('position-config.errors.latitude-missing');
                    nc1.error.should.be.called();
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('fail if longitude missing ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '10:00',
                    timeType: 'entered',
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [[]]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '5'}};
            helper.load([nodeConfig, nodeDelayUntil], flow, invalidCreds, function() {
                const n1 = helper.getNode('n1');
                const nc1 = helper.getNode('nc1');
                try {
                    n1.status.should.be.called();
                    n1.error.should.be.called().and.calledWith('position-config.errors.longitude-missing');
                    nc1.error.should.be.called();
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('fail if latitude invalid ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '10:00',
                    timeType: 'entered',
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [[]]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '90.1',  'posLongitude': '10'}};
            helper.load([nodeConfig, nodeDelayUntil], flow, invalidCreds, function() {
                const n1 = helper.getNode('n1');
                const nc1 = helper.getNode('nc1');
                try {
                    n1.status.should.be.called();
                    n1.error.should.be.called().and.calledWith('position-config.errors.latitude-missing');
                    nc1.error.should.be.called();
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('fail if longitude invalid ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '10:00',
                    timeType: 'entered',
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [[]]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '51', 'posLongitude': '180.1'}};
            helper.load([nodeConfig, nodeDelayUntil], flow, invalidCreds, function() {
                const n1 = helper.getNode('n1');
                const nc1 = helper.getNode('nc1');
                try {
                    n1.status.should.be.called();
                    n1.error.should.be.called().and.calledWith('position-config.errors.longitude-missing');
                    nc1.error.should.be.called();
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('test if correctly loaded', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '10:00',
                    timeType: 'entered',
                    offset: 0,
                    offsetType: 'none',
                    offsetMultiplier: 60000,
                    queuingBehavior: 'all',
                    flushMsgs: '',
                    flushMsgsType: 'none',
                    flushMsgsValue: 'true',
                    flushMsgsValueType: 'bool',
                    dropMsgs: '',
                    dropMsgsType: 'none',
                    dropMsgsValue: 'true',
                    dropMsgsValueType: 'bool',
                    enqueueMsg: '',
                    enqueueMsgType: 'none',
                    enqueueMsgValue: 'true',
                    enqueueMsgValueType: 'bool',
                    ctrlPropChange: false,
                    ctrlPropValue: '',
                    ctrlPropValueType: 'delete',
                    tsCompare: '0',
                    wires: [[]]
                }, cfgNode];

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                const n1 = helper.getNode('n1');
                try {
                    n1.status.should.be.calledOnce();
                    // should.not.exist(err);
                    // should.exist(n1);
                    n1.should.have.property('name', 'delayuntil');
                    n1.should.have.property('type', 'rdg-delay-until');
                    n1.should.have.property('positionConfig');
                    n1.should.have.property('timeData');
                    n1.timeData.should.have.property('type', 'entered');
                    n1.timeData.should.have.property('value', '10:00');
                    n1.timeData.should.have.property('offsetType', 'none');
                    n1.timeData.should.have.property('offset', 0);
                    n1.timeData.should.have.property('multiplier', 60000);
                    n1.timeData.should.have.property('next', true);
                    // msg.payload.should.have.keys('next', 'last');
                    n1.should.have.property('queuingBehavior', 'all');
                    n1.should.not.have.property('flushMsgs');
                    n1.should.not.have.property('dropMsgs');
                    n1.should.not.have.property('enqueueMsg');
                    n1.should.not.have.property('ctrlProp');
                    n1.should.have.property('tsCompare', 0);
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('test if correctly loaded enhanced', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '10:00',
                    timeType: 'entered',
                    offset: 0,
                    offsetType: 'none',
                    offsetMultiplier: 60000,
                    queuingBehavior: 'all',
                    flushMsgs: 'flush',
                    flushMsgsType: 'msg',
                    flushMsgsValue: 'true',
                    flushMsgsValueType: 'bool',
                    dropMsgs: 'drop',
                    dropMsgsType: 'msg',
                    dropMsgsValue: 'true',
                    dropMsgsValueType: 'bool',
                    enqueueMsg: 'enqueue',
                    enqueueMsgType: 'msg',
                    enqueueMsgValue: 'true',
                    enqueueMsgValueType: 'bool',
                    ctrlPropChange: true,
                    ctrlPropValue: '',
                    ctrlPropValueType: 'delete',
                    tsCompare: '0',
                    wires: [[]]
                }, cfgNode];

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                const n1 = helper.getNode('n1');
                try {
                    n1.status.should.be.calledOnce();
                    // should.not.exist(err);
                    // should.exist(n1);
                    n1.should.have.property('name', 'delayuntil');
                    n1.should.have.property('type', 'rdg-delay-until');
                    n1.should.have.property('positionConfig');
                    n1.should.have.property('timeData');
                    n1.timeData.should.have.property('type', 'entered');
                    n1.timeData.should.have.property('value', '10:00');
                    n1.timeData.should.have.property('offsetType', 'none');
                    n1.timeData.should.have.property('offset', 0);
                    n1.timeData.should.have.property('multiplier', 60000);
                    n1.timeData.should.have.property('next', true);
                    // msg.payload.should.have.keys('next', 'last');
                    n1.should.have.property('queuingBehavior', 'all');
                    n1.should.have.property('flushMsgs');
                    n1.flushMsgs.should.have.property('type', 'msg');
                    n1.flushMsgs.should.have.property('value', 'flush');
                    n1.flushMsgs.should.have.property('compare', true);
                    n1.should.have.property('dropMsgs');
                    n1.dropMsgs.should.have.property('type', 'msg');
                    n1.dropMsgs.should.have.property('value', 'drop');
                    n1.dropMsgs.should.have.property('compare', true);
                    n1.should.have.property('enqueueMsg');
                    n1.enqueueMsg.should.have.property('type', 'msg');
                    n1.enqueueMsg.should.have.property('value', 'enqueue');
                    n1.enqueueMsg.should.have.property('compare', true);
                    n1.should.have.property('ctrlProp');
                    n1.ctrlProp.should.have.property('type', 'delete');
                    n1.ctrlProp.should.have.property('value', '');
                    n1.should.have.property('tsCompare', 0);
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });
    });

    describe('test message queue (delay until)', function() {
        let clock = null;

        beforeEach(function() {
            clock = sinon.useFakeTimers({toFake: ['Date', 'setTimeout', 'clearTimeout']});
            // now:1577833200,
        });

        afterEach(function() {
            helper.unload();
            sinon.restore();
        });

        it('should delay message until specific time', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');
                    const n2 = helper.getNode('n2');

                    n2.on('input', function(msg) {
                        try {
                            msg.should.have.property('payload', 42);
                            msg.should.have.property('topic', 'test');
                            done();
                        } catch(err) {
                            console.log(msg);   // eslint-disable-line no-console
                            done(err);
                        }
                    });

                    n1.receive({payload: 42, topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    clock.tick(60000);  //  advance clock by 1 min
                    n1.msgQueue.should.have.length(0);
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should trigger at specified time with offset', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    offset: 1,
                    offsetType: 'num',
                    offsetMultiplier: 60000,
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');
                    const n2 = helper.getNode('n2');

                    n2.on('input', function(msg) {
                        try {
                            msg.should.have.property('payload', 'test with offset');
                            msg.should.have.property('topic', 'test');
                            done();
                        } catch(err) {
                            console.log(msg);   // eslint-disable-line no-console
                            done(err);
                        }
                    });

                    n1.receive({payload: 'test with offset', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 120000);
                    n1.msgQueue.should.have.length(1);
                    clock.tick(120000);  // advance clock by 2 mins
                    n1.msgQueue.should.have.length(0);
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should drop messages', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    dropMsgs: 'drop',
                    dropMsgsType: 'msg',
                    dropMsgsValue: 'true',
                    dropMsgsValueType: 'bool',
                    offsetType: 'none',
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');

                    n1.receive({payload: 'test1', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 'test2', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(2);
                    n1.receive({drop: true});
                    n1.msgQueue.should.have.length(0);
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should drop messages, if only first is stored', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    dropMsgs: 'drop',
                    dropMsgsType: 'msg',
                    dropMsgsValue: 'true',
                    dropMsgsValueType: 'bool',
                    offsetType: 'none',
                    queuingBehavior: 'first',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');

                    n1.receive({payload: 'test1', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 'test2', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({drop: true});
                    n1.msgQueue.should.have.length(0);
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should drop messages, if only last is stored', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    dropMsgs: 'drop',
                    dropMsgsType: 'msg',
                    dropMsgsValue: 'true',
                    dropMsgsValueType: 'bool',
                    offsetType: 'none',
                    queuingBehavior: 'last',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');

                    n1.receive({payload: 'test1', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 'test2', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({drop: true});
                    n1.msgQueue.should.have.length(0);
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should drop messages and re-enqueue', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    dropMsgs: 'drop',
                    dropMsgsType: 'msg',
                    dropMsgsValue: 'true',
                    dropMsgsValueType: 'bool',
                    enqueueMsg: 'enqueue',
                    enqueueMsgType: 'msg',
                    enqueueMsgValue: 'true',
                    enqueueMsgValueType: 'bool',
                    offsetType: 'none',
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');
                    const n2 = helper.getNode('n2');

                    n2.on('input', function(msg) {
                        try {
                            msg.should.have.property('topic', 'test');
                            msg.should.have.property('drop', true);
                            msg.should.have.property('enqueue', true);
                            done();
                        } catch(err) {
                            done(err);
                        }
                    });

                    n1.receive({payload: 'test1', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 'test2', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(2);
                    n1.receive({drop: true, enqueue: true, topic: 'test'});
                    n1.msgQueue.should.have.length(1);
                    clock.tick(60000);  // advance clock by 1 min
                    n1.msgQueue.should.have.length(0);
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should drop messagess and re-enqueue not matching', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    dropMsgs: 'drop',
                    dropMsgsType: 'msg',
                    dropMsgsValue: 'true',
                    dropMsgsValueType: 'bool',
                    enqueueMsg: 'enqueue',
                    enqueueMsgType: 'msg',
                    enqueueMsgValue: 'yes',
                    enqueueMsgValueType: 'str',
                    offsetType: 'none',
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');

                    n1.receive({payload: 'test1', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 'test2', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(2);
                    n1.receive({drop: true, enqueue: 'no'});
                    n1.msgQueue.should.have.length(0);
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should delete control properties for drop message', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    dropMsgs: 'drop',
                    dropMsgsType: 'msg',
                    dropMsgsValue: 'true',
                    dropMsgsValueType: 'bool',
                    enqueueMsg: 'enqueue',
                    enqueueMsgType: 'msg',
                    enqueueMsgValue: 'yes',
                    enqueueMsgValueType: 'str',
                    offsetType: 'none',
                    queuingBehavior: 'all',
                    ctrlPropChange: true,
                    ctrlPropValue: '',
                    ctrlPropValueType: 'delete',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');
                    const n2 = helper.getNode('n2');

                    n2.on('input', function(msg) {
                        try {
                            msg.should.not.have.property('drop');
                            msg.should.not.have.property('enqueue');
                            // msg.should.have.property('drop', 'false');
                            // msg.should.have.property('enqueue', 'false');
                            done();
                        } catch(err) {
                            done(err);
                        }
                    });

                    n1.receive({payload: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({drop: true, enqueue: 'yes'});
                    n1.msgQueue.should.have.length(1);
                    clock.tick(60000);  // advance clock by 1 min
                    n1.msgQueue.should.have.length(0);
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should flush messages', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    flushMsgs: 'flush',
                    flushMsgsType: 'msg',
                    flushMsgsValue: 'true',
                    flushMsgsValueType: 'bool',
                    offsetType: 'none',
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');
                    const n2 = helper.getNode('n2');
                    let msgCount = 0;

                    n2.on('input', function(msg){
                        try {
                            msgCount++;
                            msg.should.have.property('topic', 'test');
                            msg.should.have.property('payload', msgCount);
                            if (msgCount === 2) {
                                done();
                            }
                        } catch(err) {
                            done(err);
                        }
                    });

                    n1.receive({payload: 1, topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 2, topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(2);
                    n1.receive({flush: true});
                    n1.msgQueue.should.have.length(0);
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should flush messages and re-enqueue', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    flushMsgs: 'flush',
                    flushMsgsType: 'msg',
                    flushMsgsValue: 'true',
                    flushMsgsValueType: 'bool',
                    enqueueMsg: 'enqueue',
                    enqueueMsgType: 'msg',
                    enqueueMsgValue: 'true',
                    enqueueMsgValueType: 'bool',
                    offsetType: 'none',
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');
                    const n2 = helper.getNode('n2');
                    let msgCount = 0;

                    n2.on('input', function(msg) {
                        try {
                            msgCount++;
                            msg.should.have.property('topic', 'test');
                            if (msgCount < 3) {
                                msg.should.have.property('payload', 'test' + msgCount);
                            } else {
                                msg.should.have.property('flush', true);
                                msg.should.have.property('enqueue', true);
                                done();
                            }
                        } catch(err) {
                            done(err);
                        }
                    });

                    n1.receive({payload: 'test1', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 'test2', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(2);
                    n1.receive({flush: true, enqueue: true, topic: 'test'});
                    n1.msgQueue.should.have.length(1);
                    clock.tick(60000);  // advance clock by 1 min
                    n1.msgQueue.should.have.length(0);
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should flush messagess and re-enqueue not matching', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    flushMsgs: 'flush',
                    flushMsgsType: 'msg',
                    flushMsgsValue: 'true',
                    flushMsgsValueType: 'bool',
                    enqueueMsg: 'enqueue',
                    enqueueMsgType: 'msg',
                    enqueueMsgValue: 'yes',
                    enqueueMsgValueType: 'str',
                    offsetType: 'none',
                    queuingBehavior: 'all',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');
                    const n2 = helper.getNode('n2');
                    let msgCount = 0;

                    n2.on('input', function(msg) {
                        try {
                            msgCount++;
                            msg.should.have.property('topic', 'test');
                            if (msgCount < 3) {
                                msg.should.have.property('payload', 'test' + msgCount);
                            } else {
                                msg.should.have.property('flush', true);
                                msg.should.have.property('enqueue', true);
                                done();
                            }
                        } catch(err) {
                            done(err);
                        }
                    });

                    n1.receive({payload: 'test1', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 'test2', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(2);
                    n1.receive({flush: true, enqueue: 'no', topic: 'test'});
                    n1.msgQueue.should.have.length(0);
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should delete control properties for flush message', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    flushMsgs: 'flush',
                    flushMsgsType: 'msg',
                    flushMsgsValue: 'true',
                    flushMsgsValueType: 'bool',
                    enqueueMsg: 'enqueue',
                    enqueueMsgType: 'msg',
                    enqueueMsgValue: 'yes',
                    enqueueMsgValueType: 'str',
                    offsetType: 'none',
                    queuingBehavior: 'all',
                    ctrlPropChange: true,
                    ctrlPropValue: '',
                    ctrlPropValueType: 'delete',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');
                    const n2 = helper.getNode('n2');
                    let msgCount = 0;

                    n2.on('input', function(msg) {
                        try {
                            msgCount++;
                            msg.should.have.property('topic', 'test');
                            msg.should.have.property('payload', 'test' + msgCount);
                            msg.should.not.have.property('flush');
                            msg.should.not.have.property('enqueue');
                            if (msgCount >= 3) {
                                done();
                            }
                        } catch(err) {
                            done(err);
                        }
                    });
                    n1.receive({payload: 'test1', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 'test2', topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(2);
                    n1.receive({flush: true, enqueue: 'yes', topic: 'test', payload: 'test3'});
                    n1.msgQueue.should.have.length(1);
                    clock.tick(60000);  // advance clock by 1 min
                    n1.msgQueue.should.have.length(0);
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should delay only last message', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    offsetType: 'none',
                    queuingBehavior: 'last',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');
                    const n2 = helper.getNode('n2');

                    n2.on('input', function(msg){
                        try {
                            msg.should.have.property('topic', 'test');
                            msg.should.have.property('payload', 3);
                            done();
                        } catch(err) {
                            done(err);
                        }
                    });

                    n1.receive({payload: 1, topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 2, topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 3, topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    clock.tick(60000);  // advance clock by 1 min
                    n1.msgQueue.should.have.length(0);
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should flush last message', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    flushMsgs: 'flush',
                    flushMsgsType: 'msg',
                    flushMsgsValue: 'true',
                    flushMsgsValueType: 'bool',
                    offsetType: 'none',
                    queuingBehavior: 'last',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');
                    const n2 = helper.getNode('n2');

                    n2.on('input', function(msg){
                        try {
                            msg.should.have.property('topic', 'test');
                            msg.should.have.property('payload', 2);
                            done();
                        } catch(err) {
                            done(err);
                        }
                    });

                    n1.receive({payload: 1, topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 2, topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({flush: true});
                    n1.msgQueue.should.have.length(0);
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should delay only first message', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'rdg-delay-until',
                    z: 'flow',
                    name: 'delayuntil',
                    positionConfig: 'nc1',
                    time: '00:01 utc',
                    timeType: 'entered',
                    offsetType: 'none',
                    queuingBehavior: 'first',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            sinon.spy(clock, 'setTimeout');

            helper.load([nodeConfig, nodeDelayUntil], flow, credentials, function() {
                try {
                    const n1 = helper.getNode('n1');
                    const n2 = helper.getNode('n2');

                    n2.on('input', function(msg){
                        try {
                            msg.should.have.property('topic', 'test');
                            msg.should.have.property('payload', 1);
                            done();
                        } catch(err) {
                            done(err);
                        }
                    });

                    n1.receive({payload: 1, topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 2, topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    n1.receive({payload: 3, topic: 'test'});
                    clock.setTimeout.should.be.calledWith(sinon.match.any, 60000);
                    n1.msgQueue.should.have.length(1);
                    clock.tick(60000);  // advance clock by 1 min
                    n1.msgQueue.should.have.length(0);
                } catch(err) {
                    done(err);
                }
            });
        });
    });
});