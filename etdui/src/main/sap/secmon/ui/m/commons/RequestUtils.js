jQuery.sap.require("sap.secmon.ui.commons.TextUtils");

jQuery.sap.declare("sap.secmon.ui.m.commons.RequestUtils");

jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

sap.secmon.ui.m.commons.RequestUtils = function() {

    this.postRequest = function(url, objectToSendAsJSON, csrfToken, fnSuccess) {
        this.sendRequest("POST", url, objectToSendAsJSON, csrfToken, fnSuccess);
    };

    this.sendRequest = function(requestType, url, objectToSendAsJSON, csrfToken, fnSuccess) {
        $.ajax({
            type : requestType,
            url : url,
            data : JSON.stringify(objectToSendAsJSON),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            },
            success : function(data) {
                fnSuccess(data);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.m.MessageBox.alert(XMLHttpRequest.responseText, {
                    title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                });
            }
        });
    };

};
