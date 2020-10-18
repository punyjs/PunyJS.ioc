/**
* @factory
* @naming
*   @alias loaders.fileLoader
*/
function _FileLoader(
    node_path
    , node_fs
) {

    /**
    * @worker
    *   @async
    */
    return function FileLoader(source) {
        //start a promise
        return new Promise(function thenReadFile(resolve, reject) {
            //start the read process
            node_fs.readFile(
                node_path.resolve(source.endpointUri)
                , 'utf8'
                , function readFileCb(err, data) {
                    try {
                        if (!err) {
                            resolve(
                                JSON.parse(data)
                            );
                            return;
                        }
                    }
                    catch(ex) {
                        err = ex;
                    }
                    reject(err);
                }
            );
        });
    };
}