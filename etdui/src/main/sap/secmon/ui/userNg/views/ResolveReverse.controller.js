sap.ui.define([ "sap/secmon/ui/m/commons/EtdController", "sap/ui/model/json/JSONModel", "sap/secmon/ui/userNg/util/Utils",
                "sap/secmon/ui/m/commons/NavigationService", "sap/secmon/ui/m/commons/SelectionUtils"], function(EtdController,
        JSONModel, Utils, NavigationService, SelectionUtils) {
    "use strict";

    var ResolveReverseController = EtdController.extend("sap.secmon.ui.userNg.views.ResolveReverse", {

        onInit : function() {
            this._oPseudonymModel = new JSONModel({
                "bHasPseudonyms" : false,
                "aPseudonyms" : []
            });
            this.oRolesModel = new JSONModel({
                "Roles" : [ {
                    displayName : "User Pseudonym, Acting",
                    name : "UserPseudonymActing",
                    key : "53D8FCF497FB1B2EE10000000A4CF109"
                }, {
                    displayName : "User Pseudonym, Initiating",
                    name : "UserPseudonymInitiating",
                    key : "56424E7F1B2FA51BE22A044B51CC7B4D"
                }, {
                    displayName : "User Pseudonym, Targeted",
                    name : "UserPseudonymTargeted",
                    key : "56424E801B2FA51BE22A044B51CC7B4D"
                }, {
                    displayName : "User Pseudonym, Targeting",
                    name : "UserPseudonymTargeting",
                    key : "53EE56531AA9066CE10000000A4CF109"
                }, ]
            });
            this.oUIModel = new JSONModel({
                enableOKButton: false
            });

            this.getView().setModel(this._oPseudonymModel, "pseudonyms");
            this.getView().setModel(this.oRolesModel, "roles");
            this.getView().setModel(this.oUIModel, "UIModel");
            this.createRelatedAccountsFragment();
            this.oPseudonymsTable = this.getView().byId("userng-resolvereverse-userpseudonyms");
            this.enableButtonsIfAtLeastOneRowIsSelected(this.oPseudonymsTable, ["userng-resolvereverse-navToFL"]);
            this.oRelatedAccountsTable = this.getView().byId("accountNameProperties");
            this.enableButtonsIfAtLeastOneRowIsSelected(this.oRelatedAccountsTable, ["userng-resolvereverse-resolve"]);
        },
        
        onInputChange : function(oControlEvent) {
            var inputControl = oControlEvent.getSource();
            var oldValue = oControlEvent.getParameters().value;
            var newValue = oldValue.toUpperCase();
            inputControl.setValue(newValue);
        },
        
        createRelatedAccountsFragment : function() {
            var fnAccountNameProvider = function() {
                return this.getAccountName();
            }.bind(this);
            var oVBox = this.getView().byId("userng-resolvereverse-relatedAccountsContainer");
            this.oRelatedAccountsController = sap.ui.controller("sap.secmon.ui.userNg.views.RelatedAccounts");
            var oFragment = this.oRelatedAccountsController.createFragment(this.getView(), fnAccountNameProvider);
            oVBox.insertItem(oFragment, 0);
        },

        getAccountName : function() {
            var oInput = this.byId("userng-resolvereverse-user");
            return oInput.getValue();           
        },

        onResolvePressed : function(oEvent) {
            var sUser = this.getAccountName();
            if(sUser.length === 0) {
                Utils.showErrorMessage(this.getView(), this.getText("RsUsr_EnterAccName"));
                return;
            }
            this.resolve([sUser]);
        },
        
        onRelatedAccountsResolvePressed : function() {
            var aAccountNames = this.oRelatedAccountsController.getSelectedAccounts();
            this.resolve(aAccountNames);
        },
        
        resolve : function(aAccountNames) {
            var that = this;
            this.resolveAliases(aAccountNames).then(function(vData) {
                var pseudonymExists = Array.isArray(vData) && vData.length > 0;
                var aPseudonyms = Array.isArray(vData) ? vData : [];
                if (!pseudonymExists) {
                    Utils.showErrorMessage(that.getView(), that.getText("ResolveUser_MSG_InvalidUser"));
                }
                that._oPseudonymModel.setProperty("/bHasPseudonyms", pseudonymExists);
                that._oPseudonymModel.setProperty("/aPseudonyms", aPseudonyms);
            }, function(oError) {
                Utils.showErrorMessage(that.getView(), oError.message);
            }).finally(function() {
                var logModel = that.getView().getModel("log");
                logModel.refresh();
            });
        },

        onPseudonymTableUpdate : function(oEvent) {
            var iTotal = oEvent.getParameter("total");
            this.getView().fireEvent("countChange", {
                count : iTotal
            });
        },

        onNavigatePressed : function(oEvent) {
            if (!this._oProcessInFLDialog) {
                this._oProcessInFLDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.userNg.fragments.ChooseRoleDialog", this);
                this.getView().addDependent(this._oProcessInFLDialog);
            }
            this._oProcessInFLDialog.open();
        },

        onConfirmRoleSelectDialog : function(oEvent) {
            var aSelectedItems = this.getView().byId("rolesList").getSelectedItems();
            if (aSelectedItems.length > 0) {
                this.onCloseRoleSelectDialog();
                var aNewSelectedRoleItems = aSelectedItems.map(function(oItem) {
                    return oItem.getBindingContext("roles").getObject().key;
                }, this);
                var sRoles = aNewSelectedRoleItems.join();
                this.navigateToFL(sRoles);
            } else {
                sap.m.MessageBox.show(this.getView().getModel("i18n").getResourceBundle().getText("ResolveUser_ChooseAtLeastOne"), {
                    icon : sap.m.MessageBox.Icon.ERROR,
                    title : this.getView().getModel("i18n").getResourceBundle().getText("ResolveUser_RoleSelection")
                });
            }
        },
        
        getSelectedPseudonyms : function() {
            var aAccountNames = [];
            SelectionUtils.getSelectedContexts(this.oPseudonymsTable).forEach(function(oContext) {
                aAccountNames.push(oContext.getProperty("Pseudonym"));
            });
            return aAccountNames;
        },
        
        navigateToFL : function(sRoles) {
            var sAccountNamePseudonyms = this.getSelectedPseudonyms().join(",");   
            var sUrl = "/sap/secmon/ui/browse/?AccountNamePseudonyms=" + sAccountNamePseudonyms + "&Roles=" + sRoles + NavigationService.getLanguage();
            window.open(sUrl);
            setTimeout(this.getView().getModel("log").refresh, 1000);            
        },

        onCloseRoleSelectDialog : function() {
            var oRolesList = this.getView().byId("rolesList");
            oRolesList.removeSelections(true);
            oRolesList.getBinding("items").filter([]);
            this.getView().byId("rolesSearch").setValue("");
            this._oProcessInFLDialog.close();
            this.oUIModel.setProperty("/enableOKButton", false);
        },

        onSearchRoles : function(oEvent) {
            var sValue = oEvent.getParameter("query");
            var oFilter = new sap.ui.model.Filter("displayName", sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = this.getView().byId("rolesList").getBinding("items");
            oBinding.filter([ oFilter ]);
        },
        
        resolveAliases : function(aAccountNames) {
            var sAccountNames = JSON.stringify(aAccountNames);
            return Utils.post("/sap/secmon/services/ui/m/pseudonymization/pseudonyms.xsjs/?operation=RESOLVE", sAccountNames);
        },

        onSelectionChange : function(oEvent) {
            if (oEvent.getSource().getSelectedItems().length > 0) {
                this.oUIModel.setProperty("/enableOKButton", true);
                return;    
            }
            this.oUIModel.setProperty("/enableOKButton", false);
        }
    });

    return ResolveReverseController;
});