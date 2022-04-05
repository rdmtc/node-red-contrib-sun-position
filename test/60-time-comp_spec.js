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
 * to run single test: mocha -g "time-comp"
 */

const should = require('should');
const sinon = require('sinon');
require('should-sinon');

const helper = require('node-red-node-test-helper');

// Nodes
const nodeConfig = require('../nodes/10-position-config.js');
const nodeTimeCompare = require('../nodes/60-time-comp.js');

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

describe('time-comp node', function() {
    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload().then(function () {
            helper.stopServer(done);
        });
    });

    describe('test configuration (time-comp)', function() {
        it('fail if missing configuration ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-comp',
                    outputs: 1,
                    name: '',
                    positionConfig: '',
                    input: 'payload',
                    inputType: 'msgPayload',
                    inputFormat: '0',
                    inputNext: false,
                    inputOffset: 0,
                    inputOffsetType: 'none',
                    inputOffsetMultiplier: 60000,
                    rules: [],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'input',
                        o: '',
                        oT: 'none',
                        oM: '60000',
                        f: 0,
                        fS: 0,
                        fT: 'Millisekunden UNIX-Zeit',
                        fI: '0',
                        next: true,
                        days: '',
                        months: '',
                        onlyEvenDays: false,
                        onlyOddDays: false,
                        onlyEvenWeeks: false,
                        onlyOddWeeks: false
                    }],
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeCompare], flow, credentials, function() {
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
                    type: 'time-comp',
                    outputs: 1,
                    name: '',
                    positionConfig: 'nc1',
                    input: 'payload',
                    inputType: 'msgPayload',
                    inputFormat: '0',
                    inputNext: false,
                    inputOffset: 0,
                    inputOffsetType: 'none',
                    inputOffsetMultiplier: 60000,
                    rules: [],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'input',
                        o: '',
                        oT: 'none',
                        oM: '60000',
                        f: 0,
                        fS: 0,
                        fT: 'Millisekunden UNIX-Zeit',
                        fI: '0',
                        next: true,
                        days: '',
                        months: '',
                        onlyEvenDays: false,
                        onlyOddDays: false,
                        onlyEvenWeeks: false,
                        onlyOddWeeks: false
                    }],
                    wires: [['n2']]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLongitude': '10'}};
            helper.load([nodeConfig, nodeTimeCompare], flow, invalidCreds, function() {
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
                    type: 'time-comp',
                    outputs: 1,
                    name: '',
                    positionConfig: 'nc1',
                    input: 'payload',
                    inputType: 'msgPayload',
                    inputFormat: '0',
                    inputNext: false,
                    inputOffset: 0,
                    inputOffsetType: 'none',
                    inputOffsetMultiplier: 60000,
                    rules: [],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'input',
                        o: '',
                        oT: 'none',
                        oM: '60000',
                        f: 0,
                        fS: 0,
                        fT: 'Millisekunden UNIX-Zeit',
                        fI: '0',
                        next: true,
                        days: '',
                        months: '',
                        onlyEvenDays: false,
                        onlyOddDays: false,
                        onlyEvenWeeks: false,
                        onlyOddWeeks: false
                    }],
                    wires: [['n2']]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '5'}};
            helper.load([nodeConfig, nodeTimeCompare], flow, invalidCreds, function() {
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
                    type: 'time-comp',
                    outputs: 1,
                    name: '',
                    positionConfig: 'nc1',
                    input: 'payload',
                    inputType: 'msgPayload',
                    inputFormat: '0',
                    inputNext: false,
                    inputOffset: 0,
                    inputOffsetType: 'none',
                    inputOffsetMultiplier: 60000,
                    rules: [],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'input',
                        o: '',
                        oT: 'none',
                        oM: '60000',
                        f: 0,
                        fS: 0,
                        fT: 'Millisekunden UNIX-Zeit',
                        fI: '0',
                        next: true,
                        days: '',
                        months: '',
                        onlyEvenDays: false,
                        onlyOddDays: false,
                        onlyEvenWeeks: false,
                        onlyOddWeeks: false
                    }],
                    wires: [['n2']]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '90.1',  'posLongitude': '10'}};
            helper.load([nodeConfig, nodeTimeCompare], flow, invalidCreds, function() {
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
                    type: 'time-comp',
                    outputs: 1,
                    name: '',
                    positionConfig: 'nc1',
                    input: 'payload',
                    inputType: 'msgPayload',
                    inputFormat: '0',
                    inputNext: false,
                    inputOffset: 0,
                    inputOffsetType: 'none',
                    inputOffsetMultiplier: 60000,
                    rules: [],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'input',
                        o: '',
                        oT: 'none',
                        oM: '60000',
                        f: 0,
                        fS: 0,
                        fT: 'Millisekunden UNIX-Zeit',
                        fI: '0',
                        next: true,
                        days: '',
                        months: '',
                        onlyEvenDays: false,
                        onlyOddDays: false,
                        onlyEvenWeeks: false,
                        onlyOddWeeks: false
                    }],
                    wires: [['n2']]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '51', 'posLongitude': '180.1'}};
            helper.load([nodeConfig, nodeTimeCompare], flow, invalidCreds, function() {
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
                    type: 'time-comp',
                    outputs: 1,
                    name: 'time compare',
                    positionConfig: 'nc1',
                    input: 'payload',
                    inputType: 'msgPayload',
                    inputFormat: '0',
                    inputNext: false,
                    inputOffset: 0,
                    inputOffsetType: 'none',
                    inputOffsetMultiplier: 60000,
                    rules: [],
                    checkall: 'true',
                    results: [{
                        p: '',
                        pt: 'msgPayload',
                        v: '',
                        vt: 'input',
                        o: '',
                        oT: 'none',
                        oM: '60000',
                        f: 0,
                        fS: 0,
                        fT: 'Millisekunden UNIX-Zeit',
                        fI: '0',
                        next: true,
                        days: '',
                        months: '',
                        onlyEvenDays: false,
                        onlyOddDays: false,
                        onlyEvenWeeks: false,
                        onlyOddWeeks: false
                    }],
                    wires: [['n2']]
                }, cfgNode];

            helper.load([nodeConfig, nodeTimeCompare], flow, credentials, function() {
                const n1 = helper.getNode('n1');
                try {
                    n1.status.should.be.calledOnce();
                    // should.not.exist(err);
                    // should.exist(n1);
                    n1.should.have.property('name', 'time compare');
                    n1.should.have.property('type', 'time-comp');
                    n1.should.have.property('positionConfig');

                    n1.should.have.property('input');
                    n1.input.should.have.property('type', 'msgPayload');
                    n1.input.should.have.property('value', 'payload');
                    n1.input.should.have.property('format', '0');
                    n1.input.should.have.property('offsetType', 'none');
                    n1.input.should.have.property('offset', 0);
                    n1.input.should.have.property('multiplier', 60000);
                    n1.input.should.have.property('next', false);
                    n1.should.have.property('rules');
                    n1.should.have.property('checkall', true);
                    n1.should.have.property('results');
                    n1.should.property('results');
                    n1.results.should.be.an.Array().length(1);
                    n1.results[0].should.have.property('outType', 'msgPayload');
                    n1.results[0].should.have.property('outValue', '');
                    n1.results[0].should.have.property('type', 'input');
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

                    done();
                } catch(err) {
                    done(err);
                }
            });
        });
        /*
        it('test if correctly loaded (enhanced)', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'within-time-switch',
                    name: 'time switch',
                    nameInt: '',
                    positionConfig: 'nc1',
                    startTime: '10:00',
                    startTimeType: 'entered',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    endTime: '12:00',
                    endTimeType: 'entered',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    timeRestrictions: 0,
                    timeRestrictionsType: 'none',
                    timeDays: '*',
                    timeOnlyOddDays: false,
                    timeOnlyEvenDays: false,
                    timeOnlyOddWeeks: false,
                    timeOnlyEvenWeeks: false,
                    timeMonths: '*',
                    timedatestart: '',
                    timedateend: '',
                    propertyStart: 'altStart',
                    propertyStartType: 'msg',
                    propertyStartCompare: 'true',
                    propertyStartThreshold: '',
                    propertyStartThresholdType: 'num',
                    startTimeAlt: '11:00',
                    startTimeAltType: 'entered',
                    startOffsetAlt: 0,
                    startOffsetAltType: 'none',
                    startOffsetAltMultiplier: 60000,
                    propertyEnd: 'altEnd',
                    propertyEndType: 'msg',
                    propertyEndCompare: 'true',
                    propertyEndThreshold: '',
                    propertyEndThresholdType: 'num',
                    endTimeAlt: '13:00',
                    endTimeAltType: 'entered',
                    endOffsetAlt: 0,
                    endOffsetAltType: 'none',
                    endOffsetAltMultiplier: 60000,
                    withinTimeValue: 'true',
                    withinTimeValueType: 'msgInput',
                    outOfTimeValue: 'false',
                    outOfTimeValueType: 'msgInput',
                    tsCompare: '0',
                    wires: [['n2']]
                }, cfgNode];

            helper.load([nodeConfig, nodeTimeCompare], flow, credentials, function() {
                const n1 = helper.getNode('n1');
                try {
                    n1.status.should.be.calledOnce();
                    // should.not.exist(err);
                    // should.exist(n1);
                    n1.should.have.property('name', 'time switch');
                    n1.should.have.property('type', 'within-time-switch');
                    n1.should.have.property('positionConfig');

                    n1.should.have.property('timeStart');
                    n1.timeStart.should.have.property('type', 'entered');
                    n1.timeStart.should.have.property('value', '10:00');
                    n1.timeStart.should.have.property('offsetType', 'none');
                    n1.timeStart.should.have.property('offset', 0);
                    n1.timeStart.should.have.property('multiplier', 60000);
                    n1.timeStart.should.have.property('next', false);

                    n1.should.have.property('timeEnd');
                    n1.timeEnd.should.have.property('type', 'entered');
                    n1.timeEnd.should.have.property('value', '12:00');
                    n1.timeEnd.should.have.property('offsetType', 'none');
                    n1.timeEnd.should.have.property('offset', 0);
                    n1.timeEnd.should.have.property('multiplier', 60000);
                    n1.timeEnd.should.have.property('next', false);

                    n1.should.have.property('timeStartAlt');
                    n1.timeStartAlt.should.have.property('type', 'entered');
                    n1.timeStartAlt.should.have.property('value', '11:00');
                    n1.should.have.property('timeEndAlt');
                    n1.timeEndAlt.should.have.property('type', 'entered');
                    n1.timeEndAlt.should.have.property('value', '13:00');

                    n1.should.have.property('propertyStart');
                    n1.propertyStart.should.have.property('type', 'msg');
                    n1.propertyStart.should.have.property('value', 'altStart');
                    n1.should.have.property('propertyStartThreshold');
                    n1.should.have.property('propertyStartOperator');

                    n1.should.have.property('propertyEnd');
                    n1.propertyEnd.should.have.property('type', 'msg');
                    n1.propertyEnd.should.have.property('value', 'altEnd');
                    n1.should.have.property('propertyEndThreshold');
                    n1.should.have.property('propertyEndOperator');
                    // msg.payload.should.have.keys('next', 'last');
                    n1.should.have.property('tsCompare', 0);
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });
*/

    });

    describe('test message passing', function() {
        it('test if input equals output', function (done) {
            const flow = [{
                id: 'n1',
                type: 'time-comp',
                z: 'flow',
                outputs: 1,
                name: 'time compare',
                positionConfig: 'nc1',
                input: 'payload',
                inputType: 'msgPayload',
                inputFormat: '0',
                inputNext: false,
                inputOffset: 0,
                inputOffsetType: 'none',
                inputOffsetMultiplier: 60000,
                rules: [],
                checkall: 'true',
                results: [{
                    p: '',
                    pt: 'msgPayload',
                    v: '',
                    vt: 'input',
                    o: '',
                    oT: 'none',
                    oM: '60000',
                    f: 0,
                    fS: 0,
                    fT: 'Millisekunden UNIX-Zeit',
                    fI: '0',
                    next: true,
                    days: '',
                    months: '',
                    onlyEvenDays: false,
                    onlyOddDays: false,
                    onlyEvenWeeks: false,
                    onlyOddWeeks: false
                }],
                wires: [['n2']]
            }, cfgNode, hlpNode, tabNode];

            helper.load([nodeConfig, nodeTimeCompare], flow, credentials, function() {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 1647289474004); // payload removed
                        msg.should.have.property('topic', 'test1'); // changed value to t_override
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({
                    payload :1647289474004,
                    topic : 'test1'
                });
            });
        });

        it('test needs to be implemented', function() {
            this.skip();
        });
    });
});