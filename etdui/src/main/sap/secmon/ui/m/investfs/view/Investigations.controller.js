jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.commons.UIUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.BookmarkCreator");
jQuery.sap.require("sap.secmon.ui.m.commons.RequestUtils");
jQuery.sap.require("sap.secmon.ui.m.invest.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.investfs.view.Investigations", {

    INVESTIGATIONS_SERVICE_URL : "/sap/secmon/services/ui/m/invest/Investigation.xsjs",

    DEFAULT_ORDER_BY : "number",
    DEFAULT_ORDER_DESC : true,

    onInit : function() {
        this.applyCozyCompact();
        this.oUIUtils = new sap.secmon.ui.m.commons.UIUtils();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.oBookmarkCreator = new sap.secmon.ui.m.commons.BookmarkCreator();
        this.oRequestUtils = new sap.secmon.ui.m.commons.RequestUtils();

        var fnNavigation = function() {
            this.navToWithAggregatedParameters("main");
        };
        sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "investigationTable", sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE, fnNavigation, [ "statusFilterInput",
                "severityFilterInput", "managementVisibilityFilterInput", "attackFilterInput", "createdByFilterInput", "processorFilterInput" ], [ this.getComponent().getModel() ]);

        sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(this.onRouteMatched, this);
    },

    onAfterRendering : function() {
        this.attachTableCountListener();
    },

    navToWithAggregatedParameters : function(sRouteName) {
        var oNewQueryParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oNewQueryParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oNewQueryParameters);

        // The router has a "feature" not to dispatch to event handlers if
        // neither route nor query parameters have changed.
        // In order to force navigation, we add a parameter with new value each
        // time.
        oNewQueryParameters.lastNav = this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

        sap.ui.core.UIComponent.getRouterFor(this).navTo("main", {
            query : oNewQueryParameters
        }, true);
    },

    /**
     * Attaches a listener to the table binding to update the count in the table title after every data receiving.
     */
    attachTableCountListener : function() {
        var controller = this;
        if (!this.fnInvestTitle) {
            var oView = this.getView();
            var oBinding = this.getTable().getBinding("items");

            this.fnInvestTitle = function() {
                var format = controller.getText("InvestFS_InvestTblTitle");
                var sNewTitle = sap.secmon.ui.commons.Formatter.i18nText(format, oBinding.getLength());
                oView.byId("toolbarOfInvestigationTable").setText(sNewTitle);
            };
            oBinding.attachDataReceived(this.fnInvestTitle);
        }
    },

    /** Returns the table control */
    getTable : function() {
        return this.getView().byId("investigationTable");
    },

    /**
     * Returns the contexts of all selected rows of a given sap.m.Table control.
     */
    getSelectedRowContexts : function(table) {
        return table.getSelectedContexts();
    },

    onRouteMatched : function(oEvent) {
        if (oEvent.getParameter("name") !== "main") {
            return;
        }
        var oArguments = oEvent.getParameter("arguments");

        var params = oArguments["?query"];
        var oQueryObject = {};
        if (params) {
            // URL contains parameters
            oQueryObject = params;
        }

        var queryExtractor = new sap.secmon.ui.m.commons.QueryExtractor(sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE, this.DEFAULT_ORDER_BY, this.DEFAULT_ORDER_DESC);
        var oSorter = queryExtractor.extractSorter(oQueryObject);
        var aFilters = queryExtractor.extractFilters(oQueryObject);

        sap.secmon.ui.m.commons.FilterBarHelper.applySorting.call(this, oSorter.sPath, oSorter.bDescending);
        sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersToFilterBar.call(this, aFilters);

        sap.secmon.ui.m.commons.FilterBarHelper.setFilters.call(this, aFilters);

        // apply the filter and sorter
        sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersAndSorter.call(this, {
            filters : aFilters,
            sorter : oSorter
        });
    },

    getTableBinding : function() {
        return this.getTable().getBinding("items");
    },

    getRouter : function() {
        return sap.ui.core.UIComponent.getRouterFor(this);
    },

    handleEmailButtonPressed : function() {
        // Since the URL reflects the overall filtering and sorting it can be
        // used for forwarding.
        var sURL = window.location;
        var sBody = this.getText("InvestEmail_Body") + "\n" + sURL + "\n";
        var sSubject = this.getText("InvestEmail_Subject");
        sap.m.URLHelper.triggerEmail('', sSubject, sBody);
    },

    /**
     * Trigger bookmarking of current filter selection. The bookmark points to the investigations FS URL with current selection parameters.
     * 
     * @param oEvent
     */

    handleBookmarkDialogButtonPressed : function(oEvent) {
        var oParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oParameters);

        oParameters.doNotEncode = true;
        var sTitle = this.getText("MBookmark_InvestXLBL");
        this.oBookmarkCreator.showBookmarkCreationDialog(this.getView(), sTitle, oParameters, "Investigation");
    },

    onNavBack : function() {
        window.history.go(-1);
    },

    onEditPress : function() {

        var selectedRowContexts = this.getSelectedRowContexts(this.getTable());

        if (selectedRowContexts.length === 0) {
            var message = this.getText("InvestFS_SelectToEdit");
            this.oUIUtils.showAlert(this.getView(), message);
            return;
        }

        if (selectedRowContexts.length === 1) {
            this.handleSingleInvestigationEdit(selectedRowContexts[0]);
        } else {
            this.handleMultiInvestigationEdit(selectedRowContexts);
        }
    },

    handleSingleInvestigationEdit : function(investigationContext) {

        var investigationId = investigationContext.getProperty("Id");
        var investigationIdHex = this.oCommons.base64ToHex(investigationId);

        sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
            target : {
                semanticObject : "InvestigationDetails",
                action : "change"
            },
            params : {
                investigation : investigationIdHex
            }
        });
    },

    handleMultiInvestigationEdit : function(investigationContexts) {

        if (!this.updateInvestigationsDialog) {
            this.updateInvestigationsDialog = sap.ui.xmlfragment("UpdateInvestigationsDialog", "sap.secmon.ui.m.investfs.view.UpdateInvestigationsDialog", this);
            this.getView().addDependent(this.updateInvestigationsDialog);
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.updateInvestigationsDialog);
            this.oEditModel = new sap.ui.model.json.JSONModel();
        }

        var oInvestigationIdsNHashes = this.getInvestigationIdsNHashesfromContexts(investigationContexts);
        // Initial default options displayed in popup.
        // They do NOT correspond to actual data of selected alerts.
        var oData = {
            oInvestigationIdsNHashes : oInvestigationIdsNHashes,
            updateSeverity : false,
            updateProcessor : false,
            updateManagementVisibility : false,
            Severity : "MEDIUM",
            Processor : "",
            ManagementVisibility : "NOT_NEEDED"
        };
        this.oEditModel.setData(oData);
        this.updateInvestigationsDialog.setModel(this.oEditModel, "editModel");

        this.updateInvestigationsDialog.open();
    },

    getInvestigationIdsNHashesfromContexts : function(contexts) {

        var controller = this;
        var oProperties = {
            Id : [],
            HashCode : [],
            ReadTimestamp : []
        };

        $.each(contexts, function(i, context) {
            oProperties.Id.push(controller.oCommons.base64ToHex(context.getProperty("Id")));
            oProperties.HashCode.push(controller.oCommons.base64ToHex(context.getProperty("HashCode")));
            oProperties.ReadTimestamp.push(context.getProperty("ReadTimestamp"));
        });

        return oProperties;
    },

    onUpdateInvestigationsDialogCancel : function() {

        var oData = this.oEditModel.getData();
        if (!oData.updateSeverity && !oData.updateProcessor && !oData.updateStatus && !oData.updateManagementVisibility) {
            this.closeAndDestroyDialog(this.updateInvestigationsDialog);
            sap.m.MessageToast.show(this.getText("InvestFS_NoChangesDone"));
        } else {
            var controller = this;
            var title = this.getComponent().getModel("i18nCommon").getProperty("Confirmation_TIT");
            sap.m.MessageBox.show(this.getComponent().getModel("i18nCommon").getProperty("Confirm_Cancel_MSG"), {
                title : title,
                icon : sap.m.MessageBox.Icon.QUESTION,
                actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
                onClose : function(oAction) {
                    if (oAction === sap.m.MessageBox.Action.YES) {
                        controller.closeAndDestroyDialog(controller.updateInvestigationsDialog);
                        sap.m.MessageToast.show(controller.getText("InvestFS_NoChangesDone"));
                    }
                }
            });
        }
    },

    /** Closes, destroys and removes a given dialog from this controller. */
    closeAndDestroyDialog : function(oDialog) {

        for ( var prop in this) {
            if (this[prop] === oDialog) {
                oDialog.close();
                oDialog.destroy();
                delete this[prop];
                break;
            }
        }

    },

    onUpdateInvestigationsDialogOk : function() {
        var oData = this.oEditModel.getData();
        if (!oData.updateSeverity && !oData.updateProcessor && !oData.updateStatus && !oData.updateManagementVisibility) {
            sap.m.MessageToast.show(this.getText("InvestFS_NoChangesDone"));
            return;
        }
        var postObject = oData.oInvestigationIdsNHashes;
        if (oData.updateSeverity) {
            postObject.Severity = oData.Severity;
        }
        if (oData.updateStatus) {
            postObject.Status = oData.Status;
            if (oData.Attack) {
                postObject.Attack = oData.Attack;
            }
        }
        if (oData.updateProcessor) {
            postObject.Processor = oData.Processor;
        }
        if (oData.updateManagementVisibility) {
            postObject.ManagementVisibility = oData.ManagementVisibility;
        }
        this.sendRequestAndUpdateModel(postObject);
    },

    sendRequestAndUpdateModel : function(postObject) {
        var oModel = this.getView().getModel();
        var oTable = this.getTable();
        var controller = this;
        var csrfToken = this.getComponent().getCsrfToken();
        this.oRequestUtils.postRequest(this.INVESTIGATIONS_SERVICE_URL, postObject, csrfToken, function() {
            oTable.attachEventOnce("updateFinished", function() {
                controller.closeAndDestroyDialog(controller.updateInvestigationsDialog);
                var successMsg = sap.secmon.ui.commons.Formatter.i18nText(controller.getText("InvestFS_UpdateSuccess"), postObject.Id.length);
                sap.m.MessageToast.show(successMsg);
            });
            oModel.refresh();
        });
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    /**
     * Edit Mode is only allowed if no "COMPLETED" or "CANCELED" investigation is selected
     */
    onSelect : function() {
        var editButtonEnabled = true;
        var selectedRowContexts = this.getSelectedRowContexts(this.getTable());

        $.each(selectedRowContexts, function(i, context) {
            var status = context.getProperty("Status");
            if (status === "COMPLETED" || status === "CANCELLED") {
                editButtonEnabled = false;
                return;
            }
        });

        var editButton = this.getView().byId("Edit_Button");
        editButton.setEnabled(editButtonEnabled);
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/c5cabccca06a43d083ccf841dd9ca9d0.html");
    },

    onNavigateById: function () {
        var oInvestigationInput = this.getView().byId("inputInvestigationId");
        var sInvestigationNumber = oInvestigationInput.getValue();
        if (/\d+$/.test(sInvestigationNumber)) {
            var oModel = this.getView().getModel();
            var sServiceUrl = "/Investigation";
            oModel.read(sServiceUrl, {
                filters: [new sap.ui.model.Filter({ path: 'Number', operator: 'EQ', value1: sInvestigationNumber })],
                success: function (oData, response) {
                    if (!!oData.results.length) {
                        sap.secmon.ui.m.commons.NavigationService.navigateToInvestigation(oData.results[0].Id);
                    } else {
                        oInvestigationInput.setValueState(sap.ui.core.ValueState.Error);
                    }
                },
                error: function () {
                    oInvestigationInput.setValueState(sap.ui.core.ValueState.Error);
                }.bind(this)
            });
        } else {
            oInvestigationInput.setValueState(sap.ui.core.ValueState.Error);
        }
    },

    onAssignMyselfAsProcessor : function(oEvent) {
        var logonUser = this.getView().getModel("applicationContext").getProperty("/userName");
        this.oEditModel.setProperty("/Processor", logonUser);
    }
});
