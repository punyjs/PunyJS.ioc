/**
*
* @factory
*   @dependency reporter PunyJS.core.log._Reporter
*   @dependency errors PunyJS.ioc.Errors
*   @dependency defaults PunyJS.ioc.Defaults
*   @singleton
*   @utility
* @naming
*   @alias offlineStorage
*/
function _OfflineStorage(
    reporter
    , errors
    , defaults
) {
    /**
    * A reference to the database management system used for the offline storage
    * @property
    * @private
    */
    var dbms
    /**
    * The name of the database that the offline storage resides
    * @property
    * @private
    */
    , databaseName
    /**
    * The name of the object store that contains the dependencies
    * @property
    * @private
    */
    , objectStoreName
    /**
    * The database version; default = 1
    * @property
    * @private
    */
    , version = 1
    /**
    * A reference to the database request
    * @property
    * @private
    */
    , db
    /**
    * A list of indexes from the object store. During operation this gets updated by the set method to keep it up-to-date.
    * @property
    * @private
    */
    , indexNames = []
    ;

    /**
    * @worker
    */
    return Object.create(null, {
        /**
        * Sets the internally used database management system
        * @method
        *   @param {object} dbmngmt The database managment API; indexedDB
        *   @param {string} [dbName] An optional name to use for the DB; default is {defaults.ioc.defaultDbName}.
        *   @param {object} [storeName] An optional name for the data store; default is {defaults.ioc.defaultObjectStore}.
        *   @param {object} [ver] An optional version number for the database
        */
        "setDbms": {
            "value": function setDbms(dbmngmt, dbName, storeName, ver) {
                dbms = dbmngmt;
                databaseName = dbName || defaults.ioc.defaultDbName;
                objectStoreName = storeName || defaults.ioc.defaultObjectStore;
                version = ver || version;
                db = null;
            }
        }
        /**
        * Gets a list of index names from the object store
        * @method
        *   @async
        */
        , "initialize": {
            "value": function init() {
                return getIndexNames()
                .then(function theSetIndexNames(names) {
                    indexNames = names;
                    return Promise.resolve();
                })
                .catch(function catchError(err) {
                    reporter.error(err);
                });
            }
        }
        /**
        * @method
        *   @param {string} namespace The namespace of the dependency to set
        *   @param {any} value The value of the dependency to be set
        *   @async
        */
        , "set": {
            "value": function set(namespace, value) {
                //start the transaction and get the object store
                return runTransaction(true)
                //put the value at namespace in the object store
                .then(function thenAddKeyPair(objectStore) {
                    return setValue(
                        objectStore
                        , namespace
                        , value
                    );
                });
            }
        }
        /**
        * Looks for a dependency at namespace
        * @method
        *   @param {string} namespace The namespace of the dependency to get
        *   @async
        */
        , "get": {
            "value": function get(namespace) {
                //start the transaction and get the object store
                return runTransaction()
                //resolve the value at namepace in the object store
                .then(function thenGetValue(objectStore) {
                    return getValue(
                        objectStore
                        , namespace
                    );
                });
            }
        }
        /**
        *
        * @method
        *   @param {string} namespace The namespace of the dependency to get
        */
        , "has": {
            "value": function has(namespace) {
                return indexNames.indexOf(namespace) !== -1;
            }
        }
        /**
        * Deletes a value from the object store
        * @method
        *   @param {string} [namespace] The namespace to delete
        *   @async
        */
        , "delete": {
            "value": function deleteValue(namespace) {
                return deleteNamespace(namespace);
            }
        }
        /**
        * Deletes all of the values from the object store
        * @method
        *   @async
        */
        , "clear": {
            "value": function clear() {
                return clearObjectStore();
            }
        }
    });

    /**
    * Opens the database, gets a transaction, and resolves a promise with an
    * object store.
    * @function
    */
    function runTransaction(write) {
        //ensure the database is open
        return openDatabase()
        //start a transaction
        .then(function () {
            return startTransaction(objectStoreName, write);
        })
        //then get the object store
        .then(function thenGetObjectStore(transaction) {
            return getObjectStore(transaction, objectStoreName);
        });
    }
    /**
    * Opens an instance of IDBdatabase
    * @function
    */
    function openDatabase() {
        //if we already have a db then just return that
        if (!!db) {
            return Promise.resolve(db);
        }
        //make sure we have the dbms
        if (!dbms) {
            return Promise.reject(new Error(errors.ioc.missing_dbms));
        }
        //return a new promise that resolves to an instance of IDBdatabase
        return new Promise(function thenOpenDB(resolve, reject) {
            try {
                //create the open request
                var dbOpenRequest = dbms.open(databaseName, version);
                //set the event handlers
                dbOpenRequest.onerror = (e) => {
                    //e.target.errorCode
                    reject(new Error(errors.ioc.failed_open_db));
                };
                dbOpenRequest.onsuccess = (e) => {
                    db = dbOpenRequest.result;
                    resolve(db);
                };
                dbOpenRequest.onupgradeneeded = (e) => {
                    initializeDatabase(dbOpenRequest.result);
                };
            }
            catch(ex) {
                reject(ex);
            }
        });
    }
    /**
    * Creates the object store for the first use
    * @function
    */
    function initializeDatabase(db) {
        db.createObjectStore(objectStoreName);
    }
    /**
    * Creates a promise that resolves an IDBTransaction
    * @function
    */
    function startTransaction(namespaceRoot, write = false) {
        return new Promise(function thenGetTransaction(resolve, reject) {
            try {
                var trans = db.transaction(
                    namespaceRoot
                    , write ? "readwrite" : "readonly"
                );
                resolve(trans);
            }
            catch (ex) {
                reject(ex)
            }
        });
    }
    /**
    * Uses the IDBTransaction to get the object store named `namespaceRoot`
    * @function
    */
    function getObjectStore(transaction, namespaceRoot) {
        return new Promise(function (resolve, reject) {
            try {
                resolve(
                    transaction.objectStore(namespaceRoot)
                );
            }
            catch(ex) {
                reject(ex);
            }
        });
    }
    /**
    * Runs the object store get method within a promise
    * @function
    */
    function getValue(objectStore, namespace) {
        return new Promise(function thenGetValue(resolve, reject) {
            try {
                var request = objectStore.get(
                    namespace
                );
                request.onerror = (e) => {
                    debugger;
                };
                request.onsuccess = (e) => {
                    resolve(request.result);
                };
            }
            catch(ex) {
                reject(ex);
            }
        });
    }
    /**
    * Runs the object store set method within a promise
    * @function
    */
    function setValue(objectStore, namespace, value) {
        return new Promise(function thenGetValue(resolve, reject) {
            try {
                var request = objectStore.put(
                    value
                    , namespace
                );
                request.onerror = (e) => {
                    debugger;
                };
                request.onsuccess = (e) => {
                    resolve();
                };
            }
            catch(ex) {
                reject(ex);
            }
        });
    }
    /**
    * Returns the list of index names used in the object store
    * @function
    */
    function getIndexNames() {
        //start the transaction and get the object store
        return runTransaction()
        //resolve the value at namepace in the object store
        .then(function thenGetValue(objectStore) {
            return Promise.resolve(
                Array.prototype.slice.apply(objectStore.indexNames)
            );
        });
    }
    /**
    * Deletes the value at `namespace` from the object store
    * @function
    */
    function deleteNamespace(namespace) {
        //start the transaction and get the object store
        return runTransaction()
        //resolve the value at namepace in the object store
        .then(function thenGetValue(objectStore) {
            return objectStore.delete(namespace);
        });
    }
    /**
    * Deletes all the values in the object store
    * @function
    */
    function clearObjectStore() {
        //start the transaction and get the object store
        return runTransaction()
        //resolve the value at namepace in the object store
        .then(function thenGetValue(objectStore) {
            return objectStore.clear();
        });
    }
}