/**
* @factory
* @naming
*   @alias loaders.httpLoader
*/
function _HttpLoader(
    xmlHttpRequest
    , errors
) {

    /**
    * @worker
    */
    return function HttpLoader(source) {
        return new Promise(function thenRunHttpLoader(resolve, reject) {
            startRequest(resolve, reject, source);
        });
    };

    /**
    * @function
    */
    function setupRequest(resolve, reject) {
        //create the http request
        var request = new xmlHttpRequest();

        //wire listeners
        addLoadListener(request, resolve, reject);
        addTimeoutListener(request, reject);
        addErrorListener(request, reject);

        //we will always expect a mime type of application/json
        request.responseType = "json";

        return request;
    }
    /**
    * @function
    */
    function startRequest(resolve, reject, source) {
        try {
            var request = setupRequest(resolve, reject);
            //opend and send the request
            request.open(
                "GET"
                , source.endpointUri
            );
            //send the request
            request.send();
        }
        catch(ex) {
            reject(ex);
        }
    }
    /**
    * @function
    */
    function addLoadListener(request, resolve, reject) {
        request.addEventListener("load", function handleLoad() {
            var results = request.response;

            //anything other than 200 is an error
            if (request.status !== 200) {
                reject(
                    new Error(`${errors.ioc.http_invalid_response} (${request.status}: ${request.statusText} -> ${request.responseType})`)
                );
                return;
            }

            //last ditch effort to get json
            if (typeof results !== "object") {
                results = JSON.parse(results);
            }

            //no json then reject
            if (typeof results !== "object") {
                reject(
                    new Error(`${errors.ioc.http_invalid_response} ${typeof results}`)
                );
            }

            resolve(results);
        });
    }
    /**
    * @function
    */
    function addTimeoutListener(request, reject) {
        request.addEventListener("timeout", function handleLoadEnd(e) {
            reject(
                new Error(`${errors.ioc.http_timeout}`)
            );
        });
    }
    /**
    * @function
    */
    function addErrorListener(request, reject) {
        request.addEventListener("error", function handleError() {
            reject(
                new Error(`${errors.ioc.http_failed}`)
            );
        });
    }
}