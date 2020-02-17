jQuery.sap.require("sap.secmon.ui.m.valuelist.util.ODataErrorHandler");

sap.ui.controller("sap.secmon.ui.m.exemptions.view.AddDimensionDialog", {

    XSJS_PATTERN_GROUPING : "/sap/secmon/services/ui/m/alertexceptions/PatternGroupingAttributes.xsjs",
    oDialog : null,
    fnSuccessCallback : null,
    oParentView : null,

    onInit : function() {

    },

    /**
     * Opens pop up for filling valuelist with data from events.
     * 
     */
    openDialog : function(oExemption, oParentView, fnSuccessCallback) {
        this.oParentView = oParentView;
        this.fnSuccessCallback = fnSuccessCallback;

        if (!this.oDialog) {
            var sPrefix = this.oParentView.getId();
            this.oDialog = sap.ui.xmlfragment(sPrefix, "sap.secmon.ui.m.exemptions.view.AddDimensionDialog", this);
            oParentView.addDependent(this.oDialog);
        }
        var usedDimension = this.oParentView.getModel("editModel").getData().Details;
        var unUsedDimension = this.oParentView.getController().Details;
        if (usedDimension !== undefined) {
            usedDimension.forEach(function(oDimension) {
                unUsedDimension = unUsedDimension.filter(function(oDim) {
                    // currently only ValueVarChar, ValueInteger and ValueBigInt
                    // are supported
                    if (oDimension.AttributeKey === oDim.AttributeKey) {
                        return false;
                    } else if (oDim.ValueType === "ValueVarChar" || oDim.ValueType === "ValueInteger" || oDim.ValueType === "ValueBigInt") {
                        return true;
                    } else {
                        return false;
                    }
                });
            });
        }

        var oDimensionModel = new sap.ui.model.json.JSONModel();
        this.oDialog.setModel(oDimensionModel, "dimensions");

        oDimensionModel.setData({
            Name : unUsedDimension
        });

        // Set and bind Model
        var oDimensionSelect = this.oParentView.byId("dimensionSelect");
        var oSelectTemplate = oDimensionSelect.removeItem(0);
        if (oSelectTemplate !== null) {
            oDimensionSelect.bindAggregation("items", 'dimensions>/Name', oSelectTemplate, new sap.ui.model.Sorter("Name", false));
        }

        // json Model for new value
        var oModel;
        oModel = new sap.ui.model.json.JSONModel();
        oModel.setData({
            ValueVarChar : '',
            Name : this.oParentView.getBindingContext().getProperty("Name"),
            ValueTypeLow : this.oParentView.getBindingContext().getProperty("ValueType")
        });
        this.oDialog.setModel(oModel, "local");

        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", oParentView, this.oDialog);
        this.oDialog.open();

    },

    onAddDimension : function(oEvent) {
        // set focus on Button is needed it ensure that on mobile device the
        // value of the inputField is used
        this.oDialog.focus("Add_But");

        var oLocalModel = this.oDialog.getModel("local");
        var oDialogData = oLocalModel.getData();
        var oDimensionSelect = this.oParentView.byId("dimensionSelect");
        var aDimensions = this.oParentView.getController().Details;
        var sValueTypeLow;
        aDimensions.some(function(oDimension) {
            if (oDimension.AttributeKey === oDimensionSelect.getSelectedItem().getProperty("key")) {
                sValueTypeLow = oDimension.ValueType;
                return true;
            }
        });
        var oDimension = {
            Name : oDimensionSelect.getSelectedItem().getProperty("text"),
            AttributeKey : oDimensionSelect.getSelectedItem().getProperty("key"),
            ValueLow : oDialogData.ValueVarChar,
            ValueTypeLow : sValueTypeLow,
            Id : null
        };

        var oEditModel = this.oParentView.getModel("editModel");
        var oEditModelData = oEditModel.getData();
        oEditModelData.Details.push(oDimension);
        oEditModel.setData(oEditModelData);

        this.oDialog.close();

    },

    onDialogClose : function(oEvent) {
        this.oDialog.close();
    },

});
