$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.ssm.issn.util.Formatter");
$.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
$.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
$.sap.require("sap.secmon.ui.commons.Formatter");
$.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");
jQuery.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");
sap.ui.define([ 'jquery.sap.global', 'sap/secmon/ui/m/commons/EtdController', 'sap/ui/model/Filter', 'sap/ui/model/Sorter', 'sap/ui/model/json/JSONModel' ], function(jQuery, Controller, JSONModel) {
    "use strict";

    var ImplStatusController =
            Controller.extend("sap.secmon.ui.ssm.issn.ImplStatusOverview", {

                // DEFAULT_ORDER_BY : "procStatus",
                DEFAULT_ORDER_BY : "noteNumber",
                DEFAULT_ORDER_DESC : true,

                oCommons : new sap.secmon.ui.commons.CommonFunctions(),

                onInit : function() {

                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.getRoute("main").attachMatched(this.onRouteMatched, this);

                    this.uiModel = new sap.ui.model.json.JSONModel({
                        noteImplStatusCount : 0
                    });
                    this.getView().setModel(this.uiModel, "uiModel");
                    this.getDateTimeSelectionDialog();
                    var fnNavigation = function() {
                        this._navToWithAggregatedParameters();
                    };
                    var aInputs = this.getFilterInputs();
                    sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "noteImplTable", sap.secmon.ui.m.commons.ServiceConstants.NOTE_IMPLEMENTATION_SERVICE, fnNavigation, aInputs, [ this
                            .getComponent().getModel() ]);
                    
                    this._customHideFiltersButton();
                },

                /**
                 * Called to hide ....
                 * @private
                 */
                _customHideFiltersButton: function(){
                	var oFilterBar = this.getView().byId("filterBar");
                    var oContentToolBar = oFilterBar.getAggregation("content")[0];
                    var oFilterButton = oContentToolBar.getAggregation("content")[2].getAggregation("content")[0].getAggregation("content")[3];           
                    oFilterButton.setVisible(false);
               	
                },
                
                onRouteMatched : function(oEvent) {

                    if (oEvent.getParameter("name") !== "main") {
                        return;
                    }

                    var oArguments = oEvent.getParameter("arguments");

                    var params = oArguments["?query"];
                    var oQueryObject = {};
                    if (params) {
                        // URL contains parameters
                        oQueryObject = params;
                    }

                    var queryExtractor =
                            new sap.secmon.ui.m.commons.QueryExtractor(sap.secmon.ui.m.commons.ServiceConstants.NOTE_IMPLEMENTATION_SERVICE, this.DEFAULT_ORDER_BY, this.DEFAULT_ORDER_DESC);
                    var oSorter = queryExtractor.extractSorter(oQueryObject);
                    var aFilters = queryExtractor.extractFilters(oQueryObject);

                    sap.secmon.ui.m.commons.FilterBarHelper.applySorting.call(this, oSorter.sPath, oSorter.bDescending);
                    sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersToFilterBar.call(this, aFilters);

                    sap.secmon.ui.m.commons.FilterBarHelper.setFilters.call(this, aFilters);
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
                        this.byId("timeRangeLabelInToolbarOfTable").setText(sNewTitle);
                    }
                    // end time range
                    // apply the filter and sorter
                    sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersAndSorter.call(this, {
                        filters : aFilters,
                        sorter : oSorter
                    });
                },

                /** ******************** time range selection ********************* */

                getDateTimeSelectionDialog : function() {
                    if (!this.dateTimeDialog) {
                        this.dateTimeDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionDialog", this);
                        this.getView().addDependent(this.dateTimeDialog);
                    }
                    // toggle compact style
                    jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.dateTimeDialog);

                    return this.dateTimeDialog;
                },

                onShowDateTimeDialog : function() {
                    this.lastActiveDateTimeSelection = this.getDateTimeHandler().getSelectionAsObject();
                    this.getDateTimeSelectionDialog().open();
                },

                getDateTimeHandler : function() {
                    if (!this.dateTimeHandler) {
                        this.dateTimeHandler = new sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper(this.getView());
                    }

                    return this.dateTimeHandler;
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
                                path : "ReleaseOn", // TODO: change log specific
                                operator : sap.ui.model.FilterOperator.BT,
                                value1 : aTimeRange[0],
                                value2 : aTimeRange[1]
                            });
                        } else {
                            oFilter = new sap.ui.model.Filter({
                                path : "ReleaseOn", // TODO: change log specific
                                operator : sap.ui.model.FilterOperator.GE,
                                value1 : aTimeRange[0]
                            });
                        }

                        this.getView().byId("releaseOnFilterInput").setValue(sNewTitle);

                        return {
                            filters : [ oFilter ],
                            sorter : null
                        };
                    } else {
                        if (bActive) {
                            sap.m.MessageBox.alert(this.getCommonText("InvalidRange_MSG"), {
                                styleClass : !sap.ui.Device.phone ? "sapUiSizeCompact" : "",
                                title : this.getCommonText("Error_TIT")
                            });
                        } else {
                            this.getView().byId("releaseOnFilterInput").setValue("");
                        }

                        return null;
                    }
                },

                _getDateTimeTextFromTimeRange : function(aTimeRange, bForFilterBar) {
                    var sFormat;
                    var sNewTitle;

                    if (!bForFilterBar || !this.getDateTimeHandler().isRelative()) {
                        if (aTimeRange.length === 2) {
                            sFormat = this.getCommonText("ConsTimeRangeFT_LBL");
                            sNewTitle = sap.secmon.ui.commons.Formatter.timeRangeFormatterEx(this.UTC, sFormat, aTimeRange[0], aTimeRange[1]);
                        } else {
                            sFormat = this.getCommonText("ConsTimeRangeFR_LBL");
                            sNewTitle = this.i18nText(sFormat, sap.secmon.ui.commons.Formatter.dateFormatterEx(this.UTC, aTimeRange[0]));
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

                onUpdateFinished : function(oEvent) {
                    var count = oEvent.getSource().getBinding("items").getLength();
                    this.uiModel.setProperty("/noteImplStatusCount", count);
                },

                onNavBack : function() {
                    this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
                        window.history.go(-1);
                    });
                },

                onPressHelp : function() {
                    window.open("/sap/secmon/help/04f0836f1e0945ad889816ad68a9d09c.html");
                },

                onLinkPress : function(oEvent) {
                    var oNoteNumber = oEvent.getSource().getText();
                    var href = "https://launchpad.support.sap.com/#/notes/" + oNoteNumber + "";
                    window.open(href, '_blank');
                },

                /**
                 * list of IDS of filter inputs
                 */
                getFilterInputs : function() {
                    return [ "noteNumberFilterInput", "systemIdFilterInput", "systemTypeFilterInput", "impleAutomaticFilterInput", "processStatusFilterInput", "impleStatusFilterInput",
                            "spImpleStatusFilterInput" ];
                },

                _navToWithAggregatedParameters : function() {
                    var oNewQueryParameters = {};
                    sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oNewQueryParameters, []);
                    sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oNewQueryParameters, []);

                    // The router has a "feature" not to dispatch to event handlers if
                    // neither route nor query parameters have changed.
                    // In order to force navigation, we add a parameter with new value each
                    // time.
                    oNewQueryParameters.lastNav = this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

                    this._navTo("main", {
                        query : oNewQueryParameters
                    }, true);
                },

                _navTo : function(routeName, oParams, bReplace) {
                    sap.ui.core.UIComponent.getRouterFor(this).navTo(routeName, oParams, bReplace);
                },
            });
    return ImplStatusController;

});