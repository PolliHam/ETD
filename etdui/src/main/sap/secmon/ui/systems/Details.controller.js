/* globals oTextBundle*/
$.sap.require("sap.secmon.ui.systems.Constants");
jQuery.sap.require("sap.ui.model.odata.CountMode");
$.sap.require("sap.secmon.ui.m.commons.EtdController");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.systems.Details", {

    oRouter : null,
    oCommonFunctions : null,

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.systems.Details
     */
    onInit : function() {
        this.applyCozyCompact();
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.onRouteMatched, this);
        this.oCommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
        this.getView().addStyleClass("sapEtdBackgroundWhite");
        this.initModels();
    },

    initModels : function() {
        // Model for system details
        var oModelSystemDetails = new sap.ui.model.odata.ODataModel(sap.secmon.ui.systems.Constants.C_SERVICE_PATH.SYSTEMS, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.getView().setModel(oModelSystemDetails);

        // Model for location
        var oModelLocations = new sap.ui.model.odata.ODataModel(sap.secmon.ui.systems.Constants.C_SERVICE_PATH.LOCATIONS, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.getView().setModel(oModelLocations, 'ModelLocations');

        // Model for enum
        var oModelGenericEnum = new sap.ui.model.odata.ODataModel(sap.secmon.ui.systems.Constants.C_SERVICE_PATH.ENUM, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.getView().setModel(oModelGenericEnum, "Enum");

        // Model for main systems
        var oModelMainSystems = new sap.ui.model.json.JSONModel();
        this.getView().setModel(oModelMainSystems, 'ModelMainSystems');
        var oModelTmp = new sap.ui.model.odata.ODataModel(sap.secmon.ui.systems.Constants.C_SERVICE_PATH.SYSTEMS, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        oModelTmp.read("/SystemHeader", {
            urlParameters : [ "$orderby=MainSystemId asc", "$select=MainSystemId, MainSystemType" ],
            filters : [ new sap.ui.model.Filter("MainSystemId", sap.ui.model.FilterOperator.NE, null) ],
            sorter : new sap.ui.model.Sorter({
                path : "MainSystemId",
                descending : false
            }),
            success : function(oData, oResponse) {
                var aMainSystem = [];
                $.each(oData.results, function(idx, oRes) {
                    var bAlreadyExist = false;
                    for (var i = 0; i < aMainSystem.length; i++) {
                        if (aMainSystem[i].SystemGroup === oRes.MainSystemId + ' / ' + oRes.MainSystemType) {
                            bAlreadyExist = true;
                            break;
                        }
                    }
                    if (bAlreadyExist === false) {
                        aMainSystem.push({
                            SystemGroup : oRes.MainSystemId + ' / ' + oRes.MainSystemType
                        });
                    }
                });
                oModelMainSystems.setData(aMainSystem);
            },
            error : function(oError) {
                console.error(oError);
            }
        });
        // Model for UI
        var oModelUI = new sap.ui.model.json.JSONModel();
        this.getView().setModel(oModelUI, "UIModel");
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    onRouteMatched : function(oEvent) {
        /*
         * This event is called if the route itself matches, but also if a "subroute" matches. In our case, the subroute for alert contains also the URL-query parameters, where this view should be
         * filtered to.
         */
        var args = oEvent.getParameter("arguments");
        if (args === null || args === undefined) {
            return;
        }
        var name = oEvent.getParameter("name");
        if (name !== "details") {
            return;
        }
        this.Id = decodeURIComponent(args.Id);
        this.Type = decodeURIComponent(args.Type);
        var sBindingPath = "/SystemHeader(Id='" + this.Id + "', Type='" + this.Type + "')";
        this.getView().bindObject(sBindingPath);
    },

    onSave : function() {
        var that = this;
        var oView = this.getView();
        var oModel = oView.getModel();

        // check consistency of changes
        if (this._checkInconsistencyTable && this._checkInconsistencyTable.length > 0) {
            this.reportError(this.getText("SysCtx_InvDetails"));
            return;
        }

        // check location
        var sPath = oView.getBindingContext().getPath();
        var sLocationId = oModel.getProperty(sPath + "/LocationId");
        if (!this.oCommonFunctions.isHex(sLocationId)) {
            sLocationId = this.oCommonFunctions.base64ToHex(sLocationId);
            oModel.setProperty(sPath + "/LocationId", sLocationId);
        }

        oModel.submitChanges(function(oResponse) {
            that.reportSuccess(that.getText("SysCtx_SaveSuc", that.Id + " / " + that.Type));
            that.getView().getModel().refresh(true);
        }, function(oError) {
            var message;
            try {
                message = JSON.parse(oError.response.body).error.message.value;
            } catch (error) {
                message = oError.response.body;
            }
            that.reportError(message);
        });
    },

    onChangeSystemDetailsCombo : function(oEvent) {
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
                    oModel.setProperty(sPath + "/Location", aLocations[key].Location);
                    oModel.setProperty(sPath + "/LocationId", aLocations[key].Id);
                    idx = that._checkInconsistencyTable.indexOf(oInput.getId());
                    that._checkInconsistencyTable.splice(idx, 1);
                    oInput.setValueState(sap.ui.core.ValueState.None);
                }
            });
        } else {
            oModel.setProperty(sPath + "/Location", null);
            oModel.setProperty(sPath + "/LocationId", null);
        }
    },

    onChangeSystemGroup : function(oEvent) {
        var oModel = this.getView().getModel();
        var oCombo = oEvent.getSource();
        var sSystemGroup = oCombo.getSelectedKey();
        var sSystemGroupValue = oCombo.getValue();
        var sPath = this.getView().getBindingContext().getPath();
        oCombo.setValueState(sap.ui.core.ValueState.None);
        // cache inconsistent UI controls in oder to easily check when saving changes
        if (!this._checkInconsistencyTable) {
            this._checkInconsistencyTable = [];
        }
        var idx = this._checkInconsistencyTable.indexOf(oCombo.getId());
        if (idx !== -1) {
            this._checkInconsistencyTable.splice(idx, 1);
        }
        if (sSystemGroup !== "") {
            var rs = sSystemGroup.split(' / ');
            oModel.setProperty(sPath + "/MainSystemId", rs[0]);
            oModel.setProperty(sPath + "/MainSystemType", rs[1]);
        } else if (sSystemGroupValue !== "") {
            oCombo.setValueState(sap.ui.core.ValueState.Error);
            this._checkInconsistencyTable.push(oCombo.getId());
        } else {
            oModel.setProperty(sPath + "/MainSystemId", null);
            oModel.setProperty(sPath + "/MainSystemType", null);
        }
    },

    onShowLocationsValueHelp : function(oEvent) {
        this.getLocationsValueHelp().open();
    },

    getLocationsValueHelp : function() {
        if (!this.oLocationsValueHelpDialog) {
            this.oLocationsValueHelpDialog = sap.ui.xmlfragment("SystemLocationsValueHelp", "sap.secmon.ui.locations.LocationsValueHelp", this);
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
            oModel.setProperty(sPath + "/Location", oSelectedData.Location);
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

    getText : function(sTextKey, aValues) {
        return oTextBundle.getText(sTextKey, aValues);
    },

    reportWarning : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Warning, sText, sText);
    },

    reportError : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sText);
    },

    reportSuccess : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, sText);
    }
});
