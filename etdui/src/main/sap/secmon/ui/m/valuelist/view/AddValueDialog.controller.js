jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.valuelist.util.ODataErrorHandler");
jQuery.sap.require("sap.m.MessageToast");
sap.ui.controller("sap.secmon.ui.m.valuelist.view.AddValueDialog", {

    oDialog : null,
    fnSuccessCallback : null,
    oParentView : null,

    onInit : function() {

    },

    /**
     * Opens pop up for filling valuelist with data from events.
     * 
     */
    openDialog : function(headerId, oParentView, fnSuccessCallback) {
        this.oParentView = oParentView;
        this.fnSuccessCallback = fnSuccessCallback;

        if (!this.oDialog) {
            var sPrefix = this.oParentView.getId();
            this.oDialog = sap.ui.xmlfragment(sPrefix, "sap.secmon.ui.m.valuelist.view.AddValueDialog", this);
            oParentView.addDependent(this.oDialog);
        }

        // Set and bind Namespaces Model
        this.oDialog.setModel(oParentView.getModel("nameSpaces"), "nameSpaces");
        var oNameSpaceSelect = this.oParentView.byId("nameSpaceSelect");
        var oSelectTemplate = oNameSpaceSelect.removeItem(0);
        if (oSelectTemplate !== null) {
            oNameSpaceSelect.bindAggregation("items", 'nameSpaces>/NameSpaces', oSelectTemplate, new sap.ui.model.Sorter("NameSpace", false));
        }

        // json Model for new value
        var oModel;
        oModel = new sap.ui.model.json.JSONModel();
        oModel.setData({
            "HeaderId.Id" : headerId,
            ValueVarChar : '',
            NameSpace : this.oParentView.getBindingContext().getProperty("NameSpace"),
            Operator : 'EQUALS',
            Description : ''
        });
        this.oDialog.setModel(oModel, "local");

        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", oParentView, this.oDialog);
        this.oDialog.open();

    },

    /**
     * Creates an entry in list of values.
     */
    onAddValue : function(oEvent) {
        // set focus on Button is needed it ensure that on mobile device the
        // value of the inputField is used
        this.oDialog.focus("Add_But");

        var oLocalModel = this.oDialog.getModel("local");
        var request = oLocalModel.getData();
        var controller = this;

        this.oDialog.getParent().getController().isResetNeeded.call(this.oDialog.getParent().getController());
        if (this.oDialog.getParent().getController().ResetData.resetRelevant === true && this.oDialog.getParent().getController().resetAllowed === null) {

            var sMessageText =
                    sap.secmon.ui.commons.Formatter.i18nText(this.oDialog.getParent().getController().getText("VL_UsedInADL"), this.oDialog.getParent().getController().ResetData.totalAlertCount);
            sap.m.MessageBox.confirm(sMessageText, {
                actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO, sap.m.MessageBox.Action.CANCEL ],
                defaultAction : sap.m.MessageBox.Action.NO,
                details : this.oDialog.getParent().getController().getResetDetails(),
                onClose : function(oAction) {
                    if (oAction === sap.m.MessageBox.Action.YES) {
                        controller.oDialog.getParent().getController().resetAllowed = true;
                        controller.oDialog.getParent().getController().triggerReset();
                    } else if (oAction === sap.m.MessageBox.Action.NO) {
                        controller.oDialog.getParent().getController().resetAllowed = false;
                    }

                    if (oAction !== sap.m.MessageBox.Action.CANCEL) {
                        var oI18nModel = controller.oParentView.getModel("i18n");
                        var valuelistModel = controller.oParentView.getModel();
                        valuelistModel.setHeaders({
                            "content-type" : "application/json;charset=utf-8"
                        });
                        // set namespace
                        var oNameSpaceSelect = controller.oParentView.byId("nameSpaceSelect");
                        request.NameSpace = oNameSpaceSelect.getSelectedItem().getProperty("text");
                        // OData expects an (empty) entry for every field
                        request.Id = '';

                        valuelistModel.create('/Values', request, null, function() {
                            controller._afterSuccessfulRequest();
                        }, function(e) {
                            sap.secmon.ui.m.valuelist.util.ODataErrorHandler.showAlert(e.response, oI18nModel);
                        });

                    }

                }

            });

        } else {
            var oI18nModel = controller.oParentView.getModel("i18n");
            var valuelistModel = controller.oParentView.getModel();
            valuelistModel.setHeaders({
                "content-type" : "application/json;charset=utf-8"
            });
            // set namespace
            var oNameSpaceSelect = controller.oParentView.byId("nameSpaceSelect");
            request.NameSpace = oNameSpaceSelect.getSelectedItem().getProperty("text");
            // Dummy GUID. OData expects an entry for every field and validates the format. Will be replaced on server with unique one.
            request.Id = "0000000000000000";

            valuelistModel.create('/Values', request, null, function() {
                controller.oDialog.getParent().getController().resetAllowed = false;
                controller._afterSuccessfulRequest();
            }, function(e) {
                sap.secmon.ui.m.valuelist.util.ODataErrorHandler.showAlert(e.response, oI18nModel);
            });

        }

    },


    checkValue : function() {
        // reset the valuestate of the input field when entering a new value
        var inputField = this.oParentView.byId("valueInput"); // oEvent.getSource(); //
        var oI18nModel = this.oParentView.getModel("i18n"), addButton;
        var oLocalModel = this.oDialog.getModel("local");
        var operator = oLocalModel.getProperty("/Operator");
        var value = inputField.getValue();
        if (operator === "LIKE_REGEXPR" || operator === "LIKE") {
            if (!value || value.length === 0) {
                inputField.setValueState(sap.ui.core.ValueState.Error);
                inputField.setValueStateText(oI18nModel.getProperty("VL_Entry_NewValueEmpty"));
                addButton = this.oParentView.byId("Add_But");
                addButton.setEnabled(false);
                return;
            }
        }

        if (operator === "LIKE_REGEXPR") {
            var regexValid = true;
            try {
                /* jshint unused:true */
                regexValid = true;
            } catch (ex) {
                regexValid = false;
            }
            if (regexValid === false) {
                inputField.setValueState(sap.ui.core.ValueState.Error);
                inputField.setValueStateText(oI18nModel.getProperty("VL_Entry_valInvalidRegex"));
                addButton = this.oParentView.byId("Add_But");
                addButton.setEnabled(false);
                return;
            }
        }
        inputField.setValueState(sap.ui.core.ValueState.none);
        inputField.setValueStateText("");
        addButton = this.oParentView.byId("Add_But");
        addButton.setEnabled(true);
    },

    onDialogClose : function(oEvent) {
        this.oDialog.close();
    },

    _afterSuccessfulRequest : function(){
        var oI18nModel = this.oParentView.getModel("i18n");
        sap.m.MessageToast.show(oI18nModel.getProperty("VL_ValueAdded"));
        this.fnSuccessCallback();
        if (this.oDialog.getParent().getController().ResetData.resetRelevant === true && this.oDialog.getParent().getController().resetAllowed === true) {
            this.oDialog.getParent().getController().triggerReset();
        }
        this.oDialog.close();
    }

});
