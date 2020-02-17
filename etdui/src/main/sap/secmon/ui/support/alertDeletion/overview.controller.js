jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.support.alertDeletion.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.support.alertDeletion.overview", {

    commonFunctions : new sap.secmon.ui.commons.CommonFunctions(),
    /*
     * This event is called if the route matches.
     */
    handleRoute : function(oEvent) {

    },

    deleteOldAlerts : function() {

        var controller = this;
        var url = "/sap/secmon/services/ui/support/supportRestricted/DeleteAlertData.xsjs";
        var csrfToken = this.getComponent().getCsrfToken();
        var date = this.getView().byId("datePicker").getDateValue();
        if (this.UTC() === true) {
            date = this.commonFunctions.adjustTimeInputToUTC(date);
        }

        if (date instanceof Date && !isNaN(date.getTime())) {

            $.ajax({
                type : "DELETE",
                url : url,
                data : JSON.stringify(date),
                contentType : "application/json; charset=UTF-8",
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", csrfToken);
                },
                error : function(XMLHttpRequest, textStatus, errorThrown) {
                    controller.hideBusyIndicator();
                    sap.m.MessageBox.alert(XMLHttpRequest.responseText);
                },
                success : function(response) {
                    controller.hideBusyIndicator();
                    sap.m.MessageBox.show(controller.getView().getModel("i18n").getResourceBundle().getText("AlertDel_alertsdel_XLBL", [ response.numberDeleted ]), sap.m.MessageBox.Icon.SUCCESS,
                            controller.getText("AlertDel_Success_XLBL"));
                },
            });
        } else {
            controller.hideBusyIndicator();
            sap.m.MessageBox.alert(controller.getText("AlertDel_invDate_XLBL"));

        }
    },

    onDelete : function() {
        var that = this;
        var onClose = function(oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {
                that.showBusyIndicator();
                that.deleteOldAlerts();
            }
        };
        /*
         * works only for SAPUI5 version 1.22 or higher. For lower version the callback is not called.
         */
        // Delete alerts older than {0}
        var dateString = this.getView().byId("datePicker").getValue();
        var date = this.getView().byId("datePicker").getDateValue();
        if (this.UTC() === true) {
            date = this.commonFunctions.adjustTimeInputToUTC(date);
        }
        if (date instanceof Date && !isNaN(date.getTime())) {
            var title =
                    this.UTC() === true ? this.getView().getModel("i18n").getResourceBundle().getText("AlertDel_olderThanUTC_XLBL", [ dateString ]) : this.getView().getModel("i18n")
                            .getResourceBundle().getText("AlertDel_olderThan_XLBL", [ dateString ]);
            sap.m.MessageBox.confirm(title, {
                title : this.getText("AlertDel_Confirm_XLBL"),
                onClose : onClose
            });
        } else {
            sap.m.MessageBox.alert(this.getText("AlertDel_invDate_XLBL"));
        }
    },

    showBusyIndicator : function() {
        this.getView().byId("mainControl").setBusy(true);
    },

    hideBusyIndicator : function() {
        this.getView().byId("mainControl").setBusy(false);
    },

});