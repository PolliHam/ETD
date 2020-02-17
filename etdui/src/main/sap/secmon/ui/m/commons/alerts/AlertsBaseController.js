/*--
 *  This controller provides some common functionality for views displaying an alerts table:
 *  - editing a single alert selected in the alerts table (via navigation to full screen alert component)
 *  - editing properties of multiple alerts (via edit dialog)
 *  
 *  The inheriting controller must implement the following functions:
 *  - getAlertsTable
 *  
 *  The inheriting controller must assign onUpdateAlerts as press handler for the update button
 *  The inheriting controller must assign onAnalyze as press handler for the analyze button
 *  The inheriting controller must assign onAddToInvestigation as press handler for the add to investigation button
 *  The inheriting controller must assign onStartInvestigation as press handler for the start investigation button
 *  
 *  The following functions may be implemented by the inheriting controller:
 *  - updateOfAlertsFinished is called after properties have been changed
 *  - addToInvestigationFinished is called after alerts have been added to an investigation
 *  - startInvestigationFinished is called after an investigation has been created
 *  - saveUIState is called before app to app navigation takes place
 */
var ADependencies =
        [ "sap/secmon/ui/commons/CommonFunctions", "sap/secmon/ui/m/commons/UIUtils", "sap/secmon/ui/m/commons/RequestUtils", "sap/m/MessageBox", "sap/secmon/ui/m/commons/NavigationService",
                "sap/secmon/ui/m/commons/EtdController", "sap/secmon/ui/m/commons/SelectionUtils", "sap/secmon/ui/m/commons/InvestigationAddendum",
                "sap/secmon/ui/m/commons/alerts/AttackRadioButtonHandler", "sap/secmon/ui/m/alertsfs/util/Formatter", "sap/secmon/ui/m/alerts/util/Formatter" ];
sap.ui.define(ADependencies, function(CommonFunctions, UIUtils, RequestUtils, MessageBox, NavigationService, EtdController, SelectionUtils, InvestigationAddendum, AttackRadioButtonHandler,
        FSFormatter, Formatter) {
    "use strict";

    return EtdController.extend("sap.secmon.ui.m.commons.alerts.AlertsBaseController", {
        ALERT_SERVICE_URL : "/sap/secmon/services/ui/m/alerts/Alert.xsjs",

        onInit : function() {
            this.oCommons = new CommonFunctions();
            this.oUIUtils = new UIUtils();
            this.oRequestUtils = new RequestUtils();
            this.baseI18nModel = new sap.ui.model.resource.ResourceModel({
                bundleUrl : "/sap/secmon/ui/m/commons/alerts/i18n/UIText.hdbtextbundle"
            });
            this.oInvestigationAddendum = new InvestigationAddendum();

        },

        /*-
         * bFlatId = true: returns array of alert ids
         * bFlatId = false: returns array of {AlertId : '....'}
         */
        getSelectedAlerts : function(bFlatId) {
            var aResult = SelectionUtils.getIdPropertiesOfSelectedContextsAndDecode(this.getAlertsTable(), "AlertId");
            if (bFlatId) {
                return aResult;
            }

            return aResult.map(function(sAlertId) {
                return {
                    AlertId : sAlertId
                };
            });
        },

        getSelectedAlertsWithHashes : function() {
            var controller = this;
            var aContext = SelectionUtils.getSelectedContexts(this.getAlertsTable());
            var oReturn = {
                AlertId : [],
                AlertHashCode : [],
                AlertReadTimestamp : []
            };
            aContext.forEach(function(oContext) {
                oReturn.AlertId.push(controller.oCommons.base64ToHex(oContext.getProperty("AlertId")));
                oReturn.AlertHashCode.push(controller.oCommons.base64ToHex(oContext.getProperty("AlertHashCode")));
                oReturn.AlertReadTimestamp.push(oContext.getProperty("AlertReadTimestamp"));
            });
            return oReturn;
        },

        getArrayOfSelectedAlertsWithHashes : function() {
            var controller = this;
            var aContext = SelectionUtils.getSelectedContexts(this.getAlertsTable());
            return aContext.map(function(oContext) {
                return {
                    AlertId : controller.oCommons.base64ToHex(oContext.getProperty("AlertId")),
                    AlertIdBase64 : oContext.getProperty("AlertId"),
                    Number : oContext.getProperty("Number"),
                    AlertHashCode : controller.oCommons.base64ToHex(oContext.getProperty("AlertHashCode")),
                    AlertReadTimestamp : oContext.getProperty("AlertReadTimestamp")
                };
            });
        },

        /**
         * bFlatId = true: returns array of pattern ids bFlatId = false: returns array of {PatternId : '....'}
         */
        getPatternIdsOfSelectedAlerts : function(bFlatId) {
            var aResult = SelectionUtils.getIdPropertiesOfSelectedContextsAndDecode(this.getAlertsTable(), "PatternId");
            if (bFlatId) {
                return aResult;
            }

            return aResult.map(function(sPatternId) {
                return {
                    PatternId : sPatternId
                };
            });
        },

        onUpdateAlerts : function() {
            this.selectedItems = this.getAlertsTable().getSelectedItems();
            var oSelectedAlertsWithHashes = this.getSelectedAlertsWithHashes();
            if (!oSelectedAlertsWithHashes) {
                return;
            }
            if (oSelectedAlertsWithHashes.AlertId.length === 1) {
                this.updateAlert(oSelectedAlertsWithHashes.AlertId[0]);
            } else {
                this.updateAlerts(oSelectedAlertsWithHashes);
            }
        },

        updateAlerts : function(oSelectedAlertsWithHashes) {
            if (!this.updateAlertsDialog) {
                this.createUpdateAlertsDialog();
            }
            // Initial default options displayed in popup.
            // They do NOT correspond to actual data of selected alerts.
            var oData = {
                oSelectedAlertsWithHashes : oSelectedAlertsWithHashes,
                enableStatus : this.selectionContainsNoAlertsWithInvestigationOrExempted(),
                updateSeverity : false,
                updateStatus : false,
                Severity : "MEDIUM",
                Status : "OPEN",
                Attack : undefined
            };
            this.oEditModel.setData(oData);
            this.updateAlertsDialog.setModel(this.oEditModel, "editModel");

            this.updateAlertsDialog.open();
        },

        createUpdateAlertsDialog : function() {
            this.updateAlertsDialog = sap.ui.xmlfragment("UpdateAlertsDialog", "sap.secmon.ui.m.commons.alerts.UpdateAlertsDialog", this);
            this.updateAlertsDialog.setModel(this.baseI18nModel, "i18n");
            this.getView().addDependent(this.updateAlertsDialog);
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.updateAlertsDialog);
            this.oEditModel = new sap.ui.model.json.JSONModel();

            this.radioButtonGroup = sap.ui.core.Fragment.byId("UpdateAlertsDialog", "AttackRadioButtons");
        },

        updateAlert : function(alertId) {
            if (this.saveUIState) {
                this.saveUIState();
            }
            sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                target : {
                    semanticObject : "AlertDetails",
                    action : "change"
                },
                params : {
                    alert : alertId
                }
            });
        },

        /*
         * helper-function to reduce flickering when one dialog of multiple is displayed again
         */
        closeAndDestroyDialog : function(oDialog) {
            for ( var prop in this) {
                if (this[prop] === oDialog) {
                    oDialog.close();
                    oDialog.destroy();
                    this[prop] = undefined;
                    break;
                }
            }
        },

        onUpdateAlertsDialogOk : function() {
            var oData = this.oEditModel.getData();
            if (!oData.updateSeverity && !oData.updateProcessor && !oData.updateStatus) {
                return;
            }
            var objectToSendAsJSON = oData.oSelectedAlertsWithHashes;
            if (oData.updateSeverity) {
                objectToSendAsJSON.Severity = oData.Severity;
            }
            if (oData.updateStatus) {
                objectToSendAsJSON.Status = oData.Status;
                if (oData.Attack) {
                    objectToSendAsJSON.Attack = oData.Attack;
                }
            }
            this.sendRequestAndUpdateModel(objectToSendAsJSON);

        },

        sendRequestAndUpdateModel : function(objectToSendAsJSON) {
            var that = this;
            var csrfToken = this.getComponent().getCsrfToken();
            sap.ui.core.BusyIndicator.show(0);
            this.oRequestUtils.postRequest(this.ALERT_SERVICE_URL, objectToSendAsJSON, csrfToken, function(oResponse) {
                sap.ui.core.BusyIndicator.hide();
                if (that.updateOfAlertsFinished) {
                    that.updateOfAlertsFinished(oResponse);
                    that.closeAndDestroyDialog(that.updateAlertsDialog);
                }
            }, function() {
                sap.ui.core.BusyIndicator.hide();
            });
        },

        onUpdateAlertsDialogCancel : function() {
            var oData = this.oEditModel.getData();
            if (!oData.updateSeverity && !oData.updateProcessor && !oData.updateStatus) {
                this.closeAndDestroyDialog(this.updateAlertsDialog);
            } else {
                var that = this;
                var sMessage = this.getComponent().getModel("i18nCommon").getProperty("Confirm_Cancel_MSG");
                var title = this.getComponent().getModel("i18nCommon").getProperty("Confirmation_TIT");
                MessageBox.show(sMessage, {
                    title : title,
                    icon : MessageBox.Icon.QUESTION,
                    actions : [ MessageBox.Action.YES, MessageBox.Action.NO ],
                    onClose : function(oAction) {
                        if (oAction === MessageBox.Action.YES) {
                            that.closeAndDestroyDialog(that.updateAlertsDialog);
                        }
                    }
                });
            }
        },

        onAnalyze : function() {
            var aContexts = this.getSelectedContexts();
            if (aContexts.length !== 1) {
                return;
            }
            var oContext = aContexts[0];
            var patternType = oContext.getProperty("PatternType");
            if (patternType === 'ANOMALY') {
                var sPatternIdBase64 = oContext.getProperty("PatternId");
                var sPatternId = this.oCommons.base64ToHex(sPatternIdBase64);
                var oMinTimestamp = oContext.getProperty("MinTimestamp");
                var oMaxTimestamp = oContext.getProperty("MaxTimestamp");
                NavigationService.openAnomalyAnalysis(sPatternId, oMinTimestamp, oMaxTimestamp);
            } else {
                var sAlertIdBase64 = oContext.getProperty("AlertId");
                var sAlertId = this.oCommons.base64ToHex(sAlertIdBase64);
                NavigationService.openAlertInMonitoring(sAlertId);
            }
        },

        /**
         * Eventhandler: Checks if alerts are selected. Then opens a dialog for selecting an investigation. Selected Alerts will be added to selected investigation.
         */
        onAddToInvestigation : function() {
            var aSelectedAlertsWithHashes = this.getArrayOfSelectedAlertsWithHashes();
            if (!aSelectedAlertsWithHashes) {
                return;
            }

            var that = this;
            this.oInvestigationAddendum.showInvestigationAddendumDialog(aSelectedAlertsWithHashes, this.getView(), function() {
                if (that.addToInvestigationFinished) {
                    that.addToInvestigationFinished();
                }
            });
        },

        getSelectedContexts : function() {
            var oAlertsTable = this.getAlertsTable();
            var aContexts = oAlertsTable.getSelectedContexts();

            return aContexts;
        },

        selectionContainsNoAlertsWithInvestigationOrExempted : function() {
            var aContexts = this.getSelectedContexts();
            var i;
            for (i = 0; i < aContexts.length; i++) {
                var alertStatus = aContexts[i].getProperty("AlertStatus");
                if (alertStatus === "INVESTIG_TRIGGERED" || alertStatus === "EXCLUDED_EXCEPTION") {
                    return false;
                }
            }
            return true;
        },

        onStartInvestigation : function() {
            var aSelectedAlertsWithHashes = this.getArrayOfSelectedAlertsWithHashes();
            if (!aSelectedAlertsWithHashes) {
                return;
            }

            var that = this;
            this.oInvestigationCreator.showInvestigationCreationDialog(aSelectedAlertsWithHashes, this.getView(), function(oCreatedInvestigation) {
                if (that.startInvestigationFinished) {
                    that.startInvestigationFinished();
                }
            });
        },

        onStartInvestigationFromTemplate : function(oEvent) {
            var aSelectedAlertsWithHashes = this.getArrayOfSelectedAlertsWithHashes();
            if (!aSelectedAlertsWithHashes) {
                return;
            }
            var aPatternIds = this.getPatternIdsOfSelectedAlerts(true);
            if (!aPatternIds) {
                return;
            }
            var oButton = oEvent.getSource();
            var that = this;
            this.oInvestigationCreator.showInvestigationCreationFromTemplateMenu(aSelectedAlertsWithHashes, aPatternIds, this.getView(), oButton, function(oCreatedInvestigation) {
                if (that.startInvestigationFinished) {
                    that.startInvestigationFinished();
                }
            });
        },

        /** status has been changed */
        onChangeStatus : function(event) {
            var status = event.getParameters().selectedItem.getKey();
            var defAttack = AttackRadioButtonHandler.getOnlyAllowedAttackValue(status);
            if (defAttack) {
                this.oEditModel.setProperty("/Attack", defAttack);
            }
        }

    });

});
