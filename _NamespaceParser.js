/**
* Parses a namespace string into an instance of {iNamespace}
* @factory
*   @singleton
* @naming
*   @alias namespaceParser
* @interface iNamespace
*   @property {string} fqns The fully qualified namespace
*   @property {string} owner The namespace owner key
*   @property {string} id The namespace modifier identifier
*   @property {string} localVersioned The local namespace + version
*   @property {string} local The local namespace; without the version
*   @property {object} version
*       @property {string} text
*       @property {number} major
*       @property {number} minor
*       @property {number} patch
*       @property {string} preRelease
*       @property {string} build
*   @property {string} commitHash The commit hash; use this instead of version
*   @property {string} root The root namespace
*   @property {boolean} isRelative If the namespace does not begin with a pascal cased
*/
function _NamespaceParser(
    namespaceProto
    , defaults
    , errors
) {
    /**
    * A regexp pattern for parsing a fully qualified namespace
    * @property
    * @private
    */
    var FQ_NS_PATT = /^(?:([0-9a-fA-F]{1,16})[:])?(.[^,:]+)(?:[,]([0-9a-fA-F]{1,16}|[0-9]+))?$/
    /**
    * A regexp pattern to parse a local namespace
    * @property
    * @private
    */
    , LC_NS_PATT = /^((?:[.]?[A-z][0-9A-z]*)+)(?:(?:[.](?:([0-9])(?:[.]([0-9])(?:[.]([0-9]))?)?)(?:[-]([0-9A-z_]+))?(?:[+]([0-9A-z_]+))?)|(?:[#]([0-9a-fA-F]{1,40})))?$/
    ;

    /**
    * @worker
    *   @param {string} namespace The namespace string to be parsed. This can be
    *   a local, versioned, and/or universally qualified
    */
    return function NamespaceParser(namespace) {
        //if this is already a namespace then just return it
        if (typeof namespace === "object") {
            if (Object.getPrototypeOf(namespace) === namespaceProto) {
                return namespace;
            }
        }
        //validate the namespace
        if (!namespace || typeof namespace !== "string") {
            throw new Error(errors.ioc.invalid_namespace);
        }
        //get the fully(universally) qualified match
        var fqMatch = namespace.match(FQ_NS_PATT) || []
        , owner = fqMatch[1] || defaults.ioc.defaultOwner
        , id = parseInt(fqMatch[3]) || defaults.ioc.defaultId
        , localVersioned = fqMatch[2]
        //get the local namespace match
        , localMatch = !!localVersioned
            ? localVersioned.match(LC_NS_PATT)
            : null
        , local = !!localMatch
            ? localMatch[1]
            /**
            * @rule requires_local The namespace requires a local namespace
            */
            : (()=>{throw new Error(errors.ioc.invalid_namespace);})()
        //extract the version
        , versionObj = createVersionObject(localMatch.slice(2, 7))
        //get the commit hash
        , commitHash = localMatch[7]
        ;
        //create and return the {iNamespace} instance
        return createNamespaceObject(owner, id, local, versionObj, commitHash);
    };

    /**
    * Creates the {version} part of the {iNamespace} instance
    * @function
    */
    function createVersionObject(matches) {
        //if the first segment is undefined then this does not have a version
        if (matches[0] === undefined) {
            return;
        }
        //create the version  object
        var versionObj = {
            "major": matches[0]
            , "minor": matches[1]
            , "patch": matches[2]
            , "preRelease": matches[3]
            , "build": matches[4]
        }
        //create the version text
        , version = "";
        Object.keys(versionObj)
        .forEach(function forEachKey(key,indx) {
            var val = versionObj[key]
            , prfx = indx === 4
                && "+"
                || indx === 3
                && "-"
                || indx > 0
                &&  "."
                || "";
            if (!!val) {
                version+= prfx + val;
            }
        });
        versionObj.text = version;

        return versionObj;
    }
    /**
    * Creates the {iNamespace} instance
    * @function
    */
    function createNamespaceObject(owner, id, local, versionObj, commitHash) {
        //create the version text entry for the full namespace
        var version = !!versionObj && !!versionObj.version
            ? `.${versionObj.version}`
            : ""
        , localVersioned = `${local}${version}`
        , universal = `${owner}:${localVersioned}`
        //concat the values for the full namespace
        , fqns = `${universal},${id || 0}`
        , root = local.split(".")[0]
        , isRelative = false
        ;
        //if the local begins with a dot then it's relative
        if (root[0] === ".") {
            root = undefined;
            isRelative = true;
        }

        //create and return the {iNamespace} object
        return Object.create(namespaceProto, {
            "fqns": {
                "enumerable": true
                , "value": fqns
            }
            , "owner": {
                "enumerable": true
                , "value": owner
            }
            , "id": {
                "enumerable": true
                , "value": id
            }
            , "universal": {
                "enumerable": true
                , "value": universal
            }
            , "localVersioned": {
                "enumerable": true
                , "value": localVersioned
            }
            , "local": {
                "enumerable": true
                , "value": local
            }
            , "version": {
                "enumerable": true
                , "value": versionObj
            }
            , "commitHash": {
                "enumerable": true
                , "value": commitHash
            }
            , "root": {
                "enumerable": true
                , "value": root
            }
            , "isRelative": {
                "enumerable": true
                , "value": isRelative
            }
        });
    }
}