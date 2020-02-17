jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.anomaly.ui.Formatter");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.m.MessageToast");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.m.views.pattern.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.exemptions.util.Formatter");
jQuery.sap.require("sap.ui.unified.FileUploaderParameter");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");
jQuery.sap.require("sap.secmon.ui.m.commons.alertexceptions.AlertExceptionCreator");
jQuery.sap.require("sap.ui.model.odata.CountMode");

/*-
 *  Reusable view for displaying a pattern. Create the view and 
 *  call bindPattern on this controller.
 */
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.views.pattern.Pattern", {
    PATTERN_EXECUTOR_URL : "/sap/secmon/services/ui/m/patterns/patterntest.xsjs",
    PATTERN_MODIFICATION_SERVICE_URL : "/sap/secmon/services/ui/m/patterns/patternconfig.xsjs",
    ORDER_BY_CREATION_DATE_DESCENDING : "orderBy=creationDate&orderDesc=true",
    PATTERN_VALUELIST : "/sap/secmon/services/ui/m/patterns/PatternUsesValuelists.xsjs",
    EXCEPTION_SERVICE : "/sap/secmon/services/ui/m/alertexceptions/AlertException.xsodata",
    BASE_UPLOAD_URL : "/sap/secmon/services/ui/m/patterns/patternDocument.xsjs/?",
    entityName : "pattern",

    constructor : function() {
        sap.ui.core.mvc.Controller.apply(this, arguments);
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.sPatternId = null;
        this.fnPatternExecutionCallback = null;
        this.oInitialEditModelData = null;
    },

    onInit : function() {
        this.aScenariosMap = [];
        this.oAlertExceptionCreator = new sap.secmon.ui.m.commons.AlertExceptionCreator();

        // create local models
        this.getView().setModel(new sap.ui.model.json.JSONModel({ // contains configuration of current view state
            editMode : false,
            displayMode : true,
            selectedTab : "alertValidity" // default
        }), "config");
        this.getView().setModel(new sap.ui.model.resource.ResourceModel({ // i18n model
            bundleUrl : "/sap/secmon/ui/m/views/pattern/i18n/UIText.hdbtextbundle"
        }), "i18n");
        this.getView().setModel(new sap.ui.model.json.JSONModel(), "editModel"); // will store data from BackEnd in Edit mode
        this.getView().setModel(new sap.ui.model.json.JSONModel({ // will store BackEnd data for tables in IconTab
            exemptions : [],
            usedValuelists : [],
            invTemplatesCount : 0,
            attachmentsCount : 0,
            openAlertsCount : 0
        }), "uiModel");

        this.getView().setModel(new sap.ui.model.json.JSONModel(), "tagDialogModel");

        // set inputs that should be validated
        var aInputs = [ this.getView().byId("IndicatorTimeframeInput") ];
        // The input fields frequencyInput and thresholdInput are only validated, if they are visible
        if (this.getView().byId("frequencyInput").getVisible()) {
            aInputs.push(this.getView().byId("frequencyInput"));
            aInputs.push(this.getView().byId("thresholdInput"));
        }
        this.oInputValidationService = new sap.secmon.ui.commons.InputValidationService(aInputs);

        // enhance the enum model to include the threshold operators
        // this could be moved to enums service, however they are not translatable
        var oEnumModel = this.getComponent().getModel("enums");
        if (!oEnumModel.getProperty("/sap.secmon.ui.browse/Pattern")) {
            if (!oEnumModel.getProperty("/sap.secmon.ui.browse")) {
                oEnumModel.setProperty("/sap.secmon.ui.browse", {});
            }
            oEnumModel.setProperty("/sap.secmon.ui.browse/Pattern", {});
        }
        oEnumModel.setProperty("/sap.secmon.ui.browse/Pattern/ThresholdOperators", [ {
            Key : "=",
            Text : "="
        }, {
            Key : ">",
            Text : ">"
        }, {
            Key : ">=",
            Text : ">="
        }, {
            Key : "<",
            Text : "<"
        }, {
            Key : "<=",
            Text : "<="
        } ]);

        // attach listeners
        this.getRouter().getRoute("pattern").attachMatched(this.onRouteMatched, this);
        this.getComponent().getModel().attachRequestCompleted(this.onRequestCompleted, this);
        this.getComponent().getNavigationVetoCollector().register(this.onVetoCalled, this);
    },
    onExit : function() {
        if (this._oNewTagDialog) {
            this._oNewTagDialog = this.deleteDialog(this._oNewTagDialog);
        }
        if (this.tagValueHelpDialog) {
            this.tagValueHelpDialog = this.deleteDialog(this.tagValueHelpDialog);
        }
    },

    onVetoCalled : function() {
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
    },
    onRouteMatched : function(oEvent) {
        // remember selected tab, but handle it onRequestCompleted
        this.getView().getModel("config").setProperty("/selectedTab", oEvent.getParameter("arguments").tab || "alertValidity");

        this.getView().byId("Tags").getBinding("tokens").attachEventOnce("dataReceived", function(oEvent) {
            var aTokens = oEvent.getParameter("data").results;
            this._setTokens(aTokens);
        }.bind(this));
    },
    onRequestCompleted : function() {
        var oModel = this.getView().getModel();
        var oConfig = this.getView().getModel("config").getData();

        // set Tab that should be selected
        var data = oModel.getProperty("/PatternDefinitionAndAlertCountLast24h(X'" + this.sPatternId + "')");
        if (data) {
            if (data.ExecutionOutput !== "ALERT") {
                oConfig.selectedTab = "valueLists";
            }
            this.getView().byId("idIconTabBar").setSelectedKey(oConfig.selectedTab);
        }
    },

    _selectItemsInValueHelp : function(oMap, aNewList, iOffset) {
        var aItems = this.tagValueHelpDialog.getItems();
        oMap.forEach(function(oItem) {
            var iIndex = aNewList.findIndex(function(oToken) {
                return oItem.Name === oToken.Name && oItem.Namespace === oToken.Namespace;
            });
            if (iIndex > -1) {
                aItems[iIndex + iOffset].setSelected(true);
            }
        });
    },

    onCreateNewTag : function(oEvent) {
        if (!this._oNewTagDialog) {
            this._oNewTagDialog = sap.ui.xmlfragment("NewTagDialog", "sap.secmon.ui.m.views.pattern.NewTagDialog", this);
            this.getView().addDependent(this._oNewTagDialog);
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oNewTagDialog);
        }
        this.getView().getModel("tagDialogModel").setProperty("/name", oEvent.getParameter("newValue"));
        this._oNewTagDialog.open();
    },
    onNewTagDialogClose : function() {
        var oTagModel = this.getView().getModel("tagDialogModel"), sName = oTagModel.getProperty("/name"), sNamespace = oTagModel.getProperty("/namespace");

        this.createAndAddToken(sName, sNamespace);
        this.aScenariosMap.push({
            "Name" : sName,
            "Namespace" : sNamespace
        });
        this._oNewTagDialog.close();
    },
    onNewTagDialogCancel : function() {
        sap.ui.core.Fragment.byId(this.getView().getId(), "Tags").setValue("");
        this._oNewTagDialog.close();
    },

    onTagValueHelpRequest : function(oEvent) {
        if (!this.tagValueHelpDialog) {
            this.tagValueHelpDialog = sap.ui.xmlfragment("sap.secmon.ui.m.views.pattern.TagValueHelp", this);
            this.getView().addDependent(this.tagValueHelpDialog);

            this.tagValueHelpDialog.getBinding("items").attachDataReceived(function(oEvent) {
                this._selectItemsInValueHelp(this.aScenariosMap, oEvent.getParameter("data").results, oEvent.getSource().iStartIndex);
            }.bind(this));

            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.tagValueHelpDialog);
        }
        this._selectItemsInValueHelp(this.aScenariosMap, this.tagValueHelpDialog.getItems().map(function(x) {
            return x.getBindingContext().getObject();
        }), 0);
        this.tagValueHelpDialog.open();
    },

    _setTokens : function(aTokens) {
        aTokens.forEach(function(oToken) {
            var oItem = this.aScenariosMap.find(function(oItem) {
                return oItem.Name === oToken.Name && oItem.Namespace === oToken.Namespace;
            });
            if (!oItem) {
                this.aScenariosMap.push(oToken);
            }
        }.bind(this));
    },

    onTagValueHelpClose : function(oEvent) {
        if (oEvent.getId() === "cancel") {
            return;
        }

        oEvent.getParameter("selectedItems").forEach(function(oSelectedItem) {
            var obj = oSelectedItem.getBindingContext().getObject();
            var oItem = this.aScenariosMap.find(function(oItem) {
                return oItem.Name === obj.Name && oItem.Namespace === obj.Namespace;
            });
            if (!oItem) {
                this.aScenariosMap.push(obj);
            }
        }.bind(this));

        var aSelectedTokens = sap.ui.core.Fragment.byId(this.getView().getId(), "Tags") || {};
        aSelectedTokens.removeAllTokens();

        var aItems = this.tagValueHelpDialog.getItems();
        var aScenarios = this.aScenariosMap;
        aScenarios.forEach(function(oItem) {
            for (var j = 0; j < aItems.length; j++) {
                var obj = aItems[j].getBindingContext().getObject();
                if (oItem.Name === obj.Name && oItem.Namespace === obj.Namespace && !aItems[j].getSelected()) {
                    this.aScenariosMap = this.aScenariosMap.filter(function(x) {
                        return x.Name !== obj.Name || x.Namespace !== obj.Namespace;
                    }.bind(this));
                }
            }
        }.bind(this));
        this.aScenariosMap.forEach(function(oItem) {
            this.createAndAddToken(oItem.Name, oItem.Namespace);
        }.bind(this));

    },

    onTagValueHelpSearch : function(oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sValue);
        oEvent.getSource().getBinding("items").filter([ oFilter ]);
    },
    createAndAddToken : function(name, namespace) {
        var token = new sap.m.Token({
            text : sap.secmon.ui.m.views.pattern.Formatter.tagNameFormatter(name, namespace)
        });
        token.addCustomData(new sap.ui.core.CustomData({
            key : "Name",
            value : name
        }));
        token.addCustomData(new sap.ui.core.CustomData({
            key : "Namespace",
            value : namespace
        }));
        sap.ui.core.Fragment.byId(this.getView().getId(), "Tags").addToken(token);
        sap.ui.core.Fragment.byId(this.getView().getId(), "Tags").setValue("");
    },
    onTagTokenChange : function(oEvent) {
        var sType = oEvent.getParameter("type");
        var aRemovedTokens = oEvent.getParameter("removedTokens");
        if (sType === "added") {
            var token = oEvent.getParameters("token").token;

            if (token.getCustomData().length === 0) {
                oEvent.getSource().removeToken(token);
            }
        } else if (aRemovedTokens) {
            aRemovedTokens.forEach(function(oToken) {
                oToken.destroy();
            });
        } else if (sType === "removed") {

            var oToken = oEvent.getParameter("token");

            if (this.tagValueHelpDialog) {
                this.tagValueHelpDialog.getItems().forEach(function(oItem) {
                    var obj = oItem.getBindingContext().getObject();
                    var sText = sap.secmon.ui.m.views.pattern.Formatter.tagNameFormatter(obj.Name, obj.Namespace);
                    if (oToken.getText() === sText) {
                        oItem.setSelected(false);
                    }
                });
            }
            this.aScenariosMap = this.aScenariosMap.filter(function(oItem) {
                var sText = sap.secmon.ui.m.views.pattern.Formatter.tagNameFormatter(oItem.Name, oItem.Namespace);
                return oToken.getText() !== sText;
            }.bind(this));

        }
    },
    onTagSuggestionSelected : function(oEvent) {
        var oItem = oEvent.getParameter("selectedItem");
        var aCustomData = oItem.getCustomData();
        this.createAndAddToken(aCustomData[0].getValue(), aCustomData[1].getValue());
        this.aScenariosMap.push({
            "Name" : aCustomData[0].getValue(),
            "Namespace" : aCustomData[1].getValue()
        });
    },

    deleteDialog : function(dialog) {
        dialog.close();
        dialog.destroy();
        return null;
    },
    onTabSelected : function(event) {
        this.getRouter().navTo("pattern", {
            id : this.sPatternId,
            tab : event.getParameter("selectedKey")
        }, true);
    },

    /*-
     *  Binds an execution result to the view
     *  
     *  oPatternDefinitionToAlertsModel is an OData Model for 
     *  /sap/secmon/services/patterndefinitionToAlerts.xsodata
     *  
     *  The following models are expected to exist on the parent of this view:
     *
     *  'enums'      : containing the required enums. Must contain the enums of 
     *                 packages sap.secmon.services.ui.m.alerts and sap.secmon.ui.browse
     *  @param: fnPatternExecutionCallback - function that executes navigation to executionResult.
     *          fnCallback is called when the user has performed a back navigation
     */
    bindPattern : function(oPatternDefinitionToAlertsModel, sPatternId, fnCallback, fnNavBackCallback, oThisForCallback) {
        this.fnPatternExecutionCallback = fnCallback;
        this.fnNavBackCallback = fnNavBackCallback;
        this.oThisForCallback = oThisForCallback;
        this.sPatternId = sPatternId;
        this.getView().setModel(oPatternDefinitionToAlertsModel);

        // update binding context
        this.getView().bindElement("/PatternDefinitionAndAlertCountLast24h(X'" + sPatternId + "')");
        this.refreshData();
    },
    refreshData : function(bForceUpdate) {
        this.getView().getModel().refresh(bForceUpdate);

        this.getOpenAlertsCount();
        this.getUsedValueLists();
        this.getExemptions();
        this.getTotalRuntimePattern();
    },
    getTotalRuntimePattern : function() {
        var that = this;
        this.getView().getModel().read("/PatternDefinitionAndAlertCountLast24h(X'" + this.sPatternId + "')/PatternRuntime", {
            success : function(oResponse) {
                var oModel = that.getView().getModel("uiModel");
                oModel.setProperty("/totalRuntime", oResponse.TotalRuntime);
            }
        });
    },
    getOpenAlertsCount : function() {
        if (!this.sPatternId) {
            return;
        }
        var oView = this.getView();
        oView.getModel().read("/PatternDefinition(X'" + this.sPatternId + "')", {
            urlParameters : {
                "$select" : "OpenAlertCount"
            },
            success : function(oResponse) {
                oView.getModel("uiModel").setProperty("/openAlertsCount", oResponse.OpenAlertCount);
            }
        });
    },
    getUsedValueLists : function() {
        if (!this.sPatternId) {
            return;
        }
        var request = {
            Id : this.sPatternId
        };
        var sToken = this.getComponent().getCsrfToken();
        var controller = this;
        $.ajax({
            type : "GET",
            url : this.PATTERN_VALUELIST,
            contentType : "application/json; charset=UTF-8",
            data : request,
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", sToken);
            },
            success : function(data) {

            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.m.MessageBox.alert(XMLHttpRequest.responseText, {
                    title : controller.getView().getModel("i18nCommon").getProperty("Error_TIT")
                });
            },
            complete : function(data) {
                var model = controller.getView().getModel("uiModel");

                model.setProperty("/usedValuelists", data.responseJSON);
            }
        });
    },
    getExemptions : function() {
        if (!this.sPatternId) {
            return;
        }
        var that = this;
        var oExemptionModel = new sap.ui.model.odata.ODataModel(this.EXCEPTION_SERVICE);
        oExemptionModel.read("AlertException/?$filter=Id eq '" + this.sPatternId + "'", {
            success : function(oResponse) {
                var model = that.getView().getModel("uiModel");
                model.setProperty("/exemptions", oResponse.results);

            }
        });
    },
    onTemplatesUpdateFinished : function(oEvent) {
        this.getView().getModel("uiModel").setProperty("/invTemplatesCount", oEvent.getParameter("total"));
    },
    onAttachmentsUpdateFinished : function(oEvent) {
        this.getView().getModel("uiModel").setProperty("/attachmentsCount", oEvent.getParameter("total"));
    },

    openAlertsForCurrentPattern : function(oEvent, sFilter) {
        if (this.isEditMode()) {
            sap.m.MessageBox.alert(this.getText("WarnOnLeaveEdit"), {
                title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
            });
            return;
        }
        var sPatternId = oEvent.getSource().getBindingContext().getProperty("Id");
        var sHexId = this.oCommons.base64ToHex(sPatternId);

        sap.secmon.ui.m.commons.NavigationService.navigateToAlertsOfPattern(sHexId, sFilter);
    },

    onNavBack : function() {
        var that = this;
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            if (that.fnNavBackCallback) {
                that.fnNavBackCallback.call(that.oThisForCallback);
            }
            window.history.go(-1);
        });
    },

    getText : function(sKey) {
        return this.getView().getModel("i18n").getProperty(sKey);
    },

    onOpenPattern : function(oEvent) {
        var bindingContext = oEvent.getSource().getBindingContext();
        var patternType = bindingContext.getProperty("PatternType");
        var sQueryDefinitionIdBase64 = bindingContext.getProperty("QueryDefinitionId");
        if (!sQueryDefinitionIdBase64) {
            return;
        }
        var sQueryDefinitionId = this.oCommons.base64ToHex(sQueryDefinitionIdBase64);
        if (patternType === 'FLAB') {
            sap.secmon.ui.m.commons.NavigationService.openBrowseUI(sQueryDefinitionId);
        } else {
            sap.secmon.ui.m.commons.NavigationService.openAnomalyPattern(sQueryDefinitionId);
        }

    },

    /**
     * Eventhandler:Executes pattern and navigates to Execution Results
     */
    onExecutePattern : function(oEvent) {
        var sPatternId = this.sPatternId;
        if (!sPatternId) {
            return;
        }
        var patternExecutionInfo = {
            patternId : sPatternId,
        };
        var sToken = this.getComponent().getCsrfToken();
        var oController = this;
        this.getView().setBusy(true);
        $.ajax({
            type : "POST",
            url : this.PATTERN_EXECUTOR_URL,
            data : JSON.stringify(patternExecutionInfo),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", sToken);
            },
            success : function(data) {
                var sId = data.result;
                oController.fnPatternExecutionCallback(sId);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                alert(oController.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown));
            },
            complete : function() {
                oController.getView().setBusy(false);
            }
        });
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    isEditMode : function() {
        return this.getView().getModel("config").getProperty("/editMode");
    },

    onEdit : function() {
        this.setEditMode(true);
    },

    onSave : function() {
        if (!this.oInputValidationService.checkControls()) {
            return;
        }
        this.updatePattern();
        this.setEditMode(false);
    },
    getTags : function() {
        var tagAssignments = this.getView().byId("Tags");

        var tokens = tagAssignments.getTokens();

        return tokens.map(function(token) {
            var customData = token.getCustomData();
            if (customData.length > 0) {
                return {
                    Name : customData[0].getValue(),
                    Namespace : customData[1].getValue()
                };
            }
        });
    },
    updatePattern : function() {
        var idBase64 = this.getView().getBindingContext().getProperty("QueryDefinitionId");
        var oData = this.getView().getModel("editModel").getData();
        var oPattern = {
            QueryDefinitionId : this.oCommons.base64ToHex(idBase64),
            Status : oData.Status,
            Frequency : oData.Frequency,
            Severity : oData.Severity,
            ThresholdOperator : oData.ThresholdOperator,
            Threshold : oData.Threshold,
            TestMode : oData.TestMode ? "TRUE" : "FALSE",
            IndicatorTimeframe : (oData.IndicatorTimeframe * (60 * 60 * 1000)),
            Tags : this.getTags()
        };
        this.sendRequestAndUpdateModel("POST", this.PATTERN_MODIFICATION_SERVICE_URL, oPattern);
    },

    sendRequestAndUpdateModel : function(requestType, url, objectToSendAsJSON) {
        var csrfToken = this.getComponent().getCsrfToken();
        var controller = this;
        $.ajax({
            type : requestType,
            url : url,
            data : JSON.stringify(objectToSendAsJSON),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            },
            success : function(data) {
                controller.refreshData(false);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown));
            }
        });
    },

    onCancel : function() {
        this.handleCancel();
    },

    handleCancel : function(fnActionAfterCancel, fnActionOnNoCancellation) {
        if (this.oCommons.deepEqual(this.getView().getModel("editModel").getData(), this.oInitialEditModelData)) {
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
                    } else {
                        if (fnActionOnNoCancellation) {
                            fnActionOnNoCancellation();
                        }
                    }
                }
            }
        });
    },

    setEditMode : function(bEditMode) {
        var oConfigModel = this.getView().getModel("config");
        oConfigModel.setProperty("/editMode", bEditMode);
        oConfigModel.setProperty("/displayMode", !bEditMode);
        // prepare data for edit mode
        if (bEditMode) {
            var oContext = this.getView().getBindingContext();
            var oEditData = {
                Status : oContext.getProperty("Status"),
                Frequency : oContext.getProperty("Frequency"),
                Severity : oContext.getProperty("Severity"),
                Threshold : oContext.getProperty("Threshold"),
                ThresholdOperator : oContext.getProperty("ThresholdOperator") || ">=",
                TestMode : oContext.getProperty("TestMode") === "TRUE",
                IndicatorTimeframe : oContext.getProperty("IndicatorTimeframe") / (60 * 60 * 1000)
            };
            this.getView().getModel("editModel").setData(oEditData);
            this.oInitialEditModelData = this.oCommons.cloneObject(oEditData);
            this.oInputValidationService.resetValueStateOfControls();
        }
        // trigger update data, in onRequestFinished will handle it
        this.refreshData();
    },

    onValuelistPress : function(oEvent) {
        var id = oEvent.getSource().getBindingContext("uiModel").getProperty("Id");
        sap.secmon.ui.m.commons.NavigationService.openValuelist.call(this, id, true);
    },

    onExemptionPress : function(oEvent) {
        var id = oEvent.getSource().getBindingContext("uiModel").getProperty("ExceptionId");
        sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
            target : {
                semanticObject : "Exemptions",
                action : "show"
            },
            params : {
                Id : id
            }
        });
    },

    onUploadChange : function(oEvent) {
        var fileUploader = oEvent.getSource();
        var oHeaderParameter = new sap.ui.unified.FileUploaderParameter();
        var xsrfToken = this.getComponent().getCsrfToken();
        var sUrl = this.BASE_UPLOAD_URL + "pattern_id=" + this.sPatternId + "&file_name=" + oEvent.getParameter("newValue");
        fileUploader.setUploadUrl(sUrl);
        oHeaderParameter.setName("x-csrf-token");

        oHeaderParameter.setValue(xsrfToken);
        fileUploader.removeAllHeaderParameters();
        fileUploader.addHeaderParameter(oHeaderParameter);
    },
    onFileNameLengthExceed : function(oEvent) {
        sap.m.MessageBox.alert(this.getText("FilenameTooLarge"), {
            title : this.getView().getModel("i18nCommon").getProperty("Error_TIT")
        });
    },
    onFileTypeMissmatch : function(oEvent) {
        sap.m.MessageBox.alert(this.getText("FileTypeMismatch"), {
            title : this.getView().getModel("i18nCommon").getProperty("Error_TIT")
        });

    },    

    onDeletePressed : function(oEvent) {
        var table = this.getView().byId("fileTable");
        var selectedItem;
        var controller = this;
        var sToken = this.getComponent().getCsrfToken();
        var confirmationText = this.getView().getModel("i18n").getProperty("VL_Entry_Delete_Selected");
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
            var data = selectedItem.getBindingContext().getObject();
            $.ajax({
                type : "DELETE",
                url : this.BASE_UPLOAD_URL + "patternId=" + data.PatternId + "&filename=" + data.ContentName + "&filetype=" + data.ContentType,
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", sToken);
                },
                success : function(data) {
                    sap.m.MessageToast.show(controller.getView().getModel("i18n").getProperty("FileDeleted"));
                },
                error : function(XMLHttpRequest, textStatus, errorThrown) {
                    sap.m.MessageBox.alert(XMLHttpRequest.responseText, {
                        title : controller.getView().getModel("i18nCommon").getProperty("Error_TIT")
                    });
                },
                complete : function(data) {
                    controller.refreshData();
                }
            });

        }
    },
    onUploadComplete : function(oEvent) {
        var status = oEvent.getParameter("status");
        var i18n = this.getView().getModel("i18n");
        if (status === 200) {

            sap.m.MessageToast.show(i18n.getProperty("FileUploaded"));
        } else {
            var message = oEvent.getParameter("responseRaw");
            sap.m.MessageBox.alert(message);
        }
        this.refreshData();
    },
    handleCreateException : function() {
        var that = this;
        this.oAlertExceptionCreator.showAlertExceptionCreationDialog(this.sPatternId, null, this.getView(), function() {
            that.getExemptions();
        });
    },

    onPressHelp : function() {
        window.open("/sap/secmon/help/7b4c2d0caf09418385d54c02d8182da7.html");
    },

    onTemplatePress : function(oEvent) {
        var context = oEvent.getSource().getBindingContext();
        var id = context.getProperty("Id");
        sap.secmon.ui.m.commons.NavigationService.openInvestigationTemplate(id);
    },

    onAddTemplatePressed : function(oEvent) {
        var context = oEvent.getSource().getBindingContext();
        var patternId = context.getProperty("Id");
        sap.secmon.ui.m.commons.NavigationService.createInvestigationTemplate(patternId);
    }

});
