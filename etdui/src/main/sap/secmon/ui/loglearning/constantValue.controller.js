/* globals oTextBundle */
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.loglearning.util.Formatter");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.loglearning.constantValue", {

    _sEntryTypeId : undefined,
    _sRunName : undefined,

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.loglearning.constantValue
     */
    onInit : function() {

        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();

        this.getView().setModel(sap.ui.getCore().getModel("RunJSONModel"), "RunJSONModel");
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), "Annotations");
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), "Attributes");
        this.createAndFillNamespacesModel();

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        if (oRouter) {
            oRouter.getRoute("entryTypeDetails").attachMatched(this.onRouteMatched, this);
        }
    },

    onRouteMatched : function(oEvent) {

        var args = oEvent.getParameter("arguments");
        if (args === null || args === undefined) {
            return;
        }

        var sRunName = args.run;
        var sEntryTypeId = args.entryType;
        if (!sRunName || !sEntryTypeId) {
            return;
        }

        // Entry type selected, enable buttons and read value mapping
        this._sEntryTypeId = sEntryTypeId;
        this._sRunName = sRunName;

        var oView = this.getView();
        var aFilters = [];
        var oBinding = oView.byId("table").getBinding("items");

        aFilters.push(new sap.ui.model.Filter("EntryTypeId.Id", "EQ", this._sEntryTypeId));
        oBinding.filter(aFilters);

        oView.byId("buttonCreate").setEnabled(true);
        oView.byId("buttonAddGroup").setEnabled(true);
        oView.byId("table").removeSelections(true);
    },

    /**
     * Creates a new target entry
     * 
     * @param oEvent
     */
    onPressCreate : function(oEvent) {
        var oModel = this.getView().getModel("RunJSONModel");
        var oData = oModel.getData();

        // Append new entry
        oData.constantValue.push({
            AttrHash : "30",
            "EntryTypeId.Id" : this._sEntryTypeId,
            "RunName.RunName" : this._sRunName,
            Value : "",
            Attributes : sap.ui.getCore().getModel("KBRoleModel").getData().d.Attributes.results,
            GroupHash : null,
            GroupName : ""
        });

        oModel.setData(oData);

        this._setSaveNeeded(true);
    },

    /**
     * Deletes selected target entries
     * 
     * @param oEvent
     */
    onPressDelete : function(oEvent) {
        var that = this;
        var oView = this.getView();
        var oModel = oView.getModel("RunJSONModel");
        var oTable = oView.byId("table");
        var aItems = oView.byId("table").getSelectedItems();
        var oData = oModel.getData();
        var oDataResult = [];

        $.each(oData.constantValue, function(iLoopIndexConstant, element) {
            if (element["EntryTypeId.Id"] !== that._sEntryTypeId) {
                return true; // continue
            }
            $.each(aItems, function(iLoopIndexSelected, oItem) {
                var oRowData = oItem.getBindingContext("RunJSONModel").getObject();
                if (element["EntryTypeId.Id"] === oRowData["EntryTypeId.Id"] && element.AttrHash === oRowData.AttrHash) {
                    oDataResult.push(oItem.getBindingContext("RunJSONModel").getPath().split("/")[2]);
                }
            });
        });

        // Delete selected target entries in descending order
        oDataResult.sort(function(a, b) {
            return b - a;
        });

        $.each(oDataResult, function(iLoopIndexConstant, element) {
            oData.constantValue.splice(element, 1);
        });

        oModel.setData(oData);

        // Clear selection of table
        oTable.removeSelections(true);

        this._setSaveNeeded(true);
    },

    /**
     * Loads value mapping for given entry type and initializes the view
     * 
     * @param sBindingContext
     *            Context of the selected entry type
     */
    setSelectedEntryType : function(oBindingContext) {
        var oView = this.getView();
        var aFilters = [];
        var oBinding = oView.byId("table").getBinding("items");

        if (oBindingContext) {
            // Entry type selected, enable buttons and read value mapping
            this._sEntryTypeId = oBindingContext.getProperty("Id");
            this._sRunName = oBindingContext.getProperty("RunName");
            oView.byId("buttonCreate").setEnabled(true);
            oView.byId("buttonAddGroup").setEnabled(true);
            oView.byId("table").removeSelections(true);
            aFilters.push(new sap.ui.model.Filter("EntryTypeId.Id", "EQ", this._sEntryTypeId));
        } else {
            // No entry type selected, disable buttons and hide tables
            oView.byId("buttonCreate").setEnabled(false);
            oView.byId("buttonDelete").setEnabled(false);
            oView.byId("buttonCreateGroup").setEnabled(false);
            oView.byId("buttonAddGroup").setEnabled(false);
            oView.byId("table").removeSelections(true);
            this._sEntryTypeId = undefined;
            this._sRunName = undefined;

            aFilters.push(new sap.ui.model.Filter("EntryTypeId.Id", "EQ", ""));
        }

        oBinding.filter(aFilters);
    },

    /**
     * Row selection change of source/target table. Enables/Disables delete button
     * 
     * @param oEvent
     */
    onRowSelectionChange : function(oEvent) {
        // Model name is different depending on source
        var sModelName = "RunJSONModel";
        if (oEvent.getSource().getId() === "addGroup--table") {
            sModelName = undefined;
        }

        // Get all items of table and get selected group
        var aAllItems = oEvent.getSource().getItems();
        var sSelectedGroupHash = oEvent.getParameter("listItem").getBindingContext(sModelName).getProperty("GroupHash");

        // Select/Deselect all items belonging to the same group, if a group is
        // assigned
        if (sSelectedGroupHash && sSelectedGroupHash !== "") {
            $.each(aAllItems, function(index, element) {
                if (element.getBindingContext(sModelName) && element.getBindingContext(sModelName).getProperty("GroupHash") === sSelectedGroupHash) {
                    element.setSelected(oEvent.getParameter("selected"));
                }
            });
        }

        // Enable/Disable the buttons depending on selection
        var bSelected = oEvent.getSource().getSelectedItems().length > 0;

        // Don't do it for the add group dialog
        if (sModelName) {
            this.getView().byId("buttonCreateGroup").setEnabled(bSelected);
            this.getView().byId("buttonDelete").setEnabled(bSelected);
        }
    },

    /**
     * Sets the save needed flag
     * 
     * @param bSaveNeeded
     */
    _setSaveNeeded : function(bSaveNeeded) {
        sap.ui.getCore().getModel("RunModel").setProperty("/isSaveNeeded", bSaveNeeded);
    },

    onLiveChangeAttrTextField : function(oEvent) {
        // reset the hash. The user should use dropdown to select a value
        var inputField = oEvent.getSource();
        var oBindingContext = inputField.getBindingContext("RunJSONModel");
        oBindingContext.getModel().setProperty("AttrHash", null, oBindingContext);
        oBindingContext.getModel().setProperty("attrName.name", null, oBindingContext);
        oBindingContext.getModel().setProperty("attrNameSpace.nameSpace", null, oBindingContext);

        inputField.setValueState(sap.ui.core.ValueState.Error);
    },

    onAttributeSugggestionSelected : function(oEvent) {
        var inputField = oEvent.getSource();

        // selected row of suggestionItems
        var selectedSuggestionItem = oEvent.getParameter("selectedItem");
        var oSourceContext = selectedSuggestionItem.getBindingContext("RunJSONModel");
        var oTargetContext = inputField.getBindingContext("RunJSONModel");

        this.copyAttributeIds(oSourceContext, oTargetContext);
        this._setSaveNeeded(true);

        inputField.setValueState(sap.ui.core.ValueState.None);
        inputField.setValueStateText(null);
    },

    /**
     * copy attribute IDs from one context to another. The attribute ID is name and namespace, alternatively, the attribute hash is used (the hash is calculated from name and namespace).
     * 
     * @param oSourceContext
     * @param oTargetContext
     */
    copyAttributeIds : function(oSourceContext, oTargetContext) {
        // Caution: different names and format for the attribute hash!
        var sKey = oSourceContext.getProperty("attrHash");
        var sAttrHashHex = this.oCommons.base64ToHex(sKey);
        var sName = oSourceContext.getProperty("attrName.name");
        var sNamespace = oSourceContext.getProperty("attrNameSpace.nameSpace");
        var sDisplayName = oSourceContext.getProperty("attrDisplayName");

        // TODO: These 4 properties are temporary, they are deleted before persisting (i.e. before sending the POST OData request).
        // Find out where they are used, and then replace them with the object "TargetAttributeId".
        oTargetContext.getModel().setProperty("AttrHash", sAttrHashHex, oTargetContext);
        oTargetContext.getModel().setProperty("attrName.name", sName, oTargetContext);
        oTargetContext.getModel().setProperty("attrNameSpace.nameSpace", sNamespace, oTargetContext);
        oTargetContext.getModel().setProperty("attrDisplayName", sDisplayName, oTargetContext);

        oTargetContext.getModel().setProperty("TargetAttributeId", {
            hash : sKey,
            hashHex : sAttrHashHex,
            name : sName,
            nameSpace : sNamespace,
            displayName : sDisplayName
        }, oTargetContext);

        console.debug("Key Hex: %s", sAttrHashHex);
    },

    /**
     * Handles the "change value" event of attribute input field
     * 
     * @memberOf sap.secmon.ui.loglearning.stagingEntryTypes
     */
    onChangeAttrTextField : function(oEvent) {
        // open the value help popup when user presses ENTER, the popup is pre-set with value
        this.onValueHelpAttribute(oEvent);
    },

    /**
     * On change text field
     * 
     * @param oEvent
     */
    onChangeTextField : function(oEvent) {
        var oBindingContext = oEvent.getSource().getBindingContext("RunJSONModel");
        var oModel = oBindingContext.getModel();
        var sProperty;
        var sValue = oEvent.getParameter("newValue");

        // Determine affected combobox
        switch (oEvent.getSource().getId().split("--")[3].split("-")[0]) {
        case "textFieldTargetValue":
            sProperty = "Value";
            break;
        default:
            console.error("Unkown text field changed %o", oEvent.getSource());
        }

        oModel.setProperty(sProperty, sValue, oBindingContext);

        this._setSaveNeeded(true);
    },

    /**
     * F4 for attribute
     * 
     * @param oEvent
     */
    onValueHelpAttribute : function(oEvent) {
        var that = this;

        var inputField = oEvent.getSource();
        var oTargetContext = inputField.getBindingContext("RunJSONModel");
        var boundData = oTargetContext.getObject();
        var searchString = inputField.getValue();
        var preselectedKey = boundData.AttrHash;

        // disallow multi-selection in valuehelp popup
        var promise = new sap.secmon.ui.loglearning.Helper().openValueHelpEventAttribute(this, boundData, searchString, preselectedKey, false);

        $.when(promise).then(function(aSelectedContexts) {
            if (!aSelectedContexts || aSelectedContexts.length !== 1) {
                // user canceled selection
                return;
            }
            var oSourceContext = aSelectedContexts[0];

            that.copyAttributeIds(oSourceContext, oTargetContext);
            that._setSaveNeeded(true);

            inputField.setValueState(sap.ui.core.ValueState.None);
            inputField.setValueStateText(null);
        });
    },

    onSuggestAttribute : function(oEvent) {
        var sTerm = oEvent.getParameter("suggestValue");
        var aFilters = [];
        if (sTerm) {
            aFilters.push(new sap.ui.model.Filter("attrDisplayName", sap.ui.model.FilterOperator.StartsWith, sTerm));
        }
        oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
    },

    /**
     * Create a new group for the selected attributes
     */
    onPressCreateGroup : function(oEvent) {
        var oModel = new sap.ui.model.json.JSONModel({
            name : "",
            namespace : ""
        });
        this._oDialog = sap.ui.xmlfragment("createGroup", "sap.secmon.ui.loglearning.createGroup", this);
        this._oDialog.setModel(oModel);
        this.getView().addDependent(this._oDialog);

        this._oDialog.open();
    },

    /**
     * Add an existing constant value group to the constant values
     */
    onPressAddGroup : function(oEvent) {
        this._oDialog = sap.ui.xmlfragment("addGroup", "sap.secmon.ui.loglearning.addGroup", this);
        this._oDialog.setModel(sap.ui.getCore().getModel("logDiscovery"));
        this.getView().addDependent(this._oDialog);

        this._oDialog.open();
    },

    _getShellController : function() {
        var shell = this.getView();
        while (shell.getParent) {
            if (shell.getController && shell.getController().reportErrorMessage) {
                return shell.getController();
            }
            shell = shell.getParent();
        }
        return null;
    },

    /**
     * Handles the close event of both group dialogs (create and add)
     */
    onCloseDialog : function(oEvent) {
        var oModel = this.getView().getModel("RunJSONModel");
        var that = this;
        var oData = this._oDialog.getModel().getData();
        var oShell = this._getShellController();
        var oTable = this.getView().byId("table");
        var aItems;
        var aAttributes = [];
        var oObject;

        switch (oEvent.getParameter("id")) {
        case "createGroup--Ok":
            aItems = oTable.getSelectedItems();
            $.each(aItems, function(index, element) {
                var oObject = element.getBindingContext("RunJSONModel").getObject();
                aAttributes.push({
                    AttrHash : oObject.AttrHash,
                    Value : oObject.Value
                });
            });

            var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=createGroup", JSON.stringify({
                groupName : oData.name,
                groupNameSpace : oData.namespace,
                attributes : aAttributes
            }));

            promise.fail(function(jqXHR, textStatus, errorThrown) {
                oShell.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
            });

            promise.done(function(data, textStatus, jqXHR) {
                if (data.status === "Ok") {
                    $.each(aItems, function(index, element) {
                        var oBindingContext = element.getBindingContext("RunJSONModel");
                        sap.ui.getCore().getModel("RunJSONModel").setProperty("GroupHash", data.GroupHash, oBindingContext);
                        sap.ui.getCore().getModel("RunJSONModel").setProperty("GroupName", oData.name, oBindingContext);
                        sap.ui.getCore().getModel("RunJSONModel").setProperty("GroupNameSpace", oData.namespace, oBindingContext);
                        that._setSaveNeeded(true);
                    });
                    oShell.reportSuccess(oTextBundle.getText("Interpret_GrpCreated", [ oData.name, oData.namespace ]));
                } else {
                    oShell.reportErrorMessage(decodeURIComponent(data.text));
                }
            });
            break;
        case "addGroup--Ok":
            aItems = sap.ui.core.Fragment.byId("addGroup", "table").getSelectedItems();
            $.each(aItems, function(index, element) {
                oObject = element.getBindingContext().getObject();
                oData = oModel.getData();

                // Append new entry
                oData.constantValue.push({
                    GroupHash : that.oCommons.base64ToHex(oObject.GroupHash),
                    GroupName : oObject.GroupName,
                    GroupNameSpace : oObject.GroupNameSpace,
                    AttrHash : that.oCommons.base64ToHex(oObject.AttrHash),
                    attrDisplayName : oObject.AttrDisplayName,
                    "attrName.name" : oObject.AttrName,
                    "attrNameSpace.nameSpace" : oObject.AttrNameSpace,
                    Value : oObject.Value,
                    "EntryTypeId.Id" : that._sEntryTypeId,
                    "RunName.RunName" : that._sRunName,
                    Attributes : sap.ui.getCore().getModel("KBRoleModel").getData().d.Attributes.results,
                });
            });
            oModel.setData(oData);

            that._setSaveNeeded(true);

            oShell.reportSuccess(oTextBundle.getText("Interpret_GrpAdded", [ oObject.GroupName, oObject.GroupNameSpace ]));

            break;
        }
        this._oDialog.close();
        this._oDialog.destroy();
    }

});