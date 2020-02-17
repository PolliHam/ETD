jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.Dimensions");
jQuery.sap.require("sap.secmon.ui.m.commons.InvestigationCreator");
jQuery.sap.require("sap.secmon.ui.m.commons.alertexceptions.AlertExceptionCreator");
jQuery.sap.require("sap.secmon.ui.m.commons.InvestigationAddendum");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.invest.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.AlertTriggerFormatter");
jQuery.sap.require("sap.secmon.ui.commons.RelatedEventsHelper");
jQuery.sap.require("sap.secmon.ui.commons.RelatedIndicatorsHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.alerts.AttackRadioButtonHandler");
jQuery.sap.require("sap.secmon.ui.m.alerts.util.CompactTriggerHelper");
jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.require("sap.secmon.ui.m.alertsfs.util.Formatter");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/TightObjectHeader.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/commons/css/EmbeddedHTML.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.alerts.Alert", {

    INVESTIGATION_SERVICE_URL : "/sap/secmon/services/ui/m/invest/Investigation.xsjs",
    oCommons : null,

    oRouter : null,
    oAlertModel : null,
    oNumberModel : null,
    oEditModel : null,
    oSystemsModel : null,
    compactDetailsModel : null,

    sAlertId : null, // Hex-Id
    sPatternId : null, // Hex-Id

    constructor : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        sap.secmon.ui.m.commons.EtdController.apply(this, arguments);
    },

    onInit : function() {

        this.createEditModel();
        this.createUiModel();

        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);

        this.oAlertModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/ui/m/alerts/AlertDetailsWithCounts.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });

        this.oAlertModel.attachRequestFailed(this.oCommons.handleRequestFailed);
        this.getView().setModel(this.oAlertModel);

        this.oNumberModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.oNumberModel, "numbers");

        this.oSystemsModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.oSystemsModel, "systems");

        this.compactDetailsModel = new sap.ui.model.json.JSONModel();
        // Compact alert details: system ID and system type are displayed on one
        // line
        this.getView().setModel(this.compactDetailsModel, "compactDetails");

        this.oInvestigationAddendum = new sap.secmon.ui.m.commons.InvestigationAddendum();
        this.oInvestigationCreator = new sap.secmon.ui.m.commons.InvestigationCreator();
        this.oAlertExceptionCreator = new sap.secmon.ui.m.commons.AlertExceptionCreator();

        this.requestCompletedAttached = false;

        this.oPage = this.getView().byId("idPage");
        this.editForm = sap.ui.xmlfragment(this.getView().createId("EditForm"), "sap.secmon.ui.m.alerts.EditForm", this);
        this.displayForm = sap.ui.xmlfragment(this.getView().createId("DisplayForm"), "sap.secmon.ui.m.alerts.DisplayForm", this);
        this.oPage.insertContent(this.displayForm, 0);

        this.radioButtonGroup = sap.ui.core.Fragment.byId(this.getView().createId("EditForm"), "AttackRadioButtons");
        this.relatedEvents = sap.ui.core.Fragment.byId(this.getView().createId("DisplayForm"), "relatedEvents");
        this.relatedIndicators = sap.ui.core.Fragment.byId(this.getView().createId("DisplayForm"), "relatedIndicators");

        this.getComponent().getNavigationVetoCollector().register(function() {
            if (this.isEditMode() !== true) {
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

    createEditModel : function() {
        if (!this.oEditModel) {
            this.oEditModel = new sap.ui.model.json.JSONModel();

            this.oEditModel.setData({
                editMode : false,
                displayMode : true,
            });

            this.getView().setModel(this.oEditModel, "editModel");
        }
    },

    createUiModel : function() {
        this.uiModel = new sap.ui.model.json.JSONModel({
            patternAttachmentsCount : 0,
            investigationsCount : 0,
            commentsCount : 0,
            scoreCount : 0,
            sourceCount : 0,
            binaryScoreCount : 0
        });
        this.getView().setModel(this.uiModel, "uiModel");
    },

    isEditMode : function() {
        if (this.oEditModel) {
            return this.oEditModel.getData().editMode;
        }
    },

    setEditMode : function(bEditMode) {
        var model = this.getView().getModel();

        this.EditMode = bEditMode;
        sap.ui.core.BusyIndicator.show(0);
        function handleRequestCompleted() {
            if (this.EditMode) {
                var oContext = this.getView().getBindingContext();
                this.oEditModel.setData({
                    editMode : true,
                    displayMode : false,
                    AlertSeverity : oContext.getProperty("AlertSeverity"),
                    AlertProcessor : oContext.getProperty("AlertProcessor"),
                    AlertStatus : oContext.getProperty("AlertStatus"),
                    AlertAttack : oContext.getProperty("AlertAttack"),
                    AlertHashCode : oContext.getProperty("AlertHashCode"),
                    AlertReadTimestamp : oContext.getProperty("AlertReadTimestamp")
                });
                this.oInitialEditModelData = this.oCommons.cloneObjectIncludingUndefinedAttributes(this.oEditModel.getData());
            } else {
                this.oEditModel.setData({
                    editMode : false,
                    displayMode : true,
                });
            }

            var aContent = this.oPage.getContent();
            var topUiControl = aContent[0];
            if (topUiControl &&
                    (sap.ui.core.Fragment.createId(this.getView().createId("DisplayForm"), "DisplayForm") === topUiControl.getId() || sap.ui.core.Fragment.createId(
                            this.getView().createId("EditForm"), "EditForm") === topUiControl.getId())) {
                this.oPage.removeContent(0);
            }
            if (this.EditMode) {
                this.oPage.insertContent(this.editForm, 0);
            } else {
                this.oPage.insertContent(this.displayForm, 0);
            }
            sap.ui.core.BusyIndicator.hide();
        }

        // ensure that the data is loaded new from db and then displayed
        if (this.requestCompletedAttached === false) {
            // this workaround is needed because detachRequestCompleted doesn't
            // seem to work
            model.attachRequestCompleted(handleRequestCompleted, this);
            this.requestCompletedAttached = true;
        }
        model.refresh();
    },

    /** Save the changes of an alert. */
    updateAlert : function(oData) {

        // Caution: Attribute names differ in OData service (used in GET
        // request) and Alert.xsjs (used in POST request)!
        // 
        // Expected format of post request:
        // { AlertId: "53FBB7FD1C42E6EDE10000000A4CF109",
        // Severity: "HIGH", //optional, default LOW
        // Processor: "USERNAME", //optional, default logged in user
        // Status: "OPEN", //optional, default OPEN
        // Attachments: [ { Content: "This is a comment for the alert ..." } ]
        // }
        // 
        // On the other hand, the OData model has attributes
        // { AlertId: "53FBB7FD1C42E6EDE10000000A4CF109",
        // AlertSeverity: "HIGH",
        // AlertProcessor: "USERNAME",
        // AlertStatus: "OPEN",
        // Attachments: [ {Content: "This is a comment for the alert ..." } ]
        // }
        // 
        // The Edit model uses the same attributes as the OData model.
        //
        oData.AlertId = this.sAlertId;
        oData.Severity = oData.AlertSeverity;
        oData.Processor = oData.AlertProcessor;
        oData.Status = oData.AlertStatus;
        oData.Attack = oData.AlertAttack;
        oData.HashCode = oData.AlertHashCode;
        oData.ReadTimestamp = oData.AlertReadTimestamp;

        var sToken = this.getComponent().getCsrfToken();
        var that = this;
        $.ajax({
            url : "/sap/secmon/services/ui/m/alerts/Alert.xsjs",
            type : "POST",
            // dataType : "text",
            contentType : "application/json; charset=UTF-8",
            data : JSON.stringify(oData),
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", sToken);
            },
            success : function(data) {
                that.warnOptimisticLock(data);
                that.setEditMode(false);
            },
            error : function(request, status, error) {
                sap.m.MessageBox.alert(request.responseText, {
                    title : that.getCommonText("Error_TIT")
                });
            }
        });
    },

    warnOptimisticLock : function(oReturnValue) {
        if (oReturnValue.sqlErrorCode && oReturnValue.sqlErrorCode > 0) {
            // 131: ERR_TX_ROLLBACK_LOCK_TIMEOUT -- transaction rolled back by lock wait timeout
            // 133: ERR_TX_ROLLBACK_DEADLOCK -- transaction rolled back by detected deadlock
            // 146: ERR_TX_LOCK_ACQUISITION_FAIL -- Alert table rows locked (only if option NOWAIT is specified)

            sap.m.MessageBox.alert(this.getText("MAlertsFS_alrtLock"), {
                title : this.getText("MAlerts_chgDetected")
            });
        } else if (oReturnValue && oReturnValue.rejectedAlerts && oReturnValue.rejectedAlerts.length > 0) {
            sap.m.MessageBox.alert(this.getText("MAlertsFS_alrtChgDetect"), {
                title : this.getText("MAlerts_chgDetected")
            });
        }
    },

    /**
     * Called, whenever a new Alert should be displayed. Here it must be checked, whether the Alert is in edit mode, and should be saved before it is changed.
     */
    handleRouteMatched : function(oEvent) {

        var param = oEvent.getParameter("name");

        if ("alert" === param) {

            var oArguments = oEvent.getParameter("arguments");
            var oQueryParameters = oArguments["?query"];
            // if (oQueryParameters === undefined) {
            // return;
            // }
            /** Don't navigate to new alert if view is in edit mode. */
            if (this.sAlertId !== oQueryParameters.alert) {
                if (this.sendAlertIfInEditMode()) {
                    return;
                }
                this.updateRelatedEventCount(/* resetToInitial */true);
                this.updateRelatedIndicatorsFilter(/* resetToInitial */true);
            }
            this.sAlertId = oQueryParameters.alert;
            this.oQueryParameters = oQueryParameters;

            if (this.sAlertId !== undefined) {
                var sPath = "/Alerts(X'" + this.sAlertId + "')";

                this.getView().bindElement(sPath);
                var ctxBinding = this.getView().getElementBinding();
                this.updateRelatedEventCount();
                this.updateRelatedIndicatorsFilter();

                var timeline = sap.ui.core.Fragment.byId(this.getView().createId("CommentsList"), "timeLine");
                var timelineBinding = timeline.getBinding("content");
                timelineBinding.attachDataReceived(this.onCommentsDataReceived, this);

                var controller = this;
                this.oAlertModel.read(sPath + "/Counts", {
                    success : function(oData) {
                        controller.uiModel.setProperty("/triggeringEventCount", oData.TriggeringEventCount);
                    }
                });
                // only request anomaly data if the alert is an anomaly alert,
                // only request measurement distribution data if measure context is "Log"
                ctxBinding.attachEventOnce("dataReceived", this.onAlertDataReceived, this);

                if (oQueryParameters.edit && oQueryParameters.edit === "true") {
                    // asynchronous loading of details
                    ctxBinding.attachEventOnce("dataReceived", function() {
                        // switch to edit mode after data has been loaded.
                        // Without this, the dirty detection will not work
                        this.setEditMode(true);
                        sap.secmon.ui.m.alerts.util.CompactTriggerHelper.compactifyDetails(this, this.compactDetailsModel, this.getComponent().getModel("i18n"), ctxBinding.getPath() + "/Details",
                                this.getComponent().getModel("i18nknowledge"));
                    }, this);
                } else {
                    // synchronous loading
                    sap.secmon.ui.m.alerts.util.CompactTriggerHelper.compactifyDetails(this, this.compactDetailsModel, this.getComponent().getModel("i18n"), ctxBinding.getPath() + "/Details", this
                            .getComponent().getModel("i18nknowledge"));
                }
            }
            if (oQueryParameters.fullscreen && oQueryParameters.fullscreen === "true") {
                this.adaptBackButtonToFullscreenMode();
            }

            // In case of further tab selection feature this has to be
            // corrected
            if (oArguments.tab && oArguments.tab !== undefined && oArguments.tab !== null) {
                var oIconTabBar = this.getView().byId("tabBar");
                oIconTabBar.setSelectedKey(oArguments.tab);
            }
        }
    },

    handleAnalyze : function() {
        var oContext = this.getView().getBindingContext();

        var patternType = oContext.getProperty("PatternType");
        if (patternType === 'ANOMALY') {
            var sPatternIdBase64 = oContext.getProperty("PatternId");
            var sPatternId = this.oCommons.base64ToHex(sPatternIdBase64);
            var oMinTimestamp = oContext.getProperty("MinTimestamp");
            var oMaxTimestamp = oContext.getProperty("MaxTimestamp");
            sap.secmon.ui.m.commons.NavigationService.openAnomalyAnalysis(sPatternId, oMinTimestamp, oMaxTimestamp);
        } else {
            var sAlertId = this.getAlertId();
            sap.secmon.ui.m.commons.NavigationService.openAlertInMonitoring(sAlertId);
        }
    },

    handlePatternWorkspaceClicked : function() {
        var oContext = this.getView().getBindingContext();
        var oQueryStartTimestamp = oContext.getProperty("QueryStartTimestamp");
        var oQueryEndTimestamp = oContext.getProperty("QueryEndTimestamp");
        var sPatternIdBase64 = oContext.getProperty("PatternId");
        var sPatternId = this.oCommons.base64ToHex(sPatternIdBase64);
        sap.secmon.ui.m.commons.NavigationService.openBrowseUI(sPatternId, oQueryStartTimestamp, oQueryEndTimestamp);
    },

    onPatternClicked : function(oEvent) {
        var sPatternIdBase64 = oEvent.getSource().getBindingContext().getProperty("PatternId");
        var sPatternId = this.oCommons.base64ToHex(sPatternIdBase64);
        var sPatternType = oEvent.getSource().getBindingContext().getProperty("PatternType");
        if (sPatternType === 'ANOMALY') {
            var fnAnomalyPatternNavigator = sap.secmon.ui.m.commons.NavigationService.openAnomalyPattern.bind(this, sPatternId);
            this.navigate(fnAnomalyPatternNavigator);
        } else {
            var fnPatternNavigator = sap.secmon.ui.m.commons.NavigationService.navigateToPattern.bind(this, sPatternId);
            this.navigate(fnPatternNavigator);
        }

    },

    onEvaluationClicked : function(oEvent) {
        var sChartIdBase64 = oEvent.getSource().getBindingContext().getProperty("ChartId");
        var oContext = this.getView().getBindingContext();
        var oMinTimestamp = oContext.getProperty("MinTimestamp");
        var oMaxTimestamp = oContext.getProperty("MaxTimestamp");
        var sChartId = this.oCommons.base64ToHex(sChartIdBase64);
        sap.secmon.ui.m.commons.NavigationService.openBrowseUI(sChartId, oMinTimestamp, oMaxTimestamp);
    },

    handleAddToInvestigationButtonPressed : function(oEvent) {
        var oModel = this.getView().getModel();
        var oContext = this.getView().getBindingContext();
        var aAlerts = [ {
            AlertId : this.getAlertId(),
            AlertHashCode : this.oCommons.base64ToHex(oContext.getProperty("AlertHashCode")),
            AlertReadTimestamp : oContext.getProperty("AlertReadTimestamp")
        } ];
        this.oInvestigationAddendum.showInvestigationAddendumDialog(aAlerts, this.getView(), function() {
            oModel.refresh();
        });
    },

    startInvestigation : function() {
        var oModel = this.getView().getModel();
        var oContext = this.getView().getBindingContext();
        this.oInvestigationCreator.showInvestigationCreationDialog([ {
            AlertId : this.getAlertId(),
            AlertHashCode : this.oCommons.base64ToHex(oContext.getProperty("AlertHashCode")),
            AlertReadTimestamp : oContext.getProperty("AlertReadTimestamp")
        } ], this.getView(), function(oCreatedInvestigation) {
            oModel.refresh();
        });
    },

    handleRemoveFromInvestigationButtonPressed : function(oEvent) {
        var sPath = oEvent.getSource().getBindingContext().sPath.slice(1);
        var oData = oEvent.getSource().getBindingContext().getModel().oData[sPath];
        this.InvestigationId = this.oCommons.base64ToHex(oData.Id);
        var sConfirmationText = this.getText("MobAlert_ConfRemAlert");
        sConfirmationText = this.i18nText(sConfirmationText, oData.Number, oData.Description);
        var that = this;
        sap.m.MessageBox.confirm(sConfirmationText, {
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.OK) {
                    that.removeFromInvestigation();
                }
            }
        });
    },

    handleInvestigationButtonPressed : function() {
        var investIdBase64 = this.getView().getBindingContext().getProperty("InvestigationId");
        if (investIdBase64 && investIdBase64.length > 0) {
            var investigationId = this.oCommons.base64ToHex(investIdBase64);
            this.navToInvestigation(investigationId);
        } else {
            this.startInvestigation();
        }
    },

    handleSave : function(oEvent) {
        // Just to be sure: It is called in beginning of setEditMode as well.
        // But it ensures that duplicate POST requests by unintentional double-clicking on "Save"
        // are prevented.
        sap.ui.core.BusyIndicator.show(0);

        var idBase64 = this.getView().getBindingContext().getProperty("Id");
        var oModelData = this.oEditModel.getData();
        var oData = {
            Id : this.oCommons.base64ToHex(idBase64),
            AlertSeverity : oModelData.AlertSeverity,
            AlertProcessor : oModelData.AlertProcessor,
            AlertStatus : oModelData.AlertStatus,
            AlertAttack : oModelData.AlertAttack,
            AlertHashCode : this.oCommons.base64ToHex(oModelData.AlertHashCode),
            AlertReadTimestamp : oModelData.AlertReadTimestamp
        };

        var sComment = oModelData.newComment;
        if (sComment && sComment.trim().length > 0) {
            oData.Attachments = [];
            var attachment = {
                Content : sComment.trim()
            };
            oData.Attachments.push(attachment);
        }
        this.updateAlert(oData);
    },

    handleEdit : function() {
        this.setEditMode(true);
    },

    handleCancel : function(oEvent) {
        this.doCancel();
    },

    onShowInvestigation : function(oEvent) {
        var investId = this.oCommons.base64ToHex(this.getView().getBindingContext().getProperty("InvestigationId"));
        this.navToInvestigation(investId);
    },

    adaptBackButtonToFullscreenMode : function() {
        // full screen mode: back button is always shown and back performs a
        // browser back
        var oPage = this.getView().byId("idPage");
        oPage.setShowNavButton(true);
    },

    onBackButtonPressed : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    /**
     * Send an alert-popup if the view is in edit mode. Returns whether the view is in edit mode.
     */
    sendAlertIfInEditMode : function() {
        if (this.isEditMode() === true) {
            var that = this;
            // Changes will be lost. Do you want to cancel the edit?
            var text = this.getCommonText("Confirm_Cancel_MSG");
            sap.m.MessageBox.alert(text, {
                title : this.getCommonText("Cancel_TIT"),
                icon : sap.m.MessageBox.Icon.QUESTION,
                actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
                onClose : function(oAction) {
                    if (oAction === sap.m.MessageBox.Action.YES) {
                        that.setEditMode(false);
                    }
                }
            });
            return true;
        } else {
            return false;
        }
    },

    getAlertId : function() {
        return this.sAlertId;
    },

    /**
     * updates the related event count.
     * 
     * @param bResetToInitial
     *            if true - sets the count and the filter to an empty value otherwise - determine the value
     */
    updateRelatedEventCount : function(bResetToInitial) {
        var sAlertId = this.getAlertId();

        function updateRelatedEventCountWith(count, sFilter) {
            this.oNumberModel.setProperty('/relatedEvents', count);
            this.oNumberModel.setProperty('/relatedEventsFilter', sFilter);
            // if (typeof count === "number") {
            this.relatedEvents.setLinkEnabled(true);
            this.relatedEvents.setBusyEnabled(false);
            // }
        }
        this.relatedEvents.setBusyEnabled(true);
        this.relatedEvents.setLinkEnabled(false);
        if (!sAlertId || bResetToInitial) {
            updateRelatedEventCountWith.call(this, null, "");
        } else {
            sap.secmon.ui.commons.RelatedEventsHelper.getRelatedEventCountAsDeferred(sAlertId).done(function(count, sFilter) {
                updateRelatedEventCountWith.call(this, count, sFilter);
            }.bind(this));
        }
    },

    /**
     * updates the related indicators filter.
     * 
     * @param bResetToInitial
     *            if true - sets the filter to an empty value otherwise - determine the value
     */
    updateRelatedIndicatorsFilter : function(bResetToInitial) {
        var sAlertId = this.getAlertId();
        var relatedIndicatorsLinkText;

        function updateRelatedIndicatorsFilterWith(count, sFilter, isPatternTimeframeSet) {
            if (isPatternTimeframeSet) {
                this.relatedIndicators.setLinkEnabled(true);
                if (count) {
                    relatedIndicatorsLinkText = count.toString();
                } else {
                    relatedIndicatorsLinkText = this.getView().getModel("i18n").getProperty("MobAlert_Link");
                }
            } else {
                // Show notification, if the pattern time frame is not set
                relatedIndicatorsLinkText = this.getView().getModel("i18n").getProperty("MobAlert_RelIndTimeframe");
            }
            this.relatedIndicators.setBusyEnabled(false);

            // Set model values
            this.oNumberModel.setProperty('/relatedIndicatorsLinkText', relatedIndicatorsLinkText);
            this.oNumberModel.setProperty('/relatedIndicatorsFilter', sFilter);
        }

        this.relatedIndicators.setBusyEnabled(true);
        this.relatedIndicators.setLinkEnabled(false);
        if (!sAlertId || bResetToInitial) {
            updateRelatedIndicatorsFilterWith.call(this, null, "");
        } else {
            sap.secmon.ui.commons.RelatedIndicatorsHelper.getRelatedIndicatorsFilterAsDeferred(sAlertId).done(function(count, sFilter, isPatternTimeframeSet) {
                updateRelatedIndicatorsFilterWith.call(this, count, sFilter, isPatternTimeframeSet);
            }.bind(this));
        }
    },

    updateSystemsModel : function() {
        var oData = this.oAlertModel.oData;

        var aModelData = [];
        for ( var prop in oData) {
            if (jQuery.sap.startsWith(prop, "Groups(") === true && prop.search(this.sAlertId) > 0) {
                if (oData[prop].SystemId) {
                    aModelData.push({
                        system : oData[prop].SystemId,
                        systemType : oData[prop].SystemType,
                        link : oData[prop].SystemLink
                    });
                }
                if (oData[prop].TargetSystemId) {
                    aModelData.push({
                        system : oData[prop].TargetSystemId,
                        systemType : oData[prop].TargetSystemType,
                        link : oData[prop].TargetSystemLink
                    });
                }
            }
        }
        var idMap = {}, aUnique = [], indexId = 0;
        aModelData.forEach(function(value, i) {
            if (typeof idMap[value.system + " " + value.systemType] !== 'number') {
                idMap[value.system + " " + value.systemType] = indexId;
                indexId++;
                aUnique.push(value);
            }
        });
        this.oSystemsModel.setData(aUnique);
        this.oSystemsModel.refresh();
    },

    navigate : function(fnNavigator) {
        if (this.isEditMode()) {
            this.doCancel(fnNavigator);
        } else {
            fnNavigator();
        }
    },

    navToInvestigation : function(investigationId) {
        var oComponent = this.getComponent();
        // avoid unwanted navigation on source component
        oComponent.destroyRouter();
        sap.secmon.ui.m.commons.NavigationService.navigateToInvestigation(investigationId);
    },

    removeFromInvestigation : function() {
    	 var sToken = this.getComponent().getCsrfToken();		
         var that = this;		
         var oContext = this.getView().getBindingContext();		
 		
         // Added two fields: AlertHashCode and AlertReadTimestamp - as they are mandotory fields.		
         var oData = {		
             InvestigationId: this.InvestigationId,		
             Assignments: [{		
                 ObjectType: "ALERT",		
                 ObjectId: this.getAlertId(),		
                 ObjectHashCode: this.oCommons.base64ToHex(oContext.getProperty("AlertHashCode")),		
                 ObjectReadTimestamp: oContext.getProperty("AlertReadTimestamp")		
             }]		
         };		
        $.ajax({
            url : this.INVESTIGATION_SERVICE_URL + "/Assignments",
            type : "DELETE",
            dataType : "text",
            data : JSON.stringify(oData),
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", sToken);
            },
            success : function() {
                that.getView().getModel().refresh();
            },
            error : function(request, status, error) {
                sap.m.MessageBox.alert(request.responseText, {
                    title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                });
            }
        });

        delete this.InvestigationId;
    },

    doCancel : function(fnActionAfterCancel, fnActionOnNoCancellation) {
        // check if form content was changed or a new comment was added
        if (this.oCommons.deepEqual(this.oInitialEditModelData, this.oEditModel.getData())) {
            this.setEditMode(false);
            if (fnActionAfterCancel) {
                fnActionAfterCancel();
            }
            return;
        }
        var that = this;
        var onClose = function(oAction) {
            if (oAction === sap.m.MessageBox.Action.YES) {
                that.setEditMode(false);
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

    onStatusChange : function(event) {

        var status = event.getParameters().selectedItem.getKey();
        var oldAttackValue = this.oEditModel.getProperty("/AlertAttack");
        var defAttackValue = sap.secmon.ui.m.commons.alerts.AttackRadioButtonHandler.getOnlyAllowedAttackValue(status);
        if (defAttackValue) {

            if (oldAttackValue !== defAttackValue) {
                this.oEditModel.setProperty("/AlertAttack", defAttackValue);
                sap.m.MessageToast.show(this.getText("MobAlert_AttackNo"));
            }
        }
    },

    onExit : function() {
        if (this.editForm) {
            this.editForm.destroy(true);
        }
        if (this.displayForm) {
            this.displayForm.destroy(true);
        }

        if (this.oPage) {
            this.oPage.destroy(true);
        }
        if (this._oAnomalyHistoryTrendPopover) {
            this._oAnomalyHistoryTrendPopover.destroy();
        }
        if (this._oAnomalyEventTrendPopover) {
            this._oAnomalyEventTrendPopover.destroy();
        }
    },

    onSelectAnomalyHistoryTrend : function(oEvent) {
        if (!this._oAnomalyHistoryTrendPopover) {
            this._oAnomalyHistoryTrendPopover = sap.ui.xmlfragment("sap.secmon.ui.m.alerts.anomaly.HistoryTrendPopover", this);

            // There is an unsolved problem:
            // An OData request is sent to path "Alerts/AggregationDetails".
            // The path does not exist.
            // The correct path is "Scores/AggregationDetails".
            // The evaluations table is bound against path "Scores/".
            // So the popover should (in principle !?) inherit the path.
            // In practice, it doesn't work.
            this._oAnomalyHistoryTrendPopover.unbindObject();
            this._oAnomalyHistoryTrendPopover.unbindElement();
            var evaluationsTable = sap.ui.core.Fragment.byId(this.getView().createId("FeatureSet"), "evaluationsTable");
            evaluationsTable.addDependent(this._oAnomalyHistoryTrendPopover);
        }
        // The unbind does not seem to have any effect
        this._oAnomalyHistoryTrendPopover.unbindElement();
        var oSource = oEvent.getSource();
        var sPath = oSource.getBindingContext().getPath();
        // In console: Setting a new binding context aborts the old context, an OData
        // request to "Alerts/AggregationDetails" is aborted.
        this._oAnomalyHistoryTrendPopover.bindElement(sPath);
        this._oAnomalyHistoryTrendPopover.setModel(this.compactDetailsModel, "alertDetails");

        this._openPopoverFromTableElement(this._oAnomalyHistoryTrendPopover, oSource);
    },

    onSelectAnomalyEventTrend : function(oEvent) {
        var oSource = oEvent.getSource();
        var sPath = oSource.getBindingContext().getPath();
        var path = sPath.substring(1);
        if (oSource.getModel().oData[path].AggregationMethod === "BINARY") {
            if (!this._oNewOccurencePopover) {
                this._oNewOccurencePopover = sap.ui.xmlfragment("sap.secmon.ui.m.alerts.anomaly.NewOccurence", this);
                this.getView().addDependent(this._oNewOccurencePopover);
            }
            this._oNewOccurencePopover.bindElement(sPath);
            this._oNewOccurencePopover.openBy(oSource);
        } else {
            if (!this._oAnomalyEventTrendPopover) {
                this._oAnomalyEventTrendPopover = sap.ui.xmlfragment("sap.secmon.ui.m.alerts.anomaly.EventTrendPopover", this);
                this.getView().addDependent(this._oAnomalyEventTrendPopover);
            }
            this._oAnomalyEventTrendPopover.bindElement(sPath);
            this._oAnomalyEventTrendPopover.setModel(this.compactDetailsModel, "alertDetails");
            this._openPopoverFromTableElement(this._oAnomalyEventTrendPopover, oSource);
        }
    },

    /**
     * an event is triggered from a cell within a table. The event needs to open a popover, relative to the table row.
     */
    _openPopoverFromTableElement : function(oPopover, oEventSource) {
        var oParent = oEventSource.getParent().getParent();
        var parentId = oParent.getId();
        var domElement = jQuery.sap.byId(parentId);
        var width = $(domElement).width();
        oPopover.setOffsetX(50 - width);
        oPopover.setPlacement("Right");
        oPopover.openBy(oParent);
    },

    closeHistoryTrendPopover : function(oEvent) {
        this._oAnomalyHistoryTrendPopover.close();
    },

    closeEventTrendPopover : function(oEvent) {
        this._oAnomalyEventTrendPopover.close();
    },

    closeEventNewOccurencePopover : function(oEvent) {
        this._oNewOccurencePopover.close();
    },

    onDetailsPress : function(oEvent) {
        // The details link is only enabled if a system is clicked
        var bindingContext = oEvent.getSource().getBindingContext("compactDetails");
        var sSystemId = bindingContext.getProperty("Value");
        var sSystemType = bindingContext.getProperty("typeValue");
        sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
            target : {
                semanticObject : "System",
                action : "show",
            },
            params : {
                system : sSystemId,
                type : sSystemType,
                tab : "eventTrend"
            }
        });
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/83b793a6638e4bb29d98f98c3266aad3.html");
    },

    handleCreateException : function() {
        this.oAlertExceptionCreator.showAlertExceptionCreationDialog(null, this.getAlertId(), this.getView());
    },

    onPatternAttachmentsUpdateFinished : function(oEvent) {
        var count = oEvent.getSource().getBinding("items").getLength();
        this.uiModel.setProperty("/patternAttachmentsCount", count);
    },

    onCommentsDataReceived : function(oEvent) {
        var count = oEvent.getSource().getLength();
        this.uiModel.setProperty("/commentsCount", count);
    },

    onInvestigationsUpdateFinished : function(oEvent) {
        var count = oEvent.getSource().getBinding("items").getLength();
        this.uiModel.setProperty("/investigationsCount", count);
    },

    /**
     * trigger loading of FeatureSet table
     */
    onScoresUpdateFinished : function(oEvent) {
        var count = oEvent.getSource().getBinding("items").getLength();
        this.uiModel.setProperty("/scoreCount", count);
    },

    /**
     * trigger loading of GroupsTable
     */
    onSourcesUpdateFinished : function(oEvent) {
        var count = oEvent.getSource().getBinding("items").getLength();
        this.uiModel.setProperty("/sourceCount", count);
        this.updateSystemsModel();
    },

    /**
     * optional: trigger loading of scores and groups
     */
    onAlertDataReceived : function(oEvent) {
        var controller = this;
        var ctxBinding = this.getView().getElementBinding();
        var sPath = ctxBinding.getPath();
        var bAnomalyAlert = ctxBinding.getBoundContext().getProperty("AnomalyPattern") === 'Yes';
        var bMeasureContextLog = ctxBinding.getBoundContext().getProperty("AlertMeasureContext") === 'Log';

        if (bAnomalyAlert) {
            controller.oAlertModel.read(sPath + "/AnomalyCounts", {
                success : function(oData) {
                    controller.uiModel.setProperty("/binaryScoreCount", oData.BinaryScoredCount);
                }
            });
            var evaluationsTable = sap.ui.core.Fragment.byId(controller.getView().createId("FeatureSet"), "evaluationsTable");
            var oEvaluationTemplate = evaluationsTable.removeItem(0);
            evaluationsTable.bindItems({
                path : 'Scores/',
                template : oEvaluationTemplate,
                sorter : new sap.ui.model.Sorter("NormalizedScore", true)
            });
        }
        if (bMeasureContextLog) {
            var groupsTable = sap.ui.core.Fragment.byId(controller.getView().createId("GroupsTable"), "groupsTable");
            var oGroupTemplate = groupsTable.removeItem(0);
            groupsTable.bindItems({
                path : 'Groups/',
                template : oGroupTemplate,
                sorter : new sap.ui.model.Sorter("Count", true)
            });
        }
    }

});