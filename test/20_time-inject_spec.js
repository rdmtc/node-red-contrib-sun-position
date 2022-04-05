/* eslint-disable no-template-curly-in-string */
/* eslint-disable require-jsdoc */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-vars */
/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
/* global Context context describe beforeEach before afterEach after it */

/**
 * Test cases for time inect node
 *
 * @example:
 * to run all tests: npm test
 * to run all node tests: npm run testnode
 * to run single test: mocha -g "time inject node"
 */
const should = require('should');
const sinon = require('sinon');
require('should-sinon');

const helper = require('node-red-node-test-helper');

// Nodes
const nodeConfig = require('../nodes/10-position-config.js');
const nodeTimeInject = require('../nodes/20-time-inject.js');

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
const groupNode = {id: 'g0', type: 'group', name: 'GROUP' };
const hlpNode = {id: 'n2', type: 'helper'};

describe('time inject node', () => {
    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload().then(function () {
            helper.stopServer(done);
        });
    });

    describe('test configuration', () => {
        it('fail if missing configuration ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: '',
                    props: [{p: '', pt: 'msgPayload', v: 'foo', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
                const n1 = helper.getNode('n1');
                try {
                    n1.status.should.be.calledOnce();
                    n1.error.should.be.calledOnce().and.calledWith('node-red-contrib-sun-position/position-config:errors.config-missing');
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        it('fail if latitude missing ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: '',
                    nameInt: 'Zeitpunkt',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: 'foo', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [[]]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLongitude': '10'}};
            helper.load([nodeConfig, nodeTimeInject], flow, invalidCreds, () => {
                const n1 = helper.getNode('n1');
                const nc1 = helper.getNode('nc1');
                try {
                    n1.status.should.be.called();
                    n1.error.should.be.called().and.calledWith('position-config.errors.latitude-missing');
                    nc1.error.should.be.called();
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        it('fail if longitude missing ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: '',
                    nameInt: 'Zeitpunkt',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: 'foo', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [[]]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '5'}};
            helper.load([nodeConfig, nodeTimeInject], flow, invalidCreds, () => {
                const n1 = helper.getNode('n1');
                const nc1 = helper.getNode('nc1');
                try {
                    n1.status.should.be.called();
                    n1.error.should.be.called().and.calledWith('position-config.errors.longitude-missing');
                    nc1.error.should.be.called();
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        it('fail if latitude invalid ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: '',
                    nameInt: 'Zeitpunkt',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: 'foo', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [[]]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '90.1',  'posLongitude': '10'}};
            helper.load([nodeConfig, nodeTimeInject], flow, invalidCreds, () => {
                const n1 = helper.getNode('n1');
                const nc1 = helper.getNode('nc1');
                try {
                    n1.status.should.be.called();
                    n1.error.should.be.called().and.calledWith('position-config.errors.latitude-missing');
                    nc1.error.should.be.called();
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        it('fail if longitude invalid ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: '',
                    nameInt: 'Zeitpunkt',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: 'foo', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [[]]
                }, cfgNode];
            const invalidCreds = {'nc1': { 'posLatitude': '51', 'posLongitude': '180.1'}};
            helper.load([nodeConfig, nodeTimeInject], flow, invalidCreds, () => {
                const n1 = helper.getNode('n1');
                const nc1 = helper.getNode('nc1');
                try {
                    n1.status.should.be.called();
                    n1.error.should.be.called().and.calledWith('position-config.errors.longitude-missing');
                    nc1.error.should.be.called();
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });

    describe('basic tests', () => {
        function basicTest(type, val, rval, topic = 't1', adFkt = null) {
            it('inject value ('+type+')', function(done) {
                const flow = [
                    {
                        id: 'n1',
                        type: 'time-inject',
                        z: 'flow',
                        name: 'injectNodeName',
                        nameInt: 'test',
                        positionConfig: 'nc1',
                        props: [
                            {p: '', pt: 'msgPayload', v: val, vt: type },
                            {p: '', pt: 'msgTopic', v: topic, vt: 'str'}
                        ],
                        injectTypeSelect: 'none',
                        once: false,
                        wires: [['n2']]
                    }, cfgNode, hlpNode, tabNode];
                helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
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
                        if (adFkt) {
                            adFkt();
                        }
                        n1.receive({});
                    } catch (err) {
                        done(err);
                    }
                });
            });
        }

        basicTest('num', 10);
        basicTest('str', '10');
        basicTest('bool', true);
        // 'date',
        const val_json = '{ "x":"vx", "y":"vy", "z":"vz" }';
        basicTest('json', val_json, JSON.parse(val_json));
        const val_buf = '[1,2,3,4,5]';
        basicTest('bin', val_buf, Buffer.from(JSON.parse(val_buf)));
        basicTest('env', 'NR_TEST', 'foo', 'env test', () => { process.env.NR_TEST = 'foo'; });
        basicTest('strPlaceholder', '#{id}', 'n1', 'placeholder test');
        basicTest('strPlaceholder', '#{path}', 'flow/n1', 'placeholder test');
        // TODO: maybe add test for 'flow'
        // TODO: maybe add test for 'global'

        it('inject value (date) ', function(done) {
            const timestamp = new Date();
            timestamp.setSeconds(timestamp.getSeconds());

            const flow1 = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'myNode',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {p: '', pt: 'msgPayload', v: '', vt: 'date'},
                        {p: '', pt: 'msgTopic', v: 'tx', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow1, credentials, () => {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n1.status.should.be.calledOnce();
                n1.should.have.property('name', 'myNode');
                n2.on('input', function(msg) {
                    try {
                        msg.should.have.property('topic', 'tx');
                        msg.should.have.property('payload');
                        should(msg.payload).be.greaterThan(timestamp.getTime());
                        should(msg.payload).be.lessThan(timestamp.getTime() + 80);
                        done();
                    } catch(err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject value (dateSpecific) UTC ', function(done) {
            const timestamp = new Date();
            timestamp.setSeconds(timestamp.getSeconds());

            const flow1 = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'myNode',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {
                            p: '', pt: 'msgPayload', v: '', vt: 'dateSpecific',
                            o: '', oT: 'none', oM: '60000',
                            f: 1, fS: 1, fT: 'UTC Datum und Zeit', fI: '1',
                            next: true,
                            days: '*', months: '*',
                            onlyOddDays: false, onlyEvenDays: false, onlyOddWeeks: false, onlyEvenWeeks: false
                        },
                        {p: '', pt: 'msgTopic', v: 'tx', vt: 'str'}
                    ],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow1, credentials, () => {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n1.status.should.be.calledOnce();
                n1.should.have.property('name', 'myNode');
                n2.on('input', function(msg) {
                    try {
                        msg.should.have.property('topic', 'tx');
                        msg.should.have.property('payload');
                        const d = new Date(msg.payload);
                        should(d.getTime()).be.greaterThan(timestamp.getTime() - 1000);
                        should(d.getTime()).be.lessThan(timestamp.getTime() + 1000);
                        msg.payload.substring(0, msg.payload.length - 6).should.equal(timestamp.toUTCString().substring(0, timestamp.toUTCString().length - 6));

                        done();
                    } catch(err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject value (dateSpecific) UNIX-time ', function(done) {
            const timestamp = new Date();
            timestamp.setSeconds(timestamp.getSeconds());

            const flow1 = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'myNode',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {
                            p: '', pt: 'msgPayload', v: '', vt: 'dateSpecific',
                            o: '', oT: 'none', oM: '60000',
                            f: 0, fS: 0, fT: 'Millisekunden UNIX-Zeit', fI: '0',
                            next: true,
                            days: '*', months: '*',
                            onlyOddDays: false, onlyEvenDays: false, onlyOddWeeks: false, onlyEvenWeeks: false },
                        {p: '', pt: 'msgTopic', v: 'tx', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow1, credentials, () => {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n1.status.should.be.calledOnce();
                n1.should.have.property('name', 'myNode');
                n2.on('input', function(msg) {
                    try {
                        msg.should.have.property('topic', 'tx');
                        msg.should.have.property('payload');
                        should(msg.payload).be.greaterThan(timestamp.getTime());
                        should(msg.payload).be.lessThan(timestamp.getTime() + 80);
                        done();
                    } catch(err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject value (entered) ', function(done) {
            const timestamp = new Date();
            timestamp.setSeconds(0);
            timestamp.setHours(10);
            timestamp.setMinutes(0);
            timestamp.setMilliseconds(0);

            const flow1 = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'myNode',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {
                            p: '', pt: 'msgPayload', v: '10:00', vt: 'entered',
                            o: '', oT: 'none', oM: '60000',
                            f: 0, fS: 0, fI: '0',
                            next: false,
                            days: '*', months: '*',
                            onlyOddDays: false, onlyEvenDays: false, onlyOddWeeks: false, onlyEvenWeeks: false },
                        {p: '', pt: 'msgTopic', v: 'tx', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow1, credentials, () => {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n1.status.should.be.calledOnce();
                n1.should.have.property('name', 'myNode');
                n2.on('input', function(msg) {
                    try {
                        msg.should.have.property('topic', 'tx');
                        msg.should.have.property('payload');
                        msg.payload.should.equal(timestamp.getTime());
                        done();
                    } catch(err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject value (dateEntered) ', function(done) {
            const flow1 = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'myNode',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {
                            p: '', pt: 'msgPayload', v: '1.1.2020 10:00', vt: 'dateEntered',
                            o: '', oT: 'none', oM: '60000',
                            f: 0, fS: 0, fI: '0',
                            next: true,
                            days: '*', months: '*',
                            onlyOddDays: false, onlyEvenDays: false, onlyOddWeeks: false, onlyEvenWeeks: false },
                        {p: '', pt: 'msgTopic', v: 'tx', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow1, credentials, () => {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n1.status.should.be.calledOnce();
                n1.should.have.property('name', 'myNode');
                n2.on('input', function(msg) {
                    try {
                        msg.should.have.property('topic', 'tx');
                        msg.should.have.property('payload');
                        msg.payload.should.equal(1577869200000); // 1577869200000 - 1.1.2020 10:00
                        done();
                    } catch(err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject value (pdsTime-astronomicalDawn) ', function(done) {
            const flow1 = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'myNode',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {
                            p: '', pt: 'msgPayload', v: 'astronomicalDawn', vt: 'pdsTime',
                            o: '', oT: 'none', oM: '60000',
                            f: 0, fS: 0, fI: '0',
                            next: true,
                            days: '*', months: '*',
                            onlyOddDays: false, onlyEvenDays: false, onlyOddWeeks: false, onlyEvenWeeks: false },
                        {p: '', pt: 'msgTopic', v: 'tx', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow1, credentials, () => {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n1.status.should.be.calledOnce();
                n1.should.have.property('name', 'myNode');
                n2.on('input', function(msg) {
                    try {
                        msg.should.have.property('topic', 'tx');
                        msg.should.have.property('payload');
                        msg.payload.should.equal(1577856059986); // Wed Jan 01 2020 05:20:59 GMT+0000
                        done();
                    } catch(err) {
                        done(err);
                    }
                });
                n1.receive({ __ts__input_date: new Date(1577851200000)}); // 1577851200000 - 1.1.2020 5:00
            });
        });

        it('inject value (pdsTime-civilDawn) ', function(done) {
            const flow1 = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'myNode',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {
                            p: '', pt: 'msgPayload', v: 'civilDawn', vt: 'pdsTime',
                            o: '', oT: 'none', oM: '60000',
                            f: 0, fS: 0, fI: '0',
                            next: true,
                            days: '*', months: '*',
                            onlyOddDays: false, onlyEvenDays: false, onlyOddWeeks: false, onlyEvenWeeks: false },
                        {p: '', pt: 'msgTopic', v: 'tx', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow1, credentials, () => {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n1.status.should.be.calledOnce();
                n1.should.have.property('name', 'myNode');
                n2.on('input', function(msg) {
                    try {
                        msg.should.have.property('topic', 'tx');
                        msg.should.have.property('payload');
                        msg.payload.should.equal(1577861034863); // Wed Jan 01 2020 06:43:54 GMT+0000
                        done();
                    } catch(err) {
                        done(err);
                    }
                });
                n1.receive({ __ts__input_date: new Date(1577851200000)}); // 1577851200000 - 1.1.2020 5:00
            });
        });

        it('inject value (pdmTime-rise) ', function(done) {
            const flow1 = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'myNode',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {
                            p: '', pt: 'msgPayload', v: 'rise', vt: 'pdmTime',
                            o: '', oT: 'none', oM: '60000',
                            f: 0, fS: 0, fI: '0',
                            next: true,
                            days: '*', months: '*',
                            onlyOddDays: false, onlyEvenDays: false, onlyOddWeeks: false, onlyEvenWeeks: false },
                        {p: '', pt: 'msgTopic', v: 'tx', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow1, credentials, () => {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n1.status.should.be.calledOnce();
                n1.should.have.property('name', 'myNode');
                n2.on('input', function(msg) {
                    try {
                        msg.should.have.property('topic', 'tx');
                        msg.should.have.property('payload');
                        msg.payload.should.equal(1577875980344);  // Wed Jan 01 2020 10:53:00 GMT+0000
                        done();
                    } catch(err) {
                        done(err);
                    }
                });
                n1.receive({ __ts__input_date: new Date(1577851200000)}); // 1577851200000 - 1.1.2020 5:00
            });
        });

        it('inject value (dayOfMonth) ', function(done) {
            const flow1 = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'myNode',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {
                            p: '', pt: 'msgPayload', v: 'fMon', vt: 'dayOfMonth',
                            o: '', oT: 'none', oM: '60000',
                            f: 0, fS: 0, fI: '0',
                            next: true,
                            days: '*', months: '*',
                            onlyOddDays: false, onlyEvenDays: false, onlyOddWeeks: false, onlyEvenWeeks: false },
                        {p: '', pt: 'msgTopic', v: 'tx', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow1, credentials, () => {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n1.status.should.be.calledOnce();
                n1.should.have.property('name', 'myNode');
                n2.on('input', function(msg) {
                    try {
                        msg.should.have.property('topic', 'tx');
                        msg.should.have.property('payload');
                        msg.payload.should.equal(1578265200000); // Sun Jan 05 2020 23:00:00 GMT+0000
                        done();
                    } catch(err) {
                        done(err);
                    }
                });
                n1.receive({ __ts__input_date: new Date(1577851200000)}); // 1577851200000 - 1.1.2020 5:00
            });
        });

        it('inject value (pdsTimeNow) ', function(done) {
            const flow1 = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'myNode',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {
                            p: '', pt: 'msgPayload', v: '', vt: 'pdsTimeNow',
                            o: '', oT: 'none', oM: '60000',
                            f: 0, fS: 0, fI: '0',
                            next: true,
                            days: '*', months: '*',
                            onlyOddDays: false, onlyEvenDays: false, onlyOddWeeks: false, onlyEvenWeeks: false },
                        {p: '', pt: 'msgTopic', v: 'tx', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow1, credentials, () => {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n1.status.should.be.calledOnce();
                n1.should.have.property('name', 'myNode');
                n2.on('input', function(msg) {
                    try {
                        msg.should.have.property('topic', 'tx');
                        msg.should.have.property('payload');
                        msg.payload.should.have.keys('next', 'last');
                        msg.payload.next.should.have.keys('value', 'name', 'pos', 'valid', 'elevation');
                        msg.payload.last.should.have.keys('value', 'name', 'pos', 'valid', 'elevation');
                        msg.payload.next.name.should.equal('astronomicalDawn');
                        msg.payload.last.name.should.equal('nadir');
                        done();
                    } catch(err) {
                        done(err);
                    }
                });
                n1.receive({ __ts__input_date: new Date(1577851200000)}); // 1577851200000 - 1.1.2020 5:00
            });
        });

        it('inject value (pdsTimeNow) 2 ', function(done) {
            const flow1 = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'myNode',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {
                            p: '', pt: 'msgPayload', v: '', vt: 'pdsTimeNow',
                            o: '', oT: 'none', oM: '60000',
                            f: 0, fS: 0, fI: '0',
                            next: true,
                            days: '*', months: '*',
                            onlyOddDays: false, onlyEvenDays: false, onlyOddWeeks: false, onlyEvenWeeks: false },
                        {p: '', pt: 'msgTopic', v: 'tx', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow1, credentials, () => {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n1.status.should.be.calledOnce();
                n1.should.have.property('name', 'myNode');
                n2.on('input', function(msg) {
                    try {
                        msg.should.have.property('topic', 'tx');
                        msg.should.have.property('payload');
                        msg.payload.should.have.keys('next', 'last');
                        msg.payload.next.should.have.keys('value', 'name', 'pos', 'valid', 'elevation');
                        msg.payload.last.should.have.keys('value', 'name', 'pos', 'valid', 'elevation');
                        msg.payload.next.name.should.equal('solarNoon');
                        msg.payload.last.name.should.equal('goldenHourDawnEnd');
                        done();
                    } catch(err) {
                        done(err);
                    }
                });
                n1.receive({ __ts__input_date: new Date(1577869200000)}); // 1577851200000 - 1.1.2020 10:00
            });
        });

        /*
        // TODO: add test for ...
        types.SunCalc,
        types.SunInSky,
        types.MoonCalc,
        types.MoonPhase,
        types.SunAzimuth,
        types.SunElevation,
        types.SunTimeByAzimuth,
        types.SunTimeByElevationObj,
        types.SunTimeByElevationNext,
        types.SunTimeByElevationRise,
        types.SunTimeByElevationSet,
        types.isDST,
        types.WeekOfYear,
        types.WeekOfYearEven,
        types.DayOfYear,
        types.DayOfYearEven,
        types.numPercent,
        types.randomNumber,
        types.randmNumCachedDay,
        types.randmNumCachedWeek,
        types.nodeId,
        types.nodeName,
        types.nodePath
        */

        // basicTest('flow', 'flowValue', 'changeMe', 'env test topic', () => { n1.context().flow.set("flowValue", "changeMe"); });
        it('should inject multiple properties ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    z: 'flow',
                    name: 'injectNodeName',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {p: '', pt: 'msgPayload', v: 'foo', vt: 'str'},
                        {p: '',  pt: 'msgTopic', v: 't1', vt: 'str'},
                        {p:'x', pt: 'msg', v: 10, 'vt':'num'},
                        {p:'y', pt: 'msg', v: 'x+2', 'vt':'jsonata'}
                    ],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];

            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('topic', 't1');
                        msg.should.have.property('payload', 'foo');
                        msg.should.have.property('x', 10);
                        msg.should.have.property('y', 12);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });


        it('should inject custom properties in message', function (done) {
            // n1: inject node with  { topic:"static", payload:"static", bool1:true, str1:"1" }
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    z: 'flow',
                    name: 'injectNodeName',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {p: '', pt: 'msgPayload', v: 'static', vt: 'str'},
                        {p: '', pt: 'msgTopic', v: 'static', vt: 'str'},
                        {p:'bool1', pt: 'msg', v:'true', vt:'bool'},
                        {p:'str1', pt: 'msg', v:'1', vt:'str'}
                    ],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];

            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.not.have.property('payload'); // payload removed
                        msg.should.have.property('topic', 't_override'); // changed value to t_override
                        msg.should.have.property('str1', 1);// changed type from str to num
                        msg.should.have.property('num1', 1);// new prop
                        msg.should.have.property('bool1', false);// changed value to false
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({ __user_inject_props__: {
                    props: [
                        {p:'topic', pt: 'msgTopic', v:'t_override', vt:'str'}, // change value to t_override
                        {p:'str1', pt: 'msg', v:'1', vt:'num'}, // change type
                        {p:'num1', pt: 'msg', v:'1', vt:'num'}, // new prop
                        {p:'bool1', pt: 'msg', v:'false', vt:'bool'} // change value to false
                    ]}
                });
            });
        });

        it('should report invalid JSONata expression', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    z: 'flow',
                    name: 'injectNodeName',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {p: '', pt: 'msgPayload', v: '@', vt: 'jsonata'},
                        {p: '', pt: 'msgTopic', v: 't1', vt: 'str'}
                    ],
                    injectTypeSelect: 'none',

                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];

            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                let count = 0;
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('topic', 't1');
                        msg.should.not.have.property('payload');
                        count++;
                        if (count === 2) {
                            done();
                        }
                    } catch (err) {
                        done(err);
                    }
                });
                n1.on('call:error', function(_err) {
                    count++;
                    if (count === 2) {
                        done();
                    }
                });
                n1.receive({});
            });
        });

    }); /* basic tests */

    describe('environment variable', () => {
        it('inject name of node as environment variable ', done => {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: 'NR_NODE_NAME', vt: 'env'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', msg => {
                    try {
                        msg.should.have.property('payload', 'NAME');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject id of node as environment variable ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: 'NR_NODE_ID', vt: 'env'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'n1');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject path of node as environment variable ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    z: 'flow',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: 'NR_NODE_PATH', vt: 'env'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'flow/n1');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject name of flow as environment variable ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    z: 'flow',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: 'NR_FLOW_NAME', vt: 'env'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'FLOW');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject id of flow as environment variable ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    z: 'flow',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: 'NR_FLOW_ID', vt: 'env'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'flow');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject name of group as environment variable ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    g: 'g0',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: 'NR_GROUP_NAME', vt: 'env'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode, groupNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'GROUP');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject id of group as environment variable ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    g: 'g0',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: 'NR_GROUP_ID', vt: 'env'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode, groupNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'g0');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });


        it('inject name of node as environment variable by substitution ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    g: 'g0',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: '${NR_NODE_NAME}', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'NAME');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject id of node as environment variable by substitution ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    g: 'g0',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: '${NR_NODE_ID}', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'n1');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject path of node as environment variable by substitution ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    z: 'flow',
                    g: 'g0',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: '${NR_NODE_PATH}', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'flow/n1');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });


        it('inject name of flow as environment variable by substitution ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    z: 'flow',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: '${NR_FLOW_NAME}', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'FLOW');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject id of flow as environment variable by substitution ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    z: 'flow',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: '${NR_FLOW_ID}', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'flow');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject name of group as environment variable by substitution ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    g: 'g0',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: '${NR_GROUP_NAME}', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode, groupNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'GROUP');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });

        it('inject id of group as environment variable by substitution ', function (done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    g: 'g0',
                    name: 'NAME',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [{p: '', pt: 'msgPayload', v: '${NR_GROUP_ID}', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: false,
                    wires: [['n2']]
                }, cfgNode, hlpNode, groupNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, function () {
                const n1 = helper.getNode('n1');
                const n2 = helper.getNode('n2');
                n2.on('input', function (msg) {
                    try {
                        msg.should.have.property('payload', 'g0');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
                n1.receive({});
            });
        });
    }); /* environment variable */

    describe('inject once', () => {
        it('should inject once with default delay property', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'injectNodeName',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [],
                    injectTypeSelect: 'none',
                    once: true,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
                const n1 = helper.getNode('n1');
                n1.should.have.property('onceDelay', 0.1);
                done();
            });
        });

        it('should inject once with default delay', function(done) {
            const timestamp = new Date();
            timestamp.setSeconds(timestamp.getSeconds() + 1);

            const flow1 = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'injectNodeName',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {p: '', pt: 'msgPayload', v: '', vt: 'date'},
                        {p: '', pt: 'msgTopic', v: 't1', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: true,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow1, credentials, () => {
                const n2 = helper.getNode('n2');
                n2.on('input', function(msg) {
                    try {
                        msg.should.have.property('topic', 't1');
                        msg.should.have.property('_inject_type', 'once/startup');
                        msg.should.have.property('payload');
                        should(msg.payload).be.lessThan(timestamp.getTime());
                        done();
                    } catch(err) {
                        done(err);
                    }
                });
            });
        });

        it('should inject once with 500 msec. delay property', function(done) {
            this.timeout(2700); // have to wait for the inject with delay of two seconds
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    name: 'injectNodeName',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {p: '', pt: 'msgPayload', v: '', vt: 'date'},
                        {p: '', pt: 'msgTopic', v: 't1', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: true,
                    onceDelay: 0.5,
                    wires: [['n2']]
                }, cfgNode, hlpNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
                const n1 = helper.getNode('n1');
                n1.should.have.property('onceDelay', 0.5);
                done();
            });
        });

        it('should inject once with delay of two seconds', function(done) {
            this.timeout(2700); // have to wait for the inject with delay of two seconds

            const timestamp = new Date();
            timestamp.setSeconds(timestamp.getSeconds() + 1);

            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    z: 'flow',
                    name: 'injectNodeName',
                    nameInt: 'test',
                    positionConfig: 'nc1',
                    props: [
                        {p: '', pt: 'msgPayload', v: '', vt: 'date'},
                        {p: '', pt: 'msgTopic', v: 't1', vt: 'str'}],
                    injectTypeSelect: 'none',
                    once: true,
                    onceDelay: 2,
                    wires: [['n2']]
                }, cfgNode, hlpNode, tabNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
                const n2 = helper.getNode('n2');
                n2.on('input', function(msg) {
                    msg.should.have.property('topic', 't1');
                    msg.should.have.property('payload');
                    msg.should.have.property('_inject_type', 'once/startup');
                    should(msg.payload).be.greaterThan(timestamp.getTime());
                    done();
                });
            });
        });
    }); /* inject once */

    describe('inject repeatedly', () => {
        it('should inject repeatedly', function(done) {
            const flow = [{
                id: 'n1',
                type: 'time-inject',
                z: 'flow',
                name: 'injectNodeName',
                nameInt: '"payload" ↻0.2s',
                positionConfig: 'nc1',
                props: [
                    {p: '', pt: 'msgPayload', v: 'payload', vt: 'str'},
                    {p: '', pt: 'msgTopic', v: 't2', vt: 'str'}],
                injectTypeSelect: 'interval',
                intervalCount: '0.2',
                intervalCountType: 'num',
                intervalCountMultiplier: 1000,
                once: false,
                wires: [['n2']]
            }, cfgNode, hlpNode, tabNode];

            helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
                const n2 = helper.getNode('n2');
                let count = 0;
                n2.on('input', function(msg) {
                    msg.should.have.property('topic', 't2');
                    msg.should.have.property('payload', 'payload');
                    count += 1;
                    if (count > 2) {
                        helper.clearFlows().then(() => {
                            done();
                        });
                    }
                });
            });
        });

        it('should inject once with delay of two seconds and repeatedly', function(done) {
            this.timeout(2700); // have to wait for the inject with delay of two seconds
            const timestamp = new Date();
            timestamp.setSeconds(timestamp.getSeconds() + 1);
            const flow = [{
                id: 'n1',
                type: 'time-inject',
                z: 'flow',
                name: 'injectNodeName',
                nameInt: '"payload" ↻0.2s',
                positionConfig: 'nc1',
                props: [
                    {p: '', pt: 'msgPayload', v: '', vt: 'date'},
                    {p: '', pt: 'msgTopic', v: 'tx2', vt: 'str'}],
                injectTypeSelect: 'interval',
                intervalCount: '0.2',
                intervalCountType: 'num',
                intervalCountMultiplier: 1000,
                once: true,
                onceDelay: 1.2,
                wires: [['n2']]
            }, cfgNode, hlpNode, tabNode];

            helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
                const n2 = helper.getNode('n2');
                let count = 0;
                n2.on('input', function(msg) {
                    msg.should.have.property('topic', 'tx2');
                    should(msg.payload).be.greaterThan(timestamp.getTime());
                    count += 1;
                    if (count > 2) {
                        helper.clearFlows().then(() => {
                            done();
                        });
                    }
                });
            });
        });
    }); /* inject repeatedly */

    describe('inject repeatedly between times', () => {
        it('test needs to be implemented', function() {
            this.skip();
        });
    }); /* inject repeatedly between times */

    describe('inject fixed count between times', () => {
        it('test needs to be implemented', function() {
            this.skip();
        });
    }); /* inject fixed count between times */

    describe('inject at fixed timestamp ', () => {
        it('should inject at fixed timestamp', function(done) {
            this.timeout(10100); // have to wait for the inject with delay of two seconds
            const timestamp = new Date();
            timestamp.setSeconds(timestamp.getSeconds() + 5);
            timestamp.setMilliseconds(0);
            const flow = [{
                id: 'n1',
                type: 'time-inject',
                z: 'flow',
                name: 'injectNodeName',
                nameInt: '⏲ fixed timestamp',
                positionConfig: 'nc1',
                props: [
                    {p: '', pt: 'msgPayload', v: 'payload', vt: 'str'},
                    {p: '', pt: 'msgTopic', v: 't2', vt: 'str'}],
                injectTypeSelect: 'time',
                time: timestamp.toLocaleTimeString(), // timestamp.getHours() + ":" + timestamp.getHours() + ":" + timestamp.getMinutes(),
                timeType: 'entered',
                offset: 0,
                offsetType: 'none',
                offsetMultiplier: 60000,
                timeDays: '*',
                timeOnlyOddDays: false,
                timeOnlyEvenDays: false,
                timeOnlyOddWeeks: false,
                timeOnlyEvenWeeks: false,
                timeMonths: '*',
                timedatestart: '',
                timedateend: '',
                property: '',
                propertyType: 'none',
                propertyCompare: 'true',
                propertyThreshold: '',
                propertyThresholdType: 'num',
                once: false,
                onceDelay: 0.01,
                wires: [['n2']]
            }, cfgNode, hlpNode, tabNode];

            helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
                const n2 = helper.getNode('n2');
                n2.on('input', function(msg) {
                    try {
                        const d = (new Date()).getTime();
                        const ts = timestamp.getTime();
                        msg.should.have.property('topic', 't2');
                        msg.should.have.property('_inject_type', 'time');
                        msg.should.have.property('payload');
                        should(d).be.greaterThan(ts);
                        should(d).be.lessThan(ts + 100);
                        done();
                    } catch(err) {
                        console.log(msg);   // eslint-disable-line no-console
                        done(err);
                    }
                });
            });
        });

        it('should inject at fixed timestamp and offset (num)', function(done) {
            this.timeout(10100); // have to wait for the inject with delay of two seconds
            const timestamp = new Date();
            timestamp.setSeconds(timestamp.getSeconds() + 5);
            timestamp.setMilliseconds(0);
            const flow = [{
                id: 'n1',
                type: 'time-inject',
                z: 'flow',
                name: 'injectNodeName',
                nameInt: '⏲ fixed timestamp',
                positionConfig: 'nc1',
                props: [
                    {p: '', pt: 'msgPayload', v: 'payload', vt: 'str'},
                    {p: '', pt: 'msgTopic', v: 't2', vt: 'str'}],
                injectTypeSelect: 'time',
                time: timestamp.toLocaleTimeString(), // timestamp.getHours() + ":" + timestamp.getHours() + ":" + timestamp.getMinutes(),
                timeType: 'entered',
                offset: 2,
                offsetType: 'num',
                offsetMultiplier: 1000,
                timeDays: '*',
                timeOnlyOddDays: false,
                timeOnlyEvenDays: false,
                timeOnlyOddWeeks: false,
                timeOnlyEvenWeeks: false,
                timeMonths: '*',
                timedatestart: '',
                timedateend: '',
                property: '',
                propertyType: 'none',
                propertyCompare: 'true',
                propertyThreshold: '',
                propertyThresholdType: 'num',
                once: false,
                onceDelay: 0.01,
                wires: [['n2']]
            }, cfgNode, hlpNode, tabNode];

            helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
                const n2 = helper.getNode('n2');
                n2.on('input', function(msg) {
                    try {
                        const d = (new Date()).getTime();
                        const ts = timestamp.getTime();
                        msg.should.have.property('topic', 't2');
                        msg.should.have.property('_inject_type', 'time');
                        msg.should.have.property('payload');
                        should(d).be.greaterThan(ts + 2000);
                        should(d).be.lessThan(ts + 2100);
                        done();
                    } catch(err) {
                        console.log(msg);   // eslint-disable-line no-console
                        done(err);
                    }
                });
            });
        });
    }); /* inject at fixed timestamp */

    describe('inject with cron ', () => {
        it('should inject with cron', function(done) {
            const flow = [
                {
                    id: 'n1',
                    type: 'time-inject',
                    z: 'flow',
                    name: 'injectNodeName',
                    nameInt: '* * * * * * = timestamp',
                    positionConfig: 'nc1',
                    props: [
                        {p: '', pt: 'msgPayload', v: '', vt: 'date'},
                        {p: '', pt: 'msgTopic', v: 't3', vt: 'str'}],
                    injectTypeSelect: 'cron',
                    cron: '* * * * * *',
                    cronType: 'cronexpr',
                    once: false,
                    onceDelay: 0.1,
                    recalcTime: 2,
                    wires: [['n3']]
                }, cfgNode, {id:'n3', type:'helper'}, tabNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
                const n3 = helper.getNode('n3');
                n3.on('input', function(msg) {
                    msg.should.have.property('topic', 't3');
                    msg.should.have.property('payload').be.a.Number();
                    helper.clearFlows().then(function() {
                        done();
                    });
                });
            });
        }); /* should inject with cron */
    }); /* inject with cron */

    describe('post', () => {
        it('should inject message', function(done) {
            const flow = [{
                id: 'n1',
                type: 'time-inject',
                z: 'flow',
                name: 'injectNodeName',
                nameInt: '"payload" ↻0.2s',
                positionConfig: 'nc1',
                props: [
                    {p: '', pt: 'msgPayload', v: 'hello', vt: 'str'},
                    {p: '', pt: 'msgTopic', v: 't4', vt: 'str'}],
                injectTypeSelect: 'interval',
                intervalCount: '0.2',
                intervalCountType: 'num',
                intervalCountMultiplier: 1000,
                once: false,
                wires: [['n4']]
            }, cfgNode, {id: 'n4', type: 'helper'}, tabNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
                const n4 = helper.getNode('n4');
                n4.on('input', function(msg) {
                    msg.should.have.property('topic', 't4');
                    msg.should.have.property('payload', 'hello');
                    helper.clearFlows().then(() => {
                        done();
                    });
                });
                try {
                    helper.request()
                        .post('/time-inject/n1')
                        .expect(200).end(async function(err) {
                            if (err) {
                                // eslint-disable-next-line no-console
                                console.log(err);
                                await helper.clearFlows();
                                done(err);
                            }
                        });
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should inject custom properties in posted message', function(done) {
            const flow = [{
                id: 'n1',
                type: 'time-inject',
                z: 'flow',
                name: 'injectNodeName',
                nameInt: '"payload" ↻0.2s',
                positionConfig: 'nc1',
                props: [
                    {p: '', pt: 'msgPayload', v: 'hello', vt: 'str'},
                    {p: '', pt: 'msgTopic', v: 't4', vt: 'str'}],
                injectTypeSelect: 'interval',
                intervalCount: '0.2',
                intervalCountType: 'num',
                intervalCountMultiplier: 1000,
                once: false,
                wires: [['n4']]
            }, cfgNode, {id: 'n4', type: 'helper'}, tabNode];
            helper.load([nodeConfig, nodeTimeInject], flow, credentials, () => {
                const n4 = helper.getNode('n4');
                n4.on('input', function(msg) {
                    msg.should.not.have.property('payload'); // payload removed
                    msg.should.have.property('topic', 't_override'); // changed value to t_override
                    msg.should.have.property('str1', '1'); // injected prop
                    msg.should.have.property('num1', 1); // injected prop
                    msg.should.have.property('bool1', true); // injected prop

                    helper.clearFlows().then(() => {
                        done();
                    });
                });
                try {
                    helper.request()
                        .post('/time-inject/n1')
                        .send({ __user_inject_props__: {
                            props: [
                                {p:'topic', pt: 'msgTopic', v:'t_override', vt:'str'}, // change value to t_override
                                {p:'str1', pt: 'msg', v:'1', vt:'str'}, // new prop
                                {p:'num1', pt: 'msg', v:'1', vt:'num'}, // new prop
                                {p:'bool1', pt: 'msg', v:'true', vt:'bool'} // new prop
                            ]}
                        })
                        .expect(200).end(async function(err) {
                            if (err) {
                                // eslint-disable-next-line no-console
                                console.log(err);
                                await helper.clearFlows();
                                done(err);
                            }
                        });
                } catch(err) {
                    done(err);
                }
            });
        });

        it('should fail for invalid node', function(done) {
            helper.request().post('/time-inject/invalid').expect(404).end(done);
        });
    }); /* post */
});