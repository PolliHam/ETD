$.sap.declare("sap.secmon.ui.commons.AjaxUtil");

sap.secmon.ui.commons.AjaxUtil = function() {
    if (sap.secmon.ui.commons.AjaxUtil.prototype.singletoninstance) {
        return sap.secmon.ui.commons.AjaxUtil.prototype.singletoninstance;
    }
    sap.secmon.ui.commons.AjaxUtil.prototype.singletoninstance = this;

    this.getXCSRFToken = function(url, options) {

        return jQuery.ajax({
            url : url,
            async : false,
            type : "GET",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", "Fetch");
            },
            success : function(data, textStatus, XMLHttpRequest) {

            },
            error : function(xhr, textStatus, errorThrown) {
                console.error(textStatus + " " + errorThrown);
                if (options && options.hasOwnProperty("fail")) {
                    options.fail(xhr.status, xhr.responseText);
                }
            },
            fail : function(xhr, textStatus, errorThrown) {
                console.error(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
                if (options && options.hasOwnProperty("fail")) {
                    options.fail(xhr.status, xhr.responseText);
                }
            }
        });
    };

    this.postJson = function(url, body, options) {

        var XCSRFToken = this.getXCSRFToken("/sap/secmon/services/ui/commons/dummyService.xsjs").getResponseHeader('X-CSRF-Token');

        return jQuery.ajax({
            url : url,
            async : true,
            type : "POST",
            contentType : "application/json; charset=utf-8",
            data : body,
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", XCSRFToken);
            },
            success : function(data, textStatus, XMLHttpRequest) {
                var originLocation = XMLHttpRequest.getResponseHeader("x-sap-origin-location");
                var loginHeader = XMLHttpRequest.getResponseHeader("x-sap-login-page");
                if (loginHeader !== null && originLocation !== null) {
                    document.location.reload(true);
                }
                if (options && options.hasOwnProperty("success")) {
                    options.success();
                }
            },
            error : function(xhr, textStatus, errorThrown) {
                console.error(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
                if (options && options.hasOwnProperty("fail")) {
                    options.fail(xhr.status, xhr.responseText);
                }
            },
            fail : function(xhr, textStatus, errorThrown) {
                console.error(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
                if (options && options.hasOwnProperty("fail")) {
                    options.fail(xhr.status, xhr.responseText);
                }
            }
        });
    };

    this.putJson = function(url, body, options) {

        var XCSRFToken = this.getXCSRFToken("/sap/secmon/services/ui/commons/dummyService.xsjs").getResponseHeader('X-CSRF-Token');

        return jQuery.ajax({
            url : url,
            async : true,
            type : "PUT",
            contentType : "application/json; charset=utf-8",
            data : body,
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", XCSRFToken);
            },
            success : function(data, textStatus, XMLHttpRequest) {
                var originLocation = XMLHttpRequest.getResponseHeader("x-sap-origin-location");
                var loginHeader = XMLHttpRequest.getResponseHeader("x-sap-login-page");
                if (loginHeader !== null && originLocation !== null) {
                    document.location.reload(true);
                }
                if (options && options.hasOwnProperty("success")) {
                    options.success();
                }
            },
            error : function(xhr, textStatus, errorThrown) {
                console.error(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
                if (options && options.hasOwnProperty("fail")) {
                    options.fail(xhr.status, xhr.responseText);
                }
            },
            fail : function(xhr, textStatus, errorThrown) {
                console.error(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
                if (options && options.hasOwnProperty("fail")) {
                    options.fail(xhr.status, xhr.responseText);
                }
            }
        });
    };

    this.deleteJSON = function(url, body, options) {

        var XCSRFToken = this.getXCSRFToken("/sap/secmon/services/ui/commons/dummyService.xsjs").getResponseHeader('X-CSRF-Token');

        return jQuery.ajax({
            url : url,
            async : true,
            type : "DELETE",
            contentType : "application/json; charset=utf-8",
            data : body,
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", XCSRFToken);
            },
            success : function(data, textStatus, XMLHttpRequest) {
                var originLocation = XMLHttpRequest.getResponseHeader("x-sap-origin-location");
                var loginHeader = XMLHttpRequest.getResponseHeader("x-sap-login-page");
                if (loginHeader !== null && originLocation !== null) {
                    document.location.reload(true);
                }
            },
            error : function(xhr, textStatus, errorThrown) {
                console.error(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
                if (options && options.hasOwnProperty("fail")) {
                    options.fail(xhr.status, xhr.responseText);
                }
            },
            fail : function(xhr, textStatus, errorThrown) {
                console.error(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
                if (options && options.hasOwnProperty("fail")) {
                    options.fail(xhr.status, xhr.responseText);
                }
            }
        });
    };

};