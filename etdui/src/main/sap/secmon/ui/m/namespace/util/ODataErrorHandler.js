/**
 * Helper module for displaying alerts, based on the error response of the OData
 * service for system namespaces.
 * 
 * Usage:
 * jQuery.sap.require("sap.secmon.ui.m.namespace.util.ODataErrorHandler");
 * ODataErrorHandler.showAlert(response, resourceBundle);
 * 
 * The object ODataErrorHandler is available as global object as soon as the
 * module is loaded. "response" is the response property of the event passed
 * into an OData event handler
 * 
 */

jQuery.sap.declare("sap.secmon.ui.m.namespace.util.ODataErrorHandler");
jQuery.sap.require("sap.m.MessageBox");

sap.secmon.ui.m.namespace.util.ODataErrorHandler = (function() {

    /**
     * Set to true during development, to see the full error response if
     * necessary.
     */
    var DEBUG = false;
    var focusElement;
    /*
     * Map all errorcodes defined in the OData Service to textbundle IDs
     */
    var errorIdMAp = {
        "ERR-1" : 'NAMESPACE_OD_ERR1',
        "ERR-2" : 'NAMESPACE_OD_ERR2',
        "ERR-3" : 'NAMESPACE_OD_ERR3',
        "ERR-4" : 'NAMESPACE_OD_ERR4'
    };

    function errorCodeToTextId(errorCode) {
        if (errorCode in errorIdMAp) {
            return errorIdMAp[errorCode];
        } else {
            return 'NAMESPACE_OD_ERRxxx';
        }
    }

    function escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    function replaceAll(string, find, replace) {
        return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
    }

    return {
        showAlert : function(response, resourceBundle, elementFocus) {
            focusElement = elementFocus;

            var detailText = JSON.stringify(response, null, ' ');
            var text;
            try {
                // The response body is contained as JSON-string and must
                // be parsed into an object first
                var responseObject = JSON.parse(response.body);
                if ('errordetail' in responseObject.error.innererror) {
                    var errId = responseObject.error.innererror.errordetail.intErrorCode;
                    var textId = errorCodeToTextId(errId);
                    text = resourceBundle.getProperty(textId);
                    if (textId === 'NAMESPACE_OD_ERRxxx') {
                        text = text.replace('{0}', responseObject.error.innererror.errordetail.intErrorMessage);
                    }
                } else {
                    text = responseObject.error.innererror.exception;
                }
            } catch (e) {
                text = "Response: " + detailText; // As fallback only
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
                    title : resourceBundle.getProperty("NAMESPACE_ERROR"),
                    onClose : function() {
                        if (focusElement !== undefined) {
                            focusElement.focus();
                        }
                    }
                });
            }
        }
    };

}());
