jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.m.MessageToast");
jQuery.sap.require("sap.ui.core.IconPool");
jQuery.sap.require("sap.secmon.ui.m.valuelist.util.ODataErrorHandler");
jQuery.sap.require("sap.ui.core.util.Export");
jQuery.sap.require("sap.ui.core.util.ExportTypeCSV");
jQuery.sap.require("sap.secmon.ui.m.valuelist.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.valuelist.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.commons.Privileges");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.valuelist.view.Detail", {

    NAMESPACES_SOURCE_URL : "/sap/secmon/services/NameSpacesOriginalInSystem.xsodata",
    UPLOAD_VALUES_SERVICE : "/sap/secmon/services/ui/m/valuelist/valuelist.xsjs/uploadValues",
    EXPORT_SERVICE : "/sap/secmon/services/replication/export.xsjs",
    USING_OBJECTS_SERVICE : "/sap/secmon/services/ui/m/valuelist/WhereUsedListValuelist.xsjs",
    entityName : "ValuelistDetail",
    csrfToken : "",
    VALUES_XSJS_SERVICE : "/sap/secmon/services/ui/m/valuelist/valuelist.xsjs",
    INACTIVE_VALUES_XSJS_SERVICE : "/sap/secmon/services/ui/m/valuelist/inactiveValuelist.xsjs",
    XSJS_USED_IN_EVAL : "/sap/secmon/services/ui/m/valuelist/ValuelistInEvaluation.xsjs",
    XSJS_RESET_EVAL : "/sap/secmon/services/ui/m/anomaly/EvaluationDataReset.xsjs",
    DEFAULT_PAGING_SIZE : 100,
    resetAllowed : null,
    whereUsedListLoaded : false,

    /**
     * @memberOf sap.secmon.ui.m.valuelist.view.Master
     */
    constructor : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        sap.ui.core.mvc.Controller.apply(this, arguments);
        this.ajaxUtil = new sap.secmon.ui.commons.AjaxUtil();
    },

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     */
    onInit : function() {

        // routing
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);
        this.csrfToken = this.oCommons.getXCSRFToken();

        // used for delta-handling when a value description is changed
        this.changedValues = {};

        var uiModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(uiModel, "uiModel");
        uiModel.setData({
            usingObjects : []
        });

        this.valueCountModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.valueCountModel, "valueCount");
        this.valueCountModel.setData({
            Number : 0,
            InactiveValueNumber : 0,
            selectedValuesNumber : 0,
            selectedInactiveValuesNumber : 0
        });

        // in case of navigation away from this component a warning popup should be shown
        var editModel = this.getComponent().getModel("editModel");
        this.getComponent().getNavigationVetoCollector().register(function() {
            if (editModel.oData.displayMode) {
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

        var fnNavigation = function() {
            // no need to add URL params for sorting
        };
        sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "values", sap.secmon.ui.m.commons.ServiceConstants.VALUELIST_ENTRIES_SERVICE, fnNavigation);
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    /**
     * Called, whenever a new valuelist should be displayed.
     */
    handleRouteMatched : function(oEvent) {
        // read name of route
        var routeName = oEvent.getParameter("name");
        // There are 2 semantic objects "Valuelist" and "ValuelistDetails"
        // which call the same view.
        // - Valuelist: master-detail layout
        // - ValuelistDetail: only detail in single page

        // ignore the route "createValuelist", it does not have parameters
        if ("createValuelist" === routeName || "main" === routeName) {
            return;
        }

        var valuelistId, valuelistPath;
        var oArguments = oEvent.getParameter("arguments");
        var oQueryParameters = oArguments["?query"] || {};
        var entityName = oArguments[this.entityName];
        valuelistPath = "/" + entityName;
        valuelistId = entityName.slice(entityName.indexOf("(X'") + 3, entityName.indexOf("')"));

        // read arguments, set id of selected valuelist, set defaults for tab and mode, and store in URL
        if (this.valuelistId !== valuelistId || !this.selectedTabKey || this.selectedTabKey !== oQueryParameters.tab || !this.mode || this.mode !== oQueryParameters.mode) {
            this.mode = oQueryParameters.mode;
            if (!this.mode) {
                this.mode = "display";
            }
            if (this.valuelistId !== valuelistId) {
                this.whereUsedListLoaded = false;
            }

            this.valuelistId = valuelistId;
            this.selectedTabKey = oQueryParameters.tab;
            if (!this.selectedTabKey) {
                this.selectedTabKey = "values";
            }

            var oQuery = {
                mode : this.mode,
                tab : this.selectedTabKey
            };

            var oRouteParams = {
                query : oQuery
            };
            oRouteParams[this.entityName] = oArguments[this.entityName];
            // store changed parameters in URL
            this.navigationParameters = {
                routeName : routeName,
                routeParams : oRouteParams
            };
            this.getRouter().navTo(this.navigationParameters.routeName, this.navigationParameters.routeParams, true);
            return;

        }

        // route to fullscreen layout
        if ("Detail" === routeName) {
            this.adaptBackButtonToFullscreenMode();
        }

        if (this.valuelistId) {
            // bind view to selected valuelist
            var oView = this.getView();
            oView.bindElement(valuelistPath);
            var elementBinding = oView.getElementBinding();
            if (elementBinding.isInitial() === true) {
                var prop = oView.getModel().getProperty(valuelistPath + "/UpdateMode");
                var editModel = this.getComponent().getModel("editModel");
                editModel.setProperty("/UpdateMode", prop);
            }
        }

        if (this.whereUsedListLoaded === false) {
            this.getUsingObjects();
        }

        // set display mode initially
        if (this.mode === "edit") {
            this.onEdit();
        } else {
            this.setDisplayMode();
        }

        this.setSelectedDefaultTab();

        // reset to null, because otherwise the decision of another valuelist is
        // used
        this.resetAllowed = null;
    },

    setSelectedDefaultTab : function() {
        var oIconTabBar = this.getView().byId("idIconTabBar");
        oIconTabBar.setSelectedKey(this.selectedTabKey);
    },

    adaptBackButtonToFullscreenMode : function() {
        // full screen mode: back button is always shown and back performs a
        // browser back
        var oPage = this.getView().byId("valuelistDetailsContainer");
        oPage.setShowNavButton(true);
    },

    /**
     * Eventhandler: Confirmation MessageBox will be show. Deletes currently selected valuelist.
     */
    onDeleteValuelist : function() {
        var that = this;
        var bindingContext = that.getView().getBindingContext();
        var valueListObject;
        if (bindingContext) {
            valueListObject = bindingContext.getObject();
        }
        var confirmationText = sap.secmon.ui.commons.Formatter.i18nText(this.getText("VL_Config_Delete_vl"), valueListObject.ListName);
        sap.m.MessageBox.confirm(confirmationText, {
            // styleClass : "sapUiSizeCompact",
            title : this.getCommonText("Delete_TIT"),
            icon : sap.m.MessageBox.Icon.WARNING,
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.DELETE) {
                    delete that.valuelistId;
                    that.deleteValuelist(valueListObject);
                }
            }
        });

    },

    /**
     * Eventhandler: sets edit - mode for header data.oDataModel for valuelist will be replaced by json model.
     */
    onEdit : function() {
        this.setEditMode();
        this.exchangeModelForValuelistHeader("edit");
        // reset the changed values, these are used to detect description changes
        this.changedValues = {};
    },

    /**
     * Eventhandler: Saves new or edited valuelist header, and values which are in local namespace.
     */
    onSave : function() {
        var editModel = this.getComponent().getModel("editModel");
        if (editModel.oData.editMode === true) {
            var namespace = this.getView().getBindingContext().getProperty("NameSpace");
            var bIsSystemNamespace = sap.secmon.ui.m.valuelist.util.Formatter.isSystemNamespaceFormatter.call(this.getView(), namespace);
            this.updateValues(bIsSystemNamespace === true);
            this.setDisplayMode();
        }
    },

    onExportPressed : function(oEvent) {
        var selectedValuelist = this.getView().getBindingContext().getObject();
        var that = this;
        if (selectedValuelist) {
            this.ajaxUtil.postJson(this.EXPORT_SERVICE, JSON.stringify({
                Id : this.valuelistId,
                ObjectType : "ValueList",
                ObjectName : selectedValuelist.ListName,
                ObjectNamespace : selectedValuelist.NameSpace,
            }), {
                success : function() {
                    sap.m.MessageToast.show(that.getText("VL_ExportSuccess"));
                },
                fail : function() {
                    sap.m.MessageBox.alert(that.getText("VL_ExportFail"), {
                        icon : sap.m.MessageBox.Icon.ERROR,
                        title : that.getText("VL_ExportError")
                    });
                }
            });
        }
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    /**
     * Eventhandler: Opens pop up for changing header data.
     */
    onSaveAs : function() {
        var controller = this;
        // Namespace Check
        if (!controller.getComponent().checkNamespacesExist()) {
            return;
        }

        // get HeaderId of current selected Valuelist
        var selectedValuelist = this.getView().getBindingContext().getObject();
        // call dialog
        if (!this.oSaveAsController) {
            this.oSaveAsController = sap.ui.controller("sap.secmon.ui.m.valuelist.view.SaveAsDialog");
        }
        this.oSaveAsController.openDialog(selectedValuelist.Id, controller.getView(), function(id) {
            var oComponent = sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(controller.getView()));
            var valuelistModel = oComponent.getModel();
            valuelistModel.refresh();
            controller.valuelistId = id;

            controller.navigationParameters.routeParams.query.valuelist = controller.valuelistId;
            controller.navigationParameters.routeParams.query.mode = "display";
            controller.getRouter().navTo(controller.navigationParameters.routeName, controller.navigationParameters.routeParams, true);

            sap.m.MessageToast.show(controller.getText("VL_Create_Success"));
            controller.setDisplayMode();

        });

    },

    /**
     * Eventhandler: deletes selected value.
     */
    onDeleteValue : function(oEvent) {
        var controller = this;
        var selectedObject = oEvent.getSource().getBindingContext().getObject();
        var bindingContext = controller.getView().getBindingContext();
        var value = "";
        if (bindingContext) {
            value = selectedObject.ValueVarChar;
        }
        var confirmationText = sap.secmon.ui.commons.Formatter.i18nText(this.getText("VL_Conf_Delete_Value"), value);

        sap.m.MessageBox.confirm(confirmationText, {
            // styleClass : "sapUiSizeCompact",
            title : this.getCommonText("Delete_TIT"),
            icon : sap.m.MessageBox.Icon.WARNING,
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.DELETE) {

                    var valueId = controller.oCommons.base64ToHex(selectedObject.Id);
                    var valuePath = "/Values(X'" + valueId + "')";

                    var valuelistModel = controller.getComponentModel(controller);
                    valuelistModel.remove(valuePath, null, function() {
                        var text = controller.getText("VL_Value_Del_Success");
                        text = sap.secmon.ui.commons.Formatter.i18nText(text, value);
                        sap.m.MessageToast.show(text);
                        valuelistModel.refresh();
                    }, function(e) {
                        var oI18nModel = controller.getView().getModel("i18n");
                        sap.secmon.ui.m.valuelist.util.ODataErrorHandler.showAlert(e.response, oI18nModel);
                    });
                }
            }
        });

    },

    /**
     * Eventhandler: Open Pop up for filling list-of-values from Events
     */
    onFillFromEvents : function() {
        var controller = this;
        // Namespace Check
        if (!controller.getComponent().checkNamespacesExist()) {
            return;
        }
        // get HeaderId of current selected Valuelist
        var selectedValuelist = this.getView().getBindingContext().getObject();
        var headerId = selectedValuelist.Id;
        headerId = this.oCommons.base64ToHex(headerId);
        if (!this.oFillFromEventsController) {
            this.oFillFromEventsController = sap.ui.controller("sap.secmon.ui.m.valuelist.view.FillFromEventsDialog");
        }

        this.oFillFromEventsController.openDialog(headerId, controller.getView(), function() {
            var valuelistModel = controller.getComponentModel(controller);
            valuelistModel.refresh();
            controller.updateValuelistHeaderAdminInfo();
        });

    },

    /**
     * Eventhandler: Open Pop up for adding a new value
     */
    onAddValue : function() {
        var controller = this;
        // Namespace Check
        if (!controller.getComponent().checkNamespacesExist()) {
            return;
        }
        // get HeaderId of current selected Valuelist
        var selectedValuelist = this.getView().getBindingContext().getObject();
        // call dialog
        if (!this.oAddValueController) {
            this.oAddValueController = sap.ui.controller("sap.secmon.ui.m.valuelist.view.AddValueDialog");
        }
        this.oAddValueController.openDialog(selectedValuelist.Id, controller.getView(), function() {
            var valuelistModel = controller.getComponentModel(controller);
            valuelistModel.refresh();
            controller.updateValuelistHeaderAdminInfo();
        });
        var valueInput = this.getView().byId("valueInput");
        valueInput.focus();

    },

    triggerReset : function() {
        var aIds = [];
        this.ResetData.evaluation.forEach(function(oEvaluation) {
            aIds.push(oEvaluation.Id);
        });
        var controller = this;
        var url = this.XSJS_RESET_EVAL;
        $.ajax({
            type : "PUT",
            url : url,
            data : JSON.stringify(aIds),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", controller.csrfToken);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : controller.getView().getModel("i18nCommon").getProperty("Error_TIT")
                });
            },
            success : function() {
            },
        });
    },

    getResetDetails : function() {
        var sDetails = "";
        var controller = this;
        var oData = controller.ResetData;
        if (oData.pattern !== null && oData.pattern.length > 0) {
            sDetails = sDetails + this.getText("VL_Pattern") + "\n";
            oData.pattern.forEach(function(pattern) {
                sDetails = sDetails + pattern.Name + ": " + sap.secmon.ui.commons.Formatter.i18nText(controller.getText("VL_Alerts"), pattern.AlertCount) + "\n";
            });
        }
        if (oData.evaluation !== null && oData.evaluation.length > 0) {
            sDetails = sDetails + "\n" + this.getText("VL_Evaluation") + "\n";
            oData.evaluation.forEach(function(evaluation) {
                sDetails = sDetails + evaluation.Name + "\n";
            });
        }
        if (oData.chart !== null && oData.chart.length > 0) {
            sDetails = sDetails + "\n" + this.getText("VL_Chart") + "\n";
            oData.chart.forEach(function(chart) {
                sDetails = sDetails + chart.Name + "\n";
            });
        }
        return sDetails;
    },

    isResetNeeded : function() {
        var controller = this;
        var selectedValuelist = this.getView().getBindingContext().getObject();
        var url = this.XSJS_USED_IN_EVAL + "?Id=" + this.oCommons.base64ToHex(selectedValuelist.Id);
        $.ajax({
            type : "GET",
            url : url,
            async : false,
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", controller.csrfToken);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : controller.getView().getModel("i18nCommon").getProperty("Error_TIT")
                });
            },
            success : function(data) {
                var oData = JSON.parse(data);
                controller.ResetData = oData;
            },
        });
    },

    isResetAllowed : function() {
        var controller = this;
        if (this.ResetData.resetRelevant === true) {
            var sMessageText = sap.secmon.ui.commons.Formatter.i18nText(controller.getText("VL_UsedInADL"), controller.ResetData.totalAlertCount);
            sap.m.MessageBox.confirm(sMessageText, {
                actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO, sap.m.MessageBox.Action.CANCEL ],
                defaultAction : sap.m.MessageBox.Action.NO,
                details : controller.getResetDetails(),
                onClose : function(oAction) {
                    if (oAction === sap.m.MessageBox.Action.YES) {
                        controller.resetAllowed = true;
                        controller.triggerReset();
                    } else {
                        controller.resetAllowed = false;
                    }

                }

            });
        }
    },

    onDeleteSelectedValues : function() {
        var controller = this;
        var aItems = this.getView().byId("values").getItems();
        var aSelectedIds = [];
        var valueCountInSystemNS = 0, valueCountNotInSystemNS = 0;
        aItems.forEach(function(item) {
            var oCheckbox = item.getCells()[0];
            if (oCheckbox.getSelected() === true) {
                var sPath = item.getBindingContext().sPath;
                aSelectedIds.push(sPath.slice(10, 42));
                var namespace = item.getBindingContext().getProperty("NameSpace");
                var bIsSystemNamespace = sap.secmon.ui.m.valuelist.util.Formatter.isSystemNamespaceFormatter.call(controller.getView(), namespace);
                if (bIsSystemNamespace === true) {
                    valueCountInSystemNS++;
                } else {
                    valueCountNotInSystemNS++;
                }
            }
        });
        if (aSelectedIds.length === 0) {
            sap.m.MessageBox.alert(this.getView().getModel("i18n").getProperty("VL_Select_at_least_1V"), {
                title : this.getView().getModel("i18nCommon").getProperty("Error_TIT")
            });
            return;
        }
        var sButtonWithoutReset = controller.getText("DelWithoutDataReset");
        var sButtonWithReset = controller.getText("DelWithDataReset");
        var sButtonRemove = controller.getCommonText("Remove_BUT");
        this.isResetNeeded();

        var sConfirmationText;
        var sMessageText;
        var sInfoText = "";
        if (valueCountInSystemNS > 0) {
            sInfoText += sap.secmon.ui.commons.Formatter.i18nText(controller.getText("VL_Conf_Delete_Info"), valueCountInSystemNS) + "\n";
        }
        if (valueCountNotInSystemNS > 0) {
            sInfoText += sap.secmon.ui.commons.Formatter.i18nText(controller.getText("VL_Conf_Deactivate_Info"), valueCountNotInSystemNS) + "\n";
        }

        if (this.ResetData.resetRelevant === true && this.resetAllowed === null) {
            sConfirmationText = sap.secmon.ui.commons.Formatter.i18nText(controller.getText("VL_Conf_Del_SelValueReset"), this.ResetData.totalAlertCount);
            sMessageText = sInfoText + sConfirmationText;
            sap.m.MessageBox.confirm(sMessageText, {
                title : controller.getCommonText("Remove_TIT"),
                icon : sap.m.MessageBox.Icon.WARNING,
                actions : [ sButtonWithReset, sButtonWithoutReset, sap.m.MessageBox.Action.CANCEL ],
                defaultAction : sButtonWithoutReset,
                details : controller.getResetDetails(),
                onClose : function(oAction) {
                    if (oAction === sButtonWithReset) {
                        controller.triggerReset();
                        controller.resetAllowed = true;
                        controller.deleteSelectedValues.call(controller, aSelectedIds);
                    } else if (oAction === sButtonWithoutReset) {
                        controller.resetAllowed = false;
                        controller.deleteSelectedValues.call(controller, aSelectedIds);
                    }
                }
            });
        } else {
            sConfirmationText = controller.getText("VL_Conf_Delete_SelValue");
            sMessageText = sInfoText + "\n" + sConfirmationText;
            sap.m.MessageBox.confirm(sMessageText, {
                title : controller.getCommonText("Remove_TIT"),
                actions : [ sButtonRemove, sap.m.MessageBox.Action.CANCEL ],
                onClose : function(oAction) {
                    if (oAction === sButtonRemove) {
                        controller.deleteSelectedValues.call(controller, aSelectedIds);
                        if (controller.ResetData.resetRelevant === true && controller.resetAllowed === true) {
                            controller.triggerReset();
                        }
                    }
                }
            });
        }
    },

    deleteSelectedValues : function(aSelectedIds) {
        var controller = this;
        var oBindingContext = this.getView().getBindingContext();
        var headerId = this.oCommons.base64ToHex(oBindingContext.getObject().Id);
        var oValues = {
            allValues : false,
            valuelistId : headerId,
            Ids : aSelectedIds
        };

        var url = this.VALUES_XSJS_SERVICE;
        sap.ui.core.BusyIndicator.show();
        $.ajax({
            type : "DELETE",
            url : url,
            data : JSON.stringify(oValues),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", controller.csrfToken);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : controller.getView().getModel("i18nCommon").getProperty("Error_TIT")
                });
            },
            success : function() {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageToast.show(controller.getView().getModel("i18n").getProperty("VL_SelV_Deleted_Success"));
                controller.getView().getModel().refresh();
            },
        });
    },

    onDeleteAllValues : function() {
        var controller = this;
        var values = this.getView().byId("values").getItems();
        if (values.length === 0) {
            sap.m.MessageBox.alert(this.getView().getModel("i18n").getProperty("VL_noValues"), {
                title : this.getView().getModel("i18nCommon").getProperty("Error_TIT")
            });
            return;
        }
        var sButtonWithoutReset = controller.getText("DelWithoutDataReset");
        var sButtonWithReset = controller.getText("DelWithDataReset");
        var sButtonRemove = controller.getCommonText("Remove_BUT");
        this.isResetNeeded();
        var sMessageText;
        var sConfirmationText;
        var sInfoText = controller.getText("VL_Conf_DeleteAll_Info");

        if (this.ResetData.resetRelevant === true && this.resetAllowed === null) {
            sConfirmationText = sap.secmon.ui.commons.Formatter.i18nText(controller.getText("VL_Conf_Del_AllValueReset"), this.ResetData.totalAlertCount);
            sMessageText = sInfoText + "\n" + sConfirmationText;
            sap.m.MessageBox.confirm(sMessageText, {
                title : controller.getCommonText("Remove_TIT"),
                icon : sap.m.MessageBox.Icon.WARNING,
                actions : [ sButtonWithReset, sButtonWithoutReset, sap.m.MessageBox.Action.CANCEL ],
                defaultAction : sButtonWithoutReset,
                details : controller.getResetDetails(),
                onClose : function(oAction) {
                    if (oAction === sButtonWithReset) {
                        controller.triggerReset();
                        controller.resetAllowed = true;
                        controller.deleteAllValues();
                    } else if (oAction === sButtonWithoutReset) {
                        controller.resetAllowed = false;
                        controller.deleteAllValues();
                    }
                }
            });

        } else {
            sConfirmationText = controller.getText("VL_Conf_Delete_AllValue");
            sMessageText = sInfoText + "\n" + sConfirmationText;
            sap.m.MessageBox.confirm(sMessageText, {
                title : controller.getCommonText("Remove_TIT"),
                actions : [ sButtonRemove, sap.m.MessageBox.Action.CANCEL ],
                onClose : function(oAction) {
                    if (oAction === sButtonRemove) {
                        controller.deleteAllValues();
                        if (controller.ResetData.resetRelevant === true && controller.resetAllowed === true) {

                            controller.triggerReset();
                        }
                    }

                }
            });
        }

    },

    deleteAllValues : function() {
        var oBindingContext = this.getView().getBindingContext();
        var headerId = this.oCommons.base64ToHex(oBindingContext.getObject().Id);
        var oValues = {
            allValues : true,
            valuelistId : headerId
        };
        var controller = this;
        var url = this.VALUES_XSJS_SERVICE;
        sap.ui.core.BusyIndicator.show();
        $.ajax({
            type : "DELETE",
            url : url,
            data : JSON.stringify(oValues),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", controller.csrfToken);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : controller.getView().getModel("i18nCommon").getProperty("Error_TIT")
                });
            },
            success : function() {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageToast.show(controller.getView().getModel("i18n").getProperty("VL_AllV_Deleted_Success"));
                controller.getView().getModel().refresh();
            },
        });
    },

    onReactivateSelectedValues : function(oEvent) {
        var controller = this;
        var oTable = this.getView().byId("inactiveValues");
        var aSelectedIds = [];

        oTable.getSelectedContexts().forEach(function(itemContext) {
            var sPath = itemContext.sPath;
            aSelectedIds.push(sPath.slice(18, 50));
        });
        if (aSelectedIds.length === 0) {
            sap.m.MessageBox.alert(this.getView().getModel("i18n").getProperty("VL_Select_at_least_1V"), {
                title : this.getView().getModel("i18nCommon").getProperty("Error_TIT")
            });
            return;
        }
        this.isResetNeeded();
        var sConfirmationText;
        if (this.ResetData.resetRelevant === true && this.resetAllowed === null) {
            var sButtonWithoutReset = controller.getText("ReactWithoutDataReset");
            var sButtonWithReset = controller.getText("ReactWithDataReset");
            sConfirmationText = sap.secmon.ui.commons.Formatter.i18nText(controller.getText("VL_Conf_Deact_SelVReset"), this.ResetData.totalAlertCount);
            sap.m.MessageBox.confirm(sConfirmationText, {
                title : controller.getText("VL_ReactivateTIT"),
                icon : sap.m.MessageBox.Icon.WARNING,
                actions : [ sButtonWithReset, sButtonWithoutReset, sap.m.MessageBox.Action.CANCEL ],
                defaultAction : sButtonWithoutReset,
                details : controller.getResetDetails(),
                onClose : function(oAction) {
                    if (oAction === sButtonWithReset) {
                        controller.triggerReset();
                        controller.resetAllowed = true;
                        controller.reactivateSelectedValues.call(controller, aSelectedIds);
                    } else if (oAction === sButtonWithoutReset) {
                        controller.resetAllowed = false;
                        controller.reactivateSelectedValues.call(controller, aSelectedIds);
                    }
                }
            });

        } else {
            var sButtonReactivate = controller.getText("VL_ReactivateBUT");
            sConfirmationText = controller.getText("VL_Conf_Reactivate_SelMSG");
            sap.m.MessageBox.confirm(sConfirmationText, {
                title : controller.getText("VL_ReactivateTIT"),
                actions : [ sButtonReactivate, sap.m.MessageBox.Action.CANCEL ],
                onClose : function(oAction) {
                    if (oAction === sButtonReactivate) {
                        controller.reactivateSelectedValues.call(controller, aSelectedIds);
                        if (controller.ResetData.resetRelevant === true && controller.resetAllowed === true) {
                            controller.triggerReset();
                        }
                    }
                }
            });
        }
    },

    reactivateSelectedValues : function(aSelectedIds) {
        var controller = this;
        var oBindingContext = this.getView().getBindingContext();
        var headerId = this.oCommons.base64ToHex(oBindingContext.getObject().Id);
        var oValues = {
            allValues : false,
            valuelistId : headerId,
            Ids : aSelectedIds
        };

        // Sending a DELETE request to the InactiveValues service
        // re-activates the logically deleted values.
        var url = this.INACTIVE_VALUES_XSJS_SERVICE;
        sap.ui.core.BusyIndicator.show();
        $.ajax({
            type : "DELETE",
            url : url,
            data : JSON.stringify(oValues),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", controller.csrfToken);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : controller.getView().getModel("i18nCommon").getProperty("Error_TIT")
                });
            },
            success : function() {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageToast.show(controller.getView().getModel("i18n").getProperty("VL_SelV_React_Success"));
                controller.getView().getModel().refresh();
            },
        });
    },

    onReactivateAllValues : function() {
        var controller = this;
        var inactiveValues = this.getView().byId("inactiveValues").getItems();
        if (inactiveValues.length === 0) {
            sap.m.MessageBox.alert(this.getView().getModel("i18n").getProperty("VL_noInactValues"), {
                title : this.getView().getModel("i18nCommon").getProperty("Error_TIT")
            });
            return;
        }
        this.isResetNeeded();
        var sConfirmationText;
        if (this.ResetData.resetRelevant === true && this.resetAllowed === null) {
            var sButtonWithoutReset = controller.getText("ReactWithoutDataReset");
            var sButtonWithReset = controller.getText("ReactWithDataReset");
            sConfirmationText = sap.secmon.ui.commons.Formatter.i18nText(controller.getText("VL_Conf_Deact_AllVReset"), this.ResetData.totalAlertCount);
            sap.m.MessageBox.confirm(sConfirmationText, {
                title : controller.getText("VL_ReactivateTIT"),
                icon : sap.m.MessageBox.Icon.WARNING,
                actions : [ sButtonWithReset, sButtonWithoutReset, sap.m.MessageBox.Action.CANCEL ],
                defaultAction : sButtonWithoutReset,
                details : controller.getResetDetails(),
                onClose : function(oAction) {
                    if (oAction === sButtonWithReset) {
                        controller.triggerReset();
                        controller.resetAllowed = true;
                        controller.reactivateAllValues();
                    } else if (oAction === sButtonWithoutReset) {
                        controller.resetAllowed = false;
                        controller.reactivateAllValues();
                    }
                }
            });

        } else {
            var sButtonReactivate = controller.getText("VL_ReactivateBUT");
            sConfirmationText = controller.getText("VL_Conf_Reactivate_AllMSG");
            sap.m.MessageBox.confirm(sConfirmationText, {
                title : controller.getText("VL_ReactivateTIT"),
                actions : [ sButtonReactivate, sap.m.MessageBox.Action.CANCEL ],
                onClose : function(oAction) {
                    if (oAction === sButtonReactivate) {
                        controller.reactivateAllValues();
                        if (controller.ResetData.resetRelevant === true && controller.resetAllowed === true) {
                            controller.triggerReset();
                        }
                    }
                }
            });
        }
    },

    reactivateAllValues : function() {
        var oBindingContext = this.getView().getBindingContext();
        var headerId = this.oCommons.base64ToHex(oBindingContext.getObject().Id);
        var oValues = {
            allValues : true,
            valuelistId : headerId
        };
        var controller = this;
        // Sending a DELETE request to the InactiveValues service
        // re-activates the logically deleted values.
        var url = this.INACTIVE_VALUES_XSJS_SERVICE;
        sap.ui.core.BusyIndicator.show();
        $.ajax({
            type : "DELETE",
            url : url,
            data : JSON.stringify(oValues),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", controller.csrfToken);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : controller.getView().getModel("i18nCommon").getProperty("Error_TIT")
                });
            },
            success : function() {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageToast.show(controller.getView().getModel("i18n").getProperty("VL_AllV_React_Success"));
                controller.getView().getModel().refresh();
            },
        });
    },

    /**
     * Eventhandler: Cancels changes made in valuelist header
     */
    onCancel : function() {
        this.setDisplayMode();
        this.exchangeModelForValuelistHeader("display");
    },

    handleCancel : function(fnActionAfterCancel, fnActionOnNoCancellation) {
        if (!this.hasEditModelBeenChanged()) {
            this.setDisplayMode();
            if (fnActionAfterCancel) {
                fnActionAfterCancel();
            }
            return;
        }
        var that = this;
        sap.m.MessageBox.show(this.getCommonText("Confirm_Cancel_MSG"), {
            title : this.getCommonText("Confirmation_TIT"),
            icon : sap.m.MessageBox.Icon.QUESTION,
            actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
            // styleClass : "sapUiSizeCompact",
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.YES) {
                    that.setDisplayMode();
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

    /**
     * download values in CSV format (semicolon separated)
     * 
     * @param oEvent
     */
    onDownloadPressed : function(oEvent) {
        var that = this;

        var inactiveValuesCount = that.valueCountModel.getProperty("/InactiveValuesNumber");
        if (inactiveValuesCount === 0) {
            that.downloadValues();
        } else {
            sap.m.MessageBox.show(that.getText("VL_chooseInactValues", inactiveValuesCount), {
                title : that.getText("VL_Entry_Download"),
                icon : sap.m.MessageBox.Icon.QUESTION,
                actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO, sap.m.MessageBox.Action.CANCEL ],
                // styleClass : "sapUiSizeCompact",
                onClose : function(oAction) {
                    if (oAction === sap.m.MessageBox.Action.YES) {
                        that.downloadValues(true);
                    } else if (oAction === sap.m.MessageBox.Action.NO) {
                        that.downloadValues(false);
                    }
                }
            });
        }
    },

    /**
     * Eventhandler: Export of list of values as csv, i.e. download
     */
    downloadValues : function(bIncludeInactiveValues) {

        var oModel = this.getView().getModel();
        var valueCountModel = this.getView().getModel("valueCount");
        var valueCount = valueCountModel.getProperty("/Number");
        if (valueCount > this.DEFAULT_PAGING_SIZE) {
            oModel.setSizeLimit(valueCount);
        }

        var oExport = new sap.ui.core.util.Export({

            // Type that will be used to generate the content. Own ExportType's
            // can be created to support other formats
            exportType : new sap.ui.core.util.ExportTypeCSV({
                separatorChar : ";",
                charSet : "UTF-8",
            }),

            // Pass in the model
            models : oModel,

            // binding information for the rows aggregation
            rows : {
                path : "/Header(X'" + this.valuelistId + "')" + (bIncludeInactiveValues === true ? "/AllValues" : "/Values")
            },

            // column definitions with binding info for the
            // content
            // Column names must be empty, otherwise upload won't work.
            columns : [ {
                name : "Value",
                template : {
                    content : "{ValueVarChar}"
                }
            }, {
                name : "Operator",
                template : {
                    content : "{Operator}"
                }
            }, {
                name : "Description",
                template : {
                    content : "{Description}"
                }
            }, ]
        });

        // download exported file
        oExport.saveFile().then(function() {
            oModel.setSizeLimit(this.DEFAULT_PAGING_SIZE); // reset to defaults
            this.destroy();
        }.bind(this));
    },

    onValuesUpdateFinished : function(oEvent) {
        var count = oEvent.getSource().getBinding("items").getLength();
        this.valueCountModel.setProperty("/Number", count);

        // every time the values have been read, also check the related info:
        // Are there values in foreign namespaces, are there values in local namespaces?
        this.updateNamespacesCount();
    },

    onInactiveValuesUpdateFinished : function(oEvent) {
        var count = oEvent.getSource().getBinding("items").getLength();
        this.valueCountModel.setProperty("/InactiveValuesNumber", count);
    },

    updateNamespacesCount : function() {
        var controller = this;
        var oModel = this.getView().getModel();
        var uiModel = this.getView().getModel("uiModel");
        var selectedValuelist = this.getView().getBindingContext().getObject();
        var headerId = this.oCommons.base64ToHex(selectedValuelist.Id);
        var pathLocal = "/Header(X'" + headerId + "')/LocalNameSpaces";
        oModel.read(pathLocal, {
            success : function(data) {
                uiModel.setProperty("/countLocalNamespaces", data.results.length);
            },
            error : function(error) {
                var oI18nModel = controller.getView().getModel("i18n");
                sap.secmon.ui.m.valuelist.util.ODataErrorHandler.showAlert(error.response, oI18nModel);
            }
        });
        var pathForeign = "/Header(X'" + headerId + "')/ForeignNameSpaces";
        oModel.read(pathForeign, {
            success : function(data) {
                uiModel.setProperty("/countForeignNamespaces", data.results.length);
            },
            error : function(error) {
                var oI18nModel = controller.getView().getModel("i18n");
                sap.secmon.ui.m.valuelist.util.ODataErrorHandler.showAlert(error.response, oI18nModel);
            }
        });
    },

    /**
     * Updates valuelist header. No navigation takes place. Edit mode will be kept.
     */
    updateValuelistHeaderFromData : function(data) {
        var controller = this;

        var oModel = controller.getView().getModel();
        var headerId = this.oCommons.base64ToHex(data.Id);
        oModel.update("/Header(X'" + headerId + "')", data, null, function() {
            sap.m.MessageToast.show(controller.getText("VL_Update_Success"));
        }, function(e) {
            var oI18nModel = controller.getView().getModel("i18n");
            sap.secmon.ui.m.valuelist.util.ODataErrorHandler.showAlert(e.response, oI18nModel);
        });
    },

    /*
     * update Header from change in values - for header only change info is changed
     */
    updateValuelistHeaderAdminInfo : function() {
        var selectedValuelist = this.getView().getBindingContext().getObject();

        var data = {
            Id : selectedValuelist.Id,
            NameSpace : selectedValuelist.NameSpace,
            ListName : selectedValuelist.ListName,
            Description : selectedValuelist.Description,
            CreatedBy : selectedValuelist.CreatedBy,
            CreatedTimestamp : selectedValuelist.CreatedTimestamp,
            ChangedBy : this.getView().getModel("applicationContext").getProperty("/userName"),
            ChangedTimestamp : new Date()
        };

        this.updateValuelistHeaderFromData(data);
    },

    /**
     * update the value list from selected value entries. If the parameter bHeaderWasEdited is true then the user might have edited the header. It needs to be updated as well.
     * 
     * @param bHeaderWasEdited
     */
    updateValues : function(bHeaderWasEdited) {

        if (bHeaderWasEdited === true || Object.keys(this.changedValues).length > 0) {
            sap.ui.core.BusyIndicator.show();

            var controller = this;
            var aBatchChanges = [];
            var oModel = controller.getView().getModel();
            // look for changed values
            for ( var attr in this.changedValues) {
                var changedValue = this.changedValues[attr];
                if (changedValue.Description !== changedValue.OriginalDescription) {
                    delete changedValue.OriginalDescription;
                    var valuePath = "/Values(X'" + attr + "')";
                    aBatchChanges.push(oModel.createBatchOperation(valuePath, "PUT", changedValue));

                }
            }
            var oHeader;
            if (bHeaderWasEdited === true) {
                var oNewValuelistModel = this.getView().getModel("newValuelist");
                oHeader = oNewValuelistModel.getData();
            } else {
                var ctx = this.getView().getBindingContext();
                oHeader = {
                    Id : ctx.getProperty("Id"),
                    NameSpace : ctx.getProperty("NameSpace"),
                    ListName : ctx.getProperty("ListName"),
                    Description : ctx.getProperty("Description"),
                    CreatedBy : ctx.getProperty("CreatedBy"),
                    CreatedTimestamp : ctx.getProperty("CreatedTimestamp")
                };
            }
            oHeader.ChangedBy = this.getView().getModel("applicationContext").getProperty("/userName");
            oHeader.ChangedTimestamp = new Date();

            if (aBatchChanges.length > 0) {
                oModel.setUseBatch(true);
                oModel.addBatchChangeOperations(aBatchChanges);
                oModel.submitBatch(function(data) {
                    // on a batch request, returned data holds an array
                    var dirty;
                    data.__batchResponses.forEach(function(responseObject) {
                        if (responseObject.response && responseObject.response.statusCode >= 300) {
                            dirty = true;
                            var oI18nModel = controller.getView().getModel("i18n");
                            sap.secmon.ui.m.valuelist.util.ODataErrorHandler.showAlert(responseObject.response, oI18nModel);
                        }
                        if (responseObject.__changeResponses) {
                            responseObject.__changeResponses.forEach(function(changeResponse) {
                                if (changeResponse.statusCode >= 300) {
                                    dirty = true;
                                    var oI18nModel = controller.getView().getModel("i18n");
                                    sap.secmon.ui.m.valuelist.util.ODataErrorHandler.showAlert(responseObject.response, oI18nModel);
                                }
                            });
                        }
                    });
                    sap.ui.core.BusyIndicator.hide();
                    if (!dirty) {
                        sap.m.MessageToast.show(controller.getText("VL_Update_Success"));
                        controller.updateValuelistHeaderFromData(oHeader);
                    }
                    var valuelistModel = controller.getComponentModel(controller);
                    valuelistModel.refresh(true);
                }, function(error) {
                    // unused in batch request
                    sap.ui.core.BusyIndicator.hide();
                });
                oModel.setUseBatch(false);
            } else {
                // only change header data
                controller.updateValuelistHeaderFromData(oHeader);
                sap.ui.core.BusyIndicator.hide();
            }
        }
    },

    /**
     * Creates an empty json model, replaces binding
     * 
     * @param headerMode
     *            one of 2 possible values "edit", "display"
     */
    exchangeModelForValuelistHeader : function(headerMode) {
        var data;
        var controller = this;
        var oView = controller.getView();
        switch (headerMode) {
        // EDIT
        case "edit":
            var model = this.getView().getModel();

            // ensure that the data is loaded new from db and then displayed
            model.attachEventOnce("requestCompleted", function() {
                var selectedValuelist = oView.getBindingContext().getObject();
                // headerdata
                var valuelistModelForEdit = new sap.ui.model.json.JSONModel();
                data = {
                    Id : selectedValuelist.Id,
                    NameSpace : selectedValuelist.NameSpace,
                    ListName : selectedValuelist.ListName,
                    Description : selectedValuelist.Description,
                    CreatedBy : selectedValuelist.CreatedBy,
                    CreatedTimestamp : selectedValuelist.CreatedTimestamp,
                    ChangedBy : selectedValuelist.ChangedBy,
                    ChangedTimestamp : selectedValuelist.ChangedTimestamp,
                };
                valuelistModelForEdit.setData(data);
                oView.setModel(valuelistModelForEdit, "newValuelist");
                sap.ui.core.BusyIndicator.hide();
            }, this);
            sap.ui.core.BusyIndicator.show(0);
            model.refresh();
            break;
        }

    },

    hasEditModelBeenChanged : function() {

        // check if header has changed
        var oDataOfEditModel = this.getView().getModel("newValuelist").getData();

        var oReferenceObject = {
            NameSpace : "",
            ListName : "",
            Description : ""
        };

        function copyIfNotUndefined(oSrc, oTarget) {
            var aKeys = Object.keys(oTarget);

            for (var i = 0; i < aKeys.length; i++) {
                var sCurrentKey = aKeys[i];
                if (oSrc[sCurrentKey]) {
                    oTarget[sCurrentKey] = oSrc[sCurrentKey];
                }
            }
        }

        var oEditData = this.oCommons.clone(oReferenceObject);
        copyIfNotUndefined(oDataOfEditModel, oEditData);

        var oReferenceData = this.oCommons.clone(oReferenceObject);

        var editModel = this.getComponent().getModel("editModel");
        if (editModel.oData.editMode) {
            var selectedValueList = this.getView().getBindingContext().getObject();

            copyIfNotUndefined(selectedValueList, oReferenceData);
        }
        var bHeaderChanged = !this.oCommons.deepEqual(oReferenceData, oEditData);

        // check if values have changed (i.e. if value descriptions changed)
        var bValuesChanged = false;
        for ( var attr in this.changedValues) {
            var changedValue = this.changedValues[attr];
            if (changedValue.Description !== changedValue.OriginalDescription) {
                bValuesChanged = true;
            }
        }
        return bHeaderChanged || bValuesChanged;
    },

    /**
     * Determines page title
     */
    getPageTitle : function() {
        var pageTitle = "";

        pageTitle = this.getText("VL_Config_Detail_Title");
        var bindingContext = this.getView().getBindingContext();
        var valuelistName = "";
        if (bindingContext) {
            valuelistName = bindingContext.getObject().ListName;
        }
        pageTitle = sap.secmon.ui.commons.Formatter.i18nText(pageTitle, valuelistName);

        return pageTitle;
    },

    /**
     * Sets display mode and exchanges UI fragments.
     */
    setDisplayMode : function() {
        var editModel = this.getComponent().getModel("editModel");
        var oData = editModel.getData();
        if (!oData) {
            oData = {
                pageTitle : this.getPageTitle()
            };
        }
        oData.editMode = false;
        oData.displayMode = true;
        editModel.setData(oData);
        this.updateDetailsContainer("display");
        this.mode = "display";
        if (this.valuelistId) {
            this.navigationParameters.routeParams.query.mode = "display";
            this.getRouter().navTo(this.navigationParameters.routeName, this.navigationParameters.routeParams, true);
        }
    },

    /**
     * Sets edit mode and exchanges UI fragments.
     */
    setEditMode : function() {
        var editModel = this.getComponent().getModel("editModel");
        var oData = editModel.getData();
        if (!oData) {
            oData = {
                pageTitle : this.getPageTitle()
            };
        }
        oData.editMode = true;
        oData.displayMode = false;
        editModel.setData(oData);
        var namespace = this.getView().getBindingContext().getProperty("NameSpace");
        var bIsSystemNamespace = sap.secmon.ui.m.valuelist.util.Formatter.isSystemNamespaceFormatter.call(this.getView(), namespace);
        if (bIsSystemNamespace === true) {
            this.updateDetailsContainer("edit");
        } else {
            this.updateDetailsContainer("display");
        }
        this.mode = "edit";
        if (this.valuelistId) {
            this.navigationParameters.routeParams.query.mode = "edit";
            this.getRouter().navTo(this.navigationParameters.routeName, this.navigationParameters.routeParams, true);
        }
    },

    /**
     * Fills content container (page) with XML fragments depending on mode.
     * 
     * @param mode
     *            one of 2 possible values: "edit", "display"
     */
    updateDetailsContainer : function(mode) {
        this.oValuelistDetailsContainer = this.getView().byId("valuelistDetailsContainer");
        var sPrefix = this.getView().getId();

        switch (mode) {
        // DISPLAY
        case "display":
            // create fragments
            if (!this.displayDetailsFragment) {
                this.displayDetailsFragment = sap.ui.xmlfragment(sPrefix, "sap.secmon.ui.m.valuelist.view.DetailDisplay", this);
            }
            if (this.editDetailsFragment) {
                this.oValuelistDetailsContainer.removeContent(this.editDetailsFragment);
            }
            this.oValuelistDetailsContainer.insertContent(this.displayDetailsFragment, 0);
            break;
        // EDIT
        case "edit":
            // edit fragments
            if (!this.editDetailsFragment) {
                this.editDetailsFragment = sap.ui.xmlfragment(sPrefix, "sap.secmon.ui.m.valuelist.view.DetailEdit", this);
            }
            // put fragments into container
            if (this.displayDetailsFragment) {
                this.oValuelistDetailsContainer.removeContent(this.displayDetailsFragment);
            }
            this.oValuelistDetailsContainer.insertContent(this.editDetailsFragment, 0);
            break;
        }

    },

    /**
     * Deletes specified valuelist and sets initially selected valuelist.
     */
    deleteValuelist : function(valueListObject) {
        var controller = this;
        var oModel = this.getView().getModel();
        var valueListIdHex = this.oCommons.base64ToHex(valueListObject.Id);
        var valueListPath = "/Header(X'" + valueListIdHex + "')";
        var valuelistName = valueListObject.ListName;

        oModel.setHeaders({
            "content-type" : "application/json;charset=utf-8"
        });
        // oModel.remove triggers a refresh. This causes the dangling detail
        // view binding performing a GET request on the no longer existing value
        // list.
        this.sPath = this.getView().getBindingContext().getPath();
        this.getView().unbindObject();
        oModel.remove(valueListPath, null, function() {
            var sText = sap.secmon.ui.commons.Formatter.i18nText(controller.getText("VL_Del_Success"), valuelistName);
            sap.m.MessageToast.show(sText);

            // try export
            controller.ajaxUtil.postJson(controller.EXPORT_SERVICE, JSON.stringify({
                Id : valueListIdHex,
                ObjectType : "ValueList",
                ObjectName : valueListObject.ListName,
                ObjectNamespace : valueListObject.NameSpace,
                Operation : "Delete"
            }), {
                fail : function(status, responseText) {
                    if (status === 400) {
                        sap.m.MessageBox.alert(responseText, {
                            icon : sap.m.MessageBox.Icon.ERROR,
                            title : controller.getText("VL_ExportError")
                        });
                    }
                }
            });

            delete controller.sPath;
            sap.ui.core.UIComponent.getRouterFor(controller).navTo("main", {}, true);
        }, function(e) {
            var oBody = JSON.parse(e.response.body);
            if (oBody && oBody.error && oBody.error.message && oBody.error.message.value && typeof oBody.error.message.value === "string") {
                sap.m.MessageBox.alert(oBody.error.message.value, {
                    title : controller.getView().getModel("i18nCommon").getProperty("Error_TIT")
                });
            } else {
                sap.m.MessageBox.alert(e.response.body, {
                    title : controller.getView().getModel("i18nCommon").getProperty("Error_TIT")
                });
            }
            controller.getView().bindObject(controller.sPath);
            delete controller.sPath;
        });

    },

    /**
     * Eventhandler: Handles search option when selecting a namespace for file upload.
     */
    onNamespaceSelectSearch : function(oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new sap.ui.model.Filter("NameSpace", sap.ui.model.FilterOperator.Contains, sValue);
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([ oFilter ]);
    },

    /**
     * Opens pop up for selecting a namespace for uploading values into lit-of-values.
     */
    onUpload : function() {
        if (!this.oSelectNamespaceDialog) {
            var sPrefix = this.getView().getId();
            this.oSelectNamespaceDialog = sap.ui.xmlfragment(sPrefix, "sap.secmon.ui.m.valuelist.view.SelectNamespace", this);
            this.getView().addDependent(this.oSelectNamespaceDialog);
            this.oSelectNamespaceDialog.setModel(this.getView().getModel("nameSpaces"));
        }
        this.oSelectNamespaceDialog.open();
    },

    /**
     * Eventhandler: Close dialog for file upload
     */
    onUploadCancel : function() {
        this.oFileUploader.close();
    },

    /**
     * Eventhandler: Handles file upload. Builds URL where file has to be sent to.
     */
    onHandleUpload : function() {

        var url = this.UPLOAD_VALUES_SERVICE;
        var fileLoader = this.getView().byId("fileUploader");
        var fileName = fileLoader.getValue();
        var controller = this;
        if (fileName === "") {
            sap.m.MessageBox.show(this.getText("VL_NoFile"), sap.m.MessageBox.Icon.ERROR, this.getCommonText("Error_TIT"), sap.m.MessageBox.Action.CLOSE);
        } else {
            url = url + "?file_name=" + fileName + "&valuelist_id=" + this.valuelistId + "&namespace=" + this.sSelectedNamespace;

            fileLoader.setUploadUrl(url);

            this.isResetNeeded.call(this);
            if (this.ResetData.resetRelevant === true && this.resetAllowed === null) {
                var sMessageText = sap.secmon.ui.commons.Formatter.i18nText(this.getText("VL_UsedInADL"), this.ResetData.totalAlertCount);
                sap.m.MessageBox.confirm(sMessageText, {
                    actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO, sap.m.MessageBox.Action.CANCEL ],
                    defaultAction : sap.m.MessageBox.Action.NO,
                    details : this.getResetDetails(),
                    onClose : function(oAction) {
                        if (oAction === sap.m.MessageBox.Action.YES) {
                            controller.resetAllowed = true;
                            controller.triggerReset();
                        } else if (oAction === sap.m.MessageBox.Action.NO) {
                            controller.resetAllowed = false;
                        }
                        if (oAction !== sap.m.MessageBox.Action.CANCEL) {
                            sap.ui.core.BusyIndicator.show(500);
                            fileLoader = controller.getView().byId("fileUploader");
                            fileLoader.upload();
                        }
                    }
                });

            } else {
                fileLoader = controller.getView().byId("fileUploader");
                sap.ui.core.BusyIndicator.show(500);
                fileLoader.upload();
                if (controller.ResetData.resetRelevant === true && controller.resetAllowed === true) {
                    controller.triggerReset();
                }
            }

        }
    },

    /**
     * Eventhandler: Shows a message box with response and closes fileupload dialog.
     */
    onHandleUploadComplete : function(oEvent) {
        sap.ui.core.BusyIndicator.hide();
        this.oFileUploader.close();
        var status = oEvent.getParameter("status");
        if (status === 200) {
            var sResponse = JSON.parse(oEvent.getParameter("responseRaw"));
            var confirmationText;
            if (sResponse.skippedValues > 0) {
                confirmationText = sap.secmon.ui.commons.Formatter.i18nText(this.getText("VL_Entry_Uploaded_Skipped"), sResponse.createdValues, sResponse.skippedValues);
            } else {
                confirmationText = sap.secmon.ui.commons.Formatter.i18nText(this.getText("VL_Entry_Uploaded_Values"), sResponse.createdValues);
            }
            sap.m.MessageBox.show(confirmationText, {
                title : this.getText("VL_UploadResultTitle"),
                onClose : function(oAction) {
                }
            });
        } else {
            var message = oEvent.getParameter("responseRaw");
            sap.m.MessageBox.alert(message);
        }
        this.getView().getModel().refresh();
    },

    onFileTypeMismatch : function(oEvent) {
        var message = sap.secmon.ui.commons.Formatter.i18nText(this.getText("VL_Upload_Inv_FileType"), oEvent.getParameters().fileType, oEvent.getSource().getFileType());
        sap.m.MessageBox.alert(message, {
            title : this.getView().getModel("i18nCommon").getProperty("Error_TIT")
        });
    },

    /**
     * If a namespace was selected a pop up will be openend for selecting a file to be uploaded.
     */
    onNamespaceSelectClose : function(oCloseEvent) {
        var aSelectedContext = oCloseEvent.getParameter("selectedContexts");
        if (aSelectedContext === undefined || aSelectedContext === null) {
            return;
        } else {
            this.sSelectedNamespace = aSelectedContext[0].getObject().NameSpace;
            var editModel = this.getComponent().getModel("editModel");
            var oModelData = editModel.getData();
            oModelData.fileUpload = true;
            editModel.setData(oModelData);
            if (!this.oFileUploader) {
                var sPrefix = this.getView().getId();
                this.oFileUploader = sap.ui.xmlfragment(sPrefix, "sap.secmon.ui.m.valuelist.view.FileUploader", this);
                this.getView().addDependent(this.oFileUploader);
                this.csrfToken = this.getComponent().getCsrfToken();
                var oHeaderParameter = new sap.ui.unified.FileUploaderParameter({
                    name : "x-csrf-token",
                    value : this.csrfToken
                });
                var oFileUploadControl = this.getView().byId("fileUploader");
                oFileUploadControl.addHeaderParameter(oHeaderParameter);
            }
            this.oFileUploader.open();
        }
    },

    getUsingObjects : function() {
        if (!this.valuelistId) {
            return;
        }
        var request = {
            Id : this.valuelistId
        };
        var sToken = this.getComponent().getCsrfToken();
        var controller = this;
        $.ajax({
            type : "GET",
            url : this.USING_OBJECTS_SERVICE,
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
                model.setProperty("/usingObjects", data.responseJSON);
                controller.whereUsedListLoaded = true;
            }
        });

    },

    onUsingObjectPress : function(oEvent) {
        var id = oEvent.getSource().getBindingContext("uiModel").getProperty("Id");
        sap.secmon.ui.m.commons.NavigationService.openBrowseUI(id);
    },

    onTabSelected : function(event) {
        this.navigationParameters.routeParams.query.tab = event.getParameter("selectedKey");
        this.getRouter().navTo(this.navigationParameters.routeName, this.navigationParameters.routeParams, true);
    },

    /**
     * Gets valuelist model from component
     */
    getComponentModel : function(controller) {
        var oComponent = sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(controller.getView()));
        return oComponent.getModel();
    },

    /**
     * Destroys xml fragments.
     */
    onExit : function() {
        if (this.editDetailsFragment) {
            this.editDetailsFragment.destroy(true);
        }
        if (this.displayDetailsFragment) {
            this.displayDetailsFragment.destroy(true);
        }
    },

    /*-
     * Search for active and inactive values. Collect needed IDs and triggers filtering based search string typed-in by user.
     * 
     * @param {Object} oEvent - Search event passed by searchfield. It contains search string and needed custom data for table id and searchfield id.
     */
    onValueSearch : function(oEvent) {
        var tableId = oEvent.getSource().data("tableId");
        var searchString = oEvent.getParameter("query");

        this.executeValueSearch(searchString, tableId);
    },

    /*-
     * Execute filter operation for active or inactive values
     * 
     * @param {String} searchString - The value the user would like to filter against
     * @param {String} tableId - Describes the table on which filtering is applied
     */
    executeValueSearch : function(searchString, tableId) {
        var filters = [];

        // Create filter object allowing to search for "Value" and "Description" values
        if (searchString && searchString.length > 0) {
            searchString = "'" + searchString.toUpperCase() + "'";
            var combinedFilter =
                    new sap.ui.model.Filter({
                        filters : [ new sap.ui.model.Filter('toupper(ValueVarChar)', sap.ui.model.FilterOperator.Contains, searchString),
                                new sap.ui.model.Filter('toupper(Description)', sap.ui.model.FilterOperator.Contains, searchString) ],
                        and : false
                    });
            filters.push(combinedFilter);
        }

        // Update list binding based on filter
        this.getView().byId(tableId).getBinding("items").filter(filters);
        // Persist filter value in FilterBarHelper to ensure filter is available in case sort operation is being executed
        sap.secmon.ui.m.commons.FilterBarHelper.setFilters.call(this, filters);
    },

    showMoreAddActions : function(oEvent) {
        if (!this.moreAddActions) {
            this.moreAddActions = sap.ui.xmlfragment("sap.secmon.ui.m.valuelist.view.AddValueActions", this);
            this.getView().addDependent(this.moreAddActions);
        }
        var eDock = sap.ui.core.Popup.Dock;
        var oButton = this.getView().byId("addActions");
        this.moreAddActions.open(null, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);
    },

    /**
     * This is a workaround to make the more actions button in the segmented button always selected.
     * 
     * @param oEvent
     */
    segmentedButtonWorkaround : function(oEvent) {
        var oSegmentedButton = oEvent.getSource();
        var id = oSegmentedButton.getId();

        if (id === this.getView().createId("addActions")) {
            oSegmentedButton.setSelectedButton(this.getView().createId("moreAddActions"));
        }
    },

    /**
     * Callback when a description is changed. We use it for delta-handling. So we know which description has changed.
     * 
     * @param oEvent
     */
    onDescriptionChange : function(oEvent) {

        var inputField = oEvent.getSource();
        var description = inputField.getValue();

        // the input field is bound against the OData model with one-way binding
        var oOldValue = inputField.getBindingContext().getObject();
        var valueId = this.oCommons.base64ToHex(oOldValue.Id);
        var storedValue = this.changedValues[valueId];

        if (!storedValue) {
            this.changedValues[valueId] = this.oCommons.clone(oOldValue);
            this.changedValues[valueId].OriginalDescription = oOldValue.Description;
            storedValue = this.changedValues[valueId];
        }
        storedValue.Description = description;
    },

    onSetDynamicMode : function(oEvent) {
        var controller = this;
        this._confirmUpdateModeChange(function() {
            controller._setUpdateMode('AUTOMATED');
        });
    },

    onSetManualMode : function(oEvent) {
        var controller = this;
        this._confirmUpdateModeChange(function() {
            controller._setUpdateMode('MANUAL');
        });
    },

    /**
     * user (de)selected an item in inactive values table
     */
    onInactiveValuesSelected : function(oEvent) {
        var selectedItems = oEvent.getSource().getSelectedItems();
        if (selectedItems) {
            this.valueCountModel.setProperty("/selectedInactiveValuesNumber", selectedItems.length);
        } else {
            this.valueCountModel.setProperty("/selectedInactiveValuesNumber", 0);
        }
    },

    /**
     * user (de)selected an item in values table
     */
    onValuesSelected : function(oEvent) {
        var aItems = this.getView().byId("values").getItems();
        if (aItems) {
            var count = 0;
            aItems.forEach(function(item) {
                var oCheckbox = item.getCells()[0];
                if (oCheckbox.getSelected() === true) {
                    count++;
                }
            });
            this.valueCountModel.setProperty("/selectedValuesNumber", count);
        } else {
            this.valueCountModel.setProperty("/selectedValuesNumber", 0);
        }
    },

    _setUpdateMode : function(sUpdateMode) {
        var controller = this;
        var oView = this.getView();
        var oContext = oView.getBindingContext();
        var sPath = oContext.getPath();
        // shallow copy
        var oSource = oContext.getObject();
        var oData = {
            ChangedBy : oSource.ChangedBy,
            CreatedBy : oSource.CreatedBy,
            ChangedTimestamp : oSource.ChangedTimestamp,
            CreatedTimestamp : oSource.CreatedTimestamp,
            Id : oSource.Id,
            NameSpace : oSource.NameSpace,
            ListName : oSource.ListName,
            Description : oSource.Description
        };
        oData.UpdateMode = sUpdateMode;

        var oModel = oView.getModel();
        oModel.update(sPath, oData, {
            success : function(data) {
                var editModel = controller.getComponent().getModel("editModel");
                editModel.setProperty("/UpdateMode", sUpdateMode);
                sap.m.MessageToast.show(controller.getText("VL_Update_Success"));
            },
            error : function(httpRequest, textStatus, errorThrown) {
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(httpRequest, textStatus, errorThrown));
            },
        });
    },

    _confirmUpdateModeChange : function(callback) {
        var controller = this;
        this.isResetNeeded();
        var sConfirmationText;
        if (this.ResetData.resetRelevant === true && this.resetAllowed === null) {
            var sButtonWithoutReset = controller.getText("ChangeWithoutDataReset");
            var sButtonWithReset = controller.getText("ChangeWithDataReset");
            sConfirmationText = sap.secmon.ui.commons.Formatter.i18nText(controller.getText("VL_Conf_MaintMode"), this.ResetData.totalAlertCount);
            sap.m.MessageBox.confirm(sConfirmationText, {
                title : controller.getText("VL_MaintenanceTIT"),
                icon : sap.m.MessageBox.Icon.WARNING,
                actions : [ sButtonWithReset, sButtonWithoutReset, sap.m.MessageBox.Action.CANCEL ],
                defaultAction : sButtonWithoutReset,
                details : controller.getResetDetails(),
                onClose : function(oAction) {
                    if (oAction === sButtonWithReset) {
                        controller.triggerReset();
                        controller.resetAllowed = null;
                        callback();
                    } else if (oAction === sButtonWithoutReset) {
                        controller.resetAllowed = null;
                        callback();
                    }
                }
            });
        } else {
            callback();
            this.resetAllowed = null;
        }
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/9f5401b88aed4d4fa18cd5acc8442b4e.html");
    }

});
