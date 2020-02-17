jQuery.sap.declare("sap.secmon.ui.m.commons.TileURLUtils");
jQuery.sap.require("sap.ushell.services.URLParsing");

/**
 * Group together some utilities to create URLs or hashes. These URLs (or
 * hashes, respectively) are used with the Fiori launchpad to create/ access
 * launchpad tiles.
 * 
 */
sap.secmon.ui.m.commons.TileURLUtils = {

    /**
     * Create a URL string with the supplied parameters. The URL is identical to
     * the current URL in browser (document.URL) but the parameters are replaced
     * with input values. The URL parameters should only contain: status,
     * severity, priority, pattern.
     * 
     * @param oParameters
     *            the parameters to use.
     */
    createURLWithParams : function(oParameters) {
        var index = document.URL.indexOf('#');
        var sServerURLWithoutHash = index > 0 ? document.URL.substring(0, index) : document.URL;
        return sServerURLWithoutHash + this.createHashWithParams(oParameters);
    },

    /**
     * create a hash string with the supplied parameters. It contains only
     * semantic object, action, and the supplied list of URL parameters. The
     * semantic object and action are taken from the current URL in browser
     * (document.URL) but the URL parameters are taken from supplied parameter
     * object. The URL parameters should only contain: status, severity,
     * priority, pattern.
     * 
     * @param oParameters
     *            the parameters to use.
     */
    createHashWithParams : function(oParameters) {
        var urlParsingService = sap.ushell.Container.getService("URLParsing");
        var sOldHash = '#' + urlParsingService.getHash(document.URL);
        var oHash = urlParsingService.parseShellHash(sOldHash);
        oHash.params = "";
        oHash.appSpecificRoute = '&/?' + this._paramsToString(oParameters); // disregard
        // UI
        // state
        return '#' + urlParsingService.constructShellHash(oHash);
    },

    /**
     * Create a service URL complete with URL parameters.
     * 
     * @param sServerURLWithoutParams
     *            the first part of a URL without URL parameters. Example: The
     *            count service for a dynamic launchpad tile.
     * @param oParameters
     *            a parameters object. Example: {status:[HIGH]}.
     */
    createServiceUrlWithParams : function(sServerURLWithoutParams, oParameters) {
        var sUrlParams = this._paramsToString(oParameters);
        var serviceUrl = sServerURLWithoutParams + (sUrlParams.length > 0 ? '?' + sUrlParams : '');
        return serviceUrl;
    },

    _paramsToString : function(oParams) {
        var first, a, k, i, lst, shellPart = "";
        first = "";
        a = null;
        lst = [];
        for (a in oParams) {
            if (oParams.hasOwnProperty(a)) {
                lst.push(a);
            }
        }
        lst.sort();
        for (k = 0; k < lst.length; k = k + 1) {
            a = lst[k];
            if (jQuery.isArray(oParams[a])) {
                for (i = 0; i < oParams[a].length; i = i + 1) {
                    shellPart += first + (i === 0 ? encodeURIComponent(a) + "=" : ",") + encodeURIComponent(oParams[a][i]);
                }
            } else {
                shellPart += first + encodeURIComponent(a) + "=" + encodeURIComponent(oParams[a]);
            }
            if (k !== lst.length - 1) {
                shellPart += "&";
            }
        }
        return shellPart;

    }

};