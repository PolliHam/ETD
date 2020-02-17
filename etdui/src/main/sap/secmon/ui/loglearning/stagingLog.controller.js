/* globals oTextBundle */
jQuery.sap.require("sap.ui.model.odata.CountMode");
sap.ui.controller("sap.secmon.ui.loglearning.stagingLog", {

    buildTableColumns : function() {
        var sRunName = sap.ui.getCore().getModel("RunModel").getProperty("/selectedRunName");

        var oTable = this.getView().byId("tableStagingLog");
        var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
        var oTextBundleSherlog = jQuery.sap.resources({
            url : "/sap/secmon/ui/sherlock/i18n/UIText.hdbtextbundle",
            locale : sLocale
        });

        // Remove all columns
        oTable.removeAllColumns();

        oTable.addColumn(new sap.ui.table.Column("OriginalData", {
            label : new sap.ui.commons.Label({
                text : "{i18n>Interpret_OData}"
            }),
            template : new sap.ui.commons.TextView({
                text : "{OriginalData}",
                tooltip : "{OriginalData}"
            }),
            sortProperty : "OriginalData",
            filterProperty : "OriginalData",
            visible : true
        }));

        // Add fix columns
        oTable.addColumn(new sap.ui.table.Column({
            label : new sap.ui.commons.Label({
                text : "{i18n>Interpret_HeaderId}"
            }),
            template : new sap.ui.commons.TextView({
                text : "{IdHex}",
                design : {
                    path : "EventName",
                    formatter : function(sEventName) {
                        if (sEventName === "Ignore") {
                            return "Italic";
                        }
                        return "Standard";
                    }
                }
            }),
            sortProperty : "IdHex",
            filterProperty : "IdHex",
            visible : false
        }));

        oTable.addColumn(new sap.ui.table.Column({
            label : new sap.ui.commons.Label({
                text : "{i18n>Interpret_Match}"
            }),
            template : new sap.secmon.ui.m.commons.controls.TextWithLinks({
                text : {
                    parts : [ "IsProductiveRule", "RuleId", "StagingRuleRunName", "RunName.RunName", "ExtractedLogEntryType" ],
                    formatter : sap.secmon.ui.loglearning.util.Formatter.eventTypeLinkTextFormatter
                },
                links : {
                    parts : [ "IsProductiveRule", "RuleId", "StagingRuleRunName", "RunName.RunName", "ExtractedLogEntryType" ],
                    formatter : sap.secmon.ui.loglearning.util.Formatter.eventTypeLinksFormatter
                },
                design : "Italic",
            /*
             * design : { path : "EventName", formatter : function(sEventName) { if (sEventName === "Ignore") { return "Italic"; } return "Standard"; } }
             */
            }),
            sortProperty : "RunName.RunName",
            filterProperty : "RunName.RunName",
            visible : true,
            width : "25em"
        }));

        oTable.addColumn(new sap.ui.table.Column({
            label : new sap.ui.commons.Label({
                text : "{i18n>Interpret_ReasonCode}"
            }),
            template : new sap.ui.commons.TextView({
                text : {
                    parts : [ "ReasonCode" ],
                    formatter : function(sReasonCode) {
                        var text = sReasonCode;
                        if (sReasonCode === 1) {
                            text = oTextBundleSherlog.getText("Interpret_NoRTRuleMatch");
                        } else if (sReasonCode === 2) {
                            text = oTextBundleSherlog.getText("Interpret_NoFinalRXMatch");
                        } else if (sReasonCode === 3) {
                            text = oTextBundleSherlog.getText("Interpret_IncomplTS");
                        }

                        return text;
                    }
                }
            }),
            sortProperty : "ReasonCode",
            filterProperty : "ReasonCode",
            visible : true,
            width : "10em"
        }));

        oTable.addColumn(new sap.ui.table.Column({
            label : new sap.ui.commons.Label({
                text : "{i18n>Interpret_ReasonDescription}"
            }),
            template : new sap.ui.commons.TextView({
                text : "{ReasonDescription}",
                tooltip : ""
            }),
            // sorting by reason code
            sortProperty : "ReasonCode",
            filterProperty : "ReasonCode",
            visible : true,
            width : "30em"
        }));

        oTable.addColumn(new sap.ui.table.Column({
            label : new sap.ui.commons.Label({
                text : "{i18n>Interpret_EntryTypeId}"
            }),
            template : new sap.ui.commons.TextView({
                text : {
                    parts : [ "RuleId", "IsProductiveRule", "StagingRuleRunName", "RunName.RunName" ],
                    formatter : function(sEntryTypeId, bIsProductiveRule, sStagingRuleRunName, sCurrentRunName) {
                        if (sEntryTypeId && sEntryTypeId.length > 0 && sEntryTypeId !== '<No Match>') {
                            if (bIsProductiveRule === "true") {
                                this.setSemanticColor(sap.ui.commons.TextViewColor.Critical);
                                this.setTooltip(oTextBundle.getText("Interpret_ETInProdRule"));
                            } else if (sStagingRuleRunName !== sCurrentRunName) {
                                this.setSemanticColor(sap.ui.commons.TextViewColor.Negative);
                                this.setTooltip(oTextBundle.getText("Interpret_ETInDiffRun", [ sStagingRuleRunName ]));
                            } else {
                                this.setSemanticColor(sap.ui.commons.TextViewColor.Positive);
                                this.setTooltip(oTextBundle.getText("Interpret_ETInCurrRun"));
                            }
                        } else {
                            this.setSemanticColor(sap.ui.commons.TextViewColor.Negative);
                            this.setTooltip(oTextBundle.getText("Interpret_NoMatch"));
                        }
                        return sEntryTypeId;
                    }
                },
                design : {
                    path : "EventName",
                    formatter : function(sEventName) {
                        if (sEventName === "Ignore") {
                            return "Italic";
                        }
                        return "Standard";
                    }
                }
            }),
            sortProperty : "RuleId",
            filterProperty : "RuleId",
            visible : false,
            width : "25em"
        }));

        oTable.addColumn(new sap.ui.table.Column({
            label : new sap.ui.commons.Label({
                text : "{i18n>Interpret_ExtractedETId}",
            }),
            template : new sap.ui.commons.TextView({
                text : {
                    parts : [ "ExtractedLogEntryType" ],
                    formatter : function(sEntryTypeId) {
                        this.setTooltip(oTextBundle.getText("Interpret_ExtractedET"));
                        return sEntryTypeId;
                    }
                },
                design : {
                    path : "EventName",
                    formatter : function(sEventName) {
                        if (sEventName === "Ignore") {
                            return "Italic";
                        }
                        return "Standard";
                    }
                }
            }),
            sortProperty : "ExtractedLogEntryType",
            filterProperty : "ExtractedLogEntryType",
            visible : false,
            width : "25em"
        }));

        oTable.addColumn(new sap.ui.table.Column({
            label : new sap.ui.commons.Label({
                text : "{i18n>Interpret_Event}"
            }),
            template : new sap.ui.commons.TextView({
                text : "{EventDisplayName}",
                tooltip : "{EventName} {EventNamespace}",
                design : {
                    path : "EventName",
                    formatter : function(sEventName) {
                        if (sEventName === "Ignore") {
                            return "Italic";
                        }
                        return "Standard";
                    }
                }
            }),
            sortProperty : "EventName",
            filterProperty : "EventName",
            visible : true
        }));

        oTable.addColumn(new sap.ui.table.Column({
            label : new sap.ui.commons.Label({
                text : "{i18n>Interpret_LogTypeName}"
            }),
            template : new sap.ui.commons.TextView({
                text : "{LogTypeDisplayName}",
                design : {
                    path : "EventName",
                    formatter : function(sEventName) {
                        if (sEventName === "Ignore") {
                            return "Italic";
                        }
                        return "Standard";
                    }
                }
            }),
            sortProperty : "LogTypeDisplayName",
            filterProperty : "LogTypeDisplayName",
            visible : true
        }));

        // Read semantic attributes
        var oKBModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/KnowledgeBase.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });

        // Read relevant columns
        var oJSONModel = new sap.ui.model.json.JSONModel();
        oJSONModel.attachRequestFailed(function(oError) {
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, decodeURIComponent(oError.getParameter("responseText")));
        });
        oJSONModel.loadData("/sap/secmon/loginterpretation/runService.xsjs?command=getRelevantColumns&runName=" + encodeURIComponent(sRunName), null, false);

        // Add relevant columns
        oKBModel.read("/Attribute?$orderby=name", {
            success : function(oData, oResponse) {
                var bVisible = false;
                $.each(oData.results, function(i, e) {
                    switch (e.name) {
                    case "EventLogType":
                        return true;
                    case "TechnicalLogEntryType":
                        return true;
                    default:
                        bVisible = false;
                        var oData = oJSONModel.getData();
                        for ( var j in oData) {
                            if (oData[j].fieldName === e.fieldName) {
                                bVisible = true;
                                break;
                            }
                        }
                    }

                    switch (e.dataType) {
                    case "TIMESTAMP":
                        oTable.addColumn(new sap.ui.table.Column({
                            visible : bVisible,
                            label : new sap.ui.commons.Label({
                                text : e.displayName
                            }),
                            template : new sap.ui.commons.TextView({
                                text : {
                                    parts : [ {
                                        path : 'applicationContext>/UTC'
                                    }, {
                                        path : e.fieldName
                                    } ],
                                    formatter : sap.secmon.ui.commons.Formatter.dateFormatterEx
                                },
                                design : {
                                    path : "EventName",
                                    formatter : function(sEventName) {
                                        if (sEventName === "Ignore") {
                                            return "Italic";
                                        }
                                        return "Standard";
                                    }
                                }
                            }),
                            sortProperty : e.name,
                            filterProperty : e.name
                        }));
                        break;
                    default:
                        oTable.addColumn(new sap.ui.table.Column({
                            visible : bVisible,
                            label : new sap.ui.commons.Label({
                                text : e.displayName
                            }),
                            template : new sap.ui.commons.TextView({
                                text : "{" + e.fieldName + "}",
                                design : {
                                    path : "EventName",
                                    formatter : function(sEventName) {
                                        if (sEventName === "Ignore") {
                                            return "Italic";
                                        }
                                        return "Standard";
                                    }
                                }
                            }),
                            sortProperty : e.fieldName,
                            filterProperty : e.fieldName
                        }));
                    }
                });
            },
            error : function(oError) {
                console.error(oError);
                sap.ui.getCore().byId("idShell").getController().reportErrorMessage(decodeURIComponent(oError.response.statusText) + ": " + decodeURIComponent(oError.response.body));
            }
        });
    },

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.loglearning.stagingLog
     */
    onInit : function() {
        var oModel = sap.ui.getCore().getModel("logDiscovery");
        this.getView().setModel(oModel);
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.getRoute("testResults").attachPatternMatched(this.handleTestResultsRouteMatched, this);
    },

    handleTestResultsRouteMatched : function(oEvent) {
        var args = oEvent.getParameter("arguments");
        if (!args) {
            return;
        }

        var sRunName = args.run;
        var sPath = "/Run('" + encodeURIComponent(sRunName) + "')";
        this.getView().bindElement(sPath);

        this.buildTableColumns();
    }
});
