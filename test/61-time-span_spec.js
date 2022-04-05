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
 * to run single test: mocha -g "time-span"
 */

const should = require('should');
const sinon = require('sinon');
require('should-sinon');

const helper = require('node-red-node-test-helper');

// Nodes
const nodeConfig = require('../nodes/10-position-config.js');
const nodeTimeSpan = require('../nodes/61-time-span.js');

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
const hlpNode1 = {id: 'n2', type: 'helper'};
const hlpNode2 = {id: 'n3', type: 'helper'};

describe('time-span node', function() {
    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload().then(function () {
            helper.stopServer(done);
        });
    });

    describe('test configuration (time-span)', function() {
        it('fail if missing configuration ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-span',
                    outputs: 1,
                    name: '',
                    positionConfig: '',
                    operand1: '',
                    operand1Type: 'date',
                    operand1Format: '0',
                    operand1Offset: 0,
                    operand1OffsetType: 'none',
                    operand1OffsetMultiplier: 60000,
                    operand2: 'payload',
                    operand2Type: 'msg',
                    operand2Format: 'dd.MM.yyyy HH:mm:ss',
                    operand2Offset: 0,
                    operand2OffsetType: 'none',
                    operand2OffsetMultiplier: 60000,
                    rules: [],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'timespan',
                        o: '',
                        oT: 'none',
                        oM: '60000',
                        fTs: 1,
                        fTsS: 1,
                        fTsT: 'Sekunden',
                        fTsI: '1',
                        f: 0,
                        fS: 0,
                        fT: 'Millisekunden UNIX-Zeit',
                        fI: '0',
                        next: false,
                        days: '',
                        months: '',
                        onlyEvenDays: false,
                        onlyOddDays: false
                    }],
                    wires: [['n2']]
                }, cfgNode, hlpNode1];
            helper.load([nodeConfig, nodeTimeSpan], flow, credentials, function() {
                const n1 = helper.getNode('n1'); // time-comp node
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
                    type: 'time-span',
                    outputs: 1,
                    name: '',
                    positionConfig: 'nc1',
                    operand1: '',
                    operand1Type: 'date',
                    operand1Format: '0',
                    operand1Offset: 0,
                    operand1OffsetType: 'none',
                    operand1OffsetMultiplier: 60000,
                    operand2: 'payload',
                    operand2Type: 'msg',
                    operand2Format: 'dd.MM.yyyy HH:mm:ss',
                    operand2Offset: 0,
                    operand2OffsetType: 'none',
                    operand2OffsetMultiplier: 60000,
                    rules: [],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'timespan',
                        o: '',
                        oT: 'none',
                        oM: '60000',
                        fTs: 1,
                        fTsS: 1,
                        fTsT: 'Sekunden',
                        fTsI: '1',
                        f: 0,
                        fS: 0,
                        fT: 'Millisekunden UNIX-Zeit',
                        fI: '0',
                        next: false,
                        days: '',
                        months: '',
                        onlyEvenDays: false,
                        onlyOddDays: false
                    }],
                    wires: [['n2']]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLongitude': '10'}};
            helper.load([nodeConfig, nodeTimeSpan], flow, invalidCreds, function() {
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
                    type: 'time-span',
                    outputs: 1,
                    name: '',
                    positionConfig: 'nc1',
                    operand1: '',
                    operand1Type: 'date',
                    operand1Format: '0',
                    operand1Offset: 0,
                    operand1OffsetType: 'none',
                    operand1OffsetMultiplier: 60000,
                    operand2: 'payload',
                    operand2Type: 'msg',
                    operand2Format: 'dd.MM.yyyy HH:mm:ss',
                    operand2Offset: 0,
                    operand2OffsetType: 'none',
                    operand2OffsetMultiplier: 60000,
                    rules: [],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'timespan',
                        o: '',
                        oT: 'none',
                        oM: '60000',
                        fTs: 1,
                        fTsS: 1,
                        fTsT: 'Sekunden',
                        fTsI: '1',
                        f: 0,
                        fS: 0,
                        fT: 'Millisekunden UNIX-Zeit',
                        fI: '0',
                        next: false,
                        days: '',
                        months: '',
                        onlyEvenDays: false,
                        onlyOddDays: false
                    }],
                    wires: [['n2']]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '5'}};
            helper.load([nodeConfig, nodeTimeSpan], flow, invalidCreds, function() {
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
                    type: 'time-span',
                    outputs: 1,
                    name: '',
                    positionConfig: 'nc1',
                    operand1: '',
                    operand1Type: 'date',
                    operand1Format: '0',
                    operand1Offset: 0,
                    operand1OffsetType: 'none',
                    operand1OffsetMultiplier: 60000,
                    operand2: 'payload',
                    operand2Type: 'msg',
                    operand2Format: 'dd.MM.yyyy HH:mm:ss',
                    operand2Offset: 0,
                    operand2OffsetType: 'none',
                    operand2OffsetMultiplier: 60000,
                    rules: [],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'timespan',
                        o: '',
                        oT: 'none',
                        oM: '60000',
                        fTs: 1,
                        fTsS: 1,
                        fTsT: 'Sekunden',
                        fTsI: '1',
                        f: 0,
                        fS: 0,
                        fT: 'Millisekunden UNIX-Zeit',
                        fI: '0',
                        next: false,
                        days: '',
                        months: '',
                        onlyEvenDays: false,
                        onlyOddDays: false
                    }],
                    wires: [['n2']]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '90.1',  'posLongitude': '10'}};
            helper.load([nodeConfig, nodeTimeSpan], flow, invalidCreds, function() {
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
                    type: 'time-span',
                    outputs: 1,
                    name: '',
                    positionConfig: 'nc1',
                    operand1: '',
                    operand1Type: 'date',
                    operand1Format: '0',
                    operand1Offset: 0,
                    operand1OffsetType: 'none',
                    operand1OffsetMultiplier: 60000,
                    operand2: 'payload',
                    operand2Type: 'msg',
                    operand2Format: 'dd.MM.yyyy HH:mm:ss',
                    operand2Offset: 0,
                    operand2OffsetType: 'none',
                    operand2OffsetMultiplier: 60000,
                    rules: [],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'timespan',
                        o: '',
                        oT: 'none',
                        oM: '60000',
                        fTs: 1,
                        fTsS: 1,
                        fTsT: 'Sekunden',
                        fTsI: '1',
                        f: 0,
                        fS: 0,
                        fT: 'Millisekunden UNIX-Zeit',
                        fI: '0',
                        next: false,
                        days: '',
                        months: '',
                        onlyEvenDays: false,
                        onlyOddDays: false
                    }],
                    wires: [['n2']]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '51', 'posLongitude': '180.1'}};
            helper.load([nodeConfig, nodeTimeSpan], flow, invalidCreds, function() {
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
                    type: 'time-span',
                    outputs: 1,
                    name: 'time span',
                    positionConfig: 'nc1',
                    operand1: '',
                    operand1Type: 'date',
                    operand1Format: '0',
                    operand1Offset: 0,
                    operand1OffsetType: 'none',
                    operand1OffsetMultiplier: 60000,
                    operand2: 'payload',
                    operand2Type: 'msg',
                    operand2Format: 'dd.MM.yyyy HH:mm:ss',
                    operand2Offset: 0,
                    operand2OffsetType: 'none',
                    operand2OffsetMultiplier: 60000,
                    rules: [],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'timespan',
                        o: '',
                        oT: 'none',
                        oM: '60000',
                        fTs: 1,
                        fTsS: 1,
                        fTsT: 'Sekunden',
                        fTsI: '1',
                        f: 0,
                        fS: 0,
                        fT: 'Millisekunden UNIX-Zeit',
                        fI: '0',
                        next: false,
                        days: '',
                        months: '',
                        onlyEvenDays: false,
                        onlyOddDays: false
                    }],
                    wires: [['n2']]
                }, cfgNode];

            helper.load([nodeConfig, nodeTimeSpan], flow, credentials, function() {
                const n1 = helper.getNode('n1');
                try {
                    n1.status.should.be.calledOnce();
                    // should.not.exist(err);
                    // should.exist(n1);
                    n1.should.have.property('name', 'time span');
                    n1.should.have.property('type', 'time-span');
                    n1.should.have.property('positionConfig');

                    n1.should.have.property('operand1');
                    n1.operand1.should.have.property('type', 'date');
                    n1.operand1.should.have.property('value', '');
                    n1.operand1.should.have.property('format', '0');
                    n1.operand1.should.have.property('offsetType', 'none');
                    n1.operand1.should.have.property('offset', 0);
                    n1.operand1.should.have.property('multiplier', 60000);

                    n1.should.have.property('operand2');
                    n1.operand2.should.have.property('type', 'msg');
                    n1.operand2.should.have.property('value', 'payload');
                    n1.operand2.should.have.property('format', 'dd.MM.yyyy HH:mm:ss');
                    n1.operand2.should.have.property('offsetType', 'none');
                    n1.operand2.should.have.property('offset', 0);
                    n1.operand2.should.have.property('multiplier', 60000);

                    n1.should.have.property('rules');
                    n1.should.have.property('checkall', true);

                    n1.should.have.property('results');
                    n1.results.should.be.an.Array().length(1);
                    n1.results[0].should.have.property('outType', 'msgPayload');
                    n1.results[0].should.have.property('outValue', '');
                    n1.results[0].should.have.property('type', 'timespan');
                    n1.results[0].should.have.property('value', '');
                    n1.results[0].should.have.property('format', 0);
                    n1.results[0].should.have.property('offsetType', 'none');
                    n1.results[0].should.have.property('offset', '');
                    n1.results[0].should.have.property('multiplier', 60000);
                    n1.results[0].should.have.property('next', false);
                    n1.results[0].should.have.property('days');
                    n1.results[0].should.have.property('months');
                    n1.results[0].should.have.property('onlyEvenDays', false);
                    n1.results[0].should.have.property('onlyOddDays', false);
                    n1.results[0].should.have.property('onlyEvenWeeks', false);
                    n1.results[0].should.have.property('onlyOddWeeks', false);
                    /* */
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });
    });

    describe('test message passing', function() {
        it('test basic message passing', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-span',
                    z: 'flow',
                    outputs: 2,
                    name: 'timeDifferenz',
                    positionConfig: 'nc1',
                    operand1: '2021-02-21 00:00:00',
                    operand1Type: 'dateEntered',
                    operand1Format: '0',
                    operand1Offset: 0,
                    operand1OffsetType: 'none',
                    operand1OffsetMultiplier: 60000,
                    operand2: 'payload',
                    operand2Type: 'msg',
                    operand2Format: 'dd.MM.yyyy HH:mm:ss',
                    operand2Offset: 0,
                    operand2OffsetType: 'none',
                    operand2OffsetMultiplier: 60000,
                    rules: [{
                        operator: '4',
                        operatorText: '>=     (greater or equal)',
                        operandType: 'num',
                        operandValue: '10',
                        multiplier: '3600000'
                    }],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'timespan',
                        fTs: 1
                    },{
                        p: '',
                        pt: 'msgTopic',
                        v: 'test-topic',
                        vt: 'str'
                    }],
                    wires: [['n2'],['n3']]
                }, cfgNode, hlpNode1, hlpNode2, tabNode];

            helper.load([nodeConfig, nodeTimeSpan], flow, credentials, function() {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2'); // helper node
                const n3 = helper.getNode('n3'); // helper node
                try {
                    n1.status.should.be.calledOnce();
                    // should.not.exist(err);
                    // should.exist(n1);
                    n1.should.have.property('name', 'timeDifferenz');
                    n1.should.have.property('type', 'time-span');
                    n1.should.have.property('positionConfig');
                    let doneCnt =0;
                    n2.on('input', function (msg) {
                        try {
                            msg.should.have.property('topic', 'test-topic');
                            msg.should.have.property('payload', 36000);
                            doneCnt++;
                            if (doneCnt>1)
                                done();
                        } catch (err) {
                            done(err);
                        }
                    });
                    n3.on('input', function (msg) {
                        try {
                            msg.should.have.property('topic', 'test-topic');
                            msg.should.have.property('payload', 36000);
                            doneCnt++;
                            if (doneCnt>1)
                                done();
                        } catch (err) {
                            done(err);
                        }
                    });
                    n1.receive({payload:'20.02.2021 14:00:00'});
                } catch(err) {
                    done(err);
                }
            });
        });

        it('test needs to be implemented', function() {
            this.skip();
        });
    });

});