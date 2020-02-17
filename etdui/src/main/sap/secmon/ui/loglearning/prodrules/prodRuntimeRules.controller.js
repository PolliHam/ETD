/* globals oTextBundle */
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.require("sap.m.MessageBox");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.loglearning.prodrules.prodRuntimeRules", {

    oRouter : null,

    handleRouteMatched : function(oEvent) {
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    onInit : function() {
        this._oCommonFunctions = new sap.secmon.ui.commons.CommonFunctions();

        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/loginterpretation/logDiscoveryAPI.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }));

        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/services/KnowledgeBase.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }), "KBModel");

        this.getView().getModel().attachRequestCompleted(this._setCount, this);

        this.getView().setModel(new sap.ui.model.json.JSONModel({
            "ruleIsSelected" : false
        }), "UIModel");
    },

    reportWarning : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Warning, sText, sText);
    },

    reportErrorMessage : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sText);
    },

    reportSuccess : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, sText);
    },

    _setCount : function() {
        var oList = this.getView().byId("table");
        var count = oList.getBinding("items").getLength();
        this.getView().byId("page").setTitle(this.getView().getModel("i18n").getProperty("Interpret_ProdRules") + " (" + count + ")");
    },

    onPressSettings : function(oEvent) {
        var oDialog = sap.ui.xmlfragment("sap.secmon.ui.loglearning.prodrules.SettingsDialog", this);
        this.getView().addDependent(oDialog);
        oDialog.open();
    },

    onConfirm : function(oEvent) {
        var oView = this.getView();
        var oTable = oView.byId("table");
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

    onSearch : function(oEvent) {
        var oView = this.getView();
        var oTable = oView.byId("table");
        var mParams = oEvent.getParameters();
        var oBinding = oTable.getBinding("items");
        var oFilter;
        // apply filters to binding
        var aFilters = [];

        if (mParams.selectionSet[0] && oEvent.getParameters().selectionSet[0].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[0].getValue(), null);
            aFilters.push(oFilter);
        }

        if (mParams.selectionSet[1] && mParams.selectionSet[1].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("Markup", sap.ui.model.FilterOperator.Contains, mParams.selectionSet[1].getValue(), null);
            aFilters.push(oFilter);
        }

        if (mParams.selectionSet[2] && mParams.selectionSet[2].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("EventDisplayName", sap.ui.model.FilterOperator.Contains, mParams.selectionSet[2].getValue(), null);
            aFilters.push(oFilter);
        }

        if (mParams.selectionSet[3] && mParams.selectionSet[3].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("LogTypeDisplayName", sap.ui.model.FilterOperator.Contains, mParams.selectionSet[3].getValue(), null);
            aFilters.push(oFilter);
        }

        if (mParams.selectionSet[4] && mParams.selectionSet[4].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("BrancherName", sap.ui.model.FilterOperator.Contains, mParams.selectionSet[4].getValue(), null);
            aFilters.push(oFilter);
        }

        if (mParams.selectionSet[5] && mParams.selectionSet[5].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("Result", sap.ui.model.FilterOperator.Contains, mParams.selectionSet[5].getValue(), null);
            aFilters.push(oFilter);
        }

        oBinding.filter(aFilters);
    },

    /**
     * Exports all productive rules of the selected log type
     * 
     * @param oEvent
     */
    onPressExportRule : function(oEvent) {
        var that = this;

        this._showLogTypeDialog("{i18n>Interpret_ExportPrdRul}", function(sLogTypeName, sLogTypeNamespace) {
            sap.m.MessageBox.confirm(oTextBundle.getText("Interpret_ExpPrdReally", [ sLogTypeName, sLogTypeNamespace ]), function(oAction) {
                if (oAction === sap.m.MessageBox.Action.OK) {
                    var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/replication/export.xsjs", JSON.stringify({
                        ObjectType : "ProductiveRules",
                        "ObjectName" : sLogTypeName,
                        "ObjectNamespace" : sLogTypeNamespace,
                        "Operation" : "Upsert"
                    }));
                    promise.fail(function(jqXHR, textStatus, errorThrown) {
                        var sError = decodeURIComponent(jqXHR.responseText);
                        that.reportErrorMessage(sError);
                    });
                    promise.done(function(data, textStatus, jqXHR) {
                        that.reportSuccess(oTextBundle.getText("Repl_Success"));
                    });
                }
            }, oTextBundle.getText("Interpret_ExportPrdRul"));
        }, that);
    },

    /**
     * Shows a log type selection dialog
     * 
     * @param sDialogTitle
     *            Title of Dialog
     * @param fnOk
     *            Event handler of the OK event
     */
    _showLogTypeDialog : function(sDialogTitle, fnOk, oController) {
        var sLogTypeName = "";
        var sLogTypeNamespace = "";

        var oLayout = new sap.ui.commons.layout.MatrixLayout({
            layoutFixed : false,
            width : "100%"
        });
        var oModel = new sap.ui.model.json.JSONModel({
            logTypeName : "",
            logTypeNamespace : ""
        });
        this.getView().setModel(oModel, "LogTypeModel");

        var oListBoxLogType = new sap.ui.commons.ListBox({
            items : {
                path : "/LogType",
                sorter : [ new sap.ui.model.Sorter("displayName", false) ],
                template : new sap.ui.core.ListItem({
                    additionalText : "{nameSpace}",
                    text : "{displayName}",
                    key : {
                        path : "hash",
                        formatter : function(sHash) {
                            if (sHash) {
                                return oController._oCommonFunctions.base64ToHex(sHash);
                            }
                        }
                    },
                    tooltip : "{description}"
                })
            }
        }).setModel(oController.getView().getModel("KBModel"));

        oLayout.createRow(new sap.ui.commons.Label({
            text : "{i18n>Interpret_LogType}",
            required : true
        }), new sap.ui.commons.ComboBox("comboBoxLogTypeExport", {
            selectedKey : "{/LogType}",
            width : "15em",
            required : true,
            displaySecondaryValues : true,
            listBox : oListBoxLogType,
            change : function(oEvent) {
                if (oEvent.getParameter("newValue") === "") {
                    oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                } else {
                    sLogTypeName = oEvent.getParameters().selectedItem.getBindingContext().getProperty("name");
                    sLogTypeNamespace = oEvent.getParameters().selectedItem.getBindingContext().getProperty("nameSpace");
                    oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
                }
            }
        }).setModel(oModel));

        var oDialog = new sap.ui.commons.Dialog({
            title : sDialogTitle,
            content : oLayout,
            busyIndicatorDelay : 1,
            closed : function() {
                oDialog.destroy();
            },
            buttons : [ new sap.ui.commons.Button({
                text : "{i18n>Interpret_Ok}",
                press : function(oEvent) {
                    var sLogTypeHash = oModel.getProperty("/LogType");
                    if (!sLogTypeHash) {
                        sap.ui.getCore().byId("comboBoxLogTypeExport").focus();
                        sap.ui.getCore().byId("comboBoxLogTypeExport").setValueState(sap.ui.core.ValueState.Error);
                        oController.reportErrorMessage(oTextBundle.getText("Interpret_EnterAllFields"));
                        return;
                    } else {
                        sap.ui.getCore().byId("comboBoxLogTypeExport").setValueState(sap.ui.core.ValueState.None);
                    }

                    // Invoke OK Handler with selected log type
                    fnOk(sLogTypeName, sLogTypeNamespace);

                    oDialog.close();
                }
            }), new sap.ui.commons.Button({
                text : "{i18n>Interpret_Close}",
                press : function() {
                    oDialog.close();
                }
            }) ]
        });
        oController.getView().addDependent(oDialog);
        oDialog.open();
    },

    /**
     * Download all productive rules of the selected log type
     * 
     * @param oEvent
     */
    onPressDownloadRule : function(oEvent) {
        var that = this;
        this._showLogTypeDialog("{i18n>Interpret_DownPrdRul}", function(sLogTypeName, sLogTypeNamespace) {
            window.open("/sap/secmon/loginterpretation/runService.xsjs?command=downloadProductiveRules&logTypeName=" + encodeURIComponent(sLogTypeName) + "&logTypeNamespace=" +
                    encodeURIComponent(sLogTypeNamespace));
        }, that);
    },

    /**
     * Uploads productive rules
     * 
     * @param oEvent
     */
    onPressUploadRule : function(oEvent) {
        var that = this;
        var sUploadProdRuleFilename;

        sap.m.MessageBox.confirm(oTextBundle.getText("Interpret_UplPrdReally"), function(oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {
                var oLayout = new sap.ui.commons.layout.MatrixLayout({
                    layoutFixed : false,
                    width : "100%"
                });

                var oFileUploader;

                var oDialog = new sap.ui.commons.Dialog({
                    title : "{i18n>Interpret_UpPrdRul}",
                    content : oLayout,
                    // width : "500px",
                    // height : "220px",
                    busyIndicatorDelay : 1,
                    closed : function() {
                        oDialog.destroy();
                    },
                    buttons : [ new sap.ui.commons.Button({
                        text : "{i18n>Interpret_Ok}",
                        press : function(oEvent) {
                            if (!sUploadProdRuleFilename || sUploadProdRuleFilename === "") {
                                that.reportErrorMessage(oTextBundle.getText("Interpret_EnterAllFields"));
                                return;
                            }

                            oFileUploader.setUploadUrl("/sap/secmon/loginterpretation/runService.xsjs?command=uploadProductiveRules");

                            var sToken = new sap.secmon.ui.commons.AjaxUtil().getXCSRFToken("/sap/secmon/services/ui/commons/dummyService.xsjs").getResponseHeader('X-CSRF-Token');
                            oFileUploader.removeAllHeaderParameters();
                            oFileUploader.insertHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                                name : "X-CSRF-Token",
                                value : sToken
                            }));

                            oDialog.setBusy(true);
                            oFileUploader.upload();
                        }
                    }), new sap.ui.commons.Button({
                        text : "{i18n>Interpret_Close}",
                        press : function() {
                            oDialog.close();
                        }
                    }) ]
                });

                oFileUploader = new sap.ui.unified.FileUploader("prodRuleFileUploader", {
                    name : "prodRuleFileUploader",
                    multiple : false,
                    maximumFileSize : 50,
                    fileType : [ "json" ],
                    uploadOnChange : false,
                    sendXHR : true,
                    change : function(oEvent) {
                        sUploadProdRuleFilename = oEvent.getParameter("newValue");
                    },
                    fileSizeExceed : function(oEvent) {
                        var sName = oEvent.getParameter("fileName");
                        var fSize = oEvent.getParameter("fileSize");
                        var fLimit = oFileUploader.getMaximumFileSize();
                        that.reportErrorMessage(oTextBundle.getText("Interpret_FileTooBigText", [ sName, fSize, fLimit ]));
                    },
                    typeMissmatch : function(oEvent) {
                        that.reportErrorMessage(oTextBundle.getText("Interpret_FileTypeWrongTxt"));
                    },
                    uploadComplete : function(oEvent) {
                        var sResponse = oEvent.getParameter("responseRaw");
                        if (oEvent.getParameter("status") > 300) {
                            oDialog.setBusy(false);
                            that.reportErrorMessage(decodeURIComponent(sResponse));
                        } else {                            
                            if (sResponse) {
                                var oResponse = JSON.parse($($.parseHTML(sResponse)).text());
                                if (oResponse.status === "Ok") {
                                    that.reportSuccess(oTextBundle.getText("Interpret_UplPrdSuc", [ decodeURIComponent(oResponse.logTypeName), decodeURIComponent(oResponse.logTypeNamespace) ]));

                                } else if (oResponse.status === "Error") {
                                    oDialog.setBusy(false);
                                    switch (oResponse.errorCode) {
                                    default:
                                        that.reportErrorMessage(decodeURIComponent(oResponse.text));
                                        break;
                                    }
                                }
                            }
                            oDialog.setBusy(false);
                            oDialog.close();
                            that.getView().getModel().refresh();
                        }
                    }
                });

                oLayout.createRow(new sap.ui.commons.Label({
                    text : "{i18n>Interpret_File}",
                    required : true
                }), oFileUploader);
                
                that.getView().addDependent(oDialog);
                oDialog.open();
            }
        }, oTextBundle.getText("Interpret_UpPrdRul"));
    },

    onItemPress : function(oEvent) {
        var sId = oEvent.getParameter("listItem").getBindingContext().getProperty("Id");
        var sHash = this._oCommonFunctions.base64ToHex(oEvent.getParameter("listItem").getBindingContext().getProperty("Hash"));
        sap.ui.core.UIComponent.getRouterFor(this).navTo("prodRuntimeRuleDetail", {
            "Id" : sId,
            "Hash" : sHash
        });
    },

    /**
     * check if the SDS is down or had a recent restart. The run status might have changed due to the SDS restart
     * 
     * @param oEvent
     */
    onCheckSDS : function(oEvent) {
        var oController = this;
        var index;
        var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=checkRun");
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            oController.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
        });
        promise.done(function(data, textStatus, jqXHR) {
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
    },

    /**
     * Row selection change of rule table
     * 
     * @param oEvent
     */
    onRowSelectionChange : function(oEvent) {
        var bRuleIsSelected = oEvent.getSource().getSelectedItems().length > 0;
        this.getView().getModel("UIModel").setProperty("/ruleIsSelected", bRuleIsSelected);
    },

    /**
     * Invoked when user deletes multiple runs
     * 
     * @memberOf sap.secmon.ui.loglearning.runs
     */
    onPressDeleteRule : function(oEvent) {
        var oView = this.getView();
        var oShell = this;
        var aItems = oView.byId("table").getSelectedItems();
        var oData = {
            "Ids" : []
        };

        if (!aItems || aItems.length === 0) {
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, oTextBundle.getText("Interpret_SelectARun"));
            return;
        }

        var oTable = oView.byId("table");
        var oModel = oView.getModel();

        // Confirmation Dialog
        sap.m.MessageBox.confirm(oTextBundle.getText("Interpret_DelRuleReally"), function(oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {
                // User has confirmed deletion
                oView.setBusy(true);

                // Collect paths
                $.each(aItems, function(iIndex, oItem) {
                    oData.Ids.push(oItem.getBindingContext().getProperty("Id"));
                });

                var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=deleteProdRules", JSON.stringify(oData));
                promise.fail(function(jqXHR, textStatus, errorThrown) {
                    oModel.refresh();
                    oView.setBusy(false);
                    oShell.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
                });
                promise.done(function(data, textStatus, jqXHR) {
                    oModel.refresh();
                    oView.setBusy(false);
                    oShell.getView().getModel("UIModel").setProperty("/ruleIsSelected", false);
                    oTable.removeSelections(true);
                    oShell.reportSuccess(oTextBundle.getText("Interpret_RulesDelSuc"));
                });
            }
        }, "{i18n>Interpret_DeleteRule}");

    }
});