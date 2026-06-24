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
 * to run single test: mocha -g "sun-position"
 */

const should = require('should');
const sinon = require('sinon');
require('should-sinon');

const helper = require('node-red-node-test-helper');

// Nodes
const nodeConfig = require('../nodes/10-position-config.js');
const nodeSunPosition = require('../nodes/30-sun-position.js');

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
const sunPositions = ['solarNoon','nadir',
    'goldenHourDawnEnd', 'goldenHourDuskStart',
    'sunriseEnd',  'sunsetStart',
    'sunriseStart',  'sunsetEnd',
    'goldenHourDawnStart',  'goldenHourDuskEnd',
    'blueHourDawnEnd',  'blueHourDuskStart',
    'civilDawn', 'civilDusk',
    'blueHourDawnStart',  'blueHourDuskEnd',
    'nauticalDawn',  'nauticalDusk',
    'amateurDawn',  'amateurDusk',
    'astronomicalDawn', 'astronomicalDusk'];

describe('sun-position node', function() {
    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload().then(function () {
            helper.stopServer(done);
        });
    });

    describe('test configuration (sun-position)', function() {
        it('fail if missing configuration ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'sun-position',
                    name: '',
                    positionConfig: '',
                    rules: [],
                    onlyOnChange: 'true',
                    topic: '',
                    outputs: 1,
                    start: '',
                    startType: 'none',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    end: '',
                    endType: 'none',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeSunPosition], flow, credentials, function() {
                const n1 = helper.getNode('n1'); // sun-position node
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
                    type: 'sun-position',
                    name: '',
                    positionConfig: 'nc1',
                    rules: [],
                    onlyOnChange: 'true',
                    topic: '',
                    outputs: 1,
                    start: '',
                    startType: 'none',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    end: '',
                    endType: 'none',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    wires: [['n2']]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLongitude': '10'}};
            helper.load([nodeConfig, nodeSunPosition], flow, invalidCreds, function() {
                const n1 = helper.getNode('n1');
                const nc1 = helper.getNode('nc1');
                try {
                    n1.status.should.be.called();
                    n1.warn.should.be.called();
                    n1.warn.should.be.called().and.calledWith('node-red-contrib-sun-position/position-config:errors.config-error');
                    nc1.error.should.be.called();
                    nc1.error.should.be.called().and.calledWith('position-config.errors.latitude-missing');
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
                    type: 'sun-position',
                    name: '',
                    positionConfig: 'nc1',
                    rules: [],
                    onlyOnChange: 'true',
                    topic: '',
                    outputs: 1,
                    start: '',
                    startType: 'none',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    end: '',
                    endType: 'none',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    wires: [['n2']]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '5'}};
            helper.load([nodeConfig, nodeSunPosition], flow, invalidCreds, function() {
                const n1 = helper.getNode('n1');
                const nc1 = helper.getNode('nc1');
                try {
                    n1.status.should.be.called();
                    n1.warn.should.be.called();
                    n1.warn.should.be.called().and.calledWith('node-red-contrib-sun-position/position-config:errors.config-error');
                    nc1.error.should.be.called();
                    nc1.error.should.be.called().and.calledWith('position-config.errors.longitude-missing');
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
                    type: 'sun-position',
                    name: '',
                    positionConfig: 'nc1',
                    rules: [],
                    onlyOnChange: 'true',
                    topic: '',
                    outputs: 1,
                    start: '',
                    startType: 'none',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    end: '',
                    endType: 'none',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    wires: [['n2']]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '90.1',  'posLongitude': '10'}};
            helper.load([nodeConfig, nodeSunPosition], flow, invalidCreds, function() {
                const n1 = helper.getNode('n1');
                const nc1 = helper.getNode('nc1');
                try {
                    n1.status.should.be.called();
                    n1.warn.should.be.called();
                    n1.warn.should.be.called().and.calledWith('node-red-contrib-sun-position/position-config:errors.config-error');
                    nc1.error.should.be.called();
                    nc1.error.should.be.called().and.calledWith('position-config.errors.latitude-missing');
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
                    type: 'sun-position',
                    name: '',
                    positionConfig: 'nc1',
                    rules: [],
                    onlyOnChange: 'true',
                    topic: '',
                    outputs: 1,
                    start: '',
                    startType: 'none',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    end: '',
                    endType: 'none',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    wires: [['n2']]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '51', 'posLongitude': '180.1'}};
            helper.load([nodeConfig, nodeSunPosition], flow, invalidCreds, function() {
                const n1 = helper.getNode('n1');
                const nc1 = helper.getNode('nc1');
                try {
                    n1.status.should.be.called();
                    n1.warn.should.be.called();
                    n1.warn.should.be.called().and.calledWith('node-red-contrib-sun-position/position-config:errors.config-error');
                    nc1.error.should.be.called();
                    nc1.error.should.be.called().and.calledWith('position-config.errors.longitude-missing');
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
                    type: 'sun-position',
                    name: 'sun position',
                    positionConfig: 'nc1',
                    rules: [],
                    onlyOnChange: 'true',
                    topic: 'my #Topic',
                    outputs: 1,
                    start: '',
                    startType: 'none',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    end: '',
                    endType: 'none',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    wires: [['n2']]
                }, cfgNode];

            helper.load([nodeConfig, nodeSunPosition], flow, credentials, function() {
                const n1 = helper.getNode('n1');
                try {
                    n1.status.should.be.calledOnce();
                    n1.should.have.property('name', 'sun position');
                    n1.should.have.property('type', 'sun-position');
                    n1.should.have.property('positionConfig');
                    n1.should.have.property('positionConfigValid', true);
                    n1.should.have.property('topic', 'my #Topic');
                    n1.should.have.property('rules');
                    n1.should.have.property('start');
                    n1.start.should.have.property('type', 'none');
                    n1.start.should.have.property('value', '');
                    n1.start.should.have.property('offsetType', 'none');
                    n1.start.should.have.property('offset', 0);
                    n1.start.should.have.property('multiplier', 60000);
                    n1.start.should.have.property('next', false);
                    n1.should.have.property('end');
                    n1.end.should.have.property('type', 'none');
                    n1.end.should.have.property('value', '');
                    n1.end.should.have.property('offsetType', 'none');
                    n1.end.should.have.property('offset', 0);
                    n1.end.should.have.property('multiplier', 60000);
                    n1.end.should.have.property('next', false);
                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        it('message passing invalid creditials - missing latitude', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'sun-position',
                    name: 'sun position',
                    z: 'flow',
                    positionConfig: 'nc1',
                    rules: [],
                    onlyOnChange: 'true',
                    topic: 'my #Topic',
                    outputs: 1,
                    start: '',
                    startType: 'none',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    end: '',
                    endType: 'none',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            const invalidCreds = {'nc1': { 'posLongitude': '10'}};
            helper.load([nodeConfig, nodeSunPosition], flow, invalidCreds, () => {
                const n1 = helper.getNode('n1'); // inject node
                // const nc1 = helper.getNode('nc1'); // inject node
                const n2 = helper.getNode('n2'); // helper node
                try {
                    n1.should.have.property('name', 'sun position');

                    n2.on('input', function (msg) {
                        done(); // should not be called!
                    });
                    n1.warn.should.be.called();
                    n1.receive({});
                    n1.status.should.be.calledThrice(); // on startup config node + node itself + on message recive
                    n1.status.firstCall.calledWith('position-config.errors.latitude-missing');
                    n1.status.secondCall.calledWith('node-red-contrib-sun-position/position-config:errors.config-error');
                    n1.status.thirdCall.calledWith('position-config.errors.latitude-missing');
                    n1.error.should.be.called();
                    n1.error.should.be.called().and.calledWith('position-config.errors.latitude-missing');
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        it('message passing invalid creditials - missing longitude', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'sun-position',
                    name: 'sun position',
                    z: 'flow',
                    positionConfig: 'nc1',
                    rules: [],
                    onlyOnChange: 'true',
                    topic: 'my #Topic',
                    outputs: 1,
                    start: '',
                    startType: 'none',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    end: '',
                    endType: 'none',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            const invalidCreds = {'nc1': { 'posLatitude': '5'}};
            helper.load([nodeConfig, nodeSunPosition], flow, invalidCreds, () => {
                const n1 = helper.getNode('n1'); // inject node
                // const nc1 = helper.getNode('nc1'); // inject node
                const n2 = helper.getNode('n2'); // helper node
                try {
                    n1.should.have.property('name', 'sun position');

                    n2.on('input', function (msg) {
                        done(); // should not be called!
                    });
                    n1.warn.should.be.called();
                    n1.receive({});
                    n1.status.should.be.calledThrice(); // on startup config node + node itself + on message recive
                    n1.status.firstCall.calledWith('position-config.errors.longitude-missing');
                    n1.status.secondCall.calledWith('node-red-contrib-sun-position/position-config:errors.config-error');
                    n1.status.thirdCall.calledWith('position-config.errors.longitude-missing');
                    n1.error.should.be.called();
                    n1.error.should.be.called().and.calledWith('position-config.errors.longitude-missing');
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });

    describe('test message passing', function() {
        it('message passing - basic', function(done) {
            // this.timeout(5000); // have to wait for the inject with delay of two seconds
            const timestamp = new Date();
            timestamp.setSeconds(timestamp.getSeconds());
            const flow = [
                {
                    id: 'n1',
                    type: 'sun-position',
                    name: 'sun position',
                    z: 'flow',
                    positionConfig: 'nc1',
                    rules: [],
                    onlyOnChange: 'true',
                    topic: 'my #Top',
                    outputs: 1,
                    start: '',
                    startType: 'none',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    end: '',
                    endType: 'none',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            helper.load([nodeConfig, nodeSunPosition], flow, credentials, () => {
                const n1 = helper.getNode('n1'); // inject node
                // const nc1 = helper.getNode('nc1'); // inject node
                const n2 = helper.getNode('n2'); // helper node
                try {
                    n1.should.have.property('name', 'sun position');

                    n2.on('input', function (msg) {
                        try {
                            n1.error.should.not.be.called();
                            n1.warn.should.not.be.called();
                            n1.status.should.be.calledTwice(); // on startup config node + node itself + on message recive

                            msg.should.have.property('topic', 'my #Top');
                            msg.should.have.property('payload');
                            msg.payload.should.have.property('ts');
                            should(msg.payload.ts).be.greaterThan(timestamp.getTime());
                            should(msg.payload.ts).be.lessThan(timestamp.getTime() + 80);
                            msg.payload.should.have.property('latitude',51.16406769771653);
                            msg.payload.should.have.property('longitude',10.447609909242438);
                            msg.payload.should.have.property('height',0);
                            msg.payload.should.have.property('angleType','deg');
                            msg.payload.should.have.property('azimuth');
                            msg.payload.should.have.property('altitude');
                            msg.payload.should.have.property('azimuthDegrees');
                            msg.payload.should.have.property('altitudeDegrees');
                            msg.payload.should.have.property('azimuthRadians');
                            msg.payload.should.have.property('altitudeRadians');
                            should(msg.payload.azimuth).be.equal(msg.payload.azimuthDegrees);
                            should(msg.payload.altitude).be.equal(msg.payload.altitudeDegrees);
                            msg.payload.should.have.property('times');
                            for (let index = 0; index < sunPositions.length; index++) {
                                const sp = sunPositions[index];
                                msg.payload.times.should.have.property(sp);
                                msg.payload.times[sp].should.have.property('value');
                                msg.payload.times[sp].should.have.property('ts');
                                msg.payload.times[sp].should.have.property('name', sp);
                                msg.payload.times[sp].should.have.property('julian');
                                msg.payload.times[sp].should.have.property('valid');
                                msg.payload.times[sp].should.have.property('pos');
                            }
                            msg.payload.should.have.property('positionAtSolarNoon');
                            msg.payload.positionAtSolarNoon.should.have.property('azimuth');
                            msg.payload.positionAtSolarNoon.should.have.property('altitude');
                            msg.payload.positionAtSolarNoon.should.have.property('zenith');
                            msg.payload.positionAtSolarNoon.should.have.property('azimuthDegrees');
                            msg.payload.positionAtSolarNoon.should.have.property('altitudeDegrees');
                            msg.payload.positionAtSolarNoon.should.have.property('zenithDegrees');
                            msg.payload.positionAtSolarNoon.should.have.property('azimuthRadians');
                            msg.payload.positionAtSolarNoon.should.have.property('altitudeRadians');
                            msg.payload.positionAtSolarNoon.should.have.property('zenithRadians');
                            msg.payload.positionAtSolarNoon.should.have.property('declination');
                            msg.payload.should.have.property('altitudePercent');
                            msg.payload.should.have.property('posChanged');
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                    // '289.59/-7.49 - 5.4.2022 20:41:34'
                    n1.receive({});

                } catch (err) {
                    done(err);
                }
            });
        });

        it('message passing - fixed time', function(done) {
            // this.timeout(5000); // have to wait for the inject with delay of two seconds
            const flow = [
                {
                    id: 'n1',
                    type: 'sun-position',
                    name: 'sun position',
                    z: 'flow',
                    positionConfig: 'nc1',
                    rules: [],
                    onlyOnChange: 'true',
                    topic: 'test3',
                    outputs: 1,
                    start: '',
                    startType: 'none',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    end: '',
                    endType: 'none',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            helper.load([nodeConfig, nodeSunPosition], flow, credentials, () => {
                const n1 = helper.getNode('n1'); // inject node
                // const nc1 = helper.getNode('nc1'); // inject node
                const n2 = helper.getNode('n2'); // helper node
                try {
                    n1.should.have.property('name', 'sun position');

                    n2.on('input', function (msg) {
                        try {
                            n1.error.should.not.be.called();
                            n1.warn.should.not.be.called();
                            n1.status.should.be.calledTwice(); // on startup config node + node itself + on message recive
                            msg.should.have.property('topic', 'test3');
                            msg.should.have.property('payload');
                            msg.payload.should.have.property('ts', 1577880000000);
                            msg.payload.should.have.property('latitude',51.16406769771653);
                            msg.payload.should.have.property('longitude',10.447609909242438);
                            msg.payload.should.have.property('height', 0);
                            msg.payload.should.have.property('angleType','deg');
                            msg.payload.should.have.property('azimuth', 189.06678316838486);
                            msg.payload.should.have.property('altitude', 15.315769887624558);
                            msg.payload.should.have.property('zenith', 74.68423011237545);
                            msg.payload.should.have.property('azimuthDegrees');
                            msg.payload.should.have.property('altitudeDegrees');
                            msg.payload.should.have.property('zenithDegrees');
                            msg.payload.should.have.property('azimuthRadians');
                            msg.payload.should.have.property('altitudeRadians');
                            msg.payload.should.have.property('zenithRadians');
                            msg.payload.should.have.property('lastUpdateStr', '2020-01-01T13:00:00');
                            msg.payload.should.have.property('lastUpdate');
                            msg.payload.should.have.property('lastUpdate');
                            msg.payload.should.have.property('lastUpdate');
                            should(msg.payload.azimuth).be.equal(msg.payload.azimuthDegrees);
                            should(msg.payload.altitude).be.equal(msg.payload.altitudeDegrees);
                            msg.payload.should.have.property('times');
                            for (let index = 0; index < sunPositions.length; index++) {
                                const sp = sunPositions[index];
                                msg.payload.times.should.have.property(sp);
                                msg.payload.times[sp].should.have.property('value');
                                msg.payload.times[sp].should.have.property('ts');
                                msg.payload.times[sp].should.have.property('name', sp);
                                msg.payload.times[sp].should.have.property('julian');
                                msg.payload.times[sp].should.have.property('valid');
                                msg.payload.times[sp].should.have.property('pos');
                            }
                            msg.payload.should.have.property('posChanged');
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                    // '289.59/-7.49 - 5.4.2022 20:41:34'
                    n1.receive({ts:Date.UTC(2020,0, 1, 12, 0, 0)});
                } catch (err) {
                    done(err);
                }
            });
        });

        it('message passing - own position', function(done) {
            // this.timeout(5000); // have to wait for the inject with delay of two seconds
            const flow = [
                {
                    id: 'n1',
                    type: 'sun-position',
                    name: 'sun position',
                    z: 'flow',
                    positionConfig: 'nc1',
                    rules: [],
                    onlyOnChange: 'true',
                    topic: 'test4',
                    outputs: 1,
                    start: '',
                    startType: 'none',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    end: '',
                    endType: 'none',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            helper.load([nodeConfig, nodeSunPosition], flow, credentials, () => {
                const n1 = helper.getNode('n1'); // inject node
                // const nc1 = helper.getNode('nc1'); // inject node
                const n2 = helper.getNode('n2'); // helper node
                try {
                    n1.should.have.property('name', 'sun position');

                    n2.on('input', function (msg) {
                        try {
                            n1.error.should.not.be.called();
                            n1.warn.should.not.be.called();
                            n1.status.should.be.calledTwice(); // on startup config node + node itself + on message recive
                            msg.should.have.property('topic', 'test4');
                            msg.should.have.property('payload');
                            msg.payload.should.have.property('ts', 1577880000000);
                            msg.payload.should.have.property('latitude',40.5);
                            msg.payload.should.have.property('longitude',10);
                            msg.payload.should.have.property('height', 0);
                            msg.payload.should.have.property('angleType','deg');
                            msg.payload.should.have.property('azimuth', 189.26870091794416);
                            msg.payload.should.have.property('altitude', 25.893939119327335);
                            msg.payload.should.have.property('zenith',64.10606088067266);
                            msg.payload.should.have.property('azimuthDegrees');
                            msg.payload.should.have.property('altitudeDegrees');
                            msg.payload.should.have.property('zenithDegrees');
                            msg.payload.should.have.property('azimuthRadians');
                            msg.payload.should.have.property('altitudeRadians');
                            msg.payload.should.have.property('zenithRadians');
                            msg.payload.should.have.property('lastUpdateStr', '2020-01-01T13:00:00');
                            msg.payload.should.have.property('lastUpdate');
                            msg.payload.should.have.property('lastUpdate');
                            msg.payload.should.have.property('lastUpdate');
                            should(msg.payload.azimuth).be.equal(msg.payload.azimuthDegrees);
                            should(msg.payload.altitude).be.equal(msg.payload.altitudeDegrees);
                            msg.payload.should.have.property('times');
                            for (let index = 0; index < sunPositions.length; index++) {
                                const sp = sunPositions[index];
                                msg.payload.times.should.have.property(sp);
                                msg.payload.times[sp].should.have.property('value');
                                msg.payload.times[sp].should.have.property('ts');
                                msg.payload.times[sp].should.have.property('name', sp);
                                msg.payload.times[sp].should.have.property('julian');
                                msg.payload.times[sp].should.have.property('valid');
                                msg.payload.times[sp].should.have.property('pos');
                            }
                            msg.payload.should.have.property('posChanged');
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                    // '289.59/-7.49 - 5.4.2022 20:41:34'
                    n1.receive({
                        ts          : Date.UTC(2020,0, 1, 12, 0, 0),
                        latitude    : 40.5,
                        longitude   : 10
                    });
                } catch (err) {
                    done(err);
                }
            });
        });
        /*
        it('message passing invalid creditials - missing latitude 2', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'sun-position',
                    name: 'sun position',
                    z: 'flow',
                    positionConfig: 'nc1',
                    rules: [],
                    onlyOnChange: 'true',
                    topic: 'my #Topic',
                    outputs: 1,
                    start: '',
                    startType: 'none',
                    startOffset: 0,
                    startOffsetType: 'none',
                    startOffsetMultiplier: 60000,
                    end: '',
                    endType: 'none',
                    endOffset: 0,
                    endOffsetType: 'none',
                    endOffsetMultiplier: 60000,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            const invalidCreds = {'nc1': { 'posLongitude': '10'}};
            helper.load([nodeConfig, nodeSunPosition], flow, invalidCreds, () => {
                const n1 = helper.getNode('n1'); // inject node
                // const nc1 = helper.getNode('nc1'); // inject node
                const n2 = helper.getNode('n2'); // helper node
                try {
                    n1.status.should.be.calledOnce();
                    n1.should.have.property('name', 'injectNodeName');

                    n2.on('input', function (msg) {
                        try {
                            msg.should.have.property('topic', topic);
                            if (rval) {
                                msg.should.have.property('payload');
                                // console.log(msg);
                                // console.log(rval);
                                should.deepEqual(msg.payload, rval);
                            } else {
                                msg.should.have.property('payload', val);
                            }
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                    n1.receive({});
                } catch (err) {
                    done(err);
                }
            });
        }); */

        it('test of rules / multiple outputs', function(done) {
            this.skip();
        });

        it('test of start / end', function(done) {
            this.skip();
        });

        it('test needs to be implemented', function() {
            this.skip();
        });
    });
});