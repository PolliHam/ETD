sap.ui.define([ "sap/secmon/ui/m/commons/EtdController", "sap/secmon/ui/userNg/util/Utils", "sap/secmon/ui/userNg/util/Formatter" ], function(EtdController, Utils, Formatter) {
    "use strict";

    var ResolveController = EtdController.extend("sap.secmon.ui.userNg.views.Resolve", {

        onInit : function() {
            var vbox = this.getView().byId("vbox");
            this.oRelatedAccountsController = sap.ui.controller("sap.secmon.ui.userNg.views.RelatedAccounts");
            var fnAccountNameProvider = function() {
                return this.getAccountName();
            }.bind(this);
            var oFragment = this.oRelatedAccountsController.createFragment(this.getView(), fnAccountNameProvider);
            this.oRelatedAccountsController.disable();
            vbox.addItem(oFragment);
        },

        onInputChange : function(oControlEvent) {
            var inputControl = oControlEvent.getSource();
            var oldValue = oControlEvent.getParameters().value;
            var newValue = oldValue.toUpperCase();
            inputControl.setValue(newValue);
        },

        getAccountName : function() {
            return this.getView().getModel("viewModel").getProperty("/accountName");
        },

        onResolvePressed : function(oEvent) {
            var oView = this.getView();
            var oInput = this.byId("userng-resolve-pseudonym");
            var sPseudonym = oInput.getValue();
            if (!this.validatePseudonym(oView, sPseudonym)) {
                return;
            }
            var that = this;
            sap.ui.core.BusyIndicator.show();
            this.resolveUser(sPseudonym).then(function(oUserId) {
                var sUserId = oUserId.USERID;
                var sAccountName = oUserId.ACCOUNT_NAME;
                if (!sUserId) {
                    sAccountName = "";
                    var sErrorMessage = that.getText('ResolveUser_MSG_InvalidUserId', sPseudonym);
                    Utils.showErrorMessage(oView, sErrorMessage);
                }
                oView.getModel("viewModel").setProperty("/accountName", oUserId.ACCOUNT_NAME);
                that.oRelatedAccountsController.enable();
            }, function(oError) {
                Utils.showErrorMessage(oView, oError.message);
            }).finally(function() {
                sap.ui.core.BusyIndicator.hide();
                oView.getModel("log").refresh();
            });
        },

        validatePseudonym : function(oView, sPseudonym) {
            var rValidatePseudonym = /^[A-Z]{4,10}_[0-9]{1,5}$/;
            if (!sPseudonym) {
                Utils.showErrorMessage(oView, this.getText("RsUsr_EnterPseudonym"));
                return false;
            }
            if (sPseudonym.match(rValidatePseudonym)) {
                return true;
            }
            Utils.showErrorMessage(oView, this.getText("RsUsr_EnterPseudonym"));
            return false;
        },
        
        resolveUser : function resolveUser(sPseudonym) {
            return Utils.post("/sap/secmon/services/ui/m/pseudonymization/resolveUser.xsjs/?alias=" + sPseudonym.toUpperCase(), {});
        }
    });

    return ResolveController;
});