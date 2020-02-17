sap.ui.define([ "sap/ui/core/mvc/Controller", "sap/secmon/ui/userNg/util/Utils", "sap/secmon/ui/m/commons/SelectionUtils" ], function(Controller, Utils, SelectionUtils) {
    "use strict";

    var RelatedAccounts = Controller.extend("sap.secmon.ui.userNg.views.RelatedAccounts", {

        createFragment : function(oParentView, fnAccountNameProvider) {
            this.fnAccountNameProvider = fnAccountNameProvider;
            this.oParentView = oParentView;
            this.oFragment = sap.ui.xmlfragment(oParentView.getId(), "sap.secmon.ui.userNg.views.RelatedAccounts", this);
            this.oModel = new sap.ui.model.json.JSONModel({
                includeAccountName : true,
                includePersonalNumber : false,
                includeEmail : true,
                includeAlias : false,
                includeSAPName : true,
                includeSNCNameP : false,
                includeAccountNumber : false,
                accountsAvailable : false,
            });
            this.oFragment.setModel(this.oModel, "relatedAccounts");
            this.oAccountsModel = new sap.ui.model.json.JSONModel({});
            this.oFragment.setModel(this.oAccountsModel, "relatedAccountsResult");
            return this.oFragment;
        },
        
        enable : function(){
            this.oParentView.byId("calculateRelatedAccountsButton").setEnabled(true);
        },
        
        disable : function(){
            this.oParentView.byId("calculateRelatedAccountsButton").setEnabled(false);
        },

        onCalculateRelatedAccounts : function() {
            var oData = this.oModel.getData();
            oData.accountName = this.fnAccountNameProvider();
            if(oData.accountName.length === 0) {
                this.showErrorMessage("RsUsr_EnterAccName");
                return;
            }
            var that = this;
            sap.ui.core.BusyIndicator.show();
            this.getRelatedAccounts(oData).then(function(oData) {
                that.oAccountsModel.setData(oData);
                that.oModel.setProperty("/accountsAvailable", true);
                if(oData.maxAccountExceeded) {
                    that.showErrorMessage("RsUsr_TooManyAccounts");
                }
            }, function(oError) {
                Utils.showErrorMessage(that.oParentView, oError.message);
            }).finally(function() {
                // always called
                sap.ui.core.BusyIndicator.hide();
            });
        },
        
        showErrorMessage : function(sMessageKey) {
            Utils.showErrorMessage(this.oParentView, this.oParentView.getModel("i18n").getProperty(sMessageKey));
        },

        getRelatedAccounts : function(oParameters) {
            return Utils.post("/sap/secmon/services/ui/m/pseudonymization/relatedAccounts.xsjs", JSON.stringify(oParameters));
        },
        
        getSelectedAccounts : function() {
            var aAccountNames = [];
            var oTable = this.oParentView.byId("accountNameProperties");
            SelectionUtils.getSelectedContexts(oTable).forEach(function(oContext) {
                aAccountNames.push(oContext.getProperty("AccountName"));
            });
            return aAccountNames;
        }
    });

    return RelatedAccounts;

});
