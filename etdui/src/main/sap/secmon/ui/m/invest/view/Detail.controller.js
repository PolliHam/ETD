jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.invest.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.alertsfs.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.AlertTriggerFormatter");
jQuery.sap.require("sap.secmon.ui.m.valuelist.util.ODataErrorHandler");
jQuery.sap.require("sap.secmon.ui.m.commons.invest.AttackRadioButtonHandler");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.m.MessageToast");
jQuery.sap.require("sap.secmon.ui.m.invest.view.InvestigationObjectHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.TextWithLinks");
jQuery.sap.require("sap.secmon.ui.commons.HtmlUtils");
jQuery.sap.require("sap.ui.model.odata.CountMode");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/commons/css/EmbeddedHTML.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/commons/css/Print.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/invest/util/Invest.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.invest.view.Detail", {

    INVESTIGATION_SERVICE_URL : "/sap/secmon/services/ui/m/invest/Investigation.xsjs",
    LOGEVENTS_URL : "/sap/secmon/ui/browse/services2/logEntries.xsjs",
    BASE_UPLOAD_URL : "/sap/secmon/services/ui/m/invest/InvestigationDocument.xsjs",
    SCRIPT_CONST : "&lt;script",
    PRINT_REQUEST_TIMEOUT : 60000,
    requestCompletedAttached : false,
    eventsModel : null,
    crumbModel : null,
    relatesEventsModel : null,
    compactDetailsModel : null,
    uiModel : null,

    constructor : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.editModel = null;
        this.oInitialEditModelData = null;
        sap.ui.core.mvc.Controller.apply(this, arguments);
        this.compactDetailsModel = new sap.ui.model.json.JSONModel();
    },

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf etdui.App
     */
    onInit : function() {
        this.applyCozyCompact();
        this.createEditModel();
        this.createInvestigationModel();
        this.eventsModel = new sap.ui.model.odata.ODataModel(this.LOGEVENTS_URL, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.createPrintModel();
        this.createUiModel();
        this.crumbModel = new sap.ui.model.json.JSONModel({
            linkEnabled : false,
            Name : ""
        });
        this.relatesEventsModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.relatesEventsModel, "numbers");
        this.getView().setModel(this.crumbModel, "crumb");

        this.objectsListModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.objectsListModel, "objectsList");

        this.eventsJobModel = new sap.ui.model.json.JSONModel({
            eventsJobNotStarted : true
        });
        this.getView().setModel(this.eventsJobModel, "eventsJobModel");

        var oView = this.getView();
        sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(function(oEvent) {
            // In screen mode, the size limit is ignored.
            // It is only used during print mode
            oView.getModel().setSizeLimit(1000);

            // when detail navigation occurs, update the binding context
            if (oEvent.getParameter("name") === "investigation") {

                var oArguments = oEvent.getParameter("arguments");
                var sPath = "/" + oArguments.investigation;

                var params = oArguments["?query"];
                if (params && params.fullscreen && params.fullscreen === "true") {
                    this.adaptBackButtonToFullscreenMode();
                }

                oView.bindElement(sPath);

                var changes = oView.byId("changes");
                var changesBinding = changes.getBinding("content");
                changesBinding.attachDataReceived(this.onChangesDataReceived, this);

                var comments = oView.byId("comments");
                var commentsBinding = comments.getBinding("content");
                commentsBinding.attachDataReceived(this.onCommentsDataReceived, this);

                // Make sure the master is here
                var oIconTabBar = oView.byId("idIconTabBar");

                // Which tab? (Default is discussion tab)
                var sTabKey = oEvent.getParameter("arguments").tab || "discussion";
                if (oIconTabBar.getSelectedKey() !== sTabKey) {
                    oIconTabBar.setSelectedKey(sTabKey);
                }

                // Edit mode demanded?
                if (params && params.edit && params.edit === "true") {
                    this.getView().getElementBinding().attachEventOnce("dataReceived", function() {
                        // switch to edit mode after data has been loaded.
                        // Without this, the dirty detection will not work
                        this.setEditMode(true);
                    }, this);
                }

            }
        }, this);

        this.getComponent().getNavigationVetoCollector().register(function() {
            if (!this.isEditMode()) {
                return true;
            } else {
                var oDeferred = $.Deferred();

                this.handleCancel(function() {
                    oDeferred.resolve();
                }, function() {
                    oDeferred.reject();
                });

                return oDeferred.promise();
            }
        }, this);

    },
    onStartEventsJob : function(oEvent) {
        var oBindingContext = oEvent.getSource().getBindingContext(), investigationId;
        var that = this;
        if (oBindingContext) {
            investigationId = this.oCommons.base64ToHex(oBindingContext.getProperty("Id"));
        }
        this.sendRequestAndUpdateModel("POST", "/sap/secmon/services/ui/m/alerts/TriggeringEventsForAlertsService.xsjs", investigationId, function() {
            sap.m.MessageToast.show(that.getText("MInvest_JobStarted"));
        });
        this.eventsJobModel.setData({
            eventsJobNotStarted : false
        });
    },
    handleDownloadEvents : function(oEvent) {
        var sBindingPath = oEvent.getSource().getBindingContext().getPath();

        sap.ui.core.BusyIndicator.show();
        var that = this;
        var url = this.ALERT_EVENT_REQUEST_URL + "?InvestigationId=" + this.oCommons.base64ToHex(this.getView().getModel().getData(sBindingPath).Id);

        $.ajax({
            type : "GET",
            url : url,
            async : false,
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", that.csrfToken);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageBox.alert(that.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : that.getView().getModel("i18nCommon").getProperty("Error_TIT")
                });

            },
            success : function(oData) {
                sap.ui.core.BusyIndicator.hide();

            },
        });
    },
    handleTableRowSelectionChange : function(oEvent) {
        var oLayout = this.getView().byId("iconTabBarObjects");
        var content = oLayout.getContentAreas();
        if (content.length > 1) {
            oLayout.removeContentArea(content[1]);
        }
        var oRowContext = oEvent.getParameter("listItem").getBindingContext();
        if (oRowContext) {
            var oObject = oRowContext.getObject();
            switch (oObject.ObjectType) {
            case "ALERT":
                sap.secmon.ui.m.invest.view.InvestigationObjectHelper.handleAlertRowSelection.call(this, oEvent, oLayout);
                break;
            case "EVENT":
                sap.secmon.ui.m.invest.view.InvestigationObjectHelper.handleEventRowSelection.call(this, oEvent, oLayout, oObject);
                break;
            case "HEALTHCHECK":
                sap.secmon.ui.m.invest.view.InvestigationObjectHelper.handleHealthCheckRowSelection.call(this, oEvent, oLayout, oObject);
                break;
            case "FSPACE":
                sap.secmon.ui.m.invest.view.InvestigationObjectHelper.handleFSpaceCheckRowSelection.call(this, oEvent, oLayout, oObject);
                break;
            }
        }
    },

    handlePatternWorkspaceClicked : function(oEvent) {
        sap.secmon.ui.m.invest.view.InvestigationObjectHelper.handlePatternWorkspaceClicked.call(this, oEvent);
    },

    onTriggeringEventsClicked : function(oEvent) {
        sap.secmon.ui.m.invest.view.InvestigationObjectHelper.onTriggeringEventsClicked.call(this, oEvent);
    },

    updateRelatedEventCount : function(sAlertId) {
        sap.secmon.ui.m.invest.view.InvestigationObjectHelper.updateRelatedEventCount.call(this, sAlertId);
    },

    onRelatedEventsClicked : function(oEvent) {
        sap.secmon.ui.m.invest.view.InvestigationObjectHelper.onRelatedEventsClicked.call(this, oEvent);
    },

    onDetailsPress : function(oEvent) {
        sap.secmon.ui.m.invest.view.InvestigationObjectHelper.onSystemTriggerPress.call(this, oEvent);
    },
    createInvestigationModel : function() {
        /*- the investigation model contains a synchronized copy of the field "Status" of
            the current investigation. This model is used to control the visibility of the 
            remove alert action in the alerts table. Reason: the field Status of the current
            investigation is not accessible for data binding when doing the row binding of the alerts
            table. As a workaround, this named model is used. */
        this.investigationModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.investigationModel, "investigation");
    },

    createUiModel : function() {
        this.uiModel = new sap.ui.model.json.JSONModel({
            alertsCount : 0,
            objectsCount : 0,
            changesCount : 0,
            commentsCount : 0,
            patternAttachmentsCount : 0,
            filesCount : 0
        });
        this.getView().setModel(this.uiModel, "uiModel");
    },

    updateInvestigationModel : function() {
        this.getView().byId("investigationDetailsContainer").setBusy(false);

        var oViewContext = this.getView().getBindingContext();
        if (!oViewContext) {
            return;
        }
        var status = oViewContext.getProperty("Status");
        this.investigationModel.setData({
            Status : status,
        });

        if (this.EditMode) {
            var oContext = this.getView().byId("headerPanel").getBindingContext();

            this.editModel.setProperty("/editMode", true);
            this.editModel.setProperty("/displayMode", false);
            this.editModel.setProperty("/Description", oContext.getProperty("Description"));
            this.editModel.setProperty("/Severity", oContext.getProperty("Severity"));
            this.editModel.setProperty("/Processor", oContext.getProperty("Processor"));
            this.editModel.setProperty("/Status", oContext.getProperty("Status") === 'COMPLETED' ? 'OPEN' : oContext.getProperty("Status"));
            this.editModel.setProperty("/ManagementVisibility", oContext.getProperty("ManagementVisibility"));
            this.editModel.setProperty("/Attack", oContext.getProperty("Attack"));
            this.editModel.setProperty("/ReadTimestamp", oContext.getProperty("ReadTimestamp"));
            this.editModel.setProperty("/HashCode", oContext.getProperty("HashCode"));

            this.oInitialEditModelData = this.oCommons.cloneObjectIncludingUndefinedAttributes(this.editModel.getData());
        } else {
            this.editModel.setData({
                editMode : false,
                displayMode : true,
                // avoids nullpointer exceptions in the console
                newComment : "",
            });
        }
    },

    fillObjectsListModel : function(oData) {

        // We convert into a flat list understandable by sap.m.Table
        var aFlatList = [];

        var count = 0;
        for (var index = 0; index < oData.results.length; index++) {
            var data = oData.results[index];

            var newFlatEntry = {
                ObjectId : data.ObjectId,
                Type : data.Type,
                ObjectType : data.ObjectType,
                Name : data.Name,
                CreationTimestamp : data.CreationTimestamp,
                row : "" + (index + 1)
            };
            aFlatList.push(newFlatEntry);
            if (data.FSpaceChildren && data.FSpaceChildren.results && data.FSpaceChildren.results.length > 0) {
                for (var index2 = 0; index2 < data.FSpaceChildren.results.length; index2++) {
                    var childData = data.FSpaceChildren.results[index2];
                    count++;
                    var newFlatChildEntry = {
                        ObjectId : childData.ObjectId,
                        Type : childData.Type,
                        ObjectType : childData.ObjectType,
                        Name : childData.Name,
                        CreationTimestamp : childData.CreationTimestamp,
                        isChild : true,
                        row : "" + (index + 1) + "-" + (index2 + 1)
                    };
                    aFlatList.push(newFlatChildEntry);
                }
            }
            count++;
        }

        var objectsList = this.getView().byId("objectsList");
        if (objectsList) {
            objectsList.setGrowingThreshold(count);
        }
        this.objectsListModel.setData(aFlatList);
        this.objectsListModel.refresh(true);
    },

    adaptBackButtonToFullscreenMode : function() {
        // full screen mode: back button is always shown and back performs a
        // browser back
        var that = this;
        var oPage = this.getView().byId("investigationDetailsContainer");
        oPage.setShowNavButton(true);
        oPage.detachNavButtonPress(this.onNavBack, this);

        oPage.attachNavButtonPress(function() {
            that.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
                window.history.go(-1);
            });
        });
    },

    createEditModel : function() {
        this.editModel = new sap.ui.model.json.JSONModel();
        this.editModel.setData({
            editMode : false,
            displayMode : true,
            newComment : ""
        });
        this.getView().setModel(this.editModel, "editModel");
    },

    /**
     * holds data only used for printing (URL of investigation)
     */
    createPrintModel : function() {
        this.printModel = new sap.ui.model.json.JSONModel();
        this.printModel.setData({
            href : window.location.href
        });
        this.getView().setModel(this.printModel, "printModel");
    },

    isEditMode : function() {
        return this.editModel.getData().editMode;
    },

    onEdit : function() {
        this.setEditMode(true);
    },

    onReopen : function() {
        this.reopenInvestigation();
    },

    onSave : function() {
        // Just to be sure: It is called in beginning of setEditMode as well.
        // But it ensures that duplicate POST requests by unintentional double-clicking on "Save"
        // are prevented.
        sap.ui.core.BusyIndicator.show(0);

        this.updateInvestigation();
    },

    updateInvestigation : function() {
        var idBase64 = this.getView().getBindingContext().getProperty("Id");
        var oData = this.editModel.getData();
        var oInvestigation = {
            Id : this.oCommons.base64ToHex(idBase64),
            Severity : oData.Severity,
            Processor : oData.Processor,
            Status : oData.Status,
            ManagementVisibility : oData.ManagementVisibility,
            Description : oData.Description,
            Attack : oData.Attack,
            ReadTimestamp : oData.ReadTimestamp,
            HashCode : this.oCommons.base64ToHex(oData.HashCode)
        };

        // Binding of rich text editor works but is slow sometimes.
        // It only works reliably if we wait a little.
        var controller = this;
        setTimeout(function() {
            if (oData.newComment.length > 0) {
                var msg = oData.newComment.trim().replace("&nbsp;", "");
                if (msg.toLowerCase().includes(controller.SCRIPT_CONST)) {
                    sap.m.MessageBox.alert(controller.getView().getModel("i18n").getProperty("MInvest_Bad_Comment_Content"));
                    sap.ui.core.BusyIndicator.hide();
                } else {
                    oInvestigation.Attachments = [ {
                        Type : "COMMENT",
                        Content : msg
                    } ];
                    controller.sendRequestAndUpdateModel("POST", controller.INVESTIGATION_SERVICE_URL, oInvestigation);
                }
            } else {
                controller.sendRequestAndUpdateModel("POST", controller.INVESTIGATION_SERVICE_URL, oInvestigation);
            }
        }, 1000);

    },

    sendRequestAndUpdateModel : function(requestType, url, objectToSendAsJSON, successHandler) {
        var controller = this;
        function defaultSuccessHandler(data) {
            controller.getView().getModel().refresh(false);
            controller.setEditMode(false);
        }

        var handler = successHandler ? successHandler : defaultSuccessHandler;
        var csrfToken = this.getComponent().getCsrfToken();
        $.ajax({
            type : requestType,
            url : url,
            data : JSON.stringify(objectToSendAsJSON),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            },
            success : handler,
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.m.MessageBox.alert(XMLHttpRequest.responseText, {
                    title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                });

            },
            complete : function() {
                sap.ui.core.BusyIndicator.hide();
            }
        });
    },

    onCancel : function() {
        this.handleCancel();
    },

    handleCancel : function(fnActionAfterCancel, fnActionOnNoCancellation) {
        if (this.oCommons.deepEqual(this.editModel.getData(), this.oInitialEditModelData)) {
            this.setEditMode(false);
            if (fnActionAfterCancel) {
                fnActionAfterCancel();
            }
            return;
        }
        var that = this;
        var title = this.getView().getModel("i18nCommon").getProperty("Confirmation_TIT");
        sap.m.MessageBox.show(this.getView().getModel("i18nCommon").getProperty("Confirm_Cancel_MSG"), {
            title : title,
            icon : sap.m.MessageBox.Icon.QUESTION,
            actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.YES) {
                    that.setEditMode(false);
                    if (fnActionAfterCancel) {
                        fnActionAfterCancel();
                    }
                } else {
                    if (fnActionOnNoCancellation) {
                        fnActionOnNoCancellation();
                    }
                }
            }
        });
    },

    setEditMode : function(bEditMode) {
        this.EditMode = bEditMode;
        // update investigation model if data is already available
        this.updateInvestigationModel();
        this.getView().getElementBinding().attachDataReceived(function() {
            /*- update when data was received. This event is only triggered if data is loaded from the server.
                It is not triggered when selecting an other investigation in the master list! */
            this.updateInvestigationModel();
        }, this);
        this.getView().byId("investigationDetailsContainer").setBusy(true);
        this.getView().getModel().refresh();
    },

    onNavBack : function() {
        // This is only relevant when running on phone devices
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
            sap.secmon.ui.m.commons.NavigationUtils.myNavBack(oRouter, "main");
        });
    },

    /** Detail-Tab selected */
    onDetailSelect : function(oEvent) {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("investigation", {
            investigation : oEvent.getSource().getBindingContext().getPath().slice(1),
            tab : oEvent.getParameter("selectedKey")
        }, true);

    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    onAlertClicked : function(oEvent) {
        var alertIdBase64 = oEvent.getSource().getBindingContext().getProperty("AlertId");
        var alertId = this.oCommons.base64ToHex(alertIdBase64);
        var fnAlertNavigator = this.navigateToAlert.bind(this, alertId);

        this.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
            fnAlertNavigator();
        });
    },

    onPatternClicked : function(oEvent) {
        var patternIdBase64 = oEvent.getSource().getBindingContext().getProperty("PatternId");
        var patternType = oEvent.getSource().getBindingContext().getProperty("PatternType");
        var fnPatternNavigator = this.navigateToPattern.bind(this, patternIdBase64, patternType);

        this.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
            fnPatternNavigator();
        });
    },

    navigateToAlert : function(alertId) {
        var oComponent = this.getComponent();
        // avoid unwanted navigation on source component
        oComponent.destroyRouter();
        sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
            target : {
                semanticObject : "AlertDetails",
                action : "show"
            },
            params : {
                alert : alertId
            }
        });
    },

    navigateToPattern : function(patternId, patternType) {
        var oComponent = this.getComponent();
        // avoid unwanted navigation on source component
        oComponent.destroyRouter();

        sap.secmon.ui.m.commons.NavigationService.navigateToPattern(patternId, patternType);
    },

    onRemoveAlert : function(oEvent) {
        var oI18nModel = this.getView().getModel("i18nInvest");
        var sConfirmationText = oI18nModel.getProperty("MInvest_ConfirmRemoveAlert");
        var oBindingContext = oEvent.getSource().getBindingContext();
        var number = oBindingContext.getProperty("Number");
        var alertId = this.oCommons.base64ToHex(oBindingContext.getProperty("AlertId"));
        var hashcode = this.oCommons.base64ToHex(oBindingContext.getProperty("AlertHashCode"));
        var readTimestamp = oBindingContext.getProperty("AlertReadTimestamp");

        sConfirmationText = sap.secmon.ui.commons.Formatter.i18nText(sConfirmationText, number);
        var that = this;
        sap.m.MessageBox.confirm(sConfirmationText, {
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.OK) {
                    that.removeAlertFromInvestigation(alertId, hashcode, readTimestamp);
                }
            }
        });
    },

    removeAlertFromInvestigation : function(alertId, hashcode, readTimestamp) {

        var sToken = this.getComponent().getCsrfToken();
        var that = this;
        var oData = {
            InvestigationId : this.oCommons.base64ToHex(this.getView().getBindingContext().getProperty("Id")),
            Assignments : [ {
                ObjectType : "ALERT",
                ObjectId : alertId,
                ObjectHashCode : hashcode,
                ObjectReadTimestamp : readTimestamp
            } ]
        };
        sap.ui.core.BusyIndicator.show(0);
        $.ajax({
            url : this.INVESTIGATION_SERVICE_URL + "/Assignments",
            type : "DELETE",
            contentType : "application/json; charset=UTF-8",
            data : JSON.stringify(oData),
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", sToken);
            },
            success : function(response) {
                sap.ui.core.BusyIndicator.hide();
                if (response.sqlErrorCode && response.sqlErrorCode > 0) {
                    // 131: ERR_TX_ROLLBACK_LOCK_TIMEOUT -- transaction rolled back by lock wait timeout
                    // 133: ERR_TX_ROLLBACK_DEADLOCK -- transaction rolled back by detected deadlock
                    // 146: ERR_TX_LOCK_ACQUISITION_FAIL -- Alert table rows locked (only if option NOWAIT is specified)

                    sap.m.MessageBox.alert(that.getView().getModel("i18nMCommons").getProperty("MInvest_alertLocked"), {
                        title : that.getView().getModel("i18nMCommons").getProperty("MInvest_chgDetect")
                    });
                } else if (response && response.rejectedObjects && response.rejectedObjects.length > 0) {
                    sap.m.MessageBox.alert(that.getView().getModel("i18nMCommons").getProperty("MInvest_alertChgDetect"), {
                        title : that.getView().getModel("i18nMCommons").getProperty("MInvest_chgDetect")
                    });
                }
                that.getView().getModel().refresh();
            },
            error : function(request, status, error) {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageBox.alert(request.responseText, {
                    title : that.getCommonText("Error_TIT")
                });
            }
        });
    },

    onRemoveObject : function(oEvent) {
        sap.secmon.ui.m.invest.view.InvestigationObjectHelper.onRemoveObject.call(this, oEvent);
    },

    onTableItemPress : function(oEvent) {
        sap.secmon.ui.m.invest.view.InvestigationObjectHelper.onTableItemPress.call(this, oEvent);
    },

    reopenInvestigation : function() {
        this.setEditMode(true);
    },

    /**
     * The radio buttons are not bound against edit model. We do it manually with this select callback.
     */
    onSelectAttack : function(event) {
        var customData = event.getSource().data();
        var key = Object.keys(customData)[0];

        this.editModel.setProperty("/Attack", key);
    },

    /**
     * cleanup
     */
    onExit : function() {
        if (this.alertsForPrint) {
            this.alertsForPrint.destroy(true);
        }

        if (this.objectsForPrint) {
            this.objectsForPrint.destroy(true);
        }

        if (this.discussionForPrint) {
            this.discussionForPrint.destroy(true);
        }

        if (this.actionsForPrint) {
            this.actionsForPrint.destroy(true);
        }
    },

    beforeInitEditor : function(oEvent) {
        var oConf = oEvent.getParameter("configuration");
        oConf.toolbar = [ "link unlink image" ];
        // This is needed for tinyMCE4
        oConf.element_format = "html";
        // Refer to https://www.tinymce.com/docs/plugins/paste/
        oConf.plugins = "paste link image autolink";
        oConf.paste_data_images = true;

        // replace HTML with a filtered one, formatting removed but links and images retained
        oConf.paste_postprocess = function(plugin, args) {
            var origNode = args.node;
            var newNode = sap.secmon.ui.commons.HtmlUtils.cleanupHtmlDom(origNode);
            args.node = newNode;
        };

        // When pasting from MS Word: Allow anchors and images
        oConf.paste_word_valid_elements = "a img";
        oConf.content_style = ".mce-content-body {font-size:1rem;font-family:Arial,sans-serif;}";
    },

    handleEmailButtonPressed : function() {
        // Since the URL reflects the overall filtering and sorting it can be
        // used for forwarding.
        var sURL = window.location;
        var invNumber = this.getView().getBindingContext().getProperty("Number");
        var sBody = this.i18nText(this.getText("Invest1Email_Body"), invNumber) + "\n" + sURL + "\n";
        var sSubject = this.i18nText(this.getText("Invest1Email_Subject"), invNumber);
        sap.m.URLHelper.triggerEmail('', sSubject, sBody);
    },

    handlePrintPressed : function(oEvent) {
        // When printing, we need to disable paging of lists, we want to print the complete list.
        // As the backend requests are possibly large, we enable the corresponding UI controls (lists and tables)
        // on demand only.
        // This is done differently depending on object type:
        // - The XML fragments "AlertTablePrintOnly", ""CommentsPrintOnly"", "ChangesPrintOnly", "PatternAttachmentsPrintOnly" and "AttachmentsPrintOnly"
        // contain corresponding OData model bindings to paths
        // "Alerts", "Attachments", "PatternRelatedAttachments" and "File", they will trigger a full retrieval of ALL alerts, attachments and pattern
        // attachments from backend on loading the XML fragment.
        // We insert those dynamically.
        // - The XML fragment "ObjectsListPrintOnly" contains a JSON model binding, the JSON model "ObjectsList"
        // is initially empty. The JSON model will be loaded only on demand. Here, we trigger an OData request for path "Objects"
        // manually and set the JSON model "ObjectsList" manually.
        var controller = this;
        var sTimeoutError = this.getText("MInvest_printTimeout");
        sap.ui.core.BusyIndicator.show(0);

        // We need to wait for 2 models to load (OData model with paths "/" (including navigation paths) and JSON model "ObjectsList").
        // After that, the corresponding UI tables need to finish updating.
        // We use tons of promises for that.
        // setTimeout to get engine time to render BusyIndicator. Otherway it will not shown until all request will be send
        setTimeout(function() {
            // Promise 1: Wait for investigation details to be loaded
            var detailsModelUpdatePromise = function() {
                var oDeferred = $.Deferred();
                var binding = controller.getView().getElementBinding();
                if (binding.isInitial() !== true) {
                    binding.attachDataReceived(function() {
                        oDeferred.resolve();
                    });
                } else {
                    oDeferred.resolve();
                }
                return oDeferred.promise();
            }();

            // Promise 2: Wait until OData request for path "Attachments" has been received
            var commentsModelUpdatePromise = function() {
                var oDeferred = $.Deferred();
                // THE XML fragment "CommentsPrintOnly" contains a list control with flag growing="false" which triggers an OData request for ALL comments.
                controller.discussionForPrint = sap.ui.xmlfragment(controller.getView().getId(), "sap.secmon.ui.m.invest.view.CommentsPrintOnly", controller);
                var oDiscussionPanel = controller.getView().byId("discussionPanelForPrint");
                oDiscussionPanel.insertContent(controller.discussionForPrint, 0);
                var model = controller.getView().getModel();
                model.attachEvent("requestCompleted", function(oEvent) {
                    var requestUrl = oEvent.getParameter("url");
                    if (requestUrl.indexOf("Attachments") > 0 && requestUrl.indexOf("COMMENT") > 0) {
                        oDeferred.resolve();
                    }
                    // fallback: The OData call MUST finish after a few seconds.
                    setTimeout(function() {
                        oDeferred.reject(sTimeoutError);
                    }, controller.PRINT_REQUEST_TIMEOUT);
                });
                return oDeferred.promise();
            }();
            var changesModelUpdatePromise = function() {
                var oDeferred = $.Deferred();
                // THE XML fragment "ChangesPrintOnly" contains a list control with flag growing="false" which triggers an OData request for ALL comments.
                controller.actionsForPrint = sap.ui.xmlfragment(controller.getView().getId(), "sap.secmon.ui.m.invest.view.ChangesPrintOnly", controller);
                var oActionsPanel = controller.getView().byId("actionsPanelForPrint");
                oActionsPanel.insertContent(controller.actionsForPrint, 0);
                var model = controller.getView().getModel();
                model.attachEvent("requestCompleted", function(oEvent) {
                    var requestUrl = oEvent.getParameter("url");
                    if (requestUrl.indexOf("Attachments") > 0 && requestUrl.indexOf("CHANGE") > 0) {
                        oDeferred.resolve();
                    }
                    // fallback: The OData call MUST finish after a few seconds.
                    setTimeout(function() {
                        oDeferred.reject(sTimeoutError);
                    }, controller.PRINT_REQUEST_TIMEOUT);
                });
                return oDeferred.promise();
            }();

            // Promise 3a: Wait until OData request for path "PatternRelatedAttachments" has been received
            var patternFilesModelUpdatePromise = function() {
                var oDeferred = $.Deferred();
                controller.patternFilesForPrint = sap.ui.xmlfragment(controller.getView().getId(), "sap.secmon.ui.m.invest.view.PatternAttachmentsPrintOnly", controller);
                var oPatternFilesPanel = controller.getView().byId("patternFilesPanelForPrint");
                oPatternFilesPanel.insertContent(controller.patternFilesForPrint, 0);
                var model = controller.getView().getModel();
                model.attachEvent("requestCompleted", function(oEvent) {
                    var requestUrl = oEvent.getParameter("url");
                    if (requestUrl.indexOf("PatternRelatedAttachments") > 0) {
                        oDeferred.resolve();
                    }
                    // fallback: The OData call MUST finish after a few seconds.
                    setTimeout(function() {
                        oDeferred.reject(sTimeoutError);
                    }, controller.PRINT_REQUEST_TIMEOUT);
                });
                return oDeferred.promise();
            }();

            // Promise 3b: Wait until OData request for path "File" has been received
            var filesModelUpdatePromise = function() {
                var oDeferred = $.Deferred();
                controller.filesForPrint = sap.ui.xmlfragment(controller.getView().getId(), "sap.secmon.ui.m.invest.view.FilesPrintOnly", controller);
                var oFilesPanel = controller.getView().byId("filesPanelForPrint");
                oFilesPanel.insertContent(controller.filesForPrint, 0);
                var model = controller.getView().getModel();
                model.attachEvent("requestCompleted", function(oEvent) {
                    var requestUrl = oEvent.getParameter("url");
                    if (requestUrl.indexOf("File") > 0) {
                        oDeferred.resolve();
                    }
                    // fallback: The OData call MUST finish after a few seconds.
                    setTimeout(function() {
                        oDeferred.reject(sTimeoutError);
                    }, controller.PRINT_REQUEST_TIMEOUT);
                });
                return oDeferred.promise();
            }();

            // Promise 4a: Wait until OData request for path "Objects" has been received and
            // jSON model "ObjectsList" has been updated
            var objectsModelUpdatePromise = function() {
                var oDeferred = $.Deferred();
                var path = controller.getView().getElementBinding().getPath();
                var model = controller.getView().getModel();
                model.setSizeLimit(1000); // ensures that the paging size of 100 is not used
                model.read(path + "/Objects", {
                    urlParameters : {
                        $expand : 'FSpaceChildren',
                        $skip : 0,
                        $top : 1000,
                    },
                    sorters : [ new sap.ui.model.Sorter('CreationTimestamp', true) ],
                    filters : [ new sap.ui.model.Filter({
                        path : 'ObjectType',
                        operator : 'NE',
                        value1 : 'ALERT'
                    }) ],
                    success : function(oData, response) {
                        oDeferred.resolve(oData);
                    },
                    error : function(oError) {
                        oDeferred.reject(oError);
                    }
                });
                return oDeferred.promise();
            }();
            objectsModelUpdatePromise.done(function(oData) {
                // fill JSON model "ObjectsList" from oData
                controller.fillObjectsListModel(oData);
            });

            // Promise 4b: Wait until OData request for path "Alerts" has been received and
            // jSON model "ObjectsList" has been updated
            var alertsModelUpdatePromise = function() {
                var oDeferred = $.Deferred();
                controller.alertsForPrint = sap.ui.xmlfragment(controller.getView().getId(), "sap.secmon.ui.m.invest.view.AlertTablePrintOnly", controller);
                var oAlertPanel = controller.getView().byId("alertPanelForPrint");
                oAlertPanel.insertContent(controller.alertsForPrint, 0);
                var model = controller.getView().getModel();
                model.attachEvent("requestCompleted", function(oEvent) {
                    var requestUrl = oEvent.getParameter("url");
                    if (requestUrl.indexOf("Alerts") > 0) {
                        oDeferred.resolve();
                    }
                    // fallback: The OData call MUST finish after a few seconds.
                    setTimeout(function() {
                        oDeferred.reject(sTimeoutError);
                    }, controller.PRINT_REQUEST_TIMEOUT);
                });
                return oDeferred.promise();
            }();

            // Promise 5a: Wait until UI control "commentsList" has updated itself
            var commentsListControlUpdatePromise = function() {
                var oDeferred = $.Deferred();
                var commentsList = controller.getView().byId("commentsList");
                commentsList.attachEventOnce("updateFinished", function(oEvent) {
                    oDeferred.resolve();
                });
                // fallback: The list control MUST finish after a few seconds.
                setTimeout(function() {
                    oDeferred.reject(sTimeoutError);
                }, controller.PRINT_REQUEST_TIMEOUT);
                return oDeferred.promise();
            }();

            // Promise 5b: Wait until UI control "changesList" has updated itself
            var changesListControlUpdatePromise = function() {
                var oDeferred = $.Deferred();
                var changesList = controller.getView().byId("changesList");
                changesList.attachEventOnce("updateFinished", function(oEvent) {
                    oDeferred.resolve();
                });
                // fallback: The list control MUST finish after a few seconds.
                setTimeout(function() {
                    oDeferred.reject(sTimeoutError);
                }, controller.PRINT_REQUEST_TIMEOUT);
                return oDeferred.promise();
            }();

            // Promise 6a: Wait until UI control "patternFileTable" has updated itself
            var patternFilesTableControlUpdatePromise = function() {
                var oDeferred = $.Deferred();
                var fileTable = controller.getView().byId("patternFileTablePrintOnly");
                fileTable.attachEventOnce("updateFinished", function(oEvent) {
                    oDeferred.resolve();
                });
                // fallback: The list control MUST finish after a few seconds.
                setTimeout(function() {
                    oDeferred.reject(sTimeoutError);
                }, controller.PRINT_REQUEST_TIMEOUT);
                return oDeferred.promise();
            }();

            // Promise 6b: Wait until UI control "fileTable" has updated itself
            var filesTableControlUpdatePromise = function() {
                var oDeferred = $.Deferred();
                var fileTable = controller.getView().byId("fileTablePrintOnly");
                fileTable.attachEventOnce("updateFinished", function(oEvent) {
                    oDeferred.resolve();
                });
                // fallback: The list control MUST finish after a few seconds.
                setTimeout(function() {
                    oDeferred.reject(sTimeoutError);
                }, controller.PRINT_REQUEST_TIMEOUT);
                return oDeferred.promise();
            }();

            // Promise 7a: Wait until UI control "ObjectsList" has updated itself
            var objectsListControlUpdatePromise = function() {
                var oDeferred = $.Deferred();
                var objectsList = controller.getView().byId("ObjectsList");
                objectsList.attachUpdateFinished(function(oEvent) {
                    oDeferred.resolve();
                });
                // fallback: The list control MUST finish after a few seconds.
                setTimeout(function() {
                    oDeferred.reject(sTimeoutError);
                }, controller.PRINT_REQUEST_TIMEOUT);
                return oDeferred.promise();
            }();
            // Promise 7b: Wait until UI control "AlerttsList" has updated itself
            var alertsTableControlUpdatePromise = function() {
                var oDeferred = $.Deferred();
                var alertsList = controller.getView().byId("AlertsList");
                alertsList.attachUpdateFinished(function(oEvent) {
                    oDeferred.resolve();
                });
                // fallback: The list control MUST finish after a few seconds.
                setTimeout(function() {
                    oDeferred.reject(sTimeoutError);
                }, controller.PRINT_REQUEST_TIMEOUT);
                return oDeferred.promise();
            }();

            function cleanup() {
                var oFilePanel;
                if (controller.discussionForPrint) {
                    var oDiscussionPanel = controller.getView().byId("discussionPanelForPrint");
                    oDiscussionPanel.removeAllContent();
                    controller.discussionForPrint.destroy(true);
                    delete controller.discussionForPrint;
                }
                if (controller.actionsForPrint) {
                    var oActionsPanel = controller.getView().byId("actionsPanelForPrint");
                    oActionsPanel.removeAllContent();
                    controller.actionsForPrint.destroy(true);
                    delete controller.actionsForPrint;
                }
                if (controller.patternFilesForPrint) {
                    var oPatternFilePanel = controller.getView().byId("patternFilesPanelForPrint");
                    oPatternFilePanel.removeAllContent();
                    controller.patternFilesForPrint.destroy(true);
                    delete controller.patternFilesForPrint;
                }
                if (controller.filesForPrint) {
                    oFilePanel = controller.getView().byId("filesPanelForPrint");
                    oFilePanel.removeAllContent();
                    controller.filesForPrint.destroy(true);
                    delete controller.filesForPrint;
                }
                if (controller.alertsForPrint) {
                    oFilePanel = controller.getView().byId("alertPanelForPrint");
                    oFilePanel.removeAllContent();
                    controller.alertsForPrint.destroy(true);
                    delete controller.alertsForPrint;
                }
                controller.objectsListModel.setData([]);
            }

            // start printing after all promises have returned.
            $.when(detailsModelUpdatePromise, commentsModelUpdatePromise.done(commentsListControlUpdatePromise), changesModelUpdatePromise.done(changesListControlUpdatePromise),
                    patternFilesModelUpdatePromise.done(patternFilesTableControlUpdatePromise), filesModelUpdatePromise.done(filesTableControlUpdatePromise),
                    alertsModelUpdatePromise.done(alertsTableControlUpdatePromise), objectsModelUpdatePromise, objectsListControlUpdatePromise).done(function() {
                sap.ui.core.BusyIndicator.hide();
                controller.print(cleanup);
            }).fail(function(sMessage) {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageBox.alert(sMessage);
                cleanup();
            });
        }.bind(this), 0);
    },

    onAssignMyselfAsProcessor : function(oEvent) {
        var applContextModel = this.getView().getModel("applicationContext");
        var logonUser = applContextModel.getData().userName;
        var data = this.editModel.getData();
        data.Processor = logonUser;
        this.editModel.setData(data);
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/42fc02b7502f428a9a2b9c82e47ca24a.html");
    },

    onFilesUpdateFinished : function(oEvent) {
        var count = oEvent.getSource().getBinding("items").getLength();
        this.uiModel.setProperty("/filesCount", count);
    },

    onPatternAttachmentsUpdateFinished : function(oEvent) {
        var count = oEvent.getSource().getBinding("items").getLength();
        this.uiModel.setProperty("/patternAttachmentsCount", count);
    },

    onChangesDataReceived : function(oEvent) {
        var count = oEvent.getSource().getLength();
        this.uiModel.setProperty("/changesCount", count);
    },

    onCommentsDataReceived : function(oEvent) {
        var count = oEvent.getSource().getLength();
        this.uiModel.setProperty("/commentsCount", count);
    },

    onObjectsUpdateFinished : function(oEvent) {
        var count = oEvent.getSource().getBinding("items").getLength();
        this.uiModel.setProperty("/objectsCount", count);
    },

    onAlertsUpdateFinished : function(oEvent) {
        var count = oEvent.getSource().getBinding("items").getLength();
        this.uiModel.setProperty("/alertsCount", count);
    },

    onDeleteFilePressed : function(oEvent) {
        var table = this.getView().byId("investigationFileTable");
        var selectedItem;
        var controller = this;
        var confirmationText = this.getView().getModel("i18nValue").getProperty("VL_Entry_Delete_Selected");
        var sToken = this.getComponent().getCsrfToken();
        if (table) {
            selectedItem = table.getSelectedItem();

            if (selectedItem) {
                sap.m.MessageBox.confirm(confirmationText, function(oAction) {
                    if (oAction === sap.m.MessageBox.Action.OK) {
                        deleteSelectedItem.call(controller, selectedItem);
                    }
                });
            }
        }

        function deleteSelectedItem(selectedItem) {
            var investigationFileId = selectedItem.getBindingContext().getProperty("Id");
            investigationFileId = this.oCommons.base64ToHex(investigationFileId);
            $.ajax({
                type : "DELETE",
                url : this.BASE_UPLOAD_URL + "?Id=" + investigationFileId,
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", sToken);
                },
                success : function(data) {
                    sap.m.MessageToast.show(controller.getView().getModel("i18n").getProperty("MInvest_FileDeleted"));
                },
                error : function(XMLHttpRequest, textStatus, errorThrown) {
                    sap.m.MessageBox.alert(XMLHttpRequest.responseText, {
                        title : controller.getView().getModel("i18nCommon").getProperty("Error_TIT")
                    });
                },
                complete : function(data) {
                    controller.getView().getModel().refresh();
                }
            });
        }
    },

    onUploadComplete : function(oEvent) {
        var status = oEvent.getParameter("status");
        var i18n = this.getView().getModel("i18n");
        if (status === 200) {

            sap.m.MessageToast.show(i18n.getProperty("MInvest_FileUploaded"));
        } else {
            var message = oEvent.getParameter("responseRaw");
            sap.m.MessageBox.alert(message);
        }
        this.getView().getModel().refresh();
    },

    onUploadChange : function(oEvent) {
        var fileUploader = oEvent.getSource();
        var oHeaderParameter = new sap.ui.unified.FileUploaderParameter();
        var xsrfToken = this.getComponent().getCsrfToken();
        var context = this.getView().getBindingContext();
        var investigationId = this.oCommons.base64ToHex(context.getProperty("Id"));
        var sUrl = this.BASE_UPLOAD_URL + "?InvestigationId=" + investigationId + "&fileName=" + oEvent.getParameter("newValue");
        fileUploader.setUploadUrl(sUrl);
        oHeaderParameter.setName("x-csrf-token");

        oHeaderParameter.setValue(xsrfToken);
        fileUploader.removeAllHeaderParameters();
        fileUploader.addHeaderParameter(oHeaderParameter);
    },

    onFileNameLengthExceed : function(oEvent) {
        sap.m.MessageBox.alert(this.getText("MInvest_FilenameTooLarge"), {
            title : this.getView().getModel("i18nCommon").getProperty("Error_TIT")
        });
    },
    onFileTypeMissmatch : function(oEvent) {
        sap.m.MessageBox.alert(this.getText("MInvest_FileTypeMismatch"), {
            title : this.getView().getModel("i18nCommon").getProperty("Error_TIT")
        });

    }
});
