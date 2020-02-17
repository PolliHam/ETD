/**
 * Helper file for commonly used functions in the new knowledgebase
 */
jQuery.sap.declare("sap.secmon.ui.m.knowledgebase.util.Common");
jQuery.sap.require("sap.secmon.ui.m.commons.RequestUtils");

sap.secmon.ui.m.knowledgebase.util.Common = function() {
    var requestCommons = new sap.secmon.ui.m.commons.RequestUtils();
    var EVENT_ROLE_ATTR_ASSIGN_SERVICE_URL = "/sap/secmon/services/ui/knowledgebase/eventattr.xsjs";

    /**
     * Checks, if a correct namespace is set.
     */
    this.checkNamespace = function(sNamespace, oTextBundle) {
        if (sNamespace === undefined || sNamespace === null) {
            sap.m.MessageBox.alert(oTextBundle.getText("NAMESPACE_OD_ERR_Undefined"), {
                title : oTextBundle.getText("NAMESPACE_ERROR")
            });
            return false;
        }
        if (sNamespace.indexOf("http://") !== 0) {
            sap.m.MessageBox.alert(oTextBundle.getText("NAMESPACE_OD_ERR1"), {
                title : oTextBundle.getText("NAMESPACE_ERROR")
            });
            return false;
        }
        if (sNamespace.indexOf("http://sap.com") === 0) {
            sap.m.MessageBox.alert(oTextBundle.getText("NAMESPACE_OD_ERR2"), {
                title : oTextBundle.getText("NAMESPACE_ERROR")
            });
            return false;
        }
        return true;
    };

    /**
     * Creates a case-insensitive filter on all columns of a table and applies this filter on the binding of the event
     * 
     * @param columnNames:
     *            an array of column names, oEvent
     */
    this.filterAllColumns = function(columnNames, query) {
        // create model filter
        var columnFilters = [];
        var combinedFilter = [];
        if (query !== null || query !== undefined) {
            columnNames.forEach(function(element) {
                columnFilters.push(new sap.ui.model.Filter("toupper(" + element + ")", sap.ui.model.FilterOperator.Contains, "'" + query.toUpperCase() + "'"));
            });
            combinedFilter = new sap.ui.model.Filter({
                filters : columnFilters,
                and : false
            });
        }
        return combinedFilter;
    };

    /**
     * Save entries of event dialog into the database
     * 
     * @param
     */
    this.onSaveEvent = function(oController, oView, oModel, oTextBundle, saveRequestData, EVENT_SERVICE_URL, sCSRFToken, oDialog, inputValidationService) {
        var oEvent = {};
        oEvent.nameSpace = saveRequestData.NameSpace;
        oEvent.name = saveRequestData.name;
        oEvent.displayName = saveRequestData.displayName;
        oEvent.description = saveRequestData.description;
        oEvent.abstractMeaning = "";
        oEvent.coreMeaning = "";

        var successText = oTextBundle.getText("KB_EventSaved", [ oEvent.nameSpace, oEvent.name ]);

        // Save the event
        requestCommons.postRequest(EVENT_SERVICE_URL, oEvent, sCSRFToken, function() {

            oController.ownCommons.closeDialog(oDialog);

            // Reset input validation
            inputValidationService.resetValueStateOfControls();

            // When copying an event, the assigned attributes are also copied
            if (saveRequestData.copyAttributes) {
                oController.ownCommons.copyAssignedAttributes(oController, saveRequestData, sCSRFToken);
            }
            oController.messageUtil.addMessage(sap.ui.core.MessageType.Success, successText, successText);
            oModel.refresh();
        });
    };

    /**
     * Copy assigned attributes of an event
     * 
     * @param
     */
    this.copyAssignedAttributes = function(oController, saveRequestData, sCSRFToken) {
        var aContexts = oController.byId("relatedAttribute").getItems();
        if (aContexts && aContexts.length) {

            var oSendEntityData = [];
            $.each(aContexts, function(index, value) {
                var oAttr = $.extend({}, value.oBindingContexts.Knowledgebase.getObject());
                oSendEntityData.push({
                    "eventName.name" : saveRequestData.name,
                    "eventNameSpace.nameSpace" : saveRequestData.NameSpace,
                    "attrName.name" : oAttr["attrName.name"],
                    "attrNameSpace.nameSpace" : oAttr["attrNameSpace.nameSpace"],
                    "relevance" : oAttr["attr.Relevance"]
                });
            });

            // Create assignment
            requestCommons.postRequest(EVENT_ROLE_ATTR_ASSIGN_SERVICE_URL, oSendEntityData, sCSRFToken, function() {
            });
        }
    };

    this.closeDialog = function(oDialog) {
        if (oDialog) {
            oDialog.close();
        }
    };

    this.destroyDialog = function(oDialog) {
        if (oDialog) {
            oDialog.destroy();
        }
    };

    /**
     * Checks, if the value of an input box is not empty
     */
    this.onChange = function(oEvent, oTextBundle) {
        var oSource = oEvent.getSource();
        var sName = oSource.getValue();

        if (this.isValidName(sName)) {
            oSource.setValueState("Success");
        } else {
            oSource.setValueState("Error");
            oSource.setValueStateText(oTextBundle.getText("KB_NameNotEmpty"));
        }
    };

    this.isValidName = function(sName) {
        return sName.trim().length > 0;
    };

    /**
     * Event handler: Called when updating the content of an input field
     * 
     * parameter : idOfInputField = ID of input field to be updated
     */
    this.onLiveChangeDisplayName = function(oEvent, inputField) {
        inputField.setValue(oEvent.getParameter("value").replace(/ /g, ''));
    };
};