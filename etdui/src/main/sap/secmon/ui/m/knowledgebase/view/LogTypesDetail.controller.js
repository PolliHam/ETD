jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.executionResultsfs.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.knowledgebase.util.Formatter");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.knowledgebase.view.LogTypesDetail", {
    ajaxUtil : new sap.secmon.ui.commons.AjaxUtil(),
    EXPORT_SERVICE : "/sap/secmon/services/replication/export.xsjs",
    EXPORT_UPSERT : "Upsert",
    EXPORT_DELETE : "Delete",

    messageUtil : new sap.secmon.ui.commons.GlobalMessageUtil(),

    onInit : function() {
        this.applyCozyCompact();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.ownCommons = new sap.secmon.ui.m.knowledgebase.util.Common();
        this.oEditModel = new sap.ui.model.json.JSONModel();
        this.createEditDialog();
        this.logTypeId = null;
        this.workspacesFilteredModel = new sap.ui.model.json.JSONModel();

        sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(this.onRouteMatched, this);

        var fnNavigation = function() {
            // no need to add URL params for sorting
        };
        sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "workspaceTable", null, fnNavigation);

    },
    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },
    onExportPressed : function(oEvent) {
        var oView = this.getView(), oController = this;
        var oContext = oView.getBindingContext("Knowledgebase"), oData;

        if (oContext) {
            oData = oContext.getObject();
            if (oData) {
                oController.doExport(oData);
            }
        }
    },

    doExport : function(logTypesObject, operation) {
        var that = this;
        var op = operation || this.EXPORT_UPSERT;
        var text, oTextBundle;

        this.ajaxUtil.postJson(this.EXPORT_SERVICE, JSON.stringify({
            Id : that.oCommons.base64ToHex(logTypesObject.hash),
            ObjectType : "LogType",
            ObjectName : logTypesObject.name,
            ObjectNamespace : logTypesObject.nameSpace,
            Operation : op
        }), 
        {
            success : function() {
                if (operation !== that.EXPORT_DELETE) {
                    oTextBundle = that.getView().getModel("i18n").getResourceBundle();
                    text = oTextBundle.getText("KB_LogTypeExported", [ logTypesObject.nameSpace, logTypesObject.name ]);
                    that.messageUtil.addMessage(sap.ui.core.MessageType.Success, text, text);
                    that.getView().getModel("Knowledgebase").refresh();
                }
            },
            fail : function(status, responseText) {
                if (operation !== that.EXPORT_DELETE || status === 400) {
                    that.messageUtil.addMessage(sap.ui.core.MessageType.Error, responseText, responseText);
                }
            }
        });
    },

    onDeletePressed : function(oEvent) {
        var oView = this.getView(), oController = this;
        var oContext = oView.getBindingContext("Knowledgebase"), oData, text, oTextBundle;
        if (oContext) {
            oData = oContext.getObject();
            if (oData) {
                oTextBundle = oView.getModel("i18n").getResourceBundle();
                text = oTextBundle.getText("KB_DelReallyLogType", [ oData.name, oData.nameSpace ]);
                sap.m.MessageBox.confirm(text, {
                    onClose : function(oAction) {
                        if (oAction === sap.m.MessageBox.Action.OK) {
                            oController.onDeleteContent.call(oController, oEvent, oData, oTextBundle);
                        }
                    }
                });
            }
        }

    },
    onDeleteContent : function(oEvent, oData, oTextBundle) {
        var oContext = this.getView().getBindingContext("Knowledgebase"), oController = this;
        var oDeleteLogType = oContext.getObject(), oModel = oContext.getModel(), oView = this.getView();
        oView.unbindElement("Knowledgebase");
        oModel.remove(oContext.getPath(), {
            success : function(data) {
                var oTextBundle = oView.getModel("i18n").getResourceBundle();
                var text = oTextBundle.getText("KB_LogTypeDeleted", [ oDeleteLogType.nameSpace, oDeleteLogType.name ]);
                oController.messageUtil.addMessage(sap.ui.core.MessageType.Success, text, text);
                var oModel = oView.getModel("Knowledgebase");
                
                sap.ui.core.UIComponent.getRouterFor(oController).navTo("logtypes", {}, true);
                oModel.refresh();
                
                // try export delete
                oController.doExport(oData, oController.EXPORT_DELETE);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.ui.core.UIComponent.getRouterFor(oController).navTo("logtypes", {
                    id : oController.oCommons.base64ToHex(oDeleteLogType.hash)
                }, true);
                oView.bindElement("Knowledgebase", oContext.getPath());
                var oTextBundle = oView.getModel("i18n").getResourceBundle();
                var logtypeText = oTextBundle.getText("KB_Log_Type");
                var text = oTextBundle.getText("KB_Del_Error", [ logtypeText, oDeleteLogType.nameSpace, oDeleteLogType.name ]);
                oController.messageUtil.addMessage(sap.ui.core.MessageType.Error, text, text);
            },
            async : true

        });

    },

    onRouteMatched : function(oEvent) {
        if (oEvent.getParameter("name") !== "logtypeDetail") {
            return;
        }
        var oArguments = oEvent.getParameter("arguments");
        var oView = this.getView();
        oView.bindElement("Knowledgebase>/LogType_fixed(X'" + oArguments.id + "')");

        // Set edit, export, copy and delete buttons to visible, if the user has the knowledgeBaseeWrite privilege and the log type is editable
        this.logTypeId = oArguments.id;

        // Filter workspaces for the current logType
        var logTypeName, workspacesFiltered = [];
        logTypeName = this.getComponent().getModel('Knowledgebase').getProperty('/LogType_fixed(X\'' + oArguments.id + '\')/name');
        if (logTypeName) {
            workspacesFiltered = oView.getModel("Workspace").oData.workspaces.filter(function(element) {
                return element.logtype === logTypeName;
            });
        }
        this.workspacesFilteredModel.setProperty("/workspaces", workspacesFiltered);
        oView.setModel(this.workspacesFilteredModel, "WorkspacesFiltered");
    },

    /**
     * Model to specify the button properties of the event detail view
     */
    getEventDetailViewModel : function() {
        var oEventDetailViewModel = new sap.ui.model.json.JSONModel({
            enable : {
                remAttrButton : false,
                changeAttrButton : false
            }
        });
        this.getView().setModel(oEventDetailViewModel, "EventDetailViewModel");
    },

    createEditDialog : function() {
        if (!this.oEditDialog) {
            var oView = this.getView();
            this.oEditDialog = sap.ui.xmlfragment(oView.getId(), "sap.secmon.ui.m.knowledgebase.view.EditDialog", this);
            oView.addDependent(this.oEditDialog);

            var aInputsEdit = [ oView.byId("editDisplayName") ];
            this.oInputValidationService = new sap.secmon.ui.commons.InputValidationService(aInputsEdit);
        }
    },

    getEditModel : function(oEvent) {
        var oSelectedEvent = oEvent.getSource().getBindingContext("Knowledgebase").getObject();
        var data = {
            NameSpace : oSelectedEvent.nameSpace,
            name : oSelectedEvent.name,
            displayName : oSelectedEvent.displayName,
            description : oSelectedEvent.description
        };
        this.oEditModel.setData(data);

        return this.oEditModel;
    },

    /**
     * Event handler: Handle click on edit button
     * 
     * @param oEvent
     */
    onEdit : function(oEvent) {
        this.oEditDialog.setModel(this.getEditModel(oEvent), "edit");
        var oView = this.getView(), oTextBundle = oView.getModel("i18n").getResourceBundle();
        this.oEditDialog.setTitle(oTextBundle.getText("KB_EditLogType"));
        this.oEditDialog.open();
    },

    /**
     * Event handler: Handle click on save button for the "create new" button on the log types tab
     * 
     * @param oEvent
     */
    onSaveEdit : function(oEvent) {
        if (!this.oInputValidationService.checkControls()) {
            return;
        }
        var oView = this.getView(), oController = this;
        var oTextBundle = oView.getModel("i18n").getResourceBundle();
        var oModel = this.oEditDialog.getModel("Knowledgebase");
        var oCreateNewLogTypeModelData = this.oEditDialog.getModel("edit").getData();
        var oBindingContext = oModel.mContexts["/LogType_fixed(X'" + this.logTypeId + "')"];

        var successText = oTextBundle.getText("KB_LogTypeSaved", [ oCreateNewLogTypeModelData.NameSpace, oCreateNewLogTypeModelData.name ]);
        var that = this;
        if (oBindingContext) {
            oModel.setProperty("description", oCreateNewLogTypeModelData.description, oBindingContext);
            oModel.setProperty("displayName", oCreateNewLogTypeModelData.displayName, oBindingContext);
            oModel.submitChanges(function() {
                oController.messageUtil.addMessage(sap.ui.core.MessageType.Success, successText, successText);
                oController.ownCommons.closeDialog(oController.oEditDialog);

                // Reset input validation
                that.oInputValidationService.resetValueStateOfControls();
                oModel.refresh();
            }, function(error) {
                oController.ownCommons.errorDialog(error.message);
            });
        }
    },

    /**
     * Event handler: Called when changing the content of an input field
     */
    onChange : function(oEvent) {
        var oView = this.getView();
        var oTextBundle = oView.getModel("i18n").getResourceBundle();
        this.ownCommons.onChange(oEvent, oTextBundle);
    },

    onCancelEdit : function() {
        this.ownCommons.closeDialog(this.oEditDialog);

        // Reset input validation
        this.oInputValidationService.resetValueStateOfControls();
    },

    onLinkPressed : function(oEvent) {

        var sPath = oEvent.oSource.oParent.oBindingContexts.WorkspacesFiltered.sPath;
        var workspaceId = oEvent.oSource.oParent.oBindingContexts.WorkspacesFiltered.oModel.oData.workspaces[sPath.charAt(sPath.length - 1)].workspaceId;

        // Build the url to navigate to the workspace in the forensic lab
        sap.secmon.ui.m.commons.NavigationService.openBrowseUI(workspaceId);
    },

    onNavBack : function() {
        this.getView().getModel("uiModel").setProperty("/clearSearch", false);
        window.history.go(-1);
    }
});
