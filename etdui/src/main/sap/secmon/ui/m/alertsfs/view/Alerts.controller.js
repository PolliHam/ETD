jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ClickableElementStyle.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/FilterBarWithSameSizedItems.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/DateTimeTable.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ScrollableContainerSize.css");
var aDependencies =
        [ "sap/secmon/ui/commons/CommonFunctions", "sap/secmon/ui/commons/FilterSortUtil", "sap/secmon/ui/m/commons/InvestigationCreator", "sap/m/MessageBox", "sap/secmon/ui/commons/UIStateUtils",
                "sap/secmon/ui/m/commons/BookmarkCreator", "sap/secmon/ui/m/commons/TileURLUtils", "sap/secmon/ui/m/commons/NavigationService",
                "sap/secmon/ui/m/commons/dateTimeSelection/DateTimeSelectionHelper", "sap/secmon/ui/m/commons/ServiceConstants", "sap/secmon/ui/m/commons/alerts/AlertsBaseController",
                "sap/secmon/ui/m/commons/QueryExtractor", "sap/secmon/ui/m/util/OnSapEnterEnhancer", "sap/secmon/ui/m/commons/controls/SortOrder",
                "sap/secmon/ui/m/commons/patternSuggestion/PatternSuggestionHelper", "sap/secmon/ui/commons/AlertTriggerFormatter", "sap/secmon/ui/commons/Formatter",
                "sap/secmon/ui/m/commons/Formatter", "sap/secmon/ui/m/alerts/util/Formatter" ];

sap.ui.define(aDependencies, function(CommonFunctions, FilterSortUtil, InvestigationCreator, MessageBox, UIStateUtils, BookmarkCreator, TileURLUtils, NavigationService, DateTimeSelectionHelper,
        ServiceConstants, AlertsBaseController, QueryExtractor, OnSapEnterEnhancer, SortOrder, PatternSuggestionHelper, AlertTriggerFormatter, CFormatter, MCFormatter, AUFormatter) {
    "use strict";

    return AlertsBaseController.extend("sap.secmon.ui.m.alertsfs.view.Alerts", {
        UI_STATE_UTILS : UIStateUtils,

        DEFAULT_ORDER_BY : "creationDate",
        DEFAULT_ORDER_DESC : true,
        INV_BUTTONS : [ "startInvestBtn", "addToInvestBtn" ],

        QUBE_SEARCH_SERVICE_URL : "/sap/secmon/services/ui/m/QubeSearch.xsodata/QubeSearch?$format=json&search=",

        ROUTES : {
            MAIN : "main",
            ALERT_GRAPH : "alertGraph",
            ALERT_GRAPH_SYMBOL : "alertGraphSymbol",
            SYSTEM_LOCATION : "systemLocation",
            hasRoute : function(sRoute) {
                for ( var prop in this) {
                    if (this[prop] === sRoute) {
                        return true;
                    }
                }
                return false;
            }
        },

        onInit : function() {
            AlertsBaseController.prototype.onInit.call(this);

            this.byId("helpButton").attachBrowserEvent("tab keyup", function(oEvent) {
                this._bKeyboard = oEvent.type === "keyup";
            });

            this.oCommons = new CommonFunctions();
            this.oInvestigationCreator = new InvestigationCreator();
            this.oBookmarkCreator = new BookmarkCreator();
            this.getDateTimeSelectionDialog();
            this.applyCozyCompact();

            this.setRouteName(this.ROUTES.MAIN);

            this.getRouter().attachRouteMatched(this.onRouteMatched, this);
            var that = this;

            // While the table is loading/sorting the correct sorting options cannot
            // be retrieved,
            // the actions need to be disabled.
            function fnDisableAlertActions() {
                that.getEmailButton().setEnabled(false);
                that.getBookmarkButton().setEnabled(false);
            }
            function fnEnableAlertActions() {
                that.getEmailButton().setEnabled(true);
                that.getBookmarkButton().setEnabled(true);
            }
            var oTable = this.getAlertsTable();
            oTable.attachUpdateStarted(fnDisableAlertActions);
            oTable.attachUpdateFinished(fnEnableAlertActions);

            this.enableButtonsIfExactlyOneRowIsSelected(oTable, [ "analyzeButton" ]);
            this.enableButtonsIfAtLeastOneRowIsSelected(oTable, [ "updateAlertsBtn" ]);
            // enable Investigation buttons only if none of the alerts has an
            // investigation
            this.enableButtonsIfEmptyAlertsAreSelected(oTable, this.INV_BUTTONS);
            this.UTC = this.getComponent().getModel("applicationContext").getData().UTC;
            // do not change time selection caused by relative time selection if sorting occurred
            this.noTimeRefresh = false;
            this.createUiModel();
        },

        enableButtonsIfEmptyAlertsAreSelected : function(oTable, aButtonIds) {
            var fnMatcher = function(aSelectedItems) {
                return aSelectedItems.length >= 1;
            };
            return this.enableButtonsIfSelectedRowsMatch(oTable, aButtonIds, fnMatcher);
        },

        createUiModel : function() {
            this.uiModel = new sap.ui.model.json.JSONModel({
                alertsCount : 0
            });
            this.getView().setModel(this.uiModel, "uiModel");
        },

        setRouteName : function(sRouteName) {
            this.routeName = sRouteName;
        },

        getRouteName : function() {
            return this.routeName;
        },

        getBookmarkButton : function() {
            return this.getView().byId("bookmarkButton");
        },

        getEmailButton : function() {
            return this.getView().byId("emailButton");
        },

        adjustGraphFilter : function(ViewSettingsValues) {
            // in the case the symbol graph is called directly via URL the
            // graphSettings have to be adjusted otherwise in the settings still the
            // default value would be selected
            var GraphSettings = this.getGraphSettingsDialog();
            var aFilterItems = GraphSettings.getFilterItems();
            var i, j;

            // loop over the objects and set the properties selected/not selected
            for (i = 0; i < aFilterItems.length; i++) {
                var aFilteredSubItems = aFilterItems[i].getItems();

                for (j = 0; j < aFilteredSubItems.length; j++) {
                    if (ViewSettingsValues.hasOwnProperty(aFilteredSubItems[j].getKey()) === true) {
                        aFilteredSubItems[j].setSelected(ViewSettingsValues[aFilteredSubItems[j].getKey()]);
                    }
                }
            }
        },

        /**
         * Event handler for event "routeMatched". THe event object contains the query attribute containing the URL parameters. Note that the URL parameters must be URL encoded. Multiple values may be
         * arrays or may be encoded as a comma-separated string. Example for query with a multi-valued attribute: {patternName : ["{URL encoded pattern1}", "{URL encoded pattern2}")} Alternatively:
         * {patternName : "{URL encoded pattern1},{URL encoded pattern2}"}
         */
        onRouteMatched : function(oEvent) {
            var routeName = oEvent.getParameter("name");
            this.setRouteName(routeName);

            if (!this.ROUTES.hasRoute(routeName)) {
                return;
            }

            if (this._suppressNextRefresh === true) {
                this._suppressNextRefresh = false;
                return;
            }

            var oArguments = oEvent.getParameter("arguments");
            var params = oArguments["?query"] || {};

            var that = this;

            // case when the UI is called directly without any parameters (over
            // SAP-own tile 'AlertsFs', not a custom tile)
            if (Object.keys(params).length === 0) {
                var uiStateId = this.UI_STATE_UTILS.createUIStateId();
                var oNewQueryParams = {
                    uistate : uiStateId
                };

                oNewQueryParams.orderBy = that.DEFAULT_ORDER_BY;
                oNewQueryParams.orderDesc = that.DEFAULT_ORDER_DESC;
                oNewQueryParams = jQuery.extend(true, that.getDateTimeHandler().getDefaultSelectionAsObject(), oNewQueryParams);
                Object.keys(oNewQueryParams).map(function(key) {
                    if (jQuery.sap.startsWith(key, "time") || key === "uistate") {
                        oNewQueryParams[key] = encodeURIComponent(oNewQueryParams[key]);
                    }
                });

                // store the parameters in the URL and navigate to this URL
                // this leads to a call of "onRouteMatched" again but next time
                // with parameters
                that.navTo(that.getRouteName(), {
                    query : oNewQueryParams
                }, true);

            } else {
                // case when the UI is called directly over a custom tile or when
                // navigating from another ui
                if (!params.uistate) {
                    params.uistate = this.UI_STATE_UTILS.createUIStateId();

                    // if the app is called via app-to-app navigation the ui state
                    // is not available; this application
                    // is called with encoded params but we receive them decoded =>
                    // encode to perform a routing again
                    if (!params.doNotEncode) {
                        Object.keys(params).forEach(function(key) {
                            if (!(jQuery.sap.startsWith(key, "time") || key === "uistate" || key === "measureContext" || key === "status")) {
                                params[key] = encodeURIComponent(params[key]);
                            }
                        });
                    }

                    // store the uistate in the URL parameters and navigate again
                    // this leads to a call of "onRouteMatched" again where the next
                    // else block should be handled
                    this.navTo(this.getRouteName(), {
                        query : params
                    }, true);
                } else {
                    this.uiStateId = params.uistate;

                    // this function handles the mapping of url parameter to view
                    // settings entries and applies the filter to the table
                    var fnHandleUrlMapping = function() {

                        // filter the url parameters which can be handled by the
                        // sap.secmon.ui.m.commons.QueryExtractor otherwise we get an
                        // exception
                        var oFilteredParams = {};
                        var oDecodedParams = {};

                        Object.keys(params).map(function(key) {
                            if (!jQuery.sap.startsWith(key, "time") && key !== "uistate") {
                                oFilteredParams[key] = params[key];
                            } else {
                                oDecodedParams[key] = decodeURIComponent(params[key]);
                            }
                        });

                        // apply the url parameters to the view settings control and
                        // perform the filtering if everything is ok
                        var queryExtractor = new QueryExtractor(ServiceConstants.ALERTS_SERVICE, that.DEFAULT_ORDER_BY, that.DEFAULT_ORDER_DESC);
                        var oSorter = queryExtractor.extractSorter(oFilteredParams);
                        var aFilters = queryExtractor.extractFilters(oFilteredParams);

                        that.applySorting(oSorter.sPath, oSorter.bDescending);
                        that.applyFiltersToFilterBar(aFilters);

                        // select date time settings and retrieve the filter
                        // from the control
                        that.getDateTimeHandler().selectFromObject(oDecodedParams);
                        if (that.noTimeRefresh === false) {
                            that.dateTimeFilter = that._retrieveDateTimeFilter();
                        }
                        // concatenate the filter from view settings and date time
                        // control
                        if (that.dateTimeFilter && that.dateTimeFilter.filters && that.dateTimeFilter.filters.length > 0) {
                            aFilters = aFilters.concat(that.dateTimeFilter.filters);
                            var aTimeRange = that.getDateTimeHandler().getTimeRangeUnderConsideration(that.noTimeRefresh);
                            var sNewTitle = that._getDateTimeTextFromTimeRange(aTimeRange);
                            that.uiModel.setProperty("/timeRange", sNewTitle);
                        }
                        that.setAlertFilters(aFilters);

                        that.showViewByRoute(that.getRouteName());

                        // apply the filter and sorter
                        that.applyFiltersAndSorter({
                            filters : aFilters,
                            sorter : oSorter
                        });

                        that.restoreUIState(params.uistate);
                        that.noTimeRefresh = false;
                    };

                    // if the UI was called with URL-parameters (by navigating back
                    // to AlertsFs or calling the UI from a link)
                    fnHandleUrlMapping();
                }
            }
        },

        restoreUIState : function(uiStateId) {
            var oUIState = this.UI_STATE_UTILS.getUIState(uiStateId);
            if (!oUIState) {
                return;
            }
            this.getAlertsTable().attachEventOnce("updateFinished", function() {
                this.selectAlerts(oUIState.selectedAlerts);
                // simulate selection change in order to trigger correct calculation
                // of button enablement
                var oTable = this.getAlertsTable();
                oTable.fireSelectionChange();
            }, this);

        },

        saveUIState : function() {
            var aSelectedAlerts = this.getSelectedAlerts(true);
            var oState = {
                selectedAlerts : aSelectedAlerts
            };
            this.UI_STATE_UTILS.putUIState(this.uiStateId, oState);
        },

        getFilterBar : function() {
            return this.getView().byId("vsdFilterBar");
        },

        showFilterBar : function(visible) {
            this.getFilterBar().setVisible(visible);
        },

        getFilterBarText : function() {
            return (this.getFilterBar().getVisible() ? this.getView().byId("vsdFilterLabel").getText() : "");
        },

        setFilterBarText : function(text) {
            this.getView().byId("vsdFilterLabel").setText(text);
        },

        getFilterInputIdsOfFilterBar : function() {
            return [ "patternFilterInput", "PatternNamespaceFilterInput", "patternTypeFilterInput", "statusFilterInput", "severityFilterInput", "attackFilterInput", "measureContextFilterInput",
                    "caConfidentialityFilterInput", "caSystemDataIntegrityFilterInput", "caBusinessDataIntegrityFilterInput", "caAvailabilityFilterInput", "saConfidentialityFilterInput",
                    "saSystemDataIntegrityFilterInput", "saBusinessDataIntegrityFilterInput", "saAvailabilityFilterInput" ];
        },

        getSelectedFilterKeysFromFilterBar : function() {
            return this.getSelectedFilterItemsFromFilterBar().map(function(oSelectedFilterItem) {
                var o = {};
                o[oSelectedFilterItem.filterValue] = true;

                return o;
            });
        },

        getSelectedFilterItemsFromFilterBar : function() {
            var aSelectedFilterItems = [];

            var aFilterInputIds = this.getFilterInputIdsOfFilterBar();

            // build a mapping of filter input to i18n-Label to build the filter
            // string
            // build a mapping of filter input to its filter values
            aFilterInputIds.forEach(function(sFilterInputId) {
                var oCurrentFilterInput = this.byId(sFilterInputId);

                for (var i = 0; i < oCurrentFilterInput.getCustomData().length; i++) {
                    if (oCurrentFilterInput.getCustomData()[i].getKey() === "urlParamName") {
                        var path = oCurrentFilterInput.getCustomData()[i].getValue();

                        if (oCurrentFilterInput.getTokens) {
                            oCurrentFilterInput.getTokens().forEach(function(oToken) {
                                aSelectedFilterItems.push({
                                    path : path,
                                    filterValue : oToken.getKey()
                                });
                            });
                        } else if (oCurrentFilterInput.getSelectedKeys) {
                            oCurrentFilterInput.getSelectedKeys().forEach(function(sKey) {
                                aSelectedFilterItems.push({
                                    path : path,
                                    filterValue : sKey
                                });
                            });
                        }
                    }
                }
            }, this);

            return aSelectedFilterItems;
        },

        applyFiltersAndSorter : function(oFiltersAndSorter, bNoTimeRefresh) {
            var aFilters = oFiltersAndSorter.filters || this.getAlertFilters() || [];
            var oSorter = oFiltersAndSorter.sorter;

            FilterSortUtil.applyFiltersAndSorterToTable(this.getAlertsTable(), aFilters, oSorter, bNoTimeRefresh, "AlertCreationTimestamp");

            this.setAlertFilters(aFilters);
            this.navToWithAggregatedParameters(this.getRouteName());
        },

        applySelectedFilterItemsToFilterBar : function(aSelectedFilterItems) {
            var aFilters = aSelectedFilterItems.map(function(oSelectedFilterItem) {
                return {
                    sPath : oSelectedFilterItem.path,
                    oValue1 : oSelectedFilterItem.filterValue
                };
            });

            this.applyFiltersToFilterBar(aFilters, true, true);
        },

        applyFiltersToFilterBar : function(aFilters, noTextUpdate, noFilterText) {
            if ($.isArray(aFilters)) {
                var aFilterInputIds = this.getFilterInputIdsOfFilterBar();
                var mFilterInputToFilters = {};
                var mFilterInputToI18NKey = {};
                var aVisibleFilterGroupItemIds = [];

                // build a mapping of filter input to i18n-Label to build the filter
                // string
                // build a mapping of filter input to its filter values
                aFilters.forEach(function(oFilter) {
                    var sPath = oFilter.sPath;
                    if (!sPath) {
                        return;
                    }

                    var oCurrentFilterInput;
                    var sCurrentFilterInputId;
                    var bFilterInputUsable;
                    var i, j;

                    for (i = 0; i < aFilterInputIds.length; i++) {
                        sCurrentFilterInputId = aFilterInputIds[i];
                        oCurrentFilterInput = this.byId(sCurrentFilterInputId);
                        bFilterInputUsable = false;

                        if (oCurrentFilterInput) {
                            for (j = 0; j < oCurrentFilterInput.getCustomData().length; j++) {
                                if (oCurrentFilterInput.getCustomData()[j].getKey() === "urlParamName") {
                                    if (oCurrentFilterInput.getCustomData()[j].getValue() === sPath) {
                                        var aFilterValueIds = mFilterInputToFilters[sCurrentFilterInputId];
                                        if (!aFilterValueIds) {
                                            aFilterValueIds = [];
                                            mFilterInputToFilters[sCurrentFilterInputId] = aFilterValueIds;
                                        }
                                        aFilterValueIds.push(oFilter.oValue1);
                                        bFilterInputUsable = true;
                                        break;
                                    }
                                }
                            }

                            if (bFilterInputUsable) {
                                oCurrentFilterInput.getCustomData().forEach(function(oCustomData) {
                                    if (oCustomData.getKey() === "i18nText") {
                                        mFilterInputToI18NKey[sCurrentFilterInputId] = oCustomData.getValue();
                                    } else if (oCustomData.getKey() === "filterItem") {
                                        aVisibleFilterGroupItemIds.push(oCustomData.getValue());
                                    }
                                });
                            }

                        }
                    }
                }, this);

                // initial visibility of advanced area
                if (!this.filterBarInitialized) {
                    aVisibleFilterGroupItemIds.forEach(function(sFilterGroupItemId) {
                        this.byId(sFilterGroupItemId).setVisibleInAdvancedArea(true);
                    }, this);

                    if (aVisibleFilterGroupItemIds.length > 0) {
                        this.byId("filterBar").setExpandAdvancedArea(true);
                    }

                    this.filterBarInitialized = true;
                }

                // map the filters to tokens of corresponding filter input
                aFilterInputIds.forEach(function(sFilterInputId) {
                    var oCurrentFilterInput = this.byId(sFilterInputId);

                    if (oCurrentFilterInput.clearSelection) {
                        oCurrentFilterInput.clearSelection();
                    } else if (oCurrentFilterInput.removeAllTokens) {
                        oCurrentFilterInput.removeAllTokens();
                    }
                }, this);
                Object.keys(mFilterInputToFilters).forEach(function(sFilterInputId) {
                    var oCurrentFilterInput = this.byId(sFilterInputId);
                    var aNewTokens;
                    if (oCurrentFilterInput.setSelectedKeys) {
                        oCurrentFilterInput.setSelectedKeys(mFilterInputToFilters[sFilterInputId]);
                    } else if (oCurrentFilterInput.setTokens) {
                        if (sFilterInputId === "patternFilterInput") {
                            var aWorkspacePatterns = this.getComponent().getModel("Patterns").getData().WorkspacePatterns;
                            aNewTokens = [];

                            aWorkspacePatterns.forEach(function(oWorkspacePattern) {
                                var i;
                                var sPatternId;
                                for (i = 0; i < mFilterInputToFilters[sFilterInputId].length; i++) {
                                    sPatternId = mFilterInputToFilters[sFilterInputId][i];

                                    if (this.oCommons.base64ToHex(oWorkspacePattern.Id) === sPatternId) {
                                        aNewTokens.push(new sap.m.Token({
                                            key : sPatternId,
                                            text : oWorkspacePattern.Name
                                        }));
                                        break;
                                    }
                                }
                            }, this);
                        }
                        oCurrentFilterInput.destroyTokens();
                        oCurrentFilterInput.setTokens(aNewTokens);
                    }
                }, this);

                // build filter string
                //
                if (noTextUpdate !== true) {

                    var sText = this.getText("MAlertsFS_FilterBarPrefix").concat(" ");

                    Object.keys(mFilterInputToFilters).forEach(function(sFilterInputId, nIndex) {
                        if (nIndex > 0) {
                            sText += ", ";
                        }

                        var sFilterString = "";
                        var oFilterInput = this.byId(sFilterInputId);
                        if (oFilterInput.getSelectedItems) {
                            oFilterInput.getSelectedItems().forEach(function(oSelectedItem, nIndex) {
                                if (nIndex > 0) {
                                    sFilterString += ", ";
                                }
                                sFilterString += oSelectedItem.getText();
                            });
                        } else if (oFilterInput.getTokens) {
                            oFilterInput.getTokens().forEach(function(oToken, nIndex) {
                                if (nIndex > 0) {
                                    sFilterString += ", ";
                                }
                                sFilterString += oToken.getText();
                            });
                        }

                        sText += mFilterInputToI18NKey[sFilterInputId] + " (" + sFilterString + ")";
                    }, this);

                    this.setFilterBarText(sText);
                }
                if (noFilterText !== true) {
                    this.showFilterBar(aFilters.length > 0);
                } else {
                    this.showFilterBar(false);
                }

            } else {
                this.showFilterBar(false);
            }
        },

        extractQueryObjectFromFilterBar : function() {
            // construct a mapping of filter input id to url param name
            if (!this.filterInputToUrParam) {
                this.filterInputToUrParam = {};

                var oParamMapper = this.newUrlParameterMappings();

                this.getFilterInputIdsOfFilterBar().forEach(function(sId) {
                    var aCustomData = this.getView().byId(sId).getCustomData();
                    var i;

                    for (i = 0; i < aCustomData.length; i++) {
                        if (aCustomData[i].getKey() === "urlParamName") {
                            this.filterInputToUrParam[sId] = oParamMapper.convertFromDBFieldName(aCustomData[i].getValue(), true);
                            break;
                        }
                    }
                }, this);
            }

            var oNewQueryObject = {};

            Object.keys(this.filterInputToUrParam).forEach(function(sFilterInput) {
                var oFilterInput = this.byId(sFilterInput);

                if (sFilterInput === "patternFilterInput") {
                    oFilterInput.getTokens().forEach(function(oToken) {
                        if (!oNewQueryObject[this.filterInputToUrParam[sFilterInput]]) {
                            oNewQueryObject[this.filterInputToUrParam[sFilterInput]] = [];
                        }
                        oNewQueryObject[this.filterInputToUrParam[sFilterInput]].push(oToken.getKey());
                    }, this);
                } else {
                    oFilterInput.getSelectedKeys().forEach(function(sKey) {
                        if (!oNewQueryObject[this.filterInputToUrParam[sFilterInput]]) {
                            oNewQueryObject[this.filterInputToUrParam[sFilterInput]] = [];
                        }
                        oNewQueryObject[this.filterInputToUrParam[sFilterInput]].push(sKey);
                    }, this);
                }

            }, this);

            return oNewQueryObject;
        },

        newUrlParameterMappings : function() {
            return new sap.secmon.ui.m.commons.UrlParameterMappings(ServiceConstants.ALERTS_SERVICE);
        },

        applySorting : function(sId, bDescending) {
            this.getAlertsTableFixed().getColumns().forEach(function(oColumn) {
                if (oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn) {
                    if (oColumn.getSortProperty() === sId) {
                        oColumn.setSorted(true);
                        oColumn.setSortOrder(bDescending ? SortOrder.Descending : SortOrder.Ascending);
                    } else {
                        oColumn.setSorted(false);
                    }
                }
            });
        },

        retrieveSorting : function() {
            var aColumns = this.getAlertsTableFixed().getColumns();

            for (var i = 0; i < aColumns.length; i++) {
                if (aColumns[i] instanceof sap.secmon.ui.m.commons.controls.SortableColumn && aColumns[i].getSorted()) {
                    return {
                        id : this.newUrlParameterMappings().convertFromDBFieldName(aColumns[i].getSortProperty()),
                        descending : (aColumns[i].getSortOrder() === sap.secmon.ui.m.commons.controls.SortOrder.Descending)
                    };
                }
            }
        },

        onApplyTimeFilter : function() {
            this.dateTimeFilter = this._retrieveDateTimeFilter(true);

            if (this.dateTimeFilter) {
                this.lastActiveDateTimeSelection = this.getDateTimeHandler().getSelectionAsObject();
                this.getDateTimeHandler().reset();
                this.getDateTimeHandler().selectFromObject(this.lastActiveDateTimeSelection);

                this.getDateTimeSelectionDialog().close();
            }
        },

        onCloseTimeFilterDialog : function() {
            if (this.lastActiveDateTimeSelection) {
                this.getDateTimeHandler().reset();
                this.getDateTimeHandler().selectFromObject(this.lastActiveDateTimeSelection);
            }
            this.getDateTimeSelectionDialog().close();
        },

        onSearch : function() {
            this.saveUIState();
            this.navToWithAggregatedParameters(this.getRouteName());
        },

        onReset : function() {
            this.applyFiltersToFilterBar([]);
            var oNewQueryParameters = {};
            this.extendQueryParameterFromTableSorting(oNewQueryParameters);
            var oSelectionAsObject = this.getDateTimeHandler().getDefaultSelectionAsObject();
            Object.keys(oSelectionAsObject).map(function(key) {
                oSelectionAsObject[key] = encodeURIComponent(oSelectionAsObject[key]);
            });
            oNewQueryParameters = $.extend(true, oNewQueryParameters, oSelectionAsObject);
            oNewQueryParameters.uistate = this.uiStateId;

            // The router has a "feature" not to dispatch to event handlers if
            // neither route nor query parameters have changed.
            // In order to force navigation, we add a parameter with new value each
            // time.
            oNewQueryParameters.lastNav = this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

            this.navTo(this.getRouteName(), {
                query : oNewQueryParameters
            }, true);
        },

        onShowDateTimeDialog : function() {
            this.lastActiveDateTimeSelection = this.getDateTimeHandler().getSelectionAsObject();
            this.getDateTimeSelectionDialog().open();
        },

        getDateTimeSelectionDialog : function() {
            if (!this.dateTimeDialog) {
                this.dateTimeDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionDialog", this);
                this.getView().addDependent(this.dateTimeDialog);
            }
            // toggle compact style
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.dateTimeDialog);

            return this.dateTimeDialog;
        },

        getDateTimeHandler : function() {
            if (!this.dateTimeHandler) {
                this.dateTimeHandler = new DateTimeSelectionHelper(this.getView());
            }

            return this.dateTimeHandler;
        },

        _getDateTimeTextFromTimeRange : function(aTimeRange, bForFilterBar) {
            var sFormat;
            var sNewTitle;

            if (!bForFilterBar || !this.getDateTimeHandler().isRelative()) {
                if (aTimeRange.length === 2) {
                    sFormat = this.getCommonText("ConsTimeRangeFT_LBL");
                    sNewTitle = CFormatter.timeRangeFormatterEx(this.UTC, sFormat, aTimeRange[0], aTimeRange[1]);
                } else {
                    sFormat = this.getCommonText("ConsTimeRangeFR_LBL");
                    sNewTitle = this.i18nText(sFormat, CFormatter.dateFormatterEx(this.UTC, aTimeRange[0]));
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

        /**
         * Retrieve date time filters from date time control. With side-effect: Set panel of date time control.
         */
        _retrieveDateTimeFilter : function(bActive) {
            var aTimeRange = this.getDateTimeHandler().getTimeRangeUnderConsideration();
            if (aTimeRange) {
                var oFilter;

                var sNewTitle = this._getDateTimeTextFromTimeRange(aTimeRange, true);

                if (aTimeRange.length === 2) {
                    oFilter = new sap.ui.model.Filter({
                        path : "AlertCreationTimestamp",
                        operator : sap.ui.model.FilterOperator.BT,
                        value1 : aTimeRange[0],
                        value2 : aTimeRange[1]
                    });
                } else {
                    oFilter = new sap.ui.model.Filter({
                        path : "AlertCreationTimestamp",
                        operator : sap.ui.model.FilterOperator.GE,
                        value1 : aTimeRange[0]
                    });
                }

                this.getView().byId("dateTimeFilterInput").setValue(sNewTitle);

                return {
                    filters : [ oFilter ],
                    sorter : null
                };
            } else {
                if (bActive) {
                    MessageBox.alert(this.getCommonText("InvalidRange_MSG"), {
                        styleClass : !sap.ui.Device.phone ? "sapUiSizeCompact" : "",
                        title : this.getCommonText("Error_TIT")
                    });
                } else {
                    this.getView().byId("dateTimeFilterInput").setValue("");
                }

                return null;
            }
        },

        onPatternValueHelpRequest : function(oEvent) {
            var patternInput = oEvent.getSource();

            if (!this.patternSelectDialog) {
                this.patternSelectDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.commons.patternSuggestion.PatternSelectDialog", this);
                // set growing threshold to same size as patterns model in
                // EtdComponent which is 5000
                this.patternSelectDialog.setGrowingThreshold(this.getComponent().getModel("Patterns").iSizeLimit || 5000);
                this.getView().addDependent(this.patternSelectDialog);
            }
            // toggle compact style
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.patternSelectDialog);

            // mark selected items
            this.patternSelectDialog.getItems().forEach(function(oItem) {
                var sPatternId;
                for (var i = 0; i < oItem.getCustomData().length; i++) {
                    if (oItem.getCustomData()[i].getKey() === "patternId") {
                        sPatternId = this.oCommons.base64ToHex(oItem.getCustomData()[i].getValue());
                        break;
                    }
                }

                if (sPatternId) {
                    if (patternInput.getTokens().some(function(oToken) {
                        return oToken.getKey() === sPatternId;
                    })) {
                        oItem.setSelected(true);
                    } else {
                        oItem.setSelected(false);
                    }
                }
            }, this);
            this.patternSelectDialog.getBinding("items").filter([]);
            this.patternSelectDialog.open();
        },

        onSearchPatternSelectDialog : function(oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([ oFilter ]);
        },

        onConfirmPatternSelectDialog : function(oEvent) {
            var aContexts = oEvent.getParameter("selectedContexts");

            var aNewSelectedPatternFilterItems = aContexts.map(function(oContext) {
                return {
                    path : "PatternId",
                    filterValue : this.oCommons.base64ToHex(oContext.getObject().Id)
                };
            }, this);

            var aSelectedFilterItemsForFilterBar = this.getSelectedFilterItemsFromFilterBar().filter(function(oSelectedFilterItem) {
                return oSelectedFilterItem.path !== "PatternId";
            }).concat(aNewSelectedPatternFilterItems);

            this.applySelectedFilterItemsToFilterBar(aSelectedFilterItemsForFilterBar);
            this.getView().byId("patternFilterInput").focus();
        },

        handleSuggestionItemSelected : function(oEvent) {
            sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper.handleSuggestionItemSelected.call(this, oEvent);
        },

        onPatternSuggest : function(oEvent) {
            PatternSuggestionHelper.handleSuggest.call(this, oEvent);
        },

        onAfterRendering : function() {
            // update number of alerts in title each time data is available
            var oBinding = this.getAlertsTable().getBinding("items");
            oBinding.getModel().setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
            oBinding.getModel().attachRequestCompleted(function() {
                if (!this.getComponent()) {
                    // after a navigation (e.g. to newly created investigation)
                    // there is no need to update alert UI as the view is not
                    // displayed anyway
                    // (that's why it does not have an embedding component!)
                    return;
                }
                this.uiModel.setProperty("/alertsCount", oBinding.getLength());
                if (this.getAlertsTableFixed().updateSelectAllCheckbox) {
                    this.getAlertsTableFixed().updateSelectAllCheckbox();
                }
            }, this);

            // 'enter'-event on a filter input triggers a search when the current
            // input is empty (no value for suggestion is available)
            if (!this.filterInputItemsEnhanced) {
                var aFilterInputItems = this.getFilterInputIdsOfFilterBar().map(function(sId) {
                    return this.getView().byId(sId);
                }.bind(this));

                OnSapEnterEnhancer.enhance(aFilterInputItems, function(sVal) {
                    if (sVal === "") {
                        this.onSearch();
                    }
                }, this);
                this.filterInputItemsEnhanced = true;
            }

            // modify selectAll-behaviour of table
            if (!this.alertsTableFixedUpdated) {
                var alertsTable = this.getAlertsTable();
                var alertsTableFixed = this.getAlertsTableFixed();

                alertsTableFixed.updateSelectAllCheckbox = function() {

                    // checks if the list is in multi select mode and has selectAll
                    // checkbox
                    if (alertsTableFixed._selectAllCheckBox && this.getMode() === "MultiSelect") {
                        var aItems = alertsTable.getItems(), iSelectedItemCount = alertsTable.getSelectedItems().length, iSelectableItemCount = aItems.filter(function(oItem) {
                            return oItem.isSelectable();
                        }).length;

                        // set state of the checkbox by comparing item length and
                        // selected item length
                        alertsTableFixed._selectAllCheckBox.setSelected(aItems.length > 0 && iSelectedItemCount === iSelectableItemCount);
                    }
                };
                var origFnOnItemSelectedChange = alertsTable.onItemSelectedChange;

                alertsTable.onItemSelectedChange = function() {
                    origFnOnItemSelectedChange.apply(this, arguments);
                    jQuery.sap.delayedCall(0, this, function() {
                        alertsTableFixed.updateSelectAllCheckbox();
                    });
                };

                alertsTableFixed.selectAll = function() {
                    alertsTable.selectAll.apply(alertsTable, arguments);
                };
                alertsTableFixed.removeSelections = function() {
                    alertsTable.removeSelections.apply(alertsTable, arguments);
                };

                this.alertsTableFixedUpdated = true;
            }
        },

        getAlertsTable : function() {
            this.alertsTable = this.alertsTable || this.getView().byId("alertsTable");
            return this.alertsTable;
        },

        getAlertsTableFixed : function() {
            this.alertsTableFixed = this.alertsTableFixed || this.getView().byId("alertsTableFixed");
            return this.alertsTableFixed;
        },

        getAlertGraph : function() {
            this.graphView = this.graphView || sap.ui.xmlview("sap.secmon.ui.m.alertsfs.view.AlertGraph");
            return this.graphView;
        },

        getSystemLocationView : function() {
            this.systemLocationView = this.systemLocationView || sap.ui.xmlview("sap.secmon.ui.m.alertsfs.view.Locations");
            return this.systemLocationView;
        },

        selectAlerts : function(aAlertIds) {
            return sap.secmon.ui.m.commons.SelectionUtils.selectItems(aAlertIds, this.getAlertsTable(), "AlertId");
        },

        startInvestigationFinished : function() {
            this.getView().getModel().refresh();
            this.INV_BUTTONS.forEach(function(id) {
                this.getView().byId(id).setEnabled(false);
            }, this);
        },

        addToInvestigationFinished : function() {
            this.getView().getModel().refresh();
            this.INV_BUTTONS.forEach(function(id) {
                this.getView().byId(id).setEnabled(false);
            }, this);
        },

        handleAlertTextDialogClose : function() {
            this.showAlertTextDialog.close();
        },

        /*
         * helper-function to reduce flickering when one dialog of multiple is displayed again
         */
        closeAndDestroyDialog : function(oDialog) {
            for ( var prop in this) {
                if (this[prop] === oDialog) {
                    oDialog.close();
                    oDialog.destroy();
                    this[prop] = undefined;
                    break;
                }
            }
        },

        updateOfAlertsFinished : function(response, callback) {
            if (response) {
                this.warnOptimisticLock(response);
            }
            this.getAlertsTable().attachEventOnce("updateFinished", function() {
                this.restoreSelection(callback);
            }, this);

            this.getView().getModel().refresh();
        },

        restoreSelection : function(callback) {
            var oTable = this.getAlertsTable();

            if (this.selectedItems) {
                this.selectedItems.forEach(function(oItem) {
                    oTable.setSelectedItem(oItem);
                });
            }
            if (callback) {
                callback.call(this);
            }
        },

        warnOptimisticLock : function(oReturnValue) {
            if (oReturnValue.sqlErrorCode && oReturnValue.sqlErrorCode > 0) {
                // 131: ERR_TX_ROLLBACK_LOCK_TIMEOUT -- transaction rolled back by lock wait timeout
                // 133: ERR_TX_ROLLBACK_DEADLOCK -- transaction rolled back by detected deadlock
                // 146: ERR_TX_LOCK_ACQUISITION_FAIL -- Alert table rows locked (only if option NOWAIT is specified)

                MessageBox.alert(this.getText("MAlertsFS_alrtLock"), {
                    title : this.getText("MAlerts_chgDetected")
                });
            } else if (oReturnValue && oReturnValue.rejectedAlerts && oReturnValue.rejectedAlerts.length > 0) {
                var rejectedAlertCount = oReturnValue.rejectedAlerts.length;

                var totalCount = this.getSelectedContexts().length;
                if (totalCount > 0) {
                    if (totalCount === 1 && rejectedAlertCount === 1) {
                        MessageBox.alert(this.getText("MAlertsFS_alrtChgDetect"), {
                            title : this.getText("MAlerts_chgDetected")
                        });
                    } else {
                        if (totalCount === rejectedAlertCount) {
                            MessageBox.alert(this.getText("MAlertsFS_allChgDetect", totalCount), {
                                title : this.getText("MAlerts_chgDetected")
                            });
                        } else {
                            var acceptedCount = totalCount - rejectedAlertCount;
                            var rejectedLinks = oReturnValue.rejectedAlerts.map(function(oObject) {
                                return {
                                    Text : oObject.Number,
                                    Url : NavigationService.alertURL(oObject.Id, "Comments")
                                };
                            });

                            var oView = this.getView();
                            if (!oView.getModel("messages")) {
                                var oModel = new sap.ui.model.json.JSONModel();
                                oView.setModel(oModel, "messages");
                            }
                            var messagesData = {
                                totalCount : totalCount,
                                acceptedCount : acceptedCount,
                                rejectedCount : rejectedAlertCount,
                                rejectedLinks : rejectedLinks
                            };
                            oView.getModel("messages").setData(messagesData);

                            if (!this._alertsChangedMessageLayout) {
                                this._alertsChangedMessageLayout = sap.ui.xmlfragment("sap.secmon.ui.m.alertsfs.view.AlertsChangedMessage", this);
                                oView.addDependent(this._alertsChangedMessageLayout);
                            }

                            MessageBox.show(this._alertsChangedMessageLayout, {
                                title : this.getText("MAlerts_chgDetected")
                            });

                        }
                    }

                }

            }
        },

        /** Opens the corresponding settings dialog */
        handleGraphSettingsDialogButtonPressed : function(oEvent) {
            var routeName = this.getRouteName();
            if (routeName === this.ROUTES.ALERT_GRAPH || routeName === this.ROUTES.ALERT_GRAPH_SYMBOL) {
                // remember last filter string to detect changes
                this._graphSettingsFilterString = this.getGraphSettingsDialog().getSelectedFilterString();
                this.getGraphSettingsDialog().open();
            }
        },

        /** button click handler to navigate to table view */
        onShowTable : function(oEvent) {
            this.saveUIState();
            this.setRouteName(this.ROUTES.MAIN);
            this.navToWithAggregatedParameters(this.getRouteName());
        },

        /** button click handler to navigate to graph view */
        onShowGraph : function(oEvent) {
            this.saveUIState();
            this.setRouteName(this.ROUTES.ALERT_GRAPH);
            this.navToWithAggregatedParameters(this.getRouteName());
        },

        /** button click handler to navigate to system locations view */
        onShowLocation : function(oEvent) {
            this.saveUIState();
            this.setRouteName(this.ROUTES.SYSTEM_LOCATION);
            this.navToWithAggregatedParameters(this.getRouteName());
        },

        /**
         * Replaces the visible content according to the given Route.
         */
        showViewByRoute : function(sRouteName) {
            var view = this.getView();
            var page = view.byId("page");
            var switchButton = view.byId("switchGraphTable");
            var graphButton = view.byId("showGraphButton");
            var tableButton = view.byId("showTableButton");
            var displayContainer = view.byId("displayContainer");
            var graphSettingsButton = this.getView().byId("graphSettingsButton");
            var graphLegendButton = this.getView().byId("graphLegendButton");
            var locationButton = this.getView().byId("showLocationButton");
            var alertsTable = this.getAlertsTable();
            var alertsTableFixed = this.getAlertsTableFixed();

            alertsTableFixed.setVisible(sRouteName === this.ROUTES.MAIN);
            displayContainer.removeAllContent();

            if (sRouteName === this.ROUTES.MAIN) {

                // select button manually for URL requests:
                switchButton.setSelectedButton(tableButton);
                displayContainer.addContent(alertsTable);
                page.setShowFooter(true);
                graphSettingsButton.setVisible(false);
                graphLegendButton.setVisible(false);
            } else if (sRouteName === this.ROUTES.ALERT_GRAPH || sRouteName === this.ROUTES.ALERT_GRAPH_SYMBOL) {

                var graphView = this.getAlertGraph();
                // dispatch alert filters to alertGraph controller
                graphView.getController().setAlertFilters(this.getAlertFilters());
                displayContainer.addContent(graphView);
                if (sRouteName === this.ROUTES.ALERT_GRAPH_SYMBOL) {
                    graphView.getController().oFilterKeys.color = false;
                    graphView.getController().oFilterKeys.symbol = true;
                    graphView.getController().setGraphFilters(graphView.getController().oFilterKeys);
                    var filter = {
                        color : false,
                        symbol : true
                    };
                    this.adjustGraphFilter(filter);
                }

                // select button manually for URL requests:
                switchButton.setSelectedButton(graphButton);
                page.setShowFooter(false);
                graphSettingsButton.setVisible(true);
                graphLegendButton.setVisible(true);

            } else if (sRouteName === this.ROUTES.SYSTEM_LOCATION) {

                var systemLocationView = this.getSystemLocationView();
                displayContainer.addContent(systemLocationView);

                // select button manually for URL requests:
                switchButton.setSelectedButton(locationButton);
                page.setShowFooter(false);
                graphSettingsButton.setVisible(false);
                graphLegendButton.setVisible(false);

                // dispatch alert filters to locations controller
                systemLocationView.getController().setAlertFilters(this.getAlertFilters(), this.nAlertNumber);
            }
        },

        /**
         * Trigger bookmarking of current alert filter selection. The bookmark points to the alerts FS URL with current selection parameters.
         * 
         * @param oEvent
         */
        handleBookmarkDialogButtonPressed : function(oEvent) {
            var oParameters = {};
            this.extendQueryParameterFromTableSorting(oParameters);
            this.extendQueryParameterFromFilterBar(oParameters);
            var oSelectionAsObject = this.getDateTimeHandler().getSelectionAsObject();
            Object.keys(oSelectionAsObject).map(function(key) {
                oSelectionAsObject[key] = encodeURIComponent(oSelectionAsObject[key]);
            });
            oParameters = $.extend(true, oParameters, oSelectionAsObject);
            oParameters.doNotEncode = true;
            var sTitle = this.getText("MBookmark_AlertsXLBL");
            this.oBookmarkCreator.showBookmarkCreationDialog(this.getView(), sTitle, oParameters);
        },

        /**
         * Open a popup to send an email containing a URL. The URL points to the alerts FS with current selection parameters.
         * 
         * @param oEvent
         */
        handleEmailButtonPressed : function(oEvent) {
            var sFilterDescr = this.getFilterBarText();
            // The document URL might not reflect the parameters from view settings.
            // We need to explicitly set the URL parameters.
            var oParameters = {};
            this.extendQueryParameterFromTableSorting(oParameters);
            this.extendQueryParameterFromFilterBar(oParameters);
            var oSelectionAsObject = this.getDateTimeHandler().getSelectionAsObject();
            Object.keys(oSelectionAsObject).map(function(key) {
                oSelectionAsObject[key] = encodeURIComponent(oSelectionAsObject[key]);
            });
            oParameters = $.extend(true, oParameters, oSelectionAsObject);
            oParameters.doNotEncode = true;
            var sURL = TileURLUtils.createURLWithParams(oParameters);
            var sBody = this.getText("AlertEmail_BodyXMSG") + "\n" + sURL + "\n" + sFilterDescr;
            var sSubject = this.getText("AlertEmail_SubjectXMSG");
            sap.m.URLHelper.triggerEmail('', sSubject, sBody);
        },

        extendQueryParameterFromTableSorting : function(oParameters) {
            var oSorting = this.retrieveSorting();

            if (oSorting) {
                oParameters.orderBy = oSorting.id;
                oParameters.orderDesc = oSorting.descending;
            }
        },

        getGraphSettingsDialog : function() {
            if (!this.graphSettingsDialog) {
                this.graphSettingsDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.alertsfs.view.GraphSettingsDialog", this);
                this.getView().addDependent(this.graphSettingsDialog);
            }
            // toggle compact style
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.graphSettingsDialog);

            return this.graphSettingsDialog;
        },

        handleSort : function(oEvent) {
            var oParameters = oEvent.getParameters();
            var oSortedColumn = oParameters.column;
            var sortOrder = oParameters.sortOrder;

            var sSortProperty = oSortedColumn.getSortProperty();
            var bSortDesc = (sortOrder === SortOrder.Descending);

            this.getAlertsTableFixed().getColumns().forEach(function(oColumn) {
                if (oColumn !== oSortedColumn) {
                    if (oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn) {
                        oColumn.setSorted(false);
                    }
                }
            });
            oSortedColumn.setSorted(true);
            oSortedColumn.setSortOrder(sortOrder);

            var oSorter = new sap.ui.model.Sorter(sSortProperty, bSortDesc);
            this.noTimeRefresh = true;
            this.applyFiltersAndSorter({
                sorter : oSorter
            }, true);

            // for some reasons this is needed to prevent the table from scrolling
            // down a bit
            var page = this.byId("page");
            page.scrollTo(0, 1);
        },

        /**
         * The reset method is needed because the graph settings are different than other settingdialogs. The graphsettingdialog has initially one graph type selected and all nodes are visible. The
         * default resetFilter routine deselects everything.
         */
        handleResetGraphSettingsFilter : function(oEvent) {
            var graphView = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.alertsfs.view.GraphSettingsDialog", this);
            this.getGraphSettingsDialog().setSelectedFilterKeys(graphView.getSelectedFilterKeys());
        },

        handleGraphSettingsConfirm : function(oEvent) {
            if (oEvent.getParameter("filterString") === this._graphSettingsFilterString) {
                // nothing changed
                return;
            }

            // dispatch settings to the responsible controller
            this.getAlertGraph().getController().handleGraphSettingsConfirm(oEvent);

            // adapt possible route changes
            if (oEvent.getParameter("filterKeys").color === true) {
                this.setRouteName(this.ROUTES.ALERT_GRAPH);
                this._suppressNextRefresh = true;
                this.navToWithAggregatedParameters(this.getRouteName());
            } else if (oEvent.getParameter("filterKeys").symbol === true) {
                this.setRouteName(this.ROUTES.ALERT_GRAPH_SYMBOL);
                this._suppressNextRefresh = true;
                this.navToWithAggregatedParameters(this.getRouteName());
            }
        },

        /**
         * Do a navigation and add URL parameters from date time control and view settings.
         * 
         * @param sRouteName
         *            the route name as configured in components.js
         */
        navToWithAggregatedParameters : function(sRouteName) {
            var oNewQueryParameters = {};
            this.extendQueryParameterFromTableSorting(oNewQueryParameters);
            this.extendQueryParameterFromFilterBar(oNewQueryParameters);
            var oSelectionAsObject = this.getDateTimeHandler().getSelectionAsObject();
            Object.keys(oSelectionAsObject).map(function(key) {
                oSelectionAsObject[key] = encodeURIComponent(oSelectionAsObject[key]);
            });
            oNewQueryParameters = $.extend(true, oNewQueryParameters, oSelectionAsObject);
            oNewQueryParameters.uistate = this.uiStateId;

            // The router has a "feature" not to dispatch to event handlers if
            // neither route nor query parameters have changed.
            // In order to force navigation, we add a parameter with new value each
            // time.
            oNewQueryParameters.lastNav = this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

            this.navTo(sRouteName, {
                query : oNewQueryParameters
            }, true);
        },

        /** setter for current alert filter */
        setAlertFilters : function(aFilters) {
            this.alertFilters = aFilters;
        },

        /** getter for current alert filter */
        getAlertFilters : function() {
            return this.alertFilters;
        },

        extendQueryParameterFromFilterBar : function(oNewQueryParameters) {
            var oQueryParametersFromFilterBar = this.extractQueryObjectFromFilterBar();
            Object.keys(oQueryParametersFromFilterBar).forEach(function(sKey) {
                var aConvertedArray = oQueryParametersFromFilterBar[sKey].map(function(sKey) {
                    return encodeURIComponent(sKey);
                }).join(",");
                oNewQueryParameters[sKey] = aConvertedArray;
            });
        },

        onInvestigationClicked : function(oEvent) {
            this.saveUIState();
            var alertIdBase64 = oEvent.getSource().getBindingContext().getProperty("AlertId");
            var alertId = this.oCommons.base64ToHex(alertIdBase64);
            sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                target : {
                    semanticObject : "AlertDetails",
                    action : "show"
                },
                params : {
                    alert : alertId,
                    tab : "Investigations"
                }
            });
        },

        onPatternClicked : function(oEvent) {
            this.saveUIState();
            var sPatternIdBase64 = oEvent.getSource().getBindingContext().getProperty("PatternId");
            var sPatternId = this.oCommons.base64ToHex(sPatternIdBase64);
            var patternType = oEvent.getSource().getBindingContext().getProperty("PatternType");
            NavigationService.navigateToPattern(sPatternId, patternType);
        },

        onCheckForChange : function(oEvent) {
            var that = this;

            var aOldSelectedItems = this.getArrayOfSelectedAlertsWithHashes();

            var callback = function() {
                var newSelectedItems = that.getArrayOfSelectedAlertsWithHashes();
                if (newSelectedItems && newSelectedItems.length > 0) {
                    var changedAlerts = newSelectedItems.filter(function(oNewAlert) {
                        var newId = oNewAlert.AlertId;
                        var newHash = oNewAlert.AlertHashCode;
                        return aOldSelectedItems.some(function(oOldAlert) {
                            var oldId = oOldAlert.AlertId;
                            var oldHash = oOldAlert.AlertHashCode;
                            return newHash !== oldHash && newId === oldId;
                        });
                    });
                    that.warnOfChanges(aOldSelectedItems.length, changedAlerts);
                }
            };

            this.updateOfAlertsFinished(null, callback);
        },

        /**
         * open a warning popup if the number of changed alerts is >0
         */
        warnOfChanges : function(totalCount, changedObjects) {
            var that = this, selIdBase64;
            if (changedObjects && changedObjects.length > 0) {

                var deselectFunction = function(action) {
                    if (action === MessageBox.Action.YES) {
                        var oTable = that.getAlertsTable();
                        var aSelectedItems = oTable.getSelectedItems();
                        aSelectedItems.forEach(function(selItem) {
                            selIdBase64 = selItem.getBindingContext().getProperty("AlertId");
                            if (changedObjects.some(function(oChange) {
                                return selIdBase64 === oChange.AlertIdBase64;
                            })) {
                                oTable.setSelectedItem(selItem, false);
                            }
                        });
                    }
                };
                var changedCount = changedObjects.length;
                if (totalCount === changedCount) {
                    MessageBox.alert(this.getText("MAlertsFS_allChgDetect", totalCount), {
                        title : this.getText("MAlerts_chgDetected"),
                        actions : [ MessageBox.Action.YES, MessageBox.Action.NO ],
                        initialFocus : MessageBox.Action.YES,
                        defaultAction : MessageBox.Action.YES,
                        onClose : deselectFunction
                    });
                } else {
                    var changedLinks = changedObjects.map(function(oObject) {
                        return {
                            Text : oObject.Number,
                            Url : NavigationService.alertURL(oObject.AlertId, "Comments")
                        };
                    });

                    var oView = this.getView();
                    if (!oView.getModel("messages")) {
                        var oModel = new sap.ui.model.json.JSONModel();
                        oView.setModel(oModel, "messages");
                    }
                    var messagesData = {
                        totalCount : totalCount,
                        changedCount : changedCount,
                        changedLinks : changedLinks
                    };
                    oView.getModel("messages").setData(messagesData);

                    if (!this._alertsChangedMessageLayout) {
                        this._alertsChangedMessageLayout = sap.ui.xmlfragment("sap.secmon.ui.m.alertsfs.view.AlertsChangedMessage", this);
                        oView.addDependent(this._alertsChangedMessageLayout);
                    }

                    MessageBox.show(this._alertsChangedMessageLayout, {
                        title : this.getText("MAlerts_chgDetected"),
                        actions : [ MessageBox.Action.YES, MessageBox.Action.NO ],
                        initialFocus : MessageBox.Action.YES,
                        defaultAction : MessageBox.Action.YES,
                        onClose : deselectFunction
                    });

                }
            }
        },

        onAlertClicked : function(oEvent) {
            this.saveUIState();
            var alertIdBase64 = oEvent.getSource().getBindingContext().getProperty("AlertId");
            var alertId = this.oCommons.base64ToHex(alertIdBase64);
            sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                target : {
                    semanticObject : "AlertDetails",
                    action : "show"
                },
                params : {
                    alert : alertId
                }
            });
        },

        onNavBack : function() {
            window.history.go(-1);
        },

        /**
         * Navigate to next route by the given name.
         * 
         * @param sRouteName
         *            name of existing route
         * @param oParameters
         *            parameters object. The parameters object may contain parameters with a single value or multiple values (arrays). Alternatively, multiple values may be encoded in a
         *            comma-separated string.A String values must be URL encoded via enocdeURIComponent. (Background: A string will be automatically encoded by router.navTo via encodeURI. This means
         * that a few special characters ("; / ? : @ & = + $") must be manually encoded with encodeURIComponent.) In the special case that multiple values are encoded in a comma-separated string, each
         *            single value must be URL encoded with encodeURIComponent.
         * @param bNoEntryInBrowserHistory
         *            if true, the browser history is not changed to new hash.
         * @throws assert
         * if the parameters contain special characters like "; / ? : @ & = + $". Note that the comma is allowed. Additionally, we check if white space is contained (blank, new line, carriage return,
         *             tab, backspace, form feed).
         */
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

        /** Toggles the legend visibility of the alert graph */
        handleShowGraphLegendPress : function() {
            this.getAlertGraph().getController().setShowLegend(!this.getAlertGraph().getController().getShowLegend());
        },

        onPressHelp : function(oEvent) {
            var oButton = oEvent.getSource();

            // singleton
            if (!this._helpMenu) {
                this._helpMenu = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.alertsfs.view.HelpMenu", this);
                this.getView().addDependent(this._helpMenu);

                // toggle compact style
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._helpMenu);
            }
            var eDock = sap.ui.core.Popup.Dock;
            this._helpMenu.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);
        },

        onPressHelpAlertsList : function(oEvent) {
            window.open("/sap/secmon/help/8dfc4b5486334918a88a7c373b6595f0.html");
        },

        onPressHelpThreatSituation : function(oEvent) {
            window.open("/sap/secmon/help/b46f9a28a6af4cf2bc27b3f06481c172.html");
        },

        onNavigateById: function () {
            var oAlertInput = this.getView().byId("inputAlertId");
            var sAlertNumber = oAlertInput.getValue();
            if (/\d+$/.test(sAlertNumber)) {
                var oModel = this.getView().getModel();
                var sServiceUrl = "/Alerts";
                oModel.read(sServiceUrl, {
                    filters: [new sap.ui.model.Filter({ path: 'Number', operator: 'EQ', value1: sAlertNumber })],
                    success: function (oData, response) {
                        if (!!oData.results.length) {
                            var sAlertDetailUrl = sap.secmon.ui.m.commons.NavigationService.alertURL(oData.results[0].AlertId);
                            window.location = sAlertDetailUrl;
                        } else {
                            oAlertInput.setValueState(sap.ui.core.ValueState.Error);
                        }
                    },
                    error: function () {
                        oAlertInput.setValueState(sap.ui.core.ValueState.Error);
                    }.bind(this)
                });
            } else {
                oAlertInput.setValueState(sap.ui.core.ValueState.Error);
            }
        }
    });
});
