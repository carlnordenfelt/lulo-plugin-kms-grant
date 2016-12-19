# lulo KMS Grants

lulo KMS Grants manages [AWS KMS Key grants](http://docs.aws.amazon.com/kms/latest/developerguide/grants.html).

lulo KMS Grants is a [lulo](https://github.com/carlnordenfelt/lulo) plugin

# Installation
```
$ npm install lulo-plugin-kms-grant --save
```

## Usage
### Properties
* GranteePrincipal: Required. The principal this grant is given to.
* KeyId: Required. The KMS Key the grant is valid for.
* Operations: Required. An array of operations the grant enables. Must contain at least one operation.
* Name: Update requires replacement. A friendly name for identifying the grant. Use this value to prevent unintended creation of duplicate grants when retrying this request.
* Constraints
* GrantTokens

See the [AWS SDK Documentation for KMS::CreateGrant](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/KMS.html#createGrant-property) for further details.

**Note:**
If you update a grant that does not have a Name specified, the old Grant will be revoked and a new Grant, with a new GrantId will be created.
By specifying a Name, and not changing it when you update the Grant, you will keep the same GrantId even if you update it.

### Return Values

#### Ref
When the logical ID of this resource is provided to the Ref intrinsic function, Ref returns the GrantId.

`{ "Ref": "KmsGrant" }`

#### Fn::GetAtt

**GrantToken** Returns the GrantToken generated for this Grant.

### Required IAM Permissions
The Custom Resource Lambda requires the following permissions for this plugin to work:
```
{
   "Effect": "Allow",
   "Action": [
       "kms:CreateGrant",
       "kms:RevokeGrant"
   ],
   "Resource": "*"
}
```

## License
[The MIT License (MIT)](/LICENSE)

## Change Log
[Change Log](/CHANGELOG.md)
