sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.settings.view.ContentSync", {

    constructor : function() {
        sap.ui.core.mvc.Controller.apply(this, arguments);
    },

    onInit : function() {
    },

    onBackButtonPressed : function() {
        window.history.go(-1);
    },

    onCheck : function() {
        this.doSync(false);
    },

    onSync : function() {
        this.doSync(true);
    },

    doSync : function(bWithImport) {
        var model = this.getContentSyncModel();
        var modelData = model.getData();

        this.getView().byId("ContentSyncPage").setBusy(true);

        var uri = "/sap/secmon/services/content/sync.xsjs?notes=true&ts=" + Date.now();
        var syncFailedPrefix = "Refresh failed";
        var syncSuccessfulSuffix = "have been found.";

        if (bWithImport) {
            uri += "&sync=true";
            syncFailedPrefix = "Synchronization failed";
            syncSuccessfulSuffix = "have been imported.";
        }

        $.ajax({
            type : "GET",
            url : uri
        }).fail(function(jqXHR, textStatus) {
            modelData.logs = [ {
                date : new Date(),
                log : syncFailedPrefix + " (" + jqXHR.status + ")"
            } ].concat(modelData.logs);
        }.bind(this)).done(function(data) {
            modelData.logs = [ {
                date : new Date(),
                log : data.data.length + " new Security Notes " + syncSuccessfulSuffix
            } ].concat(modelData.logs);
        }.bind(this)).always(function() {
            model.updateBindings();
            this.getView().byId("ContentSyncPage").setBusy(false);
        }.bind(this));
    },

    getContentSyncModel : function() {
        return this.getComponent().getModel("ContentSyncModel");
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/a3a81dfef7524dc19cc3ea6186c39e39.html");
    },

});
