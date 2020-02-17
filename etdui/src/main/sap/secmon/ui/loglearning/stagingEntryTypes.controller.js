$.sap.require("sap.ui.commons.MessageBox");
$.sap.require("sap.secmon.ui.commons.AjaxUtil");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.loglearning.Constants");
jQuery.sap.require("sap.secmon.ui.loglearning.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.ui.controller("sap.secmon.ui.loglearning.stagingEntryTypes", {

    Constants : sap.secmon.ui.loglearning.Constants,
    oPendingChanges : undefined,

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.loglearning.stagingEntryTypes
     */
    onInit : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();

        // Initialize the object which holds the pending changes
        // until user presses save
        this.oPendingChanges = {
            entryTypes : [],
            annotations : []
        };

        // set model for annotations table
        sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel({
            root : undefined
        }), "logAnnotationsTable");

        // Initialize KBRole model
        var oModelKBRoles = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oModelKBRoles, "KBRoleModel");

        // Attach event handler for asynchronous loading of KBRoleModel
        oModelKBRoles.attachRequestCompleted(function() {
            var oData = sap.ui.getCore().getModel("KBRoleModel").getData();

            // If no result is returned (when event is not existing)
            // create initial data container
            if (!oData.d) {
                oData = {
                    d : {
                        Attributes : {
                            results : []
                        }
                    }
                };
            }

            oData.d.Attributes.results.splice(0, 0, {
                "attrHash" : "MA==",
                "attrName.name" : "",
                "attrNameSpace.nameSpace" : "",
                "attrDisplayName" : ""
            });
            sap.ui.getCore().getModel("KBRoleModel").setData(oData);
        });
        oModelKBRoles.attachRequestFailed(function(oError) {
            console.error("Load knowledgebase roles & attributes failed");
            console.error(oError);
        });

        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.onRouteMatched, this);

        var oStagingEntryTypes = new sap.ui.model.json.JSONModel({
            selectedLogType : null
        });
        this.getView().setModel(oStagingEntryTypes, "stagingEntryTypes");
    },

    onRouteMatched : function(oEvent) {
        var oTable = this.getView().byId("tableStagingEntryTypes");

        oTable.removeSelections(true);
        sap.ui.getCore().getModel("RunModel").setProperty("/oneEntrySelected", false);
        sap.ui.getCore().getModel("RunModel").setProperty("/entriesSelected", false);

    },

    /**
     * Handles the selection change of the EntryType Table
     * 
     * @param oEvent
     */
    _changeRowSelection : function(oContext, oTable) {

    },

    /**
     * Handles row selection change event of entry type table
     * 
     * @memberOf sap.secmon.ui.loglearning.stagingEntryTypes
     */
    onRowSelectionChange : function(oEvent) {
        var oSelectedRowContext = null, eventHashOfSelectedMarkup = null;
        var selectionCount = 0;
        var aSelContexts = this.getView().byId("tableStagingEntryTypes").getSelectedContexts(false);
        if (aSelContexts.length && aSelContexts.length > 0) {
            selectionCount = aSelContexts.length;
            oSelectedRowContext = aSelContexts[0];
            eventHashOfSelectedMarkup = oSelectedRowContext.getProperty("EventHash");
        }

        if (this.getView().getModel()) {
            this.getView().getModel().setProperty("/eventHashOfSelectedMarkup", eventHashOfSelectedMarkup);
        }
        var oEntryTypesTable = oEvent.getSource();
        this._changeRowSelection(oSelectedRowContext, oEntryTypesTable);

        sap.ui.getCore().getModel("RunModel").setProperty("/oneEntrySelected", selectionCount === 1);
        sap.ui.getCore().getModel("RunModel").setProperty("/entriesSelected", selectionCount > 0);
    },

    /**
     * Handles the select log type event
     * 
     * @param oEvent
     * @param oController
     */
    onSelectLogType : function(oEvent) {
        this._setSaveNeeded(true);
    },

    onSubmitLogTypeDialog : function(oEvent) {

        var sKey = this.getView().getModel("stagingEntryTypes").getProperty("/selectedLogType");
        var sLogTypeHash = this.oCommons.base64ToHex(sKey);
        var oTable = this.getView().byId("tableStagingEntryTypes");
        var aSelected = oTable.getSelectedContexts(true);

        aSelected.forEach(function(oBindingContext) {
            oBindingContext.getModel().setProperty("LogTypeHash", sLogTypeHash, oBindingContext);
        });

        this._setSaveNeeded(true);
        this.onCloseLogTypeDialog();
    },

    onCloseLogTypeDialog : function() {
        this._logTypeDialog.close();
        this._logTypeDialog.destroy();
    },

    onChangeComboBox : function(oEvent) {
        var sKey = oEvent.getSource().getSelectedKey();
        this.getView().getModel("stagingEntryTypes").setProperty("/selectedLogType", sKey);
    },

    onEventSelected : function(oEvent) {
        this._setSaveNeeded(true);
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

    onChangeCustomIdentifier : function(oEvent) {
        this._setSaveNeeded(true);
    },

    onPressOpenEntryType : function(oEvent) {
        var oBindingContext = oEvent.getParameter("listItem").getBindingContext();
        var runName = oBindingContext.getProperty("RunName");
        var entryType = oBindingContext.getProperty("Id");

        // The router has a "feature" not to dispatch to event handlers if
        // neither route nor query parameters have changed.
        // In order to force navigation, we add a parameter with new value each
        // time.
        var router = sap.ui.core.UIComponent.getRouterFor(this);
        router.navTo("entryTypeDetails", {
            entryType : entryType,
            run : runName,
            query : {
                lastNav : this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date())
            }
        }, false);
    },

    handleCloneEntryType : function(oEvent) {

        var dialog = this._cloneDialog;
        var oCloneModel = dialog.getModel("cloneModel");
        var cloneData = oCloneModel.getData();
        delete cloneData.AvailableAnnotationTypes;
        var aNewAnnotations = cloneData.Annotations;
        var selectedEntryTypeId = this._cloneDialog.getBindingContext().getProperty("Id");

        var that = this;
        var requestUrl = "/sap/secmon/loginterpretation/runService.xsjs?command=cloneEntryType&entryTypeId=" + selectedEntryTypeId;
        new sap.secmon.ui.commons.AjaxUtil().postJson(requestUrl, JSON.stringify(aNewAnnotations)).done(function(responseBody, status) {
            console.log("done");
            dialog.close();

            var oRunJsonModel = sap.ui.getCore().getModel("RunJSONModel");
            var oRun = oRunJsonModel.getData().run;
            var sRunName = oRun.RunName;
            // refresh the UI

            that.oRouter.navTo("entryTypes", {
                run : sRunName,
                query : {
                    lastNav : that.oCommons.formatDateToYyyymmddhhmmssUTC(new Date())
                }
            }, false);
        }).fail(function(request, status) {
            var errorMsg = decodeURIComponent(request.responseText);
            that._getShellController().reportErrorMessage(errorMsg);
        });
    },

    _getShellController : function() {
        var shell = this.getView();
        while (shell.getParent) {
            if (shell.getController && shell.getController().reportErrorMessage) {
                return shell.getController();
            }
            shell = shell.getParent();
        }
        return null;
    },

    /**
     * Open documentation
     * 
     * @param oEvent
     */
    onPressCloneEntryType : function(oEvent) {
        var oButton = oEvent.getSource();

        var oCloneData = this._getCloneData();
        // singleton
        if (!this._cloneDialog) {
            this._cloneDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.loglearning.dialog.CloneEntryTypeDialog", this);
            this.getView().addDependent(this._cloneDialog);

            // create a model with default annotations
            var oCloneModel = new sap.ui.model.json.JSONModel();
            this._cloneDialog.setModel(oCloneModel, "cloneModel");

            // toggle compact style
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._cloneDialog);
        }
        this._cloneDialog.getModel("cloneModel").setData(oCloneData);
        // binding to selected entry type
        var entryTypesTable = this.getView().byId("tableStagingEntryTypes");
        var ctx = entryTypesTable.getSelectedContexts(false)[0];
        this._cloneDialog.bindElement(ctx.getPath());

        var eDock = sap.ui.core.Popup.Dock;
        this._cloneDialog.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);
    },

    closeCloneEntryTypeDialog : function(oEvent) {
        this._cloneDialog.close();
    },

    onOpenEditAnnotationMenu : function(oEvent) {

        var oToken = oEvent.getSource();
        var annotationType = oToken.getKey();
        if (annotationType === "StructuredList" || annotationType === 'JSON' || annotationType === 'KeyValue.List') {
            return;
        }

        // create menu only once
        if (!this._editAMenu) {
            this._editAMenu = sap.ui.xmlfragment("sap.secmon.ui.loglearning.dialog.EditAnnotationMenu", this);
            this.getView().addDependent(this._editAMenu);
        }

        var oMultiInput = oToken.getParent();
        var tokenIndex = oMultiInput.indexOfToken(oToken);

        // bind context
        var oCloneModel = this._cloneDialog.getModel("cloneModel");
        this._editAMenu.setModel(oCloneModel);
        var oContext = oToken.getBindingContext("cloneModel");
        oContext.getModel().getData().tokenIndex = tokenIndex;
        this._editAMenu.bindElement(oContext.getPath());
        var eDock = sap.ui.core.Popup.Dock;
        this._editAMenu.open(false, oToken, eDock.BeginTop, eDock.BeginBottom, oToken);

    },

    onOpenNewAnnotationMenu : function(oEvent) {
        var oButton = oEvent.getSource();

        // create menu only once
        if (!this._newAMenu) {
            this._newAMenu = sap.ui.xmlfragment("sap.secmon.ui.loglearning.dialog.NewAnnotationMenu", this);
            this.getView().addDependent(this._newAMenu);
        }
        // the add button is at the right, add menu to the left
        var eDock = sap.ui.core.Popup.Dock;
        this._newAMenu.open(false, oButton, eDock.EndTop, eDock.EndBottom, oButton);
    },

    /**
     * insert before or after selected token
     * 
     * @param oEvent
     */
    onHandleAddAnnotation : function(oEvent) {

        var oMenuItem = oEvent.getParameter("item");
        var sInsertPosition = oMenuItem.data("position");

        var sAnnotationType = oMenuItem.data("type");

        // insert new annotation
        var oCloneModel = this._cloneDialog.getModel("cloneModel");
        var oCloneData = oCloneModel.getData();
        var iIndex = oCloneData.tokenIndex;
        if (sInsertPosition === 'AFTER') {
            iIndex++;
        }
        oCloneData.Annotations.splice(iIndex, 0, {
            Type : sAnnotationType,
            FixedValue : "",
            Pattern : ""
        });
        oCloneData.AnnotationCount = oCloneData.Annotations.length;
        oCloneModel.setData(oCloneData);
    },

    /**
     * insert before or after selected token: handle menu item click which have an input field (Timestamp or Value)
     * 
     * @param oEvent
     */
    onHandleAddAnnotationWithInput : function(oEvent) {
        var sTimestampType = this.Constants.ANNOTATION_TYPES.TIMESTAMP, sWordType = this.Constants.ANNOTATION_TYPES.WORD;

        var oMenuItem = oEvent.getParameter("item");
        var sInsertPosition = oMenuItem.data("position");

        var sAnnotationType = oMenuItem.data("type");
        var sInputValue = oMenuItem.getValue();
        if (sAnnotationType === sWordType || sAnnotationType === sTimestampType) {
            // filter blanks
            sInputValue = sInputValue.replace(/[\s]/g, '');
        }
        if (sInputValue.length === 0) {
            return;
        }

        // insert new annotation
        var oCloneModel = this._cloneDialog.getModel("cloneModel");
        var oCloneData = oCloneModel.getData();
        var iIndex = oCloneData.tokenIndex;
        if (sInsertPosition === 'AFTER') {
            iIndex++;
        }

        oCloneData.Annotations.splice(iIndex, 0, {
            Type : sAnnotationType,
            FixedValue : sAnnotationType === sWordType ? sInputValue : "",
            Pattern : sAnnotationType === sTimestampType ? sInputValue : ""
        });
        oCloneData.AnnotationCount = oCloneData.Annotations.length;
        oCloneModel.setData(oCloneData);
    },

    /**
     * add new token to the end
     * 
     * @param oEvent
     */
    onHandleAppendAnnotation : function(oEvent) {

        var oMenuItem = oEvent.getParameter("item");
        var annotationType = oMenuItem.data("type");

        // insert new annotation
        var oCloneModel = this._cloneDialog.getModel("cloneModel");
        var oCloneData = oCloneModel.getData();
        oCloneData.Annotations.push({
            Type : annotationType,
            FixedValue : "",
            Pattern : ""
        });
        oCloneData.AnnotationCount = oCloneData.Annotations.length;
        oCloneModel.setData(oCloneData);
    },

    /**
     * add new token to end: handle menu item click which have an input field (Timestamp or Value)
     * 
     * @param oEvent
     */
    onHandleAppendAnnotationWithInput : function(oEvent) {
        var sTimestampType = this.Constants.ANNOTATION_TYPES.TIMESTAMP, sWordType = this.Constants.ANNOTATION_TYPES.WORD;

        var oMenuItem = oEvent.getParameter("item");
        var sAnnotationType = oMenuItem.data("type");
        var sInputValue = oMenuItem.getValue();
        if (sAnnotationType === sWordType || sAnnotationType === sTimestampType) {
            // filter blanks
            sInputValue = sInputValue.replace(/[\s]/g, '');
        }
        if (sInputValue.length === 0) {
            return;
        }

        // insert new annotation
        var oCloneModel = this._cloneDialog.getModel("cloneModel");
        var oCloneData = oCloneModel.getData();

        oCloneData.Annotations.push({
            Type : sAnnotationType,
            FixedValue : sAnnotationType === sWordType ? sInputValue : "",
            Pattern : sAnnotationType === sTimestampType ? sInputValue : ""
        });
        oCloneData.AnnotationCount = oCloneData.Annotations.length;
        oCloneModel.setData(oCloneData);
    },

    onHandleEditAnnotationWithInput : function(oEvent) {
        var sTimestampType = this.Constants.ANNOTATION_TYPES.TIMESTAMP, sWordType = this.Constants.ANNOTATION_TYPES.WORD;

        var oMenuItem = oEvent.getParameter("item");
        var annotationType = oMenuItem.data("type");
        var inputValue = oMenuItem.getValue();
        if (annotationType === sWordType || annotationType === sTimestampType) {
            // filter blanks
            inputValue = inputValue.replace(/[\s]/g, '');
        }
        if (inputValue.length === 0) {
            return;
        }
        var oContext = oMenuItem.getBindingContext();
        var oModel = oContext.getModel();
        oModel.setProperty("Type", annotationType, oContext);
        oModel.setProperty("FixedValue", annotationType === sWordType ? inputValue : "", oContext);
        oModel.setProperty("Pattern", annotationType === sTimestampType ? inputValue : "", oContext);
    },

    onHandleEditAnnotation : function(oEvent) {
        var oMenuItem = oEvent.getParameter("item");
        var annotationType = oMenuItem.getText();
        var oContext = oMenuItem.getBindingContext();
        var oModel = oContext.getModel();
        oModel.setProperty("Type", annotationType, oContext);
    },

    onTokenDelete : function(oEvent) {

        var oToken = oEvent.getParameter("token");
        var oMultiInput = oToken.getParent();
        var oCtx = oToken.getBindingContext("cloneModel");
        var oModel = oCtx.getModel();
        var oData = oModel.getData();
        var iIndex = oMultiInput.indexOfToken(oToken);

        jQuery.sap.delayedCall(0, this, function() {
            oData.Annotations.splice(iIndex, 1);
            oData.AnnotationCount = oData.Annotations.length;
            oModel.setData(oData);
        });
    },

    onMultiInputLiveChange : function(oEvent) {
        // the user should not enter text inside the MultiInput. She should use the dropdown instead.
        var multiInput = oEvent.getSource();
        multiInput.setValue("");
    },

    _getCloneData : function() {
        var sWordType = this.Constants.ANNOTATION_TYPES.WORD;

        return {
            AvailableAnnotationTypes : sap.secmon.ui.loglearning.Constants.AVAILABLE_ANNOTATIONS,
            AnnotationCount : 3,
            Annotations : [ {
                Type : sWordType,
                FixedValue : "&lt;",
                Pattern : ""
            }, {
                Type : "Integer",
                FixedValue : "",
                Pattern : ""
            }, {
                Type : sWordType,
                FixedValue : "&gt;",
                Pattern : ""
            } ]
        };
    }
});