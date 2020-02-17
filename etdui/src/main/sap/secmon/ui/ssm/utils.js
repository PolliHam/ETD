$.sap.declare("sap.secmon.ui.ssm.utils");

$.sap.require("sap.secmon.ui.commons.CommonFunctions");

sap.secmon.ui.ssm.utils = {};

sap.secmon.ui.ssm.utils.CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
sap.secmon.ui.ssm.utils.XCSRFToken = "";

sap.secmon.ui.ssm.utils.createApplicationContextModelSync = function() {
    if (!sap.ui.getCore().getModel('applicationContext')) {
        var oDeferred = $.Deferred();
        var oCommons = this.oCommons;
        $.ajax({
            url : encodeURI("/sap/secmon/services/common/ApplicationContext.xsjs"),
            async : false,
            type : "GET",
            success : function(data, textStatus, XMLHttpRequest) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(data);
                sap.ui.getCore().setModel(oModel, 'applicationContext');
                oDeferred.resolve(oModel);
            },
            error : function(xhr, textStatus, errorThrown) {
                oDeferred.reject();
                alert(oCommons.constructAjaxErrorMsg(xhr, textStatus, errorThrown));
            }
        });
        return oDeferred.promise();
    }
},

sap.secmon.ui.ssm.utils.postJSon = function(url, body, async) {
    if (sap.secmon.ui.ssm.utils.XCSRFToken === "") {
        sap.secmon.ui.ssm.utils.XCSRFToken = sap.secmon.ui.ssm.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
    }

    return $.ajax({
        url : url,
        async : async !== undefined ? async : true,
        type : "POST",
        contentType : "application/json;charset=utf-8",
        data : body,
        beforeSend : function(xhr) {
            xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.ssm.utils.XCSRFToken);
        },
        success : function(data, textStatus, XMLHttpRequest) {
            var originLocation = XMLHttpRequest.getResponseHeader("x-sap-origin-location");
            var loginHeader = XMLHttpRequest.getResponseHeader("x-sap-login-page");
            if (loginHeader !== null && originLocation !== null) {
                document.location.reload(true);
            }
        },
        fail : function(xhr, textStatus, errorThrown) {
            if (textStatus === "error") {
                if (xhr.status === 403) { // Forbidden
                    if (xhr.getResponseHeader("X-CSRF-Token")) {
                        var that = this;
                        sap.secmon.ui.browse.utils.XCSRFToken = sap.secmon.ui.browse.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
                        $.ajax(that);
                        return;
                    }
                }
                console.log(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
            }
        }
    });
};

sap.secmon.ui.ssm.utils.getXCSRFToken = function() {
    return $.ajax({
        url : "/sap/secmon/services/token.xsjs",
        async : false,
        type : "GET",
        beforeSend : function(xhr) {
            xhr.setRequestHeader("X-CSRF-Token", "Fetch");
        },
        success : function(data, textStatus, XMLHttpRequest) {

        },
        error : function(xhr, textStatus, errorThrown) {
            console.log(textStatus + " " + errorThrown);
        }
    });
};

sap.secmon.ui.ssm.utils.getController = function() {
    return sap.ui.getCore().byId('idShell--shlMain').getParent().getController();
};

sap.secmon.ui.ssm.utils.getView = function() {
    return sap.ui.getCore().byId('idShell');
};

// new sap.ui.model.type.Date({source: {pattern: "YYYY-MM-ddTHH:mm:ssZ"}, ..
sap.secmon.ui.ssm.utils.formatDateTime = function(dVal) {
    // format of UTC time without millisec and with Z for UTC
    var oDateTimeFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
        pattern : "yyyy-MM-ddTHH:mm:ss"
    });

    // timezoneOffset is in hours convert to milliseconds
    var TZOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
    // format date and time to strings offsetting to GMT
    return oDateTimeFormat.format(new Date(dVal.getTime() + TZOffsetMs)) + "Z";
};

// new sap.ui.model.type.Date({source: {pattern: "YYYY-MM-ddTHH:mm:ssZ"}, ..
sap.secmon.ui.ssm.utils.formatDateTime = function(dVal) {
    // format of UTC time without millisec and with Z for UTC
    var oDateTimeFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
        pattern : "yyyy-MM-ddTHH:mm:ss"
    });

    // timezoneOffset is in hours convert to milliseconds
    var TZOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
    // format date and time to strings offsetting to GMT
    return oDateTimeFormat.format(new Date(dVal.getTime() + TZOffsetMs)) + "Z";
};

sap.secmon.ui.ssm.utils.formatISODateTime =
        function(d) {
            // YYYY-MM-DDThh:mm:ss
            return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + 'T' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) +
                    ':' + ('0' + d.getSeconds()).slice(-2);
        };

String.prototype.splice = function(idx, rem, s) {
    return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};