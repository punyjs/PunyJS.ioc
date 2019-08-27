/**
* @factory
* @naming
*   @alias namespaceProto
*/
function _Namespace(

) {
    /**
    * A reference to the worker object
    * @property
    */
    var self;

    /**
    * @worker
    */
    return self = Object.create(null, {
        /**
        * Tests an instance of {iNamespace} for a match with `this` {iNamespace}
        * @method
        *   @param {object} otherNsObj The other instance of {iNamespace} to inspect for a match
        */
        "isMatch": {
            "enumerable": true
            , "value": function isMatch(otherNsObj) {
                //if they are an exact match
                if (this.fqns === otherNsObj.fqns) {
                    return true;
                }

                if (!isOwnerMatch(this.owner, otherNsObj.owner)) {
                    return false;
                }

                if (!isLocalMatch(this.local, otherNsObj.local)) {
                    return false;
                }

                if (!isVersionMatch(this.version, otherNsObj.version)) {
                    return false;
                }

                if (!isIdMatch(this.id, otherNsObj.id)) {
                    return false;
                }

                //at this point it's a match
                return true;
            }
        }
        /**
        * Returns the first matching namespace from the nsObjList
        * @method
        *   @param {array} nsList An array of namespace strings
        */
        , "findMatchInList": {
            "enumerable": true
            , "value": function findMatch(nsList) {
                var match;

                nsList.every(function everyNs(ns) {
                    if (self.isMatch(ns)) {
                        match = ns;
                        return false;
                    }
                    return true;
                });

                return match;
            }
        }
        /**
        * A custom valueOf function that returns the objects fqns value
        * @function
        */
        , "valueOf": {
            "value": function valueOf() {
                return this.fqns;
            }
        }
    });

    /**
    * @function
    */
    function isOwnerMatch(nsOwner, sourceOwner) {
        //if the owners don't match and the nsObj is not the default owner
        if (
            nsOwner === sourceOwner
            || nsOwner === defaults.defaultOwner
        ) {
            return true;
        }
        return false;
    }
    /**
    * @function
    */
    function isLocalMatch(nsLocal, sourceLocal) {
        var nsSplit, sourceSplit, localMatch;
        //check the name, the source should be equal to or a parent of nsObj
        if (nsLocal !== sourceLocal) {
            nsSplit = nsLocal.split(".");
            sourceSplit = sourceLocal.split(".");
            //if the source length is greater it can't be the parent
            if (sourceSplit.length > nsSplit.length) {
                return false;
            }
            //see if each member of the source array array matches the corresponding member in the ns
            localMatch =
                sourceSplit.every(function everyPart(part, indx) {
                    if (part === nsSplit[indx]) {
                        return true;
                    }
                    return false;
                });
            if (localMatch) {
                return true;
            }
        }
        return false;
    }
    /**
    * @function
    */
    function isVersionMatch(nsVersion, sourceVersion) {
        if (!sourceVersion || !nsVersion) {
            return sourceVersion === nsVersion;
        }
        //see if the versions match
        if (nsVersion.text === sourceVersion.text) {
            return true;
        }
        //See if the source's version is a subset of the nsObj version
        if (
            !!sourceVersion.major
            && nsVersion.major !== sourceVersion.major
        ) {
            return false;
        }
        if (
            !!sourceVersion.minor
            && nsVersion.minor !== sourceVersion.minor
        ) {
            return false;
        }
        if (
            !!sourceVersion.minor
            && nsVersion.minor !== sourceVersion.minor
        ) {
            return false;
        }
    }
    /**
    * @function
    */
    function isIdMatch(nsId, sourceId) {
        if (nsId === sourceId) {
            return true;
        }
        if (!nsId) {
            return false;
        }
        return true;
    }
}