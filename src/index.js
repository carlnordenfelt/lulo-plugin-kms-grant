const aws = require('aws-sdk');
const kms = new aws.KMS({ apiVersion: '2014-11-01' });

module.exports = {
    validate,
    create,
    update,
    delete: deleteFn
};

function validate(event) {
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
}

function create(event, _context, callback) {
    delete event.ResourceProperties.ServiceToken;
    const params = event.ResourceProperties;
    kms.createGrant(params, function (error, kmsResponse) {
        if (error) {
            return callback(error);
        }

        const data = {
            physicalResourceId: kmsResponse.GrantId,
            GrantToken: kmsResponse.GrantToken
        };
        callback(null, data);
    });
}

function update(event, context, callback) {
    if (!requiresReplacement(event)) {
        return create(event, context, callback);
    }

    deleteFn(event, context, function (error) {
        if (error) {
            return callback(error);
        }
        create(event, context, callback);
    });
}

function deleteFn(event, _context, callback) {
    if (/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}/.test(event.PhysicalResourceId)) {
        return callback();
    }
    const params = {
        GrantId: event.PhysicalResourceId,
        KeyId: event.ResourceProperties.KeyId
    };
    kms.revokeGrant(params, function (revokeError) {
        if (revokeError) {
            // Optimistically attempt to retire the grant instead
            kms.retireGrant(params, function (retireError) {
                return callback(retireError);
            });
        }
        return callback(revokeError);
    });
}

function requiresReplacement(event) {
    return !event.ResourceProperties.Name ||
        event.ResourceProperties.Name !== event.OldResourceProperties.Name;
}
