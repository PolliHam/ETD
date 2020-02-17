/* globals oTextBundle, oCommonFunctions */
$.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.commons.AjaxUtil");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/FilterBarWithSameSizedItems.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.locations.Main", {

    oRouter : null,
    fnAutoRefresh : undefined,
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
        LOCATION : "Location",
        DESCRIPTION : "Description",
        TYPE_VALUE : "TypeValue",
        PARENT_LOCATION_NAME : "ParentLocationName",
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
        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/services/ui/locations/Locations.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }));
        // Model for filters and sorters
        this.getView().setModel(new sap.ui.model.json.JSONModel(), 'ModelFiltersAndSorters');
        // Model for enum
        var oModelGenericEnum = new sap.ui.model.odata.ODataModel('/sap/secmon/services/genericEnum.xsodata', {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.getView().setModel(oModelGenericEnum, "Enum");
        // Model for parent location
        var oModelParentLocation = new sap.ui.model.odata.ODataModel("/sap/secmon/services/ui/locations/Locations.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.getView().setModel(oModelParentLocation, "ModelParentLocation");
        // Model for new location
        this.getView().setModel(new sap.ui.model.json.JSONModel({
            Location : "",
            Description : "",
            Type : "",
            TypeKey : "",
            ParentLocation : "",
            ParentLocationName : ""
        }), 'NewLocation');
        // UI model
        this.getView().setModel(new sap.ui.model.json.JSONModel({
            itemSelected : false,
            scrollHeight : $(window).height() - 286 + "px",
            filterText : ""
        }), "UI");
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
            oNewQueryParams.OrderBy = "Location";
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
        oNewQueryParameters.lastNav = oCommonFunctions.formatDateToYyyymmddhhmmssUTC(new Date());

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
        var oList = this.getLocationsTable();
        var count = oList.getBinding("items").getLength();
        this.getView().byId("page").setTitle(this.getView().getModel("i18n").getProperty("Locations_Header") + " (" + count + ")");
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
                case "Location":
                    sText = oTextBundle.getText("Locations_Location") + ' like ' + oModelData[key];
                    break;
                case "Description":
                    sText = oTextBundle.getText("Locations_Description") + ' like ' + oModelData[key];
                    break;
                case "TypeValue":
                    sText = oTextBundle.getText("Locations_Type") + ' = ' + oModelData[key];
                    break;
                case "ParentLocationName":
                    sText = oTextBundle.getText("Locations_ParentLocation") + ' = ' + oModelData[key];
                    break;
                }
            }
            if (sText) {
                if (sFilterText) {
                    sFilterText = sFilterText + "; " + sText;
                } else {
                    sFilterText = that.getText("SysCtx_FilterBarPrefix") + sText;
                }
            }
        });
        return sFilterText;
    },

    getLocationsTableFixed : function() {
        this.oLocationsTableFixed = this.oLocationsTableFixed || this.getView().byId("locationsTableHeader");
        return this.oLocationsTableFixed;
    },

    getLocationsTable : function() {
        this.oLocationsTable = this.oLocationsTable || this.getView().byId("table");
        return this.oLocationsTable;
    },

    handleSort : function(oEvent) {
        var oTable = this.getLocationsTable();
        var oHeader = this.getLocationsTableFixed();
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
        var oBinding = this.getLocationsTable().getBinding("items");
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
            case 'TypeValue':
                sPath = key;
                sOperator = sap.ui.model.FilterOperator.EQ;
                break;
            case 'ParentLocationName':
                sPath = key;
                sOperator = sap.ui.model.FilterOperator.EQ;
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
        // refresh data of model ModelParentLocation
        var oModel = this.getView().getModel("ModelParentLocation");
        oModel.refresh(true, true);
    },

    onItemPress : function(oEvent) {
        var bLocationWrite = this.getView().getModel("applicationContext").getProperty("/userPrivileges/locationWrite");
        if (bLocationWrite) {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("Detail", {
                "Id" : oCommonFunctions.base64ToHex(oEvent.getParameter("listItem").getBindingContext().getProperty("Id"))
            });
        } else {
            sap.m.MessageBox.show(oTextBundle.getText("PrivilegesErrorMessage"), sap.m.MessageBox.Icon.ERROR, "Error");
        }
    },

    onSelectionChange : function(oEvent) {
        this.getView().getModel("UI").setProperty("/itemSelected", (this.getLocationsTable().getSelectedItems().length > 0));
    },

    onChangeNewLocationType : function(oEvent) {
        var oModel = this.getView().getModel("NewLocation");
        var oCombo = oEvent.getSource();
        // Location type must be valid
        if (oCombo.getSelectedKey() === "" && oCombo.getValue() !== "") {
            oCombo.focus();
            oCombo.setValueState(sap.ui.core.ValueState.Error);
            oModel.setProperty("/TypeKey", "");
        } else {
            oCombo.setValueState(sap.ui.core.ValueState.None);
            oModel.setProperty("/TypeKey", oCombo.getSelectedKey());
        }
    },

    getCreateDialog : function() {
        if (!this.oCreateDialog) {
            this.oCreateDialog = sap.ui.xmlfragment("CreateLocationDialog", "sap.secmon.ui.locations.CreateDialog", this);
            this.getView().addDependent(this.oCreateDialog);
            if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
                this.oCreateDialog.addStyleClass("sapUiSizeCompact");
            }
        }
        return this.oCreateDialog;
    },

    onCloseCreateLocationDialog : function(oEvent) {
        var that = this;
        if (oEvent.getParameters().id.endsWith("Ok")) {
            var oModel = this.getView().getModel("NewLocation");
            var sLocation = oModel.getProperty("/Location");
            var sParentLocationName = oModel.getProperty("/ParentLocationName");

            var oInputLocation = sap.ui.core.Fragment.byId("CreateLocationDialog", "inputLocation");
            oInputLocation.setValueState(sap.ui.core.ValueState.None);
            if (!sLocation || sLocation === "") {
                oInputLocation.focus();
                oInputLocation.setValueState(sap.ui.core.ValueState.Error);
                this.reportError(oTextBundle.getText("Locations_EnterAllFields"));
                return;
            } else if (this.bParentLocationValid === false) {
                this.reportError(oTextBundle.getText("Locations_LocErr", sParentLocationName));
                return;
            }

            // Get GUID for new entry from server
            var oGuidModel = new sap.ui.model.json.JSONModel();
            oGuidModel.loadData("/sap/secmon/services/ui/locations/GenerateGUID.xsjs", "", false);
            var sBase64Id = oCommonFunctions.hexToBase64(oGuidModel.getProperty("/GUID"));
            // get new location values
            var oNewModelData = this.getView().getModel("NewLocation").getData();
            this.getView().getModel().create("/Locations", {
                Id : sBase64Id,
                Location : oNewModelData.Location,
                Description : oNewModelData.Description,
                TypeKey : oNewModelData.TypeKey,
                ParentLocation : (oNewModelData.ParentLocation === '') ? null : oNewModelData.ParentLocation
            }, {
                success : function(oResponse) {
                    that.getCreateDialog().close();
                    that.reportSuccess(oTextBundle.getText("Locations_CreateSuc", sLocation));
                    sap.ui.core.UIComponent.getRouterFor(that).navTo("Detail", {
                        "Id" : oGuidModel.getProperty("/GUID")
                    });
                },
                error : function(oError) {
                    var sErrorText = $(oError.response.body).find("message").first().text();
                    that.reportError(oTextBundle.getText("Locations_CreateErr", [ sLocation, sErrorText ]));
                }
            });
        } else {
            this.getCreateDialog().close();
        }
    },

    getUploadDialog : function() {
        if (!this.oUploadDialog) {
            this.oUploadDialog = sap.ui.xmlfragment("UploadLocationDialog", "sap.secmon.ui.locations.UploadDialog", this);
            this.getView().addDependent(this.oUploadDialog);
            if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
                this.oUploadDialog.addStyleClass("sapUiSizeCompact");
            }
        }
        return this.oUploadDialog;
    },

    onShowParentLocationValueHelpAsFilter : function(oEvent) {
        this.getParentLocationValueHelpAsFilter().open();
    },

    getParentLocationValueHelpAsFilter : function() {
        if (!this.oParentLocationValueHelpAsFilterDialog) {
            this.oParentLocationValueHelpAsFilterDialog = sap.ui.xmlfragment("ParentLocationAsFilterValueHelp", "sap.secmon.ui.locations.LocationsValueHelp", this);
            this.oParentLocationValueHelpAsFilterDialog.setModel(this.getView().getModel("ModelParentLocation"));
            this.getView().addDependent(this.oParentLocationValueHelpAsFilterDialog);
            if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
                this.oParentLocationValueHelpAsFilterDialog.addStyleClass("sapUiSizeCompact");
            }
        }
        return this.oParentLocationValueHelpAsFilterDialog;
    },

    onShowParentLocationValueHelp4NewLocation : function(oEvent) {
        this.getParentLocationValueHelp4NewLocation().open();

    },

    getParentLocationValueHelp4NewLocation : function() {
        if (!this.oParentLocationValueHelp4NewLocationDialog) {
            this.oParentLocationValueHelp4NewLocationDialog = sap.ui.xmlfragment("ParentLocation4NewLocationValueHelp", "sap.secmon.ui.locations.LocationsValueHelp", this);
            this.oParentLocationValueHelp4NewLocationDialog.setModel(this.getView().getModel("ModelParentLocation"));
            this.getView().addDependent(this.oParentLocationValueHelp4NewLocationDialog);
            if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
                this.oParentLocationValueHelp4NewLocationDialog.addStyleClass("sapUiSizeCompact");
            }
        }
        return this.oParentLocationValueHelp4NewLocationDialog;
    },
    onConfirmSelectLocationsDialog : function(oEvent) {
        if (oEvent.getId() === "confirm") {
            var oModel;
            var oSelectedData = oEvent.getParameter("selectedContexts")[0].getModel().getProperty(oEvent.getParameter("selectedContexts")[0].getPath());
            if (oEvent.getSource() === this.getParentLocationValueHelpAsFilter()) {
                oModel = this.getView().getModel("ModelFiltersAndSorters");
                oModel.setProperty("/ParentLocationName", oSelectedData.Location);
            } else if (oEvent.getSource() === this.getParentLocationValueHelp4NewLocation()) {
                sap.ui.core.Fragment.byId("CreateLocationDialog", "inputParentLocation").setValueState(sap.ui.core.ValueState.None);
                oModel = this.getView().getModel("NewLocation");
                oModel.setProperty("/ParentLocationName", oSelectedData.Location);
                oModel.setProperty("/ParentLocation", oSelectedData.Id);
            }
        }
        // reset filter
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([]);
    },

    onChangeParentLocation4NewLocation : function(oEvent) {
        var that = this;
        var oModel = this.getParentLocationValueHelp4NewLocation().getModel();
        var oInput = oEvent.getSource();
        var sSelectedParentLocation = oInput.getValue();
        oInput.setValueState(sap.ui.core.ValueState.None);
        this.bParentLocationValid = true;

        if (sSelectedParentLocation !== "") {
            this.bParentLocationValid = false;
            oInput.setValueState(sap.ui.core.ValueState.Error);
            var aLocations = oModel.getProperty("/");
            Object.keys(aLocations).map(function(key) {
                if (sSelectedParentLocation === aLocations[key].Location) {
                    var oModel = that.getView().getModel("NewLocation");
                    oModel.setProperty("/ParentLocationName", aLocations[key].Location);
                    oModel.setProperty("/ParentLocation", aLocations[key].Id);
                    oInput.setValueState(sap.ui.core.ValueState.None);
                    that.bParentLocationValid = true;
                }
            });
        } else {
            oModel.setProperty("/ParentLocation", null);
        }
    },

    handleValueHelpSearch : function(oEvent) {
        var oBinding = oEvent.getSource().getBinding("items");
        var oFilter =
                new sap.ui.model.Filter([ new sap.ui.model.Filter("Location", sap.ui.model.FilterOperator.Contains, oEvent.getParameter("value")),
                        new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, oEvent.getParameter("value")) ], false);
        oBinding.filter([ oFilter ]);
    },

    onPressCreateLocation : function(oEvent) {
        this.getCreateDialog().open();
    },

    onPressDeleteLocations : function(oEvent) {
        var that = this;
        var aSelectedItems = this.getLocationsTable().getSelectedItems();

        if (aSelectedItems.length === 0) {
            this.reportError(this.getText("Locations_NotSel"));
            return;
        }
        var oTable = this.getLocationsTable();
        var oModel = this.getView().getModel();
        var oView = this.getView();

        var fnDelete = function(action) {
            if (action === sap.m.MessageBox.Action.DELETE) {
                // Delete Locations identified by path
                var iNumberOfDeletedEntries = 0;
                $.each(aSelectedItems, function(index, element) {
                    oView.setBusy(true);
                    var sLocation = element.getBindingContext().getProperty("Location");
                    var sId = element.getBindingContext().getProperty("Id");
                    oModel.remove(element.getBindingContext().getPath(), {
                        success : function(oData, oResponse) {
                            var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/replication/export.xsjs", JSON.stringify({
                                "ObjectType" : "Location",
                                "Id" : oCommonFunctions.base64ToHex(sId),
                                "ObjectName" : sLocation,
                                "ObjectNamespace" : "Location",
                                "Operation" : "Delete"
                            }));
                            promise.fail(function(jqXHR, textStatus, errorThrown) {
                                that.reportError(oTextBundle.getText("Locations_DelErr", [ sLocation, jqXHR.responseText ]));
                            });
                            promise.done(function(data, textStatus, jqXHR) {
                            });
                            oView.setBusy(false);
                            oView.getModel("UI").setProperty("/itemSelected", false);
                            oTable.removeSelections(true);
                            // refresh data of model ModelParentLocation
                            var oModel = that.getView().getModel("ModelParentLocation");
                            oModel.refresh(true, true);
                            iNumberOfDeletedEntries++;
                            if (iNumberOfDeletedEntries === aSelectedItems.length) {
                                that.reportSuccess(that.getText("Locations_DelSelSuc"));
                            }
                        },
                        error : function(oError) {
                            var sErrorText = $(oError.response.body).find("message").first().text();
                            that.reportError(oTextBundle.getText("Locations_DelErr", [ sLocation, sErrorText ]));
                            oView.setBusy(false);
                        },
                        async : false
                    });
                });

            }
        };

        sap.m.MessageBox.show(this.getText("Locations_DelReally"), {
            icon : sap.m.MessageBox.Icon.WARNING,
            title : oTextBundle.getText("SysCtx_Delete"),
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : fnDelete
        });

    },

    /**
     * Exports the selected locations
     * 
     * @param oEvent
     */
    onPressExport : function(oEvent) {
        var that = this;
        var oTable = this.getLocationsTable();
        var aSelectedIndices = oTable.getSelectedItems();
        if (aSelectedIndices && aSelectedIndices.length === 0) {
            sap.ui.commons.MessageBox.show(this.getText("Locations_NotSel"), sap.ui.commons.MessageBox.Icon.INFORMATION);
            return;
        }
        $.each(aSelectedIndices, function(index, element) {
            var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/replication/export.xsjs", JSON.stringify({
                "ObjectType" : "Location",
                "Id" : oCommonFunctions.base64ToHex(element.getBindingContext().getProperty("Id")),
                "ObjectName" : element.getBindingContext().getProperty("Location"),
                "ObjectNamespace" : "Location",
                "Operation" : "Upsert"
            }));
            promise.fail(function(jqXHR, textStatus, errorThrown) {
                var oError = decodeURIComponent(jqXHR.responseText);
                that.reportError(oError);
            });
            promise.done(function(data, textStatus, jqXHR) {
                that.reportSuccess(oTextBundle.getText("Repl_Success"));
            });
        });
    },

    onAfterRendering : function() {
        // modify selectAll-behaviour of table => event onSelectionChange is not raised for header table as there are no rows available
        if (!this.tableFixedUpdated) {
            var oTable = this.getLocationsTable();
            var oTableFixed = this.getLocationsTableFixed();

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