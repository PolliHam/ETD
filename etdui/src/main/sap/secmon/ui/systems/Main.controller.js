/* globals oTextBundle, oCommonFunctions*/
$.sap.require("sap.secmon.ui.systems.Constants");
$.sap.require("sap.secmon.ui.commons.NavigationHelper");
$.sap.require("sap.secmon.ui.commons.AjaxUtil");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.systems.Formatter");
jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/FilterBarWithSameSizedItems.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ScrollableContainerSize.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.systems.Main", {

    oRouter : null,
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
        ID : "Id",
        TYPE : "Type",
        MAIN_SYSTEM_ID : "MainSystemId",
        MAIN_SYSTEM_TYPE : "MainSystemType",
        LOCATION : "Location",
        ROLE : "Role",
        STATUS : "Status",
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
    
    NEW_SYSTEM_MODEL : "ModelNewSystem",

    onInit : function() {
        var that = this;
        this.applyCozyCompact();
        this.setRouteName(this.ROUTES.MAIN);
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.onRouteMatched, this);
        this.initModels();
        $(window).resize(function() {
            var oUIModel = that.getView().getModel("UIModel");
            var oUIModelData = oUIModel.getData();
            oUIModelData.scrollHeight = $(window).height() - 286 + "px";
            that.getSystemsTable();
            oUIModel.setData(oUIModelData);
        });
    },

    initModels : function() {
        // Model for systems
        var oModelDomains = new sap.ui.model.odata.ODataModel(sap.secmon.ui.systems.Constants.C_SERVICE_PATH.SYSTEMS, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.getView().setModel(oModelDomains, 'ModelSystems');

        // Model for main systems
        var oModelMainSystems = new sap.ui.model.json.JSONModel();
        this.getView().setModel(oModelMainSystems, 'ModelMainSystems');

        // Model for enum
        var oModelGenericEnum = new sap.ui.model.odata.ODataModel(sap.secmon.ui.systems.Constants.C_SERVICE_PATH.ENUM, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.getView().setModel(oModelGenericEnum, "Enum");

        // Model for new system creation
        var oModelNewSystem = new sap.ui.model.json.JSONModel({
            Id : "",
            Type : "",
            Status : "",
            Role : "",
            IsMainSystem : true,
            MainSystem : ""
        });
        this.getView().setModel(oModelNewSystem, this.NEW_SYSTEM_MODEL);

        // Model for filters and sorters
        var oModelFiltersAndSorters = new sap.ui.model.json.JSONModel();
        this.getView().setModel(oModelFiltersAndSorters, 'ModelFiltersAndSorters');

        // Model for UI
        var oUIModel = new sap.ui.model.json.JSONModel({
            itemsSelected : false,
            createEnabled : true,
            selectedStatus : '',
            scrollHeight : $(window).height() - 286 + "px",
            filterText : ""
        });
        this.getView().setModel(oUIModel, "UIModel");
    },

    getText : function(sTextKey, aValues) {
        return oTextBundle.getText(sTextKey, aValues);
    },

    getSystemsTableFixed : function() {
        this.oSystemsTableFixed = this.oSystemsTableFixed || this.getView().byId("systemsTableHeader");
        return this.oSystemsTableFixed;
    },

    getSystemsTable : function() {
        this.oSystemsTable = this.oSystemsTable || this.getView().byId("systemsTable");
        return this.oSystemsTable;
    },

    getFilterBar : function() {
        this.oFilterBar = this.oFilterBar || this.getView().byId("vsdFilterBar");
        return this.oDomainTableFixed;
    },

    showFilterBar : function(visible) {
        this.getFilterBar().setVisible(visible);
    },

    getFilterBarText : function() {
        return (this.getFilterBar().getVisible() ? this.getView().byId("vsdFilterLabel").getText() : "");
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

    setRouteName : function(sRouteName) {
        this.routeName = sRouteName;
    },

    getRouteName : function() {
        return this.routeName;
    },

    onRouteMatched : function(oEvent) {
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
            oNewQueryParams.OrderBy = "Id";
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
            this.getView().getModel("UIModel").setProperty("/filterText", this.getFilterText());
            // get data from backend
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

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            var sLaunchpadUrl = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl();
            document.location.href = sLaunchpadUrl;
        });
    },

    handleUpdateFinished : function(oEvent) {
        this.setCount();
    },

    setCount : function() {
        var oList = this.getSystemsTable();
        var count = oList.getBinding("items").getLength();
        var sTitle = this.getView().getModel("i18n").getProperty("SysCtx_Systems") + " (" + count + ")";
        this.getView().byId("page").setTitle(sTitle);
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

    refreshData : function() {
        var aFilters = [], sPath, sOperator;
        var oBinding = this.getSystemsTable().getBinding("items");
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
            case 'Status':
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
                case sap.secmon.ui.systems.Constants.C_FILTERS_AND_SORTERS.ID:
                    sText = that.getText("SysCtx_System") + ' like ' + '"' + oModelData[key] + '"';
                    break;
                case sap.secmon.ui.systems.Constants.C_FILTERS_AND_SORTERS.TYPE:
                    sText = that.getText("SysCtx_SystemType") + ' like ' + oModelData[key];
                    break;
                case sap.secmon.ui.systems.Constants.C_FILTERS_AND_SORTERS.MAIN_SYSTEM_ID:
                    sText = that.getText("SysCtx_IdMainSys") + ' like ' + oModelData[key];
                    break;
                case sap.secmon.ui.systems.Constants.C_FILTERS_AND_SORTERS.MAIN_SYSTEM_TYPE:
                    sText = that.getText("SysCtx_TypeMainSys") + ' like ' + oModelData[key];
                    break;
                case sap.secmon.ui.systems.Constants.C_FILTERS_AND_SORTERS.ROLE:
                    sText = that.getText("SysCtx_Role") + ' like ' + oModelData[key];
                    break;
                case sap.secmon.ui.systems.Constants.C_FILTERS_AND_SORTERS.STATUS:
                    sText = that.getText("SysCtx_Status") + ' = ' + oModelData[key];
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

    onSearch : function(oEvent) {
        this.navToWithAggregatedParameters(this.getRouteName());
    },

    onSelectionChange : function(oEvent) {
        this.getView().getModel("UIModel").setProperty("/itemsSelected", (this.getSystemsTable().getSelectedItems().length > 0));
    },

    onPressHelp : function(oEvent) {
        // open help=> Docu UUID required
    },

    onDelete : function(oEvent) {
        var that = this;
        var oTable = this.getSystemsTable();
        var oView = this.getView();
        var oModel = oView.getModel("ModelSystems");
        var aSelectedItems = oTable.getSelectedItems();

        if (aSelectedItems.length === 0) {
            this.reportError(this.getText("SysCtx_SelectASys"));
            return;
        }
        var fnDelete = function(action) {
            if (action === sap.m.MessageBox.Action.DELETE) {
                // Delete subnets identified by path
                var iNumberOfDeletedEntries = 0;
                $.each(aSelectedItems, function(index, element) {
                    oView.setBusy(true);

                    oModel.remove(element.getBindingContext("ModelSystems").getPath(), {
                        success : function(oData, oResponse) {
                            oView.setBusy(false);
                            oTable.removeSelections(true);
                            oModel.refresh();
                            that.onSelectionChange();
                            iNumberOfDeletedEntries++;
                            if (iNumberOfDeletedEntries === aSelectedItems.length) {
                                that.reportSuccess(that.getText("SysCtx_DelSuc"));
                            }
                        },
                        error : function(oError) {
                            var oMessage = oError.response.body;
                            that.reportError($(oMessage).find("message").first().text());
                            oView.setBusy(false);
                        },
                        async : false
                    });
                });
            }
        };
        sap.m.MessageBox.show(this.getText("SysCtx_DelReally"), {
            icon : sap.m.MessageBox.Icon.WARNING,
            title : oTextBundle.getText("SysCtx_Delete"),
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : fnDelete
        });
    },

    handleSort : function(oEvent) {
        var oTable = this.getSystemsTable();
        var oHeader = this.getSystemsTableFixed();
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

    onItemPress : function(oEvent) {
        var bSystemWrite = this.getView().getModel("applicationContext").getProperty("/userPrivileges/systemWrite");
        if (bSystemWrite) {
            var navigationName = "details";
            var param = {
                Id : encodeURIComponent(oEvent.getParameter("listItem").getBindingContext("ModelSystems").getProperty("Id")),
                Type : encodeURIComponent(oEvent.getParameter("listItem").getBindingContext("ModelSystems").getProperty("Type"))
            };
            sap.ui.core.UIComponent.getRouterFor(this.getView()).navTo(navigationName, param, false);
        } else {
            sap.m.MessageBox.show(oTextBundle.getText("PrivilegesErrorMessage"), sap.m.MessageBox.Icon.ERROR, "Error");
        }
    },

    onShowCreateSystemDialog : function(oEvent) {
        this.getCreateSystemDialog().open();
    },

    getCreateSystemDialog : function() {
        if (!this.oCreateSystemDialog) {
            this.oCreateSystemDialog = sap.ui.xmlfragment("CreateSystem", "sap.secmon.ui.systems.CreateSystemDialog", this);
            this.getView().addDependent(this.oCreateSystemDialog);
            if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
                this.oCreateSystemDialog.addStyleClass("sapUiSizeCompact");
            }
        }
        return this.oCreateSystemDialog;
    },

    onCloseCreateSystemDialog : function(oEvent) {
        var that = this;
        if (oEvent.getParameters().id.endsWith("ok")) {
            var oModelNewSystem = this.getView().getModel(this.NEW_SYSTEM_MODEL).getData();
            var oDialogFormElements = oEvent.getSource().getParent().getParent().getContent()[0].getContent();
            // check consistency of data provided => do not call backend in case data is inconsistent
            var bDataOK = true;
            // System Id must be provided
            if (!oModelNewSystem.Id || oModelNewSystem.Id === "") {
                oDialogFormElements[1].focus();
                oDialogFormElements[1].setValueState(sap.ui.core.ValueState.Error);
                bDataOK = false;
            } else {
                oDialogFormElements[1].setValueState(sap.ui.core.ValueState.None);
            }
            // System type must be provided
            if (!oModelNewSystem.Type || oModelNewSystem.Type === "") {
                oDialogFormElements[3].focus();
                oDialogFormElements[3].setValueState(sap.ui.core.ValueState.Error);
                bDataOK = false;
            } else {
                oDialogFormElements[3].setValueState(sap.ui.core.ValueState.None);
            }
            // System status must be provided with valid key and value=> that empty is valid
            if (oDialogFormElements[5].getSelectedKey() === "" && oDialogFormElements[5].getValue() !== "") {
                oDialogFormElements[5].focus();
                oDialogFormElements[5].setValueState(sap.ui.core.ValueState.Error);
                bDataOK = false;
            } else {
                oDialogFormElements[5].setValueState(sap.ui.core.ValueState.None);
            }

            // System group must be provided in case IsMainSystem = false
            if (oModelNewSystem.IsMainSystem === false && oDialogFormElements[11].getSelectedKey() === "") {
                oDialogFormElements[11].focus();
                oDialogFormElements[11].setValueState(sap.ui.core.ValueState.Error);
                bDataOK = false;
            } else {
                oDialogFormElements[11].setValueState(sap.ui.core.ValueState.None);
            }
            if (bDataOK === false) {
                return;
            }
            var sMainSysName, sMainSysType;
            if (oModelNewSystem.IsMainSystem) {
                sMainSysName = oModelNewSystem.Id;
                sMainSysType = oModelNewSystem.Type;
            } else {
                var rs = oModelNewSystem.MainSystem.split(' / ');
                sMainSysName = rs[0];
                sMainSysType = rs[1];
            }
            var oData = {
                Id : oModelNewSystem.Id,
                Type : oModelNewSystem.Type,
                Status : oModelNewSystem.Status,
                Role : oModelNewSystem.Role,
                MainSystemId : sMainSysName,
                MainSystemType : sMainSysType,
            };
            // create system
            this.getView().getModel("ModelSystems").create("/SystemHeader", oData, {
                success : function(oResponse) {
                    that.reportSuccess(that.getText("SysCtx_CreateSuc", oData.Id + " / " + oData.Type));
                    var navigationName = "details";
                    var param = {
                        Id : encodeURIComponent(oData.Id),
                        Type : oData.Type
                    };
                    sap.ui.core.UIComponent.getRouterFor(that.getView()).navTo(navigationName, param, false);
                },
                error : function(oError) {
            var oMessage = oError.response.body; 
                  oMessage = oMessage.split(/[,{}]/g);
                  $.each(oMessage, function (index, value) {
                    if(value.includes("value")){
                      that.reportError(value.split(/[:()]/g)[3]);                    
                    }
                  });       
                }
            });

        }
        this._closeAndClearSystemDialog();
    },

    onChangeNewSystemId : function(oEvent) {
        var oData = this.getView().getModel(this.NEW_SYSTEM_MODEL).getData();
        var oInput = oEvent.getSource();
        // System Id must be provided
        if (!oData.Id || oData.Id === "") {
            oInput.focus();
            oInput.setValueState(sap.ui.core.ValueState.Error);
        } else {
            oInput.setValueState(sap.ui.core.ValueState.None);
        }
    },

    onChangeNewSystemType : function(oEvent) {
        var oData = this.getView().getModel(this.NEW_SYSTEM_MODEL).getData();
        var oInput = oEvent.getSource();
        // System type must be provided
        if (!oData.Type || oData.Type === "") {
            oInput.focus();
            oInput.setValueState(sap.ui.core.ValueState.Error);
        } else {
            oInput.setValueState(sap.ui.core.ValueState.None);
        }
    },

    onChangeSystemsCombo : function(oEvent) {
        var oCombo = oEvent.getSource();
        // System status must be provided
        if (oCombo.getSelectedKey() === "" && oCombo.getValue() !== "") {
            oCombo.focus();
            oCombo.setValueState(sap.ui.core.ValueState.Error);
        } else {
            oCombo.setValueState(sap.ui.core.ValueState.None);
        }
    },

    onChangeIsMainSystem : function() {
        this.refreshMainSystems();
    },

    refreshMainSystems : function() {
        var that = this;
        var oModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.systems.Constants.C_SERVICE_PATH.SYSTEMS, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        oModel.read("/SystemHeader", {
            urlParameters : [ "$orderby=MainSystemId asc", "$select=MainSystemId, MainSystemType" ],
            async : false,
            filters : [ new sap.ui.model.Filter("MainSystemId", sap.ui.model.FilterOperator.NE, null) ],
            sorter : new sap.ui.model.Sorter({
                path : "MainSystemId",
                descending : false
            }),
            success : function(oData, oResponse) {
                var aMainSystems = [];
                $.each(oData.results, function(idx, oRes) {
                    var bAlreadyExist = false;
                    for (var i = 0; i < aMainSystems.length; i++) {
                        if (aMainSystems[i].SystemGroup === oRes.MainSystemId + ' / ' + oRes.MainSystemType) {
                            bAlreadyExist = true;
                            break;
                        }
                    }
                    if (bAlreadyExist === false) {
                        aMainSystems.push({
                            SystemGroup : oRes.MainSystemId + ' / ' + oRes.MainSystemType
                        });
                    }
                });
                that.getView().getModel("ModelMainSystems").setData(aMainSystems);
            },
            error : function(oError) {
                var oMessage = oError.response.body;
                that.reportError($(oMessage).find("message").first().text());
            }
        });
    },
    onAfterRendering : function() {
        // modify selectAll-behaviour of table => event onSelectionChange is not raised for header table as there are no rows available
        if (!this.tableFixedUpdated) {
            var oTable = this.getSystemsTable();
            var oTableFixed = this.getSystemsTableFixed();

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

    },

    _closeAndClearSystemDialog: function () {
        this.getCreateSystemDialog().close();
        this._clearSystemModel();
    },

    _clearSystemModel: function () {

        var oData = {
            Id: "",
            Type: "",
            Status: "",
            Role: "",
            IsMainSystem: true,
            MainSystem: ""
        };
        this.getView().getModel(this.NEW_SYSTEM_MODEL).setData(oData);
    }
});