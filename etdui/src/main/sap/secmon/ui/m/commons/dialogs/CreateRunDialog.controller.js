jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.m.MessageBox");

/**
 * a controller for the dialog view "CreateRunDialog" used in creating a log learning run. The controller also offers a convenience method "openCreateRunDialog". Caution: This controller does not have
 * a view. It only acts as event handler for events declared in XML fragment "CreateRun". Therefore, some inherited methods of EtdController do not work: "getComponent" relies on a view to be known.
 * The inherited methods "getText" and "getCommonText" have been overridden.
 */
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.commons.dialogs.CreateRunDialog", {
    onInit : function() {
        this.applyCozyCompact();

    },

    /**
     * (re)set the CreateRun model
     */
    setCreateRunModel : function(oDialog) {
        if (!this.createRunModel) {
            this.createRunModel = new sap.ui.model.json.JSONModel();
        }
        oDialog.setModel(this.createRunModel, "CreateRunModel");
        var oData = {
            runName : "",
            runDescription : "",
            fileName : "",
            runSTSeparator : ",",
            runLayout : "TX",
            runKVSeparator : "=",
            runKVPSeparator : ",",
            STSepCharacters : 1,
            KVSepCharacters : 1,
            KVPSepCharacters : 1,
            ShowFileUpload : false
        };
        this.createRunModel.setData(oData);
    },

    /**
     * create models and set them to dialog.
     * 
     * @param oDialog
     *            the dialog
     */
    createModels : function(oDialog) {

        // set own i18n model
        this.i18nModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/m/commons/dialogs/i18n/UIText.hdbtextbundle"
        });
        oDialog.setModel(this.i18nModel, "i18n");

        // set i18nCommon model
        if (oDialog.getModel("i18nCommon") === undefined) {
            this.i18nModelCommon = new sap.ui.model.resource.ResourceModel({
                bundleUrl : "/sap/secmon/ui/CommonUIText.hdbtextbundle"
            });
            oDialog.setModel(this.i18nModelCommon, "i18nCommon");
        } else {
            this.i18nModelCommon = oDialog.getModel("i18nCommon");
        }

        // logDiscovery model, not used in UI
        this.oLogDiscoveryModel = new sap.ui.model.odata.ODataModel("/sap/secmon/loginterpretation/logDiscoveryAPI.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
    },

    /*-
     * Shows a dialog for entering run properties.
     * Afterwards a run is created.
     * @param oParentView the parent view from which the dialog is opened
     * @param aSampleLogs optional. if supplied, a run is created with given sample logs (array of strings).
     * @param fnSuccessCallback callback which is executed on success
     * If not, the popup dialog shows a file upload.
     */
    openDialog : function(oParentView, aSampleLogs, fnSuccessCallback) {
        this.fnSuccessCallback = fnSuccessCallback;
        this.oParentView = oParentView;
        this.aSampleLogs = aSampleLogs;

        // with the passed in "this", the event handler for events thrown in XML fragment is this controller
        this.oDialog = sap.ui.xmlfragment(oParentView.getId(), "sap.secmon.ui.m.commons.dialogs.CreateRunDialog", this);
        oParentView.addDependent(this.oDialog);
        this.createModels(this.oDialog);

        // rest the createRun model every time the dialog is opened
        this.setCreateRunModel(this.oDialog);
        var bSamplesProvided = (this.aSampleLogs && this.aSampleLogs.length > 0);
        this.createRunModel.setProperty("/ShowFileUpload", !bSamplesProvided);

        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", oParentView, this.oDialog);
        this.oDialog.open();
    },

    _getProgressBarDialog : function() {
        if (!this._oProgressDialog) {
            this.progressBarModel = new sap.ui.model.json.JSONModel({
                percentValue : 0,
                displayValue : "0%"
            });

            this._oProgressDialog = sap.ui.xmlfragment(this.oParentView.getId() + "Progress", "sap.secmon.ui.m.commons.dialogs.ProgressDialog", this);
            this._oProgressDialog.setModel(this.progressBarModel, "ProgressBarModel");
            this._oProgressDialog.setModel(this.i18nModel, "i18n");
            this._oProgressDialog.setModel(this.i18nModelCommon, "i18nCommon");
            this.oParentView.addDependent(this._oProgressDialog);
        }
        return this._oProgressDialog;
    },

    onSelectRadioButton : function(oEvent) {
        var sSelectedKey;
        switch (oEvent.getParameter("selectedIndex")) {
        case 0:
            sSelectedKey = "TX";
            break;
        case 1:
            sSelectedKey = "KV";
            break;
        case 2:
            sSelectedKey = "ST";
            break;
        case 3:
            sSelectedKey = "CF";
            break;
        }
        this.createRunModel.setProperty("/runLayout", sSelectedKey);
    },

    onChangeSTSeparator : function(oEvent) {
        var content = oEvent.getParameter("value");
        this.createRunModel.setProperty("/STSepCharacters", content.length);
    },

    onChangeKVSeparator : function(oEvent) {
        var content = oEvent.getParameter("value");
        this.createRunModel.setProperty("/KVSepCharacters", content.length);
    },

    onChangeKVPSeparator : function(oEvent) {
        var content = oEvent.getParameter("value");
        this.createRunModel.setProperty("/KVPSepCharacters", content.length);
    },

    checkRunName : function(oEvent) {
        var input = oEvent.getSource();
        var value = input.getValue();
        var letters = /^[0-9a-zA-Z_-]+$/;
        if (value.match(letters)) {
            input.setValueState(sap.ui.core.ValueState.None);
            input.setValueStateText(null);
        } else {
            input.setValueState(sap.ui.core.ValueState.Error);
        }
    },

    onTypeMissmatch : function(oEvent) {
        sap.m.MessageBox.show(this.getText("Interpret_FileTypeWrongTxt"), {
            icon : sap.m.MessageBox.Icon.ERROR,
            title : "{i18n>Interpret_FileTypeWrong}"
        });
    },

    onUploadAborted : function(oEvent) {
        this.createRunModel.setProperty("/fileName", "");
    },

    onCloseProgressDialog : function(oEvent) {
        // Progress Bar Dialog
        this._oProgressDialog.close();
        clearInterval(this._fnAutoRefresher);
        return;
    },

    onCloseDialog : function(oEvent) {
        var sKVSep, sKVPSep;
        var oModel = this.createRunModel;
        if (oEvent.getParameter("id").endsWith("cancel")) {
            this._resetRadioButton();
            this.createRunModel.setProperty("/fileName", "");
            this._destroyDialog();
            return;
        }

        var sRunName = oModel.getProperty("/runName");
        if (!sRunName || sRunName === "") {
            this.oParentView.byId("textNewRunRunName").focus();
            this.oParentView.byId("textNewRunRunName").setValueState(sap.ui.core.ValueState.Error);
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, this.getText("Interpret_EnterAllFields"));
            return;
        } else {
            this.oParentView.byId("textNewRunRunName").setValueState(sap.ui.core.ValueState.None);
        }

        var bShowFileUpload = this.createRunModel.getProperty("/ShowFileUpload");
        var sFileName = oModel.getProperty("/fileName");
        if (bShowFileUpload && (!sFileName || sFileName === "")) {
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, this.getText("Interpret_EnterAllFields"));
            return;
        }

        var sRunDescription = oModel.getProperty("/runDescription");
        var sLogLayout = oModel.getProperty("/runLayout");
        var sSTSeparator = oModel.getProperty("/runSTSeparator");
        if (sLogLayout === "CF") {
            sKVSep = "=";
            sKVPSep = "|";
        } else {
            sKVSep = oModel.getProperty("/runKVSeparator");
            sKVPSep = oModel.getProperty("/runKVPSeparator");
        }

        this.oDialog.setBusy(true);
        if (bShowFileUpload === true) {
            var oFileUploader = this.oParentView.byId("runFileUploader");
            oFileUploader.setUploadUrl("/sap/secmon/loginterpretation/runService.xsjs?command=createRun&runName=" + encodeURIComponent(sRunName) + "&runDescription=" +
                    encodeURIComponent(sRunDescription) + "&logLayout=" + sLogLayout + "&stSeparator=" + encodeURIComponent(sSTSeparator) + "&kvSeparator=" + encodeURIComponent(sKVSep) +
                    "&kvpSeparator=" + encodeURIComponent(sKVPSep) + "&source=file");

            var sToken = new sap.secmon.ui.commons.AjaxUtil().getXCSRFToken("/sap/secmon/services/ui/commons/dummyService.xsjs").getResponseHeader('X-CSRF-Token');
            oFileUploader.removeAllHeaderParameters();
            oFileUploader.insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                name : "X-CSRF-Token",
                value : sToken
            }));

            oFileUploader.upload();
            // the file uploader will throw event "onUploadComplete" when finished
        } else {
            var that = this;
            var promise =
                    new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=createRun&runName=" + encodeURIComponent(sRunName) + "&runDescription=" +
                            encodeURIComponent(sRunDescription) + "&logLayout=" + sLogLayout + "&stSeparator=" + encodeURIComponent(sSTSeparator) + "&kvSeparator=" + encodeURIComponent(sKVSep) +
                            "&kvpSeparator=" + encodeURIComponent(sKVPSep) + "&source=unrecognized", JSON.stringify(this.aSampleLogs));
            promise.fail(function(jqXHR, textStatus, errorThrown) {
                that.oDialog.setBusy(false);
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, decodeURIComponent(jqXHR.responseText));
            });

            promise.done(function(data, textStatus, jqXHR) {
                that.handleRunCreated(sRunName);
            });
        }
    },

    /**
     * This event handler is called from file upload.
     */
    onUploadComplete : function(oEvent) {
        this.oDialog.setBusy(false);

        var sResponse = oEvent.getParameter("responseRaw");
        if (oEvent.getParameter("status") > 300) {
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, decodeURIComponent(sResponse));
        } else {

            if (sResponse) {
                var oResponse = JSON.parse($($.parseHTML(sResponse)).text());
                if (oResponse.status === "Error") {
                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, decodeURIComponent(oResponse.text));
                    return;
                }
            }

            // success
            var sRunName = this.createRunModel.getProperty("/runName");
            this.createRunModel.setProperty("/fileName", "");
            this._resetRadioButton();
            this.handleRunCreated(sRunName);
        }
    },

    handleRunCreated : function(sRunName) {
        this.oDialog.setBusy(false);
        this._resetRadioButton();
        this._destroyDialog();

        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, this.i18nText(this.getText("Interpret_UploadSuc"), sRunName));

        // Open progress bar fragment and keep it open until the run status has changed to Successful or Error.
        var oProgressDialog = this._getProgressBarDialog();
        oProgressDialog.open();
        var that = this;
        // poll for run status every 2 seconds
        this._fnAutoRefresher = setInterval(function() {
            that.pollRunStatus();
        }, 2000);
    },

    /**
     * this function is executed periodically until the run status changes to "Error" or "Successful". The progress bar dialog is open while it is polling.
     */
    pollRunStatus : function() {
        var sStatus, sPhase, durationInMins, durationInSecs, sMsg;

        // Retrieve state and phase
        var that = this;
        var sRunName = this.createRunModel.getProperty("/runName");
        this.oLogDiscoveryModel.read("/Run('" + sRunName + "')", {
            // urlParameters : {
            // $select : "Status,Phase,CommandType,OriginalRecordCount,InputDataCount,StagingCount,RunName,CommandDurationInMinutes"
            // },
            async : false,
            success : function(oResponse2) {
                sStatus = oResponse2.Status;
                sPhase = oResponse2.CommandType;
                durationInMins = oResponse2.CommandDurationInMinutes || "0";
                durationInSecs = Math.round(parseFloat(durationInMins) * 60);

                // update model
                if (sStatus === "Open" || sStatus === "Read") {
                    var val = that.progressBarModel.getProperty("/percentValue");
                    val += 2;
                    if (val > 100) {
                        val = 0;
                    }
                    that.progressBarModel.setProperty("/percentValue", val);
                    sMsg = (sStatus === 'Open') ? that.getText("Interpret_WaitSDS") : that.getText("Interpret_WaitStart");
                    that.progressBarModel.setProperty("/displayValue", that.i18nText(sMsg, durationInSecs));
                } else {
                    // the status should be "Running"
                    var iPercentValue = Math.round((parseInt(oResponse2.OriginalRecordCount) / parseInt(oResponse2.InputDataCount)) * 100);

                    that.progressBarModel.setProperty("/percentValue", iPercentValue);
                    sMsg = that.getText("Interpret_Running");
                    that.progressBarModel.setProperty("/displayValue", that.i18nText(sMsg, iPercentValue));
                }

                that.oLogDiscoveryModel.setProperty("/Run('" + oResponse2.RunName + "')/Status", sStatus);
                that.oLogDiscoveryModel.setProperty("/Run('" + oResponse2.RunName + "')/Phase", sPhase);

                // stop auto refresh, refresh the whole
                // model and navigate to run
                if (sStatus === "Error" || sStatus === "Successful") {
                    clearInterval(that._fnAutoRefresher);
                    that._oProgressDialog.close();

                    if (sStatus === "Error") {
                        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, that.i18nText(that.getText("Interpret_FaultyRun"), sRunName));

                    } else if (sStatus === "Successful" && sPhase === "Staging" && oResponse2.StagingCount === 0) {
                        var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=buildEntryTypes&runName=" + encodeURIComponent(sRunName));
                        that.oParentView.setBusy(true);
                        promise.fail(function(jqXHR, textStatus, errorThrown) {
                            that.oParentView.setBusy(false);
                            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, decodeURIComponent(jqXHR.responseText));
                            that.createRunModel.refresh();
                        });
                        promise.done(function(data, textStatus, jqXHR) {
                            that.oParentView.setBusy(false);
                            if (data.status === "Ok") {
                                if (that.fnSuccessCallback) {
                                    that.fnSuccessCallback.call(that, sRunName);
                                }
                            } else {
                                var oError = JSON.parse(jqXHR.responseText);
                                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, decodeURIComponent(oError.text));
                            }
                            that.createRunModel.refresh();
                        });
                    }
                }
            },
            error : function(oError) {
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, decodeURIComponent(oError.message) + "\n" + oError.response.body);
                console.error(oError);

                clearInterval(that._fnAutoRefresher);
                that._oProgressDialog.close();
            }
        });
    },

    /**
     * overridden method: EtdController.getText won't work because getComponent does not work.
     */
    getText : function(sTextKey) {
        var parameters = Array.prototype.slice.call(arguments, 0), model = this.i18nModel.getResourceBundle();
        return model.getText.apply(model, parameters);
    },

    /**
     * overridden method: EtdController.getText won't work because getComponent does not work.
     */
    getCommonText : function(sTextKey) {
        var parameters = Array.prototype.slice.call(arguments, 0), model = this.i18nModelCommon.getResourceBundle();
        return model.getText.apply(model, parameters);
    },

    /**
     * do not use 2-way-binding: It might happen that the file uploader will send empty content.
     */
    onFileChange : function(oEvent) {
        this.createRunModel.setProperty("/fileName", oEvent.getParameter("newValue"));
    },

    _resetRadioButton : function() {
        var radioButtonId = this.oParentView.byId("radioGroupID");
        if (radioButtonId.getSelectedIndex() !== 0) {
            radioButtonId.setSelectedIndex(0);
        }
    },

    _destroyDialog : function() {
        this.oDialog.close();
        this.oDialog.destroy();
        this.oDialog = null;
    }
});