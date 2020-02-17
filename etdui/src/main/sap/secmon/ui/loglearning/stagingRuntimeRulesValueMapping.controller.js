/* globals oTextBundle */
$.sap.require("sap.secmon.ui.loglearning.Helper");
sap.ui.controller("sap.secmon.ui.loglearning.stagingRuntimeRulesValueMapping", {

    _oInitialTreeData : {
        results : [ {
            text : oTextBundle.getText("Interpret_MappingRules"),
            icon : "sap-icon://contacts",
            type : "ROOT",
            results : []
        } ]
    },

    _sEntryTypeId : undefined,

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.loglearning.stagingRuntimeRulesValueMapping
     */
    onInit : function() {
        var oModel = new sap.ui.model.json.JSONModel($.extend({}, this._oInitialTreeData));
        var aAttributes = [
            {
                text: "=",
                key: "EQ"
            },
            {
                text: "<>",
                key: "NE"
            },
            {
                text: "<",
                key: "LT"
            },
            {
                text: "<=",
                key: "LE"
            },
            {
                text: ">",
                key: "GT"
            },
            {
                text: ">=",
                key: "GE"
            },
            {
                text: oTextBundle.getText("Interpret_IN"),
                key: "IN"
            },
            {
                text: oTextBundle.getText("Interpret_BT"),
                key: "BT"
            },
            {
                text: oTextBundle.getText("Interpret_CP"),
                key: "CP"
            },
            {
                text: oTextBundle.getText("Interpret_NP"),
                key: "NP"
            },
            {
                text: oTextBundle.getText("Interpret_RX"),
                key: "RX"
            },
            {
                text: oTextBundle.getText("Interpret_MG"),
                key: "MG"
            }];
        this.getView().setModel(oModel);
        this.getView().setModel(sap.ui.getCore().getModel("RunJSONModel"), "RunJSONModel");
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), "Annotations");
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), "Attributes");
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), "Roles");
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), "RoleAttributeAssignment");  
        var oUiModel = new sap.ui.model.json.JSONModel({
            selectedNodeType : null,
            attributes : aAttributes
        });
        this.getView().setModel(oUiModel, "uiModel");

    },

    /**
     * When user selects a leaf/node in the value mapping tree
     * 
     * @param oEvent
     */
    onSelectedSourceOrTarget : function(oEvent) {
        var uiModel = this.getView().getModel("uiModel");
        var oLeaf = oEvent.getSource();
        var selectedNodeType = oLeaf.data("type");

        uiModel.setProperty("/selectedNodeType", selectedNodeType);

        var oBindingContext = oLeaf.getParent().getBindingContext();
        if (!oBindingContext) {
            // no runtime rule selected
            return;
        }

        var sEntryTypeId = oBindingContext.getProperty("EntryTypeId.Id");
        var sRule = oBindingContext.getProperty("MappingRule");
        var sCondition = oBindingContext.getProperty("MappingCondition");

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
            oSourceTable = sap.ui.core.Fragment.byId(this.getView().createId("layoutRowRuntimeRulesSource"), "RunTableSource");

            oBinding = oSourceTable.getBinding("rows");
            if (oBinding) {
                oBinding.filter(aFilters);
            }
            break;
        case "TARGET":
            oTargetTable = sap.ui.core.Fragment.byId(this.getView().createId("layoutRowRuntimeRulesTarget"), "RunTableTarget");

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
     * Reads the value mapping
     * 
     */
    readValueMapping : function() {
        var oView = this.getView();
        var uiModel = oView.getModel("uiModel");
        // Create deep copy of the valueMapping data
        var aDataTemp = $.extend({}, oView.getParent().getParent().getParent().getParent().getModel().getData().runtimeRules.valueMapping.source);

        var oDataTree = {
            results : [ {
                text : oTextBundle.getText("Interpret_MappingRules"),
                icon : "sap-icon://contacts",
                results : new sap.secmon.ui.loglearning.Helper().convertValueMappingFlatToTree(aDataTemp, this._sEntryTypeId)
            } ]
        };

        oView.getModel().setData(oDataTree);
        uiModel.setProperty("/selectedNodeType", "ROOT");
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
            this.readValueMapping();
        } else {

            oView.getModel().setData($.extend({}, this._oInitialTreeData));
            this._sEntryTypeId = undefined;
            oView.byId("tree").getNodes()[0].setSelectable(false);
        }
    },

    /**
     * Row selection change of source/target table. Enables/Disables delete button
     * 
     * @param oEvent
     */
    onRowSelectionChange : function(oEvent) {
        if (oEvent.getSource().getSelectedIndices().length > 0) {
            oEvent.getSource().getToolbar().getItems()[1].setEnabled(true);
        } else {
            oEvent.getSource().getToolbar().getItems()[1].setEnabled(false);
        }
    }

});