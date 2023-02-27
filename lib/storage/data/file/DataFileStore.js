'use strict'; // eslint-disable-line

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const async = require('async');
const diskusage = require('diskusage');
const werelogs = require('werelogs');

const errors = require('../../../errors').default;
const stringHash = require('../../../stringHash').default;
const jsutil = require('../../../jsutil');
const storageUtils = require('../../utils');
const releasePageCacheSync = require('./utils');

const Ionburst = require('ionburst-sdk-javascript');
const ionburst = new Ionburst();

const Stream = require('stream')

// The FOLDER_HASH constant refers to the number of base directories
// used for directory hashing of stored objects.
//
// It MUST not be changed on anything else than a clean new storage
// backend.
//
// It may be changed for such system if the default hash value is too
// low for the estimated number of objects to be stored and the file
// system performance (be cautious though), and cannot be changed once
// the system contains data.

const FOLDER_HASH = 1;


/**
 * @class
 * @classdesc File-based object blob store
 *
 * Each object/part becomes a file and the files are stored in a
 * directory hash structure under the configured dataPath.
 */
class DataFileStore {
    /**
     * @constructor
     * @param {Object} dataConfig - configuration of the file backend
     * @param {String} dataConfig.dataPath - absolute path where to
     *   store the files
     * @param {Boolean} [dataConfig.noSync=false] - If true, disable
     *   sync calls that ensure files and directories are fully
     *   written on the physical drive before returning an
     *   answer. Used to speed up unit tests, may have other uses.
     * @param {Boolean} [dataConfig.noCache=false] - If true, attempt
     *   to free page caches associated with the managed files
     * @param {werelogs.API} [logApi] - object providing a constructor function
     *                                for the Logger object
     * @param {Boolean} [dataConfig.isPassthrough=false] - If true, enable
     *   passthrough I/O mode
     * @param {Boolean} [dataConfig.isReadOnly=false] - If true, disable
     *   write and delete
     *
     */
    constructor(dataConfig, logApi) {
        this.logger = new (logApi || werelogs).Logger('DataFileStore');
        this.dataPath = dataConfig.dataPath;
        this.noSync = dataConfig.noSync || false;
        this.noCache = dataConfig.noCache || false;
        this.isPassthrough = dataConfig.isPassthrough || false;
        this.isReadOnly = dataConfig.isReadOnly || false;
    }

    /**
     * Setup the storage backend before starting to read or write
     * files in it.
     *
     * The function ensures that dataPath is accessible and
     * pre-creates the directory hashes under dataPath.
     *
     * @param {function} callback - called when done with no argument
     * @return {undefined}
     */
    setup(callback) {
        fs.access(this.dataPath, fs.F_OK | fs.R_OK | fs.W_OK, err => {
            if (err) {
                this.logger.error('Data path is not readable or writable',
                    { error: err });
                return callback(err);
            }
            if (this.isPassthrough) {
                return callback();
            }
            // Create FOLDER_HASH subdirectories
            const subDirs = Array.from({ length: FOLDER_HASH },
                (v, k) => (k).toString());
            this.logger.info(`pre-creating ${subDirs.length} subdirs...`);
            if (!this.noSync) {
                storageUtils.setDirSyncFlag(this.dataPath, this.logger);
            }
            async.eachSeries(subDirs, (subDirName, next) => {
                fs.mkdir(`${this.dataPath}/${subDirName}`, err => {
                    // If already exists, move on
                    if (err && err.code !== 'EEXIST') {
                        return next(err);
                    }
                    return next();
                });
            },
                err => {
                    if (err) {
                        this.logger.error('Error creating subdirs',
                            { error: err });
                        return callback(err);
                    }
                    this.logger.info('data file store init complete, ' +
                        'go forth and store data.');
                    return callback();
                });
            return undefined;
        });
    }

    /**
     * Get the filesystem path to a stored object file from its key
     *
     * @param {String} key - the object key
     * @return {String} the absolute path to the file containing the
     *   object contents
     */
    getFilePath(key) {
        if (this.isPassthrough) {
            const dirname = path.resolve(this.dataPath);
            const filePath = path.resolve(dirname, key);
            if (filePath.startsWith(dirname) &&
                filePath !== dirname) {
                return filePath;
            }
            return '';
        }
        const hash = stringHash(key);
        const folderHashPath = ((hash % FOLDER_HASH)).toString();
        return `${this.dataPath}/${folderHashPath}/${key}`;
    }

    /**
     * Put a new object to the storage backend
     *
     * @param {stream.Readable} dataStream - input stream providing the
     *   object data
     * @param {Number} size - Total byte size of the data to put
     * @param {werelogs.RequestLogger} log - logging object
     * @param {DataFileStore~putCallback} callback - called when done
     * @return {undefined}
     */
    put(dataStream, size, log, callback) {
        if (this.isPassthrough) {
            callback(errors.NotImplemented);
            return;
        }
        if (this.isReadOnly) {
            callback(errors.InternalError.customizeDescription(
                'unable to write in ReadOnly mode'));
            return;
        }
        const key = crypto.pseudoRandomBytes(20).toString('hex');
        const filePath = this.getFilePath(key);
        console.log("key:" + key, "path:" + filePath)
        if (!filePath) {
            callback(errors.InvalidArgument);
            return;
        }
        log.debug('starting to write data', { method: 'put', key, filePath });
        //console.log(dataStream);
        dataStream.pause();
        fs.open(filePath, 'wx', (err, fd) => {
            if (err) {
                log.error('error opening filePath',
                    { method: 'put', key, filePath, error: err });
                return callback(errors.InternalError.customizeDescription(
                    `filesystem error: open() returned ${err.code}`));
            }
            const cbOnce = jsutil.once(callback);
            // disable autoClose so that we can close(fd) only after
            // fsync() has been called
            const fileStream = fs.createWriteStream(filePath,
                {
                    fd,
                    autoClose: false
                });

            //const buf = Buffer.Buffer.alloc(size)

            const readableStream = new Stream.Readable()

            //const readStream = fs.createReadStream()

            fileStream.on('finish', () => {
                function ok() {
                    log.debug('finished writing data',
                        { method: 'put', key, filePath });
                    return cbOnce(null, key);
                }
                var body = fs.readFileSync(filePath);
                console.log(body.length)
                ionburst.put({
                    id: key,
                    data: body,
                }, function (err, data) {
                    if (err) {
                        this.logger.error('error uploading to ionburst', {
                            errorMsg: err.message,
                            errStack: err.stack,
                            requestId: reqUid,
                            key,
                        });
                    }
                    console.log(data);
                    console.log(data.status);
                    fs.unlinkSync(filePath);
                    return ok();
                });
                return undefined;
            }).on('error', err => {
                log.error('error streaming data on write',
                    { method: 'put', key, filePath, error: err });
                // destroying the write stream forces a close(fd)
                fileStream.destroy();
                return cbOnce(errors.InternalError.customizeDescription(
                    `write stream error: ${err.code}`));
            });
            dataStream.resume();
            dataStream.pipe(fileStream);
            dataStream.on('error', err => {
                log.error('error streaming data on read',
                    { method: 'put', key, filePath, error: err });
                // destroying the write stream forces a close(fd)
                fileStream.destroy();
                // we need to unlink the file ourselves
                fs.unlinkSync(filePath);
                return cbOnce(errors.InternalError.customizeDescription(
                    `read stream error: ${err.code}`));
            });
            return undefined;
        });
    }

    /**
     * Get info about a stored object (see DataFileStore~statCallback
     * to know which info is returned)
     *
     * @param {String} key - key of the object
     * @param {werelogs.RequestLogger} log - logging object
     * @param {DataFileStore~statCallback} callback - called when done
     * @return {undefined}
     */
    stat(key, log, callback) {
        const filePath = this.getFilePath(key);
        if (!filePath) {
            callback(errors.InvalidArgument);
            return;
        }
        log.debug('stat file', { key, filePath });
        /*
        fs.stat(filePath, (err, stat) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    return callback(errors.ObjNotFound);
                }
                log.error('error on \'stat\' of file',
                    { key, filePath, error: err });
                return callback(errors.InternalError.customizeDescription(
                    `filesystem error: stat() returned ${err.code}`));
            }
            const info = { objectSize: stat.size };
            return callback(null, info);
        });*/
        ionburst.head(key, function (err, headResponse) {
            if (err) {
                log.error('error on ionburst head of file',
                    { key, filePath, error: err });
                return callback(errors.InternalError.customizeDescription(
                    `ionburst error: head returned ${err.code}`));
            } else if (headResponse.exists == false) {
                return callback(errors.ObjNotFound);
            }
            else if (headResponse.exists == true) {
                console.log('Object successfully checked is', key, 'with length', headResponse.length);
                const info = { objectSize: headResponse.length }
                return callback(null, info);
            }
        })
    }

    /**
     * Retrieve data of a stored object
     *
     * @param {String} key - key of the object
     * @param {Object} [byteRange] - optional absolute inclusive byte
     *   range to retrieve.
     * @param {werelogs.RequestLogger} log - logging object
     * @param {DataFileStore~getCallback} callback - called when done
     * @return {undefined}
     */
    get(key, byteRange, log, callback) {
        const filePath = this.getFilePath(key);
        if (!filePath) {
            callback(errors.InvalidArgument);
            return;
        }

        console.log(key);
        console.log(filePath);

        const readStreamOptions = {
            flags: 'r',
            encoding: null,
            fd: null,
            autoClose: false,
        };
        if (byteRange) {
            readStreamOptions.start = byteRange[0];
            readStreamOptions.end = byteRange[1];
        }

        ionburst.get(key, function (err, data) {
            if (err) {
                log.error('error retrieving file from ionburst', {
                    method: 'delete',
                    key, filePath,
                    error: err
                });
            }
            console.log(typeof (data))
            fs.writeFileSync(filePath, data)
            log.debug('opening readStream to get data',
                { method: 'get', key, filePath, byteRange });
            const cbOnce = jsutil.once(callback);

            const rs = fs.createReadStream(filePath, readStreamOptions)
                .on('error', err => {
                    if (err.code === 'ENOENT') {
                        return cbOnce(errors.ObjNotFound);
                    }
                    log.error('error retrieving file',
                        {
                            method: 'DataFileStore.get', key, filePath,
                            error: err
                        });
                    return cbOnce(
                        errors.InternalError.customizeDescription(
                            `filesystem read error: ${err.code}`));
                })
                .on('open', () => { cbOnce(null, rs); })
                .on('end', () => {
                    /*
                    if (this.noCache) {
                        releasePageCacheSync(filePath, rs.fd, log);
                    }
                    fs.close(rs.fd, err => {
                        if (err) {
                            log.error('unable to close file descriptor', {
                                method: 'DataFileStore.get', key, filePath,
                                error: err,
                            });
                        }
                    });
                    */
                    fs.unlinkSync(filePath);
                });
        })
    }

    /**
     * Delete a stored object
     *
     * @param {String} key - key of the object
     * @param {werelogs.RequestLogger} log - logging object
     * @param {DataFileStore~deleteCallback} callback - called when done
     * @return {undefined}
     */
    delete(key, log, callback) {
        if (this.isReadOnly) {
            return callback(errors.InternalError.customizeDescription(
                'unable to delete in ReadOnly mode'));
        }
        const filePath = this.getFilePath(key);
        if (!filePath) {
            return callback(errors.InvalidArgument);
        }
        console.log(key);
        console.log(filePath);
        log.debug('deleting file', { method: 'delete', key, filePath });
        /*
        return fs.unlink(filePath, err => {
            if (err) {
                if (err.code === 'ENOENT') {
                    return callback(errors.ObjNotFound);
                }
                log.error('error deleting file', { method: 'delete',
                    key, filePath,
                    error: err });
                return callback(errors.InternalError.customizeDescription(
                    `filesystem error: unlink() returned ${err.code}`));
            }
            return callback();
        });
        */
        return ionburst.delete(key, function (err, data) {
            if (err) {
                log.error('error deleting file', {
                    method: 'delete',
                    key, filePath,
                    error: err
                });
                return callback(errors.InternalError.customizeDescription(
                    `filesystem error: unlink() returned ${err.code}`));
            }
            console.log(data);
            return callback();
        });
    }

    /**
     * Retrieve disk usage information
     *
     * @param {DataFileStore~diskUsageCallback} callback - called when done
     * @return {undefined}
     */
    getDiskUsage(callback) {
        diskusage.check(this.dataPath, callback);
    }
}

/**
 * @callback DataFileStore~putCallback
 * @param {Error} - The encountered error
 * @param {String} key - The key to access the data
 */

/**
 * @callback DataFileStore~statCallback
 * @param {Error} - The encountered error
 * @param {Object} info - Information about the object
 * @param {Number} info.objectSize - Byte size of the object
 */

/**
 * @callback DataFileStore~getCallback
 * @param {Error} - The encountered error
 *   arsenal.errors.ObjNotFound is returned if the object does not exist
 * @param {stream.Readable} stream - The stream of requested object data
 */

/**
 * @callback DataFileStore~deleteCallback
 * @param {Error} - The encountered error
 *   arsenal.errors.ObjNotFound is returned if the object does not exist
 */

/**
 * @callback DataFileStore~diskUsageCallback
 * @param {Error} - The encountered error
 * @param {object} - The disk usage info
 */

module.exports = DataFileStore;
