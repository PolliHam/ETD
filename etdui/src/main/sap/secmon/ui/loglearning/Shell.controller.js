/* globals oTextBundle */

$.sap.require("sap.secmon.ui.commons.CommonFunctions");
$.sap.require("sap.secmon.ui.commons.Formatter");
$.sap.require("sap.secmon.ui.loglearning.util.Formatter");
$.sap.require("sap.secmon.ui.commons.AjaxUtil");
$.sap.require("sap.m.MessageToast");
$.sap.require("sap.secmon.ui.m.commons.EtdController");
$.sap.require("sap.secmon.ui.m.commons.LoglearningRunCreator");
$.sap.require("sap.secmon.ui.m.commons.LoglearningRunUploader");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.loglearning.Constants");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.loglearning.Shell", {

    oRouter : null,
    fnAutoRefresh : undefined,
    Constants : sap.secmon.ui.loglearning.Constants,

    handleRouteMatched : function(oEvent) {
        this.initModels();
    },

    onInit : function() {
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);
        this.runCreator = new sap.secmon.ui.m.commons.LoglearningRunCreator();
        this.runUploader = new sap.secmon.ui.m.commons.LoglearningRunUploader();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
    },

    /**
     * Opens knowledge base ui
     * 
     * @param oEvent
     */
    onPressKnowledgeBaseLink : function(oEvent) {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            sap.secmon.ui.m.commons.NavigationService.openKBLogType();
        });
    },

    /**
     * Opens forensic lab ui in separate window
     * 
     * @param oEvent
     */
    onPressFLLink : function(oEvent) {
        var sLanguage = sap.secmon.ui.m.commons.NavigationService.getLanguage();
        window.open("/sap/secmon/ui/browse/" + "?" + sLanguage.substring(1));
    },

    onAfterRendering : function() {
    },

    /**
     * when a user clicks on a message, remove it from the notifier
     * 
     * @memberOf sap.secmon.ui.loglearning.Shell
     */
    onMessageSelected : function(oEvent) {
        var notifier = oEvent.getParameters().notifier;
        var message = oEvent.getParameters().message;
        notifier.removeMessage(message);
        message.destroy();
    },

    /**
     * Initializes the models
     * 
     * @memberOf sap.secmon.ui.loglearning.Shell
     */
    initModels : function() {
        var oController = this;
        var oView = oController.getView();

        var oLogDiscoveryModel = sap.ui.getCore().getModel("logDiscovery");

        this.getView().setModel(new sap.ui.model.json.JSONModel({
            runIsSelected : false
        }), "shellModel");

        oLogDiscoveryModel.attachRequestFailed(function(oError) {
            console.error(oError);
            oController.reportErrorMessage(oError.getParameter("responseText"));
        });

        oView.setModel(sap.ui.getCore().getModel("CountModel"), "CountModel");

    },

    /**
     * Report error of AJAX request in the notification bar
     * 
     * @param oError
     *            Error object returned from the AJAX request
     */
    reportError : function(oError) {
        switch (oError.errorCode) {
        case "DB":
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, oTextBundle.getText("Interpret_ErrorDb", decodeURIComponent(oError.text)));
            break;
        default:
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, decodeURIComponent(oError.text));
        }
    },
    /**
     * Report warning message in the notification bar
     * 
     * @param sText
     *            Message text
     */
    reportWarning : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Warning, sText, sText);
    },
    /**
     * Report error message in the notification bar
     * 
     * @param sText
     *            Message text
     */
    reportErrorMessage : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sText);
    },
    /**
     * Reports success message in the notification bar
     * 
     * @param sText
     *            Message Text
     */
    reportSuccess : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, sText);
    },

    /**
     * Open documentation
     * 
     * @param oEvent
     */
    onPressHelp : function(oEvent) {
        var oButton = oEvent.getSource();

        // singleton
        if (!this._helpMenu) {
            this._helpMenu = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.loglearning.HelpMenuGlobal", this);
            this.getView().addDependent(this._helpMenu);

            // toggle compact style
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._helpMenu);
        }
        var eDock = sap.ui.core.Popup.Dock;
        this._helpMenu.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);
    },

    onPressHelpCreateRun : function(oEvent) {
        window.open("/sap/secmon/help/0a836e7427f047b285c9b6fd79fbfc7d.html");
    },

    /**
     * Open documentation
     * 
     * @param oEvent
     */
    onPressHelpOverview : function(oEvent) {
        window.open("/sap/secmon/help/f0f88f8fdf334027b05b76c72d9f8467.html");
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    /**
     * Invoked when user creates a run
     * 
     * @memberOf sap.secmon.ui.loglearning.runs
     */
    onPressCreateRun : function(oEvent) {
        var that = this;
        function onSuccess(sRunName) {
            var navParams = {
                run : sRunName,
                query : {
                    lastNav : that.oCommons.formatDateToYyyymmddhhmmssUTC(new Date())
                }
            };
            that.oRouter.navTo(that.Constants.ROUTES.ENTRY_TYPES.ROUTE, navParams, false);
        }
        this.runCreator.showRunCreationDialog(this.getView(), null, onSuccess);
    },

    /**
     * Invoked when user deletes multiple runs
     * 
     * @memberOf sap.secmon.ui.loglearning.runs
     */
    onPressDeleteRun : function(oEvent) {
        var oView = this.getView().getContent()[0].getContent()[0];
        var oShell = this;
        var aItems = oView.byId("tableRuns").getSelectedItems();
        var oData = {
            "runNames" : []
        };

        if (!aItems || aItems.length === 0) {
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, oTextBundle.getText("Interpret_SelectARun"));
            return;
        }

        var oTable = oView.byId("tableRuns");
        var oModel = sap.ui.getCore().getModel("logDiscovery");

        // Confirmation Dialog
        sap.ui.commons.MessageBox.confirm(oTextBundle.getText("Interpret_DelReally"), function(bConfirmed) {
            if (bConfirmed) {
                // User has confirmed deletion
                oView.setBusy(true);

                // Collect paths
                $.each(aItems, function(iIndex, oItem) {
                    oData.runNames.push(oItem.getBindingContext().getProperty("RunName"));
                });

                var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=deleteRuns", JSON.stringify(oData));
                promise.fail(function(jqXHR, textStatus, errorThrown) {
                    oModel.refresh();
                    oView.setBusy(false);
                    oShell.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
                });
                promise.done(function(data, textStatus, jqXHR) {
                    oModel.refresh();
                    oView.setBusy(false);
                    oShell.getView().byId("btnDeleteRun").setEnabled(false);
                    oShell.getView().byId("btnExportRun").setEnabled(false);
                    oTable.removeSelections(true);
                    oShell.reportSuccess(oTextBundle.getText("Interpret_RunsDelSuc"));
                });
            }
        }, "{i18n>Interpret_DeleteRun}");

    },

    onPressExport : function(oEvent) {
        var aItems = this.getView().getContent()[0].getContent()[0].byId("tableRuns").getSelectedItems();
        $.each(aItems, function(iIndex, oItem) {
            var sRunName = oItem.getBindingContext().getProperty("RunName");
            window.open("/sap/secmon/loginterpretation/runService.xsjs?command=downloadLogFileOfRun&runName=" + encodeURIComponent(sRunName));
        });
    },

    onPressDownloadRun : function(oEvent) {
        var aItems = this.getView().getContent()[0].getContent()[0].byId("tableRuns").getSelectedItems();
        $.each(aItems, function(iIndex, oItem) {
            var sRunName = oItem.getBindingContext().getProperty("RunName");
            window.open("/sap/secmon/loginterpretation/runService.xsjs?command=downloadRun&runName=" + encodeURIComponent(sRunName));
        });
    },

    onPressUploadRun : function(oEvent) {
        var that = this;
        function onSuccess(sRunName) {
            var navParams = {
                run : sRunName,
                query : {
                    lastNav : that.oCommons.formatDateToYyyymmddhhmmssUTC(new Date())
                }
            };
            that.oRouter.navTo(that.Constants.ROUTES.ENTRY_TYPES.ROUTE, navParams, false);
        }
        this.runUploader.showRunUploadDialog(this.getView(), onSuccess);
    },

    /**
     * Synchronizes the runtime rules with ESP by sending staging control command
     * 
     * @param oEvent
     */
    onPressSyncESP : function(oEvent) {
        var that = this;
        var oShell = this;

        var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=updateAllRTRules");
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            oShell.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
        });
        promise.done(function(data, textStatus, jqXHR) {
            if (data.status === "Ok") {
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, oTextBundle.getText("Interpret_SyncESPSuc"));

                that._oSyncSDSDialog = null;
                var oDialog = that._getSyncSDSDialog();
                oDialog.open();

                // Automatically update the status every 250ms
                var fnAutomaticUpdate = setInterval(function() {
                    $.ajax({
                        type : "GET",
                        url : "/sap/secmon/loginterpretation/runService.xsjs?command=getCommandState",
                        async : true,
                        contentType : "application/json; charset=UTF-8",
                        error : function(jqXHR, textStatus, errorThrown) {
                            clearInterval(fnAutomaticUpdate);
                            oDialog.destroy();
                            oShell.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
                        },
                        success : function(data) {
                            if (data) {
                                that.getView().getModel("SyncSDSModel").setProperty("/status", sap.secmon.ui.loglearning.util.Formatter.formatStatusESP2UI(data.Status));
                                if (data.Status === "Successful" || data.Status === "Error") {
                                    that.getView().getModel("SyncSDSModel").setProperty("/percentValue", 100);
                                    that.getView().getModel("SyncSDSModel").setProperty("/displayValue", "100%");
                                    clearInterval(fnAutomaticUpdate);
                                } else if (data.Status === "Read") {
                                    that.getView().getModel("SyncSDSModel").setProperty("/percentValue", 50);
                                    that.getView().getModel("SyncSDSModel").setProperty("/displayValue", "50%");
                                }
                            }
                        },
                    });
                }, 1000);
            } else {
                oShell.reportError(data);
            }
        });
    },

    _getSyncSDSDialog : function() {
        if (!this._oSyncSDSDialog) {
            var oModel = new sap.ui.model.json.JSONModel({
                percentValue : 0,
                displayValue : "0%",
                status : oTextBundle.getText("Interpret_Unknown")
            });

            this.getView().setModel(oModel, "SyncSDSModel");
            this._oSyncSDSDialog = sap.ui.xmlfragment("SyncSDSDialog", "sap.secmon.ui.loglearning.dialog.SyncSDSDialog", this);
            this.getView().addDependent(this._oSyncSDSDialog);
        }
        return this._oSyncSDSDialog;
    },

    onCloseDialog : function(oEvent) {
        this._getSyncSDSDialog().close();
        this._oSyncSDSDialog.destroy();
        this._oSyncSDSDialog = null;
    },

    /**
     * check if the SDS is down or had a recent restart. The run status might have changed due to the SDS restart
     * 
     * @param oEvent
     */
    onCheckSDS : function(oEvent) {
        var oController = this;

        var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=checkRun");
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            oController.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
        });
        promise.done(function(data, textStatus, jqXHR) {
            var index = 0;
            if (data.infos && data.infos.length > 0) {
                for (index = 0; index < data.infos.length; index++) {
                    oController.reportSuccess(data.infos[index]);
                }
            }
            if (data.warnings && data.warnings.length > 0) {
                for (index = 0; index < data.warnings.length; index++) {
                    oController.reportWarning(data.warnings[index]);
                }
            }
            if (data.error) {
                oController.reportErrorMessage(data.error);
            }
        });
    }

});
