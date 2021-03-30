/**
* Uses an external dependency tree, in dependency notation, to create an
* abstract dependency tree, by adding a {iAbstractEntry} object for each entry in the tree..
* @factory
*   @dependency dependencyNotationTranslator PunyJS.ioc._DependencyNotationTranslator
*   @dependency errors PunyJS.ioc.Errors
*   @utility
*   @singleton
* @naming
*   @alias abstractTree
* @interface iAbstractEntry
*   @property {string} type The type of entry it is; literal, eval, factory, object, and method.
*   @property {string} namespace An abstract or concrete path to a dependency
*   @property {object} options An object containing the entry's options
*   @property {any} value The resolved concrete value
*   @property {object} dependencies A collection of required dependencies in dependency notation. For `factory` types only.
*   @property {string} expression An expression, that when evaluated in the global scope, will return the dependency value. For `eval` types only.
*   @property {object} members A collection of named {iAbstractEntry} entries. For `branch` types only.
*   @property {string} methodName The name of the method on the concrete namespace. For `method` types only.
*   @property {string} isResolved True if the dependency has been resolved to a concrete; indicates the `value` property has been set.
*   @property {object} ownerEntry An instance of {iAbstractEntry} that represents the owner entry for a method type.
*   @property {object} factoryEntry An instance of {iAbstractEntry} that represents the entry for the factory function.

*   @property {string} name The property name of this entry on the abstract tree. Added externally.
*   @property {object} parent The parent {iAbstractEntry}. Added externally.
* ---
* @interface iAbstractTree
*   @extends {iAbstractEntry}
*   @property {array} members An array of {iAbstractEntry} objects.
*/
function _AbstractTree(
    dependencyNotationTranslator
    , errors
) {
    /**
    * A reference to the worker object
    * @property
    * @private
    */
    var self
    /**
    * An object representing the internal abstract dependency tree
    * @property
    * @private
    */
    , abstractTree
    /**
    * RegExp pattern for spliting dot notation
    * @property
    * @private
    */
    , DOT_PATT = /[.]/;

    /**
    * @worker
    */
    return self = Object.create(null, {
        /**
        * Sets the abstract tree from an external source
        * @method
        */
        "setTree": {
            "value": function setTree(extTree) {
                //ensure this is an object
                if (typeof extTree !== "object") {
                    throw new Error(errors.ioc.invalid_tree);
                }
                if (!!abstractTree) {
                    throw new Error(errors.ioc.tree_set);
                }
                //see if the tree is already processed

                //recursively loop through the external tree
                abstractTree = {
                    "name": "root"
                };
                abstractTree.members = processMembers(
                    abstractTree
                    , extTree
                );

                return self;
            }
        }
        /**
        * Adds or updates one or more nodes on the tree
        * @method
        *   @param {object|array} nodeEntries A path/value pair, or an array of path/value pairs. `{"path":"my.path","value":{dependency notation}}`
        */
        , "upsertNode": {
            "value": function upsertNode(nodeEntries) {
                if (!Array.isArray(nodeEntries)) {
                    nodeEntries = [nodeEntries];
                }
                //loop through each entry
                nodeEntries
                .forEach(function forEachEntry(pair) {
                    var path = pair.path
                    , extEntry = pair.value
                    , current = find(path);
                    if (!current) {
                        add(path, extEntry);
                    }
                    else {
                        update(current, extEntry);
                    }
                });

                //return self for chaining
                return self;
            }
        }
        /**
        * Returns a tree node at path
        * @method
        */
        , "findNode": {
            "value": function findNode(path, caseInsensitive) {
                if (!path || typeof path !== "string") {
                    throw new Error(error.invalid_path);
                }
                return find(
                    path
                    , caseInsensitive
                );
            }
        }
        /**
        * Checks for a node a `path`
        * @method
        */
        , "hasNode": {
            "value": function findNode(path) {
                if (!path || typeof path !== "string") {
                    throw new Error(error.invalid_path);
                }
                return !!find(path);
            }
        }
        /**
        * Removes a node from the abstract tree
        * @method
        */
        , "removeNode": {
            "enumerable": true
            , "value": function removeNode(path) {
                if (!path || typeof path !== "string") {
                    throw new Error(error.invalid_path);
                }
                remove(path);
            }
        }
    });

    /**
    * Looks for a node in the abstract tree at path
    * @function
    */
    function find(path, caseInsensitive) {
        if (caseInsensitive === true) {
            return findCaseInsensitive(
                path
            );
        }
        var namespace = path.split(DOT_PATT)
        , scope = abstractTree
        , success =
            namespace.every(function everyPart(part) {
                if (scope.hasOwnProperty("members")) {
                    if (scope.members.hasOwnProperty(part)) {
                        scope = scope.members[part];
                        return true;
                    }
                }
            });
        if (success) {
            return scope;
        }
    }
    /**
    * @function
    */
    function findCaseInsensitive(path) {
        var namespace = path.split(DOT_PATT)
        , scope = abstractTree
        , success =
            namespace.every(function everyPart(part) {
                if (scope.hasOwnProperty("members")) {
                    part = part.toLowerCase();
                    part = Object.keys(scope.members)
                    .find(
                        function findPropName(propName) {
                            return propName.toLowerCase() === part;
                        }
                    );
                    if (!!part) {
                        scope = scope.members[part];
                        return true;
                    }
                }
            });
        if (success) {
            return scope;
        }
    }
    /**
    * Creates the namespace on the abstract tree and set's the value to the entry.
    * @function
    */
    function add(path, extEntry) {
        var namespace = path.split(DOT_PATT)
        , name = namespace.pop()
        , scope = abstractTree;
        namespace.forEach(function forEachPart(part) {
            //create the branch
            if (!scope.members.hasOwnProperty(part)) {
                scope.members[part] = {
                    "name": part
                    , "parent": scope
                    , "members": {}
                };
            }
            scope = scope.members[part];
        });
        scope.members[name] =
            processEntry(
                name
                , scope
                , extEntry
            );
    }
    /**
    * Get's the namespace from the abstract tree and updates its value with the entry.
    * @function
    */
    function update(current, extEntry) {
        //process the entry and update the reference
        current.parent.members[current.name] =
            processEntry(
                current.name
                , current.parent
                , extEntry
            );
    }
    /**
    * Get's the namespace from the abstract tree and updates its value with the entry.
    * @function
    */
    function remove(path) {
        var namespace = path.split(DOT_PATT)
        , scope = abstractTree
        , propName = namespace.pop()
        , success =
            namespace.every(function everyPart(part) {
                if (scope.hasOwnProperty("members")) {
                    if (scope.members.hasOwnProperty(part)) {
                        scope = scope.members[part];
                        return true;
                    }
                }
            });
        if (success) {
            delete scope[propName];
        }
    }
    /**
    * Loops through each property on the external branch, and creates a
    * {iAbstractEntry} object for each property.
    * @function
    */
    function processMembers(parent, extBranch) {
        var branch = {};
        Object.keys(extBranch)
            .forEach(function forEachKey(key) {
                //add the entry to the branch
                branch[key] = processEntry(
                    key
                    , parent
                    , extBranch[key]
                );
            });
        return branch;
    }
    /**
    * Processes a single dependency notation entry
    * @function
    */
    function processEntry(name, parent, extEntry) {
        //convert the external entry
        var entry = dependencyNotationTranslator(
            extEntry
        );
        entry.parent = parent;
        if (!!name) {
            entry.name = name;
        }
        else {
            entry.name = `${entry.type}-${entry.namespace}`;
        }
        //object types have a collection of members that require processing
        if (entry.type === "object") {
             entry.members = processMembers(
                 entry
                 , extEntry[0]
             );
        }

        return entry;
    }
}