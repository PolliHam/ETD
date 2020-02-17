/* global Promise */
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.invest.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.UIUtils");
jQuery.sap.require("sap.secmon.ui.m.valuelist.util.ODataErrorHandler");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.ui.controller("sap.secmon.ui.m.commons.InvestigationAddendumDialog", {

    INVESTIGATIONDATA_URL : "/sap/secmon/services/ui/m/invest/investigation.xsodata",
    INVESTIGATION_ASSIGNMENTS_SERVICE_URL : "/sap/secmon/services/ui/m/invest/InvestigationAssignment.xsjs",
    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    oDialog : null,
    oEditModel : null,
    aObjects : null,
    fnSuccessCallback : null,
    fnTokenProvider : null,
    /**
     * @memberOf sap.secmon.ui.m.commons.InvestigationAddendumDialog
     */
    onInit : function() {
    },

    openDialog : function(aAlerts, oParentView, fnSuccessCallback, fnTokenProvider) {
        var aObjects = aAlerts.map(function(oAlert) {
            return {
                ObjectType : 'ALERT',
                ObjectId : oAlert.AlertId,
                ObjectHashCode : oAlert.AlertHashCode,
                ObjectReadTimestamp : oAlert.AlertReadTimestamp
            };
        });
        this.openDialogEx(aObjects, oParentView, fnSuccessCallback, fnTokenProvider);
    },
    onHelpPress : function(oEvent) {
        window.open("/sap/secmon/help/a6fc4855f221489e8a5e5aca45c0b4e5.html");
    },

    onSearchInvest : function(oEvt) {
        var sValue = oEvt.getParameter("query");
        var aFilters = [ new sap.ui.model.Filter("tolower(Description)", sap.ui.model.FilterOperator.Contains, "'" + sValue.toLowerCase() + "'") ];
        if (Number.isInteger(+sValue)) {
            aFilters.push(new sap.ui.model.Filter("Number", sap.ui.model.FilterOperator.EQ, +sValue));
        }

        this.oParentView.byId("investigationsTable").getBinding("items").filter(new sap.ui.model.Filter(aFilters), false);
    },

    /*
     * Add objects to an investigation.
     * 
     * investigationId : id of the investigation. oObjects: object containing the Objects to add to the investigation. Allowed Object Types are: "ALERT", "EVENT", "FSPACE" and "SNAPSHOT" Example: [ {
     * ObjectType : 'ALERT', ObjectId : 'ABCDABCD' }, { ObjectType : 'EVENT', ObjectId : 'DDDDABCD' } ]
     */
    openDialogEx : function(aObjects, oParentView, fnSuccessCallback, fnTokenProvider) {
        this.fnSuccessCallback = fnSuccessCallback;
        this.fnTokenProvider = fnTokenProvider;
        this.oUIUtils = new sap.secmon.ui.m.commons.UIUtils();
        this.oParentView = oParentView;
        this.aObjects = aObjects;
        if (!this.oDialog) {
            this.oDialog = sap.ui.xmlfragment(oParentView.getId(), "sap.secmon.ui.m.commons.InvestigationAddendumDialog", this);
            oParentView.addDependent(this.oDialog);
            // set own i18n model
            var i18nModel = new sap.ui.model.resource.ResourceModel({
                bundleUrl : "/sap/secmon/ui/m/commons/i18n/UIText.hdbtextbundle"
            });
            this.oDialog.setModel(i18nModel, "i18n");

            // set i18nCommon model
            if (this.oDialog.getModel("i18nCommon") === undefined) {
                var i18nModelCommon = new sap.ui.model.resource.ResourceModel({
                    bundleUrl : "/sap/secmon/ui/CommonUIText.hdbtextbundle"
                });
                this.oDialog.setModel(i18nModelCommon, "i18nCommon");
            }

            // set enums Model
            if (this.oDialog.getModel("enums") === undefined) {
                var oEnumService = new sap.secmon.ui.commons.EnumService();
                var oEnums = oEnumService.loadEnums("sap.secmon.services.ui.m");
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oEnums);
                this.oDialog.setModel(oModel, "enums");
            }

            var investigationsModel = new sap.ui.model.odata.ODataModel(this.INVESTIGATIONDATA_URL, {
                json : true,
                defaultCountMode : sap.ui.model.odata.CountMode.Inline
            });
            investigationsModel.attachRequestFailed(this.oCommons.handleRequestFailed);
            this.oDialog.setModel(investigationsModel, "Investigations");

            var oInvestigationsTable = this.oParentView.byId("investigationsTable");
            var oTemplate = oInvestigationsTable.removeItem(0);
            if (oTemplate !== undefined && oTemplate !== null) {
                var aFilters = [ new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.NE, "CANCELLED"), new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.NE, "COMPLETED") ];
                var oFilter = new sap.ui.model.Filter({
                    filters : aFilters,
                    and : true
                });
                oInvestigationsTable.bindAggregation("items", 'Investigations>/Investigation', oTemplate, new sap.ui.model.Sorter("Number", true), oFilter);
            }
            // on a phone, the list scrolls to top investigation. We override
            // the behaviour
            oInvestigationsTable.attachSelectionChange(function(oEvent) {
                var oSource = oEvent.getParameter("listItem");
                if (oEvent.getParameter("selected") === true) {
                    // that keeps the selection color. Otherwise, a focused but
                    // not selected item is grey
                    oInvestigationsTable.setSelectedItem(oSource, true);
                    oSource.focus();
                }
            });
            this.oParentView.getController().enableButtonsIfExactlyOneRowIsSelected(oInvestigationsTable, [ "addAndShowButton", "addAndReturnButton" ]);

            // toggle compact style
            jQuery.sap.syncStyleClass("sapUiSizeCompact", oParentView, this.oDialog);
        }

        this.oDialog.open();
    },

    /**
     * Eventhandler: Ok event of pop up
     */
    onCancel : function(oEvent) {
        this.oDialog.close();
    },

    /**
     * Eventhandler: Cancel event of pop up
     */
    onOk : function(oEvent) {
        var investigationData = this.getSelectedInvestigation();
        if (investigationData.Id === null || investigationData.Id === undefined) {
            return;
        }
        this.addAlertsToInvestigation(investigationData).then(function() {
        });
    },

    onOkAndOpen : function(oEvent) {
        var investigationData = this.getSelectedInvestigation();
        if (investigationData.Id === null || investigationData.Id === undefined) {
            return;
        }
        this.addAlertsToInvestigation(investigationData).then(function() {
            sap.secmon.ui.m.commons.NavigationService.navigateToInvestigation(investigationData.Id);
        });
    },

    /**
     * Determines selected investigation data. If no investigation is selected, a error message will be shown.
     * 
     * @return a JS value object of the format: { Id: <ID in hex format>, Attack: <investigation attack> }
     */
    getSelectedInvestigation : function() {
        var oInvestigationsTable = this.oParentView.byId("investigationsTable");
        var aContexts = oInvestigationsTable.getSelectedContexts();
        if (aContexts.length === 0) {
            var message = this.oDialog.getModel("i18n").getProperty("MInvest_Select");
            this.oUIUtils.showAlert(this.oDialog, message);
            return null;
        }
        var oCommons = this.oCommons;
        var investigationId = oCommons.base64ToHex(aContexts[0].getProperty("Id"));
        var investigationNumber = aContexts[0].getProperty("Number");
        var investigationAttack = aContexts[0].getProperty("Attack");
        return {
            Id : investigationId,
            Number : investigationNumber,
            Attack : investigationAttack
        };
    },

    /**
     * update all alerts with one call
     * 
     * @param oInvestigationData
     *            a JS value object in format { Id: <ID in hex format>, Attack: <attack value of investigation }
     * @return a Promise object. No parameters are passed on resolve / reject.
     */
    addAlertsToInvestigation : function(oInvestigationData) {
        return new Promise(function(fnResolve, fnReject) {

            var sToken;
            if (this.fnTokenProvider !== null && this.fnTokenProvider !== undefined) {
                sToken = this.fnTokenProvider();
            } else {
                sToken = this.getComponentOfParent().getCsrfToken();
            }
            var controller = this;
            sap.ui.core.BusyIndicator.show(0);
            $.ajax({
                url : this.INVESTIGATION_ASSIGNMENTS_SERVICE_URL,
                type : "POST",
                // dataType : "text",
                contentType : "application/json; charset=UTF-8",
                data : JSON.stringify({
                    InvestigationId : oInvestigationData.Id,
                    Assignments : this.aObjects,
                }),
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", sToken);
                },
                success : function(response) {
                    sap.ui.core.BusyIndicator.hide();
                    controller.warnOptimisticLock(response, oInvestigationData.Number);
                    controller.fnSuccessCallback();
                    // trigger alerts list model refresh
                    controller.oDialog.close();
                    fnResolve();
                },
                error : function(request, status, error) {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.alert(request.responseText, {
                        title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                    });
                    fnReject();
                }
            });
        }.bind(this));
    },

    warnOptimisticLock : function(oReturnValue, investigationNumber) {
        if (oReturnValue.sqlErrorCode && oReturnValue.sqlErrorCode > 0) {
            // 131: ERR_TX_ROLLBACK_LOCK_TIMEOUT -- transaction rolled back by lock wait timeout
            // 133: ERR_TX_ROLLBACK_DEADLOCK -- transaction rolled back by detected deadlock
            // 146: ERR_TX_LOCK_ACQUISITION_FAIL -- Alert table rows locked (only if option NOWAIT is specified)

            sap.m.MessageBox.alert(this.getText("MInvest_alertLocked"), {
                title : this.getText("MInvest_chgDetect")
            });
        } else if (oReturnValue && oReturnValue.rejectedObjects && oReturnValue.rejectedObjects.length > 0) {
            var rejectedObjectCount = oReturnValue.rejectedObjects.length;
            var totalCount = this.aObjects ? this.aObjects.length : 0;

            if (totalCount > 0) {
                if (totalCount === 1 && rejectedObjectCount === 1) {
                    sap.m.MessageBox.alert(this.getText("MInvest_alertChgDetect"), {
                        title : this.getText("MInvest_chgDetect")
                    });
                } else {
                    if (totalCount === rejectedObjectCount) {
                        sap.m.MessageBox.alert(this.getText("MInvest_allAlrtsChgDetect", totalCount), {
                            title : this.getText("MInvest_chgDetect")
                        });
                    } else {
                        var rejectedLinks = oReturnValue.rejectedObjects.map(function(oObject) {
                            return {
                                Text : oObject.ObjectName,
                                Url : sap.secmon.ui.m.commons.NavigationService.alertURL(oObject.ObjectId, "Comments")
                            };
                        });
                        var acceptedCount = totalCount - rejectedObjectCount;

                        var oView = this.oDialog;
                        if (!oView.getModel("messages")) {
                            var oModel = new sap.ui.model.json.JSONModel();
                            oView.setModel(oModel, "messages");
                        }
                        var messagesData = {
                            acceptedCount : acceptedCount,
                            totalCount : totalCount,
                            rejectedCount : rejectedObjectCount,
                            investigationNumber : investigationNumber,
                            rejectedLinks : rejectedLinks
                        };
                        oView.getModel("messages").setData(messagesData);

                        if (!this._alertsChangedMessageLayout) {
                            this._alertsChangedMessageLayout = sap.ui.xmlfragment("sap.secmon.ui.m.commons.AlertsChangedMessage", this);
                            oView.addDependent(this._alertsChangedMessageLayout);
                        }

                        sap.m.MessageBox.show(this._alertsChangedMessageLayout, {
                            title : this.getText("MInvest_chgDetect")
                        });

                    }
                }

            }

        } else {
            sap.m.MessageToast.show(this.getText("MInvest_ObjectsAdded"));
        }
    },

    getComponentOfParent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.oParentView));
    },

    /**
     * Returns the text value with the given text key from the i18n model.
     */
    getText : function(sTextKey) {
        var parameters = Array.prototype.slice.call(arguments, 0), resource = this.oDialog.getModel("i18n").getResourceBundle();
        return resource.getText.apply(resource, parameters);
    },
    /**
     * Returns the text value with the given text key from the i18n common model.
     */
    getCommonText : function(sTextKey) {
        return this.oDialog.getModel("i18nCommon").getProperty(sTextKey);
    }

});
