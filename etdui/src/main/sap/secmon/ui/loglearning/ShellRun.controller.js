/* globals oTextBundle */
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
$.sap.require("sap.secmon.ui.m.commons.RequestUtils");
$.sap.require("sap.secmon.ui.loglearning.util.Formatter");
$.sap.require("sap.secmon.ui.loglearning.util.AnnotationsListConverter");
$.sap.require("sap.secmon.ui.loglearning.util.Checks");
$.sap.require("sap.secmon.ui.commons.Formatter");
$.sap.require("sap.secmon.ui.commons.AjaxUtil");
$.sap.require("sap.m.MessageToast");
$.sap.require("sap.m.MessageBox");
$.sap.require("sap.secmon.ui.m.commons.EtdController");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.secmon.ui.loglearning.Constants");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.loglearning.ShellRun", {

    oRouter : null,
    fnAutoRefresh : undefined,
    Constants : sap.secmon.ui.loglearning.Constants,
    AnnotationsListConverter : sap.secmon.ui.loglearning.util.AnnotationsListConverter,
    transitions : {
        Saved : {
            next : 'Activated',
            prev : 'null'
        },
        Activated : {
            next : 'Tested',
            prev : 'EntryTypes'
        },
        Tested : {
            next : 'CopiedToProd',
            prev : 'Activate'
        },
        CopiedToProd : {
            next : 'RemovedProd',
            prev : 'Tested'
        },
        isAllowed : function() {

        },
        getNextStatus : function(sState) {
            return this[sState].next;
        },
        getPrevStatus : function(sState) {
            return this[sState].prev;
        }
    },

    onInit : function() {
        this.initModels();
        this.getView().setModel(sap.ui.getCore().getModel("RunJSONModel"));

        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.requestCommons = new sap.secmon.ui.m.commons.RequestUtils();

        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.getRoute(this.Constants.ROUTES.PARAMETERS.ROUTE).attachMatched(this.handleParameterizedRouteMatched, this);
        this.oRouter.getRoute(this.Constants.ROUTES.ENTRY_TYPES.ROUTE).attachMatched(this.handleParameterizedRouteMatched, this);
        this.oRouter.getRoute(this.Constants.ROUTES.ENTRY_TYPE.ROUTE).attachMatched(this.handleParameterizedRouteMatched, this);
        this.oRouter.getRoute(this.Constants.ROUTES.RUNTIME_RULES.ROUTE).attachMatched(this.handleParameterizedRouteMatched, this);
        this.oRouter.getRoute(this.Constants.ROUTES.TEST_RESULTS.ROUTE).attachMatched(this.handleParameterizedRouteMatched, this);
        this.oRouter.getRoute(this.Constants.ROUTES.PROTOCOL.ROUTE).attachMatched(this.handleParameterizedRouteMatched, this);

        // 
        this.getComponent().getNavigationVetoCollector().register(function() {
            var bSaveNeeded = this._isSaveNeeded();
            if (bSaveNeeded !== true) {
                return true;
            } else {
                var oDeferred = $.Deferred();

                this.doCancel(function() {
                    oDeferred.resolve();
                }, function() {
                    oDeferred.reject();
                });

                return oDeferred.promise();
            }
        }, this);

    },

    /**
     * handle a route event
     * 
     * @param oEvent
     * @param oTabRouteEntry
     *            a map entry of map TAB_ROUTE_MAP
     */
    handleParameterizedRouteMatched : function(oEvent) {

        var routeName = oEvent.getParameter("name");
        if (!this.hasRoute(routeName)) {
            return;
        }

        var args = oEvent.getParameter("arguments");
        if (args === null || args === undefined) {
            return;
        }

        var sRunName = args.run;
        var sEntryTypeId = args.entryType;

        if (!sRunName) {
            return;
        }

        var oTabRouteEntry = this.getMapEntryByRoute(routeName);
        var oRunModel = sap.ui.getCore().getModel("RunModel");
        var prevRunName = oRunModel.getProperty("/selectedRunName");

        // Caution: selectedrunName and selectedEntryType must be set centrally.
        // They are used for lazy loading of the runJSONModel.
        oRunModel.setProperty("/selectedRunName", sRunName);
        oRunModel.setProperty("/selectedEntryType", sEntryTypeId);

        // This triggers conditional loading of run data and OData: They are cached.
        // Only if the run data have not been loaded yet.
        if (prevRunName !== sRunName) {

            var that = this;
            var oRunJsonModel = sap.ui.getCore().getModel("RunJSONModel");
            oRunJsonModel.attachRequestCompleted(function(oData) {
                if (oData.getParameters().success) {
                    that.handleDataRequestCompletedWithCallback(oData, function() {
                    });
                } else {
                    that.reportErrorMessage(decodeURIComponent(oData.getParameter("errorobject").responseText));
                }
            });
            oRunJsonModel.loadData("/sap/secmon/loginterpretation/runService.xsjs?command=openRun&runName=" + encodeURIComponent(sRunName), null, true);

        }

        var sCSRFToken = this.oCommons.getXCSRFToken();
        var ODataServicePath = "/sap/secmon/loginterpretation/logDiscoveryAPI.xsodata";
        var sPath = ODataServicePath + "/Run('" + encodeURIComponent(sRunName) + "')";
        var countModel = sap.ui.getCore().getModel("CountRunModel");
        var sProtocolPath = sPath + "/Protocol/$count";
        this.requestCommons.sendRequest("GET", sProtocolPath, null, sCSRFToken, function(data) {
            countModel.setProperty("/protocolCount", data);
        });
        var sTestResultsPath = sPath + "/TestResults/$count";
        this.requestCommons.sendRequest("GET", sTestResultsPath, null, sCSRFToken, function(data) {
            countModel.setProperty("/testResultCount", data);
        });

        // switch view directly, loading of run data not needed
        this.switchViewByTabKey(oTabRouteEntry);

    },

    /**
     * event handler for event dataRequestCompleted
     * 
     * @param oData
     *            the request body as JSON
     * @param callback
     *            a function which is called at the end. Usually used for navigation
     */
    handleDataRequestCompletedWithCallback : function(oData, callback) {
        var oRunJsonModel = sap.ui.getCore().getModel("RunJSONModel");
        var oRun = oRunJsonModel.getData().run;

        var oRunModel = sap.ui.getCore().getModel("RunModel");

        // do not set selected run name and selected entry type here: This is done in callback "handleParameterizedRouteMatched":
        // It is used as flag for lazy loading of RunJSONmodel.
        oRunModel.setProperty("/isSaveNeeded", false);
        oRunModel.setProperty("/phase", oRun.CommandType);
        oRunModel.setProperty("/status", oRun.Status);
        oRunModel.setProperty("/description", oRun.Description);
        oRunModel.setProperty("/StagingRulesStatus", oRun.StagingRulesStatus);
        oRunModel.setProperty("/ProductiveRulesStatus", oRun.ProductiveRulesStatus);
        oRunModel.setProperty("/testResultTimestamp", oRun.TestResultTimestamp);
        oRunModel.setProperty("/commandDurationInMinutes", oRun.CommandDurationInMinutes);
        oRunModel.setProperty("/potentialZombie", oRunJsonModel.getData().PotentialZombie);

        var isEntryTypesExist = oRunJsonModel.getProperty("/entryTypes/header/0/Row");
        var sCurrentState = oRunJsonModel.getProperty("/run/CurrentStatus");
        this.setButtonStatus(isEntryTypesExist, sCurrentState, oRunModel);

        this.getView().setModel(oRunJsonModel);
        this.getView().setModel(oRunModel, "RunModel");

        var countModel = sap.ui.getCore().getModel("CountRunModel");
        var newData = oRunJsonModel.getData();
        countModel.setProperty("/entryTypeCount", Object.keys(newData.entryTypes.header).length);
        countModel.setProperty("/ruleCount", Object.keys(newData.runtimeRules.header).length);
        if (callback) {
            callback.call();
        }
        this.getView().setModel(sap.ui.getCore().getModel("CountRunModel"), "CountRunModel");
    },

    setButtonStatus : function(isEntryTypesExist, sCurrentState, oRunModel) {
        var hasEntryTypes = true;

        if (isEntryTypesExist === undefined) {
            hasEntryTypes = false;
        }

        oRunModel.setProperty("/hasEntryTypes", hasEntryTypes);
        oRunModel.setProperty("/isRunActivated", sCurrentState === "Activated");
        oRunModel.setProperty("/isRunTested", sCurrentState === "Tested");
        oRunModel.setProperty("/isCopiedToProd", sCurrentState === "CopiedToProd");
    },

    /**
     * Opens knowledge base ui
     * 
     * @param oEvent
     */
    onPressKnowledgeBaseLink : function(oEvent) {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            sap.secmon.ui.m.commons.NavigationService.openKBEvent();
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
     * Specifies the Controller belonging to this View. In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * 
     * @memberOf sap.secmon.ui.loglearning.ShellRun
     */
    getControllerName : function() {
        return "sap.secmon.ui.loglearning.ShellRun";
    },

    /**
     * Initializes the models
     * 
     * @memberOf sap.secmon.ui.loglearning.Shell
     */
    initModels : function() {
        this.uiModel = new sap.ui.model.json.JSONModel({
            entryTypesViewVisible : true,
            entryTypeDetailsViewVisible : false
        });
        this.getView().setModel(this.uiModel, "uiModel");
    },

    /**
     * Handles navigation between tabs on tab strip
     * 
     * @param oEvent
     * @memberOf sap.secmon.ui.loglearning.Shell
     */
    onWorksetItemSelected : function(oEvent) {
        var tabKey = oEvent.getParameter("key");

        var oRunModel = sap.ui.getCore().getModel("RunModel");
        var sRunName = oRunModel.getProperty("/selectedRunName");

        var oEntry = this.getMapEntryByTabKey(tabKey);
        this.switchViewByTabKey(oEntry);

        // on tab click, only navigate to top items. Do not drill down into entry type details.
        // This also means: When inside an entry type, a tab click navigates up to list of entry types.
        var sRoute = oEntry.ROUTE === this.Constants.ROUTES.ENTRY_TYPE.ROUTE ? this.Constants.ROUTES.ENTRY_TYPES.ROUTE : oEntry.ROUTE;

        this.oRouter.navTo(sRoute, {
            run : sRunName,
            query : {
                lastNav : this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date())
            }
        }, false);
    },

    /**
     * switch to view determined by key of selected tab
     * 
     * @param oTabRouteEntry
     *            a map entry of map TAB_ROUTE_MAP
     */
    switchViewByTabKey : function(oTabRouteEntry) {

        if (!oTabRouteEntry) {
            return;
        }

        var sSelectedTabKey = oTabRouteEntry.TAB_KEY;
        var oShell = this.getView().byId("shlMain");
        oShell.setSelectedKey(sSelectedTabKey);

        if (sSelectedTabKey === this.Constants.ROUTES.ENTRY_TYPE.TAB_KEY) {
            this.uiModel.setProperty("/entryTypeDetailsViewVisible", true);
            this.uiModel.setProperty("/entryTypesViewVisible", false);
        } else {
            // default: show entry types
            this.uiModel.setProperty("/entryTypesViewVisible", true);
            this.uiModel.setProperty("/entryTypeDetailsViewVisible", false);
        }
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
     *            short Message text
     * @param lText
     *            long message text
     */
    reportWarning : function(sText, lText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Warning, sText, lText ? lText : sText);
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
     * Reads the /Run OData collection synchronously to update phase and status in the thing viewer
     */
    retrieveRunData : function(fnCallback) {
        var oController = this;
        var oDiscoveryModel = sap.ui.getCore().getModel("logDiscovery");
        var oRunModel = sap.ui.getCore().getModel("RunModel");
        var sRunName = oRunModel.getProperty("/selectedRunName");
        var sStatus, sPhase;
        var oView = this.getView();

        oView.setBusy(true);

        // Retrieve state and phase
        oDiscoveryModel.read("/Run('" + encodeURIComponent(sRunName) + "')", {
            async : false,
            success : function(oResponse) {
                sStatus = oResponse.Status;
                sPhase = oResponse.CommandType;

                // update model
                oRunModel.setProperty("/status", sStatus);
                oRunModel.setProperty("/StagingRulesStatus", oResponse.StagingRulesStatus);
                oRunModel.setProperty("/ProductiveRulesStatus", oResponse.ProductiveRulesStatus);
                oRunModel.setProperty("/phase", sPhase);
                oRunModel.setProperty("/testResultTimestamp", oResponse.TestResultTimestamp);
                oRunModel.setProperty("/commandDurationInMinutes", oResponse.CommandDurationInMinutes);

                if (sStatus === "Error" || sStatus === "Successful") {
                    console.debug("Stop auto update as status = '%s'", sStatus);

                    clearInterval(oController.fnAutoRefresh);

                    sap.ui.getCore().getModel("RunJSONModel").loadData("/sap/secmon/loginterpretation/runService.xsjs?command=openRun&runName=" + encodeURIComponent(sRunName), null, false);

                    // Invoke callback function if supplied
                    if (fnCallback) {
                        console.debug("Invoking callback function");
                        fnCallback();
                    }

                    oView.setBusy(false);
                }

            },
            error : function(oError) {
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, decodeURIComponent(oError.message) + "\n" + oError.response.body);

                console.error(oError);

                oView.setBusy(false);
            }
        });
    },

    /**
     * Refresh run state and phase
     * 
     * @param bAutomaticRefresh
     *            Set to true if refresh should happen every 250ms until state = Error or Successful
     * @param fnCallback
     *            Function which is invoked when automatic refresh terminates
     * 
     */
    updateRunPhaseAndState : function(bAutomaticRefresh, fnCallback) {
        var oController = this;

        if (bAutomaticRefresh) {
            oController.fnAutoRefresh = setInterval(function() {
                oController.retrieveRunData(fnCallback);
            }, 500);
        } else {
            oController.retrieveRunData();
        }
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
            this._helpMenu = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.loglearning.HelpMenu", this);
            this.getView().addDependent(this._helpMenu);

            // toggle compact style
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._helpMenu);
        }
        var eDock = sap.ui.core.Popup.Dock;
        this._helpMenu.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);
    },

    onPressHelpOverview : function(oEvent) {
        window.open("/sap/secmon/help/f0f88f8fdf334027b05b76c72d9f8467.html");
    },

    onPressHelpSemEvents : function(oEvent) {
        window.open("/sap/secmon/help/431619f624f0428e93083753a033910e.html");
    },

    onPressHelpSemAttributes : function(oEvent) {
        window.open("/sap/secmon/help/02e5d1bc1b4441a285f2cf473e013246.html");
    },

    onPressHelpValueMapping : function(oEvent) {
        window.open("/sap/secmon/help/d4d0fe9440b64ef5b97bf7a6d77b6d44.html");
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    doCancel : function(fnActionAfterCancel, fnActionOnNoCancellation) {

        var bSaveNeeded = this._isSaveNeeded();
        if (bSaveNeeded !== true) {
            return;
        }

        var that = this;
        var onClose = function(oAction) {
            if (oAction === sap.m.MessageBox.Action.YES) {
                that._setSaveNeeded(false);
                if (fnActionAfterCancel) {
                    fnActionAfterCancel();
                } else {
                    if (fnActionOnNoCancellation) {
                        fnActionOnNoCancellation();
                    }
                }
            }
        };
        sap.m.MessageBox.show(that.getCommonText("Confirm_Cancel_MSG"), {
            title : that.getCommonText("Confirmation_TIT"),
            icon : sap.m.MessageBox.Icon.QUESTION,
            actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
            onClose : onClose
        });
    },

    /**
     * Handles the save event
     * 
     * @memberOf sap.secmon.ui.loglearning.stagingEntryTypes
     */
    onPressSave : function(oEvent) {
        var controller = this;
        var oRunModel = sap.ui.getCore().getModel("RunJSONModel");
        // deep copy
        var oData = $.extend(true, {}, oRunModel.getData());

        var errorTxt = "";
        var sEntryType;
        var msgUtil = new sap.secmon.ui.commons.GlobalMessageUtil();
        // Warn the user of duplicate assignments to the same event attribute
        var oDuplicateAttributesByEntryType = sap.secmon.ui.loglearning.util.Checks.findNamesOfDuplicateAttributes(oData);
        if (oDuplicateAttributesByEntryType && Object.keys(oDuplicateAttributesByEntryType).length > 0) {
            for (sEntryType in oDuplicateAttributesByEntryType) {
                var attributesStr = oDuplicateAttributesByEntryType[sEntryType].join("\n");

                errorTxt = this.getText("Interpret_DuplAttrAssi", sEntryType);
                msgUtil.addMessage(sap.ui.core.MessageType.Warning, errorTxt, attributesStr);
            }
        }
        // Warn the user of possible type mismatches on assignments
        var oTypeMismatches = sap.secmon.ui.loglearning.util.Checks.findTypeMismatches(oData);
        function appendMismatchMsg(messageStr, oMismatch) {
            var mismatchedValueStr = controller.getText("Interpret_mismatchValue", [ oMismatch.source, oMismatch.targetAttribute, oMismatch.targetAttributeType ]);
            return messageStr + mismatchedValueStr + "\n";
        }
        if (oTypeMismatches && Object.keys(oTypeMismatches).length > 0) {
            errorTxt = "";
            for (sEntryType in oTypeMismatches) {
                // Value "{0}" is not compatible with event attribute "{1}" of type "{2}"
                var oMismatches = oTypeMismatches[sEntryType];
                var mismatchedValuesStr = "";
                if (oMismatches.length > 0) {
                    mismatchedValuesStr = oMismatches.reduce(appendMismatchMsg, "");
                    errorTxt = this.getText("Interpret_mismatchAssi", sEntryType);
                    msgUtil.addMessage(sap.ui.core.MessageType.Warning, errorTxt, mismatchedValuesStr);
                }
            }
        }

        var oView = this.getView().byId("viewStagingEntryTypes");
        oView.setBusy(true);

        var sRunName = sap.ui.getCore().getModel("RunModel").getProperty("/selectedRunName");
        var sDescription = oData.run.Description;
        var oValueMappingData = oData.valueMapping;

        // Get entry type data
        var oEntryTypeData = oData.entryTypes.header;

        var oSaveDataTemp = {
            run : {
                description : sDescription
            },
            entryType : oEntryTypeData,
            // deprecated: subset of annotations, only leaf annotations
            annotations : [],
            // new since September 2019: all annotation types, including BlankOrPunctuation
            allAnnotations : [],
            valueMapping : {
                source : [],
                target : []
            },
            constantValue : [],
            runtimeRules : {
                header : []
            }
        };
        var aEntryTypeIds = [];
        $.each(oEntryTypeData, function(index, element) {
            aEntryTypeIds.push(element.Id);
        });

        var oExtractionHeader = oData.runtimeRules.header;
        $.each(oExtractionHeader, function(index, element) {
            oSaveDataTemp.runtimeRules.header.push(element);
        });

        var oAnnotationData = oData.entryTypes.annotations;
        $.each(oAnnotationData, function(index, element) {
            delete element.Attributes;
            delete element.Roles;
            delete element.TargetAttributeIds;
            // used in valuehelp dialog with preselected attributes
            delete element.preselectedKeys;
            oSaveDataTemp.annotations.push(element);
        });

        var aAllAnnotationData = oData.entryTypes.allAnnotations;
        $.each(aAllAnnotationData, function(index, element) {
            delete element.Attributes;
            delete element.Roles;
            delete element.TargetAttributeIds;
            // used in valuehelp dialog with preselected attributes
            delete element.preselectedKeys;
            oSaveDataTemp.allAnnotations.push(element);
        });

        // Just to be safe: The markup must have been calculated from list of annotations.

        aEntryTypeIds.forEach(function(id) {
            var aAnnotationsByEntryType = aAllAnnotationData.filter(function(oAnnotation) {
                return oAnnotation["EntryTypeId.Id"] === id;
            });
            var sMarkup = controller.AnnotationsListConverter.buildMarkup(aAnnotationsByEntryType);
            $.each(oEntryTypeData, function(index, oEntryType) {
                if (oEntryType.Id === id) {
                    oEntryType.Markup = sMarkup;
                }
            });
        });
        oSaveDataTemp.entryType = oEntryTypeData;

        /* Collect value mapping data, if already loaded */
        // Iterate over rules
        if (oValueMappingData.source) {
            $.each(oValueMappingData.source, function(index, element) {
                oSaveDataTemp.valueMapping.source.push(element);
            });
        }

        // there are several temporary properties which are set in stagingEntryTypes.controller, function "_calculateRolesAndAttributes".
        // These must be deleted before sending the OData request.
        if (oValueMappingData.target) {
            $.each(oValueMappingData.target, function(index, element) {
                delete element.Roles;
                delete element.Attributes;
                delete element.attrDisplayName;
                delete element["attrName.name"];
                delete element["attrNameSpace.nameSpace"];
                delete element.TargetAttributeId;
                // used in valuehelp dialog with preselected attributes
                delete element.preselectedKeys;
                // if (sEntryTypeId && sEntryTypeId === element["EntryTypeId.Id"]) {
                oSaveDataTemp.valueMapping.target.push(element);
                // }
            });
        }

        // Constant Value
        $.each(oData.constantValue, function(index, element) {
            delete element.Attributes;
            delete element.Roles;
            delete element.attrDisplayName;
            delete element["attrName.name"];
            delete element["attrNameSpace.nameSpace"];
            delete element.GroupName;
            delete element.GroupNameSpace;
            delete element.TargetAttributeId;
            // used in valuehelp dialog with preselected attributes
            delete element.preselectedKeys;
            // if (sEntryTypeId && sEntryTypeId === element["EntryTypeId.Id"]) {
            oSaveDataTemp.constantValue.push(element);
            // }
        });
        var that = this;
        // Call service to save value mapping of run
        var promise =
                new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=saveRun&runName=" + encodeURIComponent(sRunName), JSON.stringify(oSaveDataTemp));
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            oView.setBusy(false);
            var sError = decodeURIComponent(jqXHR.responseText);
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sError, sError, "{i18n>Interpret_Save}");
            console.error(jqXHR);
        });
        promise.done(function(data, textStatus, jqXHR) {
            setTimeout(function() {

                oView.setBusy(false);
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, oTextBundle.getText("Interpret_SaveSuc", sRunName));

                that.handleDataRequestCompletedWithCallback(data.runData, function() {

                });

                that.setButtonStatus(data.runData.entryTypes.header[0].Row, data.runData.run.CurrentStatus, oRunModel);
                oRunModel.refresh();

            }, 10);
            oView.getController()._setSaveNeeded(false);

        });
    },

    /**
     * Handles the "activate" event
     * 
     * @param oEvent
     * @memberOf sap.secmon.ui.loglearning.stagingEntryTypes
     */
    onPressActivate : function(oEvent) {
        var oView = this.getView();
        var oController = this;

        if (this._isSaveNeeded()) {
            oController.reportErrorMessage(oTextBundle.getText("Interpret_SaveFirst"));
            return;
        }

        oView.setBusy(true);
        var sRunName = sap.ui.getCore().getModel("RunModel").getProperty("/selectedRunName");
        var embeddedView = this.getView().byId("viewStagingEntryTypes");
        var embeddedTable = embeddedView.byId(embeddedView.createId("tableStagingEntryTypes"));
        embeddedTable.removeSelections(true);

        // Call service to trigger runtimeRule generation of ESP
        var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=activateRun&runName=" + encodeURIComponent(sRunName));
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            oView.setBusy(false);
            oController.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
        });
        promise.done(function(data, textStatus, jqXHR) {
            // Clear runtime rules
            delete sap.ui.getCore().getModel("RunJSONModel").getData().runtimeRules;
            sap.ui.getCore().getModel("RunJSONModel").refresh(true);

            // Update automatically until process finishes
            oController.updateRunPhaseAndState(true, function() {
                oView.setBusy(false);

            });
            // report warnings
            var index = 0;
            if (data.warnings && data.warnings.length > 0) {
                for (index = 0; index < data.warnings.length; index++) {
                    oController.reportWarning(oController.getText("Interpret_Conflicts"), data.warnings[index]);
                }
            }

            if (data.status === "Ok") {
                oController.reportSuccess(oTextBundle.getText("Interpret_ActivateSuc", decodeURIComponent(data.runName)));
            } else {
                oController.reportError(data);
            }
        });

        // Navigate to runtime rules view
        var navParams = {
            run : sRunName,
            query : {
                lastNav : this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date())
            }
        };
        this.oRouter.navTo(this.Constants.ROUTES.RUNTIME_RULES.ROUTE, navParams, false);

    },

    /**
     * Handles the "TestRun" event
     * 
     * @param oEvent
     * @memberOf sap.secmon.ui.loglearning.stagingEntryTypes
     */
    onPressTestRun : function(oEvent) {
        var oView = this.getView();
        var oController = this;
        var sRunName = sap.ui.getCore().getModel("RunModel").getProperty("/selectedRunName");

        // Call service to test the staging runtime rules of the
        // run
        oView.setBusy(true);
        var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=testRun&runName=" + encodeURIComponent(sRunName));
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            oView.setBusy(false);
            oController.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
        });
        promise.done(function(data, textStatus, jqXHR) {
            oController.reportSuccess(oTextBundle.getText("Interpret_TestSuc", sRunName));
        });

        // Navigate to test results view
        var navParams = {
            run : sRunName,
            query : {
                lastNav : this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date())
            }
        };

        // Update automatically until process finishes and refresh OData model
        // afterwards
        oController.updateRunPhaseAndState(true, function() {
            oController.oRouter.navTo(oController.Constants.ROUTES.TEST_RESULTS.ROUTE, navParams, false);
            sap.ui.getCore().getModel("logDiscovery").refresh(true);
        });

        oView.setBusy(true);
    },

    /**
     * Move runtime rules to prod
     * 
     * @param oEvent
     */
    onPressMoveToProd : function(oEvent) {
        var oController = this;
        var sRunName = sap.ui.getCore().getModel("RunModel").getProperty("/selectedRunName");

        // Call service to copy rules to prod
        var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=moveRulesToProd&runName=" + encodeURIComponent(sRunName));
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            oController.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
        });
        promise.done(function(data, textStatus, jqXHR) {
            if (data.status === "Ok") {
                oController.reportSuccess(oTextBundle.getText("Interpret_MoveToProdSuc", decodeURIComponent(data.runName)));
                sap.ui.getCore().getModel("RunModel").setProperty("/isCopiedToProd", true);
                sap.ui.getCore().getModel("RunModel").setProperty("/isRunTested", false);
            } else {
                oController.reportError(data);
            }
        });
    },
    /**
     * Discards the staging entry types and regenerates them
     * 
     * @param oEvent
     */
    onPressResetRun : function(oEvent) {
        var oController = this;
        var sRunName = sap.ui.getCore().getModel("RunModel").getProperty("/selectedRunName");
        var oView = this.getView();

        oView.setBusy(true);

        // Confirmation Dialog
        sap.ui.commons.MessageBox.confirm(oTextBundle.getText("Interpret_ResetReally", sRunName), function(bConfirmed) {
            if (bConfirmed) {
                // Ajax
                var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=discardRun&runName=" + encodeURIComponent(sRunName));
                promise.fail(function(jqXHR, textStatus, errorThrown) {
                    oView.setBusy(false);
                    oController.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
                });

                promise.done(function(data, textStatus, jqXHR) {
                    oView.setBusy(false);
                    if (data.status === "Ok") {
                        setTimeout(function() {
                            sap.ui.getCore().getModel("RunJSONModel").setData(data.runData);
                        }, 10);
                        oController._setSaveNeeded(false);
                        oController.reportSuccess(oTextBundle.getText("Interpret_ResetRunSuc", decodeURIComponent(data.runName)));
                    } else {
                        oController.reportError(data);
                    }
                });
            }
        }, "{i18n>Interpret_ResetRun}");
    },

    /**
     * Remove runtime rules from prod
     * 
     * @param oEvent
     */
    onPressRemoveFromProd : function(oEvent) {
        var sRunName = sap.ui.getCore().getModel("RunModel").getProperty("/selectedRunName");
        var oController = this;

        // Call service to copy rules to prod
        var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=removeRulesFromProd&runName=" + encodeURIComponent(sRunName));
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            oController.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
        });
        promise.done(function(data, textStatus, jqXHR) {
            if (data.status === "Ok") {
                oController.reportSuccess(oTextBundle.getText("Interpret_RemFromProdSuc", decodeURIComponent(data.runName)));
                sap.ui.getCore().getModel("RunModel").setProperty("/isCopiedToProd", false);
                sap.ui.getCore().getModel("RunModel").setProperty("/isRunTested", true);
            } else {
                oController.reportError(data);
            }
        });
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
        var index = 0;
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
                oController.updateRunPhaseAndState(true);
            }
            if (data.error) {
                oController.reportError(data.error);
            }
        });
    },

    /**
     * the run has been in a status "Open" or "Running" for a long time. This action allows the user to reset the status.
     * 
     * @param oEvent
     */
    onKillPotentialZombie : function(oEvent) {
        var oController = this;
        var oRunModel = sap.ui.getCore().getModel("RunModel");
        var sRunName = oRunModel.getProperty("/selectedRunName");
        var durationInMinutes = oRunModel.getProperty("/commandDurationInMinutes");
        var onAction = function(action) {
            if (action !== sap.m.MessageBox.Action.CANCEL) {

                var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=resetStagingCommand&runName=" + encodeURIComponent(sRunName));
                promise.fail(function(jqXHR, textStatus, errorThrown) {
                    oController.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
                });
                promise.done(function(data, textStatus, jqXHR) {
                    if (data.infos && data.infos.length > 0) {
                        for (var index = 0; index < data.infos.length; index++) {
                            oController.reportSuccess(data.infos[index]);
                        }
                    }
                    if (data.warnings && data.warnings.length > 0) {
                        for (var iIndex = 0; iIndex < data.warnings.length; iIndex++) {
                            oController.reportWarning(data.warnings[iIndex]);
                        }
                    }
                    if (data.error) {
                        oController.reportError(data.error);
                    }
                    oController.updateRunPhaseAndState(true);
                });

            }

        };
        var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
        sap.m.MessageBox.show(this.getText("Interpret_ZombieMSG", [ durationInMinutes ]), {
            icon : sap.m.MessageBox.Icon.WARNING,
            title : this.getText("Interpret_ZombieTIT"),
            actions : [ this.getText("Interpret_ResetBUT"), sap.m.MessageBox.Action.CANCEL ],
            styleClass : bCompact ? "sapUiSizeCompact" : "",
            onClose : onAction
        });

    },

    /**
     * Sets the save needed flag
     * 
     * @param bSaveNeeded
     */
    _setSaveNeeded : function(bSaveNeeded) {
        sap.ui.getCore().getModel("RunModel").setProperty("/isSaveNeeded", bSaveNeeded);
    },

    /**
     * Is Save needed ?
     * 
     * @returns true/false
     */
    _isSaveNeeded : function() {
        return sap.ui.getCore().getModel("RunModel").getProperty("/isSaveNeeded");
    },
    /**
     * Synchronizes the runtime rules with ESP
     */
    _synchronizeRulesWithESP : function() {
        var sRunName = sap.ui.getCore().getModel("RunModel").getProperty("/selectedRunName");
        var oShellController = this;

        // Ajax
        var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=updateRTRules&runName=" + encodeURIComponent(sRunName));
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            oShellController.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
        });

        promise.done(function(data, textStatus, jqXHR) {
            if (data.status === "Ok") {
                oShellController.reportSuccess(oTextBundle.getText("Interpret_UpdateRTRulesSuc", sRunName));
            } else {
                oShellController.reportError(data);
            }

            // Update automatically until process finishes
            oShellController.updateRunPhaseAndState(true);
        });
    },

    hasRoute : function(sRoute) {
        var oRouteMap = this.Constants.ROUTES;
        for ( var prop in oRouteMap) {
            if (oRouteMap[prop].ROUTE === sRoute) {
                return true;
            }
        }
        return false;
    },
    hasTabKey : function(sTabKey) {
        var oRouteMap = this.Constants.ROUTES;
        for ( var prop in oRouteMap) {
            if (oRouteMap[prop].TAB_KEY === sTabKey) {
                return true;
            }
        }
        return false;
    },
    getMapEntryByRoute : function(sRoute) {
        var oRouteMap = this.Constants.ROUTES;
        for ( var prop in oRouteMap) {
            if (oRouteMap[prop].ROUTE === sRoute) {
                return oRouteMap[prop];
            }
        }
        return oRouteMap.ENTRY_TYPES;
    },
    getMapEntryByTabKey : function(sTabKey) {
        var oRouteMap = this.Constants.ROUTES;
        for ( var prop in oRouteMap) {
            if (oRouteMap[prop].TAB_KEY === sTabKey) {
                return oRouteMap[prop];
            }
        }
        return oRouteMap.ENTRY_TYPES;
    }
});
