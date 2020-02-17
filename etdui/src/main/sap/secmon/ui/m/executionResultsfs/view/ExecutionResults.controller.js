jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.executionResultsfs.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.SelectionUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.BookmarkCreator");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.executionResultsfs.util.VizChartHelper");
jQuery.sap.require("sap.ui.core.UIComponent");
jQuery.sap.require("sap.m.MessageBox");
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.executionResultsfs.view.ExecutionResults", {

    QUBE_SEARCH_SERVICE_URL : "/sap/secmon/services/ui/m/QubeSearch.xsodata/QubeSearch?$format=json&search=",
    DEFAULT_ORDER_BY : "executionTimestamp",
    DEFAULT_ORDER_DESC : true,
    CHARTS : {
        RunCountLineChart: "RunCountLineChart",
        Timechart: "Timechart",
        AlertChart: "AlertChart",
        AlertPerPatternChart: "AlertPerPatternChart",
        AlertRunCount: "AlertRunCount",
        NameChart: "NameChart",
        NewChart: "NewChart",
        RuntimeToAlertCount: "RuntimeToAlertCount",
        StatusRunCount: "StatusRunCount"
    },

    /**
     * @memberOf sap.secmon.ui.m.executionResultsfs.view.ExecutionResults
     */
    onInit : function() {
        this.getDateTimeSelectionDialog();
        this.applyCozyCompact();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.oBookmarkCreator = new sap.secmon.ui.m.commons.BookmarkCreator();
        this.oVizChartHelper = sap.secmon.ui.m.executionResultsfs.util.VizChartHelper;
        this.oVizChartHelper.setController(this);
        var fnNavigation = function() {
            this.navToWithAggregatedParameters("main");
        };
        sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "executionResultsTable", sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE, fnNavigation, [
                "patternFilterInput", "resultStatusFilterInput", "executionModeFilterInput", "patternNamespaceFilterInput", "dateTimeFilterInput" ], [ this.getComponent().getModel(),
                this.getComponent().getModel("workspacePatterns") ]);
        this.setVizProperties();
        sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(this.onRouteMatched, this);
        this.uiModel = new sap.ui.model.json.JSONModel({
            chartsVisible : false
        });
        this.getView().setModel(this.uiModel, "uiModel");
    },

    onAfterRendering : function() {
        this.attachTableCountListener();        
    },

    _scaleDimension: function(oDataset, sText, sInterval, sMeasures){
        oDataset.interval = sInterval;
        oDataset.removeAllDimensions();

        var sPath = sInterval === "days" ? 'Day' : sInterval === "hours" ? "Hour" : "Minute";
        oDataset.insertDimension(new sap.viz.ui5.data.DimensionDefinition({
            name: sText,
            value: {
                path: sPath,
                formatter: function(day) {
                    if (!day){
                        return null;
                    }
                    switch (sInterval){
                        case "days" : return day.toISOString().substr(0, 10);
                        case "hours" : return day.getUTCHours() + ":" + (day.getUTCMinutes()+"0").substring(0,2);
                        case "minutes":
                            var sMinutes = (day.getUTCMinutes() + "").length === 1 ? "0" + day.getUTCMinutes() : day.getUTCMinutes() + ""; 
                            return day.getUTCHours() + ":" + sMinutes;
                    }
                }
            }
        }),0);
        oDataset.bindData({
            path : '/Result',
            parameters : {
                select : sPath+ ',' + sMeasures
            },
            sorter : {
                path : sPath, descending : false
            }
        });
    },
    setVizDataset: function() {
        var sInterval = "days";
        if (this.getDateTimeHandler().from){
            var iMin = (this.getDateTimeHandler().to - this.getDateTimeHandler().from) / 60000;
            sInterval = iMin < 60 ? "minutes" : iMin <= 24*60 ? "hours" : "days";
        }

        var chart = this.getView().byId(this.CHARTS.RunCountLineChart);
        var oDataset = chart.getDataset();
        if (oDataset.interval !== sInterval){
            this._scaleDimension(oDataset, this.getText("Day_NUM"), sInterval, "RunCount");
        }

        chart = this.getView().byId(this.CHARTS.Timechart);
        oDataset = chart.getDataset();
        if (oDataset.interval !== sInterval){
            this._scaleDimension(oDataset, this.getText("Day_NUM"), sInterval, "TotalRuntime");
        }

        chart = this.getView().byId(this.CHARTS.AlertChart);
        oDataset = chart.getDataset();
        if (oDataset.interval !== sInterval){
            this._scaleDimension(oDataset, this.getText("Day_NUM"), sInterval, "NumberOfNewAlerts");
        }

        chart = this.getView().byId(this.CHARTS.RuntimeToAlertCount);
        oDataset = chart.getDataset();
        if (oDataset.interval !== sInterval){
            oDataset.interval = sInterval;
            oDataset.removeMeasure(0);

            var sPath = sInterval === "days" ? 'Day' : sInterval === "hours" ? "Hour" : "Minute";
            oDataset.insertMeasure(new sap.viz.ui5.data.MeasureDefinition({
                name: this.getText("Day_NUM"),
                value: {
                    path: sPath,
                    formatter: function(day) {
                        return day ? day.getTime() : null;
                    }
                }
            }),0);
            oDataset.bindData({
                path : '/Result',
                parameters : {
                    select: 'DayNumber,' + sPath + ',' + "PatternName,TotalRuntime,PatternDefinitionId,RunCount"
                }
            });
        }
    },
    setVizProperties : function() {
        var chart = this.getView().byId(this.CHARTS.RunCountLineChart);
        chart.setVizProperties(this.oVizChartHelper.generateVizPropertiesBarChart({
            xAxis : {
                type : "categoryAxis",
                title : "DayTit"
            },
            yAxis : {
                type : "valueAxis",
                title : "NumberOfRuns"
            }
        }, "RunCountChartXTIT"));
        chart = this.getView().byId(this.CHARTS.Timechart);
        chart.setVizProperties(this.oVizChartHelper.generateVizPropertiesBarChart({
            xAxis : {
                type : "categoryAxis",
                title : "DayTit"
            },
            yAxis : {
                type : "valueAxis",
                title : "RuntimeYAxis"
            }
        }, "RuntimeChartXTIT"));
        chart = this.getView().byId(this.CHARTS.AlertChart);
        chart.setVizProperties(this.oVizChartHelper.generateVizPropertiesBarChart({
            xAxis : {
                type : "categoryAxis",
                title : "DayTit"
            },
            yAxis : {
                type : "valueAxis",
                title : "NumberOfAlerts"
            }
        }, "AlertChartXTIT"));
        chart = this.getView().byId(this.CHARTS.AlertPerPatternChart);
        chart.setVizProperties(this.oVizChartHelper.generateVizPropertiesBarChart({
            xAxis : {
                type : "categoryAxis",
                title : "PatternName"
            },
            yAxis : {
                type : "valueAxis",
                title : "NumberOfAlerts"
            }
        }, "AlertChartXTIT"));
        chart = this.getView().byId(this.CHARTS.AlertRunCount);
        chart.setVizProperties(this.oVizChartHelper.generateVizPropertiesBarChart({
            xAxis : {
                type : "categoryAxis",
                title : "PatternName"
            },
            yAxis : {
                type : "valueAxis",
                title : "NumberOfRuns"
            }
        }, "NumberOfRunsXTIT"));
        chart = this.getView().byId(this.CHARTS.NameChart);
        chart.setVizProperties(this.oVizChartHelper.generateVizPropertiesBarChart({
            xAxis : {
                type : "categoryAxis",
                title : "PatternName"
            },
            yAxis : {
                type : "valueAxis",
                title : "RuntimeYAxis"
            }
        }, "RuntimePatternXTIT"));
        chart = this.getView().byId(this.CHARTS.NewChart);

        chart.setVizProperties(this.oVizChartHelper.generateVizPropertiesBubleChart({
            xAxis : {
                type : "valueAxis",
                title : "NumberOfAlerts"
            },
            yAxis : {
                type : "valueAxis2",
                title : "NumberOfRuns"
            }
        }, "RunCountVsNewAlertsTit"));

        this.oVizChartHelper.connectPopoverToChart(chart, "popOver-NewChart");
        chart = this.getView().byId(this.CHARTS.RuntimeToAlertCount);
        chart.setVizProperties(this.oVizChartHelper.generateVizPropertiesBubleChart({
            xAxis : {
                type : "valueAxis",
                title : "DayTit"
            },
            yAxis : {
                type : "valueAxis2",
                title : "NumberOfRuns"
            }
        }, "DistribOfRunCountsTit"));
        this.oVizChartHelper.connectPopoverToChart(chart, "popOver-RuntimeToAlertCount");
        chart = this.getView().byId(this.CHARTS.StatusRunCount);
        var vizProperty = this.oVizChartHelper.generateVizPropertiesBarChart({
            xAxis : {
                type : "categoryAxis",
                title : "PatternName"
            },
            yAxis : {
                type : "valueAxis",
                title : "NumberOfAlerts"
            }
        }, "PatternStatusTit", [ {
            dataContext : [ {
                ResultStatus : {
                    equal : "Error"
                }
            } ],
            color : 'sapUiChartPaletteSemanticBad'
        }, {
            dataContext : [ {
                ResultStatus : {
                    equal : "OK"
                }
            } ],
            color : "sapUiChartPaletteSemanticGood"
        } ]);
        vizProperty.plotArea.dataLabel.visible = true;
        chart.setVizProperties(vizProperty);
    },
    navToWithAggregatedParameters : function(sRouteName) {
        var oNewQueryParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oNewQueryParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oNewQueryParameters, [ "patternFilterInput" ]);

        var oSelectionAsObject = this.getDateTimeHandler().getSelectionAsObject();
        Object.keys(oSelectionAsObject).map(function(key) {
            oSelectionAsObject[key] = encodeURIComponent(oSelectionAsObject[key]);
        });
        oNewQueryParameters = $.extend(true, oNewQueryParameters, oSelectionAsObject);

        // The router has a "feature" not to dispatch to event handlers if
        // neither route nor query parameters have changed.
        // In order to force navigation, we add a parameter with new value each
        // time.
        oNewQueryParameters.lastNav = this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

        sap.ui.core.UIComponent.getRouterFor(this).navTo("main", {
            query : oNewQueryParameters
        }, true);
    },

    /**
     * Row was selected. Navigates to execution result.
     */
    onItemPress : function(oEvent) {
        // move focus from clicked line to whole container to allow auto scrolling to top
        this.getTableScrollContainer().focus();
        var sExecutionResultId = oEvent.getSource().getBindingContext().getProperty("Id");
        sExecutionResultId = this.oCommons.base64ToHex(sExecutionResultId);
        sap.ui.core.UIComponent.getRouterFor(this).navTo("executionResult", {
            id : sExecutionResultId,
        });
        // scroll to the first row position as on returning back we should see the rows from the first
        this.getTableScrollContainer()._oScroller.setVertical(false);
        this.getTableScrollContainer()._oScroller.scrollTo(0, 0, 300);
    },
    onSelect : function(oEvent) {
        var data = oEvent.getSource().vizSelection();
        var filters = data.map(function(selectedBar) {
            return {
                path : "PatternDefinitionId.Id",
                filterValue : selectedBar.data.PatternDefinitionId
            };
        });
        this.addPatternFilterToFilterBar(filters);
        if (data.length > 0) {
            sap.m.MessageToast.show(this.getText("PatternAddedToFilter", data.map(function(selectedBar) {
                return selectedBar.data.PatternName;
            }).join(",")));
        }
    },
    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    getTable : function() {
        return this.getView().byId("executionResultsTable");
    },

    getTableScrollContainer : function() {
        return this.getView().byId("tableScrollContainer");
    },

    onRouteMatched : function(oEvent) {
        if (oEvent.getParameter("name") !== "main") {
            return;
        }

        // enable vertical scrolling if it was disabled on purpose
        if (this.getTableScrollContainer()._oScroller.getVertical() === false) {
            this.getTableScrollContainer()._oScroller.setVertical(true);
        }

        var oArguments = oEvent.getParameter("arguments");
        var oQueryObject = oArguments["?query"] ? oArguments["?query"] : {};

        var queryExtractor = new sap.secmon.ui.m.commons.QueryExtractor(sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE,
            this.DEFAULT_ORDER_BY, this.DEFAULT_ORDER_DESC);
        var oSorter = queryExtractor.extractSorter(oQueryObject);
        var aFilters = queryExtractor.extractFilters(oQueryObject);

        var oDecodedParams = {};
        //if we came from PatternExecution24 hours tile => set up configs
        if (oQueryObject.ageInHours) {
            jQuery.extend(oQueryObject, {
                timeLast: "24",
                timeSelectionType: "relative",
                timeType: "hours"
            });
        }
        Object.keys(oQueryObject).map(function (key) {
            if (jQuery.sap.startsWith(key, "time")) {
                oDecodedParams[key] = decodeURIComponent(oQueryObject[key]);
            }
        });

        sap.secmon.ui.m.commons.FilterBarHelper.applySorting.call(this, oSorter.sPath, oSorter.bDescending);
        sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersToFilterBar.call(this, aFilters);

        this.getDateTimeHandler().selectFromObject(oDecodedParams);
        this.dateTimeFilter = this._retrieveDateTimeFilter();
        // concatenate the filter from view settings and date time
        // control
        if (this.dateTimeFilter && this.dateTimeFilter.filters && this.dateTimeFilter.filters.length > 0) {
            aFilters = aFilters.concat(this.dateTimeFilter.filters);
            var aTimeRange = this.getDateTimeHandler().getTimeRangeUnderConsideration(false);
            var sNewTitle = this._getDateTimeTextFromTimeRange(aTimeRange);
            this.uiModel.setProperty("/timeRange", sNewTitle);
        }

        sap.secmon.ui.m.commons.FilterBarHelper.setFilters.call(this, aFilters);
        
        // apply the filter and sorter
        sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersAndSorter.call(this, {
            filters : aFilters,
            sorter : oSorter
        });
        this.setVizDataset();
        this.setFiltersForChart(aFilters);
    },

    /**
     * Attaches a listener to the table binding to update the count in the table title after every data receiving.
     */
    attachTableCountListener : function() {
        var controller = this;
        if (!this.fnexecutionsTitle) {
            var oView = this.getView();
            var oBinding = this.getTable().getBinding("items");

            this.fnExecutionsTitle = function() {
                var format = controller.getText("ExecutionResultsTitle");
                var sNewTitle = format + "(" + oBinding.getLength() + ")";
                oView.byId("toolbarOfExecutionResults").setText(sNewTitle);
            };
            oBinding.attachDataReceived(this.fnExecutionsTitle);
        }
    },

    /*
     * In the current implementation for the entities of odata service, used to bind the table, there is a slight difference, regarding the patternID As the entity for the table an sql view is used,
     * it the name for the patternID is took from the name for the field in the table For the charts we use a calculation view (which enables summing up automatically), which does not allow names,
     * with a dot, therefore filters cannot be exchanged directly, but for PatternId we have to replace a filter for the table, by another filter. All other filters can be reused.
     */
    setFiltersForChart : function(aFilters) {
        var aChartFilters = aFilters.map(function(filter) {
            return filter.sPath === "PatternDefinitionId.Id" ?
                new sap.ui.model.Filter({
                    path : "PatternDefinitionId",
                    operator : filter.sOperator,
                    value1 : filter.oValue1,
                    value2 : filter.oValue2,
                    filters : filter.aFilters,
                    and : filter.bAnd,
                    test : filter.fnTest
                })  : filter;
        });
        aChartFilters = aChartFilters ? aChartFilters : [];
        Object.values(this.CHARTS).forEach(function(chartId){
            var binding = this.getView().byId(chartId).getDataset().getBinding("data");
            binding.filter(aChartFilters);
        }.bind(this));
    },

    /**
     * Eventhandler: refreshes list of execution result single view
     */

    handleBookmarkDialogButtonPressed : function(oEvent) {
        var oParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oParameters, [ "patternFilterInput" ]);
        oParameters.doNotEncode = true;

        var sTitle = this.getText("MBookmark_PatternExecXLBL");
        this.oBookmarkCreator.showBookmarkCreationDialog(this.getView(), sTitle, oParameters, "PatternExecution");
    },

    onNavBack : function() {
        window.history.go(-1);
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
                path : "PatternDefinitionId.Id",
                filterValue : this.oCommons.base64ToHex(oContext.getObject().Id)
            };
        }, this);
        this.addPatternFilterToFilterBar(aNewSelectedPatternFilterItems);

    },
    addPatternFilterToFilterBar : function(aFilters) {
        var aSelectedFilterItemsForFilterBar = sap.secmon.ui.m.commons.FilterBarHelper.getSelectedFilterItemsFromFilterBar.call(this).filter(function(oSelectedFilterItem) {
            return oSelectedFilterItem.path !== "PatternDefinitionId.Id";
        }).concat(aFilters);

        sap.secmon.ui.m.commons.FilterBarHelper.applySelectedFilterItemsToFilterBar.call(this, aSelectedFilterItemsForFilterBar, undefined, true);
        this.getView().byId("patternFilterInput").focus();

    },
    handleSuggestionItemSelected : function(oEvent) {
        sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper.handleSuggestionItemSelected.call(this, oEvent);
    },

    onPatternSuggest : function(oEvent) {
        sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper.handleSuggest.call(this, oEvent);
    },

    onPressHelp : function() {
        window.open("/sap/secmon/help/0d6a17a3d4d046d4b1c97c3cc88facfa.html");
    },

    onShowTable : function() { 
        this.uiModel.setProperty("/chartsVisible", false);       
    },

    onShowCharts : function() {
        this.setVizDataset();
        this.uiModel.setProperty("/chartsVisible", true);
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

    onShowDateTimeDialog : function() {
        this.lastActiveDateTimeSelection = this.getDateTimeHandler().getSelectionAsObject();
        this.getDateTimeSelectionDialog().open();
    },

    _getDateTimeTextFromTimeRange : function(aTimeRange, bForFilterBar) {
        var sFormat;
        var sNewTitle;

        if (!bForFilterBar || !this.getDateTimeHandler().isRelative()) {
            if (aTimeRange.length === 2) {
                sFormat = this.getCommonText("ConsTimeRangeFT_LBL");
                sNewTitle = sap.secmon.ui.commons.Formatter.timeRangeFormatter(sFormat, aTimeRange[0], aTimeRange[1]);
            } else {
                sFormat = this.getCommonText("ConsTimeRangeFR_LBL");
                sNewTitle = this.i18nText(sFormat, sap.secmon.ui.commons.Formatter.dateFormatter(aTimeRange[0]));
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
            this.dateTimeHandler = new sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper(this.getView());
        }

        return this.dateTimeHandler;
    },

    _retrieveDateTimeFilter : function(bActive) {
        var aTimeRange = this.getDateTimeHandler().getTimeRangeUnderConsideration();
        if (aTimeRange) {
            var oFilter;

            var sNewTitle = this._getDateTimeTextFromTimeRange(aTimeRange, true);

            if (aTimeRange.length === 2) {
                oFilter = new sap.ui.model.Filter({
                    path : "ExecutionTimeStamp",
                    operator : sap.ui.model.FilterOperator.BT,
                    value1 : aTimeRange[0],
                    value2 : aTimeRange[1]
                });
            } else {
                oFilter = new sap.ui.model.Filter({
                    path : "ExecutionTimeStamp",
                    operator : sap.ui.model.FilterOperator.BT,
                    value1 : aTimeRange[0],
                    value2 : new Date()
                });
            }

            this.getView().byId("dateTimeFilterInput").setValue(sNewTitle);

            return {
                filters : [ oFilter ]
            };
        } else {
            if (bActive) {
                sap.m.MessageBox.alert(this.getCommonText("InvalidRange_MSG"), {
                    styleClass : !sap.ui.Device.phone ? "sapUiSizeCompact" : "",
                    title : this.getCommonText("Error_TIT")
                });
            } else {
                this.getView().byId("dateTimeFilterInput").setValue("");
            }

            return null;
        }
    }

});
