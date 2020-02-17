jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.m.settings.util.Formatter");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.commons.RequestUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.settings.view.EventDetail", {

    OLD_EVENTS_MODEL : "OldEvents",

    METADATA_MODEL : "OldEvents-Metadata",

    OLD_EVENTS_SERVICE_URL : "/sap/secmon/services/ui/m/events.xsjs",
    DELETE_EVENTS_SERVICE_URL : "/sap/secmon/services/ui/m/manageEvents/events.xsjs",

    RETENTION_PERIOD_SERVICE_URL : "/sap/secmon/services/ui/m/manageEvents/retentionPeriod.xsjs",
    PARTITION_TABLE_URL : "/sap/secmon/services/ui/m/manageEvents/PartitionHelper.xsjs",
    CONFIGURATION_PARAMETERS_SERVICE_URL : "/sap/secmon/services/configuration/ConfigurationParameters.xsjs",

    RETENTION_PERIOD_DIALOG_ID : "sap.secmon.ui.m.settings.view.UpdateRetentionPeriodDialog",
    PARTION_RESOLUTION_DIALOG_ID : "sap.secmon.ui.m.settings.view.UpdatePartitionLengthDialog",
    oCommons : null,
    sLocale : sap.ui.getCore().getConfiguration().getLanguage(),

    oOldEventsModel : new sap.ui.model.json.JSONModel(),

    oMetadataModel : new sap.ui.model.json.JSONModel(),

    /* minimum age of events */
    ageInDays : 0,

    /*
     * this is set to true if the application is called with URL parameter "ageInDays"
     */
    ageInDaysPreset : false,

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf v1
     */
    onInit : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.oRequestUtils = new sap.secmon.ui.m.commons.RequestUtils();

        sap.ui.core.UIComponent.getRouterFor(this).attachRoutePatternMatched(this.handleRoute, this);

        this.oOldEventsModel.attachRequestFailed(this.oCommons.handleRequestFailed);
        this.oOldEventsModel.attachRequestCompleted(function() {
        }, this);

        // the user can always change the reference date even if preset
        this.oMetadataModel.setData({
            dateEditable : true
        });

        this.getView().setModel(this.oOldEventsModel);
        this.getView().setModel(this.oMetadataModel, this.METADATA_MODEL);

        this.bindModels();
        this.checkPartitionedTables();
    },

    loadModel : function() {
        $.ajax({
            url : this.OLD_EVENTS_SERVICE_URL + "?ageInDays=" + this.ageInDays,
            async : true,
            type : "GET",
            success : $.proxy(function(oData) {
                // deserialize date string to Date object;
                oData.d.fromDate = new Date(oData.d.fromDate);
                if (this.UTC()) {
                    oData.d.fromDate = this.oCommons.adjustDateForInputInUTC(oData.d.fromDate);
                }
                this.oOldEventsModel.setData(oData);
            }, this)
        });
        // force refresh of UI controls even if model has not changed
        this.oOldEventsModel.refresh(true);
    },

    /*
     * This event is called if the route matches.
     */
    handleRoute : function(oEvent) {

        var args = oEvent.getParameter("arguments");
        if (args === null || args === undefined) {
            return;
        }

        var routeName = oEvent.getParameter("name");
        if (routeName !== 'manageEvents') {
            return;
        }

        var oQueryParameters = args["?query"];
        try {
            if (oQueryParameters.ageInDays) {
                this.ageInDays = +oQueryParameters.ageInDays;
            } else {
                this.ageInDays = 0;
            }
        } catch (e) {
            this.ageInDays = 0;
        }
        this.loadModel();
        this.loadTotalEventCount();
    },

    loadTotalEventCount : function() {
        $.ajax({
            url : this.OLD_EVENTS_SERVICE_URL,
            async : true,
            type : "GET",
            success : $.proxy(function(data) {
                this.getView().byId("totalEventCount").setValue(data.d.number + " " + data.d.numberFactor);
                this.getView().byId("totalOriginalEventCount").setValue(data.d.original.d.number + " " + data.d.original.d.numberFactor);
                this.getView().byId("totalUnrecognizedEventCount").setValue(data.d.unrecognized.d.number + " " + data.d.unrecognized.d.numberFactor);
            }, this)
        });
    },

    expungeOldEvents : function(sType) {
        var controller = this;
        var url = this.DELETE_EVENTS_SERVICE_URL + "/?type=" + sType + "&ageInDays=" + this.ageInDays;
        var csrfToken = this.getComponent().getCsrfToken();
        $.ajax({
            type : "DELETE",
            url : url,
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                jQuery.sap.require("sap.m.MessageBox");
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                });
            },
            complete : function() {
                controller.hideBusyIndicator();
                controller.loadModel();
                controller.loadTotalEventCount();
            }
        });
    },

    /*
     * only consider events older than the give date @param fromDate: the date from which events are to be considered. Events younger than the given date are ignored. @exception e: an exception is
     * thrown if the parameter "fromDate" lies in the future.
     */
    setDateToConsider : function(fromDate) {

        var oDateNow = new Date();
        if (this.UTC()) {
            // today 00:00:00 in UTC time zone
            oDateNow = new Date(Date.UTC(oDateNow.getUTCFullYear(), oDateNow.getUTCMonth(), oDateNow.getUTCDate()));
        } else {
            oDateNow.setHours(0);
            oDateNow.setMinutes(0);
            oDateNow.setSeconds(0);
        }

        this.ageInDays = this.daysBetween(fromDate, oDateNow);
        this.loadModel();
        // refresh UI controls even if model has not changed
        this.oOldEventsModel.refresh(true);
    },

    /*
     * return the number of days between 2 days. @param date1: old date (small timestamp) @param date2 new date (large timestamp) with condition: date1 < date2
     */
    daysBetween : function(date1, date2) {
        // The number of milliseconds in one day
        var ONE_DAY = 1000 * 60 * 60 * 24;
        // Convert both dates to milliseconds
        var oDate1 = date1.getTime();
        var oDate2 = date2.getTime();

        // Calculate the difference in milliseconds
        var iDifferenceInMs = oDate2 - oDate1;
        if (iDifferenceInMs < 0) {
            throw "function daysBetween: Illegal input: date1 must be before date2";
        }
        // Convert back to days and return
        return Math.round(iDifferenceInMs / ONE_DAY);
    },

    onBackButtonPressed : function() {
        window.history.go(-1);
    },

    onDelete : function(oEvent) {
        var sType = "";
        var sFormat = "";
        if (oEvent.getSource().getId().endsWith("Log")) {
            sType = "log";
            sFormat = this.getText("MngEv_Expunge_XLBL");
        } else if (oEvent.getSource().getId().endsWith("Original")) {
            sType = "original";
            sFormat = this.getText("MngOREv_Expunge_XLBL");
        } else if (oEvent.getSource().getId().endsWith("Unrecognized")) {
            sType = "unrecognized";
            sFormat = this.getText("MngULEv_Expunge_XLBL");
        }
        var that = this;
        var onClose = function(oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {
                that.showBusyIndicator();
                that.expungeOldEvents(sType);
            }
        };
        /*
         * works only for SAPUI5 version 1.22 or higher. For lower version the callback is not called.
         */
        // Delete events older than {0}
        var fromDate = this.getView().getModel().getProperty("/d/fromDate");
        var fromDateString = sap.secmon.ui.commons.Formatter.dateFormatterEx(this.UTC(), fromDate);

        sap.m.MessageBox.confirm(this.i18nText(sFormat, fromDateString), {
            title : this.getText("MngEv_Confirm_XLBL"),
            // styleClass : "sapUiSizeCompact",
            onClose : onClose
        });

    },

    onDateSelected : function(oEvent) {
        var oControl = oEvent.oSource;
        var now = new Date();
        now.setHours(0);
        now.setMinutes(0);
        now.setSeconds(0);
        var oNewDate = oControl.getDateValue();
        try {
            if (this.UTC()) {
                oNewDate = this.oCommons.adjustTimeInputToUTC(oNewDate);
            }
            this.setDateToConsider(oNewDate);
            oControl.setValueState(sap.ui.core.ValueState.None);
        } catch (e) {
            // an exception is thrown if the controller does not accept
            // the changed date
            sap.m.MessageBox.alert(this.getText("MngEv_Validate_Date_XMSG"), {
                title : this.getCommonText("Error_TIT")
            });
            oControl.setValueState(sap.ui.core.ValueState.Error);
        }

    },

    showBusyIndicator : function() {
        this.getView().byId("EventDetailPage").setBusy(true);
    },

    hideBusyIndicator : function() {
        this.getView().byId("EventDetailPage").setBusy(false);
    },

    bindRetentionPeriodInput : function(sInputId, oModel, sConfigurationParameterName) {
        var oText = this.getView().byId(sInputId);
        oText.setModel(oModel);
        oText.bindElement("/ConfigurationParameters('" + sConfigurationParameterName + "')");
    },

    bindModels : function() {
        var oModel = this.getComponent().getModel("ConfigurationParameters");
        var that = this;
        oModel.attachRequestCompleted(function() {
            that.retentionPeriod = oModel.getProperty("/ConfigurationParameters('RetentionPeriod')/ValueInteger");
            that.retentionPeriodOriginalEvents = oModel.getProperty("/ConfigurationParameters('RetentionPeriodOriginalEvents')/ValueInteger");
            that.retentionPeriodUnrecognizedEvents = oModel.getProperty("/ConfigurationParameters('RetentionPeriodUnrecognizedEvents')/ValueInteger");
            oModel.getProperty("/ConfigurationParameters('MovePartitions')/ValueVarChar");
            oModel.getProperty("/ConfigurationParameters('PartitionField')/ValueVarChar");
            oModel.getProperty("/ConfigurationParameters('PartitionResolution')/ValueInteger");
        });
        this.bindRetentionPeriodInput("retentionPeriod", oModel, 'RetentionPeriod');
        this.bindRetentionPeriodInput("retentionPeriodOriginalEvents", oModel, 'RetentionPeriodOriginalEvents');
        this.bindRetentionPeriodInput("retentionPeriodUnrecognizedEvents", oModel, 'RetentionPeriodUnrecognizedEvents');
        this.bindRetentionPeriodInput("AutomaticPartitionComboBox", oModel, 'MovePartitions');
        this.bindRetentionPeriodInput("PartitionFieldComboBox", oModel, 'PartitionField');
        this.bindRetentionPeriodInput("PartitionResolutionInput", oModel, 'PartitionResolution');
    },

    editDialog : function(dialogProperty, dialogId, inputId, validationServiceProperty) {
        var returnValue, dialog = this[dialogProperty], validationService = this[validationServiceProperty];
        if (!dialog) {
            returnValue = this.createUpdateRetentionPeriodDialog(dialogId, inputId);

            dialog = returnValue.dialog;
            validationService = returnValue.inputValidation;
        }
        dialog.setModel(this.oEditModel);
        validationService.resetValueStateOfControls();
        dialog.open();
        this[dialogProperty] = dialog;
        this[validationServiceProperty] = validationService;
    },

    onChange : function() {
        this.oEditModel = new sap.ui.model.json.JSONModel({
            dialogTitle : this.getText("MngEv_RetentionPLog_XTIT"),
            retentionPeriod : this.retentionPeriod,
            configParameterName : "RetentionPeriod"
        });
        this.editDialog("updateRetentionPeriodDialog", this.RETENTION_PERIOD_DIALOG_ID, "retentionPeriodInput", "oInputValidationService");
    },

    onChangeOriginalEvents : function() {
        this.oEditModel = new sap.ui.model.json.JSONModel({
            dialogTitle : this.getText("MngEv_RetentionPOrig_XTIT"),
            retentionPeriod : this.retentionPeriodOriginalEvents,
            configParameterName : "RetentionPeriodOriginalEvents"
        });
        this.editDialog("updateRetentionPeriodDialog", this.RETENTION_PERIOD_DIALOG_ID, "retentionPeriodInput", "oInputValidationService");
    },

    onChangeUnrecognizedEvents : function() {
        this.oEditModel = new sap.ui.model.json.JSONModel({
            dialogTitle : this.getText("MngEv_RetentionPUnr_XTIT"),
            retentionPeriod : this.retentionPeriodUnrecognizedEvents,
            configParameterName : "RetentionPeriodUnrecognizedEvents"
        });
        this.editDialog("updateRetentionPeriodDialog", this.RETENTION_PERIOD_DIALOG_ID, "retentionPeriodInput", "oInputValidationService");
    },
    onChangeAutomaticPartition : function() {
        this.changeComboBox("MovePartitions", "AutomaticPartitionComboBox");
    },
    onChangePartitionField : function() {
        this.changeComboBox("PartitionField", "PartitionFieldComboBox");
    },
    onPartitionLengthChange : function() {
        var oModel = this.getComponent().getModel("ConfigurationParameters");
        this.oEditModel = new sap.ui.model.json.JSONModel({
            dialogTitle : this.getText("MngEv_RetentionPLog_XTIT"),
            partitionLength : oModel.getProperty("/ConfigurationParameters('PartitionResolution')/ValueInteger"),
            configParameterName : "PartitionResolution"
        });
        this.editDialog("updatePartitionResolutionDialog", this.PARTION_RESOLUTION_DIALOG_ID, "partitionLengthInput", "oInputPartitionValidationService");
    },
    changeComboBox : function(field, comboBoxId) {
        var oComboBox = this.getView().byId(comboBoxId);
        var that = this;
        var csrfToken = this.getComponent().getCsrfToken();
        var objectToSendAsJSON = {

        };
        objectToSendAsJSON[field] = oComboBox.getSelectedKey();

        this.oRequestUtils.postRequest(this.CONFIGURATION_PARAMETERS_SERVICE_URL, objectToSendAsJSON, csrfToken, function() {
            sap.m.MessageToast.show(that.getText("ChangeSaved_MSG"));
            that.getView().getModel("ConfigurationParameters").refresh();
        });
    },
    createUpdateRetentionPeriodDialog : function(dialogId, inputId) {
        var dialog = sap.ui.xmlfragment(this.getView().getId(), dialogId, this);
        dialog.setModel(this.baseI18nModel, "i18n");
        this.getView().addDependent(dialog);
        var aInputs = [ this.getView().byId(inputId) ];
        var inputValidation = new sap.secmon.ui.commons.InputValidationService(aInputs);
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), dialog);
        return {
            dialog : dialog,
            inputValidation : inputValidation
        };
    },
    onUpdatePartitionLengthOk : function() {
        if (!this.oInputPartitionValidationService.checkControls()) {
            return;
        }
        var oData = this.oEditModel.getData();
        var objectToSendAsJSON = {};
        objectToSendAsJSON[oData.configParameterName] = oData.partitionLength;
        this.sendRequestAndUpdateModel(objectToSendAsJSON, this.CONFIGURATION_PARAMETERS_SERVICE_URL, this.updatePartitionResolutionDialog);
    },

    onUpdateRetentionPeriodOk : function() {
        if (!this.oInputValidationService.checkControls()) {
            return;
        }
        var oData = this.oEditModel.getData();
        var objectToSendAsJSON = {
            retentionPeriod : oData.retentionPeriod,
            configParameterName : oData.configParameterName
        };
        this.sendRequestAndUpdateModel(objectToSendAsJSON, this.RETENTION_PERIOD_SERVICE_URL, this.updateRetentionPeriodDialog);
    },

    sendRequestAndUpdateModel : function(objectToSendAsJSON, url, dialog) {
        var that = this;
        var csrfToken = this.getComponent().getCsrfToken();
        this.oRequestUtils.postRequest(url, objectToSendAsJSON, csrfToken, function() {
            that.getView().getModel("ConfigurationParameters").refresh();
            dialog.close();
        });
    },

    onUpdateRetentionPeriodCancel : function() {
        this.updateRetentionPeriodDialog.close();
    },
    onUpdatePartitionLengthCancel : function() {
        this.updatePartitionResolutionDialog.close();
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/0b109994be724796831bd0bf64a30df1.html");
    },

    checkPartitionedTables : function() {
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.loadData(this.PARTITION_TABLE_URL, null, false);
        this.getView().setModel(oModel, "partitionModel");
    }
});