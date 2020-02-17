jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.changelog.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.BookmarkCreator");
jQuery.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.SuggestionHelper");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ClickableElementStyle.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.changelog.view.Changelog", {

    DEFAULT_ORDER_BY : "timestamp",
    DEFAULT_ORDER_DESC : true,
    FILTERBAR_INPUTS : [ "entityTypeFilterInput", "entityOperationFilterInput", "userInput", "entityNamespaceInput", "entityNameFilterInput" ],

    onInit : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.oBookmarkCreator = new sap.secmon.ui.m.commons.BookmarkCreator();
        this.suggestionHelper = new sap.secmon.ui.m.commons.SuggestionHelper("/sap/secmon/services/protocol/protocolService.xsodata/EntityName", false);

        sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(this.onRouteMatched, this);
        this.applyCozyCompact();
        this.getDateTimeSelectionDialog();
        var fnNavigation = function() {
            this.navToWithAggregatedParameters("main");
        };
        sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "changelogTable", sap.secmon.ui.m.commons.ServiceConstants.CHANGELOG_SERVICE, fnNavigation, this.FILTERBAR_INPUTS, [ this
                .getComponent().getModel() ]);
        // do not change time selection caused by relative time selection if sorting occurred
        this.noTimeRefresh = false;
        this.UTC = this.getComponent().getModel("applicationContext").getData().UTC;
    },

    navToWithAggregatedParameters : function(sRouteName) {
        var oNewQueryParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oNewQueryParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oNewQueryParameters, [ "entityNameFilterInput" ]);

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

    onRouteMatched : function(oEvent) {
        if (oEvent.getParameter("name") !== "main") {
            return;
        }

        var that = this;
        var oArguments = oEvent.getParameter("arguments");
        var params = oArguments["?query"];
        var oQueryObject = {};
        if (params) {
            oQueryObject = params;
        } else {
            // case when the UI is called directly without any parameters (over
            // SAP-own tile 'Record of Actions', not a custom tile)

            oQueryObject.orderBy = that.DEFAULT_ORDER_BY;
            oQueryObject.orderDesc = that.DEFAULT_ORDER_DESC;
            oQueryObject = jQuery.extend(true, that.getDateTimeHandler().getDefaultSelectionAsObject(), oQueryObject);
            Object.keys(oQueryObject).map(function(key) {
                if (jQuery.sap.startsWith(key, "time")) {
                    oQueryObject[key] = encodeURIComponent(oQueryObject[key]);
                }
            });
        }

        var queryExtractor = new sap.secmon.ui.m.commons.QueryExtractor(sap.secmon.ui.m.commons.ServiceConstants.CHANGELOG_SERVICE, that.DEFAULT_ORDER_BY, that.DEFAULT_ORDER_DESC);
        var oSorter = queryExtractor.extractSorter(oQueryObject);
        var aFilters = queryExtractor.extractFilters(oQueryObject);

        sap.secmon.ui.m.commons.FilterBarHelper.applySorting.call(this, oSorter.sPath, oSorter.bDescending);
        sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersToFilterBar.call(this, aFilters);

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

        sap.secmon.ui.m.commons.FilterBarHelper.setFilters.call(this, aFilters);

        // Apply the filter and sorter.
        // Caution: This implicitly might call onRouteMatched again, as it calls this.navToWithAggregatedParameters
        sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersAndSorter.call(this, {
            filters : aFilters,
            sorter : oSorter
        });
        this.noTimeRefresh = false;

    },

    getChangelogTable : function() {
        return this.getView().byId("changelogTable");
    },

    handleBookmarkDialogButtonPressed : function(oEvent) {
        var oParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oParameters, [ "entityNameFilterInput" ]);
        oParameters.doNotEncode = true;

        var sTitle = this.getText("MBookmark_ChangelogXLBL");
        this.oBookmarkCreator.showBookmarkCreationDialog(this.getView(), sTitle, oParameters, "Changelog");
    },

    onNavBack : function() {
        window.history.go(-1);
    },

    beforeSort : function() {
        this.noTimeRefresh = true;
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
                    path : "Timestamp", // TODO: change log specific
                    operator : sap.ui.model.FilterOperator.BT,
                    value1 : aTimeRange[0],
                    value2 : aTimeRange[1]
                });
            } else {
                oFilter = new sap.ui.model.Filter({
                    path : "Timestamp", // TODO: change log specific
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
                sap.m.MessageBox.alert(this.getCommonText("InvalidRange_MSG"), {
                    styleClass : !sap.ui.Device.phone ? "sapUiSizeCompact" : "",
                    title : this.getCommonText("Error_TIT")
                });
            } else {
                this.getView().byId("dateTimeFilterInput").setValue("");
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

    onAfterRendering : function() {
        // update number of alerts in title each time data is available
        var oBinding = this.getChangelogTable().getBinding("items");
        oBinding.getModel().setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
        oBinding.getModel().attachRequestCompleted(function() {
            if (!this.getComponent()) {
                // after a navigation (e.g. to newly created investigation)
                // there is no need to update alert UI as the view is not
                // displayed anyway
                // (that's why it does not have an embedding component!)
                return;
            }
            var format = this.getText("RecordsLbl");
            var sNewTitle = this.i18nText(format, oBinding.getLength());
            this.getView().byId("toolbarOfTable").setText(sNewTitle);

        }, this);
    },

    onRecordClicked : function(oEvent) {
        var sRecordIdBase64 = oEvent.getSource().getBindingContext().getProperty("Id");
        var sRecordId = this.oCommons.base64ToHex(sRecordIdBase64);
        sap.ui.core.UIComponent.getRouterFor(this).navTo("record", {
            id : sRecordId,
        });
    },

    onPressHelp : function() {
        window.open("/sap/secmon/help/ada98d94665344a08e92d1bf0e0d602d.html");
    },

    onItemSuggest : function(oEvent) {
        this.suggestionHelper.handleSuggest.call(this, oEvent);
    },

    handleSuggestionItemSelected : function(oEvent) {
        this.suggestionHelper.handleSuggestionItemSelected.call(this, oEvent);
    }

});