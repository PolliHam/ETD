jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.m.MessageBox");

/**
 * a controller for the dialog view "CreateRunDialog" used in creating a log learning run. The controller also offers a convenience method "openCreateRunDialog". Caution: This controller does not have
 * a view. It only acts as event handler for events declared in XML fragment "CreateRun". Therefore, some inherited methods of EtdController do not work: "getComponent" relies on a view to be known.
 * The inherited methods "getText" and "getCommonText" have been overridden.
 */
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.commons.dialogs.UploadRunDialog", {

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
    openDialog : function(oParentView, fnSuccessCallback) {
        this.fnSuccessCallback = fnSuccessCallback;
        this.oParentView = oParentView;

        // with the passed in "this", the event handler for events thrown in XML fragment is this controller
        this.oDialog = sap.ui.xmlfragment(oParentView.getId(), "sap.secmon.ui.m.commons.dialogs.UploadRunDialog", this);
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

    onTypeMissmatch : function(oEvent) {
        sap.m.MessageBox.show(this.getText("Interpret_FileTypeWrongJson"), {
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
        var oModel = this.createRunModel;
        if (oEvent.getParameter("id").endsWith("cancel")) {            
            this.createRunModel.setProperty("/fileName", "");
            this._destroyDialog();
            return;
        }

        var sFileName = oModel.getProperty("/fileName");
        if ((!sFileName || sFileName === "")) {
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, this.getText("Interpret_EnterAllFields"));
            return;
        }

        this.oDialog.setBusy(true);
        var oFileUploader = this.oParentView.byId("runFileUploader");
        oFileUploader.setUploadUrl("/sap/secmon/loginterpretation/runService.xsjs?command=uploadRun");

        var sToken = new sap.secmon.ui.commons.AjaxUtil().getXCSRFToken("/sap/secmon/services/ui/commons/dummyService.xsjs").getResponseHeader('X-CSRF-Token');
        oFileUploader.removeAllHeaderParameters();
        oFileUploader.insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
            name : "X-CSRF-Token",
            value : sToken
        }));

        oFileUploader.upload();
        // the file uploader will throw event "onUploadComplete" when finished

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
                // success            
                var sRunName = oResponse.RunName;
                this.createRunModel.setProperty("/fileName", "");        
                this.handleRunCreated(sRunName);
                this._destroyDialog();
            }
        }
    },

    handleRunCreated : function(sRunName) {
        var that = this;
        this.oDialog.setBusy(false);
        this._destroyDialog();

        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, this.i18nText(this.getText("Interpret_UploadRunSuc"), sRunName));

        that.fnSuccessCallback.call(that, sRunName);
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
    
    _destroyDialog : function(){
        this.oDialog.close();
        this.oDialog.destroy();
        this.oDialog = null;
    }

});