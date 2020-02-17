/* globals oTextBundle */
$.sap.require("sap.secmon.ui.loglearning.Helper");
$.sap.require("sap.secmon.ui.loglearning.util.Formatter");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
$.sap.require("sap.secmon.ui.loglearning.util.AnnotationsListConverter");
sap.ui.controller("sap.secmon.ui.loglearning.valueMapping", {

    _oInitialTreeData : {
        results : [ {
            text : oTextBundle.getText("Interpret_MappingRules"),
            icon : "sap-icon://contacts",
            type : "ROOT",
            results : []
        } ]
    },

    _sEntryTypeId : undefined,
    _sRunName : undefined,

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.loglearning.valueMapping
     */
    onInit : function() {

        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();

        var oModel = new sap.ui.model.json.JSONModel($.extend({}, this._oInitialTreeData));

        this.getView().setModel(oModel);
        var runJsonModel = sap.ui.getCore().getModel("RunJSONModel");
        this.getView().setModel(runJsonModel, "RunJSONModel");
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), "Annotations");
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), "Attributes");
        this._createUiModel();
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        if (oRouter) {
            oRouter.getRoute("entryTypeDetails").attachMatched(this.onRouteMatched, this);
        }

        var annotationsBinding = runJsonModel.bindList("/entryTypes/allAnnotations");
        annotationsBinding.attachChange(function(oEvent) {
            this.prepareAnnotationsModelForValueMapping();
        }, this);

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
        this.readValueMapping();
        this.prepareAnnotationsModelForValueMapping();

    },

    onSelectRow : function(oEvent) {
        var uiModel = this.getView().getModel("uiModel");

        var rowContext = oEvent.getParameter("rowContext");
        if (!rowContext) {
            uiModel.setProperty("/selectedNodeType", null);
            return;
        } else {
            var selectedNodeType = rowContext.getProperty("type");
            uiModel.setProperty("/selectedNodeType", selectedNodeType);
        }

    },

    /**
     * When user selects a leaf/node in the value mapping tree
     * 
     * @param oEvent
     */
    onSelectedSourceOrTargetLink : function(oEvent) {
        var uiModel = this.getView().getModel("uiModel");
        var oBindingContext;

        oBindingContext = oEvent.getParameter("rowContext");
        if (!oBindingContext) {
            return;
        }
        var selectedNodeType = oBindingContext.getProperty("type");
        var sEntryTypeId = oBindingContext.getProperty("EntryTypeId.Id");
        var sRule = oBindingContext.getProperty("MappingRule");
        var sCondition = oBindingContext.getProperty("MappingCondition");

        uiModel.setProperty("/selectedNodeType", selectedNodeType);
        uiModel.setProperty("/ruleNumber", sRule);
        uiModel.setProperty("/conditionNumber", sCondition);

        if (!sEntryTypeId) {
            return;
        }

        // avoid Nullpointer exceptions
        var aFilters = [];
        if (sEntryTypeId) {
            aFilters.push(new sap.ui.model.Filter({
                path : "EntryTypeId.Id",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : sEntryTypeId
            }));
        }
        if (sRule) {
            aFilters.push(new sap.ui.model.Filter({
                path : "MappingRule",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : sRule
            }));
        }
        if (sCondition) {
            aFilters.push(new sap.ui.model.Filter({
                path : "MappingCondition",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : sCondition
            }));
        }

        var oSourceTable, oTargetTable, oBinding;
        switch (selectedNodeType) {
        case "ROOT":
        case "RULE":
        case "PRIORITY":
            break;
        case "SOURCE":
            oSourceTable = sap.ui.core.Fragment.byId(this.getView().createId("layoutRowSource"), "tableSource");

            oBinding = oSourceTable.getBinding("rows");
            if (oBinding) {
                oBinding.filter(aFilters);
            }
            break;
        case "TARGET":
            oTargetTable = sap.ui.core.Fragment.byId(this.getView().createId("layoutRowTarget"), "tableTarget");

            oBinding = oTargetTable.getBinding("rows");
            if (oBinding) {
                oBinding.filter(aFilters);
            }
            break;
        default:
            break;
        }

    },

    /**
     * Creates a new condition within the selected rule
     * 
     * @param oEvent
     */
    onPressCreateCond : function(oEvent) {
        // Get data of selected node in tree
        var oView = this.getView();
        var oModel = oView.getModel();
        var oTable = oView.byId("treeTable");
        var selIndex = oTable.getSelectedIndex();
        var oBindingContext = oTable.getContextByIndex(selIndex);

        var sPath = oBindingContext.getPath();
        var oSelectedNodeData = oModel.getObject(sPath);

        var iRuleIndex = parseInt(sPath.split("/")[4]);
        this.createCondition(oSelectedNodeData, iRuleIndex);

        oTable.expand(selIndex);
    },

    /**
     * Creates a new condition within the selected rule
     * 
     * @param oEvent
     */
    onPressCreateRule : function(oEvent) {
        this.createRule();

        var oView = this.getView();
        var oTable = oView.byId("treeTable");
        var selIndex = oTable.getSelectedIndex();
        oTable.expand(selIndex);

    },

    /**
     * Deletes the selected rule
     * 
     * @param oEvent
     */
    onPressDeleteRule : function(oEvent) {
        // Get data of selected node in tree
        var oView = this.getView();
        var oModel = oView.getModel();
        var oTable = this.getView().byId("treeTable");
        var selIndex = oTable.getSelectedIndex();
        var oBindingContext = oTable.getContextByIndex(selIndex);

        var sPath = oBindingContext.getPath();
        var oSelectedNodeData = oModel.getObject(sPath);

        this.deleteRule(oSelectedNodeData["EntryTypeId.Id"], oSelectedNodeData.MappingRule);

        selIndex--;
        oBindingContext = oTable.getContextByIndex(selIndex);
        var uiModel = this.getView().getModel("uiModel");
        uiModel.setProperty("/selectedNodeType", oBindingContext.getProperty("type"));
        oTable.setSelectedIndex(selIndex);

    },

    /**
     * Deletes the selected condition
     * 
     * @param oEvent
     */
    onPressDeleteCond : function(oEvent) {
        // Get data of selected node in tree
        var oView = this.getView();
        var oModel = oView.getModel();
        var oTable = this.getView().byId("treeTable");
        var selIndex = oTable.getSelectedIndex();
        var oBindingContext = oTable.getContextByIndex(selIndex);

        var sPath = oBindingContext.getPath();
        var oSelectedNodeData = oModel.getObject(sPath);

        this.deleteCondition(oSelectedNodeData["EntryTypeId.Id"], oSelectedNodeData.MappingRule, oSelectedNodeData.MappingCondition);

        var uiModel = this.getView().getModel("uiModel");
        // select node above
        selIndex--;
        oBindingContext = oTable.getContextByIndex(selIndex);
        uiModel.setProperty("/selectedNodeType", oBindingContext.getProperty("type"));
        oTable.setSelectedIndex(selIndex);

    },

    /**
     * Creates a new target entry
     * 
     * @param oEvent
     */
    onPressCreateTarget : function() {
        var oModel = this.getView().getModel("RunJSONModel");
        var oData = oModel.getData();

        // Get data of selected rule in tree
        var oTable = this.getView().byId("treeTable");
        var selIndex = oTable.getSelectedIndex();
        var oBindingContext = oTable.getContextByIndex(selIndex);
        var sEntryTypeId = oBindingContext.getProperty("EntryTypeId.Id");
        var sRule = oBindingContext.getProperty("MappingRule");
        var sCondition = oBindingContext.getProperty("MappingCondition");

        // Append new source entry
        oData.valueMapping.target.push({
            Id : new sap.secmon.ui.loglearning.Helper().createUUID(),
            AttrHash : "30",
            "EntryTypeId.Id" : sEntryTypeId,
            MappingCondition : sCondition,
            MappingRule : sRule,
            "RunName.RunName" : this._sRunName,
            TargetValue : "",
            Attributes : sap.ui.getCore().getModel("KBRoleModel").getData().d.Attributes.results
        });

        oModel.setData(oData);

        this._setSaveNeeded(true);
    },

    /**
     * Deletes selected target entries
     * 
     * @param oEvent
     */
    onPressDeleteTarget : function(oEvent) {
        var oView = this.getView();
        var oModel = oView.getModel("RunJSONModel");
        var oTable = sap.ui.core.Fragment.byId(this.getView().createId("layoutRowTarget"), "tableTarget");
        var aSelectedIndices = oTable.getSelectedIndices();
        var oData = oModel.getData();
        var i, oBindingContext;

        // Delete selected target entries in descending order
        aSelectedIndices.sort(function(a, b) {
            return b - a;
        });

        $.each(aSelectedIndices, function(iLoopIndex, iSelIndex) {
            oBindingContext = oTable.getContextByIndex(iSelIndex);
            for (i = oData.valueMapping.target.length - 1; i >= 0; i--) {
                if (oData.valueMapping.target[i].Id === oBindingContext.getProperty("Id") && oData.valueMapping.target[i].MappingRule === oBindingContext.getProperty("MappingRule") &&
                        oData.valueMapping.target[i].MappingCondition === oBindingContext.getProperty("MappingCondition")) {
                    oData.valueMapping.target.splice(i, 1);
                }
            }
        });

        oModel.setData(oData);

        // Clear selection of table
        oTable.clearSelection();

        this._setSaveNeeded(true);
    },

    /**
     * Create new source entry
     * 
     * @param oEvent
     */
    onPressCreateSource : function(oEvent) {
        var oModel = this.getView().getModel("RunJSONModel");
        var oData = oModel.getData();

        // Get data of selected rule in tree
        var oTable = this.getView().byId("treeTable");
        var selIndex = oTable.getSelectedIndex();
        var oBindingContext = oTable.getContextByIndex(selIndex);

        var sEntryTypeId = oBindingContext.getProperty("EntryTypeId.Id");
        var sRule = oBindingContext.getProperty("MappingRule");
        var sCondition = oBindingContext.getProperty("MappingCondition");
        var sConditionPrio = oBindingContext.getProperty("ConditionPrio");

        // Append new source entry
        oData.valueMapping.source.push({
            Id : new sap.secmon.ui.loglearning.Helper().createUUID(),
            "AnnotationId.Id" : "",
            ConditionPrio : sConditionPrio,
            "EntryTypeId.Id" : sEntryTypeId,
            MappingCondition : sCondition,
            MappingRule : sRule,
            Operand1 : "",
            Operand2 : "",
            Operator : "EQ",
            "RunName.RunName" : this._sRunName
        });
        oModel.setData(oData);

        this._setSaveNeeded(true);
    },

    /**
     * Deletes selected source entries
     * 
     * @param oEvent
     */
    onPressDeleteSource : function(oEvent) {
        var oView = this.getView();
        var oModel = oView.getModel("RunJSONModel");
        var oTable = sap.ui.core.Fragment.byId(this.getView().createId("layoutRowSource"), "tableSource");
        var aSelectedIndices = oTable.getSelectedIndices();
        var oData = oModel.getData();
        var i, oBindingContext;

        // Delete selected source entries in descending order
        aSelectedIndices.sort(function(a, b) {
            return b - a;
        });

        $.each(aSelectedIndices, function(iLoopIndex, iSelIndex) {
            oBindingContext = oTable.getContextByIndex(iSelIndex);
            for (i = oData.valueMapping.source.length - 1; i >= 0; i--) {
                if (oData.valueMapping.source[i].Id === oBindingContext.getProperty("Id") && oData.valueMapping.source[i].MappingRule === oBindingContext.getProperty("MappingRule") &&
                        oData.valueMapping.source[i].MappingCondition === oBindingContext.getProperty("MappingCondition")) {
                    oData.valueMapping.source.splice(i, 1);
                }
            }
        });

        oModel.setData(oData);

        // Clear selection of table
        oTable.clearSelection();

        this._setSaveNeeded(true);
    },

    /**
     * Reads the value mapping
     * 
     */
    readValueMapping : function() {

        var oRunJsonModel = sap.ui.getCore().getModel("RunJSONModel");
        var runData = oRunJsonModel.getData();
        if (!runData || Object.keys(runData).length === 0 || !this.getView().byId("treeTable")) {
            oRunJsonModel.attachRequestCompleted(function() {
                this._setDataTree();
            }, this);
        } else {
            this._setDataTree();
        }
    },

    _setDataTree : function() {
        var oView = this.getView();
        var uiModel = oView.getModel("uiModel");
        // Create deep copy of the valueMapping data
        var oRunJsonModel = sap.ui.getCore().getModel("RunJSONModel");
        var oData = oRunJsonModel.getData();
        var aDataTemp = $.extend({}, oData.valueMapping.source);

        var oDataTree = {
            results : [ {
                text : oTextBundle.getText("Interpret_MappingRules"),
                icon : "sap-icon://contacts",
                type : "ROOT",
                results : new sap.secmon.ui.loglearning.Helper().convertValueMappingFlatToTree(aDataTemp, this._sEntryTypeId)
            } ]
        };

        oView.getModel().setData(oDataTree);
        // initialize selection to root node
        uiModel.setProperty("/selectedNodeType", "ROOT");

        var oTree = oView.byId("treeTable");
        if (oTree) {
            oTree.setSelectedIndex(0);
        }
    },

    /**
     * Collect annotations for valuehelp dropdown in value mapping
     */
    prepareAnnotationsModelForValueMapping : function() {
        var sEntryTypeId = this._sEntryTypeId;
        var oRunJsonModel = sap.ui.getCore().getModel("RunJSONModel");
        var oAnnotationsModel = this.getView().getModel("Annotations");
        var aDataAnnotation = [ {
            Id : "",
            Text : ""
        } ];
        var oData = oRunJsonModel.getData();
        if (!oData || !oData.entryTypes) {
            return;
        }

        var aAnnotations = oData.entryTypes.allAnnotations;
        $.each(aAnnotations, function(iIndex, oValue) {

            if (oValue["EntryTypeId.Id"] !== sEntryTypeId) {
                return true; // Continue
            }

            if (oValue.Type === "Word" || oValue.Type === "BlankOrPunctuation" || oValue.Type === "KeyValue.List" || oValue.Type === "StructuredList" || oValue.Type === "JSON") {
                return true; // Continue
            }

            if (oValue.top === false && oValue.Type !== 'KeyValue.Key' && oValue.Type !== 'StructuredPosition.Position') {
                return true; // Continue
            }

            // Collect annotations for drop down in valueMapping
            var sText = oValue.LegacyVariableName;

            aDataAnnotation.push({
                Id : oValue.Id,
                Text : sText
            });
        });
        oAnnotationsModel.setData(aDataAnnotation);

    },

    /**
     * Loads value mapping for given entry type and initializes the view
     * 
     * @param sBindingContext
     *            Context of the selected entry type
     */
    setSelectedEntryType : function(oBindingContext) {
        var oView = this.getView();

        if (oBindingContext) {
            // Entry type selected, enable buttons and read value mapping
            this._sEntryTypeId = oBindingContext.getProperty("Id");
            this._sRunName = oBindingContext.getProperty("RunName");
            this.readValueMapping();
        } else {
            oView.getModel().setData($.extend({}, this._oInitialTreeData));
            this._sEntryTypeId = undefined;
            this._sRunName = undefined;
            var uiModel = oView.getModel("uiModel");
            uiModel.setProperty("/selectedNodeType", null);
            // oView.byId("tree").getNodes()[0].setSelectable(false);
        }
    },

    /**
     * Row selection change of source/target table. Enables/Disables delete button
     * 
     * @param oEvent
     */
    onRowSelectionChange : function(oEvent) {
        var uiModel = this.getView().getModel("uiModel");
        var oContext = oEvent.getParameter("rowContext");

        if (oEvent.getSource().getSelectedIndices().length) {
            uiModel.setProperty("/selectedOperator", oContext.getProperty("Operator"));
            uiModel.setProperty("/selectedId", oContext.getProperty("Id"));
        } else {
            uiModel.setProperty("/selectedOperator", null);
            uiModel.setProperty("/selectedId", null);
        }
    },

    /**
     * Creates a new rule
     * 
     * @param oRule
     */
    createRule : function() {
        var oView = this.getView();
        var iMappingRuleNumber = 0;
        var oController = this;
        var oModel = oView.getModel();
        var oMappingRuleData = oModel.getData();

        // Determine next rule number
        $.each(oMappingRuleData.results[0].results, function(i, oRule) {
            if (iMappingRuleNumber < oRule.MappingRule) {
                iMappingRuleNumber = oRule.MappingRule;
            }

        });
        ++iMappingRuleNumber;

        oMappingRuleData.results[0].results.push({
            MappingRule : iMappingRuleNumber,
            "EntryTypeId.Id" : oController._sEntryTypeId,
            text : oTextBundle.getText("Interpret_MapRule"),
            icon : "sap-icon://order-status",
            type : "RULE",
            results : []
        });

        oModel.setData(oMappingRuleData);

        oController._setSaveNeeded(true);
    },

    /**
     * Creates a new condition under the selected rule
     * 
     * @param oRule
     *            Selected rule data
     * @param iRuleIndex
     *            Index of the selected rule in model (array)
     */
    createCondition : function(oRule, iRuleIndex) {
        var oView = this.getView();
        var iRulePrio = 0, iMappingCondition = 0;
        var oController = this;
        var oModel = oView.getModel();
        var oMappingRuleData = oModel.getData();

        // Comment on the concept of MappingCondition and ConditionPrio:
        // The conditions are something like an unordered list with added property ConditionPrio to enable sorting:
        // - MappingCondition is a unique index on a condition. Not necessarily ordered (even though, in practice, it is ordered)
        // - ConditionPrio holds info on the order of conditions. In practice, conditionPrio and mappingCondition are identical.

        // Determine next condition number
        $.each(oRule.results, function(i, oRule) {
            if (iRulePrio < oRule.ConditionPrio) {
                iRulePrio = oRule.ConditionPrio;
            }

            if (iMappingCondition < oRule.MappingCondition) {
                iMappingCondition = oRule.MappingCondition;
            }
        });
        ++iRulePrio;
        ++iMappingCondition;

        // Add new condition to tree model
        oMappingRuleData.results[0].results[iRuleIndex].results.push({
            ConditionPrio : iRulePrio,
            MappingRule : oRule.MappingRule,
            MappingCondition : iMappingCondition,
            "EntryTypeId.Id" : oController._sEntryTypeId,
            text : oTextBundle.getText("Interpret_Condition"),
            icon : "sap-icon://customer-order-entry",
            type : "PRIORITY",
            results : [ {
                text : oTextBundle.getText("Interpret_Source"),
                icon : "sap-icon://folder",
                type : "SOURCE",
                ConditionPrio : iRulePrio,
                MappingRule : oRule.MappingRule,
                MappingCondition : iMappingCondition,
                "EntryTypeId.Id" : oController._sEntryTypeId
            }, {
                text : oTextBundle.getText("Interpret_Target"),
                icon : "sap-icon://target-group",
                type : "TARGET",
                ConditionPrio : iRulePrio,
                MappingRule : oRule.MappingRule,
                MappingCondition : iMappingCondition,
                "EntryTypeId.Id" : oController._sEntryTypeId
            } ]
        });

        oModel.setData(oMappingRuleData);

        oController._setSaveNeeded(true);
    },

    /**
     * Deletes the given rule
     * 
     * @param iMappingRule
     */
    deleteRule : function(iEntryTypeId, iMappingRule) {
        var oView = this.getView();
        var oModel = oView.getModel();
        var oTreeData = oModel.getData();
        var oModelTable = oView.getModel("RunJSONModel");
        var oTableData = oModelTable.getData();
        var element, i;

        // Delete mapping rule in tree
        $.each(oTreeData.results[0].results, function(index, element) {
            if (element.MappingRule === iMappingRule && element["EntryTypeId.Id"] === iEntryTypeId) {
                oTreeData.results[0].results.splice(index, 1);
                return false; // break the loop, rule exists only once
            }
        });
        // Delete mapping rule in source
        for (i = oTableData.valueMapping.source.length - 1; i >= 0; i--) {
            element = oTableData.valueMapping.source[i];
            if (element.MappingRule === iMappingRule && element["EntryTypeId.Id"] === iEntryTypeId) {
                oTableData.valueMapping.source.splice(i, 1);
            }
        }
        // Delete mapping rule in target
        for (i = oTableData.valueMapping.target.length - 1; i >= 0; i--) {
            element = oTableData.valueMapping.target[i];
            if (element.MappingRule === iMappingRule && element["EntryTypeId.Id"] === iEntryTypeId) {
                oTableData.valueMapping.target.splice(i, 1);
            }
        }

        oModel.setData(oTreeData);
        oModelTable.setData(oTableData);

        this._setSaveNeeded(true);
    },

    /**
     * Deletes the given condition
     * 
     * @param iMappingRule
     * @param iMappingCondition
     */
    deleteCondition : function(iEntryTypeId, iMappingRule, iMappingCondition) {
        var oView = this.getView();
        var oModel = oView.getModel();
        var oTreeData = oModel.getData();
        var oModelTable = oView.getModel("RunJSONModel");
        var oTableData = oModelTable.getData();
        var element, i;

        // Delete mapping rule in tree
        $.each(oTreeData.results[0].results, function(indexRule, elementRule) {
            if (elementRule.MappingRule === iMappingRule && elementRule["EntryTypeId.Id"] === iEntryTypeId) {
                $.each(oTreeData.results[0].results[indexRule].results, function(indexCond, elementCond) {
                    if (elementCond.MappingRule === iMappingRule && elementCond.MappingCondition === iMappingCondition && elementCond["EntryTypeId.Id"] === iEntryTypeId) {
                        oTreeData.results[0].results[indexRule].results.splice(indexCond, 1);
                        return false; // break the loop, conditions exists
                        // only once
                    }
                });
                return false; // break the loop, conditions exists
                // only once
            }
        });
        // Delete mapping rule in source
        for (i = oTableData.valueMapping.source.length - 1; i >= 0; i--) {
            element = oTableData.valueMapping.source[i];
            if (element.MappingRule === iMappingRule && element.MappingCondition === iMappingCondition && element["EntryTypeId.Id"] === iEntryTypeId) {
                oTableData.valueMapping.source.splice(i, 1);
            }
        }
        // Delete mapping rule in target
        for (i = oTableData.valueMapping.target.length - 1; i >= 0; i--) {
            element = oTableData.valueMapping.target[i];
            if (element.MappingRule === iMappingRule && element.MappingCondition === iMappingCondition && element["EntryTypeId.Id"] === iEntryTypeId) {
                oTableData.valueMapping.target.splice(i, 1);
            }
        }

        oModel.setData(oTreeData);
        oModelTable.setData(oTableData);

        this._setSaveNeeded(true);
    },

    /**
     * Sets the save needed flag
     * 
     * @param bSaveNeeded
     */
    _setSaveNeeded : function(bSaveNeeded) {
        sap.ui.getCore().getModel("RunModel").setProperty("/isSaveNeeded", bSaveNeeded);
    },

    /**
     * Handles the change event of all comboboxes in the valueMapping view It updates the selected key in the model
     * 
     * @param oEvent
     */
    onChangeComboBox : function(oEvent) {
        this._setSaveNeeded(true);
    },

    /**
     * On change text field
     * 
     * @param oEvent
     */
    onChangeTextField : function(oEvent) {
        this._setSaveNeeded(true);
    },

    onLiveChangeTargetValue : function(oEvent) {
        // Caution: Side effects!!!!
        // Fields Event.Name, Event.Namespace, and Event.DisplayName are not provided by backend services (runservice or OData, respectively).
        // They were added manually in onValueHelpTargetValue.
        // The "callback is called from Helper.openValueHelpEvent.
        // It exists only for a very specific hack: If the target event is the pseudo-event "dynamic event assignment", and the target attribute is
        // "Event (Semantic)", then the event can be selected from a dialog. Then the event is stored in the binding context.
        // Which means: If another value is input manually, the event must be cleared.

        var oBindingContext = oEvent.getSource().getBindingContext("RunJSONModel");
        var oModel = oBindingContext.getModel();
        if (oBindingContext.getProperty("attrName.name") !== 'EventSemantic') {
            oModel.setProperty("Event.Name", null, oBindingContext);
            oModel.setProperty("Event.Namespace", null, oBindingContext);
            oModel.setProperty("Event.DisplayName", null, oBindingContext);
            this._setSaveNeeded(true);
        } else {
            oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
        }
    },

    onChangeTargetValue : function(oEvent) {
        // the user types ENTER: If the target attribute is "Event (Semantic)" then the event value must be selected from a dropdown list.
        // Otherwise, the value typed in is accepted.

        var newValue = oEvent.getParameter("newValue");
        var oBindingContext = oEvent.getSource().getBindingContext("RunJSONModel");
        var oModel = oBindingContext.getModel();

        if (oBindingContext.getProperty("attrName.name") === 'EventSemantic') {
            // selection of events from dropdown list
            this.onValueHelpTargetValue(oEvent);
        } else {
            oModel.setProperty("TargetValue", newValue, oBindingContext);
        }

    },

    onPressShowValues : function(oEvent) {
        var oTable = oEvent.getSource().getParent().getParent();
        var iIndex = oTable.getSelectedIndex();
        if (iIndex === -1) {
            return;
        }
        // Get necessary context information
        var oBindingContext = oTable.getContextByIndex(iIndex);
        new sap.secmon.ui.loglearning.Helper()._ShowDistinctValues(this, oBindingContext);
    },

    onPressSimulateRegex : function(oEvent) {
        var oOperand1TextField = sap.ui.core.Fragment.byId(this.getView().createId("layoutRowSource"), "textFieldOperand1");
        var oTable = oEvent.getSource().getParent().getParent();
        var iIndex = oTable.getSelectedIndex();
        if (iIndex === -1) {
            return;
        }

        var oBindingContext = oTable.getContextByIndex(iIndex);
        var sValueOperator = oBindingContext.getProperty("Operator");
        var sValue = oBindingContext.getProperty("Operand1");

        if (sValueOperator === "RX" && sValue && sValue.length > 0) {
            try {
                // User will input regex for Java (with named groups and negative lookbehind).
                // But validation happens in browser with JS regex.
                var sDowngradedRegex = sap.secmon.ui.loglearning.util.Formatter.downgradeRegex(sValue);
                var oRegex = new RegExp(sDowngradedRegex);
                oRegex.exec(sValue);

                oOperand1TextField.setValueState(sap.ui.core.ValueState.None);
                oOperand1TextField.setTooltip("");
            } catch (e) {
                oOperand1TextField.setValueState(sap.ui.core.ValueState.Error);
                oOperand1TextField.setTooltip(e.toLocaleString());
                sap.ui.commons.MessageBox.show(e.toLocaleString(), sap.ui.commons.MessageBox.Icon.ERROR, "{i18n>Interpret_Error}");
            }
        }

        // Show distinct values and process given function on each value
        new sap.secmon.ui.loglearning.Helper()._ShowDistinctValues(this, oBindingContext, oTextBundle.getText("Interpret_RegexResult"), function(sValueIn) {
            var aMatch = oRegex.exec(sValueIn);
            var sValueOut = "";

            if (aMatch) {
                if (aMatch.length === 1) {
                    sValueOut = oTextBundle.getText("Interpret_RegexNoGr");
                }
                for (var i = 1; i < aMatch.length; i++) {
                    sValueOut += oTextBundle.getText("Interpret_RxGroupVal", [ i, aMatch[i] ]);
                    if (i + 1 < aMatch.length) {
                        sValueOut += " | ";
                    }
                }
            } else {
                sValueOut = oTextBundle.getText("Interpret_RegexNoM");
            }
            return sValueOut;
        });
    },

    validateRegex : function(oEvent) {
        var input = oEvent.getSource();
        var sRegex = oEvent.getParameter("newValue");
        var oBindingContext = input.getBindingContext("RunJSONModel");

        var sOperator = oBindingContext.getProperty("Operator");
        var sMarkup = sRegex; // " does not matter

        if (sOperator === "RX") {
            if (sRegex && sRegex.length > 0) {
                try {
                    // User will input regex for Java (with named groups and negative lookbehind).
                    // But validation happens in browser with JS regex.
                    var sDowngradedRegex = sap.secmon.ui.loglearning.util.Formatter.downgradeRegex(sRegex);
                    var oRegex = new RegExp(sDowngradedRegex);
                    oRegex.exec(sMarkup);

                    input.setValueState(sap.ui.core.ValueState.None);
                    input.setValueStateText("");

                } catch (e) {
                    input.setValueState(sap.ui.core.ValueState.Error);
                    input.setValueStateText(e.toLocaleString());
                }
            } else {
                input.setValueState(sap.ui.core.ValueState.Error);
                input.setValueStateText(null);
            }
        } else {
            input.setValueState(sap.ui.core.ValueState.None);
            input.setValueStateText(null);
        }
    },

    onValueHelpTargetValue : function(oEvent) {
        var that = this;
        var inputField = oEvent.getSource();

        var promise = new sap.secmon.ui.loglearning.Helper().openValueHelpEvent(this, inputField.getValue());
        $.when(promise).then(function(oSelectedContext) {
            if (!oSelectedContext) {
                // user canceled selection
                inputField.setValueState(sap.ui.core.ValueState.Error);
                return;
            }

            // Caution: Side effects!!!!!
            // Fields Event.Name, Event.Namespace, and Event.DisplayName are not provided by backend services (runservice or OData, respectively).
            // This is a workaround for a very specific use case.
            // If the target event is the pseudo-event "dynamic event assignment", and the target attribute is
            // "Event (Semantic)", then the event can be selected from a dialog. Then the event is stored in the binding context.

            var oBindingContext = inputField.getBindingContext("RunJSONModel");
            that.copyEventIds(oSelectedContext, oBindingContext);
            that._setSaveNeeded(true);

            inputField.setValueState(sap.ui.core.ValueState.None);
            inputField.setValueStateText(null);

        });
    },

    onSuggestTargetEvent : function(oEvent) {
        var sTerm = oEvent.getParameter("suggestValue");
        var aFilters = [];
        if (sTerm) {
            aFilters.push(new sap.ui.model.Filter("displayName", sap.ui.model.FilterOperator.StartsWith, sTerm));
        }
        oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
    },

    onTargetEventSugggestionSelected : function(oEvent) {
        var inputField = oEvent.getSource();

        // selected row of suggestionItems
        var selectedSuggestionItem = oEvent.getParameter("selectedItem");
        var oSourceContext = selectedSuggestionItem.getBindingContext("KBEventModel");
        var oTargetContext = inputField.getBindingContext("RunJSONModel");

        this.copyEventIds(oSourceContext, oTargetContext);
        this._setSaveNeeded(true);

        inputField.setValueState(sap.ui.core.ValueState.None);
        inputField.setValueStateText(null);
    },

    copyEventIds : function(sourceContext, targetContext) {
        // copy event ID from a context to another.
        // Caution: name and format differ!
        var sKey = sourceContext.getProperty("hash");
        var sNamespace = sourceContext.getProperty("nameSpace");
        var sName = sourceContext.getProperty("name");
        var sDisplayName = sourceContext.getProperty("displayName");
        var sEventHashHex = this.oCommons.base64ToHex(sKey);

        targetContext.getModel().setProperty("TargetValue", sEventHashHex, targetContext);
        targetContext.getModel().setProperty("Event.Name", sName, targetContext);
        targetContext.getModel().setProperty("Event.DisplayName", sDisplayName, targetContext);
        targetContext.getModel().setProperty("Event.Namespace", sNamespace, targetContext);
    },

    /**
     * Creates the batch change operation for the selected event
     * 
     * @param sName
     *            New event name
     * @param oTextField
     *            Reference to text field where user entered the event name
     */

    onValueHelpAttribute : function(oEvent) {

        var that = this;

        var inputField = oEvent.getSource();
        var oTargetContext = inputField.getBindingContext("RunJSONModel");
        var boundData = oTargetContext.getObject();
        var searchString = inputField.getValue();
        var preselectedKey = boundData.AttrHash;

        // disallow multi-selection in valuehelp
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

        // This field is for UI purposes: The target tabel is bound against displayName
        oTargetContext.getModel().setProperty("TargetAttributeId", {
            hash : sKey,
            hashHex : sAttrHashHex,
            name : sName,
            nameSpace : sNamespace,
            displayName : sDisplayName
        }, oTargetContext);

        console.debug("Key Hex: %s", sAttrHashHex);
    },

    onLiveChangeAttrTextField : function(oEvent) {
        // reset the hash. The user should use dropdown to select a value
        var inputField = oEvent.getSource();
        var oBindingContext = inputField.getBindingContext("RunJSONModel");
        oBindingContext.getModel().setProperty("AttrHash", null, oBindingContext);
        oBindingContext.getModel().setProperty("attrName.name", null, oBindingContext);
        oBindingContext.getModel().setProperty("attrNameSpace.nameSpace", null, oBindingContext);
        oBindingContext.getModel().setProperty("TargetAttributeId", null);

        inputField.setValueState(sap.ui.core.ValueState.Error);
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
     * Handles the "change value" event of attribute input field
     * 
     * @memberOf sap.secmon.ui.loglearning.stagingEntryTypes
     */
    onChangeAttrTextField : function(oEvent) {
        // open the value help popup when user presses ENTER, the popup is pre-set with value
        this.onValueHelpAttribute(oEvent);
    },

    _createUiModel : function() {
        var aAttributes = [ {
            text : "=",
            key : "EQ"
        }, {
            text : "<>",
            key : "NE"
        }, {
            text : "<",
            key : "LT"
        }, {
            text : "<=",
            key : "LE"
        }, {
            text : ">",
            key : "GT"
        }, {
            text : ">=",
            key : "GE"
        }, {
            text : oTextBundle.getText("Interpret_IN"),
            key : "IN"
        }, {
            text : oTextBundle.getText("Interpret_BT"),
            key : "BT"
        }, {
            text : oTextBundle.getText("Interpret_CP"),
            key : "CP"
        }, {
            text : oTextBundle.getText("Interpret_NP"),
            key : "NP"
        }, {
            text : oTextBundle.getText("Interpret_RX"),
            key : "RX"
        }, {
            text : oTextBundle.getText("Interpret_MG"),
            key : "MG"
        } ];

        var oUiModel = new sap.ui.model.json.JSONModel({
            attributes : aAttributes,
            selectedNodeType : null,
            selectedOperator : null,
            selectedId : null
        });
        this.getView().setModel(oUiModel, "uiModel");
    },

    onOperatorChange : function(oEvent) {
        var oUiModel = this.getView().getModel("uiModel").getData();
        var oRunsData = this.getView().getModel("RunJSONModel").getData();
        var controller = this;
        var aRowsWithRegex =
                oRunsData.valueMapping.source.filter(function(oSource) {
                    return oSource["EntryTypeId.Id"] === controller._sEntryTypeId && oSource.MappingCondition === oUiModel.conditionNumber && oSource.MappingRule === oUiModel.ruleNumber &&
                            oSource.Operator === 'RX';
                });
        var sId = oEvent.getSource().getId();
        var oComboBox = this.getView().byId(sId);
        if (aRowsWithRegex.length > 1) {
            oComboBox.setValueState(sap.ui.core.ValueState.Error);
            oComboBox.setValueStateText(oTextBundle.getText("Interpret_SaveErr"));
            this._setSaveNeeded(false);
        } else {
            oComboBox.setValueState(sap.ui.core.ValueState.None);
            this._setSaveNeeded(true);
        }
    }

});