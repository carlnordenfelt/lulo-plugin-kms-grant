'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('Index unit tests', function () {
    var subject;
    var createGrantStub = sinon.stub();
    var revokeGrantStub = sinon.stub();
    var event;

    before(function () {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });

        var awsSdkStub = {
            KMS: function () {
                this.createGrant = createGrantStub;
                this.revokeGrant = revokeGrantStub;
            }
        };

        mockery.registerMock('aws-sdk', awsSdkStub);
        subject = require('../../src/index');
    });
    beforeEach(function () {
        createGrantStub.reset().resetBehavior();
        createGrantStub.yields(undefined, { GrantToken: 'GrantToken', GrantId: 'GrantId' });
        revokeGrantStub.reset().resetBehavior();
        revokeGrantStub.yields();
        event = {
            ResourceProperties: {
                GranteePrincipal: 'GranteePrincipal',
                KeyId: 'KeyId',
                Operations: ['Encrypt', 'Decrypt']
            }
        };
    });
    after(function () {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe('validate', function () {
        it('should succeed', function (done) {
            subject.validate(event);
            done();
        });
        it('should fail if GranteePrincipal is not set', function (done) {
            delete event.ResourceProperties.GranteePrincipal;
            function fn () {
                subject.validate(event);
            }
            expect(fn).to.throw(/Missing required property GranteePrincipal/);
            done();
        });
        it('should fail if KeyId is not set', function (done) {
            delete event.ResourceProperties.KeyId;
            function fn () {
                subject.validate(event);
            }
            expect(fn).to.throw(/Missing required property KeyId/);
            done();
        });
        it('should fail if Operations is not set', function (done) {
            delete event.ResourceProperties.Operations;
            function fn () {
                subject.validate(event);
            }
            expect(fn).to.throw(/Missing required property Operations/);
            done();
        });
        it('should fail if Operations is empty', function (done) {
            event.ResourceProperties.Operations = [];
            function fn () {
                subject.validate(event);
            }
            expect(fn).to.throw(/Operations cannot be empty/);
            done();
        });
    });

    describe('create', function () {
        it('should succeed', function (done) {
            subject.create(event, {}, function (error, response) {
                expect(error).to.equal(null);
                expect(createGrantStub.calledOnce).to.equal(true);
                expect(revokeGrantStub.called).to.equal(false);
                expect(response.physicalResourceId).to.equal('GrantId');
                expect(response.GrantToken).to.equal('GrantToken');
                done();
            });
        });
        it('should fail due to createGrantStub error', function (done) {
            createGrantStub.yields('createGrantStub');
            subject.create(event, {}, function (error, response) {
                expect(error).to.equal('createGrantStub');
                expect(createGrantStub.calledOnce).to.equal(true);
                expect(revokeGrantStub.called).to.equal(false);
                expect(response).to.equal(undefined);
                done();
            });
        });
    });

    describe('update', function () {
        var updateEvent;
        beforeEach(function () {
            updateEvent = JSON.parse(JSON.stringify(event));
            updateEvent.OldResourceProperties = JSON.parse(JSON.stringify(updateEvent.ResourceProperties));
            updateEvent.PhysicalResourceId = '123456789012345678901234567890';
        });
        it('should succeed with name not set', function (done) {
            subject.update(updateEvent, {}, function (error) {
                expect(error).to.equal(null);
                expect(createGrantStub.calledOnce).to.equal(true);
                expect(revokeGrantStub.calledOnce).to.equal(true);
                done();
            });
        });
        it('should succeed with name set but same', function (done) {
            updateEvent.ResourceProperties.Name = 'Name';
            updateEvent.OldResourceProperties.Name = 'Name';
            subject.update(updateEvent, {}, function (error) {
                expect(error).to.equal(null);
                expect(createGrantStub.calledOnce).to.equal(true);
                expect(revokeGrantStub.called).to.equal(false);
                done();
            });
        });
        it('should succeed with name set but different', function (done) {
            updateEvent.ResourceProperties.Name = 'Name';
            updateEvent.OldResourceProperties.Name = 'OldName';
            subject.update(updateEvent, {}, function (error) {
                expect(error).to.equal(null);
                expect(createGrantStub.calledOnce).to.equal(true);
                expect(revokeGrantStub.calledOnce).to.equal(true);
                done();
            });
        });
        it('should fail due to revokeGrant error', function (done) {
            revokeGrantStub.yields('revokeGrant');
            subject.update(event, {}, function (error) {
                expect(error).to.equal('revokeGrant');
                expect(createGrantStub.called).to.equal(false);
                expect(revokeGrantStub.calledOnce).to.equal(true);
                done();
            });
        });
    });

    describe('delete', function () {
        it('should succeed', function (done) {
            event.PhysicalResourceId = '12345678900987654321';
            subject.delete(event, {}, function (error) {
                expect(error).to.equal(undefined);
                expect(createGrantStub.called).to.equal(false);
                expect(revokeGrantStub.calledOnce).to.equal(true);
                done();
            });
        });
        it('should fail due to revokeGrant error', function (done) {
            revokeGrantStub.yields('revokeGrant');
            subject.delete(event, {}, function (error) {
                expect(error).to.equal('revokeGrant');
                expect(createGrantStub.called).to.equal(false);
                expect(revokeGrantStub.calledOnce).to.equal(true);
                done();
            });
        });
        it('should not fail if PhysicalResourceId is not a GrantId', function (done) {
            event.PhysicalResourceId = '2016/12/09/[$LATEST]5f3d74ad5b304f67995856cb48afc524';
            subject.delete(event, {}, function (error) {
                expect(error).to.equal(undefined);
                expect(createGrantStub.called).to.equal(false);
                expect(revokeGrantStub.called).to.equal(false);
                done();
            });
        });
    });
});
