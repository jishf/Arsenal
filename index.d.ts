import { Logger } from 'werelogs';

interface Ciphers {
    ciphers: string;
}

interface Dhparam {
    dhparam: string;
}

declare module "arsenal" {
    class ArsenalError extends Error {
        code: number;
        description: string;
        'AccessDenied'?: boolean;
        'AccountProblem'?: boolean;
        'AmbiguousGrantByEmailAddress'?: boolean;
        'BadDigest'?: boolean;
        'BucketAlreadyExists'?: boolean;
        'BucketAlreadyOwnedByYou'?: boolean;
        'BucketNotEmpty'?: boolean;
        'CredentialsNotSupported'?: boolean;
        'CrossLocationLoggingProhibited'?: boolean;
        'DeleteConflict'?: boolean;
        'EntityTooSmall'?: boolean;
        'EntityTooLarge'?: boolean;
        'ExpiredToken'?: boolean;
        'IllegalVersioningConfigurationException'?: boolean;
        'IncompleteBody'?: boolean;
        'IncorrectNumberOfFilesInPostRequest'?: boolean;
        'InlineDataTooLarge'?: boolean;
        'InternalError'?: boolean;
        'InvalidAccessKeyId'?: boolean;
        'InvalidAddressingHeader'?: boolean;
        'InvalidArgument'?: boolean;
        'InvalidBucketName'?: boolean;
        'InvalidBucketState'?: boolean;
        'InvalidDigest'?: boolean;
        'InvalidEncryptionAlgorithmError'?: boolean;
        'InvalidLocationConstraint'?: boolean;
        'InvalidObjectState'?: boolean;
        'InvalidPart'?: boolean;
        'InvalidPartOrder'?: boolean;
        'InvalidPayer'?: boolean;
        'InvalidPolicyDocument'?: boolean;
        'InvalidRange'?: boolean;
        'InvalidRequest'?: boolean;
        'InvalidSecurity'?: boolean;
        'InvalidSOAPRequest'?: boolean;
        'InvalidStorageClass'?: boolean;
        'InvalidTargetBucketForLogging'?: boolean;
        'InvalidToken'?: boolean;
        'InvalidURI'?: boolean;
        'KeyTooLong'?: boolean;
        'LimitExceeded'?: boolean;
        'MalformedACLError'?: boolean;
        'MalformedPOSTRequest'?: boolean;
        'MalformedXML'?: boolean;
        'MaxMessageLengthExceeded'?: boolean;
        'MaxPostPreDataLengthExceededError'?: boolean;
        'MetadataTooLarge'?: boolean;
        'MethodNotAllowed'?: boolean;
        'MissingAttachment'?: boolean;
        'MissingContentLength'?: boolean;
        'MissingRequestBodyError'?: boolean;
        'MissingSecurityElement'?: boolean;
        'MissingSecurityHeader'?: boolean;
        'NoLoggingStatusForKey'?: boolean;
        'NoSuchBucket'?: boolean;
        'NoSuchKey'?: boolean;
        'NoSuchLifecycleConfiguration'?: boolean;
        'NoSuchUpload'?: boolean;
        'NoSuchVersion'?: boolean;
        'NotImplemented'?: boolean;
        'NotModified'?: boolean;
        'NotSignedUp'?: boolean;
        'NoSuchBucketPolicy'?: boolean;
        'OperationAborted'?: boolean;
        'PermanentRedirect'?: boolean;
        'PreconditionFailed'?: boolean;
        'Redirect'?: boolean;
        'RestoreAlreadyInProgress'?: boolean;
        'RequestIsNotMultiPartContent'?: boolean;
        'RequestTimeout'?: boolean;
        'RequestTimeTooSkewed'?: boolean;
        'RequestTorrentOfBucketError'?: boolean;
        'SignatureDoesNotMatch'?: boolean;
        'ServiceUnavailable'?: boolean;
        'SlowDown'?: boolean;
        'TemporaryRedirect'?: boolean;
        'TokenRefreshRequired'?: boolean;
        'TooManyBuckets'?: boolean;
        'TooManyParts'?: boolean;
        'UnexpectedContent'?: boolean;
        'UnresolvableGrantByEmailAddress'?: boolean;
        'UserKeyMustBeSpecified'?: boolean;
        'NoSuchEntity'?: boolean;
        'WrongFormat'?: boolean;
        'Forbidden'?: boolean;
        'EntityDoesNotExist'?: boolean;
        'EntityAlreadyExists'?: boolean;
        'ServiceFailure'?: boolean;
        'IncompleteSignature'?: boolean;
        'InternalFailure'?: boolean;
        'InvalidAction'?: boolean;
        'InvalidClientTokenId'?: boolean;
        'InvalidParameterCombination'?: boolean;
        'InvalidParameterValue'?: boolean;
        'InvalidQueryParameter'?: boolean;
        'MalformedQueryString'?: boolean;
        'MissingAction'?: boolean;
        'MissingAuthenticationToken'?: boolean;
        'MissingParameter'?: boolean;
        'OptInRequired'?: boolean;
        'RequestExpired'?: boolean;
        'Throttling'?: boolean;
        'AccountNotFound'?: boolean;
        'ValidationError'?: boolean;
        'MalformedPolicyDocument'?: boolean;
        'InvalidInput'?: boolean;
        'MPUinProgress'?: boolean;
        'BadName'?: boolean;
        'BadAccount'?: boolean;
        'BadGroup'?: boolean;
        'BadId'?: boolean;
        'BadAccountName'?: boolean;
        'BadNameFriendly'?: boolean;
        'BadEmailAddress'?: boolean;
        'BadPath'?: boolean;
        'BadArn'?: boolean;
        'BadCreateDate'?: boolean;
        'BadLastUsedDate'?: boolean;
        'BadNotBefore'?: boolean;
        'BadNotAfter'?: boolean;
        'BadSaltedPwd'?: boolean;
        'ok'?: boolean;
        'BadUser'?: boolean;
        'BadSaltedPasswd'?: boolean;
        'BadPasswdDate'?: boolean;
        'BadCanonicalId'?: boolean;
        'BadAlias'?: boolean;
        'DBPutFailed'?: boolean;
        'AccountEmailAlreadyUsed'?: boolean;
        'AccountNameAlreadyUsed'?: boolean;
        'UserEmailAlreadyUsed'?: boolean;
        'UserNameAlreadyUsed'?: boolean;
        'NoParentAccount'?: boolean;
        'BadStringToSign'?: boolean;
        'BadSignatureFromRequest'?: boolean;
        'BadAlgorithm'?: boolean;
        'SecretKeyDoesNotExist'?: boolean;
        'InvalidRegion'?: boolean;
        'ScopeDate'?: boolean;
        'BadAccessKey'?: boolean;
        'NoDict'?: boolean;
        'BadSecretKey'?: boolean;
        'BadSecretKeyValue'?: boolean;
        'BadSecretKeyStatus'?: boolean;
        'BadUrl'?: boolean;
        'BadClientIdList'?: boolean;
        'BadThumbprintList'?: boolean;
        'BadObject'?: boolean;
        'BadRole'?: boolean;
        'BadSamlp'?: boolean;
        'BadMetadataDocument'?: boolean;
        'BadSessionIndex'?: boolean;
        'Unauthorized'?: boolean;
        'CacheUpdated'?: boolean;
        'DBNotFound'?: boolean;
        'DBAlreadyExists'?: boolean;
        'ObjNotFound'?: boolean;
        'PermissionDenied'?: boolean;
        'BadRequest'?: boolean;
        'RaftSessionNotLeader'?: boolean;
        'RaftSessionLeaderNotConnected'?: boolean;
        'NoLeaderForDB'?: boolean;
        'RouteNotFound'?: boolean;
        'NoMapsInConfig'?: boolean;
        'DBAPINotReady'?: boolean;
        'NotEnoughMapsInConfig:'?: boolean;
    }

    export var errors: { [key:string]: ArsenalError };

    export class Clustering {
        constructor(size: number, logger: Logger, timeout?: number);
        start(cb: (cluster: Clustering) => void): Clustering;
    }

    namespace https {
        var ciphers: Ciphers;
        var dhparam: Dhparam;
    }
}
