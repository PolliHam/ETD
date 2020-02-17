jQuery.sap.require("sap.secmon.ui.m.settings.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.m.commons.UIUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.SelectionUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.ui.model.odata.CountMode");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.settings.view.ContentReplications", {

    STATUS_ACTIVE : "Active",
    STATUS_INACTIVE : "Inactive",

    constructor : function() {
        sap.ui.core.mvc.Controller.apply(this, arguments);
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.oUiUtils = new sap.secmon.ui.m.commons.UIUtils();
    },

    onInit : function() {
        var that = this;
        this.oModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/replication/ContentReplication.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.oModel.attachRequestFailed(this.oCommons.handleRequestFailed);
        this.getView().setModel(this.oModel);
        var oTable = this.getContentReplicationsTable();
        this.enableButtonsIfAtLeastOneRowIsSelected(this.getContentReplicationsTable(), [ "deleteButton" ]);
        this.enableButtonsIfSelectedRowsMatch(oTable, [ "activateButton" ], $.proxy(function(aSelection) {
            return aSelection.some(function(oSelectedItem) {
                return oSelectedItem.getBindingContext().getProperty("Status") === that.STATUS_INACTIVE;
            }, this);
        }, this));
        this.enableButtonsIfSelectedRowsMatch(oTable, [ "deactivateButton" ], $.proxy(function(aSelection) {
            return aSelection.some(function(oSelectedItem) {
                return oSelectedItem.getBindingContext().getProperty("Status") === that.STATUS_ACTIVE;
            }, this);
        }, this));
        this.oMessageManager = sap.ui.getCore().getMessageManager();
    },

    onBackButtonPressed : function() {
        window.history.go(-1);
    },

    onAddContentReplication : function() {
        if (!this.addContentReplicationDialog) {
            this.createAddContentReplicationDialog();
        }
        this.oEditModel = new sap.ui.model.json.JSONModel({
            objectTypeArea : "DevelopmentObjects",
            sourceSystem : "",
            targetSystem : "",
            status : this.STATUS_ACTIVE
        });
        this.addContentReplicationDialog.setModel(this.oEditModel);
        this.addContentReplicationDialog.setModel(this.oModel, "Configuration");
        this.oInputValidationService.resetValueStateOfControls();
        this.addContentReplicationDialog.open();
    },

    onDeleteContentReplication : function() {
        var that = this;
        var confirmationText = this.getText("ContRep_confirmDel_XMSG");
        var confirmationTitle = this.getCommonText("Delete_TIT");
        sap.m.MessageBox.confirm(confirmationText, {
            title : confirmationTitle,
            icon : sap.m.MessageBox.Icon.WARNING,
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.DELETE) {
                    that.deleteSelectedContentReplications();
                }
            }
        });
    },

    deleteSelectedContentReplications : function() {
        var that = this;
        var bError = false;
        var fnError = function() {
            bError = true;
        };
        var aContexts = this.getContentReplicationsTable().getSelectedContexts();
        aContexts.forEach(function(oContext) {
            var id = that.oCommons.base64ToHex(oContext.getProperty("Id"));
            that.oModel.remove(that.getConfigurationURI(id), {
                error : fnError
            });
        });
        this.oModel.refresh();
        if (bError) {
            that.showODataError("ContRep_deleteError_XMSG");
        } else {
            sap.m.MessageToast.show(that.getText("ContRep_deleteOK_XMSG"));
        }
    },

    getConfigurationURI : function(sKey) {
        return "Configuration(X'" + sKey + "')";
    },

    onActivateContentReplication : function() {
        this.activateContentReplication(true);
    },

    activateContentReplication : function(bActivate) {
        var that = this;
        var oData = {
            Status : bActivate ? this.STATUS_ACTIVE : this.STATUS_INACTIVE
        };
        var bError = false;
        var fnError = function() {
            bError = true;
        };
        var aContexts = this.getContentReplicationsTable().getSelectedContexts();
        aContexts.forEach(function(oContext) {
            var id = that.oCommons.base64ToHex(oContext.getProperty("Id"));
            that.oModel.update(that.getConfigurationURI(id), oData, {
                merge : true,
                error : fnError
            });
        });
        this.oModel.refresh();
        if (bError) {
            that.showODataError("ContRep_updateError_XMSG");
        } else {
            sap.m.MessageToast.show(that.getText("ContRep_updateOK_XMSG"));
        }
    },

    onDeactivateContentReplication : function() {
        this.activateContentReplication(false);
    },

    getContentReplicationsTable : function() {
        return this.getView().byId("contentReplicationsTable");
    },

    createAddContentReplicationDialog : function() {
        this.addContentReplicationDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.settings.view.AddContentReplicationDialog", this);
        this.addContentReplicationDialog.setModel(this.baseI18nModel, "i18n");
        var oView = this.getView();
        oView.addDependent(this.addContentReplicationDialog);
        var aInputs = [ oView.byId("sourceSystemInput"), oView.byId("targetSystemInput") ];
        this.oInputValidationService = new sap.secmon.ui.commons.InputValidationService(aInputs);
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.addContentReplicationDialog);
    },

    addErrorMessageToMessageManager : function( sElementId,sErrorName){
        this.oMessageManager.addMessages(this.getMessageTemplate(sElementId, this.getView().getModel("i18n").getResourceBundle().getText(sErrorName)));
    },

    checkSystemName: function (sName){
        return sName.search('^[A-Z]{1}[A-Z0-9]{2}@[A-Z]{1}[A-Z0-9]{2}$') === 0 ;
    },

    inputValidation: function (){
        var sSID=this.getComponent().getModel("applicationContext").getProperty('/SID');
        this.oMessageManager.removeAllMessages();
        var oSourceSystem=this.getView().byId('sourceSystemInput');
        var sSourceSystemValue=oSourceSystem.getValue();
        var oTargetSystem=this.getView().byId('targetSystemInput');
        var sTargetSystemValue=oTargetSystem.getValue();
        
        if(sSourceSystemValue===sTargetSystemValue){
            this.addErrorMessageToMessageManager(oSourceSystem.getId(),'ContRep_EnterSystemEqual_XMSG');
        } else if(sSourceSystemValue !== sSID && sTargetSystemValue !== sSID){
            this.addErrorMessageToMessageManager(oSourceSystem.getId(),'ContRep_EnterSystemInvalid_XMSG');
            this.addErrorMessageToMessageManager(oTargetSystem.getId(),'ContRep_EnterSystemInvalid_XMSG');
        } else if(!this.checkSystemName(sSourceSystemValue)){
            this.addErrorMessageToMessageManager(oSourceSystem.getId(),'ContRep_EnterSystemNameInvalid_XMSG');
        } else if(!this.checkSystemName(sTargetSystemValue)){
            this.addErrorMessageToMessageManager(oTargetSystem.getId(),'ContRep_EnterSystemNameInvalid_XMSG');
        }

        if (this.oMessageManager.getMessageModel().oData.length > 0) {
            return false; 
        }
        return true;
    },
    onAddContentReplicationDialogOk : function() { 
        if(!this.inputValidation()){
            return;
        }
        var oData = this.oEditModel.getData();
        var oNewContentReplication = {
             // Dummy GUID. OData expects an entry for every field and validates the format. Will be replaced on server with unique one.
             Id : "0000000000000000",
             SourceSystem : oData.sourceSystem,
             TargetSystem : oData.targetSystem,
             Status : oData.status,
             ObjectTypeArea : oData.objectTypeArea
            };
            var that = this;
            // synchronous creation request
            this.oModel.create("Configuration", oNewContentReplication, {
                success : function() {
                    sap.m.MessageToast.show(that.getText("ContRep_createOK_XMSG"));
                },
                error : function(oError) {
                    that.showODataError("ContRep_createError_XMSG");
                }
            });
            this.addContentReplicationDialog.close();   
    },

    onAddContentReplicationDialogCancel : function() {
        this.addContentReplicationDialog.close();
    },

    showODataError : function(sMessageKey, oError) {
        this.oUiUtils.showAlert(this.getView(), this.getText(sMessageKey));
    },

    getSelectedContentReplications : function() {
        return sap.secmon.ui.m.commons.SelectionUtils.getIdPropertiesOfSelectedContextsAndDecode(this.getContentReplicationsTable(), "Id");
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/a3a81dfef7524dc19cc3ea6186c39e39.html");
    },
    getMessageTemplate: function (sInputId, sMessageText) {
        return new sap.ui.core.message.Message({
            type: sap.ui.core.MessageType.Error,
            technical: true,
            processor: new sap.ui.core.message.ControlMessageProcessor(),
            message: sMessageText,
            target: sInputId+'/value',
        });
    },

});
