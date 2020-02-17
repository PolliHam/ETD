$.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.browse.TimeRange");
$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.ui.model.odata.CountMode");
$.sap.require("sap.ui.core.util.Export");
$.sap.require("sap.ui.core.util.ExportTypeCSV");
$.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");
$.sap.require("sap.secmon.ui.commons.InputValidationService");
$.sap.require("sap.secmon.ui.sherlock.util.Formatter");
$.sap.require("sap.m.TablePersoController");
$.sap.require("sap.secmon.ui.m.commons.LoglearningRunCreator");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.sherlock.controller.List", {

    // Make message utility available in controller so there is not the need to instantiate it every time it is needed
    messageUtil : new sap.secmon.ui.commons.GlobalMessageUtil(),

    // Service url necessary for serach and process operations (e.g. forensic lab)
    SHERLOG_SERVICE_URL : "/sap/secmon/services/sherlock/search.xsjs",

    /**
     * Function that is called on Initialization
     */
    onInit: function () {
        // Set boolean variable bDebug to true if sap-ui-debug is set to true
        var sDebugSetting = $.sap.getUriParameters().get("sap-etd-debug");
        this.bDebug = (sDebugSetting && sDebugSetting.toLowerCase() === "true");

        

        // Initialize and activate the TablePersoController
        this.oTPC = new sap.m.TablePersoController({
            table: this.getView().byId("idSherlockTable"),
            // specify the name of the app
            componentName: "idSearchList",
            persoService: this.getPersoService()
        }).activate();

        // Initialize the log learning run creator
        this.runCreator = new sap.secmon.ui.m.commons.LoglearningRunCreator();
        
        // URL parameters set by other apps (such as UnrecognizedLog App)
        this.oStartupParameters = this.getComponent().getComponentData().startupParameters;
        
        // Setup the filters if start parameters exists
        // All boolean values are in string format ("true"|"false") defined by the backend service
        if (this.oStartupParameters) {
            var sRecognized = (this.oStartupParameters.LogType.findIndex(function(logType) {
                return logType === "Recognized"; }) >= 0).toString();
            var sUnrecognized = (this.oStartupParameters.LogType.findIndex(function(logType){
                return logType === "Unrecognized"; }) >= 0).toString();
            
            this.createUiModels({
                timeRange : this.oStartupParameters.TimeRange,
                recognized : sRecognized,
                unrecognized : sUnrecognized
            });
            
            this.getView().getModel().setProperty("/recognized", sRecognized);
            this.getView().getModel().setProperty("/unrecognized", sUnrecognized);
            this.onSearch();
        } else {
            this.createUiModels();
        }
    },
    
    /**
     * Determine which log types are searched One factor is the user privileges, the other one is the settings in search filters One of the applications is call Sherlog from Unreconized Log Tile in
     * launchpad for Log Learning In that case, only unrecognized logs are needed
     */
    formatFilterLogType: function(oUserPrivileges, oSearchFilter) {
        return oUserPrivileges.originalLogRead && oUserPrivileges.unrecognizedLogRead && oSearchFilter.recognized === "true" && oSearchFilter.unrecognized  === "true" ?
                "keyAllLogTypes" : oUserPrivileges.originalLogRead && oSearchFilter.recognized === "true" ? 
                "keyRecLogTypes" : "keyUnrecLogTypes";
    },

    onAfterRendering: function(){
        this.oBundle = this.getView().getModel("i18n").getResourceBundle();
    },

    /**
     * Contains a collection of local ui models
     */
    createUiModels: function(oParam) {
        // Ensure retention periods for the hot storage are available
        this.receiveConfigurationParameters();

        // Setup model to handle options available in list table (e.g. check logs) and message container
        this.defineListViewModel();

        // Model containing search results
        this.defineSearchResultModel();

        // Model containing information about Role-Independent Attributes
        this.defineIndependentRoleAttributesModel();

        // Create a Model from the Query and make it available in view
        // with initial values
        var oModel = new sap.ui.model.json.JSONModel({
            amount: this.getView().byId("idSherlockTable").getGrowingThreshold(),
            skip: 0,

            recognized: oParam ? oParam.recognized : "true",
            unrecognized: oParam ? oParam.unrecognized : "true",

            area: "both",
            reason: "",

            order: "2",
            desc: "true",
            asc: "false",
            caseSensitivity: false,
            wildcardOn: false,
            timeoutRequest : 300,
            sTypeOfSelectedItems: "None"
        });
        this.getView().setModel(oModel);

        var oUIModel = new sap.ui.model.json.JSONModel({
            itemCount: 0,
            selectedItems: 0,
            enableFilterReasonCode: oParam ? oParam.unrecognized === "true" : false,
            enableFilterEventLogType:false,
            enableFilterEventSourceType:false,
            selectedKey:"keyAllReasonCodes"
        });
        this.getView().setModel(oUIModel, "UIModel");
        this._setRefreshMode("onSherlog");

        // Define local model for timerange handling
        this.defineTimeRangeModel(oParam ? oParam.timeRange : undefined);

        // Setup the LogDiscoveryModel
        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/loginterpretation/logDiscoveryAPI.xsodata", {
            json: true,
            defaultCountMode: sap.ui.model.odata.CountMode.Inline
        }), "LogDiscoveryModel");
    },

    _setRefreshMode: function (oMode) {
        this.mode = oMode;
        var oUIModelData = this.getView().getModel("UIModel").getData();
        switch (this.mode) {
            case 'none':
            case 'onSherlog':
                oUIModelData.backButtonVisible = false;
                oUIModelData.deleteButtonVisible = false;
                oUIModelData.addButtonVisible = true;
                oUIModelData.columnItemsType = "Inactive";
                break;
        }
        this.getView().getModel("UIModel").setData(oUIModelData);
    },

    /**
     * Model containing the properties of the list view
     */
    defineListViewModel: function() {
        var oListViewModel = new sap.ui.model.json.JSONModel({
            headerToolbarSelectionValue: 0,
            headerToolbarItemCountValue: 0,
            processForensicLabSelected : true,
            processCaseFileSelected : false,
            processRecVisible : false,
            processUnrecVisible : false,
            processForensicLabWithAttrSelected : false
        });
        this.getView().setModel(oListViewModel, "ListViewModel");
    },

    /**
     * Model for search result data and for buffer
     */
    defineSearchResultModel: function() {
        this.getView().setModel(new sap.ui.model.json.JSONModel(), "SearchResultModel");
        this.getView().setModel(new sap.ui.model.json.JSONModel(), "SearchBufferModel");
    },

    defineIndependentRoleAttributesModel : function(){
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), "RoleIndependentAttrModel");
        this.getIndependentRolesAttr();
    },

    getIndependentRolesAttr : function(){
        var that = this;
        var oBody = {operation : "getRoleIndependentAttributes"};
        sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oBody), true)
            .done(function(response, textStatus, XMLHttpRequest) {
                var aRoleIndependentAttributes = response.filter(function(oAttr){
                    // all the role-independent attributes except User Pseudonym <Role-independent>
                    return oAttr.key !== "497B8AC97AA2CACC16007C280168450F";
                });
                that.getView().getModel("RoleIndependentAttrModel").setData(aRoleIndependentAttributes); 
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                this.messageUtil.addMessage(sap.ui.core.MessageType.Error, jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText);
            });
    },

    /**
     * Setup the local model to manage timerange. The model properties needed for validation checks.
     */
    defineTimeRangeModel: function(timerangeInMinutes) {
        // By default search the last 15 minutes
        var timerangeDefault = timerangeInMinutes || 15;
        var defaultTimeRangeInMilliseconds = timerangeDefault * 60000;
        // For relative search the to date is current date
        var currentDateTo = new Date();
        var currentDateFrom = new Date(currentDateTo - defaultTimeRangeInMilliseconds);
        // Make datetime ranges available in view
        var oTimeRangeModel = new sap.ui.model.json.JSONModel({
            TimerangeDefault : timerangeDefault,
            TimerangeFrom : currentDateFrom,
            TimerangeTo : currentDateTo
        });
        this.getView().setModel(oTimeRangeModel, "TimeRangeModel");

        this.getView().getModel().setProperty("/from", currentDateFrom);
        this.getView().getModel().setProperty("/to", currentDateTo);
    },

    /**
     * Convenience method for getting the view model by name in every controller of the application
     * 
     * @param {string}
     *            sName the model name
     * @returns {sap.ui.model.Model} the model instance
     */
    getModel: function (sName) {
        return this.getView().getModel(sName);
    },

    /**
     * Specifies a perso service object for the TablePersoController
     * 
     * @returns {object} oPersoService
     */
    getPersoService: function () {
        return {
            oData: {
                _persoSchemaVersion: "1.0",
                aColumns: this.getView().byId("idSherlockTable").getColumns()
                    .map(function (col, i) {
                        return {
                            id: col.getId(),
                            order: i,
                            visible: true
                        };
                    })
            },
            getPersData: function () {
                var oDeferred = new jQuery.Deferred();
                if (!this._oBundle) {
                    this._oBundle = this.oData;
                }
                oDeferred.resolve(this._oBundle);
                return oDeferred.promise();
            },

            setPersData: function (oBundle) {
                var oDeferred = new jQuery.Deferred();
                this._oBundle = oBundle;
                oDeferred.resolve();
                return oDeferred.promise();
            }
        };
    },

    /**
     * When clicking the personalization button, this functions opens the TablePersoController
     */
    onPersonalizationPress: function () {
        this.oTPC.openDialog();
    },

    /**
     * Execute filters based on search strings and selections provided by user Note: All mandatory filter item need to be filled, otherwise function wont be triggered by respective control
     * 
     */
    onSearch: function () {
        if (!this.oStartupParameters && !this.validateTimeRange()) {
            return;            
        }         
        // Table and model cleanup
        this._resetQuery();
        // Prepare query for filter request
        this.setColumnVisibilityAccordingToLogType();

        this._getLogs(false);
    },

    /**
     * Convert the reason key (String) from the select dialog to the reason code (number)
     */
    onReasonCodeChange: function(oEvt) {
        var sKey = oEvt.getSource().getSelectedKey();
        var oKeyMap = {
            keyNoRuntimeRule: "1",
            keyExtractionFailed: "2",
            keyIncompleteTimestamp: "3"
        };
        this.getView().getModel().setProperty("/reason", oKeyMap[sKey] || "");
    },

    onSortModeChange: function(oEvt){
        this.getView().getModel().setProperty("/asc", "" + (oEvt.getParameter("selectedIndex") === 0));
        this.getView().getModel().setProperty("/desc", "" + (oEvt.getParameter("selectedIndex") === 1));
    },

    /**
     * Cleanup table, queries and formerly populated model
     */
    _resetQuery: function () {
        this.getModel("SearchResultModel").setProperty("/");
        this.byId("idSherlockTable").removeSelections(true);
    },

    /**
     * This function 1. determines the current indexes of the columns "Event Log Type", "Source Type" and "Reason", 2. sets the columns "Event Log Type" and "Source Type" to visible for a search with
     * recognized logs 3. sets the column "Reason" to visible for a search with unrecognized logs
     */
    setColumnVisibilityAccordingToLogType: function () {

        var aColumns = this.oTPC.getPersoService().oData.aColumns;
        
        // Determine the current index of the column (index can change depending on the order of the columns)
        var indexEventLogType = aColumns.findIndex(function(column){
            return column.id.indexOf("eventLogTypeColumn") !== -1;
        });
        var indexSourceType = aColumns.findIndex(function(column){
            return column.id.indexOf("eventSourceTypeColumn") !== -1;
        });
        var indexReason = aColumns.findIndex(function(column){
            return column.id.indexOf("reasonColumn") !== -1;
        });

        // Define column visibility depending on the selected log type for the search
        if (this.getView().getModel().getProperty("/recognized") === "true") {
            // Show columns "EventLogType" and "EventSourceType" in the table for recognized logs, since they are only filled for recognized logs.
            aColumns[indexSourceType].visible = true;
            aColumns[indexEventLogType].visible = true;
        }else{
            aColumns[indexSourceType].visible = false;
            aColumns[indexEventLogType].visible = false;
        }
        // The reasons column shows a reason, why the log is unrecognized. This column is only shown for unrecognized logs.
        if (this.getView().getModel().getProperty("/unrecognized") === "true") {
            aColumns[indexReason].visible = true;
        }else{
            aColumns[indexReason].visible = false;
        }
    },

    _getCount: function () {
        var oQuery = this.getView().getModel().getData();
        oQuery.countOnly = true;
        jQuery.ajax({
            method: "PUT",
            url: this.SHERLOG_SERVICE_URL + "/countOnly",
            data: JSON.stringify(oQuery),
            contentType: "application/json; charset=UTF-8",
            success: function (oData) {
                this.getModel("UIModel").setProperty("/itemCount", oData.logCount);
                this.showSelectedItemsCount(0);
            }.bind(this)
        });
    },

    _addGrowingLogsToTable: function (isGrowing, aNewLogs, iAmount) {
        if (isGrowing) {
            var aCurrentData = this.getModel("SearchResultModel").getProperty("/");
            // also we need to delete empty row after new data are fetched
            aCurrentData.splice(-1, 1);
            aCurrentData = aCurrentData.concat(aNewLogs);
            // to make growing work the model should contain more data
            // than currently displayed in table. So we add empty row
            if (aNewLogs.length === iAmount) {
                aCurrentData.push({});
            }
            this.getModel("SearchResultModel").setProperty("/", aCurrentData);
        } else {
            // if we have more data, we need to add empty row to make Growing work
            if (aNewLogs.length === iAmount) {
                aNewLogs.push({});
            }
            this.getModel("SearchResultModel").setData(aNewLogs);
        }

    },
    _highlightSearchString: function () {
        var oQuery = this.getView().getModel().getData();
        var sSearch = oQuery.search;
        if (!sSearch) {
            return;
        }
        var aItems = this.getView().byId("idSherlockTable").getItems();
        var iItemsCount = aItems.length;
        sSearch = sSearch.replace(new RegExp("([\(\)\|\[\*\.])", "g"), "\\$1");       
        if (oQuery.wildcardOn) {
            sSearch = sSearch.replace(new RegExp("(_)", "g"), ".");
        }
        var sRegex = new RegExp("(" + sSearch + ")", oQuery.caseSensitivity ? "g" : "gi");
        for (var i = oQuery.skip - oQuery.amount; i < iItemsCount; i++) {
            var cell = aItems[i].getCells()[3].$();
            cell.html(cell.html().replace(sRegex, "<mark>$1</mark>").replace("  ", ""));
        }
    },
    _getLogs: function (isGrowing, isBufferOnly) {
        var that = this;
        if (!isBufferOnly && !isGrowing) {
            this.getView().getModel().setProperty("/skip", 0);
            // send another async req to update count
            this._getCount();
            this.getModel("SearchBufferModel").setData([]);
        }
        var oQuery = this.getView().getModel().getData();
        oQuery.countOnly = false;

        // if this is growing then we have a buffer with next data
        if (!isBufferOnly && isGrowing) {
            var aCurrentBuffer = that.getModel("SearchBufferModel").getData();
            that._addGrowingLogsToTable(isGrowing, aCurrentBuffer, oQuery.amount);

            that._highlightSearchString();
            isBufferOnly = true;
        }

        if (!isBufferOnly) {
            this.getView().byId("idSearchList").setBusy(true);
        }
        jQuery.ajax({
            method: "PUT",
            url: this.SHERLOG_SERVICE_URL,
            timeout: oQuery.timeoutRequest * 1000,
            data: JSON.stringify(oQuery),
            contentType: "application/json; charset=UTF-8",
            success: function (oData) {
                this.getView().getModel().setProperty("/skip", oQuery.skip + oQuery.amount);

                if (isBufferOnly) {
                    this.getModel("SearchBufferModel").setData(oData.data);
                    return;
                }

                // set timeout to move logic to in event loop, so it will be invoked directly AFTER rendering is complete
                setTimeout(function () {
                    if (!isGrowing) {
                        that._highlightSearchString();
                    }
                    that.getView().byId("idSearchList").setBusy(false);

                    // send req to get buffer data
                    that._getLogs(true, true);
                }, 100);

                if (!isGrowing) {
                    this._addGrowingLogsToTable(isGrowing, oData.data, oQuery.amount);
                }

                if (oData.warning) {
                    this.messageUtil.addMessage(sap.ui.core.MessageType.Warning, oData.warning, oData.warning, false);
                }
            }.bind(this),
            error: function (oError) {
                this.getView().byId("idSearchList").setBusy(false);
                var sError = this._parseErrorMessage(oError);
                this.messageUtil.addMessage(sap.ui.core.MessageType.Error, sError);
            }.bind(this)
        });
    },

    // triggerring when user press grow button.
    onUpdateStarted: function (oEvt) {
        if (oEvt.getParameter("reason") === "Growing") {
            this._getLogs(true);
        }
    },


    _parseErrorMessage: function (oResponse) {
        var sMessage = oResponse.statusText;
        if (sMessage === 'timeout') {
            sMessage = this.oBundle.getText("TimeoutError");
        } else {
            if (oResponse.responseText) {
                sMessage = oResponse.responseText;
            }
        }
        return sMessage;
    },

    /**
     * Function that called when the User selects a new Item
     */
    onSelectionChange: function (oEvt) {
        var oModel = this.getView().getModel();
        var oList = oEvt.getSource();
        var oItem = oEvt.getParameter("listItem");
        // Log type of the newly selected item
        var bCurrentItemRecognized = oItem.getBindingContext("SearchResultModel").getProperty("Recognized");
        var aItems = oList.getSelectedItems(true);
        this.showSelectedItemsCount(aItems.length);

        if(aItems.length === 0){
            this.getView().getModel().setProperty("/sTypeOfSelectedItems","None");
        }else {
            if(oList._getSelectAllCheckbox().getSelected()){
                // If the first item in the list is unrecognized, then it is only possible to select unrecognized logs
                if(!bCurrentItemRecognized){
                    oModel.setProperty("/sTypeOfSelectedItems", "Unrecognized");
                }else{
                    // If the first item in the list is recognized, check that all items in the list are recognized
                    if(aItems.every(function (oItem) {
                            return oItem.getBindingContext("SearchResultModel").getProperty("Recognized") === true;
                        })){
                        oModel.setProperty("/sTypeOfSelectedItems", "Recognized");
                    }else{
                        oModel.setProperty("/sTypeOfSelectedItems", "None");
                    }
                }
            }else{
                if (this.getView().getModel().getProperty("/sTypeOfSelectedItems") === "None"){
                    if(bCurrentItemRecognized){
                        oModel.setProperty("/sTypeOfSelectedItems", "Recognized");
                    } else {
                        oModel.setProperty("/sTypeOfSelectedItems", "Unrecognized");
                    }
                }

                // Compare the log type of the newly selected item with the log type of the previously selected item to prevent that both log types are selected at once.
                var sCurrentTypeOfLogs = this.getView().getModel().getProperty("/sTypeOfSelectedItems");
                if ((sCurrentTypeOfLogs === "Recognized" && !bCurrentItemRecognized) ||
                    (sCurrentTypeOfLogs === "Unrecognized" && bCurrentItemRecognized)) {
                    oList.removeSelections(true);
                    oEvt.getParameter("listItem").setSelected(true);
                    // Update selected items to show the correct items count
                    oModel.setProperty("/sTypeOfSelectedItems", bCurrentItemRecognized ? "Recognized" : "Unrecognized");
                }
            }
        }

        if(oModel.getProperty("/sTypeOfSelectedItems") === "Recognized"){
            // Enable the process button, if only recognized logs are selected
            this.getView().getModel("ListViewModel").setProperty("/processRecVisible", true);
            this.getView().getModel("ListViewModel").setProperty("/processUnrecVisible", false);
        }else if(oModel.getProperty("/sTypeOfSelectedItems") === "Unrecognized" && this.getModel("applicationContext").getProperty("/userPrivileges/logLearningWrite") === true){
            // Enable the process button, if only unrecognized logs are selected and the user has logLearningWrite privileges
            this.getView().getModel("ListViewModel").setProperty("/processRecVisible", false);
            this.getView().getModel("ListViewModel").setProperty("/processUnrecVisible", true);
            this.getView().getModel("ListViewModel").setProperty("/processForensicLabSelected", false);
        }else{
            // Disable the process button, if no logs are selected or if both log types are selected
            this.getView().getModel("ListViewModel").setProperty("/processRecVisible", false);
            this.getView().getModel("ListViewModel").setProperty("/processUnrecVisible", false);
        }
    },

    /**
     * Counts the selected logs in the result table. The number is shown in the info tool bar on top of the result table. In case no selection was done, count is not shown
     */
    showSelectedItemsCount: function(iCount) {
        this.getView().getModel("UIModel").setProperty("/selectedItems", iCount);
    },

    sendLogDetails: function(aItemEventIds, iDateLow, iDateHigh, sKey) {
        var oController = this;
        this.getView().byId("idSearchList").setBusy(true);

        // Finalize object containing log details
        var logDetails = {
            EventIds: aItemEventIds
        };

        // Receive token and send scheduling details to backend service
        var sToken = this.getComponent().getCsrfToken();
        $.ajax({
            type : "POST",
            url : this.SHERLOG_SERVICE_URL,
            data : JSON.stringify(logDetails),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", sToken);
            },
            success : function(data) {
                // When header Ids were persisted successfully fetch the corresponding uuid as it is needed for navigation
                // Opens new tab in Forensic Lab based on the log id (respectively uuid) and provide timestamps
                var sNavigationUrl = "/sap/secmon/ui/browse/?from=" + iDateLow + "&to=" + iDateHigh + "&sSearchId=" + data;
                if(sKey){
                    sNavigationUrl += "&key=" + sKey;
                }
                window.open(sNavigationUrl);
            },
            error : function() {
                oController.messageUtil.addMessage(sap.ui.core.MessageType.Error, oController.oBundle.getText("LogProcessingError"));
            },
            complete : function() {
                oController.getView().byId("idSearchList").setBusy(false);
            }
        });
    },

    /**
     * Opens a new Tab in Forensic Lab and continue to log learning depending on what type of log the user has selected
     */
    onPressProcess: function () {
        var oProcessDialog = this._getProcessDialog();
        oProcessDialog.open();
    },

    /**
     * If not created yet, creates settings Dialog. Returns settings Dialog.
     */
    _getProcessDialog: function () {
        if (!this._oProcessDialog) {
            this._oProcessDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.sherlock.view.ProcessDialog", this);
            // Define dialog details by populating local ui models. The models contain settings details and privilege handling,
            
            this.getView().addDependent(this._oProcessDialog);
        }
        // Toggle to compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oProcessDialog);
        return this._oProcessDialog;
    },

    onPressProcessInDialog: function () {
        this._oProcessDialog.close();

        function onSuccess(sRunName) {
            sap.secmon.ui.m.commons.NavigationService.openLogLearningRun(sRunName);
        }

        if(this.getModel("ListViewModel").getProperty("/processCaseFileSelected")){
            if (!this._oCaseFilesDialog) {
                this._oCaseFilesDialog = sap.ui.xmlfragment("CaseFilesDialog", "sap.secmon.ui.sherlock.view.CaseFilesDialog", this);
                this.getView().addDependent(this._oCaseFilesDialog);
                this._oCaseFilesDialog.getContent()[0].oController._setRefreshMode("onSherlog");
                $.sap.syncStyleClass("sapUiSizeCompact", sap.secmon.ui.browse.utils.getView(), this._oCaseFilesDialog);
            }
            this._oCaseFilesDialog.open();
        }else {
            var iDateHigh, iDateLow;

            var aItems = this.getView().byId("idSherlockTable").getSelectedItems();
            var aItemEventIds = [];            

            if (this.getModel("ListViewModel").getProperty("/processForensicLabSelected")) {
                if (this.getModel("applicationContext").getData().userPrivileges.execute === true) {
                    // Starting values for comparison
                    // Every non digit character is deleted
                    iDateHigh = aItems[0].getBindingContext("SearchResultModel").getProperty("Timestamp").replace(/\D/g, "");
                    iDateLow = iDateHigh;

                    for (var i = 0; i < aItems.length; i++) {
                        // Prepare object containing event Ids which will passed to service later on
                        var sItemEventId = aItems[i].getBindingContext("SearchResultModel").getProperty("EventId");
                        aItemEventIds.push(sItemEventId);

                        // Get Timerange of Selected items by searching for the oldest(high) and youngest(low) logs
                        var iDate = aItems[i].getBindingContext("SearchResultModel").getProperty("Timestamp").replace(/\D/g, "");
                        if (iDateLow > iDate) {
                            iDateLow = iDate;
                        }
                        if (iDateHigh < iDate) {
                            iDateHigh = iDate;
                        }
                    }
                    if (this.getModel("ListViewModel").getProperty("/processForensicLabWithAttrSelected")) {
                        this.sendLogDetails(aItemEventIds, iDateLow, iDateHigh, this.byId("role-attribute").getSelectedItem().getProperty("key"));
                    } else {
                        this.sendLogDetails(aItemEventIds, iDateLow, iDateHigh);
                    }      
                } else {
                    sap.m.MessageBox.alert(this.getModel("i18nBackend").getProperty("fw_noexecrights"), {
                        title: this.getModel("i18nBackend").getProperty("Error_TIT")
                    });
                }
            } else if(this.getModel("ListViewModel").getProperty("/processUnrecVisible")){
                // Requires user to chose a Name and selected a Log Layout for the Run he is about to create
                // With the selected unrecognized logs
                var aTexts = [];

                $.each(aItems, function(index, item) {
                    aTexts.push(item.mAggregations.cells[3].mProperties.text);
                });
                
                this.runCreator.showRunCreationDialog(this.getView(), aTexts, onSuccess);
            }
        }
    },

    onCloseProcessDialog: function () {
        this._oProcessDialog.close();
    },

    onHelpPress: function () {
        window.open("/sap/secmon/help/d3d1674bd49b464f94d6ae6835c4b095.html");
    },

    onSettingsPress: function () {
        var oDialog = this._getSettingsDialog();
        oDialog.open();
    },

    /**
     * If not created yet, creates settings Dialog. Returns settings Dialog.
     */
    _getSettingsDialog: function () {
        if (!this._oSettingsDialog) {
            this._oSettingsDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.sherlock.view.SettingsDialog", this);
            this.getView().addDependent(this._oSettingsDialog);
        }
        // Toggle to compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oSettingsDialog);
        return this._oSettingsDialog;
    },

    /**
     * Read service and add it to Ui model for property binding and validation checks
     */
    receiveConfigurationParameters: function() {
        var configurationParameters = new sap.ui.model.odata.v2.ODataModel({
            serviceUrl : "/sap/secmon/services/ConfigurationParameters.xsodata"
        });
        this.getView().setModel(configurationParameters, "ConfigurationParameters");
        var oConfigurationParametersModel = this.getModel("ConfigurationParameters");

        oConfigurationParametersModel.read("/ConfigurationParameters", null, null, true, function(oData) {
            oConfigurationParametersModel.setProperty("/", oData);
        });
    },

    /**
     * Validate Timeout field filled correctly
     */
    onPressOkSettingsDialog: function (oEvt) {
        var maxTimeout = 1800;
        if (this.getView().byId("idTimeout").getValueState() === sap.ui.core.ValueState.Error){
            this.messageUtil.addMessage(sap.ui.core.MessageType.Error, this.oBundle.getText("SH_Timeout_Too_Large_MSG",[maxTimeout]));
            return;
        }
        this._oSettingsDialog.close();
    },

    /**
     * Closes settings dialog
     */
    onPressCloseSettingsDialog: function () {
        if (this.getView().byId("idTimeout").getValueState() === sap.ui.core.ValueState.Error){
            this.getView().byId("idTimeout").setValue(this.getView().getModel().getProperty("/timeoutRequest"));
        }
        this._oSettingsDialog.close();
    },

    /**
     * Updates the default time range of the DateTimeDialog and opens the dialog
     */
    onShowDateTimeDialog : function() {
        this.getDateTimeSelectionDialog();
        this.oDateTimeDialog.open();
    },

    /**
     * Initializes the DateTimeDialog. Adapts the custom control to the needs of the sherlog app
     */
    getDateTimeSelectionDialog : function() {
        if (!this.oDateTimeDialog) {
            this.oDateTimeDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionDialog", this);
            this.oDateTimeDialog.setTitle("{= ${applicationContext>/UTC} === true ? ${i18nCommon>SelectTRUTC_TIT} : ${i18nCommon>SelectTimeRange_TIT} }");
            this.getView().addDependent(this.oDateTimeDialog);

            // Set default datetime range
            this.defaultDateTimeRange();

            // Select the radio button for the relative time range
            this.getView().byId("relativeTimeRange").setSelected(true);
            this.getView().byId("absoluteTimeRange").setSelected(false);

            this.oDateTimeSelectionHelper = new sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper(this.getView());

            // Define compact style class
            this.oDateTimeDialog.addStyleClass("sapUiSizeCompact");

            // Instantiate validation service. Necessary to reset value states of controls
            var aInputs = [ this.getView().byId("inputTimeLast"), this.getView().byId("datePickerTimeRangeFrom"), this.getView().byId("datePickerTimeRangeTo")];
            this.oDateTimeValidationService = new sap.secmon.ui.commons.InputValidationService(aInputs);
        }
        return this.oDateTimeDialog;
    },

    /**
     * Set default datetime range. Happens only once on dialog initialization. Later on its overwritten by user input
     */
    defaultDateTimeRange : function() {
        // Set the default timerange
        var oTimeRangeModel = this.getModel("TimeRangeModel");
        this.getView().byId("inputTimeLast").setValue(oTimeRangeModel.getProperty("/TimerangeDefault"));

        // Set the "To" date to the current time
        var currentDateTo = new Date();
        // If the time is configured in UTC, then adapt the start date of the retention period to the UTC time.
        var iuTimeZone = this.getModel("ConfigurationParameters").getProperty("/ConfigurationParameters('UITimeZone')/ValueVarChar");
        if(iuTimeZone === "UTC"){
            currentDateTo = new Date(currentDateTo.getTime() + currentDateTo.getTimezoneOffset() * 60000);
        }
        this.getView().byId("datePickerTimeRangeTo").setDateValue(currentDateTo);
        var currentTimeTo = ("0" + currentDateTo.getHours()).slice(-2) + ":" + ("0" + currentDateTo.getMinutes()).slice(-2) + ":" + ("0" + currentDateTo.getSeconds()).slice(-2);
        this.getView().byId("inputTimeRangeTo").setValue(currentTimeTo);

        // Set the "From" datetime to the current time minus the default datetime
        var defaultTimeRangeInMilliseconds = oTimeRangeModel.getProperty("/TimerangeDefault") * 60000;
        var currentDateFrom = new Date(currentDateTo - defaultTimeRangeInMilliseconds);
        this.getView().byId("datePickerTimeRangeFrom").setDateValue(currentDateFrom);
        var currentTimeFrom = ("0" + currentDateFrom.getHours()).slice(-2) + ":" + ("0" + currentDateFrom.getMinutes()).slice(-2) + ":" + ("0" + currentDateFrom.getSeconds()).slice(-2);
        this.getView().byId("inputTimeRangeFrom").setValue(currentTimeFrom);
    },

    /**
     * Closes the oDateTimeDialog if the cancel button is pressed. In addition, it resets all value states in the controls
     */
    onCloseTimeFilterDialog : function() {
        // Reset values states of controls
        this.oDateTimeValidationService.resetValueStateOfControls();
        this.oDateTimeDialog.close();
    },

    /**
     * Applies the time filter, when clicking "OK" at the DateTimeDialog
     */
    onApplyTimeFilter: function () {
        // Cleanup value states applied on datetime fields ensuring former validation checks results doesn't distort current validation checks
        this.oDateTimeValidationService.resetValueStateOfControls();
        // Apply violation rules for datetime handling and mark wrong inputs
        this.validateTimeRange();

        // Check value states of controls and abort filtering in case a validation rule was violated
        // Hereby it is prevented that the dialog is closed
        if (!this.oDateTimeValidationService.checkControls()) {
            return false;
        }

        // Make datetime range values available in local model so those can be included in filter request later on
        var aTimeRange = this.oDateTimeSelectionHelper.getTimeRangeUnderConsideration();
        if(aTimeRange){
            var oTimeRangeModel = this.getModel("TimeRangeModel");
            oTimeRangeModel.setProperty("/TimerangeFrom",aTimeRange[0]);
            oTimeRangeModel.setProperty("/TimerangeTo",aTimeRange[1]);

            this.getView().getModel().setProperty("/from",aTimeRange[0]);
            this.getView().getModel().setProperty("/to",aTimeRange[1]);
        }
        this.oDateTimeDialog.close();
    },

    /**
     * Fetch keys from Select control and define bRec and bUnrec in the SettingsModel
     */
    onFilterLogTypeChange: function(oEvt) {
        var sKey = oEvt.getSource().getSelectedKey();
        this.getView().getModel().setProperty("/recognized", "" + (sKey === "keyAllLogTypes" || sKey === "keyRecLogTypes"));
        this.getView().getModel().setProperty("/unrecognized", "" + (sKey === "keyAllLogTypes" || sKey === "keyUnrecLogTypes"));

        switch (sKey){
            case 'keyAllLogTypes':{
                //Set as default not-used fields 
                this.getView().getModel().setProperty("/srcType", "");
                this.getView().getModel().setProperty("/evLogType", "");
                this.getView().getModel('UIModel').setProperty("/selectedKey", "keyAllReasonCodes");

                //Freeze not-used fields
                this.getView().getModel('UIModel').setProperty("/enableFilterReasonCode", false);
                this.getView().getModel('UIModel').setProperty("/enableFilterEventLogType", false);
                this.getView().getModel('UIModel').setProperty("/enableFilterEventSourceType", false);
                break;
            }
            case 'keyRecLogTypes':{
                this.getView().getModel('UIModel').setProperty("/selectedKey", "keyAllReasonCodes");

                this.getView().getModel('UIModel').setProperty("/enableFilterReasonCode", false);
                this.getView().getModel('UIModel').setProperty("/enableFilterEventLogType", true);
                this.getView().getModel('UIModel').setProperty("/enableFilterEventSourceType", true);
                break;
            }
            case 'keyUnrecLogTypes':{
                this.getView().getModel().setProperty("/srcType", "");
                this.getView().getModel().setProperty("/evLogType", "");

                this.getView().getModel('UIModel').setProperty("/enableFilterReasonCode", true);
                this.getView().getModel('UIModel').setProperty("/enableFilterEventLogType", false);
                this.getView().getModel('UIModel').setProperty("/enableFilterEventSourceType", false);
                break;
            }
        
        }
    },

    /**
     * Fetch keys from Select control and define storage type. Its needed to validate the timerange and for filter purposes
     */
    onFilterStorageTypeChange: function(oEvt) {
        var sKey = oEvt.getSource().getSelectedKey();
        this.getView().getModel().setProperty("/area", sKey === "keyAllStorageTypes" ? "both" : "warm");
    },

    /**
     * Evaluates the selected time range of the DateTimeDialog. Sets the value states of the input controls of the DateTimeDialog. In case of invalid time ranges a message popover is shown.
     */
    validateTimeRangeHotWarmStorage : function(aTimeRange) {
        // Get User input for date time ranges and storage type status as these values are needed as part of the validation checks
        var technicalScheduleStartDate = new Date(aTimeRange[0]).getTime();
        var technicalScheduleEndDate = new Date(aTimeRange[1]).getTime();
        var technicalTimeRange = technicalScheduleEndDate - technicalScheduleStartDate;
        var technicalRetentionPeriod = technicalTimeRange / 86400000;

        // Get Retention Period for hot storage
        // Note that the search in the warm storage can be very slow. Therefore, the search in the warm storage is restricted to maximum 1 day.
        var retentionPeriodOriginalEvents = this.getModel("ConfigurationParameters").getProperty("/ConfigurationParameters('RetentionPeriodOriginalEvents')/ValueInteger");
        var retentionPeriodUnrecognizedEvents = this.getModel("ConfigurationParameters").getProperty("/ConfigurationParameters('RetentionPeriodUnrecognizedEvents')/ValueInteger");
        
        var retentionPeriod;
        var oModelData = this.getView().getModel().getData();
        
        if (oModelData.recognized === "true" && oModelData.unrecognized === "true") {
            if (technicalRetentionPeriod > retentionPeriodOriginalEvents && technicalRetentionPeriod < retentionPeriodUnrecognizedEvents) {
                sap.m.MessageToast.show(this.oBundle.getText("SH_OnlyUnrecognizedLogs"));
                this.getView().getModel().setProperty("/recognized", "false"); 
            } else if (technicalRetentionPeriod > retentionPeriodUnrecognizedEvents && technicalRetentionPeriod < retentionPeriodOriginalEvents) {
                sap.m.MessageToast.show(this.oBundle.getText("SH_OnlyRecognizedLogs"));
                this.getView().getModel().setProperty("/unrecognized", "false");  
            }
            retentionPeriod = Math.max(retentionPeriodOriginalEvents, retentionPeriodUnrecognizedEvents);           
        } else {
            retentionPeriod = oModelData.recognized === "true" ? retentionPeriodOriginalEvents : retentionPeriodUnrecognizedEvents;
        }
        
        // Retrieve the start date of the retention period for the hot storage (in the local time)
        var retentionPeriodHotStartDate = new Date().getTime() - retentionPeriod * 86400000;        

        // Check that the search period in the warm storage is smaller than one day
        // Since there might be some delay between time selection and validation check, we add a buffer of 1 hour.
        // So we check that the search time range in the warm storage is smaller than 25 hours, i.e. 90000000 milliseconds.
        if (technicalScheduleEndDate >= retentionPeriodHotStartDate) {
            if (retentionPeriodHotStartDate - technicalScheduleStartDate > 90000000) {
                this.markViolatedControls();
                this.messageUtil.addMessage(sap.ui.core.MessageType.Error, this.oBundle.getText("SH_DayRestriction_MSG", retentionPeriod + 1));
                return false;
            }
        } else {
            if (technicalTimeRange > 90000000) {
                this.markViolatedControls();
                this.messageUtil.addMessage(sap.ui.core.MessageType.Error, this.oBundle.getText("SH_DayRestriction_OnlyWarm_MSG"));
                return false;
            }
        }

        // In case all rules are passed continue with setting datetime filters
        return true;
    },

    /**
     * Check if for the storage type option "only warm" the time range is lower than one day.
     */
    validateTimeRangeOnlyWarmStorage : function(aTimeRange) {
        // Check that the search period in the warm storage is smaller than one day
        // Since there might be some delay between time selection and validation check, we add a buffer of 1 hour.
        // So we check that the search time range in the warm storage is smaller than 25 hours, i.e. 90000000 milliseconds.
        if (new Date(aTimeRange[1]).getTime() - new Date(aTimeRange[0]).getTime() > 90000000) {
            this.messageUtil.addMessage(sap.ui.core.MessageType.Error, this.oBundle.getText("SH_DayRestriction_OnlyWarm_MSG"));
            return false;
        }
        return true;
    },

    validateTimeRange : function() {
        if (!this.oDateTimeDialog) {
            this.getDateTimeSelectionDialog();
        }
        // Get provided user input as UTC DateTimes
        var aTimeRange = this.oDateTimeSelectionHelper.getTimeRangeUnderConsideration();

        // Execute validation checks on time range against hot and warm storage periods. Include also conditions for warm only search.
        if (!aTimeRange) {
            this.messageUtil.addMessage(sap.ui.core.MessageType.Error, this.oBundle.getText("SH_EndBeforeStart_MSG"));
            return false;
        }
        if (this.getView().getModel().getProperty("/area") === "both") {
            return this.validateTimeRangeHotWarmStorage(aTimeRange);
        } else {
            return this.validateTimeRangeOnlyWarmStorage(aTimeRange);
        }
    },

    /**
     * Helper which highlighting the control causing the violation of the validation rule
     */
    markViolatedControls : function() {
        var oView = this.getView();
        if (oView.byId("relativeTimeRange").getSelected()){
            oView.byId("inputTimeLast").setValueState("Error");
        } else {
            oView.byId("datePickerTimeRangeFrom").setValueState("Error");
            oView.byId("datePickerTimeRangeTo").setValueState("Error");
        }
    },

    handleMessagePopoverPress: function(oEvent){
        // Update message model
        if (this.oMessagePopover.getModel("message")) {
            this.oMessagePopover.getModel("message").setData(this.getView().getModel("MessageModel").getData());
        } else {
            this.oMessagePopover.setModel(this.getView().getModel("MessageModel"),"message");
        }

        // Open message pop over
        this.oMessagePopover.toggle(oEvent.getSource());
    },

    onCloseCaseFile: function () {
        this._oCaseFilesDialog.close();
    },

    onAddAndShow: function (oEvent, bReturnToSherlock) {
        var C_CF_DML_PATH = "/sap/secmon/services/malimon/malimonDML.xsjs";
        var aSelectedItems = this._oCaseFilesDialog.getContent()[0].getModel("CaseFileList").getProperty("/selectedItems");
        aSelectedItems.forEach(function (oItem) {
            var oCaseFileData = this._formatCaseFileData(oItem);
            sap.secmon.ui.browse.utils.postJSon(C_CF_DML_PATH, JSON.stringify(oCaseFileData)).then(function (response) {
                if (!bReturnToSherlock) {
                    var href = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#CaseFile-show&/CaseFile/" + response.caseFileId;
                    window.open(href, '_blank');
                }
            });
        }.bind(this));
        if (bReturnToSherlock){
            this._oCaseFilesDialog.close();
        }
    },

    onAddAndReturn: function (oEvent) {
        this.onAddAndShow(oEvent, true);
    },

    _formatCaseFileData: function (oEvent) {
        var aSelectedEvents = this.getView().byId("idSherlockTable").getSelectedItems();
        var oCaseFileData = {
            caseFileId: sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oEvent.Id),
            comments: oEvent.Comments || [],
            createdAt: oEvent.CreatedAt,
            createdBy: oEvent.CreatedBy,
            details: this._formatDetailsObjects(aSelectedEvents),
            details2del: [],
            name: oEvent.Name,
            namespace: oEvent.Namespace,
            operation: "update"
        };
        return oCaseFileData;
    },

    _formatDetailsObjects: function (oEvents) {
        return oEvents.map(function (oEvent) {
            var oEventData = oEvent.getBindingContext("SearchResultModel").getObject();
            return {
                comments: [],
                description: "",
                objectId: oEventData.EventId,
                objectTimestamp: oEventData.Timestamp,
                objectType: "EVENT"
            };
        });
    },

    onDownload: function() {
        var oModel = this.getModel("SearchResultModel");
        // Add the columns that are also visible in the list view table
        var columnDefinition = [];
        if(this.getView().byId("logTypeColumn").getVisible()){
            // Log Type
            columnDefinition.push(
                {
                    name : this.oBundle.getText("SH_Log_Type"),
                    template : {
                        content : {
                            path: 'Recognized',
                            formatter: function(isRecognized){
                                return isRecognized ? this.oBundle.getText("SH_Recognized_Log") : this.oBundle.getText("SH_Unrecognized_Log");
                            }.bind(this)
                        }
                    }
                });
        }
        // Storage type
        if(this.getView().byId("storageTypeColumn").getVisible()){
            columnDefinition.push(
                {
                    name : this.oBundle.getText("SH_Storage_Type"),
                    template : {
                        content : {
                            path: 'Hot',
                            formatter: function(isHot){
                                return isHot ? this.oBundle.getText("SH_Hot") : this.oBundle.getText("SH_Warm");
                            }.bind(this)
                        }
                    }
                });
        }
        if(this.getView().byId("timestampColumn").getVisible()){
            columnDefinition.push(
                // Timestamp
                {
                    name : this.oBundle.getText("SH_Timestamp"),
                    template : {
                        content : "{Timestamp}"
                    }
                });
        }
        // Message
        if(this.getView().byId("messageColumn").getVisible()){
            columnDefinition.push(
                {
                    name : this.oBundle.getText("SH_Message"),
                    template : {
                        content : "{Message}"
                    }
                });
        }
        // TechnicalLogCollectorIPAddress
        if(this.getView().byId("ipAddressColumn").getVisible()){
            columnDefinition.push(
                {
                    name : this.oBundle.getText("SH_TechnicalLogCollectorIPAddress"),
                    template : {
                        content : "{TechnicalLogCollectorIPAddress}"
                    }
                });
        }
        // TechnicalLogCollectorName
        if(this.getView().byId("logCollectorNameColumn").getVisible()){
            columnDefinition.push(
                {
                    name : this.oBundle.getText("SH_TechnicalLogCollectorName"),
                    template : {
                        content : "{TechnicalLogCollectorName}"
                    }
                });
        }
        // TechnicalLogCollectorPort
        if(this.getView().byId("logCollectorPortColumn").getVisible()){
            columnDefinition.push(
                {
                    name : this.oBundle.getText("SH_TechnicalLogCollectorPort"),
                    template : {
                        content : "{TechnicalLogCollectorPort}"
                    }
                });
        }
        // EventSourceId
        if(this.getView().byId("eventSourceIdColumn").getVisible()){
            columnDefinition.push(
                {
                    name : this.oBundle.getText("SH_EventSourceId"),
                    template : {
                        content : "{EventSourceId}"
                    }
                });
        }
        // EventSourceType
        if(this.getView().byId("eventSourceTypeColumn").getVisible()){
            columnDefinition.push(
                {
                    name : this.oBundle.getText("SH_EventSourceType"),
                    template : {
                        content : "{EventSourceType}"
                    }
                });
        }
        // EventLogType
        if(this.getView().byId("eventLogTypeColumn").getVisible()){
            columnDefinition.push(
                {
                    name : this.oBundle.getText("SH_EventLogType"),
                    template : {
                        content : "{EventLogType}"
                    }
                });
        }
        // ReasonCode
        if( this.getView().byId("reasonColumn").getVisible()){
            columnDefinition.push(
                {
                    name : this.oBundle.getText("Interpret_ReasonCode"),
                    template : {
                        content : {
                            path: 'ReasonCode',
                            formatter: function(reason){
                                var reasonText;
                                switch (reason){
                                    case 1:
                                        reasonText = this.oBundle.getText("Interpret_NoRTRuleMatch");
                                        break;
                                    case 2:
                                        reasonText = this.oBundle.getText("Interpret_NoFinalRXMatch");
                                        break;
                                    case 3:
                                        reasonText = this.oBundle.getText("Interpret_IncomplTS");
                                        break;
                                    default:
                                        reasonText = "";
                                        break;
                                }
                                return reasonText;
                            }.bind(this)
                        }
                    }
                });
        }

        var oExport = new sap.ui.core.util.Export({
            exportType : new sap.ui.core.util.ExportTypeCSV({
                separatorChar : ";",
                charSet : "UTF-8"
            }),

            // Pass in the model
            models : oModel,

            // binding information for the rows aggregation
            rows : {
                path : "/"
            },

            // Column definitions with binding info for the content
            columns : columnDefinition
        });

        // Download exported file
        oExport.saveFile().always(function() {
            this.destroy();
        });
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
            window.history.go(-1);
        });
    }
});
