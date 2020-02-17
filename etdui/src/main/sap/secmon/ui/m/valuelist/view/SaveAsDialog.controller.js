jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.valuelist.util.ODataErrorHandler");

sap.ui.controller("sap.secmon.ui.m.valuelist.view.SaveAsDialog", {

    oDialog : null,
    fnSuccessCallback : null,
    oParentView : null,
    SAVE_AS_SERVICE : "/sap/secmon/services/ui/m/valuelist/valuelist.xsjs/saveAs",
    csrfToken : null,
    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    onInit : function() {

    },

    /**
     * Opens pop up for filling valuelist with data from events.
     * 
     */
    openDialog : function(headerId, oParentView, fnSuccessCallback) {
        this.oParentView = oParentView;
        this.fnSuccessCallback = fnSuccessCallback;
        this.csrfToken = this.getComponent().getCsrfToken();

        if (!this.oDialog) {
            var sPrefix = this.oParentView.getId();
            this.oDialog = sap.ui.xmlfragment(sPrefix, "sap.secmon.ui.m.valuelist.view.SaveAsDialog", this);
            oParentView.addDependent(this.oDialog);
        }
        // get data of source valuelist
        var oSourceObject = this.oParentView.getBindingContext().getObject();

        // Set and bind Namespaces Model
        this.oDialog.setModel(oParentView.getModel("nameSpaces"), "nameSpaces");
        this.oDialog.setModel(oParentView.getModel("valueCount"), "valueCount");
        var oNameSpaceSelect = this.oParentView.byId("nameSpaceSelectForSaveAs");
        var oSelectTemplate = oNameSpaceSelect.removeItem(0);
        if (oSelectTemplate !== null) {
            oNameSpaceSelect.bindAggregation("items", 'nameSpaces>/NameSpaces', oSelectTemplate, new sap.ui.model.Sorter("NameSpace", false));
        }

        // json Model for new value
        var oModel;
        oModel = new sap.ui.model.json.JSONModel();
        oModel.setData({
            "SourceId" : this.oCommons.base64ToHex(oSourceObject.Id),
            "Name" : oSourceObject.ListName,
            "Description" : oSourceObject.Description,
            "Namespace" : oSourceObject.NameSpace,
            "includeInactiveValues" : false,
            "UpdateMode" : oSourceObject.UpdateMode
        });
        this.oDialog.setModel(oModel, "local");

        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", oParentView, this.oDialog);
        this.oDialog.open();

    },

    /**
     * Eventhandler: Saves source valuelist as new valuelist
     */
    onSaveNewVL : function(oEvent) {
        var controller = this;
        this.oDialog.close();
        var oI18nModel = controller.oParentView.getModel("i18n");
        var oLocalModel = this.oDialog.getModel("local");
        var request = oLocalModel.getData();

        // set namespace
        var oNameSpaceSelect = this.oParentView.byId("nameSpaceSelectForSaveAs");
        request.Namespace = oNameSpaceSelect.getSelectedItem().getProperty("text");

        $.ajax({
            type : "POST",
            url : this.SAVE_AS_SERVICE,
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
            controller.fnSuccessCallback(response.Id);
        }).fail(function(xhr, textStatus, errorThrown) {
            sap.ui.core.BusyIndicator.hide();
            sap.secmon.ui.m.valuelist.util.ODataErrorHandler.showAlert(xhr.responseText, oI18nModel);
        });
    },

    onDialogClose : function(oEvent) {
        this.oDialog.close();
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.oParentView));
    },

});
