jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/FilterBarWithSameSizedItems.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/replication/css/replication.css");

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/secmon/ui/m/commons/EtdController",
    "sap/ui/model/json/JSONModel",
    "sap/secmon/ui/m/commons/FilterBarHelper",
    "sap/secmon/ui/m/commons/ServiceConstants",
    "sap/secmon/ui/commons/CommonFunctions",
    "sap/secmon/ui/m/commons/QueryExtractor",
    "sap/secmon/ui/m/commons/dateTimeSelection/DateTimeSelectionHelper",
    "sap/secmon/ui/replication/util/Formatter",
    "sap/secmon/ui/commons/Formatter",
    "sap/secmon/ui/commons/GlobalMessageUtil",
    "sap/ui/core/MessageType",
    "sap/secmon/ui/commons/AjaxUtil",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "sap/m/MessageBox"

], function (
    Controller,
    UIComponent,
    EtdController,
    JSONModel,
    FilterBarHelper,
    ServiceConstants,
    CommonFunctions,
    QueryExtractor,
    DateTimeSelectionHelper,
    ReplicationFormatter,
    CommonsFormatter,
    GlobalMessageUtil,
    MessageType,
    AjaxUtil,
    FilterOperator,
    Filter,
    MessageBox
) {
    "use strict";

    return EtdController.extend("sap.secmon.ui.replication.controller.Main", {

        oCommons: new CommonFunctions(),
        DEFAULT_ORDER_BY: "createdTimestamp",
        DEFAULT_ORDER_DESC: true,
        UI_MODEL: "UIModel",
        EXPORT_TAB: "Export",
        IMPORT_TAB: "Import",
        MAIN_ROUTE: "Main",
        EXPORT_TABLE: "exportTable",
        IMPORT_TABLE: "importTable",
        IMPORT_XSJS_SERVICE: "/sap/secmon/services/replication/import.xsjs",
        RELEASE_SERVICE: "/sap/secmon/services/replication/export.xsjs?command=Release",

        constructor: function () {
            Controller.apply(this, arguments);
        },

        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
         * one-time initialization.
         * 
         */
        onInit: function () {
            UIComponent.getRouterFor(this).attachRoutePatternMatched(this.onRouteMatched, this);

            this._initModel();
            this.getDateTimeSelectionDialog();
        },

        onRouteMatched: function (oEvent) {
            var oView = this.getView();
            var oArguments = oEvent.getParameter("arguments");
            var sName = oEvent.getParameter("name") === this.MAIN_ROUTE ? this.EXPORT_TAB : oEvent.getParameter("name");

            oView.getModel(this.UI_MODEL).setProperty("/selectedTab", sName);

            var sServiceUrl = sName === this.IMPORT_TAB ? ServiceConstants.IMPORT_SERVICE : ServiceConstants.EXPORT_SERVICE;

            this._initFilterBar(sName, sServiceUrl);
            this._handleRouteMatched(oArguments, sServiceUrl);
        },

        /**
         * Starts the export of the selected items
         * 
         * @param oEvent
         */
        onPressExport: function (oEvent) {
            var oView = this.getView();
            var oTable = oView.byId(this.EXPORT_TABLE);
            var aContexts = oTable.getSelectedContexts();
            var aIds = aContexts.map(function (oElement) {
                return oElement.getProperty("Id");
            });

            var oPromise = new AjaxUtil().postJson(this.RELEASE_SERVICE, JSON.stringify(aIds));
            oPromise.fail(function (jqXHR, textStatus, errorThrown) {
                var oError = jqXHR.responseText;
                new GlobalMessageUtil().addMessage(MessageType.Error, oError);
            });
            oPromise.done(function (data, textStatus, jqXHR) {
                new GlobalMessageUtil().addMessage(MessageType.Success, data.text);
            });
        },

        /**
         * Starts the import of the selected items
         * 
         * @param oEvent
         */
        onPressImport: function (oEvent) {
            var oView = this.getView();
            var oTable = oView.byId(this.IMPORT_TABLE);
            var aContexts = oTable.getSelectedContexts();
            var aIds = aContexts.map(function (oElement) {
                return oElement.getProperty("Id");
            });

            var oPromise = new AjaxUtil().postJson(this.IMPORT_XSJS_SERVICE, JSON.stringify(aIds));
            oPromise.fail(function (jqXHR, textStatus, errorThrown) {
                var oError = jqXHR.responseText;
                new GlobalMessageUtil().addMessage(MessageType.Error, oError);
                oView.getModel().refresh();
            });
            oPromise.done(function (data, textStatus, jqXHR) {
                var sErrorMessage = !data.error ? data.text : data.text + ' ' + data.error;
                new GlobalMessageUtil().addMessage(MessageType.Success, sErrorMessage);
                oView.getModel().refresh();
            });
        },

        onBackButtonPressed: function () {
            this.getComponent().getNavigationVetoCollector().noVetoExists().then(function () {
                window.history.go(-1);
            });
        },

        onPressHelp: function (oEvent) {
            var oButton = oEvent.getSource();

            // singleton
            if (!this._helpMenu) {
                this._helpMenu = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.replication.view.fragments.HelpMenu", this);
                this.getView().addDependent(this._helpMenu);

                // toggle compact style
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._helpMenu);
            }
            var eDock = sap.ui.core.Popup.Dock;
            this._helpMenu.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);
        },


        onApplyTimeFilter: function () {
            this.dateTimeFilter = this._retrieveDateTimeFilter(true);

            if (this.dateTimeFilter) {
                this.lastActiveDateTimeSelection = this.getDateTimeHandler().getSelectionAsObject();
                this.getDateTimeHandler().reset();
                this.getDateTimeHandler().selectFromObject(this.lastActiveDateTimeSelection);

                this.getDateTimeSelectionDialog().close();
            }
        },

        onCloseTimeFilterDialog: function () {
            if (this.lastActiveDateTimeSelection) {
                this.getDateTimeHandler().reset();
                this.getDateTimeHandler().selectFromObject(this.lastActiveDateTimeSelection);
            }
            this.getDateTimeSelectionDialog().close();
        },

        getDateTimeSelectionDialog: function () {
            if (!this.dateTimeDialog) {
                this.dateTimeDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionDialog", this);
                this.getView().addDependent(this.dateTimeDialog);
            }
            // toggle compact style
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.dateTimeDialog);

            return this.dateTimeDialog;
        },

        onShowDateTimeDialog: function () {
            this.lastActiveDateTimeSelection = this.getDateTimeHandler().getSelectionAsObject();
            this.getDateTimeSelectionDialog().open();
        },

        getDateTimeHandler: function () {
            if (!this.dateTimeHandler) {
                this.dateTimeHandler = new DateTimeSelectionHelper(this.getView());
            }
            return this.dateTimeHandler;
        },

        onExportSelectionChange: function (oEvent) {
            var iSelectedItemsLength = this.getView().byId(this.EXPORT_TABLE).getSelectedContexts().length;
            this.getView().getModel(this.UI_MODEL).setProperty("/exportItemsSelected", iSelectedItemsLength > 0);
        },

        onImportSelectionChange: function (oEvent) {
            var iSelectedItemsLength = this.getView().byId(this.IMPORT_TABLE).getSelectedContexts().length;
            this.getView().getModel(this.UI_MODEL).setProperty("/importItemsSelected", iSelectedItemsLength > 0);
        },

        onExportUpdateFinished: function (oEvent) {
            var iCount = oEvent.getSource().getBinding("items").getLength();
            this.getView().getModel(this.UI_MODEL).setProperty("/exportCount", iCount);
        },

        onImportUpdateFinished: function (oEvent) {
            var iCount = oEvent.getSource().getBinding("items").getLength();
            this.getView().getModel(this.UI_MODEL).setProperty("/importCount", iCount);
        },

        onDetailSelect: function (oEvent) {
            var sKey = oEvent.getParameter("selectedKey");
            this.getView().getModel(this.UI_MODEL).setProperty("/selectedTab", sKey);
            this._navTo(sKey);
        },

        onPressHelpExport: function (oEvent) {
            window.open("/sap/secmon/help/c4f0526ac090426c9b347f77c56c450b.html");
        },

        onPressHelpImport: function (oEvent) {
            window.open("/sap/secmon/help/aa0bc0004fda4f09a57528c6e6eceb56.html");
        },

        _initFilterBar: function (sTabName, sServiceUrl) {

            var sTable = sTabName === this.IMPORT_TAB ? this.IMPORT_TABLE : this.EXPORT_TABLE;
            var aFilterInputs = sTabName === this.IMPORT_TAB ? this._getImportFilterInputs() : this._getExportFilterInputs();

            var fnNavigation = function () {
                this._navToWithAggregatedParameters(sTabName);
            };
            FilterBarHelper.initialize.call(this, sTable, sServiceUrl, fnNavigation, aFilterInputs, [this.getComponent().getModel()]);
        },

        _handleRouteMatched: function (oArguments, sServiceUrl) {
            var params = oArguments["?query"];
            var oQueryObject = {};
            if (params) {
                oQueryObject = params;
            }

            var queryExtractor = new QueryExtractor(sServiceUrl, this.DEFAULT_ORDER_BY, this.DEFAULT_ORDER_DESC);
            var oSorter = queryExtractor.extractSorter(oQueryObject);
            var aFilters = queryExtractor.extractFilters(oQueryObject);

            FilterBarHelper.applySorting.call(this, oSorter.sPath, oSorter.bDescending);
            FilterBarHelper.applyFiltersToFilterBar.call(this, aFilters);

            // Time range

            // select date time settings and retrieve the filter
            // from the control
            this.getDateTimeHandler().selectFromObject(oQueryObject);
            if (this.noTimeRefresh === false) {
                this.dateTimeFilter = this._retrieveDateTimeFilter();
            }

            // concatenate the filter from view settings and date time
            // control
            if (this.dateTimeFilter && this.dateTimeFilter.filters && this.dateTimeFilter.filters.length > 0) {
                aFilters = aFilters.concat(this.dateTimeFilter.filters);
                var aTimeRange = this.getDateTimeHandler().getTimeRangeUnderConsideration(this.noTimeRefresh);
                var sNewTitle = this._getDateTimeTextFromTimeRange(aTimeRange);
                this.getView().getModel(this.UI_MODEL).setProperty("/tableTitle", sNewTitle);
                // this.byId("timeRangeLabelInToolbarOfTable").setText(sNewTitle);
            }
            // end time range

            FilterBarHelper.setFilters.call(this, aFilters);

            // apply the filter and sorter
            FilterBarHelper.applyFiltersAndSorter.call(this, {
                filters: aFilters,
                sorter: oSorter
            });
        },

        _navToWithAggregatedParameters: function (sName) {
            var oNewQueryParameters = {};
            FilterBarHelper.clearFilterInputToUrParam.call(this);
            FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oNewQueryParameters, []);
            FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oNewQueryParameters, []);

            // The router has a "feature" not to dispatch to event handlers if
            // neither route nor query parameters have changed.
            // In order to force navigation, we add a parameter with new value each
            // time.
            oNewQueryParameters.lastNav = this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

            this._navTo(sName, {
                query: oNewQueryParameters
            }, true);
        },

        _initModel: function () {
            var oModel = new JSONModel({
                importCount: 0,
                exportCount: 0,
                exportItemsSelected: false,
                importItemsSelected: false,
                selectedTab: this.EXPORT_TAB
            });
            this.getView().setModel(oModel, this.UI_MODEL);
        },

        _navTo: function (routeName, oParams, bReplace) {
            UIComponent.getRouterFor(this).navTo(routeName, oParams, bReplace);
        },

        /**
         * Retrieve date time filters from date time control. With side-effect: Set panel of date time control.
         */
        _retrieveDateTimeFilter: function (bActive) {
            var aTimeRange = this.getDateTimeHandler().getTimeRangeUnderConsideration();
            if (aTimeRange) {
                var oFilter;

                var sNewTitle = this._getDateTimeTextFromTimeRange(aTimeRange, true);

                if (aTimeRange.length === 2) {
                    oFilter = new Filter({
                        path: "CreatedTimestamp", // TODO: change log specific
                        operator: FilterOperator.BT,
                        value1: aTimeRange[0],
                        value2: aTimeRange[1]
                    });
                } else {
                    oFilter = new Filter({
                        path: "CreatedTimestamp", // TODO: change log specific
                        operator: FilterOperator.GE,
                        value1: aTimeRange[0]
                    });
                }

                this.getView().byId("createdFilterInput").setValue(sNewTitle);

                return {
                    filters: [oFilter],
                    sorter: null
                };
            } else {
                if (bActive) {
                    MessageBox.alert(this.getCommonText("InvalidRange_MSG"), {
                        styleClass: !sap.ui.Device.phone ? "sapUiSizeCompact" : "",
                        title: this.getCommonText("Error_TIT")
                    });
                } else {
                    this.getView().byId("createdFilterInput").setValue("");
                }

                return null;
            }
        },

        _getDateTimeTextFromTimeRange: function (aTimeRange, bForFilterBar) {
            var sFormat;
            var sNewTitle;

            if (!bForFilterBar || !this.getDateTimeHandler().isRelative()) {
                if (aTimeRange.length === 2) {
                    sFormat = this.getCommonText("ConsTimeRangeFT_LBL");
                    sNewTitle = CommonsFormatter.timeRangeFormatterEx(this.UTC, sFormat, aTimeRange[0], aTimeRange[1]);
                } else {
                    sFormat = this.getCommonText("ConsTimeRangeFR_LBL");
                    sNewTitle = this.i18nText(sFormat, CommonsFormatter.dateFormatterEx(this.UTC, aTimeRange[0]));
                }
            } else {
                switch (this.getDateTimeHandler().getRelativeTimeUnit()) {
                    case "minutes":
                        sFormat = this.getCommonText("TimeRange_LastM_LBL");
                        break;
                    case "hours":
                        sFormat = this.getCommonText("TimeRange_LastH_LBL");
                        break;
                    case "days":
                        sFormat = this.getCommonText("TimeRange_LastD_LBL");
                        break;
                }

                if (sFormat) {
                    sNewTitle = this.i18nText(sFormat, this.getDateTimeHandler().getRelativeTimeInput());
                }
            }

            return sNewTitle;
        },

        _getExportFilterInputs: function () {
            return ["createdFilterInput", "exportObjectAreaFilterInput", "exportObjectTypeFilterInput", "exportStatusFilterInput", "exportOperationFilterInput", "createdByFilterInput"];
        },

        _getImportFilterInputs: function () {
            return ["createdFilterInput", "importObjectAreaFilterInput", "importObjectTypeFilterInput", "importStatusFilterInput", "importOperationFilterInput", "createdByFilterInput"];
        }

    });
});