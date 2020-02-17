jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.m.MessageBox");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.valuelist.view.FillFromEventsDialog", {

    FILL_FROM_LOG_SERVICE : "/sap/secmon/services/ui/m/valuelist/valuelist.xsjs/fillFromLog",
    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    oDialog : null,
    oEditModel : null,
    aAlerts : null,
    csrfToken : null,
    fnSuccessCallback : null,
    oValuelistId : null,
    onInit : function() {

    },

    /**
     * Opens pop up for filling valuelist with data from events.
     * 
     */
    openDialog : function(oValuelistId, oParentView, fnSuccessCallback) {
        this.oValuelistId = oValuelistId;
        this.oParentView = oParentView;
        this.fnSuccessCallback = fnSuccessCallback;
        this.csrfToken = this.getComponent().getCsrfToken();

        if (!this.oDialog) {
            var sPrefix = this.oParentView.getId();
            this.oDialog = sap.ui.xmlfragment(sPrefix, "sap.secmon.ui.m.valuelist.view.FillFromEventsDialog", this);
            oParentView.addDependent(this.oDialog);
        }

        // Set and bind Namespaces Model
        this.oDialog.setModel(oParentView.getModel("nameSpaces"), "nameSpaces");
        var oNameSpaceSelect = this.oParentView.byId("nameSpaceSelectFillFromEvents");
        var oSelectTemplate = oNameSpaceSelect.removeItem(0);
        if (oSelectTemplate !== null) {
            oNameSpaceSelect.bindAggregation("items", 'nameSpaces>/NameSpaces', oSelectTemplate, new sap.ui.model.Sorter("NameSpace", false));
        }

        // determine available fields for selection

        var oModel;
        oModel = new sap.ui.model.json.JSONModel();
        oModel.setData({
            EndTime : new Date(),
            ObjectType : null,
            // yesterday:
            StartTime : new Date((new Date()).valueOf() - 1000 * 60 * 60 * 24),
            ValueListId : oValuelistId,
            Namespace : this.oParentView.getBindingContext().getProperty("NameSpace")
        });
        this.oDialog.setModel(oModel, "local");

        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", oParentView, this.oDialog);
        this.oDialog.open();

    },

    /**
     * Loads data from Events. Refreshes component model in case of success.
     */
    onLoadFromEvents : function(oEvent) {

        var oLocalModel = this.oDialog.getModel("local"), controller = this;
        var request = oLocalModel.getData();
        // set namespace
        var oNameSpaceSelect = this.oParentView.byId("nameSpaceSelectFillFromEvents");
        request.Namespace = oNameSpaceSelect.getSelectedItem().getProperty("text");

        this.oDialog.getParent().getController().isResetNeeded.call(this.oDialog.getParent().getController());
        if (this.oDialog.getParent().getController().ResetData.resetRelevant === true && this.oDialog.getParent().getController().resetAllowed === null) {

            var sMessageText =
                    sap.secmon.ui.commons.Formatter.i18nText(this.oDialog.getParent().getController().getText("VL_UsedInADL"), this.oDialog.getParent().getController().ResetData.totalAlertCount);
            sap.m.MessageBox.confirm(sMessageText, {
                actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO, sap.m.MessageBox.Action.CANCEL ],
                defaultAction : sap.m.MessageBox.Action.NO,
                details : this.oDialog.getParent().getController().getResetDetails(),
                onClose : function(oAction) {
                    if (oAction === sap.m.MessageBox.Action.YES) {
                        controller.oDialog.getParent().getController().resetAllowed = true;
                        controller.oDialog.getParent().getController().triggerReset();
                    } else if (oAction === sap.m.MessageBox.Action.NO) {
                        controller.oDialog.getParent().getController().resetAllowed = false;
                    }

                    if (oAction !== sap.m.MessageBox.Action.CANCEL) {
                        $.ajax({
                            type : "POST",
                            url : controller.FILL_FROM_LOG_SERVICE,
                            data : JSON.stringify(request),
                            contentType : "application/json; charset=UTF-8",
                            beforeSend : function(xhr) {
                                xhr.setRequestHeader("X-CSRF-Token", controller.csrfToken);
                                sap.ui.core.BusyIndicator.show(0);
                            },
                        }).done(function(response) {
                            sap.ui.core.BusyIndicator.hide();
                            // data will be put into component model
                            // values table has to be refreshed
                            var confirmationText = sap.secmon.ui.commons.Formatter.i18nText(controller.getText("VL_Values_Added"), response);
                            sap.m.MessageBox.show(confirmationText, {
                                title : controller.getText("VL_EventResultTitle"),
                                onClose : function(oAction) {
                                }
                            });
                            controller.fnSuccessCallback();
                        }).fail(function(xhr, textStatus, errorThrown) {
                            sap.ui.core.BusyIndicator.hide();
                            alert(controller.oCommons.constructAjaxErrorMsg(xhr, textStatus, errorThrown));
                        });

                        controller.oDialog.close();
                    }

                }

            });

        } else {
            $.ajax({
                type : "POST",
                url : controller.FILL_FROM_LOG_SERVICE,
                data : JSON.stringify(request),
                contentType : "application/json; charset=UTF-8",
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", controller.csrfToken);
                    sap.ui.core.BusyIndicator.show(0);
                },
            }).done(function(response) {
                sap.ui.core.BusyIndicator.hide();
                // data will be put into component model
                // values table has to be refreshed
                var confirmationText = sap.secmon.ui.commons.Formatter.i18nText(controller.getText("VL_Values_Added"), response);
                sap.m.MessageBox.show(confirmationText, {
                    title : controller.getText("VL_EventResultTitle"),
                    onClose : function(oAction) {
                    }
                });
                controller.fnSuccessCallback();
            }).fail(function(xhr, textStatus, errorThrown) {
                sap.ui.core.BusyIndicator.hide();
                alert(controller.oCommons.constructAjaxErrorMsg(xhr, textStatus, errorThrown));
            });
            if (controller.oDialog.getParent().getController().ResetData.resetRelevant === true && controller.oDialog.getParent().getController().resetAllowed === true) {
                controller.oDialog.getParent().getController().triggerReset();
            }
            controller.oDialog.close();
        }

    },

    onLoadFromEventsDialogClose : function(oEvent) {
        this.oDialog.close();
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.oParentView));
    },

});
