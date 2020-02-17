/**
 * Helper module for displaying alerts, based on the error response of the OData service for valuelists.
 * 
 * Usage: jQuery.sap.require("sap.secmon.ui.m.valuelist.util.ODataErrorHandler"); ODataErrorHandler.showAlert(response, resourceBundle);
 * 
 * The object ODataErrorHandler is available as global object as soon as the module is loaded. "response" is the response property of the event passed into an OData event handler
 * 
 */

jQuery.sap.declare("sap.secmon.ui.m.valuelist.util.ODataErrorHandler");
jQuery.sap.require("sap.m.MessageBox");

sap.secmon.ui.m.valuelist.util.ODataErrorHandler = (function() {

    /**
     * Set to true during development, to see the full error response if necessary.
     */
    var DEBUG = false;
    /*
     * Map all errorcodes defined in the OData Service to textbundle IDs
     */
    var errorIdMAp = {
        "ERR-1" : 'VL_OD_ERR1',
        "ERR-2" : 'VL_OD_ERR2',
        "ERR-3" : 'VL_OD_ERR3',
        "ERR-20" : 'VL_OD_ERR20',
        "ERR-21" : 'VL_OD_ERR21',
        "ERR-22" : 'VL_OD_ERR22',
        "ERR-23" : 'VL_OD_ERR23',
        "ERR-40" : 'VL_OD_ERR40',
        "ERR-100" : 'VL_OD_ERR100',
        "ERR-104" : 'VL_OD_ERR104',
        "ERR-120" : 'VL_OD_ERR120'
    };

    function errorCodeToTextId(errorCode) {
        if (errorCode in errorIdMAp) {
            return errorIdMAp[errorCode];
        } else {
            return 'VL_OD_ERRxxx';
        }
    }

    function escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    function replaceAll(string, find, replace) {
        return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
    }

    return {
        showAlert : function(response, resourceBundle) {
            var detailText = JSON.stringify(response, null, ' ');
            var text, textId, errId;
            try {
                // The response body is contained as JSON-string and must
                // be parsed into an object first
                var responseObject = JSON.parse(response.body);
                if ('errordetail' in responseObject.error.innererror) {
                    errId = responseObject.error.innererror.errordetail.intErrorCode;
                    textId = errorCodeToTextId(errId);
                    text = resourceBundle.getProperty(textId);
                    if (textId === 'VL_OD_ERRxxx') {
                        text = text.replace('{0}', responseObject.error.innererror.errordetail.intErrorMessage);
                    }
                } else {
                    text = responseObject.error.innererror.exception;
                }
            } catch (e) {
                text = detailText; // As fallback only
                text = replaceAll(text, '{', '[');
                text = replaceAll(text, '}', ']');
            }
            if (DEBUG === true) {
                // During debugging it helps to have a way for
                // displaying the full respons
                sap.m.MessageBox.show(text, {
                    title : 'Error (debugging switched on)',
                    actions : [ sap.m.MessageBox.Action.OK, 'Details' ],
                    onClose : function(action) {
                        if (action === 'Details') {
                            alert(detailText);
                        }
                    }
                });
            } else {
                sap.m.MessageBox.alert(text, {
                    title : errId === "ERR-104" ? null : resourceBundle.getProperty("VL_ErrorTitle")
                });
            }
        }
    };

}());
