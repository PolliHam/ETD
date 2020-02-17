/* globals oTextBundle, oCommonFunctions */
$.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");
$.sap.require("sap.secmon.ui.domainrating.Constants");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.commons.NavigationHelper");
$.sap.require("sap.secmon.ui.commons.AjaxUtil");
$.sap.require("sap.secmon.ui.domainrating.Formatter");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/FilterBarWithSameSizedItems.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ScrollableContainerSize.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.domainrating.domainRating", {

    oRouter : null,
    bUTC : null,
    oConfirmDialog : undefined,
    oNavigationHelper : new sap.secmon.ui.commons.NavigationHelper(3600),
    ROUTES : {
        MAIN : "main",
        DOMAIN_GRAPH : "domainGraph",
        hasRoute : function(sRoute) {
            for ( var prop in this) {
                if (this[prop] === sRoute) {
                    return true;
                }
            }
            return false;
        }
    },
    FILTERSANDSORTERS_DL : {
        VIEW_TYPE : "ViewType",
        TIMERANGE_TYPE : "TimerangeType",
        TIMERANGE_RELATIVE : "TimerangeRelative",
        TIMERANGE_FROM : "TimerangeFrom",
        TIMERANGE_TO : "TimerangeTo",
        DOMAIN : "Domain",
        TOPLEVELDOMAIN : "TopLevelDomain",
        CLASSIFICATION : "Classification",
        IS_CONFIRMED : "IsConfirmed",
        ORDER_BY : "OrderBy",
        ORDER_DESC : "OrderDesc",
        // TYPE : "Type", // indicates whether internal or external
        isSupported : function(sFilter) {
            for ( var prop in this) {
                if (this[prop] === sFilter) {
                    return true;
                }
            }
            return false;
        }
    },

    FILTERSANDSORTERS_WL : {
        VIEW_TYPE : "ViewType",
        DOMAIN : "Domain",
        TOPLEVELDOMAIN : "TopLevelDomain",
        CREATED_BY : "CreatedBy",
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
        var _that = this;
        this.setRouteName(this.ROUTES.MAIN);
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.onRouteMatched, this);

        // Model for domains
        var oModelDomains = new sap.ui.model.json.JSONModel();
        this.getView().setModel(oModelDomains, 'ModelDomains');

        // Model for domain list filters and sorters
        var oModelFiltersAndSortersDL = new sap.ui.model.json.JSONModel();
        this.getView().setModel(oModelFiltersAndSortersDL, 'ModelFiltersAndSorters_DL');

        // Model for whitelist filters and sorters
        var oModelFiltersAndSortersWL = new sap.ui.model.json.JSONModel();
        this.getView().setModel(oModelFiltersAndSortersWL, 'ModelFiltersAndSorters_WL');

        var aClassification = [ {
            key : sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.BENIGN,
            value : this.getText("DA_CL_Benign")
        }, {
            key : sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.MALICIOUS,
            value : this.getText("DA_CL_Malicious")
        } ];

        var aClassificationsFilter = [ {
            key : '',
            value : ''
        }, {
            key : sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.BENIGN,
            value : this.getText("DA_CL_Benign")
        }, {
            key : sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.MALICIOUS,
            value : this.getText("DA_CL_Malicious")
        } ];

        var aIsConfirmedFilter = [ {
            key : '',
            value : ''
        }, {
            key : '0',
            value : this.getText("DA_No")
        }, {
            key : '1',
            value : this.getText("DA_Yes")
        } ];

        this.getView().setModel(new sap.ui.model.json.JSONModel({
            confirmEnabled : false,
            classifications : aClassification,
            selectedClassification : '',
            classificationsFilter : aClassificationsFilter,
            isConfirmedFilter : aIsConfirmedFilter,
            type : false,
            viewType : 'DL',
            scrollHeight : $(window).height() - 286 + "px",
            filterText : "",
            domainWL : "",
            tldWL : ""
        }), "UIModel");

        $(window).resize(function() {
            var oUIModel = _that.getView().getModel("UIModel");
            var oUIModelData = oUIModel.getData();
            oUIModelData.scrollHeight = $(window).height() - 286 + "px";
            oUIModel.setData(oUIModelData);
        });
    },

    getText : function(sTextKey, aValues) {
        return oTextBundle.getText(sTextKey, aValues);
    },

    getDomainTableFixed : function() {
        this.oDomainTableFixed = this.oDomainTableFixed || this.getView().byId("domainRatingTableHeader");
        return this.oDomainTableFixed;
    },

    getDomainTable : function() {
        this.oDomainTable = this.oDomainTable || this.getView().byId("domainRatingTable");
        return this.oDomainTable;
    },

    getDomainGraph : function() {
        this.oDomainGraph = this.oDomainGraph || sap.ui.xmlview("sap.secmon.ui.domainrating.DomainGraph");
        return this.oDomainGraph;
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

    /**
     * Replaces the visible content according to the given Route.
     */
    showViewByRoute : function(sRouteName) {
        var view = this.getView();
        var page = view.byId("page");
        var oSegmentedButton = view.byId("segmentedButton");
        var oGraphButton = view.byId("showGraphButton");
        var oTableButton = view.byId("showTableButton");
        var oDisplayContainer = view.byId("domainViewContainer");
        var oDomainTable = this.getDomainTable();
        var oDomainTableFixed = this.getDomainTableFixed();

        oDomainTableFixed.setVisible(sRouteName === this.ROUTES.MAIN);
        oDisplayContainer.removeAllContent();
        if (sRouteName === this.ROUTES.MAIN) {
            // select button manually for URL requests:
            oSegmentedButton.setSelectedButton(oTableButton);
            oDisplayContainer.addContent(oDomainTable);
            page.setShowFooter(true);
            // graphSettingsButton.setVisible(false);
            // graphLegendButton.setVisible(false);
        } else if (sRouteName === this.ROUTES.DOMAIN_GRAPH) {
            var graphView = this.getDomainGraph();
            oDisplayContainer.addContent(graphView);
            // if (sRouteName === this.ROUTES.ALERT_GRAPH_SYMBOL) {
            // graphView.getController().oFilterKeys.color = false;
            // graphView.getController().oFilterKeys.symbol = true;
            // graphView.getController().setGraphFilters(graphView.getController().oFilterKeys);
            // var filter = {
            // color : false,
            // symbol : true
            // };
            // this.adjustGraphFilter(filter);
            // }

            // select button manually for URL requests:
            oSegmentedButton.setSelectedButton(oGraphButton);
            page.setShowFooter(false);
            // graphSettingsButton.setVisible(true);
            // graphLegendButton.setVisible(true);

        }
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
        var sViewType;
        // direct call without parameters
        if (Object.keys(params).length === 0 || (Object.keys(params).length === 1 && Object.keys(params)[0] === "lastNav")) {
            // set default parameters depending on view type
            sViewType = this.getView().getModel("UIModel").getProperty("/viewType");
            var oNewQueryParams = {};
            oNewQueryParams.ViewType = sViewType;
            oNewQueryParams.OrderDesc = true;
            if (sViewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.DOMAINLIST) {
                var oFiltersAndSortersDataDL = this.getView().getModel("ModelFiltersAndSorters_DL").getData();
                if (oFiltersAndSortersDataDL.hasOwnProperty() === false) {
                    oNewQueryParams.Timestamp = "Timestamp";
                    oNewQueryParams.TimerangeType = "relative";
                    oNewQueryParams.TimerangeRelative = "lastHour";
                }
            } else if (sViewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.WHITELIST) {
                var oFiltersAndSortersDataWL = this.getView().getModel("ModelFiltersAndSorters_WL").getData();
                if (oFiltersAndSortersDataWL.hasOwnProperty() === false) {
                    oNewQueryParams.OrderBy = "CreatedTimestamp";
                }
            }

            // store the parameters in the URL and navigate to this URL
            // this leads to a call of "onRouteMatched" again but next time
            // with parameters
            that.navTo(that.getRouteName(), {
                query : oNewQueryParams
            }, true);
        } else {
            // sorter and filter
            var oData = {}, oFiltersAndSorters;
            sViewType = params.ViewType;
            if (sViewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.DOMAINLIST) {
                oFiltersAndSorters = this.FILTERSANDSORTERS_DL;
            } else if (sViewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.WHITELIST) {
                oFiltersAndSorters = this.FILTERSANDSORTERS_WL;
            }
            Object.keys(oFiltersAndSorters).map(function(key) {
                if (key !== 'isSupported') {
                    oData[oFiltersAndSorters[key]] = (params[oFiltersAndSorters[key]] === undefined ? null : decodeURIComponent(params[oFiltersAndSorters[key]]));
                }
            });
            // set data of model FilterAndSorterValues to update UI
            this.getView().getModel("ModelFiltersAndSorters_" + sViewType).setData(oData);
            // show filter
            this.getView().getModel("UIModel").setProperty("/filterText", this.getFilterText());
            // set view type
            this.getView().getModel("UIModel").setProperty("/viewType", sViewType);
            this.getView().byId("segmentedButton").setSelectedButton(
                    this.getView().byId(sViewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.WHITELIST ? "showWhiteListButton" : "showDomainListButton"));

            // get data from backend
            this.refreshData();
            // this.showViewByRoute(that.getRouteName());

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
        var oNewQueryParameters = {}, sValue, sViewType;
        sViewType = this.getView().getModel("UIModel").getProperty("/viewType");
        // get Filters via Model
        var oModel = this.getView().getModel("ModelFiltersAndSorters_" + sViewType);
        var oModelData = oModel.getData();
        Object.keys(oModelData).map(function(key) {
            if (oModelData[key]) {
                sValue = encodeURIComponent(oModelData[key]);
                oNewQueryParameters[key] = sValue;
            }
        });
        // The router has a "feature" not to dispatch to event handlers if
        // neither route nor query parameters have changed.
        // In order to force navigation, we add a parameter with new value each
        // time.
        oNewQueryParameters.lastNav = oCommonFunctions.formatDateToYyyymmddhhmmssUTC(new Date());

        this.navTo(sRouteName, {
            query : oNewQueryParameters
        }, true);
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    handleUpdateFinished : function(oEvent) {
        this.setCount();
    },

    setCount : function() {
        var oList = this.getDomainTable();
        var count = oList.getBinding("items").getLength();
        var viewType = "DA_ViewType" + this.getView().getModel("UIModel").getProperty("/viewType");
        var sTitle = this.getView().getModel("i18n").getProperty(viewType) + " (" + count + ")";
        this.getView().byId("page").setTitle(sTitle);
    },

    onShowTimerangeDialog : function(oEvent) {
        this.getTimerangeDialog().open();
    },

    onCloseTimerangeDialog : function(oEvent) {
        this.getTimerangeDialog().close();
    },

    getTimerangeDialog : function() {
        if (!this.oTimerangeDialog) {
            this.oTimerangeDialog = sap.ui.xmlfragment("sap.secmon.ui.commons.timerangeFilterDialog", this);
            this.getView().addDependent(this.oTimerangeDialog);
        }
        return this.oTimerangeDialog;
    },

    onCloseTimeRangeFilterDialog : function(oEvent) {
        if (oEvent.getParameter("id") === "ok") {
            var oData = this.getTimerangeDialog().getContent()[0].getModel().getData();
            var isTimerangeRelative = this.getTimerangeDialog().getContent()[0].getModel("UIModel").getData().isLastEditable;
            var oModel = this.getView().getModel("ModelFiltersAndSorters_DL");
            var oModelData = oModel.getData();
            if (isTimerangeRelative === true) {
                oModelData.TimerangeType = "relative";
                oModelData.TimerangeRelative = oData.selectedRelativeTimeRange;
                oModelData.TimerangeFrom = null;
                oModelData.TimerangeTo = null;
            } else {
                oModelData.TimerangeType = "absolute";
                oModelData.TimerangeRelative = null;
                oModelData.TimerangeFrom = oData.selectedAbsoluteDateFrom.toISOString();
                oModelData.TimerangeTo = oData.selectedAbsoluteDateTo.toISOString();
            }
            oModel.setData(oModelData);
            oModel.refresh(true);
        }
        this.onCloseTimerangeDialog();
    },

    onPressShowGraph : function(oEvent) {
        this.setRouteName(this.ROUTES.DOMAIN_GRAPH);
        this.navToWithAggregatedParameters(this.getRouteName());
    },

    onPressShowProcessedDomains : function(oEvent) {
        // update UIModel
        this.getDomainTable().removeSelections(true);
        this.onSelectionChange();
        this.getView().getModel("UIModel").setProperty("/viewType", "DL");
        this.setRouteName(this.ROUTES.MAIN);
        this.navToWithAggregatedParameters(this.getRouteName());
    },

    onPressShowWhitelistedDomains : function(oEvent) {
        // update UIModel
        this.getDomainTable().removeSelections(true);
        this.onSelectionChange();
        this.getView().getModel("UIModel").setProperty("/viewType", "WL");
        this.setRouteName(this.ROUTES.MAIN);
        this.navToWithAggregatedParameters(this.getRouteName());
    },

    onConfirmDomainSorting : function(oEvent) {
        var oTable = this.getDomainTable();
        var mParams = oEvent.getParameters();
        var oBinding = oTable.getBinding("items");
        var aSorters = [];

        // apply sorter
        var sPath = mParams.sortItem.getKey();
        var bDescending = mParams.sortDescending;
        aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
        oBinding.sort(aSorters);
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
        var sURL, sValue, sViewType;
        this.getView().setBusy(true);
        sViewType = this.getView().getModel("UIModel").getProperty("/viewType");
        var oFiltersAndSortersModel = this.getView().getModel("ModelFiltersAndSorters_" + sViewType);
        var oFiltersAndSortersData = oFiltersAndSortersModel.getData();
        Object.keys(oFiltersAndSortersData).map(function(key) {
            if (oFiltersAndSortersData[key]) {
                sValue = encodeURIComponent(oFiltersAndSortersData[key]);
                if (sURL) {
                    sURL = sURL + '&' + key + '=' + sValue;
                } else {
                    sURL = sap.secmon.ui.domainrating.Constants.C_DOMAIN_RATING_PATH + '?' + key + '=' + sValue;
                }
            }
        });
        // load data
        var oModel = this.getView().getModel("ModelDomains");
        oModel.loadData(sURL, null, true);
        this.getView().setBusy(false);
        if (this.getView().getModel("UIModel").getProperty("/viewType") === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.WHITELIST) {
            this.reportSuccess(this.getText("DA_RefreshWL"));
        } else {
            this.reportSuccess(this.getText("DA_RefreshD"));
        }
    },

    getFilterText : function() {
        var that = this;
        var sFilterText;
        if (this.bUTC === null) {
            this.bUTC = this.getView().getModel("applicationContext").getProperty("/UTC");
        }
        var sViewType = this.getView().getModel("UIModel").getProperty("/viewType");
        var oModel = this.getView().getModel("ModelFiltersAndSorters_" + sViewType);
        var oModelData = oModel.getData();
        Object.keys(oModelData).map(
                function(key) {
                    var sText = "";
                    if (oModelData[key]) {
                        switch (key) {
                        case sap.secmon.ui.domainrating.Constants.C_FILTERS_AND_SORTERS.TIMERANGE_TYPE:
                            var sTime =
                                    sap.secmon.ui.domainrating.Formatter.formatTimerange(that.bUTC, that.getCommonText("ConsTimeRangeFT_LBL"), oModelData[key],
                                            oModelData[sap.secmon.ui.domainrating.Constants.C_FILTERS_AND_SORTERS.TIMERANGE_RELATIVE], new Date(
                                                    oModelData[sap.secmon.ui.domainrating.Constants.C_FILTERS_AND_SORTERS.TIMERANGE_FROM]), new Date(
                                                    oModelData[sap.secmon.ui.domainrating.Constants.C_FILTERS_AND_SORTERS.TIMERANGE_TO]));
                            sText = that.getText("DA_Timerange") + ' = ' + sTime;
                            break;
                        case sap.secmon.ui.domainrating.Constants.C_FILTERS_AND_SORTERS.DOMAIN:
                            if (sViewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.DOMAINLIST) {
                                sText = that.getText("DA_DomainName") + ' like ' + '"' + oModelData[key] + '"';
                            } else if (sViewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.WHITELIST) {
                                sText = that.getText("DA_DomainName") + ' = ' + '"' + oModelData[key] + '"';
                            }

                            break;
                        case sap.secmon.ui.domainrating.Constants.C_FILTERS_AND_SORTERS.TOPLEVELDOMAIN:
                            sText = that.getText("DA_TLD") + ' = ' + oModelData[key];
                            break;
                        case sap.secmon.ui.domainrating.Constants.C_FILTERS_AND_SORTERS.CLASSIFICATION:
                            if (oModelData[key] === sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.BENIGN) {
                                sText = that.getText("DA_Classification") + ' = ' + that.getText("DA_CL_Benign");
                            } else if (oModelData[key] === sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.MALICIOUS) {
                                sText = that.getText("DA_Classification") + ' = ' + that.getText("DA_CL_Malicious");
                            }
                            break;
                        case sap.secmon.ui.domainrating.Constants.C_FILTERS_AND_SORTERS.IS_CONFIRMED:
                            if (oModelData[key] === true || oModelData[key] === 1 || oModelData[key] === "1") {
                                sText = that.getText("DA_IsConfirmed") + ' = ' + that.getText("DA_Yes");
                            } else if (oModelData[key] === false || oModelData[key] === 0 || oModelData[key] === "0") {
                                sText = that.getText("DA_IsConfirmed") + ' = ' + that.getText("DA_No");
                            }
                            break;
                        case sap.secmon.ui.domainrating.Constants.C_FILTERS_AND_SORTERS.CREATED_BY:
                            sText = that.getText("DA_CreatedBy") + ' = ' + oModelData[key];
                            break;
                        }
                    }
                    if (sText) {
                        if (sFilterText) {
                            sFilterText = sFilterText + "; " + sText;
                        } else {
                            sFilterText = sText;
                        }
                    }

                });
        return sFilterText;
    },
    onSearch : function(oEvent) {
        this.navToWithAggregatedParameters(this.getRouteName());
    },

    onSelectionChange : function(oEvent) {
        this.getView().getModel("UIModel").setProperty("/confirmEnabled", (this.getDomainTable().getSelectedItems().length > 0));
    },

    onPressHelp : function(oEvent) {
        // open help=> Docu UUID required

    },
    onDeleteWL : function(oEvent) {
        var that = this;
        var aSelectedItems = this.getDomainTable().getSelectedItems();
        var oModel = this.getView().getModel("ModelDomains");
        var aDomains = [], oDomain = {};
        for (var i = 0; i < aSelectedItems.length; i++) {
            oDomain = oModel.getProperty(aSelectedItems[i].getBindingContext("ModelDomains").getPath());
            aDomains.push({
                Domain : oDomain.Domain,
                TopLevelDomain : oDomain.TopLevelDomain
            });
        }
        var fnDelete = function(action) {
            if (action === sap.m.MessageBox.Action.DELETE) {
                that.getView().setBusy(true);
                var oPayload = {
                    Operation : "DELETE_WL",
                    Domains : aDomains
                };

                new sap.secmon.ui.commons.AjaxUtil().postJson(sap.secmon.ui.domainrating.Constants.C_DOMAIN_RATING_PATH, JSON.stringify(oPayload)).done(function(response, textStatus, XMLHttpRequest) {
                    that.getView().setBusy(false);
                    that.refreshData();
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    that.getView().setBusy(false);
                    that.reportError(jqXHR.responseText);
                });
            }
        };

        sap.m.MessageBox.show(this.getText("DA_DeleteConfirm"), {
            icon : sap.m.MessageBox.Icon.WARNING,
            title : this.getText("DA_Delete"),
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : fnDelete
        });

    },

    handleSort : function(oEvent) {
        var oTable = this.getDomainTable();
        var oHeader = this.getDomainTableFixed();
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

    _updateDomains : function() {
        var that = this;
        var aSelectedItems = this.getDomainTable().getSelectedItems();
        var aDomainsB = [], aDomainsM = [];
        var sClassification = this.getView().getModel('UIModel').getProperty("/selectedClassification");
        this.getView().setBusy(true);
        var sType = null;
        if (sClassification === "") {
            that.reportError(that.getText("DA_ClNotSet"));
        } else {

            $.each(aSelectedItems, function(index, element) {
                var oRowData = that.getView().getModel("ModelDomains").getProperty(element.getBindingContext("ModelDomains").getPath());
                if (oRowData.Classification === sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.BENIGN) {
                    aDomainsB.push({
                        Domain : oRowData.Domain,
                        TopLevelDomain : oRowData.TopLevelDomain
                    });
                } else if (oRowData.Classification === sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.MALICIOUS) {
                    aDomainsM.push({
                        Domain : oRowData.Domain,
                        TopLevelDomain : oRowData.TopLevelDomain
                    });
                }
            });
            var oPayload = {
                Operation : "UPDATE_DL",
                Classification : sClassification,
                Type : sClassification === sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.BENIGN ? sType : null,
                DomainsB : aDomainsB,
                DomainsM : aDomainsM
            };
            new sap.secmon.ui.commons.AjaxUtil().postJson(sap.secmon.ui.domainrating.Constants.C_DOMAIN_RATING_PATH, JSON.stringify(oPayload)).done(function(response, textStatus, XMLHttpRequest) {
                that.getView().setBusy(false);
                that.refreshData();
            }).fail(function(jqXHR, textStatus, errorThrown) {
                that.getView().setBusy(false);
                that.reportError(jqXHR.responseText);
            });
        }
    },
    _updateWhiteList : function() {
        var that = this;
        var oModelData = this.getView().getModel("UIModel").getData();

        var oPayload = {
            Operation : "UPDATE_WL",
            Domain : {
                Domain : oModelData.domainWL,
                TopLevelDomain : oModelData.tldWL
            }
        };
        new sap.secmon.ui.commons.AjaxUtil().postJson(sap.secmon.ui.domainrating.Constants.C_DOMAIN_RATING_PATH, JSON.stringify(oPayload)).done(function(response, textStatus, XMLHttpRequest) {
            that.getView().setBusy(false);
            that.refreshData();
        }).fail(function(jqXHR, textStatus, errorThrown) {
            that.getView().setBusy(false);
            that.reportError(jqXHR.responseText);
        });
    },
    onShowConfirmationDialog : function(oEvent) {
        this.getClassificationDialog().open();
    },

    getClassificationDialog : function() {
        if (!this.oClassificationDialog) {
            this.oClassificationDialog = sap.ui.xmlfragment("Confirmation", "sap.secmon.ui.domainrating.DomainClassificationDialog", this);
            this.getView().addDependent(this.oClassificationDialog);
        }
        return this.oClassificationDialog;
    },
    onCloseConfirmationDialog : function(oEvent) {
        if (oEvent.getParameters().id.endsWith("domainClassificationDialogok")) {
            this._updateDomains();
        }
        this.getClassificationDialog().close();
    },
    onShowCreateWLDialog : function(oEvent) {
        this.getCreateWLDialog().open();
    },
    getCreateWLDialog : function() {
        if (!this.oCreateWLDialog) {
            this.oCreateWLDialog = sap.ui.xmlfragment("Confirmation", "sap.secmon.ui.domainrating.CreateWLDialog", this);
            this.getView().addDependent(this.oCreateWLDialog);
        }
        return this.oCreateWLDialog;
    },
    onCloseCreateWLDialog : function(oEvent) {
        if (oEvent.getParameters().id.endsWith("createWLOk")) {
            this._updateWhiteList();
        }
        this.getCreateWLDialog().close();
    },
    onChangeFilterClassification : function() {
        var oCombo = this.getView().byId("filterClassification");
        oCombo.setValueState("None");
        if (oCombo.getSelectedKey() !== sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.BENIGN &&
                oCombo.getSelectedKey() !== sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.MALICIOUS && oCombo.getSelectedKey() !== "") {
            oCombo.setValueState("Error");
            return;
        }
        this.getView().getModel("ModelFiltersAndSorters_DL").setProperty("/Classification", oCombo.getSelectedKey());
    },
    onChangeFilterIsConfirmed : function() {
        var oCombo = this.getView().byId("filterIsConfirmed");
        oCombo.setValueState("None");
        if (oCombo.getSelectedKey() !== "1" && oCombo.getSelectedKey() !== "0" && oCombo.getSelectedKey() !== "") {
            oCombo.setValueState("Error");
            return;
        }
        this.getView().getModel("ModelFiltersAndSorters_DL").setProperty("/IsConfirmed", oCombo.getSelectedKey());
    },
    onShowDomainGraph : function(oEvent) {
        var that = this;
        // get selected domains
        var aSelectedItems = this.getDomainTable().getSelectedItems();
        var oModel = this.getView().getModel("ModelDomains");
        var oTRData = this.getView().getModel("ModelFiltersAndSorters_DL").getData();

        var aDomains = [], oData = {};
        for (var i = 0; i < aSelectedItems.length; i++) {
            var oDomain = oModel.getProperty(aSelectedItems[i].getBindingContext("ModelDomains").getPath());
            aDomains.push({
                Domain : oDomain.Domain,
                TopLevelDomain : oDomain.TopLevelDomain
            });
        }
        oData.TimerangeType = oTRData.TimerangeType;
        oData.TimerangeRelative = oTRData.TimerangeRelative;
        oData.TimerangeFrom = oTRData.TimerangeFrom;
        oData.TimerangeTo = oTRData.TimerangeTo;
        oData.Domains = aDomains;
        // create entry in navigation DB
        this.oNavigationHelper.setNavigation({
            url : sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#DomainRating-show&/analysis/",
            data : {
                data : oData
            }
        }, function(id) {
            var param = {
                nid : id,
                from : null,
                to : null
            };
            sap.ui.core.UIComponent.getRouterFor(that.getView()).navTo("analysis", param, false);
        }, function(error) {
            that.reportError(error);
        });

    },

    onAfterRendering : function() {
        // modify selectAll-behaviour of table => event onSelectionChange is not raised for header table as there are no rows available
        if (!this.tableFixedUpdated) {
            var oTable = this.getDomainTable();
            var oTableFixed = this.getDomainTableFixed();

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