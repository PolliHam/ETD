$.sap.declare("sap.secmon.ui.browse.AjaxCache");

$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.Constants");

/**
 * This object caches the promise object of Ajax call to backend. It returns the promise with the same methods, such as done, fail etc. Caching is always risky and by setting it to be inactive you can
 * turn the cache off.
 * 
 * @see: http://stackoverflow.com/questions/368280/javascript-hashmap-equivalent
 * @see: http://stackoverflow.com/questions/4869609/how-can-jquery-deferred-be-used
 */
sap.secmon.ui.browse.AjaxCache = function(sServicePath, sOperation, bDebug) {
    this._oDictionary = {};

    this._bActive = true;
    this._bDebug = bDebug; // bDebug is undefined if not given
    this._sServicePath = sServicePath;
    this._sOperation = sOperation || sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_FIELD_LIST;
};

/**
 * Input aKeys is an array of key object: key : { context: "string", subsetId : "Path2.Subset1" } if no subset has been created subsetId : "Path1"
 */
sap.secmon.ui.browse.AjaxCache.prototype.hash = function(aKeys) {
    var sKey = "";
    for (var i = 0, len = aKeys.length; i < len; i++) {
        if (i > 0) {
            sKey += "|";
        }
        sKey += aKeys[i].context + ":" + aKeys[i].subsetId;
    }
    return sKey;
};

/**
 * Returns tru if the given key(s) is cached
 * 
 */
sap.secmon.ui.browse.AjaxCache.prototype.isCached = function(aKeys, oWorkspaceData) {

    // check if the key is in the cache
    var sKey = this.hash(aKeys);
    var promise = this._oDictionary[sKey];

    return this._bActive && promise && promise.status && promise.status === 200;
};

/**
 * Returns data according to the given key(s), either cached or fetched from backend.
 */
sap.secmon.ui.browse.AjaxCache.prototype.getData = function(aKeys, oWorkspaceData) {

    // check if the key is in the cache
    var sKey = this.hash(aKeys);
    var promise = this._oDictionary[sKey];

    // console.log("Before: Key=" + sKey + "; Timestamp=" + (new
    // Date()).toISOString());
    if (this._bActive && (!promise || (promise && promise.status && promise.status !== 200))) {
        // TODO
        // we assume there is only one key in the key array
        var sStartSubset = aKeys[0].subsetId;
        var oQuery = sap.secmon.ui.browse.utils.mapUI2Query(sStartSubset, oWorkspaceData, this._sOperation);
        oQuery.verbose = this._bDebug;
        promise = sap.secmon.ui.browse.utils.postJSon(this._sServicePath, JSON.stringify(oQuery));

        this._oDictionary[sKey] = promise;
    }

    return promise;
};

// deferred-based cache
/*
 * $.createCache = function( requestFunction ) { var cache = {}; return function( key, callback ) { if ( !cache[ key ] ) { cache[ key ] = $.Deferred(function( defer ) { requestFunction( defer, key );
 * }).promise(); } return cache[ key ].done( callback ); }; };
 * 
 * $.loadImage = $.createCache(function( defer, url ) { var image = new Image(); function cleanUp() { image.onload = image.onerror = null; } defer.then( cleanUp, cleanUp ); image.onload = function() {
 * defer.resolve( url ); }; image.onerror = defer.reject; image.src = url; }); Again, the following snippet:
 * 
 * $.loadImage( "my-image.png" ).done( callback1 ); $.loadImage( "my-image.png" ).done( callback2 );
 */
sap.secmon.ui.browse.AjaxCache.prototype.createDeferredCache = function(fnHTTPRequest) {
    return function(aKeys, callback) {
        // check if the key is in the cache
        var sKey = this.hash(aKeys);
        if (!this._oDictionary[sKey]) {
            this._oDictionary[sKey] = $.Deferred(function(defer) {
                fnHTTPRequest(defer, aKeys);
            }).promise();
        }
        return this._oDictionary[sKey].done(callback);
    };
};

/**
 * Returns data according to the given key(s), either cached or fetched from backend.
 */
sap.secmon.ui.browse.AjaxCache.prototype.setData = function(aKeys, oPromise) {
    var sKey = this.hash(aKeys);
    this._oDictionary[sKey] = oPromise;
};

/**
 * Clears the cache. If no keys are given the whole cache is cleared
 */
sap.secmon.ui.browse.AjaxCache.prototype.invalidate = function(aKeys) {
    if ($.isEmptyObject(aKeys)) {
        this._oDictionary = {};
    } else {
        this._oDictionary[this.hash(aKeys)] = undefined;
    }
};

/**
 * Sets the flag if cache is active or not. This enables the application to turn cache on or off
 */
sap.secmon.ui.browse.AjaxCache.prototype.setActive = function(bActive) {
    this._bActive = bActive;
};

// ////////////////////Test///////////////////
/*
 * var oTest = new AjaxCache(C_SERVICE_PATH); // cached result will be used oTest.getData("Path1.Subset2", oWorkspaceData).then(function(response, textStatus, XMLHttpRequest) { console.log("resp: " +
 * response); }, function(jqXHR, textStatus, errorThrown) {
 * 
 * });
 */
