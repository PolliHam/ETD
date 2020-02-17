jQuery.sap.declare("sap.secmon.ui.m.commons.RoutingParameterHelper");

jQuery.sap.require("sap.ui.core.routing.HashChanger");

/**
 * Helper-class for handling component parameters so that on
 * "sap.ui.core.routing.Router#initialize" the parameters are provided for
 * routing
 */

/**
 * C'tor
 * 
 * @returns {sap.secmon.ui.m.commons.RoutingParameterHelper}
 * @constructor
 */
sap.secmon.ui.m.commons.RoutingParameterHelper = function() {
    if (sap.secmon.ui.m.commons.RoutingParameterHelper.prototype.instance) {
        return sap.secmon.ui.m.commons.RoutingParameterHelper.prototype.instance;
    }

    sap.secmon.ui.m.commons.RoutingParameterHelper.prototype.instance = this;
};

/**
 * builds a hash from the parameter of a component. if the parameter contains no
 * value or is null/undefined the result will be undefined. if a path is
 * provided then it will be used as leading part of the constructed hash.
 * 
 * @param oComponentParameter
 *            parameter of a component
 * @param sPath
 *            optional - prefix of the hash - path will be inserted to the
 *            beginning of the hash
 * @returns {*} hash which can be used for routing
 */
sap.secmon.ui.m.commons.RoutingParameterHelper.prototype.getHashFromParameters = function(oComponentParameter, sPath) {
    var sHash;

    if (oComponentParameter) {
        for ( var prop in oComponentParameter) {
            if (oComponentParameter.hasOwnProperty(prop)) {
                if (!sHash) {
                    // If there is an sPath then the parameters are routing
                    // parameters automatically.
                    // If there is none, the marker '&/' which separates
                    // startup parameters from routing parameters, is added
                    // automatically as well.
                    sHash = (sPath ? sPath : "") + "?";
                } else {
                    sHash += "&";
                }
                sHash += encodeURIComponent(prop) + "=" + encodeURIComponent(oComponentParameter[prop]);
            }
        }
    }

    return sHash;
};

/**
 * retrieves the parameter names from the provided component parameters as array
 * 
 * @param oComponentParameter
 *            component parameters
 * @returns {Array} array of component parameter names
 */
sap.secmon.ui.m.commons.RoutingParameterHelper.prototype.getParameterNames = function(oComponentParameter) {
    var aParams = [];

    if (oComponentParameter) {
        for (var prop in oComponentParameter) {
            if (oComponentParameter.hasOwnProperty(prop)) {
                aParams.push(prop);
            }
        }
    }

    return aParams;
};

/**
 * if the current hash is empty the hash is adapted from the component parameter
 * 
 * @param oComponentParameter
 *            component parameter
 * @param optional -
 *            prefix of the hash - path will be inserted to the beginning of the
 *            hash
 */
sap.secmon.ui.m.commons.RoutingParameterHelper.prototype.setHashFromParametersIfHashIsEmpty = function(oComponentParameter, sPath) {
    var sHash = sap.ui.core.routing.HashChanger.getInstance().getHash();

    if (!sHash) {
        sHash = sap.secmon.ui.m.commons.RoutingParameterHelper.prototype.getHashFromParameters(oComponentParameter, sPath);

        if (sHash) {
            sap.ui.core.routing.HashChanger.getInstance().replaceHash(sHash);
        }
    }
};