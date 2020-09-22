/**
* An IOC container used to manage the concrete dependencies in a concrete
* dependency tree.
* @factory
*   @utility
*   @singleton
* @interface iContainer
*   @property {function} register Registers a dependency with the container at
*   `namespace`.
*   @property {function} get Returns the dependency at the `namespace`.
*   @property {function} set Registers a dependency and then evaluates the
    dependency within the root scope.
*   @property {function} meta Returns meta data about the tree.
* @interface iContainerEntry
*   @property {string} namespace The namespace of the entry
*   @property {string} name The name of the property on the parent
*   @property {string} type The type that the value is; array, object, string,
*   boolean, number.
*   @property {object} parent The parent iContainerEntry
*   @property {any   } value The resolved dependency
*   @property {object} children A collection of child iContainerEntrys
*   @property {string} options A collection of options for the iContainerEntry
* @interface iContainerMeta
*   @property {string} namespace
*   @property {string} name
*   @property {string} type
*   @property {object} options
*/
function _Container(
    globalRedeclarationList
) {
    /**
    * A collection of errors
    * @property
    * @private
    */
    var errors = {
        "invalid_namespace": "[Invalid Namespace] The namespace provided is empty or invalid."
        , "missing_namespace": "[Missing Namespace] The namespace provided is missing from the dependency tree."
        , "namespace_exists": "[Namespace Exists] The namespace provided already exists and the overwrite switch is off."
        , "illegal_global": "[Illegal Global] The global name is illegal, it must be a property name on the global scope."
    }
    /**
    * The root container that holds all of the concrete dependencies
    * @property
    * @private
    */
    , root = {
        "children": {}
    }
    /**
    * A collection of namespaces with refernces to their value
    * @property
    * @private
    */
    , namespaces = {}
    /**
    * @worker
    */
    , self = Object.create(null, {
        /**
        * Registers the namespace and resolved value in the root container.
        * @method
        *   @param {string} namespace The path in the root to store the dependency
        *   @param {any} value The value that is the concrete dependency
        *   @param {bool|object} options An object that holds configuration information
        *   for the concrete value. If a boolean value, a default options object is
        *   created and the boolean value is used for the overwrite property.
        */
        "register": {
            "enumerable": true
            , "value": function register(namespace, value, options = true) {
                //if namespace is an object
                if (!!namespace && typeof namespace === "object") {
                    value = namespace.value;
                    options = namespace.options;
                    namespace = namespace.namespace;
                }

                //validate the namespace
                if (!namespace) {
                    throw new Error(errors.invalid_namespace);
                }

                //setup the options
                if (typeof options !== "object") {
                    options = {
                        "overwrite": !!options
                    };
                }

                //see if the namespace already exists
                if (!options.overwrite) {
                    if (hasNamespace(namespace)) {
                        throw new Error(errors.namespace_exists);
                    }
                }

                //create the namespace and iContainer entry
                var entry = createNamespaceEntry(namespace, value, options);

                //create the namespace reference to the iContainer entry
                namespaces[namespace] = entry;

                //return self for chaining
                return self;
            }
        }
        /**
        * Removes a dependency from the root object and deletes it from the
        * lexical scope
        * @method
        */
        , "deregister": {
            "enumerable": true
            , "value": function deregister(namespace) {
                //find the entry at the namespace
                var entry = lookupEntry(namespace);
                if (!!entry) {
                    //if there are children then only remove the value
                    if (!!entry.children) {
                        delete entry.value;
                    }
                    else {
                        delete entry.parent.children[entry.name];
                    }
                }

                //remove the namespace from the namespace list
                delete namespaces[namespace];

                //returnn self for chaining
                return self;
            }
        }
        /**
        * Returns the dependency from the root, at `namespace`
        * @method
        */
        , "get": {
            "enumerable": true
            , "value": function get(namespace) {
                var entry = namespaces[namespace];
                if (entry) {
                    return entry;
                }
                return new Error(errors.missing_namespace);
            }
        }
        /**
        * Resolves a dependency value and then registers it with the container
        * @method
        *   @param {string} namespace The path in the root to store the dependency.
        *   @param {string} value The string value that is to be the concrete
        *   dependency.
        *   @param {bool|object} options Passthrough to options argument on the
        *   register method
        */
        , "set": {
            "enumerable": true
            , "value": function set(namespace, value, options) {
                //resolve the value and then register the dependency
                self.register(
                    namespace
                    , resolveValue(value)
                    , options
                );

                //return self for chaining
                return self;
            }
        }
        /**
        * @function
        */
        , "hasNamespace": {
            "enumerable": true
            , "value": function hasNamespace(namespace) {
                return namespaces.hasOwnProperty(namespace);
            }
        }
        /**
        * Returns the meta data about the container contents as an ordered list
        * of registered namespaces.
        * @method
        *   @param {string} [path] Optional.
        */
        , "getMetaData": {
            "enumerable": true
            , "value": function getMetaData(path) {
                return createMetaData(path);
            }
        }
    })
    ;

    return self;

    /**
    * Checks if a namespace already exists
    * @function
    */
    function hasNamespace(namespace) {
        return namespaces.hasOwnProperty(namespace);
    }
    /**
    * Returns the iContainerEntry at `namespace`
    * @function
    */
    function lookupEntry(namespace) {
        var scope = root
        , success =
            namespace.split(".")
                .every(function everyPart(part) {
                    var entry = scope.children[part];
                    if (!entry) {
                        return false;
                    }
                    scope = entry;
                    return true;
                })
        ;

        if (success) {
            return scope;
        }
    }
    /**
    * Creates the namespace on the root object, returning the iContainerEntry
    * @funciton
    */
    function createNamespaceEntry(namespace, value, options) {
        //split the namespace and get ready to loop
        var nameAr = namespace.split(".")
        , name = nameAr.pop() //remove the name from the namespace
        , scope = root
        , entry = {
            "namespace": namespace
            , "name": name
            , "value": value
            , "type": Array.isArray(value)
                ? "array"
                : typeof value
            , "options": options
        };

        //loop through the parts of the namespace, creating any iContainerEntrys
        nameAr.forEach(function forEachName(name, indx) {
            //ensure the scope entry has a children property
            if (!scope.children) {
                scope.children = {};
            }
            //if the scope is missing the name then add it
            if (!scope.children.hasOwnProperty(name)) {
                scope.children[name] = {
                    "namespace": nameAr
                        .slice(0, indx + 1)
                        .join(".")
                    , "name": name
                    , "parent": scope
                    , "children": {}
                };
            }
            //move down the tree
            scope = scope.children[name];
        });

        //update the entry with the parent object
        entry.parent = scope;

        //add the entry to the parent
        scope.children[name] = entry;

        return entry;
    }
    /**
    * Creates a Function that hides globals, sets strict and then returns the
    * resolved value
    * @function
    */
    function resolveValue(value) {
        try {
            var funcArgs =
                globalRedeclarationList //function arguments will redeclare the global variables to undefined
                .concat(//the body
                    `"use strict";\n${value}`
                )
            //create the function
            , func = Function(
                funcArgs
            );
            //execute the function
            return func();
        }
        catch(ex) {
            return ex;
        }
    }
    /**
    * @function
    */
    function createMetaData(path) {
        var meta = {}, list;

        if (!path) {
            list = Object.keys(namespaces);
        }
        else {
            list = Object.keys(namespaces)
                .filter(function filterNs(ns) {
                    if (ns.indexOf(path) === 0) {
                        return true;
                    }
                    return false;
                })
            ;
        }

        //loop through each namespace in the list and create an iContainerMeta
        list.forEach(function forEachNs(ns) {
            var item = namespaces[ns];
            meta[ns] = {
                "namespace": item.namespace
                , "name": item.name
                , "type": item.type
                , "options": JSON.parse(JSON.stringify(item.options))
            };
        });

        return meta;
    }
}