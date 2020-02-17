/* globals oTextBundle, Promise */
$.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.commons.AjaxUtil");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.ui.core.util.Export");
jQuery.sap.require("sap.ui.core.util.ExportTypeCSV");
jQuery.sap.require("sap.secmon.ui.subnets.util.Formatter");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/FilterBarWithSameSizedItems.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.subnets.Main", {

    oRouter : null,
    fnAutoRefresh : undefined,
    CREATE_SUBNET_MODEL : "createSubnetModel",
    ROUTES : {
        MAIN : "main",
        hasRoute : function(sRoute) {
            for ( var prop in this) {
                if (this[prop] === sRoute) {
                    return true;
                }
            }
            return false;
        }
    },
    FILTERSANDSORTERS : {
        NETADDRESS : "NetAddressString",
        PREFIX : "PrefixString",
        DESCRIPTION : "Description",
        CATEGORY : "Category",
        LOCATION_NAME : "LocationName",
        ORDER_BY : "OrderBy",
        ORDER_DESC : "OrderDesc",
        isSupported : function(sFilter) {
            for ( var prop in this) {
                if (this[prop] === sFilter) {
                    return true;
                }
            }
            return false;
        }
    },

    onInit : function() {
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);
        this.initModels();
        this.getView().getModel().attachRequestCompleted(this._setCount, this);
    },

    initModels : function() {
        // Main model
        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/services/ui/subnets/Subnets.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }));
        // Model for filters and sorters
        this.getView().setModel(new sap.ui.model.json.JSONModel(), 'ModelFiltersAndSorters');
        // Model for locations
        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/services/ui/locations/Locations.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }), "ModelLocations");
        // UI model
        this.getView().setModel(new sap.ui.model.json.JSONModel({
            itemSelected : false,
            scrollHeight : $(window).height() - 286 + "px",
            filterText : "",
            csvWithHeader : true,
            lineForImportSelected : false
        }), "UI");

        this.getView().setModel(new sap.ui.model.json.JSONModel({
            NetAddressString: "",
            PrefixString: "",
            Description: "",
            FileName: ""
        }), this.CREATE_SUBNET_MODEL);
        

    },
    handleRouteMatched : function(oEvent) {
        var routeName = oEvent.getParameter("name");
        this.setRouteName(routeName);
        if (!this.ROUTES.hasRoute(routeName)) {
            return;
        }
        var oArguments = oEvent.getParameter("arguments");
        var params = oArguments["?query"] || {};
        var that = this;
        // direct call without parameters
        if (Object.keys(params).length === 0) {
            // set default parameters depending on view type
            var oNewQueryParams = {};
            oNewQueryParams.OrderDesc = true;
            oNewQueryParams.OrderBy = "NetAddressString";
            // store the parameters in the URL and navigate to this URL
            // this leads to a call of "onRouteMatched" again but next time
            // with parameters
            that.navTo(that.getRouteName(), {
                query : oNewQueryParams
            }, true);
        } else {
            // sorter and filter
            var oData = {};
            Object.keys(this.FILTERSANDSORTERS).map(function(key) {
                if (key !== 'isSupported') {
                    oData[that.FILTERSANDSORTERS[key]] = (params[that.FILTERSANDSORTERS[key]] === undefined ? null : decodeURIComponent(params[that.FILTERSANDSORTERS[key]]));
                }
            });
            // set data of model FilterAndSorterValues to update UI
            this.getView().getModel("ModelFiltersAndSorters").setData(oData);
            // show filter
            this.getView().getModel("UI").setProperty("/filterText", this.getFilterText());
            this.refreshData();
        }
    },

    navTo : function(sRouteName, oParameters, bNoEntryInBrowserHistory) {
        // Check for special characters. This check is useful because event
        // handler onRouteMatched is re-entrant,
        // it calls itself with different parameters. However, this mechanism
        // does not work in case of an invalid URL parameter. The router logs an
        // error to the console and does not dispatch to the event handler.
        function assertNoSpecialCharsInParamValue(sParamName, sParamValue) {
            if (!sParamValue || !sParamValue.indexOf) {
                return;
            }
            var aSpecialChars = [ ';', '/', '?', ':', '@', '&', '=', '+', '$', ' ', '\n', '\r', '\t', '\b', '\f' ];
            for (var i = 0; i < aSpecialChars.length; i++) {
                var sSpecialChar = aSpecialChars[i];
                jQuery.sap.assert((sParamValue.indexOf(sSpecialChar) < 0), "URL parameter invalid: Parameter '" + sParamName + "' contains special character '" + sSpecialChar + "' in value '" +
                        sParamValue + "'.");
            }
        }
        if (oParameters.query) {
            var oQuery = oParameters.query;
            for ( var attrName in oQuery) {
                if (Array.isArray(oQuery[attrName])) {
                    for (var index = 0; index < oQuery[attrName].length; index++) {
                        assertNoSpecialCharsInParamValue(attrName, oQuery[attrName][index]);
                    }
                } else {
                    assertNoSpecialCharsInParamValue(attrName, oQuery[attrName]);
                }
            }
        }
        this.getRouter().navTo(sRouteName, oParameters, bNoEntryInBrowserHistory);
    },

    /**
     * Do a navigation and add URL parameters from date time control and view settings.
     * 
     * @param sRouteName
     *            the route name as configured in components.js
     */
    navToWithAggregatedParameters : function(sRouteName) {
        var oNewQueryParameters = {};
        // get Filters via Model
        var oModel = this.getView().getModel("ModelFiltersAndSorters");
        var oModelData = oModel.getData();
        Object.keys(oModelData).map(function(key) {
            if (oModelData[key]) {
                oNewQueryParameters[key] = encodeURIComponent(oModelData[key]);
            }
        });

        // The router has a "feature" not to dispatch to event handlers if
        // neither route nor query parameters have changed.
        // In order to force navigation, we add a parameter with new value each
        // time.
        oNewQueryParameters.lastNav = this.getComponent().oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

        this.navTo(sRouteName, {
            query : oNewQueryParameters
        }, false);
    },

    setRouteName : function(sRouteName) {
        this.routeName = sRouteName;
    },

    getRouteName : function() {
        return this.routeName;
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
            var sLaunchpadUrl = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl();
            document.location.href = sLaunchpadUrl;
        });
    },

    _setCount : function() {
        var oList = this.getSubnetTable();
        var count = oList.getBinding("items").getLength();
        this.getView().byId("page").setTitle(this.getView().getModel("i18n").getProperty("Subnets_Header") + " (" + count + ")");
    },

    getFilterText : function() {
        var that = this;
        var sFilterText;
        var oModel = this.getView().getModel("ModelFiltersAndSorters");
        var oModelData = oModel.getData();
        Object.keys(oModelData).map(function(key) {
            var sText = "";
            if (oModelData[key]) {
                switch (key) {
                case "NetAddressString":
                    sText = oTextBundle.getText("Subnets_NetAddress") + ' like ' + oModelData[key];
                    break;
                case "PrefixString":
                    sText = oTextBundle.getText("Subnets_Prefix") + ' like ' + oModelData[key];
                    break;
                case "Description":
                    sText = oTextBundle.getText("Subnets_Description") + ' like ' + oModelData[key];
                    break;
                case "Category":
                    sText = oTextBundle.getText("Subnets_Category") + ' like ' + oModelData[key];
                    break;
                case "LocationName":
                    sText = oTextBundle.getText("Subnets_Location") + ' like ' + oModelData[key];
                    break;
                }
            }
            if (sText) {
                if (sFilterText) {
                    sFilterText = sFilterText + "; " + sText;
                } else {
                    sFilterText = that.getText("Subnets_FilterBarPrefix") + sText;
                }
            }
        });
        return sFilterText;
    },

    getSubnetTableFixed : function() {
        this.oSubnetTableFixed = this.oSubnetTableFixed || this.getView().byId("subnetTableHeader");
        return this.oSubnetTableFixed;
    },

    getSubnetTable : function() {
        this.oSubnetsTable = this.oSubnetsTable || this.getView().byId("table");
        return this.oSubnetsTable;
    },

    handleSort : function(oEvent) {
        var oTable = this.getSubnetTable();
        var oHeader = this.getSubnetTableFixed();
        var oParameters = oEvent.getParameters();
        var oSortedColumn = oParameters.column;
        var sortOrder = oParameters.sortOrder;
        var oBinding = oTable.getBinding("items");

        var sSortProperty = oSortedColumn.getSortProperty();
        var bSortDesc = (sortOrder === sap.secmon.ui.m.commons.controls.SortOrder.Descending);

        oHeader.getColumns().forEach(function(oColumn) {
            if (oColumn !== oSortedColumn) {
                if (oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn) {
                    oColumn.setSorted(false);
                }
            }
        });
        oSortedColumn.setSorted(true);
        oSortedColumn.setSortOrder(sortOrder);

        var oSorter = new sap.ui.model.Sorter(sSortProperty, bSortDesc);
        oBinding.sort(oSorter);

        // for some reasons this is needed to prevent the table from scrolling
        // down a bit
        var page = this.byId("page");
        page.scrollTo(0, 1);
    },

    onClear : function(oEvent) {
        var oFilterBar = this.getView().byId("filterBar");
        var oItems = oFilterBar.getAllFilterItems(true);
        for (var i = 0; i < oItems.length; i++) {
            var oControl = oFilterBar.determineControlByFilterItem(oItems[i]);
            if (oControl) {
                oControl.setValue("");
            }
        }
    },

    onSearch : function(oEvent) {
        this.navToWithAggregatedParameters(this.getRouteName());
    },

    refreshData : function() {
        var aFilters = [], sPath, sOperator;
        var oBinding = this.getSubnetTable().getBinding("items");
        var oFiltersAndSortersModel = this.getView().getModel("ModelFiltersAndSorters");
        var oFiltersAndSortersData = oFiltersAndSortersModel.getData();
        Object.keys(oFiltersAndSortersData).map(function(key) {
            switch (key) {
            case 'OrderBy':
                sPath = null;
                break;
            case 'OrderDesc':
                sPath = null;
                break;
            default:
                sPath = key;
                sOperator = sap.ui.model.FilterOperator.Contains;
                break;
            }
            if (oFiltersAndSortersData[key]) {
                if (oFiltersAndSortersData[key] !== "" && sPath !== null) {
                    var oFilter = new sap.ui.model.Filter(sPath, sOperator, oFiltersAndSortersData[key], null);
                    aFilters.push(oFilter);
                }
            }
        });
        oBinding.filter(aFilters);
    },

    onItemPress : function(oEvent) {
        var component = this.getComponent();
        var bSubnetWrite = this.getView().getModel("applicationContext").getProperty("/userPrivileges/subnetWrite");
        if (bSubnetWrite) {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("Detail", {
                "Id" : component.oCommons.base64ToHex(oEvent.getParameter("listItem").getBindingContext().getProperty("Id"))
            });
        } else {
            sap.m.MessageBox.show(oTextBundle.getText("PrivilegesErrorMessage"), sap.m.MessageBox.Icon.ERROR, "Error");
        }
    },

    onSelectionChange : function(oEvent) {
        this.getView().getModel("UI").setProperty("/itemSelected", (this.getSubnetTable().getSelectedItems().length > 0));
    },

    onShowLocationValueHelpAsFilter : function(oEvent) {
        this.getLocationValueHelpAsFilter().open();
    },

    getLocationValueHelpAsFilter : function() {
        if (!this.oLocationValueHelpAsFilterDialog) {
            this.oLocationValueHelpAsFilterDialog = sap.ui.xmlfragment("LocationAsFilterValueHelp", "sap.secmon.ui.locations.LocationsValueHelp", this);
            this.oLocationValueHelpAsFilterDialog.setModel(this.getView().getModel("ModelLocations"));
            this.getView().addDependent(this.oLocationValueHelpAsFilterDialog);
            if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
                this.oLocationValueHelpAsFilterDialog.addStyleClass("sapUiSizeCompact");
            }
        }
        return this.oLocationValueHelpAsFilterDialog;
    },

    onConfirmSelectLocationsDialog : function(oEvent) {
        if (oEvent.getId() === "confirm") {
            var oSelectedData = oEvent.getParameter("selectedContexts")[0].getModel().getProperty(oEvent.getParameter("selectedContexts")[0].getPath());
            var oModel = this.getView().getModel("ModelFiltersAndSorters");
            oModel.setProperty("/LocationName", oSelectedData.Location);
        }
        // reset filter
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([]);
    },

    getCreateDialog : function() {

        if (!this.oCreateDialog) {
            var oModel = this.getView().getModel(this.CREATE_SUBNET_MODEL);

            this.oCreateDialog = sap.ui.xmlfragment("CreateSubnetDialog", "sap.secmon.ui.subnets.CreateDialog", this);
            this.oCreateDialog.setModel(oModel);
            this.getView().addDependent(this.oCreateDialog);
            if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
                this.oCreateDialog.addStyleClass("sapUiSizeCompact");
            }
        }
        return this.oCreateDialog;
    },

    onCloseCreateSubnetDialog: function (oEvent) {
        if (!oEvent.getParameter("id").endsWith("Ok")) {
            this._closeAndClearSubnetDialog();
            return;
        }

        if (!this._checkValidData()) {
            return;
        }

        this._createSubnet();
    },

    _closeAndClearSubnetDialog: function () {
        this.getCreateDialog().close();
        this._clearSubnetModel();
    },

    _createSubnet: function () {
        var that = this;
        var oModel = this.oCreateDialog.getModel();
        var sNetAddress = oModel.getProperty("/NetAddressString").trim();
        var sPrefix = oModel.getProperty("/PrefixString").trim();
        var sDescription = oModel.getProperty("/Description");

        this.getView().getModel().create("/Subnets", {
            Id: "0000000000000000",
            NetAddressString: sNetAddress,
            PrefixString: sPrefix,
            Description: sDescription
        }, {
            success: function (oResponse) {
                that.reportSuccess(oTextBundle.getText("Subnets_CreateSuc", sNetAddress));
                that._closeAndClearSubnetDialog();
                that._navToDetailPage(oResponse.Id);
            },
            error: function (oError) {
                var sErrorText = that._getErrorMessage(oError);
                that.reportError(oTextBundle.getText("Subnets_CreateErr", [sNetAddress, sErrorText]));
            }
        });
    },

    _navToDetailPage: function (sId) {

        var oCommonFunctions = this.getComponent().oCommons;
        var oQuery = {
            "Id": oCommonFunctions.base64ToHex(sId)
        };
        this.navTo("Detail", oQuery);
    },

    _getErrorMessage: function (oError) {
        try {
            var aErrorMatch = oError.response.body.match(/Error:[ ]([\w\W^(]+)[ ]\(line/);
            return aErrorMatch ? aErrorMatch[1] : null;
        } catch (ex) {
            return "Invalid Server Response: " + oError.response.body;
        }
    },

    _clearSubnetModel: function () {

        var oData = {
            NetAddressString: "",
            PrefixString: "",
            Description: "",
            FileName: ""
        };
        this.getView().getModel(this.CREATE_SUBNET_MODEL).setData(oData);
    },

    _checkValidData : function() {
        var bDataIsValid = true;

        // We can use it in the near future
        // var sRegForIPv6 =
        // /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))|(^\s*((?=.{1,255}$)(?=.*[A-Za-z].*)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*)\s*$)/;

        var sRegForIPv4 = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        var oModel = this.oCreateDialog.getModel();
        this._setDefaulValueState(oModel);
        var sNetAddress = oModel.getProperty("/NetAddressString").trim();
        var sPrefix = oModel.getProperty("/PrefixString").trim();
        if ((!sRegForIPv4.test(sNetAddress)) || !sNetAddress) {
            oModel.setProperty("/invalidNetAddress", "Error");
            bDataIsValid = false;
        }
        if ((!sRegForIPv4.test(sPrefix)) || !sPrefix) {
            oModel.setProperty("/invalidPrefix", "Error");
            bDataIsValid = false;
        }
        return bDataIsValid;
    },

    _setDefaulValueState : function(oModel) {
        oModel.setProperty("/invalidNetAddress", "None");
        oModel.setProperty("/invalidPrefix", "None");
    },

    _getUploadDialog : function() {
        if (!this._oUploadDialog) {
            var oModel = new sap.ui.model.json.JSONModel({
                NetAddressString : "",
                PrefixString : "",
                Description : "",
                FileName : ""
            });

            this._oUploadDialog = sap.ui.xmlfragment("UploadSubnetDialog", "sap.secmon.ui.subnets.UploadDialog", this);
            this._oUploadDialog.setModel(oModel);
            this.getView().addDependent(this._oUploadDialog);
            if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
                this._oUploadDialog.addStyleClass("sapUiSizeCompact");
            }
        }
        return this._oUploadDialog;
    },

    onDialogUploadCancel : function(oEvent) {
        this._oUploadDialog.destroy();
        delete this._oUploadDialog;
    },

    onDialogUploadOk : function(oEvent) {
        var oFileUploader = sap.ui.core.Fragment.byId("UploadSubnetDialog", "subnetsFileUploader");
        if (oFileUploader.getValue() === "") {
            oFileUploader.focus();
            oFileUploader.setValueState(sap.ui.core.ValueState.Error);
            this.reportError(oTextBundle.getText("Subnets_EnterAllFields"));
            return;
        } else {
            // Upload the file
            var sToken = new sap.secmon.ui.commons.AjaxUtil().getXCSRFToken("/sap/secmon/services/ui/commons/dummyService.xsjs").getResponseHeader('X-CSRF-Token');
            oFileUploader.insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                name : "X-CSRF-Token",
                value : sToken
            }));
            this._oUploadDialog.setBusy(true);
            oFileUploader.upload();
        }
    },

    _displayUploadErrorsDialog : function(mErrorDetails) {
        return new Promise(function(fnResolve /* , fnReject */) {
            var that = this;
            var oErrorModel = new sap.ui.model.json.JSONModel(mErrorDetails);
            var oDialog = sap.ui.xmlfragment("UploadErrorDialog", "sap.secmon.ui.subnets.UploadErrorDialog", this);
            oDialog.setModel(oErrorModel);
            this.getView().addDependent(oDialog);

            oDialog.attachAfterClose(function() {
                oDialog.destroy();
                oErrorModel.destroy();
            });

            oDialog.addButton(new sap.m.Button({
                text : oTextBundle.getText("Subnets_ImportButtonText"),
                enabled : "{UI>/lineForImportSelected}",
                press : function() {
                    oDialog.close();
                    var oUIModel = that.getView().getModel("UI");
                    oUIModel.setProperty("/lineForImportSelected", false);
                    var aOverwriteLines = [];
                    oErrorModel.getProperty("/lines").forEach(function(mLine, i) {
                        if (mLine.overwrite) {
                            aOverwriteLines.push(i);
                        }
                    });
                    fnResolve({
                        bUploadIgnoringErrors : true,
                        aOverwriteLines : aOverwriteLines
                    });
                }
            }));
            oDialog.addButton(new sap.m.Button({
                text : oTextBundle.getText("Subnets_CancelButtonText"),
                press : function() {
                    oDialog.close();
                    fnResolve({
                        bUploadIgnoringErrors : false,
                        aOverwriteLines : []
                    });
                }
            }));
            this.getView().addDependent(oDialog);
            oDialog.open();
        }.bind(this));
    },

    onImportSelectionChanged : function(oEvent) {
        var oUIModel = this.getView().getModel("UI");
        var oData = oEvent.getSource().getBindingContext().getModel().getData();
        var oSelectedLine = oData.lines.find(function(oLine){
            return oLine.overwrite;
        });
        if (oSelectedLine) {
            oUIModel.setProperty("/lineForImportSelected", true);
            return;
        }
        oUIModel.setProperty("/lineForImportSelected", false);
    },

    onUploadComplete : function(oEvent) {
        var oFileUploader = oEvent.getSource();
        var sResponse = oEvent.getParameter("responseRaw");
        if (oEvent.getParameter("status") === 200) {
            var oResponse = JSON.parse(sResponse);
            if (oResponse.status === "Ok") {
                this.reportSuccess(oTextBundle.getText("Subnets_UploadSuc"));
                this.getView().getModel().refresh();
                this._oUploadDialog.destroy();
                delete this._ignoreErrorsHeader;
                delete this._oUploadDialog;
                return;
            }
            if (oResponse.sCode === "ERRORS_FOUND") {
                this._displayUploadErrorsDialog(oResponse.mDetails).then(function(mUpload) {
                    if (mUpload.bUploadIgnoringErrors) {
                        if (!this._ignoreErrorsHeader) {
                            // Makes sure only one header value is sent even if added repeatedly
                            this._ignoreErrorsHeader = new sap.ui.unified.FileUploaderParameter({
                                name : "X-Ignore-Errors",
                                value : "true"
                            });
                        }
                        oFileUploader.addHeaderParameter(this._ignoreErrorsHeader);
                        oFileUploader.setAdditionalData(mUpload.aOverwriteLines.join(","));
                        this._oUploadDialog.setBusy(true);
                        oFileUploader.upload();
                    } else {
                        this._oUploadDialog.destroy();
                        delete this._ignoreErrorsHeader;
                        delete this._oUploadDialog;
                    }
                }.bind(this));
                return;
            }                        
        }
        this.reportError(decodeURIComponent(sResponse));
        this._oUploadDialog.destroy();
        delete this._ignoreErrorsHeader;
        delete this._oUploadDialog;
    },

    onShowDiff : function(oEvent) {
        var oSource = oEvent.getSource();
        var oContext = oSource.getBindingContext();

        var oTable = sap.ui.xmlfragment("UploadDiffTable", "sap.secmon.ui.subnets.UploadDiffTable", this);
        oTable.setModel(oSource.getModel("i18n"), "i18n");
        oTable.setModel(oContext.getModel());
        oTable.bindElement(oContext.getPath());

        var oPopover = new sap.m.Popover({
            title : "Diff",
            content : [ oTable ],
            placement : sap.m.PlacementType.Left,
            afterClose : function() {
                oPopover.destroy();
            }
        });
        oPopover.addStyleClass("sapUiSizeCompact");

        oPopover.openBy(oSource);
    },

    onUploadHelp: function(oEvent) {
        var oSource = oEvent.getSource();

        var oText = new sap.m.Text({
            text: oTextBundle.getText("Subnets_HelpFileUpload"),
        });
        oText.addStyleClass("sapUiSmallMargin");

        var oPopover = new sap.m.Popover({
            title : oTextBundle.getText("Subnets_HelpFileUploadTitle"),
            content : [ oText ],
            contentWidth: "400px",
            placement : sap.m.PlacementType.Left,
            afterClose : function() {
                oPopover.destroy();
            }
        });
        // oPopover.addStyleClass("sapUiSizeCompact");

        oPopover.openBy(oSource);
    },

    onExportCSV: function() {
        var sExportFileName = "subnet-export";

        // Export Colums must be the same as the import columns in the back-end as well as the list in i18n>Subnets_HelpFileUpload
        var aColumns = [
            "NetAddressString",
            "PrefixString",
            "Description",
            "Category",
            "TechnicalContactName",
            "TechnicalContactTelefon",
            "TechnicalContactEMail",
            "Confidentiality",
            "IntegritySystem",
            "IntegrityData",
            "Availability"
        ];

        var aExportColumns = aColumns.map(function(sColumnName) {
            return new sap.ui.core.util.ExportColumn({
                name: sColumnName,
                template: new sap.ui.core.util.ExportCell({
                    content: { path: sColumnName }
                })
            });
        });


        var oTable = this.byId("table");

        var aKeptKeys = ["parameters", "path"];
        var oRowBindingInfo = jQuery.extend({}, oTable.getBindingInfo("items"));
        Object.keys(oRowBindingInfo).forEach(function(sKey) {
            if (aKeptKeys.indexOf(sKey) < 0) {
                delete oRowBindingInfo[sKey];
            }
        });

        var oModel = oTable.getBinding("items").getModel();

        // Allow exporting more rows
        oRowBindingInfo.length = 99999999; // Not honored in Export class in 1.38
        oModel.setSizeLimit(99999999);

        var oExport = new sap.ui.core.util.Export({
            exportType: new sap.ui.core.util.ExportTypeCSV({
                separatorChar: ";"
            }),
            exportFilename: sExportFileName,
            models: {
                undefined: oModel
            },
            rows: oRowBindingInfo,
            columns: aExportColumns
        });

        oTable.setBusy(true);

        // download exported file
        oExport.generate().then(function(vData) {
            if (typeof vData === "string") {
                return oExport.saveFile(sExportFileName);
            } else {
                /* global saveAs */
                saveAs(vData, sExportFileName + "." + oExport.getExportType().getFileExtension());
                return true;
            }
        }).catch(function(oError) {
            sap.m.MessageBox.error(oTextBundle.getText("Subnets_BrowserNotSupported") + "\n\n" + oError);
        }).then(function() {
            oTable.setBusy(false);
            oModel.setSizeLimit(100);
            oExport.destroy();
        }.bind(this));
    },

    onTypeMissmatch : function(oEvent) {
        this.reportError(oTextBundle.getText("Subnets_FileTypeWrong"));
    },

    onPressUploadSubnets : function(oEvent) {
        this._getUploadDialog().open();
    },

    onPressCreateSubnet : function(oEvent) {
        this.getCreateDialog().open();
    },

    onPressDeleteSubnet : function(oEvent) {
        var that = this;
        var oCommonFunctions = this.getComponent().oCommons;
        var aSelectedItems = this.getSubnetTable().getSelectedItems();
        if (aSelectedItems.length === 0) {
            this.reportError(this.getText("Subnets_NotSel"));
            return;
        }
        var oTable = this.getSubnetTable();
        var oModel = this.getView().getModel();
        var oView = this.getView();

        var fnDelete = function(action) {
            if (action === sap.m.MessageBox.Action.DELETE) {
                // Delete subnets identified by path
                $.each(aSelectedItems, function(index, element) {
                    oView.setBusy(true);
                    var sSubnet = element.getBindingContext().getProperty("NetAddressString");
                    var sId = element.getBindingContext().getProperty("Id");
                    oModel.remove(element.getBindingContext().getPath(), {
                        success : function(oData, oResponse) {
                            var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/replication/export.xsjs", JSON.stringify({
                                "ObjectType" : "SubNet",
                                "Id" : oCommonFunctions.base64ToHex(sId),
                                "ObjectName" : sSubnet,
                                "ObjectNamespace" : "Subnet",
                                "Operation" : "Delete"
                            }));
                            promise.fail(function(jqXHR, textStatus, errorThrown) {
                                that.reportError(that.getText("Subnets_ReplErr", [ sSubnet, jqXHR.responseText ]));
                            });
                            promise.done(function(data, textStatus, jqXHR) {
                            });
                            oView.setBusy(false);
                        },
                        error : function(oError) {
                            var sErrorText;
                            try {
                                var mError = JSON.parse(oError.response.body);
                                sErrorText = mError.error.message.value;
                            } catch (ex) {
                                sErrorText = "Invalid Server Response: " + oError.response.body;
                            }

                            that.reportError(oTextBundle.getText("Subnets_DelErr", [ sSubnet, sErrorText ]));

                            oView.setBusy(false);
                        },
                        async : false
                    });
                });
                that.getView().getModel("UI").setProperty("/itemSelected", false);
                oTable.removeSelections(true);
                that.reportSuccess(oTextBundle.getText("Subnets_DelSuc"));
                oModel.refresh();
            }
        };

        sap.m.MessageBox.show(this.getText("Subnets_DelReally"), {
            icon : sap.m.MessageBox.Icon.WARNING,
            title : oTextBundle.getText("Subnets_Delete"),
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : fnDelete
        });

    },

    onPressDeleteSubnetAll : function(oEvent) {
        var that = this;
        var oTable = this.getSubnetTable();
        var oModel = this.getView().getModel();
        var oView = this.getView();

        var fnDelete = function(action) {
            if (action === sap.m.MessageBox.Action.DELETE) {
                oTable.removeSelections(true);
                oView.setBusy(true);
                var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/iphandler/subnetsFileUpload.xsjs?command=deleteAllSubnets", JSON.stringify({}));
                promise.fail(function(jqXHR, textStatus, errorThrown) {
                    that.reportError(that.getText("Subnets_DelAllErr", [ jqXHR.responseText ]));
                    oModel.refresh();
                    oView.setBusy(false);
                });
                promise.done(function(data, textStatus, jqXHR) {
                    that.reportSuccess(oTextBundle.getText("Subnets_DelSucAll"));
                    oModel.refresh();
                    oView.setBusy(false);
                });
            }
        };

        sap.m.MessageBox.show(this.getText("Subnets_DelReally"), {
            icon : sap.m.MessageBox.Icon.WARNING,
            title : oTextBundle.getText("Subnets_DelSubnetAll"),
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : fnDelete
        });
    },

    /**
     * Exports the selected sub nets
     * 
     * @param oEvent
     */
    onPressExport : function(oEvent) {
        var that = this;
        var oCommonFunctions = this.getComponent().oCommons;
        var aSelectedItems = this.getSubnetTable().getSelectedItems();
        if (aSelectedItems.length === 0) {
            this.reportError(this.getText("Subnets_NotSel"));
            return;
        }
        $.each(aSelectedItems, function(index, element) {
            var sSubnet = element.getBindingContext().getProperty("NetAddressString");
            var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/replication/export.xsjs", JSON.stringify({
                "ObjectType" : "SubNet",
                "Id" : oCommonFunctions.base64ToHex(element.getBindingContext().getProperty("Id")),
                "ObjectName" : sSubnet,
                "ObjectNamespace" : "Subnet",
                "Operation" : "Upsert"
            }));
            promise.fail(function(jqXHR, textStatus, errorThrown) {
                that.reportError(that.getText("Subnets_ReplErr", [ sSubnet, jqXHR.responseText ]));
            });
            promise.done(function(data, textStatus, jqXHR) {
                that.reportSuccess(that.getText("Subnets_ReplSuc", [ sSubnet ]));
            });
        });

    },

    onAfterRendering : function() {
        // modify selectAll-behaviour of table => event onSelectionChange is not raised for header table as there are no rows available
        if (!this.tableFixedUpdated) {
            var oTable = this.getSubnetTable();
            var oTableFixed = this.getSubnetTableFixed();

            oTableFixed.updateSelectAllCheckbox = function() {
                // checks if the list is in multi select mode and has selectAll
                // checkbox
                if (oTableFixed._selectAllCheckBox && this.getMode() === "MultiSelect") {
                    var aItems = oTable.getItems(), iSelectedItemCount = oTable.getSelectedItems().length, iSelectableItemCount = aItems.filter(function(oItem) {
                        return oItem.isSelectable();
                    }).length;
                    // set state of the checkbox by comparing item length and
                    // selected item length
                    oTableFixed._selectAllCheckBox.setSelected(aItems.length > 0 && iSelectedItemCount === iSelectableItemCount);
                }
            };
            var origFnOnItemSelectedChange = oTable.onItemSelectedChange;
            oTable.onItemSelectedChange = function() {
                origFnOnItemSelectedChange.apply(this, arguments);
                jQuery.sap.delayedCall(0, this, function() {
                    oTableFixed.updateSelectAllCheckbox();
                });
            };
            oTableFixed.selectAll = function() {
                oTable.selectAll.apply(oTable, arguments);
            };
            oTableFixed.removeSelections = function() {
                oTable.removeSelections.apply(oTable, arguments);
            };
            this.tableFixedUpdated = true;
        }
    }
});