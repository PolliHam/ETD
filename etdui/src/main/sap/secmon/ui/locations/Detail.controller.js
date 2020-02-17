/* globals oTextBundle */
jQuery.sap.require("sap.ui.model.odata.CountMode");
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.locations.Detail", {

    oRouter : null,
    fnAutoRefresh : undefined,

    handleRouteMatched : function(oEvent) {
        if (oEvent.getParameters().name !== "Detail") {
            return;
        }
        this.getView().getModel().resetChanges();
        this.getView().bindObject("/Locations(X'" + oEvent.getParameters().arguments.Id + "')");
    },

    onInit : function() {
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);
        this.getView().setModel(new sap.ui.model.odata.v2.ODataModel("/sap/secmon/services/ui/locations/Locations.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }));
        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/services/genericEnum.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }), "Enum");
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

    onChangeLocationType : function(oEvent) {
        var oCombo = oEvent.getSource();
        var bLocationTypeValid;
        // Location type must be valid
        if (oCombo.getSelectedKey() === "" && oCombo.getValue() !== "") {
            oCombo.focus();
            oCombo.setValueState(sap.ui.core.ValueState.Error);
            bLocationTypeValid = false;
        } else {
            bLocationTypeValid = true;
            oCombo.setValueState(sap.ui.core.ValueState.None);
        }
    },

    onChangeParentLocation : function(oEvent) {
        var that = this;
        var oModel = this.getView().getModel();
        var sPath = this.getView().getBindingContext().getPath();
        var oInput = oEvent.getSource();
        var sSelectedParentLocation = oInput.getValue();
        oInput.setValueState(sap.ui.core.ValueState.None);
        this.bParentLocationValid = true;
        if (sSelectedParentLocation !== "") {
            this.bParentLocationValid = false;
            oInput.setValueState(sap.ui.core.ValueState.Error);
            var aLocations = this.getView().getModel().getProperty("/");
            Object.keys(aLocations).map(function(key) {
                if (sSelectedParentLocation === aLocations[key].Location) {
                    oModel.setProperty(sPath + "/ParentLocationName", aLocations[key].Location);
                    oModel.setProperty(sPath + "/ParentLocation", aLocations[key].Id);
                    oInput.setValueState(sap.ui.core.ValueState.None);
                    that.bParentLocationValid = true;
                }
            });
        } else {
            oModel.setProperty(sPath + "/ParentLocationName", null);
            oModel.setProperty(sPath + "/ParentLocation", null);
        }
    },

    onChangeLongitude : function(oEvent) {
        var that = this;
        var oInput = oEvent.getSource();
        var bLongitudeValid = true;
        oInput.setValueState(sap.ui.core.ValueState.None);
        if (isNaN(oInput.getValue()) || oInput.getValue() < -180 || oInput.getValue() > 180) {
            oInput.setValueState(sap.ui.core.ValueState.Error);
            bLongitudeValid = false;
        }
        if (oInput.getValue() === "") {
            var oModel = that.getView().getModel();
            var sPath = this.getView().getBindingContext().getPath();
            oModel.setProperty(sPath + "/Longitude", null);
        }
    },

    onChangeLatitude : function(oEvent) {
        var that = this;
        var oInput = oEvent.getSource();
        var bLatitudeValid = true;
        oInput.setValueState(sap.ui.core.ValueState.None);
        if (isNaN(oInput.getValue()) || oInput.getValue() < -90 || oInput.getValue() > 90) {
            oInput.setValueState(sap.ui.core.ValueState.Error);
            bLatitudeValid = false;
        }
        if (oInput.getValue() === "") {
            var oModel = that.getView().getModel();
            var sPath = this.getView().getBindingContext().getPath();
            oModel.setProperty(sPath + "/Latitude", null);
        }
    },

    onShowParentLocationValueHelp : function(oEvent) {
        this.getParentLocationValueHelp().open();
    },

    getParentLocationValueHelp : function() {
        if (!this.oParentLocationValueHelpDialog) {
            this.oParentLocationValueHelpDialog = sap.ui.xmlfragment("ParentLocationValueHelp", "sap.secmon.ui.locations.LocationsValueHelp", this);
            this.oParentLocationValueHelpDialog.setModel(this.getView().getModel());
            this.getView().addDependent(this.oParentLocationValueHelpDialog);
            if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
                this.oParentLocationValueHelpDialog.addStyleClass("sapUiSizeCompact");
            }
        }
        return this.oParentLocationValueHelpDialog;
    },

    handleValueHelpSearch : function(oEvent) {
        var oBinding = oEvent.getSource().getBinding("items");
        var oFilter =
                new sap.ui.model.Filter([ new sap.ui.model.Filter("Location", sap.ui.model.FilterOperator.Contains, oEvent.getParameter("value")),
                        new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, oEvent.getParameter("value")) ], false);
        oBinding.filter([ oFilter ]);
    },

    onConfirmSelectLocationsDialog : function(oEvent) {
        if (oEvent.getId() === "confirm") {

            this.getView().byId("inputParentLocation").setValueState(sap.ui.core.ValueState.None);

            var oBindingContext = this.getView().getBindingContext();
            var oModel = oBindingContext.getModel();
            var oSelectedData = oEvent.getParameter("selectedItem").getBindingContext().getObject();
            oModel.setProperty("ParentLocationName", oSelectedData.Location, oBindingContext);
            oModel.setProperty("ParentLocation", oSelectedData.Id, oBindingContext);
        }
        // reset filter
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([]);
    },

    onPressSave : function(oEvent) {
        var that = this;
        // check consistency of changes
        var oCombo = this.getView().byId("comboType");
        oCombo.setValueState(sap.ui.core.ValueState.None);
        var oData = this.getView().getBindingContext().getObject();
        var sParentLocationName = oData.ParentLocationName;
        if (this.bLocationTypeValid === false) {
            oCombo.focus();
            oCombo.setValueState(sap.ui.core.ValueState.Error);
            this.reportError(oTextBundle.getText("Locations_EnterAllFields"));
            return;
        } else if (this.bParentLocationValid === false) {
            this.reportError(oTextBundle.getText("Locations_LocErr", sParentLocationName));
            return;
        } else if (this.bLongitudeValid === false) {
            this.reportError(oTextBundle.getText("Locations_LongErr"));
            return;
        } else if (this.bLatitudeValid === false) {
            this.reportError(oTextBundle.getText("Locations_LatiErr"));
            return;
        }        
        var sLocation = oData.Location;
        this.getView().getModel().submitChanges({
            success : function(oResponse) {
                var messageText = oTextBundle.getText("Locations_SaveSuc", sLocation);
                that.reportSuccess(messageText);
            }, 
            error : function(oError) {
                var sErrorText = $(oError.response.body).find("message").first().text();
                that.reportError(oTextBundle.getText("Locations_SaveErr", [ sLocation, sErrorText ]));
            }
        });
    }
});