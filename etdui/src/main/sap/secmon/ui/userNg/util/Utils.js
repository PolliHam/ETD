/* global Promise */
sap.ui.define([ "sap/secmon/ui/commons/AjaxUtil", "sap/m/Dialog", "sap/m/Button", "sap/m/Text" ], function(AjaxUtil, Dialog, Button, Text) {
    "use strict";

    var Utils = {
        oAjaxUtil : new AjaxUtil(),

        showErrorMessage : function(oView, sError) {
            var oDialog = new Dialog({
                title : "{i18n>ResolveUser_DialogErrorTitle}",
                type : "Message",
                state : "Error",
                content : new Text({
                    text : sError
                }),
                beginButton : new Button({
                    text : "{i18n>ResolveUser_DialogCloseButton}",
                    press : function() {
                        oDialog.close();
                    }
                }),
                afterClose : function() {
                    oDialog.destroy();
                }
            });
            oView.addDependent(oDialog);
            oDialog.open();
        },

        post : function(sUrl, mData) {
            return new Promise(function(fnResolve, fnReject) {
                var oJQXHR = Utils.oAjaxUtil.postJson(sUrl, mData);
                oJQXHR.success(function(vResponse) {
                    fnResolve(vResponse);
                });
                oJQXHR.error(function(oJXHR) {
                    fnReject(new Error(oJXHR.responseText));
                });
            });
        }
    };

    return Utils;
});