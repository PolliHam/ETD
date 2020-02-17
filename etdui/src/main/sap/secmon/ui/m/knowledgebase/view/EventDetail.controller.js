jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.secmon.ui.m.commons.RequestUtils");
jQuery.sap.require("sap.secmon.ui.m.knowledgebase.util.Common");
jQuery.sap.require("sap.secmon.ui.m.knowledgebase.util.Formatter");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.knowledgebase.view.EventDetail", {
    ajaxUtil : new sap.secmon.ui.commons.AjaxUtil(),
    EXPORT_SERVICE : "/sap/secmon/services/replication/export.xsjs",
    EXPORT_UPSERT : "Upsert",
    EXPORT_DELETE : "Delete",
    EVENT_SERVICE_URL : "/sap/secmon/services/ui/knowledgebase/event.xsjs",
    EVENT_ROLE_ATTR_ASSIGN_SERVICE_URL : "/sap/secmon/services/ui/knowledgebase/eventattr.xsjs",
    messageUtil : new sap.secmon.ui.commons.GlobalMessageUtil(),

    /**
     * @memberOf sap.secmon.ui.m.knowledgebase.view.EventDetail
     */
    onInit : function() {
        this.applyCozyCompact();
        this.ownCommons = new sap.secmon.ui.m.knowledgebase.util.Common();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.requestCommons = new sap.secmon.ui.m.commons.RequestUtils();
        this.oAssignDialog = null;
        this.oCreateNewEventModel = new sap.ui.model.json.JSONModel();
        this.getEventDetailViewModel();
        this.createCopyDialog();
        this.createEditDialog();
        this.createChangeRelevanceDialog();

        sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(this.onRouteMatched, this);

        var fnNavigation = function() {
            // no need to add URL params for sorting
        };
        sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "relatedAttribute", sap.secmon.ui.m.commons.ServiceConstants.ASSIGNED_ATTRIBUTES_SERVICE, fnNavigation);

    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    onRouteMatched : function(oEvent) {
        if (oEvent.getParameter("name") !== "eventDetail") {
            return;
        }
        var oArguments = oEvent.getParameter("arguments");
        var oView = this.getView();
        oView.bindElement("Knowledgebase>/Event(X'" + oArguments.id + "')/");
    },

    onLinkPressed : function(oEvent) {
        var oSource = oEvent.getSource();
        var oCustomData = oSource.getCustomData();

        var id = oCustomData.filter(function(dataEntry) {
            return "Id" === dataEntry.getKey();
        });
        if (id.length > 0) {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("attributesDetail", {
                id : this.oCommons.base64ToHex(id[0].getValue())
            });
        }
    },

    createEditDialog : function() {
        if (!this.oEditDialog) {
            var oView = this.getView();
            this.oEditDialog = sap.ui.xmlfragment(oView.getId(), "sap.secmon.ui.m.knowledgebase.view.EditDialog", this);
            oView.addDependent(this.oEditDialog);

            var aInputsEdit = [ oView.byId("editDisplayName") ];
            this.oInputValidationServiceEdit = new sap.secmon.ui.commons.InputValidationService(aInputsEdit);
        }
    },

    /**
     * Model to specify the button properties of the event detail view
     */
    getEventDetailViewModel : function() {
        var oEventDetailViewModel = new sap.ui.model.json.JSONModel({
            enable : {
                remAttrButton : false,
                changeAttrButton : false
            },
            visible : {
                editEventButton : false,
                exportEventButton : false,
                copyEventButton : false,
                deleteEventButton : false
            }
        });
        this.getView().setModel(oEventDetailViewModel, "EventDetailViewModel");
    },

    getEditEventModel : function(oEvent) {
        var oSelectedEvent = oEvent.getSource().getBindingContext("Knowledgebase").getObject();
        var data = {
            NameSpace : oSelectedEvent.nameSpace,
            name : oSelectedEvent.name,
            displayName : oSelectedEvent.displayName,
            description : oSelectedEvent.description
        };
        this.oCreateNewEventModel.setData(data);

        return this.oCreateNewEventModel;
    },

    /**
     * Event handler: Handle click on edit button
     * 
     * @param oEvent
     */
    onEdit : function(oEvent) {
        this.oEditDialog.setModel(this.getEditEventModel(oEvent), "edit");
        var oView = this.getView(), oTextBundle = oView.getModel("i18n").getResourceBundle();
        this.oEditDialog.setTitle(oTextBundle.getText("KB_EditEvent"));
        this.oEditDialog.open();
    },

    /**
     * Event handler: Handle click on save button of the edit event dialog
     * 
     * @param oEvent
     */
    onSaveEdit : function() {
        if (!this.oInputValidationServiceEdit.checkControls()) {
            return;
        }
        var oView = this.getView(), oTextBundle = oView.getModel("i18n").getResourceBundle();
        var oKnowledgeBaseModel = oView.getModel("Knowledgebase");
        var oEditEventModelData = this.oEditDialog.getModel("edit").getData();
        var sCSRFToken = this.oCommons.getXCSRFToken();

        this.ownCommons.onSaveEvent(this, oView, oKnowledgeBaseModel, oTextBundle, oEditEventModelData, this.EVENT_SERVICE_URL, sCSRFToken, this.oEditDialog, this.oInputValidationServiceEdit);
    },

    onCancelEdit : function() {
        this.ownCommons.closeDialog(this.oEditDialog);

        // Reset input validation
        this.oInputValidationServiceEdit.resetValueStateOfControls();
    },

    /**
     * Event handler: Handle click on copy button
     * 
     * @param oEvent
     */
    onCopyPressed : function(oEvent) {
        this.oCopyDialog.setModel(this.getCopyEventModel(oEvent), "newEntry");
        this.oCopyDialog.open();
    },

    /**
     * Event handler: Handle click on copy button
     * 
     * @param oEvent
     */
    createCopyDialog : function() {
        var oView = this.getView();
        if (!this.oCopyDialog) {
            this.oCopyDialog = sap.ui.xmlfragment(oView.getId(), "sap.secmon.ui.m.knowledgebase.view.CopyEventDialog", this);
            oView.addDependent(this.oCopyDialog);

            var aInputsEdit = [ oView.byId("copyEventName"), oView.byId("copyEventDisplayName") ];
            this.oInputValidationServiceCopy = new sap.secmon.ui.commons.InputValidationService(aInputsEdit);
        }
    },

    getCopyEventModel : function(oEvent) {
        var oSelectedEvent = oEvent.getSource().getBindingContext("Knowledgebase").getObject();
        var data = {
            NameSpace : oSelectedEvent.nameSpace,
            name : "CopyOf" + oSelectedEvent.name,
            displayName : "Copy of " + oSelectedEvent.displayName,
            description : oSelectedEvent.description,
            copyAttributes : "true"
        };
        this.oCreateNewEventModel.setData(data);

        return this.oCreateNewEventModel;
    },

    /**
     * Event handler: Handle click on save button for the "create new event" button
     * 
     * @param oEvent
     */
    onSaveCopyEvent : function() {
        if (!this.oInputValidationServiceCopy.checkControls()) {
            return;
        }
        var oView = this.getView();
        var oTextBundle = oView.getModel("i18n").getResourceBundle();
        var oKnowledgeBaseModel = oView.getModel("Knowledgebase");
        var oCreateNewEventModelData = this.oCopyDialog.getModel("newEntry").getData();
        oCreateNewEventModelData.NameSpace = oView.byId("createNewEventNameSpace").getSelectedItem().getProperty("text");
        if (!this.ownCommons.checkNamespace(oCreateNewEventModelData.NameSpace, oTextBundle)) {
            return;
        }

        var sCSRFToken = this.oCommons.getXCSRFToken();

        this.ownCommons.onSaveEvent(this, oView, oKnowledgeBaseModel, oTextBundle, oCreateNewEventModelData, this.EVENT_SERVICE_URL + "?create=true", sCSRFToken, this.oCopyDialog,
                this.oInputValidationServiceCopy);
    },

    onCancelCopyEvent : function() {
        this.ownCommons.closeDialog(this.oCopyDialog);

        // Reset input validation
        this.oInputValidationServiceCopy.resetValueStateOfControls();
    },

    onDeletePressed : function(oEvent) {
        var oView = this.getView(), oController = this;
        var oContext = oView.getBindingContext("Knowledgebase"), oData, text, oTextBundle;
        if (oContext) {
            oData = oContext.getObject();
            if (oData) {
                oTextBundle = oView.getModel("i18n").getResourceBundle();
                text = oTextBundle.getText("KB_DelReallyEvent", [ oData.name, oData.nameSpace ]);
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
        var oDeleteEvent = {}, oController = this, oView = this.getView();
        oDeleteEvent.name = oData.name;
        oDeleteEvent.nameSpace = oData.nameSpace;

        $.ajax({
            type : 'DELETE',
            url : oController.EVENT_SERVICE_URL,
            data : JSON.stringify(oDeleteEvent),
            beforeSend : function(xhr) {
                xhr.setRequestHeader('X-CSRF-Token', oController.oCommons.getXCSRFToken());
            },
            success : function(data) {
                var oTextBundle = oView.getModel("i18n").getResourceBundle();
                var text = oTextBundle.getText("KB_EventDeleted", [ oDeleteEvent.nameSpace, oDeleteEvent.name ]);
                oController.messageUtil.addMessage(sap.ui.core.MessageType.Success, text, text);
                var oModel = oView.getModel("Knowledgebase");
                sap.ui.core.UIComponent.getRouterFor(oController).navTo("events", {}, true);
                oView.unbindElement("Knowledgebase");
                oModel.refresh();
                
                // try export delete
                oController.doExport(oData, oController.EXPORT_DELETE);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                var oTextBundle = oView.getModel("i18n").getResourceBundle();
                var eventText = oTextBundle.getText("KB_Event");
                var text = oTextBundle.getText("KB_Del_Error", [ eventText, oDeleteEvent.nameSpace, oDeleteEvent.name ]);
                oController.messageUtil.addMessage(sap.ui.core.MessageType.Error, text, text);

            }
        });

    },
    onNavBack : function() {
        this.getView().getModel("uiModel").setProperty("/clearSearch", false);
        window.history.go(-1);
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

    doExport : function(eventObject, operation) {
        var that = this;
        var op = operation || this.EXPORT_UPSERT;
        var text, oTextBundle;

        this.ajaxUtil.postJson(this.EXPORT_SERVICE, JSON.stringify({
            Id : that.oCommons.base64ToHex(eventObject.hash),
            ObjectType : "Event",
            ObjectName : eventObject.name,
            ObjectNamespace : eventObject.nameSpace,
            Operation : op
        }), 
        {
            success : function() {
                if (operation !== that.EXPORT_DELETE) {
                    oTextBundle = that.getView().getModel("i18n").getResourceBundle();
                    text = oTextBundle.getText("KB_EventExported", [ eventObject.nameSpace, eventObject.name ]);
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

    /**
     * Event handler: Called when searching for an attribute in the events detail view, i.e. in the Knowledgebase>/Attribute model
     * 
     * @param oEvent
     */
    onSearchAssignedAttributes : function(oEvent) {

        var columnNames = [ "attrDisplayName", "attrName.name", "attrDescription", "attr.Relevance" ];
        var query = oEvent.getParameter("query");
        var combinedFilter = this.ownCommons.filterAllColumns(columnNames, query);

        // apply filter to binding
        this.getView().byId("relatedAttribute").getBinding("items").filter([ combinedFilter ]);

        // Persist filter value in FilterBarHelper to ensure filter is available in case sort operation is being executed
        sap.secmon.ui.m.commons.FilterBarHelper.setFilters.call(this, [ combinedFilter ]);
    },

    /**
     * Opens a popup for assigning attributes to events when clicking on the "assign attributes" button
     */
    onClickAssignAttributes : function() {

        var oView = this.getView();
        if (!this.oAssignDialog) {
            this.oAssignDialog = sap.ui.xmlfragment("dialogNewEventAttrAssign", "sap.secmon.ui.m.knowledgebase.view.AddAttributesDialog", this);
            oView.addDependent(this.oAssignDialog);
        }
        this.oAssignDialog.open();
    },

    /**
     * Called when clicking the "ok" button of the popup for assigning attributes to events
     * 
     * @param oEvent
     */
    onOkAddAttributes : function(oEvent) {

        var oView = this.getView(), oController = this, oTextBundle = oView.getModel("i18n").getResourceBundle(), successText;

        var aContexts = oEvent.getParameter("selectedContexts");
        if (aContexts && aContexts.length) {
            var sEventName = this.getView().getBindingContext("Knowledgebase").getObject().name;
            var sEventNamespace = this.getView().getBindingContext("Knowledgebase").getObject().nameSpace;
            if (aContexts.length === 1) {
                successText = oTextBundle.getText("KB_AssignedAttrSingle", [ aContexts[0].getObject().attributeName, sEventNamespace, sEventName ]);
            } else {
                successText = oTextBundle.getText("KB_AssignedAttrMultiple", [ aContexts.length, sEventNamespace, sEventName ]);
            }

            var sCSRFToken = this.oCommons.getXCSRFToken();

            var oSendEntityData = [];
            $.each(aContexts, function(index, value) {
                var oAttr = $.extend({}, value.getObject());
                oSendEntityData.push({
                    "eventName.name" : sEventName,
                    "eventNameSpace.nameSpace" : sEventNamespace,
                    "attrName.name" : oAttr.attributeName,
                    "attrNameSpace.nameSpace" : oAttr.attributeNameSpace
                });
            });

            // Create assignment
            this.requestCommons.postRequest(this.EVENT_ROLE_ATTR_ASSIGN_SERVICE_URL, oSendEntityData, sCSRFToken, function() {
                // Accessing the table from the fragment by it's Id
                var oAttributesTable = oView.byId("relatedAttribute");

                // Refresh the attributes table
                oView.getModel("Knowledgebase").refresh();
                oAttributesTable.setModel("Knowledgebase");
                oController.messageUtil.addMessage(sap.ui.core.MessageType.Success, successText, successText);
            });
        }
    },

    /**
     * Enables the "Remove" and the "Change Relevance" attributes button, if at least one attribute is editable
     */
    enableRemoveAndChangeAttributesButton : function(oEvent) {
        this.getView().getModel("EventDetailViewModel").setProperty("/enable/remAttrButton", oEvent.getSource().getSelectedItems().some(this.isAttributeEditable) === true);
        this.getView().getModel("EventDetailViewModel").setProperty("/enable/changeAttrButton", oEvent.getSource().getSelectedItems().some(this.isAttributeEditable) === true);

    },

    isAttributeEditable : function(element) {
        return element.getBindingContext("Knowledgebase").getObject().editable === "true";
    },
    /**
     * Called when clicking the "ok" button of the popup for removing attributes from events
     * 
     * @param oEvent
     */
    onRemoveAttributes : function(oEvent) {

        var oView = this.getView(), oController = this, oTextBundle = oView.getModel("i18n").getResourceBundle(), successText;
        var sCSRFToken = this.oCommons.getXCSRFToken();

        var aContexts = oView.byId("relatedAttribute").getSelectedItems();
        if (aContexts && aContexts.length) {
            var sEventName = this.getView().getBindingContext("Knowledgebase").getObject().name;
            var sEventNamespace = this.getView().getBindingContext("Knowledgebase").getObject().nameSpace;
            if (aContexts.length === 1) {
                successText = oTextBundle.getText("KB_UnassignAttrSingle", [ aContexts[0].getBindingContext("Knowledgebase").getObject().attrDisplayName, sEventNamespace, sEventName ]);
            } else {
                successText = oTextBundle.getText("KB_UnassignAttrMultiple", [ aContexts.length, sEventNamespace, sEventName ]);
            }

            var oSendEntityData = [];
            $.each(aContexts, function(index, value) {
                var oAttr = $.extend({}, value.getBindingContext("Knowledgebase").getObject());
                oSendEntityData.push(oAttr);
            });

            // Remove assignment
            this.requestCommons.sendRequest("DELETE", this.EVENT_ROLE_ATTR_ASSIGN_SERVICE_URL, oSendEntityData, sCSRFToken, function() {
                // Accessing the table from the fragment by it's Id
                var oAttributesTable = oView.byId("relatedAttribute");

                // Refresh the attributes table
                oView.getModel("Knowledgebase").refresh();
                oAttributesTable.setModel("Knowledgebase");

                oController.messageUtil.addMessage(sap.ui.core.MessageType.Success, successText, successText);
            });
        }

        // disable "Remove" and "Change Relevance" button
        this.getView().getModel("EventDetailViewModel").setProperty("/enable/remAttrButton", false);
        this.getView().getModel("EventDetailViewModel").setProperty("/enable/changeAttrButton", false);

    },

    /**
     * Called when clicking the "Change Relevance" button
     * 
     * @param oEvent
     */
    onChangeAttributeRelevance : function(oEvent) {
        this.oChangeRelevanceDialog.open();
    },

    /**
     * Creates the oChangeRelevanceDialog. This dialog is used to change the relevance of one or more attributes that are assigned to an event.
     */
    createChangeRelevanceDialog : function() {
        if (!this.oChangeRelevanceDialog) {
            var oView = this.getView();
            this.oChangeRelevanceDialog = sap.ui.xmlfragment(oView.getId(), "sap.secmon.ui.m.knowledgebase.view.ChangeAttributeRelevanceDialog", this);
            var oRelevanceModel = new sap.ui.model.json.JSONModel({
                likely : true,
                mandatory : false,
                lessLikely : false
            });
            this.oChangeRelevanceDialog.setModel(oRelevanceModel, "RelevanceModel");
            oView.addDependent(this.oChangeRelevanceDialog);
        }
    },

    /**
     * Called when clicking the "ok" button of the "ChangeRelevanceDialog". This function changes the selected attributes to the the selected relevance.
     * 
     * @param oEvent
     */
    onSaveChangeRelevance : function(oEvent) {

        var oView = this.getView(), oController = this, oTextBundle = oView.getModel("i18n").getResourceBundle(), relevance;

        var aContexts = oView.byId("relatedAttribute").getSelectedItems();
        if (aContexts && aContexts.length) {
            var sEventName = this.getView().getBindingContext("Knowledgebase").getObject().name;
            var sEventNamespace = this.getView().getBindingContext("Knowledgebase").getObject().nameSpace;
            var successText = oTextBundle.getText("KB_Change_Attribute_Relevance");

            // Determine Relevance Text
            if (this.oChangeRelevanceDialog.getModel("RelevanceModel").getProperty("/likely")) {
                relevance = "Likely";
            } else if (this.oChangeRelevanceDialog.getModel("RelevanceModel").getProperty("/mandatory")) {
                relevance = "Mandatory";
            } else if (this.oChangeRelevanceDialog.getModel("RelevanceModel").getProperty("/lessLikely")) {
                relevance = "Less Likely";
            }

            var sCSRFToken = this.oCommons.getXCSRFToken();

            var oSendEntityData = [];
            $.each(aContexts, function(index, value) {
                var oAttr = $.extend({}, value.getBindingContext("Knowledgebase").getObject());
                oSendEntityData.push({
                    "eventName.name" : sEventName,
                    "eventNameSpace.nameSpace" : sEventNamespace,
                    "attrName.name" : oAttr["attrName.name"],
                    "attrNameSpace.nameSpace" : oAttr["attrNameSpace.nameSpace"],
                    "relevance" : relevance
                });
            });

            // Update attribute relevance
            this.requestCommons.postRequest(this.EVENT_ROLE_ATTR_ASSIGN_SERVICE_URL, oSendEntityData, sCSRFToken, function() {

                // Accessing the table from the fragment by it's Id
                var oAttributesTable = oView.byId("relatedAttribute");
                // Refresh the attributes table
                oView.getModel("Knowledgebase").refresh();
                oAttributesTable.setModel("Knowledgebase");
                oView.byId("ChangeAttributeRelevanceDialog").close();
                oView.byId("relatedAttribute").removeSelections();
                oController.messageUtil.addMessage(sap.ui.core.MessageType.Success, successText, successText);
            });
        }

        // disable "Remove" and "Change Relevance" button
        this.getView().getModel("EventDetailViewModel").setProperty("/enable/remAttrButton", false);
        this.getView().getModel("EventDetailViewModel").setProperty("/enable/changeAttrButton", false);

    },

    onCancelChangeRelevance : function() {
        this.ownCommons.closeDialog(this.oChangeRelevanceDialog);
    },

    /**
     * Event handler: Called when searching for an attribute in the popup for assigning attributes to events, i.e. in the Knowledgebase>/Attribute model
     * 
     * @param oEvent
     */
    onSearchAttribute : function(oEvent) {
        var columnNames = [ "displayName", "description", "dataType" ];
        var query = oEvent.getParameter("value");
        var combinedFilter = this.ownCommons.filterAllColumns(columnNames, query);

        // apply filter to binding
        oEvent.getSource().getBinding("items").filter([ combinedFilter ]);
    },

    /**
     * Event handler: Called when clicking the "cancel" button of the popup for assigning attributes to events
     * 
     * @param oEvent
     */
    onCancelAddAttributes : function(oEvent) {
        // remove filter from binding
        oEvent.getSource().getBinding("items").filter([]);
    },

    /**
     * Event handler: Called when changing the content of an input field
     */
    onChange : function(oEvent) {
        var oView = this.getView();
        var oTextBundle = oView.getModel("i18n").getResourceBundle();
        this.ownCommons.onChange(oEvent, oTextBundle);
    },

    /**
     * Event handler: Called when updating the content of the display name input field
     */
    onLiveChangeDisplayName : function(oEvent) {
        var inputField = sap.ui.getCore().byId("CopyEventDialog--copyEventName");
        this.ownCommons.onLiveChangeDisplayName(oEvent, inputField);
    },

    onExit : function() {
        this.ownCommons.destroyDialog(this.oAssignDialog);
        this.ownCommons.destroyDialog(this.oCopyDialog);
        this.ownCommons.destroyDialog(this.oEditDialog);
        this.ownCommons.destroyDialog(this.oChangeRelevanceDialog);
    }
});
