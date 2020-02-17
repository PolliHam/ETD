jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.SelectionUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.secmon.ui.m.views.pattern.Formatter");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.BookmarkCreator");
jQuery.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.patternfs.view.Patterns", {

    PATTERN_EXECUTOR_URL : "/sap/secmon/services/ui/m/patterns/patterntest.xsjs",
    PATTERN_SCHEDULER_SERVICE_URL : "/sap/secmon/services/ui/m/patterns/patternschedule.xsjs",
    PATTERN_MODIFICATION_SERVICE_URL : "/sap/secmon/services/ui/m/patterns/patternconfig.xsjs",
    QUBE_SEARCH_SERVICE_URL : "/sap/secmon/services/ui/m/QubeSearch.xsodata/QubeDescrSearch?$format=json&search=",
    DEFAULT_ORDER_BY : "openAlertCount",
    DEFAULT_ORDER_DESC : true,
    ACTIVE : "ACTIVE",
    INACTIVE : "INACTIVE",
    TRUE : "TRUE",
    FALSE : "FALSE",
    INDICATOR : "INDICATOR",
    FORENSIC_LAB_PATTERN : "FLAB",
    POSTPROCESSING_COUNT : "0",

    messageUtil : new sap.secmon.ui.commons.GlobalMessageUtil(),

    onInit : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.oBookmarkCreator = new sap.secmon.ui.m.commons.BookmarkCreator();

        // Build local ui model
        this.createUIModel();
        // Receive retention period which is currently set
        this.receiveRetentionPeriod();

        this.applyCozyCompact();
        sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(this.onRouteMatched, this);
        var oTable = this.getPatternsTable();

        oTable.attachUpdateFinished(function(oEvent) {
            // Reset buttons by firing selection change events
            oTable.fireSelectionChange({
                selected : false
            });
        });

        var fnNavigation = function() {
            this.navToWithAggregatedParameters("main");
        };
        sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "patternsTable", sap.secmon.ui.m.commons.ServiceConstants.PATTERNS_SERVICE, fnNavigation, [ "patternFilterInput",
                "patternTypeFilterInput", "statusFilterInput", "executionOutputFilterInput", "testModeFilterInput", "nameSpaceFilterInput", "scenarioFilterInput" ], [ this.getComponent().getModel(),
                this.getComponent().getModel("patternExecutionResult"), this.getComponent().getModel("patternNameSpace") ]);
        this.enableButtonsIfSelectedRowsMatch(oTable, [ "executeButton" ], $.proxy(function(aSelection) {
            if (aSelection.length !== 1) {
                return false;
            }
            return aSelection.every(function(oSelectedItem) {
                return oSelectedItem.getBindingContext().getProperty("PatternType") === this.FORENSIC_LAB_PATTERN;
            }, this);
        }, this));
        this.enableButtonsIfSelectedRowsMatch(oTable, [ "scheduleButton" ], $.proxy(function(aSelection) {
            if (aSelection.length === 0) {
                return false;
            }
            return aSelection.every(function(oSelectedItem) {
                return (oSelectedItem.getBindingContext().getProperty("PatternType") === this.FORENSIC_LAB_PATTERN) && (oSelectedItem.getBindingContext().getProperty("Status") === this.ACTIVE) &&
                        (oSelectedItem.getBindingContext().getProperty("CountScheduledJobs") === this.POSTPROCESSING_COUNT);
            }, this);
        }, this));
        this.enableButtonsIfExactlyOneRowIsSelected(oTable, [ "openButton" ]);
        this.enableButtonsIfSelectedRowsMatch(oTable, [ "activateButton" ], $.proxy(function(aSelection) {
            return aSelection.some(function(oSelectedItem) {
                return oSelectedItem.getBindingContext().getProperty("Status") === this.INACTIVE;
            }, this);
        }, this));
        this.enableButtonsIfSelectedRowsMatch(oTable, [ "deactivateButton" ], $.proxy(function(aSelection) {
            return aSelection.some(function(oSelectedItem) {
                return oSelectedItem.getBindingContext().getProperty("Status") === this.ACTIVE;
            }, this);
        }, this));
        this.enableButtonsIfSelectedRowsMatch(oTable, [ "testOnButton" ], $.proxy(function(aSelection) {
            return aSelection.some(function(oSelectedItem) {
                return oSelectedItem.getBindingContext().getProperty("TestMode") === this.FALSE && oSelectedItem.getBindingContext().getProperty("ExecutionOutput") !== this.INDICATOR;
            }, this);
        }, this));
        this.enableButtonsIfSelectedRowsMatch(oTable, [ "testOffButton" ], $.proxy(function(aSelection) {
            return aSelection.some(function(oSelectedItem) {
                return oSelectedItem.getBindingContext().getProperty("TestMode") === this.TRUE && oSelectedItem.getBindingContext().getProperty("ExecutionOutput") !== this.INDICATOR;
            }, this);
        }, this));

        this.UTC = this.getComponent().getModel("applicationContext").getData().UTC;
    },

    /**
     * Define local model needed to handle validation for datetime selection
     */
    createUIModel : function() {
        this.uiModel = new sap.ui.model.json.JSONModel({
            retentionPeriod : null
        });
        this.getView().setModel(this.uiModel, "uiModel");

    },

    loadResourceBundleText : function(i18nProperty) {
        return this.getView().getModel("i18n").getResourceBundle().getText(i18nProperty);
    },

    /**
     * Fetch days defined as retention period from service and make it available in app by populating ui model
     */
    receiveRetentionPeriod : function() {
        var oModel = this.getComponent().getModel("ConfigurationParameters");
        var uiModel = this.getView().getModel("uiModel");
        oModel.read("/ConfigurationParameters('RetentionPeriod')/ValueInteger", null, null, true, function(oData) {
            uiModel.setProperty("/retentionPeriod", oData.ValueInteger);
        });
    },

    onRouteMatched : function(oEvent) {
        if (oEvent.getParameter("name") !== "main") {
            return;
        }
        var oArguments = oEvent.getParameter("arguments");
        var params = oArguments["?query"];
        var oQueryObject = {};
        if (params) {
            oQueryObject = params;
        }

        var that = this;
        var queryExtractor = new sap.secmon.ui.m.commons.QueryExtractor(sap.secmon.ui.m.commons.ServiceConstants.PATTERNS_SERVICE, that.DEFAULT_ORDER_BY, that.DEFAULT_ORDER_DESC);
        var oSorter = queryExtractor.extractSorter(oQueryObject);
        var aFilters = queryExtractor.extractFilters(oQueryObject, {
            scenarios : sap.ui.model.FilterOperator.Contains
        });

        sap.secmon.ui.m.commons.FilterBarHelper.applySorting.call(this, oSorter.sPath, oSorter.bDescending);
        sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersToFilterBar.call(this, aFilters);

        sap.secmon.ui.m.commons.FilterBarHelper.setFilters.call(this, aFilters);

        // apply the filter and sorter
        sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersAndSorter.call(this, {
            filters : aFilters,
            sorter : oSorter
        });
    },

    getPatternsTable : function() {

        return this.getView().byId("patternsTable");
    },

    getSelectedPattern : function() {
        return sap.secmon.ui.m.commons.SelectionUtils.getIdPropertyOfSelectedContextAndDecode(this.getPatternsTable(), "Id");
    },

    getSelectedPatterns : function() {
        return sap.secmon.ui.m.commons.SelectionUtils.getIdPropertiesOfSelectedContextsAndDecode(this.getPatternsTable(), "Id");
    },

    getSelectedQueryDefinitionId : function() {
        return sap.secmon.ui.m.commons.SelectionUtils.getIdPropertyOfSelectedContextAndDecode(this.getPatternsTable(), "QueryDefinitionId");
    },

    getSelectedPatternType : function() {
        return sap.secmon.ui.m.commons.SelectionUtils.getSelectedContext(this.getPatternsTable()).getProperty("PatternType");
    },

    /**
     * Helper allowing to receive values from table according to index number of Cell provided. Index zero refers matches first column with selected row
     */

    getSelectedPatternDetails : function(targetIndex) {
        var aSelectedItems = [];
        var selectedItems = this.getView().byId("patternsTable").getSelectedItems();
        for (var i = 0; i < selectedItems.length; i++) {
            aSelectedItems.push(selectedItems[i].getCells()[targetIndex].getText());
        }
        return aSelectedItems;
    },

    onActivatePattern : function() {
        this.changePatternStatusToActive(true);
    },

    onDeactivatePattern : function() {
        this.changePatternStatusToActive(false);
    },

    onTestModeOn : function() {
        this.changePatternTestMode(true);
    },
    onTestModeOff : function() {
        this.changePatternTestMode(false);
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    onPatternSuggest : function(oEvent) {
        sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper.handleSuggest.call(this, oEvent);
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
                path : "Id",
                filterValue : this.oCommons.base64ToHex(oContext.getObject().Id)
            };
        }, this);

        var aSelectedFilterItemsForFilterBar = sap.secmon.ui.m.commons.FilterBarHelper.getSelectedFilterItemsFromFilterBar.call(this).filter(function(oSelectedFilterItem) {
            return oSelectedFilterItem.path !== "Id";
        }).concat(aNewSelectedPatternFilterItems);

        sap.secmon.ui.m.commons.FilterBarHelper.applySelectedFilterItemsToFilterBar.call(this, aSelectedFilterItemsForFilterBar, undefined, true);
        this.getView().byId("patternFilterInput").focus();
    },

    handleSuggestionItemSelected : function(oEvent) {
        sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper.handleSuggestionItemSelected.call(this, oEvent);
        this.getView().getModel().refresh();
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
        this.setDialogStyleClass(this.patternSelectDialog);

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

    onNavBack : function() {
        window.history.go(-1);
    },

    navToWithAggregatedParameters : function(sRouteName) {
        var oNewQueryParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oNewQueryParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oNewQueryParameters, [ "patternFilterInput" ]);

        // The router has a "feature" not to dispatch to event handlers if
        // neither route nor query parameters have changed.
        // In order to force navigation, we add a parameter with new value each
        // time.
        oNewQueryParameters.lastNav = this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

        sap.ui.core.UIComponent.getRouterFor(this).navTo("main", {
            query : oNewQueryParameters
        }, true);
    },

    changePatternStatusToActive : function(bActive) {

        var sStatus = (bActive ? this.ACTIVE : this.INACTIVE);

        var oPattern = {
            Status : sStatus
        };

        var that = this;
        var message = that.getText(bActive ? "Pattern_Activat_Success" : "Pattern_Deactivat_Success");
        this.changePattern(oPattern, message);
    },

    changePatternTestMode : function(bTestModeOn) {

        var sTestMode = (bTestModeOn ? this.TRUE : this.FALSE);

        var oPattern = {
            TestMode : sTestMode
        };
        var that = this;
        var message = that.getText(bTestModeOn ? "Pattern_TestmodeOn_Succ" : "Pattern_TestmodeOff_Succ");
        this.changePattern(oPattern, message);
    },

    changePattern : function(oPattern, message) {
        var aPatternIds = this.getSelectedPatterns();
        var csrfToken = this.getComponent().getCsrfToken();
        var that = this;
        sap.ui.core.BusyIndicator.show(0);

        var aPatternModifications = [];
        var oPatternToChange;
        aPatternIds.forEach(function(sPatternId) {
            oPatternToChange = jQuery.extend({}, oPattern); // clone oPattern
            oPatternToChange.QueryDefinitionId = sPatternId;
            aPatternModifications.push(oPatternToChange);
        });

        $.ajax({
            type : "POST",
            url : that.PATTERN_MODIFICATION_SERVICE_URL,
            data : JSON.stringify(aPatternModifications),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            },
            success : function(data) {
                var model = that.getView().getModel();
                model.refresh(false);
                model.attachEventOnce("requestCompleted", function() {
                    sap.m.MessageToast.show(that.getText(message));
                    var oTable = that.getPatternsTable();
                    var aSelectedItems = oTable.getSelectedItems();
                    oTable.fireSelectionChange({
                        listItem : aSelectedItems[0],
                        listItems : aSelectedItems,
                        selected : true
                    });
                });
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.m.MessageBox.alert(that.getText("Pattern_Change_Failure"), {
                    title : that.getCommonText("Error_TIT")
                });
            },
            complete : function() {
                sap.ui.core.BusyIndicator.hide();
            }
        });
    },

    onExecutePattern : function(oEvent) {
        var sPatternId = this.getSelectedPattern();
        if (!sPatternId) {
            return;
        }
        var patternExecutionInfo = {
            patternId : sPatternId,
        };
        var sToken = this.getComponent().getCsrfToken();
        var oController = this;
        this.getView().setBusy(true);
        $.ajax({
            type : "POST",
            url : this.PATTERN_EXECUTOR_URL,
            data : JSON.stringify(patternExecutionInfo),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", sToken);
            },
            success : function(data) {
                var sId = data.result;
                oController.refreshPatterns();
                sap.ui.core.UIComponent.getRouterFor(oController).navTo("executionResult", {
                    id : sId,
                }, false);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                alert(oController.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown));
            },
            complete : function() {
                oController.getView().setBusy(false);
            }
        });
    },

    refreshPatterns : function() {
        this.getView().getModel().refresh();
    },

    onOpenPattern : function(oEvent) {
        var sQueryDefinitionId = this.getSelectedQueryDefinitionId();
        var patternType = this.getSelectedPatternType();
        if (!sQueryDefinitionId) {
            return;
        }
        if (patternType === 'FLAB') {
            sap.secmon.ui.m.commons.NavigationService.openBrowseUI(sQueryDefinitionId);
        } else {
            sap.secmon.ui.m.commons.NavigationService.openAnomalyPattern(sQueryDefinitionId);
        }
    },

    handleBookmarkDialogButtonPressed : function(oEvent) {
        var oParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oParameters, [ "patternFilterInput" ]);
        oParameters.doNotEncode = true;

        var sTitle = this.getText("MBookmark_PatternXLBL");
        this.oBookmarkCreator.showBookmarkCreationDialog(this.getView(), sTitle, oParameters, "Pattern");
    },

    onPressHelp : function() {
        window.open("/sap/secmon/help/7b4c2d0caf09418385d54c02d8182da7.html");
    },

    /**
     * Open Dialog allowing to schedule pattern. Furthermore, call utilities for validation and datetime selection.
     */
    onSchedulePattern : function(oEvent) {
        // If dialog doesn't exist define fragment, add view dependencies and set dialog to compact style
        if (!this.configurePatternDialog) {
            this.configurePatternDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.patternfs.view.ConfigurePatternDialog", this);
            this.getView().addDependent(this.configurePatternDialog);
            this.setDialogStyleClass(this.configurePatternDialog);
        }
        this.configurePatternDialog.open();
        // Instantiate validation service and provide controls being validated.
        var aInputs = [ this.getView().byId("datePickerTimeRangeFrom"), this.getView().byId("datePickerTimeRangeTo") ];
        // Instantiate datetimehelper needed to manage date calculations and validations in dialog.
        this.oInputValidationService = new sap.secmon.ui.commons.InputValidationService(aInputs);
        this.oDateTimeSelectionHelper = new sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper(this.getView());
    },

    /**
     * Close dialog if cancel button is pressed. In addition reset all values in controls and models
     */
    onPressCancelScheduleDialog : function() {
        // Reset values states of controls used in dialog
        this.oInputValidationService.resetValueStateOfControls();
        // Cleanup dialog by setting all values to null
        this.resetDateTimeInput();
        // Close Dialog
        this.configurePatternDialog.close();
    },

    /**
     * Finalize the needed scheduling object in case pattern id is available
     * 
     * @return {object} patternSchedulingInfo - Contains scheduling information needed for pattern post-processing
     */
    finalizeSchedulingDetail : function() {
        var aPatternId = this.getSelectedPatterns();
        if (!aPatternId) {
            return;
        }
        var aTimeRange = this.oDateTimeSelectionHelper.getTimeRangeUnderConsideration();

        // Receive Pattern information based on cell index (based on columns) and selected row
        var aPatternName = this.getSelectedPatternDetails(0);
        var aPatternNamespace = this.getSelectedPatternDetails(1);

        // Finalize object
        return {
            ConfigId : aPatternId,
            Name : aPatternName,
            Namespace : aPatternNamespace,
            StartTimestamp : aTimeRange[0].toISOString(),
            EndTimestamp : aTimeRange[1].toISOString()
        };
    },

    /**
     * Initiate pattern scheduling process by running validations, creation of the scheduling object and service call
     */
    onPressSubmitScheduleDialog : function() {
        var oController = this;

        // Execute validation checks and abort pattern scheduling in case a validation rule is violated
        if (this.validateSchedulingDetail()) {
            // Finalize object containing scheduling details
            var patternSchedulingInfo = this.finalizeSchedulingDetail();
            // Receive token and send scheduling details to backend service
            var sToken = this.getComponent().getCsrfToken();
            this.getView().setBusy(true);
            $.ajax({
                type : "POST",
                url : this.PATTERN_SCHEDULER_SERVICE_URL,
                data : JSON.stringify(patternSchedulingInfo),
                contentType : "application/json; charset=UTF-8",
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", sToken);
                },
                success : function() {
                    var successText = oController.loadResourceBundleText("PatternScheduleSuccess");
                    oController.showResponseMessage(sap.ui.core.MessageType.Success, successText);
                    oController.getView().getModel().refresh();
                    oController.onPressCancelScheduleDialog();
                },
                error : function() {
                    var errorMessage = oController.loadResourceBundleText("PatternScheduleDuplicateError");
                    oController.showResponseMessage(sap.ui.core.MessageType.Error, errorMessage);
                },
                complete : function() {
                    oController.getView().setBusy(false);
                }
            });
        }
    },

    /**
     * Display message (error or success) in case pattern was scheduled
     * 
     * @param {object}
     *            messageType - Type of message which should be displayed
     * @param {string}
     *            shortMessage - Message shown to user
     */
    showResponseMessage : function(messageType, shortMessage) {
        this.messageUtil.addMessage(messageType, shortMessage);
    },

    /**
     * Handles validation in addition to validation executed in custom control
     */
    validateSchedulingDetail : function() {
        // Get available UTC DateTimes and make them available in UI model
        var aTimeRange = this.oDateTimeSelectionHelper.getTimeRangeUnderConsideration();
        var errorMessage;

        // Abort operation in case no suitable timerange was provided by enduser
        if (!aTimeRange) {
            // Receive needed error message
            errorMessage = this.loadResourceBundleText("ErrorTimeRangeScheduleDates");
            // Show error message proposing allowed datetime input and abort pattern scheduling
            this.showResponseMessage(sap.ui.core.MessageType.Error, errorMessage);
            return false;
        }

        // Fetch and convert retention period days to milliseconds
        var nRetentionPeriodDays = this.getView().getModel("uiModel").getProperty("/retentionPeriod");
        var nRetentionPeriodMls = nRetentionPeriodDays * 86400000;
        // Receive current date in miliseconds
        var nTechnicalCurrentDate = new Date().getTime();
        // Get datetimes and derive timeranges, wrap in array as it is needed like this by validation service
        var nTechnicalScheduleStartDate = new Date(aTimeRange[0]).getTime();
        var nTechnicalScheduleEndDate = new Date(aTimeRange[1]).getTime();
        var aTechnicalTimeRanges = [ nTechnicalScheduleStartDate, nTechnicalScheduleEndDate ];
        var aTechnicalSchedulingDatePeriod = [ nTechnicalScheduleEndDate - nTechnicalScheduleStartDate ];

        // Ensure that the provided datetimes are not higher than todays date
        if (!this.oInputValidationService.compareNumbers(aTechnicalTimeRanges, nTechnicalCurrentDate)) {
            // Receive needed error message
            errorMessage = this.loadResourceBundleText("ErrorFutureScheduleDates");
            // Show error message proposing allowed datetime input and abort pattern scheduling
            this.showResponseMessage(sap.ui.core.MessageType.Error, errorMessage);
            return false;
        }
        // Ensure that the provided datetimes are not higher than the retention period
        if (!this.oInputValidationService.compareNumbers(aTechnicalSchedulingDatePeriod, nRetentionPeriodMls)) {
            // Receive needed error message details and show error message proposing allowed datetime input and abort pattern scheduling
            errorMessage = this.getView().getModel("i18n").getResourceBundle().getText("ErrorPeriodScheduleDates", [ nRetentionPeriodDays ]);
            this.showResponseMessage(sap.ui.core.MessageType.Error, errorMessage);
            return false;
        } else {
            return true;
        }
    },

    /**
     * Define compact style class for dialogs available in view
     */
    setDialogStyleClass : function(oDialog) {
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
    },

    /**
     * Clear ui model and values from DateTime Dialog
     */
    resetDateTimeInput : function() {
        // Cleanup of values in controls as those are not bound directly to the UI model above
        this.getView().byId("datePickerTimeRangeFrom").setValue(null);
        this.getView().byId("datePickerTimeRangeTo").setValue(null);
        this.getView().byId("inputTimeRangeFrom").setValue(null);
        this.getView().byId("inputTimeRangeTo").setValue(null);
    },
});
