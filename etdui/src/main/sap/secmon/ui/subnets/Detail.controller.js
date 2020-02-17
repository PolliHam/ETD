/* globals oTextBundle */
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.subnets.Detail", {

    oRouter : null,
    fnAutoRefresh : undefined,
    oCommons : new sap.secmon.ui.commons.CommonFunctions(),

    handleRouteMatched : function(oEvent) {
        if (oEvent.getParameters().name !== "Detail") {
            return;
        }
        this.getView().bindObject("/Subnets(X'" + oEvent.getParameters().arguments.Id + "')");
    },

    onInit : function() {
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);

        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/services/ui/subnets/Subnets.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }));

        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/services/genericEnum.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }), "Enum");

        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/services/ui/locations/Locations.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }), "ModelLocations");
    },

    reportWarning : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Warning, sText, sText);
    },

    reportError : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sText);
    },

    reportSuccess : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, sText);
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },
    onChangeSubnetDetailsCombo : function(oEvent) {
        var oCombo = oEvent.getSource();
        // cache inconsitent UI controls in oder to easily check when saving changes
        if (!this._checkInconsistencyTable) {
            this._checkInconsistencyTable = [];
        }
        var idx = this._checkInconsistencyTable.indexOf(oCombo.getId());

        if (oCombo.getSelectedKey() === "" && oCombo.getValue() !== "") {
            oCombo.focus();
            oCombo.setValueState(sap.ui.core.ValueState.Error);
            if (idx === -1) {
                this._checkInconsistencyTable.push(oCombo.getId());
            }
        } else {
            oCombo.setValueState(sap.ui.core.ValueState.None);
            if (idx !== -1) {
                this._checkInconsistencyTable.splice(idx, 1);
            }
        }
    },

    onChangeLocation : function(oEvent) {
        var that = this;
        var oModel = this.getView().getModel();
        var sPath = this.getView().getBindingContext().getPath();
        var oInput = oEvent.getSource();
        var sSelectedLocation = oInput.getValue();
        oInput.setValueState(sap.ui.core.ValueState.None);
        // cache inconsistent UI controls in oder to easily check when saving changes
        if (!this._checkInconsistencyTable) {
            this._checkInconsistencyTable = [];
        }
        var idx = this._checkInconsistencyTable.indexOf(oInput.getId());
        if (idx !== -1) {
            this._checkInconsistencyTable.splice(idx, 1);
        }

        if (sSelectedLocation !== "") {
            this._checkInconsistencyTable.push(oInput.getId());
            oInput.setValueState(sap.ui.core.ValueState.Error);
            var aLocations = this.getView().getModel("ModelLocations").getProperty("/");
            Object.keys(aLocations).map(function(key) {
                if (sSelectedLocation === aLocations[key].Location) {
                    oModel.setProperty(sPath + "/LocationId", aLocations[key].Id);
                    idx = that._checkInconsistencyTable.indexOf(oInput.getId());
                    that._checkInconsistencyTable.splice(idx, 1);
                    oInput.setValueState(sap.ui.core.ValueState.None);
                }
            });
        } else {
            oModel.setProperty(sPath + "/LocationId", null);
        }
    },

    onShowLocationsValueHelp : function(oEvent) {
        this.getLocationsValueHelp().open();
    },

    getLocationsValueHelp : function() {
        if (!this.oLocationsValueHelpDialog) {
            this.oLocationsValueHelpDialog = sap.ui.xmlfragment("SubnetLocationsValueHelp", "sap.secmon.ui.locations.LocationsValueHelp", this);
            this.oLocationsValueHelpDialog.setModel(this.getView().getModel("ModelLocations"));
            this.getView().addDependent(this.oLocationsValueHelpDialog);
            if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
                this.oLocationsValueHelpDialog.addStyleClass("sapUiSizeCompact");
            }
        }
        return this.oLocationsValueHelpDialog;
    },

    onConfirmSelectLocationsDialog : function(oEvent) {
        var oModel = this.getView().getModel();
        var sPath = this.getView().getBindingContext().getPath();
        if (oEvent.getId() === "confirm") {
            var oSelectedData = oEvent.getParameter("selectedContexts")[0].getModel().getProperty(oEvent.getParameter("selectedContexts")[0].getPath());
            oModel.setProperty(sPath + "/LocationName", oSelectedData.Location);
            oModel.setProperty(sPath + "/LocationId", oSelectedData.Id);
        }
        // reset filter
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([]);
    },

    handleValueHelpSearch : function(oEvent) {
        var oBinding = oEvent.getSource().getBinding("items");
        var oFilter =
                new sap.ui.model.Filter([ new sap.ui.model.Filter("Location", sap.ui.model.FilterOperator.Contains, oEvent.getParameter("value")),
                        new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, oEvent.getParameter("value")) ], false);
        oBinding.filter([ oFilter ]);
    },

    onPressSave : function(oEvent) {
        var that = this;
        var oView = this.getView();
        var oData = oView.getBindingContext().getObject();
        var sSubnet = oData.NetAddressString;

        // check consistency of changes
        if (this._checkInconsistencyTable && this._checkInconsistencyTable.length > 0) {
            this.reportError(oTextBundle.getText("Subnets_InvDetails"));
            return;
        }
        
        oView.setBusy(true);
        oView.getModel().update("Subnets(X'" + this.oCommons.base64ToHex(oData.Id) + "')", oData, {
            success : function() {
                oView.setBusy(false);
                var messageText = oTextBundle.getText("Subnets_SaveSuc", sSubnet);
                that.reportSuccess(messageText);
            },
            error : function(oError) {
                oView.setBusy(false);
                var sErrorText;
                try {
                    var mError = JSON.parse(oError.response.body);
                    sErrorText = mError.error.message.value;
                } catch (ex) {
                    sErrorText = "Invalid Server Response: " + oError.response.body;
                }
                that.reportError(oTextBundle.getText("Subnets_SaveErr", [ sSubnet, sErrorText ]));
            }
        });
    }
});