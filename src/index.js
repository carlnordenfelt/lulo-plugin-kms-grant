'use strict';

var aws = require('aws-sdk');
var kms = new aws.KMS({ apiVersion: '2014-11-01' });

var pub = {};

pub.validate = function (event) {
    if (!event.ResourceProperties.GranteePrincipal) {
        throw new Error('Missing required property GranteePrincipal');
    }
    if (!event.ResourceProperties.KeyId) {
        throw new Error('Missing required property KeyId');
    }
    if (!event.ResourceProperties.Operations) {
        throw new Error('Missing required property Operations');
    }
    if (event.ResourceProperties.Operations.length === 0) {
        throw new Error('Operations cannot be empty');
    }
};

pub.create = function (event, _context, callback) {
    delete event.ResourceProperties.ServiceToken;
    var params = event.ResourceProperties;
    kms.createGrant(params, function (error, kmsResponse) {
        if (error) {
            return callback(error);
        }
        var data = {
            physicalResourceId: kmsResponse.GrantId,
            GrantToken: kmsResponse.GrantToken
        };
        callback(null, data);
    });
};

pub.update = function (event, context, callback) {
    if (!requiresReplacement(event)) {
        return pub.create(event, context, callback);
    }

    pub.delete(event, context, function (error) {
        if (error) {
            return callback(error);
        }
        pub.create(event, context, callback);
    });
};

pub.delete = function (event, _context, callback) {
    if (/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}/.test(event.PhysicalResourceId)) {
        return callback();
    }
    var params = {
        GrantId: event.PhysicalResourceId,
        KeyId: event.ResourceProperties.KeyId
    };
    kms.revokeGrant(params, function(error) {
        return callback(error);
    });
};

module.exports = pub;

function requiresReplacement(event) {
    return !event.ResourceProperties.Name ||
        event.ResourceProperties.Name !== event.OldResourceProperties.Name;
}
