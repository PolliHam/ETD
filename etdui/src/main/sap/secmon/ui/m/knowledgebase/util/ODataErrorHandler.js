jQuery.sap.declare("sap.secmon.ui.m.knowledgebase.util.ODataErrorHandler");
jQuery.sap.require("sap.m.MessageBox");

sap.secmon.ui.m.knowledgebase.util.ODataErrorHandler = (function() {

    /**
     * Set to true during development, to see the full error response if necessary.
     */
    var DEBUG = false;

    function escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    function replaceAll(string, find, replace) {
        return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
    }

    return {
        showAlert : function(response, resourceBundle, commonResourceBundle) {
            var detailText = JSON.stringify(response, null, ' ');
            var text;
            try {
                // The response body is contained as JSON-string and must
                // be parsed into an object first
                var responseObject = JSON.parse(response.response.body);
                if (responseObject.error.innererror && 'errordetail' in responseObject.error.innererror) {
                    text = resourceBundle.getProperty('IT_OD_ERRxxx');
                    text = text.replace('{0}', responseObject.error.innererror.errordetail.intErrorMessage);
                } else {
                    text = response.message;
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
                    title : commonResourceBundle.getProperty("Error_TIT")
                });
            }
        }
    };

}());
